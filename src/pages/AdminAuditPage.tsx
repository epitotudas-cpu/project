import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Clock,
  Search,
  RefreshCw,
  Trash2,
  Filter,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';
import { fetchAuditLogs, clearAuditLogs, type AuditLog } from '../services/auditLogService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

const MODULE_LABELS: Record<string, string> = {
  all: 'Összes modul',
  users: 'Felhasználók & Jogok',
  settings: 'Beállítások',
  articles: 'Cikkek',
  glossary: 'Fogalomtár',
  partners: 'Partnerek',
  moderation: 'Moderáció',
  ads: 'Hirdetések',
  courses: 'Kurzusok',
  books: 'Könyvek',
  tools: 'Szerszámok',
  legal: 'Jogi leírások',
  system: 'Rendszer',
};

function getActionBadgeClass(action: string): { labelClass: string; icon: React.ReactNode } {
  const upper = action.toUpperCase();
  if (upper.includes('DELETE') || upper.includes('REJECT') || upper.includes('REVOKE')) {
    return {
      labelClass: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: <ShieldAlert size={12} className="text-red-400" />,
    };
  }
  if (upper.includes('CREATE') || upper.includes('APPROVE') || upper.includes('PUBLISH')) {
    return {
      labelClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 size={12} className="text-emerald-400" />,
    };
  }
  if (upper.includes('ROLE') || upper.includes('UPDATE') || upper.includes('INVITE') || upper.includes('TOGGLE')) {
    return {
      labelClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: <AlertTriangle size={12} className="text-amber-400" />,
    };
  }
  return {
    labelClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    icon: <FileText size={12} className="text-blue-400" />,
  };
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const loadLogs = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const data = await fetchAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Hiba az audit napló betöltésekor:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Module filter
      if (selectedModule !== 'all' && log.targetModule.toLowerCase() !== selectedModule.toLowerCase()) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          log.actorEmail.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.targetModule.toLowerCase().includes(q) ||
          (log.details && log.details.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, selectedModule, searchQuery]);

  const handleClearLogs = async () => {
    await clearAuditLogs();
    setShowClearConfirm(false);
    loadLogs();
  };

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ color: textColor }}>
      {/* Header */}
      <div style={{ borderColor: cardBorder }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-black flex items-center gap-3">
            <Activity style={{ color: cardHighlight }} size={28} />
            Audit Napló &amp; Műveleti Előzmények
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Adminisztrátori műveletek, jogosultságváltozások és biztonsági események valós idejű naplója
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => loadLogs(true)}
            disabled={refreshing}
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
            className="flex items-center gap-2 border px-3 py-2 rounded-lg text-xs font-bold hover:brightness-125 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Frissítés
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            Napló ürítése
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 border rounded-xl space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4 shadow-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés e-mail cím, akció vagy leírás alapján..."
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
            className="w-full pl-9 pr-8 py-2 border rounded-lg text-xs font-medium focus:outline-none focus:border-amber-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Module Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={14} className="text-gray-400 shrink-0" />
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
            className="border text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {Object.entries(MODULE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <span style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-xs border font-mono font-bold px-2.5 py-1.5 rounded-lg shrink-0">
            {filteredLogs.length} bejegyzés
          </span>
        </div>
      </div>

      {/* Logs Table / List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 space-y-3" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent" style={{ borderColor: `${cardHighlight} transparent ${cardHighlight} ${cardHighlight}` }} />
          <div className="text-xs font-medium">Audit napló adatok betöltése...</div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-12 border rounded-xl text-center space-y-2 shadow-sm">
          <Activity size={36} className="mx-auto text-gray-500" />
          <h3 className="text-base font-bold text-gray-300">Nincs a szűrésnek megfelelő audit bejegyzés</h3>
          <p className="text-xs text-gray-400">Próbáld meg megváltoztatni a keresési feltételeket vagy a modul szűrőt.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-xl overflow-hidden shadow-lg">
          <div style={{ borderColor: cardBorder }} className="divide-y divide-gray-800/60">
            {filteredLogs.map((log) => {
              const badgeInfo = getActionBadgeClass(log.action);
              const moduleName = MODULE_LABELS[log.targetModule.toLowerCase()] || log.targetModule;

              return (
                <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded border uppercase font-mono ${badgeInfo.labelClass}`}>
                        {badgeInfo.icon}
                        {log.action}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                        Modul: {moduleName}
                      </span>
                    </div>

                    <div style={{ color: textColor }} className="text-sm font-semibold leading-relaxed">
                      {log.details || '—'}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <User size={12} className="text-gray-500" />
                      <span className="font-mono text-gray-300">{log.actorEmail}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 flex items-center gap-1.5 shrink-0 self-start md:self-auto font-mono bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                    <Clock size={13} className="text-gray-500" />
                    {new Date(log.timestamp).toLocaleString('hu-HU', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Audit Logs */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert size={28} />
              <h3 className="text-lg font-bold">Audit napló ürítése</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Biztosan törölni szeretnéd az összes rögzített audit napló bejegyzést? Ez a művelet visszavonhatatlan, és törli a helyi biztonsági naplókat.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-200"
              >
                Mégse
              </button>
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Igen, törlés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
