import { useState } from 'react';
import { User, Mail, Lock, UserPlus, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

function passwordStrength(pass: string) {
  if (!pass) return null;
  if (pass.length < 8) return { level: 'weak', label: 'Gyenge', bar: 'w-1/3', color: 'text-red-400', bg: 'bg-red-500' };
  if (pass.length < 12 && !/[^a-zA-Z0-9]/.test(pass)) return { level: 'medium', label: 'Közepes', bar: 'w-2/3', color: 'text-amber-400', bg: 'bg-amber-500' };
  return { level: 'strong', label: 'Erős', bar: 'w-full', color: 'text-green-400', bg: 'bg-green-500' };
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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 mb-6"
          >
            <img src="/logo.png" alt="ÉpítőTudás" className="h-8 w-auto" />
            <span className="text-xl font-bold">
              <span className="text-white">Építő</span>
              <span className="text-accent">Tudás</span>
            </span>
          </button>
          <h1 className="text-2xl font-black text-white">Regisztráció</h1>
          <p className="text-gray-500 text-sm mt-2">Hozzon létre ingyenes fiókot</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Teljes név</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Kovács János"
                className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-300 focus:border-accent outline-none transition-colors"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Email-cím</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.hu"
                className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-300 focus:border-accent outline-none transition-colors"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Jelszó</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Legalább 8 karakter"
                className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-300 focus:border-accent outline-none transition-colors"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {strength && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1 bg-[#1E1E1E] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.bg} ${strength.bar}`} />
                </div>
                <span className={`text-xs ${strength.color}`}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Jelszó megerősítése
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Jelszó újra"
                className={`w-full bg-[#111] border rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-300 focus:border-accent outline-none transition-colors ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500/50'
                    : 'border-[#1E1E1E]'
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {confirmPassword && password === confirmPassword && (
              <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                <CheckCircle size={11} /> A jelszavak egyeznek
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent" />
            ) : (
              <UserPlus size={14} />
            )}
            {loading ? 'Regisztráció...' : 'Fiók létrehozása'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Már van fiókja?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-accent hover:text-accent-hover font-semibold transition-colors"
          >
            Jelentkezzen be
          </button>
        </p>
      </div>
    </div>
  );
}
