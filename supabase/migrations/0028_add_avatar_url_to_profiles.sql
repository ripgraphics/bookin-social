-- Migration: Add avatar_url column to profiles table
-- Description: Add avatar_url column to match cover_image_url pattern for direct URL storage

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.avatar_url IS 'Profile avatar image URL';

