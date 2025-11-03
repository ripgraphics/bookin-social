import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/properties/management/:id
// Get property management configuration by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: propertyManagement, error } = await supabase
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
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("[GET /api/properties/management/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!propertyManagement) {
      return NextResponse.json({ error: "Property management not found" }, { status: 404 });
    }

    return NextResponse.json(propertyManagement);
  } catch (error: any) {
    console.error("[GET /api/properties/management/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/properties/management/:id
// Update property management configuration
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("property_management")
      .select("owner_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Property management not found" }, { status: 404 });
    }

    if (existing.owner_id !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this property" }, { status: 403 });
    }

    // Update property management configuration
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (management_type !== undefined) updateData.management_type = management_type;
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate;
    if (cleaning_fee !== undefined) updateData.cleaning_fee = cleaning_fee;
    if (service_fee_rate !== undefined) updateData.service_fee_rate = service_fee_rate;
    if (tax_rate !== undefined) updateData.tax_rate = tax_rate;
    if (currency !== undefined) updateData.currency = currency;
    if (payment_terms !== undefined) updateData.payment_terms = payment_terms;
    if (auto_invoice !== undefined) updateData.auto_invoice = auto_invoice;
    if (settings !== undefined) updateData.settings = settings;

    const { data: propertyManagement, error } = await supabase
      .from("property_management")
      .update(updateData)
      .eq("id", params.id)
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
      console.error("[PUT /api/properties/management/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(propertyManagement);
  } catch (error: any) {
    console.error("[PUT /api/properties/management/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/properties/management/:id
// Delete property management configuration
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from("property_management")
      .select("owner_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Property management not found" }, { status: 404 });
    }

    if (existing.owner_id !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this property" }, { status: 403 });
    }

    // Delete property management configuration
    const { error } = await supabase
      .from("property_management")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("[DELETE /api/properties/management/:id] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/properties/management/:id] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

