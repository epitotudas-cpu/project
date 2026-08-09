import { Mail, ArrowLeft } from 'lucide-react';

interface EmailVerificationPageProps {
  onNavigate: (page: string) => void;
}

export default function EmailVerificationPage({ onNavigate }: EmailVerificationPageProps) {
  let email = '';
  try { email = sessionStorage.getItem('pending_verify_email') || ''; } catch (err) { void err; }

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
        <div className="bg-white border border-[#d6d2ca] rounded-3xl p-8 md:p-10 shadow-sm text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#b76e1d]/10 rounded-2xl border border-[#b76e1d]/20 mb-2">
            <Mail size={32} className="text-[#b76e1d]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-[#202628] tracking-tight">
              Ellenőrizze email-fiókját
            </h1>
            <p className="text-[#5f6868] text-xs md:text-sm leading-relaxed">
              Megerősítő emailt küldtünk
              {email && (
                <> a <span className="text-[#202628] font-bold">{email}</span> címre</>
              )}.
            </p>
            <p className="text-[#5f6868]/80 text-xs">
              Kattintson az emailben lévő linkre a fiókja aktiválásához. Ellenőrizze a spam mappát is!
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3 bg-[#0f4c5c] hover:bg-[#093b49] text-white font-bold text-sm rounded-xl transition-all shadow-md"
            >
              Bejelentkezés
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="w-full py-3 border border-[#d6d2ca] text-[#202628] hover:bg-gray-50 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              Vissza a főoldalra
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
