import { getArticlesLocal } from './articleService';
import type { Article } from '../lib/supabase';

export interface PerArticleRecommendationConfig {
  articleId: string;
  pinnedArticleIds: string[];
  excludedArticleIds: string[];
  updatedAt: string;
}

const RECOMMENDATIONS_STORAGE_KEY = 'epitotudas_article_recommendations_v1';

export function getRecommendationsMap(): Record<string, PerArticleRecommendationConfig> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRecommendationConfig(config: PerArticleRecommendationConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecommendationsMap();
    current[config.articleId] = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('article_recommendations_updated'));
  } catch (err) {
    console.warn('Hiba az ajánlások mentésekor:', err);
  }
}

export function getCuratedRelatedArticles(
  articleId: string,
  categoryId?: string | null,
  tags: string[] = [],
  limit: number = 3
): Article[] {
  const allArticles = getArticlesLocal();
  
  // STRICT RULE: Only published articles can be recommended!
  // Exclude current article, non-published, draft, review, rejected, archived, deleted
  const publishedOnly = allArticles.filter(
    (a) => a.id !== articleId && a.status === 'published'
  );

  const configMap = getRecommendationsMap();
  const articleConfig = configMap[articleId];

  let result: Article[] = [];

  if (articleConfig) {
    const { pinnedArticleIds = [], excludedArticleIds = [] } = articleConfig;

    // Filter out excluded articles
    const available = publishedOnly.filter((a) => !excludedArticleIds.includes(a.id));

    // First pick pinned articles in order
    const pinned = pinnedArticleIds
      .map((pid) => available.find((a) => a.id === pid))
      .filter((a): a is Article => Boolean(a));

    result.push(...pinned);

    // If more articles needed to fulfill limit, pick by tag/category match
    if (result.length < limit) {
      const existingIds = new Set(result.map((a) => a.id));
      const candidates = available.filter((a) => !existingIds.has(a.id));

      // Rank by tag overlap and category match
      const ranked = candidates.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (categoryId && a.category_id === categoryId) scoreA += 5;
        if (categoryId && b.category_id === categoryId) scoreB += 5;
        if (a.tags && tags.some((t) => a.tags?.includes(t))) scoreA += 3;
        if (b.tags && tags.some((t) => b.tags?.includes(t))) scoreB += 3;
        return scoreB - scoreA;
      });

      result.push(...ranked.slice(0, limit - result.length));
    }
  } else {
    // Automatic recommendation logic (by category and tag similarity)
    const ranked = [...publishedOnly].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (categoryId && a.category_id === categoryId) scoreA += 5;
      if (categoryId && b.category_id === categoryId) scoreB += 5;
      if (a.tags && tags.some((t) => a.tags?.includes(t))) scoreA += 3;
      if (b.tags && tags.some((t) => b.tags?.includes(t))) scoreB += 3;
      return scoreB - scoreA;
    });

    result = ranked.slice(0, limit);
  }

  return result.slice(0, limit);
}
