import { useState, useEffect } from 'react';
import { ArrowLeft, Cookie, Check, Info, ChevronRight } from 'lucide-react';
import { useLegalDocs } from '../services/legalDocService';

interface CookiePolicyPageProps {
  onNavigate: (page: string) => void;
}

export default function CookiePolicyPage({ onNavigate }: CookiePolicyPageProps) {
  const { cookiePolicy: COOKIE_POLICY_DATA } = useLegalDocs();
  const [consent, setConsent] = useState<{ necessary: boolean; analytics: boolean } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('epitotudas_cookie_consent');
      if (stored) {
        setConsent(JSON.parse(stored));
      }
    } catch (err) {
      void err;
    }
  }, []);

  const handleConsentChange = (analytics: boolean) => {
    const updated = { necessary: true, analytics };
    setConsent(updated);
    try {
      localStorage.setItem('epitotudas_cookie_consent', JSON.stringify(updated));
    } catch (err) {
      void err;
    }
  };

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
            <button
              onClick={() => onNavigate('jogi')}
              className="hover:text-white transition-colors"
            >
              Jogi Információk
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Cookie (Süti) Kezelés</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
                Süti Szabályzat
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Cookie className="text-accent" size={32} />
                {COOKIE_POLICY_DATA.title}
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Tájékoztató az ÉpítőTudás weboldal által használt sütikről és az Ön adatkezelési beállításairól.
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-gray-300 bg-primary-800/80 border border-primary-700 p-3.5 rounded-xl shrink-0">
              <div>Hatályos: <span className="text-white font-bold">{COOKIE_POLICY_DATA.lastUpdated}</span></div>
              <div>Verzió: <span className="text-accent font-extrabold">{COOKIE_POLICY_DATA.version}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft size={14} />
          Vissza a főoldalra
        </button>

        {/* Current Preferences Box */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 text-gray-900 font-extrabold text-lg border-b border-gray-100 pb-3">
            <Info size={22} className="text-accent" />
            Az Ön Jelenlegi Süti Beállításai
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="text-sm text-gray-700 font-medium">
              Analitikai és teljesítmény sütik engedélyezése:
              <span className={`ml-2 font-bold ${consent?.analytics ? 'text-emerald-600' : 'text-amber-700'}`}>
                {consent?.analytics ? 'Engedélyezve' : 'Csak a szükségesek (Elutasítva)'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleConsentChange(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  !consent?.analytics
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Csak a szükségesek
              </button>
              <button
                onClick={() => handleConsentChange(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  consent?.analytics
                    ? 'bg-accent text-black font-extrabold shadow-xs'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Összes elfogadása
              </button>
            </div>
          </div>
        </div>

        {/* Cookie Categories */}
        <div className="space-y-4">
          {COOKIE_POLICY_DATA.types.map((type, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Check size={18} className="text-emerald-600" />
                  {type.name}
                </h2>
                <span className="text-xs px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 font-bold">
                  {type.required ? 'Kötelező' : 'Választható'}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
