import { supabase, type Partner } from '../lib/supabase';

export type PartnerCategory =
  | 'gyarto'
  | 'kereskedo'
  | 'ceg'
  | 'iskola'
  | 'oktato'
  | 'tamogato';

export interface CreatePartnerPayload {
  name: string;
  category: PartnerCategory;
  description?: string;
  website_url?: string;
  logo_url?: string;
}

const STORAGE_KEY = 'epitotudas_partners_store_v1';
const SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000004';

const DEFAULT_PARTNERS: Partner[] = [
  {
    id: 'p-1',
    name: 'Leier Hungária Kft.',
    slug: 'leier-hungaria',
    category: 'gyarto',
    description: 'Építőanyag-gyártó: téglák, térkövek, beton elemek és szigetelő rendszerek.',
    website_url: 'https://www.leier.hu',
    logo_url: null,
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p-2',
    name: 'Cemex Magyarország',
    slug: 'cemex-magyarorszag',
    category: 'gyarto',
    description: 'Beton- és cementipari prémium megoldások és transzportbeton.',
    website_url: 'https://www.cemex.hu',
    logo_url: null,
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p-3',
    name: 'BME Építőmérnöki Kar',
    slug: 'bme-epito',
    category: 'iskola',
    description: 'Felsőfokú építőmérnöki, laboratóriumi és szakmai szakképzési központ.',
    website_url: 'https://www.epito.bme.hu',
    logo_url: null,
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p-4',
    name: 'Stahlbau Kivitelező Zrt.',
    slug: 'stahlbau-kivitelezo',
    category: 'ceg',
    description: 'Acélszerkezetek és ipari csarnokok generálkivitelezője.',
    website_url: 'https://www.stahlbau.hu',
    logo_url: null,
    is_verified: true,
    created_at: new Date().toISOString(),
  },
];

export function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    gyarto: 'Gyártó',
    kereskedo: 'Kereskedő',
    ceg: 'Kivitelező Cég',
    iskola: 'Oktatási Intézmény',
    oktato: 'Oktató / Tréner',
    tamogato: 'Támogató',
  };
  return map[cat] || cat;
}

function getStoredPartners(): Partner[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    void err;
  }
  return DEFAULT_PARTNERS;
}

function saveStoredPartners(list: Partner[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ID,
          name: '__SYSTEM_CONFIG_PARTNERS__',
          slug: 'system-partners-config',
          description: JSON.stringify(list),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        void err;
      }
    })();
  } catch (err) {
    void err;
  }
}

export async function listPartners(category?: string): Promise<Partner[]> {
  let list = getStoredPartners();

  try {
    const { data } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_SYSTEM_ID)
      .maybeSingle();

    if (data?.description && data.description.startsWith('[')) {
      const cloudList = JSON.parse(data.description);
      if (Array.isArray(cloudList) && cloudList.length > 0) {
        list = cloudList;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
      }
    }
  } catch (err) {
    void err;
  }

  if (category && category !== 'all') {
    return list.filter((p) => p.category === category);
  }
  return list;
}

export async function createPartner(payload: CreatePartnerPayload): Promise<Partner> {
  const slug = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newPartner: Partner = {
    id: `p-${Date.now()}`,
    name: payload.name,
    slug,
    category: payload.category,
    description: payload.description || null,
    website_url: payload.website_url || null,
    logo_url: payload.logo_url || null,
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  const list = getStoredPartners();
  list.unshift(newPartner);
  saveStoredPartners(list);
  return newPartner;
}

export async function updatePartner(id: string, payload: Partial<CreatePartnerPayload & { is_verified?: boolean }>): Promise<Partner> {
  const list = getStoredPartners();
  const index = list.findIndex((p) => p.id === id);

  if (index !== -1) {
    list[index] = {
      ...list[index],
      ...payload,
    };
    saveStoredPartners(list);
    return list[index];
  }

  throw new Error('Partner nem található');
}

export async function deletePartner(id: string): Promise<void> {
  const list = getStoredPartners();
  const filtered = list.filter((p) => p.id !== id);
  saveStoredPartners(filtered);
}
