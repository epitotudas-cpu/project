export interface SiteSettings {
  // Branding & Design
  siteTitle: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  themeMode: 'dark' | 'light';

  // Navigation Menu Toggles
  enabledNavItems: {
    home: boolean;
    category: boolean;
    glossary: boolean;
    tool: boolean;
    courses: boolean;
    careers: boolean;
    partners: boolean;
  };

  // Monetization & Ads
  showTopBanners: boolean;
  showSidebarAds: boolean;
  showAffiliateOffers: boolean;

  // System & Security
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowRegistration: boolean;
  requireAuthForDetailedGlossary: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'ÉpítőTudás',
  tagline: 'Építőipari Tudásbázis & Szakmai Enciklopédia',
  logoUrl: '',
  primaryColor: '#FFC400',
  themeMode: 'dark',

  enabledNavItems: {
    home: true,
    category: true,
    glossary: true,
    tool: true,
    courses: true,
    careers: true,
    partners: true,
  },

  showTopBanners: true,
  showSidebarAds: true,
  showAffiliateOffers: true,

  maintenanceMode: false,
  maintenanceMessage: 'Az oldal jelenleg karbantartás alatt áll. Kérjük, látogass vissza később!',
  allowRegistration: true,
  requireAuthForDetailedGlossary: true,
};

const STORAGE_KEY = 'epitotudas_site_settings_v1';

function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) + Math.round(2.55 * percent);
  let g = ((num >> 8) & 0x00ff) + Math.round(2.55 * percent);
  let b = (num & 0x0000ff) + Math.round(2.55 * percent);

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function applySiteSettings(settings: SiteSettings): void {
  if (typeof document === 'undefined') return;

  const accentColor = settings.primaryColor || '#FFC400';
  document.documentElement.style.setProperty('--color-accent', accentColor);
  document.documentElement.style.setProperty('--color-accent-hover', adjustColorBrightness(accentColor, -15));
  document.documentElement.style.setProperty('--color-accent-light', adjustColorBrightness(accentColor, 15));

  if (settings.siteTitle) {
    document.title = `${settings.siteTitle} - ${settings.tagline || 'Építőipari Tudásbázis & Szakmai Enciklopédia'}`;
  }
}

export function getSiteSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const settings = {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
        enabledNavItems: {
          ...DEFAULT_SITE_SETTINGS.enabledNavItems,
          ...(parsed.enabledNavItems || {}),
        },
      };
      applySiteSettings(settings);
      return settings;
    }
  } catch (err) {
    console.error('Hiba a beállítások olvasásakor:', err);
  }
  applySiteSettings(DEFAULT_SITE_SETTINGS);
  return DEFAULT_SITE_SETTINGS;
}

export function saveSiteSettings(settings: SiteSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applySiteSettings(settings);
    window.dispatchEvent(new Event('site-settings-changed'));
  } catch (err) {
    console.error('Hiba a beállítások mentésekor:', err);
  }
}
