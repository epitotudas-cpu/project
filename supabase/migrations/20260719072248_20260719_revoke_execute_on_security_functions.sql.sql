/*
# Revoke direct EXECUTE on SECURITY DEFINER helper functions

## Summary

Three helper functions in the `public` schema are declared `SECURITY DEFINER`:
- `public.handle_new_user()`
- `public.is_admin_role()`
- `public.is_editor_role()`

They were intentionally created as `SECURITY DEFINER` to break an infinite RLS
recursion problem (see migration `20260718163551_fix_rls_recursion.sql.sql`):
the admin/editor RLS policies on `articles`, `categories`, `tools`,
`glossary_terms`, and `profiles` reference the `profiles` table, which itself
has RLS enabled. Without a `SECURITY DEFINER` helper, evaluating those policies
re-enters RLS on `profiles` and recurses infinitely. Switching these functions
to `SECURITY INVOKER` would therefore reintroduce the recursion bug and is NOT
an acceptable fix.

However, by default PostgreSQL grants `EXECUTE` on functions to `PUBLIC`,
which means the `anon` and `authenticated` roles can invoke them directly via
`/rest/v1/rpc/<function>` on the PostgREST API. None of these functions are
designed to be called as RPCs from the frontend:

- `handle_new_user()` is a trigger function fired `AFTER INSERT ON auth.users`
  by the `on_auth_user_created` trigger. It must run with elevated privileges
  to insert into `public.profiles`, but should never be callable by clients.
- `is_admin_role()` and `is_editor_role()` are only referenced from RLS policy
  expressions. The frontend (`src/lib/authService.ts`) reads the `profiles`
  table directly; it does NOT call these via `.rpc()`.

The correct, minimal fix is to **revoke EXECUTE** from `PUBLIC`, `anon`, and
`authenticated` so the functions cannot be invoked directly through the REST
API, while still being usable internally by RLS policy evaluation and by
database triggers (which run with the privileges of their owning function /
the table owner, not the connecting role).

## Changes

1. Revoke `EXECUTE` on `public.handle_new_user()` from `PUBLIC`.
2. Revoke `EXECUTE` on `public.is_admin_role()` from `PUBLIC`.
3. Revoke `EXECUTE` on `public.is_editor_role()` from `PUBLIC`.

## Security impact

- Removes the ability for unauthenticated (`anon`) and authenticated users to
  invoke these `SECURITY DEFINER` functions via the PostgREST RPC endpoint.
- Does NOT affect:
  - The `on_auth_user_created` trigger (triggers run as the function owner,
    not the connecting role).
  - RLS policy evaluation that references `is_admin_role()` / `is_editor_role()`
    (policy expressions run with the table owner's privileges, which still
    hold `EXECUTE`).
- No schema, table, column, or RLS policy changes.
- No data is modified or deleted.

## Important notes

1. These functions MUST remain `SECURITY DEFINER`. Do not change them to
   `SECURITY INVOKER` — that reintroduces the RLS recursion documented in
   migration `20260718163551_fix_rls_recursion.sql.sql`.
2. This migration is idempotent: `REVOKE` is safe to re-run (a second run is
   a no-op once the privilege is already absent).
3. The leaked-password (HIBP) protection setting on Supabase Auth is a
   project-level Auth configuration toggle, not a database setting. It is
   addressed separately through the Supabase Dashboard / Management API and
   is intentionally NOT part of this SQL migration.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_editor_role() FROM PUBLIC;
