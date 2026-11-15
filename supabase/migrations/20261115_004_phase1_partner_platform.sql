/*
# Phase 1: Hybrid Partner Platform Completion (P0 + P1 + P2 + Security Hygiene)

## Purpose
1. P0 `partners` schema parity:
   - `certificates` (jsonb) for partner certifications
   - `status` (`draft` | `published` | `inactive`) for partner lifecycle / archiving
   - `is_featured` (boolean) for featured partner highlighting
2. P1/P2 `partner_offers` enhancements:
   - `expires_at` (date) for machine-readable offer expiration
   - `views` (integer) for offer view tracking
   - `material_id` (text) for optional linkage to a partner product/material
   - Public RLS policy updated to hide expired offers (`expires_at < CURRENT_DATE`) from non-owners
   - `increment_offer_views(p_offer_id uuid)` SECURITY DEFINER RPC
3. Security hygiene:
   - `REVOKE ALL ... FROM PUBLIC, anon` on reference upload/publish RPCs
   - Harden `increment_partner_views(uuid)` with `SET search_path = public, pg_temp`
*/

-- 1. P0: partners table columns
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS certificates jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'partners_status_check'
      AND conrelid = 'public.partners'::regclass
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT partners_status_check
      CHECK (status IN ('draft', 'published', 'inactive'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_partners_status_featured
  ON public.partners (status, is_featured DESC, name ASC);

-- 2. P1/P2: partner_offers enhancements
ALTER TABLE public.partner_offers
  ADD COLUMN IF NOT EXISTS expires_at date,
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS material_id text;

CREATE INDEX IF NOT EXISTS idx_partner_offers_expires_at
  ON public.partner_offers (expires_at)
  WHERE expires_at IS NOT NULL;

DROP POLICY IF EXISTS "Public read active partner offers" ON public.partner_offers;
CREATE POLICY "Public read active partner offers"
ON public.partner_offers
FOR SELECT
TO anon, authenticated
USING (
  (
    status = 'Aktív'
    AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
  )
  OR EXISTS (
    SELECT 1 FROM public.partner_users pu
    WHERE pu.partner_id = partner_offers.partner_id
      AND pu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'editor')
  )
);

CREATE OR REPLACE FUNCTION public.increment_offer_views(p_offer_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_views integer;
BEGIN
  UPDATE public.partner_offers
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_offer_id
    AND status = 'Aktív'
    AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
  RETURNING views INTO v_new_views;

  RETURN COALESCE(v_new_views, 0);
END;
$$;

ALTER FUNCTION public.increment_offer_views(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.increment_offer_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_offer_views(uuid) TO anon, authenticated;

-- 3. Security hygiene: harden search_path on increment_partner_views & revoke anon on reference RPCs
CREATE OR REPLACE FUNCTION public.increment_partner_views(p_partner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_views integer;
BEGIN
  UPDATE public.partners
  SET profile_views = COALESCE(profile_views, 0) + 1
  WHERE id = p_partner_id
  RETURNING profile_views INTO v_new_views;

  RETURN COALESCE(v_new_views, 0);
END;
$$;

ALTER FUNCTION public.increment_partner_views(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.increment_partner_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_partner_views(uuid) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.publish_partner_reference(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_partner_reference(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_reference_upload_intent(uuid, uuid, bigint, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_reference_upload_intent(uuid, uuid, bigint, text, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_reference_image(uuid, text, integer, integer, bigint, boolean) TO authenticated, service_role;
