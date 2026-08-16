import { useEffect } from 'react';
import { X, Lock, CheckCircle2, UserPlus, LogIn, Sparkles } from 'lucide-react';

export type ContentType = 'glossary' | 'calculator' | 'book' | 'tool' | 'trade';

export interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
  contentType?: ContentType;
  contentTitle?: string;
  termTitle?: string; // For backwards compatibility with Glossary
  returnPage?: string;
  returnHash?: string;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  onNavigate,
  contentType = 'glossary',
  contentTitle,
  termTitle,
  returnPage,
  returnHash,
}: AuthPromptModalProps) {
  // Listen to Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetTitle = contentTitle || termTitle;

  const getDynamicContentText = (): string => {
    if (targetTitle) {
      switch (contentType) {
        case 'calculator':
          return `A(z) ${targetTitle} részletes eredménye regisztráció után érhető el.`;
        case 'book':
          return `A(z) ${targetTitle} teljes tartalma regisztráció után érhető el.`;
        case 'tool':
          return `A(z) ${targetTitle} szakmai adatlapja regisztráció után érhető el.`;
        case 'trade':
          return `A(z) ${targetTitle} teljes szakmabemutatója regisztráció után érhető el.`;
        case 'glossary':
        default:
          return `A(z) ${targetTitle} részletes magyarázata regisztráció után érhető el.`;
      }
    }

    switch (contentType) {
      case 'calculator':
        return 'A részletes számítási eredmény regisztráció után érhető el.';
      case 'book':
        return 'A kiadvány teljes tartalma regisztráció után érhető el.';
      case 'tool':
        return 'Az eszköz szakmai adatlapja regisztráció után érhető el.';
      case 'trade':
        return 'A szakma teljes bemutatója regisztráció után érhető el.';
      case 'glossary':
      default:
        return 'A szakmai fogalom részletes leírása regisztráció után érhető el.';
    }
  };

  const saveReturnState = () => {
    try {
      if (returnPage) {
        sessionStorage.setItem('auth_return_page', returnPage);
      }
      if (returnHash || window.location.hash) {
        sessionStorage.setItem('auth_return_hash', returnHash || window.location.hash);
      }
    } catch {
      // Storage unavailable fallback
    }
  };

  const handleRegister = () => {
    saveReturnState();
    onClose();
    onNavigate('register');
  };

  const handleLogin = () => {
    saveReturnState();
    onClose();
    onNavigate('login');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden text-gray-900">
        {/* Top Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary">
            <Lock size={24} />
          </div>
          <button
            onClick={onClose}
            aria-label="Bezárás"
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Text Section */}
        <div className="space-y-3 relative z-10">
          <span className="text-xs font-extrabold text-primary-900 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" /> Prémium Szakmai Tartalom
          </span>
          <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
            A teljes szakmai tartalom regisztráció után érhető el
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            Hozz létre ingyenes fiókot, és férj hozzá a részletes szakmai anyagokhoz, adatlapokhoz, számításokhoz és tanulási segédanyagokhoz.
          </p>

          {/* Dynamic Content Specific Text */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs font-bold leading-relaxed">
            💡 {getDynamicContentText()}
          </div>
        </div>

        {/* Feature List */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 relative z-10">
          <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
            Ingyenes fiókkal elérhető:
          </h4>
          <ul className="space-y-2 text-xs text-gray-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Részletes szakmai bemutatók, adatlapok &amp; kézikönyvek</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary shrink-0" />
              <span>Interaktív számítási levezetések, mentés &amp; kalkulátorok</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
              <span>Teljes digitális szakkönyvtár &amp; letölthető segédletek</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-purple-600 shrink-0" />
              <span>Szakmai szótár, képzési útvonalak &amp; karrierlehetőségek</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1 relative z-10">
          <button
            onClick={handleRegister}
            className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-white font-extrabold text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus size={18} />
            Ingyenes regisztráció
          </button>
          
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn size={18} />
            Belépés
          </button>

          <div className="text-center pt-1">
            <button
              onClick={onClose}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors underline decoration-dotted"
            >
              Most nem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
