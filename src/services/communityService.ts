import { supabase, type Comment } from '../lib/supabase';
export type { Comment };

const IN_MEMORY_COMMENTS: Map<string, Comment[]> = new Map([
  [
    'article-art-1',
    [
      {
        id: 'c-1',
        user_id: 'u-1',
        user_name: 'Kovács Péter (Kőműves Mester)',
        content_type: 'article',
        content_id: 'art-1',
        comment_text:
          'Nagyon részletes és hasznos összefoglaló a zsaluzási technológiákról! Különösen a pillérzsaluk szerelési pontjainál lévő tanácsok váltak be a gyakorlatban.',
        rating: 5,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'c-2',
        user_id: 'u-2',
        user_name: 'Szabó Tamás (Építőmérnök)',
        content_type: 'article',
        content_id: 'art-1',
        comment_text:
          'Az Öntömörödő Beton utókezelési párásítását nem lehet elégszer hangsúlyozni. Érdemes kiegészíteni a felületi párazáró szeres permetezéssel.',
        rating: 5,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
  ],
]);

const IN_MEMORY_FAVORITES: Set<string> = new Set();
const IN_MEMORY_FOLLOWS: Set<string> = new Set();

export async function getComments(
  contentType: string,
  contentId: string,
  altContentId?: string
): Promise<Comment[]> {
  try {
    let query = supabase
      .from('comments')
      .select('*')
      .eq('content_type', contentType);

    const idsToMatch = [contentId];
    if (altContentId && altContentId !== contentId) {
      idsToMatch.push(altContentId);
    }

    if (idsToMatch.length > 1) {
      query = query.in('content_id', idsToMatch);
    } else {
      query = query.eq('content_id', contentId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Comment[];
    }
  } catch (err) {
    console.error('Failed to load comments from Supabase:', err);
  }

  // Fallback to local storage or memory mock
  try {
    const key = `epitotudas_comments_${contentType}_${contentId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  const memKey = `${contentType}-${contentId}`;
  return IN_MEMORY_COMMENTS.get(memKey) || [];
}

export async function addComment(
  userId: string,
  userName: string,
  contentType: string,
  contentId: string,
  text: string,
  rating: number = 5
): Promise<Comment> {
  // Check if userId is a valid UUID or fallback
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  const newCommentObj = {
    user_id: isUuid ? userId : null,
    user_name: userName || 'ÉpítőTudás Felhasználó',
    content_type: contentType,
    content_id: contentId,
    comment_text: text,
    rating,
  };

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([newCommentObj])
      .select('*')
      .single();

    if (!error && data) {
      const created = data as Comment;
      saveCommentLocally(contentType, contentId, created);
      return created;
    }
  } catch (err) {
    console.error('Failed to save comment to Supabase:', err);
  }

  // Fallback if Supabase insert returns error or offline
  const fallbackComment: Comment = {
    id: `c-${Date.now()}`,
    user_id: userId,
    user_name: userName || 'ÉpítőTudás Felhasználó',
    content_type: contentType,
    content_id: contentId,
    comment_text: text,
    rating,
    created_at: new Date().toISOString(),
  };

  saveCommentLocally(contentType, contentId, fallbackComment);
  return fallbackComment;
}

function saveCommentLocally(contentType: string, contentId: string, comment: Comment) {
  try {
    const key = `epitotudas_comments_${contentType}_${contentId}`;
    const raw = localStorage.getItem(key);
    const existing: Comment[] = raw ? JSON.parse(raw) : [];
    const updated = [comment, ...existing.filter((c) => c.id !== comment.id)];
    localStorage.setItem(key, JSON.stringify(updated));

    const memKey = `${contentType}-${contentId}`;
    IN_MEMORY_COMMENTS.set(memKey, updated);
  } catch (e) {
    console.error('Failed to save comment locally:', e);
  }
}

export async function updateComment(
  commentId: string,
  userId: string | null | undefined,
  text: string,
  rating: number
): Promise<boolean> {
  if (!commentId || !text.trim()) return false;

  try {
    const { error } = await supabase
      .from('comments')
      .update({
        comment_text: text.trim(),
        rating: rating,
      })
      .eq('id', commentId);

    if (!error) return true;
    console.error('Failed to update comment in Supabase:', error);
  } catch (err) {
    console.error('Error updating comment:', err);
  }

  return false;
}

export async function deleteComment(
  commentId: string,
  userId: string | null | undefined
): Promise<boolean> {
  if (!commentId) return false;

  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (!error) return true;
    console.error('Failed to delete comment from Supabase:', error);
  } catch (err) {
    console.error('Error deleting comment:', err);
  }

  return false;
}

export async function toggleFavorite(userId: string, itemType: string, itemId: string): Promise<boolean> {
  const key = `${userId}:${itemType}:${itemId}`;
  if (IN_MEMORY_FAVORITES.has(key)) {
    IN_MEMORY_FAVORITES.delete(key);
    return false;
  }
  IN_MEMORY_FAVORITES.add(key);
  return true;
}

export async function isFavorite(userId: string, itemType: string, itemId: string): Promise<boolean> {
  return IN_MEMORY_FAVORITES.has(`${userId}:${itemType}:${itemId}`);
}

export async function toggleFollowAuthor(userId: string, authorId: string): Promise<boolean> {
  const key = `${userId}:${authorId}`;
  if (IN_MEMORY_FOLLOWS.has(key)) {
    IN_MEMORY_FOLLOWS.delete(key);
    return false;
  }
  IN_MEMORY_FOLLOWS.add(key);
  return true;
}

export async function isFollowingAuthor(userId: string, authorId: string): Promise<boolean> {
  return IN_MEMORY_FOLLOWS.has(`${userId}:${authorId}`);
}
