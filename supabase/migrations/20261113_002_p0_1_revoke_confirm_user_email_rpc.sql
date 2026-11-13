/*
# Migration: P0-1 Revoke and drop insecure confirm_user_email RPC

## Purpose
Removes public.confirm_user_email(TEXT), which previously allowed anon and
authenticated callers to confirm any user's email address without a server-side
verification token.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'confirm_user_email'
      AND pg_get_function_identity_arguments(p.oid) = 'user_email text'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.confirm_user_email(TEXT) FROM PUBLIC, anon, authenticated;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.confirm_user_email(TEXT);

