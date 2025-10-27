import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/amenity-categories - Get all categories
export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => 
      ['super_admin', 'admin'].includes(ur.role?.name)
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all categories (including inactive for admin)
    const { data, error } = await supabase
      .from('amenity_categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[GET /api/admin/amenity-categories] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/admin/amenity-categories] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/amenity-categories - Create new category
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some((ur: any) => 
      ['super_admin', 'admin'].includes(ur.role?.name)
    );

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, icon, display_order, is_active } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('amenity_categories')
      .insert({
        name,
        slug,
        description: description || null,
        icon: icon || null,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/amenity-categories] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/admin/amenity-categories] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

