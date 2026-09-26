/*
# Migration: Fix update_user_platform_role RPC permissions, sync auth metadata, and RLS policy

## Purpose
1. Updates update_user_platform_role RPC to sync both profiles.role and auth.users.raw_user_meta_data.
2. Checks admin role using profiles.role, auth.users metadata, or public.is_admin_role().
3. Adds "Admins update all profiles" policy on public.profiles to allow direct fallback updates.
4. Grants EXECUTE ON FUNCTION update_user_platform_role TO authenticated, service_role, and anon.
*/

CREATE OR REPLACE FUNCTION update_user_platform_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Get role from profiles for calling user
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  IF caller_role != 'admin' AND NOT public.is_admin_role() THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        (raw_user_meta_data->>'role') = 'admin' OR
        (raw_user_meta_data->>'user_type') = 'admin'
      )
    ) THEN
      RAISE EXCEPTION 'Hozzáférés megtagadva: Kizárólag Adminisztrátor módosíthatja a platform szerepköröket.';
    END IF;
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

-- Grant EXECUTE to all relevant database roles
GRANT EXECUTE ON FUNCTION update_user_platform_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_platform_role(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_platform_role(uuid, text) TO anon;

-- Ensure Admins can update profiles table directly if needed
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (
  public.is_admin_role() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  public.is_admin_role() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
