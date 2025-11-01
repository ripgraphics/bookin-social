import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db/pool";

interface IParams {
  listingId?: string;
  userId?: string;
  authorId?: string;
}

// Detect if we should use optimized direct pg pool approach
const USE_DIRECT_PG = !!process.env.SUPABASE_DB_URL || !!process.env.DATABASE_URL;

export default async function getReservations(
  params: IParams
) {
  try {
    // Use optimized approach for production (direct pg pool)
    if (USE_DIRECT_PG) {
      return await getReservationsOptimized(params);
    }
    
    // Use Supabase client for local development
    return await getReservationsSupabase(params);
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getReservations] Error:', error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
}

async function getReservationsOptimized(params: IParams) {
  const startTime = Date.now();
  const { listingId, userId, authorId } = params;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Cast IDs to TEXT since the database uses CUID (text) format, not UUID
  if (listingId) {
    conditions.push(`r.listing_id::text = $${paramIndex++}`);
    values.push(listingId);
  }
  if (userId) {
    conditions.push(`r.user_id::text = $${paramIndex++}`);
    values.push(userId);
  }
  if (authorId) {
    conditions.push(`l.user_id::text = $${paramIndex++}`);
    values.push(authorId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT 
      r.id::text as id, r.user_id::text as user_id, r.listing_id::text as listing_id, 
      r.start_date, r.end_date, r.total_price, r.created_at,
      l.id::text as listing_id_full, l.title as listing_title, l.description as listing_description,
      l.image_src as listing_image_src, l.created_at as listing_created_at,
      l.category as listing_category, l.room_count as listing_room_count,
      l.bathroom_count as listing_bathroom_count, l.guest_count as listing_guest_count,
      l.user_id::text as listing_user_id, l.price as listing_price,
      l.address_line1, l.address_line2, l.city, l.state_province, 
      l.postal_code, l.country, l.country_code, l.formatted_address,
      l.latitude, l.longitude
    FROM public.reservations r
    INNER JOIN public.listings l ON r.listing_id = l.id
    ${whereClause}
    ORDER BY r.created_at DESC
  `;

  const { rows: data } = await query(sql, values);

  const safeReservations = (data || []).map((row: any) => {
    let imageSrc = row.listing_image_src || '';
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
      user_id: row.user_id,
      listing_id: row.listing_id,
      start_date: row.start_date,
      end_date: row.end_date,
      total_price: row.total_price,
      created_at: row.created_at,
      createdAt: row.created_at,
      startDate: row.start_date,
      endDate: row.end_date,
      totalPrice: row.total_price,
      listing: {
        id: row.listing_id_full,
        title: row.listing_title,
        description: row.listing_description,
        imageSrc,
        image_src: imageSrc,
        createdAt: row.listing_created_at,
        created_at: row.listing_created_at,
        category: row.listing_category,
        roomCount: row.listing_room_count,
        room_count: row.listing_room_count,
        bathroomCount: row.listing_bathroom_count,
        bathroom_count: row.listing_bathroom_count,
        guestCount: row.listing_guest_count,
        guest_count: row.listing_guest_count,
        userId: row.listing_user_id,
        user_id: row.listing_user_id,
        price: row.listing_price,
        addressLine1: row.address_line1,
        address_line1: row.address_line1,
        addressLine2: row.address_line2,
        address_line2: row.address_line2,
        city: row.city,
        stateProvince: row.state_province,
        state_province: row.state_province,
        postalCode: row.postal_code,
        postal_code: row.postal_code,
        country: row.country,
        countryCode: row.country_code,
        country_code: row.country_code,
        formattedAddress: row.formatted_address,
        formatted_address: row.formatted_address,
        latitude: row.latitude,
        longitude: row.longitude,
      },
      listings: {
        id: row.listing_id_full,
        title: row.listing_title,
        description: row.listing_description,
        image_src: imageSrc,
        created_at: row.listing_created_at,
        category: row.listing_category,
        room_count: row.listing_room_count,
        bathroom_count: row.listing_bathroom_count,
        guest_count: row.listing_guest_count,
        user_id: row.listing_user_id,
        price: row.listing_price,
        address_line1: row.address_line1,
        address_line2: row.address_line2,
        city: row.city,
        state_province: row.state_province,
        postal_code: row.postal_code,
        country: row.country,
        country_code: row.country_code,
        formatted_address: row.formatted_address,
        latitude: row.latitude,
        longitude: row.longitude,
      }
    };
  });

  if (process.env.NODE_ENV === 'development') {
    const endTime = Date.now();
    console.log(`[getReservations] Query took ${endTime - startTime}ms, returned ${safeReservations.length} reservations (optimized)`);
  }

  return safeReservations;
}

async function getReservationsSupabase(params: IParams) {
  const startTime = Date.now();
  const { listingId, userId, authorId } = params;

  const supabase = await createClient();
  let supabaseQuery = supabase
    .from("reservations")
    .select("*, listings(*)")
    .order("created_at", { ascending: false });

  if (listingId) supabaseQuery = supabaseQuery.eq("listing_id", listingId);
  if (userId) supabaseQuery = supabaseQuery.eq("user_id", userId);
  if (authorId) supabaseQuery = supabaseQuery.eq("listings.user_id", authorId);

  const { data, error } = await supabaseQuery as any;
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getReservations] Supabase error: ${error.message}`);
    }
    throw new Error(error.message);
  }

  const safeReservations = (data || []).map((row: any) => ({
    ...row,
    createdAt: row.created_at,
    startDate: row.start_date,
    endDate: row.end_date,
    listing: {
      ...row.listings,
      createdAt: row.listings?.created_at,
    }
  }));

  if (process.env.NODE_ENV === 'development') {
    const endTime = Date.now();
    console.log(`[getReservations] Query took ${endTime - startTime}ms, returned ${safeReservations.length} reservations (supabase)`);
  }

  return safeReservations;
}