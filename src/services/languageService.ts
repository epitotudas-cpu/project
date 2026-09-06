import { useState, useEffect } from 'react';
import { supabase, type GlossaryLanguage } from '../lib/supabase';

export const DEFAULT_GLOSSARY_LANGUAGES: GlossaryLanguage[] = [
  {
    id: 'lang-hu',
    name_hu: 'Magyar',
    name_native: 'Magyar',
    iso_code: 'hu',
    flag_code: 'HU',
    flag_emoji: '🇭🇺',
    short_label: 'HU',
    sort_order: 1,
    is_active: true,
    is_default: true,
    is_system_protected: true,
    is_rtl: false,
  },
  {
    id: 'lang-en',
    name_hu: 'Angol',
    name_native: 'English',
    iso_code: 'en',
    flag_code: 'GB',
    flag_emoji: '🇬🇧',
    short_label: 'EN',
    sort_order: 2,
    is_active: true,
    is_default: false,
    is_system_protected: false,
    is_rtl: false,
  },
  {
    id: 'lang-de',
    name_hu: 'Német',
    name_native: 'Deutsch',
    iso_code: 'de',
    flag_code: 'DE',
    flag_emoji: '🇩🇪',
    short_label: 'DE',
    sort_order: 3,
    is_active: true,
    is_default: false,
    is_system_protected: false,
    is_rtl: false,
  },
  {
    id: 'lang-ro',
    name_hu: 'Román',
    name_native: 'Română',
    iso_code: 'ro',
    flag_code: 'RO',
    flag_emoji: '🇷🇴',
    short_label: 'RO',
    sort_order: 4,
    is_active: true,
    is_default: false,
    is_system_protected: false,
    is_rtl: false,
  },
  {
    id: 'lang-sk',
    name_hu: 'Szlovák',
    name_native: 'Slovenčina',
    iso_code: 'sk',
    flag_code: 'SK',
    flag_emoji: '🇸🇰',
    short_label: 'SK',
    sort_order: 5,
    is_active: false,
    is_default: false,
    is_system_protected: false,
    is_rtl: false,
  },
  {
    id: 'lang-hr',
    name_hu: 'Horvát',
    name_native: 'Hrvatski',
    iso_code: 'hr',
    flag_code: 'HR',
    flag_emoji: '🇭🇷',
    short_label: 'HR',
    sort_order: 6,
    is_active: false,
    is_default: false,
    is_system_protected: false,
    is_rtl: false,
  },
  {
    id: 'lang-it',
    name_hu: 'Olasz',
    name_native: 'Italiano',
    iso_code: 'it',
    flag_code: 'IT',
    flag_emoji: '🇮🇹',
    short_label: 'IT',
    sort_order: 7,
    is_active: false,
    is_default: false,
    is_system_protected: false,
    is_rtl: false,
  },
];

const STORAGE_KEY = 'epitotudas_glossary_languages_v1';

declare global {
  interface Window {
    __GLOBAL_GLOSSARY_LANGUAGES__?: GlossaryLanguage[];
  }
}

export function getGlossaryLanguages(): GlossaryLanguage[] {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_GLOSSARY_LANGUAGES__) {
      return window.__GLOBAL_GLOSSARY_LANGUAGES__;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') window.__GLOBAL_GLOSSARY_LANGUAGES__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba a nyelvek betöltésekor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_GLOSSARY_LANGUAGES__ = DEFAULT_GLOSSARY_LANGUAGES;
  return DEFAULT_GLOSSARY_LANGUAGES;
}

export function saveLocalGlossaryLanguages(languages: GlossaryLanguage[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_GLOSSARY_LANGUAGES__ = languages;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(languages));
    window.dispatchEvent(new Event('glossary-languages-changed'));
  } catch (err) {
    console.error('Hiba a nyelvek helyi mentésekor:', err);
  }
}

export async function fetchGlossaryLanguagesFromCloud(): Promise<GlossaryLanguage[]> {
  try {
    const { data, error } = await supabase
      .from('glossary_languages')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      saveLocalGlossaryLanguages(data as GlossaryLanguage[]);
      return data as GlossaryLanguage[];
    }
  } catch (err) {
    console.warn('Cloud languages fetch info:', err);
  }
  return getGlossaryLanguages();
}

export async function saveGlossaryLanguage(payload: Partial<GlossaryLanguage> & { name_hu: string; iso_code: string }): Promise<GlossaryLanguage> {
  const current = getGlossaryLanguages();
  const cleanIso = payload.iso_code.trim().toLowerCase();

  // Check duplicate ISO code
  const existingWithIso = current.find((l) => l.iso_code.toLowerCase() === cleanIso && l.id !== payload.id);
  if (existingWithIso) {
    throw new Error(`A(z) "${cleanIso.toUpperCase()}" nyelvkód már létezik! Kérjük használj más kódot.`);
  }

  const langToSave: GlossaryLanguage = {
    id: payload.id || `lang-${Date.now()}`,
    name_hu: payload.name_hu.trim(),
    name_native: (payload.name_native || payload.name_hu).trim(),
    iso_code: cleanIso,
    flag_code: payload.flag_code ? payload.flag_code.trim().toUpperCase() : cleanIso.toUpperCase(),
    flag_emoji: payload.flag_emoji ? payload.flag_emoji.trim() : '🌐',
    short_label: (payload.short_label || cleanIso.toUpperCase()).trim(),
    sort_order: payload.sort_order ?? (current.length + 1),
    is_active: payload.is_active ?? true,
    is_default: payload.is_default ?? false,
    is_system_protected: payload.is_system_protected ?? false,
    is_rtl: payload.is_rtl ?? false,
  };

  // Update local
  const existingIdx = current.findIndex((l) => l.id === langToSave.id);
  let updated: GlossaryLanguage[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = langToSave;
  } else {
    updated = [...current, langToSave];
  }
  updated.sort((a, b) => a.sort_order - b.sort_order);
  saveLocalGlossaryLanguages(updated);

  // Cloud upsert
  try {
    const { data, error } = await supabase
      .from('glossary_languages')
      .upsert({
        ...langToSave,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'iso_code' })
      .select('*')
      .single();

    if (!error && data) {
      const cloudResult = data as GlossaryLanguage;
      const finalIndex = updated.findIndex((l) => l.iso_code === cloudResult.iso_code);
      if (finalIndex >= 0) {
        updated[finalIndex] = cloudResult;
        saveLocalGlossaryLanguages(updated);
      }
      return cloudResult;
    }
  } catch (err) {
    console.warn('Cloud language upsert info:', err);
  }

  return langToSave;
}

export async function toggleLanguageActive(id: string): Promise<GlossaryLanguage[]> {
  const current = getGlossaryLanguages();
  const target = current.find((l) => l.id === id);

  if (!target) return current;

  if (target.is_system_protected || target.iso_code === 'hu') {
    throw new Error('A magyar (HU) alapnyelv védett, nem inaktiválható!');
  }

  const updated = current.map((l) => (l.id === id ? { ...l, is_active: !l.is_active } : l));
  saveLocalGlossaryLanguages(updated);

  try {
    await supabase
      .from('glossary_languages')
      .update({ is_active: !target.is_active, updated_at: new Date().toISOString() } as any)
      .eq('id', target.id);
  } catch (err) {
    console.warn('Cloud toggle language active info:', err);
  }

  return updated;
}

export async function deleteGlossaryLanguage(id: string): Promise<GlossaryLanguage[]> {
  const current = getGlossaryLanguages();
  const target = current.find((l) => l.id === id);

  if (!target) return current;

  if (target.is_system_protected || target.iso_code === 'hu') {
    throw new Error('A magyar (HU) alapnyelv védett, nem törölhető!');
  }

  const updated = current.filter((l) => l.id !== id);
  saveLocalGlossaryLanguages(updated);

  try {
    await supabase.from('glossary_languages').delete().eq('id', target.id);
  } catch (err) {
    console.warn('Cloud delete language info:', err);
  }

  return updated;
}

export function useGlossaryLanguages(options?: { onlyActive?: boolean }): {
  languages: GlossaryLanguage[];
  activeLanguages: GlossaryLanguage[];
  loading: boolean;
  refresh: () => void;
} {
  const [languages, setLanguages] = useState<GlossaryLanguage[]>(() => getGlossaryLanguages());
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetchGlossaryLanguagesFromCloud().then((cloudLangs) => {
      setLanguages(cloudLangs);
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();

    const handleChanged = () => {
      setLanguages(getGlossaryLanguages());
    };

    window.addEventListener('glossary-languages-changed', handleChanged);
    return () => window.removeEventListener('glossary-languages-changed', handleChanged);
  }, []);

  const activeLanguages = languages.filter((l) => l.is_active !== false);

  return {
    languages: options?.onlyActive ? activeLanguages : languages,
    activeLanguages,
    loading,
    refresh,
  };
}
