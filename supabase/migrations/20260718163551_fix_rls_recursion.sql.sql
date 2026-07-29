-- Fix infinite RLS recursion: admin policies on articles/categories/tools/glossary_terms
-- reference `profiles` in a subquery, but `profiles` itself has RLS enabled -> infinite recursion.
-- Replace with a SECURITY DEFINER function that reads the role bypassing RLS.

CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  );
$$;

-- profiles: replace the self-referential "Admin read all profiles" policy
DROP POLICY IF EXISTS "Admin read all profiles" ON public.profiles;
CREATE POLICY "Admin read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin_role());

-- articles
DROP POLICY IF EXISTS "Admin read all articles" ON public.articles;
CREATE POLICY "Admin read all articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (public.is_editor_role());

DROP POLICY IF EXISTS "Admin insert articles" ON public.articles;
CREATE POLICY "Admin insert articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_role());

DROP POLICY IF EXISTS "Admin update articles" ON public.articles;
CREATE POLICY "Admin update articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (public.is_editor_role()) WITH CHECK (public.is_editor_role());

DROP POLICY IF EXISTS "Admin delete articles" ON public.articles;
CREATE POLICY "Admin delete articles"
  ON public.articles FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

-- categories
DROP POLICY IF EXISTS "Admin insert categories" ON public.categories;
CREATE POLICY "Admin insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_role());

DROP POLICY IF EXISTS "Admin update categories" ON public.categories;
CREATE POLICY "Admin update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.is_editor_role()) WITH CHECK (public.is_editor_role());

DROP POLICY IF EXISTS "Admin delete categories" ON public.categories;
CREATE POLICY "Admin delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

-- tools
DROP POLICY IF EXISTS "Admin read all tools" ON public.tools;
CREATE POLICY "Admin read all tools"
  ON public.tools FOR SELECT
  TO authenticated
  USING (public.is_editor_role());

DROP POLICY IF EXISTS "Admin insert tools" ON public.tools;
CREATE POLICY "Admin insert tools"
  ON public.tools FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_role());

DROP POLICY IF EXISTS "Admin update tools" ON public.tools;
CREATE POLICY "Admin update tools"
  ON public.tools FOR UPDATE
  TO authenticated
  USING (public.is_editor_role()) WITH CHECK (public.is_editor_role());

DROP POLICY IF EXISTS "Admin delete tools" ON public.tools;
CREATE POLICY "Admin delete tools"
  ON public.tools FOR DELETE
  TO authenticated
  USING (public.is_admin_role());

-- glossary_terms
DROP POLICY IF EXISTS "Authenticated insert glossary terms" ON public.glossary_terms;
CREATE POLICY "Authenticated insert glossary terms"
  ON public.glossary_terms FOR INSERT
  TO authenticated
  WITH CHECK (public.is_editor_role());

DROP POLICY IF EXISTS "Authenticated update glossary terms" ON public.glossary_terms;
CREATE POLICY "Authenticated update glossary terms"
  ON public.glossary_terms FOR UPDATE
  TO authenticated
  USING (public.is_editor_role()) WITH CHECK (public.is_editor_role());

DROP POLICY IF EXISTS "Authenticated delete glossary terms" ON public.glossary_terms;
CREATE POLICY "Authenticated delete glossary terms"
  ON public.glossary_terms FOR DELETE
  TO authenticated
  USING (public.is_admin_role());
