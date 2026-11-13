/*
# Additive Migration: P1 Partner Offers Table & RLS Policies

## Purpose
Persists partner promotional offers (`partner_offers`) in Supabase instead of
client-side mock state, allowing partners to create, update, pause, and delete
their offers and visitors to view active offers on public partner detail pages.
*/

CREATE TABLE IF NOT EXISTS public.partner_offers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title       text NOT NULL,
  discount    text NOT NULL DEFAULT 'Kiemelt ajánlat',
  description text NOT NULL DEFAULT '',
  valid_until text NOT NULL DEFAULT 'Visszavonásig',
  status      text NOT NULL DEFAULT 'Aktív' CHECK (status IN ('Aktív', 'Szüneteltetve', 'Lejárt')),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_offers_partner_id
  ON public.partner_offers (partner_id, created_at DESC);

ALTER TABLE public.partner_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active partner offers" ON public.partner_offers;
CREATE POLICY "Public read active partner offers"
ON public.partner_offers
FOR SELECT
TO anon, authenticated
USING (
  status = 'Aktív'
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

DROP POLICY IF EXISTS "Partners manage own offers" ON public.partner_offers;
CREATE POLICY "Partners manage own offers"
ON public.partner_offers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.partner_users pu
    WHERE pu.partner_id = partner_offers.partner_id
      AND pu.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
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

