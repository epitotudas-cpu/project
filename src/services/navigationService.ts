import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MenuItem {
  id: string;
  label: string;
  page: string;
  parentId: string | null;
  isActive: boolean;
  displayOrder: number;
  badge?: string;
  target?: '_self' | '_blank';
}

export const DEFAULT_NAV_ITEMS: MenuItem[] = [
  // Main Menu Items
  { id: 'nav-home', label: 'Főoldal', page: 'home', parentId: null, isActive: true, displayOrder: 1 },
  { id: 'nav-tudastar', label: 'Tudástár', page: 'tudastar', parentId: null, isActive: true, displayOrder: 2 },
  { id: 'nav-tool', label: 'Eszközök', page: 'tool', parentId: null, isActive: true, displayOrder: 3 },
  { id: 'nav-paths', label: 'Pályák', page: 'paths', parentId: null, isActive: true, displayOrder: 4 },
  { id: 'nav-about', label: 'Rólunk', page: 'about', parentId: null, isActive: true, displayOrder: 5 },

  // Tudástár Submenu
  { id: 'sub-articles', label: 'Cikkek & Útmutatók', page: 'category', parentId: 'nav-tudastar', isActive: true, displayOrder: 1 },
  { id: 'sub-glossary', label: 'Fogalomtár & Szótár', page: 'glossary', parentId: 'nav-tudastar', isActive: true, displayOrder: 2 },
  { id: 'sub-calc', label: 'Számítások & Kalkulátorok', page: 'calculations', parentId: 'nav-tudastar', isActive: true, displayOrder: 3 },
  { id: 'sub-books', label: 'Szakmai Könyvek', page: 'books', parentId: 'nav-tudastar', isActive: true, displayOrder: 4 },

  // Eszközök Submenu
  { id: 'sub-tools-cat', label: 'Gép & Szerszám Katalógus', page: 'tool', parentId: 'nav-tool', isActive: true, displayOrder: 1 },
  { id: 'sub-software', label: 'Szoftverek', page: 'software', parentId: 'nav-tool', isActive: true, displayOrder: 2 },
  { id: 'sub-selector', label: 'Eszközválasztó Modul', page: 'valaszto', parentId: 'nav-tool', isActive: true, displayOrder: 3 },

  // Pályák Submenu
  { id: 'sub-professions', label: 'Építőipari Szakmák', page: 'paths', parentId: 'nav-paths', isActive: true, displayOrder: 1 },
  { id: 'sub-paths', label: 'Tanulási Útvonalak', page: 'paths', parentId: 'nav-paths', isActive: true, displayOrder: 2 },
  { id: 'sub-courses', label: 'Képzések & Kurzusok', page: 'courses', parentId: 'nav-paths', isActive: true, displayOrder: 3 },
  { id: 'sub-careers', label: 'Karrier & Állások', page: 'careers', parentId: 'nav-paths', isActive: true, displayOrder: 4 },

  // Rólunk Submenu
  { id: 'sub-mission', label: 'Küldetésünk & Rólunk', page: 'about', parentId: 'nav-about', isActive: true, displayOrder: 1 },
  { id: 'sub-partners', label: 'Partnereink', page: 'partners', parentId: 'nav-about', isActive: true, displayOrder: 2 },
  { id: 'sub-impressum', label: 'Impresszum & Kapcsolat', page: 'impressum', parentId: 'nav-about', isActive: true, displayOrder: 3 },
];

const STORAGE_KEY = 'epitotudas_nav_items_v1';
const SUPABASE_NAV_ID = '00000000-0000-0000-0000-000000000002';

declare global {
  interface Window {
    __GLOBAL_NAV_ITEMS__?: MenuItem[];
  }
}

export function getNavItems(): MenuItem[] {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_NAV_ITEMS__) {
      return window.__GLOBAL_NAV_ITEMS__;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') window.__GLOBAL_NAV_ITEMS__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba a navigációs elemek olvasásakor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_NAV_ITEMS__ = DEFAULT_NAV_ITEMS;
  return DEFAULT_NAV_ITEMS;
}

export function saveNavItems(items: MenuItem[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_NAV_ITEMS__ = items;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('nav-structure-changed'));

    // Cloud sync to Supabase categories system row
    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_NAV_ID,
          name: '__SYSTEM_CONFIG_NAV_STRUCTURE__',
          slug: 'system-nav-structure-config',
          description: JSON.stringify(items),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase nav structure sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a navigációs elemek mentésekor:', err);
  }
}

export async function fetchNavFromCloud(): Promise<MenuItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_NAV_ID)
      .maybeSingle();

    if (!error && data?.description && data.description.startsWith('[')) {
      const parsed = JSON.parse(data.description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') {
          window.__GLOBAL_NAV_ITEMS__ = parsed;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          window.dispatchEvent(new Event('nav-structure-changed'));
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Cloud nav fetch info:', err);
  }
  return null;
}

export function useNavigationItems(): MenuItem[] {
  const [items, setItems] = useState<MenuItem[]>(() => getNavItems());

  useEffect(() => {
    function handleChange() {
      setItems(getNavItems());
    }
    handleChange();

    void fetchNavFromCloud().then((cloudItems) => {
      if (cloudItems) setItems(cloudItems);
    });

    window.addEventListener('nav-structure-changed', handleChange);
    return () => window.removeEventListener('nav-structure-changed', handleChange);
  }, []);

  return items;
}

export interface NavItemStructured {
  id: string;
  label: string;
  page: string;
  isActive: boolean;
  displayOrder: number;
  badge?: string;
  target?: '_self' | '_blank';
  subItems: {
    id: string;
    label: string;
    page: string;
    isActive: boolean;
    displayOrder: number;
    badge?: string;
    target?: '_self' | '_blank';
  }[];
}

export function getStructuredNav(allItems: MenuItem[], includeInactive = false): NavItemStructured[] {
  const filtered = includeInactive ? allItems : allItems.filter((i) => i.isActive);

  const mainItems = filtered
    .filter((i) => !i.parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return mainItems.map((main) => {
    const subItems = filtered
      .filter((i) => i.parentId === main.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      id: main.id,
      label: main.label,
      page: main.page,
      isActive: main.isActive,
      displayOrder: main.displayOrder,
      badge: main.badge,
      target: main.target,
      subItems: subItems.map((sub) => ({
        id: sub.id,
        label: sub.label,
        page: sub.page,
        isActive: sub.isActive,
        displayOrder: sub.displayOrder,
        badge: sub.badge,
        target: sub.target,
      })),
    };
  });
}
