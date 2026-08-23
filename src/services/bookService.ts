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
}

export const BOOK_CATEGORIES = [
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
  },
  {
    id: 'book-5',
    title: 'Szárazépítészeti Technológia és Gipszkartonozási Útmutató',
    subtitle: 'W112 válaszfalak, CD/UD álmennyezetek és tűzgátló szerkezetek építése',
    author: 'Molnár Tibor szárazépítő mester',
    publisher: 'Műszaki Kiadó',
    year: 2025,
    pages: 280,
    isbn: '978-963-16-5540-1',
    category: 'technologia',
    categoryLabel: 'Technológia és kivitelezés',
    difficulty: 'haladó',
    badge: 'Gyakorlati Útmutató',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    coverImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 11.5,
    description:
      'A professzionális gipszkartonozás és válaszfalszerelés teljes technológiai leírása. Profilvázak méretezése (CW50/75/100), akusztikai szigetelőszalagok elhelyezése, ajtónyílások L-kivágása és Q1-Q4 felületi minőségi szintek elérése.',
    tableOfContents: [
      '1. Fejezet: UW és CW acélprofil vázszerkezetek rögzítési szabályai',
      '2. Fejezet: Normál (RB), impregnált (RBI) és tűzgátló (RF) lapok beépítése',
      '3. Fejezet: Hézagolási technológiák, üvegszálas és papír hézagerősítő szalagok',
      '4. Fejezet: Áltmennyezeti függesztőelemek teherbírása és akusztikai csillapítás',
    ],
    sampleExcerpt:
      'Az UW padlóprofil és a csatlakozó betonfelület közé helyezett szivacscsík elhagyása esetén a padló rezgései akadálytalanul átterjednek a válaszfalra, lerontva a léghanggátlást.',
    rating: 4.9,
    reviewsCount: 88,
  },
  {
    id: 'book-6',
    title: 'Eurocode Szabványok és Mérnöki Előírások Gyakorlata',
    subtitle: 'MSZ EN 1990 - 1999 méretezési szabványcsalád alkalmazási kézikönyve',
    author: 'Dr. Horváth Péter egyetemi docens',
    publisher: 'Akadémiai Kiadó',
    year: 2026,
    pages: 490,
    isbn: '978-963-05-9988-2',
    category: 'szabvanyok',
    categoryLabel: 'Szabványok és előírások',
    difficulty: 'mester',
    badge: 'Mérnöki Kézikönyv',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'PDF E-könyv',
    fileSizeMb: 21.0,
    description:
      'Az Eurocode 0 (A tervezés alapjai), Eurocode 1 (Tehek), Eurocode 2 (Betonszerkezetek) és Eurocode 6 (Falazott szerkezetek) hazai nemzeti mellékleteinek gyakorlati méretezési példái és szoftveres határellenőrzései.',
    tableOfContents: [
      '1. Fejezet: Teherkombinációk és parciális tényezők az MSZ EN 1990 szerint',
      '2. Fejezet: Hó- és szélterhek méretezése magyarországi zónatérképek alapján',
      '3. Fejezet: Vasbeton gerendák és lemezek teherbírási (ULS) és használhatósági (SLS) határellenőrzése',
    ],
    sampleExcerpt:
      'A használhatósági határállapotok (SLS) vizsgálatánál a lehajlási és repedéstágassági határértékek betartása elengedhetetlen a szerkezet esztétikai és tartóssági követelményeinek teljesítéséhez.',
    rating: 5.0,
    reviewsCount: 74,
  },
  {
    id: 'book-7',
    title: 'Építőipari Szakmaalapok & Falazási Mesterfogások',
    subtitle: 'Hagyományos és korszerű falazási technológiák kezdő és haladó szakembereknek',
    author: 'Varga József mesteroktató',
    publisher: 'Építész Céh Kiadó',
    year: 2024,
    pages: 210,
    isbn: '978-963-12-3344-9',
    category: 'szakmaalapok',
    categoryLabel: 'Szakmaalapok',
    difficulty: 'kezdő',
    badge: 'Alapképzési Tananyag',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
    coverImage: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'PDF E-könyv',
    fileSizeMb: 8.7,
    description:
      'Átfogó alapozó tankönyv építőipari tanulók és pályakezdő kőművesek számára. Kitűzés, szintezés zsinórállvánnyal, habarcskeverési arányok, téglakötések szabályai (feles kötés, sarokkötések) és habarcsterítés vékonyrétegű habarcsoknál.',
    tableOfContents: [
      '1. Fejezet: Építési helyszín kitűzése és optikai szintezés',
      '2. Fejezet: Falazóhabarcsok keverése és kézi bedolgozása',
      '3. Fejezet: Téglakötési szabályok és nyílásáthidalók elhelyezése',
    ],
    sampleExcerpt:
      'A falazóelemek függőleges fugáinak eltolási távolsága (kötési hossza) legalább a tégla magasságának 0,4-szerese kell legyen, megakadályozva a függőleges repedések kialakulását.',
    rating: 4.7,
    reviewsCount: 52,
  },
  {
    id: 'book-8',
    title: 'Kőműves & Szárazépítő Mestervizsga Felkészítő Könyv',
    subtitle: 'Elméleti és gyakorlati vizsgakövetelmények, műszaki rajzok és mintatételek',
    author: 'Építési Vállalkozók Országos Szövetsége (ÉVOSZ)',
    publisher: 'ÉVOSZ Szakmai Kiadó',
    year: 2026,
    pages: 380,
    isbn: '978-963-88-2100-5',
    category: 'vizsga',
    categoryLabel: 'Vizsgafelkészítők',
    difficulty: 'mester',
    badge: 'Mestervizsga 2026',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 16.4,
    description:
      'Hivatalos felkészítő kiadvány az ÉVOSZ és a Kamara mestervizsga követelményrendszeréhez. Műszaki rajz olvasási feladatok, költségvetés-készítés és árazás, minőségellenőrzési protokollok, valamint kidolgozott szóbeli tételsorok.',
    tableOfContents: [
      '1. Fejezet: Műszaki dokumentáció és kiviteli rajzok komplex értelmezése',
      '2. Fejezet: Építőipari normagyűjtemény és költségvetés kiírás',
      '3. Fejezet: Építési hibák felderítése és szakértői véleményezés',
      '4. Fejezet: Kidolgozott mestervizsga szóbeli tételsor',
    ],
    sampleExcerpt:
      'A mestervizsga gyakorlati részében a jelöltnek nem csupán a szerkezetépítést kell hiba nélkül kiviteleznie, hanem az építési napló vezetését és az átadás-átvételi jegyzőkönyv kiállítását is be kell mutatnia.',
    rating: 4.9,
    reviewsCount: 165,
  },
];

const STORAGE_KEY = 'epitotudas_books_v2';
const SUPABASE_BOOKS_ID = '00000000-0000-0000-0000-000000000012';

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
