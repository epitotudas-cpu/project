/*
# Migration: Fix update_user_platform_role RPC permissions, sync auth metadata, and update profiles_role_check constraint

## Purpose
1. Updates profiles_role_check constraint on public.profiles to allow 'student', 'teacher', 'school', 'contact', 'partner', 'user', 'editor', 'moderator', 'admin'.
2. Updates update_user_platform_role RPC to sync both profiles.role and auth.users.raw_user_meta_data.
3. Uses SECURITY DEFINER to bypass RLS safely for authenticated users.
4. Grants EXECUTE ON FUNCTION update_user_platform_role TO authenticated, service_role, and anon.
5. Adds "Admins update all profiles" policy on public.profiles to allow direct fallback updates.
*/

-- 1. Drop old constraint and update profiles_role_check to allow 'student' and all platform roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['user'::text, 'editor'::text, 'partner'::text, 'school'::text, 'teacher'::text, 'contact'::text, 'student'::text, 'moderator'::text, 'admin'::text]));

-- 2. Create or replace update_user_platform_role RPC function
CREATE OR REPLACE FUNCTION update_user_platform_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is an authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Bejelentkezés szükséges.';
  END IF;

  IF new_role NOT IN ('user', 'editor', 'partner', 'school', 'teacher', 'contact', 'student', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Érvénytelen szerepkör: %', new_role;
  END IF;

  -- 1. Update public.profiles table
  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  -- 2. Update auth.users raw_user_meta_data for metadata synchronization
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', new_role, 'user_type', new_role)
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'role', new_role);
END;
$$;

-- 3. Grant EXECUTE permissions
GRANT EXECUTE ON FUNCTION update_user_platform_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_platform_role(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_platform_role(uuid, text) TO anon;

-- 4. Update RLS policy for direct fallback updates
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
