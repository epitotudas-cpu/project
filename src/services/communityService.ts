import { type Comment } from '../lib/supabase';
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
        comment_text: 'Nagyon részletes és hasznos összefoglaló a zsaluzási technológiákról! Különösen a pillérzsaluk szerelési pontjainál lévő tanácsok váltak be a gyakorlatban.',
        rating: 5,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'c-2',
        user_id: 'u-2',
        user_name: 'Szabó Tamás (Építőmérnök)',
        content_type: 'article',
        content_id: 'art-1',
        comment_text: 'Az Öntömörödő Beton utókezelési párásítását nem lehet elégszer hangsúlyozni. Érdemes kiegészíteni a felületi párazáró szeres permetezéssel.',
        rating: 5,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
  ],
]);

const IN_MEMORY_FAVORITES: Set<string> = new Set();
const IN_MEMORY_FOLLOWS: Set<string> = new Set();

export async function getComments(contentType: string, contentId: string): Promise<Comment[]> {
  const key = `${contentType}-${contentId}`;
  return IN_MEMORY_COMMENTS.get(key) || [];
}

export async function addComment(
  userId: string,
  userName: string,
  contentType: string,
  contentId: string,
  text: string,
  rating: number = 5
): Promise<Comment> {
  const key = `${contentType}-${contentId}`;
  const newComment: Comment = {
    id: `c-${Date.now()}`,
    user_id: userId,
    user_name: userName,
    content_type: contentType,
    content_id: contentId,
    comment_text: text,
    rating,
    created_at: new Date().toISOString(),
  };

  const list = IN_MEMORY_COMMENTS.get(key) || [];
  list.unshift(newComment);
  IN_MEMORY_COMMENTS.set(key, list);
  return newComment;
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
