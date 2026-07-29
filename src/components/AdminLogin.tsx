import { useState } from 'react';
import { Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import { signInAdmin } from '../lib/authService';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email és jelszó megadása kötelező');
      return;
    }

    setLoading(true);
    const result = await signInAdmin(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Bejelentkezési hiba');
      return;
    }

    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FFC400]/10 rounded-2xl border border-[#FFC400]/20 mb-4">
            <Lock size={28} className="text-[#FFC400]" />
          </div>
          <h1 className="text-2xl font-black text-white">Admin bejelentkezés</h1>
          <p className="text-gray-500 text-sm mt-2">Jelentkezz be az admin panel eléréséhez</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@epitotudomany.hu"
                className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-300 focus:border-[#FFC400] outline-none"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Jelszó</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Jelszó"
                className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-300 focus:border-[#FFC400] outline-none"
                autoComplete="current-password"
              />
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFC400] text-black font-bold rounded-lg hover:bg-[#E6B000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent" />
            ) : (
              <LogIn size={14} />
            )}
            {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
          </button>
        </form>
      </div>
    </div>
  );
}
