import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/properties/management
// List all properties with management data for the current user
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get properties where user is owner or assigned as host/co-host
    const { data: properties, error } = await supabase
      .from("property_management")
      .select(`
        *,
        listings (
          id,
          title,
          description,
          image_src,
          category,
          price,
          city,
          country
        ),
        owner:users!owner_id (
          id,
          first_name,
          last_name,
          email
        ),
        property_assignments (
          id,
          user_id,
          role,
          commission_rate,
          status,
          users (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .or(`owner_id.eq.${publicUser.id},id.in.(${await getAssignedPropertyIds(supabase, publicUser.id)})`);

    if (error) {
      console.error("[GET /api/properties/management] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(properties || []);
  } catch (error: any) {
    console.error("[GET /api/properties/management] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/properties/management
// Create property management configuration
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      listing_id,
      management_type,
      commission_rate,
      cleaning_fee,
      service_fee_rate,
      tax_rate,
      currency,
      payment_terms,
      auto_invoice,
      settings
    } = body;

    // Validate required fields
    if (!listing_id) {
      return NextResponse.json({ error: "listing_id is required" }, { status: 400 });
    }

    // Verify the listing exists and belongs to the user
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, user_id")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.user_id !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this listing" }, { status: 403 });
    }

    // Create property management configuration
    const { data: propertyManagement, error } = await supabase
      .from("property_management")
      .insert({
        listing_id,
        owner_id: publicUser.id,
        management_type: management_type || 'self_managed',
        commission_rate: commission_rate || 0,
        cleaning_fee: cleaning_fee || 0,
        service_fee_rate: service_fee_rate || 0,
        tax_rate: tax_rate || 0,
        currency: currency || 'USD',
        payment_terms: payment_terms || 30,
        auto_invoice: auto_invoice !== undefined ? auto_invoice : true,
        settings: settings || {}
      })
      .select(`
        *,
        listings (
          id,
          title,
          description,
          image_src,
          category,
          price
        )
      `)
      .single();

    if (error) {
      console.error("[POST /api/properties/management] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(propertyManagement);
  } catch (error: any) {
    console.error("[POST /api/properties/management] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get property IDs where user is assigned
async function getAssignedPropertyIds(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from("property_assignments")
    .select("property_id")
    .eq("user_id", userId)
    .eq("status", "active");
  
  if (!data || data.length === 0) {
    return "00000000-0000-0000-0000-000000000000"; // Return dummy UUID if no assignments
  }
  
  return data.map((a: any) => a.property_id).join(",");
}

