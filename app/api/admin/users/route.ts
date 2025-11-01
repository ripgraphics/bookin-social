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

    // Use admin client to fetch all users
    const adminClient = await createAdminClient();
    
    const { data: users, error } = await adminClient
      .from('users')
      .select('id, email, first_name, last_name, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/users] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Transform users and add roles
    const transformedUsers = users?.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: [] // TODO: Fetch roles separately if needed
    })) || [];

    return NextResponse.json(transformedUsers);
  } catch (error: any) {
    console.error('[GET /api/admin/users] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

