import { countArticles } from './articleService';
import { countGlossaryTerms } from './glossaryService';
import { countTools } from './toolService';
import { countCategories } from './categoryService';
import { countUsers } from './userService';

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

const DEFAULT_MODERATION_ITEMS: ModerationItem[] = [
  {
    id: 'mod-1',
    type: 'cikk',
    title: 'Monolitikus vasbeton szerkezetek zsaluzási technológiái',
    author: 'Kovács Péter (Szakember)',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'submitted',
    excerpt: 'Gyakorlati útmutató a zsaluzási rendszerek kiválasztásához és biztonságos szereléséhez.',
  },
  {
    id: 'mod-2',
    type: 'fogalom',
    title: 'Öntömörödő beton (SCC)',
    author: 'Tóth Balázs (Oktató)',
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'submitted',
    excerpt: 'Olyan betonfajta, amely saját súlya alatt tömörödik vibrálás nélkül.',
  },
  {
    id: 'mod-3',
    type: 'szerszam',
    title: 'Bosch Professional GBH 18V-26 akkus fúrókalapács',
    author: 'Molnár Gábor (Partner)',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'submitted',
    excerpt: 'Ipari kategóriás akkumulátoros fúrókalapács SDS-plus szerszámbefogással.',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    actorEmail: 'admin@epitotudas.hu',
    action: 'RBAC_ROLE_ASSIGN',
    targetModule: 'users',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    details: 'Új szerkesztői jogosultság hozzárendelve',
  },
  {
    id: 'audit-2',
    actorEmail: 'admin@epitotudas.hu',
    action: 'ARTICLE_PUBLISH',
    targetModule: 'articles',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: 'Betonozás lépésről lépésre cikk publikálva',
  },
  {
    id: 'audit-3',
    actorEmail: 'admin@epitotudas.hu',
    action: 'LEGAL_DOCS_UPDATE',
    targetModule: 'legal',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: 'GDPR tájékoztató és ÁSZF v1.0 élesítve',
  },
];

export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const [totalArticles, totalTerms, totalTools, totalCategories, totalUsers] = await Promise.all([
      countArticles().catch(() => 0),
      countGlossaryTerms().catch(() => 0),
      countTools().catch(() => 0),
      countCategories().catch(() => 0),
      countUsers().catch(() => 0),
    ]);

    return {
      totalArticles,
      totalTerms,
      totalTools,
      totalCategories,
      totalUsers,
      pendingModerationCount: DEFAULT_MODERATION_ITEMS.length,
      totalPartnersCount: 3,
    };
  } catch (err) {
    void err;
    return {
      totalArticles: 0,
      totalTerms: 0,
      totalTools: 0,
      totalCategories: 0,
      totalUsers: 0,
      pendingModerationCount: 3,
      totalPartnersCount: 3,
    };
  }
}

export async function getPendingModerationItems(): Promise<ModerationItem[]> {
  return DEFAULT_MODERATION_ITEMS;
}

export async function approveModerationItem(id: string): Promise<void> {
  const index = DEFAULT_MODERATION_ITEMS.findIndex((item) => item.id === id);
  if (index !== -1) {
    DEFAULT_MODERATION_ITEMS[index].status = 'approved';
  }
}

export async function rejectModerationItem(id: string): Promise<void> {
  const index = DEFAULT_MODERATION_ITEMS.findIndex((item) => item.id === id);
  if (index !== -1) {
    DEFAULT_MODERATION_ITEMS[index].status = 'rejected';
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return DEFAULT_AUDIT_LOGS;
}
