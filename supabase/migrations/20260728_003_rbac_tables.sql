/*
# Additive Migration: Granular RBAC System (roles, permissions, role_permissions)

## Purpose
Adds scalable Role-Based Access Control (RBAC) tables without breaking existing
`profiles.role` column ('admin' | 'editor' | 'user').
This is an ADDITIVE migration.

## 1. Tables
- `roles`: System and custom roles (id, name, slug, description, is_system)
- `permissions`: Fine-grained module & action capabilities (id, module, action, description)
- `role_permissions`: Join table mapping roles to permissions (role_id, permission_id)

## 2. Foreign Key on Profiles (Additive)
- Add optional `role_id` column to `profiles` referencing `roles(id)`.
- Existing `profiles.role` column is PRESERVED for backward compatibility.
*/

CREATE TABLE IF NOT EXISTS roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module      text NOT NULL,
  action      text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_module_action UNIQUE (module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- Add role_id to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role_id uuid REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Public read for roles and permissions
DROP POLICY IF EXISTS "Public read roles" ON roles;
CREATE POLICY "Public read roles" ON roles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read permissions" ON permissions;
CREATE POLICY "Public read permissions" ON permissions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read role_permissions" ON role_permissions;
CREATE POLICY "Public read role_permissions" ON role_permissions FOR SELECT TO anon, authenticated USING (true);

-- Insert Default Roles idempotently
INSERT INTO roles (name, slug, description, is_system)
VALUES
  ('Adminisztrátor', 'admin', 'Teljes platformkezelési jogosultság', true),
  ('Szerkesztő', 'editor', 'Tartalomkezelő és módosító jogosultság', true),
  ('Moderátor', 'moderator', 'Tartalom-ellenőrzési és jóváhagyási jogosultság', true),
  ('Partner', 'partner', 'Céges / intézményi partner jogosultság', false),
  ('Iskola', 'iskola', 'Oktatási intézményi partner jogosultság', false),
  ('Szakember', 'szakember', 'Minősített építőipari szakember', false),
  ('Tanuló', 'tanulo', 'Diák / pályakezdő regisztrált felhasználó', false)
ON CONFLICT (slug) DO NOTHING;
