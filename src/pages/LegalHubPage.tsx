import { ChevronRight, FileText, Lock, Cookie, Scale, ArrowRight } from 'lucide-react';

interface LegalHubPageProps {
  onNavigate: (page: string) => void;
}

export default function LegalHubPage({ onNavigate }: LegalHubPageProps) {
  return (
    <div className="bg-[#f5f5f5] text-[#202628] min-h-screen pb-16">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Jogi Dokumentumok</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
              Jogi Információk
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Jogi Nyilatkozatok &amp; Szabályzatok
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
              Az ÉpítőTudás platform működési szabályzata, adatvédelmi tájékoztatója, általános szerződési feltételei és impresszuma.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Impresszum */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl w-fit">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">Impresszum &amp; Kapcsolat</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                A szolgáltató adatai, szerkesztőségi elérhetőségek, tárhelyszolgáltató és felelős kiadó információk.
              </p>
            </div>
            <div>
              <button
                onClick={() => onNavigate('impressum')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
              >
                Megtekintés <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 2. Adatvédelem */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl w-fit">
                <Lock size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">Adatvédelmi Tájékoztató</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Információk a személyes adatok kezeléséről, az adatfeldolgozás jogalapjáról és a felhasználói jogokról (GDPR).
              </p>
            </div>
            <div>
              <button
                onClick={() => onNavigate('privacy')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
              >
                Megtekintés <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 3. ÁSZF */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl w-fit">
                <Scale size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">Általános Szerződési Feltételek</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Az ÉpítőTudás platform használatának feltételei, regisztrációra vonatkozó szabályok és felelősségvállalás.
              </p>
            </div>
            <div>
              <button
                onClick={() => onNavigate('terms')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
              >
                Megtekintés <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 4. Cookie policy */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl w-fit">
                <Cookie size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">Cookie (Süti) Kezelés</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Tájékoztató a weboldalon használt sütikről, funkcionális és analitikai cookie-k beállításairól.
              </p>
            </div>
            <div>
              <button
                onClick={() => onNavigate('cookies')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary hover:underline"
              >
                Megtekintés <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
