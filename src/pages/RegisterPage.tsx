import { useState, useRef } from 'react';
import { User, Mail, Lock, UserPlus, AlertCircle, Eye, EyeOff, CheckCircle, ArrowLeft, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../services/siteSettingsService';

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
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const siteSettings = useSiteSettings();
  const logoUrl = siteSettings.logoUrl || '/logo.png';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: { fullName?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!fullName.trim()) {
      errors.fullName = 'Kérjük, adja meg a teljes nevét.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'A teljes névnek legalább 2 karakter hosszúnak kell lennie.';
    }

    if (!email.trim()) {
      errors.email = 'Kérjük, adja meg az email-címét.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Érvénytelen email-cím formátum.';
    }

    if (!password) {
      errors.password = 'Kérjük, adja meg a jelszavát.';
    } else if (password.length < 8) {
      errors.password = 'A jelszónak legalább 8 karakterből kell állnia.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Kérjük, erősítse meg a jelszavát.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'A két jelszó nem egyezik.';
    }

    setFieldErrors(errors);

    if (errors.fullName) {
      setError(errors.fullName);
      fullNameRef.current?.focus();
      return;
    }
    if (errors.email) {
      setError(errors.email);
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      setError(errors.password);
      passwordRef.current?.focus();
      return;
    }
    if (errors.confirmPassword) {
      setError(errors.confirmPassword);
      confirmPasswordRef.current?.focus();
      return;
    }

    setLoading(true);
    const result = await signUp(email, password, fullName.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      if (result.error.toLowerCase().includes('email')) {
        setFieldErrors({ email: result.error });
        emailRef.current?.focus();
      }
      return;
    }

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
              aria-label="ÉpítőTudás főoldal"
            >
              <img
                src={logoUrl}
                alt="ÉpítőTudás"
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
              <p className="text-[#5f6868] text-xs md:text-sm mt-1 leading-relaxed">
                Hozzon létre ingyenes ÉpítőTudás fiókot, hogy elmenthesse szakmai tartalmait és később is folytathassa a tanulást.
              </p>
            </div>
          </div>

          {/* Email verification advance notice banner */}
          <div className="p-3.5 bg-[#0f4c5c]/5 border border-[#0f4c5c]/15 rounded-xl text-xs text-[#0f4c5c] font-medium leading-relaxed flex items-start gap-2.5">
            <Info size={16} className="flex-shrink-0 mt-0.5 text-[#0f4c5c]" />
            <span>A regisztráció után emailben küldünk egy megerősítő linket. A fiók használatához erősítse meg az email-címét.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={loading}>
            {/* Full name */}
            <div>
              <label htmlFor="register-fullname" className="block text-xs font-bold text-[#202628] uppercase tracking-wider mb-1.5 cursor-pointer">
                Teljes név <span className="text-red-500 font-bold" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  ref={fullNameRef}
                  id="register-fullname"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: undefined }));
                  }}
                  placeholder="Kovács János"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-base md:text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.fullName
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#d6d2ca] focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/20'
                  }`}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'fullname-error' : undefined}
                />
              </div>
              {fieldErrors.fullName && (
                <p id="fullname-error" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{fieldErrors.fullName}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block text-xs font-bold text-[#202628] uppercase tracking-wider mb-1.5 cursor-pointer">
                Email-cím <span className="text-red-500 font-bold" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  ref={emailRef}
                  id="register-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="pelda@email.hu"
                  className={`w-full bg-white border rounded-xl pl-10 pr-4 py-3 text-base md:text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#d6d2ca] focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/20'
                  }`}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-xs font-bold text-[#202628] uppercase tracking-wider mb-1.5 cursor-pointer">
                Jelszó <span className="text-red-500 font-bold" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  ref={passwordRef}
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Legalább 8 karakter"
                  className={`w-full bg-white border rounded-xl pl-10 pr-10 py-3 text-base md:text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#d6d2ca] focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/20'
                  }`}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={`password-requirements-text ${fieldErrors.password ? 'password-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5f6868] hover:text-[#202628] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p id="password-requirements-text" className="text-[11px] text-[#5f6868] mt-1 font-medium">
                A jelszónak legalább 8 karakterből kell állnia.
              </p>
              {fieldErrors.password && (
                <p id="password-error" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
              {strength && (
                <div
                  className="mt-2 flex items-center gap-2"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={strength.level === 'weak' ? 33 : strength.level === 'medium' ? 66 : 100}
                  aria-valuetext={`Jelszó erőssége: ${strength.label}`}
                  aria-label="Jelszó erősség mérő"
                >
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.bg} ${strength.bar}`} />
                  </div>
                  <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="register-confirm-password" className="block text-xs font-bold text-[#202628] uppercase tracking-wider mb-1.5 cursor-pointer">
                Jelszó megerősítése <span className="text-red-500 font-bold" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6868]" />
                <input
                  ref={confirmPasswordRef}
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Jelszó újra"
                  className={`w-full bg-white border rounded-xl pl-10 pr-10 py-3 text-base md:text-sm text-[#202628] placeholder-[#5f6868]/60 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.confirmPassword || (confirmPassword && password !== confirmPassword)
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-[#d6d2ca] focus:border-[#0f4c5c] focus:ring-[#0f4c5c]/20'
                  }`}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword || (confirmPassword && password !== confirmPassword))}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Jelszó megerősítésének elrejtése' : 'Jelszó megerősítésének megjelenítése'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5f6868] hover:text-[#202628] transition-colors p-1"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword ? (
                <p id="confirm-password-error" className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              ) : (
                confirmPassword && password === confirmPassword && (
                  <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle size={12} /> A jelszavak egyeznek
                  </p>
                )
              )}
            </div>

            {/* Dynamic General Error Message (Accessible Alert) */}
            {error && (
              <div
                id="register-error-msg"
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700"
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Legal Notice links */}
            <div className="text-center text-xs text-[#5f6868] leading-relaxed pt-1">
              A fiók létrehozásával elfogadja a(z){' '}
              <button
                type="button"
                onClick={() => onNavigate('terms')}
                className="text-[#0f4c5c] hover:underline font-bold transition-colors"
              >
                Felhasználási Feltételeket
              </button>{' '}
              és az{' '}
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="text-[#0f4c5c] hover:underline font-bold transition-colors"
              >
                Adatkezelési Tájékoztatót
              </button>
              .
            </div>

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
              {loading ? 'Regisztráció folyamatban...' : 'Fiók létrehozása'}
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

