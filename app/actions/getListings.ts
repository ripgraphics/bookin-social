import { createClient } from "@/lib/supabase/server";

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

export default async function getListings (
  params: IListingsParams
) {
  try {
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
    // Location filtering would now use city, state_province, or country fields
    if (locationValue) query = query.or(`city.ilike.%${locationValue}%,state_province.ilike.%${locationValue}%,country.ilike.%${locationValue}%`);

    const { data, error } = await query;
    if (error) {
      console.log(`[getListings] Error: ${error.message}`);
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
          console.log(`[getListings] Failed to parse imageSrc for listing ${row.id}`);
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
        // New address fields
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

    const endTime = Date.now();
    console.log(`[getListings] Query took ${endTime - startTime}ms, returned ${safeListings.length} listings`);

    return safeListings;
  } catch (error: any) {
    throw new Error(error);
  }
}