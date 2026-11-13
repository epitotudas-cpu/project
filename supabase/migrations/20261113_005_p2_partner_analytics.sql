/*
# Additive Migration: P2 Partner Analytics Counters & Safe View Increment RPC

## Purpose
Adds `profile_views` to `public.partners` and provides an atomic `SECURITY DEFINER`
RPC `increment_partner_views(p_partner_id)` so public visitors increment partner
profile view counts without needing direct `UPDATE` permissions on `partners`.
*/

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS profile_views integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_partner_views(p_partner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

REVOKE ALL ON FUNCTION public.increment_partner_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_partner_views(uuid) TO anon, authenticated;

