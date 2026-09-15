import {
  Building2,
  Tag,
  Package,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Eye,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import type { PartnerView } from '../components/PartnerLayout';

interface PartnerDashboardPageProps {
  onNavigateView: (view: PartnerView) => void;
}

export function PartnerDashboardPage({ onNavigateView }: PartnerDashboardPageProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5" />
              Partneri Fiók
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              Üdvözlünk a Partner Panelen!
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Menedzseld saját cégprofilodat, megjelenített ajánlataidat, termékeidet és kövesd nyomon partnereid elérését a platformon.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateView('partner_offers')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              Új ajánlat feladása
            </button>
          </div>
        </div>
      </div>

      {/* Profile Completeness & Status Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-start sm:items-center gap-3.5 w-full sm:w-auto min-w-0">
          <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-xs sm:text-base font-bold text-white leading-snug">Partner Profil Státusz: Aktív &amp; Hitelesített</h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Profilod kitöltöttsége 95% - A cégadatok megjelenése naprakész.</p>
          </div>
        </div>

        <button
          onClick={() => onNavigateView('partner_profile')}
          className="w-full sm:w-auto shrink-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors text-center"
        >
          Profil szerkesztése
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl shrink-0">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-bold text-white block">4</span>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Aktív ajánlatok</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl shrink-0">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-bold text-white block">18</span>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Termékek / Szolgáltatások</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl shrink-0">
            <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-bold text-white block">1,420</span>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Profil megtekintések</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
          <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xl sm:text-2xl font-bold text-white block">+18.5%</span>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">Havi növekedés</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 sm:p-6 transition-all group">
          <div className="p-2.5 sm:p-3 bg-blue-500/10 text-blue-400 w-fit rounded-xl mb-3 sm:mb-4">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Partner Profil Megjelenés</h3>
          <p className="text-xs text-slate-400 mb-4 sm:mb-6 leading-relaxed">
            Frissítsd a céges elérhetőségeket, logót, leírást és hivatkozásokat.
          </p>
          <button
            onClick={() => onNavigateView('partner_profile')}
            className="flex items-center gap-2 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform"
          >
            Profil beállítások <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 sm:p-6 transition-all group">
          <div className="p-2.5 sm:p-3 bg-purple-500/10 text-purple-400 w-fit rounded-xl mb-3 sm:mb-4">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Ajánlatok és Kedvezmények</h3>
          <p className="text-xs text-slate-400 mb-4 sm:mb-6 leading-relaxed">
            Tegyél közzé promóciókat és szakmai ajánlatokat az ÉpítőTudás közössége számára.
          </p>
          <button
            onClick={() => onNavigateView('partner_offers')}
            className="flex items-center gap-2 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform"
          >
            Ajánlatok kezelése <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 sm:p-6 transition-all group">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 text-amber-400 w-fit rounded-xl mb-3 sm:mb-4">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">Statisztikák és Analitika</h3>
          <p className="text-xs text-slate-400 mb-4 sm:mb-6 leading-relaxed">
            Mérd fel ajánlataid és katalógusbeli termékeid teljesítményét.
          </p>
          <button
            onClick={() => onNavigateView('partner_stats')}
            className="flex items-center gap-2 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform"
          >
            Statisztikák megnyitása <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
