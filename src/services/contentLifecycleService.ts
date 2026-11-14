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

function mapDbStatusToLifecycle(dbStatus: string | null | undefined): ContentLifecycleStatus {
  switch (dbStatus) {
    case 'draft':
      return 'draft';
    case 'pending':
      return 'submitted';
    case 'review':
      return 'review';
    case 'approved':
      return 'approved';
    case 'published':
      return 'published';
    case 'rejected':
    case 'archived':
      return 'archived';
    default:
      return 'draft';
  }
}

function mapLifecycleToDbStatus(status: ContentLifecycleStatus): string {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'submitted':
      return 'pending';
    case 'review':
      return 'review';
    case 'approved':
      return 'approved';
    case 'published':
      return 'published';
    case 'archived':
      return 'rejected';
    default:
      return 'draft';
  }
}

export async function listContentByLifecycleStatus(
  status?: ContentLifecycleStatus
): Promise<ContentLifecycleMetadata[]> {
  try {
    let query = supabase
      .from('articles')
      .select('id, title, author, partner_name, status, excerpt, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq('status', mapLifecycleToDbStatus(status));
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      return (data as Array<{
        id: string;
        title?: string | null;
        author?: string | null;
        partner_name?: string | null;
        status?: string | null;
        excerpt?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
      }>).map((row) => ({
        id: row.id,
        contentType: 'cikk',
        title: row.title || 'Cím nélkül',
        author: row.partner_name || row.author || 'Szerkesztőség',
        status: mapDbStatusToLifecycle(row.status),
        version: 1,
        submittedAt: row.updated_at || row.created_at || new Date().toISOString(),
        excerpt: row.excerpt || undefined,
      }));
    }
  } catch (err) {
    console.warn('Error loading content lifecycle from Supabase:', err);
  }

  return [];
}

export async function transitionContentStatus(
  id: string,
  newStatus: ContentLifecycleStatus,
  actorUserId?: string
): Promise<ContentLifecycleMetadata> {
  const dbStatus = mapLifecycleToDbStatus(newStatus);
  const { data: updatedRow, error } = await supabase
    .from('articles')
    .update({ status: dbStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, title, author, partner_name, status, excerpt, created_at, updated_at')
    .maybeSingle();

  if (error || !updatedRow) {
    throw new Error(error?.message || `Tartalom nem található vagy nem módosítható: ${id}`);
  }

  return {
    id: updatedRow.id,
    contentType: 'cikk',
    title: updatedRow.title || 'Cím nélkül',
    author: updatedRow.partner_name || updatedRow.author || 'Szerkesztőség',
    status: mapDbStatusToLifecycle(updatedRow.status),
    approvedBy:
      newStatus === 'approved' || newStatus === 'published'
        ? actorUserId || 'admin@epitotudas.hu'
        : undefined,
    approvedAt:
      newStatus === 'approved' || newStatus === 'published'
        ? new Date().toISOString()
        : undefined,
    version: 1,
    submittedAt: updatedRow.updated_at || updatedRow.created_at || new Date().toISOString(),
    excerpt: updatedRow.excerpt || undefined,
  };
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
