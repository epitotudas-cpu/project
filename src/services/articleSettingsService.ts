import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ArticleSettings {
  articlesPageTitle: string;
  articlesPageDescription: string;
  articlesPerPage: number;
  desktopGridColumns: 2 | 3 | 4;
  defaultSortMode: 'latest' | 'featured' | 'manual' | 'popular';
  showLoadMoreButton: boolean;
  showCategoryTilesBlock: boolean;
  showEmptyCategoriesInFilter: boolean;
  showViewCount: boolean;
  showRatings: boolean;
}

export const DEFAULT_ARTICLE_SETTINGS: ArticleSettings = {
  articlesPageTitle: 'Építőipari cikkek',
  articlesPageDescription: 'Gyakorlati útmutatók, szabványok, technológiai leírások és kivitelezési tippek.',
  articlesPerPage: 12,
  desktopGridColumns: 3,
  defaultSortMode: 'latest',
  showLoadMoreButton: true,
  showCategoryTilesBlock: false,
  showEmptyCategoriesInFilter: true,
  showViewCount: false,
  showRatings: false,
};

const STORAGE_KEY = 'epitotudas_article_settings_v1';
const SUPABASE_ARTICLE_SETTINGS_ID = '00000000-0000-0000-0000-000000000014';

declare global {
  interface Window {
    __GLOBAL_ARTICLE_SETTINGS__?: ArticleSettings;
  }
}

function sanitizeArticleSettings(raw: Partial<ArticleSettings>): ArticleSettings {
  return {
    articlesPageTitle: raw.articlesPageTitle?.trim() || DEFAULT_ARTICLE_SETTINGS.articlesPageTitle,
    articlesPageDescription: raw.articlesPageDescription?.trim() || DEFAULT_ARTICLE_SETTINGS.articlesPageDescription,
    articlesPerPage: typeof raw.articlesPerPage === 'number' && raw.articlesPerPage > 0 ? raw.articlesPerPage : DEFAULT_ARTICLE_SETTINGS.articlesPerPage,
    desktopGridColumns: raw.desktopGridColumns === 2 || raw.desktopGridColumns === 4 ? raw.desktopGridColumns : 3,
    defaultSortMode: raw.defaultSortMode && ['latest', 'featured', 'manual', 'popular'].includes(raw.defaultSortMode) ? raw.defaultSortMode : 'latest',
    showLoadMoreButton: raw.showLoadMoreButton !== undefined ? Boolean(raw.showLoadMoreButton) : DEFAULT_ARTICLE_SETTINGS.showLoadMoreButton,
    showCategoryTilesBlock: raw.showCategoryTilesBlock !== undefined ? Boolean(raw.showCategoryTilesBlock) : DEFAULT_ARTICLE_SETTINGS.showCategoryTilesBlock,
    showEmptyCategoriesInFilter: raw.showEmptyCategoriesInFilter !== undefined ? Boolean(raw.showEmptyCategoriesInFilter) : DEFAULT_ARTICLE_SETTINGS.showEmptyCategoriesInFilter,
    showViewCount: raw.showViewCount !== undefined ? Boolean(raw.showViewCount) : DEFAULT_ARTICLE_SETTINGS.showViewCount,
    showRatings: raw.showRatings !== undefined ? Boolean(raw.showRatings) : DEFAULT_ARTICLE_SETTINGS.showRatings,
  };
}

export function getArticleSettings(): ArticleSettings {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_ARTICLE_SETTINGS__) {
      return window.__GLOBAL_ARTICLE_SETTINGS__;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const sanitized = sanitizeArticleSettings(parsed);
      if (typeof window !== 'undefined') window.__GLOBAL_ARTICLE_SETTINGS__ = sanitized;
      return sanitized;
    }
  } catch (err) {
    console.error('Hiba a cikk beállítások olvasásakor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_ARTICLE_SETTINGS__ = DEFAULT_ARTICLE_SETTINGS;
  return DEFAULT_ARTICLE_SETTINGS;
}

export function saveArticleSettings(settings: ArticleSettings): void {
  const sanitized = sanitizeArticleSettings(settings);
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_ARTICLE_SETTINGS__ = sanitized;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new Event('article_settings_updated'));
    }
  } catch (err) {
    console.error('Hiba a cikk beállítások mentésekor:', err);
  }

  // Sync to Cloud asynchronously
  void syncArticleSettingsToCloud(sanitized);
}

async function syncArticleSettingsToCloud(settings: ArticleSettings): Promise<void> {
  try {
    const payload = {
      id: SUPABASE_ARTICLE_SETTINGS_ID,
      name: '__SYSTEM_CONFIG_ARTICLE_SETTINGS__',
      slug: 'system-config-article-settings',
      description: JSON.stringify(settings),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('categories')
      .upsert(payload, { onConflict: 'id' });

    if (error && !/RLS/i.test(error.message)) {
      console.warn('Cloud sync article settings warning:', error.message);
    }
  } catch (err) {
    console.warn('Cloud sync article settings error:', err);
  }
}

export async function fetchArticleSettingsFromCloud(): Promise<ArticleSettings | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_ARTICLE_SETTINGS_ID)
      .maybeSingle();

    if (!error && data?.description) {
      const parsed = JSON.parse(data.description);
      const sanitized = sanitizeArticleSettings(parsed);
      if (typeof window !== 'undefined') {
        window.__GLOBAL_ARTICLE_SETTINGS__ = sanitized;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        window.dispatchEvent(new Event('article_settings_updated'));
      }
      return sanitized;
    }
  } catch (err) {
    console.warn('Fetch article settings from cloud error:', err);
  }
  return null;
}

export function useArticleSettings(): ArticleSettings {
  const [settings, setSettings] = useState<ArticleSettings>(() => getArticleSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getArticleSettings());
    };

    window.addEventListener('article_settings_updated', handleUpdate);
    void fetchArticleSettingsFromCloud().then((cloudData) => {
      if (cloudData) setSettings(cloudData);
    });

    return () => window.removeEventListener('article_settings_updated', handleUpdate);
  }, []);

  return settings;
}
