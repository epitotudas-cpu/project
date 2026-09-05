import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { Category } from '../lib/supabase';
import { deleteCategoryAndReassignArticles } from '../services/categoryService';
import { getArticlesLocal } from '../services/articleService';
import { logAuditAction } from '../services/auditLogService';
import { useToast } from './ToastProvider';

interface DeleteCategoryModalProps {
  category: Category;
  allCategories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteCategoryModal({
  category,
  allCategories,
  isOpen,
  onClose,
  onSuccess,
}: DeleteCategoryModalProps) {
  const toast = useToast();
  const [targetCategoryId, setTargetCategoryId] = useState<string>('');
  const [affectedArticleCount, setAffectedArticleCount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const otherCategories = allCategories.filter((c) => c.id !== category.id);

  useEffect(() => {
    if (isOpen && category) {
      const articles = getArticlesLocal();
      const count = articles.filter((a) => a.category_id === category.id).length;
      setAffectedArticleCount(count);

      // Default target category to the first available category
      if (otherCategories.length > 0) {
        setTargetCategoryId(otherCategories[0].id);
      } else {
        setTargetCategoryId('');
      }
    }
  }, [isOpen, category]);

  if (!isOpen) return null;

  async function handleDelete() {
    if (affectedArticleCount > 0 && !targetCategoryId) {
      toast.error('Kérjük, válassz ki egy célkategóriát a meglévő cikkek áthelyezéséhez!');
      return;
    }

    setSubmitting(true);
    try {
      const targetName = otherCategories.find((c) => c.id === targetCategoryId)?.name || 'Másik kategória';
      await deleteCategoryAndReassignArticles(category.id, targetCategoryId);

      void logAuditAction(
        'CATEGORY_DELETE',
        'categories',
        `Kategória törölve: "${category.name}". ${affectedArticleCount} cikk áthelyezve ide: "${targetName}".`
      );

      toast.success(`A(z) "${category.name}" kategória sikeresen törölve!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hiba történt a kategória törlésekor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121212] border border-red-500/30 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="h-6 w-6" />
            <h3 className="text-lg font-bold">Kategória törlése megerősítéssel</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-gray-300">
          <p>
            Biztosan törölni szeretnéd a(z) <span className="font-bold text-white">"{category.name}"</span> kategóriát?
          </p>

          <div className="bg-gray-900/80 border border-gray-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Érintett cikkek száma:</span>
              <span className="font-extrabold text-amber-400 text-base">{affectedArticleCount} cikk</span>
            </div>
            {affectedArticleCount > 0 ? (
              <p className="text-xs text-gray-400">
                A törlés előtt a kategóriában található cikkeket kötelezően át kell sorolni egy másik aktív kategóriába.
              </p>
            ) : (
              <p className="text-xs text-green-400">
                Ebben a kategóriában jelenleg nincsenek cikkek.
              </p>
            )}
          </div>

          {affectedArticleCount > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300">
                Válassz célkategóriát a cikkek áthelyezéséhez:
              </label>
              <select
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {otherCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.slug})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs rounded-xl transition-colors"
          >
            Mégse
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting || (affectedArticleCount > 0 && !targetCategoryId)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
            {submitting ? 'Törlés folyamatban...' : 'Kategória törlése és áthelyezés'}
          </button>
        </div>
      </div>
    </div>
  );
}
