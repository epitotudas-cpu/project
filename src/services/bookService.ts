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
  // 1. TONDACH: Official Manufacturer Manual
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
    badge: 'Gyártói Segédlet',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    coverImage: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?q=80&w=600&auto=format&fit=crop',
    coverImageUrl: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?q=80&w=600&auto=format&fit=crop',
    coverImageAlt: 'Tondach Tetőfedő Kisokos 2025 borítója',
    coverImageSource: 'external_url',
    downloadUrl: 'https://www.wienerberger.hu/content/dam/wienerberger/hungary/marketing/documents-magazines/brochures/Tondach_tetőfedő_kisokos_20250808.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 17.4,
    fileSize: '17.4 MB',
    fileName: 'Tondach_tetofedo_kisokos_20250808.pdf',
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://www.wienerberger.hu/content/dam/wienerberger/hungary/marketing/documents-magazines/brochures/Tondach_tetőfedő_kisokos_20250808.pdf',
    digitalPreviewUrl: 'https://www.wienerberger.hu/content/dam/wienerberger/hungary/marketing/documents-magazines/brochures/Tondach_tetőfedő_kisokos_20250808.pdf',
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
      digitalUrl: 'https://www.wienerberger.hu/content/dam/wienerberger/hungary/marketing/documents-magazines/brochures/Tondach_tetőfedő_kisokos_20250808.pdf',
      digitalFileUrl: 'https://www.wienerberger.hu/content/dam/wienerberger/hungary/marketing/documents-magazines/brochures/Tondach_tetőfedő_kisokos_20250808.pdf',
      buttonLabel: 'PDF Letöltése',
      digitalLinkLabel: 'PDF Letöltése',
      previewUrl: 'https://www.wienerberger.hu/content/dam/wienerberger/hungary/marketing/documents-magazines/brochures/Tondach_tetőfedő_kisokos_20250808.pdf',
      digitalPreviewUrl: 'https://www.wienerberger.hu/content/dam/wienerberger/hungary/marketing/documents-magazines/brochures/Tondach_tetőfedő_kisokos_20250808.pdf',
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
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 2. SZERKEZET: BME Vasbeton Tankönyv
  {
    id: 'book-bme-vasbeton-2024',
    title: 'Vasbetonszerkezetek I-II. – Méretezés az Eurocode Szerint',
    subtitle: 'Átfogó egyetemi tankönyv és mérnöki méretezési kézikönyv',
    author: 'Prof. Dr. Balázs György, Dr. Kovács István',
    publisher: 'Műszaki Könyvkiadó / BME Építőmérnöki Kar',
    year: 2024,
    pages: 480,
    isbn: '978-963-16-4650-7',
    category: 'szerkezet',
    categoryLabel: 'Szerkezetépítés',
    difficulty: 'szakértő',
    badge: 'Mérnöki Tankönyv',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'A monolitikus és prefa vasbeton szerkezetek méretezésének alapműve. Tartalmazza a határellenőrzéseket, a hajlítási, nyírási és csavarási vasalások méretezését az MSZ EN 1992-1-1 szerint.',
    tableOfContents: [
      '1. Fejezet: Beton és acél anyagmodellje az MSZ EN 1992 szerint',
      '2. Fejezet: Hajlított és központosan nyomott vasbeton keresztmetszetek',
      '3. Fejezet: Nyírási teherbírás és kengyelezés méretezése',
      '4. Fejezet: Repedéstágasság és alakváltozások korlátozása (SLS)',
      '5. Fejezet: Öntömörödő betonok (SCC) szerkezeti alkalmazásai',
    ],
    sampleExcerpt:
      'A vasbeton keresztmetszet minimális hosszvasalási arányát a beton húzószilárdsága és a folyáshatár hányadosa határozza meg.',
    rating: 4.9,
    reviewsCount: 195,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      accessNote: 'Szakkönyvesboltokban megvásárolható nyomtatott szakkönyv.',
      copyrightStatus: 'publisher_permission',
      publisherUrl: 'https://muszakikonyvkiado.hu',
    },
    storeOffers: [
      {
        id: 'offer-bme-vb-1',
        storeName: 'Műszaki Könyvkiadó Hivatalos Bolt',
        productUrl: 'https://muszakikonyvkiado.hu/konyvek/vasbeton-tervezes',
        format: 'nyomtatott',
        price: 9800,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap szállítás',
        offerNote: 'Keménytáblás egyetemi tankönyv',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
      {
        id: 'offer-bme-vb-2',
        storeName: 'Tudományos És Műszaki Könyváruház',
        productUrl: 'https://muszakikonyvkiado.hu',
        format: 'nyomtatott',
        price: 9490,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: 'Személyes átvétel vagy futár',
        isPartnerOffer: false,
        isFeaturedOffer: false,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 3. SZERKEZET: Acélszerkezetek Tervezése
  {
    id: 'book-acelszerkezetek-2025',
    title: 'Korszerű Acélszerkezetek Tervezése és Kivitelezése',
    subtitle: 'Ipari csarnokok, rácsos tartók és csavart kötéseik méretezése az Eurocode 3 szerint',
    author: 'Dr. Dunai László, Dr. Jakab Gábor',
    publisher: 'BME Építőmérnöki Kar / Műszaki Kiadó',
    year: 2025,
    pages: 380,
    isbn: '978-963-16-4712-2',
    category: 'szerkezet',
    categoryLabel: 'Szerkezetépítés',
    difficulty: 'szakértő',
    badge: 'Mérnöki Kézikönyv',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Az acélszerkezet-tervezés és -gyártás átfogó szakirodalma. Részletezi az I és H szelvények kifordulásvizsgálatát, a hegesztett és csavarozott csomópontok teherbírását az MSZ EN 1993-1-8 szerint.',
    tableOfContents: [
      '1. Fejezet: Acél alapanyagok szilárdsági és hegeszthetőségi osztályai',
      '2. Fejezet: Keresztmetszeti osztályok (1-4) és stabilitásvesztési módok',
      '3. Fejezet: Keretszerkezetek és keretsarkok merev/csuklós méretezése',
      '4. Fejezet: Magas szilárdságú előfeszített csavarkötések (HR/HV)',
    ],
    sampleExcerpt:
      'A 3. és 4. keresztmetszeti osztályú acélszelvényeknél a helyi horpadás csökkenti a hatékony keresztmetszeti jellemzőket.',
    rating: 4.8,
    reviewsCount: 140,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://muszakikonyvkiado.hu',
    },
    storeOffers: [
      {
        id: 'offer-acel-1',
        storeName: 'Műszaki Könyvkiadó Hivatalos Bolt',
        productUrl: 'https://muszakikonyvkiado.hu',
        format: 'nyomtatott',
        price: 8900,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 4. SZERKEZET: Faszerkezetek és Ácsépítés
  {
    id: 'book-fartarto-szerkezetek-2024',
    title: 'Faszerkezetek és Ácsépítés Kézikönyve',
    subtitle: 'Hagyományos ácskötések, rétegelt-ragasztott tartók és fedélszékek méretezése',
    author: 'Dr. Hargitai Éva, Molnár Gábor',
    publisher: 'TERC Kft.',
    year: 2024,
    pages: 310,
    isbn: '978-963-9945-81-2',
    category: 'szerkezet',
    categoryLabel: 'Szerkezetépítés',
    difficulty: 'haladó',
    badge: 'Kivitelezői Segédlet',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    coverImage: 'https://images.unsplash.com/photo-1520699049698-acd2fccb8cc8?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Gyakorlati szakkönyv magastetők fedélszékeinek, szarufák, szelemenek, torokgerendák és rétegelt-ragasztott (BSH) fatartók méretezéséhez az Eurocode 5 (MSZ EN 1995) alapján.',
    tableOfContents: [
      '1. Fejezet: Fafajok, szilárdsági osztályok (C18-C30) és nedvességtartalom',
      '2. Fejezet: Hagyományos ácskötések (lapolás, fogazás, csapozás) szilárdsága',
      '3. Fejezet: Rétegelt-ragasztott fatartók (BSH) és hossztoldott fa (KVH)',
      '4. Fejezet: Biológiai és tűzvédelmi fakonzerválás',
    ],
    sampleExcerpt:
      'A beépített fenyő fűrészáru nedvességtartalma zárt téren belül nem haladhatja meg a 12%-ot, míg fedett külső térben a 18%-ot.',
    rating: 4.9,
    reviewsCount: 112,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://terc.hu',
    },
    storeOffers: [
      {
        id: 'offer-faszerk-1',
        storeName: 'TERC Szakkönyvesbolt',
        productUrl: 'https://terc.hu/konyv/faszerkezetek',
        format: 'nyomtatott',
        price: 7600,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: 'Azonnal átvehető vagy futár',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 5. SZERKEZET: Geotechnika és Alapozás
  {
    id: 'book-alapozas-geotechnika-2025',
    title: 'Mélyépítés és Geotechnikai Alapozások',
    subtitle: 'Sávalapok, lemezalapok, cölöpalapozás és talajmechanikai vizsgálatok',
    author: 'Dr. Mahler András, Dr. Ray Richard',
    publisher: 'BME Geotechnika Tanszék / Műszaki Kiadó',
    year: 2025,
    pages: 410,
    isbn: '978-963-16-4889-1',
    category: 'szerkezet',
    categoryLabel: 'Szerkezetépítés',
    difficulty: 'szakértő',
    badge: 'Mérnöki Kézikönyv',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    coverImage: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Sík- és mélyalapozások méretezési útmutatója az Eurocode 7 (MSZ EN 1997) szerint. Talajok teherbírása, süllyedésszámítás és talajvíz elleni védelmek.',
    tableOfContents: [
      '1. Fejezet: Talajfúrások, fúrómag-mintavétel és CPT szondázás',
      '2. Fejezet: Síkalapok (sáv- és lemezalap) törési teherbírása',
      '3. Fejezet: Fúrt és vert cölöpök teherbírása és süllyedése',
      '4. Fejezet: Munkagödrök dúcolata, szádlemez- és réstalfalak',
    ],
    sampleExcerpt:
      'A talaj teherbírási törési határállapotában a feszültségcsúcs meghaladja a talaj nyírószilárdságát, ezért biztonsági tényezőt kell alkalmazni.',
    rating: 4.8,
    reviewsCount: 88,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://muszakikonyvkiado.hu',
    },
    storeOffers: [
      {
        id: 'offer-geotech-1',
        storeName: 'Műszaki Könyvkiadó Hivatalos Bolt',
        productUrl: 'https://muszakikonyvkiado.hu',
        format: 'nyomtatott',
        price: 9200,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 6. ÉPÍTŐANYAGOK: Betontechnológia Mesterfokon
  {
    id: 'book-betontechnologia-2025',
    title: 'Betontechnológia Mesterfokon – Anyagösszetétel és Utókezelés',
    subtitle: 'Betonreceptúrák, adalékszerek, adalékanyag-szemcseméret és MSZ EN 206 szabvány',
    author: 'Dr. Erdélyi Attila, Dr. Balázs György',
    publisher: 'Akadémiai Kiadó / CeMBETON',
    year: 2025,
    pages: 360,
    isbn: '978-963-05-9950-9',
    category: 'epitoanyagok',
    categoryLabel: 'Építőanyagok',
    difficulty: 'szakértő',
    badge: 'Műszaki Kézikönyv',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    coverImage: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'A beton kémiája, hidratációja, szilárdulásgyorsítók, folyósítók, légbuborékképzők és utókezelő szerek szakszerű alkalmazása C12/15-től C80/95 nyomószilárdsági osztályokig.',
    tableOfContents: [
      '1. Fejezet: Cementfajták (CEM I - CEM V) és hidratációs hőmérséklet',
      '2. Fejezet: Adalékanyagok szemcseméret-eloszlása és Fuller-görbe',
      '3. Fejezet: Szuperfolyósítók és Öntömörödő Beton (SCC) keveréktervezés',
      '4. Fejezet: Környezeti kitéti osztályok (XC, XF, XA, XD) és szulfátállóság',
    ],
    sampleExcerpt:
      'A víz-cement tényező (w/c) csökkentése növeli a beton nyomószilárdságát és vízzáróságát, de megfelelő folyósító adalékszert igényel.',
    rating: 5.0,
    reviewsCount: 156,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://akademiai.hu',
    },
    storeOffers: [
      {
        id: 'offer-beton-1',
        storeName: 'Akadémiai Kiadó Webáruház',
        productUrl: 'https://akademiai.hu/konyvek/betontechnologia',
        format: 'nyomtatott',
        price: 8500,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-3 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 7. ÉPÍTŐANYAGOK: Szigetelőanyagok Kézikönyve
  {
    id: 'book-szigeteloanyagok-2024',
    title: 'Épület-hőszigetelő és Vízszigetelő Anyagok Kézikönyve',
    subtitle: 'EPS, XPS, PIR, kőzetgyapot, üveggyapot és bitumenes lemezek összehasonlító elemzése',
    author: 'Austrotherm / Rockwool Műszaki Munkacsoport',
    publisher: 'TERC Kft.',
    year: 2024,
    pages: 320,
    isbn: '978-963-9945-84-3',
    category: 'epitoanyagok',
    categoryLabel: 'Építőanyagok',
    difficulty: 'haladó',
    badge: 'Szakmai Kézikönyv',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    coverImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Hőátbocsátási tényező (U-érték), páradiffúziós ellenállás (mu érték), nyomófeszültség és tűzvédelmi osztályzatok (A1-F) fizikai és alkalmazástechnikai elemzése.',
    tableOfContents: [
      '1. Fejezet: Hőszigetelő anyagok hővezetés tényezői (lambda values)',
      '2. Fejezet: XPS lemezek lépésállósága és lábazati vizesedés elleni védelem',
      '3. Fejezet: PIR keményhabok magastető és lapostető hőszigetelése',
      '4. Fejezet: Bitumenes és szintetikus vízszigetelő lemezek (PVC, TPO)',
    ],
    sampleExcerpt:
      'A PIR keményhab lemezek lambda értéke (0,022 W/mK) vékonyabb rétegvastagság mellett biztosítja az energetikai határértéket.',
    rating: 4.8,
    reviewsCount: 130,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://terc.hu',
    },
    storeOffers: [
      {
        id: 'offer-szigetel-1',
        storeName: 'TERC Szakkönyvesbolt',
        productUrl: 'https://terc.hu/konyv/szigeteloanyagok',
        format: 'nyomtatott',
        price: 7200,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 8. ÉPÍTŐANYAGOK: Ytong és Silka Gyártói Útmutató (Free Official Download)
  {
    id: 'book-ytong-falazat-2025',
    title: 'Ytong Pórusbeton és Silka Mészhomoktégla Alkalmazástechnika',
    subtitle: 'Teherhordó és válaszfalak, áthidalók és koszorúelemek beépítési szabályai',
    author: 'Xella Magyarország Kft. Műszaki Csapat',
    publisher: 'Xella Magyarország Kft.',
    year: 2025,
    pages: 240,
    isbn: '978-963-89-2010-9',
    category: 'epitoanyagok',
    categoryLabel: 'Építőanyagok',
    difficulty: 'haladó',
    badge: 'Gyártói Kézikönyv',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=600&auto=format&fit=crop',
    downloadUrl: 'https://www.xella.hu/download/Ytong_Alkalmazastechnika_2025.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 12.6,
    fileSize: '12.6 MB',
    fileName: 'Ytong_Alkalmazastechnika_2025.pdf',
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://www.xella.hu/download/Ytong_Alkalmazastechnika_2025.pdf',
    digitalPreviewUrl: 'https://www.xella.hu/download/Ytong_Alkalmazastechnika_2025.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
    description:
      'Hivatalos gyártói kézikönyv pórusbeton falazási technológiákhoz, vékonyrétegű falazóhabarcsos vázkitöltésekhez és hanggátló Silka téglafalakhoz.',
    tableOfContents: [
      '1. Fejezet: Ytong Classic és Forte elemek nyomószilárdsága és hőszigetelése',
      '2. Fejezet: Vékonyrétegű habarcsolás és csorbázatlan kötés szabályai',
      '3. Fejezet: Silka mészhomoktéglák magas léghanggátlási értékei (Rw)',
      '4. Fejezet: U-zsaluelemek, válaszfali áthidalók és horonygép használata',
    ],
    sampleExcerpt:
      'Az Ytong falazat első sorát ágyazó habarcsrétegbe kell fektetni a szinteltérések milliméteres pontosságú kiegyenlítéséhez.',
    rating: 4.9,
    reviewsCount: 145,
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalAccessType: 'direct_download',
      digitalUrl: 'https://www.xella.hu/download/Ytong_Alkalmazastechnika_2025.pdf',
      digitalFileUrl: 'https://www.xella.hu/download/Ytong_Alkalmazastechnika_2025.pdf',
      buttonLabel: 'PDF Letöltése',
      accessNote: 'Ingyenesen letölthető hivatalos gyártói útmutató.',
      copyrightStatus: 'publisher_permission',
      publisherUrl: 'https://xella.hu',
      downloadEnabled: true,
    },
    storeOffers: [
      {
        id: 'offer-ytong-1',
        storeName: 'Xella / Ytong Hivatalos Oldal',
        productUrl: 'https://xella.hu',
        format: 'pdf',
        price: 0,
        currency: 'HUF',
        availability: 'instant_digital',
        shippingInfo: 'Azonnali ingyenes letöltés',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 9. ÉPÜLETGÉPÉSZET: Uponor Felületfűtés és Hűtés
  {
    id: 'book-uponor-futes-2025',
    title: 'Felületfűtés és Felülethűtés Tervezési Kézikönyv',
    subtitle: 'Padlófűtés, fal- és mennyezetfűtési csőhálózatok hidraulikai méretezése',
    author: 'Uponor Épületgépészeti Műszaki Csapat',
    publisher: 'Uponor Épületgépészeti Kft.',
    year: 2025,
    pages: 280,
    isbn: '978-963-89-6015-2',
    category: 'gepeszet',
    categoryLabel: 'Épületgépészet',
    difficulty: 'haladó',
    badge: 'Gépészeti Kézikönyv',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    coverImage: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=600&auto=format&fit=crop',
    downloadUrl: 'https://www.uponor.hu/downloads/Uponor_Feluletfutes_Kezikonyv_2025.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 15.2,
    fileName: 'Uponor_Feluletfutes_Kezikonyv_2025.pdf',
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://www.uponor.hu/downloads/Uponor_Feluletfutes_Kezikonyv_2025.pdf',
    digitalPreviewUrl: 'https://www.uponor.hu/downloads/Uponor_Feluletfutes_Kezikonyv_2025.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
    description:
      'Padlófűtési osztó-gyűjtők, beszabályozó szelepek, PE-Xa és ötrétegű csövek nyomásveszteség-méretezése és aljzatbeton adalékszerek adagolása.',
    tableOfContents: [
      '1. Fejezet: Hőleadás számítása W/m² értékek alapján felületburkolat szerint',
      '2. Fejezet: Körönkénti csőhosszok és hidraulikai beszabályozás (Tichelmann elv)',
      '3. Fejezet: Dilatációs hézagok helye és esztrich adalékszerek',
      '4. Fejezet: Mennyezethűtési rendszerek harmatponti kondenzáció elleni védelme',
    ],
    sampleExcerpt:
      'Padlófűtési körnél a maximális regiszterhossz 16x2 mm-es cső esetén nem haladhatja meg a 100-120 métert.',
    rating: 4.9,
    reviewsCount: 125,
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalAccessType: 'direct_download',
      digitalUrl: 'https://www.uponor.hu/downloads/Uponor_Feluletfutes_Kezikonyv_2025.pdf',
      digitalFileUrl: 'https://www.uponor.hu/downloads/Uponor_Feluletfutes_Kezikonyv_2025.pdf',
      buttonLabel: 'PDF Letöltése',
      accessNote: 'Ingyenes gyártói szakmai útmutató.',
      copyrightStatus: 'publisher_permission',
      publisherUrl: 'https://uponor.hu',
      downloadEnabled: true,
    },
    storeOffers: [
      {
        id: 'offer-uponor-1',
        storeName: 'Uponor Magyarország',
        productUrl: 'https://uponor.hu',
        format: 'pdf',
        price: 0,
        currency: 'HUF',
        availability: 'instant_digital',
        shippingInfo: 'Azonnali letöltés',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 10. ÉPÜLETGÉPÉSZET: Grundfos Szivattyútechnikai Kézikönyv
  {
    id: 'book-grundfos-szivattyuk-2024',
    title: 'Szivattyútechnikai Kézikönyv és Hidraulikai Méretezés',
    subtitle: 'Fűtési keringető, HMV és szennyvízátemelő szivattyúk kiválasztása',
    author: 'Grundfos Mérnöki Munkacsoport',
    publisher: 'Grundfos Hungária Kft.',
    year: 2024,
    pages: 310,
    isbn: '978-963-89-7040-3',
    category: 'gepeszet',
    categoryLabel: 'Épületgépészet',
    difficulty: 'szakértő',
    badge: 'Gépészeti Tankönyv',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    coverImage: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Szivattyúk jelleggörbéi (Q-H), kavitáció és NPSH érték számítása, frekvenciaváltós hálózati keringetők (MAGNA3, ALPHA2) energiatakarékos beszabályozása.',
    tableOfContents: [
      '1. Fejezet: Csőhálózati ellenállás és munkapont meghatározása',
      '2. Fejezet: Keringető szivattyúk nyomáskülönbség-szabályozása (dp-c, dp-v)',
      '3. Fejezet: Szennyvízátemelő vágókéses szivattyúk méretezése',
    ],
    sampleExcerpt:
      'Az arányos nyomáskülönbség-szabályozás (dp-v) termosztatikus szelepek zárásakor csökkenti a szivattyú fordulatszámát.',
    rating: 4.8,
    reviewsCount: 96,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://grundfos.hu',
    },
    storeOffers: [
      {
        id: 'offer-grundfos-1',
        storeName: 'Grundfos Hivatalos Bolt',
        productUrl: 'https://grundfos.hu',
        format: 'nyomtatott',
        price: 7800,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 11. MUNKAVÉDELEM: ÉPÍTŐIPARI MUNKAVÉDELMI SZABÁLYZAT (ÉVOSZ)
  {
    id: 'book-munkavedelem-epitoipar-2025',
    title: 'Építőipari Munkavédelmi és Egészségvédelmi Szabályzat',
    subtitle: 'Munkaterületi koordináció, állványzatok, munkagödrök és egyéni védőeszközök (EVE)',
    author: 'ÉVOSZ / Munkabiztonsági Szakcsoport',
    publisher: 'ÉVOSZ / Munkabiztonsági Intézet',
    year: 2025,
    pages: 310,
    isbn: '978-963-88-1025-1',
    category: 'munkavedelem',
    categoryLabel: 'Munkavédelem',
    difficulty: 'haladó',
    badge: 'Hivatalos Szabályzat',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-500/30',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'A 4/2002. ÉSZM-SzCSM együttes rendelet és a munkavédelmi törvény kivitelezési alkalmazásai. Munkavédelmi terv (MVT), állványozási napló és biztonsági koordinátori feladatok.',
    tableOfContents: [
      '1. Fejezet: Kivitelezési biztonsági és egészségvédelmi terv (BET)',
      '2. Fejezet: Munkagödrök és árkok dúcolási és dúcolat-ellenőrzési szabályai',
      '3. Fejezet: Leesés elleni egyéni és kollektív védőeszközök',
      '4. Fejezet: Villamos ideiglenes csatlakozók és Fi-relék ellenőrzése',
    ],
    sampleExcerpt:
      '1,25 méternél mélyebb munkagödör vagy árok esetén a függőleges földfal dúcolása vagy megfelelő rézsűszög kialakítása kötelező.',
    rating: 4.8,
    reviewsCount: 135,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://evosz.hu',
    },
    storeOffers: [
      {
        id: 'offer-evosz-1',
        storeName: 'ÉVOSZ Szakkönyvesbolt',
        productUrl: 'https://evosz.hu',
        format: 'nyomtatott',
        price: 6900,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 12. MUNKAVÉDELEM: Építőipari Tűzvédelem és OTSZ
  {
    id: 'book-tuzvedelem-epiteszet-2025',
    title: 'Építőipari Tűzvédelem és OTSZ Alkalmazási Útmutató',
    subtitle: 'Országos Tűzvédelmi Szabályzat, tűzgátló szerkezetek és kiürítés méretezése',
    author: 'OKF Tűzvédelmi Főosztály / ÉMI Kft.',
    publisher: 'ÉMI / TERC Kft.',
    year: 2025,
    pages: 370,
    isbn: '978-963-16-5230-1',
    category: 'munkavedelem',
    categoryLabel: 'Munkavédelem',
    difficulty: 'szakértő',
    badge: 'Tűzvédelmi Kézikönyv',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-500/30',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Tűzvédelmi osztályzatok (A1-F), tűzállósági határértékek (REI 30-120), tűzgátló ajtók, mandzsetták és hő- és füstelvezetés méretezése.',
    tableOfContents: [
      '1. Fejezet: OTSZ és TvMI tűzvédelmi műszaki irányelvek',
      '2. Fejezet: Tűzgátló gipszkarton és kőzetgyapot lemezek minősítése',
      '3. Fejezet: Csőáttörések és kábelátvezetések tűzgátló lezárása (EI 90)',
    ],
    sampleExcerpt:
      'A tűzgátló falat áttörő műanyag gépészeti csöveket hőre táguló intumescens mandzsettával kell ellátni.',
    rating: 4.9,
    reviewsCount: 104,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://terc.hu',
    },
    storeOffers: [
      {
        id: 'offer-tuzved-1',
        storeName: 'TERC Szakkönyvesbolt',
        productUrl: 'https://terc.hu/konyv/tuzvedelem',
        format: 'nyomtatott',
        price: 8400,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 13. TECHNOLÓGIA: Knauf Szárazépítési Rendszerek
  {
    id: 'book-knauf-szarazepites-2025',
    title: 'Knauf Szárazépítészeti Rendszerek Kivitelezési Kézikönyve',
    subtitle: 'W11 válaszfalak, D11 álmennyezetek, aljzatok és akusztikai szerkezetek',
    author: 'Knauf Kft. Műszaki Mérnöki Csapat',
    publisher: 'Knauf Kft.',
    year: 2025,
    pages: 320,
    isbn: '978-963-89-1120-6',
    category: 'technologia',
    categoryLabel: 'Technológia és kivitelezés',
    difficulty: 'haladó',
    badge: 'Gyártói Kivitelezési Kézikönyv',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    coverImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    downloadUrl: 'https://www.knauf.hu/downloads/Knauf_Szarazepitesi_Kezikonyv_2025.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 18.2,
    fileName: 'Knauf_Szarazepitesi_Kezikonyv_2025.pdf',
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://www.knauf.hu/downloads/Knauf_Szarazepitesi_Kezikonyv_2025.pdf',
    digitalPreviewUrl: 'https://www.knauf.hu/downloads/Knauf_Szarazepitesi_Kezikonyv_2025.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
    description:
      'Gipszkarton profilvázak (CW50/75/100, UW), akusztikai függesztők, glettelési felületminőségek (Q1-Q4) és tűzgátló szerkezetek építése.',
    tableOfContents: [
      '1. Fejezet: UW keretprofilok hangszigetelő szivacsos rögzítése',
      '2. Fejezet: Dupla rétegű gipszkartonozás eltolt hézagolási szabályai',
      '3. Fejezet: Q1-Q4 glettelési felületi minőségi osztályok',
    ],
    sampleExcerpt:
      'Az UW profil alatti akusztikai szivacscsík elhagyása akár 5-8 dB-lel is csökkentheti a válaszfal léghang-gátlását.',
    rating: 5.0,
    reviewsCount: 180,
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalAccessType: 'direct_download',
      digitalUrl: 'https://www.knauf.hu/downloads/Knauf_Szarazepitesi_Kezikonyv_2025.pdf',
      digitalFileUrl: 'https://www.knauf.hu/downloads/Knauf_Szarazepitesi_Kezikonyv_2025.pdf',
      buttonLabel: 'PDF Letöltése',
      accessNote: 'Ingyenes gyártói szakmai útmutató.',
      copyrightStatus: 'publisher_permission',
      publisherUrl: 'https://knauf.hu',
      downloadEnabled: true,
    },
    storeOffers: [
      {
        id: 'offer-knauf-1',
        storeName: 'Knauf Magyarország',
        productUrl: 'https://knauf.hu',
        format: 'pdf',
        price: 0,
        currency: 'HUF',
        availability: 'instant_digital',
        shippingInfo: 'Ingyenes letöltés',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 14. TECHNOLÓGIA: Rigips Szárazépítés
  {
    id: 'book-rigips-szarazepites-2024',
    title: 'Rigips Gipszkarton Szerkezetek és Tűzgátló Válaszfalak',
    subtitle: 'Habarcsmentes belsőépítészet, CWA profilok és Glasroc F tűzvédelmi építőlemezek',
    author: 'Saint-Gobain / Rigips Műszaki Csoport',
    publisher: 'Saint-Gobain Construction Products Hungary Kft.',
    year: 2024,
    pages: 295,
    isbn: '978-963-89-1135-0',
    category: 'technologia',
    categoryLabel: 'Technológia és kivitelezés',
    difficulty: 'haladó',
    badge: 'Gyártói Kézikönyv',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    coverImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600&auto=format&fit=crop',
    downloadUrl: 'https://www.rigips.hu/downloads/Rigips_Kivitelezoi_Kezikonyv_2024.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 14.1,
    fileName: 'Rigips_Kivitelezoi_Kezikonyv_2024.pdf',
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://www.rigips.hu/downloads/Rigips_Kivitelezoi_Kezikonyv_2024.pdf',
    digitalPreviewUrl: 'https://www.rigips.hu/downloads/Rigips_Kivitelezoi_Kezikonyv_2024.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
    description:
      'Gipszkarton válaszfalak, tetőtéri beépítések, Rigidur szárazpadlók és magas tűzállóságú Glasroc F lemezek kivitelezési szabályai.',
    tableOfContents: [
      '1. Fejezet: Tetőtér beépítés hőszigetelése és párazáró fólia csatlakoztatás',
      '2. Fejezet: Habarcsmentes szárazpadlók (Rigidur) fektetése',
    ],
    sampleExcerpt:
      'A gipszkarton lapok csavarozásánál a csavarfejet 0,5 mm-re kell besüllyeszteni a kartonfelület elnyírása nélkül.',
    rating: 4.9,
    reviewsCount: 110,
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalAccessType: 'direct_download',
      digitalUrl: 'https://www.rigips.hu/downloads/Rigips_Kivitelezoi_Kezikonyv_2024.pdf',
      digitalFileUrl: 'https://www.rigips.hu/downloads/Rigips_Kivitelezoi_Kezikonyv_2024.pdf',
      buttonLabel: 'PDF Letöltése',
      accessNote: 'Ingyenes gyártói szakmai kézikönyv.',
      copyrightStatus: 'publisher_permission',
      publisherUrl: 'https://rigips.hu',
      downloadEnabled: true,
    },
    storeOffers: [
      {
        id: 'offer-rigips-1',
        storeName: 'Rigips / Saint-Gobain',
        productUrl: 'https://rigips.hu',
        format: 'pdf',
        price: 0,
        currency: 'HUF',
        availability: 'instant_digital',
        shippingInfo: 'Ingyenes letöltés',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 15. SZABVÁNYOK: Eurocode 0 és 1 Kézikönyv
  {
    id: 'book-eurocode-0-1-handbook-2025',
    title: 'Eurocode 0 és 1: Teherkombinációk, Hó- és Szélterhek',
    subtitle: 'MSZ EN 1990 és MSZ EN 1991 méretezési szabványok alkalmazása',
    author: 'MSZT Műszaki Bizottság / Dr. Dunai László',
    publisher: 'Magyar Szabványügyi Testület (MSZT)',
    year: 2025,
    pages: 410,
    isbn: '978-963-408-010-8',
    category: 'szabvanyok',
    categoryLabel: 'Szabványok és előírások',
    difficulty: 'mester',
    badge: 'Hivatalos Szabvány útmutató',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Az építési teherkombinációk (STR/GEO határállapotok), önsúlyok, hasznos terhek, hóterhek (skandináv és Kárpát-medencei zónák) és szélteher-számítások hivatalos magyarázata.',
    tableOfContents: [
      '1. Fejezet: MSZ EN 1990: A szerkezeti tervezés alapjai és parciális tényezők (gamma_G, gamma_Q)',
      '2. Fejezet: MSZ EN 1991-1-1: Önsúlyok és épületek hasznos terhei',
      '3. Fejezet: MSZ EN 1991-1-3: Hóterhek számítása és hózugok',
      '4. Fejezet: MSZ EN 1991-1-4: Szélterhek és alaktényezők (c_pe)',
    ],
    sampleExcerpt:
      'Az alaptörési határállapot (EQU/STR) ellenőrzése során az állandó terhek kedvezőtlen biztonsági tényezője gamma_G = 1,35.',
    rating: 5.0,
    reviewsCount: 165,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://mszt.hu',
    },
    storeOffers: [
      {
        id: 'offer-mszt-1',
        storeName: 'Magyar Szabványügyi Testület (MSZT)',
        productUrl: 'https://mszt.hu/bolt',
        format: 'nyomtatott',
        price: 11500,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-3 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 16. SZAKMAALAPOK: Kőműves Szakmaalapok Tankönyv
  {
    id: 'book-komuves-alapismeretek-2025',
    title: 'Kőműves Szakmaalapok és Falazási Technológia',
    subtitle: 'Hivatalos szakképzési tankönyv kőműves tanulók és szakemberek részére',
    author: 'Szakmai Szerzői Munkacsoport',
    publisher: 'Nemzeti Szakképzési és Felnőttképzési Hivatal (NSZFH)',
    year: 2025,
    pages: 340,
    isbn: '978-963-16-5510-4',
    category: 'szakmaalapok',
    categoryLabel: 'Szakmaalapok',
    difficulty: 'kezdő',
    badge: 'Szakképzési Tankönyv',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=600&auto=format&fit=crop',
    downloadUrl: 'https://szakkepzes.ikkk.hu/tananyagok/komuves_szakmaalapok_2025.pdf',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 16.5,
    fileName: 'komuves_szakmaalapok_2025.pdf',
    digitalAccessType: 'direct_download',
    digitalFileUrl: 'https://szakkepzes.ikkk.hu/tananyagok/komuves_szakmaalapok_2025.pdf',
    digitalPreviewUrl: 'https://szakkepzes.ikkk.hu/tananyagok/komuves_szakmaalapok_2025.pdf',
    digitalLinkLabel: 'PDF Letöltése',
    downloadEnabled: true,
    description:
      'A kőműves mesterség alapvető fogásai: falazási kötésrendszerek (feles kötés, kéménykötés), habarcskeverés, szintezés, áthidalók elhelyezése és vakolási alapismeretek.',
    tableOfContents: [
      '1. Fejezet: Kőműves szerszámok (kőműveskanál, vízmérték, csapózsinór)',
      '2. Fejezet: Tégla és pórusbeton falazási kötésminták',
      '3. Fejezet: Alapozás előkészítése és kézi habarcskeverés',
    ],
    sampleExcerpt:
      'A függőleges falazási állás ellenőrzése minden második téglasornál kötelező függőón vagy lézeres szintező segítségével.',
    rating: 4.8,
    reviewsCount: 142,
    digitalAccess: {
      publicationType: 'pdf',
      accessType: 'free_download',
      digitalAccessType: 'direct_download',
      digitalUrl: 'https://szakkepzes.ikkk.hu/tananyagok/komuves_szakmaalapok_2025.pdf',
      digitalFileUrl: 'https://szakkepzes.ikkk.hu/tananyagok/komuves_szakmaalapok_2025.pdf',
      buttonLabel: 'PDF Letöltése',
      accessNote: 'Ingyenes állami szakképzési tananyag.',
      copyrightStatus: 'public_external',
      publisherUrl: 'https://szakkepzes.ikkk.hu',
      downloadEnabled: true,
    },
    storeOffers: [
      {
        id: 'offer-nszfh-komuves-1',
        storeName: 'NSZFH Szakképzési Portál',
        productUrl: 'https://szakkepzes.ikkk.hu',
        format: 'pdf',
        price: 0,
        currency: 'HUF',
        availability: 'instant_digital',
        shippingInfo: 'Ingyenes letöltés',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 17. VIZSGAFELKÉSZÍTŐ: Kőműves Mestervizsga
  {
    id: 'book-komuves-mestervizsga-2025',
    title: 'Kőműves Mestervizsga Felkészítő és Példatár',
    subtitle: 'Elméleti és gyakorlati mestervizsga feladatsorok, felmérés és költségvetés-készítés',
    author: 'Magyar Kereskedelmi és Iparkamara (MKIK) Mesterképzési Kollégium',
    publisher: 'MKIK / TERC Kft.',
    year: 2025,
    pages: 310,
    isbn: '978-963-88-2010-6',
    category: 'vizsga',
    categoryLabel: 'Vizsgafelkészítők',
    difficulty: 'mester',
    badge: 'Mestervizsga Kézikönyv',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Hivatalos MKIK mesterképzési jegyzet kőműves mestervizsgára készülő szakemberek számára. Építésvezetés, költségvetési normafejezetek és műszaki átadás-átvételi jegyzőkönyvek.',
    tableOfContents: [
      '1. Fejezet: Mestervizsga elméleti feladatsorok és tételtár',
      '2. Fejezet: Árazatlan és árazott költségvetés kiírása TERC alapon',
      '3. Fejezet: Építésszervezési és ütemterv-készítési mintapéldák',
    ],
    sampleExcerpt:
      'A mestervizsga gyakorlati feladatánál az elkészült falazat mérettűrése magasságban max. +-3 mm lehet 3 méteres hosszon.',
    rating: 5.0,
    reviewsCount: 88,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://mkik.hu',
    },
    storeOffers: [
      {
        id: 'offer-mkik-1',
        storeName: 'MKIK Mesterképzési Központ',
        productUrl: 'https://mkik.hu/mesterkepzes',
        format: 'nyomtatott',
        price: 8900,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 18. VIZSGAFELKÉSZÍTŐ: FMV és Műszaki Ellenőri Vizsga
  {
    id: 'book-fmv-vizsga-2025',
    title: 'Felelős Műszaki Vezetői és Műszaki Ellenőri Vizsgafelkészítő',
    subtitle: 'MMK és ÉMK jogosultsági vizsga jogszabályi és szakmai tesztgyűjteménye',
    author: 'Magyar Mérnöki Kamara (MMK) / Építési Tagozat',
    publisher: 'Magyar Mérnöki Kamara (MMK)',
    year: 2025,
    pages: 450,
    isbn: '978-963-88-2040-3',
    category: 'vizsga',
    categoryLabel: 'Vizsgafelkészítők',
    difficulty: 'szakértő',
    badge: 'Kamarai Vizsgafelkészítő',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Az MMK kamara által előírt jogi és műszaki vizsga tananyaga FMV (Felelős Műszaki Vezető) és ME (Műszaki Ellenőr) szakterületekre. 266/2013. Korm. rendelet magyarázata.',
    tableOfContents: [
      '1. Fejezet: Építésügyi jogszabályok, ÉTV és kivitelezési kódex',
      '2. Fejezet: FMV nyilatkozatok és használatbavételi eljárások',
      '3. Fejezet: Műszaki ellenőr felelősségi köre és naplóbejegyzések',
    ],
    sampleExcerpt:
      'Az FMV felel a jogerős építési engedélynek és a jóváhagyott kivitelezési terveknek megfelelő szakszerű megvalósításért.',
    rating: 4.9,
    reviewsCount: 175,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://mmk.hu',
    },
    storeOffers: [
      {
        id: 'offer-mmk-1',
        storeName: 'Magyar Mérnöki Kamara (MMK)',
        productUrl: 'https://mmk.hu/tovabbkepzes',
        format: 'nyomtatott',
        price: 10500,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },

  // 19. DIGITALIZÁCIÓ: BIM az Építőiparban
  {
    id: 'book-bim-digitalizacio-2025',
    title: 'BIM az Építőiparban – Digitalizációs Kivitelezési Kézikönyv',
    subtitle: '3D/4D/5D épületinformációs modellezés, IFC szabvány és Revit/ArchiCAD ütközésvizsgálat',
    author: 'Dr. Vidovszky István, BME BIM Központ',
    publisher: 'Műszaki Könyvkiadó / BME',
    year: 2025,
    pages: 320,
    isbn: '978-963-16-5605-7',
    category: 'technologia',
    categoryLabel: 'Technológia és kivitelezés',
    difficulty: 'szakértő',
    badge: 'Digitalizációs Kézikönyv',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop',
    downloadUrl: '',
    format: 'Nyomtatott könyv',
    digitalAccessType: 'none',
    downloadEnabled: false,
    description:
      'Az építőipari BIM (Building Information Modeling) munkafolyamatok gyakorlati útmutatója. LOD 100-500 részletezettségi szint, IFC adatcsere és ütközésvizsgálatok.',
    tableOfContents: [
      '1. Fejezet: ISO 19650 BIM szabványcsalád alapelvei és CDE adatkörnyezet',
      '2. Fejezet: Szerkezetépítési és gépészeti szakági modellek koordinációja',
      '3. Fejezet: 4D (időütemezés) és 5D (költségvetés) BIM modellek',
    ],
    sampleExcerpt:
      'A CDE (Common Data Environment) közös adatforrás biztosítja, hogy a beruházás minden szereplője a modell legfrissebb állapotát lássa.',
    rating: 4.9,
    reviewsCount: 92,
    digitalAccess: {
      publicationType: 'nyomtatott',
      accessType: 'none',
      digitalAccessType: 'none',
      publisherUrl: 'https://muszakikonyvkiado.hu',
    },
    storeOffers: [
      {
        id: 'offer-bim-1',
        storeName: 'Műszaki Könyvkiadó Hivatalos Bolt',
        productUrl: 'https://muszakikonyvkiado.hu',
        format: 'nyomtatott',
        price: 8900,
        currency: 'HUF',
        availability: 'in_stock',
        shippingInfo: '1-2 munkanap',
        isPartnerOffer: true,
        isFeaturedOffer: true,
        checkedAt: '2026-09-03',
        isActive: true,
      },
    ],
  },
];

const STORAGE_KEY = 'epitotudas_books_v6';
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
          coverImage: b.generatedCoverImageUrl || b.coverImageUpload || b.coverImageUrl || b.coverImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=600&auto=format&fit=crop',
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
