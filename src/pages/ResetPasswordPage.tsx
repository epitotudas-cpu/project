import { useState } from 'react';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-2xl border border-green-500/20 mb-6">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Jelszó frissítve!</h1>
          <p className="text-gray-400 text-sm">Átirányítás folyamatban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/10 rounded-2xl border border-accent/20 mb-4">
            <Lock size={28} className="text-accent" />
          </div>
          <h1 className="text-2xl font-black text-white">Új jelszó beállítása</h1>
          <p className="text-gray-500 text-sm mt-2">Adja meg az új jelszavát</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Új jelszó</label>
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
          </div>

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
                className="w-full bg-[#111] border border-[#1E1E1E] rounded-lg pl-9 pr-10 py-2.5 text-sm text-gray-300 focus:border-accent outline-none transition-colors"
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
              <Lock size={14} />
            )}
            {loading ? 'Mentés...' : 'Jelszó mentése'}
          </button>
        </form>
      </div>
    </div>
  );
}
