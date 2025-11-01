import { createClient } from '@/lib/supabase/server';

export type ActivityType =
  | 'login'
  | 'logout'
  | 'profile_update'
  | 'password_change'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'session_revoked'
  | 'preferences_update'
  | 'avatar_upload'
  | 'cover_image_upload'
  | 'account_deletion_requested'
  | 'data_export';

export interface ActivityLogEntry {
  actionType: ActivityType;
  description: string;
  ipAddress?: string;
  location?: string;
  metadata?: Record<string, any>;
}

/**
 * Log user activity
 */
export async function logActivity(
  userId: string,
  entry: ActivityLogEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_activity_log')
      .insert({
        user_id: userId,
        action_type: entry.actionType,
        description: entry.description,
        ip_address: entry.ipAddress,
        location: entry.location,
        metadata: entry.metadata || {},
      });

    if (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user activity log with pagination
 */
export async function getUserActivityLog(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    actionType?: ActivityType;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{
  activities: any[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const supabase = await createClient();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_activity_log')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.actionType) {
      query = query.eq('action_type', options.actionType);
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching activity log:', error);
      return {
        activities: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }

    return {
      activities: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error: any) {
    console.error('Error fetching activity log:', error);
    return {
      activities: [],
      total: 0,
      page: 1,
      totalPages: 0,
    };
  }
}

/**
 * Extract IP address from request
 */
export function getIPAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || undefined;
}

/**
 * Get location from IP address (simplified - you can integrate with a geolocation service)
 */
export async function getLocationFromIP(ipAddress: string): Promise<string | undefined> {
  // In production, integrate with a geolocation service like:
  // - ipapi.co
  // - ip-api.com
  // - MaxMind GeoIP2
  
  // For now, return undefined
  // TODO: Implement geolocation service integration
  return undefined;
}

/**
 * Log activity from API route
 */
export async function logActivityFromRequest(
  userId: string,
  actionType: ActivityType,
  description: string,
  request: Request,
  metadata?: Record<string, any>
): Promise<void> {
  const ipAddress = getIPAddress(request);
  const location = ipAddress ? await getLocationFromIP(ipAddress) : undefined;

  await logActivity(userId, {
    actionType,
    description,
    ipAddress,
    location,
    metadata,
  });
}

