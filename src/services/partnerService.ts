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

export async function listPartners(category?: string): Promise<Partner[]> {
  try {
    let query = supabase.from('partners').select('*').order('name');
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      if (category && category !== 'all') {
        return DEFAULT_PARTNERS.filter((p) => p.category === category);
      }
      return DEFAULT_PARTNERS;
    }
    return data;
  } catch (err) {
    void err;
    if (category && category !== 'all') {
      return DEFAULT_PARTNERS.filter((p) => p.category === category);
    }
    return DEFAULT_PARTNERS;
  }
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

  try {
    const { data, error } = await supabase.from('partners').insert([payload]).select().single();
    if (!error && data) return data;
  } catch (err) {
    void err;
  }

  DEFAULT_PARTNERS.push(newPartner);
  return newPartner;
}

export async function updatePartner(id: string, payload: Partial<CreatePartnerPayload & { is_verified?: boolean }>): Promise<Partner> {
  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.description !== undefined) updateData.description = payload.description || null;
  if (payload.website_url !== undefined) updateData.website_url = payload.website_url || null;
  if (payload.is_verified !== undefined) updateData.is_verified = payload.is_verified;

  try {
    const { data, error } = await supabase.from('partners').update(updateData).eq('id', id).select().single();
    if (!error && data) return data;
  } catch (err) {
    void err;
  }

  const idx = DEFAULT_PARTNERS.findIndex((p) => p.id === id);
  if (idx !== -1) {
    DEFAULT_PARTNERS[idx] = {
      ...DEFAULT_PARTNERS[idx],
      ...updateData,
    };
    return DEFAULT_PARTNERS[idx];
  }

  throw new Error('Partner nem található.');
}

export async function deletePartner(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (!error) {
      const idx = DEFAULT_PARTNERS.findIndex((p) => p.id === id);
      if (idx !== -1) DEFAULT_PARTNERS.splice(idx, 1);
      return;
    }
  } catch (err) {
    void err;
  }

  const idx = DEFAULT_PARTNERS.findIndex((p) => p.id === id);
  if (idx !== -1) {
    DEFAULT_PARTNERS.splice(idx, 1);
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'gyarto':
      return 'Gyártó';
    case 'kereskedo':
      return 'Kereskedő';
    case 'ceg':
      return 'Cég / Kivitelező';
    case 'iskola':
      return 'Oktatási Intézmény';
    case 'oktato':
      return 'Oktatási Központ';
    case 'tamogato':
      return 'Támogató Szervezet';
    default:
      return category;
  }
}
