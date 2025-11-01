import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

// Simple in-memory cache to prevent duplicate calls
let userCache: { user: any; timestamp: number } | null = null;
const CACHE_DURATION = 1000; // 1 second cache

// Detect if we should use optimized direct pg pool approach
const USE_DIRECT_PG = !!process.env.SUPABASE_DB_URL || !!process.env.DATABASE_URL;

export default async function getCurrentUser() {
  try {
    const startTime = Date.now();
    
    // Check cache first
    if (userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[getCurrentUser] Cache hit, took ${Date.now() - startTime}ms`);
      }
      return userCache.user;
    }
    
    // Use optimized approach for production (direct pg pool)
    if (USE_DIRECT_PG) {
      return await getCurrentUserOptimized(startTime);
    }
    
    // Use Supabase client for local development
    return await getCurrentUserSupabase(startTime);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getCurrentUser] Error:', error);
    }
    return null;
  }
}

/**
 * Optimized approach using direct PostgreSQL queries and JWT decoding
 * Used in production for better performance
 */
async function getCurrentUserOptimized(startTime: number) {
  const authUser = await getSessionUser();
  
  if (!authUser) {
    const result = null;
    userCache = { user: result, timestamp: Date.now() };
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getCurrentUser] No user found (optimized), took ${Date.now() - startTime}ms`);
    }
    return result;
  }

  // Query users table using auth_user_id
  const { rows: userRows } = await query(
    `SELECT id, first_name, last_name, email, created_at, updated_at
     FROM public.users
     WHERE auth_user_id = $1
     LIMIT 1`,
    [authUser.id]
  );

  const userData = userRows[0];
  if (!userData) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getCurrentUser] User query failed (optimized), took ${Date.now() - startTime}ms`);
    }
    return null;
  }

  // Parallelize profile, roles, and permissions queries
  const [profileResult, rolesResult, permissionsResult, avatarResult] = await Promise.all([
    query(
      `SELECT id, bio, phone, location, website, avatar_image_id, cover_image_id, preferences
       FROM public.profiles
       WHERE user_id = $1
       LIMIT 1`,
      [userData.id]
    ),
    query(
      `SELECT ur.role_id, r.id, r.name, r.display_name, r.description
       FROM public.user_roles ur
       JOIN public.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userData.id]
    ),
    query(
      `SELECT permission_name FROM public.get_user_permissions($1)`,
      [userData.id]
    ),
    // Get avatar image if needed (we'll check avatar_image_id after profile query)
    Promise.resolve({ rows: [] })
  ]);

  const profileData = profileResult.rows[0];
  
  // Get avatar if profile has one
  let avatarUrl = null;
  if (profileData?.avatar_image_id) {
    const { rows: imageData } = await query(
      `SELECT url FROM public.images WHERE id = $1 LIMIT 1`,
      [profileData.avatar_image_id]
    );
    avatarUrl = imageData[0]?.url || null;
  }

  const roles = rolesResult.rows.map(row => ({
    id: row.id,
    name: row.name,
    display_name: row.display_name,
    description: row.description
  }));

  const permissions = permissionsResult.rows.map(p => p.permission_name);

  const result = {
    id: userData.id,
    firstName: userData.first_name,
    lastName: userData.last_name,
    email: userData.email,
    roles,
    permissions,
    createdAt: userData.created_at,
    updatedAt: userData.updated_at,
    emailVerified: null,
    favoriteIds: [],
    avatar_url: avatarUrl,
    profile: profileData ? {
      id: profileData.id,
      user_id: userData.id,
      bio: profileData.bio,
      phone: profileData.phone,
      location: profileData.location,
      website: profileData.website,
      avatar_image_id: profileData.avatar_image_id,
      cover_image_id: profileData.cover_image_id,
      preferences: profileData.preferences || {},
    } : null,
  } as any;

  userCache = { user: result, timestamp: Date.now() };
  if (process.env.NODE_ENV === 'development') {
    console.log(`[getCurrentUser] Profile loaded (optimized), took ${Date.now() - startTime}ms`);
  }
  return result;
}

/**
 * Supabase client approach for local development
 * Simpler and doesn't require direct database connection
 */
async function getCurrentUserSupabase(startTime: number) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const result = null;
    userCache = { user: result, timestamp: Date.now() };
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getCurrentUser] No user found (supabase), took ${Date.now() - startTime}ms`);
    }
    return result;
  }

  // Query users table using auth_user_id
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, created_at, updated_at")
    .eq("auth_user_id", user.id)
    .single();

  if (userError || !userData) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getCurrentUser] User query failed: ${userError?.message}, took ${Date.now() - startTime}ms`);
    }
    return null;
  }

  // Parallelize profile, roles, and permissions queries
  const [profileResult, rolesResult, permissionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, bio, phone, location, website, avatar_image_id, cover_image_id, preferences")
      .eq("user_id", userData.id)
      .single(),
    supabase
      .from("user_roles")
      .select(`
        role_id,
        roles (
          id,
          name,
          display_name,
          description
        )
      `)
      .eq("user_id", userData.id),
    supabase.rpc('get_user_permissions', { p_user_id: userData.id })
  ]);

  const profileData = profileResult.data;

  // Get avatar image if profile has one
  let avatarUrl = null;
  if (profileData?.avatar_image_id) {
    const { data: imageData } = await supabase
      .from("images")
      .select("url")
      .eq("id", profileData.avatar_image_id)
      .single();
    avatarUrl = imageData?.url || null;
  }

  const roles = rolesResult.data?.map(ur => ur.roles).filter(Boolean) || [];
  const permissions = permissionsResult.data?.map(p => p.permission_name) || [];

  const result = {
    id: userData.id,
    firstName: userData.first_name,
    lastName: userData.last_name,
    email: userData.email,
    roles,
    permissions,
    createdAt: userData.created_at,
    updatedAt: userData.updated_at,
    emailVerified: null,
    favoriteIds: [],
    avatar_url: avatarUrl,
    profile: profileData ? {
      id: profileData.id,
      user_id: userData.id,
      bio: profileData.bio,
      phone: profileData.phone,
      location: profileData.location,
      website: profileData.website,
      avatar_image_id: profileData.avatar_image_id,
      cover_image_id: profileData.cover_image_id,
      preferences: profileData.preferences || {},
    } : null,
  } as any;

  userCache = { user: result, timestamp: Date.now() };
  if (process.env.NODE_ENV === 'development') {
    console.log(`[getCurrentUser] Profile loaded (supabase), took ${Date.now() - startTime}ms`);
  }
  return result;
}