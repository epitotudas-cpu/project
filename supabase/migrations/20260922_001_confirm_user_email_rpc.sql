-- Additive Migration: RPC to confirm user email in auth.users and public.profiles
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS jsonb AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF user_email IS NULL OR TRIM(user_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kérjük, adja meg az e-mail címet.');
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(user_email));

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Felhasználó nem található.');
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = target_user_id;

  UPDATE public.profiles
  SET email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.confirm_user_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_user_email(TEXT) TO authenticated, anon;
