import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface GlossaryCategorySettingItem {
  categoryName: string;
  icon: string;
  customImageUrl?: string;
  enabled: boolean;
  isCustom?: boolean;
}

export interface GlossaryCategorySettings {
  showFeaturedCategories: boolean;
  showCategoryIcons: boolean;
  categoryItems: Record<string, GlossaryCategorySettingItem>;
  deletedCategories?: string[];
}

export function getDefaultCategoryIcon(catName?: string | null): string {
  if (!catName) return '📚';
  const trimmed = catName.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('alap') && lower.includes('föld')) return '🚜';
  if (lower.includes('alap')) return '🏗️';
  if (lower.includes('szerkezet')) return '🏗️';
  if (lower.includes('gép') || lower.includes('szerszám')) return '🛠️';
  if (lower.includes('hőszigetel') || lower.includes('hőszigetelek')) return '🌡️';
  if (lower.includes('vízszigetel') || lower.includes('vízszigetelek')) return '💧';
  if (lower.includes('szigetel')) return '🛡️';
  if (lower.includes('pára')) return '💨';
  if (lower.includes('anyag')) return '🧪';
  if (lower.includes('zsalu')) return '🪵';
  if (lower.includes('födém')) return '🏛️';
  if (lower.includes('vasbeton')) return '⚙️';
  if (lower.includes('fal') || lower.includes('kőműves')) return '🧱';
  if (lower.includes('tető') || lower.includes('bádog')) return '🏠';
  if (lower.includes('villamos') || lower.includes('villar')) return '⚡';
  if (lower.includes('gépész')) return '⚙️';
  if (lower.includes('vakol')) return '🖌️';
  if (lower.includes('burkol')) return '🔲';
  if (lower.includes('asztalos') || lower.includes('ácsl') || lower.includes('ácsa') || lower.includes('ács')) return '🪚';
  if (lower.includes('fest')) return '🎨';
  if (lower.includes('kert')) return '🌱';
  if (lower.includes('bont')) return '🔨';
  if (lower.includes('szakipar')) return '🔧';

  return '📚';
}

function sanitizeCategorySettings(settings: GlossaryCategorySettings): GlossaryCategorySettings {
  if (!settings) return DEFAULT_GLOSSARY_CATEGORY_SETTINGS;
  const deletedList = Array.isArray(settings.deletedCategories) ? settings.deletedCategories : [];
  const rawItems = settings.categoryItems || {};
  const nextItems: Record<string, GlossaryCategorySettingItem> = {};

  for (const [key, item] of Object.entries(rawItems)) {
    const isDeleted = deletedList.includes(key);
    const isBrickWall = item.icon === '🧱';
    const isMasonry = key.toLowerCase().includes('fal') || key.toLowerCase().includes('kőműves');

    nextItems[key] = {
      ...item,
      enabled: isDeleted ? false : (item.enabled !== false),
      icon: (isBrickWall && !isMasonry) ? getDefaultCategoryIcon(key) : (item.icon || getDefaultCategoryIcon(key)),
    };
  }

  return {
    showFeaturedCategories: settings.showFeaturedCategories !== false,
    showCategoryIcons: settings.showCategoryIcons !== false,
    categoryItems: nextItems,
    deletedCategories: deletedList,
  };
}

export const DEFAULT_GLOSSARY_CATEGORY_SETTINGS: GlossaryCategorySettings = {
  showFeaturedCategories: true,
  showCategoryIcons: true,
  deletedCategories: [],
  categoryItems: {
    'Alapozás & Földmunka': { categoryName: 'Alapozás & Földmunka', icon: '🚜', enabled: true },
    'Alapozás': { categoryName: 'Alapozás', icon: '🏗️', enabled: true },
    'Szerkezetépítés': { categoryName: 'Szerkezetépítés', icon: '🏗️', enabled: true },
    'Gépek & Szerszámok': { categoryName: 'Gépek & Szerszámok', icon: '🛠️', enabled: true },
    'Gépek és kisgépek': { categoryName: 'Gépek és kisgépek', icon: '🛠️', enabled: true },
    'Szerszámok': { categoryName: 'Szerszámok', icon: '🔧', enabled: true },
    'Szigetelés': { categoryName: 'Szigetelés', icon: '🛡️', enabled: true },
    'Hőszigetelés': { categoryName: 'Hőszigetelés', icon: '🌡️', enabled: true },
    'Vízszigetelés': { categoryName: 'Vízszigetelés', icon: '💧', enabled: true },
    'Páratechnika': { categoryName: 'Páratechnika', icon: '💨', enabled: true },
    'Anyagismeret': { categoryName: 'Anyagismeret', icon: '🧪', enabled: true },
    'Zsaluzás': { categoryName: 'Zsaluzás', icon: '🪵', enabled: true },
    'Födémek': { categoryName: 'Födémek', icon: '🏛️', enabled: true },
    'Szakipar': { categoryName: 'Szakipar', icon: '🔧', enabled: true },
    'Vasbeton': { categoryName: 'Vasbeton', icon: '⚙️', enabled: true },
    'Falazás': { categoryName: 'Falazás', icon: '🧱', enabled: true },
    'Tetőfedés': { categoryName: 'Tetőfedés', icon: '🏠', enabled: true },
    'Villamos': { categoryName: 'Villamos', icon: '⚡', enabled: true },
    'Gépészet': { categoryName: 'Gépészet', icon: '⚙️', enabled: true },
    'Vakolás': { categoryName: 'Vakolás', icon: '🖌️', enabled: true },
    'Burkolás': { categoryName: 'Burkolás', icon: '🔲', enabled: true },
    'Asztalos': { categoryName: 'Asztalos', icon: '🪚', enabled: true },
    'Kőműves': { categoryName: 'Kőműves', icon: '🧱', enabled: true },
    'Ács': { categoryName: 'Ács', icon: '🪚', enabled: true },
    'Burkoló': { categoryName: 'Burkoló', icon: '🔲', enabled: true },
  },
};

const STORAGE_KEY = 'epitotudas_glossary_category_settings_v1';
const SUPABASE_GLOSSARY_CAT_ID = '00000000-0000-0000-0000-000000000009';

declare global {
  interface Window {
    __GLOBAL_GLOSSARY_CAT_SETTINGS__?: GlossaryCategorySettings;
  }
}

export function getGlossaryCategorySettings(): GlossaryCategorySettings {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_GLOSSARY_CAT_SETTINGS__) {
      return sanitizeCategorySettings(window.__GLOBAL_GLOSSARY_CAT_SETTINGS__);
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const res = sanitizeCategorySettings({
        ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS,
        ...parsed,
        categoryItems: {
          ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS.categoryItems,
          ...(parsed.categoryItems || {}),
        },
      });
      if (typeof window !== 'undefined') window.__GLOBAL_GLOSSARY_CAT_SETTINGS__ = res;
      return res;
    }
  } catch (err) {
    console.error('Hiba a fogalomtár kategória beállítások betöltésekor:', err);
  }
  if (typeof window !== 'undefined') window.__GLOBAL_GLOSSARY_CAT_SETTINGS__ = DEFAULT_GLOSSARY_CATEGORY_SETTINGS;
  return DEFAULT_GLOSSARY_CATEGORY_SETTINGS;
}

export function saveGlossaryCategorySettings(settings: GlossaryCategorySettings): void {
  try {
    const sanitized = sanitizeCategorySettings(settings);
    if (typeof window !== 'undefined') {
      window.__GLOBAL_GLOSSARY_CAT_SETTINGS__ = sanitized;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new Event('glossary-category-settings-changed'));

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_GLOSSARY_CAT_ID,
          name: '__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__',
          slug: 'system-glossary-cat-config',
          description: JSON.stringify(sanitized),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase glossary category cloud sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a fogalomtár kategória beállítások mentésekor:', err);
  }
}

export async function fetchGlossaryCategorySettingsFromCloud(): Promise<GlossaryCategorySettings | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_GLOSSARY_CAT_ID)
      .maybeSingle();

    if (!error && data?.description && data.description.startsWith('{')) {
      const parsed = JSON.parse(data.description);
      if (parsed && parsed.categoryItems) {
        const merged = sanitizeCategorySettings({
          ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS,
          ...parsed,
          categoryItems: {
            ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS.categoryItems,
            ...(parsed.categoryItems || {}),
          },
        });
        if (typeof window !== 'undefined') {
          window.__GLOBAL_GLOSSARY_CAT_SETTINGS__ = merged;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new Event('glossary-category-settings-changed'));
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('Cloud glossary category settings fetch info:', err);
  }
  return null;
}

export function useGlossaryCategorySettings(): GlossaryCategorySettings {
  const [settings, setSettings] = useState<GlossaryCategorySettings>(() => getGlossaryCategorySettings());

  useEffect(() => {
    function handleChange() {
      setSettings(getGlossaryCategorySettings());
    }
    handleChange();

    void fetchGlossaryCategorySettingsFromCloud().then((cloudData) => {
      if (cloudData) setSettings(cloudData);
    });

    window.addEventListener('glossary-category-settings-changed', handleChange);
    return () => window.removeEventListener('glossary-category-settings-changed', handleChange);
  }, []);

  return settings;
}

