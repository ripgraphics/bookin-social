import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/db/pool";

interface IParams {
  listingId?: string;
}

// Detect if we should use optimized direct pg pool approach
const USE_DIRECT_PG = !!process.env.SUPABASE_DB_URL || !!process.env.DATABASE_URL;

export default async function getListingById(
  params: IParams
) {
  try {
    const { listingId } = params;
    if (!listingId) return null;

    // Use optimized approach for production (direct pg pool)
    if (USE_DIRECT_PG) {
      return await getListingByIdOptimized(listingId);
    }
    
    // Use Supabase client for local development
    return await getListingByIdSupabase(listingId);
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[getListingById] Error:', error instanceof Error ? error.message : String(error));
    }
    throw error;
  }
}

async function getListingByIdOptimized(listingId: string) {
  const startTime = Date.now();

  const sql = `
    SELECT 
      l.id::text as id, l.title, l.description, l.image_src, l.created_at,
      l.category, l.room_count, l.bathroom_count, l.guest_count, 
      l.user_id::text as user_id, l.price,
      l.address_line1, l.address_line2, l.city, l.state_province,
      l.postal_code, l.country, l.country_code, l.formatted_address,
      l.latitude, l.longitude,
      u.id::text as user_id_full, u.first_name, u.last_name, u.email
    FROM public.listings l
    LEFT JOIN public.users u ON l.user_id = u.id
    WHERE l.id::text = $1
    LIMIT 1
  `;

  const { rows } = await query(sql, [listingId]);
  
  if (!rows || rows.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getListingById] No listing found for ID: ${listingId} (optimized)`);
    }
    return null;
  }

  const data = rows[0];

  // Parse imageSrc if it's a JSON string array
  let imageSrc = data.image_src || '';
  if (typeof imageSrc === 'string' && imageSrc.startsWith('[')) {
    try {
      imageSrc = JSON.parse(imageSrc);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[getListingById] Failed to parse imageSrc for listing ${listingId}`);
      }
    }
  }

  const result = {
    id: data.id,
    title: data.title,
    description: data.description,
    image_src: imageSrc,
    imageSrc: imageSrc,
    created_at: data.created_at,
    createdAt: data.created_at,
    category: data.category,
    room_count: data.room_count,
    roomCount: data.room_count,
    bathroom_count: data.bathroom_count,
    bathroomCount: data.bathroom_count,
    guest_count: data.guest_count,
    guestCount: data.guest_count,
    user_id: data.user_id,
    userId: data.user_id,
    price: data.price,
    address_line1: data.address_line1,
    addressLine1: data.address_line1,
    address_line2: data.address_line2,
    addressLine2: data.address_line2,
    city: data.city,
    state_province: data.state_province,
    stateProvince: data.state_province,
    postal_code: data.postal_code,
    postalCode: data.postal_code,
    country: data.country,
    country_code: data.country_code,
    countryCode: data.country_code,
    formatted_address: data.formatted_address,
    formattedAddress: data.formatted_address,
    latitude: data.latitude,
    longitude: data.longitude,
    user: data.user_id_full ? {
      id: data.user_id_full,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
    } : null,
  } as any;

  if (process.env.NODE_ENV === 'development') {
    const endTime = Date.now();
    console.log(`[getListingById] Query took ${endTime - startTime}ms (optimized), found listing: ${data.title}`);
  }

  return result;
}

async function getListingByIdSupabase(listingId: string) {
  const startTime = Date.now();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(`
      *,
      user:users!user_id (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq("id", listingId)
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[getListingById] No listing found or error: ${error?.message || 'No data'} (supabase)`);
    }
    return null;
  }

  // Parse imageSrc if it's a JSON string array
  let imageSrc = data.image_src || '';
  if (typeof imageSrc === 'string' && imageSrc.startsWith('[')) {
    try {
      imageSrc = JSON.parse(imageSrc);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[getListingById] Failed to parse imageSrc for listing ${listingId}`);
      }
    }
  }

  const result = {
    ...data,
    image_src: imageSrc,
    imageSrc: imageSrc,
    createdAt: data.created_at,
    user: data.user ? {
      id: data.user.id,
      firstName: data.user.first_name,
      lastName: data.user.last_name,
      email: data.user.email,
    } : null,
  } as any;

  if (process.env.NODE_ENV === 'development') {
    const endTime = Date.now();
    console.log(`[getListingById] Query took ${endTime - startTime}ms (supabase), found listing: ${data.title}`);
  }

  return result;
}
