/*
# Revoke explicit EXECUTE grants on SECURITY DEFINER role-check functions

## Summary

Follow-up to `20260719_revoke_execute_on_security_functions.sql`. The first
migration revoked `EXECUTE` on the three `SECURITY DEFINER` helper functions
from `PUBLIC`. Verification showed that `handle_new_user()` was fully locked
down (only `postgres` and `service_role` retain `EXECUTE`), but
`is_admin_role()` and `is_editor_role()` still had **explicit** `EXECUTE`
grants to the `anon` and `authenticated` roles — separate from the `PUBLIC`
grant that was already revoked. These explicit grants were almost certainly
created automatically when the functions were originally defined, and they
keep the functions callable via `/rest/v1/rpc/is_admin_role` and
`/rest/v1/rpc/is_editor_role` by any anon or authenticated client.

## Changes

1. Revoke `EXECUTE` on `public.is_admin_role()` from `anon` and `authenticated`.
2. Revoke `EXECUTE` on `public.is_editor_role()` from `anon` and `authenticated`.

## Security impact

- After this migration, only `postgres` (the owner) and `service_role` retain
  `EXECUTE` on these two functions. Neither `anon` nor `authenticated` can
  invoke them directly through the PostgREST RPC endpoint.
- RLS policy evaluation is unaffected: policy expressions run with the table
  owner's privileges, and the table owner (`postgres`) still holds `EXECUTE`.
  The policies on `profiles`, `articles`, `categories`, `tools`, and
  `glossary_terms` that reference `is_admin_role()` / `is_editor_role()`
  continue to work exactly as before.
- The `on_auth_user_created` trigger is unaffected: triggers fire as the
  function owner, not the connecting role, and `handle_new_user()` was already
  locked down in the previous migration.
- No schema, table, column, or RLS policy changes. No data modified.

## Important notes

1. These functions MUST remain `SECURITY DEFINER` — switching to
   `SECURITY INVOKER` reintroduces the RLS recursion documented in migration
   `20260718163551_fix_rls_recursion.sql.sql`.
2. This migration is idempotent: `REVOKE` is safe to re-run.
3. The leaked-password (HIBP) protection setting is an Auth-level config toggle,
   not a database privilege — it is NOT part of this SQL migration.
*/

REVOKE EXECUTE ON FUNCTION public.is_admin_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_role() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_editor_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_editor_role() FROM authenticated;
