-- Fix Security Vulnerability #1: Prevent normal users from escalating their role via profiles UPDATE
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    OR is_admin_role()
  )
);
