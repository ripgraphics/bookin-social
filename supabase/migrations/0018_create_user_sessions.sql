-- Migration: Create user_sessions table
-- Description: Track active user sessions for security monitoring

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  location TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions
  FOR DELETE
  USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "System can insert sessions"
  ON public.user_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sessions"
  ON public.user_sessions
  FOR UPDATE
  USING (true);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.user_sessions IS 'Active user sessions for security monitoring';
COMMENT ON COLUMN public.user_sessions.session_token IS 'Unique session identifier';
COMMENT ON COLUMN public.user_sessions.device_info IS 'Device and browser information';
COMMENT ON COLUMN public.user_sessions.ip_address IS 'IP address of the session';
COMMENT ON COLUMN public.user_sessions.location IS 'Geographic location (city, country)';
COMMENT ON COLUMN public.user_sessions.last_active IS 'Last activity timestamp';
COMMENT ON COLUMN public.user_sessions.expires_at IS 'Session expiration timestamp';

