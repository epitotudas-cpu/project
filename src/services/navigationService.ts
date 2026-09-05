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
  { id: 'nav-articles', label: 'Cikkek', page: 'category?type=hirek', parentId: null, isActive: true, displayOrder: 2 },
  { id: 'nav-tudastar', label: 'Tudástár', page: 'glossary', parentId: null, isActive: true, displayOrder: 3 },
  { id: 'nav-learning', label: 'Tanulás', page: 'learning', parentId: null, isActive: true, displayOrder: 4 },
  { id: 'nav-tool', label: 'Eszközök', page: 'tool', parentId: null, isActive: true, displayOrder: 5 },
  { id: 'nav-paths', label: 'Pályák', page: 'paths', parentId: null, isActive: true, displayOrder: 6 },

  // Cikkek Submenu
  { id: 'sub-news', label: 'Hírek', page: 'category?type=hirek', parentId: 'nav-articles', isActive: true, displayOrder: 1 },
  { id: 'sub-novelties', label: 'Újdonságok', page: 'category?type=ujdonsagok', parentId: 'nav-articles', isActive: true, displayOrder: 2 },
  { id: 'sub-guides', label: 'Útmutatók', page: 'category?type=utmutatok', parentId: 'nav-articles', isActive: true, displayOrder: 3 },

  // Tudástár Submenu
  { id: 'sub-glossary', label: 'Fogalomtár & Szótár', page: 'glossary', parentId: 'nav-tudastar', isActive: true, displayOrder: 1 },
  { id: 'sub-calc', label: 'Számítások & Kalkulátorok', page: 'calculations', parentId: 'nav-tudastar', isActive: true, displayOrder: 2 },
  { id: 'sub-books', label: 'Szakmai Könyvek', page: 'books', parentId: 'nav-tudastar', isActive: true, displayOrder: 3 },
  { id: 'sub-safety', label: 'Munkavédelem', page: 'safety', parentId: 'nav-tudastar', isActive: true, displayOrder: 4 },
  { id: 'sub-standards', label: 'Szabályok, szabványok', page: 'standards', parentId: 'nav-tudastar', isActive: true, displayOrder: 5 },

  // Tanulás Submenu
  { id: 'sub-learning-courses', label: 'Tananyagok', page: 'learning?tab=courses', parentId: 'nav-learning', isActive: true, displayOrder: 1 },
  { id: 'sub-learning-quizzes', label: 'Tesztek', page: 'learning?tab=quizzes', parentId: 'nav-learning', isActive: true, displayOrder: 2 },
  { id: 'sub-learning-flashcards', label: 'Tanulókártyák', page: 'learning?tab=flashcards', parentId: 'nav-learning', isActive: true, displayOrder: 3 },

  // Eszközök Submenu
  { id: 'sub-tools-cat', label: 'Gép & Szerszám Katalógus', page: 'tool', parentId: 'nav-tool', isActive: true, displayOrder: 1 },
  { id: 'sub-materials', label: 'Anyagok', page: 'materials', parentId: 'nav-tool', isActive: true, displayOrder: 2 },
  { id: 'sub-software', label: 'Szoftverek', page: 'software', parentId: 'nav-tool', isActive: true, displayOrder: 3 },
  { id: 'sub-selector', label: 'Eszközválasztó Modul', page: 'valaszto', parentId: 'nav-tool', isActive: true, displayOrder: 4 },

  // Pályák Submenu
  { id: 'sub-professions', label: 'Építőipari szakmák', page: 'paths', parentId: 'nav-paths', isActive: true, displayOrder: 1 },
  { id: 'sub-paths', label: 'Tanulási Útvonalak & Karrierlépcsők', page: 'learning-paths', parentId: 'nav-paths', isActive: true, displayOrder: 2 },
  { id: 'sub-courses', label: 'Képzések & Kurzusok', page: 'courses', parentId: 'nav-paths', isActive: true, displayOrder: 3 },
  { id: 'sub-careers', label: 'Karrier & Állások', page: 'careers', parentId: 'nav-paths', isActive: true, displayOrder: 4 },
];

const STORAGE_KEY = 'epitotudas_nav_items_v7';
const SUPABASE_NAV_ID = '00000000-0000-0000-0000-000000000004';

declare global {
  interface Window {
    __GLOBAL_NAV_ITEMS__?: MenuItem[];
  }
}

function normalizeNavLabels(items: MenuItem[]): MenuItem[] {
  // Purge any legacy 'Rólunk' (nav-about) & old 'sub-articles' under tudastar
  let cleanItems = items.filter(
    (item) =>
      item.id !== 'nav-about' &&
      item.parentId !== 'nav-about' &&
      item.id !== 'sub-mission' &&
      item.id !== 'sub-partners' &&
      item.id !== 'sub-impressum' &&
      item.id !== 'sub-articles' &&
      item.id !== 'sub-learning-paths'
  );

  // Ensure 'Tanulás' main menu exists
  const hasNavLearning = cleanItems.some((i) => i.id === 'nav-learning');
  if (!hasNavLearning) {
    cleanItems.push(
      { id: 'nav-learning', label: 'Tanulás', page: 'learning', parentId: null, isActive: true, displayOrder: 4 },
      { id: 'sub-learning-courses', label: 'Tananyagok', page: 'learning?tab=courses', parentId: 'nav-learning', isActive: true, displayOrder: 1 },
      { id: 'sub-learning-quizzes', label: 'Tesztek', page: 'learning?tab=quizzes', parentId: 'nav-learning', isActive: true, displayOrder: 2 },
      { id: 'sub-learning-flashcards', label: 'Tanulókártyák', page: 'learning?tab=flashcards', parentId: 'nav-learning', isActive: true, displayOrder: 3 }
    );
  }

  // Ensure 'Cikkek' main menu exists
  const hasNavArticles = cleanItems.some((i) => i.id === 'nav-articles');
  if (!hasNavArticles) {
    cleanItems.push(
      { id: 'nav-articles', label: 'Cikkek', page: 'category?type=hirek', parentId: null, isActive: true, displayOrder: 2 },
      { id: 'sub-news', label: 'Hírek', page: 'category?type=hirek', parentId: 'nav-articles', isActive: true, displayOrder: 1 },
      { id: 'sub-novelties', label: 'Újdonságok', page: 'category?type=ujdonsagok', parentId: 'nav-articles', isActive: true, displayOrder: 2 },
      { id: 'sub-guides', label: 'Útmutatók', page: 'category?type=utmutatok', parentId: 'nav-articles', isActive: true, displayOrder: 3 }
    );
  }

  // Ensure Cikkek submenus exist
  const hasSubNews = cleanItems.some((i) => i.id === 'sub-news');
  if (!hasSubNews) {
    cleanItems.push(
      { id: 'sub-news', label: 'Hírek', page: 'category?type=hirek', parentId: 'nav-articles', isActive: true, displayOrder: 1 },
      { id: 'sub-novelties', label: 'Újdonságok', page: 'category?type=ujdonsagok', parentId: 'nav-articles', isActive: true, displayOrder: 2 },
      { id: 'sub-guides', label: 'Útmutatók', page: 'category?type=utmutatok', parentId: 'nav-articles', isActive: true, displayOrder: 3 }
    );
  }

  // Ensure Tudástár safety & standards submenus exist
  if (!cleanItems.some((i) => i.id === 'sub-safety')) {
    cleanItems.push({ id: 'sub-safety', label: 'Munkavédelem', page: 'safety', parentId: 'nav-tudastar', isActive: true, displayOrder: 4 });
  }
  if (!cleanItems.some((i) => i.id === 'sub-standards')) {
    cleanItems.push({ id: 'sub-standards', label: 'Szabályok, szabványok', page: 'standards', parentId: 'nav-tudastar', isActive: true, displayOrder: 5 });
  }

  // Ensure Eszközök Anyagok submenu exists
  if (!cleanItems.some((i) => i.id === 'sub-materials')) {
    cleanItems.push({ id: 'sub-materials', label: 'Anyagok', page: 'materials', parentId: 'nav-tool', isActive: true, displayOrder: 2 });
  }

  const itemMap: Record<string, { label: string; page: string; displayOrder?: number }> = {
    'nav-articles': { label: 'Cikkek', page: 'category?type=hirek', displayOrder: 2 },
    'nav-tudastar': { label: 'Tudástár', page: 'glossary', displayOrder: 3 },
    'sub-professions': { label: 'Építőipari szakmák', page: 'paths', displayOrder: 1 },
    'sub-paths': { label: 'Tanulási Útvonalak & Karrierlépcsők', page: 'learning-paths', displayOrder: 2 },
    'sub-courses': { label: 'Képzések & Kurzusok', page: 'courses', displayOrder: 3 },
    'sub-careers': { label: 'Karrier & Állások', page: 'careers', displayOrder: 4 },
    'sub-news': { label: 'Hírek', page: 'category?type=hirek' },
    'sub-novelties': { label: 'Újdonságok', page: 'category?type=ujdonsagok' },
    'sub-guides': { label: 'Útmutatók', page: 'category?type=utmutatok' },
    'sub-safety': { label: 'Munkavédelem', page: 'safety' },
    'sub-standards': { label: 'Szabályok, szabványok', page: 'standards' },
    'sub-materials': { label: 'Anyagok', page: 'materials' },
  };

  let changed = cleanItems.length !== items.length;
  const updated = cleanItems.map((item) => {
    const target = itemMap[item.id];
    if (target) {
      const needsLabel = item.label !== target.label;
      const needsPage = item.page !== target.page;
      const needsOrder = target.displayOrder !== undefined && item.displayOrder !== target.displayOrder;
      if (needsLabel || needsPage || needsOrder) {
        changed = true;
        return {
          ...item,
          label: target.label,
          page: target.page,
          displayOrder: target.displayOrder !== undefined ? target.displayOrder : item.displayOrder,
        };
      }
    }
    return item;
  });

  if (changed) {
    try {
      if (typeof window !== 'undefined') {
        window.__GLOBAL_NAV_ITEMS__ = updated;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.warn('Hiba a navigációs elemek frissítésekor:', err);
    }
  }
  return updated;
}

export function getNavItems(): MenuItem[] {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_NAV_ITEMS__) {
      return normalizeNavLabels(window.__GLOBAL_NAV_ITEMS__);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = normalizeNavLabels(parsed);
        if (typeof window !== 'undefined') window.__GLOBAL_NAV_ITEMS__ = normalized;
        return normalized;
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
        const normalized = normalizeNavLabels(parsed);
        if (typeof window !== 'undefined') {
          window.__GLOBAL_NAV_ITEMS__ = normalized;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          window.dispatchEvent(new Event('nav-structure-changed'));
        }
        return normalized;
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

  const customSubOrder: Record<string, Record<string, number>> = {
    'nav-paths': {
      'sub-professions': 1,
      'sub-paths': 2,
      'sub-courses': 3,
      'sub-careers': 4,
    },
    'nav-learning': {
      'sub-learning-courses': 1,
      'sub-learning-quizzes': 2,
      'sub-learning-flashcards': 3,
    },
    'nav-articles': {
      'sub-news': 1,
      'sub-novelties': 2,
      'sub-guides': 3,
    },
  };

  return mainItems.map((main) => {
    const subItems = filtered
      .filter((i) => i.parentId === main.id)
      .sort((a, b) => {
        const orderConfig = customSubOrder[main.id];
        if (orderConfig) {
          const orderA = orderConfig[a.id] ?? a.displayOrder;
          const orderB = orderConfig[b.id] ?? b.displayOrder;
          return orderA - orderB;
        }
        return a.displayOrder - b.displayOrder;
      });

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
