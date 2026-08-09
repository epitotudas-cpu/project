import { X, Lock, CheckCircle2, UserPlus, LogIn, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden text-gray-900">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary">
            <Lock size={26} />
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2.5 relative z-10">
          <span className="text-xs font-extrabold text-primary-900 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" /> Szakmai Tartalom Zárolva
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
            {termTitle ? `„${termTitle}” — Részletes Adatlap` : 'Regisztrációhoz Kötött Tartalom'}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            A részletes műszaki magyarázatok, bemutató slide-ok, oktatóvideók, képgalériák és többnyelvű szótár megtekintéséhez kérjük, lépj be vagy regisztrálj ingyenesen!
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4.5 space-y-3 relative z-10">
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            A regisztrációval elérhető funkciók:
          </h4>
          <ul className="space-y-2 text-xs text-gray-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Részletes technológiai leírások &amp; hibaelhárítás</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary shrink-0" />
              <span>Interaktív bemutató slide-ok &amp; képgaléria</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
              <span>Beágyazott videós szakmai útmutatók</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-purple-600 shrink-0" />
              <span>Többnyelvű szakszótár (HU - EN - DE - RO)</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3 pt-1 relative z-10">
          <button
            onClick={() => {
              onClose();
              onNavigate('register');
            }}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-white font-extrabold text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus size={18} />
            Ingyenes Regisztráció
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigate('login');
            }}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn size={18} />
            Már van fiókom — Bejelentkezés
          </button>
        </div>
      </div>
    </div>
  );
}
