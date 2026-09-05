import { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  AlertCircle,
  Image as ImageIcon,
  Palette,
  Layout,
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
  Search,
  Sparkles,
  Link,
  Check,
  Move,
  ZoomIn,
  RotateCcw,
  Target,
  Upload,
} from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Category } from '../lib/supabase';
import { createCategory, updateCategory } from '../services/categoryService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

interface EditCategoryModalProps {
  category: Category | null; // null = create mode
  onClose: () => void;
  onSaved: (saved: Category) => void;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  color: string;
  image_url: string;
  banner_url: string;
  image_fit: 'cover' | 'contain' | 'fill';
  pos_x: number; // 0% - 100%
  pos_y: number; // 0% - 100%
  image_zoom: number; // 50% - 250%
  featured: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
}

const COLOR_PRESETS = [
  { name: 'Arany sárga', hex: '#FFC400' },
  { name: 'Királykék', hex: '#3B82F6' },
  { name: 'Cian kék', hex: '#06B6D4' },
  { name: 'Borostyán', hex: '#F59E0B' },
  { name: 'Rózsaszín', hex: '#EC4899' },
  { name: 'Smaragdzöld', hex: '#10B981' },
  { name: 'Lila', hex: '#8B5CF6' },
  { name: 'Piros', hex: '#EF4444' },
  { name: 'Indigó', hex: '#6366F1' },
  { name: 'Teal zöld', hex: '#14B8A6' },
];

const AVAILABLE_ICONS = [
  { name: 'Layers', label: 'Rétegek / Szerkezet', Icon: Layers },
  { name: 'Thermometer', label: 'Hőmérséklet / Szigetelés', Icon: Thermometer },
  { name: 'Droplets', label: 'Cseppek / Gépészet', Icon: Droplets },
  { name: 'Zap', label: 'Villám / Villanyszerelés', Icon: Zap },
  { name: 'Paintbrush', label: 'Ecset / Burkolás', Icon: Paintbrush },
  { name: 'Wrench', label: 'Kulcs / Szerszám', Icon: Wrench },
  { name: 'Hammer', label: 'Kalapács / Kivitelezés', Icon: Hammer },
  { name: 'Building', label: 'Épület / Szerkezet', Icon: Building },
  { name: 'Home', label: 'Ház / Otthon', Icon: Home },
  { name: 'Shield', label: 'Pajzs / Védelem', Icon: Shield },
  { name: 'HardHat', label: 'Munkavédelem', Icon: HardHat },
  { name: 'Truck', label: 'Gép / Szállítás', Icon: Truck },
  { name: 'Ruler', label: 'Vonalzó / Mérés', Icon: Ruler },
  { name: 'Compass', label: 'Tervezés / Iránytű', Icon: Compass },
  { name: 'Grid', label: 'Háló / Csempézés', Icon: Grid },
  { name: 'Settings', label: 'Beállítások / Gépészet', Icon: Settings },
];

const SAMPLE_IMAGES = [
  {
    title: 'Szerkezetépítés',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Szigetelés',
    url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Épületgépészet',
    url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Villanyszerelés',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Burkolás',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Szerszámok',
    url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop',
  },
];

function parsePosition(posStr?: string | null): { x: number; y: number } {
  if (!posStr) return { x: 50, y: 50 };
  if (posStr === 'top') return { x: 50, y: 0 };
  if (posStr === 'bottom') return { x: 50, y: 100 };
  if (posStr === 'left') return { x: 0, y: 50 };
  if (posStr === 'right') return { x: 100, y: 50 };
  if (posStr === 'center') return { x: 50, y: 50 };

  const match = posStr.match(/(\d+)%\s+(\d+)%/);
  if (match) {
    return { x: parseInt(match[1], 10), y: parseInt(match[2], 10) };
  }
  return { x: 50, y: 50 };
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  icon_name: 'Layers',
  color: '#FFC400',
  image_url: '',
  banner_url: '',
  image_fit: 'cover',
  pos_x: 50,
  pos_y: 50,
  image_zoom: 100,
  featured: false,
  sort_order: 1,
  seo_title: '',
  seo_description: '',
};

function formFromCategory(category: Category): FormState {
  const { x, y } = parsePosition(category.image_position);
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    icon_name: category.icon_name ?? 'Layers',
    color: category.color ?? '#FFC400',
    image_url: category.image_url ?? '',
    banner_url: category.banner_url ?? '',
    image_fit: (category.image_fit as FormState['image_fit']) || 'cover',
    pos_x: x,
    pos_y: y,
    image_zoom: category.image_zoom ?? 100,
    featured: Boolean(category.featured),
    sort_order: category.sort_order ?? 1,
    seo_title: category.seo_title ?? '',
    seo_description: category.seo_description ?? '',
  };
}

function isValidUrl(url: string): boolean {
  if (!url.trim()) return true;
  if (url.trim().startsWith('data:image/')) return true;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function EditCategoryModal({ category, onClose, onSaved }: EditCategoryModalProps) {
  const isCreate = category === null;
  const [form, setForm] = useState<FormState>(() => (category ? formFromCategory(category) : { ...EMPTY_FORM }));
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'style' | 'media' | 'seo'>('general');
  const previewRef = useRef<HTMLDivElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  function handleLocalCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        update('image_url', evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleLocalBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        update('banner_url', evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

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

  // Kattintással történő kézi fókuszpont beállítás a képen
  function handlePreviewClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const clampedX = Math.max(0, Math.min(100, clickX));
    const clampedY = Math.max(0, Math.min(100, clickY));

    setForm((prev) => ({ ...prev, pos_x: clampedX, pos_y: clampedY }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('A kategória neve megadása kötelező.');
      setActiveTab('general');
      return;
    }
    if (!form.slug.trim()) {
      setError('A slug megadása kötelező.');
      setActiveTab('general');
      return;
    }

    if (form.image_url.trim() && !isValidUrl(form.image_url)) {
      setError('A borítókép URL-je érvénytelen (https://... kezdetű link szükséges).');
      setActiveTab('media');
      return;
    }

    if (form.banner_url.trim() && !isValidUrl(form.banner_url)) {
      setError('A banner kép URL-je érvénytelen (https://... kezdetű link szükséges).');
      setActiveTab('media');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        icon_name: form.icon_name.trim() || 'Layers',
        color: form.color.trim() || '#FFC400',
        image_url: form.image_url.trim() || null,
        banner_url: form.banner_url.trim() || null,
        image_fit: form.image_fit,
        image_position: `${form.pos_x}% ${form.pos_y}%`,
        image_zoom: Number(form.image_zoom) || 100,
        featured: form.featured,
        sort_order: Number(form.sort_order) || 1,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
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

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -6);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };
  const fieldClass = 'w-full border rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-bold mb-1.5 uppercase tracking-wide';
  const labelStyle: React.CSSProperties = {
    color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563',
  };

  const SelectedIconComp = AVAILABLE_ICONS.find((i) => i.name === form.icon_name)?.Icon || Layers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Fejléc */}
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner transition-all"
              style={{
                backgroundColor: `${form.color}15`,
                borderColor: `${form.color}40`,
                color: form.color,
              }}
            >
              <SelectedIconComp size={20} />
            </div>
            <div>
              <h2 style={{ color: textColor }} className="text-base font-black">
                {isCreate ? 'Új kategória létrehozása' : `Kategória szerkesztése: ${form.name || ''}`}
              </h2>
              <p className="text-xs text-gray-400">Testreszabhatja a kategória adatait, képeit és megjelenését.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-white rounded-lg disabled:opacity-40 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Fülek */}
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="flex items-center gap-1 px-6 border-b overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-[#FFC400] text-[#FFC400]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layout size={14} /> Alapvető adatok
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'style'
                ? 'border-[#FFC400] text-[#FFC400]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Palette size={14} /> Ikon &amp; Szín
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'media'
                ? 'border-[#FFC400] text-[#FFC400]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ImageIcon size={14} /> Képek &amp; Kézi Beállítás
            {form.image_url && <span className="w-1.5 h-1.5 rounded-full bg-[#FFC400]"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'seo'
                ? 'border-[#FFC400] text-[#FFC400]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Search size={14} /> SEO &amp; Meta
          </button>
        </div>

        {/* Űrlap törzs */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* 1. FÜL: Alapvető adatok */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label style={labelStyle} className={labelClass}>
                  Kategória neve <span className="text-red-400">*</span>
                </label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="pl. Szerkezetépítés"
                  autoFocus={isCreate}
                />
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>
                  Slug (URL azonosító) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-600 font-mono">/kategoria/</span>
                  <input
                    style={fieldStyle}
                    className={`${fieldClass} pl-24 font-mono text-xs`}
                    value={form.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="szerkezetepites"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  A keresőbarát hivatkozás automatikusan képződik a névből.
                </p>
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>Leírás</label>
                <textarea
                  style={fieldStyle}
                  className={`${fieldClass} resize-none`}
                  rows={4}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Részletes kategória leírás, amely megjelenik a kategória oldal tetején és a kártyákon..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label style={labelStyle} className={labelClass}>Megjelenítési sorrend</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.sort_order}
                    onChange={(e) => update('sort_order', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">A kategóriák sorrendje a listákban (kisebb előbb).</p>
                </div>

                <div>
                  <label className={labelClass}>Kiemelt státusz</label>
                  <label className="flex items-center gap-3 p-2.5 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg cursor-pointer hover:border-[#FFC400]/40 transition-colors mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => update('featured', e.target.checked)}
                      className="w-4 h-4 rounded border-[#1E1E1E] bg-[#111] text-[#FFC400] focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <Star size={14} className={form.featured ? 'text-[#FFC400] fill-[#FFC400]' : 'text-gray-500'} />
                      Főoldalon kiemelt
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 2. FÜL: Ikon & Szín */}
          {activeTab === 'style' && (
            <div className="space-y-6">
              {/* Ikon Választó */}
              <div>
                <label className={labelClass}>Válassz ikont</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-2">
                  {AVAILABLE_ICONS.map(({ name, label, Icon }) => {
                    const isSelected = form.icon_name === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => update('icon_name', name)}
                        title={label}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#FFC400]/15 border-[#FFC400] text-[#FFC400] scale-105 shadow-lg'
                            : 'bg-[#0A0A0A] border-[#1E1E1E] text-gray-400 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="text-[10px] font-medium mt-1 truncate w-full text-center opacity-80">
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Szín Választó */}
              <div>
                <label className={labelClass}>Témaszín választó</label>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => update('color', preset.hex)}
                      title={preset.name}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-transform ${
                        form.color.toLowerCase() === preset.hex.toLowerCase()
                          ? 'scale-110 border-white shadow-md'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {form.color.toLowerCase() === preset.hex.toLowerCase() && (
                        <Check size={16} className="text-black font-bold drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-[#1E1E1E] shadow-inner" style={{ backgroundColor: form.color }} />
                  <input
                    type="text"
                    className={`${fieldClass} font-mono w-36 text-xs uppercase`}
                    value={form.color}
                    onChange={(e) => update('color', e.target.value)}
                    placeholder="#FFC400"
                  />
                  <span className="text-xs text-gray-500">Egyedi Hex színkód</span>
                </div>
              </div>

              {/* ÉLŐ KÁRTYA ELŐNÉZET */}
              <div className="p-4 bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#FFC400]" /> Élő kártya előnézet
                  </span>
                </div>

                <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-4 flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 shadow-lg"
                    style={{
                      backgroundColor: `${form.color}20`,
                      borderColor: `${form.color}50`,
                      color: form.color,
                    }}
                  >
                    <SelectedIconComp size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white truncate">{form.name || 'Kategória neve'}</h4>
                      {form.featured && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#FFC400]/20 text-[#FFC400] border border-[#FFC400]/30 rounded-full">
                          Kiemelt
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{form.description || 'Nincs leírás'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. FÜL: Képek & Kézi Beállítás */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Borítókép URL és Helyi Fájl Feltöltés */}
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLocalCoverUpload}
                className="hidden"
              />
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLocalBannerUpload}
                className="hidden"
              />

              <div className="space-y-2">
                <label className={labelClass}>
                  <ImageIcon size={12} className="inline mr-1 text-[#FFC400]" /> Kategória Borítókép (Saját gép vagy URL)
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className={`${fieldClass} font-mono text-xs flex-1`}
                    value={form.image_url}
                    onChange={(e) => update('image_url', e.target.value)}
                    placeholder="Saját kép URL vagy tölts fel egyet saját gépről..."
                  />
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] text-[#FFC400] text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Upload size={14} /> Saját Gép
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Tallózd be a saját képedet a gépedről, vagy illessz be egy képhivatkozást. Megjelenik a kategória kártyákon.
                </p>
              </div>

              {/* KÉZI IGASZÍTÁSI ESZKÖZÖK (KATTINTÁS + SLIDEREK + ZOOM) */}
              <div className="p-4 bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wide flex items-center gap-1.5">
                    <Target size={14} className="text-[#FFC400]" /> Kézi Fókuszpont &amp; Méret Igazítás
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, pos_x: 50, pos_y: 50, image_zoom: 100, image_fit: 'cover' }))}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#FFC400] transition-colors"
                  >
                    <RotateCcw size={12} /> Alaphelyzet
                  </button>
                </div>

                {/* 1. KATTINTHATÓ ÉLŐ FÓKUSZPONT CANVAS */}
                {form.image_url.trim() ? (
                  <div className="space-y-2">
                    <div
                      ref={previewRef}
                      onClick={handlePreviewClick}
                      className="relative rounded-xl overflow-hidden border border-[#1E1E1E] bg-[#050505] h-48 cursor-crosshair group shadow-inner select-none"
                      title="Kattints a képre a fókuszpont pontos beállításához!"
                    >
                      <img
                        src={form.image_url}
                        alt="Kézi igazítás előnézet"
                        className="w-full h-48 pointer-events-none transition-all duration-150"
                        style={{
                          objectFit: form.image_fit,
                          objectPosition: `${form.pos_x}% ${form.pos_y}%`,
                          transform: `scale(${form.image_zoom / 100})`,
                          transformOrigin: `${form.pos_x}% ${form.pos_y}%`,
                        }}
                      />

                      {/* CÉLKERESZT / RETICLE KISZÁMÍTÁSA */}
                      <div
                        className="absolute w-7 h-7 -ml-3.5 -mt-3.5 border-2 border-[#FFC400] rounded-full pointer-events-none shadow-lg flex items-center justify-center bg-black/40 backdrop-blur-xs transition-all duration-100"
                        style={{ left: `${form.pos_x}%`, top: `${form.pos_y}%` }}
                      >
                        <div className="w-1.5 h-1.5 bg-[#FFC400] rounded-full" />
                      </div>

                      {/* Útmutató szöveg a képen */}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/75 backdrop-blur text-[10px] font-bold text-gray-300 rounded-md border border-white/10 flex items-center gap-1">
                        <Move size={11} className="text-[#FFC400]" /> Kattints a képre a fókusz áthelyezéséhez!
                      </div>

                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur text-[10px] font-mono text-[#FFC400] rounded-md font-bold border border-white/10">
                        X: {form.pos_x}% | Y: {form.pos_y}% | Zoom: {form.image_zoom}%
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 2. CSÚSZKÁK (SLIDERS) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Vízszintes X slider */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">Vízszintes (X)</label>
                      <span className="font-mono text-[11px] text-[#FFC400] font-bold">{form.pos_x}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.pos_x}
                      onChange={(e) => update('pos_x', parseInt(e.target.value) || 0)}
                      className="w-full accent-[#FFC400] cursor-pointer bg-[#111]"
                    />
                    <div className="flex justify-between text-[9px] text-gray-600">
                      <span>Bal szél</span>
                      <span>Közép</span>
                      <span>Jobb szél</span>
                    </div>
                  </div>

                  {/* Függőleges Y slider */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase">Függőleges (Y)</label>
                      <span className="font-mono text-[11px] text-[#FFC400] font-bold">{form.pos_y}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={form.pos_y}
                      onChange={(e) => update('pos_y', parseInt(e.target.value) || 0)}
                      className="w-full accent-[#FFC400] cursor-pointer bg-[#111]"
                    />
                    <div className="flex justify-between text-[9px] text-gray-600">
                      <span>Teteje</span>
                      <span>Közép</span>
                      <span>Alja</span>
                    </div>
                  </div>

                  {/* Zoom Nagyítás slider */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <label className="text-[11px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <ZoomIn size={11} /> Nagyítás (Zoom)
                      </label>
                      <span className="font-mono text-[11px] text-[#FFC400] font-bold">{form.image_zoom}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={220}
                      step={5}
                      value={form.image_zoom}
                      onChange={(e) => update('image_zoom', parseInt(e.target.value) || 100)}
                      className="w-full accent-[#FFC400] cursor-pointer bg-[#111]"
                    />
                    <div className="flex justify-between text-[9px] text-gray-600">
                      <span>50%</span>
                      <span>100%</span>
                      <span>220%</span>
                    </div>
                  </div>
                </div>

                {/* 3. ILLERKEDÉSI MÓD SELECTOR */}
                <div className="pt-2 flex items-center justify-between gap-4 border-t border-[#1A1A1A]">
                  <span className="text-xs text-gray-400 font-bold uppercase">Keret Kitöltési Mód:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => update('image_fit', 'cover')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        form.image_fit === 'cover'
                          ? 'bg-[#FFC400] text-black border-[#FFC400]'
                          : 'bg-[#111] text-gray-400 border-[#1E1E1E] hover:text-white'
                      }`}
                    >
                      🖼️ Kitöltés (Cover)
                    </button>

                    <button
                      type="button"
                      onClick={() => update('image_fit', 'contain')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        form.image_fit === 'contain'
                          ? 'bg-[#FFC400] text-black border-[#FFC400]'
                          : 'bg-[#111] text-gray-400 border-[#1E1E1E] hover:text-white'
                      }`}
                    >
                      📐 Teljes kép (Contain)
                    </button>
                  </div>
                </div>
              </div>

              {/* Minta képek válogató */}
              <div className="p-4 bg-[#0A0A0A] border border-[#1E1E1E] rounded-xl space-y-3">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#FFC400]" /> Építőipari Minta Képek (1-kattintásos beillesztés)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {SAMPLE_IMAGES.map((sample) => (
                    <button
                      key={sample.title}
                      type="button"
                      onClick={() => update('image_url', sample.url)}
                      className="group relative rounded-lg overflow-hidden border border-[#1E1E1E] hover:border-[#FFC400] transition-all text-left"
                    >
                      <img src={sample.url} alt={sample.title} className="w-full h-20 object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/60 flex items-end p-2">
                        <span className="text-[10px] font-bold text-white group-hover:text-[#FFC400] truncate">
                          {sample.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner / Hero Háttérkép URL és Helyi Fájl Feltöltés */}
              <div className="space-y-2">
                <label className={labelClass}>
                  <Link size={12} className="inline mr-1 text-[#FFC400]" /> Fejléc Banner / Hero Háttérkép (Saját gép vagy URL)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className={`${fieldClass} font-mono text-xs flex-1`}
                    value={form.banner_url}
                    onChange={(e) => update('banner_url', e.target.value)}
                    placeholder="https://... vagy tölts fel háttérképet saját gépről..."
                  />
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] text-[#FFC400] text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Upload size={14} /> Saját Gép
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  Nagy felbontású háttérkép a kategória oldal tetején található bannerhez (Ajánlott: 1920x600px).
                </p>

                {form.banner_url.trim() && isValidUrl(form.banner_url) && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-[#1E1E1E] bg-black max-h-36">
                    <img
                      src={form.banner_url}
                      alt="Banner előnézet"
                      className="w-full h-36"
                      style={{
                        objectFit: form.image_fit,
                        objectPosition: `${form.pos_x}% ${form.pos_y}%`,
                        transform: `scale(${form.image_zoom / 100})`,
                        transformOrigin: `${form.pos_x}% ${form.pos_y}%`,
                      }}
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur text-[10px] font-bold text-emerald-400 rounded-md">
                      Banner Előnézet
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. FÜL: SEO & Meta */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label style={labelStyle} className={labelClass}>SEO Cím (Title Tag)</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.seo_title}
                  onChange={(e) => update('seo_title', e.target.value)}
                  placeholder={form.name ? `${form.name} – Cikkek | Építőtudás` : 'Kategória SEO Cím...'}
                />
                <p className="text-[11px] text-gray-400 mt-1">Keresőmotorokban megjelenő egyedi oldalcím.</p>
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>SEO Meta Leírás (Description Tag)</label>
                <textarea
                  style={fieldStyle}
                  className={`${fieldClass} resize-none`}
                  rows={4}
                  value={form.seo_description}
                  onChange={(e) => update('seo_description', e.target.value)}
                  placeholder="Google keresőben megjelenő rövid összefoglaló (max. 160 karakter)..."
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Google keresési snippet ajánlott hossza: 120-160 karakter.</span>
                  <span className={form.seo_description.length > 160 ? 'text-amber-400 font-bold' : ''}>
                    {form.seo_description.length} karakter
                  </span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Lábjegyzet gombok */}
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="flex items-center justify-between px-6 py-4 border-t sticky bottom-0 z-10">
          <span className="text-xs text-gray-400">
            {isCreate ? 'Új kategória mentése' : 'Módosítások mentése'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              Mégse
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              style={{ backgroundColor: cardHighlight, color: '#000000' }}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black rounded-xl hover:opacity-90 disabled:opacity-60 transition-colors shadow-md cursor-pointer"
            >
              <Save size={16} /> {saving ? 'Mentés...' : isCreate ? 'Létrehozás' : 'Mentés'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
