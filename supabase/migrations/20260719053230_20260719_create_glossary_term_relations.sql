/*
# Create glossary_term_relations table (additive)

## Purpose
Adds a normalized, FK-protected join table to model directed
relationships between glossary terms (e.g. "Betonacél" -> "Vasbeton").
This is an ADDITIVE migration: it creates only this one new table and
its indexes/policies. No existing table is modified, no column is
dropped or renamed, no existing RLS policy is touched, and no data is
migrated.

## 1. New Table: glossary_term_relations
- `id`             uuid PRIMARY KEY, default gen_random_uuid()
- `source_term_id` uuid NOT NULL, references glossary_terms(id) ON DELETE CASCADE
- `target_term_id` uuid NOT NULL, references glossary_terms(id) ON DELETE CASCADE
- `created_at`     timestamptz NOT NULL DEFAULT now()

Relationships are directed: a row means "source_term_id is related to
target_term_id". Both endpoints cascade on delete, so removing a
glossary term automatically cleans up every relation that references
it in either direction.

## 2. Indexes
- `idx_glossary_term_relations_source` on `source_term_id`
- `idx_glossary_term_relations_target` on `target_term_id`
These support the common "find all relations of a term" lookups in
either direction.

## 3. Security (RLS)
Row Level Security is ENABLED on the new table. Policies mirror the
existing glossary_terms permission pattern (public read, editor
write, admin delete, service role full access):
- Public SELECT (TO anon, authenticated) USING (true) — relation
  metadata is public, like the terms themselves.
- Authenticated editor INSERT WITH CHECK (is_editor_role()).
- Authenticated editor UPDATE USING/WITH CHECK (is_editor_role()).
- Admin DELETE USING (is_admin_role()).
- Service role full access (FOR ALL TO service_role USING (true)
  WITH CHECK (true)).

The helper functions is_editor_role() and is_admin_role() already
exist in the database and are reused unchanged.

## 4. Idempotency
- CREATE TABLE IF NOT EXISTS.
- Indexes use IF NOT EXISTS.
- Each policy is DROP POLICY IF EXISTS before CREATE POLICY so the
  migration is safe to re-run (e.g. after a timed-out response that
  actually committed server-side).

## 5. Non-goals
- Does NOT modify the glossary_terms table.
- Does NOT add/remove/rename any column on any existing table.
- Does NOT change any existing RLS policy.
- Does NOT create frontend code, import logic, or export logic.
- Does NOT backfill relations from the existing
  glossary_terms.kapcsolodofogalmak text[] column.
*/

CREATE TABLE IF NOT EXISTS glossary_term_relations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_term_id uuid NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  target_term_id uuid NOT NULL REFERENCES glossary_terms(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glossary_term_relations_source
  ON glossary_term_relations (source_term_id);

CREATE INDEX IF NOT EXISTS idx_glossary_term_relations_target
  ON glossary_term_relations (target_term_id);

ALTER TABLE glossary_term_relations ENABLE ROW LEVEL SECURITY;

-- Public read: relation metadata is public, like the terms themselves.
DROP POLICY IF EXISTS "Public read glossary term relations" ON glossary_term_relations;
CREATE POLICY "Public read glossary term relations"
  ON glossary_term_relations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated editor insert.
DROP POLICY IF EXISTS "Authenticated editor insert glossary term relations" ON glossary_term_relations;
CREATE POLICY "Authenticated editor insert glossary term relations"
  ON glossary_term_relations FOR INSERT
  TO authenticated
  WITH CHECK (is_editor_role());

-- Authenticated editor update.
DROP POLICY IF EXISTS "Authenticated editor update glossary term relations" ON glossary_term_relations;
CREATE POLICY "Authenticated editor update glossary term relations"
  ON glossary_term_relations FOR UPDATE
  TO authenticated
  USING (is_editor_role())
  WITH CHECK (is_editor_role());

-- Admin delete.
DROP POLICY IF EXISTS "Admin delete glossary term relations" ON glossary_term_relations;
CREATE POLICY "Admin delete glossary term relations"
  ON glossary_term_relations FOR DELETE
  TO authenticated
  USING (is_admin_role());

-- Service role full access.
DROP POLICY IF EXISTS "Service role full access glossary term relations" ON glossary_term_relations;
CREATE POLICY "Service role full access glossary term relations"
  ON glossary_term_relations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);