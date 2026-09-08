import { supabase, type AdCreative } from '../lib/supabase';

const CREATIVES_STORAGE_KEY = 'epitotudas_ad_creatives_v1';
const SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000013';

export const DEFAULT_AD_CREATIVES: AdCreative[] = [
  {
    id: 'creative-top-banner-bosch',
    placement_key: 'top_banner',
    partner_name: 'Bosch Professional',
    badge_text: 'Hivatalos partner',
    headline: 'Akkus szerszámgépek professzionális kivitelezéshez',
    description: 'Ismerd meg a Bosch Professional 18V rendszerének építőipari megoldásait.',
    cta_text: 'Ajánlat megtekintése',
    cta_url: 'https://www.bosch-professional.com/hu/hu/',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    media_type: 'image',
    accent_color: '#005691',
    background_style: 'light_neutral',
    overlay_style: 'none',
    button_style: 'amber_gold',
    text_align: 'left',
    animation_type: 'none',
    transition_effect: 'fade',
    rotation_seconds: 6,
    is_active: true,
    starts_at: '2026-01-01T00:00:00.000Z',
    ends_at: null,
    sort_order: 1,
    created_by: 'Admin',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'creative-top-banner-dewalt',
    placement_key: 'top_banner',
    partner_name: 'DeWalt Ipari Szerszámok',
    badge_text: 'Szponzorált ajánlat',
    headline: 'DeWalt 54V XR FLEXVOLT Akkus Szerszámgépek 2026',
    description: 'Extrém teljesítményű akkus gépek a legkeményebb építőipari feladatokhoz.',
    cta_text: 'További részletek',
    cta_url: 'https://www.dewalt.hu',
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
    media_type: 'image',
    accent_color: '#FEB800',
    background_style: 'dark_slate',
    overlay_style: 'none',
    button_style: 'amber_gold',
    text_align: 'left',
    animation_type: 'none',
    transition_effect: 'fade',
    rotation_seconds: 6,
    is_active: true,
    starts_at: '2026-01-01T00:00:00.000Z',
    ends_at: null,
    sort_order: 2,
    created_by: 'Admin',
    updated_at: new Date().toISOString(),
  },
];

export function getStoredCreatives(): AdCreative[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CREATIVES_STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((c) => c.id !== 'creative-top-banner-leier' && !c.partner_name?.includes('Leier'));
        }
      } else {
        localStorage.setItem(CREATIVES_STORAGE_KEY, JSON.stringify(DEFAULT_AD_CREATIVES));
        return DEFAULT_AD_CREATIVES;
      }
    }
  } catch (err) {
    console.error('Hiba a kreatívok olvasásakor:', err);
  }
  return DEFAULT_AD_CREATIVES.filter((c) => c.id !== 'creative-top-banner-leier');
}

export function saveStoredCreatives(creatives: AdCreative[]): void {
  try {
    const sanitized = creatives.filter((c) => c.id !== 'creative-top-banner-leier' && !c.partner_name?.includes('Leier'));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CREATIVES_STORAGE_KEY, JSON.stringify(sanitized));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ad-creative-changed'));
    }

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ID,
          name: '__SYSTEM_CONFIG_AD_CREATIVES__',
          slug: 'system-ad-creatives-config',
          description: JSON.stringify(sanitized),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        void err;
      }
    })();
  } catch (err) {
    console.error('Hiba a kreatívok mentésekor:', err);
  }
}

export async function listBannerCreatives(): Promise<AdCreative[]> {
  let list = getStoredCreatives();

  try {
    const { data } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_SYSTEM_ID)
      .maybeSingle();

    if (data?.description && data.description.startsWith('[')) {
      const cloudList = JSON.parse(data.description);
      if (Array.isArray(cloudList)) {
        list = cloudList.filter((c: AdCreative) => c.id !== 'creative-top-banner-leier' && !c.partner_name?.includes('Leier'));
        try { localStorage.setItem(CREATIVES_STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
      }
    }
  } catch (err) {
    void err;
  }

  return list;
}

export async function createBannerCreative(payload: Partial<AdCreative>): Promise<AdCreative> {
  const creatives = getStoredCreatives();
  const newCreative: AdCreative = {
    id: `creative-${Date.now()}`,
    placement_key: payload.placement_key || 'top_banner',
    partner_name: payload.partner_name || 'Új Partner',
    badge_text: payload.badge_text || 'Ajánlat',
    headline: payload.headline || 'Új Banner Cím',
    description: payload.description || '',
    cta_text: payload.cta_text || 'Megtekintem',
    cta_url: payload.cta_url || '#',
    image_url: payload.image_url || null,
    mobile_image_url: payload.mobile_image_url || null,
    background_style: payload.background_style || 'light_neutral',
    overlay_style: payload.overlay_style || 'none',
    button_style: payload.button_style || 'petrol_teal',
    text_align: payload.text_align || 'left',
    animation_type: payload.animation_type || 'none',
    transition_effect: payload.transition_effect || 'fade',
    rotation_seconds: payload.rotation_seconds || 5,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    starts_at: payload.starts_at || new Date().toISOString(),
    ends_at: payload.ends_at || null,
    sort_order: payload.sort_order || creatives.length + 1,
    created_by: 'Admin',
    updated_at: new Date().toISOString(),
  };

  creatives.push(newCreative);
  saveStoredCreatives(creatives);
  return newCreative;
}

export async function updateBannerCreative(id: string, updates: Partial<AdCreative>): Promise<AdCreative> {
  const creatives = getStoredCreatives();
  const index = creatives.findIndex((c) => c.id === id);

  if (index !== -1) {
    creatives[index] = {
      ...creatives[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveStoredCreatives(creatives);
    return creatives[index];
  }

  throw new Error('Kreatív nem található');
}

export async function saveBannerCreative(creative: Partial<AdCreative>): Promise<AdCreative> {
  if (creative.id) {
    return updateBannerCreative(creative.id, creative);
  }
  return createBannerCreative(creative);
}

export function resetCreativeToDefaults(placementKey?: string): AdCreative {
  saveStoredCreatives(DEFAULT_AD_CREATIVES);
  if (placementKey) {
    return DEFAULT_AD_CREATIVES.find((c) => c.placement_key === placementKey) || DEFAULT_AD_CREATIVES[0];
  }
  return DEFAULT_AD_CREATIVES[0];
}

export function getCreativesByPlacementSync(placementKey: string): AdCreative[] {
  const creatives = getStoredCreatives();
  return creatives.filter((c) => c.placement_key === placementKey && c.is_active);
}

export async function deleteBannerCreative(id: string): Promise<void> {
  const creatives = getStoredCreatives();
  const filtered = creatives.filter((c) => c.id !== id);
  saveStoredCreatives(filtered);
}
