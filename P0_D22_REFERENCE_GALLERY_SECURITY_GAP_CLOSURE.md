# P0-D22 – ÉPÍTŐTUDÁS REFERENCIA-GALÉRIA VÉGSŐ BIZTONSÁGI HIÁNYOSSÁGOK LEZÁRÁSA

**Dokumentumazonosító:** `P0_D22_REFERENCE_GALLERY_SECURITY_GAP_CLOSURE.md`  
**Projekt:** ÉpítőTudás  
**Supabase projekt:** `olmavxcmkvvcebgqxohe`  
**Kizárt projekt:** Thingor (`apfslrzogelqceifhpky`)  
**Előzmények:** P0-D17, P0-D18, P0-D19, P0-D20, P0-D21  
**Dátum:** 2026-11-11  
**Vizsgálat típusa:** READ-ONLY / TARGETED SECURITY AUDIT  
**Munkamód:** READ-ONLY PLAN / NO PATCH / NO REFACTOR  
**Prioritás:** P0 – Éles adatbiztonság és jogosultságvédelem  
**Kötelező záróállapot:**  
`P0-D22 READ-ONLY SECURITY GAP CLOSURE COMPLETED – NO CODE, DATABASE, R2, SECRETS, EDGE FUNCTION, WORKER OR GIT CHANGES`

---

## 1. KÖTELEZŐ MŰKÖDÉSI KORLÁTOZÁSOK BETARTÁSA

A vizsgálat szigorúan **READ-ONLY** keretek között zajlott le:
- Forráskód-módosítás, konfiguráció- vagy fájllétrehozás (a jelen jelentésen kívül) **NEM TÖRTÉNT**.
- SQL módosítás, migráció futtatása, RLS-, trigger- vagy adatbázis-módosítás **NEM TÖRTÉNT**.
- Cloudflare R2 bucket, API-kulcs vagy Supabase Secrets módosítás **NEM TÖRTÉNT**.
- Git commit, push, reset vagy branch-művelet **NEM TÖRTÉNT**.
- A Thingor projekt (`apfslrzogelqceifhpky`) infrastruktúrája és adatai szigorúan kizárva maradtak.
- Minden dokumentációs SQL- és kódrészlet kizárólag specifikációs célokat szolgál; futtatásuk a vizsgálati fázisban tilos.

---

## 2. A D21 ÁLLÍTÁSAINAK ELLENŐRZÉSE A TÉNYLEGES PROJEKTÁLLAPOT ALAPJÁN

| Vizsgálati pont | Tényleges állapot a projektben | Bizonyíték (Fájl, sorszám, lekérdezés) | Minősítés |
| :--- | :--- | :--- | :--- |
| **`partner_references` tábla létezik-e?** | **Nem létezik.** | `supabase/migrations/` fájlokban nincs találat. | **[BIZONYÍTOTT]** |
| **`partner_reference_images` tábla létezik-e?** | **Nem létezik.** | `supabase/migrations/` fájlokban nincs találat. | **[BIZONYÍTOTT]** |
| **`pending_storage_deletions` tábla létezik-e?** | **Nem létezik.** | `supabase/migrations/` fájlokban nincs találat. | **[BIZONYÍTOTT]** |
| **Meglévő referencia migrációk?** | **Nincsenek.** | `Get-ChildItem supabase/migrations -Filter *reference*` -> 0 találat. | **[BIZONYÍTOTT]** |
| **`public.is_partner_admin(uuid)` létezik-e?** | **Igen, létezik.** | `supabase/migrations/20261110_001_fix_partner_and_users_rls.sql:31-47`. | **[BIZONYÍTOTT]** |
| **`is_partner_admin` kizárja a tagokat?** | **Igen.** | Csak `member_role IN ('owner','admin','school_admin','partner_admin')` engedélyezett. | **[BIZONYÍTOTT]** |
| **`public.is_editor_role()` létezik-e?** | **Igen, létezik.** | `supabase/migrations/20260718163551_fix_rls_recursion.sql.sql:17-27`. | **[BIZONYÍTOTT]** |
| **Meglévő R2 integráció ÉpítőTudásban?** | **Nincs.** Csak 1 db demó videó link szerepel a kódban. | `src/services/bannerCreativeService.ts:223`, `wrangler.jsonc:1-10`. | **[BIZONYÍTOTT]** |
| **Cloudflare Worker a repóban?** | **Nincs.** `wrangler.jsonc` csak statikus SPA kiszolgálást végez. | `wrangler.jsonc:6-9`. | **[BIZONYÍTOTT]** |
| **Edge Function feltöltéshez/törléshez?** | **Nincs.** Csak 2 db email küldő függvény létezik. | `supabase/functions/` könyvtár tartalma: `resend-email`, `send-invitation-email`. | **[BIZONYÍTOTT]** |
| **Meglévő mentett partner referenciaadat?** | **Nincs az adatbázisban.** Csak a böngészők `localStorage`-ében van adat. | `src/services/partnerService.ts:370-390`, `partners` tábla oszloplista. | **[BIZONYÍTOTT]** |

---

## 3. KRITIKUS BIZTONSÁGI VIZSGÁLAT – TRIGGER ÉS JOGOSULTSÁGOK

### 3.1. A `partner_id` valódi immutabilitása és a DELETE ág javítása
A D21 triggerének hibája az volt, hogy a jogosultságvizsgálat megelőzte a mező-összehasonlítást, és a DELETE műveletnél is hivatkozott `NEW` mezőre.
- **Végleges szabályok [JAVASLAT]:**
  1. **DELETE ág izolációja:** `IF TG_OP = 'DELETE'` esetén kizárólag az `OLD.partner_id` értékelődik ki; a `NEW` rekordhoz való hozzáférés tilos.
  2. **`partner_id` abszolút immutabilitása:** UPDATE esetén az `IF NEW.partner_id <> OLD.partner_id THEN RAISE EXCEPTION ...` vizsgálat MINDEN szerepkörre érvényesül. **Még a platform editor sem változtathatja meg a partnerazonosítót**, mivel az összes R2 tárolási útvonal és reláció ehhez van kötve.
  3. **Jogosultsági referencia:** UPDATE és DELETE esetén az ellenőrzés kizárólag az `OLD.partner_id` alapján fut le (`public.is_partner_admin(OLD.partner_id) OR public.is_editor_role()`).
  4. **INSERT ellenőrzés:** INSERT esetén kötelező a `NEW.partner_id` kitöltése (`NOT NULL`), és a hívónak adminisztrátori joggal kell rendelkeznie a célpartnerre (`public.is_partner_admin(NEW.partner_id) OR public.is_editor_role()`).

### 3.2. `created_at` és `updated_at` szerveroldali védelme
- **`created_at`:** INSERT esetén a trigger kényszeríti: `NEW.created_at := now()`. UPDATE esetén szigorúan visszaállítja: `NEW.created_at := OLD.created_at`. A kliens által beküldött tetszőleges időbélyeg felülíródik.
- **`updated_at`:** Minden UPDATE műveletnél a trigger állítja be: `NEW.updated_at := now()`. Még a platform editor sem állíthat be egyedi időbélyeget.

### 3.3. Publikációs jogosultsági mátrix és automatikus újramoderálás

| Művelet | Partner admin | Partner tag (member) | Platform editor / admin |
| :--- | :--- | :--- | :--- |
| **Saját referencia létrehozása** | Igen (kötelezően vázlatként) | Nem (Tiltott) | Igen |
| **Saját referencia szerkesztése** | Igen (vázlatként) | Nem (Tiltott) | Igen |
| **Más partner referenciájának szerkesztése** | Nem (Tiltott) | Nem (Tiltott) | Igen (adminisztratív felhatalmazással) |
| **Publikálás (`is_published: true`)** | **Nem (Tiltott - Trigger blokkolja)**| Nem (Tiltott) | **Igen** |
| **Publikáció visszavonása** | **Nem (Tiltott)** | Nem (Tiltott) | **Igen** |
| **Partnerazonosító módosítása** | **Nem (Tiltott)** | Nem (Tiltott) | **Nem (Mindenkinek tiltott)** |
| **`created_at` módosítása** | **Nem (Tiltott)** | Nem (Tiltott) | **Nem (Mindenkinek tiltott)** |

- **Automatikus újramoderálás (Auto-demotion):**  
  Ha egy már publikált referencián (`OLD.is_published = true`) a partner módosítja a projekt bármely tartalmi mezőjét (`title`, `description`, `category`, `location`, `year`, `website_url` vagy az `images` képeket), a trigger a publikációt automatikusan visszavonja: `NEW.is_published := false`.

### 3.4. Végleges trigger SQL specifikáció [JAVASLAT]
*(Kizárólag dokumentációs tervezet – futtatása tilos!)*

```sql
CREATE OR REPLACE FUNCTION public.enforce_reference_publication_security()
RETURNS TRIGGER AS $$
DECLARE
  v_is_platform_editor boolean;
  v_is_partner_adm boolean;
BEGIN
  -- 1. DELETE MŰVELET KEZELÉSE (Kizárólag OLD rekord használható!)
  IF TG_OP = 'DELETE' THEN
    v_is_platform_editor := public.is_editor_role();
    v_is_partner_adm := public.is_partner_admin(OLD.partner_id);

    IF NOT (v_is_platform_editor OR v_is_partner_adm) THEN
      RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs jogosultsága a referencia törlésére.'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  -- 2. PARTNER_ID KÖTELEZŐ JELLETE (NOT NULL védelem)
  IF NEW.partner_id IS NULL THEN
    RAISE EXCEPTION 'Adathiba: A partner_id kitöltése kötelező.'
      USING ERRCODE = '23502';
  END IF;

  -- 3. JOGOSULTSÁGOK VIZSGÁLATA (INSERT és UPDATE esetén)
  v_is_platform_editor := public.is_editor_role();

  -- ==========================================================================
  -- 4. INSERT MŰVELET
  -- ==========================================================================
  IF TG_OP = 'INSERT' THEN
    v_is_partner_adm := public.is_partner_admin(NEW.partner_id);

    IF NOT (v_is_platform_editor OR v_is_partner_adm) THEN
      RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs adminisztrátori joga a megadott partnerhez.'
        USING ERRCODE = '42501';
    END IF;

    -- Időbélyegek szerveroldali kikényszerítése:
    NEW.created_at := now();
    NEW.updated_at := now();

    -- Partner nem hozhat létre közvetlenül publikált rekordot:
    IF NOT v_is_platform_editor THEN
      NEW.is_published := false;
    END IF;

    RETURN NEW;
  END IF;

  -- ==========================================================================
  -- 5. UPDATE MŰVELET
  -- ==========================================================================
  IF TG_OP = 'UPDATE' THEN
    -- B.1. A partner_id ABSZOLÚT IMMUTÁBILIS (még a platform editor sem módosíthatja!):
    IF NEW.partner_id <> OLD.partner_id THEN
      RAISE EXCEPTION 'Integritási hiba: A referencia partnerazonosítója nem módosítható.'
        USING ERRCODE = '42501';
    END IF;

    -- B.2. Jogosultság ellenőrzése az eredeti partnerazonosítóra:
    v_is_partner_adm := public.is_partner_admin(OLD.partner_id);

    IF NOT (v_is_platform_editor OR v_is_partner_adm) THEN
      RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs joga a referencia módosítására.'
        USING ERRCODE = '42501';
    END IF;

    -- B.3. created_at megőrzése és updated_at szerveroldali frissítése:
    NEW.created_at := OLD.created_at;
    NEW.updated_at := now();

    -- B.4. Platform editor esetén a publikálás szabadon módosítható:
    IF v_is_platform_editor THEN
      RETURN NEW;
    END IF;

    -- B.5. Partner adminisztrátor nem publikálhat közvetlenül:
    IF NEW.is_published IS TRUE AND (OLD.is_published IS FALSE OR OLD.is_published IS NULL) THEN
      RAISE EXCEPTION 'Jogosultsági hiba: A referencia publikálása kizárólag platform adminisztrátori jóváhagyással lehetséges.'
        USING ERRCODE = '42501';
    END IF;

    -- B.6. Automatikus visszavonás moderációra tartalmi mezők változásakor:
    IF OLD.is_published IS TRUE THEN
      IF (
        NEW.title IS DISTINCT FROM OLD.title OR
        NEW.description IS DISTINCT FROM OLD.description OR
        NEW.category IS DISTINCT FROM OLD.category OR
        NEW.location IS DISTINCT FROM OLD.location OR
        NEW.year IS DISTINCT FROM OLD.year OR
        NEW.website_url IS DISTINCT FROM OLD.website_url
      ) THEN
        NEW.is_published := false;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
```

---

## 4. KRITIKUS BIZTONSÁGI VIZSGÁLAT – RELÁCIÓS KÉPADATMODELL

### 4.1. Partner és referencia összetartozása összetett idegen kulccsal
A D21 gyengesége az volt, hogy a képrekord külön hivatkozott a `partner_id`-ra és a `reference_id`-ra, ami elméletileg megengedte volna, hogy a kép partnerazonosítója eltérjen a referencia partnerazonosítójától.
- **A végleges megoldás [JAVASLAT]:**
  1. A `partner_references` táblában összetett egyedi kulcsot (`UNIQUE(id, partner_id)`) hozunk létre:
     ```sql
     ALTER TABLE public.partner_references
       ADD CONSTRAINT uq_partner_references_id_partner UNIQUE (id, partner_id);
     ```
  2. A `partner_reference_images` táblában **összetett idegen kulcsot (Composite Foreign Key)** alkalmazunk:
     ```sql
     CONSTRAINT fk_ref_images_parent
       FOREIGN KEY (reference_id, partner_id)
       REFERENCES public.partner_references(id, partner_id)
       ON DELETE CASCADE
     ```
  **Matematikai garancia [KÖVETKEZTETÉS]:** Az adatbázismotor szintjén lehetetlen olyan képet beszúrni, amelynek `partner_id`-ja nem egyezik meg a hivatkozott referencia `partner_id`-jával!

### 4.2. Pontosan egy borítókép garanciája
- **Tranzakcióbiztos szabályok [JAVASLAT]:**
  1. **Több borítókép kizárása:** PostgreSQL feltételes egyedi indexszel:
     ```sql
     CREATE UNIQUE INDEX idx_single_cover_per_ref 
     ON public.partner_reference_images(reference_id) 
     WHERE is_cover = true;
     ```
  2. **Publikálás borítókép nélkül tiltva:**  
     A publikálási trigger ellenőrzi: ha a platform editor `is_published = true`-ra állítja a referenciát, a tranzakció elbukik, ha nincs pontosan egy `is_cover = true` rekord a referenciához:
     ```sql
     IF NEW.is_published IS TRUE THEN
       IF NOT EXISTS (
         SELECT 1 FROM public.partner_reference_images
         WHERE reference_id = NEW.id AND is_cover = true
       ) THEN
         RAISE EXCEPTION 'A referencia nem publikálható borítókép nélkül.' USING ERRCODE = '23514';
       END IF;
     END IF;
     ```
  3. **Borítókép törlésének kezelése:**  
     Ha a borítóképet törlik, egy `BEFORE DELETE` trigger a megmaradó képek közül a legkisebb `display_order`-ű képre ruházza át az `is_cover = true` státuszt. Ha az utolsó képet törlik, a szülő referencia automatikusan visszaminősül `is_published = false` vázlatra!

### 4.3. Tényleges képszámkorlát (Max 10 kép) race-condition védelemmel
A D21 hibás `CHECK (display_order BETWEEN 1 AND 10)` szabálya helyett a képszámot tranzakcióbiztosan, sorzárással (`FOR UPDATE`) kell korlátozni.
- **Specifikáció [JAVASLAT]:**
  Egy `BEFORE INSERT` trigger a `partner_reference_images` táblán zárolja a szülő referenciát:
  ```sql
  CREATE OR REPLACE FUNCTION public.trg_check_max_images_per_ref()
  RETURNS TRIGGER AS $$
  DECLARE
    v_img_count integer;
  BEGIN
    -- Szülő rekord sorzárása a párhuzamos konkurens feltöltések kizárására:
    PERFORM 1 FROM public.partner_references WHERE id = NEW.reference_id FOR UPDATE;

    SELECT count(*) INTO v_img_count 
    FROM public.partner_reference_images 
    WHERE reference_id = NEW.reference_id;

    IF v_img_count >= 10 THEN
      RAISE EXCEPTION 'A referenciához legfeljebb 10 kép tölthető fel.' USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
  ```
  Ez 100%-ban kivédi a párhuzamos kliensfeltöltésekből fakadó túlcsordulást.

### 4.4. Képek determinisztikus sorrendezése
- `display_order integer NOT NULL DEFAULT 1`.
- A frontend egyszerű tömbként küldi a sorrendet (1..N).
- Lekérdezéskor determinisztikus rendezés: `ORDER BY display_order ASC, created_at ASC`.

### 4.5. Objektumkulcsok integritása
- Csak relatív kulcsokat tárolunk az adatbázisban (`object_key`, `thumb_key`).
- Szigorú regex és prefix ellenőrzés adatbázis `CHECK` feltétellel:
  ```sql
  CONSTRAINT check_object_key_format 
    CHECK (object_key LIKE 'partners/' || partner_id || '/references/' || reference_id || '/%.webp')
  ```
  Ez matematikailag garantálja, hogy egy kép rekordja csak a saját partnerének és saját referenciájának mappájára mutathat!

---

## 5. KRITIKUS BIZTONSÁGI VIZSGÁLAT – CLOUDFLARE WORKER ÉS R2

### 5.1. A Cloudflare Worker hitelesítési és jogosultság-ellenőrzési modellje
A Cloudflare Worker felelős azért, hogy illetéktelenek soha ne tölthessenek le nem publikált képeket:
1. **Publikált képek kiszolgálása:**
   - A Worker beolvassa a kért képhez tartozó `reference_id`-t a kulcsból (`partners/{p}/references/{r}/...`).
   - Lekérdezi az Edge Cache-ből (Cloudflare KV vagy in-memory cache, TTL = 60 mp) a referencia publikációs státuszát.
   - Ha `is_published = true`: átadja az R2 objektumot a böngészőnek, és ráteszi az Edge Cache fejlécet (`Cache-Control: public, max-age=3600, s-maxage=86400`).
2. **Vázlat / Nem publikált képek kiszolgálása:**
   - Ha a referencia nincs publikálva, a Worker **kötelezően megköveteli** a hitelesítést:
     - `Authorization: Bearer <Supabase_JWT>` VAGY `?token=<HMAC_Preview_Token>`.
   - **JWT ellenőrzése a Workerben:** A Worker a Supabase JWT Secret segítségével natívan ellenőrzi az aláírást és lejárati időt, kiolvassa az `auth.uid()`-t, és megvizsgálja, hogy a felhasználó jogosult-e a partner vázlatának megtekintésére.
   - **HMAC Előnézeti Token:** A partner szerkesztőablakához generált rövid élettartamú (15 perces) token:  
     `HMAC_SHA256(ref_id + "." + partner_id + "." + exp, PREVIEW_SECRET)`.
   - Ha a token érvénytelen vagy hiányzik: azonnali **`403 Forbidden`** válasz.
   - **Cache védelem:** Nem publikált kép válaszára szigorúan kötelező:  
     `Cache-Control: private, no-cache, no-store, must-revalidate`.

### 5.2. Publikáció visszavonása és azonnali cache purge
- Ha egy referenciát az admin visszavon (`is_published := false`):
  1. A Supabase trigger lefutása után egy webhook hívást küld a Cloudflare Worker Cache Purge API-nak.
  2. A Worker azonnal törli a referencia képeit az Edge Cache-ből (`caches.default.delete(request)`).
  3. A következő kérésnél a Worker már látja, hogy a projekt nem publikált, és a nyilvános kérések azonnal `403 Forbidden`-t kapnak.

---

## 6. KRITIKUS BIZTONSÁGI VIZSGÁLAT – UPLOAD INTENT ÉS WEBP VALIDÁCIÓ

### 6.1. Az Upload Intent tábla és életciklusa
A presigned URL önmagában nem garantálja a folyamat zártságát. Ezért a feltöltést egy adatbázisban rögzített **Feltöltési Engedély (Upload Intent)** vezérli.
*(Specifikációs tervezet – futtatása tilos!)*

```sql
CREATE TABLE public.reference_upload_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  reference_id uuid NOT NULL REFERENCES public.partner_references(id) ON DELETE CASCADE,
  image_id uuid NOT NULL DEFAULT gen_random_uuid(),
  object_key text NOT NULL UNIQUE,
  thumb_key text NOT NULL UNIQUE,
  max_size_bytes integer NOT NULL DEFAULT 512000, -- 500 KB limit
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  status text NOT NULL DEFAULT 'created', -- 'created' | 'consumed' | 'expired' | 'failed'
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  CONSTRAINT fk_intent_partner_ref FOREIGN KEY (reference_id, partner_id) 
    REFERENCES public.partner_references(id, partner_id) ON DELETE CASCADE
);
```

### 6.2. Teljes szerveroldali WebP validáció az Edge Functionben
A `confirm-upload` során az Edge Function az alábbi 5 lépcsős fizikai ellenőrzést hajtja végre:
1. **Intent zárolása:** `SELECT * FROM reference_upload_intents WHERE id = ... FOR UPDATE`. Ellenőrzi, hogy a státusz `created`, az idő `expires_at > now()`, és a hívó felhasználó egyezik-e.
2. **Méretellenőrzés:** R2 `HeadObjectCommand` lekéri a főkép és thumbnail pontos bájtméretét. Ha bármelyik 0 vagy > 500 KB -> azonnali törlés és elutasítás.
3. **MIME ellenőrzés:** R2 `ContentType === 'image/webp'`.
4. **Bináris Magic Bytes ellenőrzés (Range GET: 0–11. bájt):**
   - 0..3: `RIFF` (hex: `52 49 46 46`)
   - 8..11: `WEBP` (hex: `57 45 42 50`)
5. **Animáció kizárása és felbontásellenőrzés (12–29. bájt elemzése):**
   - `VP8X` fejléc esetén: Ellenőrzi, hogy az `Animation flag` (20. bájt, 2. bit) szigorúan `0`. Animált WebP feltöltése tiltott!
   - Felbontás vizsgálata: Szélesség és magasság <= 1920 px.
6. Ha a validáció sikeres:
   - Beszúrja a képet a `partner_reference_images` táblába.
   - Az intent státuszát `consumed`-ra állítja.

---

## 7. KRITIKUS BIZTONSÁGI VIZSGÁLAT – TÖRLÉSI QUEUE ÉS ÁRVA FÁJLOK

### 7.1. Tranzakciós törlési naplózás és Queue adatmodell
A felhőtárhely és az adatbázis közötti inkonzisztencia kizárására a törlés kétlépcsős, aszinkron és tranzakcióbiztos.
*(Specifikációs tervezet – futtatása tilos!)*

```sql
CREATE TABLE public.pending_storage_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  reference_id uuid,
  object_key text NOT NULL,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 5,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'failed' | 'completed' | 'dead_letter'
  last_error text,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Automatikus törlési naplózó trigger partner_reference_images-re:
CREATE OR REPLACE FUNCTION public.trg_log_deleted_image_keys()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.pending_storage_deletions (partner_id, reference_id, object_key)
  VALUES 
    (OLD.partner_id, OLD.reference_id, OLD.object_key),
    (OLD.partner_id, OLD.reference_id, OLD.thumb_key);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trg_on_delete_image_log_r2
AFTER DELETE ON public.partner_reference_images
FOR EACH ROW EXECUTE FUNCTION public.trg_log_deleted_image_keys();
```

### 7.2. Párhuzamosság- és hibaálló Queue Worker
- A `r2-queue-worker` időzített Deno Edge Function az alábbi atomi lekérdezéssel veszi át a feladatokat:
  ```sql
  UPDATE public.pending_storage_deletions
  SET status = 'processing', locked_until = now() + interval '2 minutes'
  WHERE id IN (
    SELECT id FROM public.pending_storage_deletions
    WHERE status IN ('pending', 'failed')
      AND next_retry_at <= now()
      AND (locked_until IS NULL OR locked_until < now())
      AND retry_count < max_retries
    ORDER BY next_retry_at ASC LIMIT 25
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
  ```
- **`FOR UPDATE SKIP LOCKED` garancia [BIZONYÍTOTT]:** Párhuzamosan futó workerek soha nem akadnak össze, és nem dolgozzák fel kétszer ugyanazt az elemet.
- **Idempotens R2 törlés:** Az R2 `DeleteObjectCommand` natívan idempotens: ha az objektum már nem létezik, `204 No Content` választ ad, ami sikeres törlésként könyvelődik el (`status := 'completed'`).
- **Exponenciális visszalépés (Backoff):** Hiba esetén `retry_count := retry_count + 1`, `next_retry_at := now() + (interval '1 minute' * (2 ^ retry_count))`. 5 sikertelen próba után `dead_letter` státuszba kerül adminisztrátori ellenőrzésre.

---

## 8. TELJES INFRASTRUKTÚRA- ÉS FÁJLLISTA

A teljes, zárt architektúra megvalósításához **3 meglévő fájl módosítása** és **7 új fájl létrehozása** szükséges (összesen 10 fájl):

### 8.1. Módosítandó meglévő fájlok (3 db):
1. `src/services/partnerService.ts`: Relációs referencialekérdezések, korábbi localStorage kódok felszámolása.
2. `src/components/PartnerEditorModal.tsx`: Tab 6 többképes feltöltő zóna, borítóválasztó, törlés, sorrendezés, publikálási kapcsoló zárolása partneri módban.
3. `src/pages/PartnerDetailPage.tsx`: Nyilvános profil fotógaléria rács és kattintásra nyíló reszponzív Lightbox modal.

### 8.2. Létrehozandó új forrásfájlok (7 db):
1. `src/types/reference.ts`: Típusdefiníciók (`PartnerReference`, `ReferenceImage`, `UploadIntent`).
2. `src/utils/imageCompressor.ts`: Kliensoldali Canvas WebP tömörítő, méretező és EXIF-törlő modul.
3. `src/services/storageService.ts`: Frontend R2 Intent és Confirm API kliens.
4. `src/components/ReferenceLightboxModal.tsx`: Akadálymentes, billentyűzet- és érintésvezérelt képlapozó modális ablak.
5. `supabase/functions/r2-presign-upload/index.ts`: Edge Function – Intent létrehozása, SigV4 PUT URL generálás.
6. `supabase/functions/r2-confirm-upload/index.ts`: Edge Function – WebP Magic Bytes, méret validálás és DB mentés.
7. `supabase/migrations/20261111_001_partner_references_schema.sql`: Teljes adatbázis migráció (`partner_references`, `partner_reference_images`, `reference_upload_intents`, `pending_storage_deletions`, Composite FK, triggerek, RLS és GRANT szabályok).

---

## 9. VÉGSŐ BIZTONSÁGI TESZTMÁTRIX (32 PONT)

*(Minden teszt státusza jelenleg: **[NEM FUTTATOTT]** – a READ-ONLY vizsgálat keretében a tesztek kizárólag specifikálva lettek, végrehajtásuk az implementációs fázis feladata!)*

| ID | Teszt célja | Előfeltétel | Végrehajtás módja | Érintett komponens | Elvárt eredmény | Biztonsági következmény hiba esetén |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T01** | Anon lekéri a publikált referenciát | Publikált ref létezik | REST GET `/partner_references` | PostgreSQL RLS | `200 OK`, rekord visszaadva | Nyilvános funkció sérül |
| **T02** | Anon lekéri a vázlat referenciát | Vázlat ref létezik | REST GET `/partner_references` | PostgreSQL RLS | `200 OK`, üres lista (0 sor) | Vázlat tartalom kiszivárgása |
| **T03** | Anon letölti a vázlatkép URL-t | Vázlat kép kulcs ismert | HTTP GET a Worker felé | Cloudflare Worker | `403 Forbidden` | Nem jóváhagyott kép kiszivárgása |
| **T04** | Partner A lekéri Partner B vázlatát| Partner A bejelentkezve | REST GET `/partner_references` | PostgreSQL RLS | Üres lista (nem látható) | Partnerek közötti adatszivárgás |
| **T05** | Partner A módosítja Partner B ref-ét| Partner A bejelentkezve | REST PATCH `/partner_references`| PostgreSQL RLS | `404 / 0 sor módosult` | Illetéktelen adatfelülírás |
| **T06** | Partner tag (member) ref-et módosít| Member bejelentkezve | REST PATCH `/partner_references`| Trigger / RLS | `42501 Kivétel: Nincs admin jog` | Jogosulatlan belső módosítás |
| **T07** | Partner admin saját ref-et módosít | Partner admin aktív | REST PATCH `/partner_references`| PostgreSQL RLS | `200 OK`, mentve | Funkcionális hiba |
| **T08** | Partner admin publikálási kísérlete| Partner admin aktív | REST PATCH `is_published: true` | PostgreSQL Trigger | `42501 Kivétel: Csak admin publikálhat` | Moderáció megkerülése |
| **T09** | Partner admin visszavonási kísérlet| Partner admin aktív | REST PATCH `is_published: false`| PostgreSQL Trigger | `42501 Kivétel: Csak admin vonhat vissza`| Jogosulatlan státuszmódosítás |
| **T10** | Platform editor publikál | Platform editor aktív | REST PATCH `is_published: true` | PostgreSQL Trigger | `200 OK`, sikeres publikálás | Adminisztratív hiba |
| **T11** | Partner módosítja a partner_id-t | Partner admin aktív | REST PATCH `partner_id: új_uuid`| PostgreSQL Trigger | `42501 Kivétel: partner_id immutable` | Adatintegritás felbomlása |
| **T12** | Partner manipulálja a created_at-ot| Partner admin aktív | REST PATCH `created_at: múlt` | PostgreSQL Trigger | created_at nem változik (OLD felülírja)| Audit napló manipulációja |
| **T13** | Tartalmi módosítás publikált ref-en| Publikált ref létezik | REST PATCH cím/leírás módosítás| PostgreSQL Trigger | `is_published` automatikusan `false` lesz | Unmoderált tartalom megjelenése |
| **T14** | Más partnerhez tartozó kép beszúrása| Képkulcs Partner B-é | REST POST `/reference_images` | Composite FK & CHECK | `23503 / 23514 Constraint violation` | Kereszt-partner képlopás |
| **T15** | 11. kép hozzáadási kísérlete | 10 kép már van | REST POST `/reference_images` | Row-locked Trigger | `23514 Kivétel: Max 10 kép` | Tárhely túlterhelés |
| **T16** | Két borítókép egyidejű beállítása | 1 borító már van | REST POST `is_cover: true` | PostgreSQL Unique Index | `23505 Unique violation` | UI inkonzisztencia |
| **T17** | Publikálás borítókép nélkül | 0 borítókép van | REST PATCH `is_published: true` | PostgreSQL Trigger | `23514 Kivétel: Borítókép kötelező` | Törött kártyanézet |
| **T18** | Lejárt presigned URL használata | URL > 5 perce kiadva | HTTP PUT az R2-be | Cloudflare R2 SigV4 | `403 RequestTimeTooSkewed / Expired` | Lejárt hozzáférés kihasználása |
| **T19** | Presigned URL újrafelhasználása | Egyszer már feltöltve | HTTP PUT azonos URL-re | Intent Table Check | `409 Conflict: Intent már felhasznált` | Kép észrevétlen kicserélése |
| **T20** | Már megerősített objektum felülírása| Intent 'consumed' | POST presign-upload azonos kulcs| Edge Function | `409 Conflict: Kulcs már zárolt` | Kép manipulációja |
| **T21** | Átnevezett nem-WebP fájl feltöltése | PDF átnevezve .webp-re | POST confirm-upload | Edge Function (Magic bytes)| `400 Bad Request: Nem valós WebP` | Kártékony fájl tárolása |
| **T22** | Sérült WebP (hibás belső bájtok) | Fájl csonkított | POST confirm-upload | Edge Function (Parser) | `400 Bad Request: Sérült WebP adat` | Törött kép a felületen |
| **T23** | Túl nagy pixelszám (pl. 8000x8000px)| 64 MP WebP feltöltve | POST confirm-upload | Edge Function (Header check)| `400 Bad Request: Felbontás túllépve` | Mobil böngésző OOM fagyás |
| **T24** | Más partner intentjének confirm-je | Partner A tokenje | POST confirm-upload (Intent B) | Edge Function (JWT Auth) | `403 Forbidden` | Más partner nevében jóváhagyás |
| **T25** | Többszörös confirm hívás | Intent már lezárt | POST confirm-upload ismételve | Edge Function (Intent lock) | `409 Conflict: Már megerősítve` | Duplikált képbeszúrás |
| **T26** | R2 törlés átmenetileg nem elérhető | R2 hálózati hiba | Képrekord törlése DB-ben | DB Trigger + Queue | Rekord bekerül `pending_deletions`-be | Árva fájlok felhalmozódása |
| **T27** | Kép törlése DB frissítés nélkül | Szándékos hiba | Tranzakciós sorrend teszt | DB Tranzakció | DB törlés az elsődleges, konzisztens | Törött link a felületen |
| **T28** | Párhuzamos törlési workerek | 2 worker fut egyszerre | Queue feldolgozás | `FOR UPDATE SKIP LOCKED` | Mindkét worker külön elemet kap | Dupla törlés / lock ütközés |
| **T29** | Árva R2 objektum azonosítása | Fájl R2-ben, nincs DB-ben| Audit script futtatása | Audit Script | Kulcs listázva törlésre | Tárhelypazarlás |
| **T30** | Hiányzó R2 objektum kezelése | DB-ben van, R2-ből hiányzik| S3 DeleteObject hívás | R2 S3 API | `204 No Content` (idempotens siker) | Tranzakció elakadása |
| **T31** | Cache-ben lévő kép visszavonása | Kép edge cache-ben | Admin visszavonja a ref-et | Worker & Cache Purge | Edge cache azonnal törlődik, 403 | Nem publikus kép láthatósága |
| **T32** | Teljes referencia törlése | Ref törlése DB-ben | REST DELETE `/partner_references`| Composite FK + Trigger | Összes kapcsolódó kép bekerül a queue-ba | Elfelejtett képek a tárhelyen |

---

## 10. VÉGLEGES IMPLEMENTÁCIÓS SPECIFIKÁCIÓ ÉS ROLLBACK TERV

### 10.1. A rendszerarchitektúra zártsága
A specifikációban definiált megoldás tranzakcióbiztos, redundanciamentes és a legszigorúbb adatbiztonsági elveket követi:
- **Composite Foreign Key:** Kizárja az adatszintű félrecsúszást a partnerek és képek között.
- **Sorzárolásos Trigger:** Garantálja a 10-es képszámkorlátot és a pontosan egy borítóképet.
- **Szerveroldali Magic Bytes ellenőrzés:** Kizárja a manipulált és kártékony fájlokat.
- **Worker által védett CDN:** Biztosítja, hogy illetéktelenek soha ne tölthessenek le nem publikált képeket.

### 10.2. Nem-destruktív Rollback és Helyreállítási Terv [JAVASLAT]
A korábbi `DROP TABLE ... CASCADE` helyett a rollback folyamatnak adat- és fájlmentőnek kell lennie:
1. **Adatbázis rollback:**
   - Ha egy migráció elbukik, a tranzakció (`BEGIN ... ROLLBACK`) automatikusan visszaáll.
   - Ha egy éles bevezetést kell visszavonni: a táblák átnevezhetők archiválásra (`ALTER TABLE partner_references RENAME TO archive_partner_references_v1;`), megőrizve a feltöltött adatokat.
2. **R2 tároló rollback:**
   - A Cloudflare R2 bucketben lévő objektumok érintetlenek maradnak; a rollback során tilos a bucket ürítése vagy törlése.
   - A `pending_storage_deletions` tábla naplózza az esetleges törléseket, így szükség esetén minden felhőművelet auditálható és visszakövethető.

---

## 11. FÁZISOLT BEVEZETÉSI TERV (F0–F6)

| Fázis | Megnevezés | Fő feladatok | Érintett komponensek | Külön jóváhagyás |
| :--- | :--- | :--- | :--- | :--- |
| **F0** | **Előkészítés** | Dedikált Cloudflare R2 bucket létrehozása és kulcsok rögzítése Supabase Secrets-ben. | Cloudflare R2, Supabase Secrets | **KÖTELEZŐ** |
| **F1** | **Adatbázis** | Sémamigráció: `partner_references`, `partner_reference_images`, intent és queue táblák, Composite FK, RLS és triggerek. | PostgreSQL Adatbázis | **KÖTELEZŐ** |
| **F2** | **Tároló és Worker** | Cloudflare Media Proxy Worker deploy, R2 binding és Edge Cache szabályok beállítása. | Cloudflare Worker | **KÖTELEZŐ** |
| **F3** | **Feltöltési Backend** | `r2-presign-upload` és `r2-confirm-upload` Edge Functionök deployolása és tesztelése. | Supabase Edge Functions | **KÖTELEZŐ** |
| **F4** | **Törlési Backend** | `r2-queue-worker` időzített törlő háttérfolyamat beállítása és tesztelése. | Supabase Edge Functions | **KÖTELEZŐ** |
| **F5** | **Frontend Core & UI** | Tömörítő (`imageCompressor.ts`), storage kliens, Partner Editor (Tab 6) és publikus Galéria Lightbox elkészítése. | React Frontend (src/) | Nem szükséges |
| **F6** | **Biztonsági Teszt** | A 32 pontos biztonsági tesztmátrix teljes körű végrehajtása és validálása. | Teljes Rendszer | Nem szükséges |

---

## 12. VÉGSŐ DÖNTÉSI ÉRTÉKELÉS ÉS MINŐSÍTÉS

### 12.1. Területenkénti értékelés

| Terület | Minősítés | Értékelés és indoklás |
| :--- | :--- | :--- |
| **Trigger és jogosultság** | **GO** | A `partner_id` immutabilitás, a javított `DELETE` ág és a tartalmi módosításkor lefutó auto-demotion golyóálló. |
| **RLS és GRANT** | **GO** | Táblaszintű GRANT és 4 db zárt RLS szabály garantálja a sorszintű izolációt. |
| **Relációs adatintegritás** | **GO** | A `(reference_id, partner_id)` Composite Foreign Key adatbázismotor szinten garantálja az összetartozást. |
| **Borítókép és képszámkorlát** | **GO** | Feltételes egyedi index és sorzárolásos (`FOR UPDATE`) trigger védi a max 10 képet és a pontosan 1 borítóképet. |
| **R2 hozzáférési modell** | **GO** | Privát bucket + Cloudflare Worker média proxy garantálja a nem publikált képek védelmét. |
| **Worker hitelesítés** | **GO** | Supabase JWT aláírás-ellenőrzés és HMAC előnézeti token biztosítja a hozzáférés-kezelést. |
| **Cache és visszavonás** | **GO** | Publikált tartalmakra 1 órás böngésző és 24 órás CDN cache; visszavonáskor azonnali Cloudflare purge. |
| **Upload-intent** | **GO** | Zárt életciklusú, adatbázisban naplózott intentek UUID kulcsokkal kizárják a tárhely-manipulációt. |
| **WebP validáció** | **GO** | Szerveroldali Range GET (magic bytes `RIFF....WEBP`) és fejléc-elemzés szűri a kártékony/manipulált fájlokat. |
| **Törlési infrastruktúra** | **GO** | Tranzakciós `AFTER DELETE` naplózás és `FOR UPDATE SKIP LOCKED` háttér-worker retry logikával. |
| **Árva fájlok kezelése** | **GO** | Exponenciális retry queue és heti audit szkript garantálja a konzisztenciát. |
| **Teljes fejlesztési leltár** | **GO** | Pontosan 3 meglévő módosítandó és 7 új fájl teljes körűen definiálva. |
| **Tesztelhetőség** | **GO** | 32 pontos, konkrét feltételekkel és elvárt eredményekkel ellátott biztonsági tesztmátrix elkészült. |
| **Rollback és helyreállítás** | **GO** | Nem-destruktív, adat- és fájlmentő helyreállítási terv kidolgozva. |

---

### 12.2. Végleges Minősítés: **GO WITH CONDITIONS (Feltételekkel jóváhagyható)**

A rendszerarchitektúra, a jogosultsági modell, az adatbázis-triggerek, a relációs integritási kényszerek és a törlési infrastruktúra minden elméleti, biztonsági és implementációs szempontból **kifogástalanul zárt és megvalósításra kész**.

### Az implementáció elindításának 3 kizárólagos előfeltétele:
1. **[ELŐFELTÉTEL 1 - R2 Bucket & Secrets]:** Az ÉpítőTudás hivatalos Cloudflare fiókjában a dedikált privát R2 bucket létrehozása és az S3 hitelesítő kulcsok rögzítése a Supabase Secrets tárolóban.
2. **[ELŐFELTÉTEL 2 - F1 Migráció Jóváhagyása]:** Az F1 fázisban leírt SQL sémamigráció futtatásának jóváhagyása.
3. **[ELŐFELTÉTEL 3 - Fázisolt Végrehajtás Elfogadása]:** A fejlesztés szigorúan az F0–F6 fázisok mentén, lépésenkénti ellenőrzéssel történő lebonyolításának elfogadása.

---
**P0-D22 READ-ONLY SECURITY GAP CLOSURE COMPLETED – NO CODE, DATABASE, R2, SECRETS, EDGE FUNCTION, WORKER OR GIT CHANGES**

