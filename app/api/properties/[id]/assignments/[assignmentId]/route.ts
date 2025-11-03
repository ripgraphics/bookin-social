import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/properties/:id/assignments/:assignmentId
// Update an assignment
export async function PUT(
  request: Request,
  { params }: { params: { id: string; assignmentId: string } }
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
      role,
      commission_rate,
      permissions,
      start_date,
      end_date,
      status,
      notes
    } = body;

    // Verify property ownership
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

    // Verify assignment exists
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from("property_assignments")
      .select("id, property_id")
      .eq("id", params.assignmentId)
      .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (existingAssignment.property_id !== params.id) {
      return NextResponse.json({ error: "Assignment does not belong to this property" }, { status: 400 });
    }

    // Update assignment
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (role !== undefined) {
      if (!['host', 'co_host'].includes(role)) {
        return NextResponse.json({ error: "role must be 'host' or 'co_host'" }, { status: 400 });
      }
      updateData.role = role;
    }
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status !== undefined) {
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return NextResponse.json({ error: "status must be 'active', 'inactive', or 'suspended'" }, { status: 400 });
      }
      updateData.status = status;
    }
    if (notes !== undefined) updateData.notes = notes;

    const { data: assignment, error } = await supabase
      .from("property_assignments")
      .update(updateData)
      .eq("id", params.assignmentId)
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
      console.error("[PUT /api/properties/:id/assignments/:assignmentId] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(assignment);
  } catch (error: any) {
    console.error("[PUT /api/properties/:id/assignments/:assignmentId] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/properties/:id/assignments/:assignmentId
// Delete an assignment (remove host/co-host from property)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; assignmentId: string } }
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

    // Verify property ownership
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

    // Verify assignment exists
    const { data: existingAssignment, error: assignmentError } = await supabase
      .from("property_assignments")
      .select("id, property_id")
      .eq("id", params.assignmentId)
      .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (existingAssignment.property_id !== params.id) {
      return NextResponse.json({ error: "Assignment does not belong to this property" }, { status: 400 });
    }

    // Delete assignment
    const { error } = await supabase
      .from("property_assignments")
      .delete()
      .eq("id", params.assignmentId);

    if (error) {
      console.error("[DELETE /api/properties/:id/assignments/:assignmentId] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/properties/:id/assignments/:assignmentId] Unexpected error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

