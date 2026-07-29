import { useState, useEffect, useCallback } from 'react';
import { Pencil, AlertCircle, RefreshCw, FolderTree, Plus } from 'lucide-react';
import type { Category } from '../lib/supabase';
import { listCategories, countArticlesForCategories } from '../services/categoryService';
import { useToast } from '../components/ToastProvider';
import EditCategoryModal from '../components/EditCategoryModal';

type CategoryWithCount = Category & { articleCount: number };

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCategories();
      const countMap = await countArticlesForCategories(list.map((c) => c.id));
      setCategories(list.map((c) => ({ ...c, articleCount: countMap.get(c.id) ?? 0 })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt a kategóriák betöltésekor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(category: CategoryWithCount) {
    setEditing(category);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
  }

  function handleSaved(saved: Category) {
    const existed = categories.some((c) => c.id === saved.id);
    setCategories((prev) => {
      if (existed) {
        return prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c));
      }
      return [...prev, { ...saved, articleCount: 0 }].sort((a, b) => a.name.localeCompare(b.name));
    });
    toast.success(existed ? 'Kategória frissítve.' : 'Kategória létrehozva.');
    closeEditor();
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Kategóriák</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} kategória</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2 bg-[#FFC400] text-black text-sm font-black rounded-lg hover:bg-[#E6B000] transition-colors">
            <Plus size={14} /> Új kategória
          </button>
          {!loading && (
            <button onClick={loadCategories} className="inline-flex items-center gap-2 px-3 py-2 border border-[#1E1E1E] text-gray-300 text-sm font-bold rounded-lg hover:bg-[#1E1E1E] transition-colors">
              <RefreshCw size={14} /> Frissítés
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={loadCategories} className="text-red-400 text-sm font-bold hover:text-red-300">Újrapróbálás</button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5">
              <div className="h-5 w-32 bg-[#1E1E1E] rounded animate-pulse" />
              <div className="h-3 w-20 bg-[#1E1E1E] rounded animate-pulse mt-2" />
              <div className="h-4 w-full bg-[#1E1E1E] rounded animate-pulse mt-4" />
              <div className="h-4 w-2/3 bg-[#1E1E1E] rounded animate-pulse mt-2" />
            </div>
          ))}

        {!loading && categories.length === 0 && (
          <div className="col-span-full bg-[#111] border border-[#1E1E1E] rounded-xl p-16 text-center">
            <FolderTree size={32} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">Még nincs kategória.</p>
          </div>
        )}

        {!loading &&
          categories.map((c) => (
            <div key={c.id} className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5 hover:border-[#FFC400]/30 transition-colors flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-black text-white line-clamp-1">{c.name}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border bg-[#FFC400]/10 text-[#FFC400] border-[#FFC400]/20 flex-shrink-0">
                  {c.articleCount} cikk
                </span>
              </div>
              <p className="text-gray-600 text-xs mt-1">/{c.slug}</p>
              <p className="text-gray-400 text-sm mt-3 line-clamp-2 flex-1">{c.description || '—'}</p>
              <div className="mt-4 pt-4 border-t border-[#1E1E1E]">
                <button
                  onClick={() => openEdit(c)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-300 border border-[#1E1E1E] rounded-md hover:bg-[#1E1E1E] hover:text-white transition-colors"
                >
                  <Pencil size={12} /> Szerkesztés
                </button>
              </div>
            </div>
          ))}
      </div>

      {editorOpen && (
        <EditCategoryModal
          category={editing}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
