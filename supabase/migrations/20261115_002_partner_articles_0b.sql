-- =============================================================================
-- 0.B Partner Articles: schema alignment, partner read RLS, and secure RPCs
-- =============================================================================

-- 1. Add missing columns to public.articles (idempotent, non-destructive)
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_name TEXT,
  ADD COLUMN IF NOT EXISTS subcategory_name TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rejection_note TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_articles_partner_id ON public.articles(partner_id);

-- 2. Expand status CHECK constraint while preserving all existing statuses
ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_status_check
  CHECK (status IN ('draft', 'pending', 'review', 'approved', 'published', 'rejected', 'archived'));

-- 3. Allow partners to read their own draft/pending/rejected/published articles
DROP POLICY IF EXISTS "Partner read own articles" ON public.articles;
CREATE POLICY "Partner read own articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (
    partner_id IS NOT NULL
    AND public.is_partner_contact(partner_id)
  );

-- 4. Partner-scoped article upsert RPC (enforces ownership and draft/pending status)
CREATE OR REPLACE FUNCTION public.upsert_partner_article(
  p_partner_id UUID,
  p_payload JSONB
)
RETURNS public.articles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_partner_name TEXT;
  v_id_raw TEXT;
  v_id UUID := NULL;
  v_cat_raw TEXT;
  v_category_id UUID := NULL;
  v_title TEXT;
  v_slug TEXT;
  v_status TEXT;
  v_article_type TEXT;
  v_difficulty TEXT;
  v_read_time INTEGER := 5;
  v_tags TEXT[] := '{}'::text[];
  v_documents JSONB := '[]'::jsonb;
  v_existing public.articles%ROWTYPE;
  v_result public.articles%ROWTYPE;
  v_now TIMESTAMPTZ := now();
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hitelesítés szükséges.';
  END IF;

  IF p_partner_id IS NULL OR NOT public.is_partner_contact(p_partner_id) THEN
    RAISE EXCEPTION 'Nincs jogosultsága ehhez a partnerfiókhoz.';
  END IF;

  SELECT name INTO v_partner_name
  FROM public.partners
  WHERE id = p_partner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A partner nem található.';
  END IF;

  v_title := NULLIF(trim(coalesce(p_payload->>'title', '')), '');
  IF v_title IS NULL THEN
    RAISE EXCEPTION 'A cikk címe kötelező.';
  END IF;

  v_status := coalesce(NULLIF(trim(coalesce(p_payload->>'status', '')), ''), 'draft');
  IF v_status NOT IN ('draft', 'pending') THEN
    RAISE EXCEPTION 'Partner csak piszkozatként vagy jóváhagyásra küldve menthet cikket.';
  END IF;

  v_slug := NULLIF(trim(coalesce(p_payload->>'slug', '')), '');
  IF v_slug IS NULL THEN
    v_slug := regexp_replace(lower(v_title), '[^a-z0-9]+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
    IF v_slug = '' THEN
      v_slug := 'partner-cikk';
    END IF;
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;

  v_id_raw := NULLIF(trim(coalesce(p_payload->>'id', '')), '');
  IF v_id_raw IS NOT NULL AND v_id_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_id := v_id_raw::uuid;
  END IF;

  v_cat_raw := NULLIF(trim(coalesce(p_payload->>'category_id', '')), '');
  IF v_cat_raw IS NOT NULL AND v_cat_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO v_category_id FROM public.categories WHERE id = v_cat_raw::uuid;
  END IF;

  v_article_type := coalesce(NULLIF(trim(coalesce(p_payload->>'article_type', '')), ''), 'hirek');
  IF v_article_type NOT IN ('hirek', 'ujdonsagok', 'utmutatok') THEN
    v_article_type := 'hirek';
  END IF;

  v_difficulty := coalesce(NULLIF(trim(coalesce(p_payload->>'difficulty', '')), ''), 'beginner');
  IF v_difficulty NOT IN ('beginner', 'intermediate', 'advanced') THEN
    v_difficulty := 'beginner';
  END IF;

  IF (p_payload->>'read_time') ~ '^\d+$' THEN
    v_read_time := GREATEST(1, (p_payload->>'read_time')::integer);
  END IF;

  IF jsonb_typeof(p_payload->'tags') = 'array' THEN
    SELECT coalesce(array_agg(val), '{}'::text[])
    INTO v_tags
    FROM jsonb_array_elements_text(p_payload->'tags') AS val;
  END IF;

  IF jsonb_typeof(p_payload->'documents') = 'array' THEN
    v_documents := p_payload->'documents';
  END IF;

  IF v_id IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.articles
    WHERE id = v_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A módosítani kívánt cikk nem található.';
    END IF;

    IF v_existing.partner_id IS DISTINCT FROM p_partner_id THEN
      RAISE EXCEPTION 'Csak a saját cikkét módosíthatja.';
    END IF;

    UPDATE public.articles
    SET
      title = v_title,
      slug = v_slug,
      excerpt = NULLIF(trim(coalesce(p_payload->>'excerpt', '')), ''),
      content = coalesce(p_payload->>'content', ''),
      article_type = v_article_type,
      category_id = v_category_id,
      subcategory_name = NULLIF(trim(coalesce(p_payload->>'subcategory_name', '')), ''),
      tags = v_tags,
      author = coalesce(NULLIF(trim(coalesce(p_payload->>'author', '')), ''), v_partner_name),
      partner_name = v_partner_name,
      difficulty = v_difficulty,
      read_time = v_read_time,
      featured_image = NULLIF(trim(coalesce(p_payload->>'featured_image', '')), ''),
      documents = v_documents,
      status = v_status,
      rejection_note = CASE WHEN v_status = 'pending' THEN NULL ELSE v_existing.rejection_note END,
      updated_at = v_now
    WHERE id = v_id
    RETURNING * INTO v_result;
  ELSE
    INSERT INTO public.articles (
      title,
      slug,
      excerpt,
      content,
      article_type,
      category_id,
      subcategory_name,
      tags,
      author,
      partner_id,
      partner_name,
      difficulty,
      read_time,
      featured_image,
      documents,
      status,
      rejection_note,
      featured,
      views,
      rating,
      rating_count,
      created_at,
      updated_at
    )
    VALUES (
      v_title,
      v_slug,
      NULLIF(trim(coalesce(p_payload->>'excerpt', '')), ''),
      coalesce(p_payload->>'content', ''),
      v_article_type,
      v_category_id,
      NULLIF(trim(coalesce(p_payload->>'subcategory_name', '')), ''),
      v_tags,
      coalesce(NULLIF(trim(coalesce(p_payload->>'author', '')), ''), v_partner_name),
      p_partner_id,
      v_partner_name,
      v_difficulty,
      v_read_time,
      NULLIF(trim(coalesce(p_payload->>'featured_image', '')), ''),
      v_documents,
      v_status,
      NULL,
      false,
      0,
      0,
      0,
      v_now,
      v_now
    )
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_partner_article(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_partner_article(UUID, JSONB) TO authenticated;

-- 5. Partner-scoped article delete RPC
CREATE OR REPLACE FUNCTION public.delete_partner_article(
  p_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_existing public.articles%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hitelesítés szükséges.';
  END IF;

  SELECT * INTO v_existing
  FROM public.articles
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A törölni kívánt cikk nem található.';
  END IF;

  IF v_existing.partner_id IS NULL OR NOT public.is_partner_contact(v_existing.partner_id) THEN
    RAISE EXCEPTION 'Csak a saját cikkét törölheti.';
  END IF;

  DELETE FROM public.articles WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_partner_article(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_partner_article(UUID) TO authenticated;
