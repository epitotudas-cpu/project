/*
# Migration: 20261109_001_career_security_and_rls.sql
# Description: Career portal security hardening, candidate PII protection, RLS enforcement, strict partner_id protection, and moderation workflow.
# Version: 2.3 (Strict search_path = '', partner_id protection trigger, validated non-overwriting CHECK constraint)
*/

-- ============================================================================
-- 1. MODERATION STATUS OSZLOP, CONSTRAINT ÉS INDEXEK (TELJESEN IDEMPOTENS)
-- ============================================================================

DO $$
DECLARE
  v_invalid_statuses text;
BEGIN
  -- 1.1. Oszlop létezésének ellenőrzése public sémában és hozzáadása ha hiányzik
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'job_postings' 
      AND column_name = 'moderation_status'
  ) THEN
    ALTER TABLE public.job_postings 
      ADD COLUMN moderation_status text DEFAULT 'approved';
    
    -- Meglévő rekordok kezdeti kitöltése csak az oszlop létrehozásakor
    UPDATE public.job_postings SET moderation_status = 'approved' WHERE moderation_status IS NULL;
  END IF;

  -- 1.2. Esetlegesen megmaradt NULL értékek felöltése approved értékre
  UPDATE public.job_postings SET moderation_status = 'approved' WHERE moderation_status IS NULL;

  -- 1.3. Érvénytelen nem-NULL státuszok vizsgálata:
  -- Ha a meglévő rekordok között a megengedett ('pending', 'approved', 'rejected') értéktől eltérő státusz szerepel,
  -- a szkript azonnal megáll és jelenti az értékeket, anélkül hogy automatikusan felülírná azokat.
  SELECT string_agg(DISTINCT moderation_status, ', ') INTO v_invalid_statuses
  FROM public.job_postings
  WHERE moderation_status IS NOT NULL
    AND moderation_status NOT IN ('pending', 'approved', 'rejected');

  IF v_invalid_statuses IS NOT NULL THEN
    RAISE EXCEPTION 'A chk_job_postings_moderation_status korlátozás nem alkalmazható, mert az alábbi érvénytelen státuszértékek találhatók a job_postings táblában: %', v_invalid_statuses;
  END IF;

  -- 1.4. Alapértelmezett érték kötelezően 'pending' a jövőbeli beszúrásokhoz
  ALTER TABLE public.job_postings ALTER COLUMN moderation_status SET DEFAULT 'pending';

  -- 1.5. NOT NULL kényszer biztosítása
  ALTER TABLE public.job_postings ALTER COLUMN moderation_status SET NOT NULL;

  -- 1.6. CHECK constraint pontosítása és újralétrehozása:
  -- Ha a nevesített constraint már létezik, eldobjuk, majd pontos definícióval hozzuk létre (duplikáció kizárása).
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.job_postings'::regclass
      AND conname = 'chk_job_postings_moderation_status'
  ) THEN
    ALTER TABLE public.job_postings DROP CONSTRAINT chk_job_postings_moderation_status;
  END IF;

  ALTER TABLE public.job_postings
    ADD CONSTRAINT chk_job_postings_moderation_status
    CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
END $$;

CREATE INDEX IF NOT EXISTS idx_job_postings_status_active 
  ON public.job_postings(is_active, moderation_status);
CREATE INDEX IF NOT EXISTS idx_job_postings_partner_id 
  ON public.job_postings(partner_id);

-- ============================================================================
-- 2. TRIGGER A MODERÁCIÓS STÁTUSZ ÉS A PARTNER_ID SZERVERSZINTŰ VÉDELMÉRE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_job_posting_moderation_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 2.1. Ha a moderációs státusz módosul, kizárólag platform adminisztrátor engedélyezett
  IF (NEW.moderation_status IS DISTINCT FROM OLD.moderation_status) THEN
    IF NOT public.is_admin_role() THEN
      RAISE EXCEPTION 'A moderációs státuszt (moderation_status) kizárólag platform adminisztrátor módosíthatja.';
    END IF;
  END IF;

  -- 2.2. Ha a partner_id módosul, kizárólag platform adminisztrátor engedélyezett
  IF (NEW.partner_id IS DISTINCT FROM OLD.partner_id) THEN
    IF NOT public.is_admin_role() THEN
      RAISE EXCEPTION 'A hirdetéshez tartozó partnercég (partner_id) feladás után nem módosítható. A módosítás kizárólag platform adminisztrátor számára engedélyezett.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_job_posting_moderation ON public.job_postings;
CREATE TRIGGER trg_guard_job_posting_moderation
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_job_posting_moderation_guard();

-- ============================================================================
-- 3. JELENTKEZŐK SZEMÉLYES ADATAINAK VÉDELME (job_applications RLS)
-- ============================================================================

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Minden korábbi olvasási és módosítási policy törlése
DROP POLICY IF EXISTS "Public read job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Public read applications" ON public.job_applications;
DROP POLICY IF EXISTS "Allow public read job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Candidate read own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Partner read own job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Candidate insert job_application" ON public.job_applications;
DROP POLICY IF EXISTS "Admin manage job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admin read all job applications" ON public.job_applications;

-- 3.1. SELECT: Jelentkező kizárólag a saját korábbi jelentkezését láthatja
CREATE POLICY "Candidate read own applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- 3.2. SELECT: Partner kizárólag a saját cége által feladott állások jelentkezőit láthatja
CREATE POLICY "Partner read own job applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_postings jp
      JOIN public.partner_users pu ON pu.partner_id = jp.partner_id
      WHERE jp.id = job_applications.job_id
        AND pu.user_id = auth.uid()
    )
  );

-- 3.3. SELECT: Adminisztrátor minden beérkezett jelentkezést megtekinthet
CREATE POLICY "Admin read all job applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (public.is_admin_role());

-- 3.4. INSERT: Jelentkezés beküldése szigorú user_id és mező-integritással
CREATE POLICY "Candidate insert job_application"
  ON public.job_applications FOR INSERT TO anon, authenticated
  WITH CHECK (
    -- user_id védelem: anonimnél kötelezően NULL, bejelentkezettnél kötelezően auth.uid()
    (
      (auth.uid() IS NULL AND user_id IS NULL)
      OR
      (auth.uid() IS NOT NULL AND user_id = auth.uid())
    )
    -- Név validáció (2 - 100 karakter)
    AND length(trim(applicant_name)) >= 2 AND length(trim(applicant_name)) <= 100
    -- E-mail formátum validáció (szabványos RFC e-mail regex)
    AND applicant_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    -- Kísérőlevél maximális hossza (legfeljebb 2000 karakter)
    AND (cover_note IS NULL OR length(cover_note) <= 2000)
    -- Megpályázott állás ellenőrzése: kötelezően létező, aktív ÉS jóváhagyott állás
    AND EXISTS (
      SELECT 1 FROM public.job_postings jp
      WHERE jp.id = job_id 
        AND jp.is_active = true 
        AND jp.moderation_status = 'approved'
    )
  );

-- 3.5. ALL: Adminisztrátor teljes körű törlési és kezelési joga a jelentkezéseken
CREATE POLICY "Admin manage job_applications"
  ON public.job_applications FOR ALL TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());

-- ============================================================================
-- 4. ÁLLÁSHIRDETÉSEK VÉDELME ÉS JOGOSULTSÁGAI (job_postings RLS)
-- ============================================================================

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Minden korábbi olvasási és módosítási policy törlése
DROP POLICY IF EXISTS "Public read job_postings" ON public.job_postings;
DROP POLICY IF EXISTS "Public read active approved job_postings" ON public.job_postings;
DROP POLICY IF EXISTS "Partner read own company job_postings" ON public.job_postings;
DROP POLICY IF EXISTS "Partner insert job_postings" ON public.job_postings;
DROP POLICY IF EXISTS "Partner update own company job_postings" ON public.job_postings;
DROP POLICY IF EXISTS "Admin manage all job_postings" ON public.job_postings;
DROP POLICY IF EXISTS "Admin read all job_postings" ON public.job_postings;

-- 4.1. SELECT: Publikus látogatók kizárólag az aktív ÉS jóváhagyott hirdetéseket láthatják
CREATE POLICY "Public read active approved job_postings"
  ON public.job_postings FOR SELECT TO anon, authenticated
  USING (is_active = true AND moderation_status = 'approved');

-- 4.2. SELECT: Partner láthatja a saját cége minden hirdetését (pending és rejected státuszban is)
CREATE POLICY "Partner read own company job_postings"
  ON public.job_postings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id = job_postings.partner_id
        AND pu.user_id = auth.uid()
    )
  );

-- 4.3. SELECT: Adminisztrátor minden hirdetést lát
CREATE POLICY "Admin read all job_postings"
  ON public.job_postings FOR SELECT TO authenticated
  USING (public.is_admin_role());

-- 4.4. INSERT: Partner létrehozhat álláshirdetést a saját cégéhez, kötelező 'pending' státusszal
CREATE POLICY "Partner insert job_postings"
  ON public.job_postings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id = job_postings.partner_id
        AND pu.user_id = auth.uid()
    )
    AND length(trim(title)) >= 3
    AND length(trim(company_name)) >= 2
    AND length(trim(location)) >= 2
    AND length(trim(description)) >= 10
    -- Partner beszúráskor KIZÁRÓLAG 'pending' státuszt adhat meg
    AND moderation_status = 'pending'
  );

-- 4.5. UPDATE: Partner módosíthatja a saját cége hirdetésének adatait és az is_active állapotot.
-- A moderation_status és a partner_id megváltoztatását az adatbázisszintű check_job_posting_moderation_guard trigger blokkolja.
CREATE POLICY "Partner update own company job_postings"
  ON public.job_postings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id = job_postings.partner_id
        AND pu.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id = job_postings.partner_id
        AND pu.user_id = auth.uid()
    )
  );

-- 4.6. ALL: Adminisztrátor teljes körű moderációs, módosítási és törlési joga
CREATE POLICY "Admin manage all job_postings"
  ON public.job_postings FOR ALL TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());
