/*
# Migration: Audit v2 Phase 1 - RLS Hardening

## Purpose
1. Restrict `glossary_languages` and `glossary_term_translations` write policies to `admin` / `editor` roles.
2. Restrict `ad_packages` write policy to `admin` role (`public.is_admin_role()`).
3. Bind `comments` INSERT policy to `auth.uid()` (or `user_id IS NULL` for anonymous) and enforce content length bounds.
4. Restrict `audit_logs` INSERT policy to privileged panel roles (`admin`, `editor`, `moderator`, `partner`, `school`, `teacher`).
5. Prevent self-escalation of `profiles.role_id` in `"Users update own profile"`.
6. Tighten `"Authenticated read all profiles"` so regular users only read their own profile while panel/teaching roles retain directory read access.
*/

-- 1. Multilingual glossary write restrictions
DROP POLICY IF EXISTS "Admin write languages" ON public.glossary_languages;
CREATE POLICY "Admin write languages"
ON public.glossary_languages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
  )
);

DROP POLICY IF EXISTS "Admin write translations" ON public.glossary_term_translations;
CREATE POLICY "Admin write translations"
ON public.glossary_term_translations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'editor')
  )
);

-- 2. B2B ad_packages write restriction
DROP POLICY IF EXISTS "Admin write ad_packages" ON public.ad_packages;
CREATE POLICY "Admin write ad_packages"
ON public.ad_packages
FOR ALL
TO authenticated
USING (public.is_admin_role())
WITH CHECK (public.is_admin_role());

-- 3. Comments INSERT anti-spoofing & length guard
DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments"
ON public.comments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(content)) > 0
  AND length(content) <= 5000
  AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  )
);

-- 4. Audit logs INSERT restricted to panel roles
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'editor', 'moderator', 'partner', 'school', 'teacher')
  )
);

-- 5. Protect profiles.role_id alongside profiles.role on self-update
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    (
      role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      AND role_id IS NOT DISTINCT FROM (SELECT p.role_id FROM public.profiles p WHERE p.id = auth.uid())
    )
    OR public.is_admin_role()
  )
);

-- 6. Tighten profiles SELECT policy
DROP POLICY IF EXISTS "Authenticated read all profiles" ON public.profiles;
CREATE POLICY "Authenticated read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'editor', 'moderator', 'partner', 'school', 'teacher')
  )
);

