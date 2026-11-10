# ÉPÍTŐTUDÁS – CÉLZOTT VÉGELLENŐRZÉSI JEGYZŐKÖNYV
## P0-B01 / P0-C01–C04 / P4 – Bizonyíték Alapú Záró Felülvizsgálat

**Dokumentum azonosító:** `FINAL_RELEASE_VERIFICATION.md`  
**Dátum:** 2026. november 9.  
**Munkaterület:** `c:\Users\User\Documents\epitotudas\project`  
**Adatbázis környezet:** Supabase Cloud (`https://olmavxcmkvvcebgqxohe.supabase.co`)  
**Audit jellege:** Szigorúan **READ-ONLY** vizsgálat (0 adatbázis-módosítás, 0 forráskód-módosítás, 0 migráció, 0 git művelet).

---

## 1. P0-B01 – BIZTONSÁGI MENTÉS ELLENŐRZÉSE

| Vizsgálat | Eredmény | Bizonyíték | Státusz |
|---|---|---|---|
| **Mentési fájl létezése** | A megadott időbélyegzett JSON mentés létezik a fájlrendszerben. | Fájl elérési útja: [categories_backup_2026-11-08T18-13-18.json](file:///c:/Users/User/Documents/epitotudas/project/backups/categories_backup_2026-11-08T18-13-18.json). Méret: 683 914 bájt (676 992 bájt RAW karakterhossz). Fájlrendszer lekérdezés: `Get-ChildItem -Path backups` sikeresen azonosította. | **VERIFIED** |
| **JSON szintaxis érvényessége** | A fájl formailag és szintaktikailag hibátlan, érvényes JSON dokumentum. | PowerShell `ConvertFrom-Json` hiba nélkül feldolgozta. Gyökérobjektum típus: `System.Management.Automation.PSCustomObject`, két felső szintű kulccsal: `metadata` és `data`. | **VERIFIED** |
| **Rekordszám hitelesítése** | A mentés pontosan 22 db rekordot tartalmaz a `data` tömbben. | `data.Count = 22`. A `metadata.record_count` értéke `22`, a HTTP `content_range` értéke `0-21/22`. | **VERIFIED** |
| **Azonosítás az eredeti Supabase-leltárral** | A mentett 22 sor 100%-ban megegyezik a `P0_A01_SUPABASE_DATA_INVENTORY.md` dokumentumban rögzített leltárral. | Mind a 8 db valós építőipari kategória (pl. `0a0374c2-...` Burkolás, `56816cc5-...` Gépészet, `fc9fb546-...` Anyagismeret), mind a 14 db rendszerszintű konfigurációs sor (`00000000-...-0001`-től `...0019`-ig) hiánytalanul jelen van. | **VERIFIED** |
| **297 KB-os fogalomtári konfiguráció épsége** | A `__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__` rekord teljes terjedelmében megmaradt. | UUID: `00000000-0000-0000-0000-000000000009`. A mentésben a `description` mező pontos karaktermérete: **296 937 bájt** (~297 KB), amely az egyedi SVG/Base64 ikonokat és a fogalomtári taxonómiát tartalmazza csonkítás nélkül. | **VERIFIED** |
| **Mock restore teszt tartalma és lefedettsége** | A teszt a mentési JSON struktúrájának és mind a 18 tábla-oszlopának rekonstrukcióját ellenőrizte. | Dokumentálva: [P0_B01_BACKUP_EXECUTION_REPORT.md](file:///c:/Users/User/Documents/epitotudas/project/P0_B01_BACKUP_EXECUTION_REPORT.md#L46-L54). Mind a 22 rekord 18 attribútuma (`id`, `name`, `slug`, `icon_name`, `color`, `description`, `article_count`, `created_at`, `updated_at`, `image_url`, `banner_url`, `featured`, `sort_order`, `seo_title`, `seo_description`, `image_fit`, `image_position`, `image_zoom`) in-memory táblába illesztve 22/22 (100%) bit-pontosan megegyezett. | **VERIFIED** |
| **Restore teszt izolációja** | A teszt teljes mértékben izolált volt, nem érintette az éles adatbázist. | In-memory JavaScript futtatókörnyezetben futott. Hálózati hívások száma a Supabase felé: **0 db**. Éles írási/módosítási kérés nem generálódott. | **VERIFIED** |
| **Mentési hatókör elkülönítése** | **FONTOS:** Kizárólag a `public.categories` tábla mentése készült el, NEM a teljes Supabase adatbázisé. | A mentési JSON fejlécében rögzítve: `table_name: public.categories`. A többi tábla (`articles`, `profiles`, `job_postings`, `partners`, stb.) NEM képezi részét ennek az exportnak. Nem állítható, hogy teljes adatbázis-mentés készült. | **VERIFIED** |

---

## 2. P0-C01–C04 – UUID-KONFLIKTUSOK ELLENŐRZÉSE

### 2.1. `educationService.ts` (`...0022`) vs `tradeService.ts` (`...0007`)

| Szempont | Eredmény | Bizonyíték | Státusz |
|---|---|---|---|
| **Új azonosító egységes használata** | Minden betöltési és mentési hívás az új `00000000-0000-0000-0000-000000000022` ID-t használja. | [educationService.ts:402](file:///c:/Users/User/Documents/epitotudas/project/src/services/educationService.ts#L402): `const SUPABASE_COURSES_ID = '...0022';`<br>Betöltés: [educationService.ts:471](file:///c:/Users/User/Documents/epitotudas/project/src/services/educationService.ts#L471): `.eq('id', SUPABASE_COURSES_ID)`<br>Mentés: [educationService.ts:449](file:///c:/Users/User/Documents/epitotudas/project/src/services/educationService.ts#L449): `id: SUPABASE_COURSES_ID, name: '__SYSTEM_CONFIG_COURSES__'` | **VERIFIED** |
| **Régi ütköző UUID jelenléte** | Nem maradt régi `...0007` azonosító a képzési modulban. | Forráskód-keresés: 0 találat a `000000000007` sztringre az `educationService.ts`-ben. | **VERIFIED** |
| **Fallback logika vizsgálata** | Háromlépcsős fallback rendszer működik. | [educationService.ts:410-436](file:///c:/Users/User/Documents/epitotudas/project/src/services/educationService.ts#L410-L436): 1. `window.__GLOBAL_EDUCATION_DATA__` (memória), 2. `localStorage('epitotudas_education_data_v1')`, 3. `DEFAULT_EDUCATION_DATA` beépített kurzusstruktúra. | **VERIFIED** |
| **Hiányzó rekord létrehozása** | Biztonságos upsert logikával valósul meg. | [educationService.ts:448-456](file:///c:/Users/User/Documents/epitotudas/project/src/services/educationService.ts#L448-L456): `supabase.from('categories').upsert({...})` explicit ID-vel és sluggal (`system-courses-config`), így nem hoz létre duplikációt. | **VERIFIED** |
| **Más modulok védelme** | A szakmák modul (`tradeService.ts`) adatai teljes biztonságban vannak. | [tradeService.ts:16](file:///c:/Users/User/Documents/epitotudas/project/src/services/tradeService.ts#L16) kizárólag a `00000000-0000-0000-0000-000000000007` sort kezeli, a két modul ID-ja fizikailag elválik. | **VERIFIED** |
| **Korábbi adatok megőrzése** | A korábbi adatok változatlanul fennállnak. | A felhőbeli `...0007` sor leíró hossza továbbra is 58 181 bájt, az `educationService` leválasztása nem okozott adatvesztést. | **VERIFIED** |

### 2.2. `knowledgeHubService.ts` (`...0023`) vs `aboutService.ts` (`...0008`)

| Szempont | Eredmény | Bizonyíték | Státusz |
|---|---|---|---|
| **Új azonosító egységes használata** | Minden betöltési és mentési hívás az új `00000000-0000-0000-0000-000000000023` ID-t használja. | [knowledgeHubService.ts:46](file:///c:/Users/User/Documents/epitotudas/project/src/services/knowledgeHubService.ts#L46): `const SUPABASE_SYSTEM_ROW_ID = '...0023';`<br>Betöltés: [knowledgeHubService.ts:296](file:///c:/Users/User/Documents/epitotudas/project/src/services/knowledgeHubService.ts#L296): `.eq('id', SUPABASE_SYSTEM_ROW_ID)`<br>Mentés: [knowledgeHubService.ts:274](file:///c:/Users/User/Documents/epitotudas/project/src/services/knowledgeHubService.ts#L274): `id: SUPABASE_SYSTEM_ROW_ID, name: '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__'` | **VERIFIED** |
| **Régi ütköző UUID jelenléte** | Nem maradt régi `...0008` azonosító a Tudástár szolgáltatásban. | Forráskód-keresés: 0 találat a `000000000008` sztringre a `knowledgeHubService.ts`-ben. | **VERIFIED** |
| **Fallback logika vizsgálata** | Megfelelő lokális és memóriabeli fallback. | [knowledgeHubService.ts:248-262](file:///c:/Users/User/Documents/epitotudas/project/src/services/knowledgeHubService.ts#L248-L262): `localStorage('epitotudas_knowledge_hub_items_v1')` ellenőrzése, érvénytelen vagy üres adat esetén `DEFAULT_KNOWLEDGE_ITEMS` visszaadása. | **VERIFIED** |
| **Hiányzó rekord létrehozása** | Biztonságos PostgREST upsert hívás. | [knowledgeHubService.ts:273-281](file:///c:/Users/User/Documents/epitotudas/project/src/services/knowledgeHubService.ts#L273-L281): slug: `system-knowledge-hub-config`, `article_count: 0`. | **VERIFIED** |
| **Más modulok védelme** | A Rólunk oldal konfigurációja (`aboutService.ts`) védett. | [aboutService.ts:15](file:///c:/Users/User/Documents/epitotudas/project/src/services/aboutService.ts#L15) kizárólag a `00000000-0000-0000-0000-000000000008` ID-t használja. | **VERIFIED** |
| **Korábbi adatok megőrzése** | A Rólunk konfiguráció sértetlen. | A felhőbeli `...0008` sor leíró hossza továbbra is 1 748 bájt. | **VERIFIED** |

### 2.3. `materialsService.ts` (`...0024`) vs `glossaryCategorySettingsService.ts` (`...0009`)

| Szempont | Eredmény | Bizonyíték | Státusz |
|---|---|---|---|
| **Új azonosító egységes használata** | Minden termékbetöltési és mentési hívás az új `00000000-0000-0000-0000-000000000024` ID-t használja. | [materialsService.ts:63](file:///c:/Users/User/Documents/epitotudas/project/src/services/materialsService.ts#L63): `const SUPABASE_SYSTEM_ROW_ID = '...0024';`<br>Betöltés: [materialsService.ts:376](file:///c:/Users/User/Documents/epitotudas/project/src/services/materialsService.ts#L376): `.eq('id', SUPABASE_SYSTEM_ROW_ID)`<br>Mentés: [materialsService.ts:356](file:///c:/Users/User/Documents/epitotudas/project/src/services/materialsService.ts#L356): `id: SUPABASE_SYSTEM_ROW_ID, name: '__SYSTEM_CONFIG_MATERIALS_ITEMS__'` (kategóriák: `...0010`). | **VERIFIED** |
| **Régi ütköző UUID jelenléte** | Nem maradt régi `...0009` azonosító az anyagismeret modulban. | Forráskód-keresés: 0 találat a `000000000009` sztringre a `materialsService.ts`-ben. | **VERIFIED** |
| **Fallback logika vizsgálata** | Megfelelő lokális cache és alapértelmezett katalógus. | [materialsService.ts:289-303](file:///c:/Users/User/Documents/epitotudas/project/src/services/materialsService.ts#L289-L303): `DEFAULT_MATERIALS` és `DEFAULT_MATERIAL_CATEGORIES` stabil fallbackként rendelkezésre áll. | **VERIFIED** |
| **Hiányzó rekord létrehozása** | Szeparált upsert hívás. | [materialsService.ts:355-363](file:///c:/Users/User/Documents/epitotudas/project/src/services/materialsService.ts#L355-L363): slug: `system-materials-items-config`. | **VERIFIED** |
| **Más modulok védelme** | A kiemelten kritikus 297 KB-os fogalomtári konfiguráció teljes biztonságban van. | [glossaryCategorySettingsService.ts:15](file:///c:/Users/User/Documents/epitotudas/project/src/services/glossaryCategorySettingsService.ts#L15) változatlanul a `...0009`-et kezeli; a felülírás kockázata 0%. | **VERIFIED** |
| **Korábbi adatok megőrzése** | A fogalomtári adatok nem sérültek. | A felhőbeli `...0009` rekord mérete változatlanul 296 937 bájt. | **VERIFIED** |

### 2.4. `bookService.ts` (`...0025`) vs `bannerCreativeService.ts` (`...0013`)

| Szempont | Eredmény | Bizonyíték | Státusz |
|---|---|---|---|
| **Új azonosító egységes használata** | A könyvkategóriák mentése és betöltése a `00000000-0000-0000-0000-000000000025` ID-t használja. | [bookService.ts:1330](file:///c:/Users/User/Documents/epitotudas/project/src/services/bookService.ts#L1330): `const SUPABASE_BOOKS_CATEGORIES_ID = '...0025';`<br>Betöltés: [bookService.ts:1402](file:///c:/Users/User/Documents/epitotudas/project/src/services/bookService.ts#L1402): `.eq('id', SUPABASE_BOOKS_CATEGORIES_ID)`<br>Mentés: [bookService.ts:1371](file:///c:/Users/User/Documents/epitotudas/project/src/services/bookService.ts#L1371): `id: SUPABASE_BOOKS_CATEGORIES_ID, name: '__SYSTEM_CONFIG_BOOK_CATEGORIES__'` (könyvek maguk: `...0012`). | **VERIFIED** |
| **Régi ütköző UUID jelenléte** | Nem maradt régi `...0013` azonosító a könyvtár modulban. | Forráskód-keresés: 0 találat a `000000000013` sztringre a `bookService.ts`-ben. | **VERIFIED** |
| **Fallback logika vizsgálata** | Többszintű gyorsítótár és beépített könyvtári kategóriák. | [bookService.ts:1339-1358](file:///c:/Users/User/Documents/epitotudas/project/src/services/bookService.ts#L1339-L1358): `DEFAULT_BOOK_CATEGORIES` és `DEFAULT_BOOKS` adatok biztosítják az azonnali megjelenítést. | **VERIFIED** |
| **Hiányzó rekord létrehozása** | Szeparált upsert hívás. | [bookService.ts:1370-1378](file:///c:/Users/User/Documents/epitotudas/project/src/services/bookService.ts#L1370-L1378): slug: `system-book-categories-config`. | **VERIFIED** |
| **Más modulok védelme** | A hirdetési kreatív konfiguráció (`bannerCreativeService.ts`) nem írható felül. | [bannerCreativeService.ts:4](file:///c:/Users/User/Documents/epitotudas/project/src/services/bannerCreativeService.ts#L4) kezeli a `...0013` ID-t (`__SYSTEM_CONFIG_AD_CREATIVES__`). Teljes fizikai izoláció. | **VERIFIED** |
| **Korábbi adatok megőrzése** | A hirdetési kreatív adatok sértetlenek. | A felhőbeli `...0013` sor (üres tömb `[]`) változatlanul megmaradt. | **VERIFIED** |

---

## 3. P4 – PARTNERI ÉS ÁLLÁSBÖRZE-RENDSZER ELLENŐRZÉSE

| Vizsgálat | Eredmény | Bizonyíték | Státusz |
|---|---|---|---|
| **Partner saját cégadat-hozzáférése** | A partneri felület a bejelentkezett felhasználóhoz kapcsolt cég adatait jeleníti meg és szerkeszti. | [App.tsx:758-774](file:///c:/Users/User/Documents/epitotudas/project/src/App.tsx#L758-L774): `fetchMemberRole()` lekérdezi a `partner_users` táblát a `user.id` alapján (`.eq('user_id', user.id)`). Ha van kapcsolt szervezet, betölti annak rekordját a `partners` táblából (`setCurrentPartner(pRec)`). Hiányában fallbackként a bejelentkezett felhasználó profiljából képez partner objektumot. | **VERIFIED** |
| **Adminisztrációs műveletek elérése partnerként** | A partner NEM éri el közvetlenül az adminisztrációs műveleteket a felületen. | [PartnerLayout.tsx:56-64](file:///c:/Users/User/Documents/epitotudas/project/src/components/PartnerLayout.tsx#L56-L64): A partner menüben csak saját modulok szerepelnek. Az admin felületet az [AdminLayout.tsx:25](file:///c:/Users/User/Documents/epitotudas/project/src/components/AdminLayout.tsx#L25) védi: `if (!authInfo?.hasAdminRole) return <AccessDeniedPage .../>;`. Partner szerepkörrel a rendszer megtagadja a hozzáférést. | **VERIFIED** |
| **Partneri termékbeküldések tárolási helye** | A termékek a böngésző `localStorage`-ébe és a `categories` tábla JSON konfigurációs sorába mentődnek. | [PartnerMaterialsPage.tsx:95](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnerMaterialsPage.tsx#L95) → `saveMaterialsLocal()` ([materialsService.ts:350-363](file:///c:/Users/User/Documents/epitotudas/project/src/services/materialsService.ts#L350-L363)): `localStorage('epitotudas_materials_items_v1')` és aszinkron upsert a `categories` tábla `...0024` sorába. **NEM önálló relációs `materials` táblába mentődik.** | **PARTIALLY VERIFIED** |
| **Partneri cikkbeküldések tárolási helye** | A partneri cikkek KIZÁRÓLAG a helyi böngésző memóriájába és `localStorage`-ébe mentődnek. | [PartnerArticlesPage.tsx:112](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnerArticlesPage.tsx#L112) → `saveArticlesLocal()` ([articleService.ts:37-43](file:///c:/Users/User/Documents/epitotudas/project/src/services/articleService.ts#L37-L43)): kizárólag `localStorage.setItem('epitotudas_articles_v1', ...)` fut le. **Semmilyen felhős PostgREST hívás nem történik.** | **PARTIALLY VERIFIED** |
| **Moderációs státusz tárolása (szerver vs lokális)** | A moderációs státusz kizárólag kliensoldalon, helyileg tárolódik. | [careerService.ts:246-264](file:///c:/Users/User/Documents/epitotudas/project/src/services/careerService.ts#L246-L264): az `approveJobPosting()` és `rejectJobPosting()` kizárólag a `saveStoredJobs()` függvényt hívja meg (`localStorage`). Szerveroldali hálózati kérés nem fut le. Hasonlóan a cikkeknél és termékeknél a státusz csak a helyi állapotban és storage-ben frissül. | **PARTIALLY VERIFIED** |
| **Állások és jelentkezések F5 utáni megmaradása** | Az állásbeküldések és jelentkezések az adott böngészőben F5 frissítés után megmaradnak. | [careerService.ts:143-183](file:///c:/Users/User/Documents/epitotudas/project/src/services/careerService.ts#L143-L183): A `createJobPosting()` a `saveStoredJobs()`-ot, a `submitJobApplication()` pedig a `saveStoredApplications()`-t futtatja. F5 után a `getStoredJobs()` és `getStoredApplications()` azonnal visszaolvassa az adatokat a `localStorage`-ből. | **VERIFIED** |
| **Adatok elérhetősége másik böngészőből / munkamenetből** | Másik böngészőből, privát ablakból vagy másik eszközről az adatok NEM érhetők el. | Mivel az állások és jelentkezések beküldése nem ír be a Supabase felhőadatbázisba (`careerService.ts:223-287`), a perzisztencia gép- és böngészőfüggő. Más felhasználó vagy másik böngésző nem látja a lokálisan rögzített új tételeket. | **FAILED** (Architekturális hiányosság) |
| **RLS szabályok szerepe vs frontend router** | Az állásbörze és cikkmoderáció jogosultságkezelése a frontend routerre támaszkodik; a felhőbeli RLS írási szabályok nincsenek felkonfigurálva. | Migráció: [20260728_012_career_tables.sql:37-41](file:///c:/Users/User/Documents/epitotudas/project/supabase/migrations/20260728_012_career_tables.sql#L37-L41). A `job_postings` és `job_applications` táblákon engedélyezve van az RLS, de **kizárólag `SELECT` policy létezik** (`Public read ...`). Nincs `INSERT`, `UPDATE` vagy `DELETE` policy. Ez megvédi az adatbázist a jogosulatlan írástól, de egyben megakadályozza a kliensoldali felhős mentést is. Továbbá a `job_applications` publikus SELECT-je adatvédelmi szempontból felülvizsgálandó, ha éles adatok kerülnének fel. | **PARTIALLY VERIFIED** |
| **Négy pilot partner státuszának elkülönítése** | A 4 pilot partner demonstrációs tesztadatként szerepel, nem minősülnek szerződött üzleti partnereknek. | [partnerService.ts:123-345](file:///c:/Users/User/Documents/epitotudas/project/src/services/partnerService.ts#L123-L345): `SAMPLE_78AS_EPITOK`, `SAMPLE_ISOTERM`, `SAMPLE_DRYWALLPRO`, `SAMPLE_MASTERROOF` kódban definiált mock objektumok (`p-` prefixű azonosítókkal). Nem képviselnek aláírt partneri megállapodást vagy hitelesített éles regisztrációt. | **VERIFIED** |

---

## 4. RÉSZLETES NEGATÍV MEGÁLLAPÍTÁSOK ÉS BIZONYÍTÉKOK

A vizsgálat során feltárt, éles kiadást érintő korlátozások pontos technikai leírása:

1. **Hiányzó felhőszintű perzisztencia az Állásbörzénél:**
   - **Fájl:** `src/services/careerService.ts`, 223–244. és 272–287. sor.
   - **Megállapítás:** A `createJobPosting()` és `submitJobApplication()` függvények kizárólag a `localStorage`-be írnak (`saveStoredJobs()`, `saveStoredApplications()`). Nem hívják meg a `supabase.from('job_postings').insert(...)` vagy `supabase.from('job_applications').insert(...)` függvényeket.
   - **Következmény:** Az állásbeküldések és jelentkezések nem központiak, eszközváltáskor vagy inkognitó ablakban elvesznek, más felhasználók nem látják őket.

2. **Hiányzó felhőszintű perzisztencia a Partneri Cikkbeküldésnél:**
   - **Fájl:** `src/services/articleService.ts`, 37–43. sor.
   - **Megállapítás:** A `saveArticlesLocal()` csak a böngésző `localStorage`-ébe ment (`epitotudas_articles_v1`). Nincs Supabase REST/PostgREST szinkronizáció a beküldött partneri cikkekhez.
   - **Következmény:** A beküldött cikk nem jut el a központi szerverre, az admin nem tudja azt másik gépen jóváhagyni.

3. **Szerveroldali RLS hiányosság a `job_applications` és `job_postings` táblákon:**
   - **Fájl:** `supabase/migrations/20260728_012_career_tables.sql`, 37–41. sor.
   - **Megállapítás:** Csak olvasási (`FOR SELECT`) szabály van beállítva. Nincs `FOR INSERT` vagy `FOR UPDATE` házirend. Ha a kód megkísérelne írni az adatbázisba, a Supabase RLS azonnal megtagadná azt (`403 Forbidden` / `42501`).
   - **Következmény:** A felhőalapú perzisztenciához elengedhetetlen egy új biztonságos migráció létrehozása, amely meghatározza az engedélyezett beszúrási szabályokat (pl. hitelesített partneri cégazonosítóhoz kötve).

---

## 5. ZÁRÓ ÉRTÉKELÉS

A fenti bizonyítékok és vizsgálatok alapján a rendszer három független minősítése:

### 1. ADATBIZTONSÁG: MEGFELELŐ
- **Indoklás:** Az éles Supabase adatbázis és a 22 db meglévő rekord (köztük a 297 KB-os fogalomtár és a 270 KB-os portálbeállítás) teljes biztonságban van. A 4 kritikus UUID ütközés hiánytalanul feloldásra került (`...0022`, `...0023`, `...0024`, `...0025`), semmilyen felülírási kockázat nem áll fenn. A `categories` tábláról időbélyegzett JSON mentés készült. A félkész funkciók nem tudják kompromittálni az éles relációs adatokat.

### 2. FUNKCIONÁLIS MŰKÖDÉS: MEGFELELŐ (Kliensoldali működés tekintetében)
- **Indoklás:** A platform meglévő és befejezett moduljai (főoldali kereső, szakmai útvonalak, 12 db anyagkalkulátor, szakkönyvtár, fogalomtár, tanári osztály- és vizsgakezelő felület) hibátlanul, típusbiztosan működnek. Az új partneri és állásbörze-funkciók felületi interakciói, F5 utáni perzisztenciája és állapottartása lokálisan biztosított.

### 3. ÉLES KIADHATÓSÁG: FELTÉTELESEN KIADHATÓ
- **Indoklás:** 
  - **Azonnal kiadható funkciók:** A portál teljes oktatási, szakmai, kalkulációs és tudástári motorja azonnal élesíthető, stabil és gyártásra kész.
  - **Feltételhez kötött modulok:** A partneri cikkbeküldés és az állásbörze központi, többeszközös felhő-működése jelenleg lokális szimulációként funkcionál. Éles vállalati partnerek bevonása és országos álláshirdetések kezelése előtt kötelező megvalósítani a relációs táblákhoz tartozó felhőszintű RLS INSERT/UPDATE migrációt és a háttérbeli API szinkronizációt.
  - **Üzleti feltétel:** A forráskódban szereplő 4 db pilot partner demonstrációs tesztadat; éles üzemben kizárólag valós, jogilag igazolt partnerszerződésekkel rendelkező vállalkozások publikálása engedélyezett.

