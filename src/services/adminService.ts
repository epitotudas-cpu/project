import { supabase } from '../lib/supabase';
import { countArticles } from './articleService';
import { countGlossaryTerms } from './glossaryService';
import { countTools } from './toolService';
import { countCategories } from './categoryService';
import { countUsers } from './userService';
import { fetchAuditLogs, logAuditAction } from './auditLogService';

export interface PlatformStats {
  totalArticles: number;
  totalTerms: number;
  totalTools: number;
  totalCategories: number;
  totalUsers: number;
  pendingModerationCount: number;
  totalPartnersCount: number;
}

export interface ModerationItem {
  id: string;
  type: 'cikk' | 'fogalom' | 'szerszam';
  title: string;
  author: string;
  submittedAt: string;
  status: 'submitted' | 'review' | 'approved' | 'rejected';
  excerpt?: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  targetModule: string;
  timestamp: string;
  details?: string;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const [
      totalArticles,
      totalTerms,
      totalTools,
      totalCategories,
      totalUsers,
      pendingRes,
      partnersRes,
    ] = await Promise.all([
      countArticles().catch(() => 0),
      countGlossaryTerms().catch(() => 0),
      countTools().catch(() => 0),
      countCategories().catch(() => 0),
      countUsers().catch(() => 0),
      supabase
        .from('articles')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'review']),
      supabase
        .from('partners')
        .select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalArticles,
      totalTerms,
      totalTools,
      totalCategories,
      totalUsers,
      pendingModerationCount: pendingRes.count ?? 0,
      totalPartnersCount: partnersRes.count ?? 0,
    };
  } catch (err) {
    void err;
    return {
      totalArticles: 0,
      totalTerms: 0,
      totalTools: 0,
      totalCategories: 0,
      totalUsers: 0,
      pendingModerationCount: 0,
      totalPartnersCount: 0,
    };
  }
}

export async function getPendingModerationItems(): Promise<ModerationItem[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, author, partner_name, status, excerpt, updated_at, created_at')
      .in('status', ['pending', 'review'])
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return (data as Array<{
      id: string;
      title?: string | null;
      author?: string | null;
      partner_name?: string | null;
      status?: string | null;
      excerpt?: string | null;
      updated_at?: string | null;
      created_at?: string | null;
    }>).map((row) => ({
      id: row.id,
      type: 'cikk',
      title: row.title || 'Cím nélkül',
      author: row.partner_name || row.author || 'Szerkesztőség',
      submittedAt: row.updated_at || row.created_at || new Date().toISOString(),
      status: 'submitted',
      excerpt: row.excerpt || undefined,
    }));
  } catch {
    return [];
  }
}

export async function approveModerationItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('articles')
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (!error) {
    await logAuditAction(
      'MODERATION_APPROVE',
      'moderation',
      `Tartalom jóváhagyva és publikálva: ${id}`
    );
  }
}

export async function rejectModerationItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('articles')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (!error) {
    await logAuditAction(
      'MODERATION_REJECT',
      'moderation',
      `Tartalom elutasítva / archiválva: ${id}`
    );
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return fetchAuditLogs();
}

