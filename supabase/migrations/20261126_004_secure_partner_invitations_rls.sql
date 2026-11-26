-- ============================================================================
-- P0 Security Fix 2/3: Harden RLS & grants on public.partner_invitations
--
-- Fixes confirmed production issues:
-- 1. Removes `OR true` from "Partner contacts read invitations" (SELECT) and
--    "Partner contacts delete invitations" (DELETE).
-- 2. Removes the `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())` bypass
--    from "Partner contacts insert invitations" (INSERT).
-- 3. Drops redundant/legacy policies ("Admin delete invitations", etc.) and
--    replaces them with clean per-operation policies.
-- 4. Preserves:
--    - Invitee email-based SELECT for auto-accept (AuthContext & App.tsx)
--      strictly scoped to active, non-expired rows matching auth.jwt()->>'email'.
--    - Partner/school contact SELECT (`is_partner_contact(partner_id)`).
--    - Partner/school admin INSERT/UPDATE/DELETE (`is_partner_admin(partner_id)`),
--      matching `create_partner_invitation` RPC and blocking cross-partner moves.
--    - Admin/editor (`is_editor_role()`) full management.
-- 5. Revokes all direct table privileges from `PUBLIC` and `anon`, and revokes
--    `TRUNCATE`, `TRIGGER`, `REFERENCES` from `authenticated` (leaving
--    `service_role`, `postgres`, and `get_partner_invitation_info` RPC intact).
-- 6. Does NOT enable FORCE ROW LEVEL SECURITY so `get_partner_invitation_info`
--    (SECURITY DEFINER owned by postgres) continues working for `anon`.
-- ============================================================================

BEGIN;

ALTER TABLE public.partner_invitations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.partner_invitations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.partner_invitations TO authenticated;

DROP POLICY IF EXISTS "Admin read all invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Admin insert invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Admin update invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Admin delete invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Partner contacts read invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Partner contacts insert invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Partner contacts update invitations" ON public.partner_invitations;
DROP POLICY IF EXISTS "Partner contacts delete invitations" ON public.partner_invitations;

CREATE POLICY "Partner contacts read invitations"
ON public.partner_invitations
FOR SELECT
TO authenticated
USING (
  public.is_editor_role()
  OR (
    partner_id IS NOT NULL
    AND public.is_partner_contact(partner_id)
  )
  OR (
    status = 'active'
    AND expires_at > now()
    AND lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', '')))
  )
);

CREATE POLICY "Partner contacts insert invitations"
ON public.partner_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_editor_role()
  OR (
    partner_id IS NOT NULL
    AND public.is_partner_admin(partner_id)
  )
);

CREATE POLICY "Partner contacts update invitations"
ON public.partner_invitations
FOR UPDATE
TO authenticated
USING (
  public.is_editor_role()
  OR (
    partner_id IS NOT NULL
    AND public.is_partner_admin(partner_id)
  )
)
WITH CHECK (
  public.is_editor_role()
  OR (
    partner_id IS NOT NULL
    AND public.is_partner_admin(partner_id)
    AND partner_id IS NOT DISTINCT FROM (
      SELECT pi.partner_id
      FROM public.partner_invitations pi
      WHERE pi.id = partner_invitations.id
    )
  )
);

CREATE POLICY "Partner contacts delete invitations"
ON public.partner_invitations
FOR DELETE
TO authenticated
USING (
  public.is_editor_role()
  OR (
    partner_id IS NOT NULL
    AND public.is_partner_admin(partner_id)
  )
);

COMMIT;
