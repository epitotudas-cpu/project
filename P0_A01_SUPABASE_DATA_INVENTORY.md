# P0-A01: Supabase Adatbiztonsági Leltár és Konfigurációs Audit
## A `categories` Tábla Felhőbeli Állapota és a 18 Érintett Szolgáltatás Részletes Felmérése

**Dokumentum azonosító:** `P0_A01_SUPABASE_DATA_INVENTORY.md`  
**Dátum:** 2026. november 8.  
**Audit típusa:** Szigorúan READ-ONLY adatbiztonsági vizsgálat (0 adatbázis- és forráskód-módosítás)  
**Vizsgált környezet:** ÉpítőTudás v2 (`c:\Users\User\Documents\epitotudas\project`)  
**Adatbázis azonosító:** Supabase Cloud (`olmavxcmkvvcebgqxohe`)

---

## 1. VIZSGÁLAT IDŐPONTJA ÉS KÖRNYEZETE

- **Vizsgálat időpontja:** 2026. november 8., 17:34 (CET)
- **Végrehajtó:** Antigravity AI (Google DeepMind)
- **Végrehajtási mód:** Kizárólag READ-ONLY HTTP GET / PostgREST lekérdezés és forráskód-elemzés.
- **Biztonsági garancia:** Semmilyen író művelet (INSERT, UPDATE, DELETE, UPSERT, TRUNCATE, ALTER, DROP) NEM futott le. Sem forráskód, sem adatbázis-rekord nem módosult.

---

## 2. VIZSGÁLT PROJEKT ÉS ADATFORRÁSOK

1. **Supabase Cloud REST API:**
   - Végpont: `https://olmavxcmkvvcebgqxohe.supabase.co/rest/v1/categories`
   - Lekérdezési paraméterek: `select=id,name,slug,description,sort_order,created_at,updated_at&order=id.asc`
   - Fejlécek: `Prefer: count=exact`, standard anon apikey
2. **Forráskód-bázis:**
   - `src/services/*.ts` (üzleti logikai és adatszolgáltató modulok)
   - `src/lib/supabase.ts` (kliens konfiguráció és TypeScript típusdefiníciók)
   - `supabase/migrations/*.sql` (26 db relációs migrációs fájl)

---

## 3. VIZSGÁLT FÁJLOK ÉS SZOLGÁLTATÁSOK

A forráskód-átvilágítás során az alábbi szolgáltatásokat és fájlokat elemeztük:
1. `src/services/siteSettingsService.ts`
2. `src/services/heroImageService.ts`
3. `src/services/impressumService.ts`
4. `src/services/navigationService.ts`
5. `src/services/calculatorConfigService.ts`
6. `src/services/legalDocService.ts`
7. `src/services/tradeService.ts`
8. `src/services/educationService.ts`
9. `src/services/aboutService.ts`
10. `src/services/knowledgeHubService.ts`
11. `src/services/glossaryCategorySettingsService.ts`
12. `src/services/materialsService.ts`
13. `src/services/partnerService.ts`
14. `src/services/bookService.ts`
15. `src/services/bannerCreativeService.ts`
16. `src/services/articleSettingsService.ts`
17. `src/services/advertisementService.ts`
18. `src/services/adService.ts`
19. `src/services/categoryService.ts` (központi kategória-lekérdező és szűrő)

---

## 4. A `CATEGORIES` TÁBLA TÉNYLEGES FELHŐBELI ÁLLAPOTA

A tábla 22 tényleges sort tartalmaz a Supabase adatbázisban. A rekordok két élesen elkülönülő csoportra oszlanak:
1. **Valódi publikus építőipari szakmai kategóriák (8 db):** Valódi UUID-val, magyar elnevezéssel, rövid szöveges leírással.
2. **Rendszerkonfigurációs „kulcs-érték" sorok (14 db):** Statikus `00000000-0000-0000-0000-*` UUID-val, `__SYSTEM_CONFIG_*` névvel, ahol a teljes adatszerkezet a `description` mezőbe mentett JSON-karakterlánc.

### Teljes felhőbeli rekordinventár:

| # | ID (UUID) | Név (`name`) | Slug (`slug`) | Típus | Leírás mérete (bájt) | Tartalom összefoglalása |
|---|---|---|---|---|---|---|
| **1.** | `00000000-0000-0000-0000-000000000001` | `__SYSTEM_CONFIG_SITE_SETTINGS__` | `system-site-settings-config` | JSON-Objektum | **270 201 B** (~270 KB) | Oldalcím, színek, témabeállítások, beágyazott Base64 logó és képek |
| **2.** | `00000000-0000-0000-0000-000000000002` | `__SYSTEM_CONFIG_HERO_STATE__` | `system-hero-state-config` | JSON-Objektum | 4 085 B | Főoldali Hero slideshow konfiguráció és képek listája |
| **3.** | `00000000-0000-0000-0000-000000000003` | `__SYSTEM_CONFIG_IMPRESSUM__` | `system-impressum-config` | JSON-Objektum | 757 B | Impresszum adatok (cégnév, adószám, tárhelyszolgáltató) |
| **4.** | `00000000-0000-0000-0000-000000000004` | `__SYSTEM_CONFIG_NAV_STRUCTURE__` | `system-nav-structure-config` | JSON-Tömb | 3 058 B | 25 db egyedi navigációs menüpont szerkezete |
| **5.** | `00000000-0000-0000-0000-000000000005` | `__SYSTEM_CONFIG_CALCULATOR_PRICES__` | `system-calc-prices-config` | JSON-Objektum | 3 904 B | Anyagárak (beton, gipszkarton, csemperagasztó), áfakulcs, munkadíj-szorzó |
| **6.** | `00000000-0000-0000-0000-000000000006` | `__SYSTEM_CONFIG_LEGAL_DOCS__` | `system-legal-docs-config` | JSON-Objektum | 3 681 B | ÁSZF, Adatkezelési tájékoztató és Cookie szabályzat JSON struktúrája |
| **7.** | `00000000-0000-0000-0000-000000000007` | `__SYSTEM_CONFIG_TRADES__` | `system-trades-config` | JSON-Tömb | **58 181 B** (~58 KB) | 8 db építőipari szakma részletes leírása, szerszámai, képzései |
| **8.** | `00000000-0000-0000-0000-000000000008` | `__SYSTEM_CONFIG_ABOUT_SETTINGS__` | `system-about-config` | JSON-Objektum | 1 748 B | Rólunk oldal szekciócímei, küldetés, jövőkép, értékek |
| **9.** | `00000000-0000-0000-0000-000000000009` | `__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__` | `system-glossary-cat-config` | JSON-Objektum | **296 937 B** (~297 KB) | Fogalomtár kategóriabeállítások, egyedi ikonok és Base64 képek |
| **10.** | `00000000-0000-0000-0000-000000000011` | `__SYSTEM_CONFIG_PARTNERS__` | `system-partners-config` | JSON-Tömb | 4 662 B | 2 db partner alapadatai és leírása |
| **11.** | `00000000-0000-0000-0000-000000000012` | `__SYSTEM_CONFIG_BOOKS__` | `system-books-config` | JSON-Tömb | 2 B | Üres tömb (`[]`) – a szakkönyvtár lokális seed adatokból fut |
| **12.** | `00000000-0000-0000-0000-000000000013` | `__SYSTEM_CONFIG_AD_CREATIVES__` | `system-ad-creatives-config` | JSON-Tömb | 2 B | Üres tömb (`[]`) – a hirdetési kreatívok lokális seed adatokból futnak |
| **13.** | `00000000-0000-0000-0000-000000000015` | `__SYSTEM_CONFIG_AD_CAMPAIGNS__` | `system-ad-campaigns-config` | JSON-Tömb | 2 B | Üres tömb (`[]`) – nincs aktív felhős kampányrekord |
| **14.** | `00000000-0000-0000-0000-000000000019` | `__SYSTEM_CONFIG_AD_FALLBACK_VIDEO__` | `system-ad-fallback-video-config` | JSON-Objektum | 433 B | Tartalék videós szponzoráció (Bosch Professional 18V) |
| **15.** | `0a0374c2-3fbc-4327-a0c9-232a5bbc5647` | Burkolás | `burkolas` | Szöveg | 37 B | „Padlóburkolatok, csempézés és fugázás" |
| **16.** | `56816cc5-9fe4-446f-a344-48306c27f3be` | Gépészet | `gepeszet` | Szöveg | 35 B | „Gépek, berendezések és karbantartás" |
| **17.** | `5dfdcca1-d8b0-4823-b5a0-de99afbbf36c` | Villanyszerelés | `villanyszereles` | Szöveg | 34 B | „Elektromos rendszerek és biztonság" |
| **18.** | `61549811-6f03-4a87-b1eb-83794a7eb826` | Szerkezetépítés | `szerkezetepites` | Szöveg | 43 B | „Beton, vasalás, falazat és tartószerkezetek" |
| **19.** | `d02f8602-358b-4b5a-9f15-446c9289a3fb` | Alapozás | `alapozas` | Szöveg | 31 B | „Alapok, talajmunkák és földerek" |
| **20.** | `e3b3a6c5-20cc-42d5-b20c-14f4afc05e96` | Víz-Gáz-Fűtés | `viz-gaz-futes` | Szöveg | 36 B | „Vízvezeték, gáz és fűtési rendszerek" |
| **21.** | `ec8befee-19d3-4f0b-87e8-e9157bb640aa` | Tetőfedés | `tetofedes` | Szöveg | 35 B | „Tetőszerek, fedések és szigetelések" |
| **22.** | `fc9fb546-fa12-4076-a02b-b933427a5dd9` | Anyagismeret | `anyagismeret` | Szöveg | 43 B | „Építőanyagok tulajdonságai és felhasználása" |

---

## 5. REKORDSZÁM ÉS LEKÉRDEZÉSI TELJESSÉG BIZONYÍTÁSA

- **HTTP Státuszkód:** `200 OK`
- **Válaszfejléc (`Content-Range`):** `0-21/22`
- **Ténylegesen megkapott sorok száma:** **22 db**
- **Teljességi igazolás:** A PostgREST `Prefer: count=exact` fejléce és a `Content-Range: 0-21/22` fejléc matematikailag igazolja, hogy a tábla a lekérdezés pillanatában **összesen és pontosan 22 sort tartalmazott**. Nem történt lapozási (pagination) csonkítás, és nincs olyan rekord a `categories` táblában, amely ne szerepelne a fenti listában.
- **A vizsgálat teljessége:** **100%-OS TELJES LEKÉRDEZÉS.**

---

## 6. RLS ÉS JOGOSULTSÁGI MEGÁLLAPÍTÁSOK

1. **Olvasási jogosultság (`SELECT`):**
   - A `supabase/migrations/20260601024824_001_initial_schema.sql:198` migrációban létrehozott `"Public read categories"` RLS házirend engedélyezi a nyilvános olvasást (`USING (true)`).
   - Emiatt a nem hitelesített (anon) kliens is hiánytalanul látja mind a 22 rekordot, beleértve a rendszerkonfigurációs sorokat is.
2. **Kiszűrés a publikus felületen:**
   - A `categoryService.ts:345` lekérdezései célzottan szűrik a rendszer-sorokat: `.not('name', 'ilike', '__SYSTEM_CONFIG_%').neq('id', '00000000-0000-0000-0000-000000000001')`. Ennek köszönhetően a látogatói felület kategórialistáiban a 14 db konfigurációs sor nem jelenik meg kategóriaként.
3. **Írási jogosultság (`INSERT`, `UPDATE`, `DELETE`):**
   - A `20260718163551_fix_rls_recursion.sql` migráció alapján az írás kizárólag adminisztrátori vagy szerkesztői szerepkörrel rendelkező felhasználóknak (`is_admin_or_editor()`) engedélyezett.
   - Vendég felhasználó vagy normál tanuló közvetlenül nem tudja felülírni ezeket a konfigurációkat.

---

## 7. A 18 ÉRINTETT SZOLGÁLTATÁS ADATKEZELÉSI ÁTTEKINTÉSE

| Szolgáltatás Fájl | Hivatkozott UUID | Mentett Kulcsnév | Szerepel a Supabase-ben? | Olvasási Működés | Írási Működés | Lokális Fallback |
|---|---|---|---|---|---|---|
| `siteSettingsService.ts` | `...0001` | `__SYSTEM_CONFIG_SITE_SETTINGS__` | **IGEN** (270 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_SITE_SETTINGS` |
| `heroImageService.ts` | `...0002` | `__SYSTEM_CONFIG_HERO_STATE__` | **IGEN** (4 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_HERO_IMAGES` |
| `impressumService.ts` | `...0003` | `__SYSTEM_CONFIG_IMPRESSUM__` | **IGEN** (757 B) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_IMPRESSUM_DATA` |
| `navigationService.ts` | `...0004` | `__SYSTEM_CONFIG_NAV_STRUCTURE__` | **IGEN** (3 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_NAV_ITEMS` |
| `calculatorConfigService.ts` | `...0005` | `__SYSTEM_CONFIG_CALCULATOR_PRICES__` | **IGEN** (3.9 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_CALCULATOR_PRICES` |
| `legalDocService.ts` | `...0006` | `__SYSTEM_CONFIG_LEGAL_DOCS__` | **IGEN** (3.7 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_LEGAL_DOCS` |
| `tradeService.ts` | `...0007` | `__SYSTEM_CONFIG_TRADES__` | **IGEN** (58 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_TRADE_ITEMS` |
| `educationService.ts` | `...0007` | `__SYSTEM_CONFIG_COURSES__` | **NEM (Hiányzik!)** | Cloud olvasás elbukik (nem `{`) | Admin mentés ➔ Upsert | `DEFAULT_EDUCATION_DATA` |
| `aboutService.ts` | `...0008` | `__SYSTEM_CONFIG_ABOUT_SETTINGS__` | **IGEN** (1.7 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_ABOUT_SETTINGS` |
| `knowledgeHubService.ts` | `...0008` | `__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__` | **NEM (Hiányzik!)** | Cloud olvasás elbukik (nem `[`) | Admin mentés ➔ Upsert | `DEFAULT_KNOWLEDGE_ITEMS` |
| `glossaryCategorySettingsService.ts` | `...0009` | `__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__` | **IGEN** (297 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_GLOSSARY_CATEGORY_SETTINGS` |
| `materialsService.ts` (termékek) | `...0009` | `__SYSTEM_CONFIG_MATERIALS_ITEMS__` | **NEM (Hiányzik!)** | Cloud olvasás elbukik (nem `[`) | Admin mentés ➔ Upsert | `DEFAULT_MATERIALS` |
| `materialsService.ts` (kategóriák)| `...0010` | `__SYSTEM_CONFIG_MATERIAL_CATEGORIES__` | **NEM (Hiányzik!)** | Cloud olvasás elbukik (null) | Admin mentés ➔ Upsert | `DEFAULT_MATERIAL_CATEGORIES` |
| `partnerService.ts` | `...0011` | `__SYSTEM_CONFIG_PARTNERS__` | **IGEN** (4.6 KB) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_PARTNERS` |
| `bookService.ts` (könyvek) | `...0012` | `__SYSTEM_CONFIG_BOOKS__` | **IGEN** (2 B `[]`) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_BOOKS` |
| `bannerCreativeService.ts` (bannerek)| `...0013` | `__SYSTEM_CONFIG_AD_CREATIVES__` | **IGEN** (2 B `[]`) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_AD_CREATIVES` |
| `bookService.ts` (könyvkategóriák)| `...0013` | `__SYSTEM_CONFIG_BOOK_CATEGORIES__` | **NEM (Hiányzik!)** | Cloud olvasás üres tömböt lát | Admin mentés ➔ Upsert | `DEFAULT_BOOK_CATEGORIES` |
| `articleSettingsService.ts` | `...0014` | `__SYSTEM_CONFIG_ARTICLE_SETTINGS__` | **NEM (Hiányzik!)** | Cloud olvasás elbukik (null) | Admin mentés ➔ Upsert | `DEFAULT_ARTICLE_SETTINGS` |
| `advertisementService.ts` | `...0015` | `__SYSTEM_CONFIG_AD_CAMPAIGNS__` | **IGEN** (2 B `[]`) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | `DEFAULT_AD_CAMPAIGNS` |
| `bannerCreativeService.ts` (videó)| `...0019` | `__SYSTEM_CONFIG_AD_FALLBACK_VIDEO__` | **IGEN** (433 B) | Cloud ➔ LocalStorage | Admin mentés ➔ Upsert | Statikus objektum |
| `bannerCreativeService.ts` (csempék)| `...0020` | `__SYSTEM_CONFIG_TILE_ADS__` | **NEM (Hiányzik!)** | Cloud olvasás elbukik (null) | Admin mentés ➔ Upsert | Statikus lista |
| `adService.ts` (hirdetők) | `...0021` | `__SYSTEM_CONFIG_ADVERTISERS__` | **NEM (Hiányzik!)** | Cloud olvasás elbukik (null) | Admin mentés ➔ Upsert | Statikus lista |

---

## 8. A NÉGY UUID-ÜTKÖZÉS RÉSZLETES ELEMZÉSE

A felhőbeli rekordinventár és a forráskód vizsgálata feltárta, hogy a kódszintű ütközések a felhőben **konkrét, aszimmetrikus állapotot hoztak létre**: az ütköző párok egyik tagja birtokolja a felhős sort, míg a másik tag felhős sora hiányzik, mert felülíródott vagy soha nem jött létre.

### 8.1 1. Konfliktus: `...0007` (Oktatási Kurzusok vs. Építőipari Szakmák)
1. **Érintett szolgáltatások:**
   - `tradeService.ts:21` (`SUPABASE_TRADES_ID = '00000000-0000-0000-0000-000000000007'`)
   - `educationService.ts:402` (`SUPABASE_COURSES_ID = '00000000-0000-0000-0000-000000000007'`)
2. **Tényleges felhőbeli állapot:**
   - A `...0007` sor a Supabase-ben létezik: neve `__SYSTEM_CONFIG_TRADES__`, mérete 58 181 bájt.
   - Tartalma: 8 db részletesen kitöltött szakma JSON-tömbje (kőműves, ács, burkoló stb.).
3. **Olvasási viselkedés:**
   - `tradeService.ts`: Sikeresen beolvassa a felhőből a szakmákat, mivel `data.description.startsWith('[')` teljesül.
   - `educationService.ts`: A `fetchEducationDataFromCloud()` függvény ellenőrzi, hogy `data.description.startsWith('{')`. Mivel a szakmák adata szögletes zárójellel (`[`) kezdődik, az ellenőrzés meghiúsul, és az oktatási adatok beolvasása csendben elbukik. Az alkalmazás a `DEFAULT_EDUCATION_DATA` és a helyi `localStorage` adatait használja.
4. **Írási viselkedés és kockázat:**
   - **KRITIKUS KOCKÁZAT:** Ha egy adminisztrátor az `AdminCoursesPage` felületen mentést hajt végre (`saveEducationData`), az felülírja a `...0007` sort a kurzusok JSON objektumával.
   - Ennek következtében a felhőben lévő 58 KB méretű szakma-adatbázis **azonnal megsemmisül**, és más klienseken a szakmák oldala (`#paths`) visszaesik az alapértelmezett seed állapotra.
5. **Legkisebb kockázatú feloldási irány:**
   - A felhőben jelenleg létező és értékes 58 KB-os `__SYSTEM_CONFIG_TRADES__` adatot sértetlenül kell hagyni a `...0007` sorban.
   - A kurzusok szolgáltatásának (`educationService.ts`) egy teljesen új, szabad azonosítót kell kapnia a mentéshez, megelőzve a szakmák felülírását.

---

### 8.2 2. Konfliktus: `...0008` (Rólunk Beállítások vs. Tudástár Elemek)
1. **Érintett szolgáltatások:**
   - `aboutService.ts:49` (`SUPABASE_ABOUT_ID = '00000000-0000-0000-0000-000000000008'`)
   - `knowledgeHubService.ts:46` (`SUPABASE_SYSTEM_ROW_ID = '00000000-0000-0000-0000-000000000008'`)
2. **Tényleges felhőbeli állapot:**
   - A `...0008` sor a Supabase-ben létezik: neve `__SYSTEM_CONFIG_ABOUT_SETTINGS__`, mérete 1 748 bájt.
   - Tartalma: A Rólunk oldal szekcióinak beállítási objektuma (JSON Object).
3. **Olvasási viselkedés:**
   - `aboutService.ts`: Sikeresen beolvassa a beállításokat (`data.description.startsWith('{')` teljesül).
   - `knowledgeHubService.ts`: A `fetchKnowledgeItemsFromCloud()` ellenőrzi, hogy `data.description.startsWith('[')`. Mivel a Rólunk adatok kapcsos zárójellel (`{`) kezdődnek, az olvasás elbukik, és a Tudástár a helyi `DEFAULT_KNOWLEDGE_ITEMS` listából töltődik be.
4. **Írási viselkedés és kockázat:**
   - **MAGAS KOCKÁZAT:** Ha a Tudástár elemeit adminisztrátori felületről mentik (`saveKnowledgeItemsLocal`), az felülírja a `...0008` sort egy JSON-tömbbel, megsemmisítve a Rólunk oldal felhőbeli beállításait.
5. **Legkisebb kockázatú feloldási irány:**
   - A felhőben lévő `__SYSTEM_CONFIG_ABOUT_SETTINGS__` rekordot megtartjuk a `...0008` azonosítón.
   - A `knowledgeHubService.ts` számára külön, dedikált azonosítót jelölünk ki.

---

### 8.3 3. Konfliktus: `...0009` (Fogalomtár Kategóriák vs. Építőanyagok)
1. **Érintett szolgáltatások:**
   - `glossaryCategorySettingsService.ts:111` (`SUPABASE_GLOSSARY_CAT_ID = '00000000-0000-0000-0000-000000000009'`)
   - `materialsService.ts:63` (`SUPABASE_SYSTEM_ROW_ID = '00000000-0000-0000-0000-000000000009'`)
2. **Tényleges felhőbeli állapot:**
   - A `...0009` sor a Supabase-ben létezik: neve `__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__`, mérete **296 937 bájt** (~297 KB).
   - Tartalma: A fogalomtár kategóriáinak testreszabott adatai, kategória-ikonok és feltöltött képek Base64 kódolású szövege (JSON Object).
3. **Olvasási viselkedés:**
   - `glossaryCategorySettingsService.ts`: Hibátlanul betölti a 297 KB méretű konfigurációt.
   - `materialsService.ts`: A `fetchMaterialsFromCloud()` JSON-tömböt vár (`startsWith('[')`), ezért a `...0009` sort nem tudja értelmezni, és a beépített `DEFAULT_MATERIALS` listára esik vissza.
4. **Írási viselkedés és kockázat:**
   - **KRITIKUS KOCKÁZAT:** A `materialsService` mentése azonnal felülírná a `categories` tábla legnagyobb méretű, 297 KB-os fogalomtári konfigurációját, megsemmisítve az adminisztrátor által beállított fogalom-ikonokat és képeket.
5. **Legkisebb kockázatú feloldási irány:**
   - A 297 KB-os `__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__` rekordot szigorúan tilos bántani, marad a `...0009` sorban.
   - A `materialsService.ts` anyag- és kategórialistáját új, izolált azonosítókra kell átirányítani.

---

### 8.4 4. Konfliktus: `...0013` (Szakkönyvtár Kategóriák vs. Hirdetési Kreatívok)
1. **Érintett szolgáltatások:**
   - `bannerCreativeService.ts:4` (`SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000013'`)
   - `bookService.ts:1330` (`SUPABASE_BOOKS_CATEGORIES_ID = '00000000-0000-0000-0000-000000000013'`)
2. **Tényleges felhőbeli állapot:**
   - A `...0013` sor a Supabase-ben létezik: neve `__SYSTEM_CONFIG_AD_CREATIVES__`, mérete mindössze **2 bájt** (egy üres JSON-tömb: `[]`).
3. **Olvasási viselkedés:**
   - Mindkét szolgáltatás JSON-tömböt vár (`startsWith('[')`).
   - A `bannerCreativeService.ts` beolvassa az üres tömböt, és mivel az üres, a `DEFAULT_AD_CREATIVES` listához nyúl vissza.
   - A `bookService.ts` a `getBookCategories()` híváskor beolvassa az üres tömböt, de mivel a hossza 0 (`parsed.length > 0` feltétel nem teljesül), visszaugrik a `DEFAULT_BOOK_CATEGORIES` listára.
4. **Írási viselkedés és kockázat:**
   - **MAGAS KOCKÁZAT:** Ha a `bookService` elmenti a könyvkategóriákat a `...0013` sorba, a `bannerCreativeService` a könyvkategóriák tömbjét fogja hirdetési kreatívként beolvasni, ami felületi hibát okozhat a hirdetési modulban. Ha pedig a hirdetéskezelő ment, törli a könyvkategóriákat.
5. **Legkisebb kockázatú feloldási irány:**
   - Mivel a felhőben jelenleg csak egy üres tömb (`[]`) van, az adatvesztés kockázata itt a legkisebb, de a két modul szétválasztása elengedhetetlen a típusütközések megelőzésére.

---

## 9. BIZONYÍTOTT HIBÁK (IGAZOLT TÉNYEK)

1. **Strukturális aszimmetria a felhőben:** A kódban azonosított 4 ütköző párból a felhőben mind a négy esetben csak az egyik fél rekordja létezik (`TRADES`, `ABOUT`, `GLOSSARY_CATS`, `AD_CREATIVES`), míg a másik négy modul (`COURSES`, `KNOWLEDGE_HUB`, `MATERIALS`, `BOOK_CATS`) felhőbeli rekordja **hiányzik**, így azok jelenleg kizárólag kliensoldali fallbackből működnek.
2. **Kölcsönös megsemmisítési kockázat:** Bármelyik hiányzó modul adminisztrátori mentése azonnal felülírja a létező párját a felhőben.
3. **Extrém méretű JSON-sorok a `categories` táblában:** A `categories.description` mezőben 2 db rekord mérete is meghaladja a 270 KB-ot (`site_settings`: 270 KB, `glossary_cats`: 297 KB), mert a képek Base64 formátumban, szövegként vannak beágyazva a JSON-ba a felhős fájltár (Storage) helyett.

---

## 10. NEM IGAZOLT KOCKÁZATOK ÉS FELTÉTELEZÉSEK

1. **Valódi adatvesztés történt-e a múltban?**
   - Nem igazolható, hogy a felhőben korábban léteztek-e a felülírt modulok (`COURSES`, `KNOWLEDGE_HUB`, `MATERIALS`) adatai, vagy a kezdetektől fogva nem sikerült őket felhőbe menteni.
2. **Keresztmodul-interferencia a klienseken:**
   - Mivel a parser logikák típusellenőrzést végeznek (`startsWith('{')` vs. `startsWith('[')`), a kliensek nem omlottak össze futásidőben, hanem csendben visszatértek a lokális alapértelmezett értékekhez. A felhasználó felé ez nem hibaként, hanem a beállítások perzisztenciájának hiányaként jelentkezett.

---

## 11. HIÁNYZÓ VAGY NEM HOZZÁFÉRHETŐ INFORMÁCIÓK

- **Adatbázis módosítási előzmények (Audit Log):** A `categories` tábla korábbi felülírásainak időbélyege és az elkövető felhasználó nem visszakövethető részletesen, mert a táblán csak egy `updated_at` mező található, historikus audit tábla nincs bekötve a konfigurációs felülírásokra.
- **Minden egyéb tábla:** A jelenlegi leltár szigorúan a `categories` táblára fókuszált a feladatkiírás szerint; a többi tábla (`articles`, `profiles`, `courses` relációs tábla) nem képezte a P0-A01 tárgyát.

---

## 12. JAVASOLT KÖVETKEZŐ LÉPÉSEK (VÉGREHAJTÁS NÉLKÜL)

1. **P0-B01 Mentési és Visszaállítási Protokoll kidolgozása:**
   - Készíteni egy önálló export szkriptet, amely a jelenlegi 22 rekordot hiánytalanul kimenti egy biztonságos, időbélyeggel ellátott JSON állományba.
   - Kidolgozni és elkülönített tesztkörnyezetben ellenőrizni a visszaállítási eljárást.
2. **P0-C01..P0-C04 Konfliktus-feloldási Tervek jóváhagyása:**
   - A most feltárt tények alapján a javítás iránya egyértelmű: a felhőben létező 4 értékes rekordot (`...0007` Szakmák, `...0008` Rólunk, `...0009` Fogalomtár, `...0013` Kreatívok) **nem szabad átnevezni vagy törölni**.
   - A felhőből hiányzó szolgáltatások (`educationService`, `knowledgeHubService`, `materialsService`, `bookService`) számára kell új, ütközésmentes azonosítókat biztosítani külön-külön SAFE PATCH lépésekben.
3. **P0-D01 AuthContext és TypeScript hiba javítása:**
   - Párhuzamosan előkészíthető az `AuthContext.tsx` TS2551 hibájának elhárítása, mivel az nem függ a felhőbeli adatbázis-mentéstől.

---

**AUDIT LEZÁRVA – READ-ONLY VÉGREHAJTÁS MEGFELELŐSÉG:**  
A vizsgálat során 0 db rekord módosult, 0 db fájl változott a kódbázisban. A rendszer állapota változatlan.

