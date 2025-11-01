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

    // Get user sessions
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', publicUser.id)
      .order('last_active', { ascending: false });

    if (error) {
      console.error('[GET /api/profile/sessions] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark current session (this is simplified - in production you'd match by session token)
    const sessionsWithCurrent = sessions?.map((session, index) => ({
      ...session,
      isCurrent: index === 0, // Assume first session is current
    })) || [];

    return NextResponse.json(sessionsWithCurrent);
  } catch (error: any) {
    console.error('[GET /api/profile/sessions] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const revokeAll = searchParams.get('revokeAll') === 'true';

    if (revokeAll) {
      // Revoke all sessions except current (simplified)
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', publicUser.id);

      if (error) {
        console.error('[DELETE /api/profile/sessions] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log activity
      await logActivityFromRequest(
        publicUser.id,
        'session_revoked',
        'All sessions revoked except current',
        request
      );

      return NextResponse.json({ message: 'All sessions revoked' });
    } else if (sessionId) {
      // Revoke specific session
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', publicUser.id);

      if (error) {
        console.error('[DELETE /api/profile/sessions] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Log activity
      await logActivityFromRequest(
        publicUser.id,
        'session_revoked',
        'Session revoked',
        request,
        { session_id: sessionId }
      );

      return NextResponse.json({ message: 'Session revoked' });
    } else {
      return NextResponse.json({ error: 'Missing sessionId or revokeAll parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[DELETE /api/profile/sessions] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

