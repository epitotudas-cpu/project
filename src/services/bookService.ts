import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface BookItem {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  year: number;
  pages: number;
  isbn: string;
  category: 'all' | 'szerkezet' | 'gepeszet' | 'munkavedelem' | 'statika' | 'befejezo';
  categoryLabel: string;
  badge: string;
  badgeColor: string;
  coverImage: string;
  downloadUrl: string;
  format: string;
  fileSizeMb?: number;
  description: string;
  tableOfContents: string[];
  sampleExcerpt: string;
  rating: number;
  reviewsCount: number;
}

export const DEFAULT_BOOKS: BookItem[] = [
  {
    id: 'book-1',
    title: 'Monolitikus Vasbeton Szerkezetek Tervezése és Kivitelezése',
    subtitle: 'Átfogó mérnöki útmutató a zsalurendszerektől a betonozásig és utókezelésig',
    author: 'Prof. Dr. Balázs György',
    publisher: 'Műszaki Könyvkiadó',
    year: 2026,
    pages: 420,
    isbn: '978-963-16-4521-0',
    category: 'szerkezet',
    categoryLabel: 'Szerkezetépítés & Alapozás',
    badge: 'Kiemelt Szakkönyv',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 18.5,
    description:
      'A monolitikus vasbeton építészet alapműve, amely bemutatja a korszerű zsaluzási technológiákat, a betonacél vasalási tervek értelmezését, az Öntömörödő Beton (SCC) viselkedését, valamint a kötési szakasz párásítási és utókezelési szabályait az MSZ EN 206 szabványnak megfelelően.',
    tableOfContents: [
      '1. Fejezet: Zsalurendszerek és dúcolási teherbírási számítások',
      '2. Fejezet: Betonacél szerelés, toldások és lehorgonyzási hosszak',
      '3. Fejezet: Frissbeton feldolgozása, tömörítés és Öntömörödő Beton (SCC)',
      '4. Fejezet: Beton utókezelés, párazárás és fagy elleni védelem',
      '5. Fejezet: Szerkezeti hibák diagnosztikája és utólagos megerősítések',
    ],
    sampleExcerpt:
      'A vasbeton szerkezetek tartósságát alapvetően meghatározza a megfelelő betontakarás és a frissbeton utókezelésének minősége. A korai kiszáradás megelőzésére a betonozást követő első 7 napban folyamatos párásítás vagy felületi párazáró filmréteg felvitele kötelező.',
    rating: 4.9,
    reviewsCount: 142,
  },
  {
    id: 'book-2',
    title: 'Korszerű Épületgépészeti Rendszerek & KNE Energetika',
    subtitle: 'Hőszivattyúk, felületfűtések és a 7/2006. TNM energetikai rendelet gyakorlata',
    author: 'Szabó István okleveles gépészmérnök',
    publisher: 'Építésügyi Tudományos Kiadó',
    year: 2025,
    pages: 310,
    isbn: '978-963-16-8901-2',
    category: 'gepeszet',
    categoryLabel: 'Épületgépészet & Villanyszerelés',
    badge: 'KNE Energetika 2026',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'PDF E-könyv',
    fileSizeMb: 12.2,
    description:
      'Gyakorlati kézikönyv gépész tervezőknek és kivitelezőknek. Témák: levegő-víz hőszivattyús méretezések, padló- és mennyezetfűtési körök beszabályozása, gépi hővisszanyerős szellőztetés és a megújuló részarány kötelező követelményei.',
    tableOfContents: [
      '1. Fejezet: Hőszivattyús méretezési hidraulika',
      '2. Fejezet: Felületfűtések osztó-gyűjtő beszabályozása',
      '3. Fejezet: Entalpiás hővisszanyerős szellőzés',
      '4. Fejezet: Energetikai tanúsítási számítások',
    ],
    sampleExcerpt:
      'A hőszivattyús rendszerek hatásfoka (COP) nagyban függ a választott hőlépcsőtől. Alacsony hőmérsékletű felületfűtésekkel (35/30°C) érhető el a legmagasabb szezonszintű jósági tényező (SCOP).',
    rating: 4.8,
    reviewsCount: 98,
  },
  {
    id: 'book-3',
    title: 'Építőipari Munkavédelem & Dúcolási Szabályzat',
    subtitle: 'Munkaterületi biztonság, magasban végzett munka és mélyépítési védelmek',
    author: 'Kovács Ferenc munkavédelmi szakmérnök',
    publisher: 'Munkabiztonsági Intézet',
    year: 2026,
    pages: 240,
    isbn: '978-963-16-9932-1',
    category: 'munkavedelem',
    categoryLabel: 'Munkavédelem & Szabályzatok',
    badge: 'Kötelező Előírások',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-500/30',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'PDF E-könyv',
    fileSizeMb: 9.4,
    description:
      'A 4/2002. ÉSZM-SzCSM együttes rendelet és az új jogszabályi környezet részletes magyarázata. Állványozási átvételi jegyzőkönyvek, egyéni védőeszközök (EVE) ellenőrzése és mélyépítési munkagödrök dúcbiztonsága.',
    tableOfContents: [
      '1. Fejezet: Munkagödrök és munkagördrök dúcolási szabályai',
      '2. Fejezet: Homlokzati és gurulóállványok szerelési ellenőrzése',
      '3. Fejezet: Lezuhanás elleni védőrendszerek és kikötési pontok',
      '4. Fejezet: Építési területek villamos biztonságtechnikája',
    ],
    sampleExcerpt:
      '1,25 méternél mélyebb munkagödör vagy árok esetén a függőleges földfal dúcolása vagy a biztonságos rézsűhordás kialakítása jogszabályi kötelezettség.',
    rating: 4.7,
    reviewsCount: 65,
  },
];

const STORAGE_KEY = 'epitotudas_books_data_v1';
const SUPABASE_BOOKS_ID = '00000000-0000-0000-0000-000000000003';

declare global {
  interface Window {
    __GLOBAL_BOOKS_DATA__?: BookItem[];
  }
}

export function getBooks(): BookItem[] {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_BOOKS_DATA__) {
      return window.__GLOBAL_BOOKS_DATA__;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') window.__GLOBAL_BOOKS_DATA__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba a könyvek olvasásakor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_BOOKS_DATA__ = DEFAULT_BOOKS;
  return DEFAULT_BOOKS;
}

export function saveBooks(books: BookItem[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_BOOKS_DATA__ = books;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    window.dispatchEvent(new Event('books-data-changed'));

    // Cloud sync to Supabase categories system row
    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_BOOKS_ID,
          name: '__SYSTEM_CONFIG_BOOKS__',
          slug: 'system-books-config',
          description: JSON.stringify(books),
          article_count: books.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase books cloud sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a könyvek mentésekor:', err);
  }
}

export async function fetchBooksFromCloud(): Promise<BookItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_BOOKS_ID)
      .maybeSingle();

    if (!error && data?.description && data.description.startsWith('[')) {
      const parsed = JSON.parse(data.description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') {
          window.__GLOBAL_BOOKS_DATA__ = parsed;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          window.dispatchEvent(new Event('books-data-changed'));
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Cloud books fetch info:', err);
  }
  return null;
}

export function useBooks(): BookItem[] {
  const [books, setBooks] = useState<BookItem[]>(() => getBooks());

  useEffect(() => {
    function handleChange() {
      setBooks(getBooks());
    }
    handleChange();

    void fetchBooksFromCloud().then((cloudBooks) => {
      if (cloudBooks) setBooks(cloudBooks);
    });

    window.addEventListener('books-data-changed', handleChange);
    return () => window.removeEventListener('books-data-changed', handleChange);
  }, []);

  return books;
}
