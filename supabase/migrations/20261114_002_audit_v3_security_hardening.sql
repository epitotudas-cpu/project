/*
# Migration: Audit V3 Security Hardening (P0 & P1)

## Purpose
1. P0-1: Prevent self-registration privilege escalation in `public.handle_new_user()` by ignoring client-supplied `role` and privileged `user_type` values.
2. P0-2: Remove `OR TRUE` and general `profiles` bypasses from `partner_invitations` RLS policies, and enforce `is_editor_role() OR is_partner_admin(p_partner_id)` inside `create_partner_invitation(...)` while revoking `anon` execute.
3. P0-3: Fix infinite RLS recursion (`42P17`) on `public.profiles` `SELECT` policy using a `SECURITY DEFINER` helper `public.is_panel_or_teaching_role()`.
4. P1-2: Remove permissive `authenticated` `INSERT`/`UPDATE` policies on `storage.objects` for `partner-references` bucket (uploads are committed exclusively via `confirm-reference-upload` using `service_role`).
5. P1-3: Restrict `app_configs` writes for sensitive system keys (`__SYSTEM_CONFIG_ROLE_PERMISSIONS__`, `__SYSTEM_CONFIG_SITE_SETTINGS__`) to `public.is_admin_role()`.
6. P2-1/P2-2: Add `SET search_path` hardening on `increment_article_views` and `accept_partner_invitation`, and validate `partner_applications` public inserts.
*/

-- ============================================================================
-- 1. P0-1: Harden handle_new_user() against signup role escalation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  assigned_role text := 'student';
BEGIN
  -- Only allow non-privileged signup roles.
  -- Elevated roles (teacher, school, partner, editor, admin) must be granted
  -- server-side via accept_partner_invitation or update_user_platform_role.
  IF (NEW.raw_user_meta_data->>'user_type') = 'szakember' THEN
    assigned_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. P0-3: Fix infinite RLS recursion on public.profiles SELECT policy
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_panel_or_teaching_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor', 'moderator', 'partner', 'school', 'teacher')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_panel_or_teaching_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_panel_or_teaching_role() TO authenticated;

DROP POLICY IF EXISTS "Authenticated read all profiles" ON public.profiles;
CREATE POLICY "Authenticated read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.is_panel_or_teaching_role()
);

-- ============================================================================
-- 3. P0-2: Harden partner_invitations RLS & create_partner_invitation RPC
-- ============================================================================
DROP POLICY IF EXISTS "Partner contacts read invitations" ON public.partner_invitations;
CREATE POLICY "Partner contacts read invitations"
ON public.partner_invitations
FOR SELECT
TO authenticated
USING (
  public.is_editor_role()
  OR (
    partner_id IS NOT NULL
    AND public.is_partner_contact(partner_id)
  )
  OR (lower(trim(email)) = lower(trim(COALESCE(auth.jwt()->>'email', ''))))
  OR (created_by = auth.uid())
);

DROP POLICY IF EXISTS "Partner contacts insert invitations" ON public.partner_invitations;
CREATE POLICY "Partner contacts insert invitations"
ON public.partner_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_editor_role()
  OR (
    partner_id IS NOT NULL
    AND public.is_partner_admin(partner_id)
  )
);

DROP POLICY IF EXISTS "Partner contacts update invitations" ON public.partner_invitations;
CREATE POLICY "Partner contacts update invitations"
ON public.partner_invitations
FOR UPDATE
TO authenticated
USING (
  public.is_editor_role()
  OR (
    partner_id IS NOT NULL
    AND public.is_partner_admin(partner_id)
  )
);

CREATE OR REPLACE FUNCTION public.create_partner_invitation(
  p_partner_id UUID DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_organization_name TEXT DEFAULT NULL,
  p_organization_category TEXT DEFAULT NULL,
  p_expires_in_days INT DEFAULT 14
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_user_id UUID;
  v_clean_email TEXT;
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_new_inv RECORD;
  v_rand_str TEXT := '';
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs bejelentkezett munkamenet.';
  END IF;

  -- Authorization check: only admin/editor (for any or new partner)
  -- or a verified partner admin/owner for that specific partner_id.
  IF NOT (
    public.is_editor_role()
    OR (p_partner_id IS NOT NULL AND public.is_partner_admin(p_partner_id))
  ) THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs jogosultsága meghívó létrehozásához.';
  END IF;

  v_clean_email := LOWER(TRIM(p_email));
  IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Kérjük, adjon meg érvényes e-mail címet.';
  END IF;

  FOR i IN 1..6 LOOP
    v_rand_str := v_rand_str || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
  END LOOP;
  v_code := 'ET-INV-' || v_rand_str;

  v_expires_at := now() + (GREATEST(1, LEAST(COALESCE(p_expires_in_days, 14), 90)) || ' days')::INTERVAL;

  INSERT INTO public.partner_invitations (
    partner_id,
    organization_name,
    organization_category,
    email,
    code,
    created_by,
    expires_at,
    status
  ) VALUES (
    p_partner_id,
    p_organization_name,
    p_organization_category,
    v_clean_email,
    v_code,
    v_current_user_id,
    v_expires_at,
    'active'
  )
  RETURNING * INTO v_new_inv;

  RETURN to_jsonb(v_new_inv);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_partner_invitation(UUID, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_partner_invitation(UUID, TEXT, TEXT, TEXT, INT) TO authenticated;

-- ============================================================================
-- 4. P1-2: Remove permissive authenticated INSERT/UPDATE on partner-references
-- ============================================================================
DROP POLICY IF EXISTS "Partner references authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Partner references authenticated update" ON storage.objects;

-- ============================================================================
-- 5. P1-3: Protect sensitive system keys in app_configs (admin-only writes)
-- ============================================================================
DROP POLICY IF EXISTS "Admins and editors manage app_configs" ON public.app_configs;

CREATE POLICY "Admins manage all app_configs"
ON public.app_configs
FOR ALL
TO authenticated
USING (public.is_admin_role())
WITH CHECK (public.is_admin_role());

CREATE POLICY "Editors manage non-security app_configs"
ON public.app_configs
FOR ALL
TO authenticated
USING (
  public.is_editor_role()
  AND key NOT IN ('__SYSTEM_CONFIG_ROLE_PERMISSIONS__', '__SYSTEM_CONFIG_SITE_SETTINGS__')
)
WITH CHECK (
  public.is_editor_role()
  AND key NOT IN ('__SYSTEM_CONFIG_ROLE_PERMISSIONS__', '__SYSTEM_CONFIG_SITE_SETTINGS__')
);

-- ============================================================================
-- 6. P2: Harden search_path on SECURITY DEFINER functions & partner_applications
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id_input uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_views integer;
BEGIN
  UPDATE public.articles
  SET views = COALESCE(views, 0) + 1
  WHERE id = article_id_input
  RETURNING views INTO new_views;

  RETURN COALESCE(new_views, 0);
END;
$$;

ALTER FUNCTION public.accept_partner_invitation(text, jsonb) SET search_path = public, pg_temp;

DROP POLICY IF EXISTS "Public insert partner_applications" ON public.partner_applications;
CREATE POLICY "Public insert partner_applications"
ON public.partner_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND length(trim(company_name)) >= 2
  AND length(company_name) <= 200
  AND length(trim(contact_name)) >= 2
  AND length(contact_name) <= 150
  AND length(trim(email)) <= 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

