import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const STYLES: Record<ToastType, { wrap: string; icon: string; accent: string }> = {
  success: {
    wrap: 'border-green-500/30',
    icon: 'text-green-400',
    accent: 'bg-green-500',
  },
  error: {
    wrap: 'border-red-500/30',
    icon: 'text-red-400',
    accent: 'bg-red-500',
  },
  info: {
    wrap: 'border-blue-500/30',
    icon: 'text-blue-400',
    accent: 'bg-blue-500',
  },
  warning: {
    wrap: 'border-amber-500/30',
    icon: 'text-amber-400',
    accent: 'bg-amber-500',
  },
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    notify,
    success: (m) => notify(m, 'success'),
    error: (m) => notify(m, 'error'),
    info: (m) => notify(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
        role="region"
        aria-live="polite"
        aria-label="Értesítések"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          const style = STYLES[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 bg-[#111] border ${style.wrap} rounded-lg shadow-2xl px-4 py-3 animate-[slideIn_180ms_ease-out]`}
            >
              <span className={`mt-0.5 flex-shrink-0 ${style.icon}`}>
                <Icon size={18} />
              </span>
              <p className="flex-1 text-sm text-gray-200 leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
                aria-label="Értesítés bezárása"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
