/*
# Revoke public RPC access to handle_new_user trigger function

## Problem
The `public.handle_new_user()` function was created as SECURITY DEFINER (required
for a trigger that writes to `public.profiles` when a new auth user is created).
However, Supabase automatically grants EXECUTE on public functions to both the
`anon` and `authenticated` roles, meaning any visitor or signed-in user could call
`/rest/v1/rpc/handle_new_user` directly and insert arbitrary rows into `profiles`.

## Changes
- REVOKE EXECUTE on `public.handle_new_user()` from the `anon` role.
- REVOKE EXECUTE on `public.handle_new_user()` from the `authenticated` role.

The function is still callable by the PostgreSQL internal trigger mechanism
(which runs as the `postgres` superuser role), so the signup trigger continues
to work normally.

## Security
- Removes the RPC attack surface for both unauthenticated visitors and
  signed-in users.
- Does not affect the `on_auth_user_created` trigger behaviour.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
