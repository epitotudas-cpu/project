import { useState, useEffect } from 'react';
import { optimizeImageUrl } from '../utils/imageOptimizer';
import { ExternalLink, Sparkles, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { recordAdClick, recordAdImpression, type AdvertisementSlot } from '../services/advertisementService';
import { getCreativesByPlacementSync } from '../services/bannerCreativeService';
import type { AdCreative, TransitionEffect } from '../lib/supabase';

interface TopBannerProps {
  slots?: AdvertisementSlot[];
}

export function TopAdBanner({ slots }: TopBannerProps) {
  const [creatives, setCreatives] = useState<AdCreative[]>(() => getCreativesByPlacementSync('top_banner'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    function handleCreativeChange() {
      const updated = getCreativesByPlacementSync('top_banner');
      setCreatives(updated ? [...updated] : []);
      setCurrentIndex(0);
    }

    window.addEventListener('ad-creative-changed', handleCreativeChange);
    return () => window.removeEventListener('ad-creative-changed', handleCreativeChange);
  }, []);

  const activeCreative = creatives[currentIndex] || creatives[0];

  // Dynamic Auto-rotation timer - pauses on hover OR keyboard focus
  useEffect(() => {
    if (creatives.length <= 1 || isHovered || isFocused) return;

    const durationSeconds = activeCreative?.rotation_seconds || 6;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % creatives.length);
    }, Math.max(2, durationSeconds) * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, creatives.length, isHovered, isFocused, activeCreative?.rotation_seconds]);

  useEffect(() => {
    if (activeCreative?.id && activeCreative.is_active) {
      recordAdImpression(activeCreative.id);
    }
  }, [activeCreative?.id, activeCreative?.is_active]);

  if (!activeCreative || !activeCreative.is_active) {
    const activeSlots = slots?.filter((s) => s.location === 'top_banner' && !s.isPlaceholder) || [];
    const activeSlot = activeSlots[0];
    if (!activeSlot) return null;

    return (
      <aside aria-label="Partneri ajánlat csík" className="w-full bg-slate-950 border-b border-slate-800/80 py-3 px-4 sticky top-0 z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <a
            href={activeSlot.targetUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordAdClick(activeSlot.id)}
            className="w-full group flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 p-4 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-md"
          >
            <div className="flex flex-col md:flex-row items-center gap-3.5 min-w-0 text-center md:text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 font-black text-xs">
                {activeSlot.sponsorName.charAt(0)}
              </div>
              <div className="min-w-0 space-y-1">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                  {activeSlot.sponsorName || 'Hivatalos partner'}
                </span>
                <p className="text-sm md:text-base font-bold text-white truncate">
                  {activeSlot.title}
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm h-11 px-5 rounded-xl transition-all shadow-sm group-hover:scale-[1.02]">
              <span>Ajánlat megtekintése</span>
              <ExternalLink size={14} />
            </div>
          </a>
        </div>
      </aside>
    );
  }

  function handlePrev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? creatives.length - 1 : prev - 1));
  }

  function handleNext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % creatives.length);
  }

  const accentColor = activeCreative.accent_color || '#FFC400';

  return (
    <aside
      role="region"
      aria-roledescription="carousel"
      aria-label="Partneri reklámajánlatok"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="w-full bg-slate-950 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-3 py-2.5 sm:px-4 md:px-6 md:py-3.5">
        <div className="relative group/banner flex items-center">
          
          {/* Main Clickable Promo Card */}
          <a
            key={`${activeCreative.id}-${currentIndex}`}
            href={activeCreative.cta_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordAdClick(activeCreative.id)}
            className="w-full block relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 sm:p-4 md:px-6 md:py-4 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 motion-reduce:transition-none"
            style={{
              borderLeft: `4px solid ${accentColor}`,
            }}
          >
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-6">
              
              {/* Left Column: Badge & Partner Name / Logo */}
              <div className="w-full md:w-1/4 lg:w-1/5 shrink-0 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse motion-reduce:animate-none" />
                    {activeCreative.badge_text || 'Hivatalos partner'}
                  </span>
                </div>

                {activeCreative.logo_url ? (
                  <div className="h-7 max-w-[130px] shrink-0 overflow-hidden flex items-center">
                    <img
                      src={activeCreative.logo_url}
                      alt={activeCreative.partner_name}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40`, color: accentColor }}
                      className="w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0"
                    >
                      {activeCreative.partner_name.charAt(0)}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[150px]">
                      {activeCreative.partner_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Middle Column: Headline & Description */}
              <div className="flex-1 min-w-0 space-y-1 text-left">
                <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-white leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">
                  {activeCreative.headline}
                </h3>
                {activeCreative.description && (
                  <p className="text-xs md:text-sm text-gray-300 line-clamp-2 font-normal leading-normal max-w-2xl">
                    {activeCreative.description}
                  </p>
                )}
              </div>

              {/* Right Column: Campaign Image & Primary CTA Button */}
              <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row items-center justify-end gap-3 md:gap-5">
                
                {/* Campaign Image */}
                {activeCreative.image_url ? (
                  <div className="hidden sm:block w-36 md:w-44 lg:w-48 h-24 md:h-28 rounded-xl overflow-hidden border border-slate-800 shadow-xs shrink-0 bg-slate-950">
                    <picture>
                      {activeCreative.mobile_image_url && (
                        <source media="(max-width: 640px)" srcSet={activeCreative.mobile_image_url} />
                      )}
                      <img
                        src={activeCreative.image_url}
                        alt={activeCreative.headline}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 motion-reduce:transition-none"
                      />
                    </picture>
                  </div>
                ) : (
                  <div className="hidden sm:flex w-36 md:w-44 lg:w-48 h-24 md:h-28 rounded-xl border border-slate-800 bg-slate-950/60 items-center justify-center text-amber-400/80 shrink-0">
                    <Sparkles size={24} />
                  </div>
                )}

                {/* Primary CTA Button */}
                <div
                  style={{
                    backgroundColor: accentColor === '#FEB800' || accentColor === '#FFC400' ? '#FFC400' : accentColor,
                    color: accentColor === '#FEB800' || accentColor === '#FFC400' ? '#000000' : '#FFFFFF',
                  }}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl font-extrabold text-xs md:text-sm inline-flex items-center justify-center gap-2 transition-all duration-300 shadow-sm group-hover:scale-[1.03] group-hover:shadow-md cursor-pointer shrink-0"
                >
                  <span>{activeCreative.cta_text || 'Ajánlat megtekintése'}</span>
                  <ExternalLink size={14} />
                </div>
              </div>
            </div>
          </a>

          {/* Discreet Circular Carousel Arrow Navigation Buttons */}
          {creatives.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Előző szponzorált ajánlat"
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-amber-500 text-gray-300 hover:text-slate-950 border border-slate-700 flex items-center justify-center shadow-md transition-all cursor-pointer opacity-80 group-hover/banner:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500 z-10"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Következő szponzorált ajánlat"
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-amber-500 text-gray-300 hover:text-slate-950 border border-slate-700 flex items-center justify-center shadow-md transition-all cursor-pointer opacity-80 group-hover/banner:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500 z-10"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Carousel Indicator Dots */}
        {creatives.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {creatives.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Ugrás a(z) ${idx + 1}. szponzorált ajánlatra: ${c.partner_name}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  idx === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

interface InFeedAdBannerProps {
  slots?: AdvertisementSlot[];
  onNavigate?: (page: string) => void;
}

export function InFeedAdBanner({ slots, onNavigate }: InFeedAdBannerProps) {
  const [creatives, setCreatives] = useState<AdCreative[]>(() => getCreativesByPlacementSync('in_feed'));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleCreativeChange() {
      const updated = getCreativesByPlacementSync('in_feed');
      setCreatives(updated ? [...updated] : []);
      setCurrentIndex(0);
    }

    window.addEventListener('ad-creative-changed', handleCreativeChange);
    return () => window.removeEventListener('ad-creative-changed', handleCreativeChange);
  }, []);

  const activeCreative = creatives[currentIndex] || creatives[0];

  // Dynamic Auto-rotation timer reading each ad's rotation_seconds
  useEffect(() => {
    if (creatives.length <= 1) return;

    const durationSeconds = activeCreative?.rotation_seconds || 6;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % creatives.length);
    }, Math.max(2, durationSeconds) * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, creatives.length, activeCreative?.rotation_seconds]);

  useEffect(() => {
    if (activeCreative?.id && activeCreative.is_active) {
      recordAdImpression(activeCreative.id);
    }
  }, [activeCreative?.id, activeCreative?.is_active]);

  const activeSlot = slots?.filter((s) => s.location === 'in_feed' && !s.isPlaceholder)?.[0];

  const getTransitionClass = (effect?: TransitionEffect) => {
    switch (effect) {
      case 'slide_left':
        return 'banner-trans-slide-left';
      case 'slide_up':
        return 'banner-trans-slide-up';
      case 'zoom':
        return 'banner-trans-zoom';
      case 'instant':
        return 'banner-trans-instant';
      case 'fade':
      default:
        return 'banner-trans-fade';
    }
  };

  if (activeCreative && activeCreative.is_active) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div
          key={`${activeCreative.id}-${currentIndex}`}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 p-5 sm:p-8 shadow-2xl group hover:border-amber-400/60 transition-all duration-300 ${getTransitionClass(
            activeCreative.transition_effect
          )}`}
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {activeCreative.image_url && (
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-video lg:aspect-[4/3]">
                  <picture>
                    {activeCreative.mobile_image_url && (
                      <source media="(max-width: 640px)" srcSet={activeCreative.mobile_image_url} />
                    )}
                    <img
                      src={activeCreative.image_url}
                      alt={activeCreative.headline}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </picture>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-amber-300 font-semibold bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-amber-400" />
                      {activeCreative.partner_name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Hirdetés</span>
                  </div>
                </div>
              </div>
            )}

            <div className={`${activeCreative.image_url ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 text-center sm:text-left`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles size={13} /> {activeCreative.badge_text || 'Szakmai Partneri Ajánlat'}
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                {activeCreative.headline}
              </h3>

              {activeCreative.description && (
                <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                  {activeCreative.description}
                </p>
              )}

              <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center gap-3.5">
                <a
                  href={activeCreative.cta_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordAdClick(activeCreative.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all duration-300 shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
                >
                  <span>{activeCreative.cta_text || 'Ajánlat Megtekintése'}</span>
                  <ExternalLink size={16} />
                </a>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('partners')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-sm border border-white/10 transition-all duration-300"
                  >
                    <span>Összes Partnerünk</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Carousel indicators for In-Feed if multiple */}
          {creatives.length > 1 && (
            <div className="pt-4 flex items-center justify-center gap-2">
              {creatives.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (activeSlot) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 p-5 sm:p-8 shadow-2xl group hover:border-amber-400/60 transition-all duration-300">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-video lg:aspect-[4/3]">
                <img
                  src={activeSlot.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
                  alt={activeSlot.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {activeSlot.title}
              </h3>
              <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-center gap-3.5">
                <a
                  href={activeSlot.targetUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordAdClick(activeSlot.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm"
                >
                  <span>Ajánlat Megtekintése</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback Promo Banner for Industrial Partners
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/20 p-5 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <Sparkles size={12} /> Szakmai Hirdetési Hely
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white">
              Építőipari Gyártó vagy Forgalmazó Vagy?
            </h3>
            <p className="text-sm text-gray-300">
              Jelenítsd meg termékeidet és szakmai ajánlataidat az ÉpítőTudás több ezer szakembere és tanulója előtt.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('partners')}
              className="w-full md:w-auto shrink-0 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all duration-300 shadow-lg shadow-amber-500/20 hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Partneri Program & Kapcsolat</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function SidebarAdBanner() {
  const [creatives, setCreatives] = useState<AdCreative[]>(() => getCreativesByPlacementSync('sidebar'));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleCreativeChange() {
      const updated = getCreativesByPlacementSync('sidebar');
      setCreatives(updated ? [...updated] : []);
      setCurrentIndex(0);
    }
    window.addEventListener('ad-creative-changed', handleCreativeChange);
    return () => window.removeEventListener('ad-creative-changed', handleCreativeChange);
  }, []);

  const activeCreative = creatives[currentIndex] || creatives[0];

  useEffect(() => {
    if (activeCreative?.id && activeCreative.is_active) {
      recordAdImpression(activeCreative.id);
    }
  }, [activeCreative?.id, activeCreative?.is_active]);

  if (!activeCreative || !activeCreative.is_active) return null;

  return (
    <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between text-xs text-teal-400 font-extrabold uppercase tracking-wider">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} /> {activeCreative.partner_name}
        </span>
        <span className="text-[10px] text-gray-400">Oldalsáv</span>
      </div>

      {activeCreative.image_url && (
        <div className="rounded-xl overflow-hidden aspect-video border border-white/10">
          <img src={optimizeImageUrl(activeCreative.image_url, 600)} alt={activeCreative.headline} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        </div>
      )}

      <h4 className="text-base font-extrabold text-white leading-snug">
        {activeCreative.headline}
      </h4>

      {activeCreative.description && (
        <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
          {activeCreative.description}
        </p>
      )}

      <a
        href={activeCreative.cta_url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => recordAdClick(activeCreative.id)}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs transition-all"
      >
        <span>{activeCreative.cta_text || 'Ajánlat Megtekintése'}</span>
        <ExternalLink size={13} />
      </a>
    </div>
  );
}

export function FooterAdBanner() {
  const [creatives, setCreatives] = useState<AdCreative[]>(() => getCreativesByPlacementSync('footer_banner'));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleCreativeChange() {
      const updated = getCreativesByPlacementSync('footer_banner');
      setCreatives(updated ? [...updated] : []);
      setCurrentIndex(0);
    }
    window.addEventListener('ad-creative-changed', handleCreativeChange);
    return () => window.removeEventListener('ad-creative-changed', handleCreativeChange);
  }, []);

  const activeCreative = creatives[currentIndex] || creatives[0];

  useEffect(() => {
    if (activeCreative?.id && activeCreative.is_active) {
      recordAdImpression(activeCreative.id);
    }
  }, [activeCreative?.id, activeCreative?.is_active]);

  if (!activeCreative || !activeCreative.is_active) return null;

  return (
    <section className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 border-t border-teal-500/30 py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center md:text-left">
          {activeCreative.image_url && (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 hidden sm:block">
              <img src={activeCreative.image_url} alt={activeCreative.partner_name} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
              {activeCreative.partner_name} • {activeCreative.badge_text || 'Kiemelt Partner'}
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-white mt-1">
              {activeCreative.headline}
            </h4>
          </div>
        </div>

        <a
          href={activeCreative.cta_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordAdClick(activeCreative.id)}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2"
        >
          <span>{activeCreative.cta_text || 'Ajánlat Megtekintése'}</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}
