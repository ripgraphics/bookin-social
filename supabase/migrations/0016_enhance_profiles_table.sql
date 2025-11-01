-- Migration: Enhance profiles table with enterprise fields
-- Description: Add comprehensive profile fields for enterprise-grade user profiles

-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'connections')),
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_profile_visibility ON public.profiles(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_profiles_completion ON public.profiles(profile_completion_percentage);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.profiles.location IS 'User location (city, country)';
COMMENT ON COLUMN public.profiles.website IS 'User personal or professional website';
COMMENT ON COLUMN public.profiles.job_title IS 'User job title';
COMMENT ON COLUMN public.profiles.company IS 'User company name';
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.profiles.twitter_url IS 'Twitter/X profile URL';
COMMENT ON COLUMN public.profiles.facebook_url IS 'Facebook profile URL';
COMMENT ON COLUMN public.profiles.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN public.profiles.profile_visibility IS 'Profile visibility setting: public, private, or connections';
COMMENT ON COLUMN public.profiles.profile_completion_percentage IS 'Calculated profile completion percentage (0-100)';
COMMENT ON COLUMN public.profiles.cover_image_url IS 'Profile cover/banner image URL';

