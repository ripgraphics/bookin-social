import zxcvbn from 'zxcvbn';
import { createClient } from '@supabase/supabase-js';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const result = zxcvbn(password);
  
  const strengthMap: Record<number, PasswordStrength['strength']> = {
    0: 'weak',
    1: 'weak',
    2: 'fair',
    3: 'good',
    4: 'strong',
  };

  const feedback: string[] = [];
  
  // Add specific feedback
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Include at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    feedback.push('Include at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Include at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Include at least one special character');
  }

  // Add zxcvbn feedback
  if (result.feedback.warning) {
    feedback.push(result.feedback.warning);
  }
  result.feedback.suggestions.forEach(suggestion => {
    feedback.push(suggestion);
  });

  return {
    score: result.score,
    feedback,
    strength: strengthMap[result.score],
  };
}

/**
 * Validate password meets minimum requirements
 */
export function isPasswordValid(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  
  return true;
}

/**
 * Change user password (server-side only)
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate new password
    if (!isPasswordValid(newPassword)) {
      return {
        success: false,
        error: 'New password does not meet requirements',
      };
    }

    // Use Supabase Auth to update password
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: '', // Will be filled from user data
      password: currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to change password',
    };
  }
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: PasswordStrength['strength']): string {
  const colorMap: Record<PasswordStrength['strength'], string> = {
    'weak': 'bg-red-500',
    'fair': 'bg-orange-500',
    'good': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-emerald-500',
  };
  
  return colorMap[strength];
}

/**
 * Get password strength percentage for progress bar
 */
export function getPasswordStrengthPercentage(score: number): number {
  return (score / 4) * 100;
}

