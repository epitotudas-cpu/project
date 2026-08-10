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
};

const STORAGE_KEY = 'epitotudas_hero_state_v1';

export function getHeroState(): HeroState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        config: { ...DEFAULT_HERO_CONFIG, ...(parsed.config || {}) },
        images: Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images : DEFAULT_HERO_IMAGES,
      };
    }
  } catch (err) {
    console.error('Hiba a hero képek betöltésekor:', err);
  }
  return {
    config: DEFAULT_HERO_CONFIG,
    images: DEFAULT_HERO_IMAGES,
  };
}

export function saveHeroState(state: HeroState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('hero-config-changed'));
  } catch (err) {
    console.error('Hiba a hero beállítások mentésekor:', err);
  }
}

export function getActiveHeroImages(state?: HeroState): HeroImage[] {
  const current = state || getHeroState();
  const active = current.images
    .filter((img) => img.isActive && img.imageUrl?.trim())
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (active.length > 0) return active;
  return DEFAULT_HERO_IMAGES;
}
