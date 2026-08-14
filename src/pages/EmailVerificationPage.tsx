import { useState } from 'react';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailVerificationPageProps {
  onNavigate: (page: string) => void;
}

export default function EmailVerificationPage({ onNavigate }: EmailVerificationPageProps) {
  const { resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  let email = '';
  try { email = sessionStorage.getItem('pending_verify_email') || ''; } catch (err) { void err; }

  const handleResend = async () => {
    if (!email) {
      setResendStatus({ type: 'error', message: 'Kérjük, adja meg email-címét a regisztráció során.' });
      return;
    }

    setResending(true);
    setResendStatus(null);

    const result = await resendVerificationEmail(email);
    setResending(false);

    if (result.error) {
      setResendStatus({ type: 'error', message: result.error });
    } else {
      setResendStatus({
        type: 'success',
        message: `Megerősítő email sikeresen újraküldve a(z) ${email} címre! Kérjük, ellenőrizze a fiókját és a Spam mappát.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] flex flex-col justify-between items-center px-4 py-10 text-[#202628]">
      {/* Top Bar / Back button */}
      <div className="w-full max-w-md flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5f6868] hover:text-[#0f4c5c] transition-colors"
        >
          <ArrowLeft size={14} />
          Vissza a főoldalra
        </button>
      </div>

      {/* Centered Auth Card */}
      <div className="w-full max-w-md my-auto py-6">
        <div className="bg-white border border-[#d6d2ca] rounded-3xl p-8 md:p-10 shadow-sm text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#b76e1d]/10 rounded-2xl border border-[#b76e1d]/20 mb-2">
            <Mail size={32} className="text-[#b76e1d]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[#202628] tracking-tight">
              Ellenőrizze email-fiókját
            </h1>
            <p className="text-[#5f6868] text-xs md:text-sm leading-relaxed">
              Megerősítő emailt küldtünk
              {email && (
                <> a <span className="text-[#202628] font-bold">{email}</span> címre</>
              )}.
            </p>
            <p className="text-[#5f6868]/80 text-xs leading-normal">
              Kattintson az emailben található megerősítő hivatkozásra a fiókja aktiválásához. A bejelentkezésre csak az email-cím visszaigazolása után van lehetőség.
            </p>
          </div>

          {resendStatus && (
            <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs text-left ${
              resendStatus.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {resendStatus.type === 'success' ? (
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
              )}
              <p className="font-medium leading-relaxed">{resendStatus.message}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3 bg-[#0f4c5c] hover:bg-[#093b49] text-white font-bold text-sm rounded-xl transition-all shadow-md"
            >
              Ugrás a Bejelentkezéshez
            </button>

            {email && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full py-2.5 border border-[#d6d2ca] hover:border-[#0f4c5c] text-[#0f4c5c] hover:bg-[#0f4c5c]/5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                {resending ? 'Email küldése...' : 'Megerősítő email újraküldése'}
              </button>
            )}

            <button
              onClick={() => onNavigate('home')}
              className="w-full py-2 text-[#5f6868] hover:text-[#202628] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={13} />
              Vissza a főoldalra
            </button>
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

