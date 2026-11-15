-- =============================================================================
-- 0.C Partner Materials: secure app_configs RPCs with row locking & validation
-- =============================================================================

CREATE OR REPLACE FUNCTION public.upsert_partner_material_item(
  p_partner_id UUID,
  p_item JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_partner_name TEXT;
  v_item_id TEXT;
  v_name TEXT;
  v_slug TEXT;
  v_short_desc TEXT;
  v_status TEXT;
  v_specs JSONB := '[]'::jsonb;
  v_gallery JSONB := '[]'::jsonb;
  v_docs JSONB := '[]'::jsonb;
  v_existing_list JSONB;
  v_prev_updated_at TIMESTAMPTZ;
  v_next_updated_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  v_elem JSONB;
  v_existing_item JSONB;
  v_existing_partner_id TEXT;
  v_existing_status TEXT;
  v_next_list JSONB := '[]'::jsonb;
  v_found BOOLEAN := FALSE;
  v_saved_item JSONB;
  v_rejection_note JSONB := 'null'::jsonb;
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

  IF p_item IS NULL OR jsonb_typeof(p_item) <> 'object' THEN
    RAISE EXCEPTION 'Érvénytelen termékadat formátum.';
  END IF;

  IF octet_length(p_item::text) > 65536 THEN
    RAISE EXCEPTION 'A termékadat mérete meghaladja a megengedett 64 KB korlátot.';
  END IF;

  v_name := NULLIF(trim(coalesce(p_item->>'name', '')), '');
  IF v_name IS NULL OR char_length(v_name) > 200 THEN
    RAISE EXCEPTION 'A termék neve kötelező (legfeljebb 200 karakter).';
  END IF;

  v_short_desc := coalesce(p_item->>'short_description', '');
  IF char_length(trim(v_short_desc)) = 0 OR char_length(v_short_desc) > 1000 THEN
    RAISE EXCEPTION 'A rövid leírás kötelező (legfeljebb 1000 karakter).';
  END IF;

  v_status := coalesce(NULLIF(trim(coalesce(p_item->>'status', '')), ''), 'draft');
  IF v_status NOT IN ('draft', 'pending_approval') THEN
    RAISE EXCEPTION 'Partner csak piszkozatként vagy jóváhagyásra küldve menthet terméket.';
  END IF;

  IF p_item ? 'technical_specs' AND p_item->'technical_specs' IS NOT NULL AND jsonb_typeof(p_item->'technical_specs') <> 'null' THEN
    IF jsonb_typeof(p_item->'technical_specs') <> 'array' THEN
      RAISE EXCEPTION 'A műszaki adatok mezőnek tömbnek kell lennie.';
    END IF;
    IF jsonb_array_length(p_item->'technical_specs') > 50 THEN
      RAISE EXCEPTION 'Legfeljebb 50 műszaki paraméter adható meg.';
    END IF;
    v_specs := p_item->'technical_specs';
  END IF;

  IF p_item ? 'gallery_image_urls' AND p_item->'gallery_image_urls' IS NOT NULL AND jsonb_typeof(p_item->'gallery_image_urls') <> 'null' THEN
    IF jsonb_typeof(p_item->'gallery_image_urls') <> 'array' THEN
      RAISE EXCEPTION 'A galéria képek mezőnek tömbnek kell lennie.';
    END IF;
    IF jsonb_array_length(p_item->'gallery_image_urls') > 50 THEN
      RAISE EXCEPTION 'Legfeljebb 50 galériakép adható meg.';
    END IF;
    v_gallery := p_item->'gallery_image_urls';
  END IF;

  IF p_item ? 'documents' AND p_item->'documents' IS NOT NULL AND jsonb_typeof(p_item->'documents') <> 'null' THEN
    IF jsonb_typeof(p_item->'documents') <> 'array' THEN
      RAISE EXCEPTION 'A dokumentumok mezőnek tömbnek kell lennie.';
    END IF;
    IF jsonb_array_length(p_item->'documents') > 50 THEN
      RAISE EXCEPTION 'Legfeljebb 50 dokumentum adható meg.';
    END IF;
    v_docs := p_item->'documents';
  END IF;

  v_slug := NULLIF(trim(coalesce(p_item->>'slug', '')), '');
  IF v_slug IS NULL THEN
    v_slug := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
    IF v_slug = '' THEN
      v_slug := 'partner-termek';
    END IF;
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  END IF;

  v_item_id := NULLIF(trim(coalesce(p_item->>'id', '')), '');

  INSERT INTO public.app_configs (key, value, updated_at)
  VALUES ('__SYSTEM_CONFIG_MATERIALS_ITEMS__', '[]'::jsonb, v_now)
  ON CONFLICT (key) DO NOTHING;

  SELECT value, updated_at
  INTO v_existing_list, v_prev_updated_at
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_MATERIALS_ITEMS__'
  FOR UPDATE;

  IF v_existing_list IS NULL OR jsonb_typeof(v_existing_list) <> 'array' THEN
    v_existing_list := '[]'::jsonb;
  END IF;

  v_next_updated_at := CASE
    WHEN v_prev_updated_at IS NOT NULL AND v_prev_updated_at >= v_now
      THEN v_prev_updated_at + interval '1 millisecond'
    ELSE v_now
  END;

  IF v_item_id IS NOT NULL THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(v_existing_list)
    LOOP
      IF (v_elem->>'id') = v_item_id THEN
        v_found := TRUE;
        v_existing_item := v_elem;
        v_existing_partner_id := NULLIF(trim(coalesce(v_existing_item->>'partner_id', '')), '');

        IF v_existing_partner_id IS DISTINCT FROM p_partner_id::text THEN
          RAISE EXCEPTION 'Csak a saját termékét módosíthatja.';
        END IF;

        v_existing_status := coalesce(NULLIF(trim(coalesce(v_existing_item->>'status', '')), ''), 'draft');
        IF v_existing_status NOT IN ('draft', 'pending_approval', 'rejected') THEN
          RAISE EXCEPTION 'Jóváhagyott vagy közzétett termék partner által nem módosítható.';
        END IF;

        IF v_status = 'pending_approval' THEN
          v_rejection_note := 'null'::jsonb;
        ELSE
          v_rejection_note := coalesce(v_existing_item->'rejection_note', 'null'::jsonb);
        END IF;

        v_saved_item := jsonb_build_object(
          'id', v_item_id,
          'name', v_name,
          'slug', v_slug,
          'category_id', coalesce(NULLIF(trim(coalesce(p_item->>'category_id', '')), ''), v_existing_item->>'category_id', 'mat-cat-1'),
          'category_name', coalesce(NULLIF(trim(coalesce(p_item->>'category_name', '')), ''), v_existing_item->>'category_name', 'Általános Anyagok'),
          'subcategory_name', CASE WHEN NULLIF(trim(coalesce(p_item->>'subcategory_name', '')), '') IS NULL THEN NULL ELSE trim(p_item->>'subcategory_name') END,
          'brand', coalesce(NULLIF(trim(coalesce(p_item->>'brand', '')), ''), v_partner_name),
          'partner_id', p_partner_id::text,
          'partner_name', v_partner_name,
          'sku', CASE WHEN NULLIF(trim(coalesce(p_item->>'sku', '')), '') IS NULL THEN NULL ELSE trim(p_item->>'sku') END,
          'barcode', CASE WHEN NULLIF(trim(coalesce(p_item->>'barcode', '')), '') IS NULL THEN NULL ELSE trim(p_item->>'barcode') END,
          'short_description', trim(v_short_desc),
          'full_description', coalesce(p_item->>'full_description', ''),
          'application_area', CASE WHEN NULLIF(trim(coalesce(p_item->>'application_area', '')), '') IS NULL THEN NULL ELSE trim(p_item->>'application_area') END,
          'technical_specs', v_specs,
          'main_image_url', coalesce(NULLIF(trim(coalesce(p_item->>'main_image_url', '')), ''), v_existing_item->>'main_image_url', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop'),
          'gallery_image_urls', v_gallery,
          'documents', v_docs,
          'related_material_ids', coalesce(v_existing_item->'related_material_ids', '[]'::jsonb),
          'status', v_status,
          'rejection_note', v_rejection_note,
          'featured', coalesce((v_existing_item->>'featured')::boolean, false),
          'sort_order', coalesce((v_existing_item->>'sort_order')::integer, 1),
          'views', coalesce((v_existing_item->>'views')::integer, 0),
          'seo_title', coalesce(v_existing_item->'seo_title', 'null'::jsonb),
          'seo_description', coalesce(v_existing_item->'seo_description', 'null'::jsonb),
          'keywords', coalesce(v_existing_item->'keywords', '[]'::jsonb),
          'created_at', coalesce(v_existing_item->>'created_at', v_next_updated_at::text),
          'updated_at', v_next_updated_at::text
        );

        v_next_list := v_next_list || jsonb_build_array(v_saved_item);
      ELSE
        v_next_list := v_next_list || jsonb_build_array(v_elem);
      END IF;
    END LOOP;

    IF NOT v_found THEN
      RAISE EXCEPTION 'A módosítani kívánt termék nem található.';
    END IF;
  ELSE
    v_item_id := 'mat-partner-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

    v_saved_item := jsonb_build_object(
      'id', v_item_id,
      'name', v_name,
      'slug', v_slug,
      'category_id', coalesce(NULLIF(trim(coalesce(p_item->>'category_id', '')), ''), 'mat-cat-1'),
      'category_name', coalesce(NULLIF(trim(coalesce(p_item->>'category_name', '')), ''), 'Általános Anyagok'),
      'subcategory_name', CASE WHEN NULLIF(trim(coalesce(p_item->>'subcategory_name', '')), '') IS NULL THEN NULL ELSE trim(p_item->>'subcategory_name') END,
      'brand', coalesce(NULLIF(trim(coalesce(p_item->>'brand', '')), ''), v_partner_name),
      'partner_id', p_partner_id::text,
      'partner_name', v_partner_name,
      'sku', CASE WHEN NULLIF(trim(coalesce(p_item->>'sku', '')), '') IS NULL THEN NULL ELSE trim(p_item->>'sku') END,
      'barcode', CASE WHEN NULLIF(trim(coalesce(p_item->>'barcode', '')), '') IS NULL THEN NULL ELSE trim(p_item->>'barcode') END,
      'short_description', trim(v_short_desc),
      'full_description', coalesce(p_item->>'full_description', ''),
      'application_area', CASE WHEN NULLIF(trim(coalesce(p_item->>'application_area', '')), '') IS NULL THEN NULL ELSE trim(p_item->>'application_area') END,
      'technical_specs', v_specs,
      'main_image_url', coalesce(NULLIF(trim(coalesce(p_item->>'main_image_url', '')), ''), 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop'),
      'gallery_image_urls', v_gallery,
      'documents', v_docs,
      'related_material_ids', '[]'::jsonb,
      'status', v_status,
      'rejection_note', NULL,
      'featured', false,
      'sort_order', jsonb_array_length(v_existing_list) + 1,
      'views', 0,
      'seo_title', NULL,
      'seo_description', NULL,
      'keywords', '[]'::jsonb,
      'created_at', v_next_updated_at::text,
      'updated_at', v_next_updated_at::text
    );

    v_next_list := jsonb_build_array(v_saved_item) || v_existing_list;
  END IF;

  UPDATE public.app_configs
  SET value = v_next_list,
      updated_at = v_next_updated_at
  WHERE key = '__SYSTEM_CONFIG_MATERIALS_ITEMS__';

  RETURN v_saved_item;
END;
$$;

ALTER FUNCTION public.upsert_partner_material_item(UUID, JSONB) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.upsert_partner_material_item(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_partner_material_item(UUID, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_partner_material_item(
  p_partner_id UUID,
  p_item_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_item_id TEXT;
  v_existing_list JSONB;
  v_prev_updated_at TIMESTAMPTZ;
  v_next_updated_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  v_elem JSONB;
  v_elem_partner_id TEXT;
  v_elem_status TEXT;
  v_next_list JSONB := '[]'::jsonb;
  v_deleted BOOLEAN := FALSE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Hitelesítés szükséges.';
  END IF;

  IF p_partner_id IS NULL OR NOT public.is_partner_contact(p_partner_id) THEN
    RAISE EXCEPTION 'Nincs jogosultsága ehhez a partnerfiókhoz.';
  END IF;

  v_item_id := NULLIF(trim(coalesce(p_item_id, '')), '');
  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'Hiányzó termékazonosító.';
  END IF;

  SELECT value, updated_at
  INTO v_existing_list, v_prev_updated_at
  FROM public.app_configs
  WHERE key = '__SYSTEM_CONFIG_MATERIALS_ITEMS__'
  FOR UPDATE;

  IF v_existing_list IS NULL OR jsonb_typeof(v_existing_list) <> 'array' THEN
    RETURN FALSE;
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_existing_list)
  LOOP
    IF (v_elem->>'id') = v_item_id THEN
      v_elem_partner_id := NULLIF(trim(coalesce(v_elem->>'partner_id', '')), '');
      IF v_elem_partner_id IS DISTINCT FROM p_partner_id::text THEN
        RAISE EXCEPTION 'Csak a saját termékét törölheti.';
      END IF;

      v_elem_status := coalesce(NULLIF(trim(coalesce(v_elem->>'status', '')), ''), 'draft');
      IF v_elem_status NOT IN ('draft', 'pending_approval', 'rejected') THEN
        RAISE EXCEPTION 'Jóváhagyott vagy közzétett termék partner által nem törölhető.';
      END IF;

      v_deleted := TRUE;
    ELSE
      v_next_list := v_next_list || jsonb_build_array(v_elem);
    END IF;
  END LOOP;

  IF NOT v_deleted THEN
    RETURN FALSE;
  END IF;

  v_next_updated_at := CASE
    WHEN v_prev_updated_at IS NOT NULL AND v_prev_updated_at >= v_now
      THEN v_prev_updated_at + interval '1 millisecond'
    ELSE v_now
  END;

  UPDATE public.app_configs
  SET value = v_next_list,
      updated_at = v_next_updated_at
  WHERE key = '__SYSTEM_CONFIG_MATERIALS_ITEMS__';

  RETURN TRUE;
END;
$$;

ALTER FUNCTION public.delete_partner_material_item(UUID, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.delete_partner_material_item(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_partner_material_item(UUID, TEXT) TO authenticated;
