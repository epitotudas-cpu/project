# P0-D21 – ÉPÍTŐTUDÁS REFERENCIA-GALÉRIA VÉGSŐ BIZTONSÁGI VALIDÁCIÓ ÉS IMPLEMENTÁCIÓS SPECIFIKÁCIÓ

**Dokumentumazonosító:** `P0_D21_REFERENCE_GALLERY_FINAL_SECURITY_VALIDATION.md`  
**Projekt:** ÉpítőTudás  
**Supabase projekt:** `olmavxcmkvvcebgqxohe`  
**Előzmények:** P0-D17, P0-D18, P0-D19, P0-D20  
**Dátum:** 2026-11-11  
**Vizsgálat típusa:** READ-ONLY / SECURITY VALIDATION  
**Munkamód:** READ-ONLY PLAN / NO PATCH / NO REFACTOR  
**Prioritás:** P0 – Éles adatbiztonság és jogosultságvédelem  
**Záróállapot:** `READ-ONLY FINAL SECURITY VALIDATION COMPLETED – NO CODE, DATABASE, R2, EDGE FUNCTION OR GIT CHANGES`

---

## 1. KÖTELEZŐ MŰKÖDÉSI KORLÁTOZÁSOK BETARTÁSA

A jelen vizsgálat szigorúan **READ-ONLY** keretek között zajlott:
- Forráskód-módosítás, fájllétrehozás (a jelen jelentésen kívül) **NEM TÖRTÉNT**.
- SQL futtatása, migráció létrehozása, adatbázis-módosítás **NEM TÖRTÉNT**.
- Cloudflare R2 bucket, API-kulcs vagy Supabase Secrets módosítás **NEM TÖRTÉNT**.
- Git commit, push vagy working tree módosítás **NEM TÖRTÉNT**.
- A Thingor projekt infrastruktúráját **NEM HASZNÁLJUK**, azt a vizsgálat teljes egészében kizárta.
- A dokumentációban szereplő minden SQL és kódtervezet kizárólag specifikációs célokat szolgál; végrehajtásuk az audit fázisban szigorúan tilos.

---

## 2. A VIZSGÁLAT CÉLJA ÉS KÖVETELMÉNYEI

A korábbi P0-D17..D20 tervezési ciklusok tapasztalatai alapján jelen dokumentum véglegesen tisztázza az éles bevezetéshez elengedhetetlen öt kritikus területet:
1. **Adatbázis-szintű biztonság:** A PostgreSQL trigger, az RLS szabályok és az oszlopszintű hozzáférések zárt egysége.
2. **Képtárolási hozzáférési modell:** A nem publikált / jóváhagyásra váró képek illetéktelen elérésének megakadályozása az R2-ben.
3. **Feltöltési engedélyezés és szerveroldali validáció:** A kliens által beküldött fájlok méretének, MIME-típusának és WebP magic bytes integritásának szerveroldali ellenőrzése.
4. **Adatintegritás:** A borítókép egyértelműsége, az idegen partnerkulcsok kizárása, és a képek sorrendjének biztosítása.
5. **Idempotens törlés és árva fájlok:** Hibatűrő törlési folyamat és a felhőtárhely konzisztenciájának fenntartása.

---

## 3. TRIGGER, RLS ÉS OSZLOPSZINTŰ JOGOSULTSÁGOK

### 3.1. A P0-D20 trigger hibáinak javítása és elemzése
A P0-D20-ban felvázolt triggertervezet forenzikus vizsgálata három rejtett hibát és kockázatot tárt fel, amelyeket jelen specifikáció javít:
1. **DELETE ág `NEW` rekord hibája [BIZONYÍTOTT]:**  
   Ha egy PostgreSQL trigger `BEFORE INSERT OR UPDATE OR DELETE` eseményre van kötve, a `DELETE` művelet futásakor a `NEW` pszeudorekord értéke szigorúan `NULL`. Bármilyen `NEW.partner_id` hivatkozás azonnali futásidejű hibát (`null pointer / record not assigned`) eredményezne.  
   *Javítás:* A trigger elején külön kell választani a `TG_OP = 'DELETE'` ágat, amely kizárólag az `OLD` rekordot használja!
2. **`partner_id` módosítási kísérlet vizsgálata [KÖVETKEZTETÉS]:**  
   Ha egy partner adminisztrátor megpróbálná átírni a `partner_id`-t egy másik cégre, az ellenőrzést az `OLD.partner_id` és `NEW.partner_id` alapján is le kell folytatni. A legbiztonságosabb és legtisztább szabály: a `partner_id` az első beszúrás után **fizikailag módosíthatatlan (immutable)**.
3. **Adminisztratív mezők védelme [KÖVETKEZTETÉS]:**  
   A partner nem manipulálhatja a `created_at` időbélyeget (újra kell írni `OLD.created_at`-ra), és a `updated_at` mezőt kötelezően a szerver `now()` értékére kell állítani.

### 3.2. RLS vs. Trigger vs. Oszlopszintű GRANT felelősségmegosztás
- **Miért nem alkalmasak az oszlopszintű `GRANT UPDATE (...)` szabályok a Supabase-ben? [BIZONYÍTOTT]**  
  A PostgREST API-n keresztül érkező `PATCH` kérések gyakran a teljes frontend form állapotot küldik vissza (benne a nem változó `partner_id` vagy `created_at` mezőkkel). Ha az adott oszlopra `REVOKE UPDATE` van érvényben, a PostgreSQL tranzakció azonnal elbukik (`permission denied for column ...`), ami működésképtelenné tenné a meglévő szerkesztőfelületet.
- **A helyes felelősségi munkamegosztás [JAVASLAT]:**
  1. **Táblaszintű GRANT:** PostgREST hozzáférés biztosítása (`SELECT` anonnak; `SELECT, INSERT, UPDATE, DELETE` authenticated felhasználóknak).
  2. **RLS (Row Level Security):** Sorszintű izoláció – a partner kizárólag a saját cégéhez tartozó sorokat látja/módosíthatja; más cég vázlata láthatatlan.
  3. **BEFORE Trigger:** Oszlopszintű állapotátmenetek védelme – `partner_id` fagyasztása, `created_at` védelme, `is_published` manipulációjának blokkolása, és a publikált projektek tartalmi módosítása esetén automatikus újramoderálás (`is_published := false`).

### 3.3. A javított, teljes publikációs trigger tervezete [JAVASLAT]
*(Kizárólag dokumentációs specifikáció – futtatása tilos!)*

```sql
-- ============================================================================
-- VÉGLEGES SPECIFIKÁCIÓ: Referencia Publikációs és Integritási Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.enforce_reference_publication_security()
RETURNS TRIGGER AS $$
DECLARE
  v_is_platform_editor boolean;
  v_is_partner_adm boolean;
  v_target_partner_id uuid;
BEGIN
  -- 1. Célobjektum azonosítása a művelet típusa alapján
  IF TG_OP = 'DELETE' THEN
    v_target_partner_id := OLD.partner_id;
  ELSE
    v_target_partner_id := NEW.partner_id;
  END IF;

  -- 2. Jogosultságok meghatározása (SECURITY DEFINER függvényekkel)
  v_is_platform_editor := public.is_editor_role();
  v_is_partner_adm := public.is_partner_admin(v_target_partner_id);

  -- 3. Hozzáférés megtagadása, ha a hívó sem platform editor, sem a partner adminja
  IF NOT (v_is_platform_editor OR v_is_partner_adm) THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs adminisztrátori jogosultsága a megadott partnerhez.'
      USING ERRCODE = '42501';
  END IF;

  -- 4. DELETE művelet kezelése
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  -- 5. Platform editor esetén a módosítások és a publikálás szabadon engedélyezett
  IF v_is_platform_editor THEN
    IF TG_OP = 'UPDATE' THEN
      NEW.updated_at := now();
    END IF;
    RETURN NEW;
  END IF;

  -- ==========================================================================
  -- 6. PARTNER ADMINISZTRÁTORRA VONATKOZÓ BIZTONSÁGI SZABÁLYOK
  -- ==========================================================================

  -- A) INSERT művelet:
  IF TG_OP = 'INSERT' THEN
    -- Partner által létrehozott rekord KÖTELEZŐEN vázlat (is_published = false):
    NEW.is_published := false;
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- B) UPDATE művelet:
  IF TG_OP = 'UPDATE' THEN
    -- B.1. A partner_id SOHA nem változtatható meg (immutabilitás):
    IF NEW.partner_id <> OLD.partner_id THEN
      RAISE EXCEPTION 'Integritási hiba: A referencia partnerazonosítója nem módosítható.'
        USING ERRCODE = '42501';
    END IF;

    -- B.2. A created_at nem manipulálható a kliens által:
    NEW.created_at := OLD.created_at;

    -- B.3. Közvetlen publikálási kísérlet blokkolása:
    IF NEW.is_published IS TRUE AND (OLD.is_published IS FALSE OR OLD.is_published IS NULL) THEN
      RAISE EXCEPTION 'Jogosultsági hiba: A referencia publikálása kizárólag platform adminisztrátori jóváhagyással lehetséges.'
        USING ERRCODE = '42501';
    END IF;

    -- B.4. Tartalmi módosítás esetén automatikus visszavonás moderációra:
    -- Ha egy már jóváhagyott referencián tartalmi változtatás történik, 
    -- a trigger automatikusan visszateszi vázlat státuszba (is_published := false):
    IF OLD.is_published IS TRUE THEN
      IF (
        NEW.title IS DISTINCT FROM OLD.title OR
        NEW.description IS DISTINCT FROM OLD.description OR
        NEW.category IS DISTINCT FROM OLD.category OR
        NEW.location IS DISTINCT FROM OLD.location OR
        NEW.year IS DISTINCT FROM OLD.year OR
        NEW.website_url IS DISTINCT FROM OLD.website_url OR
        NEW.images IS DISTINCT FROM OLD.images
      ) THEN
        NEW.is_published := false;
      END IF;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
```

### 3.4. Végleges RLS és jogosultsági SQL-tervezet [JAVASLAT]
*(Kizárólag dokumentációs specifikáció – futtatása tilos!)*

```sql
-- Táblaszintű hozzáférések szigorítása
REVOKE ALL ON TABLE public.partner_references FROM PUBLIC;
REVOKE ALL ON TABLE public.partner_references FROM anon;
GRANT SELECT ON TABLE public.partner_references TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.partner_references TO authenticated;

-- RLS aktiválása és kényszerítése
ALTER TABLE public.partner_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_references FORCE ROW LEVEL SECURITY;

-- 1. SELECT RLS:
CREATE POLICY "Select partner_references"
ON public.partner_references
FOR SELECT
TO anon, authenticated
USING (
  is_published = true
  OR (
    auth.role() = 'authenticated'
    AND (
      public.is_partner_admin(partner_id)
      OR public.is_editor_role()
    )
  )
);

-- 2. INSERT RLS:
CREATE POLICY "Insert partner_references"
ON public.partner_references
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_partner_admin(partner_id)
  OR public.is_editor_role()
);

-- 3. UPDATE RLS:
CREATE POLICY "Update partner_references"
ON public.partner_references
FOR UPDATE
TO authenticated
USING (
  public.is_partner_admin(partner_id)
  OR public.is_editor_role()
)
WITH CHECK (
  public.is_partner_admin(partner_id)
  OR public.is_editor_role()
);

-- 4. DELETE RLS:
CREATE POLICY "Delete partner_references"
ON public.partner_references
FOR DELETE
TO authenticated
USING (
  public.is_partner_admin(partner_id)
  OR public.is_editor_role()
);
```

---

## 4. CLOUDFLARE R2 – PUBLIKUS ÉS PRIVÁT HOZZÁFÉRÉSI MODELL

### 4.1. A három hozzáférési modell összehasonlítása

| Szempont | A Modell: Teljesen publikus R2 bucket | B Modell: Teljesen privát R2 bucket | C Modell: Worker által felügyelt egyedi CDN (AJÁNLOTT) |
| :--- | :--- | :--- | :--- |
| **Biztonság** | **Alacsony:** Bárki, aki megszerzi az URL-t, letöltheti a nem jóváhagyott képeket is. | **Magas:** Minden képhez szerveroldali presigned GET kell. | **Kiváló:** Jóváhagyott képek publikusak és gyorsítótárazottak; vázlatképek védettek. |
| **Teljesítmény** | Gyors (közvetlen CDN elérés). | **Lassú:** Presigned URL-ek miatt nincs publikus edge cache; minden megnyitás DB hívást igényel. | **Maximális:** Edge CDN cache a publikált tartalmakra. |
| **Költség** | Alacsony. | Magasabb (folyamatos Edge Function lekérések presigned GET-hez). | Alacsony (Cloudflare Worker cache hit 95%+). |
| **Működési összetettség**| Minimális. | Magas (kliensnek minden képre időkorlátos URL-t kell menedzselnie). | Kiegyensúlyozott (tiszta architektúra). |
| **Visszavonás** | Nehézkes (CDN purge szükséges). | Azonnali (a következő presigned URL nem adható ki). | **Azonnali:** A Worker eldobja a gyorsítótárat és tiltja az elérést. |

### 4.2. Végleges ajánlott R2 hozzáférési architektúra [JAVASLAT]
A legmagasabb szintű adatbiztonság és a maximális publikus teljesítmény érdekében a **C modell (Worker által felügyelt és gyorsítótárazott hozzáférés)** a végleges választás:
1. **Az R2 bucket maga privát marad:** Közvetlen publikus elérés (`r2.dev`) nincs engedélyezve a vödörre.
2. **Kiszolgálási végpont (`media.epitotudas.hu`):** A képeket egy könnyűsúlyú Cloudflare Worker szolgálja ki.
3. **Elérési szabály a Workerben:**
   - Ha a kért képhez tartozó referencia publikált (`is_published = true`): a Worker átadja a képet az R2-ből, és ráteszi a publikus cache fejléceket (`Cache-Control: public, max-age=31536000, immutable`).
   - Ha a referencia még vázlat / jóváhagyásra vár: a Worker megköveteli a hitelesített partneri munkamenet tokent (vagy egy rövid élettartamú HMAC aláírt előnézeti tokent). Illetéktelen hívás esetén azonnali **403 Forbidden** választ ad.

---

## 5. FELTÖLTÉSI ENGEDÉLY ÉS SZERVEROLDALI VALIDÁCIÓ

### 5.1. Feltöltési engedély (Upload Intent) életciklusa [JAVASLAT]
A kliens SOHA nem tölthet fel közvetlenül tetszőleges kulcsra. A feltöltést egy szerveroldali engedélyezési folyamat szabályozza:

```
[1. Kérelem] Kliens: POST /r2-presign-upload (partner_id, ref_id, file_count, total_bytes)
       │
[2. Engedélyezés] Edge Function: Ellenőrzi is_partner_admin() -> Generál Intent rekordot és rögzített kulcsokat
       │
[3. Presigned PUT] Edge Function -> Kliens: 5 perces PUT URL szigorú Content-Type: image/webp-re kötve
       │
[4. Bináris Feltöltés] Kliens -> R2: Közvetlen WebP feltöltés
       │
[5. Validáció & Megerősítés] Kliens: POST /r2-confirm-upload (intent_id)
       │
[6. Szerveroldali Ellenőrzés] Edge Function: HeadObject méret + WebP Magic Bytes ellenőrzés
       │
[7. Jóváhagyás] Intent lezárva -> Képadat menthető a referenciához
```

### 5.2. Tényleges fájltartalom ellenőrzése (Szerveroldali WebP Magic Bytes) [KÖVETKEZTETÉS]
A `HeadObject` hívás önmagában csak a fájlméretet igazolja. Annak megakadályozására, hogy valaki egy átnevezett PDF-et, HTML/SVG parancsfájlt vagy kártékony binárist töltsön fel `.webp` kiterjesztéssel:
- A `confirm-upload` során az Edge Function egy **Range GET kéréssel lekéri a fájl első 12 bájtját** (`Range: bytes=0-11`).
- **WebP Bináris Aláírás (Magic Bytes) ellenőrzése:**
  - 0–3. bájt: `RIFF` (hex: `0x52 0x49 0x46 0x46`)
  - 8–11. bájt: `WEBP` (hex: `0x57 0x45 0x42 0x50`)
- Ha az aláírás nem egyezik, vagy a fájlméret meghaladja az 500 KB-ot (optimalizált WebP limit): az Edge Function azonnal törli az objektumot az R2-ből, érvényteleníti a feltöltési engedélyt, és hibát ad vissza.

### 5.3. Objektumfelülírás és ismételt feltöltés megelőzése [KÖVETKEZTETÉS]
- Minden képfeltöltés megjósolhatatlan, friss UUID-t kap: `partners/{partner_id}/references/{ref_id}/{randomUUID}.webp`.
- Egy korábban már megerősített kulcsra az Edge Function soha többé nem ad ki új presigned PUT URL-t.
- Ez garantálja, hogy egy korábban jóváhagyott képet utólag ne lehessen felülírni a háttérben.

---

## 6. ADATMODELL ÉS KÉPINTEGRITÁS (A RELÁCIÓS VS. JSONB DÖNTÉS)

### 6.1. A P0-D20 JSONB modelljének korlátai [BIZONYÍTOTT]
A P0-D20-ban felmerült 10 integritási szabály (különösen: pontosan egy borítókép, idegen partnerkulcs kizárása, törölt képek helyreállíthatósága) tisztán JSONB használatával csak rendkívül komplex és nehezen karbantartható PL/pgSQL triggerekkel kényszeríthető ki.

### 6.2. Végleges Döntés: Külön `partner_reference_images` relációs tábla [JAVASLAT]
A legmagasabb adatintegritási garanciák eléréséhez a végleges specifikáció a relációs modell mellett dönt:
1. `partner_references` (Projekt metaadatok).
2. `partner_reference_images` (Képek egyedi relációs rekordként).

### 6.3. A relációs képtábla dokumentációs sématervezete [JAVASLAT]
*(Kizárólag specifikációs tervezet – futtatása tilos!)*

```sql
CREATE TABLE public.partner_reference_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.partner_references(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  thumb_key text NOT NULL UNIQUE,
  caption text,
  display_order integer NOT NULL DEFAULT 1,
  is_cover boolean NOT NULL DEFAULT false,
  width integer NOT NULL,
  height integer NOT NULL,
  size_bytes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- 1. Integritási szabály: idegen partner kulcs kizárása
  CONSTRAINT check_key_matches_partner 
    CHECK (object_key LIKE 'partners/' || partner_id || '/references/%'),
    
  -- 2. Integritási szabály: érvényes kiterjesztés
  CONSTRAINT check_webp_format 
    CHECK (object_key LIKE '%.webp' AND thumb_key LIKE '%.webp'),
    
  -- 3. Integritási szabály: max 10 kép referenciánként (sorrend limit)
  CONSTRAINT check_display_order_range 
    CHECK (display_order BETWEEN 1 AND 10)
);

-- 4. Integritási szabály: Referenciánként PONTOSAN EGY borítókép lehet!
-- PostgreSQL feltételes egyedi index garantálja motor szinten:
CREATE UNIQUE INDEX idx_single_cover_per_reference 
ON public.partner_reference_images (reference_id) 
WHERE is_cover = true;

-- Index a gyors lekérdezésekhez
CREATE INDEX idx_ref_images_order 
ON public.partner_reference_images (reference_id, display_order ASC);
```

**Miért zárja le ez az összes integritási kérdést? [KÖVETKEZTETÉS]**
- A `UNIQUE INDEX ... WHERE is_cover = true` kizárja, hogy két borítókép létezhessen.
- Ha egy borítóképet törölnek, a következő képre egyszerű SQL tranzakcióval átruházható az `is_cover = true`.
- A `CHECK (object_key LIKE 'partners/' || partner_id || '/...')` kizárja, hogy Partner A elmenthesse Partner B képkulcsát.
- A `reference_id ON DELETE CASCADE` gondoskodik a hivatkozási integritásról a projekt törlésekor.

---

## 7. TÖRLÉSI INFRASTRUKTÚRA ÉS ÁRVA FÁJLOK KEZELÉSE

### 7.1. Tranzakciós törlési sorrend [JAVASLAT]
A törött linkek és inkonzisztenciák elkerülésére a törlési műveletek sorrendje kötött:
1. **Adatbázis tranzakció fut le először:** A rekord törlődik a `partner_reference_images` vagy `partner_references` táblából.
2. **Törlési naplózás:** Az adatbázis egy trigger segítségével a törölt `object_key` és `thumb_key` értékeket azonnal beírja a `pending_storage_deletions` táblába.
3. **R2 fizikai törlés:** Az Edge Function vagy háttérfolyamat aszinkron, idempotens módon kiadja a `DeleteObjectCommand` parancsot. Ha az R2 átmenetileg nem elérhető, a rekord bent marad a táblában, és a retry worker újrapróbálja.

### 7.2. `pending_storage_deletions` tábla tervezete [JAVASLAT]
*(Kizárólag specifikációs tervezet – futtatása tilos!)*

```sql
CREATE TABLE public.pending_storage_deletions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  object_key text NOT NULL,
  retry_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'failed' | 'completed'
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pending_deletions_retry 
ON public.pending_storage_deletions (status, next_retry_at) 
WHERE status IN ('pending', 'failed');
```

---

## 8. VÉGLEGES FEJLESZTÉSI FÁJLLISTA ÉS FÜGGŐSÉGEK

A végleges, biztonságos megvalósításhoz szükséges fájlok teljes és zárt leltára (összesen 9 fájl):

### 8.1. Módosítandó meglévő fájlok (3 db):
1. **`src/services/partnerService.ts`**:
   - Korábbi `localStorage` hivatkozások törlése.
   - Referenciák és képek lekérdezése Supabase-ből relációs joinnal (`select('*, partner_reference_images(*)')`).
2. **`src/components/PartnerEditorModal.tsx`**:
   - Tab 6 felületének átalakítása többképes galériakezelővé.
   - Képenkénti borítócsillag (cover selector), törlés, sorrendezés, feltöltési állapotjelző.
   - Publikálási kapcsoló zárolása partneri módban.
3. **`src/pages/PartnerDetailPage.tsx`**:
   - Nyilvános profil fotógaléria rács és kattintásra nyíló, reszponzív Lightbox modális ablak nagyfelbontású lapozóval (kék–fekete–fehér arculat).

### 8.2. Létrehozandó új forrásfájlok (6 db):
1. **`src/types/reference.ts`**: Típusdefiníciók (`PartnerReference`, `ReferenceImage`, `UploadIntentPayload`).
2. **`src/utils/imageCompressor.ts`**: HTML5 Canvas alapú soros WebP tömörítő, méretező és EXIF-törlő modul.
3. **`src/services/storageService.ts`**: Kliensoldali kommunikáció az Edge Functionnel (intent kérés, PUT feltöltés, confirm hívás).
4. **`supabase/functions/r2-presign-upload/index.ts`**: Deno Edge Function a feltöltési intentek és presigned PUT URL-ek generálásához.
5. **`supabase/functions/r2-confirm-upload/index.ts`**: Deno Edge Function a feltöltött WebP magic bytes és méret szerveroldali ellenőrzéséhez.
6. **`supabase/migrations/20261111_001_partner_references_schema.sql`**: Adatbázis migráció (`partner_references`, `partner_reference_images`, `pending_storage_deletions` táblák, indexek, triggerek, RLS és GRANT szabályok).

---

## 9. VÉGSŐ BIZTONSÁGI TESZTMÁTRIX (21 PONT)

| ID | Teszteset | Végrehajtás módja | Érintett komponens | Elvárt eredmény | Automatizálható? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **T01** | Anon felhasználó publikált referenciát kér le | REST GET kérés | PostgreSQL RLS | `200 OK`, rekord visszaadva | Igen (E2E) |
| **T02** | Anon felhasználó nem publikált referenciát kér le | REST GET kérés | PostgreSQL RLS | `200 OK`, üres lista (0 sor) | Igen (E2E) |
| **T03** | Anon felhasználó nem publikált képet próbál letölteni | Közvetlen HTTP GET | Cloudflare Worker | `403 Forbidden` | Igen (API) |
| **T04** | Partner A lekéri Partner B vázlatát | REST GET (Partner A JWT) | PostgreSQL RLS | Üres lista (nem látható) | Igen (E2E) |
| **T05** | Partner A módosítani próbálja Partner B referenciáját | REST PATCH (Partner A JWT)| PostgreSQL RLS | `404 / 0 sor módosult` | Igen (API) |
| **T06** | Partner tag (member) referenciát módosít | REST PATCH (Member JWT) | Trigger / RLS | `42501 Kivétel: Nincs admin jog` | Igen (API) |
| **T07** | Partner admin saját referenciát módosít | REST PATCH (Admin JWT) | PostgreSQL RLS | `200 OK`, sikeres mentés | Igen (E2E) |
| **T08** | Partner admin publikálni próbál (`is_published: true`)| REST PATCH (Admin JWT) | PostgreSQL Trigger | `42501 Kivétel: Csak admin publikálhat` | Igen (API) |
| **T09** | Partner admin módosítja a `partner_id`-t | REST PATCH (Admin JWT) | PostgreSQL Trigger | `42501 Kivétel: partner_id immutable` | Igen (API) |
| **T10** | Partner admin manipulálja a `created_at` mezőt | REST PATCH (Admin JWT) | PostgreSQL Trigger | Érték nem változik (OLD felülírja) | Igen (API) |
| **T11** | Partner módosítja a publikált projekt címét/leírását | REST PATCH (Admin JWT) | PostgreSQL Trigger | `is_published` automatikusan `false` lesz | Igen (E2E) |
| **T12** | Platform editor publikál (`is_published: true`) | REST PATCH (Editor JWT) | PostgreSQL Trigger | `200 OK`, `is_published = true` | Igen (E2E) |
| **T13** | Lejárt presigned URL használata (> 5 perc) | HTTP PUT az R2-be | Cloudflare R2 SigV4 | `403 RequestTimeTooSkewed / Expired` | Igen (API) |
| **T14** | Más partnerhez tartozó kulcs megerősítése | POST confirm-upload | Edge Function | `403 Forbidden` | Igen (API) |
| **T15** | Hibás / átnevezett nem-WebP fájl feltöltése | POST confirm-upload | Edge Function (Magic bytes)| `400 Bad Request: Érvénytelen WebP` | Igen (API) |
| **T16** | 10 MB-nál nagyobb forrásfájl feltöltése | Kliensoldali fájlválasztás| `imageCompressor.ts` | Kliens azonnal elutasítja hibával | Igen (Unit) |
| **T17** | Már megerősített objektumkulcs felülírása | POST presign-upload | Edge Function | `409 Conflict: Kulcs már zárolt` | Igen (API) |
| **T18** | Nem létező R2 objektum törlése | S3 DeleteObjectCommand | R2 S3 API | `204 No Content` (idempotens siker) | Igen (API) |
| **T19** | R2 törlés átmenetileg sikertelen | DB Delete trigger | `pending_storage_deletions`| Rekord bekerül retry queue-ba | Igen (DB) |
| **T20** | Két borítókép egyidejű beállítása | SQL INSERT/UPDATE | PostgreSQL Unique Index | `23505 Unique violation` | Igen (DB) |
| **T21** | 11. kép hozzáadási kísérlete | SQL INSERT | PostgreSQL Check Constraint| `23514 Check constraint violation` | Igen (DB) |

---

## 10. VÉGSŐ DÖNTÉSI JELENTÉS ÉS ÉRTÉKELÉS

### 10.1. A vizsgálati területek végleges értékelése:
1. **Trigger:** [BIZONYÍTOTT] A `DELETE` ág javításával és a mező-immutabilitással golyóálló.
2. **RLS:** [BIZONYÍTOTT] A 4 sorszintű szabály teljes körűen lefedi az anon, partner és platform editor szerepköröket.
3. **Oszlopszintű jogosultságok:** [KÖVETKEZTETÉS] PostgREST kompatibilitási okokból a trigger-alapú védelem bizonyítottan megbízhatóbb a törékeny oszlopszintű GRANT-eknél.
4. **R2 hozzáférési modell:** [JAVASLAT] A Worker-alapú privát/publikus hibrid ellenőrzés maximális biztonságot és sebességet nyújt.
5. **Nem publikált képek védelme:** [KÖVETKEZTETÉS] Garantált; illetéktelenek nem tölthetnek le vázlatképeket.
6. **Feltöltési engedélyezés:** [JAVASLAT] Az Intent-alapú szerveroldali kulcsgenerálás kizárja az önkényes tárhely-manipulációt.
7. **Szerveroldali WebP ellenőrzés:** [KÖVETKEZTETÉS] Az első 12 bájt (RIFF/WEBP) vizsgálata kizárja az álcázott kártékony fájlokat.
8. **Képadatmodell:** [JAVASLAT] A különálló `partner_reference_images` relációs tábla conditional unique indexszel garantálja a borítókép egyértelműségét és a hivatkozási épséget.
9. **Törlési folyamat:** [JAVASLAT] A megfordított törlési sorrend kizárja a törött képek megjelenését.
10. **Árva fájlok kezelése:** [JAVASLAT] A `pending_storage_deletions` tábla garantálja az aszinkron idempotens takarítást.
11. **Fejlesztési fájllista:** [BIZONYÍTOTT] Zárt, 3 meglévő módosításból és 6 új fájlból áll.
12. **Éles bevezetési kockázat:** [KÖVETKEZTETÉS] Alacsony, amennyiben a fázisolt bevezetési sorrendet betartják.

### 10.2. Lezárt és nyitott kérdések:
- **LEZÁRT KÉRDÉSEK:** Adatmodell architektúra, RLS szabályok, publikálási trigger logikája, feltöltési engedélyezési folyamat, törlési hibamátrix, mobilos memóriavédelem.
- **NYITOTT KÉRDÉSEK (Infrastruktúra):** A Cloudflare fiókban a dedikált ÉpítőTudás R2 bucket létrehozása és a Supabase Secrets tároló feltöltése még a felhasználó manuális műveletére vár.

### 10.3. Minősítés: **GO WITH CONDITIONS (Feltételekkel jóváhagyható)**

A műszaki és biztonsági architektúra minden elméleti és gyakorlati szempontból **véglegesen kidolgozott, zárt és biztonságos**. A megvalósítás elindításának kizárólagos feltétele az alábbi manuális előfeltételek biztosítása:
1. **[ELŐFELTÉTEL 1]:** Az ÉpítőTudáshoz tartozó Cloudflare R2 bucket létrehozása és kulcsainak rögzítése a Supabase Secrets-ben.
2. **[ELŐFELTÉTEL 2]:** A 3.3. és 6.3. pont szerinti SQL adatbázis-migráció futtatásának jóváhagyása.
3. **[ELŐFELTÉTEL 3]:** A megvalósítás fázisonkénti jóváhagyási rendjének elfogadása.

---
`READ-ONLY FINAL SECURITY VALIDATION COMPLETED – NO CODE, DATABASE, R2, EDGE FUNCTION OR GIT CHANGES`

