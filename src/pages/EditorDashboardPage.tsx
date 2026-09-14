import {
  FileText,
  BookMarked,
  CheckCircle,
  Clock,
  PlusCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import type { EditorView } from '../components/EditorLayout';

interface EditorDashboardPageProps {
  onNavigateView: (view: EditorView) => void;
}

export function EditorDashboardPage({ onNavigateView }: EditorDashboardPageProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5" />
              Szerkesztői Munkatér
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Üdvözlünk a Szerkesztői Panelen!
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Itt kezelheted a saját szakmai cikkeidet, kivitelezési útmutatóidat, tananyagaidat és ellenőrizheted a felülvizsgálatra váró tartalmaid státuszát.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateView('articles')}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              Új cikk írása
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">12</span>
            <p className="text-xs text-slate-400 font-medium">Saját cikkek</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">5</span>
            <p className="text-xs text-slate-400 font-medium">Útmutatók</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">3</span>
            <p className="text-xs text-slate-400 font-medium">Felülvizsgálatra vár</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">14</span>
            <p className="text-xs text-slate-400 font-medium">Publikált tartalmak</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 transition-all group">
          <div className="p-3 bg-amber-500/10 text-amber-400 w-fit rounded-xl mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Cikkek és Hírek Szerkesztése</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Hozz létre új szakmai cikkeket vagy szerkeszd meglévő piszkozataidat.
          </p>
          <button
            onClick={() => onNavigateView('articles')}
            className="flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform"
          >
            Tovább a cikkekhez <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 transition-all group">
          <div className="p-3 bg-blue-500/10 text-blue-400 w-fit rounded-xl mb-4">
            <BookMarked className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Kivitelezési Útmutatók</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Készíts lépésről lépésre követhető kivitelezési útmutatókat a szakemberek számára.
          </p>
          <button
            onClick={() => onNavigateView('utmutatok')}
            className="flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform"
          >
            Tovább az útmutatókhoz <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 transition-all group">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 w-fit rounded-xl mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Moderációs Várólista</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Tekintsd át a jóváhagyásra beküldött vagy szerkesztésre váró cikkek státuszát.
          </p>
          <button
            onClick={() => onNavigateView('moderation')}
            className="flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform"
          >
            Várólista megtekintése <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
