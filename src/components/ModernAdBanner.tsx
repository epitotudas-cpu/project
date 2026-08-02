import { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { recordAdClick, recordAdImpression, type AdvertisementSlot } from '../services/advertisementService';
import { getCreativesByPlacementSync } from '../services/bannerCreativeService';
import type { AdCreative, BackgroundStyle, ButtonStyle, AnimationType, TransitionEffect } from '../lib/supabase';

interface TopBannerProps {
  slots?: AdvertisementSlot[];
}

export function TopAdBanner({ slots }: TopBannerProps) {
  const [creatives, setCreatives] = useState<AdCreative[]>(() => getCreativesByPlacementSync('top_banner'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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

  // Dynamic Auto-rotation timer reading each ad's rotation_seconds
  useEffect(() => {
    if (creatives.length <= 1 || isHovered) return;

    const durationSeconds = activeCreative?.rotation_seconds || 6;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % creatives.length);
    }, Math.max(2, durationSeconds) * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, creatives.length, isHovered, activeCreative?.rotation_seconds]);

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
      <div className="bg-slate-50 border-b border-slate-200 py-2.5 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={activeSlot.targetUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordAdClick(activeSlot.id)}
            className="w-full group flex flex-col sm:flex-row items-center justify-between gap-3 bg-white hover:bg-slate-50/90 border border-slate-200/80 p-3 sm:px-4 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-center gap-3 min-w-0 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-700/20 flex items-center justify-center text-[#0F766E] shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-700/20 text-[#0F766E] font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                    {activeSlot.sponsorName || 'Partner'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {activeSlot.title}
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 bg-[#0F766E] text-white font-bold text-xs px-4 py-2 rounded-xl">
              <span>Ajánlat megtekintése</span>
              <ExternalLink size={13} />
            </div>
          </a>
        </div>
      </div>
    );
  }

  // Background style helper
  const getBackgroundClasses = (bg: BackgroundStyle) => {
    switch (bg) {
      case 'light_neutral':
        return 'bg-slate-50 border-b border-slate-200 text-slate-900 shadow-xs';
      case 'dark_slate':
        return 'bg-slate-950 border-b border-slate-800 text-white shadow-md';
      case 'petrol_teal':
        return 'bg-[#0F766E] border-b border-teal-600 text-white shadow-md';
      case 'glassmorphism':
        return 'bg-slate-900/90 backdrop-blur-xl border-b border-white/20 text-white shadow-md';
      case 'soft_gradient':
        return 'bg-gradient-to-r from-teal-900 via-slate-900 to-amber-950 border-b border-teal-500/40 text-white shadow-md';
      default:
        return 'bg-slate-50 border-b border-slate-200 text-slate-900';
    }
  };

  // Button style helper
  const getButtonClasses = (btn: ButtonStyle) => {
    switch (btn) {
      case 'petrol_teal':
        return 'bg-[#0F766E] hover:bg-[#115E59] text-white border border-teal-500/40 shadow-xs';
      case 'amber_gold':
        return 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-400/50 shadow-sm';
      case 'dark_slate':
        return 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/50 shadow-xs';
      case 'outline':
        return 'bg-transparent border-2 border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white font-black';
      default:
        return 'bg-[#0F766E] text-white';
    }
  };

  // Animation helper
  const getAnimationClass = (anim: AnimationType) => {
    switch (anim) {
      case 'fade_in':
        return 'animate-banner-fade-in';
      case 'float':
        return 'animate-banner-float';
      case 'pulse':
        return 'animate-banner-pulse';
      case 'marquee':
        return 'animate-banner-marquee';
      default:
        return '';
    }
  };

  // Inter-banner Transition Helper
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

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`py-2 px-3 sm:py-2.5 sm:px-4 sticky top-0 z-30 transition-colors duration-500 ${getBackgroundClasses(
        activeCreative.background_style
      )}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
        {/* Banner Clickable Main Card */}
        <a
          key={`${activeCreative.id}-${currentIndex}`}
          href={activeCreative.cta_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordAdClick(activeCreative.id)}
          className={`w-full group flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:px-4 rounded-2xl transition-all duration-300 ${
            activeCreative.background_style === 'light_neutral'
              ? 'bg-white hover:bg-slate-50/90 border border-slate-200/80 shadow-xs'
              : 'bg-black/20 hover:bg-black/40 border border-white/10'
          } ${getTransitionClass(activeCreative.transition_effect)} ${getAnimationClass(
            activeCreative.animation_type
          )}`}
        >
          <div
            className={`w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3.5 min-w-0 ${
              activeCreative.text_align === 'center'
                ? 'text-center items-center'
                : activeCreative.text_align === 'right'
                ? 'sm:flex-row-reverse text-center sm:text-right items-center'
                : 'text-center sm:text-left items-center sm:items-start'
            }`}
          >
            {activeCreative.image_url ? (
              <div className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200/80 w-10 h-10 bg-slate-100 shadow-sm">
                <picture>
                  {activeCreative.mobile_image_url && (
                    <source media="(max-width: 640px)" srcSet={activeCreative.mobile_image_url} />
                  )}
                  <img
                    src={activeCreative.image_url}
                    alt={activeCreative.partner_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </picture>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-700/20 flex items-center justify-center text-[#0F766E] shrink-0">
                <Sparkles size={18} />
              </div>
            )}

            <div
              className={`min-w-0 space-y-0.5 ${
                activeCreative.text_align === 'center'
                  ? 'text-center'
                  : activeCreative.text_align === 'right'
                  ? 'text-center sm:text-right'
                  : 'text-center sm:text-left'
              }`}
            >
              <div
                className={`flex items-center justify-center gap-2 flex-wrap ${
                  activeCreative.text_align === 'center'
                    ? 'sm:justify-center'
                    : activeCreative.text_align === 'right'
                    ? 'sm:justify-end'
                    : 'sm:justify-start'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-700/20 text-[#0F766E] font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse" />
                  {activeCreative.partner_name}
                </span>
                {activeCreative.badge_text && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800">
                    <ShieldCheck size={13} className="text-[#0F766E]" /> {activeCreative.badge_text}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold sm:truncate leading-snug group-hover:text-[#0F766E] transition-colors">
                {activeCreative.headline}
              </p>
            </div>
          </div>

          <div
            className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl transition-all duration-300 group-hover:translate-x-0.5 ${getButtonClasses(
              activeCreative.button_style
            )}`}
          >
            <span>{activeCreative.cta_text || 'Ajánlat megtekintése'}</span>
            <ExternalLink size={13} />
          </div>
        </a>

        {/* Multi-banner Rotator Navigation Controls */}
        {creatives.length > 1 && (
          <div className="shrink-0 flex items-center gap-1.5 bg-black/20 px-2 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button
              onClick={handlePrev}
              title="Előző banner"
              className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Pagination indicators with seconds tooltip */}
            <div className="flex items-center gap-1 px-1">
              {creatives.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  title={`${c.partner_name} (Prioritás: ${c.sort_order}, Váltás: ${c.rotation_seconds || 6} mp)`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'w-5 bg-[#0F766E]' : 'w-2 bg-gray-400/50 hover:bg-white'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              title="Következő banner"
              className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
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
          <img src={activeCreative.image_url} alt={activeCreative.headline} className="w-full h-full object-cover" />
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
