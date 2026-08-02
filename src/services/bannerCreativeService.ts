import { supabase, type AdCreative } from '../lib/supabase';

const CREATIVES_STORAGE_KEY = 'epitotudas_ad_creatives_v1';

export const DEFAULT_AD_CREATIVES: AdCreative[] = [
  {
    id: 'creative-top-banner-bosch',
    placement_key: 'top_banner',
    partner_name: 'Bosch Professional Magyarország',
    badge_text: 'Hivatalos Partner',
    headline: 'Bosch Akkus Szerszámgépek & Zöld Lézeres Szintezők 2026',
    description: 'Fedezd fel a prémium ipari szerszámokat és precíziós szintezőket.',
    cta_text: 'Ajánlat megtekintése',
    cta_url: 'https://www.bosch-professional.com/hu/hu/',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    background_style: 'light_neutral',
    overlay_style: 'none',
    button_style: 'petrol_teal',
    text_align: 'left',
    animation_type: 'pulse',
    transition_effect: 'slide_left',
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
    partner_name: 'DeWalt Ipari Szerszámgépek',
    badge_text: 'Kiemelt Akció',
    headline: 'DeWalt 54V XR FLEXVOLT Akkus Gépek & Akciók 2026',
    description: 'Extrém teljesítményű akkus gépek a legkeményebb építési munkákhoz.',
    cta_text: 'Felfedezem az Ajánlatot',
    cta_url: 'https://www.dewalt.hu',
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
    background_style: 'dark_slate',
    overlay_style: 'none',
    button_style: 'amber_gold',
    text_align: 'left',
    animation_type: 'float',
    transition_effect: 'fade',
    rotation_seconds: 5,
    is_active: true,
    starts_at: '2026-01-01T00:00:00.000Z',
    ends_at: null,
    sort_order: 2,
    created_by: 'Admin',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'creative-in-feed-stanley',
    placement_key: 'in_feed',
    partner_name: 'Stanley Black & Decker',
    badge_text: 'Kiemelt Ajánlat',
    headline: 'Stanley FatMax Kéziszerszámok – Hivatalos Ipari Ajánlat',
    description: 'Prémium minőségű ipari kéziszerszámok és méréstechnika professzionális kivitelezőknek.',
    cta_text: 'Felfedezem',
    cta_url: 'https://www.stanleytools.eu',
    image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=400&q=80',
    background_style: 'dark_slate',
    overlay_style: 'soft_dark',
    button_style: 'amber_gold',
    text_align: 'left',
    animation_type: 'float',
    transition_effect: 'zoom',
    rotation_seconds: 6,
    is_active: true,
    starts_at: '2026-01-01T00:00:00.000Z',
    ends_at: null,
    sort_order: 1,
    created_by: 'Admin',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'creative-sidebar-makita',
    placement_key: 'sidebar',
    partner_name: 'Makita Magyarország',
    badge_text: 'Kiemelt Partner',
    headline: 'Makita 18V LXT & 40V max XGT Ipari Szerszámok',
    description: 'Akkumulátoros szerszámgépek szakemberek számára a legkeményebb körülményekre.',
    cta_text: 'Katalógus',
    cta_url: 'https://www.makita.hu',
    image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=400&q=80',
    background_style: 'petrol_teal',
    overlay_style: 'none',
    button_style: 'amber_gold',
    text_align: 'left',
    animation_type: 'pulse',
    transition_effect: 'slide_up',
    rotation_seconds: 5,
    is_active: true,
    starts_at: '2026-01-01T00:00:00.000Z',
    ends_at: null,
    sort_order: 1,
    created_by: 'Admin',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'creative-footer-knauf',
    placement_key: 'footer_banner',
    partner_name: 'Knauf Építőipari Rendszerek',
    badge_text: 'Rendszergarancia',
    headline: 'Knauf Gipszkarton & Szigetelési Rendszerek 2026',
    description: 'Energiahatékony szárazépítészeti és hőszigetelési rendszerek profi kivitelezőknek.',
    cta_text: 'Rendszerek Megtekintése',
    cta_url: 'https://www.knauf.hu',
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    mobile_image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80',
    background_style: 'soft_gradient',
    overlay_style: 'none',
    button_style: 'petrol_teal',
    text_align: 'left',
    animation_type: 'fade_in',
    transition_effect: 'fade',
    rotation_seconds: 7,
    is_active: true,
    starts_at: '2026-01-01T00:00:00.000Z',
    ends_at: null,
    sort_order: 1,
    created_by: 'Admin',
    updated_at: new Date().toISOString(),
  },
];

export function getStoredCreatives(): AdCreative[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CREATIVES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba a kreatívok olvasásakor:', err);
  }
  return DEFAULT_AD_CREATIVES;
}

export function saveStoredCreatives(creatives: AdCreative[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CREATIVES_STORAGE_KEY, JSON.stringify(creatives));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ad-creative-changed'));
    }
  } catch (err) {
    console.error('Hiba a kreatívok mentésekor:', err);
  }
}

export async function listBannerCreatives(): Promise<AdCreative[]> {
  try {
    const { data, error } = await supabase
      .from('ad_creatives')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const stored = getStoredCreatives();
      const mapped: AdCreative[] = data.map((item) => {
        const match = stored.find((c) => c.id === item.id) || DEFAULT_AD_CREATIVES.find((c) => c.id === item.id);
        return {
          ...match,
          ...item,
        } as AdCreative;
      });
      saveStoredCreatives(mapped);
      return mapped;
    }
  } catch (err) {
    void err;
  }
  return getStoredCreatives();
}

export function getCreativesByPlacementSync(placementKey: AdCreative['placement_key']): AdCreative[] {
  const creatives = getStoredCreatives();
  const matches = creatives
    .filter((c) => c.placement_key === placementKey && c.is_active)
    .sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1));

  if (matches.length > 0) return matches;

  const defaultMatch = DEFAULT_AD_CREATIVES
    .filter((c) => c.placement_key === placementKey && c.is_active)
    .sort((a, b) => (a.sort_order || 1) - (b.sort_order || 1));

  return defaultMatch;
}

export function getCreativeByPlacementSync(placementKey: AdCreative['placement_key']): AdCreative | null {
  const list = getCreativesByPlacementSync(placementKey);
  return list.length > 0 ? list[0] : null;
}

export async function saveBannerCreative(creative: AdCreative): Promise<AdCreative> {
  const current = getStoredCreatives();
  // Match ONLY by unique id to prevent overwriting other creatives of the same placement!
  const index = current.findIndex((c) => c.id === creative.id);

  const updatedCreative: AdCreative = {
    ...creative,
    updated_at: new Date().toISOString(),
  };

  if (index !== -1) {
    current[index] = updatedCreative;
  } else {
    current.push(updatedCreative);
  }

  saveStoredCreatives(current);

  try {
    await supabase.from('ad_creatives').upsert([updatedCreative]);
  } catch (err) {
    void err;
  }

  return updatedCreative;
}

export function resetCreativeToDefaults(placementKey: AdCreative['placement_key']): AdCreative {
  const defaultItems = DEFAULT_AD_CREATIVES.filter((c) => c.placement_key === placementKey);
  const defaultItem = defaultItems[0] || DEFAULT_AD_CREATIVES[0];
  
  const current = getStoredCreatives();
  const index = current.findIndex((c) => c.id === defaultItem.id || c.placement_key === placementKey);

  const resetItem = { ...defaultItem, updated_at: new Date().toISOString() };

  if (index !== -1) {
    current[index] = resetItem;
  } else {
    current.push(resetItem);
  }

  saveStoredCreatives(current);
  return resetItem;
}
