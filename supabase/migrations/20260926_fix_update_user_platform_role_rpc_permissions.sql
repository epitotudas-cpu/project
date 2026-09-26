/*
# Migration: Fix update_user_platform_role RPC permissions and search_path

## Purpose
1. Ensures update_user_platform_role RPC checks admin role using public.is_admin_role().
2. Sets explicit search_path = public.
3. Grants EXECUTE ON FUNCTION update_user_platform_role TO authenticated role.
*/

CREATE OR REPLACE FUNCTION update_user_platform_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) AND NOT public.is_admin_role() THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Kizárólag Adminisztrátor módosíthatja a platform szerepköröket.';
  END IF;

  IF new_role NOT IN ('user', 'editor', 'partner', 'school', 'teacher', 'contact', 'student', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Érvénytelen szerepkör: %', new_role;
  END IF;

  UPDATE profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'role', new_role);
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_platform_role TO authenticated;
