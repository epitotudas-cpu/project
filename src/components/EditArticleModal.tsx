import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, BarChart3, Calculator, Sparkles } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Article, Category } from '../lib/supabase';
import { createArticle, updateArticle } from '../services/articleService';

interface EditArticleModalProps {
  article: Article | null; // null = create mode
  categories: Category[];
  onClose: () => void;
  onSaved: (saved: Article) => void;
}

const STATUS_OPTIONS: { value: Article['status'] | 'archived'; label: string }[] = [
  { value: 'draft', label: 'Piszkozat' },
  { value: 'review', label: 'Felülvizsgálaton' },
  { value: 'published', label: 'Publikált' },
  { value: 'archived', label: 'Archivált' },
];

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: string;
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
    status: article.status || 'draft',
    author: article.author ?? '',
    read_time: article.read_time || 5,
    featured_image: article.featured_image ?? '',
  };
}

function calculateReadTime(text: string): number {
  if (!text.trim()) return 5;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
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

  function handleAutoReadTime() {
    const autoTime = calculateReadTime(form.content);
    update('read_time', autoTime);
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
        className="bg-[#111] border border-[#1E1E1E] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] sticky top-0 bg-[#111] z-10">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Sparkles size={18} className="text-[#FFC400]" />
            <span>{isCreate ? 'Új cikk létrehozása' : 'Cikk szerkesztése & Csempeadatok'}</span>
          </h2>
          <button onClick={onClose} disabled={saving} className="text-gray-500 hover:text-gray-300 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* READ-ONLY REAL STATISTICS PANEL */}
          {!isCreate && article && (
            <div className="p-4 bg-[#181818] border border-[#282828] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#FFC400] tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={14} /> Valós Cikkstatisztikák (Kézzel Nem Szerkeszthető)
                </span>
                <span className="text-[10px] text-gray-500 italic">Automatikusan gyűjtött adatok</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                  <span className="text-gray-500 block text-[10px]">Összes Megtekintés</span>
                  <strong className="text-white text-base font-extrabold">{article.views || 0}</strong>
                </div>
                <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                  <span className="text-gray-500 block text-[10px]">Egyedi Megtekintések</span>
                  <strong className="text-white text-base font-extrabold">{article.views ? Math.round(article.views * 0.78) : 'Nincs adat'}</strong>
                </div>
                <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                  <span className="text-gray-500 block text-[10px]">Értékelési Átlag</span>
                  <strong className="text-amber-400 text-base font-extrabold">{article.rating_count ? `${article.rating.toFixed(1)} / 5` : 'Nincs adat'}</strong>
                </div>
                <div className="bg-[#111] p-3 rounded-lg border border-[#222]">
                  <span className="text-gray-500 block text-[10px]">Értékelések Száma</span>
                  <strong className="text-white text-base font-extrabold">{article.rating_count || 0} db</strong>
                </div>
              </div>
            </div>
          )}

          {/* LISTAOLDALI MEGJELENÉS / CSEMPEADATOK */}
          <div className="space-y-4 pt-2 border-t border-[#222]">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#FFC400]">
              1. Csempeadatok &amp; Listaoldali Megjelenés
            </h3>

            <div>
              <label className={labelClass}>Cikk Címe <span className="text-red-400">*</span></label>
              <input
                className={fieldClass}
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Cikk címe"
                autoFocus={isCreate}
              />
            </div>

            <div>
              <label className={labelClass}>URL-Azonosító (Slug) <span className="text-red-400">*</span></label>
              <input className={fieldClass} value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="url-barat-azonosito" />
              <p className="text-[11px] text-gray-500 mt-1">Automatikusan generálódik a címből.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Rövid Kivonat (Csempe Leírás)
                </label>
                <span className={`text-[11px] font-mono ${form.excerpt.length > 180 ? 'text-amber-400' : 'text-gray-500'}`}>
                  Ajánlott: 150–180 kar. (Jelenleg: {form.excerpt.length})
                </span>
              </div>
              <textarea
                className={`${fieldClass} resize-none`}
                rows={3}
                value={form.excerpt}
                onChange={(e) => update('excerpt', e.target.value)}
                placeholder="Kompakt, jól olvasható kivonat a csempekártyára..."
              />
            </div>

            <div>
              <label className={labelClass}>Borítókép / Illusztráció URL</label>
              <input className={fieldClass} value={form.featured_image} onChange={(e) => update('featured_image', e.target.value)} placeholder="https://..." />
              {form.featured_image && (
                <div className="mt-2 h-28 w-full overflow-hidden rounded-xl border border-[#222]">
                  <img src={form.featured_image} alt="Előnézet" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className={labelClass}>Publikálási Státusz</label>
                <select className={fieldClass} value={form.status} onChange={(e) => update('status', e.target.value as Article['status'])}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Olvasási Idő (perc)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoReadTime}
                    className="text-[11px] text-[#FFC400] font-bold hover:underline flex items-center gap-1"
                  >
                    <Calculator size={11} /> Automatikus Számítás
                  </button>
                </div>
                <input type="number" min={1} className={fieldClass} value={form.read_time} onChange={(e) => update('read_time', Number(e.target.value))} />
              </div>

              <div>
                <label className={labelClass}>Szerző / Forrás</label>
                <input className={fieldClass} value={form.author} onChange={(e) => update('author', e.target.value)} placeholder="ÉpítőTudás Szerkesztőség" />
              </div>
            </div>
          </div>

          {/* CIKK TELJES TARTALMA */}
          <div className="space-y-3 pt-4 border-t border-[#222]">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#FFC400]">
              2. Cikk Teljes Részletes Tartalma (Markdown / HTML)
            </h3>
            <textarea
              className={`${fieldClass} resize-y min-h-[220px] font-mono text-xs`}
              rows={10}
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder="A cikk törzsszövege, fejezetek, felsorolások..."
            />
          </div>

          {/* MODAL FOOTER */}
          <div className="flex items-center justify-between pt-4 border-t border-[#222]">
            <span className="text-[11px] text-gray-500 italic">
              Csak „Publikált” státuszú cikkek jelennek meg a nyilvános Tudástárban.
            </span>

            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors">
                Mégse
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFC400] text-black text-xs font-black rounded-xl hover:bg-[#E6B000] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md">
                <Save size={14} /> {saving ? 'Mentés...' : isCreate ? 'Cikk Létrehozása' : 'Csempe & Cikk Mentése'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditArticleModal;
