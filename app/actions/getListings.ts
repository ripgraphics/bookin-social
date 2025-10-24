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
      .select("id, title, description, image_src, created_at, category, room_count, bathroom_count, guest_count, location_value, user_id, price")
      .order("created_at", { ascending: false })
      .limit(20);

    // Apply filters
    if (userId) query = query.eq("user_id", userId);
    if (category) query = query.eq("category", category);
    if (roomCount) query = query.gte("room_count", +roomCount);
    if (guestCount) query = query.gte("guest_count", +guestCount);
    if (bathroomCount) query = query.gte("bathroom_count", +bathroomCount);
    if (locationValue) query = query.eq("location_value", locationValue);

    const { data, error } = await query;
    if (error) {
      console.log(`[getListings] Error: ${error.message}`);
      throw new Error(error.message);
    }

    const safeListings = (data || []).map((row: any) => {
      // Parse imageSrc if it's a JSON string array (take first image)
      let imageSrc = row.image_src;
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
        locationValue: row.location_value,
        userId: row.user_id,
        price: row.price,
      };
    });

    const endTime = Date.now();
    console.log(`[getListings] Query took ${endTime - startTime}ms, returned ${safeListings.length} listings`);

    return safeListings;
  } catch (error: any) {
    throw new Error(error);
  }
}