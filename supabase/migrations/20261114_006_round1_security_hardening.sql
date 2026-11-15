-- =============================================================================
-- Round 1 Security Hardening:
-- 1. Restrict accept_partner_contract to owner/admin/partner_admin & verify JWT email
-- 2. Restrict partner-references storage bucket writes to owning partners/intents/editors
-- 3. Block non-http(s) website_url schemes at the database layer (NOT VALID for legacy safety)
-- =============================================================================

-- 1. Harden public.accept_partner_contract
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
  v_jwt_email TEXT;
  v_is_admin BOOLEAN := FALSE;
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

  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = v_uid AND p.role = 'admin'
  ) INTO v_is_admin;

  v_jwt_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  IF NOT v_is_admin AND v_jwt_email <> '' AND lower(trim(p_accepted_email)) <> v_jwt_email THEN
    RAISE EXCEPTION 'Az elfogadó e-mail-címének meg kell egyeznie a bejelentkezett fiók e-mail-címével.';
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
    v_is_admin
    OR EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id::text = v_contract.partner_id
        AND pu.user_id = v_uid
        AND pu.member_role IN ('owner', 'admin', 'partner_admin')
    )
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Csak a partner tulajdonosa vagy adminisztrátora fogadhatja el a szerződést.';
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

-- 2. Restrict partner-references Storage bucket writes to owning partner / active intent / editor
DROP POLICY IF EXISTS "Partner references authenticated insert" ON storage.objects;
CREATE POLICY "Partner references authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-references'
  AND (
    public.is_editor_role()
    OR (
      (storage.foldername(name))[1] = 'partners'
      AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.is_partner_contact(((storage.foldername(name))[2])::uuid)
    )
    OR (
      name LIKE 'staging/uploads/%.tmp'
      AND EXISTS (
        SELECT 1 FROM public.reference_upload_intents rui
        WHERE ('staging/uploads/' || rui.id::text || '.tmp') = name
          AND rui.expires_at > now()
          AND (
            rui.user_id = auth.uid()
            OR public.is_partner_contact(rui.partner_id)
          )
      )
    )
  )
);

DROP POLICY IF EXISTS "Partner references authenticated update" ON storage.objects;
CREATE POLICY "Partner references authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-references'
  AND (
    public.is_editor_role()
    OR (
      (storage.foldername(name))[1] = 'partners'
      AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.is_partner_contact(((storage.foldername(name))[2])::uuid)
    )
    OR (
      name LIKE 'staging/uploads/%.tmp'
      AND EXISTS (
        SELECT 1 FROM public.reference_upload_intents rui
        WHERE ('staging/uploads/' || rui.id::text || '.tmp') = name
          AND rui.expires_at > now()
          AND (
            rui.user_id = auth.uid()
            OR public.is_partner_contact(rui.partner_id)
          )
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'partner-references'
  AND (
    public.is_editor_role()
    OR (
      (storage.foldername(name))[1] = 'partners'
      AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.is_partner_contact(((storage.foldername(name))[2])::uuid)
    )
    OR (
      name LIKE 'staging/uploads/%.tmp'
      AND EXISTS (
        SELECT 1 FROM public.reference_upload_intents rui
        WHERE ('staging/uploads/' || rui.id::text || '.tmp') = name
          AND rui.expires_at > now()
          AND (
            rui.user_id = auth.uid()
            OR public.is_partner_contact(rui.partner_id)
          )
      )
    )
  )
);

-- 3. Enforce http(s) scheme on new/updated website_url values (NOT VALID preserves legacy rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_partner_applications_website_url_http'
  ) THEN
    ALTER TABLE public.partner_applications
      ADD CONSTRAINT chk_partner_applications_website_url_http
      CHECK (website_url IS NULL OR btrim(website_url) = '' OR website_url ~* '^https?://') NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_partners_website_url_http'
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT chk_partners_website_url_http
      CHECK (website_url IS NULL OR btrim(website_url) = '' OR website_url ~* '^https?://') NOT VALID;
  END IF;
END $$;

