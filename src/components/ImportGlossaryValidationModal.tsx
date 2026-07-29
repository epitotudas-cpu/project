import { useState, useEffect } from 'react';
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  FileJson,
  ShieldAlert,
  AlertTriangle,
  Eye,
  ArrowRight,
  Plus,
  RefreshCw,
  Link2,
  Unlink,
  Play,
  AlertOctagon,
} from 'lucide-react';
import {
  validateGlossaryImportFile,
  type GlossaryImportValidationSummary,
} from '../lib/glossaryImportValidator';
import {
  buildGlossaryImportPreview,
  type GlossaryImportPreview,
} from '../lib/glossaryImportPreview';
import {
  executeGlossaryImport,
  type GlossaryImportResult,
} from '../lib/glossaryImportService';
import { getAuthDebugInfo, type AuthDebugInfo } from '../lib/authService';

interface ImportGlossaryValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Part 1 of the glossary JSON import: file selection + validation only.
 * No database writes happen here. If validation finds any error, the import
 * must not proceed — the "Validálás" button stays disabled in that state.
 */
export default function ImportGlossaryValidationModal({
  isOpen,
  onClose,
}: ImportGlossaryValidationModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [authInfo, setAuthInfo] = useState<AuthDebugInfo | null>(null);
  const [summary, setSummary] = useState<GlossaryImportValidationSummary | null>(null);
  const [preview, setPreview] = useState<GlossaryImportPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<GlossaryImportResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      getAuthDebugInfo().then(setAuthInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canValidate = authInfo?.isAuthenticated && authInfo?.hasAdminRole;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith('.json')) {
      setSummary({
        recordCount: 0,
        validCount: 0,
        invalidCount: 0,
        warningCount: 0,
        errors: [],
        warnings: [],
        validRecords: [],
        hasErrors: true,
        fileError: 'Csak .json fájlok engedélyezettek!',
        fileName: selectedFile.name,
      });
      return;
    }
    setFile(selectedFile);
    setSummary(null);
  };

  const handleValidate = async () => {
    if (!canValidate) {
      setSummary({
        recordCount: 0,
        validCount: 0,
        invalidCount: 0,
        warningCount: 0,
        errors: [],
        warnings: [],
        validRecords: [],
        hasErrors: true,
        fileError:
          'Nincs admin jogosultság! Jelentkezz be admin felhasználóval a validáláshoz.',
      });
      return;
    }
    if (!file) {
      setSummary({
        recordCount: 0,
        validCount: 0,
        invalidCount: 0,
        warningCount: 0,
        errors: [],
        warnings: [],
        validRecords: [],
        hasErrors: true,
        fileError: 'Válassz ki egy JSON fájlt!',
      });
      return;
    }

    try {
      setLoading(true);
      const result = await validateGlossaryImportFile(file);
      setSummary(result);
    } catch (err) {
      setSummary({
        recordCount: 0,
        validCount: 0,
        invalidCount: 0,
        warningCount: 0,
        errors: [],
        warnings: [],
        validRecords: [],
        hasErrors: true,
        fileError: err instanceof Error ? err.message : 'Ismeretlen hiba történt.',
        fileName: file.name,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSummary(null);
    setPreview(null);
    setConfirmOpen(false);
    setImportResult(null);
  };

  const handleStartImportClick = () => {
    if (!preview || preview.fatal || preview.terms.length === 0) return;
    setConfirmOpen(true);
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setConfirmOpen(false);
    try {
      setImporting(true);
      const result = await executeGlossaryImport(preview);
      setImportResult(result);
    } catch (err) {
      setImportResult({
        importedTerms: 0,
        updatedTerms: 0,
        createdRelations: 0,
        skippedRelations: 0,
        warnings: [],
        errors: [err instanceof Error ? err.message : 'Ismeretlen hiba az import során.'],
        hasErrors: true,
      });
    } finally {
      setImporting(false);
    }
  };

  const canProceed = !!summary && !summary.hasErrors && summary.validCount > 0;

  const handleBuildPreview = async () => {
    if (!summary || summary.hasErrors || !summary.validRecords.length) return;
    try {
      setPreviewLoading(true);
      const result = await buildGlossaryImportPreview(summary.validRecords);
      setPreview(result);
    } catch (err) {
      setPreview({
        terms: [],
        relations: [],
        newTerms: 0,
        existingTerms: 0,
        totalTerms: 0,
        relationCount: 0,
        resolvedRelations: 0,
        unresolvedRelations: 0,
        unresolvedList: [],
        warnings: [],
        fatal: true,
        error: err instanceof Error ? err.message : 'Ismeretlen hiba az előnézet készítésekor.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#0D0D0D] rounded-xl border border-[#1E1E1E] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#0D0D0D] border-b border-[#1E1E1E] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Fogalomtár JSON import — Validálás
          </h2>
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
              A JSON fájlnak egy tömböt kell tartalmaznia ezekkel a kötelező
              mezőkkel:
              <br />
              <code className="bg-blue-500/20 px-1.5 py-0.5 rounded inline-block mt-1">
                id, nev, temakor, szint, definicio, kulcsszavak,
                kapcsolodo_fogalmak
              </code>
              <br />
              Elfogadott alternatíva: <code>kapcsolodofogalmak</code> (régi
              név). Ez a lépés csak beolvas és validál — nem ír adatbázisba.
            </p>
          </div>

          {authInfo && (
            <div
              className={`p-3 rounded-lg border flex gap-3 ${
                canValidate
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              {canValidate ? (
                <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs flex-1">
                <p
                  className={
                    canValidate
                      ? 'text-green-400 font-semibold'
                      : 'text-red-400 font-semibold'
                  }
                >
                  {canValidate
                    ? 'Admin felhasználó — validálás engedélyezve'
                    : 'Nincs admin session — validálás tiltva!'}
                </p>
                {authInfo.userEmail && (
                  <p className="text-gray-400 mt-0.5">Email: {authInfo.userEmail}</p>
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
                disabled={loading}
                className="hidden"
                id="glossary-validation-file-input"
              />
              <label
                htmlFor="glossary-validation-file-input"
                className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#FFC400]/40 transition-colors bg-[#111] ${
                  canValidate ? 'border-[#1E1E1E]' : 'border-red-500/30 opacity-50'
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

          {summary && <ValidationSummaryView summary={summary} />}

          {canProceed && !preview && (
            <button
              onClick={handleBuildPreview}
              disabled={previewLoading}
              className="w-full px-4 py-2.5 bg-[#FFC400] text-black rounded-lg font-bold hover:bg-[#E6B000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {previewLoading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent"></div>
                  Előnézet készítése...
                </>
              ) : (
                <>
                  <Eye size={16} />
                  Import előnézet
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          )}

          {preview && <PreviewView preview={preview} />}

          {preview && !preview.fatal && !importResult && (
            <button
              onClick={handleStartImportClick}
              disabled={importing || preview.terms.length === 0}
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  Import folyamatban...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Import indítása
                </>
              )}
            </button>
          )}

          {importResult && <ImportResultView result={importResult} />}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              Formátum példa:
            </label>
            <pre className="bg-[#111] border border-[#1E1E1E] rounded p-2 text-xs text-gray-400 overflow-x-auto">
{`[
  {
    "id": "001",
    "nev": "Betonacél",
    "temakor": "Anyagismeret",
    "szint": "Kezdő",
    "definicio": "Acél armatura betonozáshoz...",
    "kulcsszavak": ["acél", "beton"],
    "kapcsolodo_fogalmak": ["Vasbeton"]
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
              onClick={handleValidate}
              disabled={!file || loading || !canValidate}
              className="flex-1 px-4 py-2 bg-[#FFC400] text-black rounded-lg font-bold hover:bg-[#E6B000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent"></div>
                  Validálás...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Validálás
                </>
              )}
            </button>
          </div>

          {canProceed && !preview && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-400 leading-relaxed">
                Validálás sikeres: {summary.validCount} fogalom készen áll az
                importra. Kattints az "Import előnézet" gombra a dry run
                elvégzéséhez (adatbázisba írás nélkül).
              </p>
            </div>
          )}

          {preview && !preview.fatal && !importResult && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-400 leading-relaxed">
                Dry run kész: {preview.totalTerms} fogalom ({preview.newTerms} új,
                {' '}{preview.existingTerms} frissítendő), {preview.relationCount}{' '}kapcsolat ({preview.resolvedRelations} feloldva,
                {' '}{preview.unresolvedRelations} hiányzó).<br />
                <span className="text-gray-400">
                  Kattints az "Import indítása" gombra a tényleges importhoz.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {confirmOpen && preview && !preview.fatal && (
        <ConfirmImportDialog
          newTerms={preview.newTerms}
          updatedTerms={preview.existingTerms}
          relations={preview.resolvedRelations}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmImport}
        />
      )}
    </div>
  );
}

function ValidationSummaryView({
  summary,
}: {
  summary: GlossaryImportValidationSummary;
}) {
  const hasFileError = !!summary.fileError;
  const ok = !summary.hasErrors && !hasFileError;

  return (
    <div
      className={`p-4 rounded-lg border ${
        ok
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-red-500/10 border-red-500/20'
      }`}
    >
      <div className="flex items-start gap-3">
        {ok ? (
          <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          {hasFileError ? (
            <p className="text-sm text-red-400">{summary.fileError}</p>
          ) : (
            <>
              <p className={`text-sm font-semibold ${ok ? 'text-green-400' : 'text-red-400'}`}>
                {ok
                  ? 'A fájl validálása sikeres.'
                  : 'A fájl validálása hibákat talált — az import nem folytatódhat.'}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Rekordok száma</dt>
                  <dd className="text-gray-200 font-semibold">{summary.recordCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Érvényes</dt>
                  <dd className="text-green-400 font-semibold">{summary.validCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Hibás</dt>
                  <dd className="text-red-400 font-semibold">{summary.invalidCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Figyelmeztetések</dt>
                  <dd className="text-yellow-400 font-semibold">{summary.warningCount}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>

      {!hasFileError && summary.errors.length > 0 && (
        <div className="mt-3 border-t border-red-500/20 pt-3">
          <p className="text-xs font-bold text-red-400 mb-1.5">Hibák:</p>
          <ul className="text-xs text-red-300 space-y-1 max-h-40 overflow-y-auto pr-1">
            {summary.errors.slice(0, 50).map((err, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-red-500/70 flex-shrink-0">
                  {err.recordIndex === null ? 'Fájl' : `#${err.recordIndex}`}
                </span>
                <span className="break-words">
                  {err.field ? `[${err.field}] ` : ''}
                  {err.message}
                </span>
              </li>
            ))}
            {summary.errors.length > 50 && (
              <li className="text-red-400/70 italic">
                …és még {summary.errors.length - 50} hiba
              </li>
            )}
          </ul>
        </div>
      )}

      {!hasFileError && summary.warnings.length > 0 && (
        <div className="mt-3 border-t border-yellow-500/20 pt-3">
          <p className="text-xs font-bold text-yellow-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} /> Figyelmeztetések:
          </p>
          <ul className="text-xs text-yellow-300/90 space-y-1 max-h-32 overflow-y-auto pr-1">
            {summary.warnings.slice(0, 20).map((w, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-yellow-500/70 flex-shrink-0">#{w.recordIndex}</span>
                <span className="break-words">{w.message}</span>
              </li>
            ))}
            {summary.warnings.length > 20 && (
              <li className="text-yellow-400/70 italic">
                …és még {summary.warnings.length - 20} figyelmeztetés
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function PreviewView({ preview }: { preview: GlossaryImportPreview }) {
  if (preview.fatal) {
    return (
      <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/20 flex items-start gap-3">
        <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-400">
          {preview.error || 'Nem sikerült elkészíteni az import előnézetet.'}
        </p>
      </div>
    );
  }

  const hasUnresolved = preview.unresolvedRelations > 0;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border border-[#1E1E1E] bg-[#111]">
        <p className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Eye size={16} className="text-[#FFC400]" />
          Import előnézet (dry run)
        </p>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex justify-between">
            <dt className="text-gray-500">Összes fogalom</dt>
            <dd className="text-gray-200 font-semibold">{preview.totalTerms}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Új fogalom</dt>
            <dd className="text-green-400 font-semibold flex items-center gap-1">
              <Plus size={11} /> {preview.newTerms}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Frissítendő</dt>
            <dd className="text-blue-400 font-semibold flex items-center gap-1">
              <RefreshCw size={11} /> {preview.existingTerms}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Létrehozandó kapcsolatok</dt>
            <dd className="text-gray-200 font-semibold flex items-center gap-1">
              <Link2 size={11} /> {preview.relationCount}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Feloldott kapcsolatok</dt>
            <dd className="text-green-400 font-semibold">{preview.resolvedRelations}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Hiányzó kapcsolatok</dt>
            <dd
              className={`font-semibold flex items-center gap-1 ${
                hasUnresolved ? 'text-yellow-400' : 'text-gray-200'
              }`}
            >
              <Unlink size={11} /> {preview.unresolvedRelations}
            </dd>
          </div>
        </dl>
      </div>

      {hasUnresolved && (
        <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-xs font-bold text-yellow-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} /> Nem feloldható kapcsolatok ({preview.unresolvedRelations}):
          </p>
          <p className="text-xs text-yellow-300/70 mb-2">
            Ezek a kapcsolódó fogalmak nem találhatók a glossary_terms táblában
            név alapján. Az import folytatható, de ezek a relációk nem lesznek
            létrehozva.
          </p>
          <ul className="text-xs text-yellow-300/90 space-y-1 max-h-40 overflow-y-auto pr-1">
            {preview.unresolvedList.slice(0, 50).map((u, i) => (
              <li key={i} className="flex flex-wrap gap-1">
                <span className="text-yellow-500/70 flex-shrink-0">#{u.sourceExternalId}</span>
                <span className="break-words">
                  <span className="text-yellow-200">{u.sourceName}</span>
                  {' → '}
                  <span className="text-yellow-400 font-semibold">{u.targetName}</span>
                </span>
              </li>
            ))}
            {preview.unresolvedList.length > 50 && (
              <li className="text-yellow-400/70 italic">
                …és még {preview.unresolvedList.length - 50} hiányzó kapcsolat
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="p-4 rounded-lg border border-[#1E1E1E] bg-[#111]">
        <p className="text-xs font-bold text-gray-300 mb-2">Fogalmak előnézete:</p>
        <ul className="text-xs space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {preview.terms.slice(0, 30).map((t) => (
            <li key={t.recordIndex} className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                  t.action === 'new'
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-blue-500/15 text-blue-400'
                }`}
              >
                {t.action === 'new' ? 'ÚJ' : 'FRISS'}
              </span>
              <span className="text-gray-200 font-semibold">{t.nev}</span>
              <span className="text-gray-500 text-[10px]">#{t.externalId}</span>
              {t.existingTermId && (
                <span className="text-gray-600 text-[10px]">db:{t.existingTermId.slice(0, 8)}</span>
              )}
            </li>
          ))}
          {preview.terms.length > 30 && (
            <li className="text-gray-500 italic">
              …és még {preview.terms.length - 30} fogalom
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function ConfirmImportDialog({
  newTerms,
  updatedTerms,
  relations,
  onCancel,
  onConfirm,
}: {
  newTerms: number;
  updatedTerms: number;
  relations: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#0D0D0D] rounded-xl border border-[#1E1E1E] w-full max-w-sm">
        <div className="px-6 py-4 border-b border-[#1E1E1E] flex items-center gap-2">
          <AlertOctagon size={18} className="text-[#FFC400]" />
          <h3 className="text-base font-bold text-white">Import megerősítése</h3>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-300">
            A következő módosítások kerülnek végrehajtásra a glossary_terms és
            glossary_term_relations táblákon:
          </p>
          <ul className="text-sm space-y-1.5">
            <li className="flex items-center gap-2">
              <Plus size={14} className="text-green-400" />
              <span className="text-gray-200">
                <span className="font-bold text-green-400">{newTerms}</span> új fogalom kerül létrehozásra
              </span>
            </li>
            <li className="flex items-center gap-2">
              <RefreshCw size={14} className="text-blue-400" />
              <span className="text-gray-200">
                <span className="font-bold text-blue-400">{updatedTerms}</span> fogalom frissül
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Link2 size={14} className="text-gray-300" />
              <span className="text-gray-200">
                <span className="font-bold text-white">{relations}</span> kapcsolat készül
              </span>
            </li>
          </ul>
          <p className="text-xs text-yellow-400/80">
            A nem feloldható kapcsolatok nem okoznak hibát, csak figyelmeztetést.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-[#1E1E1E] flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-[#1E1E1E] rounded-lg text-gray-300 hover:bg-[#1E1E1E] transition-colors font-medium"
          >
            Mégse
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Végrehajtás
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportResultView({ result }: { result: GlossaryImportResult }) {
  const ok = !result.hasErrors;
  return (
    <div
      className={`p-4 rounded-lg border ${
        ok
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-red-500/10 border-red-500/20'
      }`}
    >
      <div className="flex items-start gap-3">
        {ok ? (
          <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${ok ? 'text-green-400' : 'text-red-400'}`}>
            {ok
              ? 'Import sikeresen befejeződött.'
              : 'Import befejeződött, de hibák történtek.'}
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-gray-500">Új fogalmak</dt>
              <dd className="text-green-400 font-semibold">{result.importedTerms}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Frissített fogalmak</dt>
              <dd className="text-blue-400 font-semibold">{result.updatedTerms}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Létrehozott kapcsolatok</dt>
              <dd className="text-gray-200 font-semibold">{result.createdRelations}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Kihagyott kapcsolatok</dt>
              <dd className="text-yellow-400 font-semibold">{result.skippedRelations}</dd>
            </div>
          </dl>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="mt-3 border-t border-red-500/20 pt-3">
          <p className="text-xs font-bold text-red-400 mb-1.5">Hibák ({result.errors.length}):</p>
          <ul className="text-xs text-red-300 space-y-1 max-h-40 overflow-y-auto pr-1">
            {result.errors.slice(0, 50).map((err, i) => (
              <li key={i} className="break-words">{err}</li>
            ))}
            {result.errors.length > 50 && (
              <li className="text-red-400/70 italic">
                …és még {result.errors.length - 50} hiba
              </li>
            )}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="mt-3 border-t border-yellow-500/20 pt-3">
          <p className="text-xs font-bold text-yellow-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={12} /> Figyelmeztetések ({result.warnings.length}):
          </p>
          <ul className="text-xs text-yellow-300/90 space-y-1 max-h-40 overflow-y-auto pr-1">
            {result.warnings.slice(0, 50).map((w, i) => (
              <li key={i} className="break-words">{w}</li>
            ))}
            {result.warnings.length > 50 && (
              <li className="text-yellow-400/70 italic">
                …és még {result.warnings.length - 50} figyelmeztetés
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}