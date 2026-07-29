import { Mail, ArrowLeft } from 'lucide-react';

interface EmailVerificationPageProps {
  onNavigate: (page: string) => void;
}

export default function EmailVerificationPage({ onNavigate }: EmailVerificationPageProps) {
  let email = '';
  try { email = sessionStorage.getItem('pending_verify_email') || ''; } catch (err) { void err; }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl border border-accent/20 mb-6">
          <Mail size={32} className="text-accent" />
        </div>

        <h1 className="text-2xl font-black text-white mb-3">
          Ellenőrizze email-fiókját
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          Megerősítő emailt küldtünk
          {email && (
            <> a <span className="text-white font-medium">{email}</span> címre</>
          )}.
        </p>
        <p className="text-gray-500 text-xs mb-8">
          Kattintson az emailben lévő linkre a fiókja aktiválásához.
          Ellenőrizze a spam mappát is!
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onNavigate('login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold rounded-lg transition-colors"
          >
            Bejelentkezés
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#1E1E1E] text-gray-400 text-sm font-medium rounded-lg hover:bg-[#111] transition-colors"
          >
            <ArrowLeft size={14} />
            Vissza a főoldalra
          </button>
        </div>
      </div>
    </div>
  );
}
