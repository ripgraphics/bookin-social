-- Migration: Create two_factor_auth table
-- Description: Store 2FA secrets and backup codes for enhanced security

-- Create two_factor_auth table
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL, -- Encrypted TOTP secret
  backup_codes TEXT[], -- Encrypted backup codes
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON public.two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled ON public.two_factor_auth(enabled);

-- Enable RLS
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own 2FA settings"
  ON public.two_factor_auth
  FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update their own 2FA settings"
  ON public.two_factor_auth
  FOR UPDATE
  USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert their own 2FA settings"
  ON public.two_factor_auth
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete their own 2FA settings"
  ON public.two_factor_auth
  FOR DELETE
  USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_two_factor_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER two_factor_auth_updated_at
  BEFORE UPDATE ON public.two_factor_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_two_factor_auth_updated_at();

-- Add comments
COMMENT ON TABLE public.two_factor_auth IS 'Two-factor authentication settings and secrets';
COMMENT ON COLUMN public.two_factor_auth.secret IS 'Encrypted TOTP secret key';
COMMENT ON COLUMN public.two_factor_auth.backup_codes IS 'Array of encrypted backup codes';
COMMENT ON COLUMN public.two_factor_auth.enabled IS 'Whether 2FA is currently enabled';
COMMENT ON COLUMN public.two_factor_auth.enabled_at IS 'Timestamp when 2FA was enabled';

