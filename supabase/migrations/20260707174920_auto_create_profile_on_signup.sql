/*
# Auto-create user profile on registration

## Summary
When a new user signs up via Supabase Auth, this migration automatically
creates a corresponding row in public.profiles so the rest of the app
can always find profile data for any authenticated user.

## Changes

### New Functions
- `public.handle_new_user()`: Trigger function. Inserts a profile row
  with id, email, and full_name (from user metadata) for every new
  auth.users entry. Role defaults to 'user'.

### New Triggers
- `on_auth_user_created` on `auth.users` (AFTER INSERT): Calls
  handle_new_user() for every new registration.

## Security
- SECURITY DEFINER + SET search_path = '' to safely insert into
  public.profiles from the auth schema context.
- ON CONFLICT (id) DO NOTHING makes the operation idempotent.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
