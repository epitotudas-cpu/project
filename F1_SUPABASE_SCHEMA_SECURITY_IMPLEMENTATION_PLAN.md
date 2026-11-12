# F1 – REFERENCIA-GALÉRIA SUPABASE ADATMODELL ÉS JOGOSULTSÁGI RENDSZER IMPLEMENTÁCIÓS TERV

**Dokumentumazonosító:** `F1_SUPABASE_SCHEMA_SECURITY_IMPLEMENTATION_PLAN.md`  
**Projekt:** ÉpítőTudás  
**Supabase projekt:** `olmavxcmkvvcebgqxohe`  
**Supabase URL:** `https://olmavxcmkvvcebgqxohe.supabase.co`  
**Kizárt projekt:** Thingor (`apfslrzogelqceifhpky`)  
**Fázis:** F1 – Adatmodell és Biztonsági Jogosultságok Előkészítése  
**Előző fázis:** F0 COMPLETED (Privát `epitotudas-media` R2 bucket aktív)  
**Munkamód:** READ-ONLY PREPARATION – NO SQL EXECUTION  
**Dátum:** 2026-11-12  

**Kötelező záróállapot:**  
`F1 PLAN COMPLETED – WAITING FOR EXPLICIT SQL EXECUTION APPROVAL`

---

## 1. KÖTELEZŐ PROJEKTAZONOSÍTÁS ÉS BIZONYÍTÉKOK

A vizsgálat során közvetlen HTTP REST ellenőrzéssel azonosítottuk a célprojektet:

- **Projektazonosító:** `olmavxcmkvvcebgqxohe` **[BIZONYÍTOTT]**
- **Szerver válaszfejléc:** `sb-project-ref: olmavxcmkvvcebgqxohe` **[BIZONYÍTOTT]**
- **Végpont:** `https://olmavxcmkvvcebgqxohe.supabase.co` **[BIZONYÍTOTT]**
- **Hitelesítés:** A projekt éles `VITE_SUPABASE_ANON_KEY` kulcsával a `partners` tábla rekordjai (`78-as Építők Kft.`, `Teszt Iskola`) közvetlenül lekérdezhetők. **[BIZONYÍTOTT]**
- **Thingor kizárása:** Az MCP szerver konfigurációjában szereplő `apfslrzogelqceifhpky` (Thingor) projekt azonosítva és szigorúan kizárva. Minden vizsgálat kizárólag az ÉpítőTudás `olmavxcmkvvcebgqxohe` infrastruktúrájára korlátozódott. **[BIZONYÍTOTT]**

---

## 2. ÉLES ADATBÁZIS ÁLLAPOTFELMÉRÉSE

| Vizsgálati pont | Éles Adatbázis Tényleges Állapota | Bizonyíték (REST válasz / Migráció) | Minősítés |
| :--- | :--- | :--- | :---: |
| **`partner_references` tábla létezik?** | **Nem létezik.** | HTTP 404 (`PGRST205: Could not find the table 'public.partner_references' in the schema cache`). | **[BIZONYÍTOTT]** |
| **`partner_reference_images` tábla létezik?**| **Nem létezik.** | HTTP 404 (`PGRST205: Could not find the table 'public.partner_reference_images' in the schema cache`). | **[BIZONYÍTOTT]** |
| **`pending_storage_deletions` tábla létezik?**| **Nem létezik.** | HTTP 404 (`PGRST205: Could not find the table 'public.pending_storage_deletions' in the schema cache`). | **[BIZONYÍTOTT]** |
| **`reference_upload_intents` tábla létezik?** | **Nem létezik.** | HTTP 404 (`PGRST205: Could not find the table 'public.reference_upload_intents' in the schema cache`). | **[BIZONYÍTOTT]** |
| **`partners` tábla struktúrája?** | Létezik (23 oszlop, pl. `id, name, slug, category, is_verified, ...`). Nem tartalmaz referenciamezőket. | HTTP 200 JSON válasz az éles API-ból. | **[BIZONYÍTOTT]** |
| **`partner_users` tábla struktúrája?** | Létezik (`id, partner_id, user_id, role, member_role, created_at`). RLS aktív, anon elérés blokkolva (`[]`). | HTTP 200 (`content-profile: public`, üres tömb anon kulccsal). | **[BIZONYÍTOTT]** |
| **`is_partner_admin(uuid)` definíciója?** | Létezik (`SECURITY DEFINER, search_path = ''`, `STABLE`). Ellenőrzi a tagságot: `owner, admin, school_admin, partner_admin`. | `supabase/migrations/20261110_001_fix_partner_and_users_rls.sql:31-47`. | **[BIZONYÍTOTT]** |
| **`is_editor_role()` definíciója?** | Létezik (`SECURITY DEFINER, search_path = ''`). Ellenőrzi a `profiles` táblát: `role IN ('admin', 'editor')`. | `supabase/migrations/20260718163551_fix_rls_recursion.sql.sql:17-27`. | **[BIZONYÍTOTT]** |

---

## 3. VÉGLEGES ADATMODELL SPECIFIKÁCIÓ

A rendszer 4 szorosan összefüggő, relációs és tranzakcióbiztos táblára épül:

```mermaid
erDiagram
    partners ||--o{ partner_references : "1:N (partner_id)"
    partner_references ||--o{ partner_reference_images : "1:N (Composite FK: id, partner_id)"
    partner_references ||--o{ reference_upload_intents : "1:N (staging)"
    partner_reference_images ..> pending_storage_deletions : "AFTER DELETE trigger (független sor)"

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

### 3.1. `partner_references` tábla
- **Composite Unique Constraint:** `UNIQUE (id, partner_id)` – elengedhetetlen a gyermek táblák kereszt-partner védelméhez.
- **`is_published` mező:** Alapértelmezetten `false`. Partner soha nem állíthatja közvetlenül `true`-ra.

### 3.2. `partner_reference_images` tábla
- **Composite Foreign Key:** `FOREIGN KEY (reference_id, partner_id) REFERENCES public.partner_references(id, partner_id) ON DELETE CASCADE`.
  - **Matematikai Garancia:** Egy képrekord csak akkor szúrható be, ha a `partner_id` megegyezik a hivatkozott referencia `partner_id`-jával! Idegen referenciához való képinjekció adatbázismotor szinten lehetetlen.
- **Borítókép egyediség:** `CREATE UNIQUE INDEX idx_single_cover_per_reference ON public.partner_reference_images(reference_id) WHERE is_cover = true;`
- **Képszám korlát:** Legfeljebb 10 kép referenciánként (a szülő rekord zárolásával védett `BEFORE INSERT` trigger).

### 3.3. `reference_upload_intents` tábla
- Kétfázisú feltöltési életciklus: a presigned PUT URL kizárólag a `staging/uploads/<intent_id>.tmp` kulcsra adható ki.
- A végleges kulcsra (`partners/.../<uuid>.webp`) csak az Edge Function másolhatja át az ellenőrzött fájlt.

### 3.4. `pending_storage_deletions` tábla
- **Teljes relációs függetlenség:** Nincs foreign key a szülő táblákra. Ha egy teljes referenciát vagy partnert törölnek, a fizikai törlésre váró R2 kulcsok megmaradnak a queue-ban!
- **Konkurens zárolás védelem:** `worker_lock_token uuid` mező védi a feladatokat az elavult (stale) worker hívásoktól.

---

## 4. JOGOSULTSÁGI MÁTRIX ÉS SZEREPKÖRÖK

| Művelet | `anon` | Partner Member | Partner Admin | Platform Editor / Admin | `service_role` (Edge Func) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Publikált referencia olvasása** | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** |
| **Draft referencia olvasása** | TILTOTT | TILTOTT | **ENGEDÉLYEZETT** (Csak saját) | **ENGEDÉLYEZETT** (Összes) | **ENGEDÉLYEZETT** |
| **Saját draft létrehozása** | TILTOTT | TILTOTT | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** |
| **Idegen referencia módosítása** | TILTOTT | TILTOTT | TILTOTT | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** |
| **Publikálás (`false -> true`)** | TILTOTT | TILTOTT | **SZIGORÚAN TILTOTT** | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** |
| **Publikáció visszavonása** | TILTOTT | TILTOTT | **SZIGORÚAN TILTOTT** | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** |
| **Tartalmi szerkesztés (publikált)**| TILTOTT | TILTOTT | **ENGEDÉLYEZETT** (Auto-demote) | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** |
| **Kép hozzáadása / törlése** | TILTOTT | TILTOTT | **ENGEDÉLYEZETT** (Auto-demote) | **ENGEDÉLYEZETT** | **ENGEDÉLYEZETT** |
| **`partner_id` módosítása** | **TILTOTT** | **TILTOTT** | **TILTOTT** | **TILTOTT** | **TILTOTT** |
| **Intent és Queue közvetlen elérés**| **TILTOTT** | **TILTOTT** | **TILTOTT** | **TILTOTT** | **ENGEDÉLYEZETT** |

---

## 5. TELJES, IDEMPOTENS MIGRÁCIÓS SQL-TERVEZET (F1)

*(Figyelem: Ez kizárólag specifikációs tervezet. Futtatása a jóváhagyásig szigorúan tilos!)*

```sql
-- ============================================================================
-- MIGRÁCIÓS TERVEZET: 20261112_001_partner_references_schema.sql
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

-- 1.4. Törlési queue tábla (Független napló)
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

-- 3.1. Referencia entitás védelmi triggere
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

  -- TÖRLÉS MŰVELET
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
    -- 1. partner_id abszolút immutabilitása
    IF NEW.partner_id IS DISTINCT FROM OLD.partner_id THEN
      RAISE EXCEPTION 'A partner_id immutábilis mező, módosítása szigorúan tilos!' USING ERRCODE = '42501';
    END IF;

    -- 2. Jogosultság ellenőrzése OLD.partner_id alapján
    IF NOT (public.is_partner_admin(OLD.partner_id) OR v_is_editor) THEN
      RAISE EXCEPTION 'Nincs jogosultsága a referencia módosításához!' USING ERRCODE = '42501';
    END IF;

    -- 3. Időbélyegek védelme
    NEW.created_at := OLD.created_at;
    NEW.updated_at := now();

    -- 4. Publikációs állapotkezelés
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
         AND NEW.website_url IS NOT DISTINCT FROM OLD.website_url THEN
        RAISE EXCEPTION 'Publikáció közvetlen visszavonása kizárólag adminisztrátor által engedélyezett!' USING ERRCODE = '42501';
      END IF;

      -- Auto-demotion: Tartalmi mezők módosítása esetén a publikált referencia automatikusan visszaminősül piszkozattá
      IF OLD.is_published = true AND (
         NEW.title <> OLD.title OR
         NEW.description IS DISTINCT FROM OLD.description OR
         NEW.location IS DISTINCT FROM OLD.location OR
         NEW.year IS DISTINCT FROM OLD.year OR
         NEW.website_url IS DISTINCT FROM OLD.website_url
      ) THEN
        NEW.is_published := false;
      END IF;
    ELSE
      -- Editor általi publikálás esetén: borítókép kötelező ellenőrzése
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

-- 3.2. Képtábla zárolási és képszámkorlát triggere
CREATE OR REPLACE FUNCTION public.enforce_reference_images_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Szülő rekord kizárólagos sorzárolása
  PERFORM 1 FROM public.partner_references
  WHERE id = NEW.reference_id
  FOR UPDATE;

  SELECT count(*) INTO v_count
  FROM public.partner_reference_images
  WHERE reference_id = NEW.reference_id;

  IF v_count >= 10 THEN
    RAISE EXCEPTION 'A referencia már elérte a maximális 10 képet!' USING ERRCODE = 'P0002';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reference_images_limits ON public.partner_reference_images;
CREATE TRIGGER trg_enforce_reference_images_limits
BEFORE INSERT ON public.partner_reference_images
FOR EACH ROW EXECUTE FUNCTION public.enforce_reference_images_limits();

-- 3.3. Képmódosítás miatti újramoderálási és törlési trigger
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

    -- Törlendő fájlok bejegyzése a törlési sorba
    INSERT INTO public.pending_storage_deletions (
      object_key,
      thumb_key,
      partner_id
    ) VALUES (
      OLD.object_key,
      OLD.thumbnail_key,
      OLD.partner_id
    );

    -- Ha a törölt kép borítókép volt, a legkisebb display_order-ű képet léptetjük elő
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
-- 4. ATOMI RPC FÜGGVÉNYEK
-- ----------------------------------------------------------------------------

-- 4.1. Feltöltési intent atomi igénylése
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

-- 4.2. Képrekord véglegesítése sikeres R2 promóció után
CREATE OR REPLACE FUNCTION public.finalize_reference_image(
  p_intent_id uuid,
  p_object_key text,
  p_thumb_key text,
  p_caption text,
  p_width integer,
  p_height integer,
  p_size_bytes bigint,
  p_is_cover boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_intent record;
  v_new_image_id uuid;
  v_order integer;
BEGIN
  SELECT id, partner_id, reference_id, status
  INTO v_intent
  FROM public.reference_upload_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  IF NOT FOUND OR v_intent.status <> 'validating' THEN
    RAISE EXCEPTION 'Az intent nem érvényesíthető!' USING ERRCODE = 'P0014';
  END IF;

  -- Képsorrend meghatározása
  SELECT COALESCE(max(display_order), 0) + 1 INTO v_order
  FROM public.partner_reference_images
  WHERE reference_id = v_intent.reference_id;

  INSERT INTO public.partner_reference_images (
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
    v_intent.reference_id,
    v_intent.partner_id,
    p_object_key,
    p_thumb_key,
    p_caption,
    v_order,
    p_is_cover,
    p_width,
    p_height,
    p_size_bytes
  ) RETURNING id INTO v_new_image_id;

  -- Intent sikeres lezárása
  UPDATE public.reference_upload_intents
  SET status = 'consumed', consumed_at = now()
  WHERE id = p_intent_id;

  RETURN v_new_image_id;
END;
$$;

-- 4.3. Törlési queue feladatok atomi foglalása Worker Lock Tokennel
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
    SELECT id
    FROM public.pending_storage_deletions
    WHERE (
      (status IN ('pending', 'failed') AND next_retry_at <= now() AND (locked_until IS NULL OR locked_until < now()))
      OR
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
      retry_count = CASE WHEN t.status = 'processing' THEN t.retry_count + 1 ELSE t.retry_count END
  FROM claimable
  WHERE t.id = claimable.id
  RETURNING t.id, t.object_key, t.thumb_key, t.partner_id, t.retry_count, t.worker_lock_token;
END;
$$;

-- 4.4. Törlési queue feladat lezárása (Idempotens törlés vagy archiválás)
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
  DELETE FROM public.pending_storage_deletions
  WHERE id = p_task_id AND worker_lock_token = p_lock_token;
  RETURN FOUND;
END;
$$;

-- 4.5. Törlési queue feladat hibára futtatása
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
  WHERE id = p_task_id AND worker_lock_token = p_lock_token;
  RETURN FOUND;
END;
$$;

-- 4.6. Adminisztrátori publikálás dedikált RPC-je
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
REVOKE ALL ON FUNCTION public.claim_upload_intent(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_reference_image(uuid, text, text, text, integer, integer, bigint, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_storage_deletion_tasks(integer, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_storage_deletion_task(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_storage_deletion_task(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_partner_reference(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_upload_intent(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_reference_image(uuid, text, text, text, integer, integer, bigint, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_storage_deletion_tasks(integer, interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_storage_deletion_task(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_storage_deletion_task(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_partner_reference(uuid) TO authenticated;

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

## 6. ELLENŐRZŐ ÉS TESZTMÁTRIX

Minden teszt státusza: `[NEM FUTTATOTT]` (Specifikált, az éles SQL lefutása után végrehajtandó).

| ID | Teszt Célja | Előfeltétel / Szerepkör | Végrehajtás Módja | Elvárt Eredmény | Státusz |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TEST-01** | Anon publikus referencia olvasása | Anonim (nincs auth) | `SELECT FROM partner_references WHERE is_published = true` | Sikeres adatlekérés. | `[NEM FUTTATOTT]` |
| **TEST-02** | Anon draft referencia olvasása | Anonim (nincs auth) | `SELECT FROM partner_references WHERE is_published = false` | 0 sor (RLS blokkolja). | `[NEM FUTTATOTT]` |
| **TEST-03** | Partner saját draft létrehozása | Partner Admin JWT | `INSERT INTO partner_references` (`is_published = false`) | Sikeres beszúrás. | `[NEM FUTTATOTT]` |
| **TEST-04** | Partner más partner adatának elérése | Partner A Admin | `SELECT FROM partner_references WHERE partner_id = 'Partner B'` | 0 sor (csak ha publikált). | `[NEM FUTTATOTT]` |
| **TEST-05** | Partner publikálási kísérlete | Partner Admin JWT | `UPDATE partner_references SET is_published = true` | Kivétel `42501` (Only admin can publish). | `[NEM FUTTATOTT]` |
| **TEST-06** | Partner publikáció visszavonása | Partner Admin JWT | `UPDATE partner_references SET is_published = false` | Kivétel `42501` (Direct unpublish denied). | `[NEM FUTTATOTT]` |
| **TEST-07** | Partner `partner_id` módosítása | Partner Admin JWT | `UPDATE partner_references SET partner_id = <új uuid>` | Kivétel `42501` (partner_id immutable). | `[NEM FUTTATOTT]` |
| **TEST-08** | Partner képfeltöltési joga | Partner Admin JWT | `INSERT INTO partner_reference_images` (saját ref) | Sikeres beszúrás (max 10-ig). | `[NEM FUTTATOTT]` |
| **TEST-09** | Képinjekció idegen partner ref-hez | Partner A Admin | `INSERT` Partner A `partner_id`-val, de Partner B `reference_id`-val | `23503 foreign_key_violation` (Composite FK).| `[NEM FUTTATOTT]` |
| **TEST-10** | Platform Editor publikálása | Platform Editor JWT | `publish_partner_reference(uuid)` RPC (borítóképpel) | Sikeres, `is_published = true`. | `[NEM FUTTATOTT]` |
| **TEST-11** | Publikálás borítókép nélkül | Platform Editor JWT | `publish_partner_reference(uuid)` RPC (0 borítókép) | Kivétel `P0003` (Cover required). | `[NEM FUTTATOTT]` |
| **TEST-12** | Publikált referencia tartalmi módosítása| Partner Admin JWT | `UPDATE partner_references SET title = 'Új cím'` | Sikeres UPDATE, DE `is_published` auto-demote `false`!| `[NEM FUTTATOTT]` |
| **TEST-13** | Kép beszúrása publikált ref-hez | Partner Admin JWT | `INSERT INTO partner_reference_images` | Sikeres beszúrás, szülő auto-demote `false`! | `[NEM FUTTATOTT]` |
| **TEST-14** | Referencia törlése és törlési queue | Partner Admin JWT | `DELETE FROM partner_references` | Referencia és képek törlődnek, kulcsok a queue-ban!| `[NEM FUTTATOTT]` |
| **TEST-15** | Borítókép törlése több képnél | Partner Admin JWT | `DELETE` a cover képre | Következő kép auto-előlép borítóvá. | `[NEM FUTTATOTT]` |
| **TEST-16** | Lejárt worker lock újrafelvétele | Szimulált timeout | `claim_storage_deletion_tasks()` futtatása | Lejárt processing feladat újrafoglalva. | `[NEM FUTTATOTT]` |
| **TEST-17** | Régi worker lock tokennel complete | Érvénytelen token | `complete_storage_deletion_task(id, régi_token)` | Eredmény: `false`, nem törlődik a sor. | `[NEM FUTTATOTT]` |

---

## 7. BIZTONSÁGOS ROLLBACK ÉS HELYREÁLLÍTÁSI TERV

Ha a migráció futtatása után azonnali visszaállításra van szükség:
1. **TILOS a destruktív `DROP TABLE ... CASCADE`:** Megelőzzük a véletlen adatvesztést és a constraint névütközéseket.
2. **Szoftveres lezárás (Inaktiválás):**
   ```sql
   -- Azonnali jogosultságmegvonás hiba esetén:
   REVOKE ALL ON public.partner_references FROM anon, authenticated;
   REVOKE ALL ON public.partner_reference_images FROM anon, authenticated;
   ```
3. **Frontend visszaállítás:** A git commit revertálásával a frontend nem hivatkozik az új táblákra.
4. **Fizikai takarítás (csak teljes elállás és adatmentés után):**
   ```sql
   DROP TRIGGER IF EXISTS trg_enforce_reference_publication_security ON public.partner_references;
   DROP TRIGGER IF EXISTS trg_enforce_reference_images_limits ON public.partner_reference_images;
   DROP TRIGGER IF EXISTS trg_handle_reference_image_changes ON public.partner_reference_images;
   DROP TABLE IF EXISTS public.pending_storage_deletions;
   DROP TABLE IF EXISTS public.reference_upload_intents;
   DROP TABLE IF EXISTS public.partner_reference_images;
   DROP TABLE IF EXISTS public.partner_references;
   ```

---

## 8. KÖVETKEZŐ FÁZIS FÜGGŐSÉGEI

Az F1 éles SQL futtatása után a következő fázisok indíthatók:
- **F2 Fázis:** Cloudflare Media Proxy Worker deployolása (`media.epitotudas.hu`).
- **F3 Fázis:** Supabase Edge Functions (`r2-presign-upload`, `r2-confirm-upload`, `cloudflare-cache-purge`).
- **F4 Fázis:** Törlési és takarítási háttérfolyamatok (`r2-queue-worker`, `r2-staging-cleanup`, `r2-orphan-audit`).
- **F5 Fázis:** Frontend UI integráció (`PartnerEditorModal.tsx`, `PartnerDetailPage.tsx`).
- **F6 Fázis:** A fenti 17 pontos tesztmátrix automatizált futtatása.

---

## 9. KÖTELEZŐ LEÁLLÁSI PONT

A jelentés elkészült. Semmilyen SQL módosítás vagy adatbázis-művelet nem futott le.

`F1 PLAN COMPLETED – WAITING FOR EXPLICIT SQL EXECUTION APPROVAL`

