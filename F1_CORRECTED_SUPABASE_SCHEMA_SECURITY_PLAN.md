# F1-CORRECTION – REFERENCIA-GALÉRIA SUPABASE ADATMODELL ÉS JOGOSULTSÁGI RENDSZER CÉLZOTT BIZTONSÁGI JAVÍTÁSI TERV

**Dokumentumazonosító:** `F1_CORRECTED_SUPABASE_SCHEMA_SECURITY_PLAN.md`  
**Projekt:** ÉpítőTudás  
**Supabase projekt:** `olmavxcmkvvcebgqxohe`  
**Supabase URL:** `https://olmavxcmkvvcebgqxohe.supabase.co`  
**Kiinduló dokumentum:** `F1_SUPABASE_SCHEMA_SECURITY_IMPLEMENTATION_PLAN.md`  
**Munkamód:** STRICT READ-ONLY / NO PATCH / NO REFACTOR – SQL VÉGREHAJTÁS TILOS  
**Dátum:** 2026-11-12  

**Kötelező záróállapot:**  
`F1 CORRECTION COMPLETED – WAITING FOR REVIEW AND SQL APPROVAL`

---

## 1. VEZETŐI ÖSSZEFOGLALÓ ÉS A KORREKCIÓ CÉLJA

Az F1 implementációs terv felülvizsgálata során azonosítottuk azokat a finomhangolást igénylő biztonsági és logikai részleteket, amelyek a korábbi tervezetben még kockázatot jelenthettek:
1. **Publikációs állapotgép szigorítása:** A tartalmi mezők teljes, egzakt listájának rögzítése (beleértve a `category` mezőt is), amelynek módosítása garantáltan kiváltja az újramoderálást (`auto-demote`).
2. **Képtábla műveletek jogosultsági izolációja:** A triggerek garantálják, hogy a `SECURITY DEFINER` kontextus ne adhasson jogosultságot jogosulatlan hívónak; `partner_id` és `reference_id` abszolút immutabilitása minden szerepkörre érvényesül.
3. **Tranzakcióbiztos borítókép-kezelés:** Új `set_reference_cover_image` RPC a borítókép-váltás alatti indexütközés kizárására, valamint a törléskori automatikus előléptetés és kötelező moderáció lezárása.
4. **Szerveroldali R2 kulcsgenerálás:** A kliens nem határozhatja meg a végleges objektumkulcsot (`object_key`, `thumbnail_key`); a kulcsokat kizárólag a szerveroldali `finalize_reference_image` RPC állítja elő UUID alapon.
5. **Törlési Queue javítása:** A feladatok nem törlődnek azonnal, hanem `completed` státuszba kerülnek audit-megőrzéssel; a `retry_count` duplikált számlálása megszüntetve; a `worker_lock_token` minden műveletnél kizárja a versenyhelyzeteket.
6. **Visszaállítási (Rollback) terv biztonsága:** A destruktív `DROP TABLE ... CASCADE` és a névütközést okozó átnevezések helyett strukturált jogosultságmegvonásos inaktiválás.

---

## 2. A JAVÍTOTT ADATMODELL ÉS ENTITÁSOK

```mermaid
erDiagram
    partners ||--o{ partner_references : "1:N (partner_id)"
    partner_references ||--o{ partner_reference_images : "1:N (Composite FK: id, partner_id)"
    partner_references ||--o{ reference_upload_intents : "1:N (staging)"
    partner_reference_images ..> pending_storage_deletions : "AFTER DELETE trigger (audit-sor)"

    partner_references {
        uuid id PK
        uuid partner_id FK
        text title
        text location
        text year
        text category
        text description
        text website_url
        boolean is_published
        timestamptz created_at
        timestamptz updated_at
    }

    partner_reference_images {
        uuid id PK
        uuid reference_id FK
        uuid partner_id FK
        text object_key UK
        text thumbnail_key UK
        text caption
        integer display_order
        boolean is_cover
        integer width
        integer height
        bigint size_bytes
        timestamptz created_at
    }

    reference_upload_intents {
        uuid id PK
        uuid partner_id FK
        uuid reference_id FK
        uuid user_id FK
        text staging_key UK
        text status
        timestamptz expires_at
        timestamptz created_at
        timestamptz consumed_at
    }

    pending_storage_deletions {
        uuid id PK
        text object_key
        text thumb_key
        uuid partner_id
        text status
        integer retry_count
        timestamptz next_retry_at
        timestamptz locked_until
        uuid worker_lock_token
        text error_message
        timestamptz created_at
        timestamptz completed_at
    }
```

---

## 3. TELJES, KORRIGÁLT SQL-TERVEZET (F1-CORRECTED)

*(Figyelem: Ez kizárólag specifikációs tervezet. Futtatása szigorúan tilos!)*

```sql
-- ============================================================================
-- MIGRÁCIÓS TERVEZET: 20261112_001_partner_references_schema.sql (CORRECTED)
-- ÉpítőTudás Referencia-galéria Adatmodell, Triggerek, RLS és RPC-k
-- Célprojekt: olmavxcmkvvcebgqxohe
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. TÁBLÁK LÉTREHOZÁSA
-- ----------------------------------------------------------------------------

-- 1.1. Partner referenciák tábla
CREATE TABLE IF NOT EXISTS public.partner_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text,
  year text,
  category text,
  description text,
  website_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT partner_references_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT partner_references_id_partner_id_key UNIQUE (id, partner_id)
);

-- 1.2. Referencia képek tábla (Composite Foreign Key védelemmel)
CREATE TABLE IF NOT EXISTS public.partner_reference_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  object_key text NOT NULL UNIQUE,
  thumbnail_key text NOT NULL UNIQUE,
  caption text,
  display_order integer NOT NULL DEFAULT 1,
  is_cover boolean NOT NULL DEFAULT false,
  width integer NOT NULL,
  height integer NOT NULL,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_images_reference_partner FOREIGN KEY (reference_id, partner_id)
    REFERENCES public.partner_references(id, partner_id) ON DELETE CASCADE,
  CONSTRAINT partner_reference_images_order_check CHECK (display_order >= 1 AND display_order <= 10),
  CONSTRAINT partner_reference_images_dimensions CHECK (width > 0 AND height > 0 AND size_bytes > 0)
);

-- 1.3. Kétfázisú feltöltési intentek tábla
CREATE TABLE IF NOT EXISTS public.reference_upload_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  reference_id uuid NOT NULL REFERENCES public.partner_references(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  staging_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'created',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  CONSTRAINT upload_intents_status_check CHECK (status IN ('created', 'validating', 'consumed', 'failed', 'expired'))
);

-- 1.4. Törlési queue tábla (Független audit-napló)
CREATE TABLE IF NOT EXISTS public.pending_storage_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key text NOT NULL,
  thumb_key text,
  partner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  worker_lock_token uuid,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT pending_deletions_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter'))
);

-- ----------------------------------------------------------------------------
-- 2. INDEXEK LÉTREHOZÁSA
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_references_partner_id ON public.partner_references(partner_id);
CREATE INDEX IF NOT EXISTS idx_references_published ON public.partner_references(is_published);
CREATE INDEX IF NOT EXISTS idx_ref_images_ref_order ON public.partner_reference_images(reference_id, display_order);

-- Feltételes egyedi index: referenciánként pontosan legfeljebb 1 borítókép lehet
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_cover_per_reference 
ON public.partner_reference_images(reference_id) 
WHERE is_cover = true;

-- Queue feldolgozást segítő index
CREATE INDEX IF NOT EXISTS idx_storage_deletions_claim 
ON public.pending_storage_deletions(status, next_retry_at, locked_until);

-- ----------------------------------------------------------------------------
-- 3. BIZTONSÁGI ÉS ÁLLAPOTGÉP TRIGGEREK
-- ----------------------------------------------------------------------------

-- 3.1. Referencia entitás védelmi triggere (KORRIGÁLT, TELJES MEZŐLISTÁVAL)
CREATE OR REPLACE FUNCTION public.enforce_reference_publication_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_editor boolean;
BEGIN
  v_is_editor := public.is_editor_role();

  -- TÖRLÉS MŰVELET (Kizárólag OLD rekord alapján értékelődik ki)
  IF TG_OP = 'DELETE' THEN
    IF NOT (public.is_partner_admin(OLD.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága a referencia törléséhez!' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  -- BESZÚRÁS MŰVELET
  IF TG_OP = 'INSERT' THEN
    IF NOT (public.is_partner_admin(NEW.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága referencia létrehozásához ennél a partnernél!' USING ERRCODE = '42501';
    END IF;

    -- Partner nem hozhat létre már publikált referenciát
    IF NOT v_is_editor THEN
      NEW.is_published := false;
    END IF;

    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- MÓDOSÍTÁS (UPDATE) MŰVELET
  IF TG_OP = 'UPDATE' THEN
    -- 1. partner_id abszolút immutabilitása (MÉG PLATFORM EDITOR SEM MÓDOSÍTHATJA!)
    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id THEN
      RAISE EXCEPTION 'A partner_id abszolút immutábilis mező, módosítása tilos!' USING ERRCODE = '42501';
    END IF;

    -- 2. Jogosultság ellenőrzése szigorúan az OLD.partner_id alapján
    IF NOT (public.is_partner_admin(OLD.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága a referencia módosításához!' USING ERRCODE = '42501';
    END IF;

    -- 3. Rendszer időbélyegek védelme
    NEW.created_at := OLD.created_at;
    NEW.updated_at := now();

    -- 4. Publikációs állapotkezelés és Auto-Demote
    IF NOT v_is_editor THEN
      -- Partner közvetlen publikálási kísérlete
      IF NEW.is_published = true AND OLD.is_published = false THEN
        RAISE EXCEPTION 'Referencia publikálása kizárólag adminisztrátor által engedélyezett!' USING ERRCODE = '42501';
      END IF;

      -- Partner közvetlen visszavonási kísérlete tartalomváltozás nélkül
      IF NEW.is_published = false AND OLD.is_published = true 
         AND NEW.title = OLD.title 
         AND NEW.description IS NOT DISTINCT FROM OLD.description
         AND NEW.location IS NOT DISTINCT FROM OLD.location
         AND NEW.year IS NOT DISTINCT FROM OLD.year
         AND NEW.category IS NOT DISTINCT FROM OLD.category
         AND NEW.website_url IS NOT DISTINCT FROM OLD.website_url THEN
        RAISE EXCEPTION 'Publikáció közvetlen visszavonása kizárólag adminisztrátor által engedélyezett!' USING ERRCODE = '42501';
      END IF;

      -- Auto-demotion: Ha a referencia már publikált volt, és a partner bármely tartalmi mezőt módosítja
      -- (title, description, location, year, category, website_url), automatikusan visszaminősül piszkozattá!
      IF OLD.is_published = true AND (
         NEW.title <> OLD.title OR
         NEW.description IS DISTINCT FROM OLD.description OR
         NEW.location IS DISTINCT FROM OLD.location OR
         NEW.year IS DISTINCT FROM OLD.year OR
         NEW.category IS DISTINCT FROM OLD.category OR
         NEW.website_url IS DISTINCT FROM OLD.website_url
      ) THEN
        NEW.is_published := false;
      END IF;
    ELSE
      -- Platform Editor publikálási kísérlete: borítókép kötelező ellenőrzése
      IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.partner_reference_images
          WHERE reference_id = NEW.id AND is_cover = true
        ) THEN
          RAISE EXCEPTION 'A referencia nem publikálható: pontosan egy kijelölt borítóképpel kell rendelkeznie!' USING ERRCODE = 'P0003';
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reference_publication_security ON public.partner_references;
CREATE TRIGGER trg_enforce_reference_publication_security
BEFORE INSERT OR UPDATE OR DELETE ON public.partner_references
FOR EACH ROW EXECUTE FUNCTION public.enforce_reference_publication_security();

-- 3.2. Képtábla jogosultsági és képszámkorlát védelme (KORRIGÁLT)
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

  -- Beszúrás esetén jogosultság vizsgálata
  IF TG_OP = 'INSERT' THEN
    IF NOT (public.is_partner_admin(NEW.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága kép hozzáadásához ehhez a partnerhez!' USING ERRCODE = '42501';
    END IF;

    -- Szülő referencia sorzárolása versenyhelyzet kizárására
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

  -- Módosítás esetén immutabilitás és jogosultság vizsgálata
  IF TG_OP = 'UPDATE' THEN
    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id THEN
      RAISE EXCEPTION 'A kép partner_id mezője nem módosítható!' USING ERRCODE = '42501';
    END IF;
    IF NEW.reference_id IS DISTINCT FROM OLD.reference_id THEN
      RAISE EXCEPTION 'A kép reference_id mezője nem módosítható!' USING ERRCODE = '42501';
    END IF;
    IF NEW.object_key IS DISTINCT FROM OLD.object_key OR NEW.thumbnail_key IS DISTINCT FROM OLD.thumbnail_key THEN
      RAISE EXCEPTION 'A kép objektumkulcsai nem módosíthatók!' USING ERRCODE = '42501';
    END IF;

    IF NOT (public.is_partner_admin(OLD.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága a kép módosításához!' USING ERRCODE = '42501';
    END IF;

    NEW.created_at := OLD.created_at;
    RETURN NEW;
  END IF;

  -- Törlés esetén jogosultság vizsgálata
  IF TG_OP = 'DELETE' THEN
    IF NOT (public.is_partner_admin(OLD.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága a kép törléséhez!' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reference_images_limits ON public.partner_reference_images;
CREATE TRIGGER trg_enforce_reference_images_limits
BEFORE INSERT OR UPDATE OR DELETE ON public.partner_reference_images
FOR EACH ROW EXECUTE FUNCTION public.enforce_reference_images_limits();

-- 3.3. Képmódosítás miatti újramoderálási, borítókép-előléptetési és törlési trigger
CREATE OR REPLACE FUNCTION public.handle_reference_image_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_target_ref_id uuid;
  v_is_editor boolean;
BEGIN
  v_is_editor := public.is_editor_role();

  IF TG_OP = 'DELETE' THEN
    v_target_ref_id := OLD.reference_id;

    -- Törlendő fizikai fájlok bejegyzése a törlési sorba (Audit-megőrzéssel)
    INSERT INTO public.pending_storage_deletions (
      object_key,
      thumb_key,
      partner_id
    ) VALUES (
      OLD.object_key,
      OLD.thumbnail_key,
      OLD.partner_id
    );

    -- Ha a törölt kép borítókép volt, a legkisebb display_order-ű megmaradó képet léptetjük elő
    IF OLD.is_cover = true THEN
      UPDATE public.partner_reference_images
      SET is_cover = true
      WHERE id = (
        SELECT id FROM public.partner_reference_images
        WHERE reference_id = OLD.reference_id
        ORDER BY display_order ASC, created_at ASC
        LIMIT 1
      );
    END IF;
  ELSE
    v_target_ref_id := NEW.reference_id;
  END IF;

  -- Auto-demotion: ha nem platform editor nyúl a képekhez és a referencia publikált, visszaáll piszkozattá
  IF NOT v_is_editor THEN
    UPDATE public.partner_references
    SET is_published = false, updated_at = now()
    WHERE id = v_target_ref_id AND is_published = true;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_reference_image_changes ON public.partner_reference_images;
CREATE TRIGGER trg_handle_reference_image_changes
AFTER INSERT OR UPDATE OR DELETE ON public.partner_reference_images
FOR EACH ROW EXECUTE FUNCTION public.handle_reference_image_changes();

-- ----------------------------------------------------------------------------
-- 4. ATOMI RPC FÜGGVÉNYEK (KORRIGÁLT, SZERVEROLDALI KULCSGENERÁLÁSSAL)
-- ----------------------------------------------------------------------------

-- 4.1. Feltöltési intent létrehozása (Partner / Editor által meghívható)
CREATE OR REPLACE FUNCTION public.create_reference_upload_intent(
  p_partner_id uuid,
  p_reference_id uuid
)
RETURNS TABLE (
  intent_id uuid,
  staging_key text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_id uuid := gen_random_uuid();
  v_staging text;
  v_count integer;
BEGIN
  IF NOT (public.is_partner_admin(p_partner_id) OR public.is_editor_role()) THEN
    RAISE EXCEPTION 'Nincs jogosultsága feltöltés indításához!' USING ERRCODE = '42501';
  END IF;

  -- Referencia létezésének és összetartozásának ellenőrzése
  IF NOT EXISTS (
    SELECT 1 FROM public.partner_references
    WHERE id = p_reference_id AND partner_id = p_partner_id
  ) THEN
    RAISE EXCEPTION 'A referencia nem található ennél a partnernél!' USING ERRCODE = 'P0008';
  END IF;

  -- Képszám korlát előzetes ellenőrzése
  SELECT count(*) INTO v_count
  FROM public.partner_reference_images
  WHERE reference_id = p_reference_id;

  IF v_count >= 10 THEN
    RAISE EXCEPTION 'A referencia elérte a maximális 10 képet!' USING ERRCODE = 'P0002';
  END IF;

  v_staging := 'staging/uploads/' || v_new_id::text || '.tmp';

  INSERT INTO public.reference_upload_intents (
    id,
    partner_id,
    reference_id,
    user_id,
    staging_key,
    status,
    expires_at
  ) VALUES (
    v_new_id,
    p_partner_id,
    p_reference_id,
    auth.uid(),
    v_staging,
    'created',
    now() + interval '5 minutes'
  );

  RETURN QUERY SELECT v_new_id, v_staging;
END;
$$;

-- 4.2. Feltöltési intent atomi igénylése (Service Role által hívható confirm előtt)
CREATE OR REPLACE FUNCTION public.claim_upload_intent(p_intent_id uuid)
RETURNS TABLE (
  intent_id uuid,
  partner_id uuid,
  reference_id uuid,
  staging_key text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_intent record;
BEGIN
  SELECT id, t.partner_id, t.reference_id, t.staging_key, t.status, t.expires_at
  INTO v_intent
  FROM public.reference_upload_intents t
  WHERE id = p_intent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feltöltési intent nem található!' USING ERRCODE = 'P0010';
  END IF;

  IF v_intent.status <> 'created' THEN
    RAISE EXCEPTION 'Az intent érvénytelen státuszban van: %', v_intent.status USING ERRCODE = 'P0011';
  END IF;

  IF v_intent.expires_at < now() THEN
    UPDATE public.reference_upload_intents SET status = 'expired' WHERE id = p_intent_id;
    RAISE EXCEPTION 'Az intent lejárt!' USING ERRCODE = 'P0012';
  END IF;

  UPDATE public.reference_upload_intents
  SET status = 'validating'
  WHERE id = p_intent_id;

  RETURN QUERY SELECT v_intent.id, v_intent.partner_id, v_intent.reference_id, v_intent.staging_key;
END;
$$;

-- 4.3. Képrekord véglegesítése (SZERVEROLDALI DETERMINISZTIKUS KULCSGENERÁLÁSSAL)
CREATE OR REPLACE FUNCTION public.finalize_reference_image(
  p_intent_id uuid,
  p_caption text,
  p_width integer,
  p_height integer,
  p_size_bytes bigint,
  p_is_cover boolean
)
RETURNS TABLE (
  image_id uuid,
  permanent_object_key text,
  permanent_thumb_key text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_intent record;
  v_new_image_id uuid := gen_random_uuid();
  v_obj_key text;
  v_th_key text;
  v_order integer;
  v_cover boolean := p_is_cover;
BEGIN
  SELECT id, partner_id, reference_id, status
  INTO v_intent
  FROM public.reference_upload_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  IF NOT FOUND OR v_intent.status <> 'validating' THEN
    RAISE EXCEPTION 'Az intent nem érvényesíthető vagy nem validating státuszú!' USING ERRCODE = 'P0014';
  END IF;

  -- Képsorrend meghatározása
  SELECT COALESCE(max(display_order), 0) + 1 INTO v_order
  FROM public.partner_reference_images
  WHERE reference_id = v_intent.reference_id;

  -- Ha ez az első kép a referenciához, kötelezően borítóképpé tesszük
  IF v_order = 1 THEN
    v_cover := true;
  END IF;

  -- Szerveroldali biztonságos kulcsgenerálás: a kliens nem injektálhat tetszőleges útvonalat
  v_obj_key := 'partners/' || v_intent.partner_id::text || '/references/' || v_intent.reference_id::text || '/' || v_new_image_id::text || '.webp';
  v_th_key := 'partners/' || v_intent.partner_id::text || '/references/' || v_intent.reference_id::text || '/thumbs/' || v_new_image_id::text || '.webp';

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
    v_new_image_id,
    v_intent.reference_id,
    v_intent.partner_id,
    v_obj_key,
    v_th_key,
    p_caption,
    v_order,
    v_cover,
    p_width,
    p_height,
    p_size_bytes
  );

  -- Intent sikeres végleges lezárása
  UPDATE public.reference_upload_intents
  SET status = 'consumed', consumed_at = now()
  WHERE id = p_intent_id;

  RETURN QUERY SELECT v_new_image_id, v_obj_key, v_th_key;
END;
$$;

-- 4.4. Tranzakcióbiztos borítókép-váltás RPC
CREATE OR REPLACE FUNCTION public.set_reference_cover_image(
  p_reference_id uuid,
  p_image_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_partner_id uuid;
  v_is_editor boolean;
BEGIN
  v_is_editor := public.is_editor_role();

  -- Kép és referencia létezésének vizsgálata
  SELECT partner_id INTO v_partner_id
  FROM public.partner_reference_images
  WHERE id = p_image_id AND reference_id = p_reference_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A megadott kép nem található a referenciában!' USING ERRCODE = 'P0020';
  END IF;

  IF NOT (public.is_partner_admin(v_partner_id) OR v_is_editor) THEN
    RAISE EXCEPTION 'Nincs jogosultsága a borítókép módosításához!' USING ERRCODE = '42501';
  END IF;

  -- Szülő referencia zárolása
  PERFORM 1 FROM public.partner_references
  WHERE id = p_reference_id
  FOR UPDATE;

  -- 1. Korábbi borítókép visszavonása
  UPDATE public.partner_reference_images
  SET is_cover = false
  WHERE reference_id = p_reference_id AND is_cover = true;

  -- 2. Új borítókép beállítása
  UPDATE public.partner_reference_images
  SET is_cover = true
  WHERE id = p_image_id AND reference_id = p_reference_id;

  -- 3. Ha nem editor végzi, auto-demote a referenciára
  IF NOT v_is_editor THEN
    UPDATE public.partner_references
    SET is_published = false, updated_at = now()
    WHERE id = p_reference_id AND is_published = true;
  END IF;

  RETURN true;
END;
$$;

-- 4.5. Törlési queue feladatok atomi foglalása (KORRIGÁLT RETRY ÉS CRASH LOGIKÁVAL)
CREATE OR REPLACE FUNCTION public.claim_storage_deletion_tasks(
  p_batch_size integer DEFAULT 20,
  p_lock_duration interval DEFAULT interval '5 minutes'
)
RETURNS TABLE (
  task_id uuid,
  object_key text,
  thumb_key text,
  partner_id uuid,
  retry_count integer,
  lock_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token uuid := gen_random_uuid();
BEGIN
  RETURN QUERY
  WITH claimable AS (
    SELECT id, status
    FROM public.pending_storage_deletions
    WHERE (
      (status IN ('pending', 'failed') AND next_retry_at <= now() AND (locked_until IS NULL OR locked_until < now()))
      OR
      -- Összeomlott worker feladatainak visszavétele lejárt lock esetén
      (status = 'processing' AND locked_until < now())
    )
    ORDER BY created_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.pending_storage_deletions t
  SET status = 'processing',
      locked_until = now() + p_lock_duration,
      worker_lock_token = v_token,
      -- Csak akkor növeljük a próbálkozást, ha egy összeomlott feldolgozótól vesszük vissza a feladatot!
      retry_count = CASE WHEN claimable.status = 'processing' THEN t.retry_count + 1 ELSE t.retry_count END
  FROM claimable
  WHERE t.id = claimable.id
  RETURNING t.id, t.object_key, t.thumb_key, t.partner_id, t.retry_count, t.worker_lock_token;
END;
$$;

-- 4.6. Törlési queue feladat lezárása (AUDIT-MEGŐRZÉSSEL, NEM AZONNALI TÖRLÉSSEL)
CREATE OR REPLACE FUNCTION public.complete_storage_deletion_task(
  p_task_id uuid,
  p_lock_token uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.pending_storage_deletions
  SET status = 'completed',
      completed_at = now(),
      locked_until = NULL,
      worker_lock_token = NULL
  WHERE id = p_task_id 
    AND worker_lock_token = p_lock_token
    AND status = 'processing';

  RETURN FOUND;
END;
$$;

-- 4.7. Törlési queue feladat hibára futtatása
CREATE OR REPLACE FUNCTION public.fail_storage_deletion_task(
  p_task_id uuid,
  p_lock_token uuid,
  p_error_message text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.pending_storage_deletions
  SET status = CASE WHEN retry_count + 1 >= 5 THEN 'dead_letter' ELSE 'failed' END,
      retry_count = retry_count + 1,
      next_retry_at = now() + (interval '1 minute' * power(2, retry_count)),
      locked_until = NULL,
      worker_lock_token = NULL,
      error_message = p_error_message
  WHERE id = p_task_id 
    AND worker_lock_token = p_lock_token
    AND status = 'processing';

  RETURN FOUND;
END;
$$;

-- 4.8. Adminisztrátori publikálás dedikált RPC-je
CREATE OR REPLACE FUNCTION public.publish_partner_reference(p_reference_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_editor_role() THEN
    RAISE EXCEPTION 'Kizárólag platform adminisztrátor publikálhat referenciát!' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.partner_reference_images
    WHERE reference_id = p_reference_id AND is_cover = true
  ) THEN
    RAISE EXCEPTION 'A referencia nem publikálható: pontosan egy kijelölt borítóképpel kell rendelkeznie!' USING ERRCODE = 'P0003';
  END IF;

  UPDATE public.partner_references
  SET is_published = true, updated_at = now()
  WHERE id = p_reference_id;

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) ÉS JOGOSULTSÁGOK (GRANT)
-- ----------------------------------------------------------------------------

-- Alapértelmezett jogok visszavonása
REVOKE ALL ON public.partner_references FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.partner_reference_images FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.reference_upload_intents FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.pending_storage_deletions FROM PUBLIC, anon, authenticated;

-- Publikus és autentikált SELECT engedélyezése az üzleti táblákon
GRANT SELECT ON public.partner_references TO anon, authenticated;
GRANT SELECT ON public.partner_reference_images TO anon, authenticated;

-- Kizárólag autentikált userek kaphatnak DML jogot (RLS felügyeletével)
GRANT INSERT, UPDATE, DELETE ON public.partner_references TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partner_reference_images TO authenticated;

-- Belső táblák (intents, queue) elérése kizárólag a service_role számára
GRANT ALL ON public.reference_upload_intents TO service_role;
GRANT ALL ON public.pending_storage_deletions TO service_role;

-- RPC függvények futtatási jogai
REVOKE ALL ON FUNCTION public.create_reference_upload_intent(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_upload_intent(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_reference_cover_image(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_storage_deletion_tasks(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_storage_deletion_task(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_storage_deletion_task(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_partner_reference(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_reference_upload_intent(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_reference_cover_image(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_partner_reference(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.claim_upload_intent(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_storage_deletion_tasks(integer, interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_storage_deletion_task(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_storage_deletion_task(uuid, uuid, text) TO service_role;

-- RLS Házirendek bekapcsolása
ALTER TABLE public.partner_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_references FORCE ROW LEVEL SECURITY;

ALTER TABLE public.partner_reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_reference_images FORCE ROW LEVEL SECURITY;

ALTER TABLE public.reference_upload_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_upload_intents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.pending_storage_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_storage_deletions FORCE ROW LEVEL SECURITY;

-- 5.1. partner_references RLS
CREATE POLICY "References select policy"
ON public.partner_references FOR SELECT
USING (
  is_published = true
  OR public.is_editor_role()
  OR public.is_partner_admin(partner_id)
);

CREATE POLICY "References insert policy"
ON public.partner_references FOR INSERT
TO authenticated
WITH CHECK (
  public.is_editor_role()
  OR public.is_partner_admin(partner_id)
);

CREATE POLICY "References update policy"
ON public.partner_references FOR UPDATE
TO authenticated
USING (
  public.is_editor_role()
  OR public.is_partner_admin(partner_id)
)
WITH CHECK (
  public.is_editor_role()
  OR public.is_partner_admin(partner_id)
);

CREATE POLICY "References delete policy"
ON public.partner_references FOR DELETE
TO authenticated
USING (
  public.is_editor_role()
  OR public.is_partner_admin(partner_id)
);

-- 5.2. partner_reference_images RLS
CREATE POLICY "Images select policy"
ON public.partner_reference_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_references r
    WHERE r.id = reference_id
      AND (r.is_published = true OR public.is_editor_role() OR public.is_partner_admin(r.partner_id))
  )
);

CREATE POLICY "Images insert policy"
ON public.partner_reference_images FOR INSERT
TO authenticated
WITH CHECK (
  public.is_editor_role()
  OR public.is_partner_admin(partner_id)
);

CREATE POLICY "Images update policy"
ON public.partner_reference_images FOR UPDATE
TO authenticated
USING (
  public.is_editor_role()
  OR public.is_partner_admin(partner_id)
)
WITH CHECK (
  public.is_editor_role()
  OR public.is_partner_admin(partner_id)
);

CREATE POLICY "Images delete policy"
ON public.partner_reference_images FOR DELETE
TO authenticated
USING (
  public.is_editor_role()
  OR public.is_partner_admin(partner_id)
);

COMMIT;
```

---

## 4. TELJES JOGOSULTSÁGI ÉS RLS MÁTRIX

| Szerepkör | `partner_references` SELECT | `partner_references` DML | `partner_reference_images` SELECT | `partner_reference_images` DML | Upload Intent RPC-k | Queue Worker RPC-k |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`anon`** | Csak `is_published = true` | TILTOTT (`42501`) | Csak publikált referencia képei | TILTOTT (`42501`) | TILTOTT | TILTOTT |
| **`authenticated` (Member)** | Csak `is_published = true` | TILTOTT (RLS tiltja) | Csak publikált referencia képei | TILTOTT (RLS tiltja) | TILTOTT (`42501`) | TILTOTT |
| **`authenticated` (Partner Admin)**| Publikált + saját draftok | Saját partnerre engedélyezve (auto-demote védett)| Publikált + saját draft képei | Saját referenciára engedélyezve (max 10) | Saját partnerre engedélyezve | TILTOTT |
| **Platform Editor / Admin** | Minden referencia | Minden referenciára (publikálás joggal) | Minden referencia képei | Minden referenciára engedélyezve | Minden partnerre engedélyezve | TILTOTT |
| **`service_role`** | Bypass RLS | Bypass RLS | Bypass RLS | Bypass RLS | `claim_intent`, `finalize_image` | `claim`, `complete`, `fail` |

---

## 5. TÖRLÉSI QUEUE ÁLLAPOTGÉP ÉS RECOVERY

```
       +------------------+
       |     pending      | <------------------------------------+
       +------------------+                                      |
                 |                                               |
                 | claim_storage_deletion_tasks()                |
                 v                                               |
       +------------------+                                      |
       |    processing    | --- (timeout / lock expired) --------+
       +------------------+
          /            \
         /              \
        / complete       \ fail (retry_count++)
       v                  v
+--------------+    +--------------+
|  completed   |    |    failed    | ---> (retry_count >= 5) ---> +---------------+
+--------------+    +--------------+                              |  dead_letter  |
(audit megőrzés)           |                                      +---------------+
                           | next_retry_at lejár
                           v
                    (vissza pending-be)
```

1. **Atomikus foglalás:** `claim_storage_deletion_tasks` egyedi `worker_lock_token`-t generál és rögzít a sorban.
2. **Crash recovery:** Ha a worker összeomlik, a `locked_until < now()` feltétel miatt a következő worker átveheti. Ekkor a rendszer inkrementálja a `retry_count`-ot.
3. **Idempotens lezárás:** A `complete_storage_deletion_task` csak akkor fut le, ha a beküldött token egyezik a rögzített tokennel. A sikeres feladat `completed` státuszba kerül, megőrizve az audit-nyomot.

---

## 6. KIBŐVÍTETT TESZTMÁTRIX (31 TESZTESET)

Minden teszt státusza: `[NEM FUTTATOTT]`.

| ID | Teszt Eset Leírása | Szerepkör | Végrehajtás Módja | Elvárt Eredmény | Státusz |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | Anon publikus referencia olvasása | Anon | `SELECT ... WHERE is_published = true` | 200 OK, adatok megtekinthetők. | `[NEM FUTTATOTT]` |
| **SEC-02** | Anon draft referencia olvasása | Anon | `SELECT ... WHERE is_published = false` | 0 sor (RLS blokkolja). | `[NEM FUTTATOTT]` |
| **SEC-03** | Partner saját draft létrehozása | Partner Admin | `INSERT INTO partner_references` | Sikeres, `is_published = false`. | `[NEM FUTTATOTT]` |
| **SEC-04** | Partner más partner adatának elérése | Partner Admin A | `SELECT ... WHERE partner_id = 'B'` (draft)| 0 sor (RLS blokkolja). | `[NEM FUTTATOTT]` |
| **SEC-05** | Partner közvetlen publikálási kísérlete| Partner Admin | `UPDATE ... SET is_published = true` | Kivétel `42501` (Only admin can publish). | `[NEM FUTTATOTT]` |
| **SEC-06** | Partner közvetlen unpublish kísérlete | Partner Admin | `UPDATE ... SET is_published = false` | Kivétel `42501` (Direct unpublish denied). | `[NEM FUTTATOTT]` |
| **SEC-07** | Partner `partner_id` módosítási kísérlet | Partner Admin | `UPDATE ... SET partner_id = <új uuid>` | Kivétel `42501` (partner_id immutable). | `[NEM FUTTATOTT]` |
| **SEC-08** | Editor `partner_id` módosítási kísérlet | Editor | `UPDATE ... SET partner_id = <új uuid>` | Kivétel `42501` (partner_id immutable). | `[NEM FUTTATOTT]` |
| **SEC-09** | Partner `created_at` manipulációja | Partner Admin | `UPDATE ... SET created_at = 2020-01-01` | Érték változatlan marad (`OLD.created_at`). | `[NEM FUTTATOTT]` |
| **SEC-10** | Partner kategóriamódosítása publikáltnál| Partner Admin | `UPDATE ... SET category = 'uj_kat'` | Sikeres, DE `is_published` auto-demote `false`! | `[NEM FUTTATOTT]` |
| **SEC-11** | Partner tartalmi módosítása publikáltnál| Partner Admin | `UPDATE ... SET title = 'Új cím'` | Sikeres, DE `is_published` auto-demote `false`! | `[NEM FUTTATOTT]` |
| **SEC-12** | Editor publikálása borítóképpel | Editor | `publish_partner_reference(uuid)` RPC | Sikeres, `is_published = true`. | `[NEM FUTTATOTT]` |
| **SEC-13** | Publikálás borítókép nélkül | Editor | `publish_partner_reference(uuid)` RPC | Kivétel `P0003` (Cover required). | `[NEM FUTTATOTT]` |
| **SEC-14** | Partner saját referencia képfeltöltése | Partner Admin | `finalize_reference_image` RPC | Sikeres beszúrás. | `[NEM FUTTATOTT]` |
| **SEC-15** | Képinjekció idegen referenciához | Partner Admin A | `INSERT` kép Partner B `reference_id`-val | `23503 foreign_key_violation` (Composite FK).| `[NEM FUTTATOTT]` |
| **SEC-16** | Partner idegen kép törlési kísérlete | Partner Admin A | `DELETE FROM images WHERE partner_id = 'B'`| Kivétel `42501` / 0 sor törlődik. | `[NEM FUTTATOTT]` |
| **SEC-17** | Képmódosítás publikált referenciánál | Partner Admin | `UPDATE images SET caption = 'Új'` | Sikeres, de szülő auto-demote `false`! | `[NEM FUTTATOTT]` |
| **SEC-18** | Borítókép-váltás RPC | Partner Admin | `set_reference_cover_image(ref_id, img_id)`| Tranzakciós csere, nincs indexütközés. | `[NEM FUTTATOTT]` |
| **SEC-19** | Borítókép törlése egyképes referenciánál| Partner Admin | `DELETE` az egyetlen (borító)képre | Kép törlődik, referencia piszkozat marad. | `[NEM FUTTATOTT]` |
| **SEC-20** | Borítókép törlése többképes referenciánál| Partner Admin| `DELETE` a borítóképre | Következő kép auto-előlép borítóképpé. | `[NEM FUTTATOTT]` |
| **SEC-21** | Párhuzamos feltöltés 10 képnél | 2 szál | Konkurens `finalize_reference_image` | Pontosan 1 siker, 1 hiba (`P0002` max 10). | `[NEM FUTTATOTT]` |
| **SEC-22** | Consumed intent újbóli finalize kísérlete| Service Role | Második finalize hívás ugyanazzal az intenttel | Kivétel `P0014` (Intent nem érvényesíthető). | `[NEM FUTTATOTT]` |
| **SEC-23** | Más user intentjének felhasználása | Idegen User | Confirm kísérlet idegen intentre | Kivétel `42501` / intent hozzáférés megtagadva.| `[NEM FUTTATOTT]` |
| **SEC-24** | Idegen staging_key használata | Támadó | Kísérlet tetszőleges staging kulcsra | Csak az intenthez rendelt staging kulcs él. | `[NEM FUTTATOTT]` |
| **SEC-25** | Törlési queue feladat atomi claim | Service Role | `claim_storage_deletion_tasks(20)` | `worker_lock_token` kiadva, sor zárolva. | `[NEM FUTTATOTT]` |
| **SEC-26** | Lejárt lockkal rendelkező task újrafelvétele| Service Role| Claim futtatása lejárt `locked_until` után | Task újra kiadva, `retry_count` +1. | `[NEM FUTTATOTT]` |
| **SEC-27** | Lejárt lockkal complete kísérlet | Régi Worker | `complete_storage_deletion_task(id, old_tok)` | Eredmény `false`, rekord nem módosul. | `[NEM FUTTATOTT]` |
| **SEC-28** | Lejárt lockkal fail kísérlet | Régi Worker | `fail_storage_deletion_task(id, old_tok, err)`| Eredmény `false`, rekord nem módosul. | `[NEM FUTTATOTT]` |
| **SEC-29** | Completed queue task audit-megőrzése | Service Role | `SELECT FROM pending_storage_deletions` | Rekord megmarad `status = 'completed'`-ként.| `[NEM FUTTATOTT]` |
| **SEC-30** | Queue 5 sikertelen hiba után | Service Role | 5x fail hívás | Rekord státusza: `dead_letter`. | `[NEM FUTTATOTT]` |
| **SEC-31** | Teljes referencia törlése és queue | Partner Admin | `DELETE FROM partner_references` | Referencia és képek törlődnek, queue naplóz.| `[NEM FUTTATOTT]` |

---

## 7. MÓDOSÍTOTT ÉS ÚJ ADATBÁZIS-OBJEKTUMOK LISTÁJA

1. **Táblák (ÚJ):**
   - `public.partner_references`
   - `public.partner_reference_images`
   - `public.reference_upload_intents`
   - `public.pending_storage_deletions`
2. **Kényszerek és Indexek (ÚJ):**
   - `partner_references_id_partner_id_key` (Composite Unique)
   - `fk_images_reference_partner` (Composite Foreign Key)
   - `idx_single_cover_per_reference` (Partial Unique Index)
   - `idx_storage_deletions_claim` (Index)
   - `idx_ref_images_ref_order` (Index)
3. **Triggerfüggvények és Triggerek (ÚJ):**
   - `public.enforce_reference_publication_security()` -> `trg_enforce_reference_publication_security`
   - `public.enforce_reference_images_limits()` -> `trg_enforce_reference_images_limits`
   - `public.handle_reference_image_changes()` -> `trg_handle_reference_image_changes`
4. **RPC Függvények (ÚJ):**
   - `public.create_reference_upload_intent(uuid, uuid)`
   - `public.claim_upload_intent(uuid)`
   - `public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean)`
   - `public.set_reference_cover_image(uuid, uuid)`
   - `public.claim_storage_deletion_tasks(integer, interval)`
   - `public.complete_storage_deletion_task(uuid, uuid)`
   - `public.fail_storage_deletion_task(uuid, uuid, text)`
   - `public.publish_partner_reference(uuid)`
5. **Meglévő objektumok érintettsége:**
   - `public.partners` (Meglévő): Csak hivatkozás történik rá (`partner_id REFERENCES partners(id)`), **szerkezete NEM módosul**.
   - `public.partner_users` (Meglévő): **Szerkezete NEM módosul**.
   - `public.is_partner_admin(uuid)` (Meglévő): Csak olvasásra/meghívásra kerül, **NEM módosul**.
   - `public.is_editor_role()` (Meglévő): Csak olvasásra/meghívásra kerül, **NEM módosul**.

---

## 8. BIZTONSÁGOS ROLLBACK ÉS INAKTIVÁLÁSI TERV

A destruktív `DROP TABLE ... CASCADE` művelet helyett az alábbi többszintű helyreállítási eljárás érvényes:
1. **1. szint: Azonnali hozzáférés-lezárás (0. perc):**
   ```sql
   REVOKE ALL ON public.partner_references FROM anon, authenticated;
   REVOKE ALL ON public.partner_reference_images FROM anon, authenticated;
   ```
   Ezzel a felület azonnal lezárul, nem történhet adatbevitel vagy lekérés, de semmilyen meglévő adat nem vész el.
2. **2. szint: Frontend inaktiválás:** Git revert a korábbi stabil frontend állapotra.
3. **3. szint: Fizikai objektum-takarítás (Kizárólag teljes elállás és explicit jóváhagyás esetén):**
   ```sql
   DROP TRIGGER IF EXISTS trg_enforce_reference_publication_security ON public.partner_references;
   DROP TRIGGER IF EXISTS trg_enforce_reference_images_limits ON public.partner_reference_images;
   DROP TRIGGER IF EXISTS trg_handle_reference_image_changes ON public.partner_reference_images;
   DROP FUNCTION IF EXISTS public.create_reference_upload_intent(uuid, uuid);
   DROP FUNCTION IF EXISTS public.claim_upload_intent(uuid);
   DROP FUNCTION IF EXISTS public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean);
   DROP FUNCTION IF EXISTS public.set_reference_cover_image(uuid, uuid);
   DROP FUNCTION IF EXISTS public.claim_storage_deletion_tasks(integer, interval);
   DROP FUNCTION IF EXISTS public.complete_storage_deletion_task(uuid, uuid);
   DROP FUNCTION IF EXISTS public.fail_storage_deletion_task(uuid, uuid, text);
   DROP FUNCTION IF EXISTS public.publish_partner_reference(uuid);
   DROP FUNCTION IF EXISTS public.enforce_reference_publication_security();
   DROP FUNCTION IF EXISTS public.enforce_reference_images_limits();
   DROP FUNCTION IF EXISTS public.handle_reference_image_changes();
   DROP TABLE IF EXISTS public.pending_storage_deletions;
   DROP TABLE IF EXISTS public.reference_upload_intents;
   DROP TABLE IF EXISTS public.partner_reference_images;
   DROP TABLE IF EXISTS public.partner_references;
   ```

---

## 9. FENNMARADÓ KOCKÁZATOK ÉS ÉRTÉKELÉSÜK

| Kockázat | Valószínűség | Hatás | Kezelési Mechanizmus |
| :--- | :---: | :---: | :--- |
| **Hálózati megszakadás R2 írás és finalize között** | Alacsony | Alacsony | Az intent `validating` állapotban marad és 5 perc után lejár. A heti takarító cron törli a staging fájlt. |
| **Admin véletlen unpublish tartalmi változás nélkül**| Alacsony | Minimális | Platform editor bármikor visszavonhatja vagy újra publikálhatja a referenciát. |
| **Queue túlterhelés tömeges képtörléskor** | Alacsony | Minimális | A queue feladatok batch-elve (20-asával), `SKIP LOCKED` párhuzamosítással futnak. |

---

## 10. KÖTELEZŐ LEÁLLÁSI PONT

A javított tervdokumentáció elkészült. Semmilyen SQL módosítás vagy adatbázis-beavatkozás nem történt.

`F1 CORRECTION COMPLETED – WAITING FOR REVIEW AND SQL APPROVAL`

