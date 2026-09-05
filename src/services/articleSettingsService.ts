import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TypePageSettings {
  articlesPageTitle: string;
  articlesPageDescription: string;
  searchPlaceholderText: string;
  emptyStateTitle: string;
  emptyStateText: string;
  articlesPerPage: number;
  desktopGridColumns: 2 | 3 | 4;
  defaultSortMode: 'latest' | 'oldest' | 'featured' | 'manual' | 'popular';
  featuredMode: 'show' | 'pin' | 'hide';
}

export interface ArticleSettings {
  // Category & Listing Page (Default / Global)
  articlesPageTitle: string;
  articlesPageDescription: string;
  searchPlaceholderText: string;
  emptyStateText: string;
  articlesPerPage: number;
  desktopGridColumns: 2 | 3 | 4;
  defaultSortMode: 'latest' | 'oldest' | 'featured' | 'manual' | 'popular';
  paginationMode: 'pagination' | 'load_more';
  showLoadMoreButton: boolean;
  showCategoryTilesBlock: boolean;
  showEmptyCategoriesInFilter: boolean;
  showViewCount: boolean;
  showRatings: boolean;

  // Independent Settings per Article Type
  hirekPageSettings: TypePageSettings;
  ujdonsagPageSettings: TypePageSettings;
  utmutatoPageSettings: TypePageSettings;

  // Article Detail Page Toggles
  showAuthor: boolean;
  showDate: boolean;
  showReadTime: boolean;
  showFeaturedImage: boolean;
  showTags: boolean;
  showShareButtons: boolean;
  showRelatedArticles: boolean;
  showComments: boolean;
  showPartnerBlock: boolean;
  recommendationMode: 'auto' | 'manual' | 'hybrid';
  enforceSingleColumnLayout: boolean;
}

export const DEFAULT_HIREK_SETTINGS: TypePageSettings = {
  articlesPageTitle: 'Építőipari Hírek',
  articlesPageDescription: 'Legfrissebb hírek, piaci fejlemények, rendeleti változások és ágazati bejelentések.',
  searchPlaceholderText: 'Keresés hírek között (pl. rendelet, áremelkedés, szabályozás)...',
  emptyStateTitle: 'Nem található hír',
  emptyStateText: 'Nem található a keresési feltételeknek megfelelő hír.',
  articlesPerPage: 12,
  desktopGridColumns: 3,
  defaultSortMode: 'latest',
  featuredMode: 'pin',
};

export const DEFAULT_UJDONSAG_SETTINGS: TypePageSettings = {
  articlesPageTitle: 'Építőipari Újdonságok',
  articlesPageDescription: 'Új technológiák, innovatív építőanyagok, modern szerszámok és prémium termékek.',
  searchPlaceholderText: 'Keresés újdonságok között (pl. hőszigetelés, okosotthon, új szerszám)...',
  emptyStateTitle: 'Nem található újdonság',
  emptyStateText: 'Nem található a keresési feltételeknek megfelelő újdonság.',
  articlesPerPage: 12,
  desktopGridColumns: 3,
  defaultSortMode: 'latest',
  featuredMode: 'pin',
};

export const DEFAULT_UTMUTATO_SETTINGS: TypePageSettings = {
  articlesPageTitle: 'Szakmai Útmutatók & Technológiák',
  articlesPageDescription: 'Gyakorlati lépésről lépésre útmutatók, kivitelezési szabályok és rétegrendek.',
  searchPlaceholderText: 'Keresés útmutatók között (pl. gipszkarton, betonozás, burkolás)...',
  emptyStateTitle: 'Nem található útmutató',
  emptyStateText: 'Nem található a keresési feltételeknek megfelelő útmutató.',
  articlesPerPage: 12,
  desktopGridColumns: 3,
  defaultSortMode: 'latest',
  featuredMode: 'pin',
};

export const DEFAULT_ARTICLE_SETTINGS: ArticleSettings = {
  articlesPageTitle: 'Építőipari cikkek',
  articlesPageDescription: 'Gyakorlati útmutatók, szabványok, technológiai leírások és kivitelezési tippek.',
  searchPlaceholderText: 'Keresés cikkek között (pl. gipszkarton, betonozás, hőszigetelés)...',
  emptyStateText: 'Nem található a keresési feltételeknek megfelelő cikk.',
  articlesPerPage: 12,
  desktopGridColumns: 3,
  defaultSortMode: 'latest',
  paginationMode: 'load_more',
  showLoadMoreButton: true,
  showCategoryTilesBlock: false,
  showEmptyCategoriesInFilter: true,
  showViewCount: false,
  showRatings: false,

  hirekPageSettings: { ...DEFAULT_HIREK_SETTINGS },
  ujdonsagPageSettings: { ...DEFAULT_UJDONSAG_SETTINGS },
  utmutatoPageSettings: { ...DEFAULT_UTMUTATO_SETTINGS },

  showAuthor: true,
  showDate: true,
  showReadTime: true,
  showFeaturedImage: true,
  showTags: true,
  showShareButtons: true,
  showRelatedArticles: true,
  showComments: true,
  showPartnerBlock: true,
  recommendationMode: 'auto',
  enforceSingleColumnLayout: true,
};

const STORAGE_KEY = 'epitotudas_article_settings_v2';
const SUPABASE_ARTICLE_SETTINGS_ID = '00000000-0000-0000-0000-000000000014';

declare global {
  interface Window {
    __GLOBAL_ARTICLE_SETTINGS__?: ArticleSettings;
  }
}

function sanitizeTypeSettings(raw: Partial<TypePageSettings> | undefined, fallback: TypePageSettings): TypePageSettings {
  if (!raw) return { ...fallback };
  return {
    articlesPageTitle: raw.articlesPageTitle?.trim() || fallback.articlesPageTitle,
    articlesPageDescription: raw.articlesPageDescription?.trim() || fallback.articlesPageDescription,
    searchPlaceholderText: raw.searchPlaceholderText?.trim() || fallback.searchPlaceholderText,
    emptyStateTitle: raw.emptyStateTitle?.trim() || fallback.emptyStateTitle || 'Nincs megjeleníthető cikk',
    emptyStateText: raw.emptyStateText?.trim() || fallback.emptyStateText,
    articlesPerPage: typeof raw.articlesPerPage === 'number' && raw.articlesPerPage > 0 ? raw.articlesPerPage : fallback.articlesPerPage,
    desktopGridColumns: raw.desktopGridColumns === 2 || raw.desktopGridColumns === 4 ? raw.desktopGridColumns : fallback.desktopGridColumns,
    defaultSortMode: raw.defaultSortMode && ['latest', 'oldest', 'featured', 'manual', 'popular'].includes(raw.defaultSortMode) ? raw.defaultSortMode : fallback.defaultSortMode,
    featuredMode: raw.featuredMode && ['show', 'pin', 'hide'].includes(raw.featuredMode) ? raw.featuredMode : (fallback.featuredMode || 'pin'),
  };
}

function sanitizeArticleSettings(raw: Partial<ArticleSettings>): ArticleSettings {
  return {
    articlesPageTitle: raw.articlesPageTitle?.trim() || DEFAULT_ARTICLE_SETTINGS.articlesPageTitle,
    articlesPageDescription: raw.articlesPageDescription?.trim() || DEFAULT_ARTICLE_SETTINGS.articlesPageDescription,
    searchPlaceholderText: raw.searchPlaceholderText?.trim() || DEFAULT_ARTICLE_SETTINGS.searchPlaceholderText,
    emptyStateText: raw.emptyStateText?.trim() || DEFAULT_ARTICLE_SETTINGS.emptyStateText,
    articlesPerPage: typeof raw.articlesPerPage === 'number' && raw.articlesPerPage > 0 ? raw.articlesPerPage : DEFAULT_ARTICLE_SETTINGS.articlesPerPage,
    desktopGridColumns: raw.desktopGridColumns === 2 || raw.desktopGridColumns === 4 ? raw.desktopGridColumns : 3,
    defaultSortMode: raw.defaultSortMode && ['latest', 'oldest', 'featured', 'manual', 'popular'].includes(raw.defaultSortMode) ? raw.defaultSortMode : 'latest',
    paginationMode: raw.paginationMode === 'pagination' ? 'pagination' : 'load_more',
    showLoadMoreButton: raw.showLoadMoreButton !== undefined ? Boolean(raw.showLoadMoreButton) : DEFAULT_ARTICLE_SETTINGS.showLoadMoreButton,
    showCategoryTilesBlock: raw.showCategoryTilesBlock !== undefined ? Boolean(raw.showCategoryTilesBlock) : DEFAULT_ARTICLE_SETTINGS.showCategoryTilesBlock,
    showEmptyCategoriesInFilter: raw.showEmptyCategoriesInFilter !== undefined ? Boolean(raw.showEmptyCategoriesInFilter) : DEFAULT_ARTICLE_SETTINGS.showEmptyCategoriesInFilter,
    showViewCount: raw.showViewCount !== undefined ? Boolean(raw.showViewCount) : DEFAULT_ARTICLE_SETTINGS.showViewCount,
    showRatings: raw.showRatings !== undefined ? Boolean(raw.showRatings) : DEFAULT_ARTICLE_SETTINGS.showRatings,

    hirekPageSettings: sanitizeTypeSettings(raw.hirekPageSettings, DEFAULT_HIREK_SETTINGS),
    ujdonsagPageSettings: sanitizeTypeSettings(raw.ujdonsagPageSettings, DEFAULT_UJDONSAG_SETTINGS),
    utmutatoPageSettings: sanitizeTypeSettings(raw.utmutatoPageSettings, DEFAULT_UTMUTATO_SETTINGS),

    showAuthor: raw.showAuthor !== undefined ? Boolean(raw.showAuthor) : DEFAULT_ARTICLE_SETTINGS.showAuthor,
    showDate: raw.showDate !== undefined ? Boolean(raw.showDate) : DEFAULT_ARTICLE_SETTINGS.showDate,
    showReadTime: raw.showReadTime !== undefined ? Boolean(raw.showReadTime) : DEFAULT_ARTICLE_SETTINGS.showReadTime,
    showFeaturedImage: raw.showFeaturedImage !== undefined ? Boolean(raw.showFeaturedImage) : DEFAULT_ARTICLE_SETTINGS.showFeaturedImage,
    showTags: raw.showTags !== undefined ? Boolean(raw.showTags) : DEFAULT_ARTICLE_SETTINGS.showTags,
    showShareButtons: raw.showShareButtons !== undefined ? Boolean(raw.showShareButtons) : DEFAULT_ARTICLE_SETTINGS.showShareButtons,
    showRelatedArticles: raw.showRelatedArticles !== undefined ? Boolean(raw.showRelatedArticles) : DEFAULT_ARTICLE_SETTINGS.showRelatedArticles,
    showComments: raw.showComments !== undefined ? Boolean(raw.showComments) : DEFAULT_ARTICLE_SETTINGS.showComments,
    showPartnerBlock: raw.showPartnerBlock !== undefined ? Boolean(raw.showPartnerBlock) : DEFAULT_ARTICLE_SETTINGS.showPartnerBlock,
    recommendationMode: raw.recommendationMode && ['auto', 'manual', 'hybrid'].includes(raw.recommendationMode) ? raw.recommendationMode : 'auto',
    enforceSingleColumnLayout: raw.enforceSingleColumnLayout !== undefined ? Boolean(raw.enforceSingleColumnLayout) : DEFAULT_ARTICLE_SETTINGS.enforceSingleColumnLayout,
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

export function getArticleSettingsForType(type: 'hirek' | 'ujdonsagok' | 'utmutatok'): TypePageSettings {
  const current = getArticleSettings();
  if (type === 'hirek') return current.hirekPageSettings || DEFAULT_HIREK_SETTINGS;
  if (type === 'ujdonsagok') return current.ujdonsagPageSettings || DEFAULT_UJDONSAG_SETTINGS;
  return current.utmutatoPageSettings || DEFAULT_UTMUTATO_SETTINGS;
}

export function saveArticleSettingsForType(
  type: 'hirek' | 'ujdonsagok' | 'utmutatok',
  typeSettings: TypePageSettings
): void {
  const current = getArticleSettings();
  const updated: ArticleSettings = {
    ...current,
    hirekPageSettings: type === 'hirek' ? typeSettings : current.hirekPageSettings,
    ujdonsagPageSettings: type === 'ujdonsagok' ? typeSettings : current.ujdonsagPageSettings,
    utmutatoPageSettings: type === 'utmutatok' ? typeSettings : current.utmutatoPageSettings,
  };
  saveArticleSettings(updated);
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
