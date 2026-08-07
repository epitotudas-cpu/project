import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { GlossaryTerm } from '../lib/supabase';
import { updateGlossaryTerm } from '../services/glossaryService';

interface BatchEditGlossaryModalProps {
  terms: GlossaryTerm[];
  onClose: () => void;
  onSaved: (updated: GlossaryTerm[]) => void;
}

interface BatchForm {
  category: string;
  szint: string;
  kulcsszavak: string;
  kapcsolodofogalmak: string;
}

const EMPTY_FORM: BatchForm = {
  category: '',
  szint: '',
  kulcsszavak: '',
  kapcsolodofogalmak: '',
};

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function BatchEditGlossaryModal({ terms, onClose, onSaved }: BatchEditGlossaryModalProps) {
  const [form, setForm] = useState<BatchForm>({ ...EMPTY_FORM });
  const [enabled, setEnabled] = useState<Record<keyof BatchForm, boolean>>({
    category: false,
    szint: false,
    kulcsszavak: false,
    kapcsolodofogalmak: false,
  });
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    successCount: number;
    failureCount: number;
    errors: { id: string; term: string; message: string }[];
    updated: GlossaryTerm[];
  } | null>(null);

  function update<K extends keyof BatchForm>(key: K, value: BatchForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleEnabled(key: keyof BatchForm) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function buildPayload(): Record<string, unknown> | null {
    const payload: Record<string, unknown> = {};
    if (enabled.category) payload.category = form.category.trim() || null;
    if (enabled.szint) payload.szint = form.szint.trim() || null;
    if (enabled.kulcsszavak) payload.kulcsszavak = parseList(form.kulcsszavak);
    if (enabled.kapcsolodofogalmak) payload.kapcsolodofogalmak = parseList(form.kapcsolodofogalmak);
    return Object.keys(payload).length > 0 ? payload : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) {
      setResult({
        successCount: 0,
        failureCount: 0,
        errors: [],
        updated: [],
      });
      return;
    }

    setSaving(true);
    setProgress({ done: 0, total: terms.length });
    setResult(null);

    const errors: { id: string; term: string; message: string }[] = [];
    const updated: GlossaryTerm[] = [];

    for (let i = 0; i < terms.length; i++) {
      const t = terms[i];
      try {
        const data = await updateGlossaryTerm(t.id, payload);
        updated.push(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ismeretlen hiba.';
        errors.push({ id: t.id, term: t.term, message: msg });
      }
      setProgress({ done: i + 1, total: terms.length });
    }

    setResult({
      successCount: updated.length,
      failureCount: errors.length,
      errors,
      updated,
    });
    setSaving(false);
    setProgress(null);
  }

  function handleClose() {
    if (saving) return;
    if (result && result.updated.length > 0) {
      onSaved(result.updated);
    }
    onClose();
  }

  const fieldClass =
    'w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FFC400]/50 transition-colors';

  const anyEnabled = Object.values(enabled).some(Boolean);
  const isDone = result !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#1E1E1E] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] sticky top-0 bg-[#111] z-10">
          <div>
            <h2 className="text-base font-black text-white">Csoportos szerkesztés</h2>
            <p className="text-xs text-gray-500 mt-0.5">{terms.length} fogalom kijelölve</p>
          </div>
          <button onClick={handleClose} disabled={saving} className="text-gray-500 hover:text-gray-300 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {isDone && (
            <div className="space-y-3">
              <div className="p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 font-bold">{result!.successCount} sikeres módosítás</span>
                </div>
                {result!.failureCount > 0 && (
                  <div className="flex items-center gap-2 text-sm mt-2 pt-2 border-t border-[#1E1E1E]">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                    <span className="text-red-400 font-bold">{result!.failureCount} sikertelen módosítás</span>
                  </div>
                )}
              </div>

              {result!.errors.length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg space-y-1.5 max-h-40 overflow-y-auto">
                  {result!.errors.map((err) => (
                    <div key={err.id} className="text-xs text-red-400">
                      <span className="font-bold">{err.term}:</span> {err.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
                >
                  Bezárás
                </button>
              </div>
            </div>
          )}

          {!isDone && (
            <>
              <p className="text-xs text-gray-500">
                Csak az engedélyezett mezők kerülnek frissítésre a kijelölt fogalmaknál. A többi mező érintetlen marad.
              </p>

              <BatchField
                label="Témakör"
                enabled={enabled.category}
                onToggle={() => toggleEnabled('category')}
              >
                <input
                  className={fieldClass}
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  placeholder="pl. Anyagismeret"
                  disabled={!enabled.category}
                />
              </BatchField>

              <BatchField
                label="Szint"
                enabled={enabled.szint}
                onToggle={() => toggleEnabled('szint')}
              >
                <input
                  className={fieldClass}
                  value={form.szint}
                  onChange={(e) => update('szint', e.target.value)}
                  placeholder="pl. Kezdő"
                  disabled={!enabled.szint}
                />
              </BatchField>

              <BatchField
                label="Kulcsszavak (vesszővel)"
                enabled={enabled.kulcsszavak}
                onToggle={() => toggleEnabled('kulcsszavak')}
              >
                <input
                  className={fieldClass}
                  value={form.kulcsszavak}
                  onChange={(e) => update('kulcsszavak', e.target.value)}
                  placeholder="beton, vas, szilárdság"
                  disabled={!enabled.kulcsszavak}
                />
              </BatchField>

              <BatchField
                label="Kapcsolódó fogalmak (vesszővel)"
                enabled={enabled.kapcsolodofogalmak}
                onToggle={() => toggleEnabled('kapcsolodofogalmak')}
              >
                <input
                  className={fieldClass}
                  value={form.kapcsolodofogalmak}
                  onChange={(e) => update('kapcsolodofogalmak', e.target.value)}
                  placeholder="Vasbeton, Híd"
                  disabled={!enabled.kapcsolodofogalmak}
                />
              </BatchField>

              {saving && progress && (
                <div className="p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Loader2 size={16} className="animate-spin text-[#FFC400] flex-shrink-0" />
                    <span className="font-bold">
                      Mentés... {progress.done} / {progress.total}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFC400] transition-all"
                      style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={saving || !anyEnabled}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC400] text-black text-sm font-black rounded-lg hover:bg-[#E6B000] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={14} /> {saving ? 'Mentés...' : 'Mentés'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function BatchField({
  label,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={!enabled ? 'opacity-60' : ''}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</label>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enabled ? 'bg-[#FFC400]' : 'bg-[#1E1E1E]'
          }`}
          aria-pressed={enabled}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      {children}
    </div>
  );
}
