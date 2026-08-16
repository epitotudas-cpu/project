import { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../services/siteSettingsService';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmedNotice] = useState<boolean>(() => {
    try {
      const isConfirmedSuccess = sessionStorage.getItem('email_confirmed_success') === 'true';
      if (isConfirmedSuccess) {
        sessionStorage.removeItem('email_confirmed_success');
        return true;
      }
    } catch {
      void 0;
    }
    return false;
  });

  const siteSettings = useSiteSettings();
  const logoUrl = siteSettings.logoUrl || '/logo.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setError('Az email-cím megadása kötelező.'); return; }
    if (!password) { setError('A jelszó megadása kötelező.'); return; }

    setLoading(true);
    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    try {
      const returnPage = sessionStorage.getItem('auth_return_page');
      if (returnPage) {
        sessionStorage.removeItem('auth_return_page');
        const returnHash = sessionStorage.getItem('auth_return_hash');
        if (returnHash) {
          sessionStorage.removeItem('auth_return_hash');
          window.location.hash = returnHash;
        }
        onNavigate(returnPage);
        return;
      }
    } catch {
      // Storage unavailable fallback
    }
    onNavigate('home');
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
        <div className="bg-[#0C213E]/90 backdrop-blur-md border border-[#1E3A64] rounded-3xl p-8 md:p-10 shadow-2xl space-y-6">
          {/* Brand Logo & Header */}
          <div className="text-center space-y-3">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-3 group focus:outline-none cursor-pointer"
            >
              <img
                src={logoUrl}
                alt={`${siteSettings.siteTitle || 'ÉpítőTudás'} logó`}
                className="h-10 max-h-12 max-w-[220px] w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
              <span className="text-2xl font-black tracking-tight">
                <span className="text-white">Építő</span>
                <span className="text-[#4165b4]">Tudás</span>
              </span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Bejelentkezés</h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                Üdvözöljük! Kérjük, adja meg fiókadatait a belépéshez.
              </p>
            </div>
          </div>

          {/* Email Confirmation Success Notice */}
          {confirmedNotice && (
            <div role="alert" className="flex items-start gap-3 p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-emerald-300 shadow-md">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-400" />
              <div className="text-xs font-medium leading-relaxed">
                <strong className="font-bold text-white block text-sm mb-0.5">Sikeres e-mail cím megerősítés! 🎉</strong>
                Fiókja sikeresen aktiválásra került. Kérjük, jelentkezzen be alább.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Email-cím
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelda@email.hu"
                  className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4165b4] focus:ring-2 focus:ring-[#4165b4]/30 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Jelszó
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs font-semibold text-[#4165b4] hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Elfelejtett jelszó?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4165b4] focus:ring-2 focus:ring-[#4165b4]/30 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Primary Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
            </button>
          </form>

          {/* Register Prompt */}
          <div className="pt-4 border-t border-[#1E3A64]/60 text-center text-xs text-gray-400">
            Nincs még fiókja?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-[#4165b4] hover:text-blue-300 font-bold transition-colors cursor-pointer ml-1"
            >
              Regisztráljon most
            </button>
          </div>
        </div>
      </div>

      {/* Footer copyright note */}
      <div className="text-center text-xs text-gray-500">
        © 2026 ÉpítőTudás. Minden jog fenntartva.
      </div>
    </div>
  );
}
