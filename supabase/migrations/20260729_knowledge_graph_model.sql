/*
# Additive Migration: Knowledge Model & Semantic Knowledge Graph Extension

## Purpose
Adds additive columns to `glossary_terms` to support:
1. Multilingual dictionary translations (HU - EN - DE - RO).
2. Fine-grained jargon sub-types ('brand_name' | 'german_origin' | 'workplace_slang' | 'synonym').
3. Semantic 14-relation Knowledge Graph ('part_of', 'contains', 'made_from', 'required_for', 'prerequisite', 'next_learning_step', etc.).

Strictly ADDITIVE migration:
- No existing tables dropped, renamed, or redesigned.
- No existing columns removed.
*/

ALTER TABLE glossary_terms
  ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS jargon_subtype text,
  ADD COLUMN IF NOT EXISTS knowledge_graph_relations jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_glossary_terms_jargon_subtype ON glossary_terms(jargon_subtype);
