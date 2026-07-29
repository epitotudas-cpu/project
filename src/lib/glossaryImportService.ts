/*
 * Glossary JSON import — Part 3: actual import (executes DB writes).
 *
 * This service performs the real import, starting exclusively from the
 * validated Dry Run preview produced by glossaryImportPreview. It does NOT
 * re-validate or re-read the JSON file.
 *
 * Flow:
 *  1. glossary_terms upsert with onConflict: 'external_id'.
 *     - id (JSON) -> external_id
 *     - nev -> term, definicio -> definition, temakor -> category,
 *       szint -> szint, kulcsszavak -> kulcsszavak
 *     - slug/letter computed from term
 *  2. After upsert, every record has external_id + DB id available.
 *  3. Relations: for each imported source term, delete its existing
 *     glossary_term_relations rows, then insert the resolved relations.
 *     Only relations whose target was resolved to an existing term are
 *     inserted; unresolved targets become warnings (never errors).
 *  4. Returns a detailed result object.
 *
 * Security: if an individual term upsert fails, the error is recorded and
 * the import continues with the next record — it does not stop silently.
 * The whole operation is not wrapped in a single transaction (Supabase
 * client cannot do that), so partial success is possible and is reported
 * faithfully.
 *
 * Does NOT use the legacy addTermsFromImport function.
 * Does NOT modify schema, RLS, or the glossary_terms columns.
 */

import { supabase } from './supabase';
import { slugify } from './slugify';
import type { GlossaryImportPreview, GlossaryPreviewTerm } from './glossaryImportPreview';

export interface GlossaryImportResult {
  /** Newly created glossary_terms rows. */
  importedTerms: number;
  /** Existing glossary_terms rows that were updated. */
  updatedTerms: number;
  /** Relations inserted into glossary_term_relations. */
  createdRelations: number;
  /** Relations skipped because the target term was unresolved. */
  skippedRelations: number;
  /** Non-blocking warnings (e.g. unresolved related-term names). */
  warnings: string[];
  /** Per-record errors that did not stop the run. */
  errors: string[];
  /** True if at least one error occurred. */
  hasErrors: boolean;
}

/** Row shape returned from the upsert select. */
interface UpsertedRow {
  id: string;
  external_id: string | null;
  term: string;
}

/**
 * Executes the glossary import from a validated preview. Performs DB writes.
 */
export async function executeGlossaryImport(
  preview: GlossaryImportPreview
): Promise<GlossaryImportResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  let importedTerms = 0;
  let updatedTerms = 0;
  let createdRelations = 0;
  let skippedRelations = 0;

  if (preview.fatal) {
    return {
      importedTerms: 0,
      updatedTerms: 0,
      createdRelations: 0,
      skippedRelations: 0,
      warnings: [],
      errors: [preview.error || 'A dry run előnézet hibás, import nem futtatható.'],
      hasErrors: true,
    };
  }

  if (preview.terms.length === 0) {
    return {
      importedTerms: 0,
      updatedTerms: 0,
      createdRelations: 0,
      skippedRelations: 0,
      warnings: [],
      errors: [],
      hasErrors: false,
    };
  }

  // 1. Upsert glossary_terms, onConflict: external_id.
  // Map external_id -> DB id for the relation phase.
  const externalIdToDbId = new Map<string, string>();

  for (const term of preview.terms) {
    const slug = slugify(term.nev);
    if (!slug) {
      errors.push(
        `#${term.externalId} ("${term.nev}"): üres slug, kihagyva`
      );
      continue;
    }

    const letter = term.nev.charAt(0).toUpperCase();

    const row = {
      term: term.nev,
      slug,
      definition: term.definicio,
      letter,
      category: term.temakor || null,
      szint: term.szint || null,
      kulcsszavak: term.kulcsszavak,
      external_id: term.externalId,
      // kapcsolodofogalmak is intentionally NOT overwritten here; relations
      // live in glossary_term_relations. We leave the legacy column untouched.
    };

    const { data, error } = await supabase
      .from('glossary_terms')
      .upsert([row], { onConflict: 'external_id' })
      .select('id, external_id, term')
      .maybeSingle();

    if (error) {
      errors.push(
        `#${term.externalId} ("${term.nev}"): upsert hiba - ${error.message}`
      );
      continue;
    }

    if (!data) {
      errors.push(
        `#${term.externalId} ("${term.nev}"): upsert nem adott vissza sort`
      );
      continue;
    }

    const upserted = data as UpsertedRow;
    externalIdToDbId.set(term.externalId, upserted.id);

    if (term.action === 'new') {
      importedTerms++;
    } else {
      updatedTerms++;
    }
  }

  // 2. Relations: for each imported source term, delete its existing
  // glossary_term_relations, then insert the resolved ones.
  // Only imported source terms are touched — existing relations of
  // non-imported terms are left alone.
  for (const term of preview.terms) {
    const sourceDbId = externalIdToDbId.get(term.externalId);
    if (!sourceDbId) {
      // upsert failed for this term; skip its relations
      continue;
    }

    // Delete existing relations for this source term only.
    const { error: delError } = await supabase
      .from('glossary_term_relations')
      .delete()
      .eq('source_term_id', sourceDbId);

    if (delError) {
      errors.push(
        `#${term.externalId} ("${term.nev}"): meglévő kapcsolatok törlése sikertelen - ${delError.message}`
      );
      continue;
    }

    // Insert resolved relations.
    const relationRows: { source_term_id: string; target_term_id: string }[] = [];
    for (const rel of term.resolvedRelated) {
      relationRows.push({
        source_term_id: sourceDbId,
        target_term_id: rel.termId,
      });
    }

    if (relationRows.length > 0) {
      const { error: relError } = await supabase
        .from('glossary_term_relations')
        .insert(relationRows);

      if (relError) {
        errors.push(
          `#${term.externalId} ("${term.nev}"): kapcsolatok beszúrása sikertelen - ${relError.message}`
        );
      } else {
        createdRelations += relationRows.length;
      }
    }

    // Unresolved relations -> warnings (never errors).
    for (const unresolvedName of term.unresolvedRelated) {
      skippedRelations++;
      warnings.push(
        `#${term.externalId} ("${term.nev}"): a kapcsolódó fogalom "${unresolvedName}" nem található a glossary_terms táblában, kapcsolat kihagyva`
      );
    }
  }

  return {
    importedTerms,
    updatedTerms,
    createdRelations,
    skippedRelations,
    warnings,
    errors,
    hasErrors: errors.length > 0,
  };
}

/** Helper for the UI confirmation dialog. */
export function describeImportPlan(preview: GlossaryImportPreview): {
  newTerms: number;
  updatedTerms: number;
  relations: number;
} {
  return {
    newTerms: preview.newTerms,
    updatedTerms: preview.existingTerms,
    relations: preview.resolvedRelations,
  };
}

/** Re-export for convenience in the UI layer. */
export type { GlossaryPreviewTerm };
