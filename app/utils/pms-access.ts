import { SafeUser } from '../types';

/**
 * Property Management System (PMS) Access Control Utilities
 * 
 * These functions determine user access to PMS features based on their roles
 * and relationships to properties (owner, host, co-host, guest).
 */

/**
 * Check if user is a property owner
 * Property owners are users who have listings in the system
 */
export async function isPropertyOwner(userId: string): Promise<boolean> {
  // This will be implemented with a database query
  // For now, we'll check if they have any listings
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('property_management')
      .select('id')
      .eq('owner_id', userId)
      .limit(1);
    
    return !error && data && data.length > 0;
  } catch (error) {
    console.error('[isPropertyOwner] Error:', error);
    return false;
  }
}

/**
 * Check if user is a host (assigned to manage properties)
 */
export async function isHost(userId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('property_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'host')
      .eq('status', 'active')
      .limit(1);
    
    return !error && data && data.length > 0;
  } catch (error) {
    console.error('[isHost] Error:', error);
    return false;
  }
}

/**
 * Check if user is a co-host (assigned to assist with property management)
 */
export async function isCoHost(userId: string): Promise<boolean> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('property_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'co_host')
      .eq('status', 'active')
      .limit(1);
    
    return !error && data && data.length > 0;
  } catch (error) {
    console.error('[isCoHost] Error:', error);
    return false;
  }
}

/**
 * Check if user has any PMS role (owner, host, or co-host)
 */
export async function isPMSUser(userId: string): Promise<boolean> {
  const [owner, host, coHost] = await Promise.all([
    isPropertyOwner(userId),
    isHost(userId),
    isCoHost(userId)
  ]);
  
  return owner || host || coHost;
}

/**
 * Check if user can access the frontend PMS
 * Users can access if they are owners, hosts, co-hosts, or have made reservations
 */
export async function canAccessPMS(user: SafeUser | null | undefined): Promise<boolean> {
  if (!user || !user.id) {
    return false;
  }
  
  // Check if user has any PMS role
  const hasPMSRole = await isPMSUser(user.id);
  if (hasPMSRole) {
    return true;
  }
  
  // Check if user has any reservations (guests can view their rental invoices)
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    return !error && data && data.length > 0;
  } catch (error) {
    console.error('[canAccessPMS] Error checking reservations:', error);
    return false;
  }
}

/**
 * Get the primary PMS role for a user
 * Priority: owner > host > co_host > guest
 */
export async function getPMSRole(userId: string): Promise<'owner' | 'host' | 'co_host' | 'guest' | null> {
  const [owner, host, coHost] = await Promise.all([
    isPropertyOwner(userId),
    isHost(userId),
    isCoHost(userId)
  ]);
  
  if (owner) return 'owner';
  if (host) return 'host';
  if (coHost) return 'co_host';
  
  // Check if they have reservations (guest)
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    if (!error && data && data.length > 0) {
      return 'guest';
    }
  } catch (error) {
    console.error('[getPMSRole] Error checking reservations:', error);
  }
  
  return null;
}

/**
 * Client-side version: Check if user has PMS access based on cached user data
 * This is a quick check that doesn't require database queries
 */
export function canAccessPMSClient(user: SafeUser | null | undefined): boolean {
  if (!user) {
    return false;
  }
  
  // Check if user has admin role (admins can always access)
  if (user.roles && user.roles.some(role => 
    role.name === 'admin' || role.name === 'super_admin'
  )) {
    return true;
  }
  
  // For non-admins, we'll need to check the database
  // This function should be used with caution on the client side
  // Prefer server-side checks for actual access control
  return false;
}

/**
 * Check if user is an admin (for admin PMS access)
 */
export function isAdmin(user: SafeUser | null | undefined): boolean {
  if (!user || !user.roles) {
    return false;
  }
  
  return user.roles.some(role => 
    role.name === 'admin' || role.name === 'super_admin'
  );
}

/**
 * Get user's property IDs (for owners)
 */
export async function getUserPropertyIds(userId: string): Promise<string[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('property_management')
      .select('listing_id')
      .eq('owner_id', userId);
    
    if (error || !data) {
      return [];
    }
    
    return data.map(p => p.listing_id);
  } catch (error) {
    console.error('[getUserPropertyIds] Error:', error);
    return [];
  }
}

/**
 * Get user's assigned property IDs (for hosts/co-hosts)
 */
export async function getUserAssignedPropertyIds(userId: string): Promise<string[]> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('property_assignments')
      .select('property_id')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error || !data) {
      return [];
    }
    
    return data.map(p => p.property_id);
  } catch (error) {
    console.error('[getUserAssignedPropertyIds] Error:', error);
    return [];
  }
}

