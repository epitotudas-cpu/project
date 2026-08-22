export interface SavedItem {
  id: string; // Composite unique key: e.g. "glossary_term123" or "article_art456"
  itemId: string;
  itemType: 'article' | 'glossary';
  title: string;
  subtitle?: string; // category name or author
  description?: string; // excerpt or definition snippet
  slug: string;
  imageUrl?: string;
  savedAt: string; // ISO timestamp
  readTime?: number;
}

const STORAGE_PREFIX = 'epitotudas_saved_items_user_';

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function getSavedItems(userId: string | null | undefined): SavedItem[] {
  if (!userId || typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load saved items:', e);
    return [];
  }
}

export function isItemSaved(
  userId: string | null | undefined,
  itemId: string,
  itemType: 'article' | 'glossary'
): boolean {
  if (!userId || !itemId) return false;
  const items = getSavedItems(userId);
  return items.some((item) => item.itemId === itemId && item.itemType === itemType);
}

export function saveItem(
  userId: string,
  item: Omit<SavedItem, 'savedAt' | 'id'>
): SavedItem[] {
  if (!userId || typeof window === 'undefined') return [];
  const compositeId = `${item.itemType}_${item.itemId}`;
  const existing = getSavedItems(userId);

  // If already saved, return existing
  if (existing.some((i) => i.id === compositeId)) {
    return existing;
  }

  const newItem: SavedItem = {
    ...item,
    id: compositeId,
    savedAt: new Date().toISOString(),
  };

  const updated = [newItem, ...existing];
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save item:', e);
  }
  return updated;
}

export function removeSavedItem(
  userId: string,
  itemId: string,
  itemType: 'article' | 'glossary'
): SavedItem[] {
  if (!userId || typeof window === 'undefined') return [];
  const existing = getSavedItems(userId);
  const updated = existing.filter(
    (item) => !(item.itemId === itemId && item.itemType === itemType)
  );

  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove saved item:', e);
  }
  return updated;
}

export function toggleSaveItem(
  userId: string,
  item: Omit<SavedItem, 'savedAt' | 'id'>
): { isSaved: boolean; items: SavedItem[] } {
  const currentlySaved = isItemSaved(userId, item.itemId, item.itemType);
  if (currentlySaved) {
    const items = removeSavedItem(userId, item.itemId, item.itemType);
    return { isSaved: false, items };
  } else {
    const items = saveItem(userId, item);
    return { isSaved: true, items };
  }
}
