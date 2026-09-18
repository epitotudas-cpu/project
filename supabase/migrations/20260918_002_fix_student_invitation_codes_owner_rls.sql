/*
# Fix RLS Policy for student_invitation_codes Insert to allow School Owners

1. Purpose:
   Allows School Owners (users with member_role = 'owner' in partner_users for the school)
   to generate student invitation codes for any instructor assigned to a trade in their school.

2. Security checks:
   A) Platform Admins & Editors can insert any code.
   B) Instructors can insert codes where created_by = auth.uid() AND instructor_id = auth.uid(),
      given (school_id, auth.uid(), trade_id) exists in partner_user_trades.
   C) School Owners can insert codes where created_by = auth.uid(),
      given auth.uid() is an owner in partner_users for school_id,
      AND (school_id, instructor_id, trade_id) exists in partner_user_trades.
*/

DROP POLICY IF EXISTS "Insert student_invitation_codes" ON student_invitation_codes;

CREATE POLICY "Insert student_invitation_codes" ON student_invitation_codes
  FOR INSERT TO authenticated
  WITH CHECK (
    -- A) Platform Admin and Editor
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
    -- B) Instructor creating code for themselves on their assigned trade
    OR (
      created_by = auth.uid()
      AND instructor_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM partner_user_trades put
        WHERE put.partner_id = student_invitation_codes.school_id
          AND put.user_id = auth.uid()
          AND put.trade_id = student_invitation_codes.trade_id
      )
    )
    -- C) School Owner creating code for an instructor in their school on the instructor's assigned trade
    OR (
      created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM partner_users pu
        WHERE pu.partner_id = student_invitation_codes.school_id
          AND pu.user_id = auth.uid()
          AND pu.member_role = 'owner'
      )
      AND EXISTS (
        SELECT 1 FROM partner_user_trades put
        WHERE put.partner_id = student_invitation_codes.school_id
          AND put.user_id = student_invitation_codes.instructor_id
          AND put.trade_id = student_invitation_codes.trade_id
      )
    )
  );
