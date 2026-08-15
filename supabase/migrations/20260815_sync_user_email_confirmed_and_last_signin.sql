/*
  # Sync user email_confirmed_at and last_sign_in_at from auth.users to public.profiles

  1. New Columns in `public.profiles`:
     - `email_confirmed_at` (timestamptz, nullable): Timestamp when the user confirmed their email address.
     - `last_sign_in_at` (timestamptz, nullable): Timestamp when the user last signed in.

  2. Triggers & Automation:
     - Update `handle_new_user()` trigger to copy `email_confirmed_at` and `last_sign_in_at` upon registration.
     - Create `handle_user_update()` trigger on `auth.users` (AFTER UPDATE) to automatically sync email confirmation status and last sign-in timestamp to `public.profiles`.

  3. Initial Backfill:
     - Sync existing `auth.users` confirmation and login metadata into `public.profiles`.
*/

-- Step 1: Add columns to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz,
ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

-- Step 2: Backfill existing profile data from auth.users
UPDATE public.profiles p
SET 
  email_confirmed_at = u.email_confirmed_at,
  last_sign_in_at = u.last_sign_in_at
FROM auth.users u
WHERE p.id = u.id;

-- Step 3: Update trigger for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, email_confirmed_at, last_sign_in_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'user',
    NEW.email_confirmed_at,
    NEW.last_sign_in_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    last_sign_in_at = EXCLUDED.last_sign_in_at;
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger for user updates (e.g. email confirmation or login)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email_confirmed_at = NEW.email_confirmed_at,
    last_sign_in_at = NEW.last_sign_in_at,
    email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();
