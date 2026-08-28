import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSettings {
  // Branding & Design
  siteTitle: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  themeMode: 'dark' | 'light';

  // Admin Panel Custom Colors
  adminAccentColor?: string;
  adminBgColor?: string;
  adminCardBgColor?: string;
  adminCardHighlightColor?: string;

  // Customizable Section Texts & Content Styling
  heroMainTitle: string;
  heroSubtitle: string;
  newsletterTitle: string;
  newsletterDescription: string;
  footerDescription: string;

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

  // Webhely ikonok, gyorshívó és megosztás (Icons, PWA & Social Sharing)
  faviconIcoUrl?: string;
  faviconSvgUrl?: string;
  faviconPngUrl?: string;
  pwaIcon192Url?: string;
  pwaIcon512Url?: string;
  appleTouchIconUrl?: string;

  ogImageUrl?: string;
  ogTitle?: string;
  ogDescription?: string;

  pwaAppName?: string;
  pwaShortName?: string;
  pwaThemeColor?: string;
  pwaBackgroundColor?: string;

  iconsUpdatedAt?: number;

  // System & Security
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowRegistration: boolean;
  requireAuthForDetailedGlossary: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteTitle: 'ÉpítőTudás',
  tagline: 'Építőipari Tudásbázis & Szakmai Enciklopédia',
  logoUrl: '/logo.png',
  primaryColor: '#4165b4',
  themeMode: 'dark',

  adminAccentColor: '#3B82F6',
  adminBgColor: '#423f3e',
  adminCardBgColor: '#2b2e36',
  adminCardHighlightColor: '#EC4899',

  heroMainTitle: 'Magyarország vezető építőipari tudásbázisa',
  heroSubtitle: 'Szakmai enciklopédia, megbízható útmutatók, kalkulátorok és szerszámkatalógus szakembereknek, tanulóknak és kivitelezőknek egyaránt.',
  newsletterTitle: 'Szakmai hírlevél',
  newsletterDescription: 'Heti frissítések, új cikkek, szakmai tippek és iparági újdonságok közvetlenül az e-mail fiókodba.',
  footerDescription: 'Magyarország legátfogóbb online építőipari tudásbázisa. Szakembereknek és tanulóknak egyaránt.',

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

  faviconIcoUrl: '/favicon.ico',
  faviconSvgUrl: '',
  faviconPngUrl: '/logo.png',
  pwaIcon192Url: '/logo.png',
  pwaIcon512Url: '/logo.png',
  appleTouchIconUrl: '/logo.png',

  ogImageUrl: '/logo.png',
  ogTitle: 'ÉpítőTudás',
  ogDescription: 'Építőipari tudásbázis szakembereknek, tanulóknak és kivitelezőknek.',

  pwaAppName: 'ÉpítőTudás',
  pwaShortName: 'ÉpítőTudás',
  pwaThemeColor: '#484b6a',
  pwaBackgroundColor: '#2b2e36',

  iconsUpdatedAt: 1787313602476,

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

export function adjustColorBrightness(hex: string, percent: number): string {
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

export function getContrastTextColor(hexColor?: string): string {
  if (!hexColor) return '#FFFFFF';
  try {
    let hex = hexColor.replace('#', '').trim();
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length !== 6) return '#FFFFFF';
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#FFFFFF';
  } catch {
    return '#FFFFFF';
  }
}

function sanitizeLogoUrl(url: string | undefined): string {
  if (!url || !url.trim()) {
    return '/logo.png';
  }
  return url.trim();
}

export function generateManifestJson(settings: SiteSettings) {
  const v = settings?.iconsUpdatedAt || Date.now();
  const appendV = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    return url.includes('?') ? `${url}&v=${v}` : `${url}?v=${v}`;
  };

  const effectiveLogo = (settings?.logoUrl && settings.logoUrl !== '/logo.png') ? settings.logoUrl : '/logo.png';
  const effectivePwa192 = (settings?.pwaIcon192Url && settings.pwaIcon192Url !== '/logo.png') ? settings.pwaIcon192Url : effectiveLogo;
  const effectivePwa512 = (settings?.pwaIcon512Url && settings.pwaIcon512Url !== '/logo.png') ? settings.pwaIcon512Url : effectiveLogo;

  return {
    name: settings?.pwaAppName || settings?.siteTitle || 'ÉpítőTudás',
    short_name: settings?.pwaShortName || 'ÉpítőTudás',
    start_url: '/',
    display: 'standalone',
    background_color: settings?.pwaBackgroundColor || '#ffffff',
    theme_color: settings?.pwaThemeColor || '#f59e0b',
    icons: [
      {
        src: appendV(effectivePwa192),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: appendV(effectivePwa512),
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

export function applySiteSettings(settings: SiteSettings): void {
  try {
    if (typeof document === 'undefined') return;

    const accentColor = settings?.primaryColor || '#FFC400';
    document.documentElement.style.setProperty('--color-accent', accentColor);
    document.documentElement.style.setProperty('--color-accent-hover', adjustColorBrightness(accentColor, -15));
    document.documentElement.style.setProperty('--color-accent-light', adjustColorBrightness(accentColor, 15));

    const adminAccent = settings?.adminAccentColor || '#FFC400';
    const adminBg = settings?.adminBgColor || '#0A0A0A';
    const adminCardBg = settings?.adminCardBgColor || '#111111';
    const adminCardHighlight = settings?.adminCardHighlightColor || '#FFC400';

    document.documentElement.style.setProperty('--color-admin-accent', adminAccent);
    document.documentElement.style.setProperty('--color-admin-accent-hover', adjustColorBrightness(adminAccent, -15));
    document.documentElement.style.setProperty('--color-admin-accent-light', adjustColorBrightness(adminAccent, 15));
    document.documentElement.style.setProperty('--color-admin-bg', adminBg);
    document.documentElement.style.setProperty('--color-admin-card', adjustColorBrightness(adminBg, 4));
    document.documentElement.style.setProperty('--color-admin-sidebar', adjustColorBrightness(adminBg, 2));
    document.documentElement.style.setProperty('--color-admin-border', adjustColorBrightness(adminBg, 12));

    document.documentElement.style.setProperty('--color-admin-card-bg', adminCardBg);
    document.documentElement.style.setProperty('--color-admin-card-border', adjustColorBrightness(adminCardBg, 12));
    document.documentElement.style.setProperty('--color-admin-card-highlight', adminCardHighlight);
    document.documentElement.style.setProperty('--color-admin-card-highlight-bg', `${adminCardHighlight}1C`);

    if (settings?.siteTitle) {
      document.title = `${settings.siteTitle} - ${settings.tagline || 'Építőipari Tudásbázis & Szakmai Enciklopédia'}`;
    }

    // Dynamic Versioning Parameter for Cache-Busting
    const v = settings?.iconsUpdatedAt || Date.now();
    const withVersion = (url: string | undefined, defaultFallback: string) => {
      const target = (url && url.trim()) ? url.trim() : defaultFallback;
      if (!target) return '';
      if (target.startsWith('data:')) return target;
      return target.includes('?') ? `${target}&v=${v}` : `${target}?v=${v}`;
    };

    // Helper: update or inject <link> tags with DOM replacement for instant browser favicon refresh
    const setLink = (id: string, rel: string, href: string, type?: string, sizes?: string) => {
      if (!href) return;
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }
      const link = document.createElement('link');
      link.id = id;
      link.rel = rel;
      link.href = href;
      if (type) link.type = type;
      if (sizes) link.setAttribute('sizes', sizes);
      document.head.appendChild(link);
    };

    // Helper: update or inject <meta> tags in <head>
    const setMeta = (attr: { property?: string; name?: string }, content: string) => {
      const key = attr.property ? 'property' : 'name';
      const val = attr.property || attr.name;
      let meta = document.querySelector(`meta[${key}="${val}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(key, val!);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Compute effective icon URLs (prioritize custom icon, fallback to custom logo, fallback to default)
    const effectiveLogo = (settings?.logoUrl && settings.logoUrl !== '/logo.png') ? settings.logoUrl : '/site-tile.png';
    const effectiveIco = (settings?.faviconIcoUrl && settings.faviconIcoUrl !== '/favicon.ico') ? settings.faviconIcoUrl : '/favicon.ico';
    const effectivePng = (settings?.faviconPngUrl && settings.faviconPngUrl !== '/logo.png') ? settings.faviconPngUrl : '/favicon-32x32.png';
    const effectiveApple = (settings?.appleTouchIconUrl && settings.appleTouchIconUrl !== '/logo.png') ? settings.appleTouchIconUrl : '/apple-touch-icon.png';
    const effectivePwa192 = (settings?.pwaIcon192Url && settings.pwaIcon192Url !== '/logo.png') ? settings.pwaIcon192Url : '/android-chrome-192x192.png';
    const effectivePwa512 = (settings?.pwaIcon512Url && settings.pwaIcon512Url !== '/logo.png') ? settings.pwaIcon512Url : '/android-chrome-512x512.png';

    // 1. Browser, Opera Speed Dial, Firefox Top Sites & Shortcut Favicons
    setLink('app-favicon-ico', 'icon', withVersion(effectiveIco, '/favicon.ico'), 'image/x-icon', 'any');
    if (settings?.faviconSvgUrl) {
      setLink('app-favicon-svg', 'icon', withVersion(settings.faviconSvgUrl, ''), 'image/svg+xml');
    }
    setLink('app-favicon-png', 'icon', withVersion(effectivePng, '/favicon-32x32.png'), 'image/png', '32x32');
    setLink('app-favicon-shortcut', 'shortcut icon', withVersion(effectivePng, '/favicon-32x32.png'));
    setLink('app-image-src', 'image_src', withVersion(effectiveLogo, '/site-tile.png'));
    setLink('app-pwa-192', 'icon', withVersion(effectivePwa192, '/android-chrome-192x192.png'), 'image/png', '192x192');
    setLink('app-pwa-512', 'icon', withVersion(effectivePwa512, '/android-chrome-512x512.png'), 'image/png', '512x512');
    setLink('app-apple-touch-icon', 'apple-touch-icon', withVersion(effectiveApple, '/apple-touch-icon.png'), undefined, '180x180');
    setLink('app-apple-touch-precomposed', 'apple-touch-icon-precomposed', withVersion(effectiveApple, '/apple-touch-icon-precomposed.png'));

    // 2. Web App Manifest
    setLink('app-webmanifest-link', 'manifest', `/site.webmanifest?v=${v}`);
    if (typeof window !== 'undefined') {
      (window as any).__EPITOTUDAS_MANIFEST__ = generateManifestJson(settings);
    }

    // 3. PWA Theme Color
    setMeta({ name: 'theme-color' }, settings?.pwaThemeColor || '#4165b4');

    // 4. Open Graph, Twitter & Speed Dial Meta Tags
    const canonicalUrl = typeof window !== 'undefined' ? window.location.href : 'https://epitotudas.hu';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://epitotudas.hu';
    const ogTitleText = settings?.ogTitle || settings?.siteTitle || 'ÉpítőTudás';
    const ogDescText = settings?.ogDescription || settings?.tagline || 'Építőipari tudásbázis szakembereknek, tanulóknak és kivitelezőknek.';
    const ogImgUrl = withVersion(settings?.ogImageUrl || effectiveLogo, '/logo.png');
    const absoluteOgImage = (ogImgUrl.startsWith('http') || ogImgUrl.startsWith('data:')) ? ogImgUrl : `${origin}${ogImgUrl.startsWith('/') ? '' : '/'}${ogImgUrl}`;

    setMeta({ property: 'og:title' }, ogTitleText);
    setMeta({ property: 'og:description' }, ogDescText);
    setMeta({ property: 'og:image' }, absoluteOgImage);
    setMeta({ property: 'og:image:secure_url' }, absoluteOgImage);
    setMeta({ property: 'og:url' }, canonicalUrl);
    setMeta({ property: 'og:type' }, 'website');

    setMeta({ name: 'twitter:title' }, ogTitleText);
    setMeta({ name: 'twitter:description' }, ogDescText);
    setMeta({ name: 'twitter:image' }, absoluteOgImage);
    setMeta({ name: 'thumbnail' }, absoluteOgImage);
    setMeta({ name: 'msapplication-TileImage' }, absoluteOgImage);
    setMeta({ name: 'msapplication-TileColor' }, settings?.pwaThemeColor || '#4165b4');
  } catch (err) {
    console.error('Hiba a beállítások érvényesítésekor:', err);
  }
}

export function getDynamicImageUrl(url?: string, defaultFallback = '/logo.png', versionTimestamp?: number): string {
  const target = (url && url.trim()) ? url.trim() : defaultFallback;
  if (!target) return defaultFallback;
  if (target.startsWith('data:')) return target;

  const v = versionTimestamp || (typeof window !== 'undefined' && window.__GLOBAL_SITE_SETTINGS__?.iconsUpdatedAt) || Date.now();
  return target.includes('?') ? `${target}&v=${v}` : `${target}?v=${v}`;
}

export function getSiteSettings(): SiteSettings {
  try {
    // 1. Check in-memory global window cache first
    if (typeof window !== 'undefined' && window.__GLOBAL_SITE_SETTINGS__) {
      window.__GLOBAL_SITE_SETTINGS__.logoUrl = sanitizeLogoUrl(window.__GLOBAL_SITE_SETTINGS__.logoUrl);
      applySiteSettings(window.__GLOBAL_SITE_SETTINGS__);
      return window.__GLOBAL_SITE_SETTINGS__;
    }

    // 2. Check initial settings loaded synchronously in <head>
    if (typeof window !== 'undefined' && (window as any).__INITIAL_SITE_SETTINGS__) {
      const init = (window as any).__INITIAL_SITE_SETTINGS__;
      const settings: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...init,
        logoUrl: sanitizeLogoUrl(init.logoUrl),
        enabledNavItems: {
          ...DEFAULT_SITE_SETTINGS.enabledNavItems,
          ...(init.enabledNavItems || {}),
        },
      };
      window.__GLOBAL_SITE_SETTINGS__ = settings;
      applySiteSettings(settings);
      return settings;
    }

    // 3. Check primary, backup & session storage
    const raw = (typeof window !== 'undefined')
      ? (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY))
      : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      const settings: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
        logoUrl: sanitizeLogoUrl(parsed.logoUrl),
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

  // 4. Fallback
  if (typeof window !== 'undefined') {
    window.__GLOBAL_SITE_SETTINGS__ = DEFAULT_SITE_SETTINGS;
  }
  applySiteSettings(DEFAULT_SITE_SETTINGS);
  return DEFAULT_SITE_SETTINGS;
}

import { logAuditAction } from './auditLogService';

export function saveSiteSettings(settings: SiteSettings): void {
  try {
    const updatedSettings: SiteSettings = {
      ...settings,
      iconsUpdatedAt: Date.now(),
    };
    if (typeof window !== 'undefined') {
      window.__GLOBAL_SITE_SETTINGS__ = updatedSettings;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(updatedSettings));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      } catch (e) {
        console.warn('Storage write info:', e);
      }
    }
    applySiteSettings(updatedSettings);
    window.dispatchEvent(new Event('site-settings-changed'));

    // Log to Audit System
    void logAuditAction(
      'SETTINGS_UPDATE',
      'settings',
      `Weboldal beállítások frissítve (Cím: "${updatedSettings.siteTitle || 'ÉpítőTudás'}")`
    );

    // Cloud sync to Supabase table 'categories'
    void (async () => {
      const payloadString = JSON.stringify(updatedSettings);
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ID,
          name: '__SYSTEM_CONFIG_SITE_SETTINGS__',
          slug: 'system-site-settings-config',
          description: payloadString,
          banner_url: updatedSettings.logoUrl || '/logo.png',
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

let inFlightFetchPromise: Promise<SiteSettings | null> | null = null;
let lastCloudFetchTime = 0;
let cachedCloudSettings: SiteSettings | null = null;
const CLOUD_CACHE_TTL_MS = 300000; // 5 minutes cache

export async function fetchSiteSettingsFromCloud(): Promise<SiteSettings | null> {
  const now = Date.now();
  if (cachedCloudSettings && now - lastCloudFetchTime < CLOUD_CACHE_TTL_MS) {
    return cachedCloudSettings;
  }

  if (inFlightFetchPromise) {
    return inFlightFetchPromise;
  }

  inFlightFetchPromise = (async () => {
    try {
      // 1.5 second timeout to prevent blocking UI if network or CORS is slow
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));

      const fetchPromise = (async () => {
        const { data: catData, error: catErr } = await supabase
          .from('categories')
          .select('description')
          .eq('id', SUPABASE_SYSTEM_ID)
          .maybeSingle();

        if (!catErr && catData?.description && catData.description.startsWith('{')) {
          const parsed = JSON.parse(catData.description);
          const cloudSettings: SiteSettings = {
            ...DEFAULT_SITE_SETTINGS,
            ...parsed,
            enabledNavItems: {
              ...DEFAULT_SITE_SETTINGS.enabledNavItems,
              ...(parsed.enabledNavItems || {}),
            },
          };

          const localRaw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY) : null;
          if (localRaw) {
            try {
              const localParsed = JSON.parse(localRaw);
              const localTime = localParsed.iconsUpdatedAt || 0;
              const cloudTime = cloudSettings.iconsUpdatedAt || 0;

              if (localTime > cloudTime) {
                void supabase.from('categories').upsert({
                  id: SUPABASE_SYSTEM_ID,
                  name: '__SYSTEM_CONFIG_SITE_SETTINGS__',
                  slug: 'system-site-settings-config',
                  description: JSON.stringify(localParsed),
                  banner_url: localParsed.logoUrl || '/logo.png',
                  article_count: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                } as any);
                return localParsed;
              }
            } catch {}
          }

          if (typeof window !== 'undefined') {
            window.__GLOBAL_SITE_SETTINGS__ = cloudSettings;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudSettings));
            localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(cloudSettings));
            window.dispatchEvent(new Event('site-settings-changed'));
          }
          applySiteSettings(cloudSettings);
          cachedCloudSettings = cloudSettings;
          lastCloudFetchTime = Date.now();
          return cloudSettings;
        }
        return null;
      })();

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      return result;
    } catch (err) {
      console.warn('Cloud site settings fetch info:', err);
      return null;
    } finally {
      inFlightFetchPromise = null;
    }
  })();

  return inFlightFetchPromise;
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
        const local = getSiteSettings();
        if ((cloudSettings.iconsUpdatedAt || 0) >= (local.iconsUpdatedAt || 0)) {
          setSettings(cloudSettings);
          applySiteSettings(cloudSettings);
        }
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
