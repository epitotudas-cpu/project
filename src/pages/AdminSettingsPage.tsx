import { useState } from 'react';
import {
  Palette,
  Compass,
  Megaphone,
  ShieldAlert,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Info,
  AlertCircle,
  Eye,
  EyeOff,
  Edit3,
  ChevronRight,
  Calculator,
  Shield,
  Target,
  Share2,
  AlertTriangle,
  Smartphone,
  AppWindow,
  FileCode,
} from 'lucide-react';
import {
  getSiteSettings,
  saveSiteSettings,
  applySiteSettings,
  adjustColorBrightness,
  getContrastTextColor,
  useSiteSettings,
  generateManifestJson,
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from '../services/siteSettingsService';
import {
  getImpressumData,
  saveImpressumData,
  DEFAULT_IMPRESSUM_DATA,
  type ImpressumData,
} from '../services/impressumService';
import {
  getHeroState,
  saveHeroState,
  type HeroState,
  type HeroImage,
  type HeroRotationMode,
  DEFAULT_HERO_IMAGES,
  DEFAULT_HERO_CONFIG,
} from '../services/heroImageService';
import {
  useNavigationItems,
  saveNavItems,
  DEFAULT_NAV_ITEMS,
  type MenuItem,
} from '../services/navigationService';
import {
  getCalculatorConfig,
  saveCalculatorConfig,
  DEFAULT_CALCULATOR_CONFIG,
  type CalculatorConfig,
} from '../services/calculatorConfigService';
import {
  getLegalDocs,
  saveLegalDocs,
  DEFAULT_LEGAL_DOCS,
  type LegalDocsData,
} from '../services/legalDocService';
import {
  getAboutSettings,
  saveAboutSettings,
  DEFAULT_ABOUT_SETTINGS,
  type AboutSettings,
} from '../services/aboutService';

interface AdminSettingsPageProps {
  onNavigate?: (page: string) => void;
}

const PRESET_PALETTES = [
  { name: 'Építkezős Klasszikus (Arany/Sárga)', primary: '#FFC400', previewBg: '#FFC400' },
  { name: 'Ipari Kék (Professional Blue)', primary: '#2563EB', previewBg: '#2563EB' },
  { name: 'Sötét Építész (Modern Architecture)', primary: '#0B0F19', previewBg: '#3B82F6' },
  { name: 'Munkavédelmi Smaragdzöld', primary: '#059669', previewBg: '#059669' },
];

const PRESET_ADMIN_ACCENTS = [
  { name: 'Építkezős Arany', color: '#FFC400' },
  { name: 'Elektromos Kék', color: '#3B82F6' },
  { name: 'Munkavédelmi Zöld', color: '#10B981' },
  { name: 'Ibolya Lila', color: '#8B5CF6' },
  { name: 'Korall Piros', color: '#EF4444' },
  { name: 'Szakmai Narancs', color: '#F97316' },
];

const PRESET_ADMIN_BACKGROUNDS = [
  { name: 'Sötét Fekete (Klasszikus)', color: '#0A0A0A' },
  { name: 'Éjféli Mélykék', color: '#0F172A' },
  { name: 'Grafitszürke', color: '#18181B' },
  { name: 'Sötét Smaragdzöld', color: '#064E3B' },
  { name: 'Csokoládé Barna', color: '#1C1917' },
];

const PRESET_ADMIN_CARD_BGS = [
  { name: 'Grafitsötét (Klasszikus)', color: '#111111' },
  { name: 'Sötét Fekete', color: '#0D0D0D' },
  { name: 'Éjféli Kék', color: '#1E293B' },
  { name: 'Sötét Szürke', color: '#1F2937' },
  { name: 'Mély Smaragdzöld', color: '#064E3B' },
  { name: 'Csokoládé Barna', color: '#262626' },
];

const PRESET_ADMIN_CARD_HIGHLIGHTS = [
  { name: 'Arany Sárga', color: '#FFC400' },
  { name: 'Elektromos Kék', color: '#3B82F6' },
  { name: 'Smaragdzöld', color: '#10B981' },
  { name: 'Ibolya Lila', color: '#8B5CF6' },
  { name: 'Korall Piros', color: '#EF4444' },
  { name: 'Szakmai Narancs', color: '#F97316' },
  { name: 'Neon Pink', color: '#EC4899' },
  { name: 'Csalán Türkiz', color: '#06B6D4' },
];

export default function AdminSettingsPage({ onNavigate }: AdminSettingsPageProps) {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const s = getSiteSettings();
    return { ...DEFAULT_SITE_SETTINGS, ...s };
  });
  const [impressumData, setImpressumData] = useState<ImpressumData>(() => {
    const i = getImpressumData();
    return { ...DEFAULT_IMPRESSUM_DATA, ...i };
  });
  const [heroState, setHeroState] = useState<HeroState>(() => {
    const h = getHeroState();
    return {
      config: { ...DEFAULT_HERO_CONFIG, ...(h?.config || {}) },
      images: Array.isArray(h?.images) && h.images.length > 0 ? h.images : DEFAULT_HERO_IMAGES,
    };
  });
  const [calcConfig, setCalcConfig] = useState<CalculatorConfig>(() => {
    const c = getCalculatorConfig();
    return { ...DEFAULT_CALCULATOR_CONFIG, ...c };
  });
  const [legalDocs, setLegalDocs] = useState<LegalDocsData>(() => {
    const l = getLegalDocs();
    return {
      privacyPolicy: {
        ...DEFAULT_LEGAL_DOCS.privacyPolicy,
        ...(l?.privacyPolicy || {}),
        sections: Array.isArray(l?.privacyPolicy?.sections) ? l.privacyPolicy.sections : DEFAULT_LEGAL_DOCS.privacyPolicy.sections,
      },
      terms: {
        ...DEFAULT_LEGAL_DOCS.terms,
        ...(l?.terms || {}),
        sections: Array.isArray(l?.terms?.sections) ? l.terms.sections : DEFAULT_LEGAL_DOCS.terms.sections,
      },
      cookiePolicy: {
        ...DEFAULT_LEGAL_DOCS.cookiePolicy,
        ...(l?.cookiePolicy || {}),
      },
    };
  });
  const [aboutSettings, setAboutSettings] = useState<AboutSettings>(() => {
    const a = getAboutSettings();
    return { ...DEFAULT_ABOUT_SETTINGS, ...a };
  });
  const navItems = useNavigationItems();

  const [activeTab, setActiveTab] = useState<
    'design' | 'hero' | 'impressum' | 'navigation' | 'calculators' | 'legal' | 'about' | 'ads' | 'system' | 'icons_sharing'
  >('design');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Icon & Sharing Diagnostic State
  const [iconStats, setIconStats] = useState<Record<string, { width?: number; height?: number; warning?: string | null }>>({});
  const [ogImageStats, setOgImageStats] = useState<{ width?: number; height?: number; warning?: string | null }>({});
  const [showIconAuditModal, setShowIconAuditModal] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    passed: string[];
    warnings: string[];
    missing: string[];
  } | null>(null);

  // Dynamic Navigation Management Form State
  const [showNavModal, setShowNavModal] = useState(false);
  const [editingNavItem, setEditingNavItem] = useState<MenuItem | null>(null);
  const [navFormLabel, setNavFormLabel] = useState('');
  const [navFormPage, setNavFormPage] = useState('home');
  const [navFormParentId, setNavFormParentId] = useState<string | null>(null);
  const [navFormBadge, setNavFormBadge] = useState('');

  // Legal Doc Editor State
  const [activeLegalDocTab, setActiveLegalDocTab] = useState<'privacyPolicy' | 'terms' | 'cookiePolicy'>('privacyPolicy');

  const handleAddLegalSection = (docKey: 'privacyPolicy' | 'terms') => {
    const doc = legalDocs[docKey];
    const newSection = {
      title: `${doc.sections.length + 1}. Új Témakör / Szekció`,
      text: 'Ide írhatod a szekció részletes tartalmát és jogi tájékoztatóját...',
      list: [],
    };
    setLegalDocs({
      ...legalDocs,
      [docKey]: {
        ...doc,
        sections: [...doc.sections, newSection],
      },
    });
  };

  const handleUpdateLegalSection = (
    docKey: 'privacyPolicy' | 'terms',
    index: number,
    field: 'title' | 'text' | 'list',
    value: any
  ) => {
    const doc = legalDocs[docKey];
    const updatedSections = [...doc.sections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value,
    };
    setLegalDocs({
      ...legalDocs,
      [docKey]: {
        ...doc,
        sections: updatedSections,
      },
    });
  };

  const handleDeleteLegalSection = (docKey: 'privacyPolicy' | 'terms', index: number) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a szekciót?')) {
      const doc = legalDocs[docKey];
      const updatedSections = doc.sections.filter((_, i) => i !== index);
      setLegalDocs({
        ...legalDocs,
        [docKey]: {
          ...doc,
          sections: updatedSections,
        },
      });
    }
  };

  const handleMoveLegalSection = (
    docKey: 'privacyPolicy' | 'terms',
    index: number,
    direction: 'up' | 'down'
  ) => {
    const doc = legalDocs[docKey];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= doc.sections.length) return;

    const updatedSections = [...doc.sections];
    const temp = updatedSections[index];
    updatedSections[index] = updatedSections[targetIdx];
    updatedSections[targetIdx] = temp;

    setLegalDocs({
      ...legalDocs,
      [docKey]: {
        ...doc,
        sections: updatedSections,
      },
    });
  };

  const handleToggleNavActive = (id: string) => {
    const updated = navItems.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    saveNavItems(updated);
  };

  const handleMoveNav = (id: string, direction: 'up' | 'down') => {
    const item = navItems.find((i) => i.id === id);
    if (!item) return;

    const siblings = navItems
      .filter((i) => i.parentId === item.parentId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const idx = siblings.findIndex((i) => i.id === id);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= siblings.length) return;

    const otherItem = siblings[targetIdx];
    const updated = navItems.map((i) => {
      if (i.id === item.id) return { ...i, displayOrder: otherItem.displayOrder };
      if (i.id === otherItem.id) return { ...i, displayOrder: item.displayOrder };
      return i;
    });
    saveNavItems(updated);
  };

  const handleDeleteNav = (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a menüpontot? (Főmenü esetén az almenüi is törlődnek!)')) {
      const updated = navItems.filter((i) => i.id !== id && i.parentId !== id);
      saveNavItems(updated);
    }
  };

  const handleOpenAddNavModal = (parentId: string | null = null) => {
    setEditingNavItem(null);
    setNavFormLabel('');
    setNavFormPage('home');
    setNavFormParentId(parentId);
    setNavFormBadge('');
    setShowNavModal(true);
  };

  const handleOpenEditNavModal = (item: MenuItem) => {
    setEditingNavItem(item);
    setNavFormLabel(item.label);
    setNavFormPage(item.page);
    setNavFormParentId(item.parentId);
    setNavFormBadge(item.badge || '');
    setShowNavModal(true);
  };

  const handleSaveNavForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navFormLabel.trim()) return;

    if (editingNavItem) {
      const updated = navItems.map((i) =>
        i.id === editingNavItem.id
          ? {
              ...i,
              label: navFormLabel.trim(),
              page: navFormPage.trim(),
              parentId: navFormParentId,
              badge: navFormBadge.trim() || undefined,
            }
          : i
      );
      saveNavItems(updated);
    } else {
      const siblings = navItems.filter((i) => i.parentId === navFormParentId);
      const maxOrder = siblings.reduce((max, i) => Math.max(max, i.displayOrder), 0);

      const newItem: MenuItem = {
        id: `nav-${Date.now()}`,
        label: navFormLabel.trim(),
        page: navFormPage.trim(),
        parentId: navFormParentId,
        isActive: true,
        displayOrder: maxOrder + 1,
        badge: navFormBadge.trim() || undefined,
      };
      saveNavItems([...navItems, newItem]);
    }

    setShowNavModal(false);
    setEditingNavItem(null);
  };

  const handleResetNavTree = () => {
    if (window.confirm('Biztosan visszaállítod az alapszintű navigációt a gyári elrendezésre?')) {
      saveNavItems(DEFAULT_NAV_ITEMS);
    }
  };

  // Form state for new hero image
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAltText, setNewAltText] = useState('');

  // Logo upload & optimization state
  const [logoProcessing, setLogoProcessing] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [logoStats, setLogoStats] = useState<{
    width: number;
    height: number;
    sizeKb: number;
    format: string;
  } | null>(null);

  const processLogoFile = (file: File) => {
    setLogoError(null);

    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Nem támogatott fájlformátum. Kérjük PNG, WebP, SVG vagy JPG fájlt tölts fel!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLogoError('A megadott fájlméret meghaladja a 10 MB maximális korlátot.');
      return;
    }

    setLogoProcessing(true);

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const updated = { ...settings, logoUrl: result, iconsUpdatedAt: Date.now() };
        setSettings(updated);
        saveSiteSettings(updated);
        setLogoStats({
          width: 240,
          height: 60,
          sizeKb: Math.round(file.size / 1024),
          format: 'SVG (Vektorigrafika)',
        });
        setLogoProcessing(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 90;
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/png', 0.85);
          const approxKb = Math.round((optimizedDataUrl.length * 0.75) / 1024);

          const updated = { ...settings, logoUrl: optimizedDataUrl, iconsUpdatedAt: Date.now() };
          setSettings(updated);
          saveSiteSettings(updated);

          setLogoStats({
            width,
            height,
            sizeKb: approxKb,
            format: file.type.replace('image/', '').toUpperCase(),
          });
        }
        setLogoProcessing(false);
      };
      img.onerror = () => {
        setLogoError('Nem sikerült beolvasni a képet. Kérjük próbáld újra egy másik fájllal!');
        setLogoProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveSiteSettings(settings);
    saveImpressumData(impressumData);
    saveHeroState(heroState);
    saveCalculatorConfig(calcConfig);
    saveLegalDocs(legalDocs);
    saveAboutSettings(aboutSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Biztosan visszaállítod az összes beállítást az alapértelmezett értékekre?')) {
      setSettings({ ...DEFAULT_SITE_SETTINGS });
      setImpressumData({ ...DEFAULT_IMPRESSUM_DATA });
      setCalcConfig({ ...DEFAULT_CALCULATOR_CONFIG });
      setLegalDocs({ ...DEFAULT_LEGAL_DOCS });
      const defaultHeroState: HeroState = { config: DEFAULT_HERO_CONFIG, images: DEFAULT_HERO_IMAGES };
      setHeroState(defaultHeroState);
      saveSiteSettings(DEFAULT_SITE_SETTINGS);
      saveImpressumData(DEFAULT_IMPRESSUM_DATA);
      saveHeroState(defaultHeroState);
      saveCalculatorConfig(DEFAULT_CALCULATOR_CONFIG);
      saveLegalDocs(DEFAULT_LEGAL_DOCS);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleAddHeroImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;

    const newImg: HeroImage = {
      id: `hero-${Date.now()}`,
      imageUrl: newImageUrl.trim(),
      altText: newAltText.trim() || 'Főoldali hero vizuális kép',
      isActive: true,
      displayOrder: heroState.images.length + 1,
      createdAt: new Date().toISOString(),
    };

    const updatedState: HeroState = {
      ...heroState,
      images: [...heroState.images, newImg],
    };

    setHeroState(updatedState);
    saveHeroState(updatedState);
    setNewImageUrl('');
    setNewAltText('');
  };

  const handleToggleHeroImageActive = (id: string) => {
    const updatedImages = heroState.images.map((img) =>
      img.id === id ? { ...img, isActive: !img.isActive } : img
    );
    const updatedState = { ...heroState, images: updatedImages };
    setHeroState(updatedState);
    saveHeroState(updatedState);
  };

  const handleDeleteHeroImage = (id: string) => {
    if (heroState.images.length <= 1) {
      alert('Legalább egy hero képnek léteznie kell!');
      return;
    }
    const updatedImages = heroState.images.filter((img) => img.id !== id);
    const updatedState = { ...heroState, images: updatedImages };
    setHeroState(updatedState);
    saveHeroState(updatedState);
  };

  const handleMoveHeroImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...heroState.images];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIdx];
    newImages[targetIdx] = temp;

    newImages.forEach((img, i) => {
      img.displayOrder = i + 1;
    });

    const updatedState = { ...heroState, images: newImages };
    setHeroState(updatedState);
    saveHeroState(updatedState);
};

  const handleUpdateHeroConfig = (updates: Partial<HeroState['config']>) => {
    const updatedState: HeroState = {
      ...heroState,
      config: { ...heroState.config, ...updates },
    };
    setHeroState(updatedState);
    saveHeroState(updatedState);
  };

  const processIconFile = (fieldKey: keyof SiteSettings, file: File, recW: number, recH: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        let warning: string | null = null;

        if (recW > 0 && recH > 0 && (w !== recW || h !== recH)) {
          warning = `⚠️ Figyelmeztetés: A feltöltött kép mérete (${w}×${h} px) eltér az ajánlottól (${recW}×${recH} px). Ennek ellenére elmenthető.`;
        }

        setIconStats((prev) => ({
          ...prev,
          [fieldKey]: { width: w, height: h, warning },
        }));

        const updated = {
          ...settings,
          [fieldKey]: dataUrl,
          iconsUpdatedAt: Date.now(),
        };
        setSettings(updated);
        saveSiteSettings(updated);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const processOgImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        let warning: string | null = null;

        if (w < 1000 || h < 500) {
          warning = `⚠️ Figyelmeztetés: A megosztási kép mérete (${w}×${h} px) kisebb az ajánlott 1200×630 px felbontásnál. Megosztáskor elmosódott lehet.`;
        }

        setOgImageStats({ width: w, height: h, warning });

        const updated = {
          ...settings,
          ogImageUrl: dataUrl,
          iconsUpdatedAt: Date.now(),
        };
        setSettings(updated);
        saveSiteSettings(updated);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const runIconAudit = () => {
    const passed: string[] = [];
    const warnings: string[] = [];
    const missing: string[] = [];

    if (settings.faviconIcoUrl || settings.faviconPngUrl) {
      passed.push('Favicon (ICO / PNG): Rendben beállítva');
    } else {
      missing.push('Favicon: Hiányzik az ICO vagy PNG favicon');
    }

    if (settings.appleTouchIconUrl) {
      passed.push('Apple Touch Icon: Rendben (180×180 px iOS ikon aktív)');
    } else {
      missing.push('Apple Touch Icon: Hiányzik az Apple iOS kezdőképernyő ikon');
    }

    if (settings.pwaIcon192Url && settings.pwaIcon512Url) {
      passed.push('PWA Android Ikonok (192px & 512px): Mindkét PWA ikon méret beállítva');
    } else {
      warnings.push('PWA Ikonok: Hiányos – érdemes megadni a 192×192 px és 512×512 px PNG képeket is');
    }

    if (settings.ogImageUrl) {
      passed.push('Alapértelmezett Megosztási Kép (Open Graph): Rendben (1200×630 px)');
    } else {
      missing.push('Megosztási Kép: Nincs megadva globális Open Graph hirdetési/megosztási kép');
    }

    if (settings.ogTitle && settings.ogDescription) {
      passed.push('Open Graph Metaadatok: Cím és leírás megadva');
    } else {
      warnings.push('Open Graph Metaadatok: Cím vagy leírás hiányos');
    }

    if (settings.pwaAppName && settings.pwaShortName && settings.pwaThemeColor) {
      passed.push('Web App Manifest (/site.webmanifest): Dinamikus PWA JSON konfiguráció rendben');
    } else {
      missing.push('Web App Manifest: Hiányos név vagy téma szín beállítás');
    }

    setAuditResults({ passed, warnings, missing });
    setShowIconAuditModal(true);
  };

  const liveSiteSettings = useSiteSettings();
  const cardBg = settings.adminCardBgColor || liveSiteSettings.adminCardBgColor || '#111111';
  const cardHighlight = settings.adminCardHighlightColor || settings.adminAccentColor || liveSiteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };

  return (
    <div style={{ color: textColor }} className="min-h-screen p-4 md:p-8 space-y-8">
      {/* Top Header Bar */}
      <div style={{ borderColor: cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <Palette style={{ color: cardHighlight }} size={32} />
            Rendszer- és Design Beállítások
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Weboldal arculat, hero képek, impresszum adatok, logó, navigációs menüpontok és reklámok központi testreszabása.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
            className="px-4 py-2.5 border font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw size={14} /> Alapértelmezett
          </button>
          <button
            onClick={handleSave}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:opacity-90"
          >
            <Save size={16} /> Mentés &amp; Alkalmazás
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl flex items-center gap-3 animate-fade-in text-sm font-bold">
          <CheckCircle2 size={20} />
          A beállítások, hero képek és impresszum adatok sikeresen elmentve és alkalmazva a teljes weboldalon!
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ borderColor: cardBorder }} className="flex items-center gap-2 border-b overflow-x-auto pb-2">
        {[
          { id: 'design', label: '🎨 Arculat & Színek', icon: Palette },
          { id: 'hero', label: '🖼️ Főoldali Hero Képek', icon: ImageIcon },
          { id: 'impressum', label: '🏢 Impresszum & Kapcsolat', icon: Building },
          { id: 'navigation', label: '🧭 Navigáció & Menü', icon: Compass },
          { id: 'calculators', label: '🧮 Kalkulátor Árak', icon: Calculator },
          { id: 'legal', label: '📜 Jogi Szövegek', icon: Shield },
          { id: 'about', label: 'ℹ️ Rólunk Oldal', icon: Info },
          { id: 'ads', label: '📢 Reklámok & Ajánlatok', icon: Megaphone },
          { id: 'icons_sharing', label: '🌐 Webhely ikonok & Megosztás', icon: Share2 },
          { id: 'system', label: '⚙️ Rendszer & Biztonság', icon: ShieldAlert },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={
                isActive
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : { backgroundColor: cardBg, borderColor: cardBorder, color: textColor }
              }
              className={`px-5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                isActive ? 'shadow-lg scale-105' : 'hover:opacity-90'
              }`}
            >
              <IconComp size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BRANDING & DESIGN */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Branding Inputs */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <ImageIcon size={20} style={{ color: cardHighlight }} /> Weboldal Arculati Adatok
            </h2>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">Weboldal Neve (Site Title)</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                placeholder="ÉpítőTudás"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">Weboldal Szlogenje (Tagline)</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                placeholder="Építőipari Tudásbázis & Szakmai Enciklopédia"
              />
            </div>

            {/* Customizable Public Section Texts */}
            <div style={{ borderColor: cardBorder }} className="space-y-4 pt-4 border-t">
              <h3 style={{ color: cardHighlight }} className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> Főoldali &amp; Globális Szöveges Tartalmak
              </h3>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Főoldali Hero Főcím</label>
                <textarea
                  rows={2}
                  value={settings.heroMainTitle || ''}
                  onChange={(e) => setSettings({ ...settings, heroMainTitle: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  placeholder="Magyarország vezető építőipari tudásbázisa"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Főoldali Hero Alcím / Leírás</label>
                <textarea
                  rows={2}
                  value={settings.heroSubtitle || ''}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  placeholder="Szakmai enciklopédia, megbízható útmutatók..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1.5">Hírlevél Blokkcím</label>
                  <input
                    type="text"
                    value={settings.newsletterTitle || ''}
                    onChange={(e) => setSettings({ ...settings, newsletterTitle: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    placeholder="Szakmai hírlevél"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1.5">Hírlevél Leírás</label>
                  <input
                    type="text"
                    value={settings.newsletterDescription || ''}
                    onChange={(e) => setSettings({ ...settings, newsletterDescription: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    placeholder="Heti frissítések..."
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Lábjegyzet (Footer) Leírás</label>
                <input
                  type="text"
                  value={settings.footerDescription || ''}
                  onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  placeholder="Magyarország legátfogóbb online építőipari tudásbázisa."
                />
              </div>
            </div>

            {/* Advanced Logo Uploader & Management */}
            <div className="space-y-4 pt-2 border-t border-[#222]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-300 block flex items-center gap-1.5">
                  <Upload size={14} className="text-accent" /> Weboldal Logó Kezelése &amp; Feltöltése
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  className="text-[11px] text-accent font-bold hover:underline cursor-pointer"
                >
                  {showCustomUrlInput ? '📁 Fájlfeltöltő használata' : '🔗 Haladó URL megadása'}
                </button>
              </div>

              {/* Help & Guidelines Card */}
              <div className="p-3.5 bg-[#141824] border border-blue-500/20 rounded-2xl space-y-1.5 text-xs text-gray-300">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <Info size={15} className="text-accent shrink-0" /> Ajánlott Logó Beállítások &amp; Fejléc Védelem
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-gray-400 pl-1 leading-relaxed">
                  <li><strong>Ajánlott formátum:</strong> PNG (átlátszó háttérrel), WebP vagy SVG.</li>
                  <li><strong>Ajánlott méret / arány:</strong> Vízszintes elrendezés (kb. <span className="text-white font-mono">240 × 60 px</span> vagy <span className="text-white font-mono">320 × 80 px</span>).</li>
                  <li><strong>Automatikus optimálás:</strong> A rendszer automatikusan átméretezi és tömöríti a fájlokat webes használatra.</li>
                  <li><strong>Fejléc védelem:</strong> A fejlécben a logó fix keretben (<span className="text-accent font-mono">max-h-10</span>) skálázódik, így a túl nagy képek sem tudják széttolni a menüt.</li>
                </ul>
              </div>

              {/* Dropzone or Custom URL Input */}
              {!showCustomUrlInput ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processLogoFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                    dragActive
                      ? 'border-accent bg-accent/10'
                      : 'border-[#2E2E2E] bg-[#161616] hover:border-gray-500 hover:bg-[#1A1A1A]'
                  }`}
                >
                  <input
                    type="file"
                    id="logo-file-input"
                    accept="image/png,image/svg+xml,image/webp,image/jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processLogoFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                    <Upload size={22} />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="logo-file-input" className="text-xs font-bold text-white cursor-pointer hover:text-accent underline block">
                      Kattints ide a logófájl kiválasztásához
                    </label>
                    <p className="text-[11px] text-gray-400">vagy húzd ide a fájlt (Drag &amp; Drop)</p>
                  </div>

                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded bg-[#222] text-gray-400 border border-[#333]">
                    PNG • SVG • WebP • JPG (max 10MB)
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 block">Közvetlen Logó Képhivatkozás (Logo URL)</label>
                  <input
                    type="text"
                    value={settings.logoUrl}
                    onChange={(e) => {
                      const updated = { ...settings, logoUrl: e.target.value };
                      setSettings(updated);
                      applySiteSettings(updated);
                    }}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-accent"
                    placeholder="Hagyd üresen az alapértelmezett logóhoz (/logo.png)"
                  />
                  <p className="text-[11px] text-gray-500">Ha üresen hagyod, az alapértelmezett ÉpítőTudás logó jelenik meg.</p>
                </div>
              )}

              {logoProcessing && (
                <div className="p-3 bg-accent/10 border border-accent/30 rounded-xl text-accent text-xs font-bold flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-accent border-r-transparent animate-spin" />
                  Logó feldolgozása, átméretezése és tömörítése folyamatban...
                </div>
              )}

              {logoError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} />
                  {logoError}
                </div>
              )}

              {/* Current Logo Preview & Status */}
              <div className="p-4 bg-[#141414] border border-[#222] rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-24 h-12 bg-[#0b1b33] border border-[#222] rounded-xl p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow">
                    <img
                      src={settings.logoUrl || '/logo.png'}
                      alt="Jelenlegi logó"
                      className="max-h-9 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {settings.logoUrl ? 'Egyedi feltöltött logó aktív' : 'Alapértelmezett ÉpítőTudás logó'}
                    </span>
                    {logoStats ? (
                      <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                        {logoStats.width} × {logoStats.height} px • {logoStats.sizeKb} KB • {logoStats.format}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-500 mt-0.5">Automatikus méretezés &amp; layout védelem bekapcsolva</p>
                    )}
                  </div>
                </div>

                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...settings, logoUrl: '' };
                      setSettings(updated);
                      applySiteSettings(updated);
                      setLogoStats(null);
                      setLogoError(null);
                    }}
                    className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Törlés &amp; Alapértelmezett
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Theme & Live Preview */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <Palette size={20} style={{ color: cardHighlight }} /> Színtéma &amp; Paletták
            </h2>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 block">Előre összeállított színpaletták</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_PALETTES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      const updated = { ...settings, primaryColor: preset.primary };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    style={
                      settings.primaryColor === preset.primary
                        ? { backgroundColor: `${cardHighlight}20`, borderColor: cardHighlight }
                        : { backgroundColor: inputBg, borderColor: cardBorder }
                    }
                    className="p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer hover:opacity-90"
                  >
                    <div className="w-6 h-6 rounded-full shrink-0 shadow" style={{ backgroundColor: preset.previewBg }} />
                    <span style={{ color: textColor }} className="text-xs font-bold">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">Egyedi Elsődleges Színkód (Primary Color Hex)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => {
                    const updated = { ...settings, primaryColor: e.target.value };
                    setSettings(updated);
                    saveSiteSettings(updated);
                  }}
                  className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => {
                    const updated = { ...settings, primaryColor: e.target.value };
                    setSettings(updated);
                    saveSiteSettings(updated);
                  }}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Live Header Preview Card */}
            <div style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-2">
              <span className="text-xs font-bold text-gray-400 block">Fejléc Élő Előnézete</span>
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <img
                    src={settings.logoUrl || '/logo.png'}
                    alt="Preview Logo"
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  <span style={{ color: textColor }} className="text-base font-bold">
                    {settings.siteTitle || 'ÉpítőTudás'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-extrabold text-black" style={{ backgroundColor: settings.primaryColor }}>
                    Kiemelés
                  </span>
                </div>
              </div>
            </div>

            {/* ADMIN PANEL STYLING SECTION */}
            <div style={{ borderColor: cardBorder }} className="pt-6 border-t space-y-6">
              <h3 style={{ color: textColor }} className="text-sm font-bold flex items-center gap-2">
                <Shield size={18} style={{ color: cardHighlight }} /> Admin Panel Testreszabása (Kiemelés &amp; Háttér)
              </h3>

              {/* Admin Accent Color */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 block">Admin Panel Kiemelés Színe (Admin Accent Color)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_ADMIN_ACCENTS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, adminAccentColor: preset.color };
                        setSettings(updated);
                        saveSiteSettings(updated);
                      }}
                      style={
                        (settings.adminAccentColor || '#FFC400') === preset.color
                          ? { backgroundColor: `${preset.color}20`, borderColor: preset.color }
                          : { backgroundColor: inputBg, borderColor: cardBorder }
                      }
                      className="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer hover:opacity-90"
                    >
                      <div className="w-4 h-4 rounded-full shrink-0 shadow" style={{ backgroundColor: preset.color }} />
                      <span style={{ color: textColor }} className="text-[11px] font-bold truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    value={settings.adminAccentColor || '#FFC400'}
                    onChange={(e) => {
                      const updated = { ...settings, adminAccentColor: e.target.value };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.adminAccentColor || '#FFC400'}
                    onChange={(e) => {
                      const updated = { ...settings, adminAccentColor: e.target.value };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Admin Background Color */}
              <div style={{ borderColor: cardBorder }} className="space-y-3 pt-3 border-t">
                <label className="text-xs font-bold text-gray-400 block">Admin Panel Háttér Színe (Admin Background Color)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_ADMIN_BACKGROUNDS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, adminBgColor: preset.color };
                        setSettings(updated);
                        saveSiteSettings(updated);
                      }}
                      style={
                        (settings.adminBgColor || '#0A0A0A') === preset.color
                          ? { backgroundColor: `${cardHighlight}20`, borderColor: cardHighlight }
                          : { backgroundColor: inputBg, borderColor: cardBorder }
                      }
                      className="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer hover:opacity-90"
                    >
                      <div className="w-4 h-4 rounded-full shrink-0 border border-gray-600 shadow" style={{ backgroundColor: preset.color }} />
                      <span style={{ color: textColor }} className="text-[11px] font-bold truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    value={settings.adminBgColor || '#0A0A0A'}
                    onChange={(e) => {
                      const updated = { ...settings, adminBgColor: e.target.value };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.adminBgColor || '#0A0A0A'}
                    onChange={(e) => {
                      const updated = { ...settings, adminBgColor: e.target.value };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Admin Card Background Color */}
              <div style={{ borderColor: cardBorder }} className="space-y-3 pt-3 border-t">
                <label className="text-xs font-bold text-gray-400 block">Admin Csempék Háttérszíne (Admin Card/Tile Background)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_ADMIN_CARD_BGS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, adminCardBgColor: preset.color };
                        setSettings(updated);
                        saveSiteSettings(updated);
                      }}
                      style={
                        (settings.adminCardBgColor || '#111111') === preset.color
                          ? { backgroundColor: `${cardHighlight}20`, borderColor: cardHighlight }
                          : { backgroundColor: inputBg, borderColor: cardBorder }
                      }
                      className="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer hover:opacity-90"
                    >
                      <div className="w-4 h-4 rounded-full shrink-0 border border-gray-600 shadow" style={{ backgroundColor: preset.color }} />
                      <span style={{ color: textColor }} className="text-[11px] font-bold truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    value={settings.adminCardBgColor || '#111111'}
                    onChange={(e) => {
                      const updated = { ...settings, adminCardBgColor: e.target.value };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.adminCardBgColor || '#111111'}
                    onChange={(e) => {
                      const updated = { ...settings, adminCardBgColor: e.target.value };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Admin Card Text & Badge Highlight Color */}
              <div style={{ borderColor: cardBorder }} className="space-y-3 pt-3 border-t">
                <label className="text-xs font-bold text-gray-400 block">Csempéken Szövegkiemelések Színe (Card Text &amp; Badge Highlight)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_ADMIN_CARD_HIGHLIGHTS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, adminCardHighlightColor: preset.color };
                        setSettings(updated);
                        saveSiteSettings(updated);
                      }}
                      style={
                        (settings.adminCardHighlightColor || '#FFC400') === preset.color
                          ? { backgroundColor: `${preset.color}20`, borderColor: preset.color }
                          : { backgroundColor: inputBg, borderColor: cardBorder }
                      }
                      className="p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer hover:opacity-90"
                    >
                      <div className="w-4 h-4 rounded-full shrink-0 shadow" style={{ backgroundColor: preset.color }} />
                      <span style={{ color: textColor }} className="text-[11px] font-bold truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    value={settings.adminCardHighlightColor || '#FFC400'}
                    onChange={(e) => {
                      const updated = { ...settings, adminCardHighlightColor: e.target.value };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.adminCardHighlightColor || '#FFC400'}
                    onChange={(e) => {
                      const updated = { ...settings, adminCardHighlightColor: e.target.value };
                      setSettings(updated);
                      saveSiteSettings(updated);
                    }}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Admin Layout Preview */}
              <div style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-2">
                <span className="text-xs font-bold text-gray-400 block">Admin Panel Élő Előnézete (Oldalsáv + Kártyák)</span>
                <div
                  className="p-4 rounded-2xl border transition-all space-y-3 shadow-md"
                  style={{
                    backgroundColor: settings.adminBgColor || '#0A0A0A',
                    borderColor: `${settings.adminAccentColor || '#FFC400'}40`,
                  }}
                >
                  <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: `${settings.adminAccentColor || '#FFC400'}30` }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: settings.adminAccentColor || '#FFC400' }}>
                        ADMIN PANEL
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold text-black" style={{ backgroundColor: settings.adminAccentColor || '#FFC400' }}>
                      Aktív Szín
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Sidebar menu item preview */}
                    <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: `${settings.adminAccentColor || '#FFC400'}1C`, borderColor: settings.adminAccentColor || '#FFC400' }}>
                      <div className="font-bold text-[11px]" style={{ color: settings.adminAccentColor || '#FFC400' }}>
                        ● Menüpont Kijelölés
                      </div>
                      <div className="text-[10px] text-gray-400">Oldalsáv aktív nézet</div>
                    </div>

                    {/* Admin Stat Card / Tile preview */}
                    <div
                      className="p-3 rounded-xl border space-y-2 shadow-sm"
                      style={{
                        backgroundColor: settings.adminCardBgColor || '#111111',
                        borderColor: adjustColorBrightness(settings.adminCardBgColor || '#111111', 15),
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-300">Csempe / Kártya</span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded border"
                          style={{
                            color: settings.adminCardHighlightColor || '#FFC400',
                            backgroundColor: `${settings.adminCardHighlightColor || '#FFC400'}1F`,
                            borderColor: `${settings.adminCardHighlightColor || '#FFC400'}40`,
                          }}
                        >
                          Csempe Kiemelés
                        </span>
                      </div>
                      <div style={{ color: getContrastTextColor(settings.adminCardBgColor || '#111111') }} className="text-[11px] font-extrabold">42 Aktív Cikk</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explicit Arculat Mentése Button */}
              <div style={{ borderColor: cardBorder }} className="pt-6 border-t flex items-center justify-between gap-4">
                <p className="text-xs text-gray-400">A kiválasztott arculati és admin színek azonnal mentésre és alkalmazásra kerülnek.</p>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:opacity-90"
                >
                  <Save size={16} /> Arculat &amp; Színek Mentése
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: HERO IMAGES & ROTATION */}
      {activeTab === 'hero' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rotation Mode & Interval Settings */}
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="lg:col-span-1 border rounded-3xl p-6 space-y-6 shadow-xl h-fit">
              <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
                <ImageIcon size={20} style={{ color: cardHighlight }} /> Hero Működési Mód &amp; Időzítés
              </h2>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 block">Váltási Mód (Rotation Mode)</label>
                <div className="space-y-2">
                  {[
                    {
                      mode: 'slideshow',
                      title: '🔄 Automatikus Slideshow',
                      desc: 'A képek automatikusan váltsák egymást N másodpercenként.',
                    },
                    {
                      mode: 'random',
                      title: '🎲 Random Kép Frissítéskor',
                      desc: 'Minden új oldalbetöltéskor/frissítéskor véletlenszerű képet sorsol.',
                    },
                    {
                      mode: 'static',
                      title: '📌 Statikus Egy Kép',
                      desc: 'Egyetlen rögzített kiemelt kép megjelenítése mindig.',
                    },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      onClick={() => handleUpdateHeroConfig({ rotationMode: item.mode as HeroRotationMode })}
                      style={
                        heroState.config.rotationMode === item.mode
                          ? { backgroundColor: `${cardHighlight}20`, borderColor: cardHighlight, color: textColor }
                          : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
                      }
                      className="w-full p-4 rounded-2xl border text-left transition-all cursor-pointer hover:opacity-90"
                    >
                      <div className="text-sm font-bold flex items-center justify-between">
                        <span>{item.title}</span>
                        {heroState.config.rotationMode === item.mode && (
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cardHighlight }} />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {heroState.config.rotationMode === 'slideshow' && (
                <div style={{ borderColor: cardBorder }} className="pt-2 border-t">
                  <label className="text-xs font-bold text-gray-400 block mb-2">
                    Váltási Időköz (Másodperc)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={2}
                      max={60}
                      value={heroState.config.rotationIntervalSeconds}
                      onChange={(e) =>
                        handleUpdateHeroConfig({
                          rotationIntervalSeconds: Math.max(2, parseInt(e.target.value) || 5),
                        })
                      }
                      style={fieldStyle}
                      className="w-24 border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                    />
                    <span className="text-xs text-gray-400 font-semibold">másodperc képenként</span>
                  </div>
                </div>
              )}

              {/* Indicator Dots Toggle */}
              <div style={{ borderColor: cardBorder }} className="pt-3 border-t space-y-2">
                <label className="text-xs font-bold text-gray-400 block">
                  Navigációs Indikátor Pöttyök
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateHeroConfig({
                      showIndicators: !(heroState.config.showIndicators !== false),
                    })
                  }
                  style={
                    heroState.config.showIndicators !== false
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: textColor }
                      : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
                  }
                  className="w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold block">
                      {heroState.config.showIndicators !== false
                        ? '🟢 Indikátor pöttyök láthatók'
                        : '⚪ Indikátor pöttyök rejtve'}
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Alsó léptető pöttyök a kártya alján
                    </p>
                  </div>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border ${
                      heroState.config.showIndicators !== false
                        ? 'bg-emerald-400 border-emerald-300'
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Hero Images Management & Upload */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add New Hero Image Card */}
              <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-4 shadow-xl">
                <h2 style={{ color: textColor }} className="text-lg font-bold flex items-center gap-2">
                  <Plus size={20} style={{ color: cardHighlight }} /> Új Hero Kép Hozzáadása
                </h2>
                <form onSubmit={handleAddHeroImage} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-1.5">
                        Kép URL Hivatkozás (Image URL)
                      </label>
                      <input
                        type="url"
                        required
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... vagy /hero-bg.jpg"
                        style={fieldStyle}
                        className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-1.5">
                        Kép Leírása / Alt Szöveg
                      </label>
                      <input
                        type="text"
                        value={newAltText}
                        onChange={(e) => setNewAltText(e.target.value)}
                        placeholder="pl. Építőipari gépek munkában"
                        style={fieldStyle}
                        className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    style={{ backgroundColor: cardHighlight, color: '#000000' }}
                    className="px-5 py-2.5 font-extrabold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 shadow-md hover:opacity-90"
                  >
                    <Plus size={16} /> Kép Hozzáadása a Rendszerhez
                  </button>
                </form>
              </div>

              {/* Images List */}
              <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-4 shadow-xl">
                <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-3">
                  <h3 style={{ color: textColor }} className="text-base font-bold flex items-center gap-2">
                    <ImageIcon size={18} style={{ color: cardHighlight }} /> Aktív Hero Képek Listája ({heroState.images.length})
                  </h3>
                  <span className="text-xs text-gray-400">
                    {heroState.images.filter((i) => i.isActive).length} aktív megjelenítésben
                  </span>
                </div>

                <div className="space-y-3">
                  {heroState.images.map((img, index) => (
                    <div
                      key={img.id}
                      style={{
                        backgroundColor: img.isActive ? inputBg : cardBg,
                        borderColor: cardBorder,
                      }}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        img.isActive ? '' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <img
                          src={img.imageUrl}
                          alt={img.altText}
                          style={{ borderColor: cardBorder }}
                          className="w-24 h-16 rounded-xl object-cover border shrink-0 bg-black/40"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/hero-construction.jpg';
                          }}
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: cardHighlight }} className="text-xs font-bold">#{img.displayOrder}</span>
                            <span style={{ color: textColor }} className="text-sm font-bold truncate max-w-[220px]">
                              {img.altText || 'Hero Kép'}
                            </span>
                            {img.isActive ? (
                              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Aktív
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                Inaktív
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-gray-400 truncate max-w-[300px]">
                            {img.imageUrl}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleMoveHeroImage(index, 'up')}
                          disabled={index === 0}
                          title="Mozgatás felfelé"
                          style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                          className="p-2 border disabled:opacity-30 rounded-lg transition-colors cursor-pointer hover:opacity-80"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveHeroImage(index, 'down')}
                          disabled={index === heroState.images.length - 1}
                          title="Mozgatás lefelé"
                          style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                          className="p-2 border disabled:opacity-30 rounded-lg transition-colors cursor-pointer hover:opacity-80"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleHeroImageActive(img.id)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                            img.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                          }`}
                        >
                          {img.isActive ? 'Kikapcsolás' : 'Bekapcsolás'}
                        </button>
                        <button
                          onClick={() => handleDeleteHeroImage(img.id)}
                          title="Kép törlése"
                          className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: IMPRESSUM & CONTACT EDITING */}
      {activeTab === 'impressum' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Szolgáltatói & Kapcsolati Adatok */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <ShieldCheck size={20} style={{ color: cardHighlight }} /> 1. Szolgáltató Cégadatai &amp; Kapcsolat
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5 flex items-center gap-1.5">
                  <Building size={14} style={{ color: cardHighlight }} /> Hivatalos Cégnév
                </label>
                <input
                  type="text"
                  value={impressumData.companyName}
                  onChange={(e) => setImpressumData({ ...impressumData, companyName: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1.5">Cégjegyzékszám</label>
                  <input
                    type="text"
                    value={impressumData.regNumber}
                    onChange={(e) => setImpressumData({ ...impressumData, regNumber: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1.5">Adószám</label>
                  <input
                    type="text"
                    value={impressumData.taxNumber}
                    onChange={(e) => setImpressumData({ ...impressumData, taxNumber: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} style={{ color: cardHighlight }} /> Székhely Címe
                </label>
                <input
                  type="text"
                  value={impressumData.address}
                  onChange={(e) => setImpressumData({ ...impressumData, address: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} style={{ color: cardHighlight }} /> Központi Email Cím
                  </label>
                  <input
                    type="email"
                    value={impressumData.email}
                    onChange={(e) => setImpressumData({ ...impressumData, email: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1.5 flex items-center gap-1.5">
                    <Phone size={14} style={{ color: cardHighlight }} /> Telefonszám
                  </label>
                  <input
                    type="text"
                    value={impressumData.phone}
                    onChange={(e) => setImpressumData({ ...impressumData, phone: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tárhelyszolgáltató, Dokumentum metaadatok & Szerzői jogok */}
          <div className="space-y-6">
            {/* Tárhelyszolgáltató */}
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
                <Globe size={20} style={{ color: cardHighlight }} /> 2. Tárhelyszolgáltató Adatai
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Szolgáltató Neve</label>
                  <input
                    type="text"
                    value={impressumData.hostingName}
                    onChange={(e) => setImpressumData({ ...impressumData, hostingName: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Cím / Székhely</label>
                  <input
                    type="text"
                    value={impressumData.hostingAddress}
                    onChange={(e) => setImpressumData({ ...impressumData, hostingAddress: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Weboldal URL</label>
                  <input
                    type="text"
                    value={impressumData.hostingWebsite}
                    onChange={(e) => setImpressumData({ ...impressumData, hostingWebsite: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Dokumentum Verzió & Szerzői jogok */}
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
                <FileText size={20} style={{ color: cardHighlight }} /> 3. Jogi Nyilatkozat &amp; Verzió
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Hatálybalépés Kelte</label>
                  <input
                    type="text"
                    value={impressumData.effectiveDate}
                    onChange={(e) => setImpressumData({ ...impressumData, effectiveDate: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">Verziószám</label>
                  <input
                    type="text"
                    value={impressumData.version}
                    onChange={(e) => setImpressumData({ ...impressumData, version: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Szerzői Jogok Nyilatkozata</label>
                <textarea
                  rows={4}
                  value={impressumData.copyrightContent}
                  onChange={(e) => setImpressumData({ ...impressumData, copyrightContent: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl p-3 text-xs focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NAVIGATION & MENU ITEMS */}
      {activeTab === 'navigation' && (
        <div className="space-y-6">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 shadow-xl space-y-6">
            <div style={{ borderColor: cardBorder }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h2 style={{ color: textColor }} className="text-lg font-bold flex items-center gap-2">
                  <Compass size={20} style={{ color: cardHighlight }} /> Dinamikus Menü- és Almenüszerkesztő Modul
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Kezeld a weboldalon megjelenő összes főmenüt és almenüt: adj hozzá új elemeket, szerkeszd, töröld, mozgasd vagy tedd inaktívvá őket egyetlen kattintással.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleResetNavTree}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-3.5 py-2 border font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RotateCcw size={14} /> Alaphelyzet
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddNavModal(null)}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-4 py-2 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg cursor-pointer hover:opacity-90"
                >
                  <Plus size={16} /> Új Főmenü Hozzáadása
                </button>
              </div>
            </div>

            {/* Information Guidance Banner */}
            <div style={{ backgroundColor: `${cardHighlight}15`, borderColor: `${cardHighlight}30` }} className="p-4 border rounded-2xl flex items-start gap-3 text-xs">
              <Info size={18} style={{ color: cardHighlight }} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p style={{ color: textColor }} className="font-bold">Szerkesztési útmutató &amp; Élő Jelzések:</p>
                <ul className="list-disc list-inside text-gray-400 space-y-0.5 text-[11px] leading-relaxed">
                  <li><strong>Főmenük:</strong> A legfelső szinten megjelenő fülek a fejlécben.</li>
                  <li><strong>Almenük:</strong> A főmenü alá behúzott elemek, melyek a legördülő menüben és mobil harmonikában jelennek meg.</li>
                  <li><strong>Inaktívvá tétel:</strong> A szem ikonra (<Eye size={12} style={{ color: cardHighlight }} className="inline mx-0.5" /> / <EyeOff size={12} className="inline mx-0.5 text-gray-500" />) kattintva elrejtheted az elemet a látogatók elől anélkül, hogy törölnéd az adatbázisból.</li>
                  <li><strong>Sorrendezése:</strong> A nyilakkal (<ArrowUp size={12} className="inline" /> / <ArrowDown size={12} className="inline" />) megváltoztathatod a menüpontok sorrendjét.</li>
                </ul>
              </div>
            </div>

            {/* Tree Structure Listing */}
            <div className="space-y-4 pt-2">
              {navItems.filter((item) => item.parentId === null).sort((a, b) => a.displayOrder - b.displayOrder).map((mainItem, mainIdx, mainArr) => {
                const subItems = navItems.filter((sub) => sub.parentId === mainItem.id).sort((a, b) => a.displayOrder - b.displayOrder);

                return (
                  <div key={mainItem.id} style={{ borderColor: cardBorder, backgroundColor: inputBg }} className="border rounded-2xl overflow-hidden shadow-sm">
                    {/* Main Item Row */}
                    <div
                      style={{ backgroundColor: mainItem.isActive ? headerBg : cardBg }}
                      className={`p-4 flex flex-wrap items-center justify-between gap-3 ${mainItem.isActive ? '' : 'opacity-60'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }}
                          className="w-6 h-6 rounded-lg border font-extrabold text-xs flex items-center justify-center shrink-0"
                        >
                          {mainItem.displayOrder}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span style={{ color: textColor }} className="text-sm font-extrabold truncate">{mainItem.label}</span>
                            {mainItem.badge && (
                              <span style={{ backgroundColor: `${cardHighlight}30`, color: cardHighlight }} className="text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {mainItem.badge}
                              </span>
                            )}
                            {!mainItem.isActive && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
                                Rejtett (Inaktív)
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-gray-400">Útvonal: #{mainItem.page}</span>
                        </div>
                      </div>

                      {/* Main Item Actions */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        {/* Toggle Active */}
                        <button
                          type="button"
                          onClick={() => handleToggleNavActive(mainItem.id)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            mainItem.isActive
                              ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                              : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:bg-gray-800'
                          }`}
                          title={mainItem.isActive ? 'Megjelenítve a látogatóknak (Kattints az elrejtéshez)' : 'Elrejtve (Kattints a megjelenítéshez)'}
                        >
                          {mainItem.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>

                        {/* Reorder Up/Down */}
                        <button
                          type="button"
                          disabled={mainIdx === 0}
                          onClick={() => handleMoveNav(mainItem.id, 'up')}
                          style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                          className="p-2 border rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:opacity-80"
                          title="Mozgatás felfelé"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={mainIdx === mainArr.length - 1}
                          onClick={() => handleMoveNav(mainItem.id, 'down')}
                          style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                          className="p-2 border rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:opacity-80"
                          title="Mozgatás lefelé"
                        >
                          <ArrowDown size={14} />
                        </button>

                        {/* Add Subitem */}
                        <button
                          type="button"
                          onClick={() => handleOpenAddNavModal(mainItem.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Plus size={13} /> Almenü
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditNavModal(mainItem)}
                          style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                          className="p-2 border rounded-xl hover:opacity-80 transition-colors"
                          title="Szerkesztés"
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteNav(mainItem.id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Törlés"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Child Submenu Tree */}
                    {subItems.length > 0 && (
                      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="px-4 py-3 border-t space-y-2">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <ChevronRight size={12} style={{ color: cardHighlight }} /> Almenü Pontok ({subItems.length} db)
                        </div>

                        {subItems.map((subItem, subIdx) => (
                          <div
                            key={subItem.id}
                            style={{
                              borderColor: cardBorder,
                              borderLeftColor: cardHighlight,
                              backgroundColor: subItem.isActive ? inputBg : cardBg,
                            }}
                            className={`ml-4 pl-4 border-l-2 py-2 px-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-all ${
                              subItem.isActive ? '' : 'opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cardHighlight }} />
                              <div className="min-w-0">
                                <span style={{ color: textColor }} className="text-xs font-bold">{subItem.label}</span>
                                <span className="text-[11px] font-mono text-gray-400 ml-2">#{subItem.page}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Active Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleNavActive(subItem.id)}
                                className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  subItem.isActive
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                    : 'bg-gray-800/40 border-gray-700 text-gray-400'
                                }`}
                              >
                                {subItem.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                              </button>

                              {/* Up/Down */}
                              <button
                                type="button"
                                disabled={subIdx === 0}
                                onClick={() => handleMoveNav(subItem.id, 'up')}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="p-1.5 border rounded-lg disabled:opacity-30 transition-colors hover:opacity-80"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={subIdx === subItems.length - 1}
                                onClick={() => handleMoveNav(subItem.id, 'down')}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="p-1.5 border rounded-lg disabled:opacity-30 transition-colors hover:opacity-80"
                              >
                                <ArrowDown size={12} />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditNavModal(subItem)}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="p-1.5 border rounded-lg hover:opacity-80 transition-colors"
                              >
                                <Edit3 size={13} />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteNav(subItem.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: CALCULATOR PRICING CONFIGURATOR */}
      {activeTab === 'calculators' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl">
          <div>
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <Calculator size={20} style={{ color: cardHighlight }} /> Kalkulátor Anyag- és Munkadíj Egységárak
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Az itt megadott alapértelmezett egységárak és szorzók alapján számítja ki a rendszer az anyagköltségeket a Számítások &amp; Kalkulátorok oldalon.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
              <label className="text-xs font-bold text-gray-400 block">C20/25 Transzportbeton Egységár (Ft / m³)</label>
              <input
                type="number"
                value={calcConfig.concretePricePerM3}
                onChange={(e) => setCalcConfig({ ...calcConfig, concretePricePerM3: Number(e.target.value) })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">Alapértelmezett: 32,000 Ft / m³</span>
            </div>

            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
              <label className="text-xs font-bold text-gray-400 block">Falazóhabarcs Egységár (Ft / m²)</label>
              <input
                type="number"
                value={calcConfig.masonryMortarPricePerM2}
                onChange={(e) => setCalcConfig({ ...calcConfig, masonryMortarPricePerM2: Number(e.target.value) })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">Alapértelmezett: 4,500 Ft / m²</span>
            </div>

            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
              <label className="text-xs font-bold text-gray-400 block">Homlokzati Hőszigetelés Egységár (Ft / m²)</label>
              <input
                type="number"
                value={calcConfig.insulationPricePerM2}
                onChange={(e) => setCalcConfig({ ...calcConfig, insulationPricePerM2: Number(e.target.value) })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">Alapértelmezett: 6,800 Ft / m²</span>
            </div>

            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
              <label className="text-xs font-bold text-gray-400 block">Csemperagasztó Egységár (Ft / kg)</label>
              <input
                type="number"
                value={calcConfig.tilingAdhesivePricePerKg}
                onChange={(e) => setCalcConfig({ ...calcConfig, tilingAdhesivePricePerKg: Number(e.target.value) })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">Alapértelmezett: 350 Ft / kg</span>
            </div>

            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
              <label className="text-xs font-bold text-gray-400 block">Gipszkarton Tábla Egységár (Ft / m²)</label>
              <input
                type="number"
                value={calcConfig.drywallBoardPricePerM2}
                onChange={(e) => setCalcConfig({ ...calcConfig, drywallBoardPricePerM2: Number(e.target.value) })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">Alapértelmezett: 2,200 Ft / m²</span>
            </div>

            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
              <label className="text-xs font-bold text-gray-400 block">Tetőcserép Egységár (Ft / m²)</label>
              <input
                type="number"
                value={calcConfig.roofingTilePricePerM2}
                onChange={(e) => setCalcConfig({ ...calcConfig, roofingTilePricePerM2: Number(e.target.value) })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">Alapértelmezett: 5,400 Ft / m²</span>
            </div>

            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
              <label className="text-xs font-bold text-gray-400 block">Munkadíj Becslési Szorzó</label>
              <input
                type="number"
                step="0.05"
                value={calcConfig.laborCostMultiplier}
                onChange={(e) => setCalcConfig({ ...calcConfig, laborCostMultiplier: Number(e.target.value) })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">pl. 1.25 = anyagköltség + 25% munkadíj</span>
            </div>

            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
              <label className="text-xs font-bold text-gray-400 block">ÁFA Kulcs (%)</label>
              <input
                type="number"
                value={calcConfig.vatRatePercent}
                onChange={(e) => setCalcConfig({ ...calcConfig, vatRatePercent: Number(e.target.value) })}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
              />
              <span className="text-[11px] text-gray-400">Alapértelmezett: 27 %</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: LEGAL DOCUMENTS WYSIWYG SECTION EDITOR */}
      {activeTab === 'legal' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl">
          <div style={{ borderColor: cardBorder }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h2 style={{ color: textColor }} className="text-lg font-bold flex items-center gap-2">
                <Shield size={20} style={{ color: cardHighlight }} /> Jogi Szövegek &amp; Szabályzatok Szerkesztője
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Szerkeszd élőben az Adatvédelmi Tájékoztató (GDPR), az ÁSZF és a Süti Szabályzat szekcióit, törzsszövegeit és felsorolási pontjait.
              </p>
            </div>
          </div>

          {/* Subtab Selector */}
          <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="flex items-center gap-2 p-1.5 rounded-2xl border overflow-x-auto">
            {[
              { key: 'privacyPolicy', label: '🔒 Adatvédelem (GDPR)' },
              { key: 'terms', label: '📄 ÁSZF Szerződési Feltételek' },
              { key: 'cookiePolicy', label: '🍪 Süti (Cookie) Szabályzat' },
            ].map((sub) => (
              <button
                key={sub.key}
                type="button"
                onClick={() => setActiveLegalDocTab(sub.key as typeof activeLegalDocTab)}
                style={
                  activeLegalDocTab === sub.key
                    ? { backgroundColor: cardHighlight, color: '#000000' }
                    : { backgroundColor: cardBg, color: textColor }
                }
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer hover:opacity-90"
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* DOCUMENT HEADER METADATA */}
          <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 rounded-2xl border space-y-4 shadow-sm">
            <h3 style={{ color: cardHighlight }} className="text-xs font-bold uppercase tracking-wider">
              Dokumentum Fejléc Adatok ({activeLegalDocTab})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="font-bold text-gray-400 block mb-1">Címsor *</label>
                <input
                  type="text"
                  value={legalDocs[activeLegalDocTab].title}
                  onChange={(e) =>
                    setLegalDocs({
                      ...legalDocs,
                      [activeLegalDocTab]: { ...legalDocs[activeLegalDocTab], title: e.target.value },
                    })
                  }
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1">Verziószám *</label>
                <input
                  type="text"
                  value={legalDocs[activeLegalDocTab].version}
                  onChange={(e) =>
                    setLegalDocs({
                      ...legalDocs,
                      [activeLegalDocTab]: { ...legalDocs[activeLegalDocTab], version: e.target.value },
                    })
                  }
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTIONS EDITOR FOR PRIVACY POLICY & TERMS */}
          {(activeLegalDocTab === 'privacyPolicy' || activeLegalDocTab === 'terms') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 style={{ color: textColor }} className="text-sm font-bold flex items-center gap-2">
                  <FileText size={16} style={{ color: cardHighlight }} /> Szekciók &amp; Törzsszövegek ({legalDocs[activeLegalDocTab].sections.length} db szekció)
                </h3>
                <button
                  type="button"
                  onClick={() => handleAddLegalSection(activeLegalDocTab)}
                  style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }}
                  className="px-3.5 py-1.5 border text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <Plus size={14} /> Új Szekció Hozzáadása
                </button>
              </div>

              <div className="space-y-4">
                {legalDocs[activeLegalDocTab].sections.map((sec, idx) => (
                  <div key={idx} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="border rounded-2xl p-5 space-y-4 shadow-sm hover:opacity-95 transition-colors">
                    <div style={{ borderColor: cardBorder }} className="flex items-center justify-between gap-3 border-b pb-3">
                      <span style={{ color: cardHighlight }} className="text-xs font-mono font-bold">#{idx + 1}. Szekció</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveLegalSection(activeLegalDocTab, idx, 'up')}
                          disabled={idx === 0}
                          style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                          className="p-1.5 border disabled:opacity-40 rounded-lg text-xs hover:opacity-80"
                          title="Mozgatás Fel"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveLegalSection(activeLegalDocTab, idx, 'down')}
                          disabled={idx === legalDocs[activeLegalDocTab].sections.length - 1}
                          style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                          className="p-1.5 border disabled:opacity-40 rounded-lg text-xs hover:opacity-80"
                          title="Mozgatás Le"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLegalSection(activeLegalDocTab, idx)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs ml-2 cursor-pointer"
                          title="Szekció Törlése"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="font-bold text-gray-400 block mb-1">Szekció Címsor (Alcím)</label>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => handleUpdateLegalSection(activeLegalDocTab, idx, 'title', e.target.value)}
                          style={fieldStyle}
                          className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-400 block mb-1">Szekció Törzsszövege (RichText / Bekezdések)</label>
                        <textarea
                          rows={4}
                          value={sec.text}
                          onChange={(e) => handleUpdateLegalSection(activeLegalDocTab, idx, 'text', e.target.value)}
                          style={fieldStyle}
                          className="w-full border rounded-xl p-3 focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-gray-400 block mb-1">Felsorolási Pontok (Soronként 1 elem, opcionális)</label>
                        <textarea
                          rows={3}
                          value={(sec as any).list ? (sec as any).list.join('\n') : ''}
                          onChange={(e) =>
                            handleUpdateLegalSection(
                              activeLegalDocTab,
                              idx,
                              'list',
                              e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="pl. 1. Pontos név és címtárolás&#10;2. Email cím titkosított hash formátumban"
                          style={fieldStyle}
                          className="w-full border rounded-xl p-3 font-mono text-[11px] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: ABOUT PAGE SETTINGS */}
      {activeTab === 'about' && (
        <div className="space-y-8 max-w-4xl">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <Info size={20} style={{ color: cardHighlight }} /> 1. Rólunk Fejléc &amp; Hero Szövegek
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Hero Kiemelt Címke (Tagline)</label>
                <input
                  type="text"
                  value={aboutSettings.heroTagline}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, heroTagline: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Hero Főcím</label>
                <input
                  type="text"
                  value={aboutSettings.heroTitle}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, heroTitle: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Hero Alcím / Bevezető Szöveg</label>
                <textarea
                  rows={3}
                  value={aboutSettings.heroDescription}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, heroDescription: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <Building size={20} style={{ color: cardHighlight }} /> 2. Bemutatkozás Szövegek
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Bemutatkozás Címsor</label>
                <input
                  type="text"
                  value={aboutSettings.introTitle}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, introTitle: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Bemutatkozás Leírása</label>
                <textarea
                  rows={3}
                  value={aboutSettings.introDescription}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, introDescription: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <Target size={20} style={{ color: cardHighlight }} /> 3. Küldetés &amp; Vízió (Jövőkép)
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 block">Küldetés Címsor</label>
                  <input
                    type="text"
                    value={aboutSettings.missionTitle}
                    onChange={(e) => setAboutSettings({ ...aboutSettings, missionTitle: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2 text-sm font-bold"
                  />
                  <label className="text-xs font-bold text-gray-400 block pt-1">Küldetés Leírása</label>
                  <textarea
                    rows={4}
                    value={aboutSettings.missionDescription}
                    onChange={(e) => setAboutSettings({ ...aboutSettings, missionDescription: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl p-3 text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 block">Vízió (Jövőkép) Címsor</label>
                  <input
                    type="text"
                    value={aboutSettings.visionTitle}
                    onChange={(e) => setAboutSettings({ ...aboutSettings, visionTitle: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2 text-sm font-bold"
                  />
                  <label className="text-xs font-bold text-gray-400 block pt-1">Vízió Leírása</label>
                  <textarea
                    rows={4}
                    value={aboutSettings.visionDescription}
                    onChange={(e) => setAboutSettings({ ...aboutSettings, visionDescription: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl p-3 text-sm leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <ShieldCheck size={20} style={{ color: cardHighlight }} /> 4. Alapértékek &amp; Pillérek
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Értékek Címsor</label>
                <input
                  type="text"
                  value={aboutSettings.valuesTitle}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, valuesTitle: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Értékek Bevezető Leírása</label>
                <textarea
                  rows={2}
                  value={aboutSettings.valuesDescription}
                  onChange={(e) => setAboutSettings({ ...aboutSettings, valuesDescription: e.target.value })}
                  style={fieldStyle}
                  className="w-full border rounded-xl p-3 text-sm leading-relaxed"
                />
              </div>

              <div style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-4">
                <h3 style={{ color: cardHighlight }} className="text-sm font-extrabold">Három Fő Pillér</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
                    <label style={{ color: textColor }} className="text-xs font-bold block">1. Pillér Címe</label>
                    <input
                      type="text"
                      value={aboutSettings.pillar1Title}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, pillar1Title: e.target.value })}
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                    <label className="text-xs font-bold text-gray-400 block pt-1">1. Pillér Leírása</label>
                    <textarea
                      rows={3}
                      value={aboutSettings.pillar1Desc}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, pillar1Desc: e.target.value })}
                      style={fieldStyle}
                      className="w-full border rounded-xl p-2 text-xs leading-relaxed"
                    />
                  </div>

                  <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
                    <label style={{ color: textColor }} className="text-xs font-bold block">2. Pillér Címe</label>
                    <input
                      type="text"
                      value={aboutSettings.pillar2Title}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, pillar2Title: e.target.value })}
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                    <label className="text-xs font-bold text-gray-400 block pt-1">2. Pillér Leírása</label>
                    <textarea
                      rows={3}
                      value={aboutSettings.pillar2Desc}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, pillar2Desc: e.target.value })}
                      style={fieldStyle}
                      className="w-full border rounded-xl p-2 text-xs leading-relaxed"
                    />
                  </div>

                  <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
                    <label style={{ color: textColor }} className="text-xs font-bold block">3. Pillér Címe</label>
                    <input
                      type="text"
                      value={aboutSettings.pillar3Title}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, pillar3Title: e.target.value })}
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                    <label className="text-xs font-bold text-gray-400 block pt-1">3. Pillér Leírása</label>
                    <textarea
                      rows={3}
                      value={aboutSettings.pillar3Desc}
                      onChange={(e) => setAboutSettings({ ...aboutSettings, pillar3Desc: e.target.value })}
                      style={fieldStyle}
                      className="w-full border rounded-xl p-2 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ADS & MONETIZATION */}
      {activeTab === 'ads' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl">
          <div>
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <Megaphone size={20} style={{ color: cardHighlight }} /> Reklámok &amp; Partneri Ajánlatok Globális Kapcsolói
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Engedélyezd vagy tiltsd le a weboldalon megjelenő reklám- és affiliate felületeket.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                key: 'showTopBanners',
                title: 'Felső Kiemelt Reklámsáv (Top Banner)',
                desc: 'A főoldal tetején megjelenő széles partneri reklámsáv engedélyezése.',
                value: settings.showTopBanners,
              },
              {
                key: 'showSidebarAds',
                title: 'Oldalsávos Hirdetések (Sidebar Ads)',
                desc: 'A cikkek és kategóriák oldalsávjában megjelenő szponzori kártyák.',
                value: settings.showSidebarAds,
              },
              {
                key: 'showAffiliateOffers',
                title: 'Partneri & Affiliate Ajánlatok az Eszközök alatt',
                desc: 'Az Eszközök adatlapjának alján található vásárlási hivatkozások.',
                value: settings.showAffiliateOffers,
              },
            ].map((adOption) => (
              <div
                key={adOption.key}
                style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                className="p-5 border rounded-2xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h4 style={{ color: textColor }} className="text-sm font-bold">{adOption.title}</h4>
                  <p className="text-xs text-gray-400">{adOption.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      [adOption.key]: !prev[adOption.key as keyof SiteSettings],
                    }))
                  }
                  style={adOption.value ? { backgroundColor: cardHighlight } : { backgroundColor: '#374151' }}
                  className="w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                      adOption.value ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {onNavigate && (
            <div style={{ borderColor: cardBorder }} className="pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-gray-400">Egyedi reklámkampányok kezelése az Admin Ads menüben</span>
              <button
                type="button"
                onClick={() => onNavigate('ads')}
                style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }}
                className="px-4 py-2 border font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer"
              >
                Ugrás a Reklámkezelőbe
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SYSTEM & SECURITY */}
      {activeTab === 'system' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl">
          <div>
            <h2 style={{ color: textColor, borderColor: cardBorder }} className="text-lg font-bold border-b pb-3 flex items-center gap-2">
              <ShieldAlert size={20} style={{ color: cardHighlight }} /> Rendszer &amp; Biztonsági Beállítások
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Karbantartási mód, látogatói korlátozások és regisztráció kezelése.
            </p>
          </div>

          <div className="space-y-6">
            {/* Maintenance mode */}
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-400">Karbantartási Mód (Maintenance Mode)</h4>
                  <p className="text-xs text-amber-200/80">Ha be van kapcsolva, a látogatóknak karbantartási üzenet jelenik meg.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    settings.maintenanceMode ? 'bg-amber-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                      settings.maintenanceMode ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {settings.maintenanceMode && (
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Karbantartási Üzenet</label>
                  <textarea
                    rows={2}
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    style={fieldStyle}
                    className="w-full border rounded-xl p-3 text-xs focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Registration toggle */}
            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 border rounded-2xl flex items-center justify-between">
              <div>
                <h4 style={{ color: textColor }} className="text-sm font-bold">Új Felhasználók Regisztrációjának Engedélyezése</h4>
                <p className="text-xs text-gray-400">Ha kikapcsolod, az új regisztrációk ideiglenesen fel vannak függesztve.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                style={settings.allowRegistration ? { backgroundColor: cardHighlight } : { backgroundColor: '#374151' }}
                className="w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                    settings.allowRegistration ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Auth requirement for detailed glossary */}
            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 border rounded-2xl flex items-center justify-between">
              <div>
                <h4 style={{ color: textColor }} className="text-sm font-bold">Részletes Fogalomtár Regisztrációhoz Kötése</h4>
                <p className="text-xs text-gray-400">A fogalmak részletes videói, leírásai és diáit csak a bejelentkezett userek láthatják.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, requireAuthForDetailedGlossary: !settings.requireAuthForDetailedGlossary })}
                style={settings.requireAuthForDetailedGlossary ? { backgroundColor: cardHighlight } : { backgroundColor: '#374151' }}
                className="w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                    settings.requireAuthForDetailedGlossary ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ICONS, PWA & SOCIAL SHARING */}
      {activeTab === 'icons_sharing' && (
        <div className="space-y-8">
          {/* Header Card & Audit Action */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 style={{ color: textColor }} className="text-lg font-bold flex items-center gap-2">
                  <Share2 size={22} style={{ color: cardHighlight }} /> Webhely ikonok, gyorshívó és megosztási beállítások
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Favicon (.ico, SVG, PNG), Apple Touch Icon, Android/PWA ikonok, Open Graph megosztási kép és metaadatok, valamint a PWA manifest központi testreszabása.
                </p>
              </div>
              <button
                type="button"
                onClick={runIconAudit}
                style={{ backgroundColor: `${cardHighlight}20`, borderColor: cardHighlight, color: cardHighlight }}
                className="px-4 py-2.5 border rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all hover:opacity-90 cursor-pointer shadow-sm"
              >
                <ShieldCheck size={16} /> Ikonok és megosztási beállítások ellenőrizése
              </button>
            </div>
          </div>

          {/* SZEKCIÓ 1: BÖNGÉSZŐ- ÉS GYORSHÍVÓIKONOK */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h3 style={{ color: cardHighlight, borderColor: cardBorder }} className="text-base font-extrabold border-b pb-3 flex items-center gap-2">
              <AppWindow size={20} /> 1. Böngésző- és gyorshívóikonok (Favicon &amp; PWA Icons)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  key: 'faviconIcoUrl' as const,
                  label: 'Favicon (.ico)',
                  recommended: '16×16 és 32×32 px ICO fájl',
                  accept: '.ico,image/x-icon,image/vnd.microsoft.icon',
                  recW: 32,
                  recH: 32,
                  fallback: '/favicon.ico',
                },
                {
                  key: 'faviconSvgUrl' as const,
                  label: 'SVG Favicon (.svg)',
                  recommended: 'Vektoros .svg fájl',
                  accept: '.svg,image/svg+xml',
                  recW: 0,
                  recH: 0,
                  fallback: '',
                },
                {
                  key: 'faviconPngUrl' as const,
                  label: 'PNG Favicon (.png)',
                  recommended: '32×32 px PNG',
                  accept: '.png,image/png',
                  recW: 32,
                  recH: 32,
                  fallback: '/logo.png',
                },
                {
                  key: 'pwaIcon192Url' as const,
                  label: 'Android / PWA ikon',
                  recommended: '192×192 px PNG',
                  accept: '.png,image/png',
                  recW: 192,
                  recH: 192,
                  fallback: '/logo.png',
                },
                {
                  key: 'pwaIcon512Url' as const,
                  label: 'Nagy PWA ikon',
                  recommended: '512×512 px PNG',
                  accept: '.png,image/png',
                  recW: 512,
                  recH: 512,
                  fallback: '/logo.png',
                },
                {
                  key: 'appleTouchIconUrl' as const,
                  label: 'Apple Touch Icon',
                  recommended: '180×180 px PNG',
                  accept: '.png,image/png',
                  recW: 180,
                  recH: 180,
                  fallback: '/logo.png',
                },
              ].map((item) => {
                const currentUrl = settings[item.key] || item.fallback;
                const stats = iconStats[item.key];
                return (
                  <div
                    key={item.key}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                    className="p-5 border rounded-2xl space-y-4 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label style={{ color: textColor }} className="text-xs font-extrabold uppercase tracking-wide">
                          {item.label}
                        </label>
                        <span className="text-[10px] font-mono opacity-60 bg-black/30 px-2 py-0.5 rounded border border-white/10">
                          {item.recommended}
                        </span>
                      </div>

                      {/* Image Dropzone & File Input */}
                      <label
                        style={{ borderColor: cardBorder, backgroundColor: adjustColorBrightness(inputBg, -4) }}
                        className="p-4 border-2 border-dashed rounded-xl text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 transition-all"
                      >
                        <input
                          type="file"
                          accept={item.accept}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              processIconFile(item.key, e.target.files[0], item.recW, item.recH);
                            }
                          }}
                        />
                        <Upload size={18} style={{ color: cardHighlight }} />
                        <span className="text-[11px] font-bold text-gray-300">Fájl kiválasztása vagy drag &amp; drop</span>
                        <span className="text-[10px] text-gray-500">Kattints ide a feltöltéshez</span>
                      </label>

                      {/* Manual URL Text Field */}
                      <div>
                        <input
                          type="text"
                          value={settings[item.key] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = { ...settings, [item.key]: val, iconsUpdatedAt: Date.now() };
                            setSettings(updated);
                            applySiteSettings(updated);
                          }}
                          placeholder={`URL vagy elérési út (${item.fallback || 'opcionális'})`}
                          style={{ backgroundColor: adjustColorBrightness(inputBg, -6), borderColor: cardBorder, color: inputTextColor }}
                          className="w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                        />
                      </div>

                      {/* Dimension Warning Banner */}
                      {stats?.warning && (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-[11px] font-bold flex items-center gap-1.5 leading-tight">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>{stats.warning}</span>
                        </div>
                      )}
                    </div>

                    {/* Preview & Status */}
                    <div style={{ borderColor: cardBorder }} className="pt-3 border-t flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/40 border rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden shadow" style={{ borderColor: cardBorder }}>
                          {currentUrl ? (
                            <img
                              src={currentUrl}
                              alt={item.label}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                            />
                          ) : (
                            <ImageIcon size={18} className="text-gray-600" />
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] font-bold block" style={{ color: textColor }}>
                            {settings[item.key] ? 'Egyedi ikon aktív' : 'Alapértelmezett'}
                          </span>
                          {stats?.width && stats?.height ? (
                            <span className="text-[10px] font-mono text-emerald-400 block">
                              {stats.width} × {stats.height} px
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 block">Formátum: {item.accept.split(',')[0]}</span>
                          )}
                        </div>
                      </div>

                      {settings[item.key] && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...settings, [item.key]: '', iconsUpdatedAt: Date.now() };
                            setSettings(updated);
                            applySiteSettings(updated);
                            setIconStats((prev) => {
                              const next = { ...prev };
                              delete next[item.key];
                              return next;
                            });
                          }}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Törlés & Alapértelmezett"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SZEKCIÓ 2: KÖZÖSSÉGI MEGOSZTÁSI KÉP (OPEN GRAPH) */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h3 style={{ color: cardHighlight, borderColor: cardBorder }} className="text-base font-extrabold border-b pb-3 flex items-center gap-2">
              <Share2 size={20} /> 2. Közösségi megosztási kép &amp; Open Graph Metaadatok
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OG Image Uploader & Preview */}
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 border rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <label style={{ color: textColor }} className="text-xs font-extrabold uppercase tracking-wide">
                    Alapértelmezett Megosztási Kép (Global OG Image)
                  </label>
                  <span className="text-[10px] font-mono opacity-60 bg-black/30 px-2 py-0.5 rounded border border-white/10">
                    Ajánlott: 1200×630 px (JPG, PNG, WEBP)
                  </span>
                </div>

                <label
                  style={{ borderColor: cardBorder, backgroundColor: adjustColorBrightness(inputBg, -4) }}
                  className="p-5 border-2 border-dashed rounded-xl text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 transition-all"
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processOgImageFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload size={22} style={{ color: cardHighlight }} />
                  <span className="text-xs font-bold text-gray-300">Megosztási kép kiválasztása vagy drag &amp; drop</span>
                  <span className="text-[11px] text-gray-500">Ez a kép jelenik meg Facebook, LinkedIn és Viber megosztáskor</span>
                </label>

                <div>
                  <input
                    type="text"
                    value={settings.ogImageUrl || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = { ...settings, ogImageUrl: val, iconsUpdatedAt: Date.now() };
                      setSettings(updated);
                      applySiteSettings(updated);
                    }}
                    placeholder="URL vagy hivatkozás megadása (/logo.png)"
                    style={{ backgroundColor: adjustColorBrightness(inputBg, -6), borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                  />
                </div>

                {ogImageStats?.warning && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{ogImageStats.warning}</span>
                  </div>
                )}

                {/* Large Preview */}
                <div style={{ borderColor: cardBorder }} className="pt-3 border-t space-y-2">
                  <span className="text-[11px] font-bold block" style={{ color: textColor }}>
                    Élő Open Graph Kép Előnézet:
                  </span>
                  <div className="w-full h-44 bg-black/50 border rounded-xl overflow-hidden relative flex items-center justify-center" style={{ borderColor: cardBorder }}>
                    <img
                      src={settings.ogImageUrl || settings.logoUrl || '/logo.png'}
                      alt="Open Graph Előnézet"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                    />
                    {settings.ogImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...settings, ogImageUrl: '', iconsUpdatedAt: Date.now() };
                          setSettings(updated);
                          applySiteSettings(updated);
                          setOgImageStats({});
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-red-500/80 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={14} /> Törlés
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* OG Text Inputs */}
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 border rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <label style={{ color: textColor }} className="text-xs font-extrabold uppercase tracking-wide block mb-1.5">
                      Open Graph Cím (og:title)
                    </label>
                    <input
                      type="text"
                      value={settings.ogTitle ?? 'ÉpítőTudás'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { ...settings, ogTitle: val };
                        setSettings(updated);
                        applySiteSettings(updated);
                      }}
                      style={fieldStyle}
                      className="w-full border rounded-xl px-4 py-3 text-xs focus:outline-none"
                      placeholder="ÉpítőTudás"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Alapértelmezett érték: „ÉpítőTudás”</p>
                  </div>

                  <div>
                    <label style={{ color: textColor }} className="text-xs font-extrabold uppercase tracking-wide block mb-1.5">
                      Open Graph Leírás (og:description)
                    </label>
                    <textarea
                      rows={4}
                      value={settings.ogDescription ?? 'Építőipari tudásbázis szakembereknek, tanulóknak és kivitelezőknek.'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = { ...settings, ogDescription: val };
                        setSettings(updated);
                        applySiteSettings(updated);
                      }}
                      style={fieldStyle}
                      className="w-full border rounded-xl px-4 py-3 text-xs focus:outline-none resize-none"
                      placeholder="Építőipari tudásbázis szakembereknek, tanulóknak és kivitelezőknek."
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Ez a rövid leírás jelenik meg a közösségi oldalakra beillesztett linkek alatt.</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 space-y-1">
                  <span className="font-bold block">💡 Információ:</span>
                  <p className="leading-relaxed opacity-90">
                    Ezek a beállítások érvényesülnek globális tartalmaknál és főoldali megosztáskor, amennyiben egy egyedi cikkhez vagy témakörhöz nincs külön borítókép megadva.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SZEKCIÓ 3: PWA-MEGJELENÉS */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h3 style={{ color: cardHighlight, borderColor: cardBorder }} className="text-base font-extrabold border-b pb-3 flex items-center gap-2">
              <Smartphone size={20} /> 3. PWA-megjelenés (Progressive Web App Manifest)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label style={{ color: textColor }} className="text-xs font-extrabold uppercase tracking-wide block mb-1.5">
                  Webhely neve
                </label>
                <input
                  type="text"
                  value={settings.pwaAppName ?? 'ÉpítőTudás'}
                  onChange={(e) => {
                    const updated = { ...settings, pwaAppName: e.target.value };
                    setSettings(updated);
                    applySiteSettings(updated);
                  }}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  placeholder="ÉpítőTudás"
                />
              </div>

              <div>
                <label style={{ color: textColor }} className="text-xs font-extrabold uppercase tracking-wide block mb-1.5">
                  Rövid név (Kezdőképernyő)
                </label>
                <input
                  type="text"
                  value={settings.pwaShortName ?? 'ÉpítőTudás'}
                  onChange={(e) => {
                    const updated = { ...settings, pwaShortName: e.target.value };
                    setSettings(updated);
                    applySiteSettings(updated);
                  }}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                  placeholder="ÉpítőTudás"
                />
              </div>

              <div>
                <label style={{ color: textColor }} className="text-xs font-extrabold uppercase tracking-wide block mb-1.5">
                  Téma színe (Theme Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.pwaThemeColor || '#f59e0b'}
                    onChange={(e) => {
                      const updated = { ...settings, pwaThemeColor: e.target.value };
                      setSettings(updated);
                      applySiteSettings(updated);
                    }}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.pwaThemeColor || '#f59e0b'}
                    onChange={(e) => {
                      const updated = { ...settings, pwaThemeColor: e.target.value };
                      setSettings(updated);
                      applySiteSettings(updated);
                    }}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label style={{ color: textColor }} className="text-xs font-extrabold uppercase tracking-wide block mb-1.5">
                  Háttérszín (Background Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.pwaBackgroundColor || '#ffffff'}
                    onChange={(e) => {
                      const updated = { ...settings, pwaBackgroundColor: e.target.value };
                      setSettings(updated);
                      applySiteSettings(updated);
                    }}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={settings.pwaBackgroundColor || '#ffffff'}
                    onChange={(e) => {
                      const updated = { ...settings, pwaBackgroundColor: e.target.value };
                      setSettings(updated);
                      applySiteSettings(updated);
                    }}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SZEKCIÓ 4: MENTÉS ÉS ÁLLAPOT (STATUS CHECKLIST) */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 space-y-6 shadow-xl">
            <h3 style={{ color: cardHighlight, borderColor: cardBorder }} className="text-base font-extrabold border-b pb-3 flex items-center gap-2">
              <ShieldCheck size={20} /> 4. Konfigurációs Állapot ellenőrzése
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status 1: Favicon */}
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Favicon</span>
                {settings.faviconIcoUrl || settings.faviconPngUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-extrabold">
                    <CheckCircle2 size={13} /> Beállítva
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-extrabold">
                    <AlertTriangle size={13} /> Hiányzik
                  </span>
                )}
              </div>

              {/* Status 2: Apple Icon */}
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Apple Ikon</span>
                {settings.appleTouchIconUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-extrabold">
                    <CheckCircle2 size={13} /> Beállítva
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-extrabold">
                    <AlertTriangle size={13} /> Hiányzik
                  </span>
                )}
              </div>

              {/* Status 3: PWA Icons */}
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase text-gray-400 block">PWA Ikonok</span>
                {settings.pwaIcon192Url && settings.pwaIcon512Url ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-extrabold">
                    <CheckCircle2 size={13} /> Rendben
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-extrabold">
                    <AlertTriangle size={13} /> Hiányos
                  </span>
                )}
              </div>

              {/* Status 4: OG Image */}
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Megosztási Kép</span>
                {settings.ogImageUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-extrabold">
                    <CheckCircle2 size={13} /> Beállítva
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-extrabold">
                    <AlertTriangle size={13} /> Hiányzik
                  </span>
                )}
              </div>

              {/* Status 5: Manifest */}
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2 text-center">
                <span className="text-[11px] font-bold uppercase text-gray-400 block">Web App Manifest</span>
                {settings.pwaAppName && settings.pwaShortName && settings.pwaThemeColor ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-extrabold">
                    <CheckCircle2 size={13} /> Rendben
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-extrabold">
                    <AlertTriangle size={13} /> Hibás / Hiányos
                  </span>
                )}
              </div>
            </div>

            <div style={{ borderColor: cardBorder }} className="pt-4 border-t flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={runIconAudit}
                style={{ backgroundColor: `${cardHighlight}20`, borderColor: cardHighlight, color: cardHighlight }}
                className="px-6 py-3 border rounded-xl text-xs font-extrabold flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                <ShieldCheck size={16} /> Ikonok és megosztási beállítások ellenőrizése
              </button>

              <button
                type="button"
                onClick={handleSave}
                style={{ backgroundColor: cardHighlight, color: '#000000' }}
                className="px-8 py-3 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:opacity-90 shrink-0"
              >
                <Save size={18} /> Mentés &amp; Alkalmazás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Navigation Item Modal */}
      {showNavModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-fade-in">
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-4">
              <h3 style={{ color: textColor }} className="text-base font-extrabold flex items-center gap-2">
                <Compass size={18} style={{ color: cardHighlight }} />
                {editingNavItem ? 'Menüpont Szerkesztése' : 'Új Menü- vagy Almenüpont Hozzáadása'}
              </h3>
              <button
                type="button"
                onClick={() => setShowNavModal(false)}
                style={{ backgroundColor: inputBg, color: textColor }}
                className="text-xs font-bold px-2 py-1 rounded-lg hover:opacity-80"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNavForm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">
                  Menüpont Megnevezése (Megjelenő Felirat) *
                </label>
                <input
                  type="text"
                  required
                  value={navFormLabel}
                  onChange={(e) => setNavFormLabel(e.target.value)}
                  placeholder="pl. Blog cikkek, Szakmai szótár..."
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">
                  Szülő Menüpont (Helyzet a Menüfa Struktúrában)
                </label>
                <select
                  value={navFormParentId || ''}
                  onChange={(e) => setNavFormParentId(e.target.value === '' ? null : e.target.value)}
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                >
                  <option value="">-- Gyökér Szintű Főmenü (Felső menüsor) --</option>
                  {navItems
                    .filter((item) => item.parentId === null && item.id !== editingNavItem?.id)
                    .map((main) => (
                      <option key={main.id} value={main.id}>
                        📌 {main.label} almenüje
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">
                  Cél Oldal / Útvonal Identifikátor (#page) *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={navFormPage}
                    onChange={(e) => setNavFormPage(e.target.value)}
                    placeholder="home, category, glossary, tool, paths, courses..."
                    style={fieldStyle}
                    className="w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none"
                  />

                  {/* Quick Preset Selector */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'home',
                      'tudastar',
                      'category',
                      'glossary',
                      'calculations',
                      'books',
                      'tool',
                      'software',
                      'valaszto',
                      'paths',
                      'courses',
                      'careers',
                      'about',
                      'partners',
                      'impressum',
                      'jogi',
                    ].map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setNavFormPage(p)}
                        style={
                          navFormPage === p
                            ? { backgroundColor: cardHighlight, color: '#000000', borderColor: cardHighlight }
                            : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
                        }
                        className="text-[10px] font-mono px-2 py-1 rounded-md border transition-all hover:opacity-90 font-bold"
                      >
                        #{p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">
                  Kiemelt Jelvény / Badge Szöveg (Opcionális)
                </label>
                <input
                  type="text"
                  value={navFormBadge}
                  onChange={(e) => setNavFormBadge(e.target.value)}
                  placeholder="pl. Új, Hot, Béta..."
                  style={fieldStyle}
                  className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                />
              </div>

              <div style={{ borderColor: cardBorder }} className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowNavModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold text-xs rounded-xl transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl transition-all shadow-lg"
                >
                  {editingNavItem ? 'Módosítások Mentése' : 'Menüpont Létrehozása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Icon Audit & Diagnostic Modal */}
      {showIconAuditModal && auditResults && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-4">
              <h3 style={{ color: textColor }} className="text-base font-extrabold flex items-center gap-2">
                <ShieldCheck size={20} style={{ color: cardHighlight }} />
                Ikonok és Megosztási Beállítások Diagnosztikája
              </h3>
              <button
                type="button"
                onClick={() => setShowIconAuditModal(false)}
                style={{ backgroundColor: inputBg, color: textColor }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg hover:opacity-80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Passed checks */}
              {auditResults.passed.length > 0 && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Megfelelően Beállított Elemek ({auditResults.passed.length} db):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-emerald-200">
                    {auditResults.passed.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {auditResults.warnings.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={16} /> Figyelmeztetések &amp; Nem Ajánlott Méretek ({auditResults.warnings.length} db):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-amber-200">
                    {auditResults.warnings.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing items */}
              {auditResults.missing.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={16} /> Hiányzó Elemek ({auditResults.missing.length} db):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-red-200">
                    {auditResults.missing.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dynamic Manifest JSON Preview */}
              <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5" style={{ color: cardHighlight }}>
                    <FileCode size={16} /> Generált Dinamikus Manifest (/site.webmanifest)
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">JSON kimenet</span>
                </div>
                <pre style={{ backgroundColor: adjustColorBrightness(inputBg, -6) }} className="p-3 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-white/10">
                  {JSON.stringify(generateManifestJson(settings), null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ borderColor: cardBorder }} className="flex items-center justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowIconAuditModal(false)}
                style={{ backgroundColor: cardHighlight, color: '#000000' }}
                className="px-6 py-2 text-xs font-extrabold rounded-xl cursor-pointer hover:opacity-90 shadow"
              >
                Rendben
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

