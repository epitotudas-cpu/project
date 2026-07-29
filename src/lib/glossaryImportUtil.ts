import type { GlossaryTermFromJson } from './glossaryJsonService';

export interface HungarianGlossaryRecord {
  id?: string;
  nev: string;
  definicio: string;
  temakor: string;
  szint?: string;
  kulcsszavak?: string | string[];
  kapcsolodofogalmak?: string | string[];
  [key: string]: unknown;
}

export interface ImportValidationResult {
  success: boolean;
  terms?: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>[];
  importedIds?: string[];
  error?: string;
  invalidRows?: number[];
  warnings?: string[];
}

export function convertHungarianToGlossaryTerm(
  record: HungarianGlossaryRecord,
  index: number
): { term: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'> | null; error?: string } {
  try {
    // Szükséges mezők ellenőrzése
    if (!record.nev || typeof record.nev !== 'string' || !record.nev.trim()) {
      return { term: null, error: `Sor ${index}: "nev" mező kötelező és nem lehet üres` };
    }

    if (!record.definicio || typeof record.definicio !== 'string' || !record.definicio.trim()) {
      return { term: null, error: `Sor ${index}: "definicio" mező kötelező és nem lehet üres` };
    }

    if (!record.temakor || typeof record.temakor !== 'string' || !record.temakor.trim()) {
      return { term: null, error: `Sor ${index}: "temakor" mező kötelező és nem lehet üres` };
    }

    // Kulcsszavak feldolgozása
    let kulcsszavak: string[] = [];
    if (record.kulcsszavak) {
      if (Array.isArray(record.kulcsszavak)) {
        kulcsszavak = record.kulcsszavak
          .filter(tag => typeof tag === 'string')
          .map(tag => (tag as string).trim())
          .filter(tag => tag.length > 0);
      } else if (typeof record.kulcsszavak === 'string') {
        kulcsszavak = record.kulcsszavak
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }
    }

    // Kapcsolódó fogalmak feldolgozása
    let kapcsolodofogalmak: string[] = [];
    if (record.kapcsolodofogalmak) {
      if (Array.isArray(record.kapcsolodofogalmak)) {
        kapcsolodofogalmak = record.kapcsolodofogalmak
          .filter(item => typeof item === 'string')
          .map(item => (item as string).trim())
          .filter(item => item.length > 0);
      } else if (typeof record.kapcsolodofogalmak === 'string') {
        kapcsolodofogalmak = record.kapcsolodofogalmak
          .split(',')
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    }

    const term: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'> = {
      term: record.nev.trim(),
      definition: record.definicio.trim(),
      category: record.temakor.trim(),
      tags: kulcsszavak,
      szint: record.szint ? String(record.szint).trim() : undefined,
      kapcsolodofogalmak: kapcsolodofogalmak.length > 0 ? kapcsolodofogalmak : undefined,
    };

    return { term };
  } catch (err) {
    return {
      term: null,
      error: `Sor ${index}: ${err instanceof Error ? err.message : 'Feldolgozási hiba'}`,
    };
  }
}

export async function validateAndParseHungarianGlossaryJson(
  file: File
): Promise<ImportValidationResult> {
  try {
    const text = await file.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'Érvénytelen JSON formátum. Ellenőrizze a szintaxist.',
      };
    }

    if (!Array.isArray(data)) {
      return {
        success: false,
        error: 'A JSON fájlnak egy tömb-nek kell lennie (array).',
      };
    }

    if (data.length === 0) {
      return {
        success: false,
        error: 'A JSON fájl üres. Legalább egy fogalmat tartalmaznia kell.',
      };
    }

    const invalidRows: number[] = [];
    const validTerms: Omit<GlossaryTermFromJson, 'id' | 'updatedAt'>[] = [];
    const importedIds: string[] = [];
    const warnings: string[] = [];

    data.forEach((item: unknown, index: number) => {
      if (typeof item !== 'object' || item === null) {
        invalidRows.push(index);
        return;
      }

      const record = item as HungarianGlossaryRecord;

      const result = convertHungarianToGlossaryTerm(record, index);

      if (!result || result.error || !result.term) {
        invalidRows.push(index);
        if (result?.error) {
          warnings.push(result.error);
        }
        return;
      }

      validTerms.push(result.term);

      // ID mentés nyomon követéshez
      if (record.id) {
        importedIds.push(String(record.id));
      }
    });

    if (validTerms.length === 0) {
      return {
        success: false,
        error: `Nem található érvényes fogalom. ${invalidRows.length} sor hibás.`,
        invalidRows,
        warnings,
      };
    }

    return {
      success: true,
      terms: validTerms,
      importedIds: importedIds.length > 0 ? importedIds : undefined,
      invalidRows: invalidRows.length > 0 ? invalidRows : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Ismeretlen hiba történt a fájl olvasásakor.',
    };
  }
}
