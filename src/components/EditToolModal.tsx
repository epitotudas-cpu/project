import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Tool } from '../lib/supabase';
import { createTool, updateTool } from '../services/toolService';

interface EditToolModalProps {
  tool: Tool | null; // null = create mode
  onClose: () => void;
  onSaved: (saved: Tool) => void;
}

interface FormState {
  name: string;
  slug: string;
  type: string;
  subtype: string;
  brand: string;
  description: string;
  professions: string;
  uses: string;
  buying_guide: string;
  common_mistakes: string;
  price: string;
  currency: string;
  features: string;
  image_url: string;
  status: Tool['status'];
  seo_title: string;
  seo_description: string;
  keywords: string;
  canonical_url: string;
  is_indexable: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  type: 'Kéziszerszámok',
  subtype: '',
  brand: '',
  description: '',
  professions: '',
  uses: '',
  buying_guide: '',
  common_mistakes: '',
  price: '',
  currency: 'HUF',
  features: '',
  image_url: '',
  status: 'active',
  seo_title: '',
  seo_description: '',
  keywords: '',
  canonical_url: '',
  is_indexable: true,
};

function formFromTool(t: Tool): FormState {
  return {
    name: t.name,
    slug: t.slug,
    type: t.type ?? 'Kéziszerszámok',
    subtype: t.subtype ?? '',
    brand: t.brand ?? '',
    description: t.description ?? '',
    professions: (t.professions ?? []).join(', '),
    uses: (t.uses ?? []).join(', '),
    buying_guide: (t.buying_guide ?? []).join('\n'),
    common_mistakes: (t.common_mistakes ?? []).join('\n'),
    price: t.price != null ? String(t.price) : '',
    currency: t.currency ?? 'HUF',
    features: (t.features ?? []).join(', '),
    image_url: t.image_url ?? '',
    status: t.status,
    seo_title: t.seo_title ?? '',
    seo_description: t.seo_description ?? '',
    keywords: (t.keywords ?? []).join(', '),
    canonical_url: t.canonical_url ?? '',
    is_indexable: t.is_indexable ?? true,
  };
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function EditToolModal({ tool, onClose, onSaved }: EditToolModalProps) {
  const isCreate = tool === null;
  const [form, setForm] = useState<FormState>(() => (tool ? formFromTool(tool) : { ...EMPTY_FORM }));
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tool) {
      setForm(formFromTool(tool));
      setSlugTouched(true);
    } else {
      setForm({ ...EMPTY_FORM });
      setSlugTouched(false);
    }
    setError(null);
  }, [tool]);

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
      setError('Az eszköz neve megadása kötelező.');
      return;
    }
    const finalSlug = form.slug.trim() || slugify(form.name);
    if (!finalSlug) {
      setError('A slug érvénytelen.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const priceNum = form.price.trim() === '' ? null : Number(form.price.trim());
      if (priceNum != null && Number.isNaN(priceNum)) {
        setError('A ár értéke érvénytelen szám.');
        setSaving(false);
        return;
      }
      const payload = {
        name: form.name.trim(),
        slug: finalSlug,
        type: form.type.trim() || null,
        subtype: form.subtype.trim() || null,
        brand: form.brand.trim() || null,
        description: form.description.trim() || null,
        professions: parseList(form.professions),
        uses: parseList(form.uses),
        buying_guide: form.buying_guide.split('\n').map((s) => s.trim()).filter(Boolean),
        common_mistakes: form.common_mistakes.split('\n').map((s) => s.trim()).filter(Boolean),
        price: priceNum,
        currency: form.currency.trim() || 'HUF',
        features: parseList(form.features),
        image_url: form.image_url.trim() || null,
        status: form.status,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        keywords: parseList(form.keywords),
        canonical_url: form.canonical_url.trim() || null,
        is_indexable: form.is_indexable,
      };
      let data: Tool;
      if (tool) {
        data = await updateTool(tool.id, payload);
      } else {
        data = await createTool(payload);
      }
      onSaved(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mentés sikertelen.';
      if (/duplicate|unique|23505/i.test(msg)) {
        setError('Ez a slug már foglalt.');
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
        className="bg-[#111] border border-[#1E1E1E] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] sticky top-0 bg-[#111] z-10">
          <h2 className="text-base font-black text-white">{isCreate ? 'Új eszköz létrehozása' : 'Eszköz szerkesztése'}</h2>
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
            <label className={labelClass}>Eszköz neve <span className="text-red-400">*</span></label>
            <input
              className={fieldClass}
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="pl. Akkus fúró"
              autoFocus={isCreate}
            />
          </div>

          <div>
            <label className={labelClass}>Slug</label>
            <input className={fieldClass} value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="url-barat-azonosito" />
            <p className="text-xs text-gray-600 mt-1.5">Automatikusan generálódik a névből, ha üresen hagyja.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Típus / Kategória</label>
              <input className={fieldClass} value={form.type} onChange={(e) => update('type', e.target.value)} placeholder="pl. Fúró" />
            </div>
            <div>
              <label className={labelClass}>Márka</label>
              <input className={fieldClass} value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="pl. Bosch" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Leírás</label>
            <textarea
              className={`${fieldClass} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Rövid leírás..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ár</label>
              <input
                type="number"
                step="0.01"
                className={fieldClass}
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Pénznem</label>
              <input className={fieldClass} value={form.currency} onChange={(e) => update('currency', e.target.value)} placeholder="HUF" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Kép URL</label>
            <input className={fieldClass} value={form.image_url} onChange={(e) => update('image_url', e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <label className={labelClass}>Jellemzők (vesszővel)</label>
            <input className={fieldClass} value={form.features} onChange={(e) => update('features', e.target.value)} placeholder="vezeték nélküli, akkus, 18V" />
          </div>

          <div>
            <label className={labelClass}>Státusz</label>
            <select className={fieldClass} value={form.status} onChange={(e) => update('status', e.target.value as Tool['status'])}>
              <option value="active">Aktív</option>
              <option value="discontinued">Kivezetve</option>
            </select>
          </div>

          {/* SEO & Meta Data Section */}
          <div className="pt-4 border-t border-[#222] space-y-4">
            <h4 className="text-xs font-black text-[#FFC400] uppercase tracking-wider">
              SEO & Meta Adatok Kezelője
            </h4>

            <div>
              <label className={labelClass}>SEO Cím (Title tag)</label>
              <input className={fieldClass} value={form.seo_title} onChange={(e) => update('seo_title', e.target.value)} placeholder="pl. Ácskalapács Mágneses Szegtartóval – ÉpítőTudás" />
            </div>

            <div>
              <label className={labelClass}>SEO Meta Leírás (Description)</label>
              <textarea className={`${fieldClass} resize-none`} rows={2} value={form.seo_description} onChange={(e) => update('seo_description', e.target.value)} placeholder="Keresőmotorokban megjelenő leírás..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Keresési Kulcsszavak (vesszővel)</label>
                <input className={fieldClass} value={form.keywords} onChange={(e) => update('keywords', e.target.value)} placeholder="kalapács, ácskalapács, zsaluzás" />
              </div>
              <div>
                <label className={labelClass}>Canonical URL</label>
                <input className={fieldClass} value={form.canonical_url} onChange={(e) => update('canonical_url', e.target.value)} placeholder="https://epitotudas.hu/eszkozok/acskalapacs" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_indexable"
                checked={form.is_indexable}
                onChange={(e) => update('is_indexable', e.target.checked)}
                className="w-4 h-4 rounded bg-[#0A0A0A] border-[#1E1E1E] text-[#FFC400] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="is_indexable" className="text-xs font-bold text-gray-300 cursor-pointer">
                Google & keresők által indexelhető oldal (Indexable)
              </label>
            </div>
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
