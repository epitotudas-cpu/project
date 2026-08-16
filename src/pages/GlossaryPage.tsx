import { useState, useMemo } from 'react';
import {
  Search, Home, ChevronRight, BookOpen, AlertCircle,
  Lock, ArrowRight, Clock, Tag, GraduationCap,
  ChevronDown, ChevronUp, LayoutList, LayoutGrid, FileText, Calculator, Library,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { useGlossary } from '../contexts/GlossaryContext';
import { useAuth } from '../contexts/AuthContext';
import { getTradeEducationalPathways } from '../services/glossaryService';
import type { GlossaryTermFromJson } from '../lib/glossaryJsonService';
import AuthPromptModal from '../components/AuthPromptModal';
import TermDetailModal from '../components/TermDetailModal';
import {
  useGlossaryCategorySettings,
  getDefaultCategoryIcon,
  type GlossaryCategorySettings,
} from '../services/glossaryCategorySettingsService';

interface GlossaryPageProps {
  onNavigate: (page: string) => void;
}

function getCategoryIcon(cat?: string | null, customSettings?: GlossaryCategorySettings): string {
  if (!cat) return '📚';
  const trimmed = cat.trim();

  const configuredItem = customSettings?.categoryItems?.[trimmed] || customSettings?.categoryItems?.[cat];
  if (configuredItem && configuredItem.enabled !== false && configuredItem.icon && configuredItem.icon.trim()) {
    const icon = configuredItem.icon.trim();
    if (icon === '🧱' && !trimmed.toLowerCase().includes('fal') && !trimmed.toLowerCase().includes('kőműves')) {
      return getDefaultCategoryIcon(trimmed);
    }
    return icon;
  }

  return getDefaultCategoryIcon(trimmed);
}

function renderCategoryIconElement(cat?: string | null, customSettings?: GlossaryCategorySettings) {
  if (!cat) return null;
  if (customSettings?.showCategoryIcons === false) return null;

  const trimmed = cat.trim();
  const configuredItem = customSettings?.categoryItems?.[trimmed] || customSettings?.categoryItems?.[cat];

  // 1. Check custom image URL from settings
  const customImg = configuredItem?.customImageUrl;
  if (customImg && customImg.trim()) {
    return (
      <img
        src={customImg.trim()}
        alt={trimmed}
        className="w-8 h-8 object-contain mb-2 inline-block rounded-md drop-shadow-xs"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // 2. Check if icon itself is an image URL / Data URL
  const rawIcon = configuredItem?.icon?.trim();

  if (rawIcon && (rawIcon.startsWith('http://') || rawIcon.startsWith('https://') || rawIcon.startsWith('data:image/'))) {
    return (
      <img
        src={rawIcon}
        alt={trimmed}
        className="w-8 h-8 object-contain mb-2 inline-block rounded-md drop-shadow-xs"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // 3. Fallback emoji string
  const iconStr = getCategoryIcon(cat, customSettings);
  return <div className="text-2xl mb-2 leading-none select-none">{iconStr}</div>;
}

/* ── Kategória gradiens (jobb oldali panel) ────────────────────── */
function getTermGradient(cat?: string | null): string {
  const map: Record<string, string> = {
    'Falazás':              'from-amber-400 to-orange-500',
    'Vasbeton':             'from-slate-400 to-slate-600',
    'Hőszigetelés':         'from-blue-400 to-cyan-500',
    'Hőszigetelek':         'from-blue-400 to-cyan-500',
    'Szigetelés':           'from-blue-400 to-cyan-500',
    'Vízszigetelés':        'from-sky-400 to-blue-600',
    'Alapozás':             'from-stone-400 to-stone-600',
    'Alapozás & Földmunka': 'from-stone-400 to-amber-600',
    'Szerkezetépítés':      'from-orange-400 to-red-500',
    'Gépek & Szerszámok':   'from-indigo-400 to-blue-600',
    'Anyagismeret':         'from-emerald-400 to-teal-600',
    'Tetőfedés':            'from-red-400 to-rose-600',
    'Zsaluzás':             'from-yellow-500 to-amber-600',
    'Gépészet':             'from-emerald-400 to-teal-600',
    'Villamos':             'from-yellow-300 to-yellow-500',
    'Páratechnika':         'from-cyan-400 to-teal-500',
    'Vakolás':              'from-orange-300 to-amber-500',
    'Burkolás':             'from-indigo-400 to-violet-600',
  };
  return (cat && map[cat]) ? map[cat] : 'from-accent/60 to-yellow-500/40';
}

/* ══════════════════════════════════════════════════════════════ */
export default function GlossaryPage({ onNavigate }: GlossaryPageProps) {
  const { user } = useAuth();
  const glossary = useGlossary();

  const categorySettings = useGlossaryCategorySettings();

  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const saved = sessionStorage.getItem('epitotudas_glossary_view_mode_v1');
      return saved === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const changeViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    try {
      sessionStorage.setItem('epitotudas_glossary_view_mode_v1', mode);
    } catch {
      // Storage unavailable fallback
    }
  };

  const [activeTab, setActiveTab] = useState<'technical' | 'industry'>('technical');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTermFromJson | null>(null);

  /* ── Handlers ─────────────────────────────────────────────── */
  function handleTermClick(item: GlossaryTermFromJson) {
    setSelectedTerm(item);
    if (user) setDetailModalOpen(true);
    else setAuthModalOpen(true);
  }

  function toggleExpand(id: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleTabChange(tab: 'technical' | 'industry') {
    setActiveTab(tab);
    setSelectedLetter(null);
    setSelectedCategory(null);
    setSearchQuery('');
  }

  /* ── Derived data ─────────────────────────────────────────── */
  const tabTerms = useMemo(() => {
    if (activeTab === 'industry')
      return glossary.terms.filter((t) => t.entry_type === 'industry_term');
    return glossary.terms.filter((t) => t.entry_type !== 'industry_term');
  }, [glossary.terms, activeTab]);

  const pathways = useMemo(
    () => (selectedTrade ? getTradeEducationalPathways(selectedTrade) : []),
    [selectedTrade],
  );

  const letters = useMemo(() => {
    const set = new Set<string>();
    tabTerms.forEach((t) => { const l = t.term.charAt(0).toUpperCase(); if (l) set.add(l); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'hu'));
  }, [tabTerms]);

  const filteredTerms = useMemo(() => {
    let res = tabTerms;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.official_term_name ?? '').toLowerCase().includes(q) ||
          (t.usage_example ?? '').toLowerCase().includes(q),
      );
    }
    if (selectedCategory && selectedCategory !== 'all')
      res = res.filter((t) => t.category === selectedCategory);
    if (selectedLetter)
      res = res.filter((t) => t.term.charAt(0).toUpperCase() === selectedLetter);
    return res.sort((a, b) => a.term.localeCompare(b.term, 'hu'));
  }, [tabTerms, selectedLetter, selectedCategory, searchQuery]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    const deletedList = categorySettings.deletedCategories || [];
    tabTerms.forEach((t) => {
      if (t.category) {
        const catName = t.category.trim();
        if (deletedList.includes(catName) || deletedList.includes(t.category)) return;

        const configItem = categorySettings.categoryItems?.[catName] || categorySettings.categoryItems?.[t.category];
        if (configItem && configItem.enabled === false) return;
        map.set(catName, (map.get(catName) ?? 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [tabTerms, categorySettings]);

  const latestTerms = useMemo(
    () => [...glossary.terms].slice(-6).reverse(),
    [glossary.terms],
  );

  const linkedOfficialTerm = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const jargon = glossary.terms.find(
      (t) =>
        t.entry_type === 'industry_term' &&
        t.term.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    if (!jargon?.official_term_name) return null;
    return (
      glossary.terms.find(
        (t) => t.term.toLowerCase() === jargon.official_term_name?.toLowerCase(),
      ) ?? null
    );
  }, [glossary.terms, searchQuery]);

  /* ── Loading / Empty states ───────────────────────────────── */
  if (glossary.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
          <p className="mt-4 text-gray-500 text-sm">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (glossary.terms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Nincs fogalom</h2>
          <p className="text-gray-600 text-sm">Az adatbázisban még nincsenek fogalmak. Kérlek az Admin Panelen adjon meg új fogalmakat.</p>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* ═══════════ HERO HEADER ═══════════ */}
      <div className="bg-primary border-b border-primary-700 pb-10 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Home size={13} /> Főoldal
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-300 font-medium">Fogalmak</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-accent/15 rounded-xl border border-accent/25">
                  <BookOpen size={26} className="text-accent" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Fogalmak</h1>
              </div>
              <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
                Szakmai Szótár &amp; Enciklopédia – Minden tudás, egy helyen.<br />
                Építőipari fogalmak és szakifejezések magyarázata az alapoktól a tetőszerkezetig.
              </p>
            </div>

            {/* Type tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 self-start md:self-auto">
              <button
                onClick={() => handleTabChange('technical')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'technical'
                    ? 'bg-accent text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📘 Szakmai Fogalomtár
              </button>
              <button
                onClick={() => handleTabChange('industry')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'industry'
                    ? 'bg-accent text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🗣 Zsargon Szótár
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={
                activeTab === 'technical'
                  ? 'Keress a fogalmak között… (pl. hőszigetelek, betonacél)'
                  : 'Keress a zsargon szavak között… (pl. Malter, Stafni, Trepedli)'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/95 border border-white/20 focus:border-accent rounded-2xl pl-12 pr-4 py-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm font-medium shadow-xl placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <SectionSubNav
        ariaLabel="Tudástár navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Cikkek',
            page: 'category',
            icon: <FileText size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Fogalomtár',
            page: 'glossary',
            icon: <BookOpen size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Számítások',
            page: 'calculations',
            icon: <Calculator size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Szakmai könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Linked term bridge */}
        {linkedOfficialTerm && (
          <div className="mb-8 p-5 bg-accent/10 border border-accent/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                🗣 Összekapcsolt Szakmai Találat
              </div>
              <h4 className="text-base font-bold text-gray-900">
                Kapcsolódó hivatalos műszaki fogalom:{' '}
                <strong className="text-accent underline">{linkedOfficialTerm.term}</strong>
              </h4>
              <p className="text-xs text-gray-600 mt-1">{linkedOfficialTerm.definition}</p>
            </div>
            <button
              onClick={() => { handleTabChange('technical'); setSearchQuery(linkedOfficialTerm.term); }}
              className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl hover:bg-yellow-400 self-start md:self-auto transition-colors"
            >
              Ugrás a Szakmai Fogalomhoz ➔
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ═══ FŐOSZLOP ═══ */}
          <div className="flex-1 min-w-0 space-y-8">
            {categorySettings.showFeaturedCategories && !searchQuery && categoryStats.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-gray-900">Kiemelt kategóriák</h2>
                  <span className="text-xs text-gray-400">Kattints a szűréshez</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {categoryStats.map(([cat, count]) => {
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(selectedCategory === cat ? null : cat);
                          setSelectedLetter(null);
                          setSearchQuery('');
                        }}
                        className={`group p-4 rounded-2xl border text-left transition-all duration-200 hover:shadow-md ${
                          selectedCategory === cat
                            ? 'bg-accent border-accent/40 shadow-md scale-[1.02]'
                            : 'bg-white border-gray-200 hover:border-accent/40 hover:scale-[1.01]'
                        }`}
                      >
                        {renderCategoryIconElement(cat, categorySettings)}
                        <div className={`text-sm font-black leading-tight ${selectedCategory === cat ? 'text-black' : 'text-gray-900'}`}>
                          {cat}
                        </div>
                        <div className={`text-xs mt-1 font-medium ${selectedCategory === cat ? 'text-black/60' : 'text-gray-500'}`}>
                          {count} cikk
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* A-Z betűnavigáció */}
            {!selectedCategory && !searchQuery && letters.length > 0 && (
              <section>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedLetter(null)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      selectedLetter === null
                        ? 'bg-accent text-black'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-accent/40'
                    }`}
                  >
                    Összes
                  </button>
                  {letters.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(letter)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${
                        selectedLetter === letter
                          ? 'bg-accent text-black shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-accent/40'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Aktív kategória chip */}
            {selectedCategory && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-500">Szűrve:</span>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-black text-xs font-black rounded-xl"
                >
                  {getCategoryIcon(selectedCategory, categorySettings)} {selectedCategory}
                  <span className="ml-1 opacity-60">✕</span>
                </button>
              </div>
            )}

            {/* Szakasz fejléc & Nézetváltó */}
            <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-gray-200/80 mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">
                  {selectedCategory
                    ? selectedCategory
                    : selectedLetter
                    ? `„${selectedLetter}" betűvel kezdődők`
                    : searchQuery
                    ? 'Keresési eredmények'
                    : 'Népszerű fogalmak'}
                </h2>
                <span className="text-xs text-gray-400 font-medium">
                  • {filteredTerms.length} fogalom
                </span>
                {searchQuery && (
                  <span className="text-xs text-gray-400 font-medium">
                    a „{searchQuery}" keresésre
                  </span>
                )}
              </div>

              {/* Nézetváltó segmented control */}
              <div className="inline-flex items-center p-1 bg-gray-100/90 rounded-xl border border-gray-200/80 shadow-xs">
                <button
                  type="button"
                  onClick={() => changeViewMode('list')}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80 font-black'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                  title="Lista nézet – részletes, soros elrendezés"
                >
                  <LayoutList size={16} className={viewMode === 'list' ? 'text-primary' : 'text-gray-400'} />
                  <span>Lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeViewMode('grid')}
                  className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80 font-black'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                  title="Csempe nézet – kompakt, pásztázható kártyák"
                >
                  <LayoutGrid size={16} className={viewMode === 'grid' ? 'text-primary' : 'text-gray-400'} />
                  <span>Csempék</span>
                </button>
              </div>
            </div>

            {/* ═══ FOGALOMKÁRTYÁK ═══ */}
            {filteredTerms.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm font-medium">
                  Nincs találat a kiválasztott szűrőknek megfelelően.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* ── CSEMPESZERŰ TANULÓ KÁRTYA NÉZET (TILES WITH IMAGE) ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 items-stretch">
                {filteredTerms.map((item) => {
                  const normalizedLevel = item.szint ? item.szint.trim() : null;
                  const normalizedCat = item.category ? item.category.trim() : null;
                  const imageFailedToLoad = imageLoadErrors.has(item.id);
                  const hasImage = item.image_urls && item.image_urls.length > 0 && !imageFailedToLoad;
                  const gradient = getTermGradient(item.category);

                  return (
                    <article
                      key={item.id}
                      onClick={() => handleTermClick(item)}
                      className="h-full flex flex-col justify-between bg-white border border-gray-200 hover:border-primary/40 hover:shadow-lg rounded-2xl transition-all duration-200 group cursor-pointer overflow-hidden shadow-2xs"
                    >
                      <div>
                        {/* ── Kép / Tanuló kártya fejléc panel (Grid / Csempe Nézet) ── */}
                        <div className={`w-full aspect-[16/10] sm:aspect-[16/10] relative overflow-hidden bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          {hasImage ? (
                            <>
                              {/* 1. Háttér kiegészítő elmosás (Backdrop fill for non-standard aspect ratios) */}
                              <img
                                src={item.image_urls![0]}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110 pointer-events-none select-none"
                              />

                              {/* 2. Fő kép intelligens felső-középső fókuszálással */}
                              <img
                                src={item.image_urls![0]}
                                alt={item.term}
                                className="relative z-10 w-full h-full object-cover object-[center_30%] group-hover:scale-105 transition-transform duration-500 ease-out"
                                onError={() =>
                                  setImageLoadErrors((prev) => {
                                    const next = new Set(prev);
                                    next.add(item.id);
                                    return next;
                                  })
                                }
                              />

                              {/* Top shadow gradient layer for text/badge legibility */}
                              <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-20 pointer-events-none" />
                            </>
                          ) : (
                            <div className="text-center p-3 relative z-10 flex flex-col items-center justify-center">
                              {renderCategoryIconElement(item.category, categorySettings)}
                              {normalizedCat && (
                                <div className="text-white/80 text-[10px] font-bold text-center leading-tight uppercase tracking-wider">
                                  {normalizedCat}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Képre úszó jelvények (Badges overlay) */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between gap-1.5 pointer-events-none">
                            <span
                              className={`font-extrabold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase border shadow-sm backdrop-blur-md ${
                                item.entry_type === 'industry_term'
                                  ? 'bg-amber-900/80 text-amber-200 border-amber-500/40'
                                  : 'bg-blue-900/80 text-blue-200 border-blue-500/40'
                              }`}
                            >
                              {item.entry_type === 'industry_term' ? 'Zsargon' : 'Szakmai'}
                            </span>

                            {normalizedLevel ? (
                              <span className="text-[10px] font-extrabold bg-black/60 text-white border border-white/20 backdrop-blur-md px-2 py-0.5 rounded shadow-sm">
                                {normalizedLevel}
                              </span>
                            ) : !user ? (
                              <span className="text-[10px] font-extrabold bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                <Lock size={10} /> Zárt
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* ── Kártya tartalom ── */}
                        <div className="p-4 space-y-1.5">
                          {/* Kategória megnevezés */}
                          {normalizedCat && (
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                              {normalizedCat}
                            </div>
                          )}

                          {/* Fogalom címe */}
                          <h3 className="text-base sm:text-lg font-black text-gray-900 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                            {item.term}
                          </h3>

                          {/* Rövid leírás */}
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 font-normal">
                            {item.definition}
                          </p>
                        </div>
                      </div>

                      {/* ── Alsó akció sor ── */}
                      <div className="px-4 pb-3.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-extrabold">
                        <span className="text-primary group-hover:underline flex items-center gap-1">
                          Részletek ➔
                        </span>
                        {!user && (
                          <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                            <Lock size={10} /> Regisztráció
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* ── LISTA NÉZET (LIST) ── */
              <div className="space-y-4">
                {filteredTerms.map((item) => {
                  const isExpanded = expandedCards.has(item.id);
                  const imageFailedToLoad = imageLoadErrors.has(item.id);
                  const hasImage = item.image_urls && item.image_urls.length > 0 && !imageFailedToLoad;
                  const gradient = getTermGradient(item.category);

                  return (
                    <article
                      key={item.id}
                      className="group bg-white rounded-2xl border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      <div className="flex">
                        {/* ── Tartalom ── */}
                        <div className="flex-1 p-5 space-y-3 min-w-0">
                          {/* Badge sor */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                                item.entry_type === 'industry_term'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {item.entry_type === 'industry_term' ? '🗣 Zsargon' : '📘 Szakmai'}
                            </span>
                            {item.category && (
                              <span className="text-xs bg-gray-100 text-gray-700 border border-gray-200 font-medium px-2 py-0.5 rounded-md">
                                {getCategoryIcon(item.category, categorySettings)} {item.category}
                              </span>
                            )}
                            {item.szint && (
                              <span className="text-xs bg-primary/10 text-primary-900 border border-primary/20 font-semibold px-2 py-0.5 rounded-md">
                                {item.szint}
                              </span>
                            )}
                            {item.jargon_subtype === 'brand_name' && (
                              <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md border border-purple-200">
                                Márkanév
                              </span>
                            )}
                            {item.jargon_subtype === 'german_origin' && (
                              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                                Német
                              </span>
                            )}
                            {item.jargon_subtype === 'workplace_slang' && (
                              <span className="text-xs bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-md border border-orange-200">
                                Szleng
                              </span>
                            )}
                            {item.jargon_subtype === 'synonym' && (
                              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md border border-indigo-200">
                                Szinonima
                              </span>
                            )}
                          </div>

                          {/* Cím */}
                          <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">
                            {item.term}
                          </h3>

                          {/* Definíció */}
                          <p className={`text-gray-600 text-sm leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                            {item.definition}
                          </p>

                          {/* ── Kibővített tartalom ── */}
                          {isExpanded && (
                            <>
                              {/* Zsargon részletek */}
                              {item.entry_type === 'industry_term' && (
                                <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl space-y-1.5 text-xs">
                                  {item.official_term_name && (
                                    <div className="font-bold text-gray-900">
                                      <span className="text-amber-700">Hivatalos megfelelő: </span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleTabChange('technical'); setSearchQuery(item.official_term_name || ''); }}
                                        className="text-primary underline font-bold hover:text-amber-700"
                                      >
                                        ➡ {item.official_term_name}
                                      </button>
                                    </div>
                                  )}
                                  {item.usage_example && (
                                    <div className="text-gray-700 italic">
                                      <strong>Használat:</strong> &ldquo;{item.usage_example}&rdquo;
                                    </div>
                                  )}
                                  {item.origin_note && (
                                    <div className="text-gray-500">
                                      <strong>Eredet:</strong> {item.origin_note}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Szakmai részletek */}
                              {item.entry_type !== 'industry_term' && item.detailed_description && (
                                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
                                  <div className="font-bold text-gray-800">Részletes Műszaki Leírás</div>
                                  <p className="text-gray-700 leading-relaxed">{item.detailed_description}</p>
                                  {item.practical_applications && (
                                    <div className="text-gray-700 pt-1">
                                      <strong>Alkalmazás:</strong> {item.practical_applications}
                                    </div>
                                  )}
                                  {item.common_mistakes && (
                                    <div className="text-red-600 pt-1">
                                      <strong>Gyakori kivitelezési hibák:</strong> {item.common_mistakes}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Fordítások */}
                              {item.translations && Object.keys(item.translations).length > 0 && (
                                <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs">
                                  <div className="font-bold text-blue-900 mb-1.5">🌐 Idegen Nyelvi Szakszótár:</div>
                                  <div className="flex gap-4 flex-wrap text-gray-700">
                                    {item.translations.en && <div><strong className="text-gray-900">🇬🇧 EN:</strong> {item.translations.en}</div>}
                                    {item.translations.de && <div><strong className="text-gray-900">🇩🇪 DE:</strong> {item.translations.de}</div>}
                                    {item.translations.ro && <div><strong className="text-gray-900">🇷🇴 RO:</strong> {item.translations.ro}</div>}
                                  </div>
                                </div>
                              )}

                              {/* Kapcsolódó fogalmak */}
                              {item.kapcsolodofogalmak && item.kapcsolodofogalmak.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                  <span className="font-semibold text-gray-700">Kapcsolódó kifejezések:</span>
                                  {item.kapcsolodofogalmak.map((relTerm) => (
                                    <button
                                      key={relTerm}
                                      onClick={(e) => { e.stopPropagation(); setSearchQuery(relTerm); }}
                                      className="bg-primary/10 border border-primary/20 text-primary-900 font-medium px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                                    >
                                      {relTerm}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          {/* ── Footer akciók ── */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => handleTermClick(item)}
                                className="flex items-center gap-1.5 font-extrabold text-primary hover:underline transition-colors"
                              >
                                Részletek ➔
                              </button>

                              {!user && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                  <Lock size={12} /> Regisztráció szükséges
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors font-semibold flex-shrink-0"
                            >
                              {isExpanded
                                ? <><ChevronUp size={14} /> Kevesebb</>
                                : <><ChevronDown size={14} /> Gyorstekintés</>}
                            </button>
                          </div>
                        </div>

                        {/* ── Jobb oldali kép / gradiens panel (Lista Nézet) ── */}
                        <div
                          className={`hidden md:flex w-28 lg:w-36 flex-shrink-0 items-center justify-center bg-gradient-to-br ${gradient} relative overflow-hidden`}
                        >
                          {hasImage ? (
                            <>
                              <img
                                src={item.image_urls![0]}
                                alt=""
                                aria-hidden="true"
                                className="absolute inset-0 w-full h-full object-cover blur-sm opacity-35 scale-110 pointer-events-none select-none"
                              />
                              <img
                                src={item.image_urls![0]}
                                alt={item.term}
                                className="relative z-10 w-full h-full object-cover object-[center_30%] group-hover:scale-105 transition-transform duration-300"
                                onError={() =>
                                  setImageLoadErrors((prev) => {
                                    const next = new Set(prev);
                                    next.add(item.id);
                                    return next;
                                  })
                                }
                              />
                            </>
                          ) : (
                            <div className="text-center p-3 relative z-10">
                              <div className="text-4xl mb-1.5 opacity-80 drop-shadow-sm">
                                {getCategoryIcon(item.category, categorySettings)}
                              </div>
                              {item.category && (
                                <div className="text-white/70 text-[10px] font-bold text-center leading-tight">
                                  {item.category}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ OLDALSÁV ═══ */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-6">

            {/* Legfrissebb fogalmak */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <Clock size={15} className="text-accent flex-shrink-0" />
                <h3 className="text-sm font-black text-gray-900">Legfrissebb fogalmak</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {latestTerms.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTermClick(t)}
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="text-sm font-bold text-gray-900 group-hover:text-accent transition-colors leading-tight">
                      {t.term}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {t.definition}
                    </p>
                    {t.category && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-400 font-medium">
                        <Tag size={9} /> {t.category}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanulási útvonalak */}
            <div className="bg-primary rounded-2xl border border-primary-700 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-accent/20 rounded-xl text-accent flex-shrink-0">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">Szakmai Tanulási Útvonalak</h3>
                  <p className="text-[11px] text-gray-400">Fokozatos fogalmi haladási útvonal</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['Kőműves', 'Ács', 'Burkoló'].map((tr) => (
                  <button
                    key={tr}
                    onClick={() => setSelectedTrade(selectedTrade === tr ? null : tr)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                      selectedTrade === tr
                        ? 'bg-accent text-black'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {tr} útvonal
                  </button>
                ))}
              </div>
              {selectedTrade && pathways.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  {pathways.map((step, idx) => (
                    <div key={idx} className="bg-black/30 border border-white/10 p-3 rounded-xl">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-accent">{step.level} szint</span>
                        <span className="text-gray-400">{step.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1.5">{step.title}</h4>
                      <div className="flex flex-wrap gap-1">
                        {step.termNames.map((tName) => (
                          <button
                            key={tName}
                            onClick={() => setSearchQuery(tName)}
                            className="text-[10px] bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded hover:bg-accent/20"
                          >
                            {tName}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA kártya */}
            <div className="bg-gradient-to-br from-primary via-[#141414] to-black rounded-2xl border border-primary-700 p-5 text-white relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-28 h-28 bg-accent/8 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/5 rounded-full translate-y-8 -translate-x-8 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-accent/20 rounded-xl">
                    <BookOpen size={16} className="text-accent" />
                  </div>
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">ÉpítőTudás Glossary</span>
                </div>
                <h3 className="text-base font-black text-white leading-tight mb-1.5">
                  Szakmai Szótár &amp; Enciklopédia
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Minden tudás, egy helyen. Építőipari fogalmak és szaktárak.
                </p>
                {!user ? (
                  <button
                    onClick={() => onNavigate('register')}
                    className="w-full py-2.5 bg-accent text-black font-black text-sm rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                  >
                    Regisztrálok <ArrowRight size={14} />
                  </button>
                ) : (
                  <div className="text-xs text-gray-400 text-center font-medium">
                    ✅ Bejelentkezve – teljes hozzáférés
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Modálok ── */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={onNavigate}
        contentType="glossary"
        contentTitle={selectedTerm?.term}
        termTitle={selectedTerm?.term}
        returnPage="glossary"
      />
      <TermDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        term={selectedTerm}
      />
    </div>
  );
}
