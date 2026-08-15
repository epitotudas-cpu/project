import { useState } from 'react';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../services/siteSettingsService';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
}

export default function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const siteSettings = useSiteSettings();
  const logoUrl = siteSettings.logoUrl || '/logo.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) { setError('A jelszó megadása kötelező.'); return; }
    if (password.length < 8) { setError('A jelszónak legalább 8 karakter hosszúnak kell lennie.'); return; }
    if (password !== confirmPassword) { setError('A két jelszó nem egyezik.'); return; }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (result.error) { setError(result.error); return; }

    setSuccess(true);
    setTimeout(() => onNavigate('home'), 2500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#081B35] flex flex-col justify-between items-center px-4 py-10 text-white selection:bg-[#4165b4] selection:text-white">
        <div className="w-full max-w-md my-auto">
          <div className="bg-[#0C213E]/90 backdrop-blur-md border border-[#1E3A64] rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-950/60 rounded-2xl border border-emerald-500/30">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Jelszó sikeresen frissítve!</h1>
            <p className="text-gray-300 text-xs md:text-sm">Átirányítás a főoldalra...</p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          © 2026 ÉpítőTudás. Minden jog fenntartva.
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-black text-white tracking-tight">Új jelszó beállítása</h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                Adja meg az új biztonságos jelszavát.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 cursor-pointer">
                Új jelszó
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Legalább 8 karakter"
                  className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4165b4] focus:ring-2 focus:ring-[#4165b4]/30 transition-all"
                  autoComplete="new-password"
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

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 cursor-pointer">
                Jelszó megerősítése
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Jelszó újra"
                  className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4165b4] focus:ring-2 focus:ring-[#4165b4]/30 transition-all"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
              ) : (
                <Lock size={16} />
              )}
              {loading ? 'Mentés...' : 'Jelszó mentése'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer copyright note */}
      <div className="text-center text-xs text-gray-500">
        © 2026 ÉpítőTudás. Minden jog fenntartva.
      </div>
    </div>
  );
}
