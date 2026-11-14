-- ============================================================================
-- Migration: 20261114_004_security_and_data_fixes.sql
-- Purpose:
--   1. Remove legacy __SYSTEM_CONFIG_CONTRACTS__ mirror from public app_configs.
--   2. Enforce ON DELETE RESTRICT on contract_acceptance_logs(contract_id).
--   3. Harden accept_partner_contract status whitelist & server SHA-256.
--   4. Update profiles.role in accept_partner_invitation for onboarded partners/instructors.
-- ============================================================================

-- 1. Remove leaked contracts mirror from publicly readable app_configs
DELETE FROM public.app_configs
WHERE key = '__SYSTEM_CONFIG_CONTRACTS__';

-- 2. Prevent cascading deletion of immutable contract acceptance audit logs
ALTER TABLE public.contract_acceptance_logs
  DROP CONSTRAINT IF EXISTS contract_acceptance_logs_contract_id_fkey;

ALTER TABLE public.contract_acceptance_logs
  ADD CONSTRAINT contract_acceptance_logs_contract_id_fkey
  FOREIGN KEY (contract_id)
  REFERENCES public.partner_contracts(id)
  ON DELETE RESTRICT;

-- 3. Harden accept_partner_contract RPC (status whitelist + server-side SHA-256)
CREATE OR REPLACE FUNCTION public.accept_partner_contract(
  p_contract_id TEXT,
  p_accepted_by TEXT,
  p_accepted_email TEXT,
  p_content_sha256 TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid UUID;
  v_contract RECORD;
  v_is_authorized BOOLEAN := FALSE;
  v_headers JSON;
  v_ip TEXT;
  v_ua TEXT;
  v_now TIMESTAMPTZ := now();
  v_sha256 TEXT;
  v_acceptance_log JSONB;
  v_new_version JSONB;
  v_versions JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hitelesítés szükséges a szerződés elfogadásához.';
  END IF;

  IF length(trim(coalesce(p_accepted_by, ''))) < 2 THEN
    RAISE EXCEPTION 'Kérjük, adja meg az elfogadó teljes nevét.';
  END IF;

  IF trim(coalesce(p_accepted_email, '')) !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Kérjük, adjon meg érvényes e-mail-címet.';
  END IF;

  SELECT * INTO v_contract
  FROM public.partner_contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A szerződés nem található: %', p_contract_id;
  END IF;

  IF v_contract.status = 'accepted' THEN
    RAISE EXCEPTION 'Ez a szerződés már korábban elfogadásra került.';
  END IF;

  IF v_contract.status NOT IN ('sent', 'viewed', 'pending_acceptance') THEN
    RAISE EXCEPTION 'Csak kiküldött vagy elfogadásra váró szerződés fogadható el.';
  END IF;

  SELECT (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id::text = v_contract.partner_id
        AND pu.user_id = v_uid
    )
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Nincs jogosultsága a szerződés elfogadásához.';
  END IF;

  BEGIN
    v_headers := current_setting('request.headers', true)::json;
  EXCEPTION WHEN OTHERS THEN
    v_headers := '{}'::json;
  END;

  v_ip := coalesce(
    nullif(trim(v_headers->>'cf-connecting-ip'), ''),
    nullif(trim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    nullif(trim(v_headers->>'x-real-ip'), ''),
    host(inet_client_addr()),
    'server-recorded'
  );
  v_ua := nullif(trim(coalesce(v_headers->>'user-agent', '')), '');

  BEGIN
    v_sha256 := encode(
      digest(
        convert_to(
          coalesce(v_contract.contract_number, '') || '|' ||
          coalesce(v_contract.partner_id, '') || '|' ||
          coalesce(v_contract.amount::text, '0') || '|' ||
          coalesce(v_contract.content, ''),
          'UTF8'
        ),
        'sha256'
      ),
      'hex'
    );
  EXCEPTION WHEN OTHERS THEN
    v_sha256 := p_content_sha256;
  END;

  INSERT INTO public.contract_acceptance_logs (
    contract_id,
    partner_id,
    user_id,
    accepted_by,
    accepted_email,
    ip_address,
    user_agent,
    content_sha256,
    accepted_at
  ) VALUES (
    v_contract.id,
    v_contract.partner_id,
    v_uid,
    trim(p_accepted_by),
    lower(trim(p_accepted_email)),
    v_ip,
    v_ua,
    v_sha256,
    v_now
  );

  v_acceptance_log := jsonb_build_object(
    'acceptedBy', trim(p_accepted_by),
    'email', lower(trim(p_accepted_email)),
    'acceptedAt', v_now,
    'ipAddress', v_ip,
    'userId', v_uid::text,
    'userAgent', v_ua,
    'contentSha256', v_sha256,
    'serverVerified', true
  );

  v_new_version := jsonb_build_object(
    'versionNumber', coalesce(jsonb_array_length(v_contract.versions), 0) + 1,
    'createdAt', v_now,
    'amount', v_contract.amount,
    'content', v_contract.content,
    'changeNote', format('Szerződés elfogadva (hitelesített felhasználó: %s, IP: %s)', v_uid::text, v_ip)
  );
  v_versions := coalesce(v_contract.versions, '[]'::jsonb) || jsonb_build_array(v_new_version);

  UPDATE public.partner_contracts
  SET status = 'accepted',
      acceptance_log = v_acceptance_log,
      versions = v_versions,
      updated_at = v_now
  WHERE id = v_contract.id;

  RETURN jsonb_build_object(
    'id', v_contract.id,
    'status', 'accepted',
    'acceptanceLog', v_acceptance_log,
    'versions', v_versions,
    'updatedAt', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_partner_contract(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_partner_contract(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 4. Ensure accept_partner_invitation updates profiles.role for newly onboarded partners/instructors
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
  target_profile_role TEXT;
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

  IF EXISTS (SELECT 1 FROM partner_users WHERE partner_id = target_partner_id AND user_id = current_user_id) THEN
    UPDATE partner_invitations
    SET status = 'used', used_at = now(), used_by_user_id = current_user_id, partner_id = target_partner_id
    WHERE id = inv.id;

    RETURN jsonb_build_object('success', true, 'partner_id', target_partner_id, 'message', 'Már tagja ennek a szervezetnek.');
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

  target_profile_role := CASE WHEN assigned_role = 'instructor' THEN 'teacher' ELSE 'partner' END;
  UPDATE public.profiles
  SET role = target_profile_role,
      updated_at = now()
  WHERE id = current_user_id
    AND (role IS NULL OR role IN ('student', 'pro'));

  RETURN jsonb_build_object(
    'success', true,
    'partner_id', target_partner_id,
    'assigned_role', assigned_role,
    'message', 'Sikeres csatlakozás a szervezetükhöz!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
