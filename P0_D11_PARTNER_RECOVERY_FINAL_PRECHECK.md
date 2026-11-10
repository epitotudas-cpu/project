# P0-D11 – 78-AS ÉPÍTŐK KFT. ADATHELYREÁLLÍTÁS ELŐTTI VÉGSŐ READ-ONLY ELLENŐRZÉS (P0-D11.1 KORREKCIÓ)

**Dokumentum azonosító:** `P0_D11_PARTNER_RECOVERY_FINAL_PRECHECK.md`  
**Projekt:** ÉpítőTudás Digitális Tudásbázis és Szakmai Közösségi Portál  
**Célrendszer:** Supabase Produkciós Projekt (`olmavxcmkvvcebgqxohe`)  
**Érintett éles partner:** 78-as Építők Kft. (`slug: 78-as-epitok`)  
**Érintett éles felhasználó:** Schmidt József (`muck@hotmail.hu`)  
**Vizsgálat jellege:** Szigorúan READ-ONLY biztonsági és adatintegritási dokumentációs korrekció (0 adatbázis- és 0 forráskód-módosítás)  
**Prioritás:** P0 – Kritikus  
**Dátum:** 2026. november 10.  
**Státusz:** VÉGLEGES BIZTONSÁGI KORREKCIÓ – KIZÁRÓLAG JÓVÁHAGYÁSRA VÁR (NO CODE / NO DB CHANGES)

---

## 1. Munkamód és biztonsági korlátozások igazolása

A vizsgálat és a dokumentum frissítése során a legszigorúbb adatbiztonsági protokoll érvényesült:
- **0 SQL futtatás:** Semmilyen `INSERT`, `UPDATE`, `DELETE`, `UPSERT`, `ALTER` vagy `DROP` parancs nem futott le.
- **0 migráció:** Nem készült és nem futott le új vagy függőben lévő migrációs szkript.
- **0 Auth módosítás:** Sem felhasználói fiók, sem jelszó, sem metaadat nem jött létre vagy módosult.
- **0 forráskód módosítás:** A meglévő TypeScript/React kódbázis érintetlen maradt.
- **0 Git commit/push:** Nem történt git commit vagy remote push.
- **Supabase projektazonosítás:** Minden lekérdezés kizárólag a hivatalos éles projektre (`https://olmavxcmkvvcebgqxohe.supabase.co`) irányult; a nem egyező Supabase MCP szerver használatát kizártuk.

---

## 2. Felhasználó azonosításának szigorított szabályrendszere

### 2.1. A felhasználói fiók bizonyított adatai
Az ÉpítőTudás adminisztrációs felületének (`AdminUsersPage`) és a regisztrációs adatbázis-auditnak a tényei:

| Mező | Tényleges Érték | Forrás / Bizonyíték |
| :--- | :--- | :--- |
| **Név** | **Schmidt József** | `public.profiles.full_name` / Admin Users UI |
| **E-mail cím** | `muck@hotmail.hu` | `auth.users.email` / `public.profiles.email` |
| **Platform szerepkör** | `partner` | Felületi címke: **Partner Tulajdonos (Partner)** |
| **E-mail státusz** | **Megerősítve (`true`)** | `auth.users.email_confirmed_at IS NOT NULL` |
| **Regisztráció ideje** | **2026.08.28.** | `auth.users.created_at` / `profiles.created_at` |
| **Supabase projekt** | `olmavxcmkvvcebgqxohe` | Éles produkciós adatbázis |

### 2.2. Tranzakciós guard feltételek (Megszakítás RAISE EXCEPTION-nel)
A végrehajtási terv kizárólag akkor engedi meg a hozzárendelést, ha a tranzakció futásakor **mind az 5 alábbi feltétel egyidejűleg és maradéktalanul teljesül**:

1. **Egyetlen Auth fiók:** Pontosan 1 darab rekord létezik az `auth.users` táblában a `muck@hotmail.hu` címhez (`COUNT = 1`).
2. **Egyetlen Profil rekord:** Pontosan 1 darab rekord létezik a `public.profiles` táblában ugyanehhez az e-mailhez (`COUNT = 1`).
3. **UUID azonosság:** Az Auth UUID és a Profil UUID tökéletesen megegyezik (`auth.users.id = public.profiles.id`).
4. **Szerepkör integritás:** A `public.profiles.role` értéke bizonyítottan `'partner'`.
5. **Partnerrekord egyértelműség:** A célpartner rekord létezik, és pontosan egy rekord tartozik a `78-as-epitok` slughoz.

> **SZIGORÍTÁS:** Bármelyik fenti feltétel sérülése vagy hiánya esetén a tranzakció azonnal megszakad (`RAISE EXCEPTION`), visszagörget minden módosítást, és nem hoz létre semmilyen árva vagy inkonzisztens adatot.

---

## 3. A partnerrekord szigorított adatai és beszúrási szabályai

### 3.1. Minimális, bizonyított rekordstruktúra
A P0-D11.1 előírásai alapján a partnerrekordot **kizárólag az alábbi 4 bizonyított mezővel** szabad létrehozni:

```yaml
name: "78-as Építők Kft."
slug: "78-as-epitok"
category: "ceg"
is_verified: false
```

### 3.2. Kihagyott és NULL-ozott mezők indoklása
1. **`partner_type` kihagyva:** A `partner_type` megengedett értékei és üzleti jelentése nincs hivatalosan bizonyítva, ezért nem kerül megadásra (alapértelmezett értéket kap vagy NULL marad).
2. **`is_verified = false` szigorítás:** A valós partneri létezés nem azonos a platformüzemeltető általi hivatalos ellenőrzöttséggel (`is_verified`). A megbízhatósági és minősítési szabályok szerint az ellenőrzést az adminisztrátornak kell külön elvégeznie, így a kezdeti érték kötelezően `false`.
3. **Minden egyéb mező NULL:** A `SAMPLE_78AS_EPITOK` konstansban lévő fiktív mintaadatokat (kapcsolattartó: „Nagy Gábor”, telefon: „+36 1 234 5678”, cím: „Kivitelezők útja 78.”, weboldal, stock fotók, mintareferenciák) **szigorúan tilos az éles adatbázisba beírni**. Minden ilyen mező `NULL` marad.

### 3.3. Beszúrási szabály: Nincs automatikus UPSERT vagy DO UPDATE
- **Tilos az `ON CONFLICT (slug) DO UPDATE` használata!**
- A helyreállítási szkript a beszúrás előtt **explicit ellenőrzi**, hogy létezik-e már rekord a `slug = '78-as-epitok'` értékkel.
- Ha a slug már létezik, a művelet **azonnal leáll (`RAISE EXCEPTION`)**, és a meglévő rekordhoz semmilyen formában nem nyúl.
- Ha nincs ilyen rekord, lefut az `INSERT` kizárólag a 4 minimális mezővel.

---

## 4. Partnerfelhasználói kapcsolat (`partner_users`) és RLS elemzés

### 4.1. Kapcsolati mezők
A `public.partner_users` rekord létrehozásakor átadott értékek:
- `partner_id`: A frissen létrehozott és ellenőrzött partnerrekord UUID-je.
- `user_id`: Schmidt József ellenőrzött meglévő Auth/Profiles UUID-je.
- `member_role`: `'owner'`.
- `role`: **Nincs külön megadva**. A `trg_sync_partner_users_role` trigger a `member_role` alapján automatikusan beállítja a `role = 'owner'` értéket, így elkerülhető a szükségtelen kettős szerepkör-kezelés.

### 4.2. RLS jogosultsági követelmények és végrehajtási szint
A `supabase/migrations/20261110_001_fix_partner_and_users_rls.sql` éles védelmi szabálya:
```sql
CREATE POLICY "Partner admins insert partner_users"
ON public.partner_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_partner_admin(partner_id) OR public.is_editor_role()
);
```
- **Kritikus biztonsági összefüggés:** Mivel Schmidt József az összekapcsolás előtt még nincs hozzárendelve a partnerhez, az `is_partner_admin(partner_id)` függvény a futás pillanatában rá nézve **`FALSE`** értéket ad!
- Ezért Schmidt József normál felhasználói JWT tokenjével a kliensoldalról / REST API-n keresztül **NEM lenne képes beszúrni ezt a rekordot**.
- **Következtetés a végrehajtási szintre:** Ezt a helyreállító műveletet kizárólag **emelt szintű jogosultsággal** lehet végrehajtani:
  1. Közvetlenül a **Supabase Dashboard SQL Editorában** futtatva (ahol a parancsok `postgres` szuperuserként, az RLS-t megkerülve futnak);
  2. Vagy a Supabase **`service_role`** biztonsági kulcsával;
  3. Vagy olyan platform adminisztrátori JWT tokennel, akinek a profiljában a szerepkör `admin` vagy `editor` (`is_editor_role() = TRUE`).

---

## 5. Végrehajtásra javasolt szigorított tranzakciós SQL terv

Az alábbi egységes, tranzakcionális PL/pgSQL blokk tartalmazza az összes szigorított guard feltételt, a minimális mezőkkel történő beszúrást és a biztonsági ellenőrzéseket.

```sql
-- ============================================================================
-- P0-D11.1: 78-as Építők Kft. partnerrekord és Schmidt József összekapcsolás
-- CÉLPROJEKT: olmavxcmkvvcebgqxohe
-- VÉGREHAJTÁSI KÖRNYEZET: Supabase SQL Editor (postgres superuser)
-- STÁTUSZ: TERVEZET - KIZÁRÓLAG FELHASZNÁLÓI JÓVÁHAGYÁS UTÁN FUTTATHATÓ
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_auth_user_count integer;
  v_profile_count integer;
  v_auth_user_id uuid;
  v_profile_user_id uuid;
  v_profile_role text;
  v_existing_partner_count integer;
  v_partner_id uuid;
  v_existing_link_count integer;
BEGIN
  -- --------------------------------------------------------------------------
  -- 1. FELHASZNÁLÓ AZONOSÍTÁSÁNAK SZIGORÍTOTT ELLENŐRZÉSE
  -- --------------------------------------------------------------------------

  -- 1.1. Pontosan egy auth.users rekord létezésének vizsgálata
  SELECT COUNT(*), MIN(id) 
  INTO v_auth_user_count, v_auth_user_id
  FROM auth.users 
  WHERE LOWER(email) = 'muck@hotmail.hu';

  IF v_auth_user_count <> 1 THEN
    RAISE EXCEPTION 'HIBA [1.1]: Pontosan 1 auth.users rekordnak kell léteznie a muck@hotmail.hu címhez (talált darabszám: %)! Tranzakció megszakítva.', v_auth_user_count;
  END IF;

  -- 1.2. Pontosan egy public.profiles rekord létezésének vizsgálata
  SELECT COUNT(*), MIN(id), MIN(role)
  INTO v_profile_count, v_profile_user_id, v_profile_role
  FROM public.profiles
  WHERE LOWER(email) = 'muck@hotmail.hu';

  IF v_profile_count <> 1 THEN
    RAISE EXCEPTION 'HIBA [1.2]: Pontosan 1 public.profiles rekordnak kell léteznie a muck@hotmail.hu címhez (talált darabszám: %)! Tranzakció megszakítva.', v_profile_count;
  END IF;

  -- 1.3. Auth UUID és Profiles UUID azonosság vizsgálata
  IF v_auth_user_id IS DISTINCT FROM v_profile_user_id THEN
    RAISE EXCEPTION 'HIBA [1.3]: Az Auth UUID (%) és a Profiles UUID (%) nem egyezik meg! Tranzakció megszakítva.', v_auth_user_id, v_profile_user_id;
  END IF;

  -- 1.4. Profiles szerepkör vizsgálata
  IF v_profile_role <> 'partner' THEN
    RAISE EXCEPTION 'HIBA [1.4]: A felhasználó szerepköre nem partner (aktuális: %)! Tranzakció megszakítva.', v_profile_role;
  END IF;

  -- --------------------------------------------------------------------------
  -- 2. PARTNERREKORD LÉTEZÉSÉNEK VIZSGÁLATA (NINCS UPSERT / DO UPDATE)
  -- --------------------------------------------------------------------------

  SELECT COUNT(*) INTO v_existing_partner_count
  FROM public.partners
  WHERE slug = '78-as-epitok';

  IF v_existing_partner_count > 0 THEN
    RAISE EXCEPTION 'HIBA [2.1]: A 78-as-epitok slug már létezik az adatbázisban! A meglévő rekord automatikus módosítása tilos. Tranzakció megszakítva.';
  END IF;

  -- --------------------------------------------------------------------------
  -- 3. MINIMÁLIS, BIZONYÍTOTT PARTNERREKORD LÉTREHOZÁSA
  -- --------------------------------------------------------------------------

  INSERT INTO public.partners (
    name,
    slug,
    category,
    is_verified
  ) VALUES (
    '78-as Építők Kft.',
    '78-as-epitok',
    'ceg',
    false
  )
  RETURNING id INTO v_partner_id;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'HIBA [3.1]: A partnerrekord létrehozása nem adott vissza azonosítót! Tranzakció megszakítva.';
  END IF;

  -- --------------------------------------------------------------------------
  -- 4. PARTNER_USERS KAPCSOLAT LÉTREHOZÁSA (OWNER SZEREPKÖRREL)
  -- --------------------------------------------------------------------------

  SELECT COUNT(*) INTO v_existing_link_count
  FROM public.partner_users
  WHERE partner_id = v_partner_id AND user_id = v_auth_user_id;

  IF v_existing_link_count > 0 THEN
    RAISE EXCEPTION 'HIBA [4.1]: A partner_users kapcsolat már létezik a partnerhez és felhasználóhoz! Tranzakció megszakítva.';
  END IF;

  INSERT INTO public.partner_users (
    partner_id,
    user_id,
    member_role
  ) VALUES (
    v_partner_id,
    v_auth_user_id,
    'owner'
  );

  RAISE NOTICE 'SIKERES HELYREÁLLÍTÁS: Partner ID: %, User ID: % (Schmidt József, muck@hotmail.hu), Szerepkör: owner, is_verified: false', v_partner_id, v_auth_user_id;
END $$;

COMMIT;
```

---

## 6. READ-ONLY Ellenőrző Lekérdezések a Végrehajtás Utánra

A fenti szkript lefutása után a helyreállított állapot integritását a következő 5 különálló lekérdezéssel kell igazolni:

```sql
-- 1. Partnerrekord és minimális mezők ellenőrzése
SELECT 
  id, 
  name, 
  slug, 
  category, 
  partner_type, 
  is_verified, 
  created_at
FROM public.partners 
WHERE slug = '78-as-epitok';

-- 2. Auth és Profiles azonosság ellenőrzése
SELECT 
  u.id AS auth_user_id,
  p.id AS profile_user_id,
  u.email,
  p.role AS profile_role,
  (u.id = p.id) AS id_matches,
  (p.role = 'partner') AS role_is_partner
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE LOWER(u.email) = 'muck@hotmail.hu';

-- 3. partner_users kapcsolat és trigger által beállított role ellenőrzése
SELECT 
  pu.partner_id,
  p.name AS partner_name,
  pu.user_id,
  pr.email AS user_email,
  pu.member_role,
  pu.role AS synced_role,
  (pu.member_role = 'owner' AND pu.role = 'owner') AS owner_verified,
  pu.created_at AS linked_at
FROM public.partner_users pu
JOIN public.partners p ON p.id = pu.partner_id
JOIN public.profiles pr ON pr.id = pu.user_id
WHERE p.slug = '78-as-epitok';

-- 4. Partnerhez kapcsolódó esetleges idegen kulcsos rekordok ellenőrzése
SELECT 
  (SELECT COUNT(*) FROM public.partner_users WHERE partner_id = p.id) AS count_partner_users,
  (SELECT COUNT(*) FROM public.partner_invitations WHERE partner_id = p.id) AS count_invitations,
  (SELECT COUNT(*) FROM public.job_postings WHERE partner_id = p.id) AS count_jobs,
  (SELECT COUNT(*) FROM public.contributors WHERE partner_id = p.id) AS count_contributors
FROM public.partners p
WHERE p.slug = '78-as-epitok';

-- 5. RLS jogosultsági segédfüggvények működőképességének tesztelése
SELECT 
  public.is_partner_contact((SELECT id FROM public.partners WHERE slug = '78-as-epitok')) AS is_contact_valid,
  public.is_partner_admin((SELECT id FROM public.partners WHERE slug = '78-as-epitok')) AS is_admin_valid;
```

---

## 7. Javított Visszaállítási Terv (Rollback)

A visszaállítási tervet szigorúan kettéválasztjuk:
1. **Elsődleges művelet:** A `partner_users` kapcsolat visszavonása (nem érinti a partnerrekordot).
2. **Feltételes művelet:** A partnerrekord törlése (kizárólag akkor engedélyezett, ha nincs semmilyen más idegen kulcsos adat!).

### 7.1. Elsődleges visszavonás: Partnerfelhasználói kapcsolat megszüntetése
```sql
-- 1. LÉPÉS (Elsődleges): Kizárólag a hozzárendelés visszavonása
DELETE FROM public.partner_users
WHERE partner_id = (SELECT id FROM public.partners WHERE slug = '78-as-epitok')
  AND user_id = (SELECT id FROM auth.users WHERE LOWER(email) = 'muck@hotmail.hu');
```

### 7.2. Másodlagos (Feltételes) törlés: Partnerrekord eltávolítása
A partnerrekord **kizárólag akkor törölhető**, ha bizonyítottan semmilyen egyéb idegen kulcsos rekord (`job_postings`, `partner_invitations`, `contributors`, további `partner_users`) nem kapcsolódik hozzá:

```sql
-- 2. LÉPÉS (Feltételes): Partnerrekord törlése szigorú idegen kulcs ellenőrzéssel
DO $$
DECLARE
  v_partner_id uuid;
  v_fk_count integer := 0;
  v_temp_count integer;
BEGIN
  SELECT id INTO v_partner_id FROM public.partners WHERE slug = '78-as-epitok';

  IF v_partner_id IS NULL THEN
    RAISE NOTICE 'A 78-as-epitok partnerrekord nem létezik, nincs mit törölni.';
    RETURN;
  END IF;

  -- Kapcsolódó rekordok ellenőrzése
  SELECT COUNT(*) INTO v_temp_count FROM public.partner_users WHERE partner_id = v_partner_id;
  v_fk_count := v_fk_count + v_temp_count;

  SELECT COUNT(*) INTO v_temp_count FROM public.partner_invitations WHERE partner_id = v_partner_id;
  v_fk_count := v_fk_count + v_temp_count;

  SELECT COUNT(*) INTO v_temp_count FROM public.job_postings WHERE partner_id = v_partner_id;
  v_fk_count := v_fk_count + v_temp_count;

  SELECT COUNT(*) INTO v_temp_count FROM public.contributors WHERE partner_id = v_partner_id;
  v_fk_count := v_fk_count + v_temp_count;

  IF v_fk_count > 0 THEN
    RAISE EXCEPTION 'A 78-as Építők Kft. partnerrekord nem törölhető, mert még % darab kapcsolódó rekord hivatkozik rá! Először a kapcsolódó adatokat kell rendezni.', v_fk_count;
  END IF;

  DELETE FROM public.partners WHERE id = v_partner_id;
  RAISE NOTICE 'A 78-as Építők Kft. partnerrekord biztonságosan törölve.';
END $$;
```

---

## 8. Végrehajtási Követelmények és Garanciák Összefoglalása

| Kérdéskör | Megállapítás / Szabály |
| :--- | :--- |
| **Szükséges műveletek** | 1. Minimális partnerrekord beszúrása (`name`, `slug`, `category`, `is_verified: false`).<br>2. `partner_users` rekord beszúrása (`member_role: 'owner'`). |
| **Végrehajtási jogosultság** | Kizárólag **PostgreSQL DB adminisztrátor / Supabase SQL Editor / `service_role`** (mert az RLS az összerendelés előtt blokkolja a normál felhasználói beszúrást). |
| **Tranzakció megszakítási feltételei** | 1. Ha nem pontosan 1 `auth.users` rekord van `muck@hotmail.hu`-hoz.<br>2. Ha nem pontosan 1 `public.profiles` rekord van.<br>3. Ha az Auth UUID és Profiles UUID nem egyezik.<br>4. Ha a profil szerepkör nem `partner`.<br>5. Ha a `78-as-epitok` slug már létezik (nincs felülírás!). |
| **Végrehajtás utáni ellenőrzések** | 5 pontos READ-ONLY ellenőrző lekérdezéssorozat (partner, Auth/Profiles azonosság, kapcsolat, trigger általi szinkronizáció, idegen kulcsok). |

---

> [!IMPORTANT]
> **MEGÁLLÁS:** A dokumentációs korrekció kész. Semmilyen adatbázis-módosítás, migráció vagy kódmódosítás nem futott le. A helyreállítás kizárólag az Ön kifejezett, jóváhagyó utasítására indulhat el.
