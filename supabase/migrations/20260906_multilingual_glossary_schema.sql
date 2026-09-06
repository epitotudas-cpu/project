-- 1. Create glossary_languages table
CREATE TABLE IF NOT EXISTS public.glossary_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_hu TEXT NOT NULL,
  name_native TEXT NOT NULL,
  iso_code TEXT NOT NULL UNIQUE,
  flag_code TEXT,
  flag_emoji TEXT NOT NULL DEFAULT '🌐',
  short_label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system_protected BOOLEAN NOT NULL DEFAULT false,
  is_rtl BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default languages if empty
INSERT INTO public.glossary_languages (name_hu, name_native, iso_code, flag_code, flag_emoji, short_label, sort_order, is_active, is_default, is_system_protected)
VALUES
  ('Magyar', 'Magyar', 'hu', 'HU', '🇭🇺', 'HU', 1, true, true, true),
  ('Angol', 'English', 'en', 'GB', '🇬🇧', 'EN', 2, true, false, false),
  ('Német', 'Deutsch', 'de', 'DE', '🇩🇪', 'DE', 3, true, false, false),
  ('Román', 'Română', 'ro', 'RO', '🇷🇴', 'RO', 4, true, false, false),
  ('Szlovák', 'Slovenčina', 'sk', 'SK', '🇸🇰', 'SK', 5, false, false, false),
  ('Horvát', 'Hrvatski', 'hr', 'HR', '🇭🇷', 'HR', 6, false, false, false),
  ('Olasz', 'Italiano', 'it', 'IT', '🇮🇹', 'IT', 7, false, false, false)
ON CONFLICT (iso_code) DO NOTHING;

-- 2. Create glossary_term_translations table
CREATE TABLE IF NOT EXISTS public.glossary_term_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  glossary_term_id UUID NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  translated_term TEXT NOT NULL,
  definition TEXT,
  synonyms TEXT[],
  status TEXT NOT NULL DEFAULT 'published',
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_glossary_term_language UNIQUE (glossary_term_id, language_code)
);

-- RLS Policies
ALTER TABLE public.glossary_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_term_translations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read active languages') THEN
    CREATE POLICY "Public read active languages" ON public.glossary_languages
      FOR SELECT USING (is_active = true OR true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published translations') THEN
    CREATE POLICY "Public read published translations" ON public.glossary_term_translations
      FOR SELECT USING (status = 'published' OR true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin write languages') THEN
    CREATE POLICY "Admin write languages" ON public.glossary_languages
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin write translations') THEN
    CREATE POLICY "Admin write translations" ON public.glossary_term_translations
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Data Migration: Copy existing JSON translations column from glossary_terms into glossary_term_translations table
INSERT INTO public.glossary_term_translations (glossary_term_id, language_code, translated_term, status)
SELECT 
  gt.id AS glossary_term_id,
  lower(kv.key) AS language_code,
  trim(kv.value) AS translated_term,
  'published' AS status
FROM public.glossary_terms gt,
LATERAL jsonb_each_text(gt.translations::jsonb) kv
WHERE gt.translations IS NOT NULL
  AND kv.value IS NOT NULL 
  AND trim(kv.value) <> ''
ON CONFLICT (glossary_term_id, language_code) 
DO UPDATE SET translated_term = EXCLUDED.translated_term;
