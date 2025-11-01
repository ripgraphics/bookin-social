import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivityFromRequest } from '@/lib/activityLogger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's public.users id
    const { data: publicUser } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Collect all user data
    const exportData: any = {
      export_date: new Date().toISOString(),
      user_id: publicUser.id,
      auth_user_id: user.id,
    };

    // Get user basic info
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', publicUser.id)
      .single();
    exportData.user = userData;

    // Get profile data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', publicUser.id)
      .single();
    exportData.profile = profileData;

    // Get preferences
    const { data: preferencesData } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', publicUser.id)
      .single();
    exportData.preferences = preferencesData;

    // Get 2FA data (without secrets)
    const { data: twoFactorData } = await supabase
      .from('two_factor_auth')
      .select('enabled, enabled_at, created_at')
      .eq('user_id', publicUser.id)
      .single();
    exportData.two_factor_auth = twoFactorData;

    // Get activity log
    const { data: activityData } = await supabase
      .from('user_activity_log')
      .select('*')
      .eq('user_id', publicUser.id)
      .order('created_at', { ascending: false });
    exportData.activity_log = activityData;

    // Get sessions
    const { data: sessionsData } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', publicUser.id)
      .order('created_at', { ascending: false });
    exportData.sessions = sessionsData;

    // Get listings
    const { data: listingsData } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', publicUser.id)
      .order('created_at', { ascending: false });
    exportData.listings = listingsData;

    // Get reservations
    const { data: reservationsData } = await supabase
      .from('reservations')
      .select('*')
      .eq('user_id', publicUser.id)
      .order('created_at', { ascending: false });
    exportData.reservations = reservationsData;

    // Get favorites
    const { data: favoritesData } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', publicUser.id)
      .order('created_at', { ascending: false });
    exportData.favorites = favoritesData;

    // Log activity
    await logActivityFromRequest(
      publicUser.id,
      'data_export',
      'User data exported',
      request
    );

    // Return as downloadable JSON
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bookin-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    return response;
  } catch (error: any) {
    console.error('[GET /api/profile/export] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

