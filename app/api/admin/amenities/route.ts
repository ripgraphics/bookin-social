import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/amenities - Get all amenities
export async function GET(request: Request) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    let query = supabase
      .from('amenities')
      .select(`
        *,
        category:amenity_categories(*)
      `)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/admin/amenities] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/admin/amenities] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/amenities - Create new amenity
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
    const { 
      category_id, 
      name, 
      slug, 
      description, 
      icon, 
      is_essential, 
      is_active, 
      display_order 
    } = body;

    // Validate required fields
    if (!category_id || !name || !slug || !icon) {
      return NextResponse.json(
        { error: 'Category ID, name, slug, and icon are required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin
      .from('amenities')
      .insert({
        category_id,
        name,
        slug,
        description: description || null,
        icon,
        is_essential: is_essential || false,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
      })
      .select(`
        *,
        category:amenity_categories(*)
      `)
      .single();

    if (error) {
      console.error('[POST /api/admin/amenities] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/admin/amenities] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

