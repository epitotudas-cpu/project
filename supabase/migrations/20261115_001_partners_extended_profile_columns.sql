-- 0.A: Partnerprofil hiányzó mezőinek hozzáadása a public.partners táblához
-- Adatvesztés nélküli, visszafelé kompatibilis additív migráció (DEFAULT értékekkel)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_facebook TEXT,
  ADD COLUMN IF NOT EXISTS social_linkedin TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram TEXT,
  ADD COLUMN IF NOT EXISTS social_youtube TEXT,
  ADD COLUMN IF NOT EXISTS related_content JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS logo_bg TEXT NOT NULL DEFAULT 'white',
  ADD COLUMN IF NOT EXISTS operating_area TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN NOT NULL DEFAULT true;
