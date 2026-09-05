import { useState, useEffect, useMemo, useCallback } from 'react';
import { optimizeImageUrl } from '../utils/imageOptimizer';
import {
  ChevronRight,
  Clock,
  Star,
  Search,
  Home,
  Layers,
  AlertCircle,
  Thermometer,
  Droplets,
  Zap,
  Paintbrush,
  Wrench,
  Hammer,
  Building,
  Shield,
  HardHat,
  Truck,
  Ruler,
  Compass,
  Grid,
  Settings,
  BookOpen,
  Filter,
  ExternalLink,
  FileText,
  X,
  ChevronDown,
  Sparkles,
  Calendar,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { getCategories, getArticles } from '../lib/api';
import { getAdvertisementSlots, recordAdClick, type AdvertisementSlot } from '../services/advertisementService';
import { useArticleSettings } from '../services/articleSettingsService';
import type { Category, Article } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toggleSaveItem, getSavedItems } from '../services/bookmarkService';
import AuthPromptModal from '../components/AuthPromptModal';

interface CategoryPageProps {
  onNavigate: (page: string, params?: { articleSlug?: string }) => void;
}

const categoryIconMap: Record<string, React.ElementType> = {
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
};

function formatDateHu(dateStr?: string | null): string {
  if (!dateStr) return '2026. augusztus 16.';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2026. augusztus 16.';
    return d.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '2026. augusztus 16.';
  }
}

export default function CategoryPage({ onNavigate }: CategoryPageProps) {
  const { user } = useAuth();
  const articleSettings = useArticleSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [adSlots, setAdSlots] = useState<AdvertisementSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedArticleType, setSelectedArticleType] = useState<'hirek' | 'ujdonsagok' | 'utmutatok'>('hirek');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals / Dropdowns State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(articleSettings.articlesPerPage || 12);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const items = getSavedItems(user?.id);
    const articleIds = new Set<string>();
    items.filter((i) => i.itemType === 'article').forEach((i) => {
      articleIds.add(i.itemId);
      if (i.slug) articleIds.add(i.slug);
    });
    setSavedArticleIds(articleIds);
  }, [user]);

  const handleToggleBookmark = (e: React.MouseEvent, article: Article, catName?: string) => {
    e.stopPropagation();
    const res = toggleSaveItem(user?.id, {
      itemId: article.id,
      itemType: 'article',
      title: article.title,
      subtitle: catName || article.author || 'ÉpítőTudás',
      description: article.excerpt || undefined,
      slug: article.slug,
      imageUrl: article.featured_image || undefined,
      readTime: article.read_time,
    });

    setSavedArticleIds((prev) => {
      const next = new Set(prev);
      if (res.isSaved) {
        next.add(article.id);
        if (article.slug) next.add(article.slug);
      } else {
        next.delete(article.id);
        if (article.slug) next.delete(article.slug);
      }
      return next;
    });
  };

  // --------------------------------------------------------------------------
  // URL Hash Sync
  // --------------------------------------------------------------------------
  const syncFromHash = useCallback(() => {
    try {
      const hash = window.location.hash || '';
      const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
      let typeParam = '';
      let catParam = '';
      let qParam = '';

      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        typeParam = params.get('type') || '';
        catParam = params.get('cat') || '';
        qParam = params.get('q') || '';
      } else if (hash.startsWith('#')) {
        const fragment = hash.replace('#', '');
        if (['hirek', 'ujdonsagok', 'utmutatok'].includes(fragment)) {
          typeParam = fragment;
        }
      }

      if (['hirek', 'ujdonsagok', 'utmutatok'].includes(typeParam)) {
        setSelectedArticleType(typeParam as 'hirek' | 'ujdonsagok' | 'utmutatok');
      } else {
        setSelectedArticleType('hirek');
      }

      if (catParam) {
        setSelectedCategories(catParam.split(',').filter(Boolean));
      } else {
        setSelectedCategories([]);
      }

      if (qParam) {
        setSearchQuery(qParam);
      } else {
        setSearchQuery('');
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [categoriesData, articlesData, slots] = await Promise.all([
          getCategories(),
          getArticles({ limit: 100 }),
          getAdvertisementSlots(),
        ]);

        const publishedOnly = articlesData.filter((a) => a.status === 'published' || !a.status);
        setCategories(categoriesData);
        setArticles(publishedOnly);
        setAdSlots(slots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba történt az adatok betöltésekor');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [syncFromHash]);

  // Update URL hash when filters change
  const updateUrlParams = useCallback((type: string, cats: string[], q: string) => {
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (cats.length > 0) params.set('cat', cats.join(','));
      if (q.trim()) params.set('q', q.trim());

      const queryString = params.toString();
      const newHash = queryString ? `#category?${queryString}` : '#category';

      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleCategoryToggle = (catId: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId];
      updateUrlParams(selectedArticleType, next, searchQuery);
      return next;
    });
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    updateUrlParams(selectedArticleType, [], '');
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCategoryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Category Counts
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach((a) => {
      if (a.category_id) {
        map.set(a.category_id, (map.get(a.category_id) || 0) + 1);
      }
    });
    return map;
  }, [articles]);

  // Display Categories (Filtered by empty setting if configured)
  const displayCategories = useMemo(() => {
    let list = [...categories].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
    if (!articleSettings.showEmptyCategoriesInFilter) {
      list = list.filter((c) => (categoryCounts.get(c.id) || 0) > 0);
    }
    return list;
  }, [categories, categoryCounts, articleSettings.showEmptyCategoriesInFilter]);

  // Filtered & Sorted Articles
  const filteredArticles = useMemo(() => {
    let list = articles.filter((article) => {
      // 1. Article Type Filter (hirek | ujdonsagok | utmutatok)
      const aType = article.article_type || 'utmutatok';
      const matchType = aType === selectedArticleType;

      // 2. Category Filter
      const matchCat =
        selectedCategories.length === 0 ||
        (article.category_id && selectedCategories.includes(article.category_id));

      // 3. Search Query Filter
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(q)) ||
        (article.tags && article.tags.some((t: string) => t.toLowerCase().includes(q)));

      return matchType && matchCat && matchQuery;
    });

    // Apply Sorting Mode
    switch (articleSettings.defaultSortMode) {
      case 'featured':
        list.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'popular':
        list.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'manual':
        // Keep order or default sort
        break;
      case 'latest':
      default:
        list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
    }

    return list;
  }, [articles, selectedArticleType, selectedCategories, searchQuery, articleSettings.defaultSortMode]);

  const paginatedArticles = useMemo(() => {
    return filteredArticles.slice(0, visibleCount);
  }, [filteredArticles, visibleCount]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cikkek és útmutatók betöltése...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4 space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h2 className="text-lg font-bold text-gray-900">Hiba történt</h2>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-700 transition-colors"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  const desktopGridClass =
    articleSettings.desktopGridColumns === 2
      ? 'lg:grid-cols-2'
      : articleSettings.desktopGridColumns === 4
      ? 'lg:grid-cols-4'
      : 'lg:grid-cols-3';

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-white transition-colors">
              <Home size={13} /> Főoldal
            </button>
            <ChevronRight size={13} />
            <button onClick={() => onNavigate('category?type=hirek')} className="hover:text-white transition-colors">
              Cikkek &amp; Útmutatók
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">
              {selectedArticleType === 'hirek' ? 'Hírek' : selectedArticleType === 'ujdonsagok' ? 'Újdonságok' : 'Útmutatók'}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                <FileText size={13} /> Építőipari Szakmai Cikkek &amp; Technológiák
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {articleSettings.articlesPageTitle}
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                {articleSettings.articlesPageDescription}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs bg-white/10 border border-white/20 text-white font-bold px-4 py-2 rounded-xl backdrop-blur-sm">
                Összesen: <strong className="text-accent">{articles.length}</strong> publikált cikk
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Ribbon Bar for Cikkek */}
      <SectionSubNav
        ariaLabel="Cikkek almenü navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Hírek',
            page: 'category?type=hirek',
            icon: <Sparkles size={14} className="text-accent" />,
            active: selectedArticleType === 'hirek',
          },
          {
            label: 'Újdonságok',
            page: 'category?type=ujdonsagok',
            icon: <Calendar size={14} className="text-accent" />,
            active: selectedArticleType === 'ujdonsagok',
          },
          {
            label: 'Útmutatók',
            page: 'category?type=utmutatok',
            icon: <BookOpen size={14} className="text-accent" />,
            active: selectedArticleType === 'utmutatok',
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Active Partner & Sidebar Ad Banners */}
        {adSlots.filter((slot) => !slot.isPlaceholder && (slot.location === 'sidebar' || slot.location === 'in_feed')).length > 0 && (
          <div className="bg-primary text-white border border-primary-700 rounded-3xl p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-black bg-accent px-3 py-1 rounded-full uppercase tracking-wider">
                📢 Kiemelt Szponzori Ajánlatok
              </span>
              <span className="text-[11px] text-gray-400 font-semibold">Szakmai Partnereink</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adSlots
                .filter((slot) => !slot.isPlaceholder && (slot.location === 'sidebar' || slot.location === 'in_feed'))
                .map((slot) => (
                  <a
                    key={slot.id}
                    href={slot.targetUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordAdClick(slot.id)}
                    className="bg-white/5 border border-white/10 hover:border-accent rounded-2xl p-4 transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                        {slot.sponsorName}
                      </span>
                      <h4 className="text-xs font-bold text-white group-hover:text-accent transition-colors line-clamp-1">
                        {slot.title}
                      </h4>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        Megtekintés partnernél <ExternalLink size={10} />
                      </span>
                    </div>
                    {slot.imageUrl && (
                      <img
                        src={slot.imageUrl}
                        alt={slot.title}
                        className="w-12 h-12 object-cover rounded-xl shrink-0"
                      />
                    )}
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* SEARCH BAR & FILTERS */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            
            {/* Live Search Input */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Keresés cikkek között (pl. betonozás, szigetelés, csempézés)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateUrlParams(selectedArticleType, selectedCategories, e.target.value);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-accent font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    updateUrlParams(selectedArticleType, selectedCategories, '');
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Compact Filter Action Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              
              {/* Category Filter Button */}
              <div className="relative flex-1 md:flex-initial">
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className={`w-full md:w-auto px-4 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between gap-2 border shadow-xs ${
                    selectedCategories.length > 0
                      ? 'bg-primary text-white border-primary-700 shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Filter size={15} />
                    <span>
                      {selectedCategories.length > 0
                        ? `Kategóriák (${selectedCategories.length})`
                        : 'Kategóriák'}
                    </span>
                  </div>
                  <ChevronDown size={15} />
                </button>
              </div>

            </div>
          </div>

          {/* ACTIVE FILTER REMOVABLE CHIPS */}
          {(selectedCategories.length > 0 || searchQuery.trim()) && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500">Aktív szűrők:</span>

              {/* Category Chips */}
              {selectedCategories.map((catId) => {
                const cat = categories.find((c) => c.id === catId);
                if (!cat) return null;
                return (
                  <span
                    key={catId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary-950 font-bold text-xs rounded-full shadow-2xs"
                  >
                    <span>{cat.name}</span>
                    <button
                      onClick={() => handleCategoryToggle(catId)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X size={13} />
                    </button>
                  </span>
                );
              })}

              {/* Search Query Chip */}
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-full shadow-2xs">
                  <span>Keresés: „{searchQuery}”</span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      updateUrlParams(selectedArticleType, selectedCategories, '');
                    }}
                    className="hover:bg-amber-200 rounded-full p-0.5"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {/* Clear All Button */}
              <button
                onClick={handleClearAllFilters}
                className="text-xs font-bold text-accent hover:underline ml-2"
              >
                Összes szűrő törlése
              </button>
            </div>
          )}
        </div>

        {/* OPTIONAL CATEGORY TILES BLOCK (OFF BY DEFAULT) */}
        {articleSettings.showCategoryTilesBlock && !searchQuery && selectedCategories.length === 0 && (
          <div className="space-y-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">Építőipari Szakági Kategóriák</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayCategories.map((cat) => {
                const count = categoryCounts.get(cat.id) || 0;
                const IconComp = (cat.icon_name && categoryIconMap[cat.icon_name]) || Layers;
                const catColor = cat.color || '#FFC400';
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-primary text-left transition-all hover:shadow-md flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs"
                        style={{
                          backgroundColor: `${catColor}20`,
                          borderColor: `${catColor}50`,
                          color: catColor,
                        }}
                      >
                        <IconComp size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{cat.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{count} cikk</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-primary group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MAIN ARTICLES TILE GRID */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <FileText className="text-accent" size={22} />
              <span>Elérhető Szakmai Cikkek</span>
              <span className="text-xs font-normal text-gray-500">
                ({filteredArticles.length} találat)
              </span>
            </h2>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <BookOpen size={48} className="mx-auto text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900">Nem található a megadott szűrésnek megfelelő cikk</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Nincs a megadott szűrésnek megfelelő cikk. Próbálj meg más kategóriát vagy keresőkifejezést választani.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-700 transition-colors shadow-md"
              >
                Szűrők Alaphelyzetbe Állítása
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${desktopGridClass} gap-6 items-stretch`}>
              {paginatedArticles.map((article) => {
                const catObj = categories.find((c) => c.id === article.category_id);
                const hasImage = Boolean(article.featured_image);

                return (
                  <article
                    key={article.id}
                    onClick={() => onNavigate('article', { articleSlug: article.slug })}
                    className="h-full flex flex-col justify-between bg-white border border-gray-200 hover:border-primary/40 hover:shadow-xl rounded-3xl transition-all duration-300 group cursor-pointer overflow-hidden shadow-xs"
                  >
                    <div>
                      {/* Cover Header */}
                      <div className="w-full aspect-[16/9] relative overflow-hidden bg-primary flex items-center justify-center">
                        {hasImage ? (
                          <img
                            src={optimizeImageUrl(article.featured_image, 600)}
                            alt={article.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary via-primary-800 to-primary-950 flex flex-col items-center justify-center p-4 text-center">
                            <BookOpen size={36} className="text-accent mb-2 opacity-80" />
                            <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                              ÉpítőTudás Szakcikk
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
                          <div className="flex items-center gap-1.5">
                            {catObj && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-black/60 text-white backdrop-blur-md border border-white/20">
                                {catObj.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(article.views && article.views > 2500) && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-accent text-primary-950 shadow-sm">
                                <Sparkles size={11} /> Kiemelt
                              </span>
                            )}
                            <button
                              onClick={(e) => handleToggleBookmark(e, article, catObj?.name)}
                              className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-md ${
                                savedArticleIds.has(article.id)
                                  ? 'bg-amber-400 text-primary-950'
                                  : 'bg-black/50 text-white hover:bg-black/70'
                              }`}
                              title={savedArticleIds.has(article.id) ? 'Mentés eltávolítása' : 'Elmentés a mentéseim közé'}
                            >
                              {savedArticleIds.has(article.id) ? (
                                <BookmarkCheck size={14} className="fill-primary-950" />
                              ) : (
                                <Bookmark size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Title Overlay in Cover */}
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <h3 className="text-base sm:text-lg font-extrabold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                            {article.title}
                          </h3>
                        </div>
                      </div>

                      {/* Body Excerpt */}
                      <div className="p-5 space-y-3">
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                          {article.excerpt || 'Részletes építőipari technológiai leírás, munkavédelmi előírások és gyakorlati útmutató.'}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Metadata (NO FAKE STATS) */}
                    <div className="p-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-gray-400" />
                          <span>{article.read_time || 5} perc olvasás</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-400" />
                          <span>Frissítve: {formatDateHu(article.updated_at || article.created_at)}</span>
                        </span>
                      </div>

                      {/* Display View Count ONLY if enabled in settings and real data exists */}
                      {articleSettings.showViewCount && (article.views || 0) > 0 && (
                        <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                          👁 {article.views}
                        </span>
                      )}

                      {/* Display Rating ONLY if enabled in settings and rating_count > 0 */}
                      {articleSettings.showRatings && (article.rating_count || 0) > 0 && (
                        <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          {article.rating ? article.rating.toFixed(1) : '5.0'}/5 ({article.rating_count})
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* LOAD MORE BUTTON */}
          {articleSettings.showLoadMoreButton && filteredArticles.length > visibleCount && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount((prev) => prev + (articleSettings.articlesPerPage || 12))}
                className="px-8 py-3.5 bg-primary hover:bg-primary-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>További cikkek betöltése ({filteredArticles.length - visibleCount} maradt)</span>
                <ChevronDown size={16} />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* COMPACT CATEGORY FILTER MODAL / POPUP */}
      {isCategoryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCategoryModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-modal-title"
        >
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-gray-900 max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-0.5">
                <h3 id="cat-modal-title" className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Filter size={18} className="text-primary" /> Kategóriák Szűrése
                </h3>
                <p className="text-xs text-gray-500">
                  Válassz ki egy vagy több kategóriát a cikkek szűréséhez:
                </p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Bezárás"
              >
                <X size={18} />
              </button>
            </div>

            {/* Checkbox List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  updateUrlParams(selectedArticleType, [], searchQuery);
                }}
                className={`w-full p-3 rounded-2xl border text-left font-bold text-xs transition-all flex items-center justify-between ${
                  selectedCategories.length === 0
                    ? 'bg-primary/10 border-primary text-primary-950 font-black'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Összes kategória</span>
                <span className="text-xs bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                  {articles.length} cikk
                </span>
              </button>

              {displayCategories.map((cat) => {
                const count = categoryCounts.get(cat.id) || 0;
                const isChecked = selectedCategories.includes(cat.id);
                const catColor = cat.color || '#FFC400';

                return (
                  <label
                    key={cat.id}
                    className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isChecked
                        ? 'bg-primary/10 border-primary text-primary-950 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <span>{cat.name}</span>
                    </div>

                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                      {count} cikk
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  updateUrlParams(selectedArticleType, [], searchQuery);
                }}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 underline decoration-dotted"
              >
                Szűrők törlése
              </button>

              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-6 py-2.5 bg-primary hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                Cikkek megjelenítése
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={onNavigate}
        contentType="article"
        returnPage="category"
      />
    </div>
  );
}
