/*
# Migration: 20261110_003_link_78as_epitok_owner.sql
# Description: Idempotent database persistence for 78-as Építők Kft. partner record
#              and owner link to verified user account Schmidt József (muck@hotmail.hu).
# Version: 1.0 (Strict validation guards, no upsert/overwrite on conflict)
*/

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

  -- 2. Partnerrekord egyediségének ellenőrzése (ha létezik, azonnal leáll vagy megkeresi)
  SELECT COUNT(*) INTO v_existing_partner_count
  FROM public.partners
  WHERE slug = '78-as-epitok';

  IF v_existing_partner_count = 0 THEN
    -- 3. Minimális partnerrekord létrehozása (is_verified = false, minden nem igazolt adat NULL)
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
  ELSE
    SELECT id INTO v_partner_id
    FROM public.partners
    WHERE slug = '78-as-epitok'
    LIMIT 1;
  END IF;

  IF v_partner_id IS NULL THEN
    RAISE EXCEPTION 'MEGÁLLÁS [3.1]: A partnerrekord azonosítása sikertelen! Tranzakció visszagörgetve.';
  END IF;

  -- 4. Partnerkapcsolat létrehozása (member_role = owner)
  SELECT COUNT(*) INTO v_existing_link_count
  FROM public.partner_users
  WHERE partner_id = v_partner_id AND user_id = v_auth_user_id;

  IF v_existing_link_count = 0 THEN
    INSERT INTO public.partner_users (
      partner_id,
      user_id,
      member_role
    ) VALUES (
      v_partner_id,
      v_auth_user_id,
      'owner'
    );
  END IF;

  RAISE NOTICE 'SIKER: 78-as Építők Kft. partner és Schmidt József tulajdonosi kapcsolat érvényesítve (Partner ID: %, User ID: %).', v_partner_id, v_auth_user_id;
END $$;

COMMIT;
