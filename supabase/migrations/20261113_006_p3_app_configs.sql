/*
# Additive Migration: P3 Dedicated Application Config Table (`app_configs`)

## Purpose
Separates `__SYSTEM_CONFIG_*__` JSON configuration records out of `public.categories`
into a dedicated `public.app_configs` key-value table with explicit RLS policies.
Existing `__SYSTEM_CONFIG_*__` rows in `public.categories` are safely copied over
if their `description` is valid JSON.
*/

CREATE TABLE IF NOT EXISTS public.app_configs (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read app_configs" ON public.app_configs;
CREATE POLICY "Public read app_configs"
ON public.app_configs
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins and editors manage app_configs" ON public.app_configs;
CREATE POLICY "Admins and editors manage app_configs"
ON public.app_configs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'editor')
  )
);

-- Copy existing __SYSTEM_CONFIG_*__ rows from categories into app_configs safely
DO $$
DECLARE
  rec RECORD;
  parsed_json jsonb;
BEGIN
  FOR rec IN
    SELECT name, description, updated_at
    FROM public.categories
    WHERE name LIKE '__SYSTEM_CONFIG_%'
      AND description IS NOT NULL
      AND length(trim(description)) > 0
  LOOP
    BEGIN
      parsed_json := rec.description::jsonb;
      INSERT INTO public.app_configs (key, value, updated_at)
      VALUES (rec.name, parsed_json, COALESCE(rec.updated_at, now()))
      ON CONFLICT (key) DO NOTHING;
    EXCEPTION WHEN others THEN
      -- Skip non-JSON legacy rows safely
      NULL;
    END;
  END LOOP;
END;
$$;

