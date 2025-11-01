-- =====================================================
-- ROLLBACK RLS OPTIMIZATION
-- =====================================================
-- The current_user_id() function is causing MORE overhead
-- than the original subqueries. Rolling back to original.
-- =====================================================

-- Drop the problematic helper function (CASCADE to drop dependent policies first)
DROP FUNCTION IF EXISTS public.current_user_id() CASCADE;

-- Restore original RLS policies for profiles
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for images
DROP POLICY IF EXISTS images_insert_own ON public.images;
DROP POLICY IF EXISTS images_update_own ON public.images;
DROP POLICY IF EXISTS images_delete_own ON public.images;

CREATE POLICY images_insert_own ON public.images
  FOR INSERT WITH CHECK (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY images_update_own ON public.images
  FOR UPDATE USING (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY images_delete_own ON public.images
  FOR DELETE USING (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for listings
DROP POLICY IF EXISTS listings_insert_own ON public.listings;
DROP POLICY IF EXISTS listings_update_own ON public.listings;
DROP POLICY IF EXISTS listings_delete_own ON public.listings;

CREATE POLICY listings_insert_own ON public.listings
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY listings_update_own ON public.listings
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY listings_delete_own ON public.listings
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for reservations
DROP POLICY IF EXISTS reservations_select_own_or_listing_owner ON public.reservations;
DROP POLICY IF EXISTS reservations_insert_own ON public.reservations;
DROP POLICY IF EXISTS reservations_delete_own ON public.reservations;

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

CREATE POLICY reservations_insert_own ON public.reservations
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY reservations_delete_own ON public.reservations
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for user_favorites
DROP POLICY IF EXISTS user_favorites_select_own ON public.user_favorites;
DROP POLICY IF EXISTS user_favorites_insert_own ON public.user_favorites;
DROP POLICY IF EXISTS user_favorites_delete_own ON public.user_favorites;

CREATE POLICY user_favorites_select_own ON public.user_favorites
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY user_favorites_insert_own ON public.user_favorites
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY user_favorites_delete_own ON public.user_favorites
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for user_posts
DROP POLICY IF EXISTS "Users can insert own posts" ON public.user_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.user_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.user_posts;

CREATE POLICY "Users can insert own posts" ON public.user_posts
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own posts" ON public.user_posts
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own posts" ON public.user_posts
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for user_photos
DROP POLICY IF EXISTS "Users can insert own photos" ON public.user_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.user_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON public.user_photos;

CREATE POLICY "Users can insert own photos" ON public.user_photos
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own photos" ON public.user_photos
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photos" ON public.user_photos
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for two_factor_auth
DROP POLICY IF EXISTS "Users can view own 2FA settings" ON public.two_factor_auth;
DROP POLICY IF EXISTS "Users can insert own 2FA settings" ON public.two_factor_auth;
DROP POLICY IF EXISTS "Users can update own 2FA settings" ON public.two_factor_auth;

CREATE POLICY "Users can view own 2FA settings" ON public.two_factor_auth
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own 2FA settings" ON public.two_factor_auth
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own 2FA settings" ON public.two_factor_auth
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Restore original RLS policies for user_activity_log
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity_log;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.user_activity_log;

CREATE POLICY "Users can view own activity" ON public.user_activity_log
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activity logs" ON public.user_activity_log
  FOR INSERT WITH CHECK (true);

-- Restore original RLS policies for user_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

