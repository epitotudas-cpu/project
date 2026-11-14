-- ============================================================================
-- Migration: 20261114_003_partner_contracts_and_acceptance_audit.sql
-- Purpose: Dedicated partner_contracts table + immutable contract_acceptance_logs
--          audit table + server-verified accept_partner_contract RPC.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partner_contracts (
  id TEXT PRIMARY KEY,
  contract_number TEXT NOT NULL,
  campaign_id TEXT,
  partner_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  campaign_title TEXT NOT NULL,
  placement_slot TEXT NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'tmpl-annual',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'pending_acceptance', 'accepted', 'declined', 'expired')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'HUF',
  content TEXT NOT NULL DEFAULT '',
  versions JSONB NOT NULL DEFAULT '[]'::jsonb,
  acceptance_log JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_contracts_partner_id
  ON public.partner_contracts (partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_contracts_status
  ON public.partner_contracts (status);

-- Append-only immutable acceptance audit log
CREATE TABLE IF NOT EXISTS public.contract_acceptance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id TEXT NOT NULL REFERENCES public.partner_contracts(id) ON DELETE CASCADE,
  partner_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  accepted_by TEXT NOT NULL,
  accepted_email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  content_sha256 TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_acceptance_logs_contract_id
  ON public.contract_acceptance_logs (contract_id);

ALTER TABLE public.partner_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_acceptance_logs ENABLE ROW LEVEL SECURITY;

-- partner_contracts RLS:
-- Admins have full control; partner members can view their own partner's contracts.
DROP POLICY IF EXISTS "Admins manage partner_contracts" ON public.partner_contracts;
CREATE POLICY "Admins manage partner_contracts"
  ON public.partner_contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Partners read own partner_contracts" ON public.partner_contracts;
CREATE POLICY "Partners read own partner_contracts"
  ON public.partner_contracts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id::text = partner_contracts.partner_id
        AND pu.user_id = auth.uid()
    )
  );

-- contract_acceptance_logs RLS:
-- Immutable: NO direct client INSERT, UPDATE, or DELETE policies.
-- Only admins or the partner's members / accepting user can SELECT.
DROP POLICY IF EXISTS "Admins and owners read contract_acceptance_logs" ON public.contract_acceptance_logs;
CREATE POLICY "Admins and owners read contract_acceptance_logs"
  ON public.contract_acceptance_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.partner_id::text = contract_acceptance_logs.partner_id
        AND pu.user_id = auth.uid()
    )
  );

-- Server-side RPC fallback for contract acceptance (when Edge Function is not invoked directly)
CREATE OR REPLACE FUNCTION public.accept_partner_contract(
  p_contract_id TEXT,
  p_accepted_by TEXT,
  p_accepted_email TEXT,
  p_content_sha256 TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_contract RECORD;
  v_is_authorized BOOLEAN := FALSE;
  v_headers JSON;
  v_ip TEXT;
  v_ua TEXT;
  v_now TIMESTAMPTZ := now();
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
    p_content_sha256,
    v_now
  );

  v_acceptance_log := jsonb_build_object(
    'acceptedBy', trim(p_accepted_by),
    'email', lower(trim(p_accepted_email)),
    'acceptedAt', v_now,
    'ipAddress', v_ip,
    'userId', v_uid::text,
    'userAgent', v_ua,
    'contentSha256', p_content_sha256,
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

