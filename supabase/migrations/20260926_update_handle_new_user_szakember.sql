/*
# Migration: Update handle_new_user trigger function for szakember role mapping

## Purpose
Ensures that when a user registers with user_type = 'szakember', their profile role is assigned as 'user',
while user_type = 'tanulo' receives the 'student' role.
*/

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
  ELSIF (NEW.raw_user_meta_data->>'user_type') = 'szakember' THEN
    assigned_role := 'user';
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
