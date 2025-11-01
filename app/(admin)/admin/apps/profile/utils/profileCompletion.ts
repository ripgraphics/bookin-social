export interface ProfileData {
  avatar_url?: string | null;
  cover_image_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  job_title?: string | null;
  company?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  email_verified?: boolean;
  two_factor_enabled?: boolean;
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile: ProfileData): number {
  let score = 0;

  // Avatar uploaded (10%)
  if (profile.avatar_url) {
    score += 10;
  }

  // Cover image uploaded (5%)
  if (profile.cover_image_url) {
    score += 5;
  }

  // Bio filled (10%)
  if (profile.bio && profile.bio.trim().length > 0) {
    score += 10;
  }

  // Phone filled (10%)
  if (profile.phone && profile.phone.trim().length > 0) {
    score += 10;
  }

  // Location filled (10%)
  if (profile.location && profile.location.trim().length > 0) {
    score += 10;
  }

  // Website filled (5%)
  if (profile.website && profile.website.trim().length > 0) {
    score += 5;
  }

  // Job title filled (10%)
  if (profile.job_title && profile.job_title.trim().length > 0) {
    score += 10;
  }

  // Company filled (10%)
  if (profile.company && profile.company.trim().length > 0) {
    score += 10;
  }

  // At least 2 social links (10%)
  const socialLinks = [
    profile.linkedin_url,
    profile.twitter_url,
    profile.facebook_url,
    profile.instagram_url,
  ].filter(link => link && link.trim().length > 0);
  
  if (socialLinks.length >= 2) {
    score += 10;
  }

  // Email verified (10%)
  if (profile.email_verified) {
    score += 10;
  }

  // 2FA enabled (10%)
  if (profile.two_factor_enabled) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Get profile completion status message
 */
export function getProfileCompletionMessage(percentage: number): string {
  if (percentage === 100) {
    return 'Your profile is complete!';
  } else if (percentage >= 80) {
    return 'Almost there! Just a few more details.';
  } else if (percentage >= 60) {
    return 'Good progress! Keep going.';
  } else if (percentage >= 40) {
    return 'You\'re halfway there!';
  } else if (percentage >= 20) {
    return 'Let\'s add more information to your profile.';
  } else {
    return 'Complete your profile to get started.';
  }
}

/**
 * Get missing profile fields
 */
export function getMissingProfileFields(profile: ProfileData): string[] {
  const missing: string[] = [];

  if (!profile.avatar_url) {
    missing.push('Profile picture');
  }
  if (!profile.cover_image_url) {
    missing.push('Cover image');
  }
  if (!profile.bio || profile.bio.trim().length === 0) {
    missing.push('Bio');
  }
  if (!profile.phone || profile.phone.trim().length === 0) {
    missing.push('Phone number');
  }
  if (!profile.location || profile.location.trim().length === 0) {
    missing.push('Location');
  }
  if (!profile.website || profile.website.trim().length === 0) {
    missing.push('Website');
  }
  if (!profile.job_title || profile.job_title.trim().length === 0) {
    missing.push('Job title');
  }
  if (!profile.company || profile.company.trim().length === 0) {
    missing.push('Company');
  }

  const socialLinks = [
    profile.linkedin_url,
    profile.twitter_url,
    profile.facebook_url,
    profile.instagram_url,
  ].filter(link => link && link.trim().length > 0);
  
  if (socialLinks.length < 2) {
    missing.push('At least 2 social media links');
  }

  if (!profile.email_verified) {
    missing.push('Email verification');
  }

  if (!profile.two_factor_enabled) {
    missing.push('Two-factor authentication');
  }

  return missing;
}

/**
 * Get profile completion color for UI
 */
export function getProfileCompletionColor(percentage: number): string {
  if (percentage === 100) {
    return 'text-green-600';
  } else if (percentage >= 80) {
    return 'text-emerald-600';
  } else if (percentage >= 60) {
    return 'text-blue-600';
  } else if (percentage >= 40) {
    return 'text-yellow-600';
  } else {
    return 'text-orange-600';
  }
}

