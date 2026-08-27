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

export async function listPartners(category?: string): Promise<Partner[]> {
  // Clear legacy mock cache from localStorage if present
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('epitotudas_partners_v1');
      if (raw && raw.includes('"p-1"')) {
        localStorage.removeItem('epitotudas_partners_v1');
      }
    }
  } catch {}

  let query = supabase.from('partners').select('*').order('name', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Partners fetch notice:', error);
    return [];
  }

  return (data || []) as Partner[];
}

export async function createPartner(payload: CreatePartnerPayload): Promise<Partner> {
  const slug = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('partners')
    .insert({
      name: payload.name,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      category: payload.category,
      description: payload.description || null,
      website_url: payload.website_url || null,
      logo_url: payload.logo_url || null,
      is_verified: true,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Partner szervezet létrehozása sikertelen.');
  }

  return data as Partner;
}

export async function updatePartner(id: string, payload: Partial<CreatePartnerPayload & { is_verified?: boolean }>): Promise<Partner> {
  const { data, error } = await supabase
    .from('partners')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Partner szervezet frissítése sikertelen.');
  }

  return data as Partner;
}

export async function deletePartner(id: string): Promise<void> {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Partner szervezet törlése sikertelen.');
  }
}
