/*
# Additive Migration: Construction Career Portal (job_postings, job_applications)

## Purpose
Adds job board, apprenticeship placements, company job postings,
and candidate application management.
*/

CREATE TABLE IF NOT EXISTS job_postings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   uuid REFERENCES partners(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  title        text NOT NULL,
  job_type     text NOT NULL DEFAULT 'full_time', -- 'full_time' | 'part_time' | 'apprenticeship'
  location     text NOT NULL,
  salary_range text,
  description  text NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  applicant_name  text NOT NULL,
  applicant_email text NOT NULL,
  cover_note      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS "Public read job_postings" ON job_postings;
CREATE POLICY "Public read job_postings" ON job_postings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read job_applications" ON job_applications;
CREATE POLICY "Public read job_applications" ON job_applications FOR SELECT TO anon, authenticated USING (true);

-- Insert Default Sample Jobs
INSERT INTO job_postings (company_name, title, job_type, location, salary_range, description)
VALUES
  ('Strabag Építő Kft.', 'Senior Monolit Beton Kőműves Mester', 'full_time', 'Budapest & Pest megye', 'Bruttó 650.000 - 850.000 Ft/hó', 'Nagy léptékű szerkezetépítési projektek kivitelezése, zsaluzatok szerelése és csoportvezetés.'),
  ('Wienerberger Zrt.', 'Szerkezetépítő Szakmai Gyakorlati Hely', 'apprenticeship', 'Győr', 'Versenyképes ösztöndíj', 'Duális szakképzés keretében történő gyakorlati oktatás falazási és kerámia cserepezési szakterületen.'),
  ('Market Építő Zrt.', 'Építésvezető Mérnök Asszisztens', 'full_time', 'Székesfehérvár', 'Bruttó 550.000 - 700.000 Ft/hó', 'Helyszíni minőségellenőrzés, műszaki dokumentáció vezetés és alvállalkozói koordináció.')
ON CONFLICT DO NOTHING;
