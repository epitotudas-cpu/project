-- Migration: Create RPC function for incrementing article views and comments table
-- Date: 2026-08-22

-- 1. Function to safely increment article view count bypass RLS
CREATE OR REPLACE FUNCTION increment_article_views(article_id_input uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_views integer;
BEGIN
  UPDATE articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = article_id_input
  RETURNING views INTO new_views;

  RETURN COALESCE(new_views, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_article_views(uuid) TO anon, authenticated, service_role;

-- 2. Comments table for articles and glossary terms
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  content_type text NOT NULL,
  content_id text NOT NULL,
  comment_text text NOT NULL,
  rating integer DEFAULT 5,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments" ON public.comments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users delete own comments" ON public.comments;
CREATE POLICY "Users delete own comments" ON public.comments
  FOR DELETE USING (
    (auth.uid() = user_id) OR
    (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
    ))
  );
