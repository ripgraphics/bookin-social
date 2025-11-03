import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import getCurrentUser from "@/app/actions/getCurrentUser";

// GET /api/listings
// Get all listings for the current user
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("id, title, description, image_src, category, price, city, country")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    imageSrc,
    category,
    roomCount,
    bathroomCount,
    guestCount,
    address, // New address object from AddressInput
    location, // Legacy field for backward compatibility
    price,
    amenityIds, // Amenity IDs array
  } = body || {};

  const supabase = await createClient();
  
  // Prepare address data for database (only include defined fields)
  const addressData = address ? {
    ...(address.addressLine1 !== undefined && { address_line1: address.addressLine1 }),
    ...(address.addressLine2 !== undefined && { address_line2: address.addressLine2 }),
    ...(address.city !== undefined && { city: address.city }),
    ...(address.stateProvince !== undefined && { state_province: address.stateProvince }),
    ...(address.postalCode !== undefined && { postal_code: address.postalCode }),
    ...(address.country !== undefined && { country: address.country }),
    ...(address.countryCode !== undefined && { country_code: address.countryCode }),
    ...(address.formattedAddress !== undefined && { formatted_address: address.formattedAddress }),
    ...(address.latitude !== undefined && { latitude: address.latitude }),
    ...(address.longitude !== undefined && { longitude: address.longitude }),
  } : {};

  const { data, error } = await supabase
    .from("listings")
    .insert({
      title,
      description,
      image_src: imageSrc,
      category,
      room_count: roomCount,
      bathroom_count: bathroomCount,
      guest_count: guestCount,
      location_value: location?.value, // Legacy field
      price: parseInt(price, 10),
      user_id: currentUser.id,
      ...addressData, // Spread new address fields
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const listingId = data.id;

  // Insert amenities if provided
  if (amenityIds && Array.isArray(amenityIds) && amenityIds.length > 0) {
    const amenitiesData = amenityIds.map((amenityId: string) => ({
      listing_id: listingId,
      amenity_id: amenityId,
    }));

    const { error: amenitiesError } = await supabase
      .from('listing_amenities')
      .insert(amenitiesData);

    if (amenitiesError) {
      console.error('[POST /api/listings] Error inserting amenities:', amenitiesError);
      // Don't fail the request if amenities fail to insert
    }
  }

  return NextResponse.json(data);
}
