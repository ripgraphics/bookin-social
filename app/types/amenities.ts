// =====================================================
// AMENITIES TYPES
// =====================================================
// TypeScript types for the amenities management system
// =====================================================

export interface AmenityCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Amenity {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  is_essential: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: AmenityCategory;
}

export interface ListingAmenity {
  listing_id: string;
  amenity_id: string;
  created_at: string;
  amenity?: Amenity;
}

// DTO for creating/updating amenity categories
export interface CreateAmenityCategoryDTO {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateAmenityCategoryDTO extends Partial<CreateAmenityCategoryDTO> {
  id: string;
}

// DTO for creating/updating amenities
export interface CreateAmenityDTO {
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon: string;
  is_essential?: boolean;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateAmenityDTO extends Partial<CreateAmenityDTO> {
  id: string;
}

// Grouped amenities for display
export interface GroupedAmenities {
  category: AmenityCategory;
  amenities: Amenity[];
}

// Amenity with category details (from database function)
export interface AmenityWithCategory {
  amenity_id: string;
  amenity_name: string;
  amenity_slug: string;
  amenity_description: string | null;
  amenity_icon: string;
  is_essential: boolean;
  category_id: string;
  category_name: string;
  category_slug: string;
  category_icon: string | null;
  display_order: number;
}

// Safe amenity types (for client-side use)
export type SafeAmenityCategory = Omit<AmenityCategory, 'created_at' | 'updated_at'> & {
  createdAt: string;
  updatedAt: string;
};

export type SafeAmenity = Omit<Amenity, 'created_at' | 'updated_at' | 'category_id'> & {
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  category?: SafeAmenityCategory;
};

export type SafeListingAmenity = Omit<ListingAmenity, 'created_at' | 'listing_id' | 'amenity_id'> & {
  createdAt: string;
  listingId: string;
  amenityId: string;
  amenity?: SafeAmenity;
};

