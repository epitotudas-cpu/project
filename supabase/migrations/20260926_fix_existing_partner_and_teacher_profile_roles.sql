/*
# Migration: Synchronize existing partner_users members to profiles.role

## Purpose
Updates existing profiles table role column for all members in partner_users table:
1. member_role = 'instructor' -> role = 'teacher'
2. member_role = 'owner' AND partner category = 'iskola' -> role = 'school'
3. member_role = 'owner' AND partner category <> 'iskola' -> role = 'partner'
4. member_role IN ('member', 'admin') -> role = 'contact'
*/

-- 1. Sync instructors -> 'teacher'
UPDATE profiles p
SET role = 'teacher', updated_at = now()
FROM partner_users pu
WHERE p.id = pu.user_id
  AND pu.member_role = 'instructor'
  AND p.role IN ('user', 'student');

-- 2. Sync school owners -> 'school'
UPDATE profiles p
SET role = 'school', updated_at = now()
FROM partner_users pu
JOIN partners pt ON pt.id = pu.partner_id
WHERE p.id = pu.user_id
  AND pu.member_role = 'owner'
  AND pt.category = 'iskola'
  AND p.role IN ('user', 'student');

-- 3. Sync partner owners -> 'partner'
UPDATE profiles p
SET role = 'partner', updated_at = now()
FROM partner_users pu
JOIN partners pt ON pt.id = pu.partner_id
WHERE p.id = pu.user_id
  AND pu.member_role = 'owner'
  AND pt.category <> 'iskola'
  AND p.role IN ('user', 'student');

-- 4. Sync partner members & admins -> 'contact'
UPDATE profiles p
SET role = 'contact', updated_at = now()
FROM partner_users pu
JOIN partners pt ON pt.id = pu.partner_id
WHERE p.id = pu.user_id
  AND pu.member_role IN ('member', 'admin')
  AND p.role IN ('user', 'student');
