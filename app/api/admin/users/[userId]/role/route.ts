import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if requesting user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to update user role
    const adminClient = await createAdminClient();
    
    // First, get the role ID
    const { data: roleData, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('role_name', role)
      .single();

    if (roleError || !roleData) {
      console.error('[PATCH /api/admin/users/role] Role fetch error:', roleError);
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Delete existing user roles
    const { error: deleteError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[PATCH /api/admin/users/role] Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // Insert new role
    const { error: insertError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleData.id
      });

    if (insertError) {
      console.error('[PATCH /api/admin/users/role] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PATCH /api/admin/users/role] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

