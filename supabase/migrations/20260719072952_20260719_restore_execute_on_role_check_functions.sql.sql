/*
# Restore EXECUTE on role-check functions for RLS policy evaluation

## Summary

The previous migrations (`20260719_revoke_execute_on_security_functions.sql`
and `20260719_revoke_explicit_execute_on_role_functions.sql`) revoked
`EXECUTE` on `public.is_admin_role()` and `public.is_editor_role()` from the
`anon` and `authenticated` roles. This broke the application: every public
page (Főoldal, Kategóriák, Szerszámok) started returning HTTP 403 with
`permission denied for function is_admin_role` / `is_editor_role`.

## Root cause

In PostgreSQL, RLS policy expressions are evaluated as the **connecting role**
(the role of the client that issued the query), not as the table owner. When a
policy's `USING` / `WITH CHECK` expression calls a function, the connecting role
must itself hold `EXECUTE` on that function — even when the function is
`SECURITY DEFINER` (the function *body* runs as the owner, but the *call* still
requires the caller's EXECUTE privilege).

The admin/editor RLS policies on `profiles`, `articles`, `categories`, `tools`,
and `glossary_terms` all reference `is_admin_role()` / `is_editor_role()`. With
EXECUTE revoked from `anon`/`authenticated`, every request from the frontend
(which runs as `anon` when logged out, `authenticated` when logged in) fails
the policy evaluation with `permission denied for function ...`.

## Why these two functions are safe to keep executable

- `is_admin_role()` and `is_editor_role()` are pure boolean checks. They take
  no arguments, perform no writes, and return only whether the calling user's
  `profiles.role` equals `admin` (or `admin`/`editor`). Calling them via
  `/rest/v1/rpc/...` leaks no data the caller could not already obtain.
- They MUST remain `SECURITY DEFINER` to bypass RLS on `profiles` and avoid the
  infinite recursion documented in migration
  `20260718163551_fix_rls_recursion.sql.sql`. Switching them to
  `SECURITY INVOKER` would reintroduce that recursion.
- Therefore the only viable posture is: keep `SECURITY DEFINER` AND keep
  `EXECUTE` granted to `anon`/`authenticated`. The functions are safe to call
  directly; the `SECURITY DEFINER` mode is required for correctness, not for
  hiding privilege.

## What stays locked down

`public.handle_new_user()` remains revoked from `anon`/`authenticated`
(only `postgres` and `service_role` retain EXECUTE). It is a trigger function
fired by `on_auth_user_created AFTER INSERT ON auth.users` and is never
referenced from any RLS policy, so locking it down does not affect policy
evaluation. Triggers fire as the function owner, not the connecting role, so
the signup flow continues to work.

## Changes

1. Grant `EXECUTE` on `public.is_admin_role()` to `anon` and `authenticated`.
2. Grant `EXECUTE` on `public.is_editor_role()` to `anon` and `authenticated`.

## Security impact

- Restores application functionality (public pages load again).
- `handle_new_user()` — the only function with a real side effect (inserting
  into `public.profiles`) — stays locked down and is not callable via RPC.
- `is_admin_role()` / `is_editor_role()` remain callable via RPC but are safe
  boolean functions; this is an accepted, documented trade-off required for
  RLS policy evaluation to function.
- No schema, table, column, or RLS policy changes. No data modified.

## Important notes

1. These two functions MUST remain `SECURITY DEFINER` AND executable by
   `anon`/`authenticated`. Do not revoke EXECUTE on them again — it breaks
   every RLS policy that references them.
2. This migration is idempotent: `GRANT` is safe to re-run.
*/

GRANT EXECUTE ON FUNCTION public.is_admin_role() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor_role() TO anon;
GRANT EXECUTE ON FUNCTION public.is_editor_role() TO authenticated;
