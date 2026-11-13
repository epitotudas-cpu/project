-- ============================================================================
-- MIGRÁCIÓ: 20261112_003_partner_reference_system_final.sql
-- ÉpítőTudás Referencia-galéria Végleges Jogosultsági és Storage Rendszer
-- Cél Supabase projekt: olmavxcmkvvcebgqxohe
-- Üzleti döntés: „A” alternatíva – Partneri önálló publikálás + Biztonságos PostgreSQL RPC
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. FÜGGŐBEN LÉVŐ BERAGADT INTENTEK TISZTÍTÁSA ÉS KÉPKULCSOK JAVÍTÁSA
-- ----------------------------------------------------------------------------
DELETE FROM public.reference_upload_intents 
WHERE status IN ('created', 'validating');

-- Képtábla trigger frissítése, hogy adminisztratív zászlóval engedje a kulcsok korrekcióját
CREATE OR REPLACE FUNCTION public.enforce_reference_images_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
  v_is_editor boolean;
BEGIN
  v_is_editor := public.is_editor_role();

  IF TG_OP = 'INSERT' THEN
    PERFORM 1 FROM public.partner_references
    WHERE id = NEW.reference_id AND partner_id = NEW.partner_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A hivatkozott referencia nem létezik ennél a partnernél!' USING ERRCODE = '23503';
    END IF;

    SELECT count(*) INTO v_count
    FROM public.partner_reference_images
    WHERE reference_id = NEW.reference_id;

    IF v_count >= 10 THEN
      RAISE EXCEPTION 'A referencia elérte a maximális 10 képet!' USING ERRCODE = 'P0002';
    END IF;

    NEW.created_at := now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF current_user = 'service_role' OR auth.role() = 'service_role' OR current_setting('app.allow_object_key_repair', true) = 'true' THEN
      NEW.created_at := OLD.created_at;
      RETURN NEW;
    END IF;

    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id THEN
      RAISE EXCEPTION 'A kép partner_id mezője nem módosítható!' USING ERRCODE = '42501';
    END IF;
    IF NEW.reference_id IS DISTINCT FROM OLD.reference_id THEN
      RAISE EXCEPTION 'A kép reference_id mezője nem módosítható!' USING ERRCODE = '42501';
    END IF;
    IF NEW.object_key IS DISTINCT FROM OLD.object_key OR NEW.thumbnail_key IS DISTINCT FROM OLD.thumbnail_key THEN
      RAISE EXCEPTION 'A kép objektumkulcsai nem módosíthatók!' USING ERRCODE = '42501';
    END IF;

    IF NEW.is_cover IS DISTINCT FROM OLD.is_cover THEN
      IF current_setting('app.allow_cover_change', true) IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'A borítókép közvetlenül nem módosítható, használja a set_reference_cover_image RPC-t!' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NOT (public.is_partner_admin(OLD.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága a kép módosításához!' USING ERRCODE = '42501';
    END IF;

    NEW.created_at := OLD.created_at;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

ALTER FUNCTION public.enforce_reference_images_limits() OWNER TO postgres;

-- Javítási kulcs aktiválása
SET LOCAL app.allow_object_key_repair = 'true';

-- A hibás /thumbs/ mappa eltávolítása az eddig beszúrt képekből a valódi fájlokra
UPDATE public.partner_reference_images
SET thumbnail_key = REPLACE(thumbnail_key, '/thumbs/', '/'),
    object_key = REPLACE(object_key, '/thumbs/', '/')
WHERE thumbnail_key LIKE '%/thumbs/%' OR object_key LIKE '%/thumbs/%';

-- Minden képpel rendelkező referencia élesítése
UPDATE public.partner_references
SET is_published = true, updated_at = now()
WHERE id IN (
  SELECT reference_id FROM public.partner_reference_images
);

-- ----------------------------------------------------------------------------
-- 1. PUBLIKÁLÁSI BIZTONSÁGI TRIGGER FRISSÍTÉSE (PARTNERI PUBLIKÁLÁS TÁMOGATÁSA)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_reference_publication_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_editor boolean;
  v_is_partner_adm boolean;
BEGIN
  v_is_editor := public.is_editor_role();

  -- TÖRLÉS (DELETE)
  IF TG_OP = 'DELETE' THEN
    IF NOT (current_user = 'service_role' OR auth.role() = 'service_role' OR public.is_partner_admin(OLD.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága a referencia törléséhez!' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  -- BESZÚRÁS (INSERT)
  IF TG_OP = 'INSERT' THEN
    IF NOT (current_user = 'service_role' OR auth.role() = 'service_role' OR public.is_partner_admin(NEW.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága referencia létrehozásához ennél a partnernél!' USING ERRCODE = '42501';
    END IF;

    -- Ha tranzakciós publikálási zászló aktív, átengedi, egyébként piszkozat
    IF current_setting('app.allow_publication', true) IS DISTINCT FROM 'true' THEN
      NEW.is_published := false;
    END IF;

    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- MÓDOSÍTÁS (UPDATE)
  IF TG_OP = 'UPDATE' THEN
    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id THEN
      RAISE EXCEPTION 'A partner_id abszolút immutábilis mező, módosítása tilos!' USING ERRCODE = '42501';
    END IF;

    v_is_partner_adm := public.is_partner_admin(OLD.partner_id);

    -- Service_role vagy publish_partner_reference RPC feloldó zászló
    IF current_user = 'service_role' OR auth.role() = 'service_role' OR current_setting('app.allow_publication', true) = 'true' THEN
      NEW.created_at := OLD.created_at;
      NEW.updated_at := now();
      RETURN NEW;
    END IF;

    IF NOT (v_is_partner_adm OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága a referencia módosításához!' USING ERRCODE = '42501';
    END IF;

    NEW.created_at := OLD.created_at;
    NEW.updated_at := now();

    -- Publikálás ellenőrzése
    IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.partner_reference_images
        WHERE reference_id = NEW.id AND is_cover = true
      ) THEN
        RAISE EXCEPTION 'A referencia nem publikálható: pontosan egy kijelölt borítóképpel kell rendelkeznie!' USING ERRCODE = 'P0003';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

ALTER FUNCTION public.enforce_reference_publication_security() OWNER TO postgres;

-- ----------------------------------------------------------------------------
-- 2. PUBLIKÁLÁSI RPC FRISSÍTÉSE: PARTNERI ÖNÁLLÓ PUBLIKÁLÁS
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
  -- 1. Szülő referencia kizárólagos zárolása és partner_id kinyerése
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

  -- 4. Tranzakciós zászló beállítása a trigger átengedéséhez
  PERFORM set_config('app.allow_publication', 'true', true);

  -- 5. Publikált állapot élesítése
  UPDATE public.partner_references
  SET is_published = true, updated_at = now()
  WHERE id = p_reference_id;

  RETURN true;
END;
$$;

ALTER FUNCTION public.publish_partner_reference(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.publish_partner_reference(uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. FELTÖLTÉSI SZÁNDÉK (UPLOAD INTENT) RPC
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
  -- Lejárt szándékok automatikus kitisztítása az új igénylések előtt
  DELETE FROM public.reference_upload_intents
  WHERE reference_id = p_reference_id 
    AND expires_at <= now() 
    AND status IN ('created', 'validating');

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

  v_ext := CASE p_expected_mime_type
    WHEN 'image/png' THEN 'png'
    WHEN 'image/webp' THEN 'webp'
    ELSE 'jpg'
  END;

  v_staging := 'staging/uploads/' || v_new_intent_id::text || '.tmp';
  v_allocated_obj := 'partners/' || p_partner_id::text || '/references/' || p_reference_id::text || '/' || v_new_image_id::text || '.' || v_ext;
  v_allocated_th := v_allocated_obj;

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
-- 4. KÉP VÉGLEGESÍTŐ RPC (PARTNER ADMIN SZÁMÁRA IS)
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
  SELECT reference_id, partner_id INTO v_ref_id, v_partner_id
  FROM public.reference_upload_intents
  WHERE id = p_intent_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'INTENT_NOT_FOUND', NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

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

  PERFORM 1 FROM public.partner_references
  WHERE id = v_ref_id
  FOR UPDATE;

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

  UPDATE public.reference_upload_intents
  SET status = 'consumed', consumed_at = now()
  WHERE id = p_intent_id;

  RETURN QUERY SELECT true, 'SUCCESS', v_intent.allocated_image_id, v_intent.allocated_object_key, v_intent.allocated_thumb_key;
END;
$$;

ALTER FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.set_reference_cover_image(uuid, uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. SUPABASE STORAGE BUCKETEK ÉS BIZTONSÁGI RLS HÁZIRENDEK
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'partner-references',
    'partner-references',
    true,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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

-- ----------------------------------------------------------------------------
-- 6. KEZDŐ REFERENCIÁK BESZÚRÁSA (78-AS ÉPÍTŐK KFT. - AZONNALI MEGJELENÉS)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_pid uuid := 'd876ac79-13a7-4c14-852d-3b5adb282047';
  v_ref1 uuid;
  v_ref2 uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = v_pid) THEN
    PERFORM set_config('app.allow_publication', 'true', true);

    -- 1. Referencia: Buda-Garten 24 lakásos Társasház
    IF NOT EXISTS (SELECT 1 FROM public.partner_references WHERE partner_id = v_pid AND title = 'Buda-Garten 24 lakásos Társasház') THEN
      INSERT INTO public.partner_references (
        partner_id, title, location, year, category, description, is_published, created_at, updated_at
      ) VALUES (
        v_pid, 'Buda-Garten 24 lakásos Társasház', 'Budapest XI. kerület', '2025', 'Társasházépítés',
        'A-kategóriás energetikai besorolású, monolit vasbeton szerkezetű lakópark kulcsrakész kivitelezése korszerű MSZ szabványok szerint.',
        true, now(), now()
      ) RETURNING id INTO v_ref1;

      INSERT INTO public.partner_reference_images (
        reference_id, partner_id, object_key, thumbnail_key, caption, is_cover, display_order, width, height, size_bytes
      ) VALUES (
        v_ref1, v_pid,
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
        'Buda-Garten homlokzat és épületszárny', true, 1, 1600, 1067, 1200000
      );
    END IF;

    -- 2. Referencia: Logisztikai Központ & Raktárcsarnok
    IF NOT EXISTS (SELECT 1 FROM public.partner_references WHERE partner_id = v_pid AND title = 'Logisztikai Központ & Raktárcsarnok') THEN
      INSERT INTO public.partner_references (
        partner_id, title, location, year, category, description, is_published, created_at, updated_at
      ) VALUES (
        v_pid, 'Logisztikai Központ & Raktárcsarnok', 'Biatorbágy', '2024', 'Ipari építészet',
        '3500 m² alapterületű acélszerkezetes raktárcsarnok és irodaház kivitelezése legújabb technológiákkal.',
        true, now(), now()
      ) RETURNING id INTO v_ref2;

      INSERT INTO public.partner_reference_images (
        reference_id, partner_id, object_key, thumbnail_key, caption, is_cover, display_order, width, height, size_bytes
      ) VALUES (
        v_ref2, v_pid,
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
        'Logisztikai Központ és raktárcsarnok külső tér', true, 1, 1600, 1067, 1400000
      );
    END IF;
  END IF;
END $$;

COMMIT;
