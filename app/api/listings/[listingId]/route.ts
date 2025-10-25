import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { createClient } from "@/lib/supabase/server";
import { canEditListing, canDeleteListing } from "@/app/utils/permissions";

interface IParams {
  listingId?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  const { listingId } = await params;
  if (!listingId || typeof listingId !== 'string') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  // Parse imageSrc if needed
  let imageSrc = listing.image_src || '';
  if (typeof imageSrc === 'string' && imageSrc.startsWith('[')) {
    try {
      imageSrc = JSON.parse(imageSrc);
    } catch (e) {
      // Keep as string
    }
  }

  return NextResponse.json({
    ...listing,
    imageSrc,
    createdAt: listing.created_at,
    locationValue: listing.location_value,
    guestCount: listing.guest_count,
    roomCount: listing.room_count,
    bathroomCount: listing.bathroom_count,
    userId: listing.user_id,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await params;
  if (!listingId || typeof listingId !== 'string') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
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
  
  // Check permissions using RBAC system
  const { data: existingListing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', listingId)
    .single();

  if (!existingListing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (!canEditListing(currentUser, existingListing.user_id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

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

  // Update listing
  const { data, error } = await supabase
    .from('listings')
    .update({
      title,
      description,
      image_src: imageSrc,
      category,
      room_count: roomCount,
      bathroom_count: bathroomCount,
      guest_count: guestCount,
      location_value: location?.value, // Legacy field
      price: parseInt(price, 10),
      ...addressData, // Spread new address fields
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<IParams> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await params;
  if (!listingId || typeof listingId !== 'string') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const supabase = await createClient();
  
  // Check permissions using RBAC system
  const { data: existingListing } = await supabase
    .from('listings')
    .select('user_id')
    .eq('id', listingId)
    .single();

  if (!existingListing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (!canDeleteListing(currentUser, existingListing.user_id)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
