import { useState, useEffect, useCallback } from 'react';
import {
  Pencil,
  Trash2,
  AlertCircle,
  RefreshCw,
  FolderTree,
  Plus,
  Star,
  Layers,
  Thermometer,
  Droplets,
  Zap,
  Paintbrush,
  Wrench,
  Hammer,
  Building,
  Home,
  Shield,
  HardHat,
  Truck,
  Ruler,
  Compass,
  Grid,
  Settings,
} from 'lucide-react';
import type { Category } from '../lib/supabase';
import { listCategories, countArticlesForCategories, deleteCategory } from '../services/categoryService';
import { useToast } from '../components/ToastProvider';
import EditCategoryModal from '../components/EditCategoryModal';

type CategoryWithCount = Category & { articleCount: number };

const ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Thermometer,
  Droplets,
  Zap,
  Paintbrush,
  Wrench,
  Hammer,
  Building,
  Home,
  Shield,
  HardHat,
  Truck,
  Ruler,
  Compass,
  Grid,
  Settings,
};

export default function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCategories();
      const countMap = await countArticlesForCategories(list.map((c) => c.id));
      const sorted = list
        .map((c) => ({ ...c, articleCount: countMap.get(c.id) ?? 0 }))
        .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
      setCategories(sorted);
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

  async function handleDelete(category: CategoryWithCount) {
    const confirmMessage = `Biztosan törölni szeretnéd a(z) "${category.name}" kategóriát?${
      category.articleCount > 0 ? `\n\nFigyelem: A kategória ${category.articleCount} cikket tartalmaz!` : ''
    }`;

    if (!window.confirm(confirmMessage)) return;

    setDeletingId(category.id);
    try {
      await deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success(`A(z) "${category.name}" kategória törölve.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hiba történt a törlés során.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(saved: Category) {
    const existed = categories.some((c) => c.id === saved.id);
    setCategories((prev) => {
      let updatedList: CategoryWithCount[];
      if (existed) {
        updatedList = prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c));
      } else {
        updatedList = [...prev, { ...saved, articleCount: 0 }];
      }
      return updatedList.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
    });
    toast.success(existed ? 'Kategória frissítve.' : 'Kategória létrehozva.');
    closeEditor();
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Kategóriák Készlete &amp; Szerkesztés</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} kategória kezelése és testreszabása</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC400] text-black text-sm font-black rounded-xl hover:bg-[#E6B000] transition-all shadow-lg shadow-[#FFC400]/10"
          >
            <Plus size={16} /> Új kategória
          </button>
          {!loading && (
            <button
              onClick={loadCategories}
              className="inline-flex items-center gap-2 px-3 py-2 border border-[#1E1E1E] text-gray-300 text-sm font-bold rounded-xl hover:bg-[#1E1E1E] transition-colors"
            >
              <RefreshCw size={14} /> Frissítés
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={loadCategories} className="text-red-400 text-sm font-bold hover:text-red-300">
            Újrapróbálás
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-5 overflow-hidden">
              <div className="h-32 bg-[#1E1E1E] rounded-xl animate-pulse" />
              <div className="h-5 w-32 bg-[#1E1E1E] rounded animate-pulse mt-4" />
              <div className="h-4 w-full bg-[#1E1E1E] rounded animate-pulse mt-2" />
            </div>
          ))}

        {!loading && categories.length === 0 && (
          <div className="col-span-full bg-[#111] border border-[#1E1E1E] rounded-2xl p-16 text-center">
            <FolderTree size={36} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm font-medium">Még nincs kategória rögzítve.</p>
          </div>
        )}

        {!loading &&
          categories.map((c) => {
            const IconComp = (c.icon_name && ICON_MAP[c.icon_name]) || Layers;
            const categoryColor = c.color || '#FFC400';

            return (
              <div
                key={c.id}
                className="bg-[#111] border border-[#1E1E1E] rounded-2xl overflow-hidden hover:border-[#FFC400]/40 transition-all flex flex-col group shadow-lg"
              >
                {/* Fejléc / Borítókép */}
                <div className="h-36 relative bg-[#0D0D0D] overflow-hidden flex items-center justify-center">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-85"
                      style={{
                        objectFit: (c.image_fit as 'cover' | 'contain' | 'fill') || 'cover',
                        objectPosition: c.image_position || 'center',
                        transform: c.image_zoom && c.image_zoom !== 100 ? `scale(${c.image_zoom / 100})` : undefined,
                        transformOrigin: c.image_position || 'center',
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center opacity-20"
                      style={{ backgroundColor: categoryColor }}
                    >
                      <IconComp size={64} className="text-white" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/30 to-transparent" />

                  {/* Ikon jelvény a borítóképen */}
                  <div
                    className="absolute bottom-3 left-4 w-11 h-11 rounded-xl flex items-center justify-center border shadow-xl backdrop-blur-md"
                    style={{
                      backgroundColor: `${categoryColor}30`,
                      borderColor: `${categoryColor}60`,
                      color: categoryColor,
                    }}
                  >
                    <IconComp size={22} />
                  </div>

                  {/* Jelvények jobb felül */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {c.featured && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FFC400]/90 text-black shadow-md">
                        <Star size={11} className="fill-black" /> Kiemelt
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-black/80 text-gray-300 border border-white/10 backdrop-blur">
                      {c.articleCount} cikk
                    </span>
                  </div>
                </div>

                {/* Kártya tartalom */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-black text-white line-clamp-1 group-hover:text-[#FFC400] transition-colors">
                        {c.name}
                      </h3>
                      {c.sort_order && (
                        <span className="text-[10px] font-mono text-gray-500 px-1.5 py-0.5 border border-[#1E1E1E] rounded">
                          #{c.sort_order}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs font-mono mt-0.5">/{c.slug}</p>
                    <p className="text-gray-400 text-xs mt-2.5 line-clamp-2 leading-relaxed">
                      {c.description || '— Nincs leírás megadva —'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#1E1E1E] flex items-center justify-between">
                    <span
                      className="inline-block w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: categoryColor }}
                      title={`Színkód: ${categoryColor}`}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 border border-[#1E1E1E] rounded-xl hover:bg-[#FFC400] hover:text-black hover:border-[#FFC400] transition-all"
                      >
                        <Pencil size={13} /> Szerkesztés
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/20 bg-red-500/10 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        title="Kategória törlése"
                      >
                        <Trash2 size={13} /> Törlés
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
