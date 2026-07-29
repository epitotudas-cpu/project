/*
 * Glossary JSON import — Part 2: DRY RUN preview (no DB writes).
 *
 * Builds an import preview from the validated records produced by
 * glossaryImportValidator. It reads the current state of glossary_terms
 * (SELECT only) to classify each record as new vs. update and to resolve
 * related-term names to existing term IDs. Nothing is written, nothing is
 * upserted, no rows are deleted.
 *
 * Matching rules:
 *  - A record is an UPDATE if a glossary_terms row already exists with the
 *    same external_id (the JSON "id" maps to the DB external_id column).
 *  - Otherwise it is a NEW term.
 *  - Related terms (kapcsolodo_fogalmak) are resolved by term NAME against
 *    glossary_terms.term. Unresolved names become warnings, not errors.
 */

import { supabase } from './supabase';
import type { GlossaryImportRecord } from './glossaryImportValidator';

export interface GlossaryPreviewTerm {
  /** Index in the validated records array. */
  recordIndex: number;
  /** The JSON record id (maps to glossary_terms.external_id). */
  externalId: string;
  nev: string;
  temakor: string;
  szint: string;
  definicio: string;
  kulcsszavak: string[];
  /** 'new' | 'update'. */
  action: 'new' | 'update';
  /** Present when action === 'update' (the existing glossary_terms.id). */
  existingTermId?: string;
  /** Related-term names that were resolved to existing term IDs. */
  resolvedRelated: { name: string; termId: string }[];
  /** Related-term names that could not be matched to an existing term. */
  unresolvedRelated: string[];
}

export interface GlossaryPreviewWarning {
  recordIndex: number;
  externalId?: string;
  message: string;
}

export interface GlossaryPreviewRelation {
  /** Index of the source record in the validated records array. */
  sourceRecordIndex: number;
  sourceExternalId: string;
  sourceName: string;
  /** Related-term name from the JSON. */
  targetName: string;
  /** Resolved glossary_terms.id, or null if unresolved. */
  targetTermId: string | null;
  resolved: boolean;
}

export interface GlossaryImportPreview {
  terms: GlossaryPreviewTerm[];
  relations: GlossaryPreviewRelation[];
  newTerms: number;
  existingTerms: number;
  totalTerms: number;
  relationCount: number;
  resolvedRelations: number;
  unresolvedRelations: number;
  unresolvedList: { sourceExternalId: string; sourceName: string; targetName: string }[];
  warnings: GlossaryPreviewWarning[];
  /** True when the preview could not be built (e.g. DB read failure). */
  fatal: boolean;
  error?: string;
}

interface ExistingTermRow {
  id: string;
  term: string;
  external_id: string | null;
}

/**
 * Builds a DRY RUN preview. Performs SELECT queries only — never writes.
 */
export async function buildGlossaryImportPreview(
  records: GlossaryImportRecord[]
): Promise<GlossaryImportPreview> {
  if (records.length === 0) {
    return {
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
      fatal: false,
    };
  }

  // Load existing glossary_terms (external_id + term + id). SELECT only.
  const { data: existingRows, error } = await supabase
    .from('glossary_terms')
    .select('id, term, external_id');

  if (error) {
    return {
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
      error: `Nem sikerült beolvasni a glossary_terms táblát: ${error.message}`,
    };
  }

  const existing = (existingRows ?? []) as ExistingTermRow[];

  // Index existing rows by external_id (for new/update classification).
  const byExternalId = new Map<string, ExistingTermRow>();
  // Index existing rows by term name (lowercased) for relation resolution.
  const byTermName = new Map<string, ExistingTermRow>();
  for (const row of existing) {
    if (row.external_id) {
      byExternalId.set(row.external_id, row);
    }
    if (row.term) {
      byTermName.set(row.term.toLowerCase(), row);
    }
  }

  const terms: GlossaryPreviewTerm[] = [];
  const relations: GlossaryPreviewRelation[] = [];
  const warnings: GlossaryPreviewWarning[] = [];
  const unresolvedList: GlossaryImportPreview['unresolvedList'] = [];

  records.forEach((record, index) => {
    const existingRow = byExternalId.get(record.id);
    const action: 'new' | 'update' = existingRow ? 'update' : 'new';

    const resolvedRelated: { name: string; termId: string }[] = [];
    const unresolvedRelated: string[] = [];

    for (const targetName of record.kapcsolodo_fogalmak) {
      const trimmed = targetName.trim();
      if (!trimmed) continue;
      const match = byTermName.get(trimmed.toLowerCase());
      if (match) {
        resolvedRelated.push({ name: trimmed, termId: match.id });
        relations.push({
          sourceRecordIndex: index,
          sourceExternalId: record.id,
          sourceName: record.nev,
          targetName: trimmed,
          targetTermId: match.id,
          resolved: true,
        });
      } else {
        unresolvedRelated.push(trimmed);
        relations.push({
          sourceRecordIndex: index,
          sourceExternalId: record.id,
          sourceName: record.nev,
          targetName: trimmed,
          targetTermId: null,
          resolved: false,
        });
        unresolvedList.push({
          sourceExternalId: record.id,
          sourceName: record.nev,
          targetName: trimmed,
        });
        warnings.push({
          recordIndex: index,
          externalId: record.id,
          message: `A kapcsolódó fogalom "${trimmed}" nem található a glossary_terms táblában (név alapú feloldás).`,
        });
      }
    }

    terms.push({
      recordIndex: index,
      externalId: record.id,
      nev: record.nev,
      temakor: record.temakor,
      szint: record.szint,
      definicio: record.definicio,
      kulcsszavak: record.kulcsszavak,
      action,
      existingTermId: existingRow?.id,
      resolvedRelated,
      unresolvedRelated,
    });
  });

  const newTerms = terms.filter((t) => t.action === 'new').length;
  const existingTerms = terms.filter((t) => t.action === 'update').length;
  const resolvedRelations = relations.filter((r) => r.resolved).length;
  const unresolvedRelations = relations.filter((r) => !r.resolved).length;

  return {
    terms,
    relations,
    newTerms,
    existingTerms,
    totalTerms: terms.length,
    relationCount: relations.length,
    resolvedRelations,
    unresolvedRelations,
    unresolvedList,
    warnings,
    fatal: false,
  };
}
