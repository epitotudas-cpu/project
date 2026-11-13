/*
# Additive Migration: P1 Community Favorites & Follows RLS Policies

## Purpose
Allows authenticated users to insert and delete their own records in
`user_favorites` and `user_follows` so favorites and author follows persist
in Supabase across reloads.
*/

ALTER TABLE IF EXISTS public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users insert own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users delete own favorites" ON public.user_favorites;

CREATE POLICY "Users insert own favorites"
ON public.user_favorites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own favorites"
ON public.user_favorites
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own follows" ON public.user_follows;
DROP POLICY IF EXISTS "Users insert own follows" ON public.user_follows;
DROP POLICY IF EXISTS "Users delete own follows" ON public.user_follows;

CREATE POLICY "Users insert own follows"
ON public.user_follows
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users delete own follows"
ON public.user_follows
FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

