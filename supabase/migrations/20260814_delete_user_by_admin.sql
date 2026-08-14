-- Migration to allow admins to safely delete user accounts
CREATE OR REPLACE FUNCTION delete_user_by_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT (SELECT is_admin_role()) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Prevent admin from deleting themselves
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Nem törölheted a saját fiókodat!';
  END IF;

  -- Delete profile row
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Delete from auth.users (cascades to tokens, sessions etc.)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user_by_admin(UUID) TO authenticated;
