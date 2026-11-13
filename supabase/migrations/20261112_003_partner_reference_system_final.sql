-- ============================================================================
-- MIGRÁCIÓ: 20261112_003_partner_reference_system_final.sql
-- ÉpítőTudás Referencia-galéria Végleges Jogosultsági és Storage Rendszer
-- Cél Supabase projekt: olmavxcmkvvcebgqxohe
-- Üzleti döntés: „A” alternatíva – Partneri önálló publikálás
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. PUBLIKÁLÁSI RPC FRISSÍTÉSE: PARTNERI ÖNÁLLÓ PUBLIKÁLÁS ENGEDÉLYEZÉSE
-- ----------------------------------------------------------------------------
-- Biztosítja, hogy:
-- 1. A platformadminisztrátor / szerkesztő (is_editor_role) publikálhat.
-- 2. A referencia saját partnerének adminisztrátora (is_partner_admin) is publikálhat.
-- 3. Más partner referenciájának manipulálása szerverszinten kizárt.
-- 4. A P0003 kényszer (pontosan egy érvényes borítókép megléte) kötelezően teljesül.
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

  -- 4. Publikált állapot élesítése atomi tranzakcióban
  UPDATE public.partner_references
  SET is_published = true, updated_at = now()
  WHERE id = p_reference_id;

  RETURN true;
END;
$$;

ALTER FUNCTION public.publish_partner_reference(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.publish_partner_reference(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. TOVÁBBI KAPCSOLÓDÓ RPC-K EXPLICIT JOGOSULTSÁGAINAK BIZTOSÍTÁSA
-- ----------------------------------------------------------------------------

-- Borítókép beállító RPC hitelesített felhasználóknak (is_partner_admin védi belül)
GRANT EXECUTE ON FUNCTION public.set_reference_cover_image(uuid, uuid) TO authenticated;

-- Feltöltési intent létrehozása hitelesített felhasználóknak (is_partner_admin védi belül)
GRANT EXECUTE ON FUNCTION public.create_reference_upload_intent(uuid, uuid, bigint, text, uuid) TO authenticated, service_role;

-- Kizárólag backend service_role által futtatható RPC-k
GRANT EXECUTE ON FUNCTION public.claim_upload_intent(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_and_cleanup_unconsumed_intent(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_upload_intents(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_storage_deletion_tasks(integer, interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_storage_deletion_task(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_storage_deletion_task(uuid, uuid, text) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. SUPABASE STORAGE BUCKETEK ÉS BIZTONSÁGI RLS HÁZIRENDEK
-- ----------------------------------------------------------------------------

-- 3.1. Vödrök deklarálása (idempotens beszúrás)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'partner-references-staging',
    'partner-references-staging',
    false,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
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

-- 3.2. Staging vödör RLS szabályok (Privát vödör)
DROP POLICY IF EXISTS "Staging bucket authenticated insert" ON storage.objects;
CREATE POLICY "Staging bucket authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-references-staging'
  AND name LIKE 'staging/uploads/%'
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
  AND name LIKE 'staging/uploads/%'
);

-- 3.3. Végleges vödör RLS szabályok (Publikus vödör)
DROP POLICY IF EXISTS "Partner references public read" ON storage.objects;
CREATE POLICY "Partner references public read"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'partner-references'
);

COMMIT;

