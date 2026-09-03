import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

interface CookieBannerProps {
  onNavigate: (page: string) => void;
}

export default function CookieBanner({ onNavigate }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('epitotudas_cookie_consent');
      if (!consent) {
        setIsVisible(true);
      }
    } catch (err) {
      void err;
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('epitotudas_cookie_consent', JSON.stringify({ necessary: true, analytics: true }));
    } catch (err) {
      void err;
    }
    setIsVisible(false);
  };

  const handleNecessaryOnly = () => {
    try {
      localStorage.setItem('epitotudas_cookie_consent', JSON.stringify({ necessary: true, analytics: false }));
    } catch (err) {
      void err;
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom duration-300">
      <div className="bg-[#121212]/95 backdrop-blur-md border border-[#262626] rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Cookie size={18} />
            </div>
            Süti (Cookie) Tájékoztató
          </div>
          <button
            onClick={handleNecessaryOnly}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            title="Bezárás (Csak a szükségesek)"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-gray-300 text-xs leading-relaxed">
          A zavartalan működés és a jobb felhasználói élmény érdekében alapvető és analitikai sütiket használunk.
          Részletek a{' '}
          <button
            onClick={() => {
              setIsVisible(false);
              onNavigate('cookies');
            }}
            className="text-accent underline hover:text-accent-hover font-medium"
          >
            Cookie Szabályzatunkban
          </button>.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={handleNecessaryOnly}
            className="w-full sm:w-1/2 py-2 px-3 border border-[#2A2A2A] hover:bg-[#1A1A1A] text-gray-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Csak szükségesek
          </button>
          <button
            onClick={handleAcceptAll}
            className="w-full sm:w-1/2 py-2 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-extrabold rounded-xl transition-colors shadow-xs"
          >
            Összes elfogadása
          </button>
        </div>
      </div>
    </div>
  );
}
