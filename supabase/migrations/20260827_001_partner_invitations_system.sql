/*
# Additive Migration: Partner Invitations System

## Purpose
Adds a secure invitation table for Partner/Iskola organizations, with 2 hardened SECURITY DEFINER RPC functions:
1. `get_partner_invitation_info(invite_code)`: Public/authenticated pre-validation (privacy-hardened, does not expose email).
2. `accept_partner_invitation(invite_code)`: Server-side transactional acceptance & partner_users insertion with owner/member logic.

## 1. Tables & RLS
- `partner_invitations`: Secure invitations (id, partner_id, email, code, created_by, expires_at, status, used_at, used_by_user_id, created_at)
*/

CREATE TABLE IF NOT EXISTS partner_invitations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  email            text NOT NULL,
  code             text UNIQUE NOT NULL,
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at       timestamptz NOT NULL,
  status           text NOT NULL DEFAULT 'active', -- 'active' | 'used' | 'revoked' | 'expired'
  used_at          timestamptz,
  used_by_user_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE partner_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin read all invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Admin insert invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Admin update invitations" ON partner_invitations;

-- RLS Policies: Only Admin/Editor can manage invitations directly
CREATE POLICY "Admin read all invitations" ON partner_invitations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "Admin insert invitations" ON partner_invitations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "Admin update invitations" ON partner_invitations
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

-- RPC 1: Public/Authenticated Invitation Lookup (Privacy-Hardened, No Email Enumeration)
CREATE OR REPLACE FUNCTION get_partner_invitation_info(invite_code TEXT)
RETURNS jsonb AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT pi.code, pi.expires_at, p.name as partner_name, p.category as partner_category
  INTO inv
  FROM partner_invitations pi
  JOIN partners p ON p.id = pi.partner_id
  WHERE pi.code = invite_code
    AND pi.status = 'active'
    AND pi.used_at IS NULL
    AND pi.expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Érvénytelen, lejárt vagy már felhasznált meghívókód.');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', inv.code,
    'partner_name', inv.partner_name,
    'partner_category', inv.partner_category,
    'expires_at', inv.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC 2: Server-side Transactional Acceptance of Invitation (Owner/Member Logic & Race Condition Guarded)
CREATE OR REPLACE FUNCTION accept_partner_invitation(invite_code TEXT)
RETURNS jsonb AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  inv RECORD;
  existing_count INT;
  assigned_role TEXT;
BEGIN
  -- 1. Security Check: Authenticated User
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs bejelentkezett munkamenet.';
  END IF;

  -- 2. Fetch authenticated user email
  SELECT email INTO current_user_email FROM profiles WHERE id = current_user_id;
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'Felhasználói profil nem található.';
  END IF;

  -- 3. Lock & Fetch invitation with FOR UPDATE to prevent race conditions
  SELECT pi.* INTO inv FROM partner_invitations pi
  WHERE pi.code = invite_code
    AND pi.status = 'active'
    AND pi.used_at IS NULL
    AND pi.expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A megadott meghívókód érvénytelen, lejárt vagy már felhasználták.';
  END IF;

  -- 4. Email Matching (Case-Insensitive)
  IF LOWER(TRIM(inv.email)) <> LOWER(TRIM(current_user_email)) THEN
    RAISE EXCEPTION 'A meghívó a(z) % e-mail címre szól. Kérjük, azzal a fiókkal jelentkezzen be!', inv.email;
  END IF;

  -- 5. Check if partner organization exists
  IF NOT EXISTS (SELECT 1 FROM partners WHERE id = inv.partner_id) THEN
    RAISE EXCEPTION 'A megadott partner szervezet nem található.';
  END IF;

  -- 6. Check if user is already linked to this partner
  IF EXISTS (SELECT 1 FROM partner_users WHERE partner_id = inv.partner_id AND user_id = current_user_id) THEN
    UPDATE partner_invitations
    SET status = 'used', used_at = now(), used_by_user_id = current_user_id
    WHERE id = inv.id;

    RETURN jsonb_build_object('success', true, 'message', 'Már tagja ennek a szervezetnek.');
  END IF;

  -- 7. Determine member_role: 'owner' if first user for this partner, 'member' otherwise
  SELECT COUNT(*) INTO existing_count FROM partner_users WHERE partner_id = inv.partner_id;
  IF existing_count = 0 THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'member';
  END IF;

  -- 8. Atomic Update & Insert
  UPDATE partner_invitations
  SET status = 'used',
      used_at = now(),
      used_by_user_id = current_user_id
  WHERE id = inv.id;

  INSERT INTO partner_users (partner_id, user_id, member_role, created_at)
  VALUES (inv.partner_id, current_user_id, assigned_role, now());

  RETURN jsonb_build_object(
    'success', true,
    'partner_id', inv.partner_id,
    'assigned_role', assigned_role,
    'message', 'Sikeres csatlakozás a szervezetükhöz!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
