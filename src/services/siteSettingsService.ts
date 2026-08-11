import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
const BACKUP_STORAGE_KEY = 'epitotudas_site_settings_backup_v1';
const SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000001';

declare global {
  interface Window {
    __GLOBAL_SITE_SETTINGS__?: SiteSettings;
  }
}

function adjustColorBrightness(hex: string, percent: number): string {
  try {
    const num = parseInt((hex || '#FFC400').replace('#', ''), 16);
    if (isNaN(num)) return hex || '#FFC400';

    let r = (num >> 16) + Math.round(2.55 * percent);
    let g = ((num >> 8) & 0x00ff) + Math.round(2.55 * percent);
    let b = (num & 0x0000ff) + Math.round(2.55 * percent);

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch {
    return hex || '#FFC400';
  }
}

export function applySiteSettings(settings: SiteSettings): void {
  try {
    if (typeof document === 'undefined') return;

    const accentColor = settings?.primaryColor || '#FFC400';
    document.documentElement.style.setProperty('--color-accent', accentColor);
    document.documentElement.style.setProperty('--color-accent-hover', adjustColorBrightness(accentColor, -15));
    document.documentElement.style.setProperty('--color-accent-light', adjustColorBrightness(accentColor, 15));

    if (settings?.siteTitle) {
      document.title = `${settings.siteTitle} - ${settings.tagline || 'Építőipari Tudásbázis & Szakmai Enciklopédia'}`;
    }

    // Dynamic Favicon & Apple Touch Icon from admin logoUrl
    const logoUrl = (settings?.logoUrl && settings.logoUrl.trim()) ? settings.logoUrl.trim() : '/logo.png';

    let iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = logoUrl;

    let appleIconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleIconLink) {
      appleIconLink = document.createElement('link');
      appleIconLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleIconLink);
    }
    appleIconLink.href = logoUrl;
  } catch (err) {
    console.error('Hiba a beállítások érvényesítésekor:', err);
  }
}

export function getSiteSettings(): SiteSettings {
  try {
    // 1. Check in-memory global window cache first
    if (typeof window !== 'undefined' && window.__GLOBAL_SITE_SETTINGS__) {
      applySiteSettings(window.__GLOBAL_SITE_SETTINGS__);
      return window.__GLOBAL_SITE_SETTINGS__;
    }

    // 2. Check primary and backup localStorage
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const settings: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
        enabledNavItems: {
          ...DEFAULT_SITE_SETTINGS.enabledNavItems,
          ...(parsed.enabledNavItems || {}),
        },
      };
      if (typeof window !== 'undefined') {
        window.__GLOBAL_SITE_SETTINGS__ = settings;
      }
      applySiteSettings(settings);
      return settings;
    }
  } catch (err) {
    console.error('Hiba a beállítások olvasásakor:', err);
  }

  // 3. Fallback
  if (typeof window !== 'undefined') {
    window.__GLOBAL_SITE_SETTINGS__ = DEFAULT_SITE_SETTINGS;
  }
  applySiteSettings(DEFAULT_SITE_SETTINGS);
  return DEFAULT_SITE_SETTINGS;
}

export function saveSiteSettings(settings: SiteSettings): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_SITE_SETTINGS__ = settings;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(settings));
    applySiteSettings(settings);
    window.dispatchEvent(new Event('site-settings-changed'));

    // Cloud sync to Supabase table 'categories' (which exists and works without 404 error)
    void (async () => {
      const payloadString = JSON.stringify(settings);
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ID,
          name: '__SYSTEM_CONFIG_SITE_SETTINGS__',
          slug: 'system-site-settings-config',
          description: payloadString,
          banner_url: settings.logoUrl || '/logo.png',
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase categories site_settings sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a beállítások mentésekor:', err);
  }
}

export async function fetchSiteSettingsFromCloud(): Promise<SiteSettings | null> {
  try {
    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_SYSTEM_ID)
      .maybeSingle();

    if (!catErr && catData?.description && catData.description.startsWith('{')) {
      const parsed = JSON.parse(catData.description);
      const settings: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
        enabledNavItems: {
          ...DEFAULT_SITE_SETTINGS.enabledNavItems,
          ...(parsed.enabledNavItems || {}),
        },
      };
      if (typeof window !== 'undefined') {
        window.__GLOBAL_SITE_SETTINGS__ = settings;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(settings));
        window.dispatchEvent(new Event('site-settings-changed'));
      }
      applySiteSettings(settings);
      return settings;
    }
  } catch (err) {
    console.warn('Cloud site settings fetch info:', err);
  }
  return null;
}

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(() => getSiteSettings());

  useEffect(() => {
    function handleChange() {
      const current = getSiteSettings();
      setSettings(current);
      applySiteSettings(current);
    }

    handleChange();

    void fetchSiteSettingsFromCloud().then((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
        applySiteSettings(cloudSettings);
      }
    });

    window.addEventListener('site-settings-changed', handleChange);
    return () => window.removeEventListener('site-settings-changed', handleChange);
  }, []);

  return settings;
}

// Auto-trigger cloud fetch on startup
if (typeof window !== 'undefined') {
  void fetchSiteSettingsFromCloud();
}
