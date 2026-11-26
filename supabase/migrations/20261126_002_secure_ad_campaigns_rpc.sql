/*
# Security Migration: Secure `__SYSTEM_CONFIG_AD_CAMPAIGNS__` and Add Scoped Public Read RPC

1. Removes `__SYSTEM_CONFIG_AD_CAMPAIGNS__` from `"Public read app_configs"` so anonymous and
   non-admin authenticated clients cannot read advertiser PII (`contact_person`), pricing
   (`price_huf`), payment status (`payment_status`), or internal `history_logs` via REST API.
2. Preserves full admin/editor read & write access via existing `"Admins and editors read all app_configs"`,
   `"Admins manage all app_configs"`, and `"Editors manage non-security app_configs"` policies.
3. Adds `public.get_published_ad_campaigns()` (`SECURITY DEFINER`, `SET search_path = public, pg_temp`)
   returning only active, date-valid campaigns with strictly public display fields.
*/

BEGIN;

-- ============================================================================
-- 1. Remove __SYSTEM_CONFIG_AD_CAMPAIGNS__ from public app_configs read policy
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

-- ============================================================================
-- 2. Scoped SECURITY DEFINER RPC for public active ad campaigns
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_published_ad_campaigns()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_raw JSONB;
  v_now TIMESTAMPTZ := now();
  v_elem JSONB;
  v_start_raw TEXT;
  v_end_raw TEXT;
  v_start_ts TIMESTAMPTZ;
  v_end_ts TIMESTAMPTZ;
  v_is_active BOOLEAN;
  v_is_date_valid BOOLEAN;
  v_res JSONB := '[]'::jsonb;
BEGIN
  SELECT value INTO v_raw
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_AD_CAMPAIGNS__';

  IF v_raw IS NULL OR jsonb_typeof(v_raw) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_raw)
  LOOP
    v_is_active := (
      coalesce(v_elem->>'status', '') = 'active'
      AND (
        nullif(v_elem->>'status_v2', '') IS NULL
        OR v_elem->>'status_v2' = 'active'
      )
    );

    IF NOT v_is_active THEN
      CONTINUE;
    END IF;

    v_is_date_valid := TRUE;
    v_start_raw := NULLIF(trim(coalesce(v_elem->>'start_date', '')), '');
    v_end_raw := NULLIF(trim(coalesce(v_elem->>'end_date', '')), '');

    IF v_start_raw IS NOT NULL THEN
      BEGIN
        v_start_ts := v_start_raw::timestamptz;
        IF v_start_ts > v_now THEN
          v_is_date_valid := FALSE;
        END IF;
      EXCEPTION WHEN others THEN
        v_is_date_valid := FALSE;
      END;
    END IF;

    IF v_is_date_valid AND v_end_raw IS NOT NULL THEN
      BEGIN
        v_end_ts := v_end_raw::timestamptz;
        IF v_end_ts < v_now THEN
          v_is_date_valid := FALSE;
        END IF;
      EXCEPTION WHEN others THEN
        v_is_date_valid := FALSE;
      END;
    END IF;

    IF NOT v_is_date_valid THEN
      CONTINUE;
    END IF;

    v_res := v_res || jsonb_build_array(
      jsonb_build_object(
        'id', v_elem->'id',
        'sponsor_name', v_elem->'sponsor_name',
        'placement_slot', v_elem->'placement_slot',
        'title', v_elem->'title',
        'target_url', v_elem->'target_url',
        'banner_image_url', v_elem->'banner_image_url',
        'status', 'active',
        'start_date', v_elem->'start_date',
        'end_date', v_elem->'end_date'
      )
    );
  END LOOP;

  RETURN v_res;
END;
$$;

ALTER FUNCTION public.get_published_ad_campaigns() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_published_ad_campaigns() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_ad_campaigns() TO anon, authenticated;

COMMIT;
