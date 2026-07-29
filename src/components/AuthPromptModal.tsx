import { X, Lock, CheckCircle2, UserPlus, LogIn } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  termTitle?: string;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  onNavigate,
  termTitle,
}: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F1420] border border-[#232F47] rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-2xl text-accent">
            <Lock size={28} />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-accent uppercase tracking-wider bg-accent/10 border border-accent/20 px-3 py-1 rounded-full inline-block">
            Szakmai Tartalom Zárolva
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
            {termTitle ? `"${termTitle}" — Részletes Adatlap` : 'Regisztrációhoz Kötött Tartalom'}
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
            A részletes műszaki magyarázatok, bemutató slide-ok, oktatóvideók, képgalériák és többnyelvű szótár megtekintéséhez kérjük, lépj be vagy regisztrálj ingyenesen!
          </p>
        </div>

        <div className="bg-[#161F33] border border-[#232F47] rounded-2xl p-4 space-y-2.5">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            A regisztrációval elérhető funkciók:
          </h4>
          <ul className="space-y-2 text-xs text-gray-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-green-400 shrink-0" />
              <span>Részletes technológiai leírások & hibaelhárítás</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-accent shrink-0" />
              <span>Interaktív bemutató slide-ok & képgaléria</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-blue-400 shrink-0" />
              <span>Beágyazott videós szakmai útmutatók</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-purple-400 shrink-0" />
              <span>Többnyelvű szakszótár (HU - EN - DE - RO)</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => {
              onClose();
              onNavigate('register');
            }}
            className="w-full py-3.5 px-4 bg-accent hover:bg-accent-hover text-black font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            Ingyenes Regisztráció
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigate('login');
            }}
            className="w-full py-3 px-4 bg-[#1B2438] hover:bg-[#25324D] text-gray-200 font-bold text-sm rounded-xl border border-[#2D3C5C] transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Már van fiókom — Bejelentkezés
          </button>
        </div>
      </div>
    </div>
  );
}
