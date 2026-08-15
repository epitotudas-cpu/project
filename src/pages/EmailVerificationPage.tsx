import { useState, useEffect } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Edit3, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailVerificationPageProps {
  onNavigate: (page: string) => void;
}

export default function EmailVerificationPage({ onNavigate }: EmailVerificationPageProps) {
  const { resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  let email = '';
  try { email = sessionStorage.getItem('pending_verify_email') || ''; } catch (err) { void err; }

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    if (!email) {
      setResendStatus({ type: 'error', message: 'Kérjük, regisztráljon újra a helyes email-cím megadásával.' });
      return;
    }

    setResending(true);
    setResendStatus(null);

    const result = await resendVerificationEmail(email);
    setResending(false);

    if (result.error) {
      setResendStatus({ type: 'error', message: result.error });
    } else {
      setCooldown(30);
      setResendStatus({
        type: 'success',
        message: `Megerősítő email sikeresen újraküldve a(z) ${email} címre! Kérjük, ellenőrizze a bejövő üzeneteket és a Spam / Levélszemét mappát.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#081B35] flex flex-col justify-between items-center px-4 py-10 text-white selection:bg-[#4165b4] selection:text-white">
      {/* Top Bar / Back button */}
      <div className="w-full max-w-md flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Vissza a főoldalra
        </button>
      </div>

      {/* Centered Auth Card */}
      <div className="w-full max-w-md my-auto py-6">
        <div className="bg-[#0C213E]/90 backdrop-blur-md border border-[#1E3A64] rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4165b4]/10 rounded-2xl border border-[#4165b4]/20 mb-2">
            <Mail size={32} className="text-[#4165b4]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Ellenőrizze email-fiókját
            </h1>
            <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
              Megerősítő emailt küldtünk
              {email ? (
                <> a <span className="text-white font-bold break-all">{email}</span> címre.</>
              ) : (
                ' megadott email-címére.'
              )}
            </p>
            <div className="p-3.5 bg-[#081528] border border-[#1E3A64] rounded-xl text-xs text-gray-200 space-y-1.5 text-left">
              <p className="font-bold flex items-center gap-1.5 text-[#4165b4]">
                <span>1.</span> Nyissa meg az emailt, és kattintson a megerősítő linkre.
              </p>
              <p className="text-gray-400 leading-normal flex items-start gap-1.5 text-[11px]">
                <HelpCircle size={13} className="shrink-0 mt-0.5" />
                <span>Nem találja az üzenetet? Ellenőrizze a <strong>Spam / Levélszemét</strong> mappát is.</span>
              </p>
            </div>
          </div>

          {/* Resend status message with ARIA live region */}
          {resendStatus && (
            <div
              role="alert"
              aria-live="polite"
              className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs text-left ${
                resendStatus.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/60 border border-red-500/30 text-red-300'
              }`}
            >
              {resendStatus.type === 'success' ? (
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
              )}
              <p className="font-medium leading-relaxed">{resendStatus.message}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {/* Primary Action on this page: Resend Email */}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              aria-busy={resending}
              className="w-full py-3 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw size={15} className={resending ? 'animate-spin' : ''} />
              {resending
                ? 'Email küldése folyamatban...'
                : cooldown > 0
                ? `Újraküldés (${cooldown} mp)`
                : 'Megerősítő email újraküldése'}
            </button>

            {/* Secondary Action: Fix wrong email address */}
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="w-full py-2.5 border border-[#1E3A64] hover:border-[#4165b4] text-gray-300 hover:text-white hover:bg-[#122746] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 size={13} className="text-gray-400" />
              Hibás email-címet adott meg? Regisztráció újra
            </button>

            {/* Tertiary / Alternative Actions: Go to Login & Home */}
            <div className="pt-2 flex items-center justify-center gap-4 text-xs font-semibold text-gray-400">
              <button
                onClick={() => onNavigate('login')}
                className="hover:text-[#4165b4] underline transition-colors cursor-pointer"
              >
                Már megerősítette? Bejelentkezés
              </button>
              <span>•</span>
              <button
                onClick={() => onNavigate('home')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Főoldal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright note */}
      <div className="text-center text-xs text-[#5f6868]">
        © 2026 ÉpítőTudás. Minden jog fenntartva.
      </div>
    </div>
  );
}


