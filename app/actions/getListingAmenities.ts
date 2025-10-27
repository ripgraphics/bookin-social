import { createClient } from '@/lib/supabase/server';
import { AmenityWithCategory } from '@/app/types/amenities';

export default async function getListingAmenities(listingId: string): Promise<AmenityWithCategory[]> {
  try {
    const supabase = await createClient();

    // Use the database function for optimized query
    const { data, error } = await supabase
      .rpc('get_listing_amenities_with_details', {
        p_listing_id: listingId
      });

    if (error) {
      console.error('[getListingAmenities] Supabase error:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('[getListingAmenities] Error:', error);
    return [];
  }
}

// Helper function to transform AmenityWithCategory[] into grouped structure
export function groupAmenitiesByCategory(amenities: AmenityWithCategory[]) {
  // Group amenities by category
  const categoryMap = new Map<string, {
    id: string;
    name: string;
    amenities: Array<{
      id: string;
      name: string;
      icon: string;
      description: string | null;
    }>;
  }>();

  amenities.forEach(amenity => {
    const categoryId = amenity.category_id;
    
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, {
        id: categoryId,
        name: amenity.category_name,
        amenities: []
      });
    }

    const category = categoryMap.get(categoryId)!;
    category.amenities.push({
      id: amenity.amenity_id,
      name: amenity.amenity_name,
      icon: amenity.amenity_icon,
      description: amenity.amenity_description
    });
  });

  return Array.from(categoryMap.values());
}
