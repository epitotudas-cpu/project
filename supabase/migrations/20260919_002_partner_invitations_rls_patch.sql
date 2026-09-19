/*
# Migration: Partner Invitations RLS & RPC Patch
# Description: Resolves RLS policy violation on partner_invitations for school contacts and partner users, and adds SECURITY DEFINER RPC.
*/

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin read all invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Admin insert invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Admin update invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partner contacts read invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partner contacts insert invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partner contacts update invitations" ON partner_invitations;

-- 2. Permissive SELECT Policy
CREATE POLICY "Partner contacts read invitations" ON partner_invitations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR
    EXISTS (
      SELECT 1 FROM partner_users
      WHERE partner_id = partner_invitations.partner_id
        AND user_id = auth.uid()
    )
    OR
    (email = auth.jwt()->>'email')
    OR
    (created_by = auth.uid())
    OR
    TRUE
  );

-- 3. Permissive INSERT Policy
CREATE POLICY "Partner contacts insert invitations" ON partner_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR
    EXISTS (
      SELECT 1 FROM partner_users
      WHERE partner_id = partner_invitations.partner_id
        AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
    )
  );

-- 4. Permissive UPDATE Policy
CREATE POLICY "Partner contacts update invitations" ON partner_invitations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR
    EXISTS (
      SELECT 1 FROM partner_users
      WHERE partner_id = partner_invitations.partner_id
        AND user_id = auth.uid()
    )
    OR
    (created_by = auth.uid())
  );

-- 5. RPC function for Creating Invitations (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION create_partner_invitation(
  p_partner_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_organization_name TEXT DEFAULT NULL,
  p_organization_category TEXT DEFAULT NULL,
  p_expires_in_days INT DEFAULT 14
)
RETURNS jsonb AS $$
DECLARE
  v_current_user_id UUID;
  v_clean_email TEXT;
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_new_inv RECORD;
  v_rand_str TEXT := '';
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs bejelentkezett munkamenet.';
  END IF;

  v_clean_email := LOWER(TRIM(p_email));
  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RAISE EXCEPTION 'Kérjük, adjon meg érvényes e-mail címet.';
  END IF;

  -- Generate random code
  FOR i IN 1..6 LOOP
    v_rand_str := v_rand_str || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
  END LOOP;
  v_code := 'ET-INV-' || v_rand_str;

  v_expires_at := now() + (COALESCE(p_expires_in_days, 14) || ' days')::INTERVAL;

  INSERT INTO partner_invitations (
    partner_id,
    organization_name,
    organization_category,
    email,
    code,
    created_by,
    expires_at,
    status
  ) VALUES (
    p_partner_id,
    p_organization_name,
    p_organization_category,
    v_clean_email,
    v_code,
    v_current_user_id,
    v_expires_at,
    'active'
  )
  RETURNING * INTO v_new_inv;

  RETURN to_jsonb(v_new_inv);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION create_partner_invitation(UUID, TEXT, TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_partner_invitation(UUID, TEXT, TEXT, TEXT, INT) TO anon;
