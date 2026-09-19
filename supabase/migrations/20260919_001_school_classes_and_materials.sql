/*
# Additive Migration: School Classes & Material Assignment System

## Purpose
1. `school_classes`: Explicit class entities binding (school_id, instructor_id, trade_id, name, grade).
2. Adds `class_id` FK to `student_invitation_codes` and `school_students`.
3. `class_materials`: Class-based educational content assignments (courses, articles, books, materials, tools).
4. Hardened Security Definer RPC updates (`get_student_code_info` and `redeem_student_invitation_code`).
5. Complete RLS policies for school classes and class materials.
*/

-- ===============================================================================
-- 1. TABLES
-- ===============================================================================

-- 1.1 School Classes Table
CREATE TABLE IF NOT EXISTS school_classes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trade_id      text NOT NULL,
  name          text NOT NULL,
  grade         integer NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_school_classes_trade
    FOREIGN KEY (school_id, instructor_id, trade_id)
    REFERENCES partner_user_trades(partner_id, user_id, trade_id)
    ON DELETE CASCADE
);

-- 1.2 Add class_id to student_invitation_codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'student_invitation_codes' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE student_invitation_codes
      ADD COLUMN class_id uuid NULL REFERENCES school_classes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.3 Add class_id to school_students
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'school_students' AND column_name = 'class_id'
  ) THEN
    ALTER TABLE school_students
      ADD COLUMN class_id uuid NULL REFERENCES school_classes(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.4 Class Materials Assignment Table
CREATE TABLE IF NOT EXISTS class_materials (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     uuid NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
  content_type text NOT NULL, -- 'course' | 'article' | 'book' | 'material' | 'tool'
  content_id   text NOT NULL,
  assigned_by  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_class_content UNIQUE (class_id, content_type, content_id)
);

-- ===============================================================================
-- 2. INDEXES
-- ===============================================================================

CREATE INDEX IF NOT EXISTS idx_school_classes_lookup
  ON school_classes(school_id, instructor_id, trade_id, is_active);

CREATE INDEX IF NOT EXISTS idx_student_invitation_codes_class_id
  ON student_invitation_codes(class_id);

CREATE INDEX IF NOT EXISTS idx_school_students_class_id
  ON school_students(class_id);

CREATE INDEX IF NOT EXISTS idx_class_materials_lookup
  ON class_materials(class_id, content_type);

-- ===============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================================================

ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;

-- 3.1 school_classes Policies
DROP POLICY IF EXISTS "Read school_classes" ON school_classes;
CREATE POLICY "Read school_classes" ON school_classes
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.partner_id = school_classes.school_id
        AND pu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM school_students ss
      WHERE ss.class_id = school_classes.id
        AND ss.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Manage school_classes" ON school_classes;
CREATE POLICY "Manage school_classes" ON school_classes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR instructor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.partner_id = school_classes.school_id
        AND pu.user_id = auth.uid()
        AND pu.member_role = 'owner'
    )
  );

-- 3.2 class_materials Policies
DROP POLICY IF EXISTS "Read class_materials" ON class_materials;
CREATE POLICY "Read class_materials" ON class_materials
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR EXISTS (
      SELECT 1 FROM school_classes sc
      WHERE sc.id = class_materials.class_id
        AND (
          sc.instructor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM partner_users pu
            WHERE pu.partner_id = sc.school_id
              AND pu.user_id = auth.uid()
          )
        )
    )
    OR EXISTS (
      SELECT 1 FROM school_students ss
      WHERE ss.class_id = class_materials.class_id
        AND ss.student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Manage class_materials" ON class_materials;
CREATE POLICY "Manage class_materials" ON class_materials
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR EXISTS (
      SELECT 1 FROM school_classes sc
      WHERE sc.id = class_materials.class_id
        AND (
          sc.instructor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM partner_users pu
            WHERE pu.partner_id = sc.school_id
              AND pu.user_id = auth.uid()
              AND pu.member_role = 'owner'
          )
        )
    )
  );

-- ===============================================================================
-- 4. HARDENED SECURITY DEFINER RPC FUNCTIONS UPDATES
-- ===============================================================================

-- RPC 1: Public/Authenticated Code Info Validation (Updated with Class Info)
CREATE OR REPLACE FUNCTION get_student_code_info(input_code TEXT)
RETURNS jsonb AS $$
DECLARE
  inv_code RECORD;
BEGIN
  IF input_code IS NULL OR TRIM(input_code) = '' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Kérjük, adja meg a meghívókódot.');
  END IF;

  SELECT
    sic.code,
    sic.expires_at,
    sic.status,
    sic.usage_count,
    sic.max_uses,
    sic.school_id,
    p.name AS school_name,
    sic.instructor_id,
    pr.full_name AS instructor_name,
    sic.trade_id,
    sic.class_id,
    sc.name AS class_name,
    sc.grade AS class_grade
  INTO inv_code
  FROM student_invitation_codes sic
  JOIN partners p ON p.id = sic.school_id
  JOIN profiles pr ON pr.id = sic.instructor_id
  LEFT JOIN school_classes sc ON sc.id = sic.class_id
  WHERE UPPER(TRIM(sic.code)) = UPPER(TRIM(input_code))
    AND sic.status = 'active'
    AND sic.expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Érvénytelen, lejárt vagy nem létező osztálytermi kód.');
  END IF;

  IF inv_code.max_uses IS NOT NULL AND inv_code.usage_count >= inv_code.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'A megadott meghívókód beváltási kerete betelt.');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', inv_code.code,
    'school_id', inv_code.school_id,
    'school_name', inv_code.school_name,
    'instructor_id', inv_code.instructor_id,
    'instructor_name', COALESCE(inv_code.instructor_name, 'Oktató'),
    'trade_id', inv_code.trade_id,
    'class_id', inv_code.class_id,
    'class_name', inv_code.class_name,
    'class_grade', inv_code.class_grade,
    'expires_at', inv_code.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC 2: Server-Side Transactional Student Code Redemption (Updated with class_id)
CREATE OR REPLACE FUNCTION redeem_student_invitation_code(input_code TEXT)
RETURNS jsonb AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  inv_code RECORD;
BEGIN
  -- 1. Authentication Check
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Hozzáférés megtagadva: Nincs bejelentkezett munkamenet.';
  END IF;

  SELECT email INTO current_user_email FROM profiles WHERE id = current_user_id;
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'Felhasználói profil nem található.';
  END IF;

  IF input_code IS NULL OR TRIM(input_code) = '' THEN
    RAISE EXCEPTION 'Kérjük, adja meg a meghívókódot.';
  END IF;

  -- 2. Lock & Fetch code row FOR UPDATE to prevent race conditions
  SELECT
    sic.*,
    p.name AS school_name,
    pr.full_name AS instructor_name,
    sc.name AS class_name
  INTO inv_code
  FROM student_invitation_codes sic
  JOIN partners p ON p.id = sic.school_id
  JOIN profiles pr ON pr.id = sic.instructor_id
  LEFT JOIN school_classes sc ON sc.id = sic.class_id
  WHERE UPPER(TRIM(sic.code)) = UPPER(TRIM(input_code))
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A megadott osztálytermi kód érvénytelen vagy nem található.';
  END IF;

  -- 3. Expiration and Status Checks
  IF inv_code.status <> 'active' OR inv_code.expires_at <= now() THEN
    RAISE EXCEPTION 'A megadott meghívókód lejárt vagy már nem aktív.';
  END IF;

  IF inv_code.max_uses IS NOT NULL AND inv_code.usage_count >= inv_code.max_uses THEN
    RAISE EXCEPTION 'A megadott meghívókód beváltási kerete betelt.';
  END IF;

  -- 4. Duplicate Check (If already enrolled in this school + trade or specific class)
  IF EXISTS (
    SELECT 1 FROM school_students
    WHERE student_id = current_user_id
      AND school_id = inv_code.school_id
      AND trade_id = inv_code.trade_id
      AND (inv_code.class_id IS NULL OR class_id = inv_code.class_id)
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_enrolled', true,
      'school_id', inv_code.school_id,
      'school_name', inv_code.school_name,
      'trade_id', inv_code.trade_id,
      'class_id', inv_code.class_id,
      'class_name', inv_code.class_name,
      'message', 'Ön már csatlakozott ehhez az osztályhoz / szakmához ebben az iskolában!'
    );
  END IF;

  -- 5. Atomic Counter Increment & Student Membership Insertion
  UPDATE student_invitation_codes
  SET usage_count = usage_count + 1
  WHERE id = inv_code.id;

  INSERT INTO school_students (
    school_id,
    instructor_id,
    trade_id,
    class_id,
    student_id,
    invitation_code_id,
    status,
    joined_at
  ) VALUES (
    inv_code.school_id,
    inv_code.instructor_id,
    inv_code.trade_id,
    inv_code.class_id,
    current_user_id,
    inv_code.id,
    'active',
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_enrolled', false,
    'school_id', inv_code.school_id,
    'school_name', inv_code.school_name,
    'instructor_id', inv_code.instructor_id,
    'instructor_name', COALESCE(inv_code.instructor_name, 'Oktató'),
    'trade_id', inv_code.trade_id,
    'class_id', inv_code.class_id,
    'class_name', inv_code.class_name,
    'message', 'Sikeresen csatlakozott az Iskola osztályához!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ===============================================================================
-- 5. EXECUTE GRANTS
-- ===============================================================================

REVOKE EXECUTE ON FUNCTION get_student_code_info(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_student_code_info(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION redeem_student_invitation_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION redeem_student_invitation_code(TEXT) TO authenticated;
