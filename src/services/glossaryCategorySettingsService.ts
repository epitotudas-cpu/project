import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface GlossaryCategorySettingItem {
  categoryName: string;
  icon: string;
  enabled: boolean;
  isCustom?: boolean;
}

export interface GlossaryCategorySettings {
  showFeaturedCategories: boolean;
  showCategoryIcons: boolean;
  categoryItems: Record<string, GlossaryCategorySettingItem>;
}

export const DEFAULT_GLOSSARY_CATEGORY_SETTINGS: GlossaryCategorySettings = {
  showFeaturedCategories: true,
  showCategoryIcons: true,
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
    'Anyagismeret': { categoryName: 'Anyagismeret', icon: '🧱', enabled: true },
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
      return window.__GLOBAL_GLOSSARY_CAT_SETTINGS__;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const res = {
        ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS,
        ...parsed,
        categoryItems: {
          ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS.categoryItems,
          ...(parsed.categoryItems || {}),
        },
      };
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
    if (typeof window !== 'undefined') {
      window.__GLOBAL_GLOSSARY_CAT_SETTINGS__ = settings;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('glossary-category-settings-changed'));

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_GLOSSARY_CAT_ID,
          name: '__SYSTEM_CONFIG_GLOSSARY_CATEGORY_SETTINGS__',
          slug: 'system-glossary-cat-config',
          description: JSON.stringify(settings),
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
        const merged = {
          ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS,
          ...parsed,
          categoryItems: {
            ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS.categoryItems,
            ...(parsed.categoryItems || {}),
          },
        };
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
