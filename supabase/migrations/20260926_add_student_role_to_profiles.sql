/*
# Migration: Add 'student' role to profiles table constraint and update handle_new_user trigger

## Purpose
1. Allows 'student' value in profiles.role CHECK constraint.
2. Updates update_user_platform_role RPC to accept 'student' role.
3. Updates handle_new_user trigger function to default new users to 'student' role.
4. Migrates existing profiles with role = 'user' to role = 'student'.
*/

-- 1. Drop and re-add profiles_role_check constraint with 'student'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['user'::text, 'editor'::text, 'partner'::text, 'school'::text, 'teacher'::text, 'contact'::text, 'student'::text, 'admin'::text]));

-- 2. Update update_user_platform_role RPC
CREATE OR REPLACE FUNCTION update_user_platform_role(target_user_id uuid, new_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Kizárólag Adminisztrátor módosíthatja a platform szerepköröket.';
  END IF;

  IF new_role NOT IN ('user', 'editor', 'partner', 'school', 'teacher', 'contact', 'student', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Érvénytelen szerepkör: %', new_role;
  END IF;

  UPDATE profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', target_user_id, 'role', new_role);
END;
$$;

-- 3. Update handle_new_user trigger function to default new signups to 'student'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_role text := 'student';
BEGIN
  IF (NEW.raw_user_meta_data->>'user_type') = 'teacher' OR (NEW.raw_user_meta_data->>'user_type') = 'oktato' THEN
    assigned_role := 'teacher';
  ELSIF (NEW.raw_user_meta_data->>'user_type') = 'iskola' THEN
    assigned_role := 'school';
  ELSIF (NEW.raw_user_meta_data->>'user_type') = 'partner' THEN
    assigned_role := 'contact';
  ELSIF (NEW.raw_user_meta_data->>'role') IS NOT NULL AND (NEW.raw_user_meta_data->>'role') IN ('admin', 'editor', 'partner', 'school', 'teacher', 'contact', 'student', 'user') THEN
    assigned_role := NEW.raw_user_meta_data->>'role';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Update existing profiles with role = 'user' to 'student'
UPDATE profiles
SET role = 'student', updated_at = now()
WHERE role = 'user';
