import { supabase } from '../lib/supabase';

export interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  targetModule: string;
  timestamp: string;
  details?: string;
}

export type TargetModule =
  | 'users'
  | 'settings'
  | 'articles'
  | 'glossary'
  | 'partners'
  | 'moderation'
  | 'ads'
  | 'courses'
  | 'books'
  | 'tools'
  | 'trades'
  | 'jobs'
  | 'legal'
  | 'system';

const STORAGE_KEY = 'epitotudas_audit_logs';

const INITIAL_DEFAULT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    actorEmail: 'admin@epitotudas.hu',
    action: 'USER_ROLE_UPDATE',
    targetModule: 'users',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    details: 'Felhasználó (szerkeszto@epitotudas.hu) szerepköre módosítva -> editor',
  },
  {
    id: 'audit-2',
    actorEmail: 'admin@epitotudas.hu',
    action: 'ARTICLE_PUBLISH',
    targetModule: 'articles',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: 'Betonozási technológiák és minőségellenőrzés cikk publikálva',
  },
  {
    id: 'audit-3',
    actorEmail: 'admin@epitotudas.hu',
    action: 'LEGAL_DOC_UPDATE',
    targetModule: 'legal',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: 'GDPR adatkezelési tájékoztató és ÁSZF v2.0 élesítve',
  },
  {
    id: 'audit-4',
    actorEmail: 'admin@epitotudas.hu',
    action: 'SETTINGS_UPDATE',
    targetModule: 'settings',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    details: 'Adminisztrációs témaszínek és fejléclécek frissítve',
  },
];

function getLocalAuditLogs(): AuditLog[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_LOGS));
      return INITIAL_DEFAULT_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEFAULT_LOGS;
  } catch {
    return INITIAL_DEFAULT_LOGS;
  }
}

function saveLocalAuditLogs(logs: AuditLog[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 500))); // Keep last 500 logs
  } catch (err) {
    console.warn('Nem sikerült az audit naplót menteni localStorage-ba:', err);
  }
}

/**
 * Audit log esemény rögzítése.
 * Először a Supabase audit_logs táblába próbálja menteni. Ha az adatbázis tábla még nem létezik
 * vagy nincs kapcsolat, a localStorage-ba menti, garantálva a megszakításmentes működést.
 */
export async function logAuditAction(
  action: string,
  targetModule: TargetModule | string,
  details: string,
  actorEmailOverride?: string
): Promise<AuditLog> {
  let actorEmail = actorEmailOverride || 'admin@epitotudas.hu';

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.email) {
      actorEmail = sessionData.session.user.email;
    }
  } catch {
    // Használja az alapelemként megadott emailt
  }

  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actorEmail,
    action: action.toUpperCase(),
    targetModule: targetModule.toLowerCase(),
    timestamp: new Date().toISOString(),
    details,
  };

  // 1. Mentés local state / localStorage-ba
  const existing = getLocalAuditLogs();
  const updated = [newLog, ...existing];
  saveLocalAuditLogs(updated);

  // 2. Próbálkozás mentéssel Supabase-be (ha van audit_logs tábla)
  try {
    await supabase.from('audit_logs').insert([
      {
        id: newLog.id,
        actor_email: newLog.actorEmail,
        action: newLog.action,
        target_module: newLog.targetModule,
        details: newLog.details,
        created_at: newLog.timestamp,
      },
    ]);
  } catch {
    // Csendes fallback localStorage-ra
  }

  return newLog;
}

export interface FetchAuditLogsFilters {
  module?: string;
  action?: string;
  searchQuery?: string;
}

/**
 * Audit naplók lekérése (Supabase-ből, vagy fallbackként local storage-ból)
 */
export async function fetchAuditLogs(filters?: FetchAuditLogsFilters): Promise<AuditLog[]> {
  let allLogs: AuditLog[] = [];

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data && data.length > 0) {
      allLogs = data.map((row: any) => ({
        id: row.id,
        actorEmail: row.actor_email || row.actorEmail || 'admin@epitotudas.hu',
        action: (row.action || 'ACTION').toUpperCase(),
        targetModule: row.target_module || row.targetModule || 'system',
        timestamp: row.created_at || row.timestamp || new Date().toISOString(),
        details: row.details || '',
      }));
    } else {
      allLogs = getLocalAuditLogs();
    }
  } catch {
    allLogs = getLocalAuditLogs();
  }

  // Szűrések alkalmazása
  if (filters) {
    if (filters.module && filters.module !== 'all') {
      allLogs = allLogs.filter((l) => l.targetModule.toLowerCase() === filters.module?.toLowerCase());
    }
    if (filters.action && filters.action !== 'all') {
      allLogs = allLogs.filter((l) => l.action.toLowerCase() === filters.action?.toLowerCase());
    }
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      allLogs = allLogs.filter(
        (l) =>
          l.actorEmail.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.targetModule.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }
  }

  return allLogs;
}

/**
 * Audit napló bejegyzések törlése (Adminisztrátori művelet)
 */
export async function clearAuditLogs(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  try {
    await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch {}
}
