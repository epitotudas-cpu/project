-- ============================================================================
-- Migration: 20261114_005_user_app_states_and_partner_learning_rpcs.sql
-- Purpose:
--   1. Create private owner-scoped `user_app_states` table for per-user learning
--      progress, quiz attempts, flashcards, certificates, bookmarks, and teacher packages.
--   2. Create SECURITY DEFINER RPCs (`upsert_partner_learning_item`,
--      `delete_partner_learning_item`) so partners can safely manage only their
--      own courses/quizzes without opening `app_configs` writes to non-admins.
-- ============================================================================

-- 1. Private per-user state table (replaces __USER_*__ keys in public app_configs)
CREATE TABLE IF NOT EXISTS public.user_app_states (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, state_key)
);

ALTER TABLE public.user_app_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own user_app_states" ON public.user_app_states;
CREATE POLICY "Users manage own user_app_states"
  ON public.user_app_states
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Partner-scoped learning item upsert RPC
CREATE OR REPLACE FUNCTION public.upsert_partner_learning_item(
  p_config_key TEXT,
  p_item JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_is_privileged BOOLEAN := FALSE;
  v_partner_id TEXT;
  v_item_id TEXT;
  v_existing_list JSONB;
  v_existing_item JSONB;
  v_existing_partner_id TEXT;
  v_new_item JSONB;
  v_next_list JSONB := '[]'::jsonb;
  v_elem JSONB;
  v_found BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
  v_requested_status TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hitelesítés szükséges.';
  END IF;

  IF p_config_key NOT IN ('__SYSTEM_CONFIG_LEARNING_COURSES__', '__SYSTEM_CONFIG_LEARNING_QUIZZES__') THEN
    RAISE EXCEPTION 'Érvénytelen konfigurációs kulcs: %', p_config_key;
  END IF;

  v_item_id := NULLIF(trim(coalesce(p_item->>'id', '')), '');
  v_partner_id := NULLIF(trim(coalesce(p_item->>'partner_id', '')), '');

  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_uid AND p.role IN ('admin', 'editor')
  ) INTO v_is_privileged;

  IF NOT v_is_privileged THEN
    IF v_partner_id IS NULL THEN
      RAISE EXCEPTION 'Partner azonosító (partner_id) megadása kötelező.';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id::text = v_partner_id
        AND pu.user_id = v_uid
    ) THEN
      RAISE EXCEPTION 'Nincs jogosultsága ehhez a partneri tananyaghoz.';
    END IF;
  END IF;

  INSERT INTO public.app_configs (key, value, updated_at)
  VALUES (p_config_key, '[]'::jsonb, v_now)
  ON CONFLICT (key) DO NOTHING;

  SELECT value INTO v_existing_list
  FROM public.app_configs
  WHERE key = p_config_key
  FOR UPDATE;

  IF v_existing_list IS NULL OR jsonb_typeof(v_existing_list) <> 'array' THEN
    v_existing_list := '[]'::jsonb;
  END IF;

  v_new_item := p_item;
  IF NOT v_is_privileged THEN
    v_requested_status := coalesce(v_new_item->>'status', 'draft');
    IF v_requested_status NOT IN ('draft', 'pending') THEN
      v_new_item := jsonb_set(v_new_item, '{status}', '"pending"'::jsonb, true);
    END IF;
  END IF;
  v_new_item := jsonb_set(v_new_item, '{updated_at}', to_jsonb(v_now::text), true);

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_existing_list)
  LOOP
    IF v_item_id IS NOT NULL AND (v_elem->>'id') = v_item_id THEN
      v_existing_item := v_elem;
      v_existing_partner_id := NULLIF(trim(coalesce(v_existing_item->>'partner_id', '')), '');
      IF NOT v_is_privileged AND v_existing_partner_id IS DISTINCT FROM v_partner_id THEN
        RAISE EXCEPTION 'Más partner vagy adminisztrátor által kezelt elem nem módosítható.';
      END IF;
      v_next_list := v_next_list || jsonb_build_array(v_existing_item || v_new_item);
      v_found := TRUE;
    ELSE
      v_next_list := v_next_list || jsonb_build_array(v_elem);
    END IF;
  END LOOP;

  IF NOT v_found THEN
    v_next_list := jsonb_build_array(v_new_item) || v_next_list;
  END IF;

  UPDATE public.app_configs
  SET value = v_next_list,
      updated_at = v_now
  WHERE key = p_config_key;

  RETURN v_new_item;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_partner_learning_item(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_partner_learning_item(TEXT, JSONB) TO authenticated;

-- 3. Partner-scoped learning item delete RPC
CREATE OR REPLACE FUNCTION public.delete_partner_learning_item(
  p_config_key TEXT,
  p_item_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_is_privileged BOOLEAN := FALSE;
  v_existing_list JSONB;
  v_next_list JSONB := '[]'::jsonb;
  v_elem JSONB;
  v_elem_partner_id TEXT;
  v_deleted BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := now();
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hitelesítés szükséges.';
  END IF;

  IF p_config_key NOT IN ('__SYSTEM_CONFIG_LEARNING_COURSES__', '__SYSTEM_CONFIG_LEARNING_QUIZZES__') THEN
    RAISE EXCEPTION 'Érvénytelen konfigurációs kulcs: %', p_config_key;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_uid AND p.role IN ('admin', 'editor')
  ) INTO v_is_privileged;

  SELECT value INTO v_existing_list
  FROM public.app_configs
  WHERE key = p_config_key
  FOR UPDATE;

  IF v_existing_list IS NULL OR jsonb_typeof(v_existing_list) <> 'array' THEN
    RETURN FALSE;
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_existing_list)
  LOOP
    IF (v_elem->>'id') = p_item_id THEN
      v_elem_partner_id := NULLIF(trim(coalesce(v_elem->>'partner_id', '')), '');
      IF NOT v_is_privileged AND (
        v_elem_partner_id IS NULL OR NOT EXISTS (
          SELECT 1 FROM public.partner_users pu
          WHERE pu.partner_id::text = v_elem_partner_id
            AND pu.user_id = v_uid
        )
      ) THEN
        RAISE EXCEPTION 'Nincs jogosultsága az elem törléséhez.';
      END IF;
      v_deleted := TRUE;
    ELSE
      v_next_list := v_next_list || jsonb_build_array(v_elem);
    END IF;
  END LOOP;

  IF v_deleted THEN
    UPDATE public.app_configs
    SET value = v_next_list,
        updated_at = v_now
    WHERE key = p_config_key;
  END IF;

  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_partner_learning_item(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_partner_learning_item(TEXT, TEXT) TO authenticated;
