-- =====================================================
-- FIX RLS INFINITE RECURSION
-- =====================================================
-- This migration fixes the infinite recursion error in
-- RLS policies by removing redundant admin checks and
-- creating a SECURITY DEFINER function for role checks.
-- =====================================================

-- =====================================================
-- 1. DROP REDUNDANT ADMIN SELECT POLICIES
-- =====================================================
-- These policies cause recursion because they check user_roles
-- while user_roles itself has RLS policies that check user_roles.
-- The "Anyone can view active amenities" policy is sufficient
-- for public read access.

DROP POLICY IF EXISTS "Admins can view all amenity categories" ON public.amenity_categories;
DROP POLICY IF EXISTS "Admins can view all amenities" ON public.amenities;

-- =====================================================
-- 2. CREATE SECURITY DEFINER FUNCTION FOR ADMIN CHECK
-- =====================================================
-- This function bypasses RLS by running with elevated privileges,
-- preventing the circular dependency when checking roles.

CREATE OR REPLACE FUNCTION public.is_admin(user_auth_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.user_roles ur ON u.id = ur.user_id
        JOIN public.roles r ON ur.role_id = r.id
        WHERE u.auth_user_id = user_auth_id
        AND r.name IN ('super_admin', 'admin')
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. RECREATE AMENITY CATEGORY POLICIES WITH is_admin()
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert amenity categories" ON public.amenity_categories;
DROP POLICY IF EXISTS "Admins can update amenity categories" ON public.amenity_categories;
DROP POLICY IF EXISTS "Admins can delete amenity categories" ON public.amenity_categories;

-- Recreate with is_admin() function
CREATE POLICY "Admins can insert amenity categories"
    ON public.amenity_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update amenity categories"
    ON public.amenity_categories
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete amenity categories"
    ON public.amenity_categories
    FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- 4. RECREATE AMENITIES POLICIES WITH is_admin()
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert amenities" ON public.amenities;
DROP POLICY IF EXISTS "Admins can update amenities" ON public.amenities;
DROP POLICY IF EXISTS "Admins can delete amenities" ON public.amenities;

-- Recreate with is_admin() function
CREATE POLICY "Admins can insert amenities"
    ON public.amenities
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update amenities"
    ON public.amenities
    FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete amenities"
    ON public.amenities
    FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- 5. RECREATE LISTING AMENITIES ADMIN POLICY
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage all listing amenities" ON public.listing_amenities;

-- Recreate with is_admin() function
CREATE POLICY "Admins can manage all listing amenities"
    ON public.listing_amenities
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- ✅ Removed redundant admin SELECT policies
-- ✅ Created is_admin() SECURITY DEFINER function
-- ✅ Updated all admin write policies to use is_admin()
-- ✅ Public users can still view active amenities
-- ✅ Admins can still manage amenities via admin endpoints
-- =====================================================


