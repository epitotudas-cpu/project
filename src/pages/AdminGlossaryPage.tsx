import { useState, useEffect, useCallback, useMemo } from 'react';
import { Pencil, AlertCircle, RefreshCw, BookOpen, Plus, Search, FileJson, ListChecks } from 'lucide-react';
import type { GlossaryTerm } from '../lib/supabase';
import { listGlossaryTerms, countArticlesForTerms } from '../services/glossaryService';
import { useToast } from '../components/ToastProvider';
import EditGlossaryTermModal from '../components/EditGlossaryTermModal';
import ImportGlossaryValidationModal from '../components/ImportGlossaryValidationModal';
import BatchEditGlossaryModal from '../components/BatchEditGlossaryModal';

type GlossaryTermWithCount = GlossaryTerm & { articleCount: number };

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

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return terms;
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.category ?? '').toLowerCase().includes(q)
    );
  }, [terms, query]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(term: GlossaryTermWithCount) {
    setEditing(term);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
  }

  function handleSaved(saved: GlossaryTerm) {
    const existed = terms.some((t) => t.id === saved.id);
    setTerms((prev) => {
      if (existed) {
        return prev.map((t) => (t.id === saved.id ? { ...t, ...saved } : t));
      }
      return [...prev, { ...saved, articleCount: 0 }].sort((a, b) => a.term.localeCompare(b.term, 'hu'));
    });
    toast.success(existed ? 'Fogalom frissítve.' : 'Fogalom létrehozva.');
    closeEditor();
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map((t) => t.id));
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function openBatch() {
    setBatchOpen(true);
  }

  function closeBatch() {
    setBatchOpen(false);
  }

  function handleBatchSaved(updated: GlossaryTerm[]) {
    setTerms((prev) => prev.map((t) => {
      const u = updated.find((x) => x.id === t.id);
      return u ? { ...t, ...u } : t;
    }));
    setSelected(new Set());
    toast.success(`${updated.length} fogalom frissítve.`);
    closeBatch();
  }

  const selectedTerms = useMemo(
    () => terms.filter((t) => selected.has(t.id)),
    [terms, selected]
  );

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Fogalomtár</h1>
          <p className="text-sm text-gray-500 mt-1">{terms.length} fogalom</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2 bg-[#FFC400] text-black text-sm font-black rounded-lg hover:bg-[#E6B000] transition-colors">
            <Plus size={14} /> Új fogalom
          </button>
          <button
            onClick={() => setImportValidationOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-[#1E1E1E] text-gray-300 text-sm font-bold rounded-lg hover:bg-[#1E1E1E] hover:text-white transition-colors"
            title="JSON fájl beolvasása és validálása (adatbázisba írás nélkül)"
          >
            <FileJson size={14} /> JSON validálás
          </button>
          {!loading && (
            <button onClick={loadTerms} className="inline-flex items-center gap-2 px-3 py-2 border border-[#1E1E1E] text-gray-300 text-sm font-bold rounded-lg hover:bg-[#1E1E1E] transition-colors">
              <RefreshCw size={14} /> Frissítés
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Keresés fogalom, definíció vagy témakör..."
          className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FFC400]/50 transition-colors"
        />
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={loadTerms} className="text-red-400 text-sm font-bold hover:text-red-300">Újrapróbálás</button>
        </div>
      )}

      {selected.size > 0 && !loading && (
        <div className="mt-6 p-4 bg-[#0A0A0A] border border-[#FFC400]/30 rounded-xl flex items-center gap-3 flex-wrap">
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

      <div className="mt-6 space-y-2">
        {!loading && filtered.length > 0 && (
          <div className="flex items-center gap-3 px-1 pb-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-[#1E1E1E] bg-[#0A0A0A] text-[#FFC400] focus:ring-[#FFC400]/50"
              />
              Mind kijelölése
            </label>
          </div>
        )}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4">
              <div className="h-5 w-40 bg-[#1E1E1E] rounded animate-pulse" />
              <div className="h-3 w-full bg-[#1E1E1E] rounded animate-pulse mt-3" />
              <div className="h-3 w-2/3 bg-[#1E1E1E] rounded animate-pulse mt-2" />
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-16 text-center">
            <BookOpen size={32} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">{query ? 'Nincs a keresésnek megfelelő fogalom.' : 'Még nincs fogalom.'}</p>
          </div>
        )}

        {!loading &&
          filtered.map((t) => (
            <div key={t.id} className={`bg-[#111] border rounded-xl p-4 hover:border-[#FFC400]/30 transition-colors ${selected.has(t.id) ? 'border-[#FFC400]/50' : 'border-[#1E1E1E]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleSelected(t.id)}
                    className="mt-1 h-4 w-4 rounded border-[#1E1E1E] bg-[#0A0A0A] text-[#FFC400] focus:ring-[#FFC400]/50 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-black text-white">{t.term}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border bg-[#FFC400]/10 text-[#FFC400] border-[#FFC400]/20 flex-shrink-0">
                      {t.articleCount} cikk
                    </span>
                    {t.category && (
                      <span className="text-xs text-gray-500 border border-[#1E1E1E] rounded px-2 py-0.5">{t.category}</span>
                    )}
                  </div>
                  <p className="text-gray-600 text-xs mt-1">/{t.slug}</p>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">{t.definition}</p>
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

      {editorOpen && (
        <EditGlossaryTermModal
          term={editing}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}

      <ImportGlossaryValidationModal
        isOpen={importValidationOpen}
        onClose={() => setImportValidationOpen(false)}
      />

      {batchOpen && (
        <BatchEditGlossaryModal
          terms={selectedTerms}
          onClose={closeBatch}
          onSaved={handleBatchSaved}
        />
      )}
    </div>
  );
}
