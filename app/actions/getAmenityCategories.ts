import { createClient } from '@/lib/supabase/server';
import { AmenityCategory } from '@/app/types/amenities';

export default async function getAmenityCategories(): Promise<AmenityCategory[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('amenity_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('[getAmenityCategories] Supabase error:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('[getAmenityCategories] Error:', error);
    return [];
  }
}

