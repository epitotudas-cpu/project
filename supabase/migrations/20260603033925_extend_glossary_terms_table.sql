/*
  # Extend Glossary Terms Table for Hungarian Import Support

  1. Changes to glossary_terms table
    - Add `szint` field (difficulty level)
    - Add `kulcsszavak` field (array of keywords/tags)
    - Add `kapcsolodofogalmak` field (array of related terms)
    - Add `external_id` field (for tracking imported items)

  2. Schema Modifications
    - `szint` - optional text field for difficulty level
    - `kulcsszavak` - text array for keywords
    - `kapcsolodofogalmak` - text array for related terms
    - `external_id` - text field for external ID tracking, unique constraint

  3. Security
    - RLS already enabled, policies will be reviewed
    - Admin users can insert/update imported terms
*/

ALTER TABLE glossary_terms
ADD COLUMN IF NOT EXISTS szint text,
ADD COLUMN IF NOT EXISTS kulcsszavak text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS kapcsolodofogalmak text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS external_id text UNIQUE;

-- Create index for external_id lookups
CREATE INDEX IF NOT EXISTS idx_glossary_terms_external_id ON glossary_terms(external_id);

-- Update existing records to have empty arrays if not set
UPDATE glossary_terms SET kulcsszavak = ARRAY[]::text[] WHERE kulcsszavak IS NULL;
UPDATE glossary_terms SET kapcsolodofogalmak = ARRAY[]::text[] WHERE kapcsolodofogalmak IS NULL;
