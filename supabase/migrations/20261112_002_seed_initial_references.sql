-- ============================================================================
-- MIGRÁCIÓS ÉS SEED SZKRIPT: 20261112_002_seed_initial_references.sql
-- ÉpítőTudás Meglévő Partner Referenciák Szinkronizálása az Adatbázisba
-- Cél Supabase projekt: olmavxcmkvvcebgqxohe
-- Partner: 78-as Építők Kft. (d876ac79-13a7-4c14-852d-3b5adb282047)
-- ============================================================================

BEGIN;

-- Adminisztratív replikációs mód a közvetlen seed betöltéséhez
SET LOCAL session_replication_role = 'replica';

DO $$
DECLARE
  v_partner_id uuid := 'd876ac79-13a7-4c14-852d-3b5adb282047';
  v_ref1_id uuid;
  v_ref2_id uuid;
BEGIN
  -- Ellenőrizzük, hogy létezik-e a partner a partners táblában
  IF NOT EXISTS (SELECT 1 FROM public.partners WHERE id = v_partner_id) THEN
    RAISE NOTICE 'A 78-as Építők Kft. (id: %) nem található a partners táblában, a seed kihagyásra került.', v_partner_id;
    RETURN;
  END IF;

  -- 1. Referencia: Buda-Garten 24 lakásos Társasház
  SELECT id INTO v_ref1_id FROM public.partner_references
  WHERE partner_id = v_partner_id AND title = 'Buda-Garten 24 lakásos Társasház';

  IF v_ref1_id IS NULL THEN
    INSERT INTO public.partner_references (
      partner_id,
      title,
      location,
      year,
      category,
      description,
      is_published,
      created_at,
      updated_at
    ) VALUES (
      v_partner_id,
      'Buda-Garten 24 lakásos Társasház',
      'Budapest XI. kerület',
      '2025',
      'Társasházépítés',
      'A-kategóriás energetikai besorolású, monolit vasbeton szerkezetű lakópark kulcsrakész kivitelezése.',
      true,
      now(),
      now()
    ) RETURNING id INTO v_ref1_id;

    -- Borítókép és galéria
    INSERT INTO public.partner_reference_images (
      reference_id,
      partner_id,
      object_key,
      thumbnail_key,
      caption,
      is_cover,
      display_order,
      width,
      height,
      size_bytes,
      created_at
    ) VALUES (
      v_ref1_id,
      v_partner_id,
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      'Buda-Garten homlokzat és épületszárny',
      true,
      1,
      1600,
      1067,
      1200000,
      now()
    );

    RAISE NOTICE 'Buda-Garten 24 lakásos Társasház referencia sikeresen beszúrva (id: %).', v_ref1_id;
  ELSE
    RAISE NOTICE 'Buda-Garten referencia már létezik (id: %), frissítés nem szükséges.', v_ref1_id;
  END IF;

  -- 2. Referencia: Logisztikai Központ & Raktárcsarnok
  SELECT id INTO v_ref2_id FROM public.partner_references
  WHERE partner_id = v_partner_id AND title = 'Logisztikai Központ & Raktárcsarnok';

  IF v_ref2_id IS NULL THEN
    INSERT INTO public.partner_references (
      partner_id,
      title,
      location,
      year,
      category,
      description,
      is_published,
      created_at,
      updated_at
    ) VALUES (
      v_partner_id,
      'Logisztikai Központ & Raktárcsarnok',
      'Biatorbágy',
      '2024',
      'Ipari építészet',
      '3500 m² alapterületű acélszerkezetes raktárcsarnok és irodaház kivitelezése.',
      true,
      now(),
      now()
    ) RETURNING id INTO v_ref2_id;

    -- Borítókép és galéria
    INSERT INTO public.partner_reference_images (
      reference_id,
      partner_id,
      object_key,
      thumbnail_key,
      caption,
      is_cover,
      display_order,
      width,
      height,
      size_bytes,
      created_at
    ) VALUES (
      v_ref2_id,
      v_partner_id,
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      'Logisztikai Központ és raktárcsarnok külső tér',
      true,
      1,
      1600,
      1067,
      1400000,
      now()
    );

    RAISE NOTICE 'Logisztikai Központ & Raktárcsarnok referencia sikeresen beszúrva (id: %).', v_ref2_id;
  ELSE
    RAISE NOTICE 'Logisztikai Központ referencia már létezik (id: %), frissítés nem szükséges.', v_ref2_id;
  END IF;
END $$;

COMMIT;
