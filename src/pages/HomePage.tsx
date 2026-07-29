import { useState, useEffect } from 'react';
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
  const { session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [partners, setPartners] = useState<PartnerHighlight[]>([]);
  const [adSlots, setAdSlots] = useState<AdvertisementSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-white">
                Minden tudás,
                <br />
                <span className="text-accent">egy helyen.</span>
              </h1>

              <p className="mt-6 text-lg text-gray-300 max-w-lg">
                Szakmai útmutatók, fogalmak és eszközadatlapok az építőipar minden
                területéről.
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

            {/* Right - Hero Image */}
            <div className="mt-10 lg:mt-0 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/hero-construction.jpg"
                  alt="Építőmunkások"
                  className="w-full h-[300px] md:h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Banner Ads (Admin Configured) */}
      {adSlots.filter((slot) => !slot.isPlaceholder && slot.location === 'top_banner').length > 0 && (
        <div className="bg-[#0D121F] border-b border-[#1E293B] py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
            {adSlots
              .filter((slot) => !slot.isPlaceholder && slot.location === 'top_banner')
              .map((slot) => (
                <a
                  key={slot.id}
                  href={slot.targetUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordAdClick(slot.id)}
                  className="w-full bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-500/30 hover:border-amber-500 p-3.5 rounded-2xl flex items-center justify-between text-xs transition-all group shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                      Kiemelt Ajánlat: {slot.sponsorName}
                    </span>
                    <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      {slot.title}
                    </span>
                  </div>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    Megtekintés <ExternalLink size={12} />
                  </span>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Kategóriák
          </h2>
          <p className="mt-2 text-gray-600">Böngéssz szakterület szerint</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nem találhatók kategóriák</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = iconMap[category.icon_name || 'Layers'] || Layers;
              const accentColors = [
                'bg-blue-100 text-blue-600',
                'bg-green-100 text-green-600',
                'bg-amber-100 text-amber-600',
                'bg-purple-100 text-purple-600',
                'bg-red-100 text-red-600',
                'bg-cyan-100 text-cyan-600',
                'bg-orange-100 text-orange-600',
                'bg-teal-100 text-teal-600',
              ];
              const colorClass =
                accentColors[
                  Math.abs(category.name.charCodeAt(0) - 32) % accentColors.length
                ];
              return (
                <button
                  key={category.id}
                  onClick={() => onNavigate('category')}
                  className="group bg-white rounded-xl p-6 text-left shadow-sm border border-gray-200 transition-all hover:shadow-lg hover:border-accent/40 hover:scale-[1.02]"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {category.article_count} cikk
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

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