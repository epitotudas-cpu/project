-- ============================================================================
-- MIGRÁCIÓ: 20261112_003_partner_reference_system_final.sql
-- ÉpítőTudás Referencia-galéria Végleges Jogosultsági és Storage Rendszer
-- Cél Supabase projekt: olmavxcmkvvcebgqxohe
-- Üzleti döntés: „A” alternatíva – Partneri önálló publikálás + Biztonságos PostgreSQL RPC véglegesítés (Edge Function mentes)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. FÜGGŐBEN LÉVŐ BERAGADT INTENTEK AZONNALI TISZTÍTÁSA
-- ----------------------------------------------------------------------------
DELETE FROM public.reference_upload_intents 
WHERE status IN ('created', 'validating');

-- ----------------------------------------------------------------------------
-- 1. FELTÖLTÉSI SZÁNDÉK (UPLOAD INTENT) RPC FRISSÍTÉSE
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_reference_upload_intent(uuid, uuid, bigint, text, uuid);

CREATE OR REPLACE FUNCTION public.create_reference_upload_intent(
  p_partner_id uuid,
  p_reference_id uuid,
  p_expected_size_bytes bigint,
  p_expected_mime_type text,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  intent_id uuid,
  staging_key text,
  allocated_object_key text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_effective_user_id uuid;
  v_new_intent_id uuid := gen_random_uuid();
  v_new_image_id uuid := gen_random_uuid();
  v_staging text;
  v_allocated_obj text;
  v_allocated_th text;
  v_count integer;
  v_intent_count integer;
  v_ext text;
BEGIN
  -- Lejárt vagy elhagyott szándékok automatikus takarítása az új igénylések előtt
  DELETE FROM public.reference_upload_intents
  WHERE reference_id = p_reference_id 
    AND expires_at <= now() 
    AND status IN ('created', 'validating');

  -- Jogosultság szigorú ellenőrzése
  IF current_user = 'service_role' OR auth.role() = 'service_role' THEN
    v_effective_user_id := p_user_id;
    IF v_effective_user_id IS NULL THEN
      RAISE EXCEPTION 'Backend service_role hívás esetén a p_user_id megadása kötelező!' USING ERRCODE = '22023';
    END IF;

    IF NOT (
      EXISTS (
        SELECT 1 FROM public.partner_users
        WHERE partner_id = p_partner_id
          AND user_id = v_effective_user_id
          AND (
            member_role IN ('owner', 'admin', 'school_admin', 'partner_admin')
            OR role IN ('owner', 'admin', 'school_admin', 'partner_admin')
          )
      )
      OR EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = v_effective_user_id
          AND u.raw_app_meta_data->>'role' IN ('admin', 'editor')
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v_effective_user_id
          AND p.role IN ('admin', 'editor')
      )
    ) THEN
      RAISE EXCEPTION 'A megadott felhasználó nem rendelkezik adminisztrátori jogosultsággal ennél a partnernél!' USING ERRCODE = '42501';
    END IF;
  ELSE
    v_effective_user_id := auth.uid();
    IF v_effective_user_id IS NULL THEN
      RAISE EXCEPTION 'Nem azonosított felhasználó!' USING ERRCODE = '42501';
    END IF;

    IF NOT (public.is_partner_admin(p_partner_id) OR public.is_editor_role()) THEN
      RAISE EXCEPTION 'Nincs jogosultsága feltöltés indításához!' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_expected_size_bytes <= 0 OR p_expected_size_bytes > 15728640 THEN
    RAISE EXCEPTION 'Érvénytelen fájlméret (max. 15 MB engedélyezett)!' USING ERRCODE = '22023';
  END IF;

  IF p_expected_mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp') THEN
    RAISE EXCEPTION 'Nem támogatott képformátum (kizárólag JPEG, PNG, WebP)!' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.partner_references
    WHERE id = p_reference_id AND partner_id = p_partner_id
  ) THEN
    RAISE EXCEPTION 'A referencia nem található ennél a partnernél!' USING ERRCODE = 'P0008';
  END IF;

  -- Szülő referencia kizárólagos zárolása
  PERFORM 1 FROM public.partner_references
  WHERE id = p_reference_id
  FOR UPDATE;

  SELECT count(*) INTO v_count
  FROM public.partner_reference_images
  WHERE reference_id = p_reference_id;

  SELECT count(*) INTO v_intent_count
  FROM public.reference_upload_intents
  WHERE reference_id = p_reference_id AND status IN ('created', 'validating') AND expires_at > now();

  IF (v_count + v_intent_count) >= 10 THEN
    RAISE EXCEPTION 'A referencia elérte a maximális 10 képet (függő feltöltésekkel együtt)!' USING ERRCODE = 'P0002';
  END IF;

  -- Kiterjesztés meghatározása MIME alapján
  v_ext := CASE p_expected_mime_type
    WHEN 'image/png' THEN 'png'
    WHEN 'image/webp' THEN 'webp'
    ELSE 'jpg'
  END;

  v_staging := 'staging/uploads/' || v_new_intent_id::text || '.tmp';
  v_allocated_obj := 'partners/' || p_partner_id::text || '/references/' || p_reference_id::text || '/' || v_new_image_id::text || '.' || v_ext;
  v_allocated_th := 'partners/' || p_partner_id::text || '/references/' || p_reference_id::text || '/thumbs/' || v_new_image_id::text || '.' || v_ext;

  INSERT INTO public.reference_upload_intents (
    id,
    partner_id,
    reference_id,
    user_id,
    staging_key,
    allocated_image_id,
    allocated_object_key,
    allocated_thumb_key,
    expected_size_bytes,
    expected_mime_type,
    status,
    expires_at
  ) VALUES (
    v_new_intent_id,
    p_partner_id,
    p_reference_id,
    v_effective_user_id,
    v_staging,
    v_new_image_id,
    v_allocated_obj,
    v_allocated_th,
    p_expected_size_bytes,
    p_expected_mime_type,
    'created',
    now() + interval '10 minutes'
  );

  RETURN QUERY SELECT v_new_intent_id, v_staging, v_allocated_obj;
END;
$$;

ALTER FUNCTION public.create_reference_upload_intent(uuid, uuid, bigint, text, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.create_reference_upload_intent(uuid, uuid, bigint, text, uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. KÉP VÉGLEGESÍTŐ RPC FRISSÍTÉSE: AUTHENTICATED PARTNER ADMIN ENGEDÉLYEZÉSE
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean);

CREATE OR REPLACE FUNCTION public.finalize_reference_image(
  p_intent_id uuid,
  p_caption text DEFAULT NULL,
  p_width integer DEFAULT 1600,
  p_height integer DEFAULT 1067,
  p_size_bytes bigint DEFAULT 0,
  p_is_cover boolean DEFAULT false
)
RETURNS TABLE (
  success boolean,
  error_code text,
  image_id uuid,
  permanent_object_key text,
  permanent_thumb_key text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ref_id uuid;
  v_partner_id uuid;
  v_intent record;
  v_order integer;
  v_cover boolean := COALESCE(p_is_cover, false);
  v_existing_covers integer;
BEGIN
  -- 1. Intent és partner azonosító lekérdezése
  SELECT reference_id, partner_id INTO v_ref_id, v_partner_id
  FROM public.reference_upload_intents
  WHERE id = p_intent_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'INTENT_NOT_FOUND', NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- 2. Jogosultság szigorú ellenőrzése
  IF current_user <> 'service_role' AND auth.role() <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN QUERY SELECT false, 'UNAUTHORIZED', NULL::uuid, NULL::text, NULL::text;
      RETURN;
    END IF;

    IF NOT (public.is_partner_admin(v_partner_id) OR public.is_editor_role()) THEN
      RETURN QUERY SELECT false, 'FORBIDDEN', NULL::uuid, NULL::text, NULL::text;
      RETURN;
    END IF;
  END IF;

  -- 3. Szülő referencia zárolása holtpontok megelőzésére
  PERFORM 1 FROM public.partner_references
  WHERE id = v_ref_id
  FOR UPDATE;

  -- 4. Intent rekord zárolása és állapotellenőrzése
  SELECT id, partner_id, reference_id, status, expires_at, allocated_image_id, allocated_object_key, allocated_thumb_key
  INTO v_intent
  FROM public.reference_upload_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  IF v_intent.status NOT IN ('created', 'validating') THEN
    RETURN QUERY SELECT false, 'INVALID_STATUS_' || v_intent.status, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF v_intent.expires_at < now() THEN
    UPDATE public.reference_upload_intents SET status = 'expired' WHERE id = p_intent_id;
    RETURN QUERY SELECT false, 'EXPIRED', NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  -- 5. Képsorrend és meglévő borítókép megállapítása
  SELECT COALESCE(max(display_order), 0) + 1, count(*) FILTER (WHERE is_cover = true)
  INTO v_order, v_existing_covers
  FROM public.partner_reference_images
  WHERE reference_id = v_intent.reference_id;

  PERFORM set_config('app.allow_cover_change', 'true', true);

  IF v_existing_covers = 0 OR v_order = 1 THEN
    v_cover := true;
  ELSIF v_cover = true THEN
    UPDATE public.partner_reference_images
    SET is_cover = false
    WHERE reference_id = v_intent.reference_id AND is_cover = true;
  END IF;

  -- 6. Beszúrás az allokált végleges azonosítókkal a relációs táblába
  INSERT INTO public.partner_reference_images (
    id,
    reference_id,
    partner_id,
    object_key,
    thumbnail_key,
    caption,
    display_order,
    is_cover,
    width,
    height,
    size_bytes
  ) VALUES (
    v_intent.allocated_image_id,
    v_intent.reference_id,
    v_intent.partner_id,
    v_intent.allocated_object_key,
    v_intent.allocated_thumb_key,
    p_caption,
    v_order,
    v_cover,
    COALESCE(p_width, 1600),
    COALESCE(p_height, 1067),
    COALESCE(p_size_bytes, 0)
  );

  -- 7. Intent elhasznált állapotba állítása
  UPDATE public.reference_upload_intents
  SET status = 'consumed', consumed_at = now()
  WHERE id = p_intent_id;

  RETURN QUERY SELECT true, 'SUCCESS', v_intent.allocated_image_id, v_intent.allocated_object_key, v_intent.allocated_thumb_key;
END;
$$;

ALTER FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. PUBLIKÁLÁSI RPC: PARTNERI ÖNÁLLÓ PUBLIKÁLÁS ENGEDÉLYEZÉSE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_partner_reference(p_reference_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_partner_id uuid;
BEGIN
  -- 1. Szülő referencia kizárólagos sorzárolása és partner_id kinyerése
  SELECT partner_id INTO v_partner_id
  FROM public.partner_references
  WHERE id = p_reference_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A hivatkozott referencia nem található!' USING ERRCODE = 'P0008';
  END IF;

  -- 2. Jogosultság szigorú ellenőrzése: Editor/Admin VAGY az adott partner adminisztrátora
  IF NOT (public.is_editor_role() OR public.is_partner_admin(v_partner_id)) THEN
    RAISE EXCEPTION 'Nincs jogosultsága a partner referenciájának publikálásához!' USING ERRCODE = '42501';
  END IF;

  -- 3. Borítókép kényszer (P0003) ellenőrzése: pontosan egy borítóképpel kell rendelkeznie
  IF NOT EXISTS (
    SELECT 1 FROM public.partner_reference_images
    WHERE reference_id = p_reference_id AND is_cover = true
  ) THEN
    RAISE EXCEPTION 'A referencia nem publikálható: pontosan egy kijelölt borítóképpel kell rendelkeznie!' USING ERRCODE = 'P0003';
  END IF;

  -- 4. Publikált állapot élesítése
  UPDATE public.partner_references
  SET is_published = true, updated_at = now()
  WHERE id = p_reference_id;

  RETURN true;
END;
$$;

ALTER FUNCTION public.publish_partner_reference(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.publish_partner_reference(uuid) TO authenticated, service_role;

-- Borítókép kijelölési RPC jogosultság
GRANT EXECUTE ON FUNCTION public.set_reference_cover_image(uuid, uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. SUPABASE STORAGE BUCKETEK ÉS BIZTONSÁGI RLS HÁZIRENDEK
-- ----------------------------------------------------------------------------

-- 4.1. Vödrök létrehozása / frissítése
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'partner-references',
    'partner-references',
    true,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'partner-references-staging',
    'partner-references-staging',
    false,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4.2. partner-references publikus vödör RLS szabályai
DROP POLICY IF EXISTS "Partner references authenticated insert" ON storage.objects;
CREATE POLICY "Partner references authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-references'
);

DROP POLICY IF EXISTS "Partner references authenticated update" ON storage.objects;
CREATE POLICY "Partner references authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-references'
)
WITH CHECK (
  bucket_id = 'partner-references'
);

DROP POLICY IF EXISTS "Partner references public read" ON storage.objects;
CREATE POLICY "Partner references public read"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'partner-references'
);

-- 4.3. partner-references-staging vödör RLS szabályai
DROP POLICY IF EXISTS "Staging bucket authenticated insert" ON storage.objects;
CREATE POLICY "Staging bucket authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-references-staging'
);

DROP POLICY IF EXISTS "Staging bucket authenticated select" ON storage.objects;
CREATE POLICY "Staging bucket authenticated select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-references-staging'
);

DROP POLICY IF EXISTS "Staging bucket authenticated update" ON storage.objects;
CREATE POLICY "Staging bucket authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-references-staging'
)
WITH CHECK (
  bucket_id = 'partner-references-staging'
);

COMMIT;
