import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Article, Category } from '../lib/supabase';
import { createArticle, updateArticle } from '../services/articleService';

interface EditArticleModalProps {
  article: Article | null; // null = create mode
  categories: Category[];
  onClose: () => void;
  onSaved: (saved: Article) => void;
}

type DifficultyForm = '' | NonNullable<Article['difficulty']>;

const DIFFICULTY_OPTIONS: { value: NonNullable<Article['difficulty']>; label: string }[] = [
  { value: 'beginner', label: 'Kezdő' },
  { value: 'intermediate', label: 'Haladó' },
  { value: 'advanced', label: 'Magas szint' },
  { value: 'expert', label: 'Szakértő' },
];

const STATUS_OPTIONS: { value: Article['status']; label: string }[] = [
  { value: 'draft', label: 'Piszkozat' },
  { value: 'review', label: 'Felülvizsgálat' },
  { value: 'published', label: 'Közzétéve' },
];

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: string;
  difficulty: DifficultyForm;
  status: Article['status'];
  author: string;
  read_time: number;
  featured_image: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category_id: '',
  difficulty: '',
  status: 'draft',
  author: '',
  read_time: 5,
  featured_image: '',
};

function formFromArticle(article: Article): FormState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? '',
    content: article.content ?? '',
    category_id: article.category_id ?? '',
    difficulty: (article.difficulty ?? '') as DifficultyForm,
    status: article.status,
    author: article.author ?? '',
    read_time: article.read_time,
    featured_image: article.featured_image ?? '',
  };
}

function EditArticleModal({ article, categories, onClose, onSaved }: EditArticleModalProps) {
  const isCreate = article === null;
  const [form, setForm] = useState<FormState>(() => (article ? formFromArticle(article) : { ...EMPTY_FORM }));
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setForm(formFromArticle(article));
      setSlugTouched(true);
    } else {
      setForm({ ...EMPTY_FORM });
      setSlugTouched(false);
    }
    setError(null);
  }, [article]);

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

  function handleTitleChange(value: string) {
    update('title', value);
    if (!slugTouched) update('slug', slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    update('slug', slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('A cím megadása kötelező.');
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
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim() || null,
        category_id: form.category_id || null,
        difficulty: (form.difficulty || null) as Article['difficulty'],
        status: form.status,
        author: form.author.trim() || null,
        read_time: Number(form.read_time) || 1,
        featured_image: form.featured_image.trim() || null,
      };
      let data: Article;
      if (article) {
        data = await updateArticle(article.id, payload);
      } else {
        data = await createArticle(payload);
      }
      onSaved(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mentés sikertelen.';
      if (/duplicate|unique|23505/i.test(msg)) {
        setError('Ez a slug már foglalt. Válasszon másikat.');
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
        className="bg-[#111] border border-[#1E1E1E] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] sticky top-0 bg-[#111] z-10">
          <h2 className="text-base font-black text-white">{isCreate ? 'Új cikk létrehozása' : 'Cikk szerkesztése'}</h2>
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
            <label className={labelClass}>Cím <span className="text-red-400">*</span></label>
            <input
              className={fieldClass}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Cikk címe"
              autoFocus={isCreate}
            />
          </div>

          <div>
            <label className={labelClass}>Slug <span className="text-red-400">*</span></label>
            <input className={fieldClass} value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="url-barat-azonosito" />
            <p className="text-xs text-gray-600 mt-1.5">Automatikusan generálódik a címből, ha üresen hagyja.</p>
          </div>

          <div>
            <label className={labelClass}>Kivonat</label>
            <textarea className={`${fieldClass} resize-none`} rows={2} value={form.excerpt} onChange={(e) => update('excerpt', e.target.value)} placeholder="Rövid leírás..." />
          </div>

          <div>
            <label className={labelClass}>Tartalom</label>
            <textarea className={`${fieldClass} resize-y min-h-[160px]`} rows={8} value={form.content} onChange={(e) => update('content', e.target.value)} placeholder="Cikk tartalma..." />
          </div>

          <div>
            <label className={labelClass}>Borítókép URL</label>
            <input className={fieldClass} value={form.featured_image} onChange={(e) => update('featured_image', e.target.value)} placeholder="https://..." />
            {form.featured_image && (
              <div className="mt-2 h-24 w-full overflow-hidden rounded-lg border border-[#1E1E1E]">
                <img src={form.featured_image} alt="Előnézet" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Kategória</label>
              <select className={fieldClass} value={form.category_id} onChange={(e) => update('category_id', e.target.value)}>
                <option value="">— Nincs —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Publikálási státusz</label>
              <select className={fieldClass} value={form.status} onChange={(e) => update('status', e.target.value as Article['status'])}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nehézség</label>
              <select className={fieldClass} value={form.difficulty} onChange={(e) => update('difficulty', e.target.value as DifficultyForm)}>
                <option value="">— Nincs —</option>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Olvasási idő (perc)</label>
              <input type="number" min={1} className={fieldClass} value={form.read_time} onChange={(e) => update('read_time', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Szerző</label>
            <input className={fieldClass} value={form.author} onChange={(e) => update('author', e.target.value)} placeholder="Szerző neve" />
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

export default EditArticleModal;
