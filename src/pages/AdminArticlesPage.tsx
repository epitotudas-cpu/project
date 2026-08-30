import { useState, useEffect, useCallback } from 'react';
import { Search, Pencil, Eye, EyeOff, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, FileText, X, Plus } from 'lucide-react';
import type { Article, Category } from '../lib/supabase';
import * as articleService from '../services/articleService';
import { listCategories } from '../services/categoryService';
import { useToast } from '../components/ToastProvider';
import EditArticleModal from '../components/EditArticleModal';
import ArticleSettingsModal from '../components/ArticleSettingsModal';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

interface ArticleRow extends Article {
  categories: { name: string } | null;
}

type StatusFilter = 'all' | Article['status'];

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<Article['status'], { label: string; class: string }> = {
  draft: { label: 'Piszkozat', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  pending: { label: 'Jóváhagyásra vár', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  review: { label: 'Felülvizsgálat', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Jóváhagyva', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  published: { label: 'Közzétéve', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected: { label: 'Elutasítva', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  archived: { label: 'Archivált', class: 'bg-gray-700/10 text-gray-500 border-gray-700/20' },
};

interface AdminArticlesPageProps {
  initialSearchQuery?: string;
}

export default function AdminArticlesPage({ initialSearchQuery }: AdminArticlesPageProps = {}) {
  const toast = useToast();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(initialSearchQuery || '');
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [rejectModalArticle, setRejectModalArticle] = useState<ArticleRow | null>(null);
  const [rejectionNoteInput, setRejectionNoteInput] = useState('');

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearch(initialSearchQuery);
      setDebouncedSearch(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [editing, setEditing] = useState<Article | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    listCategories()
      .then((data) => setCategories(data))
      .catch(() => {
        // ignore: categories list is non-critical for the admin view
      });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await articleService.listArticles({
        search: debouncedSearch || undefined,
        status: statusFilter,
        articleType: typeFilter !== 'all' ? (typeFilter as any) : undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setArticles(result.rows as ArticleRow[]);
      setTotalCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt a cikkek betöltésekor.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, typeFilter, categoryFilter, page]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (debouncedSearch && articles.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`admin-article-${articles[0].id}`);
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
  }, [debouncedSearch, articles]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter]);

  async function togglePublish(article: ArticleRow) {
    const nextStatus: Article['status'] = article.status === 'published' ? 'draft' : 'published';
    setTogglingId(article.id);
    try {
      await articleService.setArticleStatus(article.id, nextStatus, null);
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, status: nextStatus, rejection_note: null, updated_at: new Date().toISOString() } : a))
      );
      toast.success(`A cikk ${nextStatus === 'published' ? 'közzétéve' : 'vázlatba állítva'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Státusz módosítás sikertelen.');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectModalArticle) return;
    try {
      const note = rejectionNoteInput.trim() || 'Kérjük, javítsa a hiányzó tartalmi elemeket.';
      await articleService.setArticleStatus(rejectModalArticle.id, 'rejected', note);
      setArticles((prev) =>
        prev.map((a) => (a.id === rejectModalArticle.id ? { ...a, status: 'rejected', rejection_note: note, updated_at: new Date().toISOString() } : a))
      );
      toast.success('A cikk elutasításra került a javítási indoklással.');
    } catch (err) {
      toast.error('Elutasítás sikertelen.');
    } finally {
      setRejectModalArticle(null);
      setRejectionNoteInput('');
    }
  }

  function handleSaved(saved: Article) {
    const existed = articles.some((a) => a.id === saved.id);
    const cat = categories.find((c) => c.id === saved.category_id) ?? null;
    const catName = cat ? { name: cat.name } : null;
    if (existed) {
      setArticles((prev) =>
        prev.map((a) => (a.id === saved.id ? ({ ...a, ...saved, categories: catName } as ArticleRow) : a))
      );
    } else {
      setArticles((prev) => [{ ...saved, categories: catName } as ArticleRow, ...prev]);
      setTotalCount((prev) => prev + 1);
    }
    closeEditor();
  }

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(article: ArticleRow) {
    setEditing(article);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
  }

  const hasFilters = debouncedSearch || statusFilter !== 'all' || categoryFilter !== 'all';

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setPage(1);
  }

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const inputStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };

  const selectClass =
    'border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors';

  return (
    <div className="p-8" style={{ color: textColor }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-black">Cikkek Kezelője</h1>
          <p className="text-sm text-gray-400 mt-1">{totalCount} cikk összesen</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              borderColor: `${cardHighlight}60`,
              color: cardHighlight,
              backgroundColor: `${cardHighlight}15`,
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 border text-sm font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer"
          >
            Tudástár beállítások
          </button>
          <button
            onClick={openCreate}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-black rounded-lg hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            <Plus size={14} /> Új cikk
          </button>
          {!loading && (
            <button
              onClick={loadArticles}
              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
              className="inline-flex items-center gap-2 px-3 py-2 border text-sm font-bold rounded-lg hover:opacity-90 transition-colors"
            >
              <RefreshCw size={14} /> Frissítés
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés cím szerint..."
            style={inputStyle}
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none transition-colors"
          />
        </div>
        <select
          style={inputStyle}
          className={selectClass}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">Összes típus</option>
          <option value="utmutatok">Útmutatók</option>
          <option value="hirek">Hírek</option>
          <option value="ujdonsagok">Újdonságok</option>
        </select>
        <select
          style={inputStyle}
          className={selectClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Összes státusz</option>
          <option value="pending">Jóváhagyásra vár</option>
          <option value="published">Közzétéve</option>
          <option value="draft">Piszkozat</option>
          <option value="rejected">Elutasítva</option>
          <option value="archived">Archivált</option>
        </select>
        <select
          style={inputStyle}
          className={selectClass}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">Összes kategória</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-2 text-sm font-bold text-gray-400 hover:text-gray-200 transition-colors">
            <X size={14} /> Szűrők törlése
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={loadArticles} className="text-red-400 text-sm font-bold hover:text-red-300">Újrapróbálás</button>
        </div>
      )}

      {/* Table */}
      <div
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        className="mt-6 border rounded-xl overflow-hidden shadow-lg"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderColor: cardBorder }} className="border-b text-left">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Cím</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Kategória</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Státusz</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Megtekintés</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Módosítva</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1E1E1E]/50">
                    <td className="px-4 py-3.5"><div className="h-4 w-48 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-20 bg-[#1E1E1E] rounded-full animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-10 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 bg-[#1E1E1E] rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))}

              {!loading && articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <FileText size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">{hasFilters ? 'Nincs a szűrőknek megfelelő cikk.' : 'Még nincs cikk.'}</p>
                  </td>
                </tr>
              )}

              {!loading &&
                articles.map((a) => {
                  const badge = STATUS_BADGE[a.status];
                  const isPublished = a.status === 'published';
                  return (
                    <tr key={a.id} id={`admin-article-${a.id}`} className="border-b border-[#1E1E1E]/50 hover:bg-[#1E1E1E]/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-gray-200 line-clamp-1">{a.title}</p>
                        <p className="text-gray-600 text-xs line-clamp-1 mt-0.5">{a.excerpt || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">{a.categories?.name ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap">{a.views}</td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(a.updated_at).toLocaleDateString('hu-HU')}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(a)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-300 border border-[#1E1E1E] rounded-md hover:bg-[#1E1E1E] hover:text-white transition-colors"
                          >
                            <Pencil size={12} /> Szerkesztés
                          </button>
                          <button
                            onClick={() => togglePublish(a)}
                            disabled={togglingId === a.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              isPublished
                                ? 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'
                                : 'text-green-400 border-green-500/20 hover:bg-green-500/10'
                            }`}
                            title={isPublished ? 'Visszavonás' : 'Jóváhagyás & Közzététel'}
                          >
                            {isPublished ? <EyeOff size={12} /> : <Eye size={12} />}
                            {isPublished ? 'Visszavon' : 'Jóváhagy'}
                          </button>
                          {!isPublished && (
                            <button
                              onClick={() => {
                                setRejectModalArticle(a);
                                setRejectionNoteInput(a.rejection_note || '');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-bold text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 transition-colors"
                              title="Elutasítás megjegyzéssel"
                            >
                              <X size={12} /> Elutasítás
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && articles.length > 0 && (
        <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} / {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-gray-300 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} /> Előző
            </button>
            <span className="text-sm text-gray-400 px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-gray-300 border border-[#1E1E1E] rounded-lg hover:bg-[#1E1E1E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Következő <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── REJECTION MODAL ── */}
      {rejectModalArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-extrabold text-sm text-red-400 flex items-center gap-2">
                <AlertCircle size={16} /> Cikk Elutasítása (Javításra visszaküldés)
              </h3>
              <button onClick={() => setRejectModalArticle(null)} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Adj meg javítási útmutatást a szerkesztő/partner számára az elutasított cikkhez:
            </p>

            <textarea
              rows={4}
              value={rejectionNoteInput}
              onChange={(e) => setRejectionNoteInput(e.target.value)}
              placeholder="pl. Kérjük, javítsa a műszaki adatokat és csatolja a hiányzó PDF adatlapot..."
              className="w-full bg-[#111] border border-gray-700 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalArticle(null)}
                className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-bold rounded-xl"
              >
                Mégse
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl"
              >
                Elutasítás Beküldése
              </button>
            </div>
          </div>
        </div>
      )}

      {editorOpen && (
        <EditArticleModal
          article={editing}
          categories={categories}
          onClose={() => setEditorOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <ArticleSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
