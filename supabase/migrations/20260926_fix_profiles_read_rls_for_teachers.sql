/*
# Migration: Allow authenticated users (teachers, instructors, school admins, partners) to read public profiles

## Purpose
1. Adds RLS SELECT policy "Authenticated read all profiles" on public.profiles table.
2. Resolves "Névtelen tanuló" issue in Teacher Dashboard caused by RLS blocking non-admin teachers from reading student profiles.
*/

DROP POLICY IF EXISTS "Authenticated read all profiles" ON public.profiles;
CREATE POLICY "Authenticated read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
