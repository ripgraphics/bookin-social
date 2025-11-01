import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateProfileCompletion } from '@/app/(admin)/admin/apps/profile/utils/profileCompletion';
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
      .select('id, first_name, last_name, email')
      .eq('auth_user_id', user.id)
      .single();

    if (!publicUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parallelize profile data fetching for better performance
    const [
      { data: profile, error: profileError },
      { data: preferences },
      { data: twoFactor }
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', publicUser.id)
        .single(),
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', publicUser.id)
        .single(),
      supabase
        .from('two_factor_auth')
        .select('enabled')
        .eq('user_id', publicUser.id)
        .single()
    ]);

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[GET /api/profile] Error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Calculate profile completion
    const profileData = {
      ...(profile || {}),
      email_verified: user.email_confirmed_at !== null,
      two_factor_enabled: twoFactor?.enabled || false,
    };
    
    const completionPercentage = calculateProfileCompletion(profileData);

    // Update completion percentage if it has changed
    if (profile && profile.profile_completion_percentage !== completionPercentage) {
      await supabase
        .from('profiles')
        .update({ profile_completion_percentage: completionPercentage })
        .eq('user_id', publicUser.id);
    }

    const response = {
      ...publicUser,
      profile: profile || {},
      preferences: preferences || {},
      profile_completion_percentage: completionPercentage,
      two_factor_enabled: twoFactor?.enabled || false,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[GET /api/profile] Error:', error);
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
      bio,
      phone,
      location,
      website,
      job_title,
      company,
      linkedin_url,
      twitter_url,
      facebook_url,
      instagram_url,
      profile_visibility,
    } = body;

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', publicUser.id)
      .single();

    let profileData;
    if (existingProfile) {
      // Update existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          bio,
          phone,
          location,
          website,
          job_title,
          company,
          linkedin_url,
          twitter_url,
          facebook_url,
          instagram_url,
          profile_visibility,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', publicUser.id)
        .select()
        .single();

      if (profileError) {
        console.error('[PATCH /api/profile] Error:', profileError);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      profileData = profile;
    } else {
      // Create new profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: publicUser.id,
          bio,
          phone,
          location,
          website,
          job_title,
          company,
          linkedin_url,
          twitter_url,
          facebook_url,
          instagram_url,
          profile_visibility,
        })
        .select()
        .single();

      if (profileError) {
        console.error('[PATCH /api/profile] Error:', profileError);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      profileData = profile;
    }

    // Log activity
    await logActivityFromRequest(
      publicUser.id,
      'profile_update',
      'Profile information updated',
      request,
      { fields_updated: Object.keys(body) }
    );

    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error('[PATCH /api/profile] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
