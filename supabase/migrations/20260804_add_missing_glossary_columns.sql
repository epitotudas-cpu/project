-- Add missing extended columns to glossary_terms table
ALTER TABLE glossary_terms
  ADD COLUMN IF NOT EXISTS entry_type text DEFAULT 'technical_concept',
  ADD COLUMN IF NOT EXISTS official_term_id text,
  ADD COLUMN IF NOT EXISTS official_term_name text,
  ADD COLUMN IF NOT EXISTS detailed_description text,
  ADD COLUMN IF NOT EXISTS practical_applications text,
  ADD COLUMN IF NOT EXISTS common_mistakes text,
  ADD COLUMN IF NOT EXISTS usage_example text,
  ADD COLUMN IF NOT EXISTS origin_note text,
  ADD COLUMN IF NOT EXISTS jargon_subtype text,
  ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_tool_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS related_article_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS knowledge_graph_relations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS slides jsonb DEFAULT '[]'::jsonb;
