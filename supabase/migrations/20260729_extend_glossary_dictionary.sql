/*
# Additive Migration: Extend Glossary Terms for Technical Concepts & Construction Industry Dictionary

## Purpose
Adds additive fields to `glossary_terms` to support two content types in a single unified knowledge graph:
1. 'technical_concept' (Szakmai fogalom)
2. 'industry_term' (Építőipari nyelvi kifejezés / zsargon)

This is a strictly ADDITIVE migration:
- No existing table is dropped, renamed, or redesigned.
- No existing columns are removed.
- All existing data remains untouched with default values.
*/

ALTER TABLE glossary_terms
  ADD COLUMN IF NOT EXISTS entry_type text NOT NULL DEFAULT 'technical_concept',
  ADD COLUMN IF NOT EXISTS official_term_id uuid REFERENCES glossary_terms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS official_term_name text,
  ADD COLUMN IF NOT EXISTS detailed_description text,
  ADD COLUMN IF NOT EXISTS practical_applications text,
  ADD COLUMN IF NOT EXISTS common_mistakes text,
  ADD COLUMN IF NOT EXISTS usage_example text,
  ADD COLUMN IF NOT EXISTS origin_note text,
  ADD COLUMN IF NOT EXISTS related_tool_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_article_ids uuid[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_glossary_terms_entry_type ON glossary_terms(entry_type);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_official_term ON glossary_terms(official_term_id);

-- Insert Sample Jargon Terms Linked to Official Terms if not present
INSERT INTO glossary_terms (term, slug, definition, letter, category, entry_type, usage_example, origin_note)
VALUES
  ('Malter', 'malter', 'Építkezéseken elterjedt elnevezés a habarcsra.', 'M', 'Falazás', 'industry_term', 'A maltert bekevertük a falazáshoz.', 'Német eredetű szakmai szó (Mörtel).'),
  ('Stafni', 'stafni', 'Építkezéseken használt fagerenda / tetőléc kifejezés.', 'S', 'Szerkezetépítés', 'industry_term', 'A stafnit méretre vágva készítettük elő a zsaluzáshoz.', 'Német eredetű szakmai kifejezés (Staffel).'),
  ('Trepedli', 'trepedli', 'Állványozási munkáknál használt fa vagy fém járópalló.', 'T', 'Állványozás', 'industry_term', 'A trepedlit biztonságosan rögzíteni kell a szinteken.', 'Német eredetű mester-szó.')
ON CONFLICT (slug) DO NOTHING;
