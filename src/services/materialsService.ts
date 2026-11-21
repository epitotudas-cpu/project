import { supabase } from '../lib/supabase';
import {
  readAppConfig,
  writeAppConfig,
  readAppConfigWithVersion,
  writeAppConfigIfUnchanged,
} from './appConfigService';

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

const SUPABASE_SYSTEM_ROW_ID = '00000000-0000-0000-0000-000000000024';
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
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
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

export async function saveMaterialCategoriesLocal(cats: MaterialCategory[]): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(cats));
    window.dispatchEvent(new Event('materials-updated'));

    await writeAppConfig('__SYSTEM_CONFIG_MATERIAL_CATEGORIES__', cats, {
      id: SUPABASE_CATS_ROW_ID,
      slug: 'system-material-categories',
    });
  } catch (err) {
    console.error('Hiba az anyag kategóriák mentésekor:', err);
    throw err;
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

const MAX_CAS_RETRIES = 4;
let lastCloudMaterialsUpdatedAt: string | null = null;
let lastCloudMaterialsItems: MaterialItem[] | null = null;

function mergeMaterialLists(
  baseItems: MaterialItem[],
  targetItems: MaterialItem[],
  freshCloudItems: MaterialItem[],
  patchOnlyFields?: Array<keyof MaterialItem>
): MaterialItem[] {
  const baseMap = new Map(baseItems.map((i) => [i.id, i]));
  const targetMap = new Map(targetItems.map((i) => [i.id, i]));

  const deletedIds = new Set<string>();
  for (const b of baseItems) {
    if (!targetMap.has(b.id)) {
      deletedIds.add(b.id);
    }
  }

  const added: MaterialItem[] = [];
  const updatedMap = new Map<string, MaterialItem>();
  for (const t of targetItems) {
    const prev = baseMap.get(t.id);
    if (!prev) {
      added.push(t);
    } else if (JSON.stringify(prev) !== JSON.stringify(t)) {
      updatedMap.set(t.id, t);
    }
  }

  const next = freshCloudItems
    .filter((f) => !deletedIds.has(f.id))
    .map((f) => {
      const upd = updatedMap.get(f.id);
      if (!upd) return f;
      if (patchOnlyFields && patchOnlyFields.length > 0) {
        const patched: MaterialItem = { ...f };
        for (const field of patchOnlyFields) {
          (patched as unknown as Record<string, unknown>)[field as string] = upd[field];
        }
        return patched;
      }
      return upd;
    });

  const existingIds = new Set(next.map((i) => i.id));
  const uniqueAdded = added.filter((a) => !existingIds.has(a.id));
  return [...uniqueAdded, ...next];
}

export async function saveMaterialsLocal(
  items: MaterialItem[],
  options?: { patchOnlyFields?: Array<keyof MaterialItem> }
): Promise<MaterialItem[]> {
  if (typeof window === 'undefined') return items;

  let expectedUpdatedAt = lastCloudMaterialsUpdatedAt;
  let baselineItems = lastCloudMaterialsItems;
  let candidateItems = items;

  if (baselineItems === null) {
    const initial = await readAppConfigWithVersion<MaterialItem[]>(
      '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
      SUPABASE_SYSTEM_ROW_ID
    );
    expectedUpdatedAt = initial.updatedAt;
    const fresh = Array.isArray(initial.value) ? initial.value : [];
    baselineItems = fresh;
    if (fresh.length > 0) {
      candidateItems = mergeMaterialLists([], items, fresh, options?.patchOnlyFields);
    }
  }

  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const res = await writeAppConfigIfUnchanged(
      '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
      candidateItems,
      expectedUpdatedAt,
      {
        id: SUPABASE_SYSTEM_ROW_ID,
        slug: 'system-materials-items-config',
      }
    );

    if (!res.conflict) {
      lastCloudMaterialsUpdatedAt = res.updatedAt;
      lastCloudMaterialsItems = candidateItems;
      localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(candidateItems));
      window.dispatchEvent(new Event('materials-updated'));
      return candidateItems;
    }

    const latest = await readAppConfigWithVersion<MaterialItem[]>(
      '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
      SUPABASE_SYSTEM_ROW_ID
    );
    expectedUpdatedAt = latest.updatedAt;
    const fresh = Array.isArray(latest.value) ? latest.value : [];
    candidateItems = mergeMaterialLists(baselineItems, items, fresh, options?.patchOnlyFields);
    baselineItems = fresh;
  }

  throw new Error(
    'A termékadatok mentése többszöri egyidejű módosítás (CAS konfliktus) miatt sikertelen. Kérjük, frissítse az oldalt és próbálja újra.'
  );
}

export async function setMaterialStatusAsAdmin(
  itemId: string,
  status: 'published' | 'rejected',
  rejectionNote: string | null
): Promise<MaterialItem[]> {
  const latest = await readAppConfigWithVersion<MaterialItem[]>(
    '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
    SUPABASE_SYSTEM_ROW_ID
  );
  const currentCloud = Array.isArray(latest.value) ? latest.value : getMaterialsLocal();
  lastCloudMaterialsUpdatedAt = latest.updatedAt;
  lastCloudMaterialsItems = Array.isArray(latest.value) ? latest.value : currentCloud;

  const now = new Date().toISOString();
  const updated = currentCloud.map((i) =>
    i.id === itemId
      ? {
          ...i,
          status,
          rejection_note: rejectionNote,
          updated_at: now,
        }
      : i
  );

  return saveMaterialsLocal(updated, {
    patchOnlyFields: ['status', 'rejection_note', 'updated_at'],
  });
}

export async function upsertPartnerMaterialItem(
  partnerId: string,
  item: Partial<MaterialItem> & { status: 'draft' | 'pending_approval' }
): Promise<MaterialItem> {
  const { data, error } = await supabase.rpc('upsert_partner_material_item', {
    p_partner_id: partnerId,
    p_item: item,
  });

  if (error || !data) {
    throw new Error(error?.message || 'Partner termék mentése sikertelen.');
  }

  const saved = data as MaterialItem;
  if (typeof window !== 'undefined') {
    const current = getMaterialsLocal();
    const exists = current.some((i) => i.id === saved.id);
    const next = exists ? current.map((i) => (i.id === saved.id ? saved : i)) : [saved, ...current];
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('materials-updated'));
  }

  return saved;
}

export async function deletePartnerMaterialItem(partnerId: string, itemId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_partner_material_item', {
    p_partner_id: partnerId,
    p_item_id: itemId,
  });

  if (error) {
    throw new Error(error.message || 'Partner termék törlése sikertelen.');
  }

  if (typeof window !== 'undefined') {
    const current = getMaterialsLocal();
    const next = current.filter((i) => i.id !== itemId);
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('materials-updated'));
  }
}

export async function fetchMaterialsFromCloud(options?: {
  partnerId?: string;
  isAdmin?: boolean;
}): Promise<{ items: MaterialItem[] | null; categories: MaterialCategory[] | null; error?: boolean }> {
  try {
    let hasFetchError = false;

    const fetchItems = async (): Promise<MaterialItem[] | null> => {
      if (options?.isAdmin) {
        const itemsResult = await readAppConfigWithVersion<MaterialItem[]>(
          '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
          SUPABASE_SYSTEM_ROW_ID
        );
        lastCloudMaterialsUpdatedAt = itemsResult.updatedAt;
        if (Array.isArray(itemsResult.value)) {
          lastCloudMaterialsItems = itemsResult.value;
        }
        return itemsResult.value;
      }

      if (options?.partnerId) {
        const rpcRes = await supabase.rpc('get_partner_own_materials', {
          p_partner_id: options.partnerId,
        });
        if (rpcRes && !rpcRes.error && Array.isArray(rpcRes.data)) {
          return rpcRes.data as MaterialItem[];
        }
        if (rpcRes && rpcRes.error && rpcRes.error.code !== '42883' && rpcRes.error.code !== 'PGRST202') {
          hasFetchError = true;
          return null;
        }
      } else {
        const rpcRes = await supabase.rpc('get_published_materials');
        if (rpcRes && !rpcRes.error && Array.isArray(rpcRes.data)) {
          return rpcRes.data as MaterialItem[];
        }
        if (rpcRes && rpcRes.error && rpcRes.error.code !== '42883' && rpcRes.error.code !== 'PGRST202') {
          hasFetchError = true;
          return null;
        }
      }

      const itemsResult = await readAppConfigWithVersion<MaterialItem[]>(
        '__SYSTEM_CONFIG_MATERIALS_ITEMS__',
        SUPABASE_SYSTEM_ROW_ID
      );
      lastCloudMaterialsUpdatedAt = itemsResult.updatedAt;
      if (Array.isArray(itemsResult.value)) {
        lastCloudMaterialsItems = itemsResult.value;
      }
      return itemsResult.value;
    };

    const [parsedItems, parsedCats] = await Promise.all([
      fetchItems(),
      readAppConfig<MaterialCategory[]>('__SYSTEM_CONFIG_MATERIAL_CATEGORIES__', SUPABASE_CATS_ROW_ID),
    ]);

    let loadedItems: MaterialItem[] | null = null;
    let loadedCats: MaterialCategory[] | null = null;

    if (Array.isArray(parsedItems) && parsedItems.length > 0) {
      loadedItems = parsedItems;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(parsedItems));
      }
    }

    if (Array.isArray(parsedCats) && parsedCats.length > 0) {
      loadedCats = parsedCats;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_CATS_KEY, JSON.stringify(parsedCats));
      }
    }

    if (typeof window !== 'undefined' && (loadedItems || loadedCats)) {
      window.dispatchEvent(new Event('materials-updated'));
    }

    return hasFetchError
      ? { items: loadedItems, categories: loadedCats, error: true }
      : { items: loadedItems, categories: loadedCats };
  } catch (err) {
    console.warn('Cloud materials fetch:', err);
  }
  return { items: null, categories: null, error: true };
}
