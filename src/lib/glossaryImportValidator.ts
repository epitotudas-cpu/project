/*
 * Glossary JSON import — Part 1: file read + validation only.
 *
 * This module parses and validates a Hungarian-language glossary JSON file
 * against the required schema. It does NOT write to the database and does NOT
 * perform any import; it only produces a detailed validation summary that the
 * admin UI can display.
 *
 * Accepted JSON shape (array of records):
 *   {
 *     id: string,
 *     nev: string,
 *     temakor: string,
 *     szint: string,
 *     definicio: string,
 *     kulcsszavak: string[],
 *     kapcsolodo_fogalmak: string[]   // new field name
 *   }
 *
 * For backwards compatibility the legacy field name `kapcsolodofogalmak`
 * (no underscore) is also accepted. Both map into the same internal
 * `kapcsolodo_fogalmak` field. If both are present, the new name wins and a
 * warning is emitted.
 */

/** A fully normalized, validated record. */
export interface GlossaryImportRecord {
  id: string;
  nev: string;
  temakor: string;
  szint: string;
  definicio: string;
  kulcsszavak: string[];
  kapcsolodo_fogalmak: string[];
}

/** A single validation error. `recordIndex` is null for file-level errors. */
export interface GlossaryImportError {
  recordIndex: number | null;
  field?: string;
  message: string;
}

/** A non-blocking warning for a specific record. */
export interface GlossaryImportWarning {
  recordIndex: number;
  message: string;
}

/** Detailed validation result shown in the admin UI. */
export interface GlossaryImportValidationSummary {
  /** Total number of records found in the file (0 on file-level errors). */
  recordCount: number;
  /** Records that passed all checks. */
  validCount: number;
  /** Records with at least one error. */
  invalidCount: number;
  /** Number of non-blocking warnings. */
  warningCount: number;
  /** All errors (file-level first, then per-record in order). */
  errors: GlossaryImportError[];
  /** All warnings. */
  warnings: GlossaryImportWarning[];
  /** Validated, normalized records (empty if any errors exist). */
  validRecords: GlossaryImportRecord[];
  /** True when there is at least one error — import must not proceed. */
  hasErrors: boolean;
  /** Present only when the file itself could not be parsed/validated. */
  fileError?: string;
  /** Original filename, for display. */
  fileName?: string;
}

const REQUIRED_STRING_FIELDS = ['id', 'nev', 'temakor', 'szint', 'definicio'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * Reads and validates a JSON file. Never throws — all failures are reported
 * through the returned summary.
 */
export async function validateGlossaryImportFile(
  file: File
): Promise<GlossaryImportValidationSummary> {
  const empty: GlossaryImportValidationSummary = {
    recordCount: 0,
    validCount: 0,
    invalidCount: 0,
    warningCount: 0,
    errors: [],
    warnings: [],
    validRecords: [],
    hasErrors: true,
    fileName: file.name,
  };

  let text: string;
  try {
    text = await file.text();
  } catch (err) {
    return {
      ...empty,
      fileError: `Nem sikerült beolvasni a fájlt: ${
        err instanceof Error ? err.message : 'ismeretlen hiba'
      }`,
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    return {
      ...empty,
      fileError: `Érvénytelen JSON szintaxis: ${
        err instanceof Error ? err.message : 'ismeretlen hiba'
      }`,
    };
  }

  if (!Array.isArray(data)) {
    return {
      ...empty,
      fileError: 'A JSON fájlnak egy tömbnek kell lennie (array) a fogalmakat tartalmazó rekordokkal.',
    };
  }

  const recordCount = data.length;
  if (recordCount === 0) {
    return {
      ...empty,
      fileError: 'A JSON fájl üres. Legalább egy fogalmat tartalmaznia kell.',
    };
  }

  const errors: GlossaryImportError[] = [];
  const warnings: GlossaryImportWarning[] = [];
  const validRecords: GlossaryImportRecord[] = [];
  const seenIds = new Map<string, number>(); // id -> first index seen

  data.forEach((raw, index) => {
    const recordErrors: string[] = [];

    if (!isPlainObject(raw)) {
      errors.push({
        recordIndex: index,
        message: 'A rekord nem egy JSON objektum.',
      });
      return;
    }

    // Required string fields: presence + type + non-empty (for nev/definicio).
    for (const field of REQUIRED_STRING_FIELDS) {
      if (!(field in raw)) {
        recordErrors.push(`hiányzó kötelező mező: "${field}"`);
        continue;
      }
      const value = raw[field];
      if (typeof value !== 'string') {
        recordErrors.push(
          `"${field}" hibás adattípus: string kell, kapott ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}`
        );
        continue;
      }
      if ((field === 'nev' || field === 'definicio') && value.trim() === '') {
        recordErrors.push(`"${field}" nem lehet üres`);
      }
      if (field === 'id' && value.trim() === '') {
        recordErrors.push('"id" nem lehet üres');
      }
    }

    // kulcsszavak: required string[].
    if (!('kulcsszavak' in raw)) {
      recordErrors.push('hiányzó kötelező mező: "kulcsszavak"');
    } else if (!isStringArray(raw.kulcsszavak)) {
      recordErrors.push(
        `"kulcsszavak" hibás adattípus: string[] kell, kapott ${
          Array.isArray(raw.kulcsszavak)
            ? 'array (nem csak string elemek)'
            : typeof raw.kulcsszavak
        }`
      );
    }

    // kapcsolodo_fogalmak: accept new or legacy field name, normalize both.
    const hasNew = 'kapcsolodo_fogalmak' in raw;
    const hasLegacy = 'kapcsolodofogalmak' in raw;
    let kapcsolodoRaw: unknown = undefined;
    let kapcsolodoField: string | undefined;
    if (hasNew && hasLegacy) {
      warnings.push({
        recordIndex: index,
        message:
          'Mindkét "kapcsolodo_fogalmak" és "kapcsolodofogalmak" mező jelen van; az új ("kapcsolodo_fogalmak") nevű lesz használva.',
      });
      kapcsolodoRaw = raw.kapcsolodo_fogalmak;
      kapcsolodoField = 'kapcsolodo_fogalmak';
    } else if (hasNew) {
      kapcsolodoRaw = raw.kapcsolodo_fogalmak;
      kapcsolodoField = 'kapcsolodo_fogalmak';
    } else if (hasLegacy) {
      kapcsolodoRaw = raw.kapcsolodofogalmak;
      kapcsolodoField = 'kapcsolodofogalmak';
    }

    if (!kapcsolodoField) {
      recordErrors.push('hiányzó kötelező mező: "kapcsolodo_fogalmak"');
    } else if (!isStringArray(kapcsolodoRaw)) {
      recordErrors.push(
        `"${kapcsolodoField}" hibás adattípus: string[] kell, kapott ${
          Array.isArray(kapcsolodoRaw)
            ? 'array (nem csak string elemek)'
            : typeof kapcsolodoRaw
        }`
      );
    }

    if (recordErrors.length > 0) {
      for (const msg of recordErrors) {
        errors.push({ recordIndex: index, message: msg });
      }
      return; // do not build a valid record, do not check duplicate id
    }

    // Safe to normalize — all required fields validated above.
    const id = String(raw.id);
    const nev = String(raw.nev);
    const temakor = String(raw.temakor);
    const szint = String(raw.szint);
    const definicio = String(raw.definicio);
    const kulcsszavak = (raw.kulcsszavak as string[]).slice();
    const kapcsolodo_fogalmak = (kapcsolodoRaw as string[]).slice();

    // Duplicate id check (only among otherwise-valid records).
    const firstSeen = seenIds.get(id);
    if (firstSeen !== undefined) {
      errors.push({
        recordIndex: index,
        field: 'id',
        message: `duplikált id "${id}" (először a ${firstSeen}. rekordban szerepelt)`,
      });
      return;
    }
    seenIds.set(id, index);

    validRecords.push({
      id,
      nev,
      temakor,
      szint,
      definicio,
      kulcsszavak,
      kapcsolodo_fogalmak,
    });
  });

  const hasErrors = errors.length > 0;
  return {
    recordCount,
    validCount: hasErrors ? 0 : validRecords.length,
    invalidCount: recordCount - validRecords.length,
    warningCount: warnings.length,
    errors,
    warnings,
    validRecords: hasErrors ? [] : validRecords,
    hasErrors,
    fileName: file.name,
  };
}
