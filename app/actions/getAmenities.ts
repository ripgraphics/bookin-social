import { createClient } from '@/lib/supabase/server';
import { Amenity, GroupedAmenities } from '@/app/types/amenities';

interface GetAmenitiesParams {
  categoryId?: string;
  includeInactive?: boolean;
}

export async function getAmenities(params?: GetAmenitiesParams): Promise<Amenity[]> {
  try {
    const supabase = await createClient();
    const { categoryId, includeInactive = false } = params || {};

    let query = supabase
      .from('amenities')
      .select(`
        *,
        category:amenity_categories(*)
      `)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    // Filter by active status
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[getAmenities] Supabase error:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('[getAmenities] Error:', error);
    return [];
  }
}

export async function getAmenitiesGroupedByCategory(): Promise<GroupedAmenities[]> {
  try {
    const supabase = await createClient();

    // Get all active categories
    const { data: categories, error: categoriesError } = await supabase
      .from('amenity_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (categoriesError) {
      console.error('[getAmenitiesGroupedByCategory] Categories error:', categoriesError);
      return [];
    }

    if (!categories || categories.length === 0) {
      return [];
    }

    // Get all active amenities with their categories
    const { data: amenities, error: amenitiesError } = await supabase
      .from('amenities')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (amenitiesError) {
      console.error('[getAmenitiesGroupedByCategory] Amenities error:', amenitiesError);
      return [];
    }

    // Group amenities by category
    const grouped: GroupedAmenities[] = categories.map(category => ({
      category,
      amenities: (amenities || []).filter(amenity => amenity.category_id === category.id)
    }));

    // Filter out categories with no amenities
    return grouped.filter(group => group.amenities.length > 0);
  } catch (error: any) {
    console.error('[getAmenitiesGroupedByCategory] Error:', error);
    return [];
  }
}

export default getAmenities;

