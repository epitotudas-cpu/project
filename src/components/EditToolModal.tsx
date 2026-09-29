import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Tool, RecommendedProduct, Article } from '../lib/supabase';
import { createTool, updateTool } from '../services/toolService';
import { getPublishedArticles } from '../services/articleService';
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
  video_url: string;
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
  video_url: '',
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
    video_url: t.video_url ?? '',
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
  const [products, setProducts] = useState<RecommendedProduct[]>(() =>
    tool?.recommended_products ? (JSON.parse(JSON.stringify(tool.recommended_products)) as RecommendedProduct[]) : []
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [availableArticles, setAvailableArticles] = useState<Article[]>([]);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -6);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  useEffect(() => {
    getPublishedArticles().then((articles) => {
      if (articles) setAvailableArticles(articles);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tool) {
      setForm(formFromTool(tool));
      setProducts(tool.recommended_products ? (JSON.parse(JSON.stringify(tool.recommended_products)) as RecommendedProduct[]) : []);
      setSlugTouched(true);
    } else {
      setForm({ ...EMPTY_FORM });
      setProducts([]);
      setSlugTouched(false);
    }
    setError(null);
    setSaveStatus('idle');
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

  function addProduct() {
    setProducts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        brand: '',
        description: '',
        image_url: '',
        product_url: '',
        partner_url: '',
        price: '',
        currency: 'HUF',
        features: [],
        video_url: '',
        is_featured: false,
        is_tested: false,
        test_period: '',
        test_environment: '',
        test_experience: '',
        test_pros: [],
        test_cons: [],
        test_provided_by_manufacturer: false,
        test_date: '',
        related_article_ids: [],
      },
    ]);
  }

  function updateProduct(index: number, patch: Partial<RecommendedProduct>) {
    setProducts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  function moveProductUp(index: number) {
    if (index <= 0) return;
    setProducts((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  }

  function moveProductDown(index: number) {
    setProducts((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Az eszköz neve megadása kötelező.');
      setSaveStatus('error');
      return;
    }
    const finalSlug = form.slug.trim() || slugify(form.name);
    if (!finalSlug) {
      setError('A slug érvénytelen.');
      setSaveStatus('error');
      return;
    }
    setSaving(true);
    setSaveStatus('saving');
    setError(null);
    try {
      const priceNum = form.price.trim() === '' ? null : Number(form.price.trim());
      if (priceNum != null && Number.isNaN(priceNum)) {
        setError('A ár értéke érvénytelen szám.');
        setSaveStatus('error');
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
        video_url: form.video_url.trim() || null,
        recommended_products: products
          .map((p) => ({
            id: p.id || undefined,
            name: p.name.trim(),
            brand: p.brand.trim(),
            description: p.description?.trim() || undefined,
            image_url: p.image_url?.trim() || undefined,
            product_url: p.product_url?.trim() || undefined,
            partner_url: p.partner_url?.trim() || undefined,
            price: p.price != null && p.price !== '' ? (typeof p.price === 'number' ? p.price : Number(p.price) || p.price) : undefined,
            currency: p.currency?.trim() || 'HUF',
            features: typeof p.features === 'string' ? parseList(p.features) : Array.isArray(p.features) ? p.features : [],
            is_featured: Boolean(p.is_featured),
            is_tested: Boolean(p.is_tested),
            test_period: p.is_tested ? p.test_period?.trim() || undefined : undefined,
            test_environment: p.is_tested ? p.test_environment?.trim() || undefined : undefined,
            test_experience: p.is_tested ? p.test_experience?.trim() || undefined : undefined,
            test_pros: p.is_tested && p.test_pros ? (typeof p.test_pros === 'string' ? parseList(p.test_pros) : p.test_pros) : undefined,
            test_cons: p.is_tested && p.test_cons ? (typeof p.test_cons === 'string' ? parseList(p.test_cons) : p.test_cons) : undefined,
            test_provided_by_manufacturer: p.is_tested ? Boolean(p.test_provided_by_manufacturer) : undefined,
            test_date: p.is_tested ? p.test_date?.trim() || undefined : undefined,
            video_url: p.video_url?.trim() || undefined,
            related_article_ids: p.related_article_ids && Array.isArray(p.related_article_ids) && p.related_article_ids.length > 0 ? p.related_article_ids.filter(Boolean) : undefined,
          }))
          .filter((p) => p.name.length > 0),
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
      setSaveStatus('success');
      onSaved(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'A mentés nem sikerült. Próbáld újra.';
      if (/duplicate|unique|23505/i.test(msg)) {
        setError('Ez a slug már foglalt.');
      } else {
        setError(msg);
      }
      setSaveStatus('error');
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
        className="border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
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
              placeholder="pl. Ácskalapács"
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
              <input style={fieldStyle} className={fieldClass} value={form.type} onChange={(e) => update('type', e.target.value)} placeholder="pl. Kéziszerszámok" />
            </div>
            <div>
              <label style={labelStyle} className={labelClass}>Márka / Gyártók összefoglalása</label>
              <input style={fieldStyle} className={fieldClass} value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="pl. Stanley / Milwaukee" />
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
              placeholder="Szakmai enciklopédia leírás..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle} className={labelClass}>Ár (ha releváns)</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle} className={labelClass}>Kép URL</label>
              <input style={fieldStyle} className={fieldClass} value={form.image_url} onChange={(e) => update('image_url', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label style={labelStyle} className={labelClass}>Fő Eszközvideó URL (YouTube)</label>
              <input style={fieldStyle} className={fieldClass} value={form.video_url} onChange={(e) => update('video_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
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

          {/* Manufacturer Products & Tests Management Section */}
          <div style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h4 style={{ color: cardHighlight }} className="text-xs font-black uppercase tracking-wider">
                Konkrét Gyártói Termékek &amp; Tesztek ({products.length})
              </h4>
              <button
                type="button"
                onClick={addProduct}
                style={{ backgroundColor: cardHighlight, color: '#000000' }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg hover:opacity-90 transition-colors cursor-pointer"
              >
                <Plus size={14} /> + Új gyártói termék
              </button>
            </div>

            {products.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Még nincsenek gyártói termékek rögzítve ehhez az eszközhöz.</p>
            ) : (
              <div className="space-y-4">
                {products.map((prod, idx) => (
                  <div
                    key={idx}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                    className="border rounded-xl p-4 space-y-3 relative"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-700/50">
                      <span className="text-xs font-black text-amber-400">
                        #{idx + 1} Gyártói Termék {prod.name ? `– ${prod.name}` : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveProductUp(idx)}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Mozgatás fel"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProductDown(idx)}
                          disabled={idx === products.length - 1}
                          className="p-1 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Mozgatás le"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProduct(idx)}
                          className="p-1 text-red-400 hover:text-red-300 cursor-pointer ml-1"
                          title="Termék törlése"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={labelStyle} className={labelClass}>Termék neve *</label>
                        <input
                          style={fieldStyle}
                          className={fieldClass}
                          value={prod.name || ''}
                          onChange={(e) => updateProduct(idx, { name: e.target.value })}
                          placeholder="pl. STANLEY FatMax 600g"
                        />
                      </div>
                      <div>
                        <label style={labelStyle} className={labelClass}>Gyártó / Márka *</label>
                        <input
                          style={fieldStyle}
                          className={fieldClass}
                          value={prod.brand || ''}
                          onChange={(e) => updateProduct(idx, { brand: e.target.value })}
                          placeholder="pl. Stanley"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Rövid leírás</label>
                      <textarea
                        style={fieldStyle}
                        className={`${fieldClass} resize-none`}
                        rows={2}
                        value={prod.description || ''}
                        onChange={(e) => updateProduct(idx, { description: e.target.value })}
                        placeholder="Termék ismertetője..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={labelStyle} className={labelClass}>Kép URL</label>
                        <input
                          style={fieldStyle}
                          className={fieldClass}
                          value={prod.image_url || ''}
                          onChange={(e) => updateProduct(idx, { image_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <label style={labelStyle} className={labelClass}>Termék videó URL</label>
                        <input
                          style={fieldStyle}
                          className={fieldClass}
                          value={prod.video_url || ''}
                          onChange={(e) => updateProduct(idx, { video_url: e.target.value })}
                          placeholder="https://www.youtube.com/..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={labelStyle} className={labelClass}>Gyártói oldal URL</label>
                        <input
                          style={fieldStyle}
                          className={fieldClass}
                          value={prod.product_url || ''}
                          onChange={(e) => updateProduct(idx, { product_url: e.target.value })}
                          placeholder="https://stanley.hu/..."
                        />
                      </div>
                      <div>
                        <label style={labelStyle} className={labelClass}>Partneri / Vásárlási URL</label>
                        <input
                          style={fieldStyle}
                          className={fieldClass}
                          value={prod.partner_url || ''}
                          onChange={(e) => updateProduct(idx, { partner_url: e.target.value })}
                          placeholder="https://webshop.hu/..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={labelStyle} className={labelClass}>Ár</label>
                        <input
                          type="number"
                          style={fieldStyle}
                          className={fieldClass}
                          value={prod.price != null ? String(prod.price) : ''}
                          onChange={(e) => updateProduct(idx, { price: e.target.value ? Number(e.target.value) : null })}
                          placeholder="pl. 14900"
                        />
                      </div>
                      <div>
                        <label style={labelStyle} className={labelClass}>Pénznem</label>
                        <input
                          style={fieldStyle}
                          className={fieldClass}
                          value={prod.currency || 'HUF'}
                          onChange={(e) => updateProduct(idx, { currency: e.target.value })}
                          placeholder="HUF"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Főbb jellemzők (vesszővel elválasztva)</label>
                      <input
                        style={fieldStyle}
                        className={fieldClass}
                        value={Array.isArray(prod.features) ? prod.features.join(', ') : prod.features || ''}
                        onChange={(e) => updateProduct(idx, { features: parseList(e.target.value) })}
                        placeholder="Mágneses fej, Rezgéscsillapító nyél"
                      />
                    </div>

                    {/* Related Articles Picker Section */}
                    <div className="space-y-2 pt-2 border-t border-gray-700/50">
                      <label style={labelStyle} className={labelClass}>
                        Kapcsolódó ÉpítőTudás cikkek ({prod.related_article_ids?.length || 0})
                      </label>

                      {prod.related_article_ids && prod.related_article_ids.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {prod.related_article_ids.map((artId) => {
                            const art = availableArticles.find((a) => a.id === artId);
                            return (
                              <div
                                key={artId}
                                className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-800/80 border border-gray-700 rounded-lg text-xs"
                              >
                                <span className="text-gray-200 font-medium truncate">
                                  {art ? `📄 ${art.title}` : `📄 Cikk ID: ${artId}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextIds = (prod.related_article_ids || []).filter((id) => id !== artId);
                                    updateProduct(idx, { related_article_ids: nextIds });
                                  }}
                                  className="text-red-400 hover:text-red-300 font-bold shrink-0 text-[11px] cursor-pointer"
                                >
                                  Eltávolítás
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <select
                          style={fieldStyle}
                          className={`${fieldClass} text-xs`}
                          value=""
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (!selectedId) return;
                            const currentIds = prod.related_article_ids || [];
                            if (!currentIds.includes(selectedId)) {
                              updateProduct(idx, { related_article_ids: [...currentIds, selectedId] });
                            }
                          }}
                        >
                          <option value="">+ Cikk hozzáadása a termékhez...</option>
                          {availableArticles
                            .filter((a) => !(prod.related_article_ids || []).includes(a.id))
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.title} ({a.article_type || 'cikk'})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Badges and Test Checkboxes */}
                    <div className="space-y-2 pt-2 border-t border-gray-700/50">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold" style={{ color: textColor }}>
                          <input
                            type="checkbox"
                            checked={Boolean(prod.is_featured)}
                            onChange={(e) => updateProduct(idx, { is_featured: e.target.checked })}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          Kiemelt termék
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold" style={{ color: textColor }}>
                          <input
                            type="checkbox"
                            checked={Boolean(prod.is_tested)}
                            onChange={(e) => updateProduct(idx, { is_tested: e.target.checked })}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          ÉpítőTudás által tesztelve
                        </label>

                        {prod.is_tested && (
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold" style={{ color: textColor }}>
                            <input
                              type="checkbox"
                              checked={Boolean(prod.test_provided_by_manufacturer)}
                              onChange={(e) => updateProduct(idx, { test_provided_by_manufacturer: e.target.checked })}
                              className="w-4 h-4 rounded cursor-pointer"
                            />
                            Gyártó által biztosított teszttermék
                          </label>
                        )}
                      </div>

                      {/* Test Details Fields if is_tested === true */}
                      {prod.is_tested && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-3 mt-2">
                          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">
                            ÉpítőTudás Saját Teszt Részletei
                          </span>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label style={labelStyle} className={labelClass}>Tesztelés dátuma</label>
                              <input
                                type="date"
                                style={fieldStyle}
                                className={fieldClass}
                                value={prod.test_date || ''}
                                onChange={(e) => updateProduct(idx, { test_date: e.target.value })}
                              />
                            </div>
                            <div>
                              <label style={labelStyle} className={labelClass}>Tesztelés időszaka</label>
                              <input
                                style={fieldStyle}
                                className={fieldClass}
                                value={prod.test_period || ''}
                                onChange={(e) => updateProduct(idx, { test_period: e.target.value })}
                                placeholder="pl. 2026.09.01 - 2026.10.15"
                              />
                            </div>
                            <div>
                              <label style={labelStyle} className={labelClass}>Tesztelés környezete</label>
                              <input
                                style={fieldStyle}
                                className={fieldClass}
                                value={prod.test_environment || ''}
                                onChange={(e) => updateProduct(idx, { test_environment: e.target.value })}
                                placeholder="pl. zsaluzási és szerkezetépítési munkák"
                              />
                            </div>
                          </div>

                          <div>
                            <label style={labelStyle} className={labelClass}>Saját tapasztalat / Értékelés</label>
                            <textarea
                              style={fieldStyle}
                              className={`${fieldClass} resize-none`}
                              rows={2}
                              value={prod.test_experience || ''}
                              onChange={(e) => updateProduct(idx, { test_experience: e.target.value })}
                              placeholder="Részletes szakmai tapasztalatok a tesztelés során..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label style={labelStyle} className={labelClass}>Előnyök (vesszővel)</label>
                              <input
                                style={fieldStyle}
                                className={fieldClass}
                                value={Array.isArray(prod.test_pros) ? prod.test_pros.join(', ') : prod.test_pros || ''}
                                onChange={(e) => updateProduct(idx, { test_pros: parseList(e.target.value) })}
                                placeholder="Erős mágnes, Nagyon jó fogás"
                              />
                            </div>
                            <div>
                              <label style={labelStyle} className={labelClass}>Észrevételek / Korlátok (vesszővel)</label>
                              <input
                                style={fieldStyle}
                                className={fieldClass}
                                value={Array.isArray(prod.test_cons) ? prod.test_cons.join(', ') : prod.test_cons || ''}
                                onChange={(e) => updateProduct(idx, { test_cons: parseList(e.target.value) })}
                                placeholder="Nagyobb súly hosszú munkánál"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-3 px-4 border-t sticky bottom-0 z-10 rounded-b-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-3 ml-auto">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl animate-pulse">
                  <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  Mentés folyamatban...
                </span>
              )}

              {saveStatus === 'success' && (
                <span className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl animate-fadeIn">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  A módosítások sikeresen mentve.
                </span>
              )}

              {(saveStatus === 'error' || error) && (
                <span className="flex items-center gap-2 px-3.5 py-1.5 bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl animate-fadeIn">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  {error || 'A mentés nem sikerült. Próbáld újra.'}
                </span>
              )}

              <button type="button" onClick={onClose} disabled={saving} style={{ borderColor: cardBorder, color: textColor }} className="px-4 py-2 border font-bold text-xs rounded-lg hover:opacity-80 disabled:opacity-40 transition-colors cursor-pointer">
                Mégse
              </button>
              <button type="submit" disabled={saving} style={{ backgroundColor: cardHighlight, color: '#000000' }} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md">
                <Save size={14} /> {saving ? 'Mentés...' : isCreate ? 'Létrehozás' : 'Mentés'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
