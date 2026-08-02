import { ExternalLink, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { recordAdClick, type AdvertisementSlot } from '../services/advertisementService';

interface TopBannerProps {
  slots: AdvertisementSlot[];
}

export function TopAdBanner({ slots }: TopBannerProps) {
  // Show top banner if active non-placeholder slot exists
  const activeSlots = slots.filter((s) => s.location === 'top_banner' && !s.isPlaceholder);
  if (activeSlots.length === 0) return null;

  return (
    <div className="bg-slate-50/95 border-b border-slate-200/80 py-2.5 px-4 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        {activeSlots.slice(0, 1).map((slot) => (
          <a
            key={slot.id}
            href={slot.targetUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordAdClick(slot.id)}
            className="w-full group flex items-center justify-between gap-4 bg-white hover:bg-slate-50/90 border border-slate-200/80 hover:border-teal-700/40 p-2.5 sm:px-4 rounded-2xl transition-all duration-300 shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              {slot.imageUrl ? (
                <div className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200/80 w-10 h-10 bg-slate-100">
                  <img
                    src={slot.imageUrl}
                    alt={slot.sponsorName || 'Banner'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-700/20 flex items-center justify-center text-[#0F766E] shrink-0">
                  <Sparkles size={18} />
                </div>
              )}

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-700/20 text-[#0F766E] font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse" />
                    {slot.sponsorName || 'Bosch Professional Magyarország'}
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-xs text-teal-800 font-medium">
                    <ShieldCheck size={13} className="text-[#0F766E]" /> Hivatalos Partner
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-[#0F766E] transition-colors truncate">
                  {slot.title}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all duration-300 group-hover:translate-x-0.5">
              <span>Ajánlat megtekintése</span>
              <ExternalLink size={13} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

interface InFeedAdBannerProps {
  slots: AdvertisementSlot[];
  onNavigate?: (page: string) => void;
}

export function InFeedAdBanner({ slots, onNavigate }: InFeedAdBannerProps) {
  const inFeedSlots = slots.filter((s) => s.location === 'in_feed' && !s.isPlaceholder);
  const activeSlot = inFeedSlots[0];

  if (activeSlot) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 p-6 md:p-8 shadow-2xl group hover:border-amber-400/60 transition-all duration-300">
          {/* Background glowing blurred decorative gradients */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Image section */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg aspect-video lg:aspect-[4/3]">
                <img
                  src={activeSlot.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
                  alt={activeSlot.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-amber-300 font-semibold bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-amber-400" />
                    {activeSlot.sponsorName || 'Kiemelt Szponzor'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">Hirdetés</span>
                </div>
              </div>
            </div>

            {/* Content section */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles size={13} /> Szakmai Partneri Ajánlat
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight group-hover:text-amber-300 transition-colors">
                {activeSlot.title}
              </h3>

              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                Fedezd fel a legújabb ipari szerszámokat, innovatív gépeket és minősített építőanyagokat közvetlenül a gyártó hivatalos kínálatából.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href={activeSlot.targetUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => recordAdClick(activeSlot.id)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all duration-300 shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
                >
                  <span>Ajánlat Megtekintése</span>
                  <ExternalLink size={16} />
                </a>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('partners')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-sm border border-white/10 transition-all duration-300"
                  >
                    <span>Összes Partnerünk</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Fallback Promo Banner for Industrial Partners
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/20 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left max-w-2xl">
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
              className="shrink-0 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all duration-300 shadow-lg shadow-amber-500/20 hover:scale-105 flex items-center gap-2"
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
