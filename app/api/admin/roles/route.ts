import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = await createAdminClient();
    
    const { data: roles, error } = await adminClient
      .from('roles')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[GET /api/admin/roles] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(roles || []);
  } catch (error: any) {
    console.error('[GET /api/admin/roles] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, display_name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = await createAdminClient();
    
    const { data: role, error } = await adminClient
      .from('roles')
      .insert({
        name,
        display_name: display_name || name,
        description,
        is_system_role: false
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/roles] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(role);
  } catch (error: any) {
    console.error('[POST /api/admin/roles] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

