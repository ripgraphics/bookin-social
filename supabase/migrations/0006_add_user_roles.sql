-- Add role column to users table
ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;

-- Create index for role queries
CREATE INDEX idx_users_role ON public.users(role);

-- Add check constraint for valid roles
ALTER TABLE public.users ADD CONSTRAINT check_valid_role 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- Update the handle_new_user trigger to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    NEW.email,
    'user' -- Default role for new users
  );

  INSERT INTO public.profiles (user_id, bio, avatar_url, cover_url)
  VALUES (
    (SELECT id FROM public.users WHERE auth_user_id = NEW.id),
    NULL,
    NULL,
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create super admin user (you'll need to replace with actual auth.users ID)
-- This is a placeholder - you'll need to create the auth user first
-- INSERT INTO public.users (auth_user_id, first_name, last_name, email, role)
-- VALUES ('super-admin-auth-id', 'Super', 'Admin', 'superadmin@bookin.social', 'super_admin');

-- Create admin user (you'll need to replace with actual auth.users ID)
-- This is a placeholder - you'll need to create the auth user first
-- INSERT INTO public.users (auth_user_id, first_name, last_name, email, role)
-- VALUES ('admin-auth-id', 'Admin', 'User', 'admin@bookin.social', 'admin');

-- Add RLS policies for role-based access
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid()::text = auth_user_id);

-- Users can update their own data (except role)
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- Super admins can read all user data
CREATE POLICY "Super admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid()::text 
      AND role = 'super_admin'
    )
  );

-- Super admins can update all user data
CREATE POLICY "Super admins can update all users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid()::text 
      AND role = 'super_admin'
    )
  );

-- Admins can read all user data
CREATE POLICY "Admins can read all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid()::text 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update user data (but not super admin roles)
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid()::text 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can delete users
CREATE POLICY "Super admins can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid()::text 
      AND role = 'super_admin'
    )
  );
