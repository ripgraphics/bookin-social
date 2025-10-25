import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import getCurrentUser from "@/app/actions/getCurrentUser";

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
  } = body || {};

  const supabase = await createClient();
  
  // Prepare address data for database
  const addressData = address ? {
    address_line1: address.addressLine1,
    address_line2: address.addressLine2,
    city: address.city,
    state_province: address.stateProvince,
    postal_code: address.postalCode,
    country: address.country,
    country_code: address.countryCode,
    formatted_address: address.formattedAddress,
    latitude: address.latitude,
    longitude: address.longitude,
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

  return NextResponse.json(data);
}
