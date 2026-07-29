import { supabase } from '../lib/supabase';

export interface GlobalSearchArticleResult {
  id: string;
  title: string;
  status: string;
}

export interface GlobalSearchCategoryResult {
  id: string;
  name: string;
}

export interface GlobalSearchGlossaryResult {
  id: string;
  term: string;
  category: string | null;
}

export interface GlobalSearchToolResult {
  id: string;
  name: string;
  type: string | null;
}

export interface GlobalSearchAllResult {
  articles: GlobalSearchArticleResult[];
  categories: GlobalSearchCategoryResult[];
  glossary: GlobalSearchGlossaryResult[];
  tools: GlobalSearchToolResult[];
}

export async function searchAll(query: string, limit = 5): Promise<GlobalSearchAllResult> {
  const like = `%${query}%`;
  const [arts, cats, gloss, tools] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, status')
      .ilike('title', like)
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('categories')
      .select('id, name')
      .ilike('name', like)
      .order('name')
      .limit(limit),
    supabase
      .from('glossary_terms')
      .select('id, term, category')
      .ilike('term', like)
      .order('term')
      .limit(limit),
    supabase
      .from('tools')
      .select('id, name, type')
      .ilike('name', like)
      .order('name')
      .limit(limit),
  ]);

  return {
    articles: (arts.data ?? []) as GlobalSearchArticleResult[],
    categories: (cats.data ?? []) as GlobalSearchCategoryResult[],
    glossary: (gloss.data ?? []) as GlobalSearchGlossaryResult[],
    tools: (tools.data ?? []) as GlobalSearchToolResult[],
  };
}
