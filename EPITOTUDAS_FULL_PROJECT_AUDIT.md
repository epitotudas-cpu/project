# ÉPÍTŐTUDÁS – TELJES PROJEKT- ÉS WEBOLDAL AUDIT

**Dátum:** 2026. november 8.  
**Projekt:** ÉpítőTudás v2 (`c:\Users\User\Documents\epitotudas\project`)  
**Audit típusa:** Teljes körű, READ-ONLY technikai, vizuális, UX, SEO és üzleti rendszeraudit  
**Módosítási státusz:** 0 kód-, séma-, migráció- vagy konfigurációmódosítás (szigorúan dokumentációs audit)

---

## 1. PROJEKT RÖVID BEMUTATÁSA

Az **ÉpítőTudás** (`epitotudas.hu`) egy magyar nyelvű, hiánypótló építőipari oktatási, szakmai tudásbázis és B2B/B2C ökoszisztéma-platform. Célja, hogy egyetlen központi digitális felületen kapcsolja össze az építőipar szereplőit:
1. **Szakembereket és kivitelezőket**, akiknek gyors, szabványkövető technológiai útmutatókra, anyagszükséglet-kalkulátorokra, munkavédelmi előírásokra és gép-/anyagkatalógusra van szükségük.
2. **Szakirányú tanulókat, pályakezdőket és oktatókat (szakképző iskolákat)**, akik interaktív leckéken, tanulókártyákon (flashcards), teszteken, szakkönyveken és osztálytermi tananyagcsomagokon keresztül sajátíthatják el vagy oktathatják a szakmák alapjait.
3. **Építőipari gyártókat, kereskedőket, gépkölcsönzőket és munkaadókat (Partnereket)**, akik szakmai tartalmakon, termékkatalóguson, natív hirdetési csomagokon és építőipari állásbörzén keresztül érhetik el a célközönséget.

### Jelenlegi érettségi szint összefoglalása
A projekt **rendkívül gazdag funkcionális vízión és széles körű prototípus-bázison** nyugszik (290+ forrásfájl, 319+ szócikkes többnyelvű fogalomtár, 6-féle interaktív leckemotor, 4-féle anyagszükséglet-kalkulátor, PDF-olvasó, szerepkör-alapú Admin / Szerkesztő / Partner / Iskola / Oktató vezérlőpultok). Ugyanakkor a rendszer jelenleg egy **kritikus architekturális átmeneti állapotban („hibrid prototípus – félkész éles rendszer")** van:
- Míg a korábbi átadási dokumentum (`HANDOVER.md`) „100% Production Ready, 0 TypeScript és 0 ESLint hiba" állapotot rögzít, a tényleges kódbázison a `npm run typecheck` **fordítási hibával elbukik** (`src/contexts/AuthContext.tsx:77`), a `npm run lint` pedig **362 problémát (332 hibát és 30 figyelmeztetést)** jelez.
- A rendszer adatperzisztenciája kettészakadt: miközben a cikkek, fogalmak, állások és profilok valódi Supabase PostgreSQL táblákban élnek, addig **18 különböző szolgáltatás (`*Service.ts`) a `public.categories` tábla `description` mezőjébe ment JSON-stringeket kamu UUID-kkal (`00000000-0000-0000-0000-000000000001`..`0021`)**, ráadásul **4 UUID-ütközéssel**, amelyek egymás adatait írják felül.
- A publikus felületen több alapvető belépési pont (fejléc kereső, főoldali kereső, főoldali kategóriakártyák, főoldali partnerkártyák) hibás vagy nem végrehajtó útvonalra mutat, a dizájnrendszerben pedig az `--color-accent` változó sötétkékre (`#4165b4`) állítása miatt a `bg-accent text-black` és `bg-accent text-primary` gombok kontrasztja súlyosan sérült.

---

## 2. TECHNOLÓGIAI ARCHITEKTÚRA

### 2.1 Frontend és Build Stack
| Réteg | Technológia / Csomag | Verzió | Megjegyzés / Állapot |
|---|---|---|---|
| **UI Keretrendszer** | React (`react`, `react-dom`) | `^18.3.1` | Funkcionális komponensek, React Hooks, `lazy()` + `Suspense` kódosztás az `App.tsx`-ben. |
| **Programozási nyelv** | TypeScript (`typescript`) | `^5.5.3` | `strict: true` beállítással, de a kódbázisban több száz `: any` típuskényszerítéssel és 1 aktív `TS2551` fordítási hibával. |
| **Build rendszer** | Vite (`vite`, `@vitejs/plugin-react`) | `^6.0.0` | `esbuild` minifikáció, kézi chunkolás (`vendor-react`, `vendor-supabase`, `vendor-icons`, `vendor-charts`). *Megjegyzés:* a `vendor-charts` a `recharts` csomagra hivatkozik (`vite.config.ts:31`), amely nincs is telepítve a `package.json`-ban. |
| **Stílus és UI** | Tailwind CSS + PostCSS + Autoprefixer | `^3.4.1` | CSS változókkal (`--color-primary`, `--color-secondary`, `--color-accent`, `--color-background`) kiegészített egyedi téma (`tailwind.config.js`, `src/index.css`). |
| **Ikonkészlet** | `lucide-react` | `^0.344.0` | Egységes vektoros ikonkészlet a teljes alkalmazásban. |
| **PDF megjelenítő** | `pdfjs-dist` | `^4.10.38` | Kliensoldali vászon (canvas) alapú PDF-renderelés (`PdfViewerModal.tsx`) a szakkönyvtárhoz és segédletekhez. |
| **Backend-as-a-Service** | `@supabase/supabase-js` | `^2.57.4` | PostgreSQL adatbázis, GoTrue Authentikáció, Storage (`site-assets`, `book-files`, `ad-creatives`), RPC-k és Deno Edge Functions. |
| **Hosting & Deployment** | Cloudflare Workers / Pages | Wrangler (`wrangler.jsonc`) | Statikus `./dist` kiszolgálás `"not_found_handling": "single-page-application"` beállítással, `public/_headers` biztonsági és cache fejlécekkel. |

### 2.2 Authentikáció és Jogosultságkezelés (RBAC)
- **Supabase Auth (`src/lib/authClient.ts`, `src/contexts/AuthContext.tsx`):** E-mail + jelszó alapú regisztráció és belépés. Az `AuthContext` tárolja a `user`, `profile` és `loading` állapotokat.
- **Profil és Szerepkörök (`public.profiles`):**
  - `role` oszlop (platformszintű jogosultság): `'user' | 'editor' | 'admin' | 'partner' | 'teacher' | 'school' | 'contact' | 'student'`.
  - `user_type` mező (felhasználói önazonosítás / profil típus): `'tanulo' | 'szakember' | 'oktato' | 'iskola' | 'partner'`.
- **Háromszintű vezérlőpult-architektúra:**
  1. **Admin Vezérlőpult (`#admin` -> `AdminLayout.tsx`):** `getAuthDebugInfo()` (`src/lib/authService.ts`) ellenőrzi a `profile.role === 'admin' || profile.role === 'editor'` jogosultságot.
  2. **Szerkesztői Vezérlőpult (`#editor` -> `EditorLayout.tsx`):** `canAccessEditorPanel()` (`src/lib/permissions.ts`) engedélyezi az `admin` és `editor` szerepköröknek.
  3. **Partner / Iskola / Oktató Vezérlőpult (`#partner-panel` -> `PartnerLayout.tsx`):** `canAccessPartnerPanel()` (`src/lib/permissions.ts`) és a `PartnerPanelContent` (`src/App.tsx:260-450`) választja szét a vállalati partnereket (`partners` + `partner_users`), az iskolákat (`category = 'iskola'`) és az oktatókat (`member_role = 'instructor'` vagy `role = 'teacher'`).
- **Moduláris RBAC Mátrix (`src/services/permissionService.ts`):** 18 modulra és 5 szerepkörre (`admin`, `editor`, `moderator`, `school`, `partner`) definiál olvasási/írási/törlési jogosultságokat, azonban **kizárólag a böngésző `localStorage`-ába ment** (`epitotudas_role_permissions_matrix_v2`), nincs Supabase adatbázis-szinkronizációja.

### 2.3 Adatmodell, Adatbázis-kapcsolatok és Hibrid Perzisztencia
A `supabase/migrations/` könyvtárban 26 migrációs SQL fájl található, amelyek az alábbi valódi relációs táblákat hozzák létre:
1. **Tartalmi mag:** `categories`, `articles`, `glossary_terms`, `glossary_languages`, `glossary_term_translations`, `courses`, `lessons`, `quiz_questions`, `user_certificates`.
2. **Felhasználók és RBAC:** `profiles`, `contributors`, `submission_logs`, `roles`, `permissions`, `role_permissions`, `audit_logs`, `site_settings`.
3. **B2B Partner és Karrier:** `partners`, `partner_users`, `partner_invitations`, `partner_applications`, `job_postings`, `ad_campaigns`.
4. **Iskolai és E-learning modul:** `school_classes`, `school_class_students`, `class_materials`, `user_course_progress`, `user_quiz_attempts`.

#### Kritikus architekturális anomália: A `public.categories` tábla „Key-Value JSON szemetesként" való használata
Annak ellenére, hogy létezik dedikált `site_settings` tábla (és számos modulhoz valódi relációs tábla), **18 szolgáltatás a `public.categories` táblába szúr be kamu sorokat** (`__SYSTEM_CONFIG_*` névvel), és a teljes adatkészletét JSON-stringként a `categories.description` szöveges mezőbe menti:

| Szolgáltatás (`src/services/`) | Használt `categories.id` UUID | `categories.name` kulcs | Ütközés (Collision) |
|---|---|---|---|
| `siteSettingsService.ts:232` | `00000000-0000-0000-0000-000000000001` | `__SYSTEM_CONFIG_SITE_SETTINGS__` | Egyedi |
| `heroImageService.ts:72` | `00000000-0000-0000-0000-000000000002` | `__SYSTEM_CONFIG_HERO_STATE__` | Egyedi |
| `impressumService.ts:38` | `00000000-0000-0000-0000-000000000003` | `__SYSTEM_CONFIG_IMPRESSUM__` | Egyedi |
| `navigationService.ts:55` | `00000000-0000-0000-0000-000000000004` | `__SYSTEM_CONFIG_NAV_STRUCTURE__` | Egyedi |
| `calculatorConfigService.ts:27` | `00000000-0000-0000-0000-000000000005` | `__SYSTEM_CONFIG_CALCULATORS__` | Egyedi |
| `legalDocService.ts:35` | `00000000-0000-0000-0000-000000000006` | `__SYSTEM_CONFIG_LEGAL_DOCS__` | Egyedi |
| `educationService.ts:402` | `00000000-0000-0000-0000-000000000007` | `__SYSTEM_CONFIG_EDUCATION_DATA__` | **ÜTKÖZIK a `tradeService.ts`-sel!** |
| `tradeService.ts:21` | `00000000-0000-0000-0000-000000000007` | `__SYSTEM_CONFIG_TRADES__` | **ÜTKÖZIK az `educationService.ts`-sel!** |
| `aboutService.ts:49` | `00000000-0000-0000-0000-000000000008` | `__SYSTEM_CONFIG_ABOUT_HUB__` | **ÜTKÖZIK a `knowledgeHubService.ts`-sel!** |
| `knowledgeHubService.ts:46` | `00000000-0000-0000-0000-000000000008` | `__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__` | **ÜTKÖZIK az `aboutService.ts`-sel!** |
| `glossaryCategorySettingsService.ts:111` | `00000000-0000-0000-0000-000000000009` | `__SYSTEM_CONFIG_GLOSSARY_CATS__` | **ÜTKÖZIK a `materialsService.ts`-sel!** |
| `materialsService.ts:63` | `00000000-0000-0000-0000-000000000009` | `__SYSTEM_CONFIG_MATERIALS__` | **ÜTKÖZIK a `glossaryCategorySettingsService.ts`-sel!** |
| `materialsService.ts:64` | `00000000-0000-0000-0000-000000000010` | `__SYSTEM_CONFIG_MATERIAL_CATS__` | Egyedi |
| `partnerService.ts:121` | `00000000-0000-0000-0000-000000000011` | `__SYSTEM_CONFIG_PARTNERS__` | Egyedi |
| `bookService.ts:1329` | `00000000-0000-0000-0000-000000000012` | `__SYSTEM_CONFIG_BOOKS__` | Egyedi |
| `bookService.ts:1330` | `00000000-0000-0000-0000-000000000013` | `__SYSTEM_CONFIG_BOOKS_CATEGORIES__` | **ÜTKÖZIK a `bannerCreativeService.ts`-sel!** |
| `bannerCreativeService.ts:4` | `00000000-0000-0000-0000-000000000013` | `__SYSTEM_CONFIG_BANNER_CREATIVES__` | **ÜTKÖZIK a `bookService.ts`-sel!** |
| `articleSettingsService.ts:120` | `00000000-0000-0000-0000-000000000014` | `__SYSTEM_CONFIG_ARTICLE_SETTINGS__` | Egyedi |
| `advertisementService.ts:137` | `00000000-0000-0000-0000-000000000015` | `__SYSTEM_CONFIG_ADS_V1__` | Egyedi |
| `bannerCreativeService.ts:219` | `00000000-0000-0000-0000-000000000019` | `__SYSTEM_CONFIG_BANNER_FALLBACK__` | Egyedi |
| `bannerCreativeService.ts:311` | `00000000-0000-0000-0000-000000000020` | `__SYSTEM_CONFIG_TILE_ADS__` | Egyedi |
| `adService.ts:12` | `00000000-0000-0000-0000-000000000021` | `__SYSTEM_CONFIG_ADVERTISERS__` | Egyedi |

---

## 3. PROJEKTSTRUKTÚRA ÉS FÁJLTÉRKÉP

```text
c:\Users\User\Documents\epitotudas\project\
├── index.html                         # SPA belépési pont, SEO/OG meta tagek, kanonikus URL, téma-injektáló script
├── package.json                       # Projekt függőségek és npm scriptek (dev, build, lint, typecheck, deploy)
├── vite.config.ts                     # Vite 6 konfiguráció, manualChunks definíciók
├── tailwind.config.js                 # Tailwind CSS 3 téma, színek (--color-*), animációk
├── wrangler.jsonc                     # Cloudflare Workers statikus asset konfiguráció
├── HANDOVER.md                        # Fejlesztői átadási dokumentáció
├── public/
│   ├── _headers                       # Cloudflare HTTP security & cache fejlécek
│   ├── robots.txt                     # Keresőrobot szabályok
│   ├── sitemap.xml                    # Statikus XML oldaltérkép (8 URL)
│   ├── llms.txt                       # AI keresőoptimalizálási összefoglaló (GEO)
│   ├── manifest.json                  # PWA Web App Manifest
│   ├── sw.js                          # Service Worker (offline fallback, asset cache)
│   ├── docs/                          # Statikus PDF segédletek és munkavédelmi kártyák
│   └── books/                         # Beépített szakkönyvek PDF állományai
├── supabase/
│   ├── functions/
│   │   ├── resend-email/index.ts          # Általános Resend e-mail küldő Edge Function
│   │   └── send-invitation-email/index.ts # Partner meghívó e-mail küldő Edge Function (duplikátum)
│   └── migrations/                    # 26 db SQL migrációs fájl (20260309..20260926)
└── src/
    ├── main.tsx                       # React 18 root mount + globális ErrorBoundary
    ├── App.tsx                        # Hash-alapú SPA router, layout-választó, globális felhő-szinkron
    ├── index.css                      # CSS változók, globális tipográfia, kontraszt-korrekciók, animációk
    ├── contexts/
    │   ├── AuthContext.tsx            # Hitelesítési állapot, signUp/signIn/signOut, profil betöltés
    │   └── GlossaryContext.tsx        # Fogalomtár memóriabeli gyorsítótár a szövegközi tooltip-ekhez
    ├── lib/
    │   ├── supabase.ts                # Supabase kliens példány és központi TypeScript interfészek
    │   ├── authClient.ts              # Supabase Auth segédfüggvények
    │   ├── authService.ts             # Admin auth ellenőrzés (getAuthDebugInfo)
    │   ├── permissions.ts             # Szerepkör-ellenőrző függvények (canAccessAdminPanel stb.)
    │   ├── api.ts                     # Legacy adatbázis-lekérdező modul (articles, categories, glossary, courses)
    │   ├── glossaryJsonService.ts     # JSON-alapú fogalomtár import/export segéd
    │   └── learningPackageGenerator.ts# Cikkekből/fogalmakból interaktív tanulási csomagot generáló motor
    ├── data/                          # Statikus alapértelmezett (seed) adatkészletek
    │   ├── learningPathsData.ts       # Szakmai életpályák és szakmák alapadatai
    │   ├── tradeDetailsData.ts        # 14 építőipari szakma részletes leírása
    │   ├── safetyCardsData.ts         # 32 hivatalos munkavédelmi kártya
    │   ├── standardsCardsData.ts      # Építőipari szabványok (MSZ EN, Eurocode, OTÉK)
    │   ├── legalDocs.ts               # ÁSZF, Adatkezelési és Cookie tájékoztató alapadatok
    │   └── munkavedelmi_kartyak_32.json
    ├── services/                      # 37 db üzleti logikai és adatszolgáltató modul (*Service.ts)
    ├── utils/
    │   └── imageOptimizer.ts          # Kliensoldali WebP képátméretező és tömörítő
    ├── components/                    # 49 db újrafelhasználható UI komponens, Layout és Modal
    └── pages/                         # 65 db oldal- és nézetkomponens (Publikus, Auth, Admin, Editor, Partner)
```

---

## 4. OLDALTÉRKÉP (SITEMAP & ROUTING ARCHITEKTÚRA)

Az alkalmazás **nem használ `react-router-dom`-ot**; a navigációt az [`src/App.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/App.tsx) egyedi, `window.location.hash` és `sessionStorage` alapú állapotgépe vezérli **36 érvényes `PageKey`** mentén:

### 4.1 Publikus Tartalmi és Tudástár Oldalak
| `PageKey` (`#hash`) | Komponens (`src/pages/`) | Oldal célja és funkciója | Navigációs elérhetőség |
|---|---|---|---|
| `home` (`#home` / `#`) | [`HomePage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/HomePage.tsx) | Főoldal: Hero szekció, gyors-csempék, kiemelt cikkek, kategóriák, szerszámok, partnerek, kalkulátor CTA. | Fejléc logó, „Főoldal" menüpont |
| `tudastar` (`#tudastar`) | [`KnowledgeHubPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/KnowledgeHubPage.tsx) | Tudástár elosztó központ (8 tartalmi pillér kártyája). | **Árva (Orphaned) a főmenüben!** A fejléc „Tudástár" gombja a `#glossary`-ra visz (`navigationService.ts:19`), így csak morzsamenüből érhető el. |
| `category` (`#category`) | [`CategoryPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CategoryPage.tsx) | Kategóriák és cikkek szűrhető listája (`type=utmutatok` esetén Kivitelezési Útmutatók). | Fejléc „Tudástár" lenyíló menü, Főoldal |
| `article` (`#article?slug=...`) | [`ArticlePage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ArticlePage.tsx) | Cikk és technológiai útmutató olvasó nézet, tartalomjegyzék, fogalom-kiemelés, hozzászólások. | Kategóriaoldal, Főoldal cikk-kártyák |
| `glossary` (`#glossary`) | [`GlossaryPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/GlossaryPage.tsx) | 319+ kifejezéses Szakmai Fogalomtár és Zsargon Szótár (HU/EN/DE/RO nyelvválasztóval, A–Z szűrővel). | Fejléc „Tudástár" főgomb és lenyíló menü |
| `safety` (`#safety`) | [`SafetyPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/SafetyPage.tsx) | Munkavédelmi Tudástár + 32 letölthető/megtekinthető munkavédelmi kártya. | Fejléc „Tudástár" lenyíló menü, Lábléc |
| `standards` (`#standards`) | [`StandardsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/StandardsPage.tsx) | Építőipari Szabványok és Előírások (Eurocode, MSZ EN, OTÉK/TÉKA). | Fejléc „Tudástár" lenyíló menü, Lábléc |
| `materials` (`#materials`) | [`MaterialsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/MaterialsPage.tsx) | Építőipari Anyagismeret katalógus (műszaki adatok, tulajdonságok, felhasználás). | Fejléc „Tudástár" lenyíló menü |
| `tool` (`#tool`) | [`ToolPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ToolPage.tsx) | Gép- és Szerszámkatalógus (összehasonlítóval, szűrőkkel, karbantartási tippekkel). | Fejléc „Eszközök" lenyíló menü, Főoldal |
| `books` (`#books`) | [`BooksPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/BooksPage.tsx) | Szakkönyvtár és PDF jegyzetek beépített PDF-olvasóval (`PdfViewerModal`). | Fejléc „Tudástár" és „Oktatás" menü |
| `calculations` (`#calculations`) | [`CalculationsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CalculationsPage.tsx) | 4 építőipari anyagszükséglet-kalkulátor (Gipszkarton, Beton, Burkolat,Hőszigetelés). | Fejléc „Eszközök" menü, Főoldal CTA |

### 4.2 Oktatási, Szakmai Életpálya és Karrier Oldalak
| `PageKey` (`#hash`) | Komponens (`src/pages/`) | Oldal célja és funkciója | Megjegyzés |
|---|---|---|---|
| `paths` (`#paths`) | [`PathsHubPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PathsHubPage.tsx) | 14 építőipari szakma bemutatása (kőműves, ács, burkoló, gépész stb.). | Szakmára kattintva `AuthPromptModal` blokkolja a nem bejelentkezett látogatót! |
| `courses` (`#courses`) | [`CoursesPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CoursesPage.tsx) | Képzések és Tanúsítványok (Interaktív leckék, Tanulókártyák, Kvíz, Oklevél). | `educationService.ts` alapú rendszer. |
| `learning` (`#learning`) | [`LearningPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/LearningPage.tsx) | Második, párhuzamos „Tananyagok és Kvízek" központ. | `learningService.ts` alapú párhuzamos rendszer! |
| `course-detail` (`#course-detail`) | [`CourseDetailPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CourseDetailPage.tsx) | `learningService` alapú kurzus-olvasó fejezetekkel és videóval. | Csak a `#learning` oldalról érhető el. |
| `quiz-player` (`#quiz-player`) | [`QuizPlayerPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/QuizPlayerPage.tsx) | `learningService` alapú önálló kvízlejátszó. | Csak a `#learning` / `#course-detail` oldalról érhető el. |
| `careers` (`#careers`) | [`CareersPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CareersPage.tsx) | Építőipari Állásbörze és szakmai gyakorlati helyek. | Fejléc „Partnerek" menü, Lábléc. |

### 4.3 Partner, Hirdetői, Rólunk és Jogi Oldalak
- **Partnerek:** `partners` ([`PartnersPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnersPage.tsx)), `partner-detail` ([`PartnerDetailPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnerDetailPage.tsx)), `partner-jelentkezes` ([`PartnerApplicationPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnerApplicationPage.tsx)), `hirdetes` ([`AdvertisingOrderPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/AdvertisingOrderPage.tsx)).
- **Rólunk aloldalak:** `about` ([`AboutHubPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/AboutHubPage.tsx)), `kuldetesunk` ([`MissionPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/MissionPage.tsx)), `kiknek-szol` ([`TargetAudiencePage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/TargetAudiencePage.tsx)), `hogyan-mukodik` ([`HowItWorksPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/HowItWorksPage.tsx)), `szakmai-alapelvek` ([`PrinciplesPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PrinciplesPage.tsx)), `kapcsolat` ([`ContactPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ContactPage.tsx)).
- **Jogi oldalak:** `jogi` ([`LegalHubPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/LegalHubPage.tsx)), `impressum` ([`ImpressumPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ImpressumPage.tsx)), `privacy` ([`PrivacyPolicyPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PrivacyPolicyPage.tsx)), `terms` ([`TermsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/TermsPage.tsx)), `cookies` ([`CookiePolicyPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CookiePolicyPage.tsx)).

### 4.4 Hitelesítési és Vezérlőpult Oldalak
- **Hitelesítés és Fiók:** `login` ([`LoginPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/LoginPage.tsx)), `register` ([`RegisterPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/RegisterPage.tsx)), `verify-email` ([`VerifyEmailPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/VerifyEmailPage.tsx)), `profile` ([`ProfilePage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ProfilePage.tsx)).
- **Vezérlőpultok:**
  - `admin` (`#admin` -> [`AdminLayout.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/AdminLayout.tsx)): 24 belső `AdminView` nézet.
  - `editor` (`#editor` -> [`EditorLayout.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/EditorLayout.tsx)): 12 belső `EditorView` nézet.
  - `partner-panel` (`#partner-panel` -> [`PartnerLayout.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/PartnerLayout.tsx)): 14 belső `PartnerView` nézet (Céges Partner / Iskola / Oktató elágazással).

### 4.5 Árva (Orphaned / Unmounted) Komponensek a Kódbázisban
Az alábbi 6 teljes oldal/komponens létezik a `src/pages/` könyvtárban, de **sehol nincs bekötve az `App.tsx`-be**, így a felhasználók számára elérhetetlen:
1. [`src/pages/LearningPathsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/LearningPathsPage.tsx) – Részletes, interaktív szakmaválasztó kvíz és karrierút-térkép (a `PathsHubPage.tsx` váltotta le).
2. [`src/pages/ToolSelectorPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ToolSelectorPage.tsx) – Feladatalapú gép- és szerszámválasztó varázsló.
3. [`src/pages/SoftwarePage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/SoftwarePage.tsx) – Építőipari szoftverek (CAD/BIM, költségvetés) katalógusa.
4. [`src/pages/AboutPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/AboutPage.tsx) – Korábbi Rólunk oldal (az `AboutHubPage.tsx` váltotta le).
5. [`src/pages/PartnerArticlesPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnerArticlesPage.tsx) – Partneri cikkküldő és státuszkövető felület (nincs bekötve a `PartnerPanelContent`-be!).
6. [`src/pages/PartnerMaterialsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnerMaterialsPage.tsx) – Partneri anyagkatalógus-kezelő felület (nincs bekötve a `PartnerPanelContent`-be!).

---

## 5. FUNKCIONÁLIS ÁTTEKINTÉS

### 5.1 Jól működő, kiforrott funkciók
1. **Szakmai Fogalomtár és Zsargon Szótár ([`GlossaryPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/GlossaryPage.tsx), [`glossaryService.ts`](file:///c:/Users/User/Documents/epitotudas/project/src/services/glossaryService.ts)):**
   - 319+ építőipari szócikk kezdő és haladó definícióval, gyakorlati példákkal, kivitelezési hibákkal, szinonimákkal.
   - Többnyelvű szótármotor (`hu`, `en`, `de`, `ro`, `sk`, `hr`, `sr`, `uk`) a `glossary_languages` és `glossary_term_translations` táblákkal.
   - Szövegközi automatikus fogalom-felismerés ([`FormattedText.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/FormattedText.tsx) + [`GlossaryContext.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/contexts/GlossaryContext.tsx)), amely a cikkek szövegében kattintható sárga pontozott aláhúzással emeli ki a szakszavakat.
2. **Anyagszükséglet-kalkulátorok ([`CalculationsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CalculationsPage.tsx), [`calculatorConfigService.ts`](file:///c:/Users/User/Documents/epitotudas/project/src/services/calculatorConfigService.ts)):**
   - 4 gyakorlati kalkulátor: Gipszkarton válaszfal (UW/CW profil, lap, csavar, hézagerősítő, glett), Beton (cement, sóder, víz, keverési arányok), Burkolat (csempe/járólap ráhagyással, ragasztó, fugázó), Homlokzati hőszigetelés (EPS/kőzetgyapot, ragasztó, dübel, üvegszövet háló).
   - Adminisztrátori felületről (`AdminCalculatorsPage.tsx`) paraméterezhető normák és ráhagyási százalékok.
3. **Interaktív Tananyag Lejátszó és Tanulókártya Motor ([`InteractiveLessonViewer.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/InteractiveLessonViewer.tsx), [`FlashcardViewer.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/FlashcardViewer.tsx), [`learningPackageGenerator.ts`](file:///c:/Users/User/Documents/epitotudas/project/src/lib/learningPackageGenerator.ts)):**
   - 6-féle interaktív lépéstípus (`info`, `single_choice`, `multiple_choice`, `image_choice`, `error_identification`, `reorder`) azonnali vizuális visszajelzéssel és szakmai magyarázattal.
   - Tanulókártya (Flashcard) paklik 4 tanulási fázissal (`new`, `learning`, `review`, `mastered`).
   - Automatikus Tanulási Csomag Generátor (`AdminPackageGeneratorModal.tsx`), amely cikkekből és fogalmakból generál jóváhagyható leckéket, kártyákat és kvízkérdéseket.
4. **Munkavédelmi és Szabvány Tudástár ([`SafetyPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/SafetyPage.tsx), [`StandardsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/StandardsPage.tsx)):**
   - 32 hivatalos munkavédelmi kártya és szabvány-összefoglaló (MSZ EN, Eurocode, OTÉK) kategóriaszűrővel, összehasonlítóval és PDF-megjelenítővel.

### 5.2 Kritikus funkcionális törések és félkész modulok
1. **Duplikált, egymással nem kommunikáló E-learning rendszer:**
   - **1. rendszer (`#courses`):** [`CoursesPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CoursesPage.tsx) + [`AdminCoursesPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/AdminCoursesPage.tsx) -> [`educationService.ts`](file:///c:/Users/User/Documents/epitotudas/project/src/services/educationService.ts) (Interaktív leckék, kártyák, oklevelek, `categories` UUID `...0007`).
   - **2. rendszer (`#learning`):** [`LearningPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/LearningPage.tsx) + [`CourseDetailPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CourseDetailPage.tsx) + [`QuizPlayerPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/QuizPlayerPage.tsx) + [`AdminLearningPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/AdminLearningPage.tsx) -> [`learningService.ts`](file:///c:/Users/User/Documents/epitotudas/project/src/services/learningService.ts) (`localStorage` + `user_course_progress`).
   - A két rendszernek külön adminisztrációs menüpontja, külön adatmodellje és külön publikus oldala van.
2. **Működésképtelen nyilvános keresőmezők:**
   - A fejlécben ([`Header.tsx:651-662`](file:///c:/Users/User/Documents/epitotudas/project/src/components/Header.tsx#L651-L662)) található keresőmezőbe beírt szöveget az `onKeyDown` eseménykezelő **eldobja**, és `Enter` leütésekor paraméter nélkül átirányít a `#glossary` oldalra (`onNavigate('glossary')`).
   - A főoldali Hero szekcióban ([`HomePage.tsx:208-212`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/HomePage.tsx#L208-L212)) lévő nagy keresőmezőnek **sem `value`, sem `onChange`, sem `onKeyDown` attribútuma nincs** – teljesen halott díszítőelem. Ugyanitt a „Népszerű témák" gomboknak ([`HomePage.tsx:217-224`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/HomePage.tsx#L217-L224)) sincs `onClick` eseménykezelőjük.
   - Miközben létezik egy kiváló, cikkeket, fogalmakat és kategóriákat valós időben kereső [`GlobalSearch.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/GlobalSearch.tsx) komponens (`Ctrl+K`), az **kizárólag az `AdminHeader.tsx`-be van bekötve**, a publikus `Header.tsx`-be nem!
3. **Hibás Partner Panel (`#partner-panel`) és Szerkesztői/Tanulói Dashboardok:**
   - A [`PartnerPanelContent`](file:///c:/Users/User/Documents/epitotudas/project/src/App.tsx#L417-L443) (`src/App.tsx:417-443`) céges partnerek esetén a `partner_profile` menüpontra is a statikus mockup [`PartnerDashboardPage`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnerDashboardPage.tsx) komponenst tölti be, a `partner_offers` és `partner_stats` menüpontokra pedig **az adminisztrátori [`AdminPartnersPage`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/AdminPartnersPage.tsx) komponenst rendereli be!**
   - A tanulói [`ProfilePage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ProfilePage.tsx), a [`PartnerDashboardPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PartnerDashboardPage.tsx) és az [`EditorDashboardPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/EditorDashboardPage.tsx) nagyrészt beégetett (hardcoded) demó számokat (`15%` előrehaladás, `1 248` megtekintés, `18` cikk) mutat valódi adatbázis-lekérdezések helyett.

---

## 6. DIZÁJNRENDSZER ÉS VIZUÁLIS MEGJELENÉS ELEMZÉSE

### 6.1 Színpaletta és a Kritikus `--color-accent` Kontraszthiba
A projekt eredetileg egy építőipari „sötét antracit + munkavédelmi borostyánsárga (`#FFC400`)" színsémára épült (`tailwind.config.js:12-17`). Egy későbbi átalakítás során azonban a [`src/index.css:15-21`](file:///c:/Users/User/Documents/epitotudas/project/src/index.css#L15-L21) és az [`index.html:19-25`](file:///c:/Users/User/Documents/epitotudas/project/index.html#L19-L25) a CSS változókat egy „Navy Blue / Royal Blue" palettára írta felül:
- `--color-primary`: `#0b1b33` (Mély tengerészkék)
- `--color-secondary`: `#132a4a` (Sötét acélkék)
- `--color-accent`: `#4165b4` (Közép-sötét királykék – **korábban `#FFC400` sárga volt!**)
- `--color-background`: `#f3f6fb` (Világos jegeskék-szürke)

#### A színváltás vizuális következményei:
1. **Olvashatatlan gombszövegek (`bg-accent text-black` és `bg-accent text-primary`):**
   - Mivel a komponensek szerzői feltételezték, hogy a `bg-accent` világossárga (`#FFC400`), több tucat helyen `bg-accent text-black` vagy `bg-accent text-primary` (`#0b1b33`) osztálypárosítást használtak (pl. [`Header.tsx:669`](file:///c:/Users/User/Documents/epitotudas/project/src/components/Header.tsx#L669), [`HomePage.tsx:524`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/HomePage.tsx#L524), [`ArticlePage.tsx:312`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ArticlePage.tsx#L312), [`CoursesPage.tsx:309`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/CoursesPage.tsx#L309), [`AuthPromptModal.tsx:92`](file:///c:/Users/User/Documents/epitotudas/project/src/components/AuthPromptModal.tsx#L92)).
   - Bár a `src/index.css:164-179` megpróbál néhány `.bg-accent.text-black` esetet CSS `!important` szabállyal fehérre (`#ffffff`) felülbírálni, **a `.bg-accent.text-primary` és a gyermekelemekben lévő `text-black` nem szerepel a szabályban**, így számos fő CTA gombon közép-sötétkék (`#4165b4`) alapon sötétkék (`#0b1b33`) szöveg jelenik meg (~2.1:1 kontrasztarány, WCAG AA szerint olvashatatlan).
2. **Inkonzisztens Hover állapotok (`bg-accent hover:bg-yellow-400`):**
   - A gombok alapállapotban királykékek (`bg-accent`), de rámutatáskor (`hover:bg-yellow-400` vagy `hover:bg-amber-400`) hirtelen rikító sárgára váltanak.

### 6.2 Sötét vs. Világos Téma Törések (Dark-on-Light és Light-on-Dark hibák)
A publikus oldalak fele világos (`bg-[#f3f6fb]` vagy `bg-white`), másik fele viszont sötét (`bg-primary`, `bg-[#0A0A0A]`, `bg-[#111]`) hátteret használ, és a közös komponensek nem alkalmazkodnak a környezetükhöz:
1. **[`FormattedText.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/FormattedText.tsx) világos háttéren:**
   - A komponens sötét háttérre lett tervezve: a címsorok `text-amber-400` (`#fbbf24`) és `text-amber-300` (`#fcd34d`), az idézetek `text-amber-200` (`#fde68a`), a fogalom-kiemelések `text-amber-300` színűek.
   - Amikor a `FormattedText` világos háttéren renderelődik – például a [`TermDetailModal.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/TermDetailModal.tsx) (`bg-gray-50` / `bg-white`), a [`MaterialsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/MaterialsPage.tsx) vagy a [`ToolPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ToolPage.tsx) felületén –, a halványsárga szöveg fehér/világosszürke alapon szinte **láthatatlanná válik**.
2. **[`CommunityCommentsSection.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/CommunityCommentsSection.tsx) az [`ArticlePage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ArticlePage.tsx) alján:**
   - A cikkoldal tiszta, világos olvasói felületet (`bg-white text-gray-800`) biztosít, ám a cikk alján a hozzászólás-szekció beégetett fekete (`bg-[#111] border-gray-800`) dobozként töri meg az oldalt.

### 6.3 Tipográfia és Komponens-hierarchia
- **Betűtípusok:** A `tailwind.config.js` a `Plus Jakarta Sans` (sans), `Outfit` (heading) és `JetBrains Mono` (mono) betűtípusokat definiálja, amelyeket az `index.html` a Google Fonts-ról tölt be. A tipográfiai skála modern és jól olvasható.
- **Mikro-méretek túlhasználata:** A kártyákon és jelvényeken (badges) rendkívül gyakori a `text-[9px]`, `text-[10px]` és `text-[11px]` osztályok használata, ami különösen középkorú építőipari szakemberek számára és mobilkijelzőn rontja az olvashatóságot.

---

## 7. RESZPONZIVITÁS ÉS MOBILFELHASZNÁLÓI ÉLMÉNY

### 7.1 Töréspontok és Navigáció
- **Fejléc (`Header.tsx`):** A mobilmenü a `lg` (`1024px`) töréspont alatt hamburger-menüre vált (`lg:hidden`). A mobilfiók-menü akkordeon-szerűen nyitja le a fő kategóriákat, és a kijelző alján elérhetővé teszi a bejelentkezési/regisztrációs gombokat.
- **Admin, Editor és Partner oldalsávok (`AdminSidebar.tsx`, `EditorLayout.tsx`, `PartnerLayout.tsx`):** Mobilon fix háttér-elsötétítéssel (`backdrop-blur`) ellátott off-canvas fiókként (drawer) nyílnak meg.

### 7.2 Konkrét Reszponzív és Mobil UX Hibák
1. **Szerszám- és Szabvány-összehasonlító modálok ([`ToolPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ToolPage.tsx), [`StandardsPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/StandardsPage.tsx)):**
   - Több oszlopos összehasonlító táblázatok keskeny (`360px–390px`) mobilkijelzőn vízszintes görgetési útmutató nélkül összezsúfolódnak.
2. **Fogalomtár A–Z betűválasztó sáv ([`GlossaryPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/GlossaryPage.tsx)):**
   - A teljes magyar ábécé gombjai mobilon vagy túl apró érintési felületet (`< 32px`) adnak, vagy sok sorba tördelődve kiszorítják a tényleges találatokat a hajtás (fold) alá.
3. **PDF-olvasó modál ([`PdfViewerModal.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/components/PdfViewerModal.tsx)):**
   - Mobilon a PDF vezérlősáv (oldalléptető, nagyítás, letöltés, bezárás) keskeny kijelzőn túlcsordulhat, és a canvas-alapú renderelés nem támogatja a natív kétujjas csippentéses (pinch-to-zoom) nagyítást.
4. **Admin táblázatok mobilon (`AdminArticlesPage`, `AdminUsersPage`, `AdminGlossaryPage`):**
   - Bár a konténerek `overflow-x-auto` osztállyal rendelkeznek, a 6–8 oszlopos táblázatoknak nincs mobil kártyanézete, így telefonról az adminisztráció nehézkes.

---

## 8. FELHASZNÁLÓI ÉLMÉNY (UX) ÉS HASZNÁLHATÓSÁG – 3 FELHASZNÁLÓI PERSZÓNA SZEMSZÖGÉBŐL

### 8.1 1. Perszóna: Építőipari szakember (kivitelező, művezető, szakmunkás)
*Célja: Konkrét technológiai paraméter, rétegrend, szabvány vagy anyagszükséglet azonnali megtalálása akár az építkezésen, mobilról.*
- **Pozitívumok:**
  - Az anyagszükséglet-kalkulátorok (`#calculations`) azonnal, regisztráció nélkül használhatók, és tételes anyaglistát adnak.
  - A munkavédelmi (`#safety`) és szabvány (`#standards`) kártyák tömörek és szakmailag relevánsak.
- **Kritikus súrlódási pontok (Frusztrációk):**
  - **Keresési zsákutca:** Ha a szakember beírja a fejléc vagy a főoldal keresőjébe, hogy *„XPS lábazati hőszigetelés"* és `Enter`-t nyom, a főoldali kereső nem csinál semmit, a fejléc kereső pedig eldobja a beírt szót és átdobja az üres Fogalomtárra.
  - **Agresszív Regisztrációs Falak (`AuthPromptModal`):** Ha a szakember az Anyagismeret (`#materials`), a Gépkatalógus (`#tool`) vagy a Szakkönyvtár (`#books`) oldalán részletes műszaki adatlapot szeretne megnyitni, vagy a Fogalomtárban részletes leírást olvasna (ha a `requireAuthForDetailedGlossary` be van kapcsolva), azonnal bejelentkezési modálba ütközik. Egy építkezésen álló szakember ilyenkor azonnal bezárja az oldalt és visszatér a Google-kereséshez.
  - **Törött kategória- és cikk-linkek:** A főoldalon egy kategóriakártyára kattintva ([`HomePage.tsx:311`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/HomePage.tsx#L311)) a rendszer elfelejti a kiválasztott kategóriát (`onNavigate('category')` paraméter nélkül), a Gépkatalógusban pedig a kapcsolódó cikkekre kattintva ([`ToolPage.tsx:1161`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ToolPage.tsx#L1161)) a főoldalra dobja vissza (`article-detail` érvénytelen route kulcs miatt).

### 8.2 2. Perszóna: Kezdő érdeklődő, pályaválasztó fiatal vagy szakiskolai tanuló
*Célja: Megérteni az építőipari szakmákat, alapfogalmakat, és vezetett módon tanulni.*
- **Pozitívumok:**
  - A Fogalomtárban külön „Kezdő magyarázat" (`beginner_explanation`) és „Gyakorlati példa" segíti a közérthetőséget.
  - A `#courses` oldalon az interaktív leckék (képes választás, hibakeresés, sorbarendezés) és a tanulókártyák kifejezetten élvezetes, modern pedagógiai élményt nyújtanak.
- **Kritikus súrlódási pontok:**
  - **Pályaorientációs fal ([`PathsHubPage.tsx:61-69`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/PathsHubPage.tsx#L61-L69)):** A „Szakmai Életpályák" (`#paths`) oldalon a 14 szakma bármelyikére kattintva a nem bejelentkezett fiatalt **azonnal regisztrációs fal (`AuthPromptModal`) állítja meg**, miközben a részletes szakmaleírások (`TRADE_DETAILS`) már ott vannak a kliensoldali kódban! Ráadásul a korábban elkészített, kiváló szakmaválasztó kvíz (`LearningPathsPage.tsx`) teljesen ki lett kötve az alkalmazásból.
  - **Zavaró kettes oktatási rendszer:** A tanuló nem érti, mi a különbség a menüben szereplő „Képzések & Tanúsítványok" (`#courses`) és a „Tananyagok & Kvízek" (`#learning`) között.

### 8.3 3. Perszóna: Visszatérő látogató, regisztrált tanuló, oktató vagy partner
*Célja: Saját tanulási folyamat folytatása, könyvjelzők elérése, osztályok vagy partneri profil kezelése.*
- **Pozitívumok:**
  - Az oktatói vezérlőpult ([`TeacherDashboardPage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/TeacherDashboardPage.tsx)) lehetővé teszi osztályok létrehozását, diákok meghívását és tananyagok kiosztását.
- **Kritikus súrlódási pontok:**
  - **Félkész Felhasználói Profil ([`ProfilePage.tsx`](file:///c:/Users/User/Documents/epitotudas/project/src/pages/ProfilePage.tsx)):** A tanuló profiloldalán a „Tanulási előrehaladás" kártya **mindig beégetett `15%`-ot és `0` elvégzett tananyagot** mutat (`lines 756-773`), a „Tesztek & Kvízek" fül pedig mindig üres állapotot jelenít meg (`lines 926-937`), még akkor is, ha a tanuló már több kurzust és tesztet elvégzett!
  - **Könyvjelzők / Kedvencek hiánya:** Nincs globális „Mentett cikkek / Kedvenc fogalmak / Saját gyűjtemény" funkció.
  - **Oktatói csomagok elvesztése:** Az oktató által a `TeacherDashboardPage.tsx`-en összeállított egyedi tananyagcsomagok (`customPackages`) csak React memóriában (`useState`) jönnek létre, így **oldalfrissítéskor (F5) nyom nélkül elvesznek**.

