import type { Tool } from '../lib/supabase';

/**
 * Normalizes text for accent-insensitive and case-insensitive comparison.
 * Converts characters like 'é', 'ő', 'ü', 'Á' to standard unaccented lowercase equivalents.
 */
export function normalizeText(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Checks if a tool matches a search query accent-insensitively across multiple fields.
 */
export function matchToolSearch(tool: Tool, query: string): boolean {
  const normQuery = normalizeText(query);
  if (!normQuery) return true;

  // Search terms split by whitespace for multi-word search
  const terms = normQuery.split(/\s+/).filter(Boolean);

  // Collect all searchable text fields from tool object
  const searchableParts: string[] = [
    tool.name || '',
    tool.description || '',
    tool.type || '',
    tool.subtype || '',
    tool.brand || '',
    tool.manufacturer || '',
    ...(tool.professions || []),
    ...(tool.keywords || []),
    ...(tool.uses || []),
  ];

  // Extended properties if present
  const extendedTool = tool as Tool & {
    short_description?: string;
    manufacturers?: string[];
    tags?: string[];
    synonyms?: string[];
  };

  if (extendedTool.short_description) searchableParts.push(extendedTool.short_description);
  if (extendedTool.manufacturers) searchableParts.push(...extendedTool.manufacturers);
  if (extendedTool.tags) searchableParts.push(...extendedTool.tags);
  if (extendedTool.synonyms) searchableParts.push(...extendedTool.synonyms);

  const normalizedCombinedText = normalizeText(searchableParts.join(' '));

  // Every search term must be matched in the combined normalized text
  return terms.every((term) => normalizedCombinedText.includes(term));
}

/**
 * Filters an array of tools by category, subtype, profession, and search query.
 */
export function filterTools(
  tools: Tool[],
  params: {
    category?: string | null;
    subtype?: string | null;
    profession?: string | null;
    search?: string | null;
  }
): Tool[] {
  const { category, subtype, profession, search } = params;

  return tools.filter((tool) => {
    // 1. Category filter
    if (category && tool.type !== category) {
      return false;
    }

    // 2. Subtype filter
    if (subtype && tool.subtype !== subtype) {
      return false;
    }

    // 3. Profession filter
    if (profession) {
      const toolProfs = tool.professions || [];
      const hasProf = toolProfs.some(
        (p) => normalizeText(p) === normalizeText(profession)
      );
      if (!hasProf) return false;
    }

    // 4. Search query filter
    if (search && search.trim() !== '') {
      if (!matchToolSearch(tool, search)) {
        return false;
      }
    }

    return true;
  });
}
