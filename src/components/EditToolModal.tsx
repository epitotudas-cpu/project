import { useState, useEffect } from 'react';
import {
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Sparkles,
  Sliders,
  Cpu,
  FileText,
  Image as ImageIcon,
  Wrench,
  Search,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Tool, RecommendedProduct, Article } from '../lib/supabase';
import { createTool, updateTool } from '../services/toolService';
import { getPublishedArticles } from '../services/articleService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';
import FormattedText from './FormattedText';

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

  // Dedicated Technical Specs Fields
  head_weight: string;
  handle_length: string;
  handle_material: string;
  grip_type: string;
  finish_types: string[];
  standard_ref: string;
}

const FINISH_OPTIONS = [
  'Kovácsolt edzett acél',
  'Hőkezelt ütőfelület (Pálya/Szem)',
  'Rozsdavédő fekete lakk bevonat',
  'Krómozott bevonat',
  'Polírozott pálya',
  'Nikkelezett felület',
];

const HANDLE_MATERIAL_OPTIONS = [
  'Hikkori fa (Észak-amerikai dió)',
  'Kőrisfa',
  'Üvegszálas polimer',
  'Monolit edzett acél',
  'Akácfa',
  'Műanyag / Kompozit',
];

const GRIP_TYPE_OPTIONS = [
  'Csúszásmentes gumi',
  'TPR ergonómiai grip',
  'Natúr csiszolt fa',
  'Lakk bevonatú fa',
  'Nincs / Szántott acélnyél',
];

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  type: 'Kéziszerszámok',
  subtype: 'Kalapácsok',
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

  head_weight: '',
  handle_length: '',
  handle_material: 'Hikkori fa (Észak-amerikai dió)',
  grip_type: 'Csúszásmentes gumi',
  finish_types: ['Kovácsolt edzett acél', 'Rozsdavédő fekete lakk bevonat'],
  standard_ref: 'DIN 1041',
};

function formFromTool(t: Tool): FormState {
  const specs = t.technical_specs || {};
  const finishStr = specs['Felületkezelés'] || '';
  const initialFinishes = FINISH_OPTIONS.filter((opt) => finishStr.includes(opt.split(' ')[0]));

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

    head_weight: specs['Fej tömege'] || specs['Súly'] || '',
    handle_length: specs['Nyél hossza'] || '',
    handle_material: specs['Nyél anyaga'] || specs['Nyél'] || 'Hikkori fa (Észak-amerikai dió)',
    grip_type: specs['Markolat típusa'] || 'Csúszásmentes gumi',
    finish_types: initialFinishes.length > 0 ? initialFinishes : ['Kovácsolt edzett acél'],
    standard_ref: specs['Szabvány'] || 'DIN 1041',
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
  const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'content' | 'media' | 'products' | 'seo'>('basic');
  const [form, setForm] = useState<FormState>(() => (tool ? formFromTool(tool) : EMPTY_FORM));
  const [products, setProducts] = useState<RecommendedProduct[]>(() =>
    tool?.recommended_products ? (JSON.parse(JSON.stringify(tool.recommended_products)) as RecommendedProduct[]) : []
  );

  // Custom key-value specs builder state
  const [customSpecs, setCustomSpecs] = useState<Array<{ key: string; value: string }>>(() => {
    if (!tool?.technical_specs) return [];
    const reservedKeys = new Set(['Fej tömege', 'Súly', 'Nyél hossza', 'Nyél anyaga', 'Nyél', 'Markolat típusa', 'Felületkezelés', 'Szabvány']);
    return Object.entries(tool.technical_specs)
      .filter(([k]) => !reservedKeys.has(k))
      .map(([key, value]) => ({ key, value }));
  });

  // Gallery URLs state
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    if (!tool) return [];
    if (Array.isArray((tool as any).image_urls) && (tool as any).image_urls.length > 0) {
      return (tool as any).image_urls;
    }
    if ((tool.specs as any)?.gallery_image_urls && Array.isArray((tool.specs as any).gallery_image_urls)) {
      return (tool.specs as any).gallery_image_urls;
    }
    return [];
  });

  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Preview & Device Switcher State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [livePreviewDevice, setLivePreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [descriptionPreviewDevice, setDescriptionPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [contentSubTab, setContentSubTab] = useState<'edit' | 'preview'>('edit');
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');
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
    getPublishedArticles()
      .then((articles) => {
        if (articles) setAvailableArticles(articles);
      })
      .catch(() => {});
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
      if (e.key === 'Escape' && !saving && !previewModalOpen) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, previewModalOpen, onClose]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function insertFormattingSnippet(snippet: string) {
    setForm((prev) => ({
      ...prev,
      description: prev.description ? `${prev.description}\n${snippet}` : snippet,
    }));
  }

  function autoExtractKeywords() {
    if (!form.description) return;
    const words = form.description
      .toLowerCase()
      .replace(/[^\wáéíóöőúüű\s-]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    const stopWords = new Set([
      'hogy', 'vagy', 'mint', 'mert', 'amely', 'ezek', 'után', 'csak', 'alatt', 'felett',
      'való', 'lehet', 'elleni', 'szerint', 'valamint', 'ezért', 'amelyik', 'neki', 'neve',
    ]);

    const freqMap: Record<string, number> = {};
    words.forEach((w) => {
      if (!stopWords.has(w)) {
        freqMap[w] = (freqMap[w] || 0) + 1;
      }
    });

    const topKeywords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([w]) => w);

    if (topKeywords.length > 0) {
      const currentList = parseList(form.keywords);
      const merged = Array.from(new Set([...currentList, ...topKeywords]));
      update('keywords', merged.join(', '));
    }
  }

  function handleNameChange(value: string) {
    update('name', value);
    if (!slugTouched) update('slug', slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    update('slug', slugify(value));
  }

  function addGalleryUrl() {
    if (!newGalleryInput.trim()) return;
    setGalleryUrls((prev) => [...prev, newGalleryInput.trim()]);
    setNewGalleryInput('');
  }

  function removeGalleryUrl(index: number) {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function addCustomSpec() {
    setCustomSpecs((prev) => [...prev, { key: '', value: '' }]);
  }

  function updateCustomSpec(index: number, key: string, value: string) {
    setCustomSpecs((prev) => prev.map((s, i) => (i === index ? { key, value } : s)));
  }

  function removeCustomSpec(index: number) {
    setCustomSpecs((prev) => prev.filter((_, i) => i !== index));
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
        status: 'approved',
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
        setError('Az ár értéke érvénytelen szám.');
        setSaveStatus('error');
        setSaving(false);
        return;
      }

      // Build consolidated Technical Specs dictionary
      const specsDict: Record<string, string> = {};
      if (form.head_weight.trim()) {
        specsDict['Fej tömege'] = form.head_weight.trim();
      }
      if (form.handle_length.trim()) {
        specsDict['Nyél hossza'] = form.handle_length.trim();
      }
      if (form.handle_material.trim()) {
        specsDict['Nyél anyaga'] = form.handle_material.trim();
      }
      if (form.grip_type.trim()) {
        specsDict['Markolat típusa'] = form.grip_type.trim();
      }
      if (form.finish_types.length > 0) {
        specsDict['Felületkezelés'] = form.finish_types.join(', ');
      }
      if (form.standard_ref.trim()) {
        specsDict['Szabvány'] = form.standard_ref.trim();
      }
      customSpecs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specsDict[s.key.trim()] = s.value.trim();
        }
      });

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
        technical_specs: specsDict,
        specs: {
          gallery_image_urls: galleryUrls.filter(Boolean),
        } as any,
        recommended_products: products
          .map((p) => ({
            id: p.id || undefined,
            partner_id: p.partner_id?.trim() || undefined,
            status: p.status || 'approved',
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
    } catch (err: unknown) {
      console.error('Hiba az eszköz mentésekor:', err);
      let msg = 'A mentés nem sikerült. Próbáld újra.';
      if (err && typeof err === 'object') {
        const pErr = err as { message?: string; details?: string; hint?: string };
        msg = pErr.message || pErr.details || pErr.hint || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div
        style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
        className="border rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div style={{ backgroundColor: cardHighlight }} className="p-2 rounded-xl text-black">
              <Wrench size={20} />
            </div>
            <div>
              <h2 style={{ color: textColor }} className="text-base font-black tracking-tight">
                {isCreate ? 'Új Eszköz / Szerszám Létrehozása' : `Eszköz Szerkesztése: ${form.name || tool?.name}`}
              </h2>
              <p className="text-xs text-gray-400">Részletes, strukturált és SEO-barát termékoldal szerkesztő</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Eye size={15} /> Élő Előnézet
            </button>
            <button onClick={onClose} disabled={saving} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ borderColor: cardBorder, backgroundColor: adjustColorBrightness(cardBg, -2) }} className="flex items-center justify-start sm:justify-between gap-1 px-4 pt-2 border-b overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'basic', label: '1. Alapadatok', icon: Sliders },
            { id: 'specs', label: '2. Műszaki Adatok', icon: Cpu },
            { id: 'content', label: '3. Leírás', icon: FileText },
            { id: 'media', label: '4. Média & Galéria', icon: ImageIcon },
            { id: 'products', label: `5. Gyártók & Tesztek (${products.length})`, icon: Wrench },
            { id: 'seo', label: '6. SEO & Előnézet', icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  color: isActive ? cardHighlight : textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563',
                  borderColor: isActive ? cardHighlight : 'transparent',
                }}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer hover:text-amber-400 ${
                  isActive ? 'bg-amber-500/5' : ''
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <p className="text-red-400 text-xs font-medium">{error}</p>
            </div>
          )}

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle} className={labelClass}>
                    Eszköz Neve <span className="text-red-400">*</span>
                  </label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="pl. Lakatos kalapács (DIN 1041)"
                    autoFocus={isCreate}
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>
                    Slug (URL azonosító) <span className="text-red-400">*</span>
                  </label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="pl. lakatos-kalapacs"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Weboldal hivatkozás: <code className="text-amber-300">epitotudas.hu/?slug={form.slug || 'lakatos-kalapacs'}</code>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label style={labelStyle} className={labelClass}>Fő Kategória</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.type}
                    onChange={(e) => update('type', e.target.value)}
                    placeholder="pl. Kéziszerszámok"
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Alkategória</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.subtype}
                    onChange={(e) => update('subtype', e.target.value)}
                    placeholder="pl. Kalapácsok"
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Ismert Márkák / Gyártók</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.brand}
                    onChange={(e) => update('brand', e.target.value)}
                    placeholder="pl. Stanley / GEDORE / Picard"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label style={labelStyle} className={labelClass}>Irányár / Irányadó ár</label>
                  <input
                    type="number"
                    step="0.01"
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    placeholder="pl. 6500"
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Pénznem</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.currency}
                    onChange={(e) => update('currency', e.target.value)}
                    placeholder="HUF"
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Státusz</label>
                  <select
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.status}
                    onChange={(e) => update('status', e.target.value as Tool['status'])}
                  >
                    <option value="active">Aktív (Publikus és látható)</option>
                    <option value="discontinued">Kivezetve (Archivált szerszám)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>Mely szakmák használják? (vesszővel elválasztva)</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.professions}
                  onChange={(e) => update('professions', e.target.value)}
                  placeholder="Lakatos, Szerelő, Fémszerkezet építő, Gépész"
                />
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>Gyakori felhasználási területek (vesszővel elválasztva)</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.uses}
                  onChange={(e) => update('uses', e.target.value)}
                  placeholder="Fémidomok egyengetése, Csapszegek beütése, Vésők ütése"
                />
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>Főbb jellemzők / Címkék (vesszővel elválasztva)</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.features}
                  onChange={(e) => update('features', e.target.value)}
                  placeholder="DIN 1041, Hikkori nyél, Edzett ütőlap, Rozsdavédő lakk"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu size={16} className="text-amber-400" />
                  <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                    Strukturált Műszaki Specifikációk (Lakatos Kalapács &amp; Szerszámok)
                  </h3>
                </div>
                <p className="text-[11px] text-gray-300">
                  Az itt megadott műszaki paraméterek automatikusan megjelennek a publikus termékoldalon egy jól áttekinthető specifikációs táblázatban.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle} className={labelClass}>Fej tömege (g / kg)</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.head_weight}
                    onChange={(e) => update('head_weight', e.target.value)}
                    placeholder="pl. 500 g vagy 1.0 kg"
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Nyél hossza (mm)</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.handle_length}
                    onChange={(e) => update('handle_length', e.target.value)}
                    placeholder="pl. 320 mm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle} className={labelClass}>Nyél anyaga</label>
                  <select
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.handle_material}
                    onChange={(e) => update('handle_material', e.target.value)}
                  >
                    {HANDLE_MATERIAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Markolat típusa</label>
                  <select
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.grip_type}
                    onChange={(e) => update('grip_type', e.target.value)}
                  >
                    {GRIP_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>DIN / ISO Szabvány Hivatkozás</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.standard_ref}
                  onChange={(e) => update('standard_ref', e.target.value)}
                  placeholder="pl. DIN 1041 / ISO 15601"
                />
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>Felületkezelés &amp; Gyártási technológia (Válassz ki több opciót):</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-gray-900/60 border border-gray-800 rounded-xl">
                  {FINISH_OPTIONS.map((finish) => {
                    const checked = form.finish_types.includes(finish);
                    return (
                      <label key={finish} className="flex items-center gap-2 cursor-pointer text-xs p-1.5 rounded hover:bg-gray-800/80 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              update('finish_types', [...form.finish_types, finish]);
                            } else {
                              update('finish_types', form.finish_types.filter((f) => f !== finish));
                            }
                          }}
                          className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                        />
                        <span style={{ color: checked ? cardHighlight : textColor }}>{finish}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom Specs Builder */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span style={labelStyle} className={labelClass}>További Egyedi Specifikációk ({customSpecs.length})</span>
                  <button
                    type="button"
                    onClick={addCustomSpec}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-amber-300 text-xs font-bold rounded-lg border border-gray-700 transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Specifikáció Hozzáadása
                  </button>
                </div>

                {customSpecs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      style={fieldStyle}
                      className={`${fieldClass} w-1/3`}
                      placeholder="Tulajdonság neve (pl. Fejkeménység)"
                      value={spec.key}
                      onChange={(e) => updateCustomSpec(idx, e.target.value, spec.value)}
                    />
                    <input
                      style={fieldStyle}
                      className={`${fieldClass} flex-1`}
                      placeholder="Érték (pl. HRC 50-58)"
                      value={spec.value}
                      onChange={(e) => updateCustomSpec(idx, spec.key, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomSpec(idx)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LEÍRÁS */}
          {activeTab === 'content' && (
            <div className="space-y-5">

              {/* Formatting Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">Gyors beszúrás:</span>
                    <button
                      type="button"
                      onClick={() => insertFormattingSnippet('## Címsor Neve')}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-amber-400 text-[11px] font-bold rounded-lg border border-gray-700 transition-colors cursor-pointer"
                    >
                      ## Címsor
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingSnippet('**Félkövér szöveg**')}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] font-bold rounded-lg border border-gray-700 transition-colors cursor-pointer"
                    >
                      **Félkövér**
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingSnippet('- Első pont\n- Második pont')}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] font-bold rounded-lg border border-gray-700 transition-colors cursor-pointer"
                    >
                      - Felsorolás
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingSnippet('1. Első lépés\n2. Második lépés')}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] font-bold rounded-lg border border-gray-700 transition-colors cursor-pointer"
                    >
                      1. Számozott
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormattingSnippet('> Fontos szakmai munkavédelmi előírás')}
                      className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-amber-300 text-[11px] font-bold rounded-lg border border-gray-700 transition-colors cursor-pointer"
                    >
                      &gt; Idézet
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {contentSubTab === 'preview' && (
                      <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800 mr-2">
                        <button
                          type="button"
                          onClick={() => setDescriptionPreviewDevice('desktop')}
                          className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                            descriptionPreviewDevice === 'desktop' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <Monitor size={12} /> Asztali
                        </button>
                        <button
                          type="button"
                          onClick={() => setDescriptionPreviewDevice('mobile')}
                          className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                            descriptionPreviewDevice === 'mobile' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <Smartphone size={12} /> Mobil (375px)
                        </button>
                      </div>
                    )}

                    <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800">
                      <button
                        type="button"
                        onClick={() => setContentSubTab('edit')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${
                          contentSubTab === 'edit' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Szerkesztés
                      </button>
                      <button
                        type="button"
                        onClick={() => setContentSubTab('preview')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${
                          contentSubTab === 'preview' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Formázott Előnézet
                      </button>
                    </div>
                  </div>
                </div>

                {contentSubTab === 'edit' ? (
                  <textarea
                    style={fieldStyle}
                    className={`${fieldClass} font-mono text-xs leading-relaxed`}
                    rows={12}
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Írd ide a leírást. Több bekezdést, sortörést vagy Markdown elemeket (## Címsor, - Felsorolás, **Félkövér**) egyaránt megadhatsz..."
                  />
                ) : (
                  <div className={`p-4 bg-gray-950 border border-gray-800 rounded-xl min-h-[280px] transition-all ${
                    descriptionPreviewDevice === 'mobile' ? 'max-w-[375px] mx-auto border-4 border-gray-800 rounded-[32px] shadow-2xl p-5 relative' : ''
                  }`}>
                    {descriptionPreviewDevice === 'mobile' && (
                      <div className="w-24 h-3 bg-gray-800 rounded-b-lg mx-auto mb-4 -mt-2"></div>
                    )}
                    <FormattedText
                      content={form.description || '*Még nincs leírás megadva.*'}
                      paragraphClassName="text-gray-200 text-xs leading-relaxed mb-3"
                      headingClassName="text-sm font-bold text-amber-400 mt-4 mb-2"
                      strongClassName="font-bold text-amber-300"
                    />
                  </div>
                )}
              </div>

              {/* Buying Guide */}
              <div>
                <label style={labelStyle} className={labelClass}>Vásárlási Tanácsadó / Mire figyeljünk kiválasztáskor? (soronként egy tanács)</label>
                <textarea
                  style={fieldStyle}
                  className={`${fieldClass} resize-y font-mono`}
                  rows={3}
                  value={form.buying_guide}
                  onChange={(e) => update('buying_guide', e.target.value)}
                  placeholder="Válassz DIN 1041 szabvány szerinti fejet&#10;Reszketéscsillapító hikkori vagy üvegszálas nyelet keresd&#10;Melléütés-védő acélhüvelyes kivitel megnöveli az élettartamot"
                />
              </div>

              {/* Common Mistakes */}
              <div>
                <label style={labelStyle} className={labelClass}>Gyakori Hibák és Tévedések Használat Közben (soronként egy hiba)</label>
                <textarea
                  style={fieldStyle}
                  className={`${fieldClass} resize-y font-mono`}
                  rows={3}
                  value={form.common_mistakes}
                  onChange={(e) => update('common_mistakes', e.target.value)}
                  placeholder="Lötyögő vagy repedt nyéllel végzett munka (balesetveszély)&#10;Védőszemüveg elhagyása a fémforgácsok ellen&#10;Helytelen súlyválasztás a feladathoz"
                />
              </div>
            </div>
          )}

          {/* TAB 4: MEDIA & GALLERY */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div>
                <label style={labelStyle} className={labelClass}>Fő Termékkép URL</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.image_url}
                  onChange={(e) => update('image_url', e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {form.image_url && (
                  <div className="mt-2.5 p-2 bg-gray-900 border border-gray-800 rounded-xl max-w-xs">
                    <img src={form.image_url} alt="Fő kép előnézet" className="w-full h-36 object-contain rounded-lg bg-black/40" />
                  </div>
                )}
              </div>

              {/* Gallery Image Manager */}
              <div className="pt-4 border-t border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span style={labelStyle} className={labelClass}>Termék Képgaléria ({galleryUrls.length} kép)</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={newGalleryInput}
                    onChange={(e) => setNewGalleryInput(e.target.value)}
                    placeholder="https://... további képek URL-je"
                  />
                  <button
                    type="button"
                    onClick={addGalleryUrl}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg shrink-0 transition-colors cursor-pointer"
                  >
                    + Hozzáadás
                  </button>
                </div>

                {galleryUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {galleryUrls.map((url, idx) => (
                      <div key={idx} className="relative group bg-gray-900 border border-gray-800 rounded-xl p-2 flex flex-col items-center">
                        <img src={url} alt={`Galéria kép #${idx + 1}`} className="w-full h-24 object-contain rounded-lg bg-black/50" />
                        <button
                          type="button"
                          onClick={() => removeGalleryUrl(idx)}
                          className="absolute top-3 right-3 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg opacity-90 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Törlés"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>Fő Eszközvideó URL (YouTube / Vimeo / Beágyazó link)</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.video_url}
                  onChange={(e) => update('video_url', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>
          )}

          {/* TAB 5: MANUFACTURER PRODUCTS & TESTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div>
                  <h4 style={{ color: cardHighlight }} className="text-xs font-black uppercase tracking-wider">
                    Gyártói Termékek &amp; ÉpítőTudás Tesztek ({products.length})
                  </h4>
                  <p className="text-[11px] text-gray-400">Rögzíts konkrét piaci márkájú kalapácsokat, bolti linkeket és saját labor teszteket</p>
                </div>
                <button
                  type="button"
                  onClick={addProduct}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg hover:opacity-90 transition-colors cursor-pointer shadow-md"
                >
                  <Plus size={14} /> + Új Gyártói Termék
                </button>
              </div>

              {products.length === 0 ? (
                <div className="p-8 text-center bg-gray-900/40 border border-dashed border-gray-800 rounded-xl space-y-2">
                  <Wrench size={24} className="mx-auto text-gray-500" />
                  <p className="text-xs text-gray-400 italic">Még nincsenek konkrét ajánlott gyártói termékek rögzítve ehhez az eszközhöz.</p>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Első Termék Hozzáadása
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((prod, idx) => (
                    <div
                      key={idx}
                      style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                      className="border rounded-xl p-4 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-700/50">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          Gyártói Termék {prod.name ? `– ${prod.name}` : ''}
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
                          <label style={labelStyle} className={labelClass}>Termék Neve *</label>
                          <input
                            style={fieldStyle}
                            className={fieldClass}
                            value={prod.name || ''}
                            onChange={(e) => updateProduct(idx, { name: e.target.value })}
                            placeholder="pl. GEDORE Lakatos kalapács 500g (Hikkori nyéllel)"
                          />
                        </div>
                        <div>
                          <label style={labelStyle} className={labelClass}>Gyártó / Márka *</label>
                          <input
                            style={fieldStyle}
                            className={fieldClass}
                            value={prod.brand || ''}
                            onChange={(e) => updateProduct(idx, { brand: e.target.value })}
                            placeholder="pl. GEDORE"
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle} className={labelClass}>Rövid Leírás</label>
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
                          <label style={labelStyle} className={labelClass}>Termék Videó URL</label>
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
                          <label style={labelStyle} className={labelClass}>Gyártói Hivatalos Link</label>
                          <input
                            style={fieldStyle}
                            className={fieldClass}
                            value={prod.product_url || ''}
                            onChange={(e) => updateProduct(idx, { product_url: e.target.value })}
                            placeholder="https://gedore.com/..."
                          />
                        </div>
                        <div>
                          <label style={labelStyle} className={labelClass}>Vásárlási / Webshop Link</label>
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
                          <label style={labelStyle} className={labelClass}>Bolti Ár</label>
                          <input
                            type="number"
                            style={fieldStyle}
                            className={fieldClass}
                            value={prod.price != null ? String(prod.price) : ''}
                            onChange={(e) => updateProduct(idx, { price: e.target.value ? Number(e.target.value) : null })}
                            placeholder="pl. 6490"
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
                        <label style={labelStyle} className={labelClass}>Főbb Jellemzők (vesszővel elválasztva)</label>
                        <input
                          style={fieldStyle}
                          className={fieldClass}
                          value={Array.isArray(prod.features) ? prod.features.join(', ') : prod.features || ''}
                          onChange={(e) => updateProduct(idx, { features: parseList(e.target.value) })}
                          placeholder="DIN 1041, ROTBAND-PLUS nyélrögzítés, Hikkori fa"
                        />
                      </div>

                      {/* Related Articles Picker */}
                      <div className="space-y-2 pt-2 border-t border-gray-700/50">
                        <label style={labelStyle} className={labelClass}>
                          Kapcsolódó ÉpítőTudás Cikkek ({prod.related_article_ids?.length || 0})
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

                      {/* Badges and Test Details */}
                      <div className="space-y-2 pt-2 border-t border-gray-700/50">
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold" style={{ color: textColor }}>
                            <input
                              type="checkbox"
                              checked={Boolean(prod.is_featured)}
                              onChange={(e) => updateProduct(idx, { is_featured: e.target.checked })}
                              className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                            />
                            Kiemelt Termék
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold" style={{ color: textColor }}>
                            <input
                              type="checkbox"
                              checked={Boolean(prod.is_tested)}
                              onChange={(e) => updateProduct(idx, { is_tested: e.target.checked })}
                              className="w-4 h-4 rounded cursor-pointer accent-emerald-500"
                            />
                            ÉpítőTudás által tesztelve
                          </label>

                          {prod.is_tested && (
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold" style={{ color: textColor }}>
                              <input
                                type="checkbox"
                                checked={Boolean(prod.test_provided_by_manufacturer)}
                                onChange={(e) => updateProduct(idx, { test_provided_by_manufacturer: e.target.checked })}
                                className="w-4 h-4 rounded cursor-pointer accent-emerald-500"
                              />
                              Gyártó által biztosított teszttermék
                            </label>
                          )}
                        </div>

                        {prod.is_tested && (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-3 mt-2">
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider block">
                              ÉpítőTudás Saját Labor Teszt Részletei
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
                                <label style={labelStyle} className={labelClass}>Időtartam</label>
                                <input
                                  style={fieldStyle}
                                  className={fieldClass}
                                  value={prod.test_period || ''}
                                  onChange={(e) => updateProduct(idx, { test_period: e.target.value })}
                                  placeholder="pl. 3 hónap folyamatos fémipari teszt"
                                />
                              </div>
                              <div>
                                <label style={labelStyle} className={labelClass}>Környezet</label>
                                <input
                                  style={fieldStyle}
                                  className={fieldClass}
                                  value={prod.test_environment || ''}
                                  onChange={(e) => updateProduct(idx, { test_environment: e.target.value })}
                                  placeholder="pl. Lakatosműhely és helyszíni szerelés"
                                />
                              </div>
                            </div>

                            <div>
                              <label style={labelStyle} className={labelClass}>Saját Tapasztalat / Értékelés</label>
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
                                  placeholder="Biztonsági hüvely, Kiváló csuklókímélő egyensúly"
                                />
                              </div>
                              <div>
                                <label style={labelStyle} className={labelClass}>Kritikák / Megjegyzések (vesszővel)</label>
                                <input
                                  style={fieldStyle}
                                  className={fieldClass}
                                  value={Array.isArray(prod.test_cons) ? prod.test_cons.join(', ') : prod.test_cons || ''}
                                  onChange={(e) => updateProduct(idx, { test_cons: parseList(e.target.value) })}
                                  placeholder="Magasabb árkategória"
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
          )}

          {/* TAB 6: SEO & GOOGLE PREVIEW */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-amber-400" />
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Google SERP Keresőmotor Előnézet
                    </span>
                  </div>

                  <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                    <button
                      type="button"
                      onClick={() => setSerpDevice('desktop')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                        serpDevice === 'desktop' ? 'bg-amber-500 text-black' : 'text-gray-400'
                      }`}
                    >
                      Asztali (Desktop)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpDevice('mobile')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                        serpDevice === 'mobile' ? 'bg-amber-500 text-black' : 'text-gray-400'
                      }`}
                    >
                      Mobil (Mobile)
                    </button>
                  </div>
                </div>

                {/* Simulated Google Snippet Card */}
                <div className={`p-4 bg-white text-black font-sans rounded-xl shadow-inner ${serpDevice === 'mobile' ? 'max-w-xs mx-auto' : 'w-full'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-[#202124] mb-1">
                    <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-black text-black">É</div>
                    <span className="truncate">https://epitotudas.hu › eszkozok › {form.slug || 'lakatos-kalapacs'}</span>
                  </div>
                  <h3 className="text-base font-normal text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1">
                    {form.seo_title || `${form.name || 'Lakatos kalapács'} Műszaki Paraméterek & Vásárlási Útmutató | ÉpítőTudás`}
                  </h3>
                  <p className="text-xs text-[#4d5156] leading-relaxed mt-1 line-clamp-2">
                    {form.seo_description ||
                      (form.description
                        ? form.description.substring(0, 155) + '...'
                        : 'Minden amit a lakatos kalapácsról tudni érdemes: DIN 1041 szabvány, fej tömege, hikkori fa nyél, használat és tesztelt ajánlott termékek.')}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label style={labelStyle} className={labelClass}>SEO Cím (Title tag)</label>
                  <span className={`text-[10px] font-bold ${form.seo_title.length > 60 ? 'text-amber-400' : 'text-gray-400'}`}>
                    {form.seo_title.length} / 60 karakter
                  </span>
                </div>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.seo_title}
                  onChange={(e) => update('seo_title', e.target.value)}
                  placeholder="pl. Lakatos kalapács (DIN 1041) – Műszaki Adatok & Tesztek | ÉpítőTudás"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label style={labelStyle} className={labelClass}>SEO Meta Leírás (Description)</label>
                  <span className={`text-[10px] font-bold ${form.seo_description.length > 160 ? 'text-red-400' : 'text-gray-400'}`}>
                    {form.seo_description.length} / 160 karakter
                  </span>
                </div>
                <textarea
                  style={fieldStyle}
                  className={`${fieldClass} resize-none`}
                  rows={3}
                  value={form.seo_description}
                  onChange={(e) => update('seo_description', e.target.value)}
                  placeholder="Részletes útmutató a lakatos kalapács kiválasztásához és használatához. Műszaki adatok, DIN 1041 szabvány, hikkori nyél és tesztelt termékek."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label style={labelStyle} className={labelClass}>Keresési Kulcsszavak (vesszővel elválasztva)</label>
                  <button
                    type="button"
                    onClick={autoExtractKeywords}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-bold cursor-pointer"
                  >
                    <Sparkles size={12} /> Automatikus Kulcsszó Kinyerés
                  </button>
                </div>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.keywords}
                  onChange={(e) => update('keywords', e.target.value)}
                  placeholder="lakatos kalapács, din 1041, hikkori nyél, fémipar, kalapács fej"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle} className={labelClass}>Canonical URL</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.canonical_url}
                    onChange={(e) => update('canonical_url', e.target.value)}
                    placeholder="https://epitotudas.hu/?slug=lakatos-kalapacs"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold" style={{ color: textColor }}>
                    <input
                      type="checkbox"
                      id="is_indexable"
                      checked={form.is_indexable}
                      onChange={(e) => update('is_indexable', e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                    />
                    Keresőmotorok által indexelhető oldal (Indexable)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t sticky bottom-0 z-10 -mx-6 -mb-6 px-6 pb-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 font-bold text-xs rounded-xl border border-gray-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Eye size={14} /> Előnézet
              </button>
            </div>

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
                  Sikeresen mentve.
                </span>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{ borderColor: cardBorder, color: textColor }}
                className="px-4 py-2 border font-bold text-xs rounded-xl hover:opacity-80 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Mégse
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: cardHighlight, color: '#000000' }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-lg"
              >
                <Save size={15} /> {saving ? 'Mentés...' : isCreate ? 'Létrehozás' : 'Mentés'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* LIVE TOOL PAGE PREVIEW MODAL OVERLAY */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className={`bg-gray-950 border border-amber-500/30 rounded-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-gray-100 transition-all ${
            livePreviewDevice === 'mobile' ? 'max-w-md' : 'max-w-4xl'
          }`}>
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-amber-400" />
                <h3 className="text-sm font-black text-white">Publikus Termékoldal Élő Előnézete</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                  <button
                    type="button"
                    onClick={() => setLivePreviewDevice('desktop')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
                      livePreviewDevice === 'desktop' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Monitor size={14} /> Asztali Nézet
                  </button>
                  <button
                    type="button"
                    onClick={() => setLivePreviewDevice('mobile')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
                      livePreviewDevice === 'mobile' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={14} /> Mobil Nézet (375px)
                  </button>
                </div>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-3 py-1 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 cursor-pointer"
                >
                  Bezárás
                </button>
              </div>
            </div>

            <div className={`overflow-y-auto p-6 space-y-6 text-xs leading-relaxed ${
              livePreviewDevice === 'mobile'
                ? 'max-w-[375px] mx-auto border-8 border-gray-800 rounded-[36px] bg-gray-950 my-4 shadow-2xl relative p-5 max-h-[75vh]'
                : ''
            }`}>
              {livePreviewDevice === 'mobile' && (
                <div className="w-24 h-3 bg-gray-800 rounded-b-lg mx-auto mb-4 -mt-2"></div>
              )}

              <div className="space-y-2 border-b border-gray-800 pb-4">
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {form.type} / {form.subtype || 'Szerszám'}
                </span>
                <h1 className="text-xl font-black text-amber-400">{form.name || 'Névtelen eszköz'}</h1>
                {form.brand && <p className="text-xs text-gray-400">Ajánlott gyártók: {form.brand}</p>}
              </div>

              {/* Specs Table Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">Műszaki Adatok</h4>
                <div className={`grid gap-2 bg-gray-900 border border-gray-800 rounded-xl p-3 text-xs ${
                  livePreviewDevice === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'
                }`}>
                  {form.head_weight && (
                    <div>
                      <span className="text-gray-400">Fej tömege:</span> <span className="font-bold text-white">{form.head_weight}</span>
                    </div>
                  )}
                  {form.handle_length && (
                    <div>
                      <span className="text-gray-400">Nyél hossza:</span> <span className="font-bold text-white">{form.handle_length}</span>
                    </div>
                  )}
                  {form.handle_material && (
                    <div>
                      <span className="text-gray-400">Nyél anyaga:</span> <span className="font-bold text-white">{form.handle_material}</span>
                    </div>
                  )}
                  {form.grip_type && (
                    <div>
                      <span className="text-gray-400">Markolat:</span> <span className="font-bold text-white">{form.grip_type}</span>
                    </div>
                  )}
                  {form.standard_ref && (
                    <div>
                      <span className="text-gray-400">Szabvány:</span> <span className="font-bold text-white">{form.standard_ref}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Formatted Markdown Content Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">Részletes Szerszómbemutató</h4>
                <div className="p-4 bg-gray-900/60 border border-gray-800 rounded-xl">
                  <FormattedText
                    content={form.description || 'Nincs leírás.'}
                    paragraphClassName="text-gray-200 text-xs sm:text-sm leading-relaxed mb-3"
                    headingClassName="text-sm font-bold text-amber-400 mt-4 mb-2"
                    strongClassName="font-bold text-amber-300"
                  />
                </div>
              </div>

              {/* Recommended Products Preview */}
              {products.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">Gyártói Termékek &amp; Tesztek ({products.length})</h4>
                  <div className="space-y-3">
                    {products.map((p, i) => (
                      <div key={i} className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1">
                        <span className="font-bold text-amber-400">{p.name}</span>
                        {p.brand && <span className="text-gray-400 ml-2">({p.brand})</span>}
                        {p.price != null && <p className="text-xs font-bold text-emerald-400">{p.price} {p.currency || 'HUF'}</p>}
                        {p.description && <p className="text-xs text-gray-300">{p.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
