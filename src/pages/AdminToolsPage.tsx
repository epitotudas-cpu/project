import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pencil, AlertCircle, RefreshCw, Wrench, Plus, Search, Power, PowerOff, Trash2 } from 'lucide-react';
import type { Tool } from '../lib/supabase';
import { listTools, setToolStatus, deleteTool } from '../services/toolService';
import { useToast } from '../components/ToastProvider';
import EditToolModal from '../components/EditToolModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

type StatusFilter = 'all' | Tool['status'];

const STATUS_BADGE: Record<Tool['status'], { label: string; class: string }> = {
  active: { label: 'Aktív', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  discontinued: { label: 'Kivezetve', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

interface AdminToolsPageProps {
  initialSearchQuery?: string;
  readOnly?: boolean;
}

export default function AdminToolsPage({ initialSearchQuery, readOnly = false }: AdminToolsPageProps = {}) {
  const toast = useToast();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<Tool | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const loadTools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTools({ status: statusFilter });
      setTools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt az eszközök betöltésekor.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.type ?? '').toLowerCase().includes(q) ||
        (t.brand ?? '').toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q)
    );
  }, [tools, search]);

  useEffect(() => {
    if (search && filtered.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`admin-tool-${filtered[0].id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-amber-400', 'transition-all');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-amber-400');
          }, 2500);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [search, filtered]);

  async function toggleStatus(tool: Tool) {
    const next: Tool['status'] = tool.status === 'active' ? 'discontinued' : 'active';
    setTogglingId(tool.id);
    try {
      await setToolStatus(tool.id, next);
      setTools((prev) =>
        prev.map((t) => (t.id === tool.id ? { ...t, status: next, updated_at: new Date().toISOString() } : t))
      );
      toast.success(`Eszköz ${next === 'active' ? 'aktíválva' : 'kivezetve'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Státusz módosítás sikertelen.');
    } finally {
      setTogglingId(null);
    }
  }

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(tool: Tool) {
    setEditing(tool);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
  }

  function handleSaved(saved: Tool) {
    setTools((prev) => {
      const existed = prev.some((t) => t.id === saved.id || (Boolean(saved.slug) && t.slug === saved.slug));
      if (existed) {
        return prev.map((t) => (t.id === saved.id || (Boolean(saved.slug) && t.slug === saved.slug) ? { ...t, ...saved } : t));
      }
      return [saved, ...prev];
    });
    toast.success('Eszköz sikeresen elmentve.');
    closeEditor();
  }

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const selectClass =
    'border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors';

  if (readOnly) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fadeIn text-slate-100">
        {/* Partner Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5" /> Katalógus
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Eszközök &amp; Szerszámok katalógusa
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {tools.length} eszköz rögzítve a platform katalógusában.
            </p>
          </div>
          {!loading && (
            <button
              onClick={loadTools}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw size={14} /> Frissítés
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés név, típus, márka..."
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <select
            className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all" className="bg-slate-900 text-white">Összes státusz</option>
            <option value="active" className="bg-slate-900 text-white">Aktív</option>
            <option value="discontinued" className="bg-slate-900 text-white">Kivezetve</option>
          </select>
        </div>

        {error && (
          <div className="p-4 bg-red-950/50 border border-red-500/30 rounded-2xl flex items-center gap-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-xs flex-1">{error}</p>
            <button onClick={loadTools} className="text-red-300 text-xs font-bold hover:text-white cursor-pointer">
              Újrapróbálás
            </button>
          </div>
        )}

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Eszköz</th>
                  <th className="px-4 py-3 whitespace-nowrap">Típus</th>
                  <th className="px-4 py-3">Leírás</th>
                  <th className="px-4 py-3 whitespace-nowrap">Státusz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3.5"><div className="h-4 w-40 bg-slate-800 rounded animate-pulse" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 w-20 bg-slate-800 rounded animate-pulse" /></td>
                      <td className="px-4 py-3.5"><div className="h-4 w-48 bg-slate-800 rounded animate-pulse" /></td>
                      <td className="px-4 py-3.5"><div className="h-5 w-20 bg-slate-800 rounded-full animate-pulse" /></td>
                    </tr>
                  ))}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-14 text-center">
                      <Wrench size={32} className="mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-400 text-xs">
                        {search || statusFilter !== 'all' ? 'Nincs a szűrőknek megfelelő eszköz.' : 'Még nincs eszköz.'}
                      </p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((t) => {
                    const badge = STATUS_BADGE[t.status];
                    return (
                      <tr key={t.id} id={`admin-tool-${t.id}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-white line-clamp-1">{t.name}</p>
                          {t.brand && <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{t.brand}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">{t.type ?? '—'}</td>
                        <td className="px-4 py-3.5 text-slate-400 max-w-xs">
                          <p className="line-clamp-2">{t.description ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.class}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" style={{ color: textColor }}>
      <div className="flex items-start justify-between gap-4 flex-wrap border-b pb-4" style={{ borderColor: cardBorder }}>
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-black flex items-center gap-2.5">
            <Wrench style={{ color: cardHighlight }} size={28} /> Eszközök &amp; Szerszámok katalógusa
          </h1>
          <p className="text-sm text-gray-400 mt-1">{tools.length} eszköz rögzítve</p>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={openCreate}
              style={{ backgroundColor: cardHighlight, color: '#000000' }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-black rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-md"
            >
              <Plus size={14} /> Új eszköz
            </button>
          )}
          {!loading && (
            <button
              onClick={loadTools}
              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
              className="inline-flex items-center gap-2 px-3 py-2 border text-sm font-bold rounded-lg hover:opacity-90 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} /> Frissítés
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés név, típus, márka..."
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none transition-colors"
          />
        </div>
        <select
          style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
          className={selectClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Összes státusz</option>
          <option value="active">Aktív</option>
          <option value="discontinued">Kivezetve</option>
        </select>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={loadTools} className="text-red-400 text-sm font-bold hover:text-red-300">Újrapróbálás</button>
        </div>
      )}

      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="mt-6 border rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderColor: cardBorder }} className="border-b text-left">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Eszköz</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Típus</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Leírás</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Státusz</th>
                {!readOnly && (
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Műveletek</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1E1E1E]/50">
                    <td className="px-4 py-3.5"><div className="h-4 w-40 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-48 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-20 bg-[#1E1E1E] rounded-full animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 bg-[#1E1E1E] rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Wrench size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">{search || statusFilter !== 'all' ? 'Nincs a szűrőknek megfelelő eszköz.' : 'Még nincs eszköz.'}</p>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((t) => {
                  const badge = STATUS_BADGE[t.status];
                  const isActive = t.status === 'active';
                  return (
                    <tr key={t.id} id={`admin-tool-${t.id}`} className="border-b border-[#1E1E1E]/50 hover:bg-[#1E1E1E]/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-gray-200 line-clamp-1">{t.name}</p>
                        {t.brand && <p className="text-gray-600 text-xs line-clamp-1 mt-0.5">{t.brand}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">{t.type ?? '—'}</td>
                      <td className="px-4 py-3.5 text-gray-400 max-w-xs">
                        <p className="line-clamp-2">{t.description ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-300 border border-[#1E1E1E] rounded-md hover:bg-[#1E1E1E] hover:text-white transition-colors"
                            >
                              <Pencil size={12} /> Szerkesztés
                            </button>
                            <button
                              onClick={() => toggleStatus(t)}
                              disabled={togglingId === t.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                isActive
                                  ? 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'
                                  : 'text-green-400 border-green-500/20 hover:bg-green-500/10'
                              }`}
                              title={isActive ? 'Kivezet' : 'Aktivál'}
                            >
                              {isActive ? <PowerOff size={12} /> : <Power size={12} />}
                              {isActive ? 'Kivezet' : 'Aktivál'}
                            </button>
                            <button
                              onClick={() => setToolToDelete(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Eszköz törlése"
                            >
                              <Trash2 size={12} /> Törlés
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {editorOpen && (
        <EditToolModal
          tool={editing}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={!!toolToDelete}
        title="Eszköz törlése"
        message={`Biztosan törölni szeretnéd a(z) „${toolToDelete?.name || ''}” eszközt?`}
        confirmLabel="Törlés"
        destructive
        onCancel={() => setToolToDelete(null)}
        onConfirm={async () => {
          if (!toolToDelete) return;
          try {
            await deleteTool(toolToDelete.id);
            setTools((prev) => prev.filter((item) => item.id !== toolToDelete.id));
            toast.success('Eszköz sikeresen törölve.');
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Hiba az eszköz törlésekor.');
          } finally {
            setToolToDelete(null);
          }
        }}
      />
    </div>
  );
}
