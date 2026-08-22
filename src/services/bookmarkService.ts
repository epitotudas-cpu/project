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

function getEffectiveUserId(userId: string | null | undefined): string {
  if (userId && typeof userId === 'string' && userId.trim().length > 0) {
    return userId.trim();
  }
  if (typeof window === 'undefined') return 'guest_default';
  try {
    let guestId = localStorage.getItem('epitotudas_guest_user_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('epitotudas_guest_user_id', guestId);
    }
    return guestId;
  } catch {
    return 'guest_default';
  }
}

function getStorageKey(userId: string | null | undefined): string {
  const effectiveId = getEffectiveUserId(userId);
  return `${STORAGE_PREFIX}${effectiveId}`;
}

export function getSavedItems(userId: string | null | undefined): SavedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const effectiveId = getEffectiveUserId(userId);
    const key = getStorageKey(effectiveId);
    let raw = localStorage.getItem(key);

    // If logged in user has no items yet, check if guest items exist and migrate them
    if (!raw && userId) {
      const guestKey = getStorageKey(null);
      const guestRaw = localStorage.getItem(guestKey);
      if (guestRaw) {
        raw = guestRaw;
        localStorage.setItem(key, guestRaw);
      }
    }

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
  if (!itemId) return false;
  const items = getSavedItems(userId);
  return items.some(
    (item) =>
      (item.itemId === itemId || (item.slug && item.slug === itemId) || item.title === itemId) &&
      item.itemType === itemType
  );
}

export function saveItem(
  userId: string | null | undefined,
  item: Omit<SavedItem, 'savedAt' | 'id'>
): SavedItem[] {
  if (typeof window === 'undefined') return [];
  const effectiveId = getEffectiveUserId(userId);
  const compositeId = `${item.itemType}_${item.itemId}`;
  const existing = getSavedItems(effectiveId);

  // If already saved, return existing
  if (
    existing.some(
      (i) =>
        i.id === compositeId ||
        (i.itemId === item.itemId && i.itemType === item.itemType) ||
        (i.title === item.title && i.itemType === item.itemType)
    )
  ) {
    return existing;
  }

  const newItem: SavedItem = {
    ...item,
    id: compositeId,
    savedAt: new Date().toISOString(),
  };

  const updated = [newItem, ...existing];
  try {
    localStorage.setItem(getStorageKey(effectiveId), JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save item:', e);
  }
  return updated;
}

export function removeSavedItem(
  userId: string | null | undefined,
  itemId: string,
  itemType: 'article' | 'glossary'
): SavedItem[] {
  if (typeof window === 'undefined') return [];
  const effectiveId = getEffectiveUserId(userId);
  const existing = getSavedItems(effectiveId);
  const updated = existing.filter(
    (item) =>
      !(
        (item.itemId === itemId || (item.slug && item.slug === itemId) || item.title === itemId) &&
        item.itemType === itemType
      )
  );

  try {
    localStorage.setItem(getStorageKey(effectiveId), JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove saved item:', e);
  }
  return updated;
}

export function toggleSaveItem(
  userId: string | null | undefined,
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
