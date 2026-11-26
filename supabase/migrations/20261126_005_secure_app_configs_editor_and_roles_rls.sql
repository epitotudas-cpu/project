-- ============================================================================
-- P0 Security Fix 3/3: Harden RLS & grants on public.app_configs
--
-- Fixes confirmed production issues:
-- 1. Drops legacy "Admins and editors manage app_configs" (FOR ALL without key
--    restriction), which previously overrode both editor key exclusions and
--    SMTP read isolation via permissive OR evaluation.
-- 2. Splits admin and editor policies by operation (SELECT, INSERT, UPDATE,
--    DELETE) with no broad FOR ALL policy that could bypass restrictions.
-- 3. Restricts editor writes (INSERT/UPDATE only; no DELETE needed) strictly to
--    the 11 verified EditorLayout content keys.
-- 4. Preserves the exact 21-key public whitelist from 20261126_002 (keeping
--    `__SYSTEM_CONFIG_AD_CAMPAIGNS__` excluded and `get_published_ad_campaigns()`
--    untouched).
-- 5. Allows `partner`, `school`, and `teacher` roles to SELECT
--    `__SYSTEM_CONFIG_ROLE_PERMISSIONS__` for `permissionService.ts`.
-- 6. Revokes `TRUNCATE`, `TRIGGER`, `REFERENCES`, and `anon` write privileges
--    while keeping `service_role` and `postgres` untouched.
-- 7. Does NOT enable FORCE ROW LEVEL SECURITY so `get_published_ad_campaigns()`
--    and other SECURITY DEFINER RPCs owned by `postgres` keep working.
-- ============================================================================

BEGIN;

ALTER TABLE public.app_configs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.app_configs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.app_configs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_configs TO authenticated;

DROP POLICY IF EXISTS "Admins and editors manage app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Admins manage all app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Editors manage non-security app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Admins and editors read all app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Admins read smtp app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Admins read all app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Admins insert all app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Admins update all app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Admins delete all app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Editors read non-smtp app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Editors insert content app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Editors update content app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Partners read role permissions app_configs" ON public.app_configs;
DROP POLICY IF EXISTS "Public read app_configs" ON public.app_configs;

-- 1. Public 21-key whitelist (unchanged from 20261126_002; excludes AD_CAMPAIGNS)
CREATE POLICY "Public read app_configs"
ON public.app_configs
FOR SELECT
TO anon, authenticated
USING (
  key IN (
    '__SYSTEM_CONFIG_NAV_STRUCTURE__',
    '__SYSTEM_CONFIG_SITE_SETTINGS__',
    '__SYSTEM_CONFIG_HERO_STATE__',
    '__SYSTEM_CONFIG_ABOUT_SETTINGS__',
    '__SYSTEM_CONFIG_LEGAL_DOCS__',
    '__SYSTEM_CONFIG_IMPRESSUM__',
    '__SYSTEM_CONFIG_CALCULATOR_PRICES__',
    '__SYSTEM_CONFIG_TRADES__',
    '__SYSTEM_CONFIG_BOOKS__',
    '__SYSTEM_CONFIG_BOOK_CATEGORIES__',
    '__SYSTEM_CONFIG_MATERIAL_CATEGORIES__',
    '__SYSTEM_CONFIG_SOFTWARE_CATALOG__',
    '__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__',
    '__SYSTEM_CONFIG_AD_FALLBACK_VIDEO__',
    '__SYSTEM_CONFIG_AD_TILE_SETTINGS__',
    '__SYSTEM_CONFIG_AD_CREATIVES__',
    '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__',
    '__SYSTEM_CONFIG_COURSES__',
    '__SYSTEM_CONFIG_ARTICLE_ORDER__',
    '__SYSTEM_CONFIG_ARTICLE_SETTINGS__',
    '__SYSTEM_CONFIG_ARTICLE_REDIRECTS__'
  )
);

-- 2. Admin: full per-operation access (including __SYSTEM_CONFIG_SMTP_SETTINGS__)
CREATE POLICY "Admins read all app_configs"
ON public.app_configs
FOR SELECT
TO authenticated
USING (public.is_admin_role());

CREATE POLICY "Admins insert all app_configs"
ON public.app_configs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_role());

CREATE POLICY "Admins update all app_configs"
ON public.app_configs
FOR UPDATE
TO authenticated
USING (public.is_admin_role())
WITH CHECK (public.is_admin_role());

CREATE POLICY "Admins delete all app_configs"
ON public.app_configs
FOR DELETE
TO authenticated
USING (public.is_admin_role());

-- 3. Editor: read all non-SMTP keys
CREATE POLICY "Editors read non-smtp app_configs"
ON public.app_configs
FOR SELECT
TO authenticated
USING (
  public.is_editor_role()
  AND key <> '__SYSTEM_CONFIG_SMTP_SETTINGS__'
);

-- 4. Editor: insert/update ONLY the 11 verified EditorLayout content keys
CREATE POLICY "Editors insert content app_configs"
ON public.app_configs
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_editor_role()
  AND key IN (
    '__SYSTEM_CONFIG_ARTICLE_ORDER__',
    '__SYSTEM_CONFIG_ARTICLE_SETTINGS__',
    '__SYSTEM_CONFIG_ARTICLE_REDIRECTS__',
    '__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__',
    '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__',
    '__SYSTEM_CONFIG_LEARNING_COURSES__',
    '__SYSTEM_CONFIG_LEARNING_QUIZZES__',
    '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
    '__SYSTEM_CONFIG_MATERIAL_CATEGORIES__',
    '__SYSTEM_CONFIG_BOOKS__',
    '__SYSTEM_CONFIG_BOOK_CATEGORIES__'
  )
);

CREATE POLICY "Editors update content app_configs"
ON public.app_configs
FOR UPDATE
TO authenticated
USING (
  public.is_editor_role()
  AND key IN (
    '__SYSTEM_CONFIG_ARTICLE_ORDER__',
    '__SYSTEM_CONFIG_ARTICLE_SETTINGS__',
    '__SYSTEM_CONFIG_ARTICLE_REDIRECTS__',
    '__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__',
    '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__',
    '__SYSTEM_CONFIG_LEARNING_COURSES__',
    '__SYSTEM_CONFIG_LEARNING_QUIZZES__',
    '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
    '__SYSTEM_CONFIG_MATERIAL_CATEGORIES__',
    '__SYSTEM_CONFIG_BOOKS__',
    '__SYSTEM_CONFIG_BOOK_CATEGORIES__'
  )
)
WITH CHECK (
  public.is_editor_role()
  AND key IN (
    '__SYSTEM_CONFIG_ARTICLE_ORDER__',
    '__SYSTEM_CONFIG_ARTICLE_SETTINGS__',
    '__SYSTEM_CONFIG_ARTICLE_REDIRECTS__',
    '__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__',
    '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__',
    '__SYSTEM_CONFIG_LEARNING_COURSES__',
    '__SYSTEM_CONFIG_LEARNING_QUIZZES__',
    '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
    '__SYSTEM_CONFIG_MATERIAL_CATEGORIES__',
    '__SYSTEM_CONFIG_BOOKS__',
    '__SYSTEM_CONFIG_BOOK_CATEGORIES__'
  )
);

-- 5. Partner / school / teacher: SELECT __SYSTEM_CONFIG_ROLE_PERMISSIONS__
CREATE POLICY "Partners read role permissions app_configs"
ON public.app_configs
FOR SELECT
TO authenticated
USING (
  key = '__SYSTEM_CONFIG_ROLE_PERMISSIONS__'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'school', 'teacher')
  )
);

COMMIT;
