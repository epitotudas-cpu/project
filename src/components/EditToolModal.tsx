import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Tool } from '../lib/supabase';
import { createTool, updateTool } from '../services/toolService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

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

function parseList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function EditToolModal({ tool, onClose, onSaved }: EditToolModalProps) {
  const isCreate = tool === null;
  const [form, setForm] = useState<FormState>(() => (tool ? formFromTool(tool) : EMPTY_FORM));
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -6);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  useEffect(() => {
    setForm(tool ? formFromTool(tool) : EMPTY_FORM);
    setSlugTouched(false);
    setError(null);
  }, [tool]);

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

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };
  const labelStyle: React.CSSProperties = {
    color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563',
  };

  const fieldClass =
    'w-full border rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-bold mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !saving && onClose()}>
      <div
        style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
        className="border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10">
          <h2 style={{ color: textColor }} className="text-base font-black">{isCreate ? 'Új eszköz létrehozása' : 'Eszköz szerkesztése'}</h2>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-white disabled:opacity-40 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label style={labelStyle} className={labelClass}>Eszköz neve <span className="text-red-400">*</span></label>
            <input
              style={fieldStyle}
              className={fieldClass}
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="pl. Akkus fúró"
              autoFocus={isCreate}
            />
          </div>

          <div>
            <label style={labelStyle} className={labelClass}>Slug</label>
            <input style={fieldStyle} className={fieldClass} value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="url-barat-azonosito" />
            <p className="text-xs text-gray-500 mt-1.5">Automatikusan generálódik a névből, ha üresen hagyja.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle} className={labelClass}>Típus / Kategória</label>
              <input style={fieldStyle} className={fieldClass} value={form.type} onChange={(e) => update('type', e.target.value)} placeholder="pl. Fúró" />
            </div>
            <div>
              <label style={labelStyle} className={labelClass}>Márka</label>
              <input style={fieldStyle} className={fieldClass} value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="pl. Bosch" />
            </div>
          </div>

          <div>
            <label style={labelStyle} className={labelClass}>Leírás</label>
            <textarea
              style={fieldStyle}
              className={`${fieldClass} resize-none`}
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Rövid leírás..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle} className={labelClass}>Ár</label>
              <input
                type="number"
                step="0.01"
                style={fieldStyle}
                className={fieldClass}
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="pl. 15000"
              />
            </div>
            <div>
              <label style={labelStyle} className={labelClass}>Pénznem</label>
              <input style={fieldStyle} className={fieldClass} value={form.currency} onChange={(e) => update('currency', e.target.value)} placeholder="HUF" />
            </div>
          </div>

          <div>
            <label style={labelStyle} className={labelClass}>Kép URL</label>
            <input style={fieldStyle} className={fieldClass} value={form.image_url} onChange={(e) => update('image_url', e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <label style={labelStyle} className={labelClass}>Jellemzők (vesszővel)</label>
            <input style={fieldStyle} className={fieldClass} value={form.features} onChange={(e) => update('features', e.target.value)} placeholder="vezeték nélküli, akkus, 18V" />
          </div>

          <div>
            <label style={labelStyle} className={labelClass}>Státusz</label>
            <select style={fieldStyle} className={fieldClass} value={form.status} onChange={(e) => update('status', e.target.value as Tool['status'])}>
              <option value="active">Aktív</option>
              <option value="discontinued">Kivezetve</option>
            </select>
          </div>

          {/* SEO & Meta Data Section */}
          <div style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-4">
            <h4 style={{ color: cardHighlight }} className="text-xs font-black uppercase tracking-wider">
              SEO &amp; Meta Adatok Kezelője
            </h4>

            <div>
              <label style={labelStyle} className={labelClass}>SEO Cím (Title tag)</label>
              <input style={fieldStyle} className={fieldClass} value={form.seo_title} onChange={(e) => update('seo_title', e.target.value)} placeholder="pl. Ácskalapács Mágneses Szegtartóval – ÉpítőTudás" />
            </div>

            <div>
              <label style={labelStyle} className={labelClass}>SEO Meta Leírás (Description)</label>
              <textarea style={fieldStyle} className={`${fieldClass} resize-none`} rows={2} value={form.seo_description} onChange={(e) => update('seo_description', e.target.value)} placeholder="Keresőmotorokban megjelenő leírás..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle} className={labelClass}>Keresési Kulcsszavak (vesszővel)</label>
                <input style={fieldStyle} className={fieldClass} value={form.keywords} onChange={(e) => update('keywords', e.target.value)} placeholder="kalapács, ácskalapács, zsaluzás" />
              </div>
              <div>
                <label style={labelStyle} className={labelClass}>Canonical URL</label>
                <input style={fieldStyle} className={fieldClass} value={form.canonical_url} onChange={(e) => update('canonical_url', e.target.value)} placeholder="https://epitotudas.hu/eszkozok/acskalapacs" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_indexable"
                checked={form.is_indexable}
                onChange={(e) => update('is_indexable', e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="is_indexable" className="text-xs font-bold cursor-pointer" style={{ color: textColor }}>
                Google &amp; keresők által indexelhető oldal (Indexable)
              </label>
            </div>
          </div>

          <div style={{ borderColor: cardBorder }} className="flex items-center justify-end gap-3 pt-3 border-t">
            <button type="button" onClick={onClose} disabled={saving} style={{ borderColor: cardBorder, color: textColor }} className="px-4 py-2 border font-bold text-xs rounded-lg hover:opacity-80 disabled:opacity-40 transition-colors cursor-pointer">
              Mégse
            </button>
            <button type="submit" disabled={saving} style={{ backgroundColor: cardHighlight, color: '#000000' }} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md">
              <Save size={14} /> {saving ? 'Mentés...' : isCreate ? 'Létrehozás' : 'Mentés'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
