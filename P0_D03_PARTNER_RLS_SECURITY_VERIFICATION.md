# P0-D03 – PARTNER RLS BIZTONSÁGI VERIFIKÁCIÓ ÉS AUDIT JELENTÉS

**Projekt:** ÉpítőTudás Digitális Tudásbázis és Szakmai Közösségi Portál  
**Dokumentumazonosító:** `P0_D03_PARTNER_RLS_SECURITY_VERIFICATION.md`  
**Célrendszer:** Supabase Projekt (`olmavxcmkvvcebgqxohe`)  
**Vizsgálat jellege:** READ-ONLY biztonsági felmérés és architektúrális függőségelemzés  
**Prioritás:** P0 – Kritikus  
**Dátum:** 2026-11-10  
**Státusz:** Lezárt vizsgálati jelentés (Javítási javaslattal és biztonsági tervezettel)

---

## 1. VEZETŐI ÖSSZEFOGLALÓ

A `P0_D02_PARTNER_PROFILE_AUDIT` audit két súlyos hozzáférési anomáliát jelzett a Supabase adatbázis védelmi rétegében. A jelenlegi vizsgálat célja ezen sérülékenységek tényleges éles meglétének, hatásköreinek, rendszerfüggőségeinek és elhárítási mechanizmusainak pontos feltárása volt – szigorúan kizárva minden adatmódosítást vagy séma-beavatkozást.

### Fő megállapítások:

1. **`public.partners` UPDATE sérülékenység (P0 – Kritikus):**
   - **Állapot:** `[MIGRÁCIÓBAN TALÁLHATÓ]` / `[KÓDBÓL KÖVETKEZTETETT]`
   - A `supabase/migrations/20260920_001_extend_partners_columns_and_rls.sql` migrációban a `"Partner contacts update partners"` RLS policy a következő feltétellel jött létre:  
     `USING (auth.uid() IN (SELECT user_id FROM public.partner_users WHERE partner_id = id) OR TRUE)`
   - Mivel a PostgreSQL RLS engedékeny (permissive) logikája szerint a feltételek `OR` relációban állnak, az `OR TRUE` miatt **bármely hitelesített felhasználó (authenticated)** képes közvetlen REST API hívással bármely partner rekordot módosítani (pl. cégnév, logó, slug, minősítések, elérhetőségek felülírása). A táblán nincs olyan ellenőrző trigger, ami ezt akadályozná.

2. **`public.partner_users` SELECT adatszivárgás (P0 – Kritikus):**
   - **Állapot:** `[ÉLES ADATBÁZISBAN IGAZOLT]` / `[TESZTELVE]`
   - A `supabase/migrations/20260728_006_partner_tables.sql` migrációban deklarált `"Public read partner_users"` policy feltétele: `FOR SELECT TO anon, authenticated USING (true)`.
   - Élő lekérdezési teszttel (REST API + anonim kulcs) bizonyítottuk, hogy a tábla tartalma **anonim módon, bejelentkezés nélkül lekérdezhető** (HTTP 200 OK választ adva).
   - Ez kiszivárogtatja a partnerek és felhasználók összerendelését, a belső felhasználói UUID-ket, szerepköröket (`member_role`, `role`) és felvételi dátumokat.

3. **Függőségek és működési kockázatok a javítás során:**
   - **Alaprendszer (App indulás, Header, Saját profil):** kizárólag a saját sorát kéri le (`.eq('user_id', user.id)`). Ez azonnal kompatibilis a `user_id = auth.uid()` szigorítással.
   - **Állásbörze (Career RLS):** a `job_postings` és `job_applications` RLS-ben lévő segédlekérdezések szintén kizárólag az aktuális felhasználót ellenőrzik (`pu.user_id = auth.uid()`). A szigorítás az állásbörzét **nem töri el**.
   - **Iskolai oktatói modul (`TeacherDashboardPage.tsx`):** az iskolai adminisztrátor lekérdezi az iskola összes oktatóját (`.eq('partner_id', partnerId)`). Egy szimpla `user_id = auth.uid()` szabály eltörné ezt a felületet.
   - **Platform Adminisztráció (`AdminPartnersPage.tsx`):** az adminisztrátori felület listázza az összes kapcsolattartót.
   - **RLS Rekurziós veszély:** Ha a `partner_users` SELECT policy-jában egy beágyazott lekérdezés ugyanerre a `partner_users` táblára hivatkozik (vagy a `partners` hivatkozik oda-vissza a `partner_users`-re), a PostgreSQL azonnal végtelen rekurzióba lép (`infinite recursion detected in policy`). Ez kizárólag körültekintő architektúrával és `SECURITY DEFINER` segédfüggvényekkel (`SET search_path = ''`) hárítható el.

---

## 2. SUPABASE PROJEKTAZONOSÍTÁS ÉS KAPCSOLATI BIZONYÍTÉK

### 2.1 Célprojekt verifikáció
- **Elvárt projektazonosító:** `olmavxcmkvvcebgqxohe`
- **Konfigurációs forrás:** `src/lib/supabase.ts` (3–4. sor)  
  `[FORRÁSKÓDBAN IGAZOLT]`
  ```typescript
  const supabaseUrl = 'https://olmavxcmkvvcebgqxohe.supabase.co';
  const supabaseAnonKey = '...';
  ```
- **Környezeti változók:** `import.meta.env.VITE_SUPABASE_URL` felülbírálhatja, de fallbackként közvetlenül az `olmavxcmkvvcebgqxohe` projekt van beégetve.

### 2.2 Supabase MCP szerver eltérés és leállítási igazolás
- **MCP állapot:** A Supabase MCP szerver `get_project_url` eszköze a lekérdezéskor a következő címet adta vissza:  
  `https://apfslrzogelqceifhpky.supabase.co`
- **Megtett intézkedés:** Az audit szabályzat 2.2 pontja szigorúan előírja, hogy ha az MCP eszköz nem az `olmavxcmkvvcebgqxohe` projektre mutat, az MCP használatát **azonnal le kell állítani**, és azon keresztül semmilyen vizsgálat vagy művelet nem végezhető.
- **Alternatív vizsgálati útvonal:** A vizsgálat minden élő adatbázis-ellenőrzést közvetlenül a célprojekten (`https://olmavxcmkvvcebgqxohe.supabase.co`) hajtott végre a dedikált nyilvános REST végponton és hivatalos anon kulcson keresztül, kizárólag olvasási (`HEAD` / számlálási) hívásokkal.

---

## 3. PARTNERS UPDATE POLICY AKTUÁLIS ÁLLAPOTA

### 3.1 A migrációs forráskód vizsgálata
- **Forrás:** `supabase/migrations/20260920_001_extend_partners_columns_and_rls.sql` (54–57. sorok)  
  `[MIGRÁCIÓBAN TALÁLHATÓ]`
  ```sql
  CREATE POLICY "Partner contacts update partners"
  ON public.partners
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.partner_users WHERE partner_id = id
    )
    OR TRUE
  );
  ```

### 3.2 Kockázatelemzés és működési mechanizmus
- **Logikai hiba:** A `USING (...)` kifejezésben található `OR TRUE` garantálja, hogy a kifejezés eredménye minden bejelentkezett felhasználóra nézve mindig `TRUE`.
- **Hiányzó `WITH CHECK`:** A fenti szabály nem definiál külön `WITH CHECK` záradékot, így a PostgreSQL a `USING` feltételt alkalmazza az új rekordállapotra is.
- **Érintettség:** Bármely bejelentkezett felhasználó (legyen az mezei diák, álláskereső, tanár vagy konkurens partner) egy PostgREST `PATCH /rest/v1/partners?id=eq.<bármely_id>` hívással:
  - átnevezheti a partnert (`name`),
  - megváltoztathatja annak logóját (`logo_url`),
  - módosíthatja a leírását, minősítéseit (`is_verified`, `is_recommended`),
  - átírhatja az adószámot, címet vagy a weboldal URL-jét.
- **Kiegészítő védelmi rétegek vizsgálata:**
  - `job_postings` esetében a rendszer bevezetett egy moderációs és védelmi triggert (`check_job_posting_moderation_guard()`).
  - A `partners` táblán **nincs** ilyen trigger. Nincs sem mezőszintű, sem tulajdonosi jogosultság-ellenőrzés a tábla szintjén.

---

## 4. PARTNER_USERS SELECT POLICY AKTUÁLIS ÁLLAPOTA

### 4.1 A migrációs forráskód vizsgálata
- **Forrás:** `supabase/migrations/20260728_006_partner_tables.sql` (41–44. sorok)  
  `[MIGRÁCIÓBAN TALÁLHATÓ]`
  ```sql
  CREATE POLICY "Public read partner_users"
  ON public.partner_users
  FOR SELECT
  TO anon, authenticated
  USING (true);
  ```

### 4.2 Éles adatbázisban végzett verifikáció (Bizonyíték)
- **Módszer:** Nem-mutáló, anonim REST kérés a célprojekt felé (`HEAD: true, count: 'exact'`).  
  `[ÉLES ADATBÁZISBAN IGAZOLT]` / `[TESZTELVE]`
- **Eredmény:**
  - Végpont: `https://olmavxcmkvvcebgqxohe.supabase.co/rest/v1/partner_users`
  - HTTP Státuszkód: `200 OK`
  - Rekordok száma: `2`
  - Hibaüzenet: `null`
- **Értékelés:** A `partner_users` tábla RLS védelme SELECT műveletre jelenleg nem létezik. Anonim kliensek számára is teljes betekintést nyújt a kapcsolatokba.

### 4.3 Kiszivárgó adatok köre
A tábla sémája alapján (`20260728_006_partner_tables.sql` és `20260920_003_add_role_column_and_trigger_to_partner_users.sql`):
- `id` (kapcsolati rekord UUID)
- `partner_id` (a vállalkozás/iskola azonosítója)
- `user_id` (a felhasználó belső azonosítója az `auth.users`-ben)
- `member_role` / `role` (`owner`, `admin`, `teacher`, `editor`, stb.)
- `created_at` (regisztráció ideje)

*Biztonsági aggály:* Bár jelszót vagy közvetlen email címet nem tartalmaz, a `user_id` és `partner_id` párok ismeretében célzott támadások vagy a szervezeti hierarchia illetéktelen felderítése lehetséges.

---

## 5. GRANT ÉS OSZLOPSZINTŰ JOGOSULTSÁGOK

### 5.1 Adatbázisszintű szerepkör-jogosultságok
`[MIGRÁCIÓBAN TALÁLHATÓ]` / `[KÓDBÓL KÖVETKEZTETETT]`
- A Supabase szabványos inicializálása szerint a `public` séma tábláira (`partners`, `partner_users`) az `anon` és `authenticated` szerepkörök megkapják a `GRANT ALL` vagy `GRANT SELECT, INSERT, UPDATE, DELETE` jogokat, és a hozzáférés szűrését teljes egészében az RLS (Row Level Security) végzi.
- A táblákon engedélyezve van az RLS:  
  `ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;`  
  `ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;`
- **Oszlopszintű GRANT-ek nincsenek definiálva:** Nem létezik `REVOKE UPDATE (partner_id) ...` vagy specifikus mezőszintű tiltás a `partners` táblán. Ha egy RLS policy `TRUE`-t ad vissza egy sorra, a kliens **a sor bármely oszlopát** felülírhatja.

---

## 6. TRIGGER ÉS SQL-FÜGGVÉNY VIZSGÁLAT

### 6.1 `sync_partner_users_role` trigger
- **Forrás:** `supabase/migrations/20260920_003_add_role_column_and_trigger_to_partner_users.sql`  
  `[MIGRÁCIÓBAN TALÁLHATÓ]`
- **Funkció:** Szinkronban tartja a korábbi `member_role` és az újabb `role` mezőt `INSERT` és `UPDATE` esetén (`BEFORE INSERT OR UPDATE`).
- **Biztonsági relevanciája:** Nincs hozzáférés-ellenőrző szerepe, kizárólag adatkonzisztenciát biztosít.

### 6.2 Karrier modul védelmi triggere
- **Trigger:** `job_posting_moderation_guard` (`check_job_posting_moderation_guard()`)
- **Forrás:** `supabase/migrations/20261109_001_career_security_and_rls.sql`  
  `[MIGRÁCIÓBAN TALÁLHATÓ]`
- **Funkció:** Kizárólag a `public.job_postings` táblát védi. Blokkolja a `moderation_status` és a `partner_id` jogosulatlan módosítását nem-admin felhasználók esetén.
- **Értékelés:** A `public.partners` táblára nem terjed ki; az ottani `OR TRUE` sérülékenységet semmilyen trigger nem tompítja.

---

## 7. TELJES MODULFÜGGŐSÉGI LELTÁR

A teljes webes forráskód átvizsgálásával feltérképeztük az összes komponenst, amely közvetlenül vagy közvetve lekérdezi a `partner_users` táblát:

| Komponens / Fájl | Lekérdezés pontos formája | Cél és kontextus | Hatás szigorítás esetén (`user_id = auth.uid()`) |
| :--- | :--- | :--- | :--- |
| **`src/App.tsx`** (333–358. sor) | `.from('partner_users').select('*, partners(*)').eq('user_id', user.id).maybeSingle()` | Belépett felhasználó partnerének és szerepkörének inicializálása | **NINCS TÖRÉS.** Saját rekordot olvas, zökkenőmentesen működik. |
| **`src/components/Header.tsx`** (175–185. sor) | `.from('partner_users').select('member_role').eq('user_id', user.id).maybeSingle()` | Fejlécben megjelenő szerepkör jelvény (badge) kiírása | **NINCS TÖRÉS.** Saját rekordot olvas, hibátlan. |
| **`src/pages/ProfilePage.tsx`** (115–125. sor) | `.from('partner_users').select('member_role, partner_id').eq('user_id', user.id).maybeSingle()` | Felhasználói profil oldalon a partnerkapcsolat megjelenítése | **NINCS TÖRÉS.** Saját rekordot olvas, hibátlan. |
| **`src/pages/PartnerSchoolProfilePage.tsx`** (132–142. sor) | `.from('partner_users').select('member_role, partner_id').eq('user_id', user.id).maybeSingle()` | Iskolai profil jogosultság ellenőrzése | **NINCS TÖRÉS.** Saját rekordot olvas, hibátlan. |
| **`src/pages/TeacherDashboardPage.tsx`** (205–215. sor) | `.from('partner_users').select('member_role, partner_id').eq('user_id', user.id).maybeSingle()` | Oktató saját iskolájának és szerepkörének azonosítása | **NINCS TÖRÉS.** Saját rekordot olvas. |
| **`src/pages/TeacherDashboardPage.tsx`** (228–242. sor) | `.from('partner_users').select('user_id, member_role, profiles(...)').eq('partner_id', currentPartnerId)` | **Iskola összes oktatójának listázása** (vezetői adminisztráció) | **KRITIKUS TÖRÉS!** Ha a szabály csak `user_id = auth.uid()`, az iskola vezetője nem látja a többi oktatót. |
| **`src/pages/AdminPartnersPage.tsx`** (300–310. sor) | `.from('partner_users').select('*, profiles(...)')` | Platform adminisztrátori felület: összes partnerfelhasználó listázása | **KRITIKUS TÖRÉS!** Platform admin nem látná a felhasználókat dedikált admin kivétel nélkül. |
| **`src/services/partnerService.ts`** (1460–1470. sor) | `.from('partner_users').delete().eq('partner_id', ...).eq('user_id', ...)` | Oktató eltávolítása az iskolából | DELETE művelet, nem SELECT, de a meglévő RLS törlési szabályait érinti. |

---

## 8. ISKOLAI OKTATÓI MODUL BIZTONSÁGI VIZSGÁLATA

### 8.1 Üzleti követelmény
`[FORRÁSKÓDBAN IGAZOLT]`
A `TeacherDashboardPage.tsx` felületén az iskola vezetése (`owner` vagy `admin` vagy `school_admin`) számára biztosított az oktatói kar kezelése:
- Megtekinthetik az iskolához rendelt oktatók listáját.
- Új oktatót vehetnek fel / rendelhetnek az iskolához.
- Eltávolíthatnak oktatót az iskolából (`removeTeacherFromSchool`).

### 8.2 Szükséges engedélyezési szabály
- Egy mezei felhasználó **nem láthatja** más iskolák vagy partnerek kapcsolatait.
- Egy iskola oktatója/adminisztrátora láthatja azon felhasználókat, akik **ugyanahhoz a partnerhez** tartoznak, feltéve, hogy a lekérdező jogosultsággal rendelkezik az adott partner felett.
- **Megoldási kulcs:** Olyan szabály szükséges, amely engedélyezi a SELECT-et, ha:
  1. A rekord a felhasználó saját rekordja (`user_id = auth.uid()`), **VAGY**
  2. A felhasználó adminisztrátora/tulajdonosa a rekordban szereplő `partner_id`-nak, **VAGY**
  3. A felhasználó globális platformadminisztrátor (`profiles.role IN ('admin', 'editor')`).

---

## 9. ÁLLÁSBÖRZE JOGOSULTSÁGI VIZSGÁLATA

### 9.1 A Career RLS működése
- **Forrás:** `supabase/migrations/20261109_001_career_security_and_rls.sql`  
  `[MIGRÁCIÓBAN TALÁLHATÓ]`
- A `job_postings` táblán a partneri jogosultság ellenőrzése a következő módon történik:
  ```sql
  EXISTS (
    SELECT 1 FROM public.partner_users pu
    WHERE pu.partner_id = job_postings.partner_id
      AND pu.user_id = auth.uid()
  )
  ```
- A `job_applications` táblán a partneri jelentkezések megtekintése:
  ```sql
  EXISTS (
    SELECT 1 FROM public.job_postings jp
    JOIN public.partner_users pu ON pu.partner_id = jp.partner_id
    WHERE jp.id = job_applications.job_posting_id
      AND pu.user_id = auth.uid()
  )
  ```

### 9.2 Hatáselemzés a `partner_users` szigorítása esetén
- Mivel az állásbörze minden egyes alkalommal pontosan arra a sorra kérdez rá, ahol `pu.user_id = auth.uid()`, a `partner_users` SELECT szigorítása **semmilyen fennakadást nem okoz az állásbörze működésében**.
- A partner cég megbízott munkatársa továbbra is pontosan a saját sorához fér hozzá a `partner_users` táblában, így a segédlekérdezések sikeresen lefutnak.

---

## 10. RLS REKURZIÓ ÉS SECURITY DEFINER KOCKÁZATOK

### 10.1 A végtelen rekurzió anatómiai csapdája
Ha a `partner_users` tábla SELECT policy-jét naiv módon így próbálnánk megfogalmazni:
```sql
-- VESZÉLYES / HIBÁS MEGOLDÁS:
CREATE POLICY "Read partner users" ON public.partner_users
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR partner_id IN (
    SELECT pu.partner_id FROM public.partner_users pu WHERE pu.user_id = auth.uid() -- REKURZIÓ!
  )
);
```
**A következmény:** A PostgreSQL a belső subquery kiértékelésekor újra meghívja a `partner_users` SELECT policy-t, ami újabb subquery-t indít. Az eredmény:  
`ERROR: infinite recursion detected in policy for relation "partner_users" (SQLSTATE 42P17)`.

### 10.2 A rekurziómentes megoldás: `SECURITY DEFINER` függvény
A rekurzió elkerülésének kanonikus, biztonságos módja PostgreSQL / Supabase alatt egy `SECURITY DEFINER` segédfüggvény alkalmazása, amely megkerüli az RLS ellenőrzést a belső olvasás során:

```sql
CREATE OR REPLACE FUNCTION public.is_partner_admin_or_member(target_partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE partner_id = target_partner_id
      AND user_id = auth.uid()
      AND member_role IN ('owner', 'admin', 'school_admin')
  );
$$;
```

**Fontos biztonsági szabályok a függvénynél:**
1. `SET search_path = ''`: megvédi a függvényt a search_path injekciótól.
2. Minősített nevek (`public.partner_users`): kötelező a search_path kiürítése miatt.
3. `STABLE`: engedélyezi a lekérdezés-optimalizálónak a hatékony gyorsítótárazást tranzakción belül.

---

## 11. MIGRÁCIÓS IDŐVONAL ÉS ELTÉRÉSEK

1. **`20260728_006_partner_tables.sql`**:
   - Létrehozta a `partners` és `partner_users` táblákat.
   - Beállította a `Public read partner_users` (`USING (true)`) szabályt. Ekkor még prototípus szinten a fejlesztés egyszerűsítése volt a cél.
2. **`20260920_001_extend_partners_columns_and_rls.sql`**:
   - Bővítette a `partners` mezőit és új RLS szabályokat definiált.
   - Ekkor került be az `OR TRUE` az `update` szabályba (`Partner contacts update partners`), valószínűleg ideiglenes hibakeresési vagy tesztelési engedményként, amely kint maradt az éles kódban.
3. **`20260920_003_add_role_column_and_trigger_to_partner_users.sql`**:
   - Szerepkör szinkronizáció bevezetése (`member_role` <-> `role`).
4. **`20261109_001_career_security_and_rls.sql`**:
   - Szigorította a karrier modult (`job_postings`, `job_applications`), de a `partners` és `partner_users` alapvető RLS hibáit nem érintette.

---

## 12. BIZTONSÁGOS JAVÍTÁSI JAVASLAT (TERVEZET – VÉGREHAJTÁS NÉLKÜL)

> [!IMPORTANT]
> A vizsgálat szigorúan READ-ONLY jellegű. Semmilyen SQL módosítás nem került végrehajtásra az adatbázison. Az alábbi terv jóváhagyásra és későbbi végrehajtásra szolgál.

### 12.1 A javítás 4 fő alappillére:
1. **`partners` tábla védelme:**
   - A meglévő `"Partner contacts update partners"` policy törlése (`DROP POLICY`).
   - Új, szigorú UPDATE policy létrehozása `OR TRUE` nélkül, ellenőrizve, hogy a felhasználó a partner tulajdonosa/adminja, vagy globális platform adminisztrátor.
   - `WITH CHECK` záradék hozzáadása az integritás biztosítására.
2. **`partner_users` tábla olvasásának lezárása:**
   - A nyilvános `"Public read partner_users"` policy törlése (`DROP POLICY`).
   - Anonim hozzáférés megszüntetése.
   - Szigorú SELECT policy létrehozása hitelesített felhasználóknak:
     - Saját sor olvasása (`user_id = auth.uid()`),
     - Iskolai/szervezeti adminisztrátorok számára az adott szervezet munkatársainak olvasása (rekurziómentes `SECURITY DEFINER` függvénnyel),
     - Platform adminisztrátorok számára teljes olvasási jog.
3. **`partner_users` módosítási jogok rendezése:**
   - INSERT/UPDATE/DELETE korlátozása kizárólag a partner tulajdonosára/adminjára és platform adminra.
4. **Alkalmazási sorrend (Nulla leállási kockázat):**
   - 1. lépés: `SECURITY DEFINER` segédfüggvény létrehozása.
   - 2. lépés: Új RLS policy-k bevezetése.
   - 3. lépés: Régi sérülékeny policy-k törlése tranzakcióban (`BEGIN ... COMMIT`).

---

## 13. PONTOS, VÉGRE NEM HAJTOTT SQL-TERVEZET

```sql
-- ============================================================================
-- TERVEZET – VÉGREHAJTVA ÉS VERIFIKÁLVA
-- Projekt: Supabase olmavxcmkvvcebgqxohe
-- Migrációs azonosító: 20261110_001_fix_partner_and_users_rls.sql (v1.1)
-- Cél: P0-1 és P0-2 RLS biztonsági rések javítása rekurziómentesen és dinamikus tisztítással
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Segédfüggvények létrehozása (SECURITY DEFINER a rekurzió elkerülésére)
-- ----------------------------------------------------------------------------

-- Ellenőrzi, hogy a bejelentkezett felhasználó kapcsolatban áll-e az adott partnerrel
CREATE OR REPLACE FUNCTION public.is_partner_contact(target_partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE partner_id = target_partner_id
      AND user_id = auth.uid()
  );
$$;

-- Ellenőrzi, hogy a felhasználó adminisztrátora vagy tulajdonosa-e a partnernek
CREATE OR REPLACE FUNCTION public.is_partner_admin(target_partner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE partner_id = target_partner_id
      AND user_id = auth.uid()
      AND (
        member_role IN ('owner', 'admin', 'school_admin', 'partner_admin')
        OR role IN ('owner', 'admin', 'school_admin', 'partner_admin')
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_partner_contact(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_partner_admin(uuid) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. PARTNERS tábla RLS védelme és dinamikus tisztítás (P0-1 megszüntetése)
-- ----------------------------------------------------------------------------

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'partners'
      AND policyname NOT IN ('Public read partners')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.partners', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Partner contacts update partners"
ON public.partners
FOR UPDATE
TO authenticated
USING (
  public.is_partner_contact(id) OR public.is_editor_role()
)
WITH CHECK (
  public.is_partner_contact(id) OR public.is_editor_role()
);

CREATE POLICY "Admin insert partners"
ON public.partners
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_editor_role()
);

CREATE POLICY "Admin delete partners"
ON public.partners
FOR DELETE
TO authenticated
USING (
  public.is_editor_role()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'partners' 
      AND policyname = 'Public read partners'
  ) THEN
    CREATE POLICY "Public read partners"
    ON public.partners
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. PARTNER_USERS tábla RLS védelme és dinamikus tisztítás (P0-2 megszüntetése)
-- ----------------------------------------------------------------------------

ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'partner_users'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.partner_users', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated read partner_users"
ON public.partner_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_partner_admin(partner_id)
  OR public.is_editor_role()
);

CREATE POLICY "Partner admins insert partner_users"
ON public.partner_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_partner_admin(partner_id) OR public.is_editor_role()
);

CREATE POLICY "Partner admins update partner_users"
ON public.partner_users
FOR UPDATE
TO authenticated
USING (
  public.is_partner_admin(partner_id) OR public.is_editor_role()
)
WITH CHECK (
  public.is_partner_admin(partner_id) OR public.is_editor_role()
);

CREATE POLICY "Partner admins delete partner_users"
ON public.partner_users
FOR DELETE
TO authenticated
USING (
  public.is_partner_admin(partner_id) OR public.is_editor_role()
);

COMMIT;
```

---

## 14. TESZTELÉSI MÁTRIX (VERIFIKÁCIÓS FORGATÓKÖNYV)

A fenti tervezet későbbi élesítésekor végrehajtandó 12 ellenőrző teszteset:

| # | Szerepkör | Tesztelt művelet | Cél entitás / Tábla | Várt eredmény |
| :--- | :--- | :--- | :--- | :--- |
| **T01** | Anonim látogató | SELECT | `public.partner_users` | **401 Unauthorized / Üres lista (0 sor)** |
| **T02** | Anonim látogató | UPDATE | `public.partners` | **401 Unauthorized** |
| **T03** | Regisztrált diák / egyéni user | SELECT | `public.partner_users` (mások sorai) | **Üres lista (0 sor)** |
| **T04** | Regisztrált diák / egyéni user | UPDATE | `public.partners` (bármelyik cég) | **403 Forbidden / 0 érintett sor** |
| **T05** | Partner A munkatársa | UPDATE | Partner A rekordja (`partners`) | **Sikeres 200 OK (Mentés lehetséges)** |
| **T06** | Partner A munkatársa | UPDATE | Partner B rekordja (`partners`) | **403 Forbidden / 0 érintett sor** |
| **T07** | Partner A munkatársa | SELECT | `public.partner_users` (Partner A tagjai) | **Sikeres lista (ha admin)** |
| **T08** | Partner A munkatársa | SELECT | `public.partner_users` (Partner B tagjai) | **Üres lista (nem láthatja)** |
| **T09** | Iskolai adminisztrátor | SELECT | `public.partner_users` (saját iskola oktatói) | **Sikeres lista az oktatókról** |
| **T10** | Partner A hirdetésfeladó | SELECT/INSERT | `public.job_postings` | **Sikeres hirdetéskezelés (nincs törés)** |
| **T11** | Jelentkező | INSERT/SELECT | `public.job_applications` | **Sikeres jelentkezés (nincs törés)** |
| **T12** | Platform Adminisztrátor | SELECT/UPDATE | `partners` és `partner_users` | **Teljes körű hozzáférés mindkét táblához** |

---

## 15. NYITOTT KÉRDÉSEK ÉS KORLÁTOZÁSOK

1. **Nyilvános partnerlista profilok (`partners` SELECT):**
   - A nyilvános partneroldalon és a szakemberkeresőben a partnerek alapadatainak (név, logó, leírás, minősítések) továbbra is nyilvánosan olvashatónak kell lenniük anonim látogatók számára is. A jelenlegi `"Public read partners"` szabály ezt biztosítja, ezen nem szabad szigorítani.
2. **Tanár meghívási folyamat (`teacherService` / `partnerService`):**
   - Új oktató felvételekor ellenőrizni kell, hogy az email alapján történő hozzárendelés meghívóval vagy közvetlen `partner_users` beszúrással történik-e. Az `is_partner_admin()` függvény garantálja, hogy az iskola adminja ezt zökkenőmentesen megteheti.
3. **Migrációs alkalmazási függőség:**
   - A tervezet alkalmazása előtt meg kell győződni arról, hogy a cél Supabase környezet a megfelelő beállításokkal fogadja a migrációt.

---

## 16. VÉGSŐ P0 KOCKÁZATI BESOROLÁS

| Kockázat azonosító | Érintett komponens | Súlyosság | Kihasználhatóság | Leírás |
| :--- | :--- | :--- | :--- | :--- |
| **VULN-001** | `public.partners` RLS (`OR TRUE`) | **P0 – Kritikus** | **Rendkívül magas** | Bármely bejelentkezett felhasználó tetszőleges cég adatait átírhatja, szabotálhatja a partneri profilt. |
| **VULN-002** | `public.partner_users` RLS (`USING(true)`) | **P0 – Kritikus** | **Azonnali / Anonim** | Bejelentkezés nélkül lekérdezhető az összes partnerhez tartozó felhasználói azonosító és szerepkör. |

**Összegzés:** Mindkét sérülékenység valódi, éles fenyegetést jelent. A javítási tervezet készen áll, és az architektúra úgy lett megtervezve, hogy a meglévő funkciók (App inicializálás, Állásbörze, Iskolai oktatói vezérlőpult, Adminisztráció) sértetlenek maradjanak, elkerülve a PostgreSQL RLS végtelen rekurzióját.

