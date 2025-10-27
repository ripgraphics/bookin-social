import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/amenity-categories/[id] - Get single category
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
      .from('amenity_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[GET /api/admin/amenity-categories/[id]] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GET /api/admin/amenity-categories/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/amenity-categories/[id] - Update category
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
    const { name, slug, description, icon, display_order, is_active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    const { error: updateError } = await supabaseAdmin
      .from('amenity_categories')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('[PATCH /api/admin/amenity-categories/[id]] Update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Fetch updated category
    const { data, error } = await supabase
      .from('amenity_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[PATCH /api/admin/amenity-categories/[id]] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[PATCH /api/admin/amenity-categories/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/amenity-categories/[id] - Delete category
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
      .from('amenity_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/amenity-categories/[id]] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/admin/amenity-categories/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

