import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/properties/:id/assignments
// Get all assignments (hosts/co-hosts) for a property
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

    const { data: assignments, error } = await supabase
      .from("property_assignments")
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email
        ),
        property_management (
          id,
          listings (
            id,
            title
          )
        )
      `)
      .eq("property_id", params.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/properties/:id/assignments] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(assignments || []);
  } catch (error: any) {
    console.error("[GET /api/properties/:id/assignments] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/properties/:id/assignments
// Create a new assignment (assign host/co-host to property)
export async function POST(
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
      user_id,
      role,
      commission_rate,
      permissions,
      start_date,
      end_date,
      notes
    } = body;

    // Validate required fields
    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    if (!role || !['host', 'co_host'].includes(role)) {
      return NextResponse.json({ error: "role must be 'host' or 'co_host'" }, { status: 400 });
    }

    // Verify property exists and user is the owner
    const { data: property, error: propertyError } = await supabase
      .from("property_management")
      .select("id, owner_id")
      .eq("id", params.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (property.owner_id !== publicUser.id) {
      return NextResponse.json({ error: "You do not own this property" }, { status: 403 });
    }

    // Verify the user to be assigned exists
    const { data: assignedUser, error: userError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("id", user_id)
      .single();

    if (userError || !assignedUser) {
      return NextResponse.json({ error: "User to assign not found" }, { status: 404 });
    }

    // Check if user is already assigned to this property
    const { data: existingAssignment } = await supabase
      .from("property_assignments")
      .select("id, status")
      .eq("property_id", params.id)
      .eq("user_id", user_id)
      .eq("status", "active")
      .single();

    if (existingAssignment) {
      return NextResponse.json({ 
        error: "User is already assigned to this property" 
      }, { status: 400 });
    }

    // Create assignment
    const { data: assignment, error } = await supabase
      .from("property_assignments")
      .insert({
        property_id: params.id,
        user_id,
        role,
        commission_rate: commission_rate || 0,
        permissions: permissions || {},
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date,
        status: 'active',
        notes
      })
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error("[POST /api/properties/:id/assignments] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error("[POST /api/properties/:id/assignments] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

