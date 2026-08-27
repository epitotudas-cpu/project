/*
# Migration: Partner Onboarding, Applications, and Admin Role Management

## Purpose
1. Makes `partner_id` nullable in `partner_invitations` to support inviting partners before creating a partner record.
2. Adds `organization_name` and `organization_category` to `partner_invitations`.
3. Creates `partner_applications` table for public partner applications.
4. Updates RPCs (`get_partner_invitation_info`, `accept_partner_invitation`) to handle uncreated partners dynamically.
5. Adds RPC `update_user_platform_role` for secure admin role assignment.
*/

-- 1. Modify partner_invitations to support pre-creation invitations
ALTER TABLE partner_invitations ALTER COLUMN partner_id DROP NOT NULL;
ALTER TABLE partner_invitations ADD COLUMN IF NOT EXISTS organization_name text;
ALTER TABLE partner_invitations ADD COLUMN IF NOT EXISTS organization_category text;

-- 2. Create partner_applications table
CREATE TABLE IF NOT EXISTS partner_applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     text NOT NULL,
  contact_name     text NOT NULL,
  email            text NOT NULL,
  phone            text,
  website_url      text,
  description      text,
  category         text NOT NULL, -- 'ceg' | 'gyarto' | 'kereskedo' | 'iskola' | 'oktato' | 'tamogato'
  status           text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on partner_applications
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert partner_applications" ON partner_applications;
DROP POLICY IF EXISTS "Admin manage partner_applications" ON partner_applications;

-- Public can submit applications
CREATE POLICY "Public insert partner_applications" ON partner_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Admins can read, update, and delete applications
CREATE POLICY "Admin manage partner_applications" ON partner_applications
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

-- 3. Updated RPC 1: get_partner_invitation_info
CREATE OR REPLACE FUNCTION get_partner_invitation_info(invite_code TEXT)
RETURNS jsonb AS $$
DECLARE
  inv RECORD;
  p_name TEXT;
  p_cat TEXT;
BEGIN
  SELECT pi.code, pi.expires_at, pi.partner_id, pi.organization_name, pi.organization_category, p.name as partner_name, p.category as partner_category
  INTO inv
  FROM partner_invitations pi
  LEFT JOIN partners p ON p.id = pi.partner_id
  WHERE pi.code = invite_code
    AND pi.status = 'active'
    AND pi.used_at IS NULL
    AND pi.expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Érvénytelen, lejárt vagy már felhasznált meghívókód.');
  END IF;

  p_name := COALESCE(inv.partner_name, inv.organization_name, 'Szervezet');
  p_cat := COALESCE(inv.partner_category, inv.organization_category, 'ceg');

  RETURN jsonb_build_object(
    'valid', true,
    'code', inv.code,
    'partner_name', p_name,
    'partner_category', p_cat,
    'requires_organization_details', (inv.partner_id IS NULL),
    'expires_at', inv.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Updated RPC 2: accept_partner_invitation with uncreated partner creation
CREATE OR REPLACE FUNCTION accept_partner_invitation(invite_code TEXT, org_payload JSONB DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  inv RECORD;
  target_partner_id UUID;
  existing_count INT;
  assigned_role TEXT;
  new_partner_name TEXT;
  new_partner_slug TEXT;
  new_partner_cat TEXT;
BEGIN
  -- Security check: Authenticated caller
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs bejelentkezett munkamenet.';
  END IF;

  SELECT email INTO current_user_email FROM profiles WHERE id = current_user_id;
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'Felhasználói profil nem található.';
  END IF;

  -- Lock invitation row
  SELECT pi.* INTO inv FROM partner_invitations pi
  WHERE pi.code = invite_code
    AND pi.status = 'active'
    AND pi.used_at IS NULL
    AND pi.expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A megadott meghívókód érvénytelen, lejárt vagy már felhasználták.';
  END IF;

  -- Email check (case-insensitive)
  IF LOWER(TRIM(inv.email)) <> LOWER(TRIM(current_user_email)) THEN
    RAISE EXCEPTION 'A meghívó a(z) % e-mail címre szól. Kérjük, azzal a fiókkal jelentkezzen be!', inv.email;
  END IF;

  target_partner_id := inv.partner_id;

  -- If partner does not exist yet, create it on-the-fly from invitation metadata or payload
  IF target_partner_id IS NULL THEN
    new_partner_name := COALESCE(org_payload->>'name', inv.organization_name, 'Új Szervezet');
    new_partner_cat := COALESCE(org_payload->>'category', inv.organization_category, 'ceg');
    new_partner_slug := LOWER(REGEXP_REPLACE(new_partner_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 6);

    INSERT INTO partners (name, slug, category, description, website_url, is_verified)
    VALUES (
      new_partner_name,
      new_partner_slug,
      new_partner_cat,
      org_payload->>'description',
      org_payload->>'website_url',
      true
    )
    RETURNING id INTO target_partner_id;
  END IF;

  -- Check if user is already linked
  IF EXISTS (SELECT 1 FROM partner_users WHERE partner_id = target_partner_id AND user_id = current_user_id) THEN
    UPDATE partner_invitations
    SET status = 'used', used_at = now(), used_by_user_id = current_user_id, partner_id = target_partner_id
    WHERE id = inv.id;

    RETURN jsonb_build_object('success', true, 'partner_id', target_partner_id, 'message', 'Már tagja ennek a szervezetnek.');
  END IF;

  -- Determine member_role: owner if first user for this partner, member otherwise
  SELECT COUNT(*) INTO existing_count FROM partner_users WHERE partner_id = target_partner_id;
  IF existing_count = 0 THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'member';
  END IF;

  -- Update invitation
  UPDATE partner_invitations
  SET status = 'used',
      used_at = now(),
      used_by_user_id = current_user_id,
      partner_id = target_partner_id
  WHERE id = inv.id;

  -- Insert into partner_users
  INSERT INTO partner_users (partner_id, user_id, member_role, created_at)
  VALUES (target_partner_id, current_user_id, assigned_role, now())
  ON CONFLICT (partner_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'partner_id', target_partner_id,
    'assigned_role', assigned_role,
    'message', 'Sikeres csatlakozás a szervezetükhöz!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. RPC 3: Admin platform role management
CREATE OR REPLACE FUNCTION update_user_platform_role(target_user_id UUID, new_role TEXT)
RETURNS jsonb AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Kizárólag Adminisztrátor módosíthatja a platform szerepköröket.';
  END IF;

  IF new_role NOT IN ('user', 'editor', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Érvénytelen szerepkör: %', new_role;
  END IF;

  UPDATE profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'role', new_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
