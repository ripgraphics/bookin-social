-- ============================================================================
-- ENTERPRISE-GRADE RBAC SYSTEM - SEED DATA
-- ============================================================================
-- This migration populates initial roles, permissions, and role-permission
-- mappings for the RBAC system.
-- ============================================================================

-- ============================================================================
-- 1. SEED SYSTEM ROLES
-- ============================================================================

INSERT INTO public.roles (name, display_name, description, is_system_role) VALUES
('user', 'User', 'Standard user with basic permissions', true),
('moderator', 'Moderator', 'Can moderate content and assist users', true),
('admin', 'Administrator', 'Can manage listings, users, and most system features', true),
('super_admin', 'Super Administrator', 'Full system access including role management', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. SEED PERMISSIONS
-- ============================================================================

-- LISTING PERMISSIONS
INSERT INTO public.permissions (name, resource, action, scope, description) VALUES
('listings.create.own', 'listings', 'create', 'own', 'Create own listings'),
('listings.read.any', 'listings', 'read', 'any', 'View any listing'),
('listings.read.own', 'listings', 'read', 'own', 'View own listings'),
('listings.edit.own', 'listings', 'update', 'own', 'Edit own listings'),
('listings.edit.any', 'listings', 'update', 'any', 'Edit any listing'),
('listings.delete.own', 'listings', 'delete', 'own', 'Delete own listings'),
('listings.delete.any', 'listings', 'delete', 'any', 'Delete any listing'),
('listings.moderate', 'listings', 'moderate', 'any', 'Moderate listings (hide/show)'),

-- USER PERMISSIONS
('users.read.own', 'users', 'read', 'own', 'View own profile'),
('users.read.any', 'users', 'read', 'any', 'View any user profile'),
('users.edit.own', 'users', 'update', 'own', 'Edit own profile'),
('users.edit.any', 'users', 'update', 'any', 'Edit any user profile'),
('users.delete.any', 'users', 'delete', 'any', 'Delete users'),
('users.roles.manage', 'users', 'roles', 'manage', 'Assign and revoke user roles'),
('users.suspend', 'users', 'suspend', 'any', 'Suspend/ban users'),

-- RESERVATION PERMISSIONS
('reservations.create.own', 'reservations', 'create', 'own', 'Create reservations'),
('reservations.read.own', 'reservations', 'read', 'own', 'View own reservations'),
('reservations.read.any', 'reservations', 'read', 'any', 'View all reservations'),
('reservations.update.own', 'reservations', 'update', 'own', 'Update own reservations'),
('reservations.update.any', 'reservations', 'update', 'any', 'Update any reservation'),
('reservations.delete.own', 'reservations', 'delete', 'own', 'Cancel own reservations'),
('reservations.delete.any', 'reservations', 'delete', 'any', 'Cancel any reservation'),

-- ADMIN DASHBOARD PERMISSIONS
('admin.dashboard.access', 'admin', 'read', 'any', 'Access admin dashboard'),
('admin.users.manage', 'admin', 'manage', 'users', 'Manage users in admin dashboard'),
('admin.roles.manage', 'admin', 'manage', 'roles', 'Manage roles in admin dashboard'),
('admin.permissions.manage', 'admin', 'manage', 'permissions', 'Manage permissions in admin dashboard'),
('admin.stats.view', 'admin', 'read', 'stats', 'View system statistics'),
('admin.logs.view', 'admin', 'read', 'logs', 'View system logs'),

-- CONTENT MODERATION PERMISSIONS
('content.reports.view', 'content', 'read', 'reports', 'View reported content'),
('content.reports.resolve', 'content', 'update', 'reports', 'Resolve content reports'),
('content.flag', 'content', 'flag', 'any', 'Flag content for review'),

-- FAVORITE PERMISSIONS
('favorites.create.own', 'favorites', 'create', 'own', 'Add to favorites'),
('favorites.read.own', 'favorites', 'read', 'own', 'View own favorites'),
('favorites.delete.own', 'favorites', 'delete', 'own', 'Remove from favorites')

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- ============================================================================

-- USER ROLE PERMISSIONS (Basic user)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'user'
AND p.name IN (
    -- Listings
    'listings.create.own',
    'listings.read.any',
    'listings.read.own',
    'listings.edit.own',
    'listings.delete.own',
    
    -- Users
    'users.read.own',
    'users.read.any',
    'users.edit.own',
    
    -- Reservations
    'reservations.create.own',
    'reservations.read.own',
    'reservations.update.own',
    'reservations.delete.own',
    
    -- Favorites
    'favorites.create.own',
    'favorites.read.own',
    'favorites.delete.own',
    
    -- Content
    'content.flag'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MODERATOR ROLE PERMISSIONS (All user permissions + moderation)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'moderator'
AND p.name IN (
    -- All user permissions
    'listings.create.own',
    'listings.read.any',
    'listings.read.own',
    'listings.edit.own',
    'listings.delete.own',
    'users.read.own',
    'users.read.any',
    'users.edit.own',
    'reservations.create.own',
    'reservations.read.own',
    'reservations.update.own',
    'reservations.delete.own',
    'favorites.create.own',
    'favorites.read.own',
    'favorites.delete.own',
    'content.flag',
    
    -- Moderation permissions
    'listings.moderate',
    'content.reports.view',
    'content.reports.resolve',
    'reservations.read.any',
    'admin.dashboard.access',
    'admin.stats.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ADMIN ROLE PERMISSIONS (Most permissions except super admin functions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin'
AND p.name IN (
    -- All user permissions
    'listings.create.own',
    'listings.read.any',
    'listings.read.own',
    'listings.edit.own',
    'listings.delete.own',
    'users.read.own',
    'users.read.any',
    'users.edit.own',
    'reservations.create.own',
    'reservations.read.own',
    'reservations.update.own',
    'reservations.delete.own',
    'favorites.create.own',
    'favorites.read.own',
    'favorites.delete.own',
    'content.flag',
    
    -- All moderator permissions
    'listings.moderate',
    'content.reports.view',
    'content.reports.resolve',
    
    -- Admin-specific permissions
    'listings.edit.any',
    'listings.delete.any',
    'users.edit.any',
    'users.suspend',
    'reservations.read.any',
    'reservations.update.any',
    'reservations.delete.any',
    'admin.dashboard.access',
    'admin.users.manage',
    'admin.stats.view',
    'admin.logs.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- SUPER_ADMIN ROLE PERMISSIONS (All permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (Commented out - uncomment to verify)
-- ============================================================================

-- View all roles
-- SELECT * FROM public.roles ORDER BY name;

-- View all permissions by resource
-- SELECT resource, COUNT(*) as permission_count
-- FROM public.permissions
-- GROUP BY resource
-- ORDER BY resource;

-- View permissions per role
-- SELECT 
--     r.name as role_name,
--     COUNT(rp.permission_id) as permission_count
-- FROM public.roles r
-- LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
-- GROUP BY r.name
-- ORDER BY r.name;

-- View detailed permissions for each role
-- SELECT 
--     r.name as role,
--     p.name as permission,
--     p.resource,
--     p.action,
--     p.scope
-- FROM public.roles r
-- JOIN public.role_permissions rp ON r.id = rp.role_id
-- JOIN public.permissions p ON rp.permission_id = p.id
-- ORDER BY r.name, p.resource, p.action;

