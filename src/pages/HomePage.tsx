import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  BookOpen,
  Wrench,
  Layers,
  Zap,
  Droplets,
  Home,
  Star,
  Clock,
  HardHat,
  AlertCircle,
  Paintbrush,
  Thermometer,
  Anchor,
  Cable,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { getCategories, getPopularArticles } from '../lib/api';
import type { Category, Article } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getPartnerHighlights, getAdvertisementSlots, recordAdClick, type PartnerHighlight, type AdvertisementSlot } from '../services/advertisementService';
import { TopAdBanner, InFeedAdBanner } from '../components/ModernAdBanner';
import { useSiteSettings } from '../services/siteSettingsService';
import {
  getHeroState,
  getActiveHeroImages,
  type HeroState,
} from '../services/heroImageService';

interface HomePageProps {
  onNavigate: (page: string, params?: { articleSlug?: string }) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Layers,
  Home,
  Zap,
  Droplets,
  Wrench,
  HardHat,
  BookOpen,
  TrendingUp,
  Paintbrush,
  Thermometer,
  Anchor,
  Cable,
};

export default function HomePage({ onNavigate }: HomePageProps) {
  const siteSettings = useSiteSettings();
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [partners, setPartners] = useState<PartnerHighlight[]>([]);
  const [adSlots, setAdSlots] = useState<AdvertisementSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const [categoriesData, articlesData, partnersData, slotsData] = await Promise.all([
          getCategories(),
          getPopularArticles(6),
          getPartnerHighlights(),
          getAdvertisementSlots(),
        ]);
        setCategories(categoriesData);
        setArticles(articlesData);
        setPartners(partnersData);
        setAdSlots(slotsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Hiba történt az adatok betöltésekor'
        );
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

  const popularTopics = [
    'Betonozás',
    'Villanyszerelés',
    'Zsaluzat',
    'Alapozás',
    'Tetőfedés',
    'Burkolás',
  ];

  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt="Építkezés"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/80" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                <HardHat size={14} />
                Az oldal fejlesztés alatt
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-white whitespace-pre-line">
                {siteSettings.heroMainTitle || 'Magyarország vezető építőipari tudásbázisa'}
              </h1>

              <p className="mt-6 text-lg text-gray-300 max-w-lg">
                {siteSettings.heroSubtitle || 'Szakmai enciklopédia, megbízható útmutatók, kalkulátorok és szerszámkatalógus szakembereknek.'}
              </p>

              {/* Search */}
              <div className="mt-8 relative max-w-xl">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Keress cikket, fogalmat vagy szerszámot..."
                  className="w-full rounded-xl bg-white py-4 pl-12 pr-4 text-sm text-gray-800 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Popular topics */}
              <div className="mt-6 flex flex-wrap gap-2">
                {popularTopics.map((topic) => (
                  <button
                    key={topic}
                    className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white transition-all hover:bg-white/20 hover:border-white/30"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Right - Dynamic Hero Image Element */}
            <div className="mt-10 lg:mt-0 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[300px] md:h-[400px] bg-[#0A0D14] border border-white/10 group">
                {activeHeroImages.map((img, idx) => (
                  <img
                    key={img.id || idx}
                    src={img.imageUrl}
                    alt={img.altText || 'ÉpítőTudás vizuális elem'}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                      idx === currentHeroIndex
                        ? 'opacity-100 scale-100 z-10'
                        : 'opacity-0 scale-105 z-0 pointer-events-none'
                    }`}
                  />
                ))}

                {/* Slideshow dots when slideshow mode is active and indicators are enabled */}
                {heroState.config.rotationMode === 'slideshow' &&
                  heroState.config.showIndicators !== false &&
                  activeHeroImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-xl">
                      {activeHeroImages.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          onClick={() => setCurrentHeroIndex(idx)}
                          title={img.altText || `Kép ${idx + 1}`}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === currentHeroIndex ? 'w-6 bg-accent' : 'w-2 bg-white/40 hover:bg-white/70'
                          }`}
                          aria-label={`Ugrás a(z) ${idx + 1}. képre`}
                        />
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

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Építőipari Szakági Kategóriák
            </h2>
            <p className="mt-2 text-gray-600">Böngéssz szakterület és technológia szerint</p>
          </div>
          <button
            onClick={() => onNavigate('category')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-800 transition-colors"
          >
            Összes kategória megtekintése <ArrowRight size={14} />
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">Nem találhatók kategóriák</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...categories]
              .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
              .map((category) => {
                const Icon = iconMap[category.icon_name || 'Layers'] || Layers;
                const categoryColor = category.color || '#FFC400';

                return (
                  <div
                    key={category.id}
                    onClick={() => onNavigate('category')}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between hover:border-accent/50"
                  >
                    {/* Cover image header */}
                    <div className="h-36 relative bg-gray-900 overflow-hidden flex items-center justify-center">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-85"
                          style={{
                            objectFit: (category.image_fit as 'cover' | 'contain' | 'fill') || 'cover',
                            objectPosition: category.image_position || 'center',
                            transform: category.image_zoom && category.image_zoom !== 100 ? `scale(${category.image_zoom / 100})` : undefined,
                            transformOrigin: category.image_position || 'center',
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center opacity-30"
                          style={{ backgroundColor: categoryColor }}
                        >
                          <Icon size={64} className="text-white" />
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
                        <Icon size={22} />
                      </div>

                      {/* Badges top right */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {category.featured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFC400] text-black shadow-sm">
                            <Star size={10} className="fill-black" /> Kiemelt
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 text-white backdrop-blur border border-white/10">
                          {category.article_count} cikk
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="mt-1.5 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform">
                        <span>Böngészés szakterület szerint</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* In-Feed Sponsored Modern Banner */}
      <InFeedAdBanner slots={adSlots} onNavigate={onNavigate} />

      {/* Popular articles */}
      <section className="bg-white border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Népszerű cikkek
              </h2>
              <p className="mt-2 text-gray-600">
                A legtöbbet olvasott szakmai útmutatók
              </p>
            </div>
            <button
              onClick={() => onNavigate('category')}
              className="hidden md:flex items-center gap-2 text-accent font-semibold hover:gap-3 transition-all"
            >
              Összes cikk <ArrowRight size={18} />
            </button>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nem találhatók cikkek</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => onNavigate('article', { articleSlug: article.slug })}
                  className="group bg-background rounded-xl p-6 text-left border border-gray-200 transition-all hover:shadow-lg hover:border-accent/40"
                >
                  <div className="mb-4">
                    <span className="inline-block rounded-md bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      {categories.find((c) => c.id === article.category_id)?.name ||
                        'Általános'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-green-500" />
                        {formatViews(article.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {article.read_time} perc
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      {article.rating.toFixed(1)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <button
              onClick={() => onNavigate('category')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-lg"
            >
              Összes cikk <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Partner Highlights */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Partneri Ajánlók & Kiemelt Szervezetek</h2>
            <p className="text-sm text-gray-500 mt-1">Ipari gyártók, szakképző intézmények és szakmai támogatóink</p>
          </div>
          <button
            onClick={() => onNavigate('partners')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent font-bold text-xs rounded-xl hover:bg-accent hover:text-black transition-all"
          >
            Összes Partner Megtekintése <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <a
              key={partner.id}
              href={partner.websiteUrl || '#'}
              target={partner.websiteUrl ? '_blank' : '_self'}
              rel="noopener noreferrer"
              onClick={() => {
                if (partner.id) recordAdClick(partner.id);
              }}
              className="group bg-white border border-gray-200 hover:border-accent rounded-xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded">
                    {partner.category}
                  </span>
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1 group-hover:text-accent transition-colors">
                    Minősített Partner <ExternalLink size={12} />
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {partner.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{partner.description}</p>
              </div>
              <div className="text-xs text-accent font-bold border-t border-gray-100 pt-3 flex items-center justify-between group-hover:translate-x-0.5 transition-transform">
                <span>Partner weboldalának megnyitása</span>
                <ArrowRight size={14} />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* CTA - only for signed-out visitors */}
      {!session && (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Kezdj el tanulni ma
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Regisztrálj, és hozz létre saját könyvjelzőket, írd meg saját
            cikkeidet, és csatlakozz az építőipari közösséghez.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('register')}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-black font-semibold rounded-lg transition-colors"
            >
              Regisztráció
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
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