import { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setError('Az email-cím megadása kötelező.'); return; }
    if (!password) { setError('A jelszó megadása kötelező.'); return; }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) { setError(result.error); return; }
    onNavigate('home');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 mb-6 group"
          >
            <img src="/logo.png" alt="ÉpítőTudás" className="h-8 w-auto" />
            <span className="text-xl font-bold">
              <span className="text-white">Építő</span>
              <span className="text-accent">Tudás</span>
            </span>
          </button>
          <h1 className="text-2xl font-black text-white">Bejelentkezés</h1>
          <p className="text-gray-500 text-sm mt-2">Üdvözöljük vissza!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Email-cím
            </label>
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-300">Jelszó</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                Elfelejtett jelszó?
              </button>
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Jelszó"
                className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-300 focus:border-accent outline-none transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
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
              <LogIn size={14} />
            )}
            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Nincs még fiókja?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="text-accent hover:text-accent-hover font-semibold transition-colors"
          >
            Regisztráljon
          </button>
        </p>
      </div>
    </div>
  );
}
