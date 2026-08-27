import { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowLeft,
  Info,
  GraduationCap,
  HardHat,
  Building2,
  KeyRound,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings, getDynamicImageUrl } from '../services/siteSettingsService';
import { getInvitationInfo, type InvitationInfoResult } from '../services/partnerInvitationService';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

function passwordStrength(pass: string) {
  if (!pass) return null;
  if (pass.length < 8) return { level: 'weak', label: 'Gyenge', bar: 'w-1/3', color: 'text-red-400', bg: 'bg-red-500' };
  if (pass.length < 12 && !/[^a-zA-Z0-9]/.test(pass)) return { level: 'medium', label: 'Közepes', bar: 'w-2/3', color: 'text-amber-400', bg: 'bg-amber-500' };
  return { level: 'strong', label: 'Erős', bar: 'w-full', color: 'text-emerald-400', bg: 'bg-emerald-500' };
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { signUp } = useAuth();

  // Mode: 'type_selection' | 'standard_form' | 'invite_code_form'
  const [step, setStep] = useState<'type_selection' | 'standard_form' | 'invite_code_form'>('type_selection');
  const [userType, setUserType] = useState<'tanulo' | 'szakember'>('tanulo');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});

  // Invitation State
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [validatedInvite, setValidatedInvite] = useState<InvitationInfoResult | null>(null);

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const siteSettings = useSiteSettings();
  const logoUrl = getDynamicImageUrl(siteSettings.logoUrl, '/logo.png', siteSettings.iconsUpdatedAt);

  // Check URL hash for code (e.g. #register?code=ET-INV-XXXXXX)
  useEffect(() => {
    try {
      const hash = window.location.hash || '';
      if (hash.includes('code=')) {
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const codeParam = urlParams.get('code');
        if (codeParam) {
          setInviteCodeInput(codeParam);
          setStep('invite_code_form');
          handleVerifyInviteCode(codeParam);
        }
      }
    } catch (e) {
      void e;
    }
  }, []);

  async function handleVerifyInviteCode(codeToVerify?: string) {
    const code = codeToVerify || inviteCodeInput.trim();
    if (!code) {
      setInviteError('Kérjük, adja meg a meghívókódot.');
      return;
    }

    setInviteLoading(true);
    setInviteError(null);

    try {
      const result = await getInvitationInfo(code);
      if (!result.valid) {
        setInviteError(result.error || 'Érvénytelen vagy lejárt meghívókód.');
        setValidatedInvite(null);
      } else {
        setValidatedInvite(result);
        try {
          sessionStorage.setItem('pending_invite_code', result.code || code);
        } catch {}
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Hiba történt a meghívókód ellenőrzésekor.');
      setValidatedInvite(null);
    } finally {
      setInviteLoading(false);
    }
  }

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
    const result = await signUp(email, password, fullName.trim(), userType);
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
    <div className="min-h-screen bg-[#081B35] flex flex-col justify-between items-center px-4 py-10 text-white selection:bg-[#4165b4] selection:text-white">
      {/* Top Bar / Back button */}
      <div className="w-full max-w-lg flex items-center justify-between">
        <button
          onClick={() => {
            if (step !== 'type_selection') {
              setStep('type_selection');
            } else {
              onNavigate('home');
            }
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          {step !== 'type_selection' ? 'Vissza a típusválasztáshoz' : 'Vissza a főoldalra'}
        </button>
      </div>

      {/* Centered Auth Card */}
      <div className="w-full max-w-lg my-auto py-6">
        <div className="bg-[#0C213E]/90 backdrop-blur-md border border-[#1E3A64] rounded-3xl p-6 md:p-10 shadow-2xl space-y-6">
          {/* Brand Logo & Header */}
          <div className="text-center space-y-3">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-3 group focus:outline-none cursor-pointer"
              aria-label="ÉpítőTudás főoldal"
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
              <h1 className="text-2xl font-black text-white tracking-tight">Regisztráció</h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1 leading-relaxed">
                Hozzon létre ÉpítőTudás fiókot a tudásanyagok és tananyagok eléréséhez.
              </p>
            </div>
          </div>

          {/* STEP 0: TYPE SELECTION CARD SYSTEM */}
          {step === 'type_selection' && (
            <div className="space-y-6 pt-2">
              <div className="text-center">
                <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                  Miért regisztrálsz? Válaszd ki a célodat:
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Tanuló Card */}
                <button
                  type="button"
                  onClick={() => {
                    setUserType('tanulo');
                    setStep('standard_form');
                  }}
                  className="group relative flex items-start gap-4 p-5 bg-[#081528] hover:bg-[#112a4f] border border-[#1E3A64] hover:border-[#4165b4] rounded-2xl transition-all duration-200 text-left shadow-md cursor-pointer hover:shadow-xl hover:scale-[1.01]"
                >
                  <div className="p-3 bg-[#4165b4]/20 border border-[#4165b4]/40 rounded-xl text-[#4165b4] group-hover:bg-[#4165b4] group-hover:text-white transition-colors shrink-0">
                    <GraduationCap size={28} />
                  </div>
                  <div className="space-y-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white group-hover:text-[#4165b4] transition-colors">
                        🎓 TANULÓ
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-medium leading-relaxed">
                      "Tanulni és fejlődni szeretnék."
                    </p>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Interaktív tananyagok, leckék, tesztek, tanulókártyák és oklevelek elérése.
                    </p>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-[#4165b4] transition-colors">
                    <Check size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>

                {/* Szakember Card */}
                <button
                  type="button"
                  onClick={() => {
                    setUserType('szakember');
                    setStep('standard_form');
                  }}
                  className="group relative flex items-start gap-4 p-5 bg-[#081528] hover:bg-[#112a4f] border border-[#1E3A64] hover:border-amber-500/60 rounded-2xl transition-all duration-200 text-left shadow-md cursor-pointer hover:shadow-xl hover:scale-[1.01]"
                >
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors shrink-0">
                    <HardHat size={28} />
                  </div>
                  <div className="space-y-1 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                        👷 SZAKEMBER
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-medium leading-relaxed">
                      "Gyakorlati és szakmai információkat szeretnék használni."
                    </p>
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Építőipari útmutatók, fogalomtár, kalkulátorok és szakkönyvek elérése.
                    </p>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-amber-400 transition-colors">
                    <Check size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </div>

              {/* Partner / Iskola Invite Code link */}
              <div className="pt-4 border-t border-[#1E3A64]/60 text-center">
                <button
                  type="button"
                  onClick={() => setStep('invite_code_form')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#4165b4] hover:text-blue-300 transition-colors cursor-pointer bg-[#4165b4]/10 hover:bg-[#4165b4]/20 border border-[#4165b4]/30 px-4 py-2.5 rounded-xl w-full justify-center"
                >
                  <Building2 size={16} />
                  <span>Partner vagy iskola meghívással? (Meghívókóddal regisztrálok)</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP: INVITE CODE FORM */}
          {step === 'invite_code_form' && (
            <div className="space-y-5">
              <div className="p-4 bg-[#081528] border border-[#1E3A64] rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <KeyRound size={16} className="text-[#4165b4]" />
                  Adja meg a kapott meghívókódot:
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                    placeholder="pl. ET-INV-8K92X"
                    className="flex-1 bg-[#0C213E] border border-[#1E3A64] focus:border-[#4165b4] rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-gray-500 uppercase tracking-widest focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyInviteCode()}
                    disabled={inviteLoading || !inviteCodeInput.trim()}
                    className="px-4 py-2.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                  >
                    {inviteLoading ? 'Ellenőrzés...' : 'Kód ellenőrzése'}
                  </button>
                </div>

                {inviteError && (
                  <p className="text-xs text-red-400 flex items-center gap-1 font-medium pt-1">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{inviteError}</span>
                  </p>
                )}

                {validatedInvite?.valid && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle size={16} />
                      <span>Érvényes meghívó!</span>
                    </div>
                    <div className="text-gray-300">
                      Szervezet: <span className="text-white font-bold">{validatedInvite.partner_name}</span> ({validatedInvite.partner_category})
                    </div>

                    <div className="pt-2 border-t border-emerald-500/20 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setStep('standard_form')}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center"
                      >
                        Új fiók létrehozása ehhez a szervezethet ➔
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('login')}
                        className="w-full py-2 bg-[#1E3A64] hover:bg-[#284c80] text-gray-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer text-center"
                      >
                        Már van fiókom ➔ Bejelentkezés &amp; Meghívó Elfogadása
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: STANDARD REGISTRATION FORM */}
          {step === 'standard_form' && (
            <>
              {/* Type Badge Header */}
              <div className="flex items-center justify-between p-3 bg-[#081528] border border-[#1E3A64] rounded-xl text-xs">
                <span className="text-gray-400">Választott felhasználói típus:</span>
                <span className={`font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                  userType === 'tanulo'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {userType === 'tanulo' ? '🎓 Tanuló' : '👷 Szakember'}
                </span>
              </div>

              {/* Email verification advance notice banner */}
              <div className="p-3.5 bg-[#4165b4]/10 border border-[#4165b4]/20 rounded-xl text-xs text-blue-200 font-medium leading-relaxed flex items-start gap-2.5">
                <Info size={16} className="flex-shrink-0 mt-0.5 text-[#4165b4]" />
                <span>A regisztráció után emailben küldünk egy megerősítő linket. A fiók használatához erősítse meg az email-címét.</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-busy={loading}>
                {/* Full name */}
                <div>
                  <label htmlFor="register-fullname" className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 cursor-pointer">
                    Teljes név <span className="text-red-400 font-bold" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
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
                      className={`w-full bg-[#081528] border rounded-xl pl-10 pr-4 py-3 text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.fullName
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-[#1E3A64] focus:border-[#4165b4] focus:ring-[#4165b4]/30'
                      }`}
                      autoComplete="name"
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="text-xs text-red-400 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{fieldErrors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="register-email" className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 cursor-pointer">
                    Email-cím <span className="text-red-400 font-bold" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
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
                      className={`w-full bg-[#081528] border rounded-xl pl-10 pr-4 py-3 text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.email
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-[#1E3A64] focus:border-[#4165b4] focus:ring-[#4165b4]/30'
                      }`}
                      autoComplete="email"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-red-400 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="register-password" className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 cursor-pointer">
                    Jelszó <span className="text-red-400 font-bold" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
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
                      className={`w-full bg-[#081528] border rounded-xl pl-10 pr-10 py-3 text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.password
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-[#1E3A64] focus:border-[#4165b4] focus:ring-[#4165b4]/30'
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {strength && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#081528] rounded-full overflow-hidden border border-[#1E3A64]">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.bg} ${strength.bar}`} />
                      </div>
                      <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="register-confirm-password" className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 cursor-pointer">
                    Jelszó megerősítése <span className="text-red-400 font-bold" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
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
                      className={`w-full bg-[#081528] border rounded-xl pl-10 pr-10 py-3 text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.confirmPassword || (confirmPassword && password !== confirmPassword)
                          ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-[#1E3A64] focus:border-[#4165b4] focus:ring-[#4165b4]/30'
                      }`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Jelszó megerősítésének elrejtése' : 'Jelszó megerősítésének megjelenítése'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword ? (
                    <p className="text-xs text-red-400 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{fieldErrors.confirmPassword}</span>
                    </p>
                  ) : (
                    confirmPassword && password === confirmPassword && (
                      <p className="mt-1 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle size={12} /> A jelszavak egyeznek
                      </p>
                    )
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div role="alert" className="flex items-start gap-2.5 p-3.5 bg-red-950/60 border border-red-500/30 rounded-xl text-red-300">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-400" />
                    <p className="text-xs font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                {/* Legal Notice */}
                <div className="text-center text-xs text-gray-400 leading-relaxed pt-1">
                  A fiók létrehozásával elfogadja a(z){' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('terms')}
                    className="text-[#4165b4] hover:underline font-bold transition-colors cursor-pointer"
                  >
                    Felhasználási Feltételeket
                  </button>{' '}
                  és az{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('privacy')}
                    className="text-[#4165b4] hover:underline font-bold transition-colors cursor-pointer"
                  >
                    Adatkezelési Tájékoztatót
                  </button>
                  .
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg cursor-pointer active:scale-[0.99]"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {loading ? 'Regisztráció folyamatban...' : 'Fiók létrehozása'}
                </button>
              </form>
            </>
          )}

          <div className="pt-4 border-t border-[#1E3A64]/60 text-center text-xs text-gray-400">
            Már van fiókja?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-[#4165b4] hover:text-blue-300 font-bold transition-colors cursor-pointer ml-1"
            >
              Jelentkezzen be
            </button>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-gray-500">
        © 2026 ÉpítőTudás. Minden jog fenntartva.
      </div>
    </div>
  );
}
