-- ============================================================================
-- USER POSTS TABLE
-- ============================================================================
-- Table for user-generated social media posts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'post' CHECK (post_type IN ('post', 'photo', 'video', 'article')),
  content TEXT,
  image_urls TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_posts_user_id ON public.user_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_post_type ON public.user_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON public.user_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_posts_user_created ON public.user_posts(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view own posts" ON public.user_posts;
DROP POLICY IF EXISTS "Users can create own posts" ON public.user_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.user_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.user_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON public.user_posts;
DROP POLICY IF EXISTS "Admins can update all posts" ON public.user_posts;
DROP POLICY IF EXISTS "Admins can delete all posts" ON public.user_posts;

-- RLS Policies
-- Users can view their own posts
CREATE POLICY "Users can view own posts"
ON public.user_posts FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Users can create their own posts
CREATE POLICY "Users can create own posts"
ON public.user_posts FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON public.user_posts FOR UPDATE
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.user_posts FOR DELETE
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Admins can view all posts
CREATE POLICY "Admins can view all posts"
ON public.user_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Admins can update all posts
CREATE POLICY "Admins can update all posts"
ON public.user_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    JOIN public.users u ON ur.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Admins can delete all posts
CREATE POLICY "Admins can delete all posts"
ON public.user_posts FOR DELETE
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
DROP TRIGGER IF EXISTS update_user_posts_updated_at ON public.user_posts;

CREATE OR REPLACE FUNCTION update_user_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_posts_updated_at
  BEFORE UPDATE ON public.user_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_posts_updated_at();

