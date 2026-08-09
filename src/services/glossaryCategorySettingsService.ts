export interface GlossaryCategorySettingItem {
  categoryName: string;
  icon: string;
  enabled: boolean;
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

export function getGlossaryCategorySettings(): GlossaryCategorySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS,
        ...parsed,
        categoryItems: {
          ...DEFAULT_GLOSSARY_CATEGORY_SETTINGS.categoryItems,
          ...(parsed.categoryItems || {}),
        },
      };
    }
  } catch (err) {
    console.error('Hiba a fogalomtár kategória beállítások betöltésekor:', err);
  }
  return DEFAULT_GLOSSARY_CATEGORY_SETTINGS;
}

export function saveGlossaryCategorySettings(settings: GlossaryCategorySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('glossary-category-settings-changed'));
  } catch (err) {
    console.error('Hiba a fogalomtár kategória beállítások mentésekor:', err);
  }
}
