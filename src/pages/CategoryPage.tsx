import { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  Clock,
  TrendingUp,
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
} from 'lucide-react';
import { getCategories, getArticles } from '../lib/api';
import { getAdvertisementSlots, recordAdClick, type AdvertisementSlot } from '../services/advertisementService';
import type { Category, Article } from '../lib/supabase';

interface CategoryPageProps {
  onNavigate: (page: string, params?: { articleSlug?: string }) => void;
}

const difficultyLabels: Record<string, string> = {
  beginner: 'Kezdő',
  intermediate: 'Közepes',
  advanced: 'Haladó',
  expert: 'Szakértő',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
  advanced: 'bg-amber-100 text-amber-700 border-amber-200',
  expert: 'bg-red-100 text-red-700 border-red-200',
};

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

export default function CategoryPage({ onNavigate }: CategoryPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [adSlots, setAdSlots] = useState<AdvertisementSlot[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [categoriesData, articlesData, slots] = await Promise.all([
          getCategories(),
          getArticles({ limit: 50 }),
          getAdvertisementSlots(),
        ]);
        setCategories(categoriesData);
        setArticles(articlesData);
        setAdSlots(slots);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba történt az adatok betöltésekor');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchCat = !selectedCategory || article.category_id === selectedCategory;
      const matchDiff = !selectedDifficulty || article.difficulty === selectedDifficulty;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(q));

      return matchCat && matchDiff && matchQuery;
    });
  }, [articles, selectedCategory, selectedDifficulty, searchQuery]);

  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find((c) => c.id === selectedCategory) || null;
  }, [categories, selectedCategory]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-3" />
          <p className="text-gray-500 text-sm">Kategóriák és cikkek betöltése...</p>
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
            className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl hover:bg-accent-hover transition-colors"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Hero Header */}
      <div className="relative bg-primary text-white border-b border-primary-700 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Banner image background if active category has banner_url or image_url */}
        {activeCategoryObj?.banner_url || activeCategoryObj?.image_url ? (
          <div className="absolute inset-0 z-0">
            <img
              src={activeCategoryObj.banner_url || activeCategoryObj.image_url || ''}
              alt={activeCategoryObj.name}
              className="w-full h-full object-cover opacity-25 scale-105 filter blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary-900/90" />
          </div>
        ) : null}

        <div className="relative z-10 max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-white transition-colors">
              <Home size={13} /> Főoldal
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-semibold">
              {activeCategoryObj ? activeCategoryObj.name : 'Összes Kategória & Cikkek'}
            </span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {activeCategoryObj ? (
                (() => {
                  const IconComp = (activeCategoryObj.icon_name && categoryIconMap[activeCategoryObj.icon_name]) || Layers;
                  const categoryColor = activeCategoryObj.color || '#FFC400';
                  return (
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl backdrop-blur-md shrink-0"
                      style={{
                        backgroundColor: `${categoryColor}25`,
                        borderColor: `${categoryColor}60`,
                        color: categoryColor,
                      }}
                    >
                      <IconComp size={30} />
                    </div>
                  );
                })()
              ) : (
                <div className="p-3.5 bg-accent/15 border border-accent/30 rounded-2xl text-accent shrink-0">
                  <BookOpen size={30} />
                </div>
              )}

              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  {activeCategoryObj
                    ? activeCategoryObj.seo_title || activeCategoryObj.name
                    : 'Építőipari Kategóriák & Szakmai Cikkek'}
                </h1>
                <p className="text-gray-300 text-sm mt-1 max-w-3xl leading-relaxed">
                  {activeCategoryObj
                    ? activeCategoryObj.seo_description || activeCategoryObj.description
                    : 'Gyakorlati útmutatók, szabványok, technológiai leírások és kivitelezési tippek'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-accent/10 border border-accent/20 text-accent font-bold px-3.5 py-2 rounded-xl">
                {categories.length} Kategória
              </span>
              <span className="text-xs bg-white/10 border border-white/10 text-gray-200 font-bold px-3.5 py-2 rounded-xl">
                {articles.length} Szakcikk
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Active Partner & Sidebar Ad Banners */}
        {adSlots.filter((slot) => !slot.isPlaceholder && (slot.location === 'sidebar' || slot.location === 'in_feed')).length > 0 && (
          <div className="bg-gradient-to-r from-primary to-primary-900 border border-accent/40 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-black bg-accent px-3 py-1 rounded-full uppercase tracking-wider">
                📢 Kiemelt Partneri Hirdetések & Szponzori Ajánlatok
              </span>
              <span className="text-[11px] text-gray-400 font-semibold">Oldalsáv / Cikk Hirdetések</span>
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
                    className="bg-black/40 border border-accent/30 hover:border-accent rounded-2xl p-4 transition-all flex items-center justify-between group"
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

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Keress cikket cím, kifejezés vagy tartalom alapján..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-accent shadow-sm"
          />
        </div>

        {/* Category Filter Chips / Pills */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={12} /> Kategória választó:
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === null
                  ? 'bg-accent text-black shadow-md'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-accent/40'
              }`}
            >
              Összes Kategória ({categories.length})
            </button>

            {[...categories]
              .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
              .map((cat) => {
                const count = articles.filter((a) => a.category_id === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                const catColor = cat.color || '#FFC400';

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-accent text-black shadow-md border border-accent'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-accent/40'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: catColor }}
                    />
                    {cat.name} ({count})
                  </button>
                );
              })}
          </div>
        </div>

        {/* Difficulty Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-gray-400 uppercase tracking-wider text-[11px]">Szint:</span>
          <button
            onClick={() => setSelectedDifficulty(null)}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              selectedDifficulty === null
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            Összes Szint
          </button>
          {Object.entries(difficultyLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedDifficulty(selectedDifficulty === key ? null : key)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedDifficulty === key
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category Cards Overview Grid (When no specific category is selected) */}
        {!selectedCategory && !searchQuery && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Építőipari Szakági Kategóriák</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...categories]
                .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
                .map((cat) => {
                  const IconComponent = (cat.icon_name && categoryIconMap[cat.icon_name]) || Layers;
                  const catArticlesCount = articles.filter((a) => a.category_id === cat.id).length;
                  const categoryColor = cat.color || '#FFC400';

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="group bg-white border border-gray-200 hover:border-accent rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                    >
                      {/* Cover Image Header */}
                      <div className="h-36 relative bg-gray-900 overflow-hidden flex items-center justify-center">
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-85"
                            style={{
                              objectFit: (cat.image_fit as 'cover' | 'contain' | 'fill') || 'cover',
                              objectPosition: cat.image_position || 'center',
                              transform: cat.image_zoom && cat.image_zoom !== 100 ? `scale(${cat.image_zoom / 100})` : undefined,
                              transformOrigin: cat.image_position || 'center',
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center opacity-30"
                            style={{ backgroundColor: categoryColor }}
                          >
                            <IconComponent size={64} className="text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Icon badge */}
                        <div
                          className="absolute bottom-3 left-4 w-11 h-11 rounded-xl flex items-center justify-center border shadow-lg backdrop-blur-md"
                          style={{
                            backgroundColor: `${categoryColor}25`,
                            borderColor: `${categoryColor}80`,
                            color: categoryColor,
                          }}
                        >
                          <IconComponent size={22} />
                        </div>

                        {/* Badges top right */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          {cat.featured && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFC400] text-black shadow-sm">
                              <Star size={10} className="fill-black" /> Kiemelt
                            </span>
                          )}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white backdrop-blur border border-white/10">
                            {catArticlesCount} cikk
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                            {cat.name}
                          </h3>
                          {cat.description && (
                            <p className="mt-1.5 text-xs text-gray-600 leading-relaxed line-clamp-2">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-100 text-xs font-bold text-accent flex items-center justify-between group-hover:translate-x-0.5 transition-transform">
                          <span>Cikkek megtekintése</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {activeCategoryObj ? `${activeCategoryObj.name} cikkek` : 'Elérhető Szakmai Cikkek'} ({filteredArticles.length})
            </h2>

            {(selectedCategory || selectedDifficulty || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedDifficulty(null);
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-accent hover:underline"
              >
                Szűrők törlése
              </button>
            )}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
              <BookOpen size={40} className="mx-auto text-gray-300" />
              <h3 className="text-base font-bold text-gray-900">Nem található cikk</h3>
              <p className="text-xs text-gray-500">Próbáld meg módosítani a keresési szűrőket vagy a kategóriát.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => {
                const catObj = categories.find((c) => c.id === article.category_id);
                return (
                  <div
                    key={article.id}
                    onClick={() => onNavigate('article', { articleSlug: article.slug })}
                    className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-accent shadow-sm hover:shadow-md text-left transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {article.difficulty && (
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${difficultyColors[article.difficulty]}`}
                          >
                            {difficultyLabels[article.difficulty]}
                          </span>
                        )}
                        {catObj && (
                          <span className="text-xs bg-gray-100 text-gray-700 font-semibold px-2.5 py-0.5 rounded-md">
                            {catObj.name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-xs md:text-sm leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 text-xs text-gray-400 gap-2 shrink-0">
                      <span className="flex items-center gap-1 font-medium text-gray-600">
                        <TrendingUp size={13} className="text-accent" /> {formatViews(article.views)} megtekintés
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {article.read_time} perc olvasás
                      </span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={13} fill="currentColor" /> {article.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
