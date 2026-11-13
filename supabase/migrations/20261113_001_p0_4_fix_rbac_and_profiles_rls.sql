/*
# Migration: P0-4 Fix update_user_platform_role RPC authorization & profiles UPDATE RLS

## Purpose
1. Secures both overloads of public.update_user_platform_role(text, text) and
   public.update_user_platform_role(uuid, text) so only authenticated admins
   (verified via public.is_admin_role()) or service_role can change roles.
2. Sets explicit SET search_path = '' on SECURITY DEFINER functions and revokes
   EXECUTE from PUBLIC and anon.
3. Replaces the overly permissive "Admins update all profiles" RLS policy
   (USING (true) WITH CHECK (true)) with USING (public.is_admin_role())
   WITH CHECK (public.is_admin_role()).
*/

CREATE OR REPLACE FUNCTION public.update_user_platform_role(target_user_id text, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_uuid uuid;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT public.is_admin_role() THEN
    RAISE EXCEPTION 'Nincs jogosultság a szerepkör módosításához.' USING ERRCODE = '42501';
  END IF;

  IF target_user_id IS NULL OR trim(target_user_id) = '' THEN
    RAISE EXCEPTION 'Érvénytelen felhasználói azonosító (UUID).';
  END IF;

  target_uuid := target_user_id::uuid;

  IF new_role NOT IN ('user', 'editor', 'partner', 'school', 'teacher', 'contact', 'student', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Érvénytelen szerepkör: %', new_role;
  END IF;

  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_uuid;

  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', new_role, 'user_type', new_role)
  WHERE id = target_uuid;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'role', new_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_platform_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND NOT public.is_admin_role() THEN
    RAISE EXCEPTION 'Nincs jogosultság a szerepkör módosításához.' USING ERRCODE = '42501';
  END IF;

  RETURN public.update_user_platform_role(target_user_id::text, new_role);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_user_platform_role(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_user_platform_role(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_user_platform_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_user_platform_role(uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_admin_role())
WITH CHECK (public.is_admin_role());

