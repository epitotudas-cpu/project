import { supabase } from '../lib/supabase';

export type ContentType = 'cikk' | 'fogalom' | 'szerszam' | 'tananyag';

export type ContentLifecycleStatus =
  | 'draft'
  | 'submitted'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived';

export interface ContentLifecycleMetadata {
  id: string;
  contentType: ContentType;
  title: string;
  author: string;
  status: ContentLifecycleStatus;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  version: number;
  submittedAt: string;
  excerpt?: string;
}

const IN_MEMORY_LIFECYCLE_STORE: Map<string, ContentLifecycleMetadata> = new Map([
  [
    'item-1',
    {
      id: 'item-1',
      contentType: 'cikk',
      title: 'Monolitikus vasbeton szerkezetek zsaluzási technológiái',
      author: 'Kovács Péter (Szakember)',
      status: 'submitted',
      version: 1,
      submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      excerpt: 'Gyakorlati útmutató a zsaluzási rendszerek kiválasztásához és szereléséhez.',
    },
  ],
  [
    'item-2',
    {
      id: 'item-2',
      contentType: 'fogalom',
      title: 'Öntömörödő beton (SCC)',
      author: 'Tóth Balázs (Oktató)',
      status: 'review',
      version: 1,
      submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      excerpt: 'Olyan betonfajta, amely saját súlya alatt tömörödik vibrálás nélkül.',
    },
  ],
  [
    'item-3',
    {
      id: 'item-3',
      contentType: 'szerszam',
      title: 'Bosch Professional GBH 18V-26 akkus fúrókalapács',
      author: 'Molnár Gábor (Partner)',
      status: 'approved',
      approvedBy: 'admin@epitotudas.hu',
      approvedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      version: 1,
      submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      excerpt: 'Ipari kategóriás akkumulátoros fúrókalapács SDS-plus szerszámbefogással.',
    },
  ],
]);

export async function listContentByLifecycleStatus(
  status?: ContentLifecycleStatus
): Promise<ContentLifecycleMetadata[]> {
  const all = Array.from(IN_MEMORY_LIFECYCLE_STORE.values());
  if (status) {
    return all.filter((item) => item.status === status);
  }
  return all;
}

export async function transitionContentStatus(
  id: string,
  newStatus: ContentLifecycleStatus,
  actorUserId?: string
): Promise<ContentLifecycleMetadata> {
  const item = IN_MEMORY_LIFECYCLE_STORE.get(id);
  if (!item) {
    throw new Error(`Tartalom nem található: ${id}`);
  }

  item.status = newStatus;
  if (newStatus === 'approved' || newStatus === 'published') {
    item.approvedBy = actorUserId || 'admin@epitotudas.hu';
    item.approvedAt = new Date().toISOString();
  }

  IN_MEMORY_LIFECYCLE_STORE.set(id, item);

  // Sync to database if DB item exists
  try {
    const tableName =
      item.contentType === 'cikk'
        ? 'articles'
        : item.contentType === 'fogalom'
        ? 'glossary_terms'
        : item.contentType === 'szerszam'
        ? 'tools'
        : null;

    if (tableName) {
      const dbStatus = newStatus === 'published' ? 'published' : newStatus === 'draft' ? 'draft' : 'review';
      await supabase.from(tableName as 'articles').update({ status: dbStatus }).eq('id', id);
    }
  } catch (err) {
    void err;
  }

  return item;
}

export function getStatusLabel(status: ContentLifecycleStatus): string {
  switch (status) {
    case 'draft':
      return 'Piszkozat';
    case 'submitted':
      return 'Beküldve';
    case 'review':
      return 'Ellenőrzés alatt';
    case 'approved':
      return 'Jóváhagyva';
    case 'published':
      return 'Publikálva';
    case 'archived':
      return 'Archiválva';
    default:
      return status;
  }
}
