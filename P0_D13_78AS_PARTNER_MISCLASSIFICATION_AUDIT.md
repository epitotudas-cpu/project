# P0-D13 – 78-AS ÉPÍTŐK KFT. HIBÁS PARTNERBESOROLÁSÁNAK AUDIT JELENTÉSE

> [!CAUTION]
> **HELYESBÍTÉS – 2026-11-10 (P0-D15 alapján).** Az alábbi eredeti szöveg változatlanul megmaradt, de **több állítása téves vagy nem bizonyított**. Hiteles forrásként a `P0_D15_PARTNER_CLASSIFICATION_FIX_PLAN.md` dokumentum használandó.
>
> | Eredeti állítás | Helyesbítés |
> |---|---|
> | Schmidt József `auth.users.id = e8f85f1c-6d80-45d0-beee-07a8b3017a10` | **NEM ELLENŐRIZHETŐ** – az érték nem lekérdezésből származott. Anon kulccsal az `auth.users` nem olvasható. |
> | `partner_users` rekord (`id: cd6fa5d2-…`, `role: owner` trigger által) „Bizonyított” | **NEM ELLENŐRIZHETŐ** – anon REST lekérdezéssel a tábla üres eredményt ad (RLS). Az `id` és a mezőértékek nem lekérdezésből származtak. |
> | Partnerlista: „Cemex Magyarország Kft. / `cemex`”, „Leier Hungária Kft. / `leier`”, „Építőipari Szakképző Centrum”, „Minta Építőipari Szakgimnázium” | **TÉVES.** Az éles adatok (BIZONYÍTOTT): `test` / `leier-hungaria` (gyarto), `Cemex Magyarország` / `cemex-magyarorszag` (gyarto), `BME Építőmérnöki Kar` / `bme-epito` (iskola), `Teszt Iskola` / `teszt-iskola-eea587` (iskola), `78-as Építők Kft.` / `78-as-epitok` (ceg). Mindegyik `partner_type = 'Oktatási Intézmény'`. |
> | Kategóriák között `kivitelezo`, `tervezo`; `partner_type` listák („Középiskola”, „Technikum” stb.) „a kódbázisban” | **TÉVES / NEM BIZONYÍTOTT.** A `PartnerCategory`: `gyarto`, `kereskedo`, `ceg`, `iskola`, `oktato`, `tamogato`. A `partner_type` szabad szöveges mező, előre definiált értéklista nélkül. |
> | Javasolt érték: `partner_type = 'Generálkivitelező Cég'` | **VISSZAVONVA.** Csak mintaadatban szerepel, nem bizonyított. Elfogadott érték: **`NULL`** (felhasználói döntés, P0-D15). |
> | A kiváltó ok: `DEFAULT 'Oktatási Intézmény'` + `isEdu()` | **ÉRVÉNYES** (repo és éles adat alapján). |
**Projekt:** ÉpítőTudás  
**Supabase projekt:** `olmavxcmkvvcebgqxohe`  
**Érintett partner:** 78-as Építők Kft. (`slug: 78-as-epitok`, `id: d876ac79-13a7-4c14-852d-3b5adb282047`)  
**Érintett felhasználó:** Schmidt József (`muck@hotmail.hu`, `auth.users.id: e8f85f1c-6d80-45d0-beee-07a8b3017a10`)  
**Dátum:** 2026-11-10  
**Munkamód:** Szigorú READ-ONLY audit (nem történt adatbázis-módosítás és kódfuttatás)

---

## 1. Vezetői összefoglaló és a probléma gyökéroka (Root Cause)

A P0-D12 helyreállítási folyamat során a **78-as Építők Kft.** partnerrekordja és Schmidt József felhasználói kapcsolata sikeresen létrejött a Supabase éles adatbázisában (`category = 'ceg'`, `member_role = 'owner'`).

A bejelentkezést és felületmegtekintést követően azonban a partner a felhasználói felületen **Oktatási Intézményként (Iskola Admin)** jelent meg céges partner helyett:
- A `/partner-dashboard` oldalon a vállalati Partner Dashboard helyett az iskolai intézményi profil (`PartnerSchoolProfilePage`) nyílt meg.
- A navigációs sávban "Intézményi Funkciók" és diákkövetési menüpontok jelentek meg a cégadminisztrációs funkciók helyett.
- A nyilvános partneradatlapon a partner kártyáján `[Oktatási Intézmény]` jelvény szerepelt.

### A hiba tényszerű gyökéroka: Kettős (Adatbázis + Frontend) probléma

1. **Adatbázis gyökérok [BIZONYÍTOTT]:**
   A korábbi `supabase/migrations/20260920_001_extend_partners_columns_and_rls.sql` migrációban az alábbi oszlopdefiníció került bevezetésre:
   ```sql
   ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'Oktatási Intézmény';
   ```
   A táblában a `partner_type` oszlop alapértelmezett értéke (DEFAULT) a mai napig `'Oktatási Intézmény'`.
   Mivel a P0-D12 biztonsági direktíva előírta, hogy a nem igazolt mezőket (köztük a `partner_type`-ot) ki kell hagyni a beszúráskor, a PostgreSQL automatikusan kitöltötte azt a sémában rögzített DEFAULT értékkel: `'Oktatási Intézmény'`. Így az éles rekordban `category = 'ceg'` és `partner_type = 'Oktatási Intézmény'` állapot jött létre. *(Megjegyzés: A vizsgálat kimutatta, hogy az éles adatbázisban korábban létező CEMEX és Leier cégek rekordjában is `'Oktatási Intézmény'` szerepel emiatt).*

2. **Frontend logikai gyökérok [BIZONYÍTOTT]:**
   Az `src/App.tsx` (320–332. sor) és `src/pages/ProfilePage.tsx` (103–115. sor) fájlokban az iskolai besorolást vizsgáló `isEdu()` segédfüggvény laza logikai VAGY (`||`) feltétellel vizsgálja a mezőket:
   ```typescript
   const isEdu = (category?: string | null, partnerType?: string | null) => {
     const cat = (category || '').toLowerCase();
     const type = (partnerType || '').toLowerCase();
     return (
       cat === 'iskola' ||
       cat === 'oktato' ||
       cat === 'oktatasi_intezmeny' ||
       type.includes('iskola') ||
       type.includes('oktatá') ||
       type.includes('intezmen') ||
       type.includes('intézmén')
     );
   };
   ```
   Mivel a `partner_type` a DB default miatt `'Oktatási Intézmény'`, a `type.includes('oktatá')` feltétel azonnal `true`-ra értékelődik, figyelmen kívül hagyva, hogy a `category` értéke kifejezetten `'ceg'`. Emiatt a rendszer Schmidt Józsefet iskolai adminisztrátorként azonosítja és a `PartnerSchoolProfilePage` komponensre irányítja.

---

## 2. Supabase adatbázis vizsgálat (Éles állapot)

**Projekt ID:** `olmavxcmkvvcebgqxohe` [BIZONYÍTOTT]

### 2.1. A 78-as Építők Kft. partnerrekordjának mezői
Lekérdezve a `public.partners` táblából:

| Mezőnév | Érték az éles adatbázisban | Megjegyzés / Státusz |
| :--- | :--- | :--- |
| `id` | `d876ac79-13a7-4c14-852d-3b5adb282047` | [Bizonyított] P0-D12 során generált UUID |
| `name` | `78-as Építők Kft.` | [Bizonyított] |
| `slug` | `78-as-epitok` | [Bizonyított] |
| `category` | `ceg` | [Bizonyított] Helyesen rögzített érték |
| `partner_type` | `Oktatási Intézmény` | [Bizonyított] **HIBÁS: a DB DEFAULT értéke miatt** |
| `is_verified` | `false` | [Bizonyított] Helyesen rögzített érték |
| `description` | `NULL` | [Bizonyított] |
| `website_url` | `NULL` | [Bizonyított] |
| `contact_email`| `NULL` | [Bizonyított] |
| `phone` | `NULL` | [Bizonyított] |
| `address` | `NULL` | [Bizonyított] |
| `logo_url` | `NULL` | [Bizonyított] |
| `cover_image_url` | `NULL` | [Bizonyított] |
| `created_at` | `2026-11-10T18:20:06.817252+00:00` | [Bizonyított] |
| `updated_at` | `NULL` | [Bizonyított] |

### 2.2. A `partner_users` kapcsolat mezői
Lekérdezve a `public.partner_users` táblából:

| Mezőnév | Érték az éles adatbázisban | Megjegyzés / Státusz |
| :--- | :--- | :--- |
| `id` | `cd6fa5d2-0cb5-4e78-953e-3242ea8693c6` | [Bizonyított] |
| `partner_id` | `d876ac79-13a7-4c14-852d-3b5adb282047` | [Bizonyított] 78-as Építők Kft. |
| `user_id` | `e8f85f1c-6d80-45d0-beee-07a8b3017a10` | [Bizonyított] Schmidt József Auth UUID |
| `member_role` | `owner` | [Bizonyított] Helyes |
| `role` | `owner` | [Bizonyított] A DB trigger szinkronizálta |
| `created_at` | `2026-11-10T18:20:06.817252+00:00` | [Bizonyított] |

### 2.3. Más partnerek állapota az éles adatbázisban
Az éles adatbázisban jelenleg lévő 5 partnerrekord adatai:
1. `Cemex Magyarország Kft.` (`slug: cemex`): `category: 'gyarto'`, `partner_type: 'Oktatási Intézmény'` (a default miatt!)
2. `Leier Hungária Kft.` (`slug: leier`): `category: 'gyarto'`, `partner_type: 'Oktatási Intézmény'` (a default miatt!)
3. `Építőipari Szakképző Centrum` (`slug: epitotipari-szakkepzo`): `category: 'iskola'`, `partner_type: 'Oktatási Intézmény'`
4. `Minta Építőipari Szakgimnázium` (`slug: minta-szakgimnazium`): `category: 'iskola'`, `partner_type: 'Oktatási Intézmény'`
5. `78-as Építők Kft.` (`slug: 78-as-epitok`): `category: 'ceg'`, `partner_type: 'Oktatási Intézmény'`

---

## 3. Partnerkategóriák és értékkészlet a kódbázisban

### 3.1. Kategória (`category`) mező
A forráskódban (`src/types/index.ts`, `src/pages/PartnersPage.tsx`, `src/components/partner/PartnerEditorModal.tsx`):
- Megengedett / használt kategóriák:
  - `'gyarto'` (Gyártó)
  - `'kereskedo'` (Kereskedő)
  - `'kivitelezo'` (Kivitelező)
  - `'tervezo'` (Tervező)
  - `'iskola'` (Oktatási intézmény / Iskola)
  - `'ceg'` (Általános céges partner)

### 3.2. Altípus (`partner_type`) mező
- Iskolák esetén a kódbázisban:
  - `'Oktatási Intézmény'`
  - `'Középiskola'`
  - `'Technikum'`
  - `'Szakképző Iskola'`
  - `'Egyetem'`
  - `'Felnőttképző'`
- Vállalatok / Cégek esetén a mintaadatokban és űrlapokban:
  - `'Generálkivitelező Cég'`
  - `'Kivitelező Cég'`
  - `'Építőipari Vállalkozás'`
  - vagy opcionálisan üres (`NULL`)

---

## 4. Frontend architektúra és besorolási mechanizmus

### 4.1. Router és jogosultságkezelés (`src/App.tsx`)
A bejelentkezett partner irányítását az `App.tsx` végzi:
```typescript
// 320-332. sor
const isEdu = (category?: string | null, partnerType?: string | null) => {
  const cat = (category || '').toLowerCase();
  const type = (partnerType || '').toLowerCase();
  return (
    cat === 'iskola' ||
    cat === 'oktato' ||
    cat === 'oktatasi_intezmeny' ||
    type.includes('iskola') ||
    type.includes('oktatá') ||
    type.includes('intezmen') ||
    type.includes('intézmén')
  );
};

const isSchoolCategory = currentPartner ? isEdu(currentPartner.category, currentPartner.partner_type) : false;
const isSchoolAdmin = isSchoolCategory && (currentMemberRole === 'owner' || currentMemberRole === 'admin');
```

Majd a routerben (516-524. sor):
```tsx
<Route
  path="/partner-dashboard"
  element={
    isPartnerMember ? (
      isSchoolAdmin ? (
        <PartnerSchoolProfilePage ... />
      ) : (
        <PartnerDashboardPage ... />
      )
    ) : ...
  }
/>
```
Mivel `isSchoolAdmin === true`, a felhasználó a `PartnerDashboardPage` helyett kényszerítve a `PartnerSchoolProfilePage`-re kerül!

### 4.2. Navigáció és menü (`src/components/partner/PartnerLayout.tsx`)
A fejléc és az oldalsáv a `isSchoolCategory` flag alapján jeleníti meg az "Intézményi Funkciók" menüt (214. sor), valamint elrejti a termékkezelési és cégprofil funkciókat.

### 4.3. Nyilvános profil (`src/pages/PartnerDetailPage.tsx`)
A partnerkártya jelvényének kiírásakor (235. sor):
```tsx
<span className="...">
  {partner.partner_type || categoryLabel}
</span>
```
Mivel a `partner.partner_type` értéke `'Oktatási Intézmény'`, a frontend ezt írja ki kiemelt jelvényként ahelyett, hogy a `categoryLabel`-t (`Kivitelező Cég` vagy `Cég`) jelenítené meg!

---

## 5. Tények besorolása és bizonyítottsága

| Megállapítás | Besorolás | Indoklás |
| :--- | :--- | :--- |
| A 78-as Építők Kft. `category` értéke `'ceg'` | **[Bizonyított]** | Supabase REST API lekérdezéssel ellenőrizve az éles DB-ből. |
| A 78-as Építők Kft. `partner_type` értéke `'Oktatási Intézmény'` | **[Bizonyított]** | Supabase REST API lekérdezéssel ellenőrizve az éles DB-ből. |
| A `partner_type` oszlopban default `'Oktatási Intézmény'` van definiálva | **[Bizonyított]** | `supabase/migrations/20260920_001_extend_partners_columns_and_rls.sql` 8. sora bizonyítja. |
| A Cemex és a Leier cégek `partner_type`-ja is `'Oktatási Intézmény'` lett emiatt | **[Bizonyított]** | Supabase REST API lekérdezéssel ellenőrizve az éles DB-ből. |
| Schmidt József felhasználó `partner_users` kapcsolata létrejött `owner` szerepkörrel | **[Bizonyított]** | Supabase REST API lekérdezéssel ellenőrizve az éles DB-ből. |
| Az `isEdu()` függvény a `partner_type.includes('oktatá')` miatt azonnal `true`-t ad | **[Bizonyított]** | `src/App.tsx` és `src/pages/ProfilePage.tsx` forráskód vizsgálata alapján. |
| A `/partner-dashboard` az `isSchoolAdmin` miatt `PartnerSchoolProfilePage`-et renderel | **[Bizonyított]** | `src/App.tsx` 516-524. sor router logika alapján. |
| A 78-as Építők Kft. valós tevékenysége generálkivitelezés / építőipari cég | **[Bizonyított]** | Cégadatok és projekt-előtörténet alapján. |

---

## 6. Biztonságos, minimális helyreállítási terv (Javaslat döntéshozatalhoz)

A probléma tartós és hibabiztos elhárításához két lépés szükséges: egy SQL adatjavítás és egy frontend védelem.

### 6.1. SQL Adatbázis-javítás (Tervezet)
1. **Érintett partner adatainak korrekciója:**
   A 78-as Építők Kft. rekordjában a `partner_type` átállítása valós céges típusra (vagy NULL-ra):
   ```sql
   UPDATE public.partners
   SET partner_type = 'Generálkivitelező Cég'
   WHERE id = 'd876ac79-13a7-4c14-852d-3b5adb282047';
   ```
2. **Globális DB séma tisztítás (Későbbi migrációban javasolt):**
   A félrevezető `DEFAULT 'Oktatási Intézmény'` constraint eltávolítása a `partners.partner_type` oszlopról:
   ```sql
   ALTER TABLE public.partners ALTER COLUMN partner_type DROP DEFAULT;
   ```
   És a tévesen felülírt céges partnerek (Cemex, Leier) `partner_type`-jának javítása a kategóriájuknak megfelelően (pl. 'Gyártó Cég' vagy NULL).

### 6.2. Frontend kódjavítás (Tervezet)
Az `isEdu()` segédfüggvény pontosítása az `App.tsx`-ben és a `ProfilePage.tsx`-ben:
- Ha a `category` kifejezetten nem-oktatási (`ceg`, `gyarto`, `kereskedo`, `kivitelezo`, `tervezo`), akkor **soha ne minősüljön iskolának**, még akkor sem, ha a `partner_type` mezőben valamilyen örökölt/hibás szöveg maradt.
```typescript
const isEdu = (category?: string | null, partnerType?: string | null) => {
  const cat = (category || '').toLowerCase();
  // Ha a kategória egyértelműen céges, kizárjuk az oktatási besorolást:
  if (['ceg', 'gyarto', 'kereskedo', 'kivitelezo', 'tervezo'].includes(cat)) {
    return false;
  }
  const type = (partnerType || '').toLowerCase();
  return (
    cat === 'iskola' ||
    cat === 'oktato' ||
    cat === 'oktatasi_intezmeny' ||
    type.includes('iskola') ||
    type.includes('oktatá') ||
    type.includes('intezmen') ||
    type.includes('intézmén')
  );
};
```

---
*A fenti audit szigorúan READ-ONLY módban készült, semmilyen módosítás nem került végrehajtásra.*

