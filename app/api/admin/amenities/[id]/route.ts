import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/amenities/[id] - Get single amenity
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('amenities')
      .select(`
        *,
        category:amenity_categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[GET /api/admin/amenities/[id]] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/admin/amenities/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/amenities/[id] - Update amenity
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    const updateData: any = {};
    if (category_id !== undefined) updateData.category_id = category_id;
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (is_essential !== undefined) updateData.is_essential = is_essential;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    const { error: updateError } = await supabaseAdmin
      .from('amenities')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('[PATCH /api/admin/amenities/[id]] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Fetch updated amenity
    const { data, error } = await supabase
      .from('amenities')
      .select(`
        *,
        category:amenity_categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[PATCH /api/admin/amenities/[id]] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PATCH /api/admin/amenities/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/amenities/[id] - Delete amenity
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from('amenities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/amenities/[id]] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/admin/amenities/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

