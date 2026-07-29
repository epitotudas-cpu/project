import { supabase, type Category, type Article, type GlossaryTerm, type Tool } from './supabase';
import * as articleService from '../services/articleService';
import * as categoryService from '../services/categoryService';
import * as toolService from '../services/toolService';
import * as glossaryService from '../services/glossaryService';

export async function getCategories(): Promise<Category[]> {
  return categoryService.listCategories();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return categoryService.getCategoryBySlug(slug);
}

export async function getArticles(options?: {
  categoryId?: string;
  status?: 'draft' | 'review' | 'published';
  limit?: number;
  orderBy?: 'views' | 'rating' | 'created_at';
}): Promise<Article[]> {
  const status = options?.status ?? 'published';

  if (status === 'published') {
    return articleService.getPublishedArticles({
      categoryId: options?.categoryId,
      limit: options?.limit,
      orderBy: options?.orderBy,
    });
  }

  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', status);

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  const orderColumn = options?.orderBy || 'views';
  query = query.order(orderColumn, { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  return articleService.getArticleBySlug(slug);
}

export async function getPopularArticles(limit: number = 6): Promise<Article[]> {
  return getArticles({ status: 'published', limit, orderBy: 'views' });
}

export async function getGlossaryTerms(options?: {
  letter?: string;
  limit?: number;
}): Promise<GlossaryTerm[]> {
  return glossaryService.getGlossaryTerms(options);
}

export async function searchGlossaryTerms(term: string): Promise<GlossaryTerm[]> {
  return glossaryService.searchGlossaryTerms(term);
}

export async function getGlossaryLetters(): Promise<string[]> {
  return glossaryService.getGlossaryLetters();
}

export async function getTools(options?: {
  type?: string;
  brand?: string;
  status?: 'active' | 'discontinued';
  limit?: number;
}): Promise<Tool[]> {
  const status = options?.status ?? 'active';

  if (status === 'active') {
    return toolService.getActiveTools({
      type: options?.type,
      brand: options?.brand,
      limit: options?.limit,
    });
  }

  let query = supabase
    .from('tools')
    .select('*')
    .eq('status', status)
    .order('name');

  if (options?.type) {
    query = query.eq('type', options.type);
  }
  if (options?.brand) {
    query = query.eq('brand', options.brand);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  return toolService.getToolBySlug(slug);
}
