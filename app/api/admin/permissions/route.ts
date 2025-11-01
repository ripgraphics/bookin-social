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
    
    const { data: permissions, error } = await adminClient
      .from('permissions')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[GET /api/admin/permissions] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(permissions || []);
  } catch (error: any) {
    console.error('[GET /api/admin/permissions] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Permission name is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = await createAdminClient();
    
    const { data: permission, error } = await adminClient
      .from('permissions')
      .insert({
        name,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/permissions] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(permission);
  } catch (error: any) {
    console.error('[POST /api/admin/permissions] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

