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
import { useSiteSettings, adjustColorBrightness } from '../services/siteSettingsService';

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
export default function AdminGlossaryPage() {
  const toast = useToast();
  const [terms, setTerms] = useState<GlossaryTermWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<GlossaryTerm | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState('');
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
    const q = query.trim().toLowerCase();
    let res = terms;
    if (filterType !== 'all') res = res.filter((t) => t.entry_type === filterType);
    if (!q) return res;
    return res.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q),
    );
  }, [terms, query, filterType]);

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

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="p-6 lg:p-8">
      {/* ── Fejléc ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Fogalomtár</h1>
          <p className="text-sm text-gray-500 mt-1">{terms.length} fogalom összesen</p>
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
            style={{ backgroundColor: inputBg, borderColor: cardBorder }}
            className="inline-flex items-center gap-2 px-3 py-2 border text-gray-300 text-sm font-bold rounded-lg hover:text-white transition-colors"
            title="JSON fájl beolvasása és validálása"
          >
            <FileJson size={14} /> JSON validálás
          </button>
          {!loading && (
            <button
              onClick={loadTerms}
              style={{ backgroundColor: inputBg, borderColor: cardBorder }}
              className="inline-flex items-center gap-2 px-3 py-2 border text-gray-300 text-sm font-bold rounded-lg hover:text-white transition-colors"
            >
              <RefreshCw size={14} /> Frissítés
            </button>
          )}
        </div>
      </div>

      {/* ── Stat kártyák ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Összes fogalom', value: stats.total, icon: <BookOpen size={16} />, color: 'text-[#FFC400]' },
            { label: 'Szakmai fogalom', value: stats.technical, icon: <Hash size={16} />, color: 'text-blue-400' },
            { label: 'Zsargon / Szleng', value: stats.industry, icon: <Tag size={16} />, color: 'text-amber-400' },
            { label: 'Fordítással', value: stats.withTranslations, icon: <Globe size={16} />, color: 'text-emerald-400' },
          ].map((s) => (
            <div
              key={s.label}
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="border rounded-xl p-4 shadow-sm"
            >
              <div className={`${s.color} mb-2`}>{s.icon}</div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Keresés + szűrők ── */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés fogalom, definíció vagy témakör..."
            style={{ backgroundColor: inputBg, borderColor: cardBorder }}
            className="w-full border rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors"
          />
        </div>

        {/* Típus szűrő */}
        <div className="flex items-center gap-1 bg-[#0A0A0A] border border-[#1E1E1E] p-1 rounded-lg">
          {[
            { key: 'all', label: 'Összes' },
            { key: 'technical_concept', label: '📘 Szakmai' },
            { key: 'industry_term', label: '🗣 Zsargon' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key as typeof filterType)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                filterType === f.key
                  ? 'bg-[#FFC400] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid / Lista nézet váltó */}
        <div className="flex items-center gap-1 bg-[#0A0A0A] border border-[#1E1E1E] p-1 rounded-lg ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500 hover:text-white'}`}
            title="Rács nézet"
          >
            ⊞ Rács
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-[#1E1E1E] text-white' : 'text-gray-500 hover:text-white'}`}
            title="Lista nézet"
          >
            ☰ Lista
          </button>
        </div>
      </div>

      {/* ── Hiba ── */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={loadTerms} className="text-red-400 text-sm font-bold hover:text-red-300">
            Újrapróbálás
          </button>
        </div>
      )}

      {/* ── Batch akció sáv ── */}
      {selected.size > 0 && !loading && (
        <div className="mb-4 p-4 bg-[#0A0A0A] border border-[#FFC400]/30 rounded-xl flex items-center gap-3 flex-wrap">
          <ListChecks size={18} className="text-[#FFC400] flex-shrink-0" />
          <span className="text-sm font-bold text-white">{selected.size} kijelölve</span>
          <button
            onClick={openBatch}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFC400] text-black text-xs font-black rounded-md hover:bg-[#E6B000] transition-colors"
          >
            <Pencil size={12} /> Csoportos szerkesztés
          </button>
          <button
            onClick={clearSelection}
            className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-gray-400 border border-[#1E1E1E] rounded-md hover:bg-[#1E1E1E] hover:text-white transition-colors"
          >
            Kijelölés törlése
          </button>
        </div>
      )}

      {/* ── "Mind kijelölése" ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center gap-3 px-1 pb-3">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-[#1E1E1E] bg-[#0A0A0A] text-[#FFC400] focus:ring-[#FFC400]/50"
            />
            Mind kijelölése ({filtered.length})
          </label>
        </div>
      )}

      {/* ── Betöltés skeleton ── */}
      {loading && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5">
              <div className="h-5 w-36 bg-[#1E1E1E] rounded animate-pulse" />
              <div className="h-3 w-full bg-[#1E1E1E] rounded animate-pulse mt-3" />
              <div className="h-3 w-2/3 bg-[#1E1E1E] rounded animate-pulse mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* ── Üres állapot ── */}
      {!loading && filtered.length === 0 && (
        <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-16 text-center">
          <BookOpen size={32} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">
            {query || filterType !== 'all' ? 'Nincs a keresésnek megfelelő fogalom.' : 'Még nincs fogalom.'}
          </p>
          {!query && (
            <button onClick={openCreate} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#FFC400] text-black text-sm font-black rounded-lg hover:bg-[#E6B000] transition-colors">
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
              className={`bg-[#111] border rounded-2xl p-5 hover:border-[#FFC400]/30 transition-all duration-200 group relative flex flex-col gap-3 ${
                selected.has(t.id) ? 'border-[#FFC400]/50' : 'border-[#1E1E1E]'
              }`}
            >
              {/* Fejléc */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleSelected(t.id)}
                  className="mt-0.5 h-4 w-4 rounded border-[#1E1E1E] bg-[#0A0A0A] text-[#FFC400] focus:ring-[#FFC400]/50 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h3 className="text-base font-black text-white group-hover:text-[#FFC400] transition-colors">
                      {t.term}
                    </h3>
                    <TypeBadge type={t.entry_type ?? 'technical_concept'} />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[#FFC400]/10 text-[#FFC400] border-[#FFC400]/20">
                      {t.articleCount} cikk
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {t.category && (
                      <span className="text-[10px] text-gray-500 border border-[#1E1E1E] rounded px-2 py-0.5 font-medium">
                        {t.category}
                      </span>
                    )}
                    {t.szint && (
                      <span className="text-[10px] text-[#FFC400]/70 border border-[#FFC400]/20 rounded px-2 py-0.5 font-medium">
                        {t.szint}
                      </span>
                    )}
                    {t.translations && Object.keys(t.translations).length > 0 && (
                      <span className="text-[10px] text-emerald-400 border border-emerald-400/20 rounded px-2 py-0.5 font-medium flex items-center gap-1">
                        <Globe size={9} /> Fordítás
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{t.definition}</p>
                  <p className="text-gray-700 text-[10px] mt-1 font-mono">/{t.slug}</p>
                </div>
              </div>

              {/* Lábléc */}
              <div className="flex items-center justify-end pt-2 border-t border-[#1A1A1A]">
                <button
                  onClick={() => openEdit(t)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 border border-[#1E1E1E] rounded-lg hover:bg-[#FFC400] hover:text-black hover:border-[#FFC400] transition-all"
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
              className={`bg-[#111] border rounded-xl p-4 hover:border-[#FFC400]/30 transition-colors ${
                selected.has(t.id) ? 'border-[#FFC400]/50' : 'border-[#1E1E1E]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleSelected(t.id)}
                    className="mt-1 h-4 w-4 rounded border-[#1E1E1E] bg-[#0A0A0A] text-[#FFC400] focus:ring-[#FFC400]/50 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-white">{t.term}</h3>
                      <TypeBadge type={t.entry_type ?? 'technical_concept'} />
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[#FFC400]/10 text-[#FFC400] border-[#FFC400]/20 flex-shrink-0">
                        {t.articleCount} cikk
                      </span>
                      {t.category && (
                        <span className="text-xs text-gray-500 border border-[#1E1E1E] rounded px-2 py-0.5">
                          {t.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-[10px] mt-0.5">/{t.slug}</p>
                    <p className="text-gray-400 text-sm mt-1.5 line-clamp-2">{t.definition}</p>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(t)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-300 border border-[#1E1E1E] rounded-md hover:bg-[#1E1E1E] hover:text-white transition-colors flex-shrink-0"
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
