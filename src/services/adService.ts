import {
  type ExtendedAdCampaign,
  type Advertiser,
  type AdPlacement,
  type AdPayment,
  type AdNotification,
} from '../lib/supabase';
import { getStoredCreatives } from './bannerCreativeService';

const STORAGE_KEY_ADVERTISERS = 'epitotudas_advertisers_v1';
const STORAGE_KEY_PLACEMENTS = 'epitotudas_ad_placements_v1';
const STORAGE_KEY_PAYMENTS = 'epitotudas_ad_payments_v1';
const STORAGE_KEY_NOTIFICATIONS = 'epitotudas_ad_notifications_v1';

export const DEFAULT_ADVERTISERS: Advertiser[] = [
  {
    id: 'adv-leier',
    name: 'Leier Hungária Kft.',
    logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=300&q=80',
    contactName: 'Nagy Gábor',
    contactEmail: 'gabor.nagy@leier.hu',
    contactPhone: '+36 96 555 123',
    contactRole: 'Marketing Igazgató',
    category: 'gyarto',
    websiteUrl: 'https://www.leier.hu',
    notes: 'Kiemelt stratégiai gyártó partner. Éves szerződés aktív.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'adv-bosch',
    name: 'Bosch Professional Magyarország',
    logoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80',
    contactName: 'Kovács Andrea',
    contactEmail: 'andrea.kovacs@bosch.hu',
    contactPhone: '+36 1 432 5678',
    contactRole: 'Brand Menedzser',
    category: 'gyarto',
    websiteUrl: 'https://www.bosch-professional.com/hu/hu/',
    notes: 'Szerszámgép & lézeres szintező akciók.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'adv-milwaukee',
    name: 'Milwaukee Tool Magyarország',
    logoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80',
    contactName: 'Tóth Balázs',
    contactEmail: 'balazs.toth@milwaukeetool.eu',
    contactPhone: '+36 70 999 4321',
    contactRole: 'Értékesítési Igazgató',
    category: 'gyarto',
    websiteUrl: 'https://www.milwaukeetool.eu',
    notes: 'Akkus fúrókalapácsok & Heavy Duty gépek.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'adv-knauf',
    name: 'Knauf Gipszkarton Kft.',
    logoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80',
    contactName: 'Szabó Péter',
    contactEmail: 'peter.szabo@knauf.hu',
    contactPhone: '+36 1 234 5678',
    contactRole: 'Termék Menedzser',
    category: 'gyarto',
    websiteUrl: 'https://www.knauf.hu',
    notes: 'Szárazépítészeti & gipszkarton rendszerek.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_PLACEMENTS: AdPlacement[] = [
  {
    id: 'place-top-banner',
    placementKey: 'top_banner',
    name: 'Főoldali Fejléc (Top Banner)',
    description: 'Exkluzív kiemelt sáv a főoldal és a portál tetején.',
    desktopDimensions: '1200 × 300 px',
    mobileDimensions: '400 × 250 px',
    maxFileSizeKb: 5000,
    allowedFormats: ['PNG', 'WebP', 'SVG', 'GIF', 'MP4'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'place-home-in-feed',
    placementKey: 'home_in_feed',
    name: 'Főoldali Köztes Banner (In-Feed)',
    description: 'A főoldali cikkek és kategóriák közötti kiemelt szponzorált kártya.',
    desktopDimensions: '970 × 250 px',
    mobileDimensions: '360 × 200 px',
    maxFileSizeKb: 3000,
    allowedFormats: ['PNG', 'WebP', 'SVG'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'place-article-top',
    placementKey: 'article_top',
    name: 'Cikkoldali Felső Banner',
    description: 'A cikkek fejléce alatti kiemelt reklámhely.',
    desktopDimensions: '800 × 200 px',
    mobileDimensions: '360 × 180 px',
    maxFileSizeKb: 3000,
    allowedFormats: ['PNG', 'WebP', 'SVG'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'place-article-in-feed',
    placementKey: 'article_in_feed',
    name: 'Cikkoldali Köztes Banner',
    description: 'Szakmai cikkek bekezdései közé beágyazott ajánlat.',
    desktopDimensions: '728 × 180 px',
    mobileDimensions: '320 × 160 px',
    maxFileSizeKb: 2000,
    allowedFormats: ['PNG', 'WebP', 'SVG'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'place-sidebar',
    placementKey: 'sidebar',
    name: 'Oldalsáv Banner (Sidebar)',
    description: 'Cikkek, kategóriák és tudásbázis oldalsávjában megjelenő kártya.',
    desktopDimensions: '336 × 280 px',
    mobileDimensions: '300 × 250 px',
    maxFileSizeKb: 2500,
    allowedFormats: ['PNG', 'WebP', 'SVG', 'GIF'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'place-category-banner',
    placementKey: 'category_banner',
    name: 'Kategóriaoldali Banner',
    description: 'Szakmai kategóriák (pl. Szerkezetépítés, Burkolás) fejléc bannerje.',
    desktopDimensions: '1140 × 200 px',
    mobileDimensions: '380 × 180 px',
    maxFileSizeKb: 4000,
    allowedFormats: ['PNG', 'WebP', 'SVG'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'place-mobile-sticky',
    placementKey: 'mobile_sticky',
    name: 'Mobil Alsó Tapadó Banner',
    description: 'Mobilon a képernyő alján megjelenő rögzített banner.',
    desktopDimensions: 'N/A (Csak mobil)',
    mobileDimensions: '320 × 50 px',
    maxFileSizeKb: 1000,
    allowedFormats: ['PNG', 'WebP', 'SVG'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_PAYMENTS: AdPayment[] = [
  {
    id: 'pay-101',
    paymentNumber: 'ET-INV-2026-001',
    campaignId: 'camp-101',
    campaignTitle: 'Leier Taverna & Kaiser Térkő Akció 2026 Tavasz',
    advertiserName: 'Leier Hungária Kft.',
    contractId: 'contract-101',
    amountHuf: 249000,
    currency: 'HUF',
    dueDate: '2026-01-15T00:00:00.000Z',
    paidDate: '2026-01-12T00:00:00.000Z',
    status: 'paid',
    paymentMethod: 'Banki átutalás',
    notes: 'Számla sorszáma: Sz-2026/014',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pay-102',
    paymentNumber: 'ET-INV-2026-002',
    campaignId: 'camp-102',
    campaignTitle: 'Bosch Professional Zöld Lézeres Szintezők',
    advertiserName: 'Bosch Professional Magyarország',
    contractId: 'contract-102',
    amountHuf: 99000,
    currency: 'HUF',
    dueDate: '2026-06-15T00:00:00.000Z',
    paidDate: null,
    status: 'unpaid',
    paymentMethod: 'Banki átutalás',
    notes: 'Díjbekérő kiküldve',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pay-103',
    paymentNumber: 'ET-INV-2026-003',
    campaignId: 'camp-103',
    campaignTitle: 'Milwaukee Heavy Duty Fúrókalapácsok & Akkus Gépek',
    advertiserName: 'Milwaukee Tool Magyarország',
    contractId: 'contract-103',
    amountHuf: 99000,
    currency: 'HUF',
    dueDate: '2026-07-10T00:00:00.000Z',
    paidDate: null,
    status: 'overdue',
    paymentMethod: 'Banki átutalás',
    notes: 'Fizetési felszólítás kiküldve 2026-08-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_NOTIFICATIONS: AdNotification[] = [
  {
    id: 'notif-1',
    title: 'Lejáró kampány figyelmeztetés',
    message: 'A Milwaukee Heavy Duty kampány lejárata 7 napon belül esedékes.',
    type: 'expiring_campaign',
    severity: 'warning',
    targetModule: 'campaigns',
    targetId: 'camp-103',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Késedelmes fizetési tétel',
    message: 'A Milwaukee Tool ET-INV-2026-003 számlája 15 napja lejárt.',
    type: 'overdue_payment',
    severity: 'error',
    targetModule: 'payments',
    targetId: 'pay-103',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Aláírásra váró szerződés',
    message: 'A Bosch Professional szerződése digitális elfogadásra vár.',
    type: 'expiring_contract',
    severity: 'info',
    targetModule: 'contracts',
    targetId: 'contract-102',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-4',
    title: 'Új kreatív jóváhagyása',
    message: 'Leier Taverna új banner kép került feltöltésre ellenőrzésre.',
    type: 'pending_creative',
    severity: 'success',
    targetModule: 'creatives',
    targetId: 'creative-top-banner-leier',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

// Helper: Advertisers
export function getAdvertisers(): Advertiser[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_ADVERTISERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    console.error('Hiba a hirdetők olvasásakor:', e);
  }
  return DEFAULT_ADVERTISERS;
}

export function saveAdvertisers(advertisers: Advertiser[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ADVERTISERS, JSON.stringify(advertisers));
    }
  } catch (e) {
    console.error('Hiba a hirdetők mentésekor:', e);
  }
}

// Helper: Placements
export function getPlacements(): AdPlacement[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_PLACEMENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    console.error('Hiba az elhelyezések olvasásakor:', e);
  }
  return DEFAULT_PLACEMENTS;
}

export function savePlacements(placements: AdPlacement[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PLACEMENTS, JSON.stringify(placements));
    }
  } catch (e) {
    console.error('Hiba az elhelyezések mentésekor:', e);
  }
}

// Helper: Payments
export function getPayments(): AdPayment[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_PAYMENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    console.error('Hiba a fizetések olvasásakor:', e);
  }
  return DEFAULT_PAYMENTS;
}

export function savePayments(payments: AdPayment[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
    }
  } catch (e) {
    console.error('Hiba a fizetések mentésekor:', e);
  }
}

// Helper: Notifications
export function getNotifications(): AdNotification[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch (e) {
    console.error('Hiba az értesítések olvasásakor:', e);
  }
  return DEFAULT_NOTIFICATIONS;
}

export function saveNotifications(notifications: AdNotification[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
    }
  } catch (e) {
    console.error('Hiba az értesítések mentésekor:', e);
  }
}

// Aggregate KPI calculation helper
export function calculateAdKpiStats(campaigns: ExtendedAdCampaign[]) {
  const advertisers = getAdvertisers();
  const creatives = getStoredCreatives();

  const activeCampaigns = campaigns.filter(
    (c) => c.status === 'active' || c.status_v2 === 'active'
  ).length;

  const activeAdvertisers = advertisers.filter((a) => a.isActive).length;

  const activeCreatives = creatives.filter((cr) => cr.is_active).length;

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringCampaigns = campaigns.filter((c) => {
    if (!c.end_date) return false;
    const endDate = new Date(c.end_date);
    return endDate >= now && endDate <= thirtyDaysLater;
  }).length;

  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions_count || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks_count || 0), 0);

  const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return {
    activeCampaigns,
    activeAdvertisers,
    activeCreatives,
    expiringCampaigns,
    totalImpressions,
    totalClicks,
    averageCtr: averageCtr.toFixed(2),
  };
}
