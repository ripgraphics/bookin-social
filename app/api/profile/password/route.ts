import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPasswordValid } from '@/lib/password';
import { logActivityFromRequest } from '@/lib/activityLogger';

export async function POST(request: NextRequest) {
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing currentPassword or newPassword' }, { status: 400 });
    }

    // Validate new password
    if (!isPasswordValid(newPassword)) {
      return NextResponse.json({ 
        error: 'New password does not meet requirements. Must be at least 8 characters with uppercase, lowercase, number, and special character.' 
      }, { status: 400 });
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error('[POST /api/profile/password] Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log activity
    await logActivityFromRequest(
      publicUser.id,
      'password_change',
      'Password changed successfully',
      request
    );

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('[POST /api/profile/password] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

