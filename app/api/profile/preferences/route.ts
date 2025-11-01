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

    // Get preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', publicUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[GET /api/profile/preferences] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      email_notifications: true,
      push_notifications: false,
      marketing_emails: false,
      show_email: false,
      show_phone: false,
    };

    return NextResponse.json(preferences || defaultPreferences);
  } catch (error: any) {
    console.error('[GET /api/profile/preferences] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const {
      email_notifications,
      push_notifications,
      marketing_emails,
      show_email,
      show_phone,
    } = body;

    // Check if preferences exist
    const { data: existingPreferences } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', publicUser.id)
      .single();

    let preferencesData;
    if (existingPreferences) {
      // Update existing preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .update({
          email_notifications,
          push_notifications,
          marketing_emails,
          show_email,
          show_phone,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', publicUser.id)
        .select()
        .single();

      if (preferencesError) {
        console.error('[PATCH /api/profile/preferences] Error:', preferencesError);
        return NextResponse.json({ error: preferencesError.message }, { status: 500 });
      }

      preferencesData = preferences;
    } else {
      // Create new preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: publicUser.id,
          email_notifications,
          push_notifications,
          marketing_emails,
          show_email,
          show_phone,
        })
        .select()
        .single();

      if (preferencesError) {
        console.error('[PATCH /api/profile/preferences] Error:', preferencesError);
        return NextResponse.json({ error: preferencesError.message }, { status: 500 });
      }

      preferencesData = preferences;
    }

    // Log activity
    await logActivityFromRequest(
      publicUser.id,
      'preferences_update',
      'Notification and privacy preferences updated',
      request,
      { preferences_updated: Object.keys(body) }
    );

    return NextResponse.json(preferencesData);
  } catch (error: any) {
    console.error('[PATCH /api/profile/preferences] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

