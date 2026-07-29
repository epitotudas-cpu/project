import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Category } from '../lib/supabase';
import { createCategory, updateCategory } from '../services/categoryService';

interface EditCategoryModalProps {
  category: Category | null; // null = create mode
  onClose: () => void;
  onSaved: (saved: Category) => void;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
}

const EMPTY_FORM: FormState = { name: '', slug: '', description: '' };

function formFromCategory(category: Category): FormState {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
  };
}

export default function EditCategoryModal({ category, onClose, onSaved }: EditCategoryModalProps) {
  const isCreate = category === null;
  const [form, setForm] = useState<FormState>(() => (category ? formFromCategory(category) : { ...EMPTY_FORM }));
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setForm(formFromCategory(category));
      setSlugTouched(true);
    } else {
      setForm({ ...EMPTY_FORM });
      setSlugTouched(false);
    }
    setError(null);
  }, [category]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    update('name', value);
    if (!slugTouched) update('slug', slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    update('slug', slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('A kategória neve megadása kötelező.');
      return;
    }
    if (!form.slug.trim()) {
      setError('A slug megadása kötelező.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
      };
      let data: Category;
      if (category) {
        data = await updateCategory(category.id, payload);
      } else {
        data = await createCategory(payload);
      }
      onSaved(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mentés sikertelen.';
      if (/duplicate|unique|23505/i.test(msg)) {
        setError('Ez a slug vagy név már foglalt.');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FFC400]/50 transition-colors';
  const labelClass = 'block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !saving && onClose()}>
      <div
        className="bg-[#111] border border-[#1E1E1E] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] sticky top-0 bg-[#111] z-10">
          <h2 className="text-base font-black text-white">{isCreate ? 'Új kategória létrehozása' : 'Kategória szerkesztése'}</h2>
          <button onClick={onClose} disabled={saving} className="text-gray-500 hover:text-gray-300 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className={labelClass}>Kategória neve <span className="text-red-400">*</span></label>
            <input
              className={fieldClass}
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="pl. Szerkezetépítés"
              autoFocus={isCreate}
            />
          </div>

          <div>
            <label className={labelClass}>Slug <span className="text-red-400">*</span></label>
            <input className={fieldClass} value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="url-barat-azonosito" />
            <p className="text-xs text-gray-600 mt-1.5">Automatikusan generálódik a névből, ha üresen hagyja.</p>
          </div>

          <div>
            <label className={labelClass}>Leírás</label>
            <textarea className={`${fieldClass} resize-none`} rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Rövid leírás..." />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors">
              Mégse
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC400] text-black text-sm font-black rounded-lg hover:bg-[#E6B000] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              <Save size={14} /> {saving ? 'Mentés...' : isCreate ? 'Létrehozás' : 'Mentés'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
