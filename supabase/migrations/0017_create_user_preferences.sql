-- Migration: Create user_preferences table
-- Description: Store user notification and privacy preferences

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  show_email BOOLEAN DEFAULT false,
  show_phone BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Add comments
COMMENT ON TABLE public.user_preferences IS 'User notification and privacy preferences';
COMMENT ON COLUMN public.user_preferences.email_notifications IS 'Enable email notifications';
COMMENT ON COLUMN public.user_preferences.push_notifications IS 'Enable push notifications';
COMMENT ON COLUMN public.user_preferences.marketing_emails IS 'Enable marketing emails';
COMMENT ON COLUMN public.user_preferences.show_email IS 'Show email on public profile';
COMMENT ON COLUMN public.user_preferences.show_phone IS 'Show phone on public profile';

