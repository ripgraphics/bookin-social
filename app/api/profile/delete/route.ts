import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const { confirmationText } = body;

    if (confirmationText !== 'DELETE') {
      return NextResponse.json({ error: 'Invalid confirmation text' }, { status: 400 });
    }

    // Log deletion request
    await logActivityFromRequest(
      publicUser.id,
      'account_deletion_requested',
      'Account deletion requested',
      request
    );

    // In a production environment, you would implement a soft delete with a grace period
    // For now, we'll just mark the account for deletion and log the request
    
    // Update user status to mark for deletion
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'pending_deletion',
        deletion_requested_at: new Date().toISOString(),
      })
      .eq('id', publicUser.id);

    if (updateError) {
      console.error('[POST /api/profile/delete] Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // In a real implementation, you would:
    // 1. Send a confirmation email
    // 2. Set up a scheduled job to delete after grace period
    // 3. Anonymize or delete all related data
    // 4. Revoke all sessions
    // 5. Send final confirmation

    return NextResponse.json({ 
      message: 'Account deletion request submitted. You will receive a confirmation email shortly.',
      status: 'pending_deletion'
    });
  } catch (error: any) {
    console.error('[POST /api/profile/delete] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

