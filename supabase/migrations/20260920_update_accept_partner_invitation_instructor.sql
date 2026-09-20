/*
# Migration: Update accept_partner_invitation to assign 'instructor' role for school invitations

## Purpose
Ensures that when a user accepts an invitation to a school organization (`category = 'iskola'`),
and the organization already has an owner (`existing_count > 0`), the new member receives
`member_role = 'instructor'` instead of falling back to `'member'`.
The first user creating/claiming the school still receives `member_role = 'owner'`.
*/

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

  -- Determine member_role: 'owner' if first user, 'instructor' if school, 'member' otherwise
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
  ON CONFLICT (partner_id, user_id) DO UPDATE SET member_role = EXCLUDED.member_role;

  RETURN jsonb_build_object(
    'success', true,
    'partner_id', target_partner_id,
    'assigned_role', assigned_role,
    'message', 'Sikeres csatlakozás a szervezetükhöz!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
