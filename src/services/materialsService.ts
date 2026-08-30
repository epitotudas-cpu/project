import { supabase } from '../lib/supabase';

export interface MaterialCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MaterialSpec {
  label: string;
  value: string;
  unit?: string;
}

export interface MaterialDocument {
  id: string;
  title: string;
  file_url: string;
  doc_type: 'muszaki_adatlap' | 'teljesitmenynyilatkozat' | 'biztonsagi_adatlap' | 'utmutato' | 'katalogus' | 'tanusitvany' | 'egyeb';
  file_size?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  category_name: string;
  subcategory_name?: string | null;
  brand: string; // Gyártó / Márka
  partner_id: string; // Partner cég ID (pl. p-1, p-2)
  partner_name: string; // Partner cég neve
  sku?: string | null; // Cikkszám / Termékkód
  barcode?: string | null;
  short_description: string;
  full_description: string;
  application_area?: string | null;
  technical_specs: MaterialSpec[];
  main_image_url: string;
  gallery_image_urls: string[];
  documents: MaterialDocument[];
  related_material_ids: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected' | 'archived';
  rejection_note?: string | null;
  featured: boolean;
  sort_order: number;
  views: number;
  seo_title?: string | null;
  seo_description?: string | null;
  keywords: string[];
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_ITEMS_KEY = 'epitotudas_materials_items_v1';
const LOCAL_STORAGE_CATS_KEY = 'epitotudas_materials_categories_v1';

const SUPABASE_SYSTEM_ROW_ID = '00000000-0000-0000-0000-000000000009';
const SUPABASE_CATS_ROW_ID = '00000000-0000-0000-0000-000000000010';

export const DEFAULT_MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: 'mat-cat-1',
    name: 'Szigetelőanyagok',
    slug: 'szigeteloanyagok',
    description: 'Hőszigetelő lapok, kőzetgyapot, üveggyapot, homlokzati és lépésálló szigetelések.',
    parent_id: null,
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mat-cat-2',
    name: 'Festékek & Vakolatok',
    slug: 'festekek-es-vakolatok',
    description: 'Kültéri homlokzatfestékek, beltéri falfestékek, nemesvakolatok és színező vakolatok.',
    parent_id: null,
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mat-cat-3',
    name: 'Burkolóanyagok & Ragasztók',
    slug: 'burkoloanyagok-es-ragasztok',
    description: 'Kerámia burkolólapok, csemperagasztók, fúgázóanyagok és aljzatkiegyenlítők.',
    parent_id: null,
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mat-cat-4',
    name: 'Betontermékek & Falazóanyagok',
    slug: 'betontermékek-es-falazoanyagok',
    description: 'Téglák, zsalukövek, transzportbeton, térkövek és előregyártott betonelemek.',
    parent_id: null,
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mat-cat-5',
    name: 'Szárazépítés & Gipszkarton',
    slug: 'szarazepites-es-gipszkarton',
    description: 'Gipszkarton lapok, CD/UD profilok, hézagoló glettek és csavarok.',
    parent_id: null,
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mat-cat-6',
    name: 'Vízszigetelés & Tetőfedés',
    slug: 'vizszigeteles-es-tetofedés',
    description: 'Bitumenes lemezek, kenhető vízszigetelések, tetőcserépek és tetőfóliák.',
    parent_id: null,
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_MATERIALS: MaterialItem[] = [
  {
    id: 'mat-001',
    name: 'Leier Csiszolt Kerámia Falazóelem (LeierPLAN 30)',
    slug: 'leierplan-30-csiszolt-falazoelem',
    category_id: 'mat-cat-4',
    category_name: 'Betontermékek & Falazóanyagok',
    subcategory_name: 'Kerámia Falazóelemek',
    brand: 'Leier',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    sku: 'LEIER-PL30-001',
    barcode: '5998123456789',
    short_description: 'Kiváló hőszigetelő képességű, csiszolt kerámia falazóblokk vékonyrétegű ragasztóhabarcs technológiához.',
    full_description: `A LeierPLAN 30 csiszolt falazóelem milliméterpontos felületi megmunkálásának köszönhetően vékonyrétegű ragasztóhabarccsal építhető.

### Főbb Előnyök:
- Rapid technológia: Akár 50%-kal gyorsabb falazási sebesség.
- Kiváló hőszigetelés és hőtároló tömeg.
- Minimális nedvességbevitellel járó építés, gyors száradás.
- Környezetbarát természetes kerámia alapanyag.`,
    application_area: 'Külső teherhordó falak, pillérek és vázkitöltő falazatok építésére.',
    technical_specs: [
      { label: 'Méret (h x sz x m)', value: '250 x 300 x 249', unit: 'mm' },
      { label: 'Nyomószilárdság', value: '11', unit: 'N/mm²' },
      { label: 'Hővezetési tényező (λ)', value: '0.145', unit: 'W/mK' },
      { label: 'Tűzvédelmi osztály', value: 'A1 (nem éghető)' },
      { label: 'Anyagszükséglet', value: '16', unit: 'db/m²' },
    ],
    main_image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop',
    gallery_image_urls: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=800&auto=format&fit=crop',
    ],
    documents: [
      {
        id: 'doc-m1',
        title: 'LeierPLAN_30_Műszaki_Adatlap.pdf',
        file_url: '/docs/leierplan30_adatlap.pdf',
        doc_type: 'muszaki_adatlap',
        file_size: '1.8 MB',
      },
      {
        id: 'doc-m2',
        title: 'LeierPLAN_Teljesítménynyilatkozat.pdf',
        file_url: '/docs/leierplan30_teljesitmeny.pdf',
        doc_type: 'teljesitmenynyilatkozat',
        file_size: '950 KB',
      },
    ],
    related_material_ids: ['mat-002', 'mat-003'],
    status: 'published',
    featured: true,
    sort_order: 1,
    views: 485,
    seo_title: 'LeierPLAN 30 Csiszolt Kerámia Falazóelem | ÉpítőTudás',
    seo_description: 'Műszaki adatok, tulajdonságok és letölthető dokumentumok a LeierPLAN 30 kerámia falazóblokkról.',
    keywords: ['leier', 'téglák', 'falazóelem', 'csiszolt tégla', 'építőanyag'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mat-002',
    name: 'Cemex C25/30 Transzportbeton Rendszer',
    slug: 'cemex-c25-30-transzportbeton',
    category_id: 'mat-cat-4',
    category_name: 'Betontermékek & Falazóanyagok',
    subcategory_name: 'Transzportbeton',
    brand: 'Cemex',
    partner_id: 'p-2',
    partner_name: 'Cemex Magyarország',
    sku: 'CEMEX-C2530-01',
    barcode: null,
    short_description: 'Magas szilárdságú, laboratóriumban ellenőrzött transzportbeton alaptestekhez, födémekhez és pillérekhez.',
    full_description: `A Cemex C25/30 nyomószilárdsági osztályú szivattyúzható transzportbeton szerkezeti betonozáshoz ajánlott készre kevert építőanyag.

### Alkalmazás:
- Sávalapok, lemezalapok kiöntése.
- Monolit vasbeton födémek és koszorúk készítése.
- Terhelhető ipari aljzatok és tartópillérek betonozása.`,
    application_area: 'Családi házak és ipari létesítmények teherhordó beton- és vasbeton szerkezeteihez.',
    technical_specs: [
      { label: 'Nyomószilárdsági osztály', value: 'C25/30' },
      { label: 'Konzisztencia osztály', value: 'F3 (folyós) / S3' },
      { label: 'Környezeti hatásosztály', value: 'XC2 / XF1' },
      { label: 'Maximális szemcseméret', value: 'Dmax 16 / 22', unit: 'mm' },
    ],
    main_image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
    gallery_image_urls: [],
    documents: [
      {
        id: 'doc-m3',
        title: 'Cemex_C25_30_Teljesítménynyilatkozat.pdf',
        file_url: '/docs/cemex_c2530.pdf',
        doc_type: 'teljesitmenynyilatkozat',
        file_size: '1.2 MB',
      },
    ],
    related_material_ids: ['mat-001'],
    status: 'published',
    featured: true,
    sort_order: 2,
    views: 360,
    seo_title: 'Cemex C25/30 Transzportbeton Műszaki Adatlap | ÉpítőTudás',
    seo_description: 'Cemex C25/30 szerkezeti beton paraméterei, nyomószilárdsága és alkalmazási útmutatója.',
    keywords: ['cemex', 'beton', 'transzportbeton', 'alapozás', 'C25/30'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mat-003',
    name: 'Austrotherm GRAFIT REFLEX Homlokzati Hőszigetelő Lap',
    slug: 'austrotherm-grafit-reflex-hoszigetelo',
    category_id: 'mat-cat-1',
    category_name: 'Szigetelőanyagok',
    subcategory_name: 'Homlokzati Hőszigetelés',
    brand: 'Austrotherm',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    sku: 'AUSTRO-GRAFIT-150',
    barcode: '5999000112233',
    short_description: 'Reflektív bevonattal ellátott grafitos EPS hőszigetelő lemez, 23%-kal kedvezőbb hőszigetelési teljesítménnyel.',
    full_description: `Az Austrotherm GRAFIT REFLEX szürke színű grafitos polisztirol lap, amelynek elülső oldalát fehér védőréteg borítja a napsugárzás elleni védelem érdekében.

### Előnyök:
- 23%-kal jobb hőszigetelő hatás a hagyományos fehér EPS-hez képest.
- Vékonyabb falvastagság érhető el azonos hőszigetelési érték mellett.
- A védőbevonat megakadályozza a lapok szétnyílását a tűző napon a kivitelezés során.`,
    application_area: 'Vékonyvakolatos homlokzati hőszigetelő rendszerekben (THR/ETICS).',
    technical_specs: [
      { label: 'Hővezetési tényező (λD)', value: '0.031', unit: 'W/mK' },
      { label: 'Nyomófeszültség (10% benyomódásnál)', value: '70', unit: 'kPa' },
      { label: 'Páradiffúziós ellenállási szám (μ)', value: '20-40' },
      { label: 'Tűzvédelmi osztály', value: 'E (nehezen éghető)' },
      { label: 'Tábla méret', value: '1000 x 500', unit: 'mm' },
    ],
    main_image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    gallery_image_urls: [],
    documents: [
      {
        id: 'doc-m4',
        title: 'Austrotherm_Grafit_Reflex_Műszaki_Adatlap.pdf',
        file_url: '/docs/austrotherm_grafit.pdf',
        doc_type: 'muszaki_adatlap',
        file_size: '2.4 MB',
      },
    ],
    related_material_ids: ['mat-001'],
    status: 'published',
    featured: true,
    sort_order: 3,
    views: 620,
    seo_title: 'Austrotherm GRAFIT REFLEX Hőszigetelő Lap | ÉpítőTudás',
    seo_description: 'Grafitos EPS homlokzati hőszigetelő lap tulajdonságai, műszaki adatai és tanúsítványai.',
    keywords: ['austrotherm', 'hőszigetelés', 'grafitos eps', 'homlokzati szigetelés'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper Functions for Local & Cloud Persistence
export function getMaterialCategoriesLocal(): MaterialCategory[] {
  if (typeof window === 'undefined') return DEFAULT_MATERIAL_CATEGORIES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba az anyag kategóriák olvasásakor:', err);
  }
  return DEFAULT_MATERIAL_CATEGORIES;
}

export function saveMaterialCategoriesLocal(cats: MaterialCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(cats));
    window.dispatchEvent(new Event('materials-updated'));

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_CATS_ROW_ID,
          name: '__SYSTEM_CONFIG_MATERIAL_CATEGORIES__',
          slug: 'system-material-categories',
          description: JSON.stringify(cats),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase material categories sync:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba az anyag kategóriák mentésekor:', err);
  }
}

export function getMaterialsLocal(): MaterialItem[] {
  if (typeof window === 'undefined') return DEFAULT_MATERIALS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba az anyagok olvasásakor:', err);
  }
  return DEFAULT_MATERIALS;
}

export function saveMaterialsLocal(items: MaterialItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('materials-updated'));

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ROW_ID,
          name: '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
          slug: 'system-materials-items-config',
          description: JSON.stringify(items),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase materials sync:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba az anyagok mentésekor:', err);
  }
}

export async function fetchMaterialsFromCloud(): Promise<{ items: MaterialItem[] | null; categories: MaterialCategory[] | null }> {
  try {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('categories').select('description').eq('id', SUPABASE_SYSTEM_ROW_ID).maybeSingle(),
      supabase.from('categories').select('description').eq('id', SUPABASE_CATS_ROW_ID).maybeSingle(),
    ]);

    let loadedItems: MaterialItem[] | null = null;
    let loadedCats: MaterialCategory[] | null = null;

    if (!itemsRes.error && itemsRes.data?.description && itemsRes.data.description.startsWith('[')) {
      const parsed = JSON.parse(itemsRes.data.description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        loadedItems = parsed;
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(parsed));
        }
      }
    }

    if (!catsRes.error && catsRes.data?.description && catsRes.data.description.startsWith('[')) {
      const parsed = JSON.parse(catsRes.data.description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        loadedCats = parsed;
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(parsed));
        }
      }
    }

    if (typeof window !== 'undefined' && (loadedItems || loadedCats)) {
      window.dispatchEvent(new Event('materials-updated'));
    }

    return { items: loadedItems, categories: loadedCats };
  } catch (err) {
    console.warn('Cloud materials fetch:', err);
  }
  return { items: null, categories: null };
}
