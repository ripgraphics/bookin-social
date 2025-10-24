// Supabase types - Enterprise-Grade Schema
// Architecture:
// - public.users: Gateway table with auth_user_id FK to auth.users (only table that references auth)
// - public.profiles: Extended user info, references public.users.id
// - public.images: Centralized image storage, references public.users.id for uploaded_by
// - All application tables reference public.users.id, NOT auth.users.id

export type SafeImage = {
  id: string; // Own PK
  url: string;
  alt_text: string | null;
  entity_type: 'avatar' | 'cover' | 'listing' | 'other';
  entity_id: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null; // FK to public.users.id
  createdAt: string;
};

export type SafeProfile = {
  id: string; // Own PK
  user_id: string; // FK to public.users.id
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  avatar_image_id: string | null; // FK to public.images.id
  cover_image_id: string | null; // FK to public.images.id
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Populated if joined
  avatar_image?: SafeImage | null;
  cover_image?: SafeImage | null;
};

export type SafeUser = {
  id: string; // public.users.id (Own PK, NOT auth.users.id)
  firstName: string; // NOT NULL - required
  lastName: string; // NOT NULL - required
  email: string | null;
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;
  // Populated if joined
  profile?: SafeProfile | null;
  avatar_url?: string | null; // Convenience field from profile.avatar_image.url
};

export type SafeListing = {
  id: string;
  title: string;
  description: string | null;
  imageSrc?: string | string[]; // Support both single image and array
  image_src?: string | string[];
  createdAt: string;
  category: string | null;
  roomCount: number | null;
  bathroomCount: number | null;
  guestCount: number | null;
  locationValue: string | null;
  userId?: string;
  user_id?: string;
  price: number;
};

export type SafeReservation = {
  id: string;
  userId?: string;
  user_id?: string;
  listingId?: string;
  listing_id?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  createdAt: string;
  listing: SafeListing;
};