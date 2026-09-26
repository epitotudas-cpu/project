/*
# Migration: Add 'teacher' and 'school' roles to profiles table constraint and sync RPCs

## Purpose
1. Allows 'teacher' and 'school' values in profiles.role CHECK constraint.
2. Updates update_user_platform_role RPC to accept 'teacher' and 'school' roles.
3. Updates accept_partner_invitation RPC to set profiles.role = 'teacher' for instructors.
4. Migrates existing instructor users in partner_users so their profiles.role is updated from 'user' to 'teacher'.
*/

-- 1. Drop and re-add profiles_role_check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['user'::text, 'editor'::text, 'partner'::text, 'school'::text, 'teacher'::text, 'admin'::text]));

-- 2. Update update_user_platform_role RPC
CREATE OR REPLACE FUNCTION update_user_platform_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Kizárólag Adminisztrátor módosíthatja a platform szerepköröket.';
  END IF;

  IF new_role NOT IN ('user', 'editor', 'partner', 'school', 'teacher', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Érvénytelen szerepkör: %', new_role;
  END IF;

  UPDATE profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'role', new_role);
END;
$$;

-- 3. Update accept_partner_invitation to synchronize profiles.role
CREATE OR REPLACE FUNCTION accept_partner_invitation(invite_code TEXT, org_payload JSONB DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  inv RECORD;
  target_partner_id UUID;
  target_partner_cat TEXT;
  existing_count INT;
  assigned_role TEXT;
  new_partner_name TEXT;
  new_partner_slug TEXT;
  new_partner_cat TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs bejelentkezett munkamenet.';
  END IF;

  SELECT email INTO current_user_email FROM profiles WHERE id = current_user_id;
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'Felhasználói profil nem található.';
  END IF;

  SELECT pi.* INTO inv FROM partner_invitations pi
  WHERE pi.code = invite_code
    AND pi.status = 'active'
    AND pi.used_at IS NULL
    AND pi.expires_at > now()
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A megadott meghívókód érvénytelen, lejárt vagy már felhasználták.';
  END IF;

  IF LOWER(TRIM(inv.email)) <> LOWER(TRIM(current_user_email)) THEN
    RAISE EXCEPTION 'A meghívó a(z) % e-mail címre szól. Kérjük, azzal a fiókkal jelentkezzen be!', inv.email;
  END IF;

  target_partner_id := inv.partner_id;

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

  SELECT COUNT(*) INTO existing_count FROM partner_users WHERE partner_id = target_partner_id;
  SELECT category INTO target_partner_cat FROM partners WHERE id = target_partner_id;

  IF existing_count = 0 THEN
    assigned_role := 'owner';
  ELSE
    IF target_partner_cat = 'iskola' OR inv.organization_category = 'iskola' THEN
      assigned_role := 'instructor';
    ELSE
      assigned_role := 'member';
    END IF;
  END IF;

  UPDATE partner_invitations
  SET status = 'used',
      used_at = now(),
      used_by_user_id = current_user_id,
      partner_id = target_partner_id
  WHERE id = inv.id;

  INSERT INTO partner_users (partner_id, user_id, member_role, created_at)
  VALUES (target_partner_id, current_user_id, assigned_role, now())
  ON CONFLICT (partner_id, user_id) DO UPDATE SET member_role = EXCLUDED.member_role;

  -- Synchronize profiles.role for instructors and partners
  IF assigned_role = 'instructor' THEN
    UPDATE profiles SET role = 'teacher', updated_at = now() WHERE id = current_user_id AND role = 'user';
  ELSIF assigned_role = 'owner' AND target_partner_cat = 'iskola' THEN
    UPDATE profiles SET role = 'school', updated_at = now() WHERE id = current_user_id AND role = 'user';
  ELSIF assigned_role IN ('owner', 'admin') THEN
    UPDATE profiles SET role = 'partner', updated_at = now() WHERE id = current_user_id AND role = 'user';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'partner_id', target_partner_id,
    'assigned_role', assigned_role,
    'message', 'Meghívás sikeresen elfogadva.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update existing profiles for instructors
UPDATE profiles p
SET role = 'teacher', updated_at = now()
FROM partner_users pu
WHERE p.id = pu.user_id
  AND pu.member_role = 'instructor'
  AND p.role = 'user';
