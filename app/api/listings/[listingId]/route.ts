import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import { createClient, createAdminClient } from "@/lib/supabase/server";
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
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    imageSrc,
    guestCount: listing.guest_count,
    roomCount: listing.room_count,
    bathroomCount: listing.bathroom_count,
    userId: listing.user_id,
    createdAt: listing.created_at,
    locationValue: listing.location_value,
    // Address fields
    formatted_address: listing.formatted_address,
    address_line1: listing.address_line1,
    address_line2: listing.address_line2,
    city: listing.city,
    state_province: listing.state_province,
    postal_code: listing.postal_code,
    country: listing.country,
    country_code: listing.country_code,
    latitude: listing.latitude,
    longitude: listing.longitude,
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
    amenityIds, // Amenity IDs array
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

  // Prepare address data for database (only include defined and non-empty fields)
  const addressData = address ? {
    ...(address.addressLine1 && { address_line1: address.addressLine1 }),
    ...(address.addressLine2 && { address_line2: address.addressLine2 }),
    ...(address.city && { city: address.city }),
    ...(address.stateProvince && { state_province: address.stateProvince }),
    ...(address.postalCode && { postal_code: address.postalCode }),
    ...(address.country && { country: address.country }),
    ...(address.countryCode && { country_code: address.countryCode }),
    ...(address.formattedAddress && { formatted_address: address.formattedAddress }),
    ...(address.latitude !== undefined && address.latitude !== null && { latitude: address.latitude }),
    ...(address.longitude !== undefined && address.longitude !== null && { longitude: address.longitude }),
  } : {};

  // Prepare image_src (convert array to JSON string if needed)
  let imageValue = imageSrc;
  if (Array.isArray(imageSrc)) {
    imageValue = JSON.stringify(imageSrc);
  }

  // Prepare update data
  const updateData = {
    title,
    description,
    image_src: imageValue,
    category,
    room_count: roomCount,
    bathroom_count: bathroomCount,
    guest_count: guestCount,
    location_value: location?.value, // Legacy field
    price: parseInt(price, 10),
    ...addressData, // Spread new address fields
  };

  console.log('[PATCH /api/listings] Update data:', JSON.stringify(updateData, null, 2));

  // Use admin client for update to bypass RLS
  const supabaseAdmin = createAdminClient();
  
  // Update listing
  const { error: updateError } = await supabaseAdmin
    .from('listings')
    .update(updateData)
    .eq('id', listingId);

  if (updateError) {
    console.error('[PATCH /api/listings] Supabase update error:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  // Fetch the updated listing separately
  const { data: listing, error: fetchError } = await supabaseAdmin
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (fetchError || !listing) {
    console.error('[PATCH /api/listings] Error fetching updated listing:', fetchError);
    // Update succeeded but fetch failed - still return success
    return NextResponse.json({ success: true, id: listingId });
  }

  // Update amenities if provided
  if (amenityIds !== undefined && Array.isArray(amenityIds)) {
    // Delete existing amenities
    const { error: deleteError } = await supabaseAdmin
      .from('listing_amenities')
      .delete()
      .eq('listing_id', listingId);

    if (deleteError) {
      console.error('[PATCH /api/listings] Error deleting amenities:', deleteError);
    }

    // Insert new amenities if any provided
    if (amenityIds.length > 0) {
      const amenitiesData = amenityIds.map((amenityId: string) => ({
        listing_id: listingId,
        amenity_id: amenityId,
      }));

      const { error: amenitiesError } = await supabaseAdmin
        .from('listing_amenities')
        .insert(amenitiesData);

      if (amenitiesError) {
        console.error('[PATCH /api/listings] Error inserting amenities:', amenitiesError);
      }
    }
  }

  console.log('[PATCH /api/listings] Update successful:', listing.id);
  return NextResponse.json(listing);
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

  // Use admin client for delete to bypass RLS
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from('listings')
    .delete()
    .eq('id', listingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
