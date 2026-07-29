/*
# Additive Migration: Community Engagement (comments, user_favorites, user_follows)

## Purpose
Adds social and community interactive features to ÉpítőTudás:
comments with ratings, favorite bookmarks, and user follows.
*/

CREATE TABLE IF NOT EXISTS comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name    text NOT NULL,
  content_type text NOT NULL, -- 'article' | 'glossary' | 'tool' | 'course'
  content_id   text NOT NULL,
  comment_text text NOT NULL,
  rating       integer DEFAULT 5,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id   text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_type, content_id)
);

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Public read policies
DROP POLICY IF EXISTS "Public read comments" ON comments;
CREATE POLICY "Public read comments" ON comments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read user_favorites" ON user_favorites;
CREATE POLICY "Public read user_favorites" ON user_favorites FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read user_follows" ON user_follows;
CREATE POLICY "Public read user_follows" ON user_follows FOR SELECT TO anon, authenticated USING (true);
