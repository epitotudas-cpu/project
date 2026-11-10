# P0-D12 – 78-AS ÉPÍTŐK KFT. HELYREÁLLÍTÁSI SQL VÉGLEGESÍTÉSE

**Dokumentum azonosító:** `P0_D12_PARTNER_RECOVERY_EXECUTION_SQL.md`  
**Projekt:** ÉpítőTudás Digitális Tudásbázis és Szakmai Közösségi Portál  
**Célrendszer:** Supabase Produkciós Projekt (`olmavxcmkvvcebgqxohe`)  
**Érintett éles partner:** 78-as Építők Kft. (`slug: 78-as-epitok`)  
**Érintett éles felhasználó:** Schmidt József (`muck@hotmail.hu`)  
**Vizsgálat jellege:** Szigorúan READ-ONLY biztonsági felülvizsgálat és véglegesített végrehajtási SQL tervezet  
**Prioritás:** P0 – Kritikus  
**Dátum:** 2026. november 10.  
**Státusz:** VÉGLEGESÍTETT DOKUMENTÁCIÓ ÉS SQL TERV – VÉGREHAJTÁSRA KÉSZ (PostgreSQL UUID típuskorrekcióval)

---

## 1. A P0-D11 Előzetes Tervezet Hibáinak és Kockázatainak Javítása

A felülvizsgálat során azonosított és elhárított hibák:

| Vizsgált Terület | Korábbi Tervezet Állapota | Véglegesített Szigorítás és Korrekció |
| :--- | :--- | :--- |
| **PostgreSQL UUID típus hiba** | `MIN(id)` használata UUID oszlopon (ERROR 42883) | **Különválasztva:** `COUNT(*)` darabszám-ellenőrzés, majd közvetlen `SELECT id ... LIMIT 1` kiolvasás. |
| **Partner beszúrási mód** | `ON CONFLICT (slug) DO UPDATE` (felülírás veszélye) | **Nincs UPSERT / DO UPDATE:** Ha a `78-as-epitok` slug létezik, a művelet leáll (`RAISE EXCEPTION`), meglévő rekordhoz nem nyúl. |
| **Verifikációs státusz** | `is_verified = true` | **`is_verified = false`:** A valós partneri létezés nem azonos az adminisztráció általi előzetes platform-ellenőrzéssel. |
| **Partner típus** | `partner_type = 'Generálkivitelező Cég'` | **Kihagyva (NULL / default):** Az értékkészlet nincs hivatalosan bizonyítva, ezért nem adunk meg fiktív értéket. |
| **Mintaadatok** | Minta telefon, fiktív cím, sablonszövegek | **Minden nem igazolt mező kötelezően NULL.** |
| **Profil szerepkör kezelése** | `UPDATE profiles SET role = 'partner'` | **Tilos a platformszerepkör módosítása:** Szigorú előfeltétel, hogy már `partner` legyen. Ha nem az, azonnal leáll. |
| **Felhasználó integritás** | Csak létezést vizsgált | **5 pontos szigorú guard:** Pontosan 1 auth rekord, pontosan 1 profile rekord, UUID azonosság, role ellenőrzés. |
| **Szerepkör szinkronizáció** | `member_role` és `role` explicit átadása | **Csak `member_role = 'owner'`:** A `trg_sync_partner_users_role` trigger kezeli automatikusan. |
| **Rollback biztonság** | Egy lépésben törölte volna a partnert is | **Kettéválasztott rollback:** Elsődlegesen csak a kapcsolat visszavonása; a partner törlése csak nulla idegen kulcs esetén. |

---

## 2. Végrehajtás Előtti READ-ONLY Ellenőrzések (Pre-Execution Checks)

Mielőtt a helyreállítási blokk lefutna, a Supabase Dashboard SQL Editorban az alábbi ellenőrző lekérdezésekkel megerősíthető az adatbázis aktuális állapota:

```sql
-- [PRE-CHECK 1]: Schmidt József Auth fiókjának ellenőrzése
SELECT 
  id AS auth_user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE LOWER(email) = 'muck@hotmail.hu';
-- Elvárt: pontosan 1 sor, email_confirmed_at kitöltve (2026.08.28 körüli regisztráció)

-- [PRE-CHECK 2]: Kapcsolódó public.profiles rekord ellenőrzése
SELECT 
  id AS profile_user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles
WHERE LOWER(email) = 'muck@hotmail.hu';
-- Elvárt: pontosan 1 sor, id megegyezik az Auth UUID-vel, role = 'partner'

-- [PRE-CHECK 3]: 78-as Építők Kft. partnerrekord ellenőrzése
SELECT 
  id, 
  name, 
  slug, 
  category 
FROM public.partners 
WHERE slug = '78-as-epitok' OR LOWER(name) LIKE '%78-as%';
-- Elvárt: 0 sor (nem létezhet sem a slug, sem duplikált név)

-- [PRE-CHECK 4]: Létezik-e már partner_users kapcsolat a felhasználóhoz
SELECT * 
FROM public.partner_users 
WHERE user_id = (SELECT id FROM auth.users WHERE LOWER(email) = 'muck@hotmail.hu');
-- Elvárt: 0 sor
```

---

## 3. Véglegesített Helyreállítási SQL Tervezet (Javított Típuskezeléssel)

> [!IMPORTANT]
> **Végrehajtási környezet:** Supabase Dashboard SQL Editor (`postgres` szuperuser). A PostgreSQL `MIN(uuid)` hibája elhárítva; a lekérdezés a darabszám-ellenőrzés után közvetlenül a skalár UUID-t és szerepkört olvassa be.

```sql
-- ============================================================================
-- P0-D12 (KORRIGÁLT): 78-as Építők Kft. éles helyreállítási tranzakciós blokk
-- CÉLPROJEKT: olmavxcmkvvcebgqxohe
-- PARTNER: 78-as Építők Kft. (slug: 78-as-epitok, category: ceg, is_verified: false)
-- TULAJDONOS: Schmidt József (muck@hotmail.hu, member_role: owner)
-- JAVÍTÁS: PostgreSQL 42883 hiba megszüntetve (MIN(uuid) aggregáció eliminálva)
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
  -- 1. FELHASZNÁLÓAZONOSÍTÁS ÉS SZEREPKÖR INTEGRITÁS ELLENŐRZÉSE
  -- --------------------------------------------------------------------------

  -- 1.1. Pontosan egy auth.users rekord keresése és UUID beolvasása
  SELECT COUNT(*) INTO v_auth_user_count
  FROM auth.users 
  WHERE LOWER(email) = 'muck@hotmail.hu';

  IF v_auth_user_count <> 1 THEN
    RAISE EXCEPTION 'MEGÁLLÁS [1.1]: Nem pontosan 1 auth.users rekord található a muck@hotmail.hu címhez (talált: %)! Tranzakció visszagörgetve.', v_auth_user_count;
  END IF;

  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE LOWER(email) = 'muck@hotmail.hu'
  LIMIT 1;

  -- 1.2. Pontosan egy public.profiles rekord keresése és adatok beolvasása
  SELECT COUNT(*) INTO v_profile_count
  FROM public.profiles
  WHERE LOWER(email) = 'muck@hotmail.hu';

  IF v_profile_count <> 1 THEN
    RAISE EXCEPTION 'MEGÁLLÁS [1.2]: Nem pontosan 1 public.profiles rekord található a muck@hotmail.hu címhez (talált: %)! Tranzakció visszagörgetve.', v_profile_count;
  END IF;

  SELECT id, role INTO v_profile_user_id, v_profile_role
  FROM public.profiles
  WHERE LOWER(email) = 'muck@hotmail.hu'
  LIMIT 1;

  -- 1.3. Auth UUID és Profiles UUID azonosság vizsgálata
  IF v_auth_user_id IS DISTINCT FROM v_profile_user_id THEN
    RAISE EXCEPTION 'MEGÁLLÁS [1.3]: Az Auth UUID (%) és a Profiles UUID (%) nem egyezik meg! Tranzakció visszagörgetve.', v_auth_user_id, v_profile_user_id;
  END IF;

  -- 1.4. Profil szerepkör vizsgálata (a meglévő szerepkört nem módosítjuk!)
  IF v_profile_role <> 'partner' THEN
    RAISE EXCEPTION 'MEGÁLLÁS [1.4]: A felhasználó platformszerepköre nem partner (aktuális érték: %)! Tranzakció visszagörgetve.', v_profile_role;
  END IF;

  -- --------------------------------------------------------------------------
  -- 2. PARTNERREKORD EGYEDISÉGÉNEK ELLENŐRZÉSE (NINCS MÓDOSÍTÁS HA LÉTEZIK)
  -- --------------------------------------------------------------------------

  SELECT COUNT(*) INTO v_existing_partner_count
  FROM public.partners
  WHERE slug = '78-as-epitok';

  IF v_existing_partner_count > 0 THEN
    RAISE EXCEPTION 'MEGÁLLÁS [2.1]: A 78-as-epitok slug már létezik az adatbázisban! A meglévő rekord automatikus módosítása tilos. Tranzakció visszagörgetve.';
  END IF;

  -- --------------------------------------------------------------------------
  -- 3. MINIMÁLIS PARTNERREKORD LÉTREHOZÁSA (BIZONYÍTOTT ADATOKKAL)
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
    RAISE EXCEPTION 'MEGÁLLÁS [3.1]: A partnerrekord létrehozása nem adott vissza azonosítót! Tranzakció visszagörgetve.';
  END IF;

  -- --------------------------------------------------------------------------
  -- 4. PARTNERKAPCSOLAT LÉTREHOZÁSA (MEMBER_ROLE = OWNER)
  -- --------------------------------------------------------------------------

  SELECT COUNT(*) INTO v_existing_link_count
  FROM public.partner_users
  WHERE partner_id = v_partner_id AND user_id = v_auth_user_id;

  IF v_existing_link_count > 0 THEN
    RAISE EXCEPTION 'MEGÁLLÁS [4.1]: A partnerkapcsolat már létezik ehhez a felhasználóhoz és partnerhez! Tranzakció visszagörgetve.';
  END IF;

  -- Csak a member_role mezőt adjuk meg, a trg_sync_partner_users_role trigger szinkronizálja a role mezőt
  INSERT INTO public.partner_users (
    partner_id,
    user_id,
    member_role
  ) VALUES (
    v_partner_id,
    v_auth_user_id,
    'owner'
  );

  RAISE NOTICE 'SIKER: 78-as Építők Kft. sikeresen létrehozva (ID: %), Schmidt József hozzárendelve tulajdonosként (User ID: %).', v_partner_id, v_auth_user_id;
END $$;

COMMIT;
```

---

## 4. Végrehajtás Utáni READ-ONLY Ellenőrzések (Post-Execution Checks)

A tranzakció lefutása után az alábbi 5 vizsgálattal igazolható a helyreállítás teljes konzisztenciája:

```sql
-- [POST-CHECK 1]: A létrehozott partnerrekord vizsgálata
SELECT 
  id AS partner_id,
  name,
  slug,
  category,
  partner_type,
  is_verified,
  created_at
FROM public.partners
WHERE slug = '78-as-epitok';
-- Elvárt: pontosan 1 sor, name='78-as Építők Kft.', category='ceg', is_verified=false

-- [POST-CHECK 2]: A partner_users kapcsolat és szerepkör-szinkronizáció vizsgálata
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
-- Elvárt: pontosan 1 sor, member_role='owner', role='owner', owner_verified=true

-- [POST-CHECK 3]: Profil és Auth UUID azonosság ellenőrzése
SELECT 
  u.id AS auth_id,
  p.id AS profile_id,
  u.email,
  p.role AS platform_role,
  (u.id = p.id) AS id_matches,
  (p.role = 'partner') AS role_is_partner
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE LOWER(u.email) = 'muck@hotmail.hu';
-- Elvárt: id_matches=true, role_is_partner=true, a platformszerepkör változatlan maradt

-- [POST-CHECK 4]: Függő idegen kulcsos rekordok vizsgálata
SELECT 
  (SELECT COUNT(*) FROM public.partner_users WHERE partner_id = p.id) AS count_partner_users,
  (SELECT COUNT(*) FROM public.partner_invitations WHERE partner_id = p.id) AS count_invitations,
  (SELECT COUNT(*) FROM public.job_postings WHERE partner_id = p.id) AS count_jobs,
  (SELECT COUNT(*) FROM public.contributors WHERE partner_id = p.id) AS count_contributors
FROM public.partners p
WHERE p.slug = '78-as-epitok';
-- Elvárt: count_partner_users=1, minden egyéb számláló=0

-- [POST-CHECK 5]: RLS védelmi függvények működőképességének igazolása
SELECT 
  public.is_partner_contact((SELECT id FROM public.partners WHERE slug = '78-as-epitok')) AS is_contact,
  public.is_partner_admin((SELECT id FROM public.partners WHERE slug = '78-as-epitok')) AS is_admin;
-- Elvárt: A bejelentkezett Schmidt József JWT-jével futtatva mindkettő TRUE értéket ad.
```

---

## 5. Biztonságos Visszaállítási Terv (Rollback)

A visszaállítás szigorúan két független lépésre van bontva:

### 5.1. Elsődleges visszavonás (Kapcsolat megszüntetése)
```sql
-- 1. LÉPÉS: Kizárólag az összerendelés visszavonása
DELETE FROM public.partner_users
WHERE partner_id = (SELECT id FROM public.partners WHERE slug = '78-as-epitok')
  AND user_id = (SELECT id FROM auth.users WHERE LOWER(email) = 'muck@hotmail.hu');
```

### 5.2. Feltételes törlés (Partnerrekord eltávolítása csak függőségek nélkül)
```sql
-- 2. LÉPÉS: A partnerrekord törlése szigorú idegen kulcs védelemmel
DO $$
DECLARE
  v_partner_id uuid;
  v_dep_count integer := 0;
  v_temp integer;
BEGIN
  SELECT id INTO v_partner_id FROM public.partners WHERE slug = '78-as-epitok';

  IF v_partner_id IS NULL THEN
    RAISE NOTICE 'A 78-as-epitok partnerrekord nem létezik, nincs mit törölni.';
    RETURN;
  END IF;

  -- Kapcsolódó adatok ellenőrzése
  SELECT COUNT(*) INTO v_temp FROM public.partner_users WHERE partner_id = v_partner_id;
  v_dep_count := v_dep_count + v_temp;

  SELECT COUNT(*) INTO v_temp FROM public.partner_invitations WHERE partner_id = v_partner_id;
  v_dep_count := v_dep_count + v_temp;

  SELECT COUNT(*) INTO v_temp FROM public.job_postings WHERE partner_id = v_partner_id;
  v_dep_count := v_dep_count + v_temp;

  SELECT COUNT(*) INTO v_temp FROM public.contributors WHERE partner_id = v_partner_id;
  v_dep_count := v_dep_count + v_temp;

  IF v_dep_count > 0 THEN
    RAISE EXCEPTION 'A 78-as Építők Kft. partnerrekord nem törölhető, mert % darab kapcsolódó rekord hivatkozik rá! Először a függőségeket kell eltávolítani.', v_dep_count;
  END IF;

  DELETE FROM public.partners WHERE id = v_partner_id;
  RAISE NOTICE 'A 78-as-epitok partnerrekord sikeresen és biztonságosan törölve.';
END $$;
```

---

## 6. Fennmaradó Kockázatok és Üzemeltetési Garanciák

1. **Végrehajtási jogosultsági szint:**  
   Az SQL futtatásához a Supabase Dashboard SQL Editor (`postgres` szerepkör) szükséges. Kliensoldali anonim REST hívással vagy még hozzá nem rendelt felhasználói tokennel nem hajtható végre az RLS szabályok miatt.
2. **Cégadatok kitöltése a helyreállítás után:**  
   Mivel a nem bizonyított mintaadatokat (`SAMPLE_78AS_EPITOK`) szándékosan kizártuk a szkriptből, a partnerrekord csupán az alapvető cégnevet és slugot fogja tartalmazni. Schmidt Józsefnek az első bejelentkezés után a Partner Editor (`/partner-portal`) felületen kell feltöltenie a cég hivatalos székhelyét, elérhetőségeit és arculati elemeit.
3. **Adminisztrátori verifikáció:**  
   A partnerrekord kezdetben `is_verified = false` státuszt kap. Miután Schmidt József rögzítette a valós cégadatokat, a platform adminisztrátora az Admin felületen (`AdminPartnersPage`) ellenőrizheti és hitelesítheti a partnert.
