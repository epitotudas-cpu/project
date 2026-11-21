/*
# Security Migration: Harden `app_configs` RLS, isolate `smtpSettings`, and add scoped material read RPCs

1. P0: Move `smtpSettings` out of public `__SYSTEM_CONFIG_SITE_SETTINGS__` into admin-only
   `__SYSTEM_CONFIG_SMTP_SETTINGS__`, and strip `smtpSettings` from any legacy `public.categories` row.
2. P1: Replace `"Public read app_configs"` (`USING (true)`) with an explicit whitelist of
   genuinely public configuration keys. Restrict internal/partner/payment/material-draft keys
   to admins/editors.
3. P1: Protect `public.categories` from leaking legacy `__SYSTEM_CONFIG_%` rows to `anon`.
4. P1: Add `get_published_materials()` and `get_partner_own_materials(uuid)` `SECURITY DEFINER` RPCs
   so public visitors only receive `status = 'published'` items without `rejection_note`, and
   authenticated partners only receive their own items (`is_partner_contact(p_partner_id)`).
*/

BEGIN;

-- ============================================================================
-- 1. Move smtpSettings out of __SYSTEM_CONFIG_SITE_SETTINGS__
-- ============================================================================
DO $$
DECLARE
  v_site_settings JSONB;
  v_smtp JSONB;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT value INTO v_site_settings
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_SITE_SETTINGS__'
  FOR UPDATE;

  IF v_site_settings IS NOT NULL AND jsonb_typeof(v_site_settings) = 'object' AND (v_site_settings ? 'smtpSettings') THEN
    v_smtp := v_site_settings -> 'smtpSettings';

    INSERT INTO public.app_configs (key, value, updated_at)
    VALUES ('__SYSTEM_CONFIG_SMTP_SETTINGS__', v_smtp, v_now)
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = EXCLUDED.updated_at;

    UPDATE public.app_configs
    SET value = v_site_settings - 'smtpSettings',
        updated_at = v_now
    WHERE key = '__SYSTEM_CONFIG_SITE_SETTINGS__';
  END IF;

  -- Clean any legacy categories row that may hold __SYSTEM_CONFIG_SITE_SETTINGS__ with smtpSettings
  UPDATE public.categories
  SET description = ((description::jsonb) - 'smtpSettings')::text,
      updated_at = v_now
  WHERE name = '__SYSTEM_CONFIG_SITE_SETTINGS__'
    AND description IS NOT NULL
    AND description LIKE '{%'
    AND (description::jsonb ? 'smtpSettings');
END $$;

-- ============================================================================
-- 2. Harden app_configs RLS policies (explicit public key whitelist)
-- ============================================================================
DROP POLICY IF EXISTS "Public read app_configs" ON public.app_configs;
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
    '__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__',
    '__SYSTEM_CONFIG_AD_FALLBACK_VIDEO__',
    '__SYSTEM_CONFIG_AD_TILE_SETTINGS__',
    '__SYSTEM_CONFIG_AD_CAMPAIGNS__',
    '__SYSTEM_CONFIG_AD_CREATIVES__',
    '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__',
    '__SYSTEM_CONFIG_COURSES__',
    '__SYSTEM_CONFIG_LEARNING_COURSES__',
    '__SYSTEM_CONFIG_LEARNING_QUIZZES__',
    '__SYSTEM_CONFIG_ARTICLE_ORDER__',
    '__SYSTEM_CONFIG_ARTICLE_SETTINGS__',
    '__SYSTEM_CONFIG_ARTICLE_REDIRECTS__'
  )
);

DROP POLICY IF EXISTS "Admins and editors read all app_configs" ON public.app_configs;
CREATE POLICY "Admins and editors read all app_configs"
ON public.app_configs
FOR SELECT
TO authenticated
USING (
  (public.is_admin_role() OR public.is_editor_role())
  AND key <> '__SYSTEM_CONFIG_SMTP_SETTINGS__'
);

DROP POLICY IF EXISTS "Admins read smtp app_configs" ON public.app_configs;
CREATE POLICY "Admins read smtp app_configs"
ON public.app_configs
FOR SELECT
TO authenticated
USING (
  public.is_admin_role()
  AND key = '__SYSTEM_CONFIG_SMTP_SETTINGS__'
);

DROP POLICY IF EXISTS "Editors manage non-security app_configs" ON public.app_configs;
CREATE POLICY "Editors manage non-security app_configs"
ON public.app_configs
FOR ALL
TO authenticated
USING (
  public.is_editor_role()
  AND key NOT IN (
    '__SYSTEM_CONFIG_ROLE_PERMISSIONS__',
    '__SYSTEM_CONFIG_SITE_SETTINGS__',
    '__SYSTEM_CONFIG_SMTP_SETTINGS__'
  )
)
WITH CHECK (
  public.is_editor_role()
  AND key NOT IN (
    '__SYSTEM_CONFIG_ROLE_PERMISSIONS__',
    '__SYSTEM_CONFIG_SITE_SETTINGS__',
    '__SYSTEM_CONFIG_SMTP_SETTINGS__'
  )
);

-- ============================================================================
-- 3. Protect legacy categories.__SYSTEM_CONFIG_% rows from anon reads
-- ============================================================================
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
ON public.categories
FOR SELECT
TO public
USING (
  name NOT LIKE '__SYSTEM_CONFIG_%'
  OR public.is_editor_role()
);

-- ============================================================================
-- 4. Scoped RPCs for __SYSTEM_CONFIG_MATERIALS_ITEMS__
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_published_materials()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_list JSONB;
  v_result JSONB := '[]'::jsonb;
  v_elem JSONB;
BEGIN
  SELECT value INTO v_list
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_MATERIALS_ITEMS__';

  IF v_list IS NULL OR jsonb_typeof(v_list) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_list)
  LOOP
    IF coalesce(v_elem->>'status', '') = 'published' THEN
      v_result := v_result || jsonb_build_array(v_elem - 'rejection_note');
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

ALTER FUNCTION public.get_published_materials() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_published_materials() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_materials() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_partner_own_materials(p_partner_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_list JSONB;
  v_result JSONB := '[]'::jsonb;
  v_elem JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hitelesítés szükséges.';
  END IF;

  IF p_partner_id IS NULL OR (NOT public.is_partner_contact(p_partner_id) AND NOT public.is_editor_role()) THEN
    RAISE EXCEPTION 'Nincs jogosultsága ehhez a partnerfiókhoz.';
  END IF;

  SELECT value INTO v_list
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_MATERIALS_ITEMS__';

  IF v_list IS NULL OR jsonb_typeof(v_list) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_list)
  LOOP
    IF coalesce(v_elem->>'partner_id', '') = p_partner_id::text THEN
      v_result := v_result || jsonb_build_array(v_elem);
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

ALTER FUNCTION public.get_partner_own_materials(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_partner_own_materials(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_partner_own_materials(UUID) TO authenticated;

COMMIT;
