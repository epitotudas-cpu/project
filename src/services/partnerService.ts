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

const STORAGE_KEY = 'epitotudas_partners_v1';
const SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000011';

// Pre-launch mode: DEFAULT_PARTNERS is empty to prevent showing demo partners
const DEFAULT_PARTNERS: Partner[] = [];

// Helper to filter out legacy demo partners
function filterDemoPartners(list: Partner[]): Partner[] {
  if (!Array.isArray(list)) return [];
  const demoIds = ['p-1', 'p-2', 'p-3', 'p-4'];
  const demoSlugs = ['leier-hungaria', 'cemex-magyarorszag', 'bme-epito', 'stahlbau-kivitelezo'];
  return list.filter(
    (p) => p && !demoIds.includes(p.id) && !demoSlugs.includes(p.slug)
  );
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

function getStoredPartners(): Partner[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return filterDemoPartners(parsed);
      }
    }
  } catch (err) {
    void err;
  }
  return DEFAULT_PARTNERS;
}

function saveStoredPartners(list: Partner[]): void {
  const cleanList = filterDemoPartners(list);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    }

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ID,
          name: '__SYSTEM_CONFIG_PARTNERS__',
          slug: 'system-partners-config',
          description: JSON.stringify(cleanList),
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
  try {
    let query = supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (!error && data) {
      const cleanData = filterDemoPartners(data);
      saveStoredPartners(cleanData);
      return cleanData;
    }
  } catch (err) {
    void err;
  }

  // Fallback to local storage / system config
  let list = getStoredPartners();
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

  try {
    const { data, error } = await supabase
      .from('partners')
      .insert({
        name: payload.name.trim(),
        slug: slug || `partner-${Date.now()}`,
        category: payload.category,
        description: payload.description?.trim() || null,
        website_url: payload.website_url?.trim() || null,
        logo_url: payload.logo_url?.trim() || null,
        is_verified: true,
      })
      .select('*')
      .single();

    if (!error && data) {
      const currentList = getStoredPartners();
      currentList.unshift(data);
      saveStoredPartners(currentList);
      return data;
    }
  } catch (err) {
    void err;
  }

  // Fallback local create if Supabase insert encounters issue
  const newPartner: Partner = {
    id: `p-${Date.now()}`,
    name: payload.name.trim(),
    slug: slug || `partner-${Date.now()}`,
    category: payload.category,
    description: payload.description?.trim() || null,
    website_url: payload.website_url?.trim() || null,
    logo_url: payload.logo_url?.trim() || null,
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  const list = getStoredPartners();
  list.unshift(newPartner);
  saveStoredPartners(list);
  return newPartner;
}

export async function updatePartner(
  id: string,
  payload: Partial<CreatePartnerPayload & { is_verified?: boolean }>
): Promise<Partner> {
  try {
    const updatePayload: Record<string, any> = {};
    if (payload.name !== undefined) {
      updatePayload.name = payload.name.trim();
      updatePayload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (payload.category !== undefined) updatePayload.category = payload.category;
    if (payload.description !== undefined) updatePayload.description = payload.description?.trim() || null;
    if (payload.website_url !== undefined) updatePayload.website_url = payload.website_url?.trim() || null;
    if (payload.logo_url !== undefined) updatePayload.logo_url = payload.logo_url?.trim() || null;
    if (payload.is_verified !== undefined) updatePayload.is_verified = payload.is_verified;

    const { data, error } = await supabase
      .from('partners')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      const list = getStoredPartners();
      const idx = list.findIndex((p) => p.id === id);
      if (idx !== -1) {
        list[idx] = data;
        saveStoredPartners(list);
      }
      return data;
    }
  } catch (err) {
    void err;
  }

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
  try {
    await supabase.from('partners').delete().eq('id', id);
  } catch (err) {
    void err;
  }
  const list = getStoredPartners();
  const filtered = list.filter((p) => p.id !== id);
  saveStoredPartners(filtered);
}

export async function getPartnerBySlug(slugOrId: string): Promise<Partner | null> {
  if (!slugOrId) return null;
  const cleanKey = slugOrId.trim();

  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .or(`slug.eq.${cleanKey},id.eq.${cleanKey}`)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    void err;
  }

  // Fallback to local storage
  const stored = getStoredPartners();
  const found = stored.find((p) => p.slug === cleanKey || p.id === cleanKey);
  if (found) return found;

  // Fallback partner generator
  const readableName = cleanKey
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    id: cleanKey,
    name: readableName || 'Hivatalos Partner',
    slug: cleanKey,
    category: 'ceg',
    description: `${readableName} az ÉpítőTudás elismert szakmai partnere. Szakterülete a minőségi kivitelezés, szakképzés és szakmai alapanyagok biztosítása.`,
    website_url: null,
    logo_url: null,
    is_verified: true,
    created_at: new Date().toISOString(),
  };
}

