import { X, Upload, AlertCircle, CheckCircle, FileJson, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import { validateAndParseHungarianGlossaryJson } from '../lib/glossaryImportUtil';
import { glossaryJsonService } from '../lib/glossaryJsonService';
import { getAuthDebugInfo, type AuthDebugInfo } from '../lib/authService';
import type { GlossaryTermFromJson } from '../lib/glossaryJsonService';

interface ImportGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (terms: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>[]) => void;
}

export default function ImportGlossaryModal({
  isOpen,
  onClose,
  onImport,
}: ImportGlossaryModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState<AuthDebugInfo | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
    invalidRows?: number[];
    warnings?: string[];
    errors?: string[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAuthDebugInfo().then(setAuthInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canImport = authInfo?.isAuthenticated && authInfo?.hasAdminRole;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.json')) {
        setResult({
          success: false,
          message: 'Csak .json fájlok engedélyezettek!',
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!canImport) {
      setResult({
        success: false,
        message: 'Nincs admin jogosultság! Jelentkezz be admin felhasználóval az import elvégzéséhez.',
      });
      return;
    }

    if (!file) {
      setResult({
        success: false,
        message: 'Válassz ki egy JSON fájlt!',
      });
      return;
    }

    try {
      setLoading(true);
      const validation = await validateAndParseHungarianGlossaryJson(file);

      if (!validation.success) {
        setResult({
          success: false,
          message: validation.error || 'Hiba a JSON validálása során.',
          invalidRows: validation.invalidRows,
          warnings: validation.warnings,
        });
        return;
      }

      if (!validation.terms || validation.terms.length === 0) {
        setResult({
          success: false,
          message: 'Nincs feldolgozható fogalom az adatfájlban.',
        });
        return;
      }

      setResult({
        success: true,
        message: `Adatbázisba mentés... ${validation.terms.length} fogalom`,
        count: validation.terms.length,
      });

      const importResult = await glossaryJsonService.addTermsFromImport(
        validation.terms,
        validation.importedIds
      );

      if (importResult.failed > 0) {
        const authMsg = importResult.authDebug.error
          ? `\n\nAuth figyelmeztetés: ${importResult.authDebug.error}`
          : '';
        setResult({
          success: false,
          message: `${importResult.success} fogalom sikeresen importálva, ${importResult.failed} sikertelen.${authMsg}`,
          count: importResult.success,
          errors: importResult.errors.slice(0, 5),
        });
        return;
      }

      const warningText =
        validation.warnings && validation.warnings.length > 0
          ? `\n\nFigyelmeztetések:\n${validation.warnings.slice(0, 2).join('\n')}${
              validation.warnings.length > 2 ? `\n... és még ${validation.warnings.length - 2}` : ''
            }`
          : '';

      const slugMsg = importResult.firstSlug
        ? `\n\nElső slug minta: "${importResult.firstSlug}"`
        : '';

      setResult({
        success: true,
        message: `Sikeresen betöltve ${importResult.success} fogalom az adatbázisba.${warningText}${slugMsg}`,
        count: importResult.success,
        invalidRows: validation.invalidRows,
      });

      setTimeout(() => {
        if (validation.terms) {
          onImport(validation.terms);
          setFile(null);
          setResult(null);
          onClose();
        }
      }, 2000);
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Ismeretlen hiba történt.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#0D0D0D] rounded-xl border border-[#1E1E1E] w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0D0D0D] border-b border-[#1E1E1E] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">JSON importálás Supabase-be</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1E1E1E] rounded transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-xs leading-relaxed">
              A JSON fájlnak egy tömb-öt kell tartalmaznia ezekkel a kötelező mezőkkel:
              <br />
              <code className="bg-blue-500/20 px-1.5 py-0.5 rounded inline-block mt-1">
                nev, definicio, temakor
              </code>
              <br />
              Opcionális: szint, kulcsszavak, kapcsolodofogalmak, id
            </p>
          </div>

          {/* Auth Status */}
          {authInfo && (
            <div
              className={`p-3 rounded-lg border flex gap-3 ${
                canImport
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              {canImport ? (
                <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs flex-1">
                <p
                  className={
                    canImport
                      ? 'text-green-400 font-semibold'
                      : 'text-red-400 font-semibold'
                  }
                >
                  {canImport
                    ? 'Admin felhasználó - Import engedélyezve'
                    : 'Nincs admin session - Import tiltva!'}
                </p>
                {authInfo.userEmail && (
                  <p className="text-gray-400 mt-0.5">Email: {authInfo.userEmail}</p>
                )}
                {authInfo.userId && (
                  <p className="text-gray-500">Felhasználó ID: {authInfo.userId}</p>
                )}
                {authInfo.error && (
                  <p className="text-red-400/70 mt-0.5 italic">{authInfo.error}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              JSON fájl kiválasztása
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={loading || (result?.success ?? false)}
                className="hidden"
                id="json-file-input"
              />
              <label
                htmlFor="json-file-input"
                className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#FFC400]/40 transition-colors bg-[#111] ${
                  canImport ? 'border-[#1E1E1E]' : 'border-red-500/30 opacity-50'
                }`}
              >
                <FileJson size={18} className="text-gray-400" />
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300">
                    {file ? file.name : 'Kattints a fájl kiválasztásához'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : 'vagy húzd ide a fájlt'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg border flex gap-3 max-h-48 overflow-y-auto ${
                result.success
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              {result.success ? (
                <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm">
                <p className={result.success ? 'text-green-400' : 'text-red-400'} style={{ whiteSpace: 'pre-line' }}>
                  {result.message}
                </p>
                {result.invalidRows && result.invalidRows.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Hibás sorok: {result.invalidRows.slice(0, 5).join(', ')}
                  </p>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="text-xs text-red-300 mt-2 space-y-0.5">
                    {result.errors.map((err, i) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              Formátum példa:
            </label>
            <pre className="bg-[#111] border border-[#1E1E1E] rounded p-2 text-xs text-gray-400 overflow-x-auto">
{`[
  {
    "id": "001",
    "nev": "Betonacél",
    "definicio": "Acél armatura...",
    "temakor": "Anyagismeret",
    "szint": "Kezdő",
    "kulcsszavak": "acél, beton",
    "kapcsolodofogalmak": ["Vasbeton"]
  }
]`}
            </pre>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 border border-[#1E1E1E] rounded-lg text-gray-300 hover:bg-[#1E1E1E] transition-colors font-medium"
            >
              Új fájl
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#1E1E1E] rounded-lg text-gray-300 hover:bg-[#1E1E1E] transition-colors font-medium"
            >
              Bezárás
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading || !canImport || (result?.success ?? false)}
              className="flex-1 px-4 py-2 bg-[#FFC400] text-black rounded-lg font-bold hover:bg-[#E6B000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent"></div>
                  Mentés...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Import
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
