import { useState, useEffect } from 'react';
import { Download, Info } from 'lucide-react';

export default function AndroidInstallCta() {
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showFallbackInfo, setShowFallbackInfo] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Detect Android OS on mobile device
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      const android = /android/i.test(ua);
      setIsAndroid(android);

      // 2. Detect standalone / already installed state
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    }

    // 3. Check for globally pre-captured prompt event
    if (typeof window !== 'undefined' && (window as any).__DEFERRED_PWA_PROMPT__) {
      setDeferredPrompt((window as any).__DEFERRED_PWA_PROMPT__);
    }

    // 4. Register PWA event listeners
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (typeof window !== 'undefined') {
        (window as any).__DEFERRED_PWA_PROMPT__ = e;
      }
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).__DEFERRED_PWA_PROMPT__ = null;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' && (window as any).__DEFERRED_PWA_PROMPT__);
    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setInstalled(true);
        }
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as any).__DEFERRED_PWA_PROMPT__ = null;
        }
      } catch (err) {
        setShowFallbackInfo(true);
      }
    } else {
      setShowFallbackInfo(true);
    }
  };

  // Do NOT render on Desktop, iOS (iPhone/iPad), or if app is already installed
  if (!isAndroid || isStandalone || installed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-emerald-950/70 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 backdrop-blur-md shadow-xl max-w-md my-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            {/* Android Mascot SVG Icon */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.523 15.3414C17.06 15.3414 16.686 14.9674 16.686 14.5044C16.686 14.0414 17.06 13.6674 17.523 13.6674C17.986 13.6674 18.36 14.0414 18.36 14.5044C18.36 14.9674 17.986 15.3414 17.523 15.3414ZM6.477 15.3414C6.014 15.3414 5.64 14.9674 5.64 14.5044C5.64 14.0414 6.014 13.6674 6.477 13.6674C6.94 13.6674 7.314 14.0414 6.477 14.5044C6.94 14.9674 6.94 15.3414 6.477 15.3414ZM17.962 10.9634L19.488 8.3204C19.605 8.1174 19.535 7.8574 19.332 7.7404C19.129 7.6234 18.869 7.6934 18.752 7.8964L17.202 10.5814C15.659 9.8764 13.901 9.4794 12 9.4794C10.099 9.4794 8.341 9.8764 6.798 10.5814L5.248 7.8964C5.131 7.6934 4.871 7.6234 4.668 7.7404C4.465 7.8574 4.395 8.1174 4.512 8.3204L6.038 10.9634C2.614 12.8304 0.286 16.2974 0 20.3954H24C23.714 16.2974 21.386 12.8304 17.962 10.9634Z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white font-extrabold text-sm sm:text-base leading-tight">
              ÉpítőTudás alkalmazás
            </h4>
            <span className="text-[11px] font-medium text-emerald-400 block">
              Android Hivatalos PWA
            </span>
          </div>
        </div>
      </div>

      <p className="text-gray-300 text-xs leading-relaxed">
        Telepítsd az ÉpítőTudást Android készülékedre, és érd el gyorsan a szakmai tudásanyagainkat.
      </p>

      <button
        onClick={handleInstallClick}
        type="button"
        className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] cursor-pointer"
        aria-label="Telepítés Androidra"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.523 15.3414C17.06 15.3414 16.686 14.9674 16.686 14.5044C16.686 14.0414 17.06 13.6674 17.523 13.6674C17.986 13.6674 18.36 14.0414 18.36 14.5044C18.36 14.9674 17.986 15.3414 17.523 15.3414ZM6.477 15.3414C6.014 15.3414 5.64 14.9674 5.64 14.5044C5.64 14.0414 6.014 13.6674 6.477 13.6674C6.94 13.6674 7.314 14.0414 6.477 14.5044C6.94 14.9674 6.94 15.3414 6.477 15.3414ZM17.962 10.9634L19.488 8.3204C19.605 8.1174 19.535 7.8574 19.332 7.7404C19.129 7.6234 18.869 7.6934 18.752 7.8964L17.202 10.5814C15.659 9.8764 13.901 9.4794 12 9.4794C10.099 9.4794 8.341 9.8764 6.798 10.5814L5.248 7.8964C5.131 7.6934 4.871 7.6234 4.668 7.7404C4.465 7.8574 4.395 8.1174 4.512 8.3204L6.038 10.9634C2.614 12.8304 0.286 16.2974 0 20.3954H24C23.714 16.2974 21.386 12.8304 17.962 10.9634Z" />
        </svg>
        <Download size={18} />
        <span>Telepítés Androidra</span>
      </button>

      {showFallbackInfo && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2 leading-tight">
          <Info size={16} className="shrink-0 mt-0.5 text-amber-400" />
          <span>A böngésző menüjében válaszd a Telepítés vagy a Hozzáadás a kezdőképernyőhöz lehetőséget.</span>
        </div>
      )}
    </div>
  );
}
