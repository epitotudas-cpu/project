/*
# Migration: 20261110_001_fix_partner_and_users_rls.sql
# Description: Fix P0-1 (partners UPDATE OR TRUE vulnerability) and P0-2 (partner_users open SELECT vulnerability),
#              implement recursion-safe SECURITY DEFINER helpers, dynamic cleanup of legacy/rogue policies,
#              and enforce strict RLS on partners and partner_users.
# Version: 1.1 (Dynamic pg_policies cleanup, FORCE RLS, search_path = '' security helpers)
*/

BEGIN;

-- ============================================================================
-- 1. SEGÉDFÜGGVÉNYEK (SECURITY DEFINER + search_path = '' a rekurzió védelmére)
-- ============================================================================

-- 1.1. Ellenőrzi, hogy a bejelentkezett felhasználó kapcsolatban áll-e az adott partnerrel
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

-- 1.2. Ellenőrzi, hogy a felhasználó adminisztrátora vagy tulajdonosa-e a partnernek / iskolának
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

-- Jogosultságok biztosítása a segédfüggvényekre
GRANT EXECUTE ON FUNCTION public.is_partner_contact(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_partner_admin(uuid) TO anon, authenticated;

-- ============================================================================
-- 2. PARTNERS TÁBLA RLS VÉDELME ÉS DINAMIKUS TISZTÍTÁS (P0-1 JAVÍTÁSA)
-- ============================================================================

-- RLS kényszerítése
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners FORCE ROW LEVEL SECURITY;

-- Minden régi, ismeretlen vagy örökölt policy dinamikus eltávolítása a partners tábláról
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

-- Új, szigorú UPDATE szabály: kizárólag a partner kapcsolattartója vagy platform szerkesztő/admin
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

-- Admin beszúrási és törlési szabályok
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

-- Nyilvános olvasási policy megerősítése
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

-- ============================================================================
-- 3. PARTNER_USERS TÁBLA RLS VÉDELME ÉS DINAMIKUS TISZTÍTÁS (P0-2 JAVÍTÁSA)
-- ============================================================================

-- RLS kényszerítése
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users FORCE ROW LEVEL SECURITY;

-- Minden korábbi vagy nyitott policy dinamikus törlése a partner_users tábláról
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

-- 3.1. SELECT szabály:
-- - Saját sora (App, Header, Felhasználói profil, Karrier modul)
-- - Partner/Iskola adminisztrátora (Oktatók listája a TeacherDashboard felületen)
-- - Platform szerkesztő/adminisztrátor (AdminPartnersPage teljes lista)
CREATE POLICY "Authenticated read partner_users"
ON public.partner_users
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_partner_admin(partner_id)
  OR public.is_editor_role()
);

-- 3.2. INSERT szabály:
CREATE POLICY "Partner admins insert partner_users"
ON public.partner_users
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_partner_admin(partner_id) OR public.is_editor_role()
);

-- 3.3. UPDATE szabály:
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

-- 3.4. DELETE szabály (pl. oktató eltávolítása az iskolából):
CREATE POLICY "Partner admins delete partner_users"
ON public.partner_users
FOR DELETE
TO authenticated
USING (
  public.is_partner_admin(partner_id) OR public.is_editor_role()
);

COMMIT;
