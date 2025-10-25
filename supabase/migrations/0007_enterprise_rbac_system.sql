-- ============================================================================
-- ENTERPRISE-GRADE RBAC SYSTEM - TABLE CREATION
-- ============================================================================
-- This migration creates a flexible role-based access control system
-- with dedicated tables for roles, permissions, and role assignments.
-- ============================================================================

-- 1. ROLES TABLE
-- Stores system and custom roles
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON public.roles(is_system_role);

-- 2. PERMISSIONS TABLE
-- Stores all available permissions in the system
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    scope TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for permissions
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_scope ON public.permissions(scope);

-- 3. ROLE_PERMISSIONS TABLE
-- Many-to-many relationship between roles and permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- Create indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- 4. USER_ROLES TABLE
-- Assigns roles to users with optional expiration
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, role_id)
);

-- Create indexes for user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON public.user_roles(expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all RBAC tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ROLES TABLE POLICIES
-- Anyone can read roles
CREATE POLICY "Anyone can read roles" ON public.roles
    FOR SELECT USING (true);

-- Only super_admins can create, update, delete roles
CREATE POLICY "Super admins can manage roles" ON public.roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            AND r.name = 'super_admin'
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        )
    );

-- PERMISSIONS TABLE POLICIES
-- Anyone can read permissions
CREATE POLICY "Anyone can read permissions" ON public.permissions
    FOR SELECT USING (true);

-- Only super_admins can manage permissions
CREATE POLICY "Super admins can manage permissions" ON public.permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            AND r.name = 'super_admin'
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        )
    );

-- ROLE_PERMISSIONS TABLE POLICIES
-- Anyone can read role-permission mappings
CREATE POLICY "Anyone can read role permissions" ON public.role_permissions
    FOR SELECT USING (true);

-- Only super_admins can manage role-permission mappings
CREATE POLICY "Super admins can manage role permissions" ON public.role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            AND r.name = 'super_admin'
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        )
    );

-- USER_ROLES TABLE POLICIES
-- Users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Admins and super_admins can read all user roles
CREATE POLICY "Admins can read all user roles" ON public.user_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            AND r.name IN ('admin', 'super_admin')
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        )
    );

-- Super_admins can assign any role
CREATE POLICY "Super admins can assign any role" ON public.user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            AND r.name = 'super_admin'
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        )
    );

-- Admins can assign non-super_admin roles
CREATE POLICY "Admins can assign non-super admin roles" ON public.user_roles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            AND r.name IN ('admin', 'super_admin')
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        )
        AND role_id NOT IN (
            SELECT id FROM public.roles WHERE name = 'super_admin'
        )
    );

-- Only super_admins can revoke roles
CREATE POLICY "Super admins can revoke roles" ON public.user_roles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            AND r.name = 'super_admin'
            AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on roles table
CREATE OR REPLACE FUNCTION public.update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_roles_updated_at();

-- Prevent deletion of system roles
CREATE OR REPLACE FUNCTION public.prevent_system_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_system_role = true THEN
        RAISE EXCEPTION 'Cannot delete system role: %', OLD.name;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_system_role_deletion
    BEFORE DELETE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_system_role_deletion();

-- Automatically assign default 'user' role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT NEW.id, r.id
    FROM public.roles r
    WHERE r.name = 'user'
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_default_role
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_role();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    p_user_id UUID,
    p_permission_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
        AND p.name = p_permission_name
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (permission_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS TABLE (
    role_id UUID,
    role_name TEXT,
    role_display_name TEXT,
    role_description TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        ur.assigned_at,
        ur.expires_at
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY r.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.roles IS 'Stores system and custom roles for RBAC';
COMMENT ON TABLE public.permissions IS 'Stores all available permissions in the system';
COMMENT ON TABLE public.role_permissions IS 'Many-to-many relationship between roles and permissions';
COMMENT ON TABLE public.user_roles IS 'Assigns roles to users with optional expiration';

COMMENT ON FUNCTION public.user_has_permission IS 'Checks if a user has a specific permission';
COMMENT ON FUNCTION public.get_user_permissions IS 'Returns all permissions for a user';
COMMENT ON FUNCTION public.get_user_roles IS 'Returns all active roles for a user';

