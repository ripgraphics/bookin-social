-- =====================================================
-- OPTIMIZE get_user_permissions RPC FUNCTION
-- =====================================================
-- This migration optimizes the slow get_user_permissions function
-- that is called on every page load and causes 2-3 second delays.
--
-- Changes:
-- 1. Add composite index for faster filtering
-- 2. Rewrite function to be more efficient
-- 3. Change from SECURITY DEFINER to STABLE for better performance
-- 4. Remove unnecessary DISTINCT (permissions are unique by design)
-- =====================================================

-- Create a helper function to get current user's public.users.id FIRST
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated;

-- Add composite index for user_roles to speed up active role lookups
-- Note: Cannot use NOW() in index predicate, so index all rows
CREATE INDEX IF NOT EXISTS idx_user_roles_user_expires 
ON public.user_roles(user_id, expires_at);

-- Add composite index for faster join performance
CREATE INDEX IF NOT EXISTS idx_user_roles_active 
ON public.user_roles(user_id, role_id);

-- Optimize the get_user_permissions function
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (permission_name TEXT) AS $$
  SELECT p.name
  FROM public.user_roles ur
  INNER JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  INNER JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
$$ LANGUAGE SQL STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_permissions(UUID) TO authenticated;
