import { SafeUser } from '../types';

/**
 * Enterprise-Grade Permission Utility Functions
 * 
 * These functions provide a centralized way to check user permissions
 * throughout the application using the RBAC system.
 */

/**
 * Check if a user has a specific permission
 * @param user The current user object with permissions
 * @param permission The permission name to check (e.g., 'listings.edit.any')
 * @returns true if user has the permission, false otherwise
 */
export function hasPermission(user: SafeUser | null | undefined, permission: string): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  return user.permissions.includes(permission);
}

/**
 * Check if a user has ANY of the specified permissions
 * @param user The current user object with permissions
 * @param permissions Array of permission names
 * @returns true if user has at least one of the permissions
 */
export function hasAnyPermission(user: SafeUser | null | undefined, permissions: string[]): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  return permissions.some(permission => user.permissions!.includes(permission));
}

/**
 * Check if a user has ALL of the specified permissions
 * @param user The current user object with permissions
 * @param permissions Array of permission names
 * @returns true if user has all of the permissions
 */
export function hasAllPermissions(user: SafeUser | null | undefined, permissions: string[]): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  return permissions.every(permission => user.permissions!.includes(permission));
}

/**
 * Check if a user has a specific role
 * @param user The current user object with roles
 * @param roleName The role name to check (e.g., 'admin', 'super_admin')
 * @returns true if user has the role
 */
export function hasRole(user: SafeUser | null | undefined, roleName: string): boolean {
  if (!user || !user.roles) {
    return false;
  }
  
  return user.roles.some(role => role.name === roleName);
}

/**
 * Check if a user has ANY of the specified roles
 * @param user The current user object with roles
 * @param roleNames Array of role names
 * @returns true if user has at least one of the roles
 */
export function hasAnyRole(user: SafeUser | null | undefined, roleNames: string[]): boolean {
  if (!user || !user.roles) {
    return false;
  }
  
  return roleNames.some(roleName => 
    user.roles!.some(role => role.name === roleName)
  );
}

/**
 * Check if a user is an admin (admin or super_admin role)
 * @param user The current user object
 * @returns true if user is admin or super_admin
 */
export function isAdmin(user: SafeUser | null | undefined): boolean {
  return hasAnyRole(user, ['admin', 'super_admin']);
}

/**
 * Check if a user is a super admin
 * @param user The current user object
 * @returns true if user is super_admin
 */
export function isSuperAdmin(user: SafeUser | null | undefined): boolean {
  return hasRole(user, 'super_admin');
}

/**
 * Check if a user can edit a listing
 * @param user The current user object
 * @param listingOwnerId The ID of the listing owner
 * @returns true if user can edit the listing
 */
export function canEditListing(user: SafeUser | null | undefined, listingOwnerId: string): boolean {
  if (!user) {
    return false;
  }
  
  // Check if user owns the listing and has edit.own permission
  const isOwner = user.id === listingOwnerId;
  if (isOwner && hasPermission(user, 'listings.edit.own')) {
    return true;
  }
  
  // Check if user has edit.any permission (admin/super_admin)
  return hasPermission(user, 'listings.edit.any');
}

/**
 * Check if a user can delete a listing
 * @param user The current user object
 * @param listingOwnerId The ID of the listing owner
 * @returns true if user can delete the listing
 */
export function canDeleteListing(user: SafeUser | null | undefined, listingOwnerId: string): boolean {
  if (!user) {
    return false;
  }
  
  // Check if user owns the listing and has delete.own permission
  const isOwner = user.id === listingOwnerId;
  if (isOwner && hasPermission(user, 'listings.delete.own')) {
    return true;
  }
  
  // Check if user has delete.any permission (admin/super_admin)
  return hasPermission(user, 'listings.delete.any');
}

/**
 * Check if a user can access the admin dashboard
 * @param user The current user object
 * @returns true if user can access admin dashboard
 */
export function canAccessAdminDashboard(user: SafeUser | null | undefined): boolean {
  return hasPermission(user, 'admin.dashboard.access');
}

/**
 * Check if a user can manage other users
 * @param user The current user object
 * @returns true if user can manage users
 */
export function canManageUsers(user: SafeUser | null | undefined): boolean {
  return hasPermission(user, 'admin.users.manage');
}

/**
 * Check if a user can manage roles
 * @param user The current user object
 * @returns true if user can manage roles
 */
export function canManageRoles(user: SafeUser | null | undefined): boolean {
  return hasPermission(user, 'users.roles.manage');
}

/**
 * Check if a user can edit another user's profile
 * @param user The current user object
 * @param targetUserId The ID of the user to be edited
 * @returns true if user can edit the profile
 */
export function canEditUserProfile(user: SafeUser | null | undefined, targetUserId: string): boolean {
  if (!user) {
    return false;
  }
  
  // Check if user is editing their own profile
  const isOwnProfile = user.id === targetUserId;
  if (isOwnProfile && hasPermission(user, 'users.edit.own')) {
    return true;
  }
  
  // Check if user has edit.any permission (super_admin)
  return hasPermission(user, 'users.edit.any');
}

/**
 * Get a user-friendly role name
 * @param user The current user object
 * @returns The highest role name or 'User'
 */
export function getUserRoleDisplay(user: SafeUser | null | undefined): string {
  if (!user || !user.roles || user.roles.length === 0) {
    return 'User';
  }
  
  // Priority order for displaying roles
  const rolePriority = ['super_admin', 'admin', 'moderator', 'user'];
  
  for (const roleName of rolePriority) {
    const role = user.roles.find(r => r.name === roleName);
    if (role) {
      return role.display_name;
    }
  }
  
  return user.roles[0].display_name || 'User';
}

/**
 * Get all role names for a user
 * @param user The current user object
 * @returns Array of role names
 */
export function getUserRoleNames(user: SafeUser | null | undefined): string[] {
  if (!user || !user.roles) {
    return [];
  }
  
  return user.roles.map(role => role.name);
}

