import { useState } from 'react';
import { User, Mail, Lock, UserPlus, AlertCircle, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSiteSettings } from '../services/siteSettingsService';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

function passwordStrength(pass: string) {
  if (!pass) return null;
  if (pass.length < 8) return { level: 'weak', label: 'Gyenge', bar: 'w-1/3', color: 'text-red-600', bg: 'bg-red-500' };
  if (pass.length < 12 && !/[^a-zA-Z0-9]/.test(pass)) return { level: 'medium', label: 'Közepes', bar: 'w-2/3', color: 'text-amber-600', bg: 'bg-amber-500' };
  return { level: 'strong', label: 'Erős', bar: 'w-full', color: 'text-emerald-600', bg: 'bg-emerald-500' };
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteSettings = getSiteSettings();
  const logoUrl = siteSettings.logoUrl || '/logo.png';

  const validate = (): string | null => {
    if (!fullName.trim()) return 'A teljes név megadása kötelező.';
    if (fullName.trim().length < 2) return 'A teljes névnek legalább 2 karakter hosszúnak kell lennie.';
    if (!email.trim()) return 'Az email-cím megadása kötelező.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Érvénytelen email-cím formátum.';
    if (!password) return 'A jelszó megadása kötelező.';
    if (password.length < 8) return 'A jelszónak legalább 8 karakter hosszúnak kell lennie.';
    if (password !== confirmPassword) return 'A két jelszó nem egyezik.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    const result = await signUp(email, password, fullName.trim());
    setLoading(false);

    if (result.error) { setError(result.error); return; }

    try { sessionStorage.setItem('pending_verify_email', email); } catch (err) { void err; }
    onNavigate('verify-email');
  };

  const strength = passwordStrength(password);

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
              <h1 className="text-2xl font-black text-[#202628] tracking-tight">Regisztráció</h1>
              <p className="text-[#5f6868] text-xs md:text-sm mt-1">
                Hozzon létre ingyenes ÉpítőTudás fiókot.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-bold text-[#202628] uppercase tracking-wider mb-1.5">
                Teljes név
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Kovács János"
                  className="w-full bg-white border border-[#d6d2ca] rounded-xl pl-10 pr-4 py-3 text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/20 transition-all"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#202628] uppercase tracking-wider mb-1.5">
                Jelszó
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Legalább 8 karakter"
                  className="w-full bg-white border border-[#d6d2ca] rounded-xl pl-10 pr-10 py-3 text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/20 transition-all"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5f6868] hover:text-[#202628] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {strength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.bg} ${strength.bar}`} />
                  </div>
                  <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold text-[#202628] uppercase tracking-wider mb-1.5">
                Jelszó megerősítése
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Jelszó újra"
                  className={`w-full bg-white border rounded-xl pl-10 pr-10 py-3 text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:border-[#0f4c5c] focus:ring-2 focus:ring-[#0f4c5c]/20 transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-400'
                      : 'border-[#d6d2ca]'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5f6868] hover:text-[#202628] transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password === confirmPassword && (
                <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle size={12} /> A jelszavak egyeznek
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#0f4c5c] hover:bg-[#093b49] text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
              ) : (
                <UserPlus size={16} />
              )}
              {loading ? 'Regisztráció...' : 'Fiók létrehozása'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#d6d2ca]/60 text-center text-xs text-[#5f6868]">
            Már van fiókja?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-[#0f4c5c] hover:text-[#093b49] font-bold transition-colors"
            >
              Jelentkezzen be
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
