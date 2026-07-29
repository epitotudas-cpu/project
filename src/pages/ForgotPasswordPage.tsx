import { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export default function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) { setError('Az email-cím megadása kötelező.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Érvénytelen email-cím formátum.');
      return;
    }

    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);

    if (result.error) { setError(result.error); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl border border-green-500/20 mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Email elküldve!</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            Ha a <span className="text-white font-medium">{email}</span> cím
            regisztrált rendszerünkben, hamarosan kap egy jelszó-visszaállítási linket.
          </p>
          <p className="text-gray-500 text-xs mb-8">
            Ellenőrizze a spam mappát is — a link 1 óráig érvényes.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold rounded-lg transition-colors"
          >
            Vissza a bejelentkezéshez
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-black text-white">Elfelejtett jelszó</h1>
          <p className="text-gray-500 text-sm mt-2">
            Küldjük el a visszaállítási linket
          </p>
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
                autoFocus
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent" />
            ) : (
              <Mail size={14} />
            )}
            {loading ? 'Küldés...' : 'Visszaállítási link küldése'}
          </button>
        </form>

        <button
          onClick={() => onNavigate('login')}
          className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-400 transition-colors"
        >
          <ArrowLeft size={14} />
          Vissza a bejelentkezéshez
        </button>
      </div>
    </div>
  );
}
