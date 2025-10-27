import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all active amenities with their categories
    const { data: amenities, error } = await supabase
      .from('amenities')
      .select(`
        id,
        name,
        icon,
        category_id,
        category:amenity_categories(
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[GET /api/amenities] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Transform the data to a flatter structure
    const transformedAmenities = (amenities || []).map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      icon: amenity.icon,
      category_id: amenity.category_id,
      category_name: amenity.category?.name || ''
    }));

    return NextResponse.json(transformedAmenities);
  } catch (error: any) {
    console.error('[GET /api/amenities] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

