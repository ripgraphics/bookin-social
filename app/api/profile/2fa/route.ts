import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generate2FASecret, verify2FAToken, verifyBackupCode, generateBackupCodes } from '@/lib/twoFactor';
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

    // Get 2FA status
    const { data: twoFactor, error } = await supabase
      .from('two_factor_auth')
      .select('enabled, enabled_at')
      .eq('user_id', publicUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[GET /api/profile/2fa] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      enabled: twoFactor?.enabled || false,
      enabled_at: twoFactor?.enabled_at || null,
    });
  } catch (error: any) {
    console.error('[GET /api/profile/2fa] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    const { action, token, code } = body;

    if (action === 'generate') {
      // Generate new 2FA secret
      const secretData = await generate2FASecret(user.email!);

      // Store encrypted secret in database
      const { data: twoFactor, error } = await supabase
        .from('two_factor_auth')
        .upsert({
          user_id: publicUser.id,
          secret: secretData.encryptedSecret,
          backup_codes: secretData.encryptedBackupCodes,
          enabled: false, // Not enabled until verified
        })
        .select()
        .single();

      if (error) {
        console.error('[POST /api/profile/2fa] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        qrCodeUrl: secretData.qrCodeUrl,
        backupCodes: secretData.backupCodes,
        secret: secretData.secret,
      });
    } else if (action === 'verify') {
      if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 });
      }

      // Get stored secret
      const { data: twoFactor, error } = await supabase
        .from('two_factor_auth')
        .select('secret')
        .eq('user_id', publicUser.id)
        .single();

      if (error || !twoFactor) {
        return NextResponse.json({ error: '2FA not set up' }, { status: 400 });
      }

      // Verify token
      const isValid = verify2FAToken(twoFactor.secret, token);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
      }

      // Enable 2FA
      const { error: updateError } = await supabase
        .from('two_factor_auth')
        .update({
          enabled: true,
          enabled_at: new Date().toISOString(),
        })
        .eq('user_id', publicUser.id);

      if (updateError) {
        console.error('[POST /api/profile/2fa] Error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Log activity
      await logActivityFromRequest(
        publicUser.id,
        '2fa_enabled',
        'Two-factor authentication enabled',
        request
      );

      return NextResponse.json({ message: '2FA enabled successfully' });
    } else if (action === 'verify_backup') {
      if (!code) {
        return NextResponse.json({ error: 'Missing backup code' }, { status: 400 });
      }

      // Get stored backup codes
      const { data: twoFactor, error } = await supabase
        .from('two_factor_auth')
        .select('backup_codes')
        .eq('user_id', publicUser.id)
        .single();

      if (error || !twoFactor) {
        return NextResponse.json({ error: '2FA not set up' }, { status: 400 });
      }

      // Verify backup code
      const result = verifyBackupCode(twoFactor.backup_codes, code);
      if (!result.valid) {
        return NextResponse.json({ error: 'Invalid backup code' }, { status: 400 });
      }

      // Update backup codes if some were used
      if (result.remainingCodes) {
        await supabase
          .from('two_factor_auth')
          .update({
            backup_codes: result.remainingCodes,
          })
          .eq('user_id', publicUser.id);
      }

      return NextResponse.json({ message: 'Backup code verified successfully' });
    } else if (action === 'regenerate_backup') {
      // Generate new backup codes
      const { backupCodes, encryptedBackupCodes } = generateBackupCodes();

      const { error: updateError } = await supabase
        .from('two_factor_auth')
        .update({
          backup_codes: encryptedBackupCodes,
        })
        .eq('user_id', publicUser.id);

      if (updateError) {
        console.error('[POST /api/profile/2fa] Error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ backupCodes });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[POST /api/profile/2fa] Error:', error);
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

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }

    // Get stored secret
    const { data: twoFactor, error } = await supabase
      .from('two_factor_auth')
      .select('secret')
      .eq('user_id', publicUser.id)
      .single();

    if (error || !twoFactor) {
      return NextResponse.json({ error: '2FA not set up' }, { status: 400 });
    }

    // Verify token before disabling
    const isValid = verify2FAToken(twoFactor.secret, token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Disable 2FA
    const { error: updateError } = await supabase
      .from('two_factor_auth')
      .update({
        enabled: false,
        enabled_at: null,
      })
      .eq('user_id', publicUser.id);

    if (updateError) {
      console.error('[DELETE /api/profile/2fa] Error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log activity
    await logActivityFromRequest(
      publicUser.id,
      '2fa_disabled',
      'Two-factor authentication disabled',
      request
    );

    return NextResponse.json({ message: '2FA disabled successfully' });
  } catch (error: any) {
    console.error('[DELETE /api/profile/2fa] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

