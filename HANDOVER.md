# ÉpítőTudás v2 – Fejlesztési Sorrend és Projektátadási Dokumentum (Végleges)

> **A dokumentum célja:**  
> Ez a projektátadási dokumentáció teljes körű tájékoztatást nyújt az új és meglévő fejlesztők számára a projekt jelenlegi állapotáról, az alapszabályokról, a technológiai invariánsokról, a 14 fázisú (0-13. fázis) fejlesztési ütemtervről, valamint a hibrid Cloudflare + Supabase infrastruktúra-stratégiáról.

---

## 0. Fázis – Projekt Stabilizálása ✅ (Elkészült)

* **Állapot:** Elkészült
* **Elvégzett feladatok:**
  * Service réteg egységesítése (nincs közvetlen Supabase hívás a komponensekben).
  * Auth integráció egységesítése (`authClient` absztrakciós rétegen keresztül).
  * Admin rendszer stabilizálása és szerepkör-alapú védelem.
  * Cloudflare Pages kompatibilitás (`public/_redirects` SPA átirányításokkal).
  * Kódbázis és architektúra teljes körű dokumentálása.
  * Linter és TypeScript típusellenőrzés 100%-osan hibamentes.

---

## Fejlesztési Alapelvek

Az alábbi 7 alapelv kötelező érvényű minden fejlesztő számára a kód módosítása vagy új modulok hozzáadása során:

1. **A működő funkciók viselkedése nem változhat indokolatlanul:** A meglévő felhasználói élmény és stabil funkciók nem törhetnek el új fejlesztések bevezetésekor.
2. **Minden új funkció modulárisan készüljön:** Különálló, függetlenül karbantartható komponensek és szolgáltatások formájában.
3. **A meglévő adatokat migrálni kell, nem törölni:** Adatbázis-módosítás során az meglévő adatok megőrzése és biztonságos migrációja alapkövetelmény.
4. **Új adatmodell csak visszafelé kompatibilis módon vezethető be:** Additív (hozzáadó) adatbázis migrációkkal, a meglévő táblák és kapcsolatok sérülése nélkül.
5. **A Service réteg az egyetlen adatelérési pont:** UI komponensek közvetlenül nem férhetnek hozzá az adatbázishoz vagy az Auth klienshez.
6. **Az adminfelület legyen bővíthető modulokkal:** Az adminisztrációs dashboard-ot úgy kell felépíteni, hogy az új funkciók (pl. moderáció, reklámok, partnerek) új modulként dinamikusan csatlakoztathatók legyenek.
7. **Minden új modul legyen önállóan kikapcsolható vagy bővíthető:** A modulok funkciókapcsolókkal (feature flags/config) vagy tiszta interfészekkel legyenek leválasztva a rendszerről.


---

## 1. Fejlesztési Sorrend Ütemterve (1–13. Fázis)

### 1. Fázis – Jogi és működési alapok ✅ (Elkészült)
* **Cél:** A weboldal jogszerű működésének és GDPR megfelelőségének biztosítása.
* **Elkészült:** Impresszum, GDPR Adatkezelési Tájékoztató, ÁSZF, Cookie szabályzat, Süti hozzájárulási sáv és lábléc navigáció.

### 2. Fázis – A jelenlegi négy modul befejezése ✅ (Elkészült)
* **Cél:** Az alapfunkciók teljessé tétele a meglévő modulokban.
* **Főoldal:** Logikus felépítés, kiemelt cikkek, kategóriák, kereső, partner ajánlók, reklámhelyek absztrakciója.
* **Kategóriák és Cikkek:** Kapcsolódó cikkek, szerzői adatlap, címkék.
* **Fogalomtár & Nyelvi Szótár:** Additív séma bővítés (`entry_type`, `official_term_id`, `detailed_description`, `practical_applications`, `common_mistakes`, `usage_example`, `origin_note`). Két tartalomtípus egyetlen tudásgráfban: **Szakmai Fogalomtár** (`technical_concept`) és **Építőipari Nyelvi Szótár** (`industry_term`). Kereshető hivatalos fogalom összekapcsolás, szleng-műszaki híd kártyák és kétfülös admin felület.
* **Szerszámok:** Gyártók szűrése, ajánlott cikkek, partner forgalmazói ajánlások.

### 3. Fázis – Jogosultsági rendszer (v2 RBAC) ✅ (Elkészült)
* **Új adatmodell:** Additív migráció (`roles`, `permissions`, `role_permissions` táblák).
* **Bővített szerepkörök:** Tanuló, Szakember, Partner, Iskola, Moderátor, Editor, Admin (visszamenőlegesen kompatibilis védelemmel).
* **Szolgáltatások:** `roleService.ts`, `permissionService.ts` és frissített `permissions.ts`.

### 4. Fázis – Admin rendszer átalakítása ✅ (Elkészült)
* **Cél:** Az admin felület átalakítása moduláris platformkezelő rendszerré.
* **Elkészült modulok:** Moderációs várólista (`AdminModerationPage`), Jogosultságkezelő (`AdminRolesPage`), Partnerek modul (`AdminPartnersPage`), Reklámkezelő (`AdminAdsPage`), Audit napló (`AdminAuditPage`) és `adminService.ts`.

### 5. Fázis – Tartalom életciklus
* **Cél:** Minden tartalomtípus (Cikk, Fogalom, Szerszám, Tananyag) egységes workflow-t kövessen.
* **Állapotok:** Piszkozat (`draft`) -> Beküldve (`submitted`) -> Ellenőrzés alatt (`review`) -> Jóváhagyva (`approved`) -> Publikálva (`published`) -> Archiválva (`archived`).

### 6. Fázis – Partner rendszer
* **Szervezeti típusok:** Gyártó, Kereskedő, Cég, Iskola, Oktató, Támogató.
* **Funkciók:** Saját profil, saját munkatársak kezelése, saját tartalom, saját partneri reklámok.

### 7. Fázis – Megbízható feltöltők
* **Bizalmi rendszer:** Kezdetben minden feltöltött tartalom moderált; később a bizonyos bizalmi pontot elérő megbízható feltöltők tartalmai automatikusan publikálhatóvá válnak.

### 8. Fázis – Felhasználói profilok
* **Profiltípusok:** Tanuló, Szakember, Partner, Oktató (egyedi adatlapok, tapasztalat, előrehaladás, referenciák).

### 9. Fázis – Reklámrendszer
* **Központi reklámkezelés:** Bannerek, partner ajánlások, szponzorált tartalmak, kiemelt szerszámok, kampányok központi admintól.

### 10. Fázis – Oktatási rendszer
* **Új modulok:** Tananyagok, Leckék, Interaktív tesztek, Vizsgák, Tanúsítványok / Bizonyítványok.

### 11. Fázis – Közösségi funkciók ✅ (Elkészült)
* **Funkciók:** Additív SQL migráció (`comments`, `user_favorites`, `user_follows`), szakmai észrevételek, 1-5 csillagos értékelés, kedvencek mentése, `communityService.ts` és `CommunityCommentsSection.tsx`.

### 14. Fázis – Tudásbázis feltöltés és minőségbiztosítás ✅ (Elkészült)
* **Tartalomcsomag (v1):** 219 szakmai fogalom (`technical_concept`) + 100 építőipari zsargon kifejezés (`industry_term`) a `glossary_seed_v1.json` adatállományban.
* **Minőségbiztosítás:** Hivatalos megnevezések, kezdő & szakmai magyarázatok, gyakorlati kivitelezési példák, gyakori hibák, szleng-műszaki összekötés, kapcsolódó szerszámok és cikkek.
* **Tudásmodell & Szemantikus Tudásgráf (v3):** Additív migráció (`20260729_knowledge_graph_model.sql`). Többnyelvű szakszótár (HU - EN - DE - RO), finomhangolt zsargon sub-típusok (`brand_name`, `german_origin`, `workplace_slang`, `synonym`), 14 kapcsolattípusos tudásgráf és szakmai tanulási útvonalak (Pathways: Kőműves, Ács, Burkoló).

### 13. Fázis – További bővítések (Hosszú távú backlog)
* Mobilalkalmazás, Webshop, AI-alapú tanulási segéd, Saját videótár, Online vizsgarendszer, Előfizetéses funkciók, Marketplace.

---

## 2. Összefoglaló Fejlesztési Ütiterv & Prioritási Mátrix

| Prioritás | Fejlesztési Fázis | Állapot |
| :---: | :--- | :---: |
| **0** | Projekt stabilizálása | **✅ Elkészült** |
| **1** | Jogi és működési alapok | **✅ Elkészült** |
| **2** | A jelenlegi négy modul befejezése | **✅ Elkészült** |
| **3** | Jogosultsági rendszer (v2 RBAC) | **✅ Elkészült** |
| **4** | Admin rendszer fejlesztése | **✅ Elkészült** |
| **5** | Tartalom életciklus (Workflow) | **✅ Elkészült** |
| **6** | Partner rendszer | **✅ Elkészült** |
| **7** | Megbízható feltöltők (Bizalmi pontok) | **✅ Elkészült** |
| **8** | Felhasználói profilok | **✅ Elkészült** |
| **9** | Reklámrendszer | **✅ Elkészült** |
| **10** | Oktatási rendszer | **✅ Elkészült** |
| **11** | Közösségi funkciók | **✅ Elkészült** |
| **12** | Karrier modul | **✅ Elkészült** |
| **14** | Tudásbázis feltöltés & Minőségbiztosítás (319 rekord) | **✅ Elkészült** |
| **13** | Későbbi bővítések (Mobilapp, AI, Marketplace) | Jövőbeni |

---

## 3. Architektúrai Alapelv & Infrastruktúra-Stratégia

### Architektúrai Alapelv
A rendszert modulárisan kell fejleszteni úgy, hogy az egyes infrastruktúra-elemek (tárolás, cache, háttérfolyamatok stb.) a jövőben külön-külön migrálhatók legyenek Cloudflare szolgáltatásokra, a teljes alkalmazás újraírása nélkül.

### Infrastruktúra-Megosztás (Jelenlegi és Opcionális Elemek)
* **Supabase:** Relációs adatbázis, Auth, Row Level Security (RLS) adatvédelem (amíg megfelel az igényeknek).
* **Cloudflare Pages:** Kliensoldali SPA frontend hosztolás.
* **Cloudflare R2 (Opcionális):** Képek, dokumentumok és egyéb médiatartalmak tárolása (központi helperen keresztül).
* **Cloudflare Workers (Opcionális):** Egyedi API-k, webhookok és háttérlogika.
* **Cloudflare KV / Cache (Opcionális):** Gyorsítótárazás és teljesítmény-optimalizálás.

### Szigorú Architekturális Tiltások & Szabályok
1. **Nincs közvetlen `supabase.from()` hívás** React komponensekből.
2. **Nincs közvetlen `supabase.auth` használat** React komponensekben (`authClient` használandó).
3. **Nincs üzleti logika elhelyezve** React komponensekben (Service réteg kötelező).
4. **Minden kép- és fájlhivatkozás** központi helperen (`src/lib/image.ts` vagy `mediaService`) keresztül történik.
5. **A reklámkezelés és partneri modulok** külön dedikált szolgáltatáson keresztül működnek, nem beégetve a UI-ba.
6. **Minden jogosultságellenőrzés** központi `permissionService` / `permissions.ts` rétegen keresztül valósul meg.

