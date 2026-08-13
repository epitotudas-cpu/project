import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AboutSettings {
  heroTagline: string;
  heroTitle: string;
  heroDescription: string;
  missionTitle: string;
  missionDescription: string;
  pillar1Title: string;
  pillar1Desc: string;
  pillar2Title: string;
  pillar2Desc: string;
  pillar3Title: string;
  pillar3Desc: string;
  resourcesTitle: string;
  resourcesDesc: string;
}

export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  heroTagline: 'Rólunk',
  heroTitle: 'Az ÉpítőTudásról és küldetésünkről',
  heroDescription: 'Magyarország online építőipari tudásbázisa. Célunk a szakképesítés támogatása, a szakmai normák terjesztése és az iparági szereplők összekapcsolása.',
  missionTitle: 'Célunk és küldetésünk',
  missionDescription: 'Az ÉpítőTudás egy független szakmai digitális platform, amely a minőségi kivitelezést és a szakoktatást szolgálja.',
  pillar1Title: 'Hitelesség és Szabványosság',
  pillar1Desc: 'Tartalmaink a legújabb MSZ és EU építőipari normáknak, valamint szakértő mérnökök tapasztalatainak felelnek meg.',
  pillar2Title: 'Gyakorlatorientált Tudás',
  pillar2Desc: 'Interaktív kalkulátorok, szerszámtesztek és lépésről lépésre követhető technológiai útmutatók segítenik a munkádat.',
  pillar3Title: 'Nyílt Szakmai Közösség',
  pillar3Desc: 'Összekötjük a szakképzett kőműveseket, ácsokat, burkolókat, tervezőket és a minőségi munkát kereső megrendelőket.',
  resourcesTitle: 'Ajánlott Szakmai Források',
  resourcesDesc: 'Válogatott szabványgyűjtemények, szakirodalmi ajánlók és hivatalos kamara kiadványok.',
};

const STORAGE_KEY = 'epitotudas_about_settings_v1';
const SUPABASE_ABOUT_ID = '00000000-0000-0000-0000-000000000008';

declare global {
  interface Window {
    __GLOBAL_ABOUT_SETTINGS__?: AboutSettings;
  }
}

export function getAboutSettings(): AboutSettings {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_ABOUT_SETTINGS__) {
      return window.__GLOBAL_ABOUT_SETTINGS__;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.heroTitle) {
        const data = { ...DEFAULT_ABOUT_SETTINGS, ...parsed };
        if (typeof window !== 'undefined') window.__GLOBAL_ABOUT_SETTINGS__ = data;
        return data;
      }
    }
  } catch (err) {
    console.error('Hiba a Rólunk beállítások betöltésekor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_ABOUT_SETTINGS__ = DEFAULT_ABOUT_SETTINGS;
  return DEFAULT_ABOUT_SETTINGS;
}

export function saveAboutSettings(settings: AboutSettings): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_ABOUT_SETTINGS__ = settings;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('about-settings-changed'));

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_ABOUT_ID,
          name: '__SYSTEM_CONFIG_ABOUT_SETTINGS__',
          slug: 'system-about-config',
          description: JSON.stringify(settings),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase about settings cloud sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a Rólunk beállítások mentésekor:', err);
  }
}

export async function fetchAboutSettingsFromCloud(): Promise<AboutSettings | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_ABOUT_ID)
      .maybeSingle();

    if (!error && data?.description && data.description.startsWith('{')) {
      const parsed = JSON.parse(data.description);
      if (parsed && parsed.heroTitle) {
        const merged = { ...DEFAULT_ABOUT_SETTINGS, ...parsed };
        if (typeof window !== 'undefined') {
          window.__GLOBAL_ABOUT_SETTINGS__ = merged;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new Event('about-settings-changed'));
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('Cloud about settings fetch info:', err);
  }
  return null;
}

export function useAboutSettings(): AboutSettings {
  const [settings, setSettings] = useState<AboutSettings>(() => getAboutSettings());

  useEffect(() => {
    function handleChange() {
      setSettings(getAboutSettings());
    }
    handleChange();

    void fetchAboutSettingsFromCloud().then((cloudData) => {
      if (cloudData) setSettings(cloudData);
    });

    window.addEventListener('about-settings-changed', handleChange);
    return () => window.removeEventListener('about-settings-changed', handleChange);
  }, []);

  return settings;
}
