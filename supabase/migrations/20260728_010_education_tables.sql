/*
# Additive Migration: Educational Courses, Lessons, Quizzes & Certificates

## Purpose
Adds full e-learning capabilities to ÉpítőTudás:
courses, lessons, quizzes, quiz_questions, and user_certificates.
*/

CREATE TABLE IF NOT EXISTS courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text NOT NULL,
  category        text NOT NULL,
  difficulty      text NOT NULL DEFAULT 'intermediate', -- 'beginner' | 'intermediate' | 'advanced'
  duration_hours  integer NOT NULL DEFAULT 4,
  is_published    boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title           text NOT NULL,
  sequence_order  integer NOT NULL DEFAULT 1,
  content         text NOT NULL,
  video_url       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id             uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  pass_score_percentage integer NOT NULL DEFAULT 75,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id              uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question             text NOT NULL,
  options_json         jsonb NOT NULL,
  correct_option_index integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_certificates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id        uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score_achieved   integer NOT NULL,
  certificate_code text UNIQUE NOT NULL,
  issued_at        timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;

-- Public read for courses and lessons
DROP POLICY IF EXISTS "Public read courses" ON courses;
CREATE POLICY "Public read courses" ON courses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read lessons" ON lessons;
CREATE POLICY "Public read lessons" ON lessons FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read quizzes" ON quizzes;
CREATE POLICY "Public read quizzes" ON quizzes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read quiz_questions" ON quiz_questions;
CREATE POLICY "Public read quiz_questions" ON quiz_questions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read user_certificates" ON user_certificates;
CREATE POLICY "Public read user_certificates" ON user_certificates FOR SELECT TO anon, authenticated USING (true);

-- Insert Default Sample Course
INSERT INTO courses (title, slug, description, category, difficulty, duration_hours)
VALUES
  ('Monolitikus Beton- és Szerkezetépítés Mesterfogásai', 'monolitikus-beton-mesterfogasai', 'Átfogó gyakorlati és elméleti képzés a zsaluzási rendszerektől az öntömörödő betonig.', 'Szerkezetépítés', 'intermediate', 6)
ON CONFLICT (slug) DO NOTHING;
