import {
  supabase,
  type AdCampaign,
  type ExtendedAdCampaign,
  type ContactPerson,
  type CampaignStatusV2,
  type PaymentStatus,
  type ContractType,
  type PackageTier,
} from '../lib/supabase';

export interface AdPackageConfig {
  id: PackageTier;
  name: string;
  monthlyPriceHuf: number;
  features: string[];
  recommendedPlacement: 'top_banner' | 'sidebar' | 'in_feed';
}

export const AD_PACKAGES: AdPackageConfig[] = [
  {
    id: 'bronze',
    name: 'Bronze Reklámcsomag',
    monthlyPriceHuf: 49000,
    features: ['Oldalsáv banner elhelyezés', 'Havi 5 000 garantált megjelenés', 'Alap partneri profil'],
    recommendedPlacement: 'sidebar',
  },
  {
    id: 'silver',
    name: 'Silver Reklámcsomag',
    monthlyPriceHuf: 99000,
    features: ['Cikkben beágyazott és Eszköz katalógus banner', 'Kiemelt partneri badge', 'Havi 20 000 garantált megjelenés'],
    recommendedPlacement: 'in_feed',
  },
  {
    id: 'gold',
    name: 'Gold Reklámcsomag',
    monthlyPriceHuf: 249000,
    features: ['Főoldali fejléc (Top Banner) exkluzív elhelyezés', 'Szponzorált cikk & Szakmai ajánló', 'Kiemelt partner profil', 'Korlátlan megjelenés'],
    recommendedPlacement: 'top_banner',
  },
];

export interface AdvertisementSlot {
  id: string;
  location: 'top_banner' | 'sidebar' | 'in_feed' | 'footer_banner';
  title: string;
  imageUrl?: string;
  targetUrl?: string;
  sponsorName?: string;
  isPlaceholder: boolean;
}

export interface PartnerHighlight {
  id: string;
  name: string;
  logoUrl?: string;
  description: string;
  websiteUrl?: string;
  category: 'gyarto' | 'kereskedo' | 'iskola' | 'kivitelezo';
}

export interface CreateAdCampaignPayload {
  sponsorName: string;
  placementSlot: 'top_banner' | 'sidebar' | 'in_feed';
  title: string;
  targetUrl?: string;
  bannerImageUrl?: string;

  // v2 Fields
  contactPerson?: ContactPerson;
  packageTier?: PackageTier;
  contractType?: ContractType;
  priceHuf?: number;
  startDate?: string;
  endDate?: string;
  paymentStatus?: PaymentStatus;
  statusV2?: CampaignStatusV2;
}

const DEFAULT_CAMPAIGNS: ExtendedAdCampaign[] = [
  {
    id: 'camp-101',
    sponsor_name: 'Bosch Professional Magyarország',
    placement_slot: 'top_banner',
    title: 'Bosch Akkus Szerszámgépek & Zöld Lézeres Szintezők 2026',
    target_url: 'https://www.bosch-professional.com/hu/hu/',
    banner_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    status_v2: 'active',
    package_tier: 'gold',
    contract_type: 'annual',
    price_huf: 249000,
    payment_status: 'paid',
    contact_person: {
      name: 'Nagy Péter',
      email: 'peter.nagy@hu.bosch.com',
      phone: '+36 30 555 1234',
      role: 'Marketing Vezető',
    },
    start_date: '2026-01-01T00:00:00.000Z',
    end_date: '2026-12-31T23:59:59.000Z',
    impressions_count: 124500,
    clicks_count: 8420,
    created_at: new Date().toISOString(),
    history_logs: [
      { timestamp: '2026-01-01', action: 'Gold Szerződés Aláírva', author: 'Admin' },
      { timestamp: '2026-01-05', action: 'Számla Kiegyenlítve: 249 000 Ft', author: 'Pénzügy' },
    ],
  },
  {
    id: 'camp-102',
    sponsor_name: 'Stanley Black & Decker',
    placement_slot: 'in_feed',
    title: 'Stanley FatMax Kéziszerszámok – Hivatalos Ipari Ajánlat',
    target_url: 'https://www.stanleytools.eu',
    banner_image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    status_v2: 'active',
    package_tier: 'silver',
    contract_type: 'monthly',
    price_huf: 99000,
    payment_status: 'paid',
    contact_person: {
      name: 'Kovács Andrea',
      email: 'andrea.kovacs@stanley.com',
      phone: '+36 20 444 8765',
      role: 'Affiliate Menedzser',
    },
    start_date: '2026-06-01T00:00:00.000Z',
    end_date: '2026-08-31T23:59:59.000Z',
    impressions_count: 42100,
    clicks_count: 3120,
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-103',
    sponsor_name: 'Milwaukee Tool Magyarország',
    placement_slot: 'in_feed',
    title: 'Milwaukee Heavy Duty Fúrókalapácsok & Akkus Gépek',
    target_url: 'https://www.milwaukeetool.eu',
    banner_image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    status_v2: 'renewing',
    package_tier: 'silver',
    contract_type: 'monthly',
    price_huf: 99000,
    payment_status: 'unpaid',
    contact_person: {
      name: 'Tóth Balázs',
      email: 'balazs.toth@milwaukeetool.eu',
      phone: '+36 70 999 4321',
      role: 'Értékesítési Igazgató',
    },
    start_date: '2026-07-01T00:00:00.000Z',
    end_date: '2026-08-15T23:59:59.000Z',
    impressions_count: 28900,
    clicks_count: 1940,
    created_at: new Date().toISOString(),
  },
  {
    id: 'camp-104',
    sponsor_name: 'Cemex Magyarország',
    placement_slot: 'sidebar',
    title: 'Cemex Transzportbeton & Speciális Cementek 2026',
    target_url: 'https://www.cemex.hu',
    banner_image_url: null,
    status: 'active',
    status_v2: 'contracting',
    package_tier: 'bronze',
    contract_type: 'monthly',
    price_huf: 49000,
    payment_status: 'unpaid',
    contact_person: {
      name: 'Szabó Tamás',
      email: 'tamas.szabo@cemex.hu',
      phone: '+36 1 333 9876',
      role: 'Marketing Menedzser',
    },
    start_date: '2026-07-15T00:00:00.000Z',
    end_date: '2026-10-15T23:59:59.000Z',
    impressions_count: 18500,
    clicks_count: 940,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_SLOTS: AdvertisementSlot[] = [
  {
    id: 'ad-top-1',
    location: 'top_banner',
    title: 'Építőipari Szerszám & Alapanyag Kiemelés',
    sponsorName: 'Partneri Hirdetés Helye',
    isPlaceholder: true,
  },
  {
    id: 'ad-sidebar-1',
    location: 'sidebar',
    title: 'Hivatalos Gyártói Támogató',
    sponsorName: 'Partner Kiadvány',
    isPlaceholder: true,
  },
  {
    id: 'ad-feed-1',
    location: 'in_feed',
    title: 'Építkezési Szabványok és Újdonságok 2026',
    sponsorName: 'Szakmai Szponzoráció',
    isPlaceholder: true,
  },
];

const DEFAULT_PARTNERS: PartnerHighlight[] = [
  {
    id: 'partner-1',
    name: 'Holcim Magyarország',
    description: 'Fenntartható kötőanyagok, speciális cementek és betontechnológiák.',
    category: 'gyarto',
    websiteUrl: 'https://www.holcim.hu',
  },
  {
    id: 'partner-2',
    name: 'Wienerberger Téglaipari Zrt.',
    description: 'Innovatív Porotherm falazati rendszerek és Tondach kerámia cserepek.',
    category: 'gyarto',
    websiteUrl: 'https://www.wienerberger.hu',
  },
  {
    id: 'partner-3',
    name: 'BME Építőmérnöki Kar',
    description: 'A jövő építőmérnökeinek, mérnöki tudásbázisának és szakembereinek képzése.',
    category: 'iskola',
    websiteUrl: 'https://www.epito.bme.hu',
  },
];

export async function listAdCampaigns(): Promise<ExtendedAdCampaign[]> {
  try {
    const { data, error } = await supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      // Merge Supabase rows with extended defaults
      const mapped = data.map((item) => {
        const match = DEFAULT_CAMPAIGNS.find((c) => c.id === item.id);
        return {
          ...match,
          ...item,
          status_v2: match?.status_v2 || (item.status === 'active' ? 'active' : 'cancelled'),
          price_huf: match?.price_huf || 99000,
          payment_status: match?.payment_status || 'paid',
          package_tier: match?.package_tier || 'silver',
          contract_type: match?.contract_type || 'monthly',
          contact_person: match?.contact_person || {
            name: 'Kapcsolattartó',
            email: 'marketing@partner.hu',
            phone: '+36 30 123 4567',
          },
        } as ExtendedAdCampaign;
      });
      return mapped;
    }
  } catch (err) {
    void err;
  }
  return DEFAULT_CAMPAIGNS;
}

export async function createAdCampaign(payload: CreateAdCampaignPayload): Promise<ExtendedAdCampaign> {
  const newCampaign: ExtendedAdCampaign = {
    id: `camp-${Date.now()}`,
    sponsor_name: payload.sponsorName,
    placement_slot: payload.placementSlot,
    title: payload.title,
    target_url: payload.targetUrl || null,
    banner_image_url: payload.bannerImageUrl || null,
    status: payload.statusV2 === 'active' ? 'active' : 'paused',
    status_v2: payload.statusV2 || 'active',
    package_tier: payload.packageTier || 'silver',
    contract_type: payload.contractType || 'monthly',
    price_huf: payload.priceHuf || 99000,
    payment_status: payload.paymentStatus || 'paid',
    contact_person: payload.contactPerson || {
      name: 'Kapcsolattartó Menedzser',
      email: 'contact@partner.hu',
      phone: '+36 30 000 0000',
    },
    start_date: payload.startDate || new Date().toISOString(),
    end_date: payload.endDate || null,
    impressions_count: 0,
    clicks_count: 0,
    created_at: new Date().toISOString(),
    history_logs: [
      { timestamp: new Date().toLocaleDateString('hu-HU'), action: 'Új kampány létrehozva', author: 'Admin' },
    ],
  };

  try {
    const { data, error } = await supabase
      .from('ad_campaigns')
      .insert([
        {
          sponsor_name: payload.sponsorName,
          placement_slot: payload.placementSlot,
          title: payload.title,
          target_url: payload.targetUrl,
          banner_image_url: payload.bannerImageUrl,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      return {
        ...newCampaign,
        ...data,
      };
    }
  } catch (err) {
    void err;
  }

  DEFAULT_CAMPAIGNS.unshift(newCampaign);
  return newCampaign;
}

export async function toggleCampaignStatus(id: string, newStatus: string): Promise<void> {
  const index = DEFAULT_CAMPAIGNS.findIndex((c) => c.id === id);
  if (index !== -1) {
    DEFAULT_CAMPAIGNS[index].status = newStatus;
    DEFAULT_CAMPAIGNS[index].status_v2 = newStatus === 'active' ? 'active' : 'cancelled';
  }

  try {
    await supabase.from('ad_campaigns').update({ status: newStatus }).eq('id', id);
  } catch (err) {
    void err;
  }
}

export async function updateCampaignStatusV2(id: string, newStatusV2: CampaignStatusV2): Promise<void> {
  const index = DEFAULT_CAMPAIGNS.findIndex((c) => c.id === id);
  if (index !== -1) {
    DEFAULT_CAMPAIGNS[index].status_v2 = newStatusV2;
    DEFAULT_CAMPAIGNS[index].status = newStatusV2 === 'active' ? 'active' : 'paused';
  }
}

export async function updatePaymentStatus(id: string, newPaymentStatus: PaymentStatus): Promise<void> {
  const index = DEFAULT_CAMPAIGNS.findIndex((c) => c.id === id);
  if (index !== -1) {
    DEFAULT_CAMPAIGNS[index].payment_status = newPaymentStatus;
  }
}

export async function recordAdImpression(id: string): Promise<void> {
  const index = DEFAULT_CAMPAIGNS.findIndex((c) => c.id === id);
  if (index !== -1) {
    DEFAULT_CAMPAIGNS[index].impressions_count += 1;
  }
}

export async function recordAdClick(id: string): Promise<void> {
  const index = DEFAULT_CAMPAIGNS.findIndex((c) => c.id === id);
  if (index !== -1) {
    DEFAULT_CAMPAIGNS[index].clicks_count += 1;
  }
}

export async function getAdvertisementSlots(
  location?: AdvertisementSlot['location']
): Promise<AdvertisementSlot[]> {
  const campaigns = await listAdCampaigns();
  const activeCampaigns = campaigns.filter((c) => c.status === 'active');

  const slotsFromCampaigns: AdvertisementSlot[] = activeCampaigns.map((c) => ({
    id: c.id,
    location: (c.placement_slot as AdvertisementSlot['location']) || 'top_banner',
    title: c.title,
    imageUrl: c.banner_image_url || undefined,
    targetUrl: c.target_url || undefined,
    sponsorName: c.sponsor_name,
    isPlaceholder: false,
  }));

  const all = [...slotsFromCampaigns, ...DEFAULT_SLOTS];

  if (location) {
    return all.filter((slot) => slot.location === location);
  }
  return all;
}

export async function getPartnerHighlights(): Promise<PartnerHighlight[]> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);
    if (!error && data && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        category: (item.category as PartnerHighlight['category']) || 'gyarto',
        websiteUrl: item.website_url || undefined,
        logoUrl: item.logo_url || undefined,
      }));
    }
  } catch (err) {
    void err;
  }
  return DEFAULT_PARTNERS;
}

export async function getAdsForTool(_toolId?: string, category?: string): Promise<AdCampaign[]> {
  try {
    const campaigns = await listAdCampaigns();
    if (campaigns && campaigns.length > 0) return campaigns;
  } catch (err) {
    void err;
  }

  if (category === 'Kéziszerszámok') {
    return DEFAULT_CAMPAIGNS.filter((c) => c.id === 'camp-3');
  }
  if (category === 'Gépek és kisgépek') {
    return DEFAULT_CAMPAIGNS.filter((c) => c.id === 'camp-4');
  }
  if (category === 'Mérőeszközök') {
    return DEFAULT_CAMPAIGNS.filter((c) => c.id === 'camp-5');
  }

  return DEFAULT_CAMPAIGNS;
}

