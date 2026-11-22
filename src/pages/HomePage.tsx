import { useState, useEffect, useMemo } from 'react';
import { optimizeImageUrl } from '../utils/imageOptimizer';
import {
  Search,
  BookOpen,
  Wrench,
  Layers,
  Clock,
  HardHat,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  FileText,
  Download,
  ShieldCheck,
  Sparkles,
  Calendar,
  Building2,
} from 'lucide-react';
import { getCategories, getArticles } from '../lib/api';
import type { Category, Article } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  getPartnerHighlights,
  getAdvertisementSlots,
  recordAdClick,
  type PartnerHighlight,
  type AdvertisementSlot,
} from '../services/advertisementService';
import { getCategoryLabel } from '../services/partnerService';
import {
  fetchKnowledgeItemsFromCloud,
  getKnowledgeItemsLocal,
  type EducationalContentItem,
} from '../services/knowledgeHubService';
import {
  fetchMaterialsFromCloud,
  getMaterialsLocal,
  type MaterialItem,
  type MaterialDocument,
} from '../services/materialsService';
import { TopAdBanner, InFeedAdBanner } from '../components/ModernAdBanner';
import { stripMarkdownToPlainText } from '../components/FormattedText';
import { useSiteSettings } from '../services/siteSettingsService';
import { sanitizeExternalUrl } from '../lib/urlUtils';
import {
  getHeroState,
  getActiveHeroImages,
  type HeroState,
} from '../services/heroImageService';

interface HomePageProps {
  onNavigate: (page: string, params?: { articleSlug?: string; partnerSlug?: string; slug?: string }) => void;
}

interface CatalogEntry {
  item: MaterialItem;
  doc: MaterialDocument;
  pdfUrl: string;
}

const EXCLUDED_TEST_PARTNER_IDS = new Set([
  'c45a9ebd-8afb-43ab-8761-b1e7bc69aee6',
  'd876ac79-13a7-4c14-852d-3b5adb282047',
]);

function isExcludedTestContent(record: {
  partner_id?: string | null;
  partner_name?: string | null;
  brand?: string | null;
  title?: string | null;
  name?: string | null;
}): boolean {
  const pid = (record.partner_id || '').toLowerCase();
  if (EXCLUDED_TEST_PARTNER_IDS.has(pid)) return true;
  const pName = (record.partner_name || '').trim().toLowerCase();
  if (pName === 'teszt iskola' || pName === '78-as építők kft.') return true;
  const label = `${record.title || ''} ${record.name || ''} ${record.brand || ''}`.toLowerCase();
  return label.includes('[e2e-');
}

function formatHuDate(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getKnowledgeTargetPage(hubType: EducationalContentItem['hub_type']): string {
  if (hubType === 'safety') return 'safety';
  if (hubType === 'standards') return 'standards';
  return 'tudastar';
}

function getKnowledgeTypeLabel(hubType: EducationalContentItem['hub_type']): string {
  if (hubType === 'safety') return 'Munkavédelem';
  if (hubType === 'standards') return 'Szabvány & Jog';
  return 'Tudásanyag';
}

function pickPrimaryCatalogDocument(item: MaterialItem): { doc: MaterialDocument; pdfUrl: string } | null {
  if (!Array.isArray(item.documents) || item.documents.length === 0) return null;
  const sortedDocs = [...item.documents].sort((a, b) => {
    const aIsCat = a.doc_type === 'katalogus' ? 0 : 1;
    const bIsCat = b.doc_type === 'katalogus' ? 0 : 1;
    return aIsCat - bIsCat;
  });
  for (const doc of sortedDocs) {
    const safeUrl = sanitizeExternalUrl(doc.file_url, { allowRelative: true });
    if (safeUrl) {
      return { doc, pdfUrl: safeUrl };
    }
  }
  return null;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const siteSettings = useSiteSettings();
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<EducationalContentItem[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<CatalogEntry[]>([]);
  const [partners, setPartners] = useState<PartnerHighlight[]>([]);
  const [adSlots, setAdSlots] = useState<AdvertisementSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');

  // Dynamic Hero Image State & Rotation
  const [heroState, setHeroState] = useState<HeroState>(() => getHeroState());
  const [currentHeroIndex, setCurrentHeroIndex] = useState<number>(0);

  useEffect(() => {
    function handleHeroConfigChange() {
      setHeroState(getHeroState());
    }
    window.addEventListener('hero-config-changed', handleHeroConfigChange);
    return () => window.removeEventListener('hero-config-changed', handleHeroConfigChange);
  }, []);

  const activeHeroImages = useMemo(() => {
    return getActiveHeroImages(heroState);
  }, [heroState]);

  useEffect(() => {
    if (!activeHeroImages.length) return;
    const mode = heroState.config.rotationMode;

    if (mode === 'random') {
      const randIdx = Math.floor(Math.random() * activeHeroImages.length);
      setCurrentHeroIndex(randIdx);
      return;
    }

    if (mode === 'slideshow' && activeHeroImages.length > 1) {
      const intervalMs = (heroState.config.rotationIntervalSeconds || 5) * 1000;
      const timer = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % activeHeroImages.length);
      }, intervalMs);
      return () => clearInterval(timer);
    }

    setCurrentHeroIndex(0);
  }, [activeHeroImages, heroState.config.rotationMode, heroState.config.rotationIntervalSeconds]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [
          categoriesData,
          articlesData,
          partnersData,
          slotsData,
          cloudKnowledge,
          cloudMaterials,
        ] = await Promise.all([
          getCategories(),
          getArticles({ status: 'published', limit: 6, orderBy: 'created_at' }),
          getPartnerHighlights({ includeTestPartners: true }),
          getAdvertisementSlots(),
          fetchKnowledgeItemsFromCloud(),
          fetchMaterialsFromCloud(),
        ]);

        const publishedArticles = (articlesData || [])
          .filter((a) => a.status === 'published' && !isExcludedTestContent(a))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const rawKnowledge =
          cloudKnowledge && cloudKnowledge.length > 0 ? cloudKnowledge : getKnowledgeItemsLocal();
        const publishedKnowledge = rawKnowledge
          .filter((k) => k.status === 'published' && !isExcludedTestContent(k))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4);

        const rawMaterials =
          cloudMaterials?.items && cloudMaterials.items.length > 0
            ? cloudMaterials.items
            : getMaterialsLocal();
        const publishedCatalogs: CatalogEntry[] = [];
        for (const item of rawMaterials) {
          if (item.status !== 'published' || isExcludedTestContent(item)) continue;
          const primaryDoc = pickPrimaryCatalogDocument(item);
          if (primaryDoc) {
            publishedCatalogs.push({
              item,
              doc: primaryDoc.doc,
              pdfUrl: primaryDoc.pdfUrl,
            });
          }
        }
        publishedCatalogs.sort(
          (a, b) => new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime()
        );

        setCategories(categoriesData);
        setArticles(publishedArticles);
        setKnowledgeItems(publishedKnowledge);
        setCatalogEntries(publishedCatalogs);
        setPartners(partnersData);
        setAdSlots(slotsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba történt az adatok betöltésekor');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
          <p className="mt-4 text-gray-500 text-sm">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Hiba történt</h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-accent text-white font-semibold rounded-lg"
          >
            Újra próbálkozás
          </button>
        </div>
      </div>
    );
  }

  const quickAccessItems = [
    {
      title: 'Kivitelezési megoldások',
      description: 'Gyakorlati útmutatók és technológiák',
      page: 'category',
      icon: Wrench,
    },
    {
      title: 'Anyagismeret',
      description: 'Építőanyagok, rendszerek és alkalmazásuk',
      page: 'materials',
      icon: Layers,
    },
    {
      title: 'Műszaki ismeretek',
      description: 'Szabványok, munkavédelem és tudástár',
      page: 'tudastar',
      icon: BookOpen,
    },
    {
      title: 'Gyártói dokumentáció',
      description: 'Katalógusok, műszaki adatlapok (PDF)',
      page: 'materials',
      icon: FileText,
    },
  ];

  // Kiemelt szakmai tartalom + Friss szakmai cikkek (1 nagy + 2-3 kisebb, duplikáció nélkül)
  const featuredSpotlightArticle =
    articles.find((a) => a.featured) || articles[0] || null;
  const freshArticlesPool = featuredSpotlightArticle
    ? articles.filter((a) => a.id !== featuredSpotlightArticle.id)
    : articles;
  const leadFreshArticle = freshArticlesPool[0] || null;
  const secondaryFreshArticles = freshArticlesPool
    .filter((a) => a.id !== leadFreshArticle?.id)
    .slice(0, 3);

  // Kiemelt gyártói katalógusok (1 nagy + 2 kisebb) és További friss katalógusok (3-4)
  const featuredCatalogs = catalogEntries
    .filter((c) => c.item.featured)
    .slice(0, 3);
  const leadCatalog = featuredCatalogs[0] || catalogEntries[0] || null;
  const secondaryFeaturedCatalogs = featuredCatalogs.slice(1, 3);
  const usedCatalogIds = new Set<string>(
    [leadCatalog, ...secondaryFeaturedCatalogs]
      .filter((c): c is CatalogEntry => Boolean(c))
      .map((c) => c.item.id)
  );
  const additionalFreshCatalogs = catalogEntries
    .filter((c) => !usedCatalogIds.has(c.item.id))
    .slice(0, 4);

  return (
    <div className="bg-background overflow-x-hidden">
      {/* 2. Nyitófelület: „Tudás, ami épít.” */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt="Építkezés"
            loading="eager"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text & Search */}
            <div className="min-w-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-white whitespace-pre-line">
                {siteSettings.heroMainTitle || 'Tudás, ami épít.'}
              </h1>

              <p className="mt-5 text-base sm:text-lg text-gray-300 max-w-xl">
                {siteSettings.heroSubtitle ||
                  'Gyakorlati kivitelezési megoldások, naprakész szakmai tudásanyagok és hivatalos gyártói dokumentációk egy helyen.'}
              </p>

              {/* Search */}
              <div className="mt-8 relative max-w-xl">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && heroSearchQuery.trim()) {
                      onNavigate('category?q=' + encodeURIComponent(heroSearchQuery.trim()));
                    }
                  }}
                  placeholder="Keress cikket, tudásanyagot vagy gyártói dokumentációt..."
                  className="w-full rounded-xl bg-white py-4 pl-12 pr-12 text-sm text-gray-800 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {heroSearchQuery.trim() && (
                  <button
                    onClick={() => onNavigate('category?q=' + encodeURIComponent(heroSearchQuery.trim()))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-sm cursor-pointer"
                    title="Keresés indítása"
                  >
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {/* 4 vizuális gyorselérés a kereső alatt */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                {quickAccessItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => onNavigate(item.page)}
                      className="group flex items-center gap-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-accent/60 px-4 py-3 text-left transition-all cursor-pointer min-h-[52px]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-accent/20 text-accent flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-white group-hover:text-accent transition-colors truncate">
                          {item.title}
                        </span>
                        <span className="block text-[11px] text-gray-300 truncate">
                          {item.description}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-accent shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right - Dynamic Hero Image Element */}
            <div className="mt-6 lg:mt-0 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[280px] md:h-[400px] bg-[#0A0D14] border border-white/10 group">
                {activeHeroImages.map((img, idx) => {
                  const isCurrent = idx === currentHeroIndex;
                  return (
                    <img
                      key={img.id || idx}
                      src={optimizeImageUrl(img.imageUrl, 550, 65)}
                      alt={img.altText || 'ÉpítőTudás vizuális elem'}
                      loading={isCurrent ? 'eager' : 'lazy'}
                      decoding="async"
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${isCurrent
                          ? 'opacity-100 scale-100 z-10'
                          : 'opacity-0 scale-105 z-0 pointer-events-none'
                        }`}
                    />
                  );
                })}

                {heroState.config.rotationMode === 'slideshow' &&
                  heroState.config.showIndicators !== false &&
                  activeHeroImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-xl">
                      {activeHeroImages.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          onClick={() => setCurrentHeroIndex(idx)}
                          title={img.altText || `Kép ${idx + 1}`}
                          className="p-1.5 flex items-center justify-center cursor-pointer min-w-[24px] min-h-[24px]"
                          aria-label={`Ugrás a(z) ${idx + 1}. képre`}
                        >
                          <span
                            className={`h-2 rounded-full transition-all ${idx === currentHeroIndex ? 'w-6 bg-accent' : 'w-2 bg-white/40 hover:bg-white/70'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Banner Ads */}
      <TopAdBanner slots={adSlots} />

      {/* 3. Kiemelt szakmai tartalom */}
      {featuredSpotlightArticle && (
        <section className="mx-auto max-w-[1440px] px-4 pt-12 pb-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-accent">
            <Sparkles size={15} />
            Kiemelt szakmai tartalom
          </div>
          <button
            type="button"
            onClick={() => onNavigate('article', { articleSlug: featuredSpotlightArticle.slug })}
            className="group w-full text-left bg-white rounded-2xl border border-gray-200 hover:border-accent/60 shadow-sm hover:shadow-xl transition-all overflow-hidden grid grid-cols-1 lg:grid-cols-12 cursor-pointer"
          >
            <div className="lg:col-span-5 relative aspect-[16/10] lg:aspect-auto lg:min-h-[260px] bg-gray-900 overflow-hidden">
              {featuredSpotlightArticle.featured_image ? (
                <img
                  src={optimizeImageUrl(featuredSpotlightArticle.featured_image, 700, 75)}
                  alt={featuredSpotlightArticle.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center">
                  <BookOpen size={48} className="text-white/40" />
                </div>
              )}
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-accent text-white shadow">
                Kiemelt
              </span>
            </div>
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-4 min-w-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                  <span className="rounded-md bg-accent/10 px-2.5 py-1 font-bold text-accent">
                    {categories.find((c) => c.id === featuredSpotlightArticle.category_id)?.name || 'Szakmai cikk'}
                  </span>
                  {formatHuDate(featuredSpotlightArticle.created_at) && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} />
                      {formatHuDate(featuredSpotlightArticle.created_at)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} />
                    {featuredSpotlightArticle.read_time || 5} perc
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                  {featuredSpotlightArticle.title}
                </h2>
                {featuredSpotlightArticle.excerpt && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {featuredSpotlightArticle.excerpt}
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-accent group-hover:translate-x-1 transition-transform">
                <span>Teljes szakmai anyag megnyitása</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </button>
        </section>
      )}

      {/* 4. Friss szakmai cikkek */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Friss szakmai cikkek</h2>
            <p className="mt-1.5 text-sm text-gray-600">
              Legfrissebb publikált gyakorlati útmutatók, szakmai hírek és esettanulmányok
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('category')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-800 transition-colors cursor-pointer"
          >
            Összes cikk <ArrowRight size={14} />
          </button>
        </div>

        {!leadFreshArticle ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            Jelenleg nincs további megjeleníthető publikált cikk.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Nagy kiemelt friss cikk */}
            <button
              type="button"
              onClick={() => onNavigate('article', { articleSlug: leadFreshArticle.slug })}
              className={`${secondaryFreshArticles.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
                } group bg-white rounded-2xl border border-gray-200 hover:border-accent/50 shadow-sm hover:shadow-xl transition-all overflow-hidden text-left flex flex-col cursor-pointer min-w-0`}
            >
              <div className="aspect-[16/9] w-full bg-gray-900 overflow-hidden relative">
                {leadFreshArticle.featured_image ? (
                  <img
                    src={optimizeImageUrl(leadFreshArticle.featured_image, 760, 75)}
                    alt={leadFreshArticle.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center">
                    <BookOpen size={44} className="text-white/40" />
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 mb-3">
                    <span className="rounded-md bg-accent/10 px-2.5 py-1 font-bold text-accent">
                      {categories.find((c) => c.id === leadFreshArticle.category_id)?.name || 'Általános'}
                    </span>
                    {formatHuDate(leadFreshArticle.created_at) && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={13} />
                        {formatHuDate(leadFreshArticle.created_at)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} />
                      {leadFreshArticle.read_time || 5} perc
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                    {leadFreshArticle.title}
                  </h3>
                  {leadFreshArticle.excerpt && (
                    <p className="mt-2.5 text-sm text-gray-600 line-clamp-2">
                      {leadFreshArticle.excerpt}
                    </p>
                  )}
                </div>
                <div className="text-xs font-bold text-accent inline-flex items-center gap-1.5">
                  Cikk elolvasása <ArrowRight size={14} />
                </div>
              </div>
            </button>

            {/* 2–3 kisebb cikkkártya */}
            {secondaryFreshArticles.length > 0 && (
              <div className="lg:col-span-5 flex flex-col gap-4">
                {secondaryFreshArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => onNavigate('article', { articleSlug: article.slug })}
                    className="group bg-white rounded-2xl border border-gray-200 hover:border-accent/50 shadow-sm hover:shadow-lg transition-all p-4 text-left flex gap-4 items-stretch cursor-pointer min-w-0 flex-1"
                  >
                    <div className="w-28 sm:w-32 aspect-[4/3] rounded-xl bg-gray-900 overflow-hidden shrink-0">
                      {article.featured_image ? (
                        <img
                          src={optimizeImageUrl(article.featured_image, 320, 70)}
                          alt={article.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/90 flex items-center justify-center">
                          <BookOpen size={24} className="text-white/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <span className="inline-block rounded bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent mb-1.5">
                          {categories.find((c) => c.id === article.category_id)?.name || 'Általános'}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {formatHuDate(article.created_at) && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} />
                            {formatHuDate(article.created_at)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {article.read_time || 5} perc
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* In-Feed Sponsored Modern Banner */}
      <InFeedAdBanner slots={adSlots} onNavigate={onNavigate} />

      {/* 5. Új tudásanyagok (4 kártya) */}
      <section className="bg-white border-y border-gray-200">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Új szakmai tudásanyagok</h2>
              <p className="mt-1.5 text-sm text-gray-600">
                Szabványok, munkavédelmi előírások és rendszerezett műszaki összefoglalók
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tudastar')}
              className="inline-flex items-center gap-2 text-accent font-bold text-xs hover:gap-3 transition-all cursor-pointer"
            >
              Teljes Tudástár <ArrowRight size={15} />
            </button>
          </div>

          {knowledgeItems.length === 0 ? (
            <div className="bg-background rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
              Jelenleg nincs megjeleníthető publikált tudásanyag.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {knowledgeItems.map((item) => {
                const targetPage = getKnowledgeTargetPage(item.hub_type);
                const typeLabel = getKnowledgeTypeLabel(item.hub_type);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(targetPage)}
                    className="group bg-background rounded-2xl border border-gray-200 hover:border-accent/50 shadow-sm hover:shadow-lg transition-all overflow-hidden text-left flex flex-col cursor-pointer min-w-0"
                  >
                    <div className="aspect-[16/9] w-full bg-gray-900 relative overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={optimizeImageUrl(item.image_url, 480, 70)}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center">
                          <ShieldCheck size={36} className="text-white/40" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 rounded-full bg-black/70 backdrop-blur px-2.5 py-0.5 text-[11px] font-bold text-white border border-white/15">
                        {typeLabel}
                      </span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-accent mb-1.5 truncate">
                          {item.topic || item.category_name || 'Műszaki ismeret'}
                        </span>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </div>
                      <div className="pt-3 border-t border-gray-200/70 flex items-center justify-between text-xs font-bold text-accent">
                        <span>Megnyitás</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 6. Kiemelt gyártói katalógusok & 7. További friss katalógusok */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Gyártói katalógusok és dokumentációk
            </h2>
            <p className="mt-1.5 text-sm text-gray-600">
              Hivatalos műszaki adatlapok, rendszerkatalógusok és beépítési útmutatók (PDF)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('materials')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-800 transition-colors cursor-pointer"
          >
            Összes dokumentáció <ArrowRight size={14} />
          </button>
        </div>

        {!leadCatalog ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            Jelenleg nincs megjeleníthető jóváhagyott gyártói dokumentum.
          </div>
        ) : (
          <div className="space-y-8">
            {/* 6. Kiemelt gyártói katalógusok: 1 nagy + 2 kisebb (vagy teljes szélesség 1 elemnél) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Nagy kiemelt katalógus */}
              <div
                className={`${secondaryFeaturedCatalogs.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'
                  } bg-white rounded-2xl border border-gray-200 hover:border-accent/50 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between min-w-0`}
              >
                <div>
                  <div className="aspect-[16/9] w-full bg-gray-900 relative overflow-hidden">
                    {leadCatalog.item.main_image_url ? (
                      <img
                        src={optimizeImageUrl(leadCatalog.item.main_image_url, 700, 75)}
                        alt={leadCatalog.doc.title || leadCatalog.item.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center">
                        <FileText size={44} className="text-white/40" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white shadow">
                      Kiemelt katalógus
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 mb-2">
                      <span className="inline-flex items-center gap-1 font-bold text-primary">
                        <Building2 size={13} className="text-accent" />
                        {leadCatalog.item.brand || leadCatalog.item.partner_name}
                      </span>
                      {formatHuDate(leadCatalog.item.created_at) && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {formatHuDate(leadCatalog.item.created_at)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">
                      {leadCatalog.doc.title || leadCatalog.item.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {stripMarkdownToPlainText(leadCatalog.item.short_description)}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={leadCatalog.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-800 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    <Download size={14} /> PDF megnyitása
                  </a>
                  <button
                    type="button"
                    onClick={() => onNavigate('materials')}
                    className="text-xs font-bold text-accent hover:underline cursor-pointer"
                  >
                    Termékadatlap →
                  </button>
                </div>
              </div>

              {/* 2 kisebb kiemelt katalógus */}
              {secondaryFeaturedCatalogs.length > 0 && (
                <div className="lg:col-span-6 flex flex-col gap-6">
                  {secondaryFeaturedCatalogs.map((entry) => (
                    <div
                      key={entry.item.id}
                      className="bg-white rounded-2xl border border-gray-200 hover:border-accent/50 shadow-sm hover:shadow-lg transition-all p-5 flex flex-col sm:flex-row gap-4 items-stretch flex-1 min-w-0"
                    >
                      <div className="w-full sm:w-36 aspect-[16/10] sm:aspect-auto rounded-xl bg-gray-900 overflow-hidden shrink-0">
                        {entry.item.main_image_url ? (
                          <img
                            src={optimizeImageUrl(entry.item.main_image_url, 360, 70)}
                            alt={entry.doc.title || entry.item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/90 flex items-center justify-center">
                            <FileText size={28} className="text-white/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-1.5">
                            <span className="font-bold text-primary">
                              {entry.item.brand || entry.item.partner_name}
                            </span>
                            {formatHuDate(entry.item.created_at) && (
                              <span>• {formatHuDate(entry.item.created_at)}</span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-gray-900 line-clamp-2">
                            {entry.doc.title || entry.item.name}
                          </h3>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={entry.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-800 text-white text-xs font-bold rounded-xl transition-colors"
                          >
                            <Download size={13} /> PDF megnyitása
                          </a>
                          {entry.doc.file_size && (
                            <span className="text-[11px] text-gray-500 font-medium">{entry.doc.file_size}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. További friss katalógusok (3–4 friss dokumentum) */}
            {additionalFreshCatalogs.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">További friss katalógusok</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {additionalFreshCatalogs.map((entry) => (
                    <div
                      key={entry.item.id}
                      className="bg-white rounded-2xl border border-gray-200 hover:border-accent/50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between min-w-0"
                    >
                      <div>
                        <div className="aspect-[16/9] w-full bg-gray-900 overflow-hidden">
                          {entry.item.main_image_url ? (
                            <img
                              src={optimizeImageUrl(entry.item.main_image_url, 420, 70)}
                              alt={entry.doc.title || entry.item.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/90 flex items-center justify-center">
                              <FileText size={28} className="text-white/50" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="text-[11px] font-bold text-accent mb-1 truncate">
                            {entry.item.brand || entry.item.partner_name}
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-2">
                            {entry.doc.title || entry.item.name}
                          </h4>
                          {formatHuDate(entry.item.created_at) && (
                            <p className="mt-1.5 text-[11px] text-gray-500">
                              {formatHuDate(entry.item.created_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 pb-4">
                        <a
                          href={entry.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-primary hover:text-white text-gray-900 text-xs font-bold rounded-xl transition-colors"
                        >
                          <Download size={13} /> PDF megnyitása
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 8. Gyártói partnerek */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gyártói partnerek</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ipari gyártók, szakképző intézmények és szakmai támogatóink
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('partners')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent font-bold text-xs rounded-xl hover:bg-accent hover:text-white transition-all cursor-pointer"
          >
            Összes Partner Megtekintése <ArrowRight size={14} />
          </button>
        </div>

        {partners.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-sm">
            Jelenleg még nincsenek kiemelt partner szervezetek.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partners.map((partner) => {
              const safeWebsiteUrl = sanitizeExternalUrl(partner.websiteUrl, { allowAutoHttps: true });
              const linkUrl = safeWebsiteUrl || `#partnerek/${partner.slug || partner.id}`;
              const isExternal = Boolean(safeWebsiteUrl);

              return (
                <a
                  key={partner.id}
                  href={linkUrl}
                  target={isExternal ? '_blank' : '_self'}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  onClick={(e) => {
                    if (partner.id) recordAdClick(partner.id);
                    if (!isExternal) {
                      e.preventDefault();
                      onNavigate('partner-detail', { slug: partner.slug || partner.id });
                    }
                  }}
                  className="group bg-white border border-gray-200 hover:border-accent rounded-xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded">
                        {getCategoryLabel(partner.category)}
                      </span>
                      {partner.isVerified && (
                        <span className="text-xs text-gray-600 font-semibold flex items-center gap-1 group-hover:text-accent transition-colors">
                          Minősített Partner <ExternalLink size={12} />
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                      {partner.description}
                    </p>
                  </div>
                  <div className="text-xs text-accent font-bold border-t border-gray-100 pt-3 flex items-center justify-between group-hover:translate-x-0.5 transition-transform">
                    <span>{isExternal ? 'Partner weboldalának megnyitása' : 'Részletes adatlap megtekintése'}</span>
                    <ArrowRight size={14} />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA - only for signed-out visitors */}
      {!session && (
        <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Kezdj el tanulni ma</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Regisztrálj, és hozz létre saját könyvjelzőket, írd meg saját cikkeidet, és csatlakozz az
              építőipari közösséghez.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('register')}
                className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Regisztráció
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                Bejelentkezés
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
