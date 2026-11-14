# ÉpítőTudás – Fejlesztési Ütemterv (Teljes Audit Alapján)

**Létrehozva:** 2026-11-14  
**Forrás:** A teljes kódbázis (`src/`, `supabase/functions/`, `supabase/migrations/`) 2026-11-14-i auditja.  
**Cél:** Minden azonosított kritikus hiba, mockolt/félkész funkció, `localStorage`-függőség és UX/technikai adósság fokozatos, ellenőrzött lezárása.

> **Munkamódszer:** Fázisonként haladunk sorrendben. Minden fázis végén kötelező ellenőrzés: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. SQL migrációk esetén a `.sql` fájlt elkészítjük `supabase/migrations/` alá, és futtatásra átadjuk.

---

## Fázis 1 – Kritikus Routing, Navigáció és Auth Javítások (Frontend-only, azonnali)
**Cél:** Minden halott gomb, hibás hash-routing, `ProfilePage` navigáció és kliensóra-érzékeny regisztrációs hiba kijavítása.

- [x] **1.1 `ProfilePage` navigáció bekötése**
  - `src/App.tsx` (1304. sor): `<ProfilePage onNavigate={navigate} />` átadása.
  - `src/pages/ProfilePage.tsx` (1678. sor): `onNavigate?.('learning', { slug: 'quizzes' })` javítása `'learning?tab=quizzes'` útvonalra (vagy `App.tsx` query param támogatás).
  - `src/pages/ProfilePage.tsx` (194–210. sor) és `src/components/Header.tsx` (588. sor): `hashchange` listener hozzáadása a `ProfilePage` tab-váltáshoz, valamint a nem létező `profile?tab=help` menüpont javítása (valódi Segítség szekció/modal vagy létező oldalra irányítás).
- [x] **1.2 Nyers `#...` horgonylinkek javítása a hash-routerrel kompatibilis görgetésre**
  - `src/pages/CoursesPage.tsx` (213. sor): `#katalogus` link lecserélése `scrollIntoView({ behavior: 'smooth' })` gombra.
  - `src/pages/CareersPage.tsx` (261, 318, 324, 330, 336. sorok): `#allasok`, `#karrierutak`, `#kepzesek`, `#munkaadok` linkek lecserélése `scrollIntoView` kezelőkre.
- [x] **1.3 URL / `hashchange` állapot-szinkron (`course-detail`, `quiz-player`, `partner-detail`)**
  - `src/App.tsx` (1017–1018, 1081–1096, 1278–1279. sorok): `selectedCourseSlug` és `selectedQuizId` kiolvasása/mentése URL hash-ből (`#course-detail/<slug>`, `#quiz-player/<id>`), valamint `selectedPartnerSlug` frissítése `handleHashChange`-ben böngésző Vissza/Előre navigációnál.
- [x] **1.4 Kliensóra-érzékeny regisztráció-ellenőrzés javítása**
  - `src/contexts/AuthContext.tsx` (243–247. sor): a `Date.now() - created_at > 3000` kliensóra-alapú ellenőrzés kiváltása biztonságos `identities` / Supabase response alapú ellenőrzésre (`data.user?.identities?.length === 0`).
- [x] **1.5 Editor és Partner panel navigációs/bekötési hibák**
  - `src/App.tsx` (284. sor): `EditorPanelContent` `onNavigateView` no-op (`() => {}`) lecserélése valós nézetváltásra.
  - `src/pages/PartnerDashboardPage.tsx` (69. sor) és `src/App.tsx` (653–656. sor): hardcode-olt „Aktív & Hitelesített” státusz lecserélése a partner tényleges `status` és `is_verified` mezőire.
  - `src/App.tsx` (223–234, 1108. sor): dedikált 404 / „Az oldal nem található” nézet hozzáadása ismeretlen route-okra.

---

## Fázis 2 – Kritikus Backend, DB Lekérdezés és Edge Function Biztonság
**Cél:** Nem létező táblák/oszlopok, UUID FK hibák és hitelesítés nélküli Edge Functionök javítása.

- [x] **2.1 Edge Function hitelesítés és takarítás**
  - `supabase/functions/resend-email/index.ts` (16–101. sor) és `supabase/functions/send-invitation-email/index.ts` (17–106. sor): kötelező `Authorization: Bearer <jwt>` ellenőrzés (`supabase.auth.getUser(token)`) és szerepkör/jogosultság validáció (open relay megszüntetése).
  - `supabase/functions/cleanup-reference-storage/index.ts` és `supabase/functions/confirm-reference-upload/index.ts`: vagy az elavult `partner-references-staging` függvények kivezetése/archiválása (mivel a `referenceService.ts` már közvetlen `partner-references` + `finalize_reference_image` RPC-t használ), vagy `cleanup-reference-storage` védelme cron secret / service-role ellenőrzéssel.
- [x] **2.2 `searchService.ts` – nem létező `books` tábla javítása**
  - `src/services/searchService.ts` (115. sor): `supabase.from('books')` lekérdezés kiváltása a `bookService`-ben használt `app_configs` (`__SYSTEM_CONFIG_BOOKS__`) keresésre.
- [x] **2.3 `educationService.ts` – nem létező `articles.summary` és `articles.category` oszlopok javítása**
  - `src/services/educationService.ts` (818–821. sor): `select('id, title, excerpt, category_id, slug, categories(name)')` használata és hibakezelés hozzáadása, hogy a tanulói kiosztott cikkek valós címmel és kategóriával jelenjenek meg.
- [x] **2.4 `roleService.ts` – `roles` tábla és UUID FK összehangolása**
  - `src/services/roleService.ts` (3–28. sor): `listRoles` és `getRoleBySlug` valódi `supabase.from('roles')` lekérdezésre állítása (fallback csak ha szükséges, de `assignRoleToUser` ne írjon nem-UUID `'r-admin'` stringet a `profiles.role_id` UUID mezőbe).
- [x] **2.5 Elavult auth segédek takarítása**
  - `src/lib/authClient.ts` (36–83. sor): használaton kívüli, token nélküli `sendVerificationEmailViaResend` törlése.
  - `src/services/userService.ts` (40–76. sor): RLS miatt mindig `false`-t visszaadó `checkEmailExists` felülvizsgálata/kivezetése.
  - `src/services/referenceService.ts` (551–555. sor): elavult JSDoc komment frissítése.

---

## Fázis 3 – Kritikus Adatperzisztencia (`localStorage` / Mock kiváltása Supabase-re)
**Cél:** Minden kritikus admin, hirdetési és tanári adat valódi adatbázisba mentése (szükség esetén új SQL migrációkkal).

- [x] **3.1 RBAC szerepkör-jogosultságok perzisztálása (`AdminAccessControlPage` + `permissionService`)**
  - `src/services/permissionService.ts` (153–180. sor) és `src/pages/AdminAccessControlPage.tsx` (18–81. sor): a `role_permissions` tábla vagy `app_configs` (`__SYSTEM_CONFIG_ROLE_PERMISSIONS__`) használata Supabase-ben a `localStorage` helyett (RLS: csak `admin` írhatja, bejelentkezett/publikus olvasás).
- [x] **3.2 Tanári „Tesztek” nézet és Egyéni Tananyagcsomagok bekötése**
  - `src/pages/TeacherDashboardPage.tsx` (1717–1756. sor): a hardcode-olt teszt táblázat lecserélése valódi Supabase tanulói kvíz-eredményekre (`quiz_attempts` / `user_course_progress`).
  - `src/pages/TeacherDashboardPage.tsx` (81–101, 577–612, 1651–1658. sorok): egyéni tananyagcsomagok mentése Supabase-be, és a „Kiosztás osztálynak →” gomb bekötése a valódi osztály-kiosztási folyamatba.
- [x] **3.3 Hirdetési Riport CSV Export és Hirdetés/Szerződés perzisztencia**
  - `src/pages/AdminAdsPage.tsx` (1397–1405. sor): valódi CSV generálás és letöltés (`Blob` + `URL.createObjectURL`) a „CSV Export” gombra.
  - `src/services/contractService.ts` (222–260. sor) és `src/services/adService.ts` (295–370. sor): szerződések, hirdetési helyek, kifizetések és értesítések szinkronizálása Supabase-be (`app_configs` vagy dedikált táblák + RLS).

---

## Fázis 4 – Közepes Félkész Funkciók, Moderáció és Tanulási Rendszer
**Cél:** A mockolt admin modulok, tanulási táblák és partner/publikus katalógusok befejezése.

- [x] **4.1 Valódi Moderációs Várólista (`AdminDashboard` + `AdminModerationPage` + `adminService` + `contentLifecycleService`)**
  - `src/services/adminService.ts` (37–128. sor) és `src/pages/AdminDashboard.tsx` (168–201. sor): `DEFAULT_MODERATION_ITEMS` kiváltása valódi Supabase lekérdezésre (`articles`, `glossary_terms`, stb. pending/review státuszok) és valós DB frissítésre jóváhagyásnál/elutasításnál.
  - `src/pages/AdminModerationPage.tsx` (141–176. sor) és `src/services/contentLifecycleService.ts` (27–69, 110–204. sorok): `draft` státuszú elemekhez munkafolyamat-gombok hozzáadása, többi tartalomtípus (`fogalom`, `szerszam`, `tananyag`) támogatása, `try/catch` hibakezelés.
- [x] **4.2 Tanulási rendszer (`learningService`) DB-szinkronizáció**
  - `src/services/learningService.ts` (223–554. sor): a meglévő `courses`, `lessons`, `quizzes`, `quiz_questions` Supabase táblák használata `localStorage` helyett; kvízpróbálkozások (`quiz_attempts`) és tanulókártyák perzisztálása DB-be.
  - `src/components/AdminFlashcardsModal.tsx` (122–134. sor): a fix szöveget beszúró „AI Szakmai Kártyajavaslat” gomb rendes átalakítása (pl. tartalom alapú intelligens sablon/kivonatoló vagy őszinte „Sablon beszúrása” jelölés, ha nincs külső AI API kulcs).
- [x] **4.3 További `localStorage` / in-memory service-ek bekötése DB-be**
  - `src/services/userProfileService.ts` (19–125. sor): részletes profilmezők mentése `profiles` / `user_detailed_profiles` táblába.
  - `src/services/trustService.ts` (86–137. sor): `trustScore` és `isTrustedContributor` visszaírása a `contributors` táblába.
  - `src/services/bookmarkService.ts` (14–150. sor): könyvjelzők szinkronizálása Supabase-be bejelentkezett felhasználóknál.
  - `src/services/articleRedirectsService.ts` (9–59. sor): átirányítások tárolása Supabase-ben (`app_configs` vagy `article_redirects`).
  - `src/services/advertisementService.ts` (141–180. sor): meglévő `ad_campaigns` tábla használata vagy tudatos egységesítés.
- [x] **4.4 Publikus és Partner katalógus hiányosságok**
  - `src/pages/SoftwarePage.tsx` (39–184. sor): dinamikus/konfigurálható szoftverkatalógus (Supabase/`app_configs`) a statikus tömb helyett.
  - `src/pages/ToolSelectorPage.tsx` (11–48. sor): szakmák és kategóriák betöltése `tradeService` / Supabase-ből, `MOCK_TOOLS` fallback eltávolítása/jelzése.
  - `src/App.tsx` (925–932. sor) és `src/components/PartnerLayout.tsx` (62–64. sor): a Partner „Gép & Szerszám Katalógus” (`catalog`) nézet szétválasztása a `PartnerMaterialsPage`-től.
  - `src/pages/PartnerLearningPage.tsx` (30–66. sor): Admin támogatás (`partner_id` választóval), sötét téma igazítása `AdminLayout`-hoz, és menüpont bekötése `PartnerLayout`-ba.

---

## Fázis 5 – Alacsony Prioritású UX Finomítások és Teszt Lefedettség Bővítése
**Cél:** Címkézési pontatlanságok javítása és a Vitest tesztkészlet bővítése a kritikus service-ekre.

- [ ] **5.1 UX és navigációs apróságok**
  - `src/pages/PartnersPage.tsx` (279–284. sor): CTA átirányítása `partner-application` oldalra `mailto:` helyett.
  - `src/components/AdminSidebar.tsx` (62. sor): `knowledge-hub` címke pontosítása („Munkavédelem & Szabványok”, mivel a kalkulátorok az `AdminSettingsPage`-en vannak).
  - `src/pages/AdminAccessControlPage.tsx` (173–190. sor): `/iskola` és `/tanar` badge-ek javítása a valós `partner` és `teacher` route-okra.
  - `src/pages/EditorDashboardPage.tsx` (26–35. sor): cikkszámlálás `count: 'exact'` lekérdezéssel a `pageSize: 300` limit helyett.
  - `src/App.tsx` (1188. sor): kijelentkezéskor `window.location.replace('/')` helyett tiszta SPA `navigate('home')`.
- [ ] **5.2 Vitest unit tesztek bővítése**
  - Új unit tesztek a kritikus service-ekhez (`searchService`, `educationService`, `roleService`, `permissionService`).
  - Teljes regressziós ellenőrzés (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).

