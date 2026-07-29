import { useState, useEffect } from 'react';
import { ArrowLeft, Cookie, Check, Info } from 'lucide-react';
import { COOKIE_POLICY_DATA } from '../data/legalDocs';

interface CookiePolicyPageProps {
  onNavigate: (page: string) => void;
}

export default function CookiePolicyPage({ onNavigate }: CookiePolicyPageProps) {
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
    <div className="min-h-screen bg-[#0A0A0A] text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E1E1E] bg-[#111] hover:bg-[#1A1A1A] text-gray-400 hover:text-white text-xs font-medium transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Vissza a főoldalra
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E1E1E] pb-6 gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Cookie className="text-accent" size={30} />
                {COOKIE_POLICY_DATA.title}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                A sütik (cookie-k) használata és kezelési beállításai
              </p>
            </div>
            <div className="text-right text-xs text-gray-500 bg-[#111] border border-[#1E1E1E] p-3 rounded-lg">
              <div>Hatályos: <span className="text-gray-300 font-medium">{COOKIE_POLICY_DATA.lastUpdated}</span></div>
              <div>Verzió: <span className="text-accent font-semibold">{COOKIE_POLICY_DATA.version}</span></div>
            </div>
          </div>
        </div>

        {/* Current Preferences Box */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-accent font-bold text-base border-b border-[#222] pb-3">
            <Info size={20} />
            Az Ön Jelenlegi Süti Beállításai
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-300">
              Analitikai és teljesítmény sütik engedélyezése:
              <span className={`ml-2 font-semibold ${consent?.analytics ? 'text-green-400' : 'text-yellow-500'}`}>
                {consent?.analytics ? 'Engedélyezve' : 'Csak a szükségesek (Elutasítva)'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleConsentChange(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !consent?.analytics
                    ? 'bg-[#222] text-white border border-accent/40'
                    : 'border border-[#222] text-gray-400 hover:bg-[#1A1A1A]'
                }`}
              >
                Csak a szükségesek
              </button>
              <button
                onClick={() => handleConsentChange(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  consent?.analytics
                    ? 'bg-accent text-black font-bold'
                    : 'border border-[#222] text-gray-400 hover:bg-[#1A1A1A]'
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
            <div key={idx} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Check size={18} className="text-accent" />
                  {type.name}
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400">
                  {type.required ? 'Kötelező' : 'Választható'}
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
