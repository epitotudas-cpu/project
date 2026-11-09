# P0-E: BIZTONSÁGI ÉS HOZZÁFÉRÉSI RENDSZERAUDIT JELENTÉS
**Projekt:** ÉpítőTudás  
**Vizsgált modulok:** `P0-E01`, `P0-E02`, `P0-E03`, `P0-E04`, `P0-E05`  
**Dátum:** 2026-11-08  
**Típus:** SZIGORÚAN READ-ONLY FELMÉRÉS (0 kód- vagy adatbázismódosítás)  
**Státusz:** SIKERESEN LEZÁRVA (DONE)

---

## 1. Vezetői Összefoglaló

A P0 feladatcsoport harmadik, független ágának célja az Edge Function-ök, az RPC eljárások és a felületi jogosultsági pontok alapos, tényeken alapuló forráskód- és sémavizsgálata volt. A felmérés elválasztotta a valódi felhőbeli kockázatokat a kizárólag felületi (UI-szintű) aszimmetriáktól.

---

## 2. Részletes Elemzés Feladatonként

### 2.1 P0-E01: `resend-email` Edge Function Vizsgálata
- **Forrás:** `supabase/functions/resend-email/index.ts`
- **Működés:** A funkció HTTP POST kérésre fogadja a `{ to, subject, html }` törzset, és a `RESEND_API_KEY` felhasználásával kiküldi az e-mailt a `https://api.resend.com/emails` végponton keresztül az `ÉpítőTudás <info@epitotudas.hu>` (vagy tartalékként `onboarding@resend.dev`) feladóval.
- **Megállapítás:**
  - A függvény forráskódjában **nincs JWT vagy jogosultság-ellenőrzés** (nem olvassa az `Authorization` fejlécet és nem vizsgálja a hívó felhasználó szerepkörét).
  - Amennyiben a Supabase Kong gateway-en a függvény `--no-verify-jwt` módban került telepítésre, vagy a publikus `anon` kulccsal hívható, tetszőleges külső fél küldhet e-maileket a rendszer nevében.
- **Ajánlott mitigáció (későbbi biztonsági fázisban):** A függvény egészüljön ki a JWT token validálásával (`supabase.auth.getUser()`), vagy korlátozódjon kizárólag az adminisztrátori szerepkörre és az előre definiált e-mail sablonokra.

---

### 2.2 P0-E02: `send-invitation-email` Edge Function Vizsgálata
- **Forrás:** `supabase/functions/send-invitation-email/index.ts`
- **Működés:** Hasonlóan a `resend-email`-hez, a partneri meghívók kiküldését végzi közvetlen Resend API hívással.
- **Megállapítás:**
  - A forráskódban nincs hívói szerepkör-ellenőrzés.
  - A frontendről az `authClient.ts`, az `AdminSettingsPage.tsx` és a `partnerInvitationService.ts` hívja.
- **Kockázati szint:** Közepes. Nem áll fenn közvetlen adatbázis-szivárgás, de a levélküldési kvóta illetéktelen terhelése lehetséges, ha a gateway nyitva áll.

---

### 2.3 P0-E03: `confirm_user_email` RPC Biztonsági Vizsgálata
- **Forrás:** `supabase/migrations/20260922_001_confirm_user_email_rpc.sql`
- **Működés:**
  ```sql
  CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
  RETURNS jsonb AS $$ ...
  UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = target_user_id;
  UPDATE public.profiles SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = target_user_id;
  ...
  GRANT EXECUTE ON FUNCTION public.confirm_user_email(TEXT) TO authenticated, anon;
  ```
- **Megállapítás:**
  - A funkció `SECURITY DEFINER` jogkörrel fut, és az `anon` (nem bejelentkezett látogató) szerepkörnek is `EXECUTE` joga van rá.
  - A függvény **semmilyen tokent, jelszót vagy megerősítő hash-t nem kér**, kizárólag az e-mail címet szövegesen.
  - **Valós biztonsági rés:** Bárki, aki ismeri egy regisztrált felhasználó e-mail címét, a publikus anon kulccsal meghívhatja a `supabase.rpc('confirm_user_email', { user_email: '...' })` eljárást, és **a felhasználó e-mail címe igazolttá válik valódi levélkattintás nélkül**.

---

### 2.4 P0-E04: `CoursesPage` Admin Kártyakezelő Jogosultsági Vizsgálata
- **Forrás:** `src/pages/CoursesPage.tsx:317-322`
- **Kód:**
  ```tsx
  <button
    onClick={() => setShowAdminCardsModal(true)}
    className="..."
  >
    <Layers size={14} className="text-amber-600" /> Admin Kártyakezelő
  </button>
  ```
- **Megállapítás:**
  - A gomb megjelenítése **feltétel nélküli** (nem vizsgálja a `profile?.role === 'admin'` feltételt). Vendég és tanuló felhasználók számára is látható.
  - Az `AdminFlashcardsModal` lehetővé teszi kártyák létrehozását, módosítását és törlését.
  - **Szerveroldali védelem:** A mentés az `educationService.ts` felhős upsertjén keresztül a `categories` táblába próbál írni. Mivel a `categories` táblán aktív az `is_admin_or_editor()` RLS szabály, **az éles adatbázist a jogosulatlan felhasználó nem tudja módosítani** (a Supabase hibaüzenettel elutasítja a felhős írást).
  - **UI/UX probléma:** A vendég helyi `localStorage`-ébe a kártya beíródik, a felületen megjelenik, de a felhőbe nem mentődik, ami zavaró aszimmetriát okoz. A gombot kliensoldalon admin jogosultsághoz kell kötni.

---

### 2.5 P0-E05: `CareersPage` Vendég Állásbeküldés Jogosultsági Vizsgálata
- **Forrás:** `src/pages/CareersPage.tsx:635-640` és `src/services/careerService.ts:165-180`
- **Megállapítás:**
  - A felületen a látogató látja az „Új Álláshirdetés Feladása" gombot és az űrlapot.
  - A beküldés (`handleCreateJobSubmit`) meghívja a `createJobPosting()` függvényt.
  - A `careerService.ts` forráskódja alapján ez a függvény **KIZÁRÓLAG IN-MEMORY** működik (`DEFAULT_JOBS.unshift(newJob)`), és **egyáltalán nem küld hálózati kérést az adatbázisba**.
  - **Szerveroldali RLS állapot:** A `supabase/migrations/20260728_012_career_tables.sql` migrációban a `job_postings` táblán csak `SELECT` házirend létezik, `INSERT` házirend nincs. Így jogosulatlan adatbázis-rekord beszúrása szerveroldalon teljes mértékben kizárt.
  - **Megállapítás:** Nem adatbiztonsági résről, hanem egy félkész, tisztán frontend-memóriában futó funkcióról van szó, amelyet a P4 fázisban kell összekötni a céges partneri jogosultságkezeléssel.

---

## 3. Összegző Kockázati Mátrix

| Feladat | Érintett Elem | Kockázat Jellege | Valós Kockázat Szintje | Megjegyzés |
|---|---|---|---|---|
| **P0-E01** | `resend-email` | Illetéktelen e-mail küldés | Közepes | Gateway-szintű védelem függvénye, kódban nincs ellenőrzés |
| **P0-E02** | `send-invitation-email` | Meghívó-spam küldés | Közepes | Gateway-szintű védelem függvénye, kódban nincs ellenőrzés |
| **P0-E03** | `confirm_user_email` RPC | E-mail igazolás kikerülése | **Magas** | Anonim hívhatóság, nincs token-ellenőrzés |
| **P0-E04** | `CoursesPage` kártyakezelő | Felületi jogosultság-szivárgás | Alacsony | Az adatbázis RLS védi, csak UI elrejtés szükséges |
| **P0-E05** | `CareersPage` állásbeküldés | Félkész funkció | Nulla (Biztonsági szempontból) | Tisztán in-memory, nincs DB írás |

---

## 4. Státusz

A **P0-E01–P0-E05** felmérések maradéktalanul teljesültek. A megállapítások alapján minden szerveroldali állapot és jogosultsági kockázat tisztázásra került.

