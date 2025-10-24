-- =====================================================
-- ENTERPRISE-GRADE DATABASE SCHEMA RESTRUCTURE
-- =====================================================
-- This migration drops and recreates all public tables with proper normalization:
-- - Each table has its own `id` as PRIMARY KEY
-- - Only public.users references auth.users (via auth_user_id)
-- - All other tables reference public.users.id
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in correct order (reverse FK dependencies)
DROP TABLE IF EXISTS public.user_favorites CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.images CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================================================
-- TABLE: public.users (Gateway to auth system)
-- =====================================================
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by auth_user_id
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);

-- RLS Policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_all ON public.users;
CREATE POLICY users_select_all ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- =====================================================
-- TABLE: public.images (Centralized image storage)
-- =====================================================
CREATE TABLE public.images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  url text NOT NULL,
  alt_text text,
  entity_type text NOT NULL CHECK (entity_type IN ('avatar', 'cover', 'listing', 'other')),
  entity_id uuid,
  width int,
  height int,
  file_size int,
  mime_type text,
  uploaded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for images
CREATE INDEX idx_images_entity ON public.images(entity_type, entity_id);
CREATE INDEX idx_images_uploaded_by ON public.images(uploaded_by);

-- RLS Policies for images
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS images_select_all ON public.images;
CREATE POLICY images_select_all ON public.images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS images_insert_own ON public.images;
CREATE POLICY images_insert_own ON public.images
  FOR INSERT WITH CHECK (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS images_update_own ON public.images;
CREATE POLICY images_update_own ON public.images
  FOR UPDATE USING (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS images_delete_own ON public.images;
CREATE POLICY images_delete_own ON public.images
  FOR DELETE USING (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: public.profiles (Extended user information)
-- =====================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio text,
  phone text,
  location text,
  website text,
  avatar_image_id uuid REFERENCES public.images(id) ON DELETE SET NULL,
  cover_image_id uuid REFERENCES public.images(id) ON DELETE SET NULL,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for profiles
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_avatar_image_id ON public.profiles(avatar_image_id);
CREATE INDEX idx_profiles_cover_image_id ON public.profiles(cover_image_id);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
CREATE POLICY profiles_select_all ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: public.listings (Property listings)
-- =====================================================
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_src text,
  category text,
  room_count int,
  bathroom_count int,
  guest_count int,
  location_value text,
  price int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for listings
CREATE INDEX idx_listings_user_id ON public.listings(user_id);
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_location_value ON public.listings(location_value);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);

-- RLS Policies for listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_select_all ON public.listings;
CREATE POLICY listings_select_all ON public.listings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS listings_insert_own ON public.listings;
CREATE POLICY listings_insert_own ON public.listings
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS listings_update_own ON public.listings;
CREATE POLICY listings_update_own ON public.listings
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS listings_delete_own ON public.listings;
CREATE POLICY listings_delete_own ON public.listings
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: public.reservations (Booking reservations)
-- =====================================================
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  total_price int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for reservations
CREATE INDEX idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX idx_reservations_listing_id ON public.reservations(listing_id);
CREATE INDEX idx_reservations_dates ON public.reservations(start_date, end_date);

-- RLS Policies for reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservations_select_own_or_listing_owner ON public.reservations;
CREATE POLICY reservations_select_own_or_listing_owner ON public.reservations
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
    OR
    listing_id IN (
      SELECT l.id FROM public.listings l
      INNER JOIN public.users u ON l.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS reservations_insert_own ON public.reservations;
CREATE POLICY reservations_insert_own ON public.reservations
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS reservations_delete_own ON public.reservations;
CREATE POLICY reservations_delete_own ON public.reservations
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: public.user_favorites (User's favorite listings)
-- =====================================================
CREATE TABLE public.user_favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Indexes for user_favorites
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_listing_id ON public.user_favorites(listing_id);

-- RLS Policies for user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_favorites_select_own ON public.user_favorites;
CREATE POLICY user_favorites_select_own ON public.user_favorites
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS user_favorites_insert_own ON public.user_favorites;
CREATE POLICY user_favorites_insert_own ON public.user_favorites
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS user_favorites_delete_own ON public.user_favorites;
CREATE POLICY user_favorites_delete_own ON public.user_favorites
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGER: Auto-create user and profile on auth signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into public.users with its own id
  INSERT INTO public.users (auth_user_id, email, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.created_at,
    NEW.updated_at
  )
  RETURNING id INTO new_user_id;

  -- Insert into public.profiles
  INSERT INTO public.profiles (user_id, created_at, updated_at)
  VALUES (new_user_id, NEW.created_at, NEW.updated_at);

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFICATION QUERIES (for manual testing)
-- =====================================================
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name IN ('users', 'profiles', 'images', 'listings', 'reservations', 'user_favorites')
-- ORDER BY table_name, ordinal_position;

-- SELECT 
--   tc.table_name, 
--   kcu.column_name, 
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
-- ORDER BY tc.table_name;

