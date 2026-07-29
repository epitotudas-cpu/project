-- 1. Fix mutable search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Fix always-true RLS policies on article_views
DROP POLICY IF EXISTS "Insert article views" ON article_views;
DROP POLICY IF EXISTS "Public insert article views" ON article_views;

-- Authenticated users may only insert views tied to their own user_id (or anonymous rows)
CREATE POLICY "Insert article views"
  ON article_views FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Anonymous users may only insert rows without a user_id
CREATE POLICY "Public insert article views"
  ON article_views FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
