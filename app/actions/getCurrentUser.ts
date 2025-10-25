import { createClient } from "@/lib/supabase/server";

// Simple in-memory cache to prevent duplicate calls
let userCache: { user: any; timestamp: number } | null = null;
const CACHE_DURATION = 1000; // 1 second cache

export default async function getCurrentUser() {
  try {
    const startTime = Date.now();
    
    // Check cache first
    if (userCache && Date.now() - userCache.timestamp < CACHE_DURATION) {
      console.log(`[getCurrentUser] Cache hit, took ${Date.now() - startTime}ms`);
      return userCache.user;
    }
    
    const supabase = await createClient();
    
    // For anonymous users, just check auth without making additional queries
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      const result = null;
      userCache = { user: result, timestamp: Date.now() };
      console.log(`[getCurrentUser] No user found, took ${Date.now() - startTime}ms`);
      return result;
    }

      // Query users table using auth_user_id (enterprise-grade schema)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, created_at, updated_at")
        .eq("auth_user_id", user.id)
        .single();

      if (userError || !userData) {
        console.log(`[getCurrentUser] User query failed: ${userError?.message}, took ${Date.now() - startTime}ms`);
        return null;
      }

      // Query profile separately using public.users.id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, bio, phone, location, website, avatar_image_id, cover_image_id, preferences")
        .eq("user_id", userData.id)
        .single();

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

      // Get user roles (RBAC system)
      const { data: rolesData } = await supabase
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
        .eq("user_id", userData.id);

      const roles = rolesData?.map(ur => ur.roles).filter(Boolean) || [];
      
      // Get user permissions
      const { data: permissionsData } = await supabase
        .rpc('get_user_permissions', { p_user_id: userData.id });
      
      const permissions = permissionsData?.map(p => p.permission_name) || [];

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
    console.log(`[getCurrentUser] Profile loaded, took ${Date.now() - startTime}ms`);
    return result;
  } catch {
    return null;
  }
}