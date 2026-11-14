# ÉpítőTudás – Fejlesztési Ütemterv v2 (Teljes Audit Alapján)

**Készült:** 2026-11-14  
**Kiindulási alap:** `1859c82` (`main`) – a teljes körű biztonsági, adatréteg-, publikus UX/SEO- és Admin/Editor/Partner/Tanár audit megállapításai.

---

## Fázis 1 – Kritikus Biztonság, RLS & Edge Function Javítások (P0 + P1 Biztonság)
**Cél:** A jogosulatlan adatbázis-írások, az e-mail relay visszaélés és a jogosultság-kiterjesztési rések lezárása.

- [x] **1.1 Adatbázis RLS szigorítások (új SQL migráció)**
  - `glossary_languages` & `glossary_term_translations`: `supabase/migrations/20260906_multilingual_glossary_schema.sql` (62–70. sor) nyitott `FOR ALL USING (true) WITH CHECK (true)` policy-jainak felülírása `admin` / `editor` szerepkör-ellenőrzéssel (`public.is_admin_or_editor()`).
  - `ad_packages`: `supabase/migrations/20260906_ad_packages_schema.sql` (50–52. sor) nyitott `FOR ALL TO authenticated USING (true)` policy-jának szigorítása csak `admin` szerepkörre.
  - `comments`: `supabase/migrations/20260822_views_and_comments.sql` (42–44. sor) `INSERT` policy-jának kötése (`user_id IS NULL` vagy `user_id = auth.uid()`), plusz hossz-/tartalmi ellenőrzés.
  - `audit_logs`: `supabase/migrations/20260828_audit_logs.sql` (28–32. sor) `INSERT` korlátozása `authenticated` helyett `admin`/`editor`/`partner`/`school`/`teacher` szerepkörökre vagy `actor_id = auth.uid()` kötésre.
  - `profiles.role_id`: `supabase/migrations/20260815_protect_profile_role_rls.sql` kiegészítése úgy, hogy a felhasználó saját maga ne tudja módosítani a `role_id` oszlopot sem.
  - `profiles` `SELECT`: `supabase/migrations/20260926_fix_profiles_read_rls_for_teachers.sql` felülvizsgálata (saját profil + admin/tanár/partner szükség szerinti olvasás).
- [x] **1.2 Edge Function védelem és státuszkódok**
  - `supabase/functions/resend-email/index.ts` és `supabase/functions/send-invitation-email/index.ts`: hívó felhasználó `profiles.role` ellenőrzése (`admin`, `editor`, `partner`, `school`, `teacher`), bemeneti validáció, valódi HTTP hibakódok (`400`/`403`/`500`) visszaadása `200` helyett, nyers Resend hibaobjektumok elrejtése.
  - `supabase/functions/confirm-reference-upload/index.ts` (83–90. sor): `SUPABASE_ANON_KEY` startup ellenőrzés pótlása.
  - Wildcard CORS (`'*'`) lecserélése engedélyezett origin listára (`ALLOWED_ORIGINS` / `SITE_URL` env + localhost fejlesztéshez).

---

## Fázis 2 – Törött Alapfolyamatok & Panel Jogosultságok Javítása (P0 + P1 Panelek)
**Cél:** A hibás létrehozási/hozzáférési folyamatok és a hiányzó `try/catch` hibakezelések pótlása az Admin, Editor és Partner panelekben.

- [x] **2.1 Kritikus panelhibák (P0)**
  - `src/pages/AdminGuidesPage.tsx` (221–238, 650–661. sor) & `src/components/EditArticleModal.tsx` (1202–1207. sor): új sablon-/szakmaalapú útmutatónál ne `{ id: '' }` hamis `article` objektummal hívjon `updateArticle('', ...)`-t, hanem `createArticle(...)` induljon (vagy `initialDraft` prop bevezetése).
  - `src/App.tsx` (1013–1017. sor) & `src/components/PartnerLayout.tsx`: a Partner `catalog` nézetben a teljes `AdminToolsPage` helyett partneri jogosultsághoz kötött, csak saját/olvasási vagy szűrt eszközkezelő nézet jelenjen meg.
- [x] **2.2 Editor és Partner hozzáférés-védelem (P1)**
  - `src/App.tsx` (359–372. sor) & `src/pages/EditorDashboardPage.tsx` (66–72, 130–167. sor): `canRoleAccessModule()` ellenőrzés kiterjesztése a gyorsgombokra és a nézetváltásra (`EditorPanelContent`); `safety` nézetben `SafetyPage` helyett `AdminKnowledgeHubPage` (vagy dedikált szerkesztői nézet).
  - `src/pages/PartnerLearningPage.tsx` (29–31, 50–56, 108–120. sor): `profile.partner_id` helyett `partner_users` tagság alapján történő hozzáférés-ellenőrzés és partner-azonosítás.
  - `src/components/EditorLayout.tsx` (71, 101. sor) & `src/components/PartnerLayout.tsx` (82, 112. sor): profil töltődése közben ne villanjon fel az `AccessDeniedPage`.
  - `src/pages/AdminAdsPage.tsx` (1282–1284, 1356–1358. sor): hibás `onNavigate('adminPartners')` javítása az admin partnerek nézetre.
- [x] **2.3 Hiányzó `try/catch` és toast visszajelzések pótlása (P1)**
  - `src/pages/AdminModerationPage.tsx` (30–38. sor)
  - `src/pages/AdminAuditPage.tsx` (84–85, 116–120. sor)
  - `src/pages/AdminAccessControlPage.tsx` (76–89. sor)
  - `src/pages/AdminLearningPage.tsx` (85–127. sor)
  - `src/pages/AdminJobsPage.tsx` (62–82, 132–169, 499. sor)
  - `src/pages/PartnerLearningPage.tsx` (76–106. sor)
  - `src/pages/AdminUsersPage.tsx` (139–153. sor)
  - `src/pages/AdminMaterialsPage.tsx` (123. sor)

---

## Fázis 3 – Adatréteg, Supabase Szinkronizáció & Teljesítmény (P0 + P1 Service-ek)
**Cél:** A néma `localStorage` fallbackek, adatvesztéses fire-and-forget írások, N+1 lekérdezések és duplikált service-ek rendezése.

- [x] **3.1 `articleService.ts`, `careerService.ts`, `auditLogService.ts` valós DB-műveletek (P0)**
  - `src/services/articleService.ts`: `incrementArticleViews` (valós DB RPC/update), `getRelatedArticles` (Supabase lekérdezés), `duplicateArticle` (DB-ből is), `deleteArticle` (`{ error }` ellenőrzése és továbbdobása), `countArticles` (`count: 'exact'`), `reorderArticles` (DB mentés), `listArticles` (üres 0 soros találatnál ne essen vissza `DEFAULT_ARTICLES`-re).
  - `src/services/careerService.ts` (241–321. sor): DB hiba esetén valódi hiba dobása a néma `localStorage` fallback helyett.
  - `src/services/auditLogService.ts` (128–180. sor): `{ error }` ellenőrzése `logAuditAction`-ben; `fetchAuditLogs` ne töltsön vissza `INITIAL_DEFAULT_LOGS`-ot üres tábla esetén.
- [x] **3.2 Felhőmentések megbízhatóvá tétele (await + hibakezelés)**
  - `materialsService.ts`, `bookService.ts`, `siteSettingsService.ts`, `adService.ts`, `advertisementService.ts`, `learningService.ts`, `educationService.ts`: a `writeAppConfig` hívások megvárása / hibák jelzése; `educationService` tanúsítványok (`USER_CERTIFICATES_STORE`) és kártyahaladás szinkronizálása Supabase-be.
- [x] **3.3 N+1 lekérdezések és lapozás/limit pótlása (P1)**
  - `src/services/partnerService.ts` (1134–1157. sor – `listInstructorClasses`), `glossaryService.ts` (96–110. sor), `categoryService.ts` (512–520. sor): N+1 ciklusok kiváltása batch/group lekérdezéssel.
  - `toolService.ts` (`getToolBySlug` szűrjön közvetlenül `.eq('slug', slug)`-gal `getActiveTools()` helyett), valamint alapértelmezett `.limit()` / lapozás bevezetése (`listTools`, `getArticlesForTool`, `listGlossaryTerms`, `listPartners`, `listProfiles`, `listJobPostings`, `listPartnerApplications`).
- [x] **3.4 Duplikált service-ek összevonási terve / kivezetése**
  - `adPackageService.ts` és `advertisementService.ts` (`AD_PACKAGES`) egységesítése; `educationService.ts` vs `learningService.ts` átfedések tisztázása.

---

## Fázis 4 – Publikus Routing, Auth Guard, SEO & Hiányzó CRUD-ok (P1 + P2)
**Cél:** A publikus hash-útvonalak, SEO metaadatok, hiányzó szerkesztés/törlés gombok és a sötét/világos téma kontraszthibáinak javítása.

- [ ] **4.1 Publikus navigáció és Auth Guard (P1)**
  - `src/pages/ProfilePage.tsx` (267–272. sor) & `src/App.tsx` (1260–1276. sor): a `navigate()` ne törölje ki a `?tab=flashcards` query paramétert.
  - `src/App.tsx` (203–272. sor): `#tanulas`, `#ujdonsagok`, `#utmutatok`, `#quizzes`, `#tesztek`, `#flashcards`, `#tanulokartyak`, `#partnerek` aliasok támogatása `getInitialPage()`-ben és `isUnknownHashRoute()`-ban (ne adjanak hamis 404-et).
  - `src/App.tsx` (429–623. sor): bejelentkezés nélküli `#partner` és `#teacher` elérésnél átirányítás loginra `PartnerLayout` helyett.
  - `src/App.tsx` (1277–1278. sor): dupla `popstate` + `hashchange` eseményküldés megszüntetése.
- [ ] **4.2 SEO & Meta Tagek javítása (P1)**
  - `index.html` (140, 148–155. sor): abszolút `https://www.epitotudas.hu/...` URL-ek `og:image`/`twitter:image`-hez.
  - `src/App.tsx` (1137–1171. sor) & `src/lib/seoMeta.ts`: hiányzó oldalcímek pótlása (`tudastar`, `jogi`, `verify-email`, `forgot-password`, `reset-password`, `szerkeszto`, `teacher`), dinamikus canonical és alapértelmezett OG/description visszaállítása cikk elhagyásakor, `siteSettingsService.ts` (349. sor) aszinkron `document.title` felülírásának védelme.
- [ ] **4.3 Hiányzó CRUD műveletek & karrierkvíz (P2)**
  - `src/pages/AdminToolsPage.tsx` + `toolService.ts`: eszköz törlése (`deleteTool`).
  - `src/pages/AdminGlossaryPage.tsx` + `glossaryService.ts`: fogalom törlése.
  - `src/pages/AdminCoursesPage.tsx` (495–552. sor): leckék és kvízkérdések **Szerkesztés** gombjának bekötése a már meglévő edit state-hez.
  - `src/App.tsx` (812–1001. sor): `partner_offers` szerkesztés funkció hozzáadása.
  - `src/pages/LearningPathsPage.tsx` (555–558. sor): a beégetett `96%` helyett valódi válaszokból számolt egyezési százalék.

---

## Fázis 5 – Kontraszt, Akadálymentesség (a11y), UX Konzisztencia & Tesztek (P2 + P3)
**Cél:** WCAG kontraszt, billentyűzetes akadálymentesség, egységes UI dialógusok/toastok és regressziós tesztek.

- [ ] **5.1 Kontraszt és sötét téma egységesítése (P2)**
  - `bg-accent` gombokon `text-black` -> `text-white` (vagy kontrasztos szöveg) a `HomePage`, `Header`, `KnowledgeHubPage`, `AboutHubPage`, `PartnersPage`, `PartnerDetailPage`, `CourseDetailPage`, `QuizPlayerPage`, `CookiePolicyPage` oldalakon.
  - `PartnerArticlesPage`, `PartnerMaterialsPage`, `PartnerLearningPage`, `AdminKnowledgeHubPage`, `AdminMaterialsPage`, `AdminLearningPage`, `AdminCoursesPage` sötét/világos kártya- és modalkontrasztok javítása.
  - `PartnerLearningPage.tsx` (233, 313. sor): pontos státuszfelirat (`Publikálva` / `Jóváhagyva` / `Elbírálás alatt`).
- [ ] **5.2 Akadálymentesség (a11y) (P2)**
  - Kattintható `<div>` kártyák (`HomePage`, `PartnersPage`, `LearningPage`, `MaterialsPage`) ellátása `role="button"` / `tabIndex={0}` / `onKeyDown` vagy szemantikus `<button>`/`<a>` elemmel.
  - Hiányzó `aria-label` pótlása (`Header.tsx` kereső/bezáró gombok, `LoginPage.tsx` és `ResetPasswordPage.tsx` jelszó-megjelenítés gombok).
- [ ] **5.3 UI Konzisztencia & Finomítások (P3)**
  - Inline megerősítő modalok cseréje `ConfirmDialog`-ra (`AdminAuditPage`, `AdminGuidesPage`, `AdminAdsPage`).
  - Lokális banner toastok cseréje `useToast()`-ra (`AdminModerationPage`, `AdminAccessControlPage`, `EditorSettingsPage`, `AdminJobsPage`, `AdminCoursesPage`, `AdminTradesPage`).
  - `AdminKnowledgeHubPage.tsx` (535–650. sor): tab-független validáció HTML5 rejtett `required` helyett.
  - `MaterialsPage.tsx` (154–155. sor) SubNav ikon/címke egységesítése; `TeacherDashboardPage.tsx` (690. sor) felesleges `settings` címág eltávolítása; `AdminUsersPage.tsx` (95. sor) `isAdmin` dinamizálása.
- [ ] **5.4 Tesztelés & Teljes Ellenőrzés**
  - Unit tesztek bővítése az új/javított logikára (`articleService`, `careerService`, `seoMeta`, routing aliasok).
  - Teljes ellenőrzés: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

