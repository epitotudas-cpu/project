/*
# Migration: Support Individual Student Material Assignment & Server-Side Course Progress

## Purpose
1. Extends `class_materials` table to support optional `student_id` (1-to-1 individual student material assignment alongside existing class-based assignment).
2. Creates `user_course_progress` table to perpersist student course progress (completed chapter IDs, progress %, status, last accessed timestamp) in Supabase.
3. Sets up RLS policies allowing students to manage their own progress and instructors/school admins to view their students' progress.
4. Grants table access to `authenticated` role for Supabase Data API exposure.
*/

-- 1. Extend class_materials table for individual student assignment
ALTER TABLE class_materials ALTER COLUMN class_id DROP NOT NULL;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'class_materials' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE class_materials 
      ADD COLUMN student_id uuid NULL REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure at least one target (class_id or student_id) is provided
ALTER TABLE class_materials DROP CONSTRAINT IF EXISTS check_class_or_student_target;
ALTER TABLE class_materials ADD CONSTRAINT check_class_or_student_target 
  CHECK (class_id IS NOT NULL OR student_id IS NOT NULL);

-- Drop old unique constraint on class_id
ALTER TABLE class_materials DROP CONSTRAINT IF EXISTS unique_class_content;

-- Unique partial indexes for class and student assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_materials_unique_class 
  ON class_materials(class_id, content_type, content_id) WHERE class_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_class_materials_unique_student 
  ON class_materials(student_id, content_type, content_id) WHERE student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_class_materials_student_id 
  ON class_materials(student_id) WHERE student_id IS NOT NULL;


-- 2. Update class_materials RLS policies
DROP POLICY IF EXISTS "Read class_materials" ON class_materials;
CREATE POLICY "Read class_materials" ON class_materials
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR (
      class_id IS NOT NULL AND EXISTS (
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
    )
    OR (
      class_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM school_students ss
        WHERE ss.class_id = class_materials.class_id
          AND ss.student_id = auth.uid()
      )
    )
    OR student_id = auth.uid()
    OR (
      student_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM school_students ss
        WHERE ss.student_id = class_materials.student_id
          AND (
            ss.instructor_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM partner_users pu
              WHERE pu.partner_id = ss.school_id
                AND pu.user_id = auth.uid()
            )
          )
      )
    )
  );

DROP POLICY IF EXISTS "Manage class_materials" ON class_materials;
CREATE POLICY "Manage class_materials" ON class_materials
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR (
      class_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM school_classes sc
        WHERE sc.id = class_materials.class_id
          AND (
            sc.instructor_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM partner_users pu
              WHERE pu.partner_id = sc.school_id
                AND pu.user_id = auth.uid()
                AND pu.member_role IN ('owner', 'admin')
            )
          )
      )
    )
    OR (
      student_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM school_students ss
        WHERE ss.student_id = class_materials.student_id
          AND (
            ss.instructor_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM partner_users pu
              WHERE pu.partner_id = ss.school_id
                AND pu.user_id = auth.uid()
                AND pu.member_role IN ('owner', 'admin')
            )
          )
      )
    )
  );


-- 3. Create user_course_progress table
CREATE TABLE IF NOT EXISTS user_course_progress (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id             text NOT NULL,
  completed_chapter_ids text[] NOT NULL DEFAULT '{}',
  progress_percent      integer NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  status                text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  last_accessed_at      timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_course_progress UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_id ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_lookup ON user_course_progress(user_id, course_id);

ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;

-- 4. user_course_progress RLS Policies
DROP POLICY IF EXISTS "Users manage own course progress" ON user_course_progress;
CREATE POLICY "Users manage own course progress" ON user_course_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Instructors read student course progress" ON user_course_progress;
CREATE POLICY "Instructors read student course progress" ON user_course_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
    OR EXISTS (
      SELECT 1 FROM school_students ss
      WHERE ss.student_id = user_course_progress.user_id
        AND (
          ss.instructor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM partner_users pu
            WHERE pu.partner_id = ss.school_id
              AND pu.user_id = auth.uid()
          )
        )
    )
  );

-- 5. Data API exposure grants
GRANT ALL ON TABLE class_materials TO authenticated;
GRANT ALL ON TABLE user_course_progress TO authenticated;
