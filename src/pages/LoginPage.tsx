import { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
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
    onNavigate('home');
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
        <div className="bg-white border border-[#d6d2ca] rounded-3xl p-8 md:p-10 shadow-sm space-y-6">
          {/* Brand Logo & Header */}
          <div className="text-center space-y-3">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 group focus:outline-none"
            >
              <img
                src={logoUrl}
                alt={`${siteSettings.siteTitle || 'ÉpítőTudás'} logó`}
                className="h-9 max-h-10 max-w-[200px] w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-[#0f4c5c]">Építő</span>
                <span className="text-[#b76e1d]">Tudás</span>
              </span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#202628] tracking-tight">Bejelentkezés</h1>
              <p className="text-[#5f6868] text-xs md:text-sm mt-1">
                Üdvözöljük! Kérjük, adja meg a fiókadatait.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#202628] uppercase tracking-wider mb-1.5">
                Email-cím
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pelda@email.hu"
                  className="w-full bg-white border border-[#d6d2ca] rounded-xl pl-10 pr-4 py-3 text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/20 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#202628] uppercase tracking-wider">
                  Jelszó
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs font-semibold text-[#b76e1d] hover:text-[#965816] transition-colors"
                >
                  Elfelejtett jelszó?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#d6d2ca] rounded-xl pl-10 pr-10 py-3 text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/20 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5f6868] hover:text-[#202628] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Primary Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#0f4c5c] hover:bg-[#093b49] text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
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
          <div className="pt-4 border-t border-[#d6d2ca]/60 text-center text-xs text-[#5f6868]">
            Nincs még fiókja?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-[#0f4c5c] hover:text-[#093b49] font-bold transition-colors"
            >
              Regisztráljon most
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
