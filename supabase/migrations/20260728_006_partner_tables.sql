/*
# Additive Migration: Partner Ecosystem (partners, partner_users, contributors)

## Purpose
Adds partner organization profiles (Manufacturers, Retailers, Companies, Schools, Educational Centers, Sponsors)
and connects users/contributors to organizations.

## 1. Tables
- `partners`: Partner organization details (id, name, slug, category, logo_url, website_url, description, is_verified, created_at)
- `partner_users`: Join table for partner staff members (partner_id, user_id, member_role)
- `contributors`: Contributor profile metadata (user_id, partner_id, trust_score, verified)
*/

CREATE TABLE IF NOT EXISTS partners (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  category      text NOT NULL, -- 'gyarto' | 'kereskedo' | 'ceg' | 'iskola' | 'oktato' | 'tamogato'
  logo_url      text,
  website_url   text,
  description   text,
  is_verified   boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_users (
  partner_id   uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_role  text NOT NULL DEFAULT 'member', -- 'owner' | 'member'
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (partner_id, user_id)
);

CREATE TABLE IF NOT EXISTS contributors (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id   uuid REFERENCES partners(id) ON DELETE SET NULL,
  trust_score  integer NOT NULL DEFAULT 10,
  verified     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_contributor UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

-- Public read for partners
DROP POLICY IF EXISTS "Public read partners" ON partners;
CREATE POLICY "Public read partners" ON partners FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read partner_users" ON partner_users;
CREATE POLICY "Public read partner_users" ON partner_users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read contributors" ON contributors;
CREATE POLICY "Public read contributors" ON contributors FOR SELECT TO anon, authenticated USING (true);

-- Insert Default Sample Partners
INSERT INTO partners (name, slug, category, description, website_url)
VALUES
  ('Leier Hungária Kft.', 'leier-hungaria', 'gyarto', 'Építőanyag-gyártó: téglák, térkövek, beton elemek.', 'https://www.leier.hu'),
  ('Cemex Magyarország', 'cemex-magyarorszag', 'gyarto', 'Beton- és cementipari megoldások.', 'https://www.cemex.hu'),
  ('BME Építőmérnöki Kar', 'bme-epito', 'iskola', 'Felsőfokú építőmérnöki és szakképzési központ.', 'https://www.epito.bme.hu')
ON CONFLICT (slug) DO NOTHING;
