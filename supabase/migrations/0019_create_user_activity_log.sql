-- Migration: Create user_activity_log table
-- Description: Track user activities for security and audit purposes

-- Create user_activity_log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  ip_address TEXT,
  location TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action_type ON public.user_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_created ON public.user_activity_log(user_id, created_at);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own activity log"
  ON public.user_activity_log
  FOR SELECT
  USING (auth.uid() IN (SELECT auth_user_id FROM public.users WHERE id = user_id));

CREATE POLICY "System can insert activity log"
  ON public.user_activity_log
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON public.user_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      JOIN public.users u ON ur.user_id = u.id
      WHERE u.auth_user_id = auth.uid()
      AND r.name IN ('admin', 'super_admin')
    )
  );

-- Create function to log activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action_type TEXT,
  p_description TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.user_activity_log (
    user_id,
    action_type,
    description,
    ip_address,
    location,
    metadata
  ) VALUES (
    p_user_id,
    p_action_type,
    p_description,
    p_ip_address,
    p_location,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old activity logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_activity_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.user_activity_log IS 'User activity log for security and audit purposes';
COMMENT ON COLUMN public.user_activity_log.action_type IS 'Type of action (login, profile_update, password_change, etc.)';
COMMENT ON COLUMN public.user_activity_log.description IS 'Human-readable description of the action';
COMMENT ON COLUMN public.user_activity_log.ip_address IS 'IP address where action was performed';
COMMENT ON COLUMN public.user_activity_log.location IS 'Geographic location (city, country)';
COMMENT ON COLUMN public.user_activity_log.metadata IS 'Additional metadata about the action (JSON)';

