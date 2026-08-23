import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type PublicationType =
  | 'nyomtatott'
  | 'pdf'
  | 'ekonyv'
  | 'prospektus'
  | 'katalogus'
  | 'tananyag'
  | 'szabvany'
  | 'egyeb';

export type AccessType =
  | 'none'
  | 'free_download'
  | 'free_online'
  | 'requires_login'
  | 'paid_digital'
  | 'external_link';

export type CopyrightStatus =
  | 'own_upload'
  | 'publisher_permission'
  | 'public_external'
  | 'preview_only';

export interface BookDigitalAccess {
  publicationType: PublicationType;
  accessType: AccessType;
  digitalUrl?: string;
  buttonLabel?: string;
  previewUrl?: string;
  accessNote?: string;
  copyrightStatus?: CopyrightStatus;
  publisherUrl?: string;
}

export type OfferFormat =
  | 'nyomtatott'
  | 'pdf'
  | 'epub'
  | 'kindle'
  | 'audiobook'
  | 'egyeb';

export type OfferAvailability =
  | 'in_stock'
  | 'preorder'
  | 'limited_stock'
  | 'out_of_stock'
  | 'instant_digital';

export interface BookStoreOffer {
  id: string;
  storeName: string;
  storeLogoUrl?: string;
  productUrl: string;
  format: OfferFormat;
  price: number;
  currency: string;
  availability: OfferAvailability;
  shippingInfo?: string;
  offerNote?: string;
  isPartnerOffer: boolean;
  isFeaturedOffer: boolean;
  checkedAt?: string;
  isActive: boolean;
}

export interface BookItem {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  year: number;
  pages: number;
  isbn: string;
  category: string;
  categoryLabel: string;
  difficulty?: 'kezdő' | 'haladó' | 'mester' | 'szakértő';
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

  // Digital & Purchasing management
  digitalAccess?: BookDigitalAccess;
  storeOffers?: BookStoreOffer[];
}

export interface BookCategory {
  id: string;
  label: string;
}

export const DEFAULT_BOOK_CATEGORIES: BookCategory[] = [
  { id: 'all', label: 'Összes könyv' },
  { id: 'szerkezet', label: 'Szerkezetépítés' },
  { id: 'epitoanyagok', label: 'Építőanyagok' },
  { id: 'gepeszet', label: 'Épületgépészet' },
  { id: 'munkavedelem', label: 'Munkavédelem' },
  { id: 'technologia', label: 'Technológia és kivitelezés' },
  { id: 'szabvanyok', label: 'Szabványok és előírások' },
  { id: 'szakmaalapok', label: 'Szakmaalapok' },
  { id: 'vizsga', label: 'Vizsgafelkészítők' },
];

export const BOOK_CATEGORIES = DEFAULT_BOOK_CATEGORIES;

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
    categoryLabel: 'Szerkezetépítés',
    difficulty: 'szakértő',
    badge: 'Kiemelt Szakkönyv',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop',
    downloadUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3',
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
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalUrl: 'https://muszakikonyvkiado.hu/vasbeton-tervezes-szakkonyv.pdf',
      buttonLabel: 'PDF Letöltése',
      previewUrl: 'https://muszakikonyvkiado.hu/minta-vasbeton.pdf',
      accessNote: 'Ingyenesen letölthető a kiadó hivatalos oldaláról.',
      copyrightStatus: 'publisher_permission',
      publisherUrl: 'https://muszakikonyvkiado.hu',
    },
    storeOffers: [
      {
        id: 'offer-1-1',
        storeName: 'Műszaki Könyvkiadó Hivatalos Bolt',
        storeLogoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80',
        productUrl: 'https://muszakikonyvkiado.hu/konyvek/vasbeton-tervezes',
        format: 'nyomtatott',
        price: 8900,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap • Ingyenes szállítás 15.000 Ft felett',
        offerNote: 'Eredeti nyomdai keménytáblás kiadás',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-08-23',
        isActive: true,
      },
      {
        id: 'offer-1-2',
        storeName: 'Libri Könyváruház',
        storeLogoUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100&auto=format&fit=crop&q=80',
        productUrl: 'https://www.libri.hu/konyv/monolitikus-vasbeton-szerkezetek.html',
        format: 'nyomtatott',
        price: 9490,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: 'Futárszállítás 990 Ft',
        isPartnerOffer: false,
        isFeaturedOffer: false,
        checkedAt: '2026-08-23',
        isActive: true,
      },
      {
        id: 'offer-1-3',
        storeName: 'Bookline Digitális Könyvesbolt',
        storeLogoUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100&auto=format&fit=crop&q=80',
        productUrl: 'https://bookline.hu/product/home.action?id=89123',
        format: 'pdf',
        price: 5490,
        currency: 'HUF',
        availability: 'instant_digital',
        shippingInfo: 'Azonnali letöltés e-mailben',
        offerNote: 'Vízjellel ellátott PDF változat',
        isPartnerOffer: true,
        isFeaturedOffer: false,
        checkedAt: '2026-08-23',
        isActive: true,
      },
    ],
  },
  {
    id: 'book-2',
    title: 'Korszerű Építőanyagok és Anyagismereti Kézikönyv',
    subtitle: 'Hő-, víz- és akusztikai szigetelések, falazóelemek és kötőanyagok tulajdonságai',
    author: 'Dr. Katona László okleveles építőmérnök',
    publisher: 'Építésügyi Tudományos Kiadó',
    year: 2025,
    pages: 355,
    isbn: '978-963-16-7720-4',
    category: 'epitoanyagok',
    categoryLabel: 'Építőanyagok',
    difficulty: 'haladó',
    badge: 'Új Kiadás',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    coverImage: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'PDF E-könyv',
    fileSizeMb: 14.8,
    description:
      'Részletes műszaki útmutató a modernebb építőanyagok fizikai és kémiai tulajdonságairól. EPS, XPS és PIR szigetelőanyagok páramegkötése, bitumenes és kenhető vízszigetelések beépítési határértékei, valamint a pórusbeton (Ytong) és csiszolt kerámia falazóelemek összehasonlítása.',
    tableOfContents: [
      '1. Fejezet: Falazóelemek műszaki jellemzői és hőátbocsátási tényezői (U-értékek)',
      '2. Fejezet: Hőszigetelő anyagok páramegkötése és tűzvédelmi osztályozása',
      '3. Fejezet: Vízszigetelő lemezek és kenhető szigetelőrendszerek',
      '4. Fejezet: Szárazvakolatok és hézagoló glettek kémiai összetétele',
    ],
    sampleExcerpt:
      'A PIR keményhab szigetelések lambda értéke (0,022 W/mK) lényegesen kedvezőbb a hagyományos EPS lapokénál, így lényegesen vékonyabb rétegvastagsággal teljesíthető a 7/2006. TNM rendelet követelményértéke.',
    rating: 4.8,
    reviewsCount: 110,
    digitalAccess: {
      publicationType: 'ekonyv',
      accessType: 'paid_digital',
      digitalUrl: 'https://epitesugyikiado.hu/ekonyv/epitoanyagok-2025',
      buttonLabel: 'E-könyv Megvásárlása',
      previewUrl: 'https://epitesugyikiado.hu/minta/epitoanyagok-2025.pdf',
      accessNote: 'Kiadói felületen vásárolható meg és érhető el.',
      copyrightStatus: 'own_upload',
      publisherUrl: 'https://epitesugyikiado.hu',
    },
    storeOffers: [
      {
        id: 'offer-2-1',
        storeName: 'Építésügyi Tudományos Kiadó webáruház',
        storeLogoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80',
        productUrl: 'https://epitesugyikiado.hu/konyvek/epitoanyagok-handbook',
        format: 'pdf',
        price: 6490,
        currency: 'HUF',
        availability: 'instant_digital',
        shippingInfo: 'Azonnali letöltés vásárlás után',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-08-23',
        isActive: true,
      },
    ],
  },
  {
    id: 'book-3',
    title: 'Korszerű Épületgépészeti Rendszerek & KNE Energetika',
    subtitle: 'Hőszivattyúk, felületfűtések és a 7/2006. TNM energetikai rendelet gyakorlata',
    author: 'Szabó István okleveles gépészmérnök',
    publisher: 'Műszaki Könyvkiadó',
    year: 2025,
    pages: 310,
    isbn: '978-963-16-8901-2',
    category: 'gepeszet',
    categoryLabel: 'Épületgépészet',
    difficulty: 'szakértő',
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
    digitalAccess: {
      publicationType: 'tananyag',
      accessType: 'requires_login',
      digitalUrl: 'https://epitotudas.hu/tananyagok/epuletgepeszet-kne',
      buttonLabel: 'Tananyag Megnyitása',
      accessNote: 'Ingyenesen hozzáférhető regisztrált szakmai felhasználóink számára.',
      copyrightStatus: 'own_upload',
    },
    storeOffers: [
      {
        id: 'offer-3-1',
        storeName: 'Gépész Mesterkönyvesbolt',
        storeLogoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80',
        productUrl: 'https://gepeszmester.hu/korszeru-epuletgepeszet',
        format: 'nyomtatott',
        price: 7990,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: 'Raktáron, 24 órás futárszolgálat',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-08-23',
        isActive: true,
      },
    ],
  },
  {
    id: 'book-4',
    title: 'Építőipari Munkavédelem & Dúcolási Szabályzat',
    subtitle: 'Munkaterületi biztonság, magasban végzett munka és mélyépítési védelmek',
    author: 'Kovács Ferenc munkavédelmi szakmérnök',
    publisher: 'Munkabiztonsági Intézet',
    year: 2026,
    pages: 240,
    isbn: '978-963-16-9932-1',
    category: 'munkavedelem',
    categoryLabel: 'Munkavédelem',
    difficulty: 'kezdő',
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
    digitalAccess: {
      publicationType: 'szabvany',
      accessType: 'free_download',
      digitalUrl: 'https://munkabiztonsag.gov.hu/utmutatok/ducolasi-szabalyzat-2026.pdf',
      buttonLabel: 'Szabályzat Letöltése (PDF)',
      accessNote: 'Nyilvános jogszabályi útmutató.',
      copyrightStatus: 'public_external',
      publisherUrl: 'https://munkabiztonsag.gov.hu',
    },
    storeOffers: [],
  },
];

const STORAGE_KEY = 'epitotudas_books_v3';
const CATEGORIES_STORAGE_KEY = 'epitotudas_book_categories_v2';

const SUPABASE_BOOKS_ID = '00000000-0000-0000-0000-000000000012';
const SUPABASE_BOOKS_CATEGORIES_ID = '00000000-0000-0000-0000-000000000013';

declare global {
  interface Window {
    __GLOBAL_BOOKS_DATA__?: BookItem[];
    __GLOBAL_BOOK_CATEGORIES__?: BookCategory[];
  }
}

export function getBookCategories(): BookCategory[] {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_BOOK_CATEGORIES__) {
      return window.__GLOBAL_BOOK_CATEGORIES__;
    }
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') window.__GLOBAL_BOOK_CATEGORIES__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba a könyv kategóriák olvasásakor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_BOOK_CATEGORIES__ = DEFAULT_BOOK_CATEGORIES;
  return DEFAULT_BOOK_CATEGORIES;
}

export function saveBookCategories(categories: BookCategory[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_BOOK_CATEGORIES__ = categories;
    }
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('book-categories-changed'));

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_BOOKS_CATEGORIES_ID,
          name: '__SYSTEM_CONFIG_BOOK_CATEGORIES__',
          slug: 'system-book-categories-config',
          description: JSON.stringify(categories),
          article_count: categories.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase book categories cloud sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a könyv kategóriák mentésekor:', err);
  }
}

export function useBookCategories(): BookCategory[] {
  const [categories, setCategories] = useState<BookCategory[]>(() => getBookCategories());

  useEffect(() => {
    function handleChange() {
      setCategories(getBookCategories());
    }
    handleChange();

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('description')
          .eq('id', SUPABASE_BOOKS_CATEGORIES_ID)
          .maybeSingle();

        if (!error && data?.description && data.description.startsWith('[')) {
          const parsed = JSON.parse(data.description);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (typeof window !== 'undefined') {
              window.__GLOBAL_BOOK_CATEGORIES__ = parsed;
              localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(parsed));
              window.dispatchEvent(new Event('book-categories-changed'));
            }
            setCategories(parsed);
          }
        }
      } catch {}
    })();

    window.addEventListener('book-categories-changed', handleChange);
    return () => window.removeEventListener('book-categories-changed', handleChange);
  }, []);

  return categories;
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
        const sanitized = parsed.map((b: any) => ({
          ...b,
          title: b.title || 'Szakmai Könyv',
          category: b.category || 'szerkezet',
          categoryLabel: b.categoryLabel || 'Szerkezetépítés',
          author: b.author || 'ÉpítőTudás',
          description: b.description || '',
          isbn: b.isbn || '',
          digitalAccess: b.digitalAccess || {
            publicationType: 'pdf',
            accessType: 'free_download',
            digitalUrl: b.downloadUrl || '#',
            buttonLabel: 'PDF Letöltése',
            accessNote: 'Ingyenesen letölthető kiadvány',
            copyrightStatus: 'publisher_permission',
          },
          storeOffers: Array.isArray(b.storeOffers) ? b.storeOffers : [],
        }));
        if (typeof window !== 'undefined') window.__GLOBAL_BOOKS_DATA__ = sanitized;
        return sanitized;
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
