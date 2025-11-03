import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db/pool";

export interface IListingsParams {
  userId?: string;
  guestCount?: number;
  roomCount?: number;
  bedCount?: number;
  bathroomCount?: number;
  startDate?: string;
  endDate?: string;
  locationValue?: string;
  category?: string;
}

// Detect if we should use optimized direct pg pool approach
// Only use in production to avoid max clients issues in development
const USE_DIRECT_PG = process.env.NODE_ENV === 'production' && (!!process.env.SUPABASE_DB_URL || !!process.env.DATABASE_URL);

export default async function getListings (
  params: IListingsParams
) {
  try {
    // Use optimized approach for production (direct pg pool)
    if (USE_DIRECT_PG) {
      return await getListingsOptimized(params);
    }
    
    // Use Supabase client for local development
    return await getListingsSupabase(params);
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getListings] Error:', error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
}

/**
 * Optimized approach using direct PostgreSQL queries
 * Used in production for better performance
 */
async function getListingsOptimized(params: IListingsParams) {
  const startTime = Date.now();
  const {
    userId,
    guestCount,
    roomCount,
    bedCount,
    bathroomCount,
    startDate,
    endDate,
    locationValue,
    category
  } = params;

  const selectColumns = `
    id, title, description, image_src, created_at, category,
    room_count, bathroom_count, guest_count, user_id, price,
    address_line1, address_line2, city, state_province, postal_code,
    country, country_code, formatted_address, latitude, longitude
  `;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (userId) {
    conditions.push(`user_id = $${paramIndex++}`);
    values.push(userId);
  }
  if (category) {
    conditions.push(`category = $${paramIndex++}`);
    values.push(category);
  }
  if (roomCount) {
    conditions.push(`room_count >= $${paramIndex++}`);
    values.push(Number(roomCount));
  }
  if (guestCount) {
    conditions.push(`guest_count >= $${paramIndex++}`);
    values.push(Number(guestCount));
  }
  if (bathroomCount) {
    conditions.push(`bathroom_count >= $${paramIndex++}`);
    values.push(Number(bathroomCount));
  }
  if (bedCount) {
    conditions.push(`bed_count >= $${paramIndex++}`);
    values.push(Number(bedCount));
  }
  if (locationValue) {
    const likeParam = `%${locationValue}%`;
    conditions.push(`(city ILIKE $${paramIndex} OR state_province ILIKE $${paramIndex + 1} OR country ILIKE $${paramIndex + 2})`);
    values.push(likeParam, likeParam, likeParam);
    paramIndex += 3;
  }

  let sql = `SELECT ${selectColumns} FROM public.listings`;

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += ` ORDER BY created_at DESC LIMIT 20`;

  const { rows: data } = await query(sql, values);

  const safeListings = (data || []).map((row: any) => {
    // Parse imageSrc if it's a JSON string array (take first image)
    let imageSrc = row.image_src || '';
    if (typeof imageSrc === 'string' && imageSrc.startsWith('[')) {
      try {
        const parsed = JSON.parse(imageSrc);
        imageSrc = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imageSrc;
      } catch (e) {
        // Silently fail - invalid JSON will use original value
      }
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      imageSrc,
      createdAt: row.created_at,
      category: row.category,
      roomCount: row.room_count,
      bathroomCount: row.bathroom_count,
      guestCount: row.guest_count,
      userId: row.user_id,
      price: row.price,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      stateProvince: row.state_province,
      postalCode: row.postal_code,
      country: row.country,
      countryCode: row.country_code,
      formattedAddress: row.formatted_address,
      latitude: row.latitude,
      longitude: row.longitude,
    };
  });

  if (process.env.NODE_ENV === 'development') {
    const endTime = Date.now();
    console.log(`[getListings] Query took ${endTime - startTime}ms, returned ${safeListings.length} listings (optimized)`);
  }

  return safeListings;
}

/**
 * Supabase client approach for local development
 * Simpler and doesn't require direct database connection
 */
async function getListingsSupabase(params: IListingsParams) {
  const startTime = Date.now();
  const {
    userId,
    guestCount,
    roomCount,
    bedCount,
    bathroomCount,
    startDate,
    endDate,
    locationValue,
    category
  } = params;

  const sb = await createClient();
  
  // Build query with filters - optimized with specific columns and limit
  let query = sb
    .from("listings")
    .select(`
      id, title, description, image_src, created_at, category, 
      room_count, bathroom_count, guest_count, user_id, price,
      address_line1, address_line2, city, state_province, postal_code, 
      country, country_code, formatted_address, latitude, longitude
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  // Apply filters
  if (userId) query = query.eq("user_id", userId);
  if (category) query = query.eq("category", category);
  if (roomCount) query = query.gte("room_count", +roomCount);
  if (guestCount) query = query.gte("guest_count", +guestCount);
  if (bathroomCount) query = query.gte("bathroom_count", +bathroomCount);
  if (locationValue) query = query.or(`city.ilike.%${locationValue}%,state_province.ilike.%${locationValue}%,country.ilike.%${locationValue}%`);

  const { data, error } = await query;
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getListings] Supabase error: ${error.message}`);
    }
    throw new Error(error.message);
  }

  const safeListings = (data || []).map((row: any) => {
    // Parse imageSrc if it's a JSON string array (take first image)
    let imageSrc = row.image_src || '';
    if (typeof imageSrc === 'string' && imageSrc.startsWith('[')) {
      try {
        const parsed = JSON.parse(imageSrc);
        imageSrc = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : imageSrc;
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[getListings] Failed to parse imageSrc for listing ${row.id}`);
        }
      }
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      imageSrc,
      createdAt: row.created_at,
      category: row.category,
      roomCount: row.room_count,
      bathroomCount: row.bathroom_count,
      guestCount: row.guest_count,
      userId: row.user_id,
      price: row.price,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2,
      city: row.city,
      stateProvince: row.state_province,
      postalCode: row.postal_code,
      country: row.country,
      countryCode: row.country_code,
      formattedAddress: row.formatted_address,
      latitude: row.latitude,
      longitude: row.longitude,
    };
  });

  if (process.env.NODE_ENV === 'development') {
    const endTime = Date.now();
    console.log(`[getListings] Query took ${endTime - startTime}ms, returned ${safeListings.length} listings (supabase)`);
  }

  return safeListings;
}