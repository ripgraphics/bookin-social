-- ============================================================================
-- USER PHOTOS TABLE
-- ============================================================================
-- Table for user-uploaded photos in their photo album
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  album_name TEXT DEFAULT 'default',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON public.user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_album_name ON public.user_photos(album_name);
CREATE INDEX IF NOT EXISTS idx_user_photos_created_at ON public.user_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_photos_user_created ON public.user_photos(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view own photos" ON public.user_photos;
DROP POLICY IF EXISTS "Users can create own photos" ON public.user_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.user_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON public.user_photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON public.user_photos;
DROP POLICY IF EXISTS "Admins can update all photos" ON public.user_photos;
DROP POLICY IF EXISTS "Admins can delete all photos" ON public.user_photos;

-- RLS Policies
-- Users can view their own photos
CREATE POLICY "Users can view own photos"
ON public.user_photos FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Users can create their own photos
CREATE POLICY "Users can create own photos"
ON public.user_photos FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
ON public.user_photos FOR UPDATE
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON public.user_photos FOR DELETE
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Admins can view all photos
CREATE POLICY "Admins can view all photos"
ON public.user_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Admins can update all photos
CREATE POLICY "Admins can update all photos"
ON public.user_photos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Admins can delete all photos
CREATE POLICY "Admins can delete all photos"
ON public.user_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_user_photos_updated_at ON public.user_photos;

CREATE OR REPLACE FUNCTION update_user_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_photos_updated_at
  BEFORE UPDATE ON public.user_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_user_photos_updated_at();

