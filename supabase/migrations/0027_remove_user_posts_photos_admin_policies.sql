-- ============================================================================
-- REMOVE RECURSIVE ADMIN POLICIES FROM USER_POSTS AND USER_PHOTOS
-- ============================================================================
-- Admin policies that check user_roles cause infinite recursion
-- Remove them and rely on user policies + service role for admin access
-- ============================================================================

-- Drop admin policies from user_posts
DROP POLICY IF EXISTS "Admins can view all posts" ON public.user_posts;
DROP POLICY IF EXISTS "Admins can update all posts" ON public.user_posts;
DROP POLICY IF EXISTS "Admins can delete all posts" ON public.user_posts;

-- Drop admin policies from user_photos
DROP POLICY IF EXISTS "Admins can view all photos" ON public.user_photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON public.user_photos;
DROP POLICY IF EXISTS "Admins can delete all photos" ON public.user_photos;

