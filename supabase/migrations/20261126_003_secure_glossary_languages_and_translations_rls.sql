-- ============================================================================
-- P0 Security Fix 1/3: Harden RLS & grants on glossary_languages and
-- glossary_term_translations
--
-- Fixes confirmed production issues:
-- 1. Removes `OR true` from public SELECT policies so inactive languages and
--    non-published (draft/reviewed) translations are not exposed to anon or
--    non-staff authenticated users.
-- 2. Replaces `{public}` `FOR ALL USING (true) WITH CHECK (true)` policies
--    ("Admin write languages", "Admin write translations") with per-operation
--    policies restricted to `public.is_editor_role()` (`admin` and `editor`).
-- 3. Revokes `TRUNCATE`, `TRIGGER`, `REFERENCES`, and `anon` write privileges
--    while keeping `service_role` and table owner (`postgres`) untouched.
-- 4. Does NOT enable FORCE ROW LEVEL SECURITY.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. public.glossary_languages
-- ----------------------------------------------------------------------------
ALTER TABLE public.glossary_languages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.glossary_languages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.glossary_languages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.glossary_languages TO authenticated;

DROP POLICY IF EXISTS "Public read active languages" ON public.glossary_languages;
DROP POLICY IF EXISTS "Admin write languages" ON public.glossary_languages;
DROP POLICY IF EXISTS "Editors read all languages" ON public.glossary_languages;
DROP POLICY IF EXISTS "Editors insert languages" ON public.glossary_languages;
DROP POLICY IF EXISTS "Editors update languages" ON public.glossary_languages;
DROP POLICY IF EXISTS "Editors delete languages" ON public.glossary_languages;

CREATE POLICY "Public read active languages"
ON public.glossary_languages
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Editors read all languages"
ON public.glossary_languages
FOR SELECT
TO authenticated
USING (public.is_editor_role());

CREATE POLICY "Editors insert languages"
ON public.glossary_languages
FOR INSERT
TO authenticated
WITH CHECK (public.is_editor_role());

CREATE POLICY "Editors update languages"
ON public.glossary_languages
FOR UPDATE
TO authenticated
USING (public.is_editor_role())
WITH CHECK (public.is_editor_role());

CREATE POLICY "Editors delete languages"
ON public.glossary_languages
FOR DELETE
TO authenticated
USING (public.is_editor_role());

-- ----------------------------------------------------------------------------
-- 2. public.glossary_term_translations
-- ----------------------------------------------------------------------------
ALTER TABLE public.glossary_term_translations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.glossary_term_translations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.glossary_term_translations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.glossary_term_translations TO authenticated;

DROP POLICY IF EXISTS "Public read published translations" ON public.glossary_term_translations;
DROP POLICY IF EXISTS "Admin write translations" ON public.glossary_term_translations;
DROP POLICY IF EXISTS "Editors read all translations" ON public.glossary_term_translations;
DROP POLICY IF EXISTS "Editors insert translations" ON public.glossary_term_translations;
DROP POLICY IF EXISTS "Editors update translations" ON public.glossary_term_translations;
DROP POLICY IF EXISTS "Editors delete translations" ON public.glossary_term_translations;

CREATE POLICY "Public read published translations"
ON public.glossary_term_translations
FOR SELECT
TO anon, authenticated
USING (status = 'published');

CREATE POLICY "Editors read all translations"
ON public.glossary_term_translations
FOR SELECT
TO authenticated
USING (public.is_editor_role());

CREATE POLICY "Editors insert translations"
ON public.glossary_term_translations
FOR INSERT
TO authenticated
WITH CHECK (public.is_editor_role());

CREATE POLICY "Editors update translations"
ON public.glossary_term_translations
FOR UPDATE
TO authenticated
USING (public.is_editor_role())
WITH CHECK (public.is_editor_role());

CREATE POLICY "Editors delete translations"
ON public.glossary_term_translations
FOR DELETE
TO authenticated
USING (public.is_editor_role());

COMMIT;
