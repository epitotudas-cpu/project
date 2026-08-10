import { supabase } from '../lib/supabase';

export interface HeroImage {
  id: string;
  imageUrl: string;
  altText: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export type HeroRotationMode = 'static' | 'slideshow' | 'random';

export interface HeroConfig {
  rotationMode: HeroRotationMode;
  rotationIntervalSeconds: number;
  defaultImageId?: string;
  enabled: boolean;
  showIndicators: boolean;
}

export interface HeroState {
  config: HeroConfig;
  images: HeroImage[];
}

export const DEFAULT_HERO_IMAGES: HeroImage[] = [
  {
    id: 'hero-1',
    imageUrl: '/hero-construction.jpg',
    altText: 'Építőipari munkálatok és zsaluzás',
    isActive: true,
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'hero-2',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
    altText: 'Modern építészet és szerkezetépítés',
    isActive: true,
    displayOrder: 2,
    createdAt: '2026-01-02T00:00:00Z',
  },
  {
    id: 'hero-3',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    altText: 'Munkaterületi munkavédelem és mérések',
    isActive: true,
    displayOrder: 3,
    createdAt: '2026-01-03T00:00:00Z',
  },
  {
    id: 'hero-4',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    altText: 'Épületgépészet és kivitelezés',
    isActive: true,
    displayOrder: 4,
    createdAt: '2026-01-04T00:00:00Z',
  },
];

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  rotationMode: 'slideshow',
  rotationIntervalSeconds: 5,
  defaultImageId: 'hero-1',
  enabled: true,
  showIndicators: true,
};

const STORAGE_KEY = 'epitotudas_hero_state_v1';
const BACKUP_STORAGE_KEY = 'epitotudas_hero_state_backup_v1';
const SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000002';

declare global {
  interface Window {
    __GLOBAL_HERO_STATE__?: HeroState;
  }
}

export function getHeroState(): HeroState {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_HERO_STATE__) {
      return window.__GLOBAL_HERO_STATE__;
    }

    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const state: HeroState = {
        config: { ...DEFAULT_HERO_CONFIG, ...(parsed.config || {}) },
        images: Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images : DEFAULT_HERO_IMAGES,
      };
      if (typeof window !== 'undefined') {
        window.__GLOBAL_HERO_STATE__ = state;
      }
      return state;
    }
  } catch (err) {
    console.error('Hiba a hero képek betöltésekor:', err);
  }

  const defaultState: HeroState = {
    config: DEFAULT_HERO_CONFIG,
    images: DEFAULT_HERO_IMAGES,
  };
  if (typeof window !== 'undefined') {
    window.__GLOBAL_HERO_STATE__ = defaultState;
  }
  return defaultState;
}

export function saveHeroState(state: HeroState): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_HERO_STATE__ = state;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('hero-config-changed'));

    void (async () => {
      const payloadString = JSON.stringify(state);
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ID,
          name: '__SYSTEM_CONFIG_HERO_STATE__',
          slug: 'system-hero-state-config',
          description: payloadString,
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase categories hero_state sync info:', err);
      }

      try {
        await supabase.from('ad_campaigns').upsert({
          id: SUPABASE_SYSTEM_ID,
          sponsor_name: '__SYSTEM_CONFIG_HERO_STATE__',
          placement_slot: 'config',
          title: 'HeroStateData',
          banner_image_url: payloadString,
          status: 'system',
          start_date: new Date().toISOString(),
          impressions_count: 0,
          clicks_count: 0,
        });
      } catch (err) {
        console.warn('Supabase ad_campaigns hero_state sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a hero beállítások mentésekor:', err);
  }
}

export async function fetchHeroStateFromCloud(): Promise<HeroState | null> {
  try {
    let rawJson: string | null = null;

    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_SYSTEM_ID)
      .maybeSingle();

    if (!catErr && catData?.description && catData.description.startsWith('{')) {
      rawJson = catData.description;
    } else {
      const { data: adData, error: adErr } = await supabase
        .from('ad_campaigns')
        .select('banner_image_url')
        .eq('id', SUPABASE_SYSTEM_ID)
        .maybeSingle();

      if (!adErr && adData?.banner_image_url && adData.banner_image_url.startsWith('{')) {
        rawJson = adData.banner_image_url;
      }
    }

    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      const state: HeroState = {
        config: { ...DEFAULT_HERO_CONFIG, ...(parsed.config || {}) },
        images: Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images : DEFAULT_HERO_IMAGES,
      };
      if (typeof window !== 'undefined') {
        window.__GLOBAL_HERO_STATE__ = state;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new Event('hero-config-changed'));
      }
      return state;
    }
  } catch (err) {
    console.warn('Cloud hero state fetch info:', err);
  }
  return null;
}

export function getActiveHeroImages(state?: HeroState): HeroImage[] {
  try {
    const current = state || getHeroState();
    const active = current.images
      .filter((img) => img.isActive && img.imageUrl?.trim())
      .sort((a, b) => a.displayOrder - b.displayOrder);

    if (active.length > 0) return active;
  } catch (err) {
    console.error('Hiba az aktív hero képek lekérésekor:', err);
  }
  return DEFAULT_HERO_IMAGES;
}

if (typeof window !== 'undefined') {
  void fetchHeroStateFromCloud();
}
