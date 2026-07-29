import { ShieldAlert, Home, LogOut } from 'lucide-react';

interface AccessDeniedPageProps {
  userEmail: string | null;
  role: string | null;
  onNavigateHome: () => void;
  onSignOut: () => void;
}

export default function AccessDeniedPage({ userEmail, role, onNavigateHome, onSignOut }: AccessDeniedPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 mb-5">
          <ShieldAlert size={32} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-white">Hozzáférés megtagadva</h1>
        <p className="text-gray-500 text-sm mt-3">
          Ön be van jelentkezve, de nincs admin jogosultsága a panel eléréséhez.
        </p>

        {(userEmail || role) && (
          <div className="mt-5 inline-flex flex-col gap-1 px-4 py-3 bg-[#111] border border-[#1E1E1E] rounded-lg text-xs">
            {userEmail && <span className="text-gray-400">{userEmail}</span>}
            {role && (
              <span className="text-gray-500">
                Szerepkör: <span className="text-gray-300 capitalize">{role}</span>
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#1E1E1E] text-gray-300 text-sm font-bold rounded-lg hover:bg-[#1E1E1E] transition-colors"
          >
            <Home size={14} /> Vissza a főoldalra
          </button>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFC400] text-black text-sm font-bold rounded-lg hover:bg-[#E6B000] transition-colors"
          >
            <LogOut size={14} /> Kijelentkezés
          </button>
        </div>
      </div>
    </div>
  );
}
