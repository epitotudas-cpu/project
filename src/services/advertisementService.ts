import { readAppConfig, writeAppConfig } from './appConfigService';
import type {
  ExtendedAdCampaign,
  ContactPerson,
  CampaignStatusV2,
  PaymentStatus,
  ContractType,
  PackageTier,
} from '../lib/supabase';
import { logAuditAction } from './auditLogService';
import { listPartners } from './partnerService';
import { INITIAL_MANAGED_PACKAGES } from './adPackageService';

export interface AdPackageConfig {
  id: PackageTier;
  name: string;
  monthlyPriceHuf: number;
  features: string[];
  recommendedPlacement: 'top_banner' | 'sidebar' | 'in_feed';
}

const PACKAGE_RECOMMENDED_PLACEMENT: Record<PackageTier, 'top_banner' | 'sidebar' | 'in_feed'> = {
  bronze: 'sidebar',
  silver: 'in_feed',
  gold: 'top_banner',
  custom: 'sidebar',
};

export const AD_PACKAGES: AdPackageConfig[] = (['bronze', 'silver', 'gold'] as PackageTier[]).map((tier) => {
  const pkg = INITIAL_MANAGED_PACKAGES.find((p) => p.id === `pkg-${tier}`);
  return {
    id: tier,
    name: pkg?.name || `${tier.charAt(0).toUpperCase()}${tier.slice(1)} Reklámcsomag`,
    monthlyPriceHuf: pkg?.price_huf ?? (tier === 'bronze' ? 49000 : tier === 'silver' ? 99000 : 249000),
    features: pkg?.features || [],
    recommendedPlacement: PACKAGE_RECOMMENDED_PLACEMENT[tier],
  };
});

export interface AdvertisementSlot {
  id: string;
  location: 'top_banner' | 'sidebar' | 'in_feed' | 'footer_banner';
  title: string;
  imageUrl?: string;
  targetUrl?: string;
  sponsorName: string;
  isPlaceholder?: boolean;
}

export interface PartnerHighlight {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  description: string;
  category: string;
  websiteUrl?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
}

export interface CreateAdCampaignPayload {
  sponsorName: string;
  placementSlot: string;
  title: string;
  targetUrl?: string;
  bannerImageUrl?: string;
  packageTier?: PackageTier;
  contractType?: ContractType;
  priceHuf?: number;
  paymentStatus?: PaymentStatus;
  statusV2?: CampaignStatusV2;
  contactPerson?: ContactPerson;
  startDate?: string;
  endDate?: string;
}

const DEFAULT_CAMPAIGNS: ExtendedAdCampaign[] = [
  {
    id: 'camp-102',
    sponsor_name: 'BOSCH Professional',
    placement_slot: 'sidebar',
    title: 'Bosch Professional Zöld Lézeres Szintezők',
    target_url: 'https://www.bosch-professional.com',
    banner_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    status_v2: 'pending_payment',
    package_tier: 'silver',
    contract_type: 'monthly',
    price_huf: 99000,
    payment_status: 'partially_paid',
    contact_person: {
      name: 'Kovács Andrea',
      email: 'andrea.kovacs@bosch.hu',
      phone: '+36 1 432 5678',
      role: 'Brand Menedzser',
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
];

const STORAGE_KEY_CAMPAIGNS = 'epitotudas_ad_campaigns_v2';
const SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000015';

export function getStoredCampaigns(): ExtendedAdCampaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((c) => c.id !== 'camp-101' && !c.sponsor_name?.includes('Leier'));
      }
    }
  } catch (err) {
    console.error('Hiba a kampányok olvasásakor:', err);
  }
  return DEFAULT_CAMPAIGNS.filter((c) => c.id !== 'camp-101');
}

export function saveStoredCampaigns(campaigns: ExtendedAdCampaign[]): void {
  try {
    const sanitized = campaigns.filter((c) => c.id !== 'camp-101' && !c.sponsor_name?.includes('Leier'));
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(sanitized));
    window.dispatchEvent(new Event('ad-campaigns-changed'));

    void writeAppConfig('__SYSTEM_CONFIG_AD_CAMPAIGNS__', sanitized, {
      id: SUPABASE_SYSTEM_ID,
      slug: 'system-ad-campaigns-config',
    }).catch((err) => {
      console.warn('Supabase ad campaigns cloud sync error:', err);
    });
  } catch (err) {
    console.error('Hiba a kampányok mentésekor:', err);
  }
}

export async function listAdCampaigns(): Promise<ExtendedAdCampaign[]> {
  let list = getStoredCampaigns();

  try {
    const cloudList = await readAppConfig<ExtendedAdCampaign[]>(
      '__SYSTEM_CONFIG_AD_CAMPAIGNS__',
      SUPABASE_SYSTEM_ID
    );
    if (Array.isArray(cloudList)) {
      list = cloudList.filter((c: ExtendedAdCampaign) => c.id !== 'camp-101' && !c.sponsor_name?.includes('Leier'));
      try { localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(list)); } catch { /* ignore */ }
    }
  } catch (err) {
    void err;
  }

  return list;
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

  const campaigns = getStoredCampaigns();
  campaigns.unshift(newCampaign);
  saveStoredCampaigns(campaigns);

  void logAuditAction(
    'AD_CAMPAIGN_CREATE',
    'ads',
    `Új hirdetési kampány hozva létre: "${newCampaign.title}" (Szponzor: ${newCampaign.sponsor_name})`
  );

  return newCampaign;
}

export async function updateAdCampaign(id: string, updates: Partial<ExtendedAdCampaign>): Promise<ExtendedAdCampaign> {
  const campaigns = getStoredCampaigns();
  const index = campaigns.findIndex((c) => c.id === id);

  if (index !== -1) {
    campaigns[index] = {
      ...campaigns[index],
      ...updates,
    };
    saveStoredCampaigns(campaigns);

    void logAuditAction(
      'AD_CAMPAIGN_UPDATE',
      'ads',
      `Hirdetési kampány frissítve: "${campaigns[index].title}" (ID: ${id})`
    );

    return campaigns[index];
  }

  throw new Error('Kampány nem található');
}

export async function updateCampaignStatusV2(id: string, statusV2: CampaignStatusV2): Promise<ExtendedAdCampaign> {
  return updateAdCampaign(id, { status_v2: statusV2, status: statusV2 === 'active' ? 'active' : 'paused' });
}

export async function updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<ExtendedAdCampaign> {
  return updateAdCampaign(id, { payment_status: paymentStatus });
}

export async function deleteAdCampaign(id: string): Promise<void> {
  const campaigns = getStoredCampaigns().filter((c) => c.id !== id);
  saveStoredCampaigns(campaigns);

  void logAuditAction(
    'AD_CAMPAIGN_DELETE',
    'ads',
    `Hirdetési kampány törölve (ID: ${id})`
  );
}

export async function getAdvertisementSlots(): Promise<AdvertisementSlot[]> {
  const campaigns = await listAdCampaigns();
  return campaigns.map((c) => ({
    id: c.id,
    location: (c.placement_slot as AdvertisementSlot['location']) || 'top_banner',
    title: c.title,
    imageUrl: c.banner_image_url || undefined,
    targetUrl: c.target_url || undefined,
    sponsorName: c.sponsor_name,
  }));
}

export async function getAdsForTool(_toolId?: string, _category?: string): Promise<Awaited<ReturnType<typeof listAdCampaigns>>> {
  void _toolId;
  void _category;
  return listAdCampaigns();
}

export async function getActiveAdForSlot(slot: 'top_banner' | 'sidebar' | 'in_feed' | 'footer_banner'): Promise<AdvertisementSlot | null> {
  const campaigns = await listAdCampaigns();
  const active = campaigns.filter((c) => c.placement_slot === slot && (c.status === 'active' || c.status_v2 === 'active'));

  if (active.length > 0) {
    const selected = active[Math.floor(Math.random() * active.length)];
    return {
      id: selected.id,
      location: slot,
      title: selected.title,
      imageUrl: selected.banner_image_url || undefined,
      targetUrl: selected.target_url || undefined,
      sponsorName: selected.sponsor_name,
    };
  }

  return null;
}

export async function recordAdImpression(campaignId: string): Promise<void> {
  const campaigns = getStoredCampaigns();
  const index = campaigns.findIndex((c) => c.id === campaignId);
  if (index !== -1) {
    campaigns[index].impressions_count = (campaigns[index].impressions_count || 0) + 1;
    saveStoredCampaigns(campaigns);
  }
}

export async function recordAdClick(campaignId: string): Promise<void> {
  const campaigns = getStoredCampaigns();
  const index = campaigns.findIndex((c) => c.id === campaignId);
  if (index !== -1) {
    campaigns[index].clicks_count = (campaigns[index].clicks_count || 0) + 1;
    saveStoredCampaigns(campaigns);
  }
}

export async function getPartnerHighlights(): Promise<PartnerHighlight[]> {
  try {
    const allPartners = await listPartners();
    const active = allPartners.filter((p) => p.status !== 'inactive' && p.status !== 'draft');

    // Sort: Featured partners first, then verified, then newest
    const sorted = [...active].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      if (a.is_verified && !b.is_verified) return -1;
      if (!a.is_verified && b.is_verified) return 1;
      return 0;
    });

    const selected = sorted.slice(0, 6);

    return selected.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      logoUrl: p.logo_url || undefined,
      description: p.description || p.detailed_description || 'Minősített szakmai partner szervezet.',
      category: p.category,
      websiteUrl: p.website_url || undefined,
      isVerified: p.is_verified,
      isFeatured: p.is_featured,
    }));
  } catch (err) {
    console.error('Hiba a kiemelt partnerek betöltésekor:', err);
    return [];
  }
}
