import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pencil, AlertCircle, RefreshCw, BookOpen, Plus, Search,
  FileJson, ListChecks, Tag, Globe, Hash, Sparkles,
} from 'lucide-react';
import type { GlossaryTerm } from '../lib/supabase';
import { listGlossaryTerms, countArticlesForTerms } from '../services/glossaryService';
import { useToast } from '../components/ToastProvider';
import EditGlossaryTermModal from '../components/EditGlossaryTermModal';
import ImportGlossaryValidationModal from '../components/ImportGlossaryValidationModal';
import BatchEditGlossaryModal from '../components/BatchEditGlossaryModal';
import GlossaryCategorySettingsModal from '../components/GlossaryCategorySettingsModal';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

type GlossaryTermWithCount = GlossaryTerm & { articleCount: number };

/* ── Típus badge stílusok ──────────────────────────────── */
function TypeBadge({ type }: { type: string }) {
  const isTechnical = type !== 'industry_term';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
        isTechnical
          ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
      }`}
    >
      {isTechnical ? '📘 Szakmai' : '🗣 Zsargon'}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════ */
interface AdminGlossaryPageProps {
  initialSearchQuery?: string;
}

export default function AdminGlossaryPage({ initialSearchQuery }: AdminGlossaryPageProps = {}) {
  const toast = useToast();
  const [terms, setTerms] = useState<GlossaryTermWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<GlossaryTerm | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState(initialSearchQuery || '');

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [importValidationOpen, setImportValidationOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [catSettingsOpen, setCatSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<'all' | 'technical_concept' | 'industry_term'>('all');

  /* ── Data loading ─────────────────────────────────────── */
  const loadTerms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listGlossaryTerms();
      const countMap = await countArticlesForTerms(list);
      setTerms(list.map((t) => ({ ...t, articleCount: countMap.get(t.id) ?? 0 })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt a fogalmak betöltésekor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTerms(); }, [loadTerms]);

  /* ── Filtered terms ───────────────────────────────────── */
  const filtered = useMemo(() => {
    return terms.filter((t) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q);

      if (!matchesQuery) return false;
      if (filterType !== 'all') {
        const tType = t.entry_type ?? 'technical_concept';
        if (tType !== filterType) return false;
      }
      return true;
    });
  }, [terms, query, filterType]);

  useEffect(() => {
    if (query && filtered.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`admin-glossary-${filtered[0].id}`);
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
  }, [query, filtered]);

  /* ── Handlers ─────────────────────────────────────────── */
  function openCreate() { setEditing(null); setEditorOpen(true); }
  function openEdit(term: GlossaryTermWithCount) { setEditing(term); setEditorOpen(true); }
  function closeEditor() { setEditorOpen(false); setEditing(null); }

  function handleSaved(saved: GlossaryTerm) {
    const existed = terms.some((t) => t.id === saved.id);
    setTerms((prev) => {
      if (existed) return prev.map((t) => (t.id === saved.id ? { ...t, ...saved } : t));
      return [...prev, { ...saved, articleCount: 0 }].sort((a, b) => a.term.localeCompare(b.term, 'hu'));
    });
    toast.success(existed ? 'Fogalom frissítve.' : 'Fogalom létrehozva.');
    closeEditor();
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((t) => t.id)),
    );
  }

  function clearSelection() { setSelected(new Set()); }
  function openBatch() { setBatchOpen(true); }
  function closeBatch() { setBatchOpen(false); }

  function handleBatchSaved(updated: GlossaryTerm[]) {
    setTerms((prev) => prev.map((t) => {
      const u = updated.find((x) => x.id === t.id);
      return u ? { ...t, ...u } : t;
    }));
    setSelected(new Set());
    toast.success(`${updated.length} fogalom frissítve.`);
    closeBatch();
  }

  const selectedTerms = useMemo(() => terms.filter((t) => selected.has(t.id)), [terms, selected]);
  const availableCategories = useMemo(
    () => Array.from(new Set(terms.map((t) => t.category).filter(Boolean))) as string[],
    [terms],
  );

  /* ── Stats ────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: terms.length,
    technical: terms.filter((t) => t.entry_type !== 'industry_term').length,
    industry: terms.filter((t) => t.entry_type === 'industry_term').length,
    withTranslations: terms.filter((t) => t.translations && Object.keys(t.translations).length > 0).length,
  }), [terms]);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ color: textColor }}>
      {/* ── Fejléc ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap border-b pb-4" style={{ borderColor: cardBorder }}>
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-black flex items-center gap-2.5">
            <BookOpen style={{ color: cardHighlight }} size={28} /> Fogalomtár Kezelő
          </h1>
          <p className="text-sm text-gray-400 mt-1">{terms.length} fogalom összesen</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openCreate}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-black rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <Plus size={14} /> Új fogalom
          </button>
          <button
            onClick={() => setCatSettingsOpen(true)}
            style={{
              borderColor: `${cardHighlight}60`,
              color: cardHighlight,
              backgroundColor: `${cardHighlight}15`,
            }}
            className="inline-flex items-center gap-2 px-3 py-2 border text-sm font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer"
            title="Kiemelt kategóriák és ikonok testreszabása"
          >
            <Sparkles size={14} /> Kategória Ikonok &amp; Megjelenítés
          </button>
          <button
            onClick={() => setImportValidationOpen(true)}
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
            className="inline-flex items-center gap-2 px-3 py-2 border text-sm font-bold rounded-lg hover:opacity-90 transition-colors cursor-pointer"
            title="JSON fájl beolvasása és validálása"
          >
            <FileJson size={14} /> JSON validálás
          </button>
          {!loading && (
            <button
              onClick={loadTerms}
              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
              className="inline-flex items-center gap-2 px-3 py-2 border text-sm font-bold rounded-lg hover:opacity-90 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} /> Frissítés
            </button>
          )}
        </div>
      </div>

      {/* ── Stat kártyák ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Összes fogalom', value: stats.total, icon: <BookOpen size={16} />, color: cardHighlight },
            { label: 'Szakmai fogalom', value: stats.technical, icon: <Hash size={16} />, color: '#60A5FA' },
            { label: 'Zsargon / Szleng', value: stats.industry, icon: <Tag size={16} />, color: '#F59E0B' },
            { label: 'Fordítással', value: stats.withTranslations, icon: <Globe size={16} />, color: '#34D399' },
          ].map((s) => (
            <div
              key={s.label}
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="border rounded-xl p-4 shadow-sm"
            >
              <div style={{ color: s.color }} className="mb-2">{s.icon}</div>
              <div style={{ color: textColor }} className="text-2xl font-black">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Keresés + szűrők ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés fogalom, definíció vagy témakör..."
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
            className="w-full border rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Típus szűrő */}
        <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="flex items-center gap-1 border p-1 rounded-lg">
          {[
            { key: 'all', label: 'Összes' },
            { key: 'technical_concept', label: '📘 Szakmai' },
            { key: 'industry_term', label: '🗣 Zsargon' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as typeof filterType)}
              style={
                filterType === f.key
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : { color: textColor }
              }
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                filterType === f.key ? 'font-extrabold' : 'hover:opacity-80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid / Lista nézet váltó */}
        <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="flex items-center gap-1 border p-1 rounded-lg ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            style={
              viewMode === 'grid'
                ? { backgroundColor: cardHighlight, color: '#000000' }
                : { color: textColor }
            }
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid' ? 'font-extrabold' : 'hover:opacity-80'}`}
            title="Rács nézet"
          >
            ⊞ Rács
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={
              viewMode === 'list'
                ? { backgroundColor: cardHighlight, color: '#000000' }
                : { color: textColor }
            }
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'list' ? 'font-extrabold' : 'hover:opacity-80'}`}
            title="Lista nézet"
          >
            ☰ Lista
          </button>
        </div>
      </div>

      {/* ── Hiba ── */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={loadTerms} className="text-red-400 text-sm font-bold hover:text-red-300">
            Újrapróbálás
          </button>
        </div>
      )}

      {/* ── Batch akció sáv ── */}
      {selected.size > 0 && !loading && (
        <div style={{ backgroundColor: cardBg, borderColor: `${cardHighlight}60` }} className="p-4 border rounded-xl flex items-center gap-3 flex-wrap shadow-md">
          <ListChecks size={18} style={{ color: cardHighlight }} className="flex-shrink-0" />
          <span style={{ color: textColor }} className="text-sm font-bold">{selected.size} kijelölve</span>
          <button
            onClick={openBatch}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-md hover:opacity-90 transition-colors cursor-pointer shadow-sm"
          >
            <Pencil size={12} /> Csoportos szerkesztés
          </button>
          <button
            onClick={clearSelection}
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
            className="inline-flex items-center px-3 py-1.5 text-xs font-bold border rounded-md hover:opacity-90 transition-colors cursor-pointer"
          >
            Kijelölés törlése
          </button>
        </div>
      )}

      {/* ── "Mind kijelölése" ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center gap-3 px-1 pb-1">
          <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded cursor-pointer"
            />
            Mind kijelölése ({filtered.length})
          </label>
        </div>
      )}

      {/* ── Betöltés skeleton ── */}
      {loading && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-xl p-5">
              <div style={{ backgroundColor: cardBorder }} className="h-5 w-36 rounded animate-pulse" />
              <div style={{ backgroundColor: cardBorder }} className="h-3 w-full rounded animate-pulse mt-3" />
              <div style={{ backgroundColor: cardBorder }} className="h-3 w-2/3 rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* ── Üres állapot ── */}
      {!loading && filtered.length === 0 && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-xl p-16 text-center shadow-lg">
          <BookOpen size={32} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400 text-sm">
            {query || filterType !== 'all' ? 'Nincs a keresésnek megfelelő fogalom.' : 'Még nincs fogalom.'}
          </p>
          {!query && (
            <button onClick={openCreate} style={{ backgroundColor: cardHighlight, color: '#000000' }} className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-black rounded-lg hover:opacity-90 transition-colors cursor-pointer shadow-md">
              <Plus size={14} /> Első fogalom létrehozása
            </button>
          )}
        </div>
      )}

      {/* ══ RÁCS NÉZET ══ */}
      {!loading && filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              id={`admin-glossary-${t.id}`}
              style={{
                backgroundColor: cardBg,
                borderColor: selected.has(t.id) ? cardHighlight : cardBorder,
              }}
              className="border rounded-2xl p-5 transition-all duration-200 group relative flex flex-col gap-3 shadow-lg"
            >
              {/* Fejléc */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleSelected(t.id)}
                  className="mt-0.5 h-4 w-4 rounded cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 style={{ color: textColor }} className="text-base font-black leading-snug">
                      {t.term}
                    </h3>
                    <TypeBadge type={t.entry_type ?? 'technical_concept'} />
                    <span style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border">
                      {t.articleCount} cikk
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {t.category && (
                      <span style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }} className="text-[10px] border rounded px-2 py-0.5 font-medium">
                        {t.category}
                      </span>
                    )}
                    {t.szint && (
                      <span style={{ backgroundColor: `${cardHighlight}10`, borderColor: `${cardHighlight}30`, color: cardHighlight }} className="text-[10px] border rounded px-2 py-0.5 font-medium">
                        {t.szint}
                      </span>
                    )}
                    {t.translations && Object.keys(t.translations).length > 0 && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 rounded px-2 py-0.5 font-medium flex items-center gap-1">
                        <Globe size={9} /> Fordítás
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{t.definition}</p>
                  <p className="text-gray-500 text-[10px] mt-1 font-mono">/{t.slug}</p>
                </div>
              </div>

              {/* Lábléc */}
              <div style={{ borderColor: cardBorder }} className="flex items-center justify-end pt-2 border-t">
                <button
                  onClick={() => openEdit(t)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg hover:opacity-80 transition-all cursor-pointer"
                >
                  <Pencil size={12} /> Szerkesztés
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ LISTA NÉZET ══ */}
      {!loading && filtered.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              id={`admin-glossary-${t.id}`}
              style={{
                backgroundColor: cardBg,
                borderColor: selected.has(t.id) ? cardHighlight : cardBorder,
              }}
              className="border rounded-xl p-4 transition-colors shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleSelected(t.id)}
                    className="mt-1 h-4 w-4 rounded cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 style={{ color: textColor }} className="text-base font-black">{t.term}</h3>
                      <TypeBadge type={t.entry_type ?? 'technical_concept'} />
                      <span style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0">
                        {t.articleCount} cikk
                      </span>
                      {t.category && (
                        <span style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }} className="text-xs border rounded px-2 py-0.5">
                          {t.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-[10px] mt-0.5 font-mono">/{t.slug}</p>
                    <p className="text-gray-400 text-sm mt-1.5 line-clamp-2">{t.definition}</p>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(t)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold border rounded-md hover:opacity-80 transition-colors flex-shrink-0 cursor-pointer"
                >
                  <Pencil size={12} /> Szerkesztés
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modálok ── */}
      {editorOpen && (
        <EditGlossaryTermModal term={editing} onClose={closeEditor} onSaved={handleSaved} />
      )}

      <ImportGlossaryValidationModal
        isOpen={importValidationOpen}
        onClose={() => setImportValidationOpen(false)}
      />

      {batchOpen && (
        <BatchEditGlossaryModal terms={selectedTerms} onClose={closeBatch} onSaved={handleBatchSaved} />
      )}

      <GlossaryCategorySettingsModal
        isOpen={catSettingsOpen}
        onClose={() => setCatSettingsOpen(false)}
        availableCategories={availableCategories}
      />
    </div>
  );
}
