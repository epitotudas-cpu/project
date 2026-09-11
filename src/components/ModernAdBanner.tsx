import { useState, useEffect } from 'react';
import { optimizeImageUrl } from '../utils/imageOptimizer';
import { ExternalLink, Sparkles, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { recordAdClick, recordAdImpression, type AdvertisementSlot } from '../services/advertisementService';
import {
  getCreativesByPlacementSync,
  listBannerCreatives,
  getFallbackVideoSettings,
  listFallbackVideoSettings,
  type FallbackVideoSettings,
} from '../services/bannerCreativeService';
import type { AdCreative, TransitionEffect } from '../lib/supabase';

interface TopBannerProps {
  slots?: AdvertisementSlot[];
}

export function TopAdBanner({ slots: _slots }: TopBannerProps) {
  const [creatives, setCreatives] = useState<AdCreative[]>(() => getCreativesByPlacementSync('top_banner'));
  const [fallbackSettings, setFallbackSettings] = useState<FallbackVideoSettings>(() => getFallbackVideoSettings());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [fallbackVideoError, setFallbackVideoError] = useState(false);

  useEffect(() => {
    async function syncCloud() {
      const allCloud = await listBannerCreatives();
      const activeTop = allCloud.filter((c) => c.placement_key === 'top_banner' && c.is_active);
      setCreatives(activeTop);

      const cloudFallback = await listFallbackVideoSettings();
      setFallbackSettings(cloudFallback);
    }
    syncCloud();

    function handleCreativeChange() {
      const updated = getCreativesByPlacementSync('top_banner');
      setCreatives(updated ? [...updated] : []);
      setCurrentIndex(0);
    }

    function handleFallbackChange() {
      setFallbackSettings(getFallbackVideoSettings());
      setFallbackVideoError(false);
    }

    window.addEventListener('ad-creative-changed', handleCreativeChange);
    window.addEventListener('ad-fallback-video-changed', handleFallbackChange);
    return () => {
      window.removeEventListener('ad-creative-changed', handleCreativeChange);
      window.removeEventListener('ad-fallback-video-changed', handleFallbackChange);
    };
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

  if (!activeCreative || !activeCreative.is_active || creatives.length === 0) {
    if (!fallbackSettings.enabled) {
      return null;
    }

    const rawVideoUrl = fallbackSettings.video_url || 'https://pub-77180ecae5fa4824aa9ef44ab92aaf5a.r2.dev/logó.webm';
    const encodedO = rawVideoUrl.replace(/log[óő]|\/log[óő]\.webm/g, '/log%C3%B3.webm');
    const encodedOE = rawVideoUrl.replace(/log[óő]|\/log[óő]\.webm/g, '/log%C5%91.webm');
    const encodedPlain = rawVideoUrl.replace(/log[óő]|\/log[óő]\.webm/g, '/logo.webm');

    return (
      <aside aria-label="Partneri ajánlat csík" className="w-full bg-slate-950 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-2.5 py-2 sm:px-4 md:px-6 md:py-3.5">
          <a
            href={fallbackSettings.target_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 hover:border-slate-700 h-[140px] sm:h-[185px] md:h-[225px] transition-all duration-300 shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 group/fallback"
            style={{ borderLeft: '4px solid #FFC400' }}
          >
            {/* Background WebM / Mobile Video / Visual Backdrop */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40">
              {fallbackSettings.poster_url && (
                <img
                  src={fallbackSettings.poster_url}
                  alt={fallbackSettings.title}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )}

              {!fallbackVideoError && (
                <video
                  ref={(el) => {
                    if (el) {
                      el.muted = true;
                      el.defaultMuted = true;
                      el.setAttribute('playsinline', 'true');
                      el.setAttribute('webkit-playsinline', 'true');
                      const playPromise = el.play();
                      if (playPromise !== undefined) {
                        playPromise.catch(() => {
                          // Low power mode or mobile autoplay restrictions
                        });
                      }
                    }
                  }}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  poster={fallbackSettings.poster_url || undefined}
                  onError={() => setFallbackVideoError(true)}
                  className="w-full h-full object-cover group-hover/fallback:scale-105 transition-transform duration-700 pointer-events-none relative z-1"
                >
                  <source src={encodedO} type="video/webm" />
                  <source src={encodedOE} type="video/webm" />
                  <source src={encodedPlain} type="video/webm" />
                  <source src={rawVideoUrl} />
                </video>
              )}

              {/* Ambient Glowing Branding Backdrop for Mobile Devices */}
              <div className="absolute inset-0 z-5 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/25 via-transparent to-transparent" />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-slate-950/40 md:bg-gradient-to-r md:from-slate-950/95 md:via-slate-950/80 md:to-slate-950/30" />
            </div>

            {/* Content Layer */}
            <div className="relative z-20 h-full flex flex-col justify-center p-3 sm:p-5 md:p-6 lg:p-8 max-w-3xl text-left items-start">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] uppercase tracking-wider backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {fallbackSettings.sponsor_name || 'ÉpítőTudás • Hirdetési Hely'}
                </span>
              </div>
              <h3 className="mt-1.5 sm:mt-2 text-xs sm:text-base md:text-xl lg:text-2xl font-extrabold text-white leading-tight sm:leading-snug group-hover/fallback:text-amber-400 transition-colors drop-shadow-md line-clamp-2">
                {fallbackSettings.title || 'Szakmai Ajánlatok és Kiemelt Építőipari Partneri Megoldások'}
              </h3>
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
  const hasCtaButton = Boolean(activeCreative.cta_text && activeCreative.cta_text.trim() !== '');
  const isMediaVideo = activeCreative.media_type === 'video';

  const desktopImg = activeCreative.image_url || '';
  const mobileImg = activeCreative.mobile_image_url || desktopImg;
  const desktopVideo = activeCreative.video_url ? encodeURI(activeCreative.video_url) : '';
  const mobileVideo = activeCreative.mobile_video_url ? encodeURI(activeCreative.mobile_video_url) : desktopVideo;

  const animationClass = (() => {
    switch (activeCreative.animation_type) {
      case 'fade_in':
        return 'animate-banner-fade-in';
      case 'float':
        return 'group-hover:scale-105 transition-transform duration-700 ease-out motion-reduce:transform-none';
      case 'pulse':
        return 'animate-banner-pulse';
      case 'marquee':
        return 'animate-banner-marquee';
      default:
        return 'group-hover:scale-102 transition-transform duration-500 motion-reduce:transform-none';
    }
  })();

  const textAlignClasses = (() => {
    switch (activeCreative.text_align) {
      case 'center':
        return 'text-center items-center justify-center mx-auto';
      case 'right':
        return 'text-right items-end justify-center ml-auto';
      case 'left':
      default:
        return 'text-left items-start justify-center';
    }
  })();

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
      <div className="max-w-7xl mx-auto px-2.5 py-2 sm:px-4 md:px-6 md:py-3.5">
        <div className="relative group/banner flex items-center">
          
          {/* Main Full-Surface Clickable Promo Card */}
          <a
            key={`${activeCreative.id}-${currentIndex}`}
            href={activeCreative.cta_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordAdClick(activeCreative.id)}
            className="w-full block relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 hover:border-slate-700 h-[140px] sm:h-[185px] md:h-[225px] transition-all duration-300 shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500 motion-reduce:transition-none"
            style={{
              borderLeft: `4px solid ${accentColor}`,
            }}
          >
            {/* Full-Surface Background Media (Video / Image / GIF) */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
              {isMediaVideo && (desktopVideo || mobileVideo) ? (
                <>
                  {/* Poster / Fallback Image */}
                  {desktopImg && (
                    <picture className="absolute inset-0 w-full h-full block z-0">
                      {mobileImg && <source media="(max-width: 640px)" srcSet={mobileImg} />}
                      <img
                        src={desktopImg}
                        alt={activeCreative.headline}
                        className={`w-full h-full object-cover z-0 ${animationClass}`}
                      />
                    </picture>
                  )}
                  {/* Video Element */}
                  <video
                    key={desktopVideo}
                    src={desktopVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster={desktopImg || undefined}
                    className={`absolute inset-0 w-full h-full object-cover z-10 ${animationClass} pointer-events-none`}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </>
              ) : desktopImg || mobileImg ? (
                <picture className="absolute inset-0 w-full h-full block z-0">
                  {mobileImg && <source media="(max-width: 640px)" srcSet={mobileImg} />}
                  <img
                    src={desktopImg}
                    alt={activeCreative.headline}
                    className={`w-full h-full object-cover z-0 ${animationClass}`}
                  />
                </picture>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-950 text-amber-400/50 z-0">
                  <Sparkles size={48} />
                </div>
              )}

              {/* High Contrast Gradient Overlay */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-slate-950/40 md:bg-gradient-to-r md:from-slate-950/95 md:via-slate-950/80 md:to-slate-950/30 pointer-events-none" />
            </div>

            {/* Content Layer over Background */}
            <div className={`relative z-20 h-full flex flex-col p-4 sm:p-5 md:p-6 lg:p-8 max-w-3xl ${textAlignClasses}`}>
              
              {/* Partner Badge & Name/Logo */}
              <div className={`flex items-center gap-2.5 flex-wrap ${
                activeCreative.text_align === 'center' ? 'justify-center' : activeCreative.text_align === 'right' ? 'justify-end' : 'justify-start'
              }`}>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs backdrop-blur-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse motion-reduce:animate-none" />
                  {activeCreative.badge_text || 'Hivatalos partner'}
                </span>

                {activeCreative.logo_url ? (
                  <div className="h-6 sm:h-7 max-w-[140px] shrink-0 overflow-hidden flex items-center">
                    <img
                      src={activeCreative.logo_url}
                      alt={activeCreative.partner_name}
                      className="h-full w-auto object-contain drop-shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      style={{ backgroundColor: `${accentColor}30`, borderColor: `${accentColor}60`, color: accentColor }}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 shadow-xs"
                    >
                      {activeCreative.partner_name.charAt(0)}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[180px] drop-shadow-xs">
                      {activeCreative.partner_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Headline & Description */}
              <div className="mt-2 space-y-1">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-white leading-snug group-hover:text-amber-400 transition-colors drop-shadow-md line-clamp-2">
                  {activeCreative.headline}
                </h3>
                {activeCreative.description && (
                  <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 sm:line-clamp-3 font-normal leading-relaxed drop-shadow-xs opacity-90 max-w-2xl">
                    {activeCreative.description}
                  </p>
                )}
              </div>

              {/* Optional CTA Button */}
              {hasCtaButton && (
                <div className="mt-3 shrink-0">
                  <div
                    style={{
                      backgroundColor: accentColor === '#FEB800' || accentColor === '#FFC400' ? '#FFC400' : accentColor,
                      color: accentColor === '#FEB800' || accentColor === '#FFC400' ? '#000000' : '#FFFFFF',
                    }}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 sm:px-5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 shadow-md group-hover:scale-105 cursor-pointer"
                  >
                    <span>{activeCreative.cta_text}</span>
                    <ExternalLink size={14} />
                  </div>
                </div>
              )}

            </div>
          </a>

          {/* Carousel Arrow Navigation Buttons */}
          {creatives.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Előző szponzorált ajánlat"
                className="absolute -left-3 md:-left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-amber-500 text-gray-300 hover:text-slate-950 border border-slate-700 flex items-center justify-center shadow-md transition-all cursor-pointer opacity-80 group-hover/banner:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500 z-30"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Következő szponzorált ajánlat"
                className="absolute -right-3 md:-right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-amber-500 text-gray-300 hover:text-slate-950 border border-slate-700 flex items-center justify-center shadow-md transition-all cursor-pointer opacity-80 group-hover/banner:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500 z-30"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Carousel Indicator Dots */}
        {creatives.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2.5">
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
  const [fallbackSettings, setFallbackSettings] = useState<FallbackVideoSettings>(() => getFallbackVideoSettings());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleCreativeChange() {
      const updated = getCreativesByPlacementSync('in_feed');
      setCreatives(updated ? [...updated] : []);
      setCurrentIndex(0);
    }
    function handleFallbackChange() {
      setFallbackSettings(getFallbackVideoSettings());
    }

    window.addEventListener('ad-creative-changed', handleCreativeChange);
    window.addEventListener('ad-fallback-video-changed', handleFallbackChange);
    return () => {
      window.removeEventListener('ad-creative-changed', handleCreativeChange);
      window.removeEventListener('ad-fallback-video-changed', handleFallbackChange);
    };
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
  if (!fallbackSettings.enabled) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/20 p-5 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <Sparkles size={12} /> {fallbackSettings.sponsor_name || 'Szakmai Hirdetési Hely'}
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white">
              {fallbackSettings.title || 'Építőipari Gyártó vagy Forgalmazó Vagy?'}
            </h3>
            <p className="text-sm text-gray-300">
              {fallbackSettings.description || 'Jelenítsd meg termékeidet és szakmai ajánlataidat az ÉpítőTudás több ezer szakembere és tanulója előtt.'}
            </p>
          </div>

          <a
            href={fallbackSettings.target_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto shrink-0 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all duration-300 shadow-lg shadow-amber-500/20 hover:scale-105 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{fallbackSettings.cta_text || 'Partneri Program & Kapcsolat'}</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

export function SidebarAdBanner() {
  const [creatives, setCreatives] = useState<AdCreative[]>(() => getCreativesByPlacementSync('sidebar'));
  const [fallbackSettings, setFallbackSettings] = useState<FallbackVideoSettings>(() => getFallbackVideoSettings());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleCreativeChange() {
      const updated = getCreativesByPlacementSync('sidebar');
      setCreatives(updated ? [...updated] : []);
      setCurrentIndex(0);
    }
    function handleFallbackChange() {
      setFallbackSettings(getFallbackVideoSettings());
    }
    window.addEventListener('ad-creative-changed', handleCreativeChange);
    window.addEventListener('ad-fallback-video-changed', handleFallbackChange);
    return () => {
      window.removeEventListener('ad-creative-changed', handleCreativeChange);
      window.removeEventListener('ad-fallback-video-changed', handleFallbackChange);
    };
  }, []);

  const activeCreative = creatives[currentIndex] || creatives[0];

  useEffect(() => {
    if (activeCreative?.id && activeCreative.is_active) {
      recordAdImpression(activeCreative.id);
    }
  }, [activeCreative?.id, activeCreative?.is_active]);

  if (!activeCreative || !activeCreative.is_active) {
    if (!fallbackSettings.enabled) return null;
    return (
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs text-amber-400 font-extrabold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} /> {fallbackSettings.sponsor_name || 'ÉpítőTudás • Hirdetés'}
          </span>
          <span className="text-[10px] text-gray-400">Oldalsáv</span>
        </div>

        <h4 className="text-base font-extrabold text-white leading-snug">
          {fallbackSettings.title || 'Szakmai Ajánlatok és Kiemelt Építőipari Partneri Megoldások'}
        </h4>

        {fallbackSettings.description && (
          <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
            {fallbackSettings.description}
          </p>
        )}

        <a
          href={fallbackSettings.target_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
        >
          <span>{fallbackSettings.cta_text || 'Kapcsolat'}</span>
          <ExternalLink size={13} />
        </a>
      </div>
    );
  }

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
  const [fallbackSettings, setFallbackSettings] = useState<FallbackVideoSettings>(() => getFallbackVideoSettings());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleCreativeChange() {
      const updated = getCreativesByPlacementSync('footer_banner');
      setCreatives(updated ? [...updated] : []);
      setCurrentIndex(0);
    }
    function handleFallbackChange() {
      setFallbackSettings(getFallbackVideoSettings());
    }
    window.addEventListener('ad-creative-changed', handleCreativeChange);
    window.addEventListener('ad-fallback-video-changed', handleFallbackChange);
    return () => {
      window.removeEventListener('ad-creative-changed', handleCreativeChange);
      window.removeEventListener('ad-fallback-video-changed', handleFallbackChange);
    };
  }, []);

  const activeCreative = creatives[currentIndex] || creatives[0];

  useEffect(() => {
    if (activeCreative?.id && activeCreative.is_active) {
      recordAdImpression(activeCreative.id);
    }
  }, [activeCreative?.id, activeCreative?.is_active]);

  if (!activeCreative || !activeCreative.is_active) {
    if (!fallbackSettings.enabled) return null;
    return (
      <section className="bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border-t border-amber-500/30 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {fallbackSettings.sponsor_name || 'ÉpítőTudás Partneri Program'}
              </span>
              <h4 className="text-sm sm:text-base font-extrabold text-white mt-1">
                {fallbackSettings.title || 'Szakmai Ajánlatok és Kiemelt Építőipari Partneri Megoldások'}
              </h4>
            </div>
          </div>

          <a
            href={fallbackSettings.target_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2"
          >
            <span>{fallbackSettings.cta_text || 'Kapcsolat'}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </section>
    );
  }

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

export function InGridTileAd() {
  const [creatives, setCreatives] = useState<AdCreative[]>(() => {
    const tile = getCreativesByPlacementSync('tile_ad');
    if (tile && tile.length > 0) return tile;
    const inFeed = getCreativesByPlacementSync('in_feed');
    if (inFeed && inFeed.length > 0) return inFeed;
    return getCreativesByPlacementSync('top_banner');
  });

  const [fallbackSettings, setFallbackSettings] = useState<FallbackVideoSettings>(() => getFallbackVideoSettings());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    function handleCreativeChange() {
      const tile = getCreativesByPlacementSync('tile_ad');
      if (tile && tile.length > 0) {
        setCreatives(tile);
      } else {
        const inFeed = getCreativesByPlacementSync('in_feed');
        if (inFeed && inFeed.length > 0) {
          setCreatives(inFeed);
        } else {
          setCreatives(getCreativesByPlacementSync('top_banner') || []);
        }
      }
      setCurrentIndex(0);
    }

    function handleFallbackChange() {
      setFallbackSettings(getFallbackVideoSettings());
    }

    window.addEventListener('ad-creative-changed', handleCreativeChange);
    window.addEventListener('ad-fallback-video-changed', handleFallbackChange);
    return () => {
      window.removeEventListener('ad-creative-changed', handleCreativeChange);
      window.removeEventListener('ad-fallback-video-changed', handleFallbackChange);
    };
  }, []);

  const activeCreative = creatives[currentIndex] || creatives[0];

  useEffect(() => {
    if (activeCreative?.id && activeCreative.is_active) {
      recordAdImpression(activeCreative.id);
    }
  }, [activeCreative?.id, activeCreative?.is_active]);

  if (!activeCreative || !activeCreative.is_active) {
    if (!fallbackSettings.enabled) return null;

    return (
      <article className="h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/50 border-2 border-amber-500/40 hover:border-amber-400 hover:shadow-2xl rounded-3xl transition-all duration-300 group overflow-hidden shadow-xs relative">
        <div>
          {/* Header Cover */}
          <div className="w-full aspect-[16/9] relative overflow-hidden bg-slate-900 flex items-center justify-center">
            {fallbackSettings.poster_url ? (
              <img
                src={optimizeImageUrl(fallbackSettings.poster_url, 600)}
                alt={fallbackSettings.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <Sparkles size={36} className="text-amber-400 mb-2 animate-pulse" />
                <span className="text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Partneri Ajánlat
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                {fallbackSettings.sponsor_name || 'ÉpítőTudás Partner'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-amber-300 border border-amber-500/30 uppercase tracking-widest backdrop-blur-xs">
                Hirdetés
              </span>
            </div>

            {/* Headline overlay */}
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <h3 className="text-base sm:text-lg font-extrabold leading-snug line-clamp-2 text-amber-300 group-hover:text-amber-200 transition-colors">
                {fallbackSettings.title || 'Szakmai Ajánlatok & Partneri Megoldások'}
              </h3>
            </div>
          </div>

          {/* Excerpt */}
          <div className="p-5 space-y-3">
            <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
              {fallbackSettings.description || 'Jelenítsd meg termékeidet és szakmai ajánlataidat az ÉpítőTudás több ezer szakembere előtt.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-3 border-t border-amber-500/20 flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
            <ShieldCheck size={14} /> Szponzorált Csempe
          </span>
          <a
            href={fallbackSettings.target_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-md group-hover:scale-105"
          >
            <span>{fallbackSettings.cta_text || 'Megtekintem'}</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </article>
    );
  }

  const accentColor = activeCreative.accent_color || '#FFC400';

  return (
    <article className="h-full flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 hover:border-amber-400 hover:shadow-2xl rounded-3xl transition-all duration-300 group overflow-hidden shadow-xs relative">
      <div>
        {/* Cover Header */}
        <div className="w-full aspect-[16/9] relative overflow-hidden bg-slate-900 flex items-center justify-center">
          {activeCreative.image_url ? (
            <img
              src={optimizeImageUrl(activeCreative.image_url, 600)}
              alt={activeCreative.headline}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex flex-col items-center justify-center p-4 text-center">
              <Sparkles size={36} className="text-amber-400 mb-2 animate-pulse" />
              <span className="text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                {activeCreative.partner_name}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
              {activeCreative.badge_text || 'Hivatalos Partner'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-amber-300 border border-amber-500/30 uppercase tracking-widest backdrop-blur-xs">
              Hirdetés
            </span>
          </div>

          {/* Headline overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3 className="text-base sm:text-lg font-extrabold leading-snug line-clamp-2 text-white group-hover:text-amber-300 transition-colors">
              {activeCreative.headline}
            </h3>
          </div>
        </div>

        {/* Excerpt */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
            {activeCreative.description || 'Kiemelt szakmai partnerünk ajánlata.'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1 truncate max-w-[140px]">
          <ShieldCheck size={14} className="text-amber-400 shrink-0" />
          <span className="truncate">{activeCreative.partner_name}</span>
        </span>
        <a
          href={activeCreative.cta_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordAdClick(activeCreative.id)}
          style={{
            backgroundColor: accentColor === '#FEB800' || accentColor === '#FFC400' ? '#FFC400' : accentColor,
            color: accentColor === '#FEB800' || accentColor === '#FFC400' ? '#000000' : '#FFFFFF',
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold text-xs transition-all shadow-md group-hover:scale-105 cursor-pointer shrink-0"
        >
          <span>{activeCreative.cta_text || 'Megtekintem'}</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </article>
  );
}

