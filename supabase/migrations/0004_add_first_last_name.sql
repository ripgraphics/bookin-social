-- =====================================================
-- ADD FIRST_NAME AND LAST_NAME TO PUBLIC.USERS
-- =====================================================
-- Replace single 'name' field with 'first_name' and 'last_name' (both NOT NULL)
-- =====================================================

-- Step 1: Remove the 'name' column from public.users
ALTER TABLE public.users 
  DROP COLUMN IF EXISTS name;

-- Step 2: Add first_name and last_name columns with temporary defaults
ALTER TABLE public.users 
  ADD COLUMN first_name text NOT NULL DEFAULT '',
  ADD COLUMN last_name text NOT NULL DEFAULT '';

-- Step 3: Remove defaults so future inserts must provide values
ALTER TABLE public.users 
  ALTER COLUMN first_name DROP DEFAULT,
  ALTER COLUMN last_name DROP DEFAULT;

-- Step 4: Update the trigger function to extract first_name and last_name from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into public.users with first_name and last_name from metadata
  INSERT INTO public.users (auth_user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.created_at,
    NEW.updated_at
  )
  RETURNING id INTO new_user_id;

  -- Insert into public.profiles
  INSERT INTO public.profiles (user_id, created_at, updated_at)
  VALUES (new_user_id, NEW.created_at, NEW.updated_at);

  RETURN NEW;
END;
$$;

-- Verification: Check the columns
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'users'
-- AND column_name IN ('name', 'first_name', 'last_name')
-- ORDER BY column_name;

