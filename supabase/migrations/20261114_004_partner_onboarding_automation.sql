-- Partner Onboarding Automation tracking columns & indexes
-- Safely extends partner_applications to link provisioned partner & invitation records

ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES public.partner_invitations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_partner_applications_status_created
  ON public.partner_applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_invitations_email_status
  ON public.partner_invitations (LOWER(email), status);

