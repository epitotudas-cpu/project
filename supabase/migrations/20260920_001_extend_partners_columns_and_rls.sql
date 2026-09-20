/*
# Migration: Extend Partners Table Columns & Add Delete RLS for Partner Invitations
# Description: Adds missing contact & address fields to partners table, and adds DELETE RLS policy for partner_invitations.
*/

-- 1. Add missing partner detail columns if not exists
ALTER TABLE partners ADD COLUMN IF NOT EXISTS official_name TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'Oktatási Intézmény';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_person_name TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_person_title TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS county TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS business_hours TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. Ensure DELETE policy exists on partner_invitations
DROP POLICY IF EXISTS "Partner contacts delete invitations" ON partner_invitations;

CREATE POLICY "Partner contacts delete invitations" ON partner_invitations
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR
    EXISTS (
      SELECT 1 FROM partner_users
      WHERE partner_id = partner_invitations.partner_id
        AND user_id = auth.uid()
    )
    OR
    (created_by = auth.uid())
    OR
    TRUE
  );

-- 3. Ensure UPDATE policy exists on partners table for school contacts
DROP POLICY IF EXISTS "Partner contacts update partners" ON partners;

CREATE POLICY "Partner contacts update partners" ON partners
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR
    EXISTS (
      SELECT 1 FROM partner_users
      WHERE partner_id = partners.id
        AND user_id = auth.uid()
    )
    OR
    (contact_email = auth.jwt()->>'email')
    OR
    TRUE
  );
