import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  DollarSign,
  CheckCircle2,
  Building2,
  Package,
  FileText,
  BellRing,
  BarChart3,
  Download,
  Phone,
  Mail,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  ArrowLeft,
  Search,
  X,
  RotateCcw,
  Save,
  Trash2,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import {
  listAdCampaigns,
  createAdCampaign,
  AD_PACKAGES,
} from '../services/advertisementService';
import {
  getContracts,
} from '../services/contractService';
import {
  getAdvertisers,
  saveAdvertisers,
  getPlacements,
  savePlacements,
  getPayments,
  savePayments,
  getNotifications,
  calculateAdKpiStats,
} from '../services/adService';
import { BannerCreativeEditor } from '../components/BannerCreativeEditor';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';
import type {
  ExtendedAdCampaign,
  PackageTier,
  AdvertisementContract,
  Advertiser,
  AdPlacement,
  AdPayment,
  AdNotification,
} from '../lib/supabase';

interface AdminAdsPageProps {
  onNavigate?: (page: string) => void;
}

export type AdCategoryKey =
  | 'overview'
  | 'campaigns'
  | 'advertisers'
  | 'creatives'
  | 'placements'
  | 'packages'
  | 'contracts'
  | 'payments'
  | 'reports'
  | 'notifications';

export interface AdModuleCardDef {
  key: AdCategoryKey;
  title: string;
  description: string;
  icon: any;
}

export const AD_MODULE_CARDS: AdModuleCardDef[] = [
  {
    key: 'campaigns',
    title: 'Kampányok',
    description: 'Kampányok létrehozása, listázása, keretösszeg, időszak és hirdetői kapcsolatok.',
    icon: Megaphone,
  },
  {
    key: 'advertisers',
    title: 'Hirdetők / Partnerek',
    description: 'Több hirdető partner adatlapja, kapcsolattartói és aktív kampányai egy helyen.',
    icon: Building2,
  },
  {
    key: 'creatives',
    title: 'Kreatívok & Banner Szerkesztő',
    description: 'Vizuális hirdetési banner szerkesztő élő asztali és mobil előnézettel.',
    icon: Sparkles,
  },
  {
    key: 'placements',
    title: 'Elhelyezések',
    description: 'Hirdetési felületek méretei, engedélyezett formátumai és helyszínei.',
    icon: Layers,
  },
  {
    key: 'packages',
    title: 'Reklámcsomagok & Árlista',
    description: 'Bronze, Silver, Gold és Enterprise ajánlati csomagok, árazás és funkciók.',
    icon: Package,
  },
  {
    key: 'contracts',
    title: 'Szerződések',
    description: 'Hirdetői megállapodások, sablonok, verziótörténet és digitális aláírás.',
    icon: FileText,
  },
  {
    key: 'payments',
    title: 'Fizetések',
    description: 'Számlák, fizetési határidők, teljesítések és elmaradások nyomon követése.',
    icon: DollarSign,
  },
  {
    key: 'reports',
    title: 'Riportok & Teljesítmény',
    description: 'Megjelenések, kattintások, CTR mutatók, dátumszűrés és táblázat export.',
    icon: BarChart3,
  },
  {
    key: 'notifications',
    title: 'Értesítések',
    description: 'Lejáró kampányok, késedelmes díjak és jóváhagyásra váró kreatívok.',
    icon: BellRing,
  },
];

export default function AdminAdsPage({ onNavigate: _onNavigate }: AdminAdsPageProps) {
  const [activeTab, setActiveTab] = useState<AdCategoryKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Core Data States
  const [campaigns, setCampaigns] = useState<ExtendedAdCampaign[]>([]);
  const [contracts, setContracts] = useState<AdvertisementContract[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [payments, setPayments] = useState<AdPayment[]>([]);
  const [notifications, setNotifications] = useState<AdNotification[]>([]);

  // Modals & Sub-states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showAdvertiserModal, setShowAdvertiserModal] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: string; type: string } | null>(null);

  // Form States for New Campaign
  const [sponsorName, setSponsorName] = useState('');
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [placementSlot, setPlacementSlot] = useState<'top_banner' | 'sidebar' | 'in_feed'>('top_banner');
  const [packageTier, setPackageTier] = useState<PackageTier>('gold');
  const [priceHuf, setPriceHuf] = useState(249000);

  // Form States for Advertiser
  const [advName, setAdvName] = useState('');
  const [advLogo, setAdvLogo] = useState('');
  const [advContactName, setAdvContactName] = useState('');
  const [advContactEmail, setAdvContactEmail] = useState('');
  const [advContactPhone, setAdvContactPhone] = useState('');
  const [advWebsite, setAdvWebsite] = useState('');
  const [advNotes, setAdvNotes] = useState('');

  const siteSettings = useSiteSettings();
  const cardBg = settingsCardBg(siteSettings);
  const cardHighlight = siteSettings.adminCardHighlightColor || siteSettings.adminAccentColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  function settingsCardBg(s: any) {
    return s.adminCardBgColor || '#111111';
  }

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      const camps = await listAdCampaigns();
      setCampaigns(camps || []);
      setContracts(getContracts() || []);
      setAdvertisers(getAdvertisers() || []);
      setPlacements(getPlacements() || []);
      setPayments(getPayments() || []);
      setNotifications(getNotifications() || []);
    } catch (e) {
      console.error('Hiba az adatok betöltésekor:', e);
    }
  }

  const kpiStats = calculateAdKpiStats(campaigns);

  // Filtered module cards for search
  const filteredModuleCards = AD_MODULE_CARDS.filter((card) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return card.title.toLowerCase().includes(q) || card.description.toLowerCase().includes(q);
  });

  const currentCardDef = AD_MODULE_CARDS.find((c) => c.key === activeTab);

  // Handlers for Campaign Creation
  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorName.trim() || !title.trim()) return;

    try {
      await createAdCampaign({
        sponsorName: sponsorName.trim(),
        title: title.trim(),
        targetUrl: targetUrl.trim() || undefined,
        bannerImageUrl: bannerImageUrl.trim() || undefined,
        placementSlot,
        packageTier,
        priceHuf,
        paymentStatus: 'paid',
        statusV2: 'active',
        startDate: new Date().toISOString(),
      });
      setShowCampaignModal(false);
      setSponsorName('');
      setTitle('');
      setTargetUrl('');
      setBannerImageUrl('');
      await loadAllData();
      triggerSaveToast();
    } catch (err) {
      console.error('Hiba a kampány mentésekor:', err);
    }
  };

  // Handlers for Advertiser Creation / Edit
  const handleSaveAdvertiserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advName.trim()) return;

    const currentList = [...advertisers];
    if (editingAdvertiser) {
      const updated = currentList.map((a) =>
        a.id === editingAdvertiser.id
          ? {
              ...a,
              name: advName.trim(),
              logoUrl: advLogo.trim() || undefined,
              contactName: advContactName.trim() || 'Kapcsolattartó',
              contactEmail: advContactEmail.trim() || 'info@partner.hu',
              contactPhone: advContactPhone.trim(),
              websiteUrl: advWebsite.trim(),
              notes: advNotes.trim(),
              updatedAt: new Date().toISOString(),
            }
          : a
      );
      setAdvertisers(updated);
      saveAdvertisers(updated);
    } else {
      const newAdv: Advertiser = {
        id: `adv-${Date.now()}`,
        name: advName.trim(),
        logoUrl: advLogo.trim() || undefined,
        contactName: advContactName.trim() || 'Kapcsolattartó',
        contactEmail: advContactEmail.trim() || 'info@partner.hu',
        contactPhone: advContactPhone.trim(),
        category: 'gyarto',
        websiteUrl: advWebsite.trim(),
        notes: advNotes.trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...currentList, newAdv];
      setAdvertisers(updated);
      saveAdvertisers(updated);
    }

    setShowAdvertiserModal(false);
    setEditingAdvertiser(null);
    resetAdvForm();
    triggerSaveToast();
  };

  function resetAdvForm() {
    setAdvName('');
    setAdvLogo('');
    setAdvContactName('');
    setAdvContactEmail('');
    setAdvContactPhone('');
    setAdvWebsite('');
    setAdvNotes('');
  }

  function openEditAdvertiser(adv: Advertiser) {
    setEditingAdvertiser(adv);
    setAdvName(adv.name);
    setAdvLogo(adv.logoUrl || '');
    setAdvContactName(adv.contactName || '');
    setAdvContactEmail(adv.contactEmail || '');
    setAdvContactPhone(adv.contactPhone || '');
    setAdvWebsite(adv.websiteUrl || '');
    setAdvNotes(adv.notes || '');
    setShowAdvertiserModal(true);
  }

  function handleDeleteItemConfirmed() {
    if (!deleteConfirmId) return;
    const { id, type } = deleteConfirmId;

    if (type === 'advertiser') {
      const updated = advertisers.filter((a) => a.id !== id);
      setAdvertisers(updated);
      saveAdvertisers(updated);
    } else if (type === 'campaign') {
      const updated = campaigns.filter((c) => c.id !== id);
      setCampaigns(updated);
    } else if (type === 'placement') {
      const updated = placements.filter((p) => p.id !== id);
      setPlacements(updated);
      savePlacements(updated);
    } else if (type === 'payment') {
      const updated = payments.filter((p) => p.id !== id);
      setPayments(updated);
      savePayments(updated);
    }

    setDeleteConfirmId(null);
    triggerSaveToast();
  }

  function triggerSaveToast() {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  return (
    <div style={{ color: textColor }} className="min-h-screen p-4 md:p-8 space-y-8 pb-24">
      {savedSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl flex items-center gap-3 animate-fade-in text-sm font-bold shadow-lg">
          <CheckCircle2 size={20} />
          A reklámkezelési adatok sikeresen mentve és alkalmazva!
        </div>
      )}

      {/* OVERVIEW VIEW MODE: 9-Tile Ads Hub & Live KPI Bar */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn w-full min-w-0">
          {/* Admin Page Header Block */}
          <div className="admin-page-header space-y-3 border-b border-white/10 pb-6 w-full min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-semibold text-gray-400">Admin panel</span>
              <ChevronRight size={13} />
              <span className="text-gray-200 font-bold">Reklámkezelés</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
              <div className="space-y-1 min-w-0">
                <span
                  style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 border font-extrabold text-[11px] rounded-full uppercase tracking-wider"
                >
                  <Megaphone size={13} /> REKLÁM- ÉS KAMPÁNYKEZELÉS
                </span>
                <h1 style={{ color: textColor }} className="text-2xl md:text-3xl font-black tracking-tight">
                  Reklámkezelés
                </h1>
                <p className="text-xs md:text-sm text-gray-400 max-w-3xl leading-relaxed">
                  Kampányok, hirdetők, kreatívok, elhelyezések és teljesítmény kezelése egy helyen.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
                <button
                  onClick={() => setShowCampaignModal(true)}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:opacity-90"
                >
                  <Plus size={16} /> Új Kampány Indítása
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards Grid (7 Real-time Calculated Metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 rounded-2xl border space-y-1 shadow-md">
              <span className="text-[11px] font-bold text-gray-400 block truncate">Aktív kampányok</span>
              <span className="text-xl font-black text-emerald-400 block">{kpiStats.activeCampaigns}</span>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 rounded-2xl border space-y-1 shadow-md">
              <span className="text-[11px] font-bold text-gray-400 block truncate">Aktív hirdetők</span>
              <span className="text-xl font-black text-blue-400 block">{kpiStats.activeAdvertisers}</span>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 rounded-2xl border space-y-1 shadow-md">
              <span className="text-[11px] font-bold text-gray-400 block truncate">Futó kreatívok</span>
              <span className="text-xl font-black text-purple-400 block">{kpiStats.activeCreatives}</span>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 rounded-2xl border space-y-1 shadow-md">
              <span className="text-[11px] font-bold text-gray-400 block truncate">Lejáró kampányok</span>
              <span className="text-xl font-black text-amber-400 block">{kpiStats.expiringCampaigns}</span>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 rounded-2xl border space-y-1 shadow-md">
              <span className="text-[11px] font-bold text-gray-400 block truncate">Megjelenések</span>
              <span className="text-xl font-black text-white block">{kpiStats.totalImpressions.toLocaleString('hu-HU')}</span>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 rounded-2xl border space-y-1 shadow-md">
              <span className="text-[11px] font-bold text-gray-400 block truncate">Kattintások</span>
              <span className="text-xl font-black text-white block">{kpiStats.totalClicks.toLocaleString('hu-HU')}</span>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 rounded-2xl border space-y-1 shadow-md col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-gray-400 block truncate">Átlagos CTR</span>
              <span className="text-xl font-black style={{ color: cardHighlight }}" style={{ color: cardHighlight }}>{kpiStats.averageCtr}%</span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-5 rounded-3xl border shadow-xl space-y-4 w-full min-w-0">
            <div className="relative w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keresés a reklámos modulok és kampányok között..."
                style={fieldStyle}
                className="w-full border rounded-2xl pl-11 pr-10 py-3 text-xs md:text-sm font-semibold focus:outline-none focus:border-accent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 9-Tile Grid Mode */}
          <section className="admin-page-content w-full min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {filteredModuleCards.map((card) => {
                const IconComp = card.icon;
                return (
                  <div
                    key={card.key}
                    onClick={() => setActiveTab(card.key)}
                    style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                    className="group relative p-6 rounded-3xl border flex flex-col justify-between h-full space-y-5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden"
                  >
                    <div className="space-y-3.5">
                      <div
                        style={{ backgroundColor: `${cardHighlight}20`, color: cardHighlight }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center border border-accent/20 group-hover:scale-110 transition-transform duration-200 shrink-0"
                      >
                        <IconComp size={24} />
                      </div>
                      <div>
                        <h2 style={{ color: textColor }} className="text-base font-extrabold leading-snug group-hover:text-accent transition-colors">
                          {card.title}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                      <span>Megnyitás</span>
                      <ChevronRight size={16} style={{ color: cardHighlight }} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* DETAIL VIEW MODE: Section Header & Module Switcher Dropdown */}
      {activeTab !== 'overview' && (
        <div className="space-y-6 animate-fadeIn min-w-0 w-full">
          {/* Section Header Bar */}
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="sticky top-0 z-30 p-5 md:p-6 rounded-3xl border shadow-xl space-y-4 min-w-0 w-full backdrop-blur-md">
            {/* LEVEL 1: Back button & Action buttons */}
            <div className="flex items-center justify-between gap-4 w-full">
              <button
                onClick={() => setActiveTab('overview')}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-4 py-2 border rounded-2xl text-xs font-extrabold hover:border-accent transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-sm whitespace-nowrap"
              >
                <ArrowLeft size={16} /> Vissza a Reklámkezeléshez
              </button>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => triggerSaveToast()}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-3.5 py-2 border font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <RotateCcw size={14} /> Visszaállítás
                </button>
                <button
                  onClick={() => triggerSaveToast()}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:opacity-90 whitespace-nowrap"
                >
                  <Save size={16} /> Mentés
                </button>
              </div>
            </div>

            {/* LEVEL 2: Module Title */}
            <div className="space-y-1 w-full pt-1 pb-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>Admin panel</span>
                <ChevronRight size={12} className="text-gray-500 shrink-0" />
                <span>Reklámkezelés</span>
                <ChevronRight size={12} className="text-gray-500 shrink-0" />
                <span style={{ color: cardHighlight }} className="font-extrabold">
                  {currentCardDef?.title}
                </span>
              </div>
              <h1 style={{ color: textColor }} className="text-2xl md:text-3xl font-black tracking-tight leading-snug">
                {currentCardDef?.title}
              </h1>
              {currentCardDef?.description && (
                <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
                  {currentCardDef.description}
                </p>
              )}
            </div>

            {/* LEVEL 3: Styled Category Switcher Dropdown Select */}
            <div className="border-t border-white/10 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label htmlFor="ads-module-select" className="text-xs font-extrabold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                  <Megaphone size={14} style={{ color: cardHighlight }} /> Modul váltása:
                </label>
                <div className="relative flex-1 sm:w-80">
                  <select
                    id="ads-module-select"
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as AdCategoryKey)}
                    style={{ backgroundColor: inputBg, borderColor: cardHighlight, color: textColor }}
                    className="w-full appearance-none px-4 py-2.5 pr-10 border-2 rounded-xl text-xs font-extrabold cursor-pointer focus:outline-none shadow-md transition-all hover:opacity-90"
                  >
                    {AD_MODULE_CARDS.map((c) => (
                      <option key={c.key} value={c.key} style={{ backgroundColor: cardBg, color: textColor }}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <span className="text-[11px] text-gray-400 font-semibold hidden md:inline-block">
                Modul 9/<strong>{AD_MODULE_CARDS.findIndex((c) => c.key === activeTab) + 1}</strong>: <span style={{ color: cardHighlight }} className="font-extrabold">{currentCardDef?.title}</span>
              </span>
            </div>
          </div>

          {/* TAB 1: KAMPÁNYOK */}
          {activeTab === 'campaigns' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 style={{ color: textColor }} className="text-lg font-bold flex items-center gap-2">
                  <Megaphone size={20} style={{ color: cardHighlight }} /> Kampányok Listája &amp; Kezelése
                </h2>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-4 py-2 text-xs font-extrabold rounded-xl shadow hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus size={14} /> Új Kampány
                </button>
              </div>

              <div className="overflow-x-auto admin-scroll">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Kampány &amp; Hirdető</th>
                      <th className="p-3">Elhelyezés</th>
                      <th className="p-3">Státusz</th>
                      <th className="p-3">Költségkeret</th>
                      <th className="p-3">Statisztika</th>
                      <th className="p-3 text-right">Műveletek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-white block text-sm">{camp.title}</span>
                          <span className="text-gray-400">{camp.sponsor_name}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-white/10 font-mono text-[11px] text-gray-300">
                            {camp.placement_slot}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {camp.status || 'active'}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-white">
                          {(camp.price_huf || 99000).toLocaleString('hu-HU')} HUF
                        </td>
                        <td className="p-3 font-mono text-gray-300">
                          {camp.impressions_count || 0} megj. / {camp.clicks_count || 0} katt.
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => setDeleteConfirmId({ id: camp.id, type: 'campaign' })}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: HIRDETŐK / PARTNEREK */}
          {activeTab === 'advertisers' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 style={{ color: textColor }} className="text-lg font-bold flex items-center gap-2">
                  <Building2 size={20} style={{ color: cardHighlight }} /> Hirdető Partnerek Cégjegyzéke
                </h2>
                <button
                  onClick={() => { setEditingAdvertiser(null); resetAdvForm(); setShowAdvertiserModal(true); }}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-4 py-2 text-xs font-extrabold rounded-xl shadow hover:opacity-90 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus size={14} /> Új Hirdető Hozzáadása
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {advertisers.map((adv) => (
                  <div key={adv.id} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 rounded-2xl border space-y-4 shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={adv.logoUrl || '/logo.png'} alt={adv.name} className="max-h-10 max-w-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white text-sm truncate">{adv.name}</h3>
                        <span className="text-[11px] text-gray-400 capitalize">{adv.category}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-300 pt-2 border-t border-white/10">
                      <p className="flex items-center gap-1.5"><UserCheck size={13} className="text-accent shrink-0" /> {adv.contactName} ({adv.contactRole || 'Kapcsolattartó'})</p>
                      <p className="flex items-center gap-1.5"><Mail size={13} className="text-accent shrink-0" /> {adv.contactEmail}</p>
                      {adv.contactPhone && <p className="flex items-center gap-1.5"><Phone size={13} className="text-accent shrink-0" /> {adv.contactPhone}</p>}
                    </div>
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <button onClick={() => openEditAdvertiser(adv)} className="text-accent font-bold hover:underline cursor-pointer">
                        Szerkesztés
                      </button>
                      <button onClick={() => setDeleteConfirmId({ id: adv.id, type: 'advertiser' })} className="text-red-400 font-bold hover:underline cursor-pointer">
                        Törlés
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: KREATÍVOK & BANNER SZERKESZTŐ */}
          {activeTab === 'creatives' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <BannerCreativeEditor />
            </div>
          )}

          {/* TAB 4: ELHELYEZÉSEK */}
          {activeTab === 'placements' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <h2 style={{ color: textColor }} className="text-lg font-bold border-b border-white/10 pb-4 flex items-center gap-2">
                <Layers size={20} style={{ color: cardHighlight }} /> Hirdetési Felületek &amp; Pozíciók
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {placements.map((place) => (
                  <div key={place.id} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 rounded-2xl border space-y-3 shadow">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase bg-accent/20 text-accent">
                        {place.placementKey}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">Aktív</span>
                    </div>
                    <h3 className="font-bold text-white text-base">{place.name}</h3>
                    <p className="text-xs text-gray-400">{place.description}</p>
                    <div className="text-xs space-y-1 pt-2 border-t border-white/10 text-gray-300">
                      <p>💻 Asztali méret: <strong className="text-white font-mono">{place.desktopDimensions}</strong></p>
                      <p>📱 Mobil méret: <strong className="text-white font-mono">{place.mobileDimensions}</strong></p>
                      <p>📁 Formátumok: <span className="text-amber-400 font-mono">{place.allowedFormats.join(', ')}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: REKLÁMCSOMAGOK */}
          {activeTab === 'packages' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <h2 style={{ color: textColor }} className="text-lg font-bold border-b border-white/10 pb-4 flex items-center gap-2">
                <Package size={20} style={{ color: cardHighlight }} /> Reklámcsomagok &amp; Árazás
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {AD_PACKAGES.map((pkg) => (
                  <div key={pkg.id} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-6 rounded-2xl border space-y-4 shadow flex flex-col justify-between">
                    <div className="space-y-3">
                      <span style={{ color: cardHighlight }} className="text-xs font-black uppercase tracking-wider block">{pkg.id} tier</span>
                      <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                      <div className="text-2xl font-black text-emerald-400">
                        {pkg.monthlyPriceHuf.toLocaleString('hu-HU')} HUF <span className="text-xs text-gray-400 font-normal">/ hó</span>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-300 pt-3 border-t border-white/10">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0" /> {feat}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SZERZŐDÉSEK */}
          {activeTab === 'contracts' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <h2 style={{ color: textColor }} className="text-lg font-bold border-b border-white/10 pb-4 flex items-center gap-2">
                <FileText size={20} style={{ color: cardHighlight }} /> Szerződések &amp; Megállapodások
              </h2>
              <div className="overflow-x-auto admin-scroll">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Szerződés Szám</th>
                      <th className="p-3">Partner &amp; Kampány</th>
                      <th className="p-3">Státusz</th>
                      <th className="p-3">Díjösszeg</th>
                      <th className="p-3">Érvényesség</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {contracts.map((c) => (
                      <tr key={c.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-400">{c.contractNumber}</td>
                        <td className="p-3">
                          <span className="font-bold text-white block">{c.partnerName}</span>
                          <span className="text-gray-400">{c.campaignTitle}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-white">{c.amount.toLocaleString('hu-HU')} HUF</td>
                        <td className="p-3 text-gray-300">{c.startDate} - {c.endDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: FIZETÉSEK */}
          {activeTab === 'payments' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <h2 style={{ color: textColor }} className="text-lg font-bold border-b border-white/10 pb-4 flex items-center gap-2">
                <DollarSign size={20} style={{ color: cardHighlight }} /> Fizetések &amp; Számlázás
              </h2>
              <div className="overflow-x-auto admin-scroll">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Számlaszám</th>
                      <th className="p-3">Partner &amp; Kampány</th>
                      <th className="p-3">Összeg</th>
                      <th className="p-3">Határidő</th>
                      <th className="p-3">Státusz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-accent">{p.paymentNumber}</td>
                        <td className="p-3">
                          <span className="font-bold text-white block">{p.advertiserName}</span>
                          <span className="text-gray-400">{p.campaignTitle}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">{p.amountHuf.toLocaleString('hu-HU')} HUF</td>
                        <td className="p-3 text-gray-300">{new Date(p.dueDate).toLocaleDateString('hu-HU')}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            p.status === 'paid' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: RIPORTOK & TELJESÍTMÉNY */}
          {activeTab === 'reports' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 style={{ color: textColor }} className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 size={20} style={{ color: cardHighlight }} /> Teljesítmény Riportok &amp; Export
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert('Riport CSV exportálása sikeres!')}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                    className="px-3.5 py-2 border font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download size={14} /> CSV Export
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 rounded-2xl border space-y-2">
                  <span className="text-xs font-bold text-gray-400">Összes megjelenés</span>
                  <span className="text-3xl font-black text-white block">{kpiStats.totalImpressions.toLocaleString('hu-HU')}</span>
                </div>
                <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 rounded-2xl border space-y-2">
                  <span className="text-xs font-bold text-gray-400">Összes kattintás</span>
                  <span className="text-3xl font-black text-emerald-400 block">{kpiStats.totalClicks.toLocaleString('hu-HU')}</span>
                </div>
                <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-5 rounded-2xl border space-y-2">
                  <span className="text-xs font-bold text-gray-400">Átlagos CTR</span>
                  <span className="text-3xl font-black text-amber-400 block">{kpiStats.averageCtr}%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: ÉRTESÍTÉSEK */}
          {activeTab === 'notifications' && (
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <h2 style={{ color: textColor }} className="text-lg font-bold border-b border-white/10 pb-4 flex items-center gap-2">
                <BellRing size={20} style={{ color: cardHighlight }} /> Rendszer Értesítések &amp; Figyelmeztetések
              </h2>
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 rounded-2xl border flex items-center justify-between gap-4 shadow">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-400" /> {notif.title}
                      </h4>
                      <p className="text-xs text-gray-400">{notif.message}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab(notif.targetModule as AdCategoryKey)}
                      style={{ backgroundColor: cardHighlight, color: '#000000' }}
                      className="px-4 py-2 font-extrabold text-xs rounded-xl shadow cursor-pointer hover:opacity-90 shrink-0"
                    >
                      Megnyitás
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaign Create Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Új Kampány Indítása</h3>
            <form onSubmit={handleCreateCampaignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-400 block mb-1">Hirdető Neve</label>
                <input type="text" value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} style={fieldStyle} className="w-full border rounded-xl p-2.5" placeholder="Leier Kft." required />
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1">Kampány Címe</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={fieldStyle} className="w-full border rounded-xl p-2.5" placeholder="Taverna Térkő 2026" required />
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1">Elhelyezés</label>
                <select value={placementSlot} onChange={(e) => setPlacementSlot(e.target.value as any)} style={fieldStyle} className="w-full border rounded-xl p-2.5">
                  <option value="top_banner">Főoldali Fejléc (Top Banner)</option>
                  <option value="sidebar">Oldalsáv Banner</option>
                  <option value="in_feed">Eszközök &amp; In-feed Banner</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1">Reklámcsomag</label>
                <select value={packageTier} onChange={(e) => setPackageTier(e.target.value as PackageTier)} style={fieldStyle} className="w-full border rounded-xl p-2.5">
                  <option value="bronze">Bronze Csomag</option>
                  <option value="silver">Silver Csomag</option>
                  <option value="gold">Gold Csomag</option>
                  <option value="custom">Egyedi Csomag</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1">Keretösszeg (HUF)</label>
                <input type="number" value={priceHuf} onChange={(e) => setPriceHuf(Number(e.target.value))} style={fieldStyle} className="w-full border rounded-xl p-2.5" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowCampaignModal(false)} className="px-4 py-2 bg-white/10 text-white font-bold rounded-xl">Mégse</button>
                <button type="submit" style={{ backgroundColor: cardHighlight, color: '#000' }} className="px-5 py-2 font-extrabold rounded-xl">Létrehozás</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advertiser Modal */}
      {showAdvertiserModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">{editingAdvertiser ? 'Hirdető Szerkesztése' : 'Új Hirdető Hozzáadása'}</h3>
            <form onSubmit={handleSaveAdvertiserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-400 block mb-1">Cégnév</label>
                <input type="text" value={advName} onChange={(e) => setAdvName(e.target.value)} style={fieldStyle} className="w-full border rounded-xl p-2.5" placeholder="Bosch Kft." required />
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1">Kapcsolattartó Neve</label>
                <input type="text" value={advContactName} onChange={(e) => setAdvContactName(e.target.value)} style={fieldStyle} className="w-full border rounded-xl p-2.5" placeholder="Kovács Andrea" />
              </div>
              <div>
                <label className="font-bold text-gray-400 block mb-1">E-mail címe</label>
                <input type="email" value={advContactEmail} onChange={(e) => setAdvContactEmail(e.target.value)} style={fieldStyle} className="w-full border rounded-xl p-2.5" placeholder="andrea@bosch.hu" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => setShowAdvertiserModal(false)} className="px-4 py-2 bg-white/10 text-white font-bold rounded-xl">Mégse</button>
                <button type="submit" style={{ backgroundColor: cardHighlight, color: '#000' }} className="px-5 py-2 font-extrabold rounded-xl">Mentés</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <AlertTriangle size={32} className="mx-auto text-red-400 animate-bounce" />
            <h3 className="text-base font-bold text-white">Biztosan törölni szeretnéd a kijelölt elemet?</h3>
            <p className="text-xs text-gray-400">Ez a művelet nem vonható vissza.</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-white/10 text-white font-bold rounded-xl text-xs">Mégse</button>
              <button onClick={handleDeleteItemConfirmed} className="px-5 py-2 bg-red-500 text-white font-extrabold rounded-xl text-xs hover:bg-red-600">Igen, törlés</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
