# Fejlesztési Ütemterv (V3) — Építőtudás

**Alapdokumentum:** `FULL_WEBSITE_AUDIT_REPORT_V3.md` (`main` @ `e665ce2`)  
**Cél:** A V3-as teljes rendszer-auditban feltárt `P0`–`P3` hibák szisztematikus, fázisokra bontott javítása, minden fázis végén teljes build/lint/typecheck/teszt ellenőrzéssel.

---

## 1. Fázis: Kritikus Biztonsági, Auth & Supabase RLS Javítások (P0 + Security P1)
**Cél:** Minden jogosultságeszkalációs, RLS rekurziós, tároló-hozzáférési és e-mail phishing kockázat megszüntetése.

- [x] **1.1. Regisztrációs privilege escalation megszüntetése (`handle_new_user`)**
  - Új migráció: `handle_new_user()` csak `'user'` (`user_type = 'szakember'`) vagy `'student'` (alapértelmezett) szerepkört adhat `signUp`-kor; `raw_user_meta_data->>'role'` és privilegizált `user_type` értékek figyelmen kívül hagyása.
- [x] **1.2. `partner_invitations` RLS & `create_partner_invitation` RPC szigorítása**
  - Új migráció: `OR TRUE` és általános `profiles` `EXISTS` ágak eltávolítása a `SELECT`/`INSERT` policy-kból; `create_partner_invitation` RPC-ben `is_editor_role() OR is_partner_admin(p_partner_id)` ellenőrzés, `SET search_path = ''`, és `REVOKE EXECUTE ... FROM PUBLIC, anon`.
- [x] **1.3. `public.profiles` végtelen RLS rekurzió javítása**
  - Új migráció: `SECURITY DEFINER` segédfüggvény (`public.is_panel_or_teaching_role()`) `SET search_path = ''` beállítással, és az `"Authenticated read all profiles"` policy átírása erre.
- [x] **1.4. `storage.objects`, `SECURITY DEFINER` `search_path` és `partner_applications` validáció**
  - `partner-references` bucket `authenticated` `INSERT`/`UPDATE` policy-k eltávolítása; `SET search_path = ''` pótlása az `increment_article_views` és `accept_partner_invitation` függvényeken; `partner_applications` `WITH CHECK` hossz/email validáció.
- [x] **1.5. `app_configs` védelem & `permissionService.ts` kliens-bizalom megszüntetése**
  - `__SYSTEM_CONFIG_*` írás korlátozása `is_admin_role()`-ra; `permissionService.ts` ne olvasson vissza szerepkör-jogosultságokat `localStorage`-ból.
- [x] **1.6. Edge Functions (`resend-email`, `send-invitation-email`, `cleanup-reference-storage`) & HTML escape**
  - `send-invitation-email` szigorítása (`invitation_id` alapú szerver oldali sablon + jogosultság-ellenőrzés), `resend-email` `admin`-ra korlátozása, HTML-escape a `partnerInvitationService.ts`/`AdminSettingsPage.tsx`-ben, konstans idejű titok-összehasonlítás a `cleanup-reference-storage`-ban.

---

## 2. Fázis: Kritikus Adatréteg, Mutációk & Navigációs Stabilitás (P0 Data/Routing)
**Cél:** Adatvesztések, csendes írási hibák, versenyhelyzetek és navigációs összeomlások megszüntetése.

- [x] **2.1. `careerService.ts` Supabase perzisztencia**
  - `updateJobPosting`, `toggleJobPostingActive`, `deleteJobPosting` és `submitJobApplication` valódi Supabase írással és hibadobással (`localStorage` hamis siker megszüntetése).
- [x] **2.2. `appConfigService.ts` & `categoryService.ts` hiba-propagálás**
  - `appConfigService.ts` legacy `categories` upsert `{ error }` ellenőrzése; `categoryService.ts` mutációknál a Supabase hibák továbbadása.
- [x] **2.3. `articleService.ts` mutációk, rendezés és atomi nézettség**
  - `getPublishedArticles` alkalmazza az `options?.orderBy` mezőt; `createArticle` és `updateArticle` használjon `.select('*').single()`-t (nincs többé `allLocal[0]` vagy szintetikus `art-...` ID); `incrementArticleViews` használjon atomi RPC-t.
- [x] **2.4. `advertisementService.ts` versenyhelyzet javítása**
  - `saveStoredCampaigns` `await`-elése, és az impression/click számlálás leválasztása a teljes `__SYSTEM_CONFIG_AD_CAMPAIGNS__` JSON tömb felülírásáról.
- [x] **2.5. Böngésző Vissza gomb (`#/`) és React `ErrorBoundary`**
  - `src/App.tsx`: `sessionStorage` fallback eltávolítása explicit `#/` vagy üres hash esetén; `ErrorBoundary` komponens bevezetése a lazy `<Suspense>` köré.

---

## 3. Fázis: Panelek, RBAC Jogosultságok & Szolgáltatás-teljesítmény (P1)
**Cél:** Szerkesztő/Oktató/Admin panelek jogosultsági és UI összhangja, szinkron/aszinkron írások rendbetétele, lekérdezések optimalizálása.

- [x] **3.1. `EditorLayout.tsx` oldalsáv & granuláris RBAC kikényszerítés**
  - `materials`, `tools`, `books` `moduleId` -> `'catalog'`; `create`/`edit`/`publish`/`delete` jogosultságok ellenőrzése az `AdminArticlesPage`, `AdminGuidesPage`, `EditArticleModal`, `AdminModerationPage` komponensekben.
- [x] **3.2. Oktató (`teacher`) szerepkör összehangolása**
  - `App.tsx`, `PartnerLayout.tsx` és `src/lib/permissions.ts` egységesítése.
- [x] **3.3. `permissionService` hiba-továbbadás & `AdminAccessControlPage` toast**
  - `saveRoleModulePermissions` és `resetRoleModulePermissions` dobja tovább a hibát.
- [x] **3.4. Fire-and-forget `writeAppConfig` hívások `async/await`-té alakítása**
  - `siteSettingsService`, `educationService`, `learningService`, `bookService`, `materialsService`, `adService`, `contractService`.
- [x] **3.5. Korlátlan lekérdezések, N+1 minták & PostgREST `.or()` szűrők**
  - `.limit()`/`.range()` hozzáadása; `adPackageService.reorderAdPackages` és `searchService.searchAll` optimalizálása; PostgREST speciális karakterek szűrése.

---

## 4. Fázis: Publikus Oldalak UX, Hibakezelés, SEO & Vite Optimalizáció (P1–P2)
**Cél:** Publikus felhasználói élmény, hibajelzések, keresőoptimalizálás és gyorsabb dev/prod build.

- [ ] **4.1. Kezeletlen Promise-ok és beragadó `loading` állapotok javítása**
  - `CoursesPage`, `CareersPage`, `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `RegisterPage`, `App.tsx` partner betöltés.
- [ ] **4.2. `CareersPage` kereső debounce & `ToolSelectorPage` loading állapot**
  - `locationSearch` debounce-olása, `ToolSelectorPage` ne mutasson azonnal `MOCK_TOOLS` offline jelzést betöltés közben.
- [ ] **4.3. SEO & Strukturált adatok (JSON-LD)**
  - `seoMeta.ts` hash eltávolítása `canonical`/`og:url`-ből; egyedi route meta leírások az `App.tsx`-ben; `www.` egységesítés a `PathsHubPage`-en; `Article`/`Course`/`BreadcrumbList` JSON-LD.
- [ ] **4.4. Szolgáltatás fallback-ek, `siteSettingsService` DOM thrashing & `vite.config.ts`**
  - Ismeretlen slug esetén `null` (404) visszaadása; `siteSettingsService` modul-betöltési fetch és `<head>` újraírás optimalizálása; `vite.config.ts` (`recharts`, `lucide-react`, `chunkSizeWarningLimit`).

---

## 5. Fázis: Akadálymentesség (A11y), UI Konzisztencia & Tesztlefedettség (P2–P3)
**Cél:** WCAG billentyűzet/ARIA megfelelőség, vizuális egységesség a panelekben és kritikus szolgáltatások unit tesztelése.

- [ ] **5.1. Panel UI/UX és őrző feltételek**
  - `PartnerLearningPage` sötét téma összhang; `toast.error` és `saving` állapotok a hiányzó Admin/Partner oldalakon; `AdminUsersPage` modál őrzők; `AdminAccessControlPage` téma tokenek; `TeacherDashboardPage` valódi KPI-ok.
- [ ] **5.2. Publikus A11y javítások**
  - Kattintható kártyák billentyűzet/role támogatása; `Header.tsx` billentyűzetes dropdown, mobil fiók `Escape`/fókuszcsapda, kereső külső kattintás zárás; modál `role="dialog"` + `Escape`; `<label htmlFor>`, `aria-label`, `role="alert"`.
- [ ] **5.3. Unit tesztek bővítése**
  - Mockolt Supabase + `localStorage` tesztek írása a kritikus szolgáltatásokhoz (`appConfigService`, `articleService`, `careerService`, `categoryService`, `glossaryService`, `siteSettingsService`, `advertisementService`).
