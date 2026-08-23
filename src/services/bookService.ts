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

export type DigitalAccessType =
  | 'none'
  | 'direct_download'
  | 'online_reading'
  | 'external_publisher'
  | 'paid_digital';

export type CopyrightStatus =
  | 'own_upload'
  | 'publisher_permission'
  | 'public_external'
  | 'preview_only';

export type CoverImageSource =
  | 'generated_from_preview'
  | 'manual_upload'
  | 'external_url'
  | 'fallback';

export interface BookDigitalAccess {
  publicationType: PublicationType;
  accessType: AccessType;
  digitalAccessType?: DigitalAccessType;
  digitalUrl?: string;
  digitalFileUrl?: string;
  buttonLabel?: string;
  digitalLinkLabel?: string;
  previewUrl?: string;
  digitalPreviewUrl?: string;
  accessNote?: string;
  copyrightStatus?: CopyrightStatus;
  publisherUrl?: string;
  requiresLogin?: boolean;
  fileName?: string;
  fileSize?: string;
  fileSizeMb?: number;
  downloadEnabled?: boolean;

  // Generated Cover Fields
  generatedCoverImageUrl?: string;
  coverImageSource?: CoverImageSource;
  generatedCoverAt?: string;
  generatedCoverError?: string;
  generatedCoverSourceUrl?: string;
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

  // Cover image fields & sources
  coverImage: string;
  coverImageUrl?: string;
  coverImageUpload?: string;
  coverImageAlt?: string;
  coverImageFallback?: string;

  // Generated Cover fields
  generatedCoverImageUrl?: string;
  coverImageSource?: CoverImageSource;
  generatedCoverAt?: string;
  generatedCoverError?: string;
  generatedCoverSourceUrl?: string;

  // Legacy & digital fields
  downloadUrl: string;
  format: string;
  fileSizeMb?: number;
  description: string;
  tableOfContents: string[];
  sampleExcerpt: string;
  rating: number;
  reviewsCount: number;

  // Extended Digital Access
  digitalAccessType?: DigitalAccessType;
  digitalFileUrl?: string;
  digitalPreviewUrl?: string;
  digitalLinkLabel?: string;
  requiresLogin?: boolean;
  fileName?: string;
  fileSize?: string;
  downloadEnabled?: boolean;

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
  // TONDACH BOOK: Tondach Tetőfedő Kisokos 2025
  {
    id: 'book-tondach-2025',
    title: 'Tondach Tetőfedő Kisokos 2025',
    subtitle: 'Kerámia cserépfedések kivitelezési szabályai, szellőzés és alátéthéjazat méretezése',
    author: 'Wienerberger / Tondach Mérnöki Tanácsadó Szolgálat',
    publisher: 'Wienerberger Zrt. / Tondach Magyarország',
    year: 2025,
    pages: 185,
    isbn: '978-963-89-1025-4',
    category: 'technologia',
    categoryLabel: 'Technológia és kivitelezés',
    difficulty: 'haladó',
    badge: 'Tetőfedő Segédlet',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    coverImage: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?q=80&w=800&auto=format&fit=crop',
    coverImageUrl: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?q=80&w=800&auto=format&fit=crop',
    coverImageAlt: 'Tondach Tetőfedő Kisokos 2025 borítója',
    coverImageSource: 'external_url',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 12.4,
    fileSize: '12.4 MB',
    fileName: 'Tondach_Tetofedo_Kisokos_2025.pdf',
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    digitalPreviewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
    description:
      'Gyakorlati útmutató magastetők szakszerű kerámia cserépfedéséhez, szellőzési keresztmetszetek számításához, eresz- és gerinckialakításokhoz, valamint az eltolható lécfejtetés szabályaihoz.',
    tableOfContents: [
      '1. Fejezet: Kerámiacserepek típusai, fagyállóság és garanciális feltételek',
      '2. Fejezet: Tetőlécezés és eltolható lécfejtetés kiszámítása',
      '3. Fejezet: Páraáteresztő alátétfóliák (FOL-N, FOL-S) beépítése',
      '4. Fejezet: Kiszellőzés kiszámítása: Ereszcsatorna belépő és gerinc kilépő nyílások',
      '5. Fejezet: Hófogás és rögzítési viharkapcsok méretezése',
    ],
    sampleExcerpt:
      'A kiszellőztetett légrés minimális légrés-vastagsága az ereszvonalnál legalább a tetőfelület 2‰-e, de minimum 200 cm²/fm kell legyen.',
    rating: 4.9,
    reviewsCount: 168,
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalAccessType: 'direct_download',
      digitalUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      digitalFileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      buttonLabel: 'PDF Letöltése',
      digitalLinkLabel: 'PDF Letöltése',
      previewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      digitalPreviewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      accessNote: 'Ingyenesen letölthető gyártói kivitelezési segédlet.',
      copyrightStatus: 'publisher_permission',
      publisherUrl: 'https://wienerberger.hu',
      downloadEnabled: true,
      coverImageSource: 'external_url',
    },
    storeOffers: [
      {
        id: 'offer-tondach-1',
        storeName: 'Wienerberger / Tondach Hivatalos Oldal',
        storeLogoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80',
        productUrl: 'https://wienerberger.hu/termékek/tondach',
        format: 'pdf',
        price: 0,
        currency: 'HUF',
        availability: 'instant_digital',
        shippingInfo: 'Azonnali ingyenes letöltés',
        offerNote: 'Hivatalos gyártói katalógus és segédlet',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-08-23',
        isActive: true,
      },
    ],
  },
  // 1. BOOK: Real working PDF & valid cover image
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
    coverImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop',
    coverImageAlt: 'Monolitikus Vasbeton Szerkezetek könyv borítója',
    coverImageSource: 'external_url',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 18.5,
    fileSize: '18.5 MB',
    fileName: 'Vasbeton_Szerkezetek_Tervezese.pdf',
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    digitalPreviewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
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
      digitalAccessType: 'direct_download',
      digitalUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      digitalFileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      buttonLabel: 'PDF Letöltése',
      digitalLinkLabel: 'PDF Letöltése',
      previewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      digitalPreviewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      accessNote: 'Ingyenesen letölthető mérnöki tananyag.',
      copyrightStatus: 'publisher_permission',
      publisherUrl: 'https://muszakikonyvkiado.hu',
      downloadEnabled: true,
      coverImageSource: 'external_url',
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
    ],
  },

  // 2. BOOK: Online reading & preview sample link
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
    coverImageSource: 'external_url',
    downloadUrl: '',
    format: 'E-könyv',
    fileSizeMb: 14.8,
    fileSize: '14.8 MB',
    digitalAccessType: 'online_reading',
    digitalFileUrl: 'https://mozilla.github.io/pdf.js/web/viewer.html',
    digitalPreviewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    digitalLinkLabel: 'Online olvasás',
    downloadEnabled: false,
    description:
      'Részletes műszaki útmutató a modernebb építőanyagok fizikai és kémiai tulajdonságairól. EPS, XPS és PIR szigetelőanyagok páramegkötése, bitumenes és kenhető vízszigetelések beépítési határértékei.',
    tableOfContents: [
      '1. Fejezet: Falazóelemek műszaki jellemzői és hőátbocsátási tényezői',
      '2. Fejezet: Hőszigetelő anyagok páramegkötése és tűzvédelmi osztályozása',
    ],
    sampleExcerpt:
      'A PIR keményhab szigetelések lambda értéke (0,022 W/mK) lényegesen kedvezőbb a hagyományos EPS lapokénál.',
    rating: 4.8,
    reviewsCount: 110,
    digitalAccess: {
      publicationType: 'ekonyv',
      accessType: 'free_online',
      digitalAccessType: 'online_reading',
      digitalUrl: 'https://mozilla.github.io/pdf.js/web/viewer.html',
      buttonLabel: 'Online olvasás',
      digitalLinkLabel: 'Online olvasás',
      previewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      digitalPreviewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      accessNote: 'Böngészőben ingyenesen olvasható szakkönyv.',
      copyrightStatus: 'publisher_permission',
      coverImageSource: 'external_url',
    },
    storeOffers: [],
  },

  // 3. BOOK: Printed book ONLY (No digital download)
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
    categoryLabel: 'Munkavédelem',
    difficulty: 'kezdő',
    badge: 'Nyomtatott Kiadás',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-500/30',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
    coverImageSource: 'external_url',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'A 4/2002. ÉSZM-SzCSM együttes rendelet és az új jogszabályi környezet részletes magyarázata. Állványozási átvételi jegyzőkönyvek és EVE ellenőrzések.',
    tableOfContents: [
      '1. Fejezet: Munkagödrök és ártok dúcolási szabályai',
      '2. Fejezet: Homlokzati állványok szerelési ellenőrzése',
    ],
    sampleExcerpt:
      '1,25 méternél mélyebb munkagödör esetén a függőleges földfal dúcolása jogszabályi kötelezettség.',
    rating: 4.7,
    reviewsCount: 65,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      coverImageSource: 'external_url',
    },
    storeOffers: [
      {
        id: 'offer-3-1',
        storeName: 'Munkavédelmi Szakkönyvesbolt',
        storeLogoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80',
        productUrl: 'https://munkabiztonsag.hu/konyvek/ducold-szabalyzat',
        format: 'nyomtatott',
        price: 6900,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap szállítás',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-08-23',
        isActive: true,
      },
    ],
  },

  // 4. BOOK: Broken cover image URL -> Fallback generated cover
  {
    id: 'book-4',
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
    badge: 'Generált Borító Teszt',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    coverImage: 'https://invalid-broken-domain-999.com/broken-cover.jpg',
    coverImageUrl: 'https://invalid-broken-domain-999.com/broken-cover.jpg',
    coverImageAlt: 'Szárazépítészeti Technológia borítója',
    coverImageSource: 'fallback',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 11.5,
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    digitalPreviewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
    description:
      'A professzionális gipszkartonozás és válaszfalszerelés teljes technológiai leírása. Profilvázak méretezése (CW50/75/100) és Q1-Q4 felületi minőségek.',
    tableOfContents: [
      '1. Fejezet: UW és CW acélprofil vázszerkezetek rögzítése',
      '2. Fejezet: Normál és tűzgátló lapok beépítése',
    ],
    sampleExcerpt:
      'Az UW padlóprofil alatti szivacscsík elhagyása lerontja a válaszfal léghanggátlási értékét.',
    rating: 4.9,
    reviewsCount: 88,
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalAccessType: 'direct_download',
      digitalUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      digitalFileUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      previewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      digitalPreviewUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf',
      buttonLabel: 'PDF Letöltése',
      accessNote: 'Hivatalos szakkönyv kiadás PDF-ben.',
      copyrightStatus: 'own_upload',
      downloadEnabled: true,
      coverImageSource: 'fallback',
    },
    storeOffers: [],
  },

  // 5. BOOK: Broken digital link -> Error message test
  {
    id: 'book-5',
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
    badge: 'Hibás Link Teszt',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    coverImageSource: 'external_url',
    downloadUrl: 'http://invalid-broken-link-404.example.com/file.pdf',
    format: 'PDF E-könyv',
    fileSizeMb: 21.0,
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'http://invalid-broken-link-404.example.com/file.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
    description:
      'Az Eurocode 0 (A tervezés alapjai), Eurocode 1 (Tehek) és Eurocode 2 (Vasbetonszerkezetek) gyakorlati példái.',
    tableOfContents: [
      '1. Fejezet: Teherkombinációk az MSZ EN 1990 szerint',
      '2. Fejezet: Hó- és szélterhek méretezése',
    ],
    sampleExcerpt:
      'A használhatósági határállapotok betartása elengedhetetlen a szerkezet esztétikai és tartóssági követelményeihez.',
    rating: 5.0,
    reviewsCount: 74,
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalAccessType: 'direct_download',
      digitalUrl: 'http://invalid-broken-link-404.example.com/file.pdf',
      digitalFileUrl: 'http://invalid-broken-link-404.example.com/file.pdf',
      buttonLabel: 'PDF Letöltése',
      accessNote: 'Mérnöki kézikönyv.',
      copyrightStatus: 'publisher_permission',
      downloadEnabled: true,
      coverImageSource: 'external_url',
    },
    storeOffers: [],
  },
];

const STORAGE_KEY = 'epitotudas_books_v5';
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
          coverImage: b.generatedCoverImageUrl || b.coverImageUpload || b.coverImageUrl || b.coverImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop',
          digitalAccess: b.digitalAccess || {
            publicationType: b.publicationType || 'pdf',
            accessType: b.accessType || 'free_download',
            digitalAccessType: b.digitalAccessType || 'direct_download',
            digitalUrl: b.digitalFileUrl || b.downloadUrl || '#',
            digitalFileUrl: b.digitalFileUrl || b.downloadUrl || '#',
            buttonLabel: b.digitalLinkLabel || 'PDF Letöltése',
            accessNote: 'Digitális kiadvány',
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
