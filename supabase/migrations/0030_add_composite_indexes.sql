-- =====================================================
-- ADD COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================
-- This migration adds composite indexes to speed up
-- frequently used query patterns in the application.
--
-- Target queries:
-- 1. Profile + Avatar lookups (used in getCurrentUser)
-- 2. Image URL lookups (used for avatar display)
-- 3. User roles with expiration checks
-- =====================================================

-- Composite index for profiles with avatar lookups
-- Covers the common pattern: fetch profile and check avatar_image_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_avatar 
ON public.profiles(user_id, avatar_image_id);

-- Composite index for profiles with cover image
CREATE INDEX IF NOT EXISTS idx_profiles_user_cover 
ON public.profiles(user_id, cover_image_id);

-- Covering index for images - includes url in index for faster lookups
-- This allows PostgreSQL to return url without accessing the table
CREATE INDEX IF NOT EXISTS idx_images_id_url 
ON public.images(id) INCLUDE (url);

-- Composite index for user_favorites lookups
-- Speeds up checking if a listing is favorited
CREATE INDEX IF NOT EXISTS idx_user_favorites_composite 
ON public.user_favorites(user_id, listing_id);

-- Composite index for user_posts by user and creation date
-- Already exists from migration 0024, but ensuring it's there
CREATE INDEX IF NOT EXISTS idx_user_posts_user_created_composite 
ON public.user_posts(user_id, created_at DESC);

-- Composite index for user_photos by user and creation date
-- Already exists from migration 0025, but ensuring it's there
CREATE INDEX IF NOT EXISTS idx_user_photos_user_created_composite 
ON public.user_photos(user_id, created_at DESC);

-- Add index for two_factor_auth lookups by user
-- Speeds up the two_factor check in getProfilePageData
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_enabled 
ON public.two_factor_auth(user_id, enabled);

-- Add index for user_preferences lookups
-- Speeds up preferences fetch in getProfilePageData
CREATE INDEX IF NOT EXISTS idx_user_preferences_user 
ON public.user_preferences(user_id);

-- Analyze tables to update statistics for query planner
ANALYZE public.users;
ANALYZE public.profiles;
ANALYZE public.images;
ANALYZE public.user_roles;
ANALYZE public.role_permissions;
ANALYZE public.permissions;
ANALYZE public.user_favorites;
ANALYZE public.user_posts;
ANALYZE public.user_photos;
ANALYZE public.two_factor_auth;
ANALYZE public.user_preferences;

