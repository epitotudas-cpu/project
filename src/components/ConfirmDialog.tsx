import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Megerősítés',
  cancelLabel = 'Mégse',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) setBusy(false);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="bg-[#111] border border-[#1E1E1E] rounded-xl w-full max-w-sm p-6 animate-[popIn_160ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex-shrink-0 mt-0.5 ${
              destructive ? 'text-red-400' : 'text-amber-400'
            }`}
          >
            <AlertTriangle size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white">{title}</h2>
            <p className="text-sm text-gray-400 mt-1.5 leading-snug">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-black rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              destructive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#FFC400] text-black hover:bg-[#E6B000]'
            }`}
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
