-- Atomic category deletion and article reassignment RPC
-- Keeps direct public.categories DELETE RLS restricted to admin;
-- Editor category deletion is executed safely through this SECURITY DEFINER RPC.

CREATE OR REPLACE FUNCTION public.delete_category_and_reassign_articles(
  p_source_category_id uuid,
  p_target_category_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_source_name text;
  v_target_name text;
  v_affected_count integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_editor_role() THEN
    RAISE EXCEPTION 'Nincs jogosultság a kategória törléséhez.'
      USING ERRCODE = '42501';
  END IF;

  IF p_source_category_id IS NULL THEN
    RAISE EXCEPTION 'A törlendő kategória azonosítója kötelező.'
      USING ERRCODE = '22023';
  END IF;

  IF p_target_category_id IS NOT NULL AND p_target_category_id = p_source_category_id THEN
    RAISE EXCEPTION 'A célkategória nem egyezhet meg a törlendő kategóriával.'
      USING ERRCODE = '22023';
  END IF;

  SELECT name INTO v_source_name
  FROM public.categories
  WHERE id = p_source_category_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A törlendő kategória nem található.'
      USING ERRCODE = 'P0002';
  END IF;

  IF p_source_category_id = '00000000-0000-0000-0000-000000000001'::uuid
     OR v_source_name LIKE '\_\_SYSTEM\_CONFIG\_%' ESCAPE '\' THEN
    RAISE EXCEPTION 'Rendszerkategória nem törölhető.'
      USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*) INTO v_affected_count
  FROM public.articles
  WHERE category_id = p_source_category_id;

  IF v_affected_count > 0 THEN
    IF p_target_category_id IS NULL THEN
      RAISE EXCEPTION 'A kategóriához tartozó cikkek áthelyezéséhez célkategória megadása szükséges.'
        USING ERRCODE = '22023';
    END IF;

    SELECT name INTO v_target_name
    FROM public.categories
    WHERE id = p_target_category_id
    FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'A kiválasztott célkategória nem található.'
        USING ERRCODE = 'P0002';
    END IF;

    IF p_target_category_id = '00000000-0000-0000-0000-000000000001'::uuid
       OR v_target_name LIKE '\_\_SYSTEM\_CONFIG\_%' ESCAPE '\' THEN
      RAISE EXCEPTION 'Célkategóriaként rendszerkategória nem választható.'
        USING ERRCODE = '42501';
    END IF;

    UPDATE public.articles
    SET category_id = p_target_category_id
    WHERE category_id = p_source_category_id;
  END IF;

  DELETE FROM public.categories
  WHERE id = p_source_category_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kategória törlése sikertelen.'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

ALTER FUNCTION public.delete_category_and_reassign_articles(uuid, uuid) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.delete_category_and_reassign_articles(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_category_and_reassign_articles(uuid, uuid) TO authenticated;
