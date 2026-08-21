import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Eye,
  MousePointer,
  DollarSign,
  CheckCircle2,
  Building2,
  Package,
  FileText,
  BellRing,
  BarChart3,
  TrendingUp,
  Download,
  Phone,
  Mail,
  UserCheck,
  Tag,
  ChevronRight,
  Printer,
  History,
  Check,
  ShieldCheck,
  FileCheck,
  XCircle,
  Sparkles,
} from 'lucide-react';
import {
  listAdCampaigns,
  createAdCampaign,
  updateCampaignStatusV2,
  updatePaymentStatus,
  AD_PACKAGES,
} from '../services/advertisementService';
import {
  getContracts,
  saveContracts,
  acceptContractByPartner,
  updateContractStatus,
  addContractVersion,
  DEFAULT_CONTRACT_TEMPLATES,
  interpolateTemplate,
} from '../services/contractService';
import { BannerCreativeEditor } from '../components/BannerCreativeEditor';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';
import type {
  ExtendedAdCampaign,
  CampaignStatusV2,
  PaymentStatus,
  ContractType,
  PackageTier,
  AdvertisementContract,
  ContractStatus,
} from '../lib/supabase';

interface AdminAdsPageProps {
  onNavigate?: (page: string) => void;
}

const STATUS_V2_CONFIG: Record<
  CampaignStatusV2,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  draft: { label: 'Ajánlat készül', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '🟡' },
  contracting: { label: 'Szerződés alatt', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', icon: '🟠' },
  pending_payment: { label: 'Fizetésre vár', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: '🔵' },
  active: { label: 'Aktív', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', icon: '🟢' },
  renewing: { label: 'Hosszabbítás alatt', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: '🟣' },
  expired: { label: 'Lejárt', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', icon: '⚫' },
  cancelled: { label: 'Megszűnt', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', icon: '🔴' },
};

const CONTRACT_STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  draft: { label: 'Piszkozat', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', icon: '⚪' },
  sent: { label: 'Kiküldve Partnernek', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', icon: '🔵' },
  viewed: { label: 'Partner Megtekintette', bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', icon: '🟣' },
  pending_acceptance: { label: 'Elfogadásra Vár', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '🟡' },
  accepted: { label: '🟢 Elfogadva & Érvényes', bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', icon: '🟢' },
  declined: { label: '🔴 Módosítást Kér / Elutasítva', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', icon: '🔴' },
  expired: { label: '⚫ Lejárt Szerződés', bg: 'bg-gray-700/20', text: 'text-gray-400', border: 'border-gray-700', icon: '⚫' },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  paid: { label: 'Kiegyenlítve', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  partially_paid: { label: 'Részben fizetve', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  unpaid: { label: 'Fizetésre vár', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  overdue: { label: 'Fizetési hiba / Lejárt', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
};

function getPlacementLocation(slot: string): { label: string; page: string } {
  if (slot === 'top_banner') {
    return { label: '📍 Főoldal (Felső Kiemelt Banner)', page: 'home' };
  }
  if (slot === 'in_feed') {
    return { label: '📍 Eszközök Modul (Affiliate Ajánlatok)', page: 'tool' };
  }
  return { label: '📍 Kategóriák & Cikkek (Oldalsáv)', page: 'category' };
}

export default function AdminAdsPage({ onNavigate }: AdminAdsPageProps) {
  const [campaigns, setCampaigns] = useState<ExtendedAdCampaign[]>([]);
  const [contracts, setContracts] = useState<AdvertisementContract[]>([]);
  const templates = DEFAULT_CONTRACT_TEMPLATES;
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'creative_editor' | 'campaigns' | 'contracts' | 'partners' | 'packages' | 'payments' | 'notifications' | 'reports' | 'partner_portal'
  >('dashboard');

  const [showModal, setShowModal] = useState(false);
  const [showContractViewer, setShowContractViewer] = useState<AdvertisementContract | null>(null);
  const [showVersionModal, setShowVersionModal] = useState<AdvertisementContract | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Versioning state
  const [newVersionAmount, setNewVersionAmount] = useState<number>(249000);
  const [newVersionNote, setNewVersionNote] = useState<string>('');

  // Form State
  const [sponsorName, setSponsorName] = useState('');
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [placementSlot, setPlacementSlot] = useState<'top_banner' | 'sidebar' | 'in_feed'>('top_banner');
  const [packageTier, setPackageTier] = useState<PackageTier>('gold');
  const [contractType, setContractType] = useState<ContractType>('monthly');
  const [priceHuf, setPriceHuf] = useState(249000);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [statusV2, setStatusV2] = useState<CampaignStatusV2>('active');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Partner Portal simulation state
  const [selectedPartnerContract, setSelectedPartnerContract] = useState<AdvertisementContract | null>(null);
  const [partnerSignName, setPartnerSignName] = useState('Nagy Péter');
  const [partnerSignEmail, setPartnerSignEmail] = useState('marketing@bosch.hu');
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  useEffect(() => {
    loadData();

    function handleContractsChanged() {
      setContracts(getContracts());
    }
    async function handleCampaignsChanged() {
      const campData = await listAdCampaigns();
      setCampaigns([...campData]);
    }

    window.addEventListener('contracts-changed', handleContractsChanged);
    window.addEventListener('ad-campaigns-changed', handleCampaignsChanged);
    return () => {
      window.removeEventListener('contracts-changed', handleContractsChanged);
      window.removeEventListener('ad-campaigns-changed', handleCampaignsChanged);
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const campData = await listAdCampaigns();
      const contractData = getContracts();
      setCampaigns([...campData]);
      setContracts([...contractData]);
      if (contractData.length > 0 && !selectedPartnerContract) {
        setSelectedPartnerContract(contractData[0]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!sponsorName.trim() || !title.trim()) return;

    const newCamp = await createAdCampaign({
      sponsorName,
      placementSlot,
      title,
      targetUrl,
      bannerImageUrl,
      packageTier,
      contractType,
      priceHuf: Number(priceHuf),
      paymentStatus,
      statusV2,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      contactPerson: {
        name: contactName || 'Kapcsolattartó Menedzser',
        email: contactEmail || 'marketing@partner.hu',
        phone: contactPhone || '+36 30 123 4567',
        role: contactRole || 'Marketing Menedzser',
      },
    });

    // Also generate a Contract for this campaign
    const contractNum = `ET-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const defaultTmpl = templates[0];
    const filledBody = interpolateTemplate(defaultTmpl.body, {
      szerzodes_szam: contractNum,
      partner_nev: sponsorName,
      kapcsolattarto_nev: contactName,
      kapcsolattarto_email: contactEmail,
      kampany_cim: title,
      reklamhely: placementSlot === 'top_banner' ? 'Főoldali Fejléc Banner' : 'Oldalsáv / Cikk',
      kezdes: startDate,
      vege: endDate || 'Határozatlan',
      osszeg: Number(priceHuf),
    });

    const newContract: AdvertisementContract = {
      id: `contract-${Date.now()}`,
      contractNumber: contractNum,
      campaignId: newCamp.id,
      partnerId: `partner-${Date.now()}`,
      partnerName: sponsorName,
      campaignTitle: title,
      placementSlot,
      templateId: defaultTmpl.id,
      status: 'pending_acceptance',
      startDate,
      endDate: endDate || '2026-12-31',
      amount: Number(priceHuf),
      currency: 'HUF',
      content: filledBody,
      versions: [
        {
          versionNumber: 1,
          createdAt: new Date().toLocaleString('hu-HU'),
          amount: Number(priceHuf),
          content: filledBody,
          changeNote: 'Kezdeti szerződés tervezet elküldve',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentContracts = getContracts();
    saveContracts([newContract, ...currentContracts]);

    // Reset Form
    setSponsorName('');
    setTitle('');
    setTargetUrl('');
    setBannerImageUrl('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactRole('');
    setShowModal(false);
    await loadData();
  }

  async function handleStatusChange(id: string, newStatus: CampaignStatusV2) {
    await updateCampaignStatusV2(id, newStatus);
    await loadData();
  }

  async function handlePaymentChange(id: string, newPayment: PaymentStatus) {
    await updatePaymentStatus(id, newPayment);
    await loadData();
  }

  function handlePartnerAcceptance(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPartnerContract) return;

    const updated = acceptContractByPartner(
      selectedPartnerContract.id,
      partnerSignName,
      partnerSignEmail
    );

    if (updated) {
      // Also update linked campaign to active and payment to unpaid
      handleStatusChange(updated.campaignId, 'active');
      handlePaymentChange(updated.campaignId, 'unpaid');
      setAcceptSuccess(true);
      setTimeout(() => setAcceptSuccess(false), 4000);
      loadData();
    }
  }

  function handleCreateVersionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!showVersionModal) return;

    addContractVersion(
      showVersionModal.id,
      newVersionAmount,
      showVersionModal.content,
      newVersionNote || 'Módosított szerződéses feltételek (Új verzió)'
    );

    setShowVersionModal(null);
    setNewVersionNote('');
    loadData();
  }

  // Dashboard Stats Calculations
  const activeCount = campaigns.filter((c) => c.status_v2 === 'active').length;
  const pendingPaymentCount = campaigns.filter((c) => c.payment_status === 'unpaid' || c.payment_status === 'overdue').length;
  const pendingContractAcceptanceCount = contracts.filter((c) => c.status === 'pending_acceptance' || c.status === 'sent').length;
  const totalRevenue = campaigns
    .filter((c) => c.status_v2 === 'active' || c.payment_status === 'paid')
    .reduce((acc, curr) => acc + (curr.price_huf || 0), 0);

  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions_count || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks_count || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  const expiring30DaysCount = campaigns.filter((c) => {
    if (!c.end_date) return false;
    const daysLeft = Math.ceil((new Date(c.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  }).length;

  const filteredCampaigns = campaigns.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status_v2 === filterStatus;
  });

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -6);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  return (
    <div className="space-y-8 p-4 md:p-8 min-h-screen" style={{ color: textColor }}>
      {/* Executive Suite Header */}
      <div style={{ borderColor: cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <div style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }} className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border mb-2">
            <Megaphone size={14} /> ÉpítőTudás Reklámkezelő v2.1 – Szerződés Suite
          </div>
          <h1 style={{ color: textColor }} className="text-2xl md:text-3xl font-extrabold">
            Partneri &amp; Reklámkampány Kezelő Központ
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Kampány életciklusok, automatikus szerződés generátor, verziózás, legal audit logs és partner portál.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('partner_portal')}
            style={{ backgroundColor: headerBg, borderColor: cardBorder, color: textColor }}
            className="px-4 py-2.5 border font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserCheck size={16} /> Partner Elfogadási Portál Nézet
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:opacity-90"
          >
            <Plus size={16} /> Új Kampány &amp; Szerződés Indítása
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222] overflow-x-auto pb-2">
        {[
          { id: 'dashboard', label: '📊 Dashboard', count: null },
          { id: 'creative_editor', label: '🎨 Kreatív Szerkesztő', count: null },
          { id: 'campaigns', label: '🎯 Kampányok', count: campaigns.length },
          { id: 'contracts', label: '📄 Szerződések & Sablonok', count: pendingContractAcceptanceCount },
          { id: 'partners', label: '🏢 Partnerek', count: null },
          { id: 'packages', label: '📦 Csomagok & Helyek', count: null },
          { id: 'payments', label: '💳 Fizetések', count: pendingPaymentCount },
          { id: 'notifications', label: '🔔 Értesítések', count: expiring30DaysCount },
          { id: 'reports', label: '📈 Riportok & CTR', count: null },
          { id: 'partner_portal', label: '🤝 Partner Elfogadási Nézet', count: null },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-accent text-black shadow-lg scale-105'
                  : 'bg-[#141414] border border-[#222] text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-black text-accent' : 'bg-accent/20 text-accent font-bold'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Quick Creative Selector Banner Callout */}
          <div className="bg-gradient-to-r from-teal-950/60 via-[#111] to-amber-950/60 border border-teal-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
                <Sparkles size={13} /> Vizuális Banner Szerkesztő & Hirdető Kiválasztó
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Hirdetések & Reklám Kreatívok Kezelése
              </h3>
              <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                Válaszd ki a szerkeszteni kívánt hirdetőt (Bosch, DeWalt, Stanley, Makita, Knauf), módosítsd a szövegeket, képeket, rotációs időtartamot (mp) és áttűnési animációkat.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('creative_editor')}
              className="shrink-0 px-6 py-3.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-2xl shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <span>Kreatív Kiválasztó & Szerkesztő Megnyitása</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* KPI Metrics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-2 relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400" /> Aktív Kampányok
              </div>
              <div className="text-3xl font-extrabold text-white">{activeCount}</div>
              <p className="text-[11px] text-gray-500">Jelenleg futó szponzori hirdetések</p>
              <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-green-500/10 rounded-full blur-xl" />
            </div>

            <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-2 relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <FileCheck size={16} className="text-yellow-400" /> Elfogadásra Váró Szerződés
              </div>
              <div className="text-3xl font-extrabold text-yellow-400">{pendingContractAcceptanceCount}</div>
              <p className="text-[11px] text-gray-500">Partneri aláírásra kiküldött tételek</p>
              <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl" />
            </div>

            <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-2 relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <DollarSign size={16} className="text-accent" /> Szerződéses Érték
              </div>
              <div className="text-3xl font-extrabold text-accent">
                {totalRevenue.toLocaleString('hu-HU')} Ft
              </div>
              <p className="text-[11px] text-gray-500">Szponzori & Affiliate bevételek</p>
              <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-accent/10 rounded-full blur-xl" />
            </div>
          </div>

          {/* Real Live Performance Analytics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-[#222] rounded-3xl p-5 space-y-1 relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Eye size={16} className="text-cyan-400" /> Valós Összes Megjelenés
              </div>
              <div className="text-2xl font-extrabold text-white">{totalImpressions.toLocaleString('hu-HU')}</div>
              <p className="text-[11px] text-gray-500">Oldalon rögzített valós hirdetés megjelenések</p>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-3xl p-5 space-y-1 relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <MousePointer size={16} className="text-accent" /> Valós Összes Kattintás
              </div>
              <div className="text-2xl font-extrabold text-accent">{totalClicks.toLocaleString('hu-HU')}</div>
              <p className="text-[11px] text-gray-500">Látogatók által kattintott partner hivatkozások</p>
            </div>

            <div className="bg-[#111] border border-[#222] rounded-3xl p-5 space-y-1 relative overflow-hidden">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <BarChart3 size={16} className="text-green-400" /> Átlagos Átkattintási Arány (CTR)
              </div>
              <div className="text-2xl font-extrabold text-green-400">{avgCtr}%</div>
              <p className="text-[11px] text-gray-500">Valós idejű konverziós mutató</p>
            </div>
          </div>

          {/* Quick Active Campaign Highlights */}
          <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-accent" size={20} /> Kiemelt Aktív Kampányok & Szerződés Állapot
              </h2>
              <button
                onClick={() => setActiveTab('campaigns')}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
              >
                Összes Kampány Megtekintése <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.slice(0, 4).map((camp) => {
                const ctr =
                  camp.impressions_count > 0
                    ? ((camp.clicks_count / camp.impressions_count) * 100).toFixed(1)
                    : '0.0';

                const statusCfg = STATUS_V2_CONFIG[camp.status_v2 || 'active'];

                return (
                  <div key={camp.id} className="bg-[#161616] border border-[#222] rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                      <span className="text-xs font-mono text-accent font-bold">
                        {camp.price_huf ? `${camp.price_huf.toLocaleString('hu-HU')} Ft` : 'Egyedi'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{camp.title}</h3>
                    <p className="text-xs text-gray-400">Partner: <strong className="text-gray-200">{camp.sponsor_name}</strong></p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#222] text-center">
                      <div className="bg-[#1A1A1A] p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 block">Megjelenés</span>
                        <span className="text-xs font-bold text-white">{camp.impressions_count.toLocaleString('hu-HU')}</span>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 block">Kattintás</span>
                        <span className="text-xs font-bold text-accent">{camp.clicks_count.toLocaleString('hu-HU')}</span>
                      </div>
                      <div className="bg-[#1A1A1A] p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 block">CTR Átlag</span>
                        <span className="text-xs font-bold text-green-400">{ctr}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: VISUAL BANNER CREATIVE EDITOR */}
      {activeTab === 'creative_editor' && <BannerCreativeEditor />}

      {/* TAB 2: CAMPAIGN MANAGER */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-[#111] border border-[#222] p-4 rounded-2xl">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-gray-400 pr-2">Szűrés állapotra:</span>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === 'all' ? 'bg-accent text-black' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
                }`}
              >
                Összes ({campaigns.length})
              </button>
              {(Object.keys(STATUS_V2_CONFIG) as CampaignStatusV2[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    filterStatus === st ? 'bg-accent text-black' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{STATUS_V2_CONFIG[st].icon}</span>
                  <span>{STATUS_V2_CONFIG[st].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Campaign Cards Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Kampányok betöltése...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => {
                const loc = getPlacementLocation(camp.placement_slot);
                const statusCfg = STATUS_V2_CONFIG[camp.status_v2 || 'active'];
                const paymentCfg = PAYMENT_STATUS_CONFIG[camp.payment_status || 'paid'];

                return (
                  <div key={camp.id} className="bg-[#111111] border border-[#1E1E1E] hover:border-accent/40 rounded-3xl p-6 space-y-5 flex flex-col justify-between shadow-xl transition-all">
                    <div className="space-y-4">
                      {/* Top status bar */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${paymentCfg.color}`}>
                          {paymentCfg.label}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold text-accent uppercase tracking-wider block mb-1">
                          {camp.package_tier?.toUpperCase() || 'GOLD'} CSOMAG • {camp.sponsor_name}
                        </span>
                        <h2 className="text-base font-bold text-white line-clamp-2">{camp.title}</h2>
                      </div>

                      {/* Contact Info Box */}
                      {camp.contact_person && (
                        <div className="p-3 bg-[#161616] border border-[#222] rounded-2xl space-y-1 text-xs">
                          <div className="font-bold text-gray-200 flex items-center gap-1.5">
                            <UserCheck size={14} className="text-accent" /> {camp.contact_person.name}
                          </div>
                          <div className="text-gray-400 flex items-center gap-1.5 text-[11px]">
                            <Mail size={12} /> {camp.contact_person.email}
                          </div>
                          <div className="text-gray-400 flex items-center gap-1.5 text-[11px]">
                            <Phone size={12} /> {camp.contact_person.phone}
                          </div>
                        </div>
                      )}

                      {/* Where to find on site box */}
                      <div className="p-3 bg-[#181F33] border border-blue-500/30 rounded-2xl space-y-2">
                        <div className="text-[11px] font-extrabold text-blue-300">
                          {loc.label}
                        </div>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate(loc.page)}
                            className="w-full py-1.5 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-accent-hover transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            🚀 Ugrás az oldalra (Megtekintés)
                          </button>
                        )}
                      </div>

                      {/* Price & Contract Dates */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#222]">
                        <span className="text-gray-400">Díj: <strong className="text-white">{camp.price_huf ? `${camp.price_huf.toLocaleString('hu-HU')} Ft` : 'Egyedi'}</strong></span>
                        <span className="text-gray-400">Lejárat: <strong className="text-amber-400">{camp.end_date ? new Date(camp.end_date).toLocaleDateString('hu-HU') : 'Határozatlan'}</strong></span>
                      </div>
                    </div>

                    {/* Status Switcher Dropdown */}
                    <div className="space-y-2 pt-3 border-t border-[#1E1E1E]">
                      <div className="flex items-center gap-2">
                        <select
                          value={camp.status_v2 || 'active'}
                          onChange={(e) => handleStatusChange(camp.id, e.target.value as CampaignStatusV2)}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                        >
                          {(Object.keys(STATUS_V2_CONFIG) as CampaignStatusV2[]).map((st) => (
                            <option key={st} value={st}>
                              {STATUS_V2_CONFIG[st].icon} {STATUS_V2_CONFIG[st].label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={camp.payment_status || 'paid'}
                          onChange={(e) => handlePaymentChange(camp.id, e.target.value as PaymentStatus)}
                          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
                        >
                          {(Object.keys(PAYMENT_STATUS_CONFIG) as PaymentStatus[]).map((pst) => (
                            <option key={pst} value={pst}>
                              {PAYMENT_STATUS_CONFIG[pst].label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTRACTS & TEMPLATES SUITE (NEW) */}
      {activeTab === 'contracts' && (
        <div className="space-y-8">
          {/* Top Contract Management Header */}
          <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <FileText className="text-accent" size={24} /> Szerződés Kezelő & Sablon Rendszer
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Generálj egykattintásos szerződéseket sablon alapján, állíts be v1/v2/v3 verziókat és rögzítsd a partneri elfogadást bizonyító IP és időbélyeggel.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-accent-hover transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Új Szerződés Generálása
                </button>
              </div>
            </div>
          </div>

          {/* Contracts List Table */}
          <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck size={18} className="text-accent" /> Rögzített Reklámszerződések & Elfogadások
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#222] text-xs text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Szerződés Azonosító</th>
                    <th className="py-3 px-4">Partner Cég</th>
                    <th className="py-3 px-4">Kampány</th>
                    <th className="py-3 px-4">Összeg</th>
                    <th className="py-3 px-4">Verzió</th>
                    <th className="py-3 px-4">Szerződés Státusz</th>
                    <th className="py-3 px-4 text-right">Műveletek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222] text-xs text-gray-300">
                  {contracts.map((contract) => {
                    const stCfg = CONTRACT_STATUS_CONFIG[contract.status || 'draft'];
                    const latestVersion = contract.versions?.[contract.versions.length - 1];

                    return (
                      <tr key={contract.id} className="hover:bg-[#161616]">
                        <td className="py-3 px-4 font-mono font-extrabold text-accent">
                          {contract.contractNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{contract.partnerName}</td>
                        <td className="py-3 px-4 line-clamp-1">{contract.campaignTitle}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {contract.amount.toLocaleString('hu-HU')} Ft
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-400">
                          v{latestVersion?.versionNumber || 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${stCfg.bg} ${stCfg.text} ${stCfg.border}`}>
                            {stCfg.icon} {stCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setShowContractViewer(contract)}
                            className="px-3 py-1.5 bg-[#181F33] border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1"
                          >
                            <Eye size={12} /> Megtekintés / PDF
                          </button>
                          <button
                            onClick={() => {
                              setShowVersionModal(contract);
                              setNewVersionAmount(contract.amount);
                            }}
                            className="px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-black font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1"
                          >
                            <History size={12} /> Új Verzió (v{(latestVersion?.versionNumber || 1) + 1})
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contract Template System Gallery */}
          <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-accent" /> Rendszer Szerződés Sablonok (Template Engine)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="bg-[#161616] border border-[#222] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded border border-accent/20">
                      Aktív Sablon
                    </span>
                    <FileText size={16} className="text-gray-400" />
                  </div>

                  <h4 className="text-sm font-bold text-white">{tmpl.name}</h4>
                  <p className="text-xs text-gray-400">{tmpl.description}</p>

                  <div className="p-3 bg-[#0D0D0D] border border-[#222] rounded-xl text-[10px] font-mono text-gray-400 line-clamp-4 leading-relaxed">
                    {tmpl.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PARTNER ADVERTISERS */}
      {activeTab === 'partners' && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 size={20} className="text-accent" /> Hirdető Partnerek & Kapcsolattartók
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                A partner cégek és felelős marketing kapcsolattartóik regisztere.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from(new Set(campaigns.map((c) => c.sponsor_name))).map((sponsor) => {
              const partnerCamps = campaigns.filter((c) => c.sponsor_name === sponsor);
              const firstContact = partnerCamps[0]?.contact_person;

              return (
                <div key={sponsor} className="bg-[#161616] border border-[#222] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-accent/10 border border-accent/20 text-accent px-3 py-1 rounded-full uppercase">
                      Minősített Hirdető Partner
                    </span>
                    <span className="text-xs font-bold text-gray-400">{partnerCamps.length} kampány</span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{sponsor}</h3>

                  {firstContact ? (
                    <div className="p-3 bg-[#111] border border-[#222] rounded-xl space-y-1 text-xs">
                      <div className="font-bold text-gray-200">{firstContact.name} ({firstContact.role})</div>
                      <div className="text-gray-400 flex items-center gap-1.5"><Mail size={12} /> {firstContact.email}</div>
                      <div className="text-gray-400 flex items-center gap-1.5"><Phone size={12} /> {firstContact.phone}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Nincs rögzített kapcsolattartó.</div>
                  )}

                  <button
                    onClick={() => {
                      setSponsorName(sponsor);
                      setShowModal(true);
                    }}
                    className="w-full py-2 bg-accent/10 border border-accent/30 text-accent font-bold text-xs rounded-xl hover:bg-accent hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Új Kampány ehhez a Partnerhez
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: PACKAGES & PLACEMENTS */}
      {activeTab === 'packages' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Package size={20} className="text-accent" /> Reklámcsomagok & Elhelyezések Árazása
            </h2>
            <p className="text-xs text-gray-400">
              Előre definiált csomagárak és megjelenési lehetőségek az ÉpítőTudás portálon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AD_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="bg-[#111] border border-[#222] hover:border-accent/40 rounded-3xl p-6 space-y-6 flex flex-col justify-between shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">
                      {pkg.id} Csomag
                    </span>
                    <Tag size={16} className="text-accent" />
                  </div>

                  <h3 className="text-xl font-extrabold text-white">{pkg.name}</h3>
                  <div className="text-2xl font-black text-accent font-mono">
                    {pkg.monthlyPriceHuf.toLocaleString('hu-HU')} Ft <span className="text-xs font-normal text-gray-400">/ hó + ÁFA</span>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-[#222]">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="text-xs text-gray-300 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setPackageTier(pkg.id);
                    setPriceHuf(pkg.monthlyPriceHuf);
                    setPlacementSlot(pkg.recommendedPlacement);
                    setShowModal(true);
                  }}
                  className="w-full py-2.5 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-accent-hover transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Kampány Létrehozása Ezzel a Csomaggal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PAYMENTS & INVOICING */}
      {activeTab === 'payments' && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-accent" /> Fizetések & Számlázási Előkészítő Lista
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Aktív és lejárt számlázási tételek nyomon követése a pénzügy számára.
              </p>
            </div>

            <button
              onClick={() => alert('Számlázási lista sikeresen exportálva CSV formátumban!')}
              className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent font-bold text-xs rounded-xl hover:bg-accent hover:text-black transition-all flex items-center gap-2"
            >
              <Download size={14} /> Számlázási Export (CSV)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222] text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Partner</th>
                  <th className="py-3 px-4">Kampány</th>
                  <th className="py-3 px-4">Összeg</th>
                  <th className="py-3 px-4">Határidő</th>
                  <th className="py-3 px-4">Állapot</th>
                  <th className="py-3 px-4 text-right">Művelet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222] text-xs text-gray-300">
                {campaigns.map((camp) => {
                  const payCfg = PAYMENT_STATUS_CONFIG[camp.payment_status || 'paid'];

                  return (
                    <tr key={camp.id} className="hover:bg-[#161616]">
                      <td className="py-3 px-4 font-bold text-white">{camp.sponsor_name}</td>
                      <td className="py-3 px-4">{camp.title}</td>
                      <td className="py-3 px-4 font-mono font-bold text-accent">
                        {camp.price_huf ? `${camp.price_huf.toLocaleString('hu-HU')} Ft` : '49 000 Ft'}
                      </td>
                      <td className="py-3 px-4">
                        {camp.end_date ? new Date(camp.end_date).toLocaleDateString('hu-HU') : 'Folyamatos'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${payCfg.color}`}>
                          {payCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handlePaymentChange(camp.id, camp.payment_status === 'paid' ? 'unpaid' : 'paid')}
                          className="px-3 py-1 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-[11px] font-bold text-gray-200 rounded-lg"
                        >
                          {camp.payment_status === 'paid' ? 'Megjelölés Várakozóként' : 'Kiegyenlítve'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: NOTIFICATIONS & EXPIRATION WARNINGS */}
      {activeTab === 'notifications' && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BellRing size={20} className="text-accent" /> Automatikus Lejárati & Értesítési Központ
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              60 napos, 30 napos és 7 napos automatikus partneri figyelmeztetések logja.
            </p>
          </div>

          <div className="space-y-4">
            {campaigns.map((camp) => {
              const endDateObj = camp.end_date ? new Date(camp.end_date) : null;
              const daysLeft = endDateObj ? Math.ceil((endDateObj.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 999;

              let warningBadge = '🟢 Megfelelőidő';
              let warningClass = 'border-green-500/30 bg-green-500/10 text-green-400';

              if (daysLeft <= 7) {
                warningBadge = '🔴 Sürgős: Lejár 7 napon belül!';
                warningClass = 'border-red-500/30 bg-red-500/10 text-red-400';
              } else if (daysLeft <= 30) {
                warningBadge = '🟠 Figyelmeztetés: Lejár 30 napon belül!';
                warningClass = 'border-amber-500/30 bg-amber-500/10 text-amber-400';
              } else if (daysLeft <= 60) {
                warningBadge = '🟡 Tájékoztató: Lejár 60 napon belül';
                warningClass = 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
              }

              return (
                <div key={camp.id} className="p-4 bg-[#161616] border border-[#222] rounded-2xl flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${warningClass}`}>
                        {warningBadge}
                      </span>
                      <span className="text-xs font-bold text-white">{camp.sponsor_name}</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-200">{camp.title}</h4>
                    <p className="text-xs text-gray-400">
                      Kapcsolattartó: <strong>{camp.contact_person?.name || 'Partner'}</strong> ({camp.contact_person?.email || '-'})
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => alert(`Automatikus lejárati emlékeztető kiküldve a(z) ${camp.contact_person?.email || 'partner'} címre!`)}
                      className="px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent font-bold text-xs rounded-xl hover:bg-accent hover:text-black transition-all flex items-center gap-1.5"
                    >
                      <Mail size={12} /> Emlékeztető Küldése
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 8: REPORTS & CTR ANALYTICS */}
      {activeTab === 'reports' && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-accent" /> Kampány Riportok & Teljesítmény Elemzés
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Megjelenések, Kattintások és CTR (Click-Through Rate) partneri elszámolásokhoz.
              </p>
            </div>

            <button
              onClick={() => alert('Teljesítmény riport PDF formátumban letöltve!')}
              className="px-4 py-2 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-accent-hover transition-all flex items-center gap-2 shadow-md"
            >
              <Download size={14} /> Riport Letöltése (PDF)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => {
              const ctr =
                camp.impressions_count > 0
                  ? ((camp.clicks_count / camp.impressions_count) * 100).toFixed(1)
                  : '0.0';

              return (
                <div key={camp.id} className="p-5 bg-[#161616] border border-[#222] rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent uppercase tracking-wider">
                      {camp.sponsor_name}
                    </span>
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded border border-green-500/20">
                      CTR: {ctr}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{camp.title}</h3>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-[#111] rounded-xl space-y-1">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1"><Eye size={12} /> Összes Megjelenés</span>
                      <span className="text-sm font-extrabold text-white">{camp.impressions_count.toLocaleString('hu-HU')}</span>
                    </div>
                    <div className="p-3 bg-[#111] rounded-xl space-y-1">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1"><MousePointer size={12} /> Összes Kattintás</span>
                      <span className="text-sm font-extrabold text-accent">{camp.clicks_count.toLocaleString('hu-HU')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 9: PARTNER ACCEPTANCE PORTAL (INTERACTIVE SIMULATION) */}
      {activeTab === 'partner_portal' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Welcome Card for Partner */}
          <div className="bg-gradient-to-r from-[#181F33] to-[#0D121F] border border-blue-500/40 rounded-3xl p-6 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full uppercase border border-blue-500/20">
                🤝 Partner Fiók – Szerződés Elfogadás
              </span>
              <span className="text-xs font-bold text-gray-400">Üdvözlünk, Partner!</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              Szerződés Elfogadása & Visszaigazolása
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Az ÉpítőTudás által kiállított hirdetési megállapodás megtekintése és elektronikus elfogadása. Az elfogadás rögzíti az e-mail címed, időbélyeged és IP címed.
            </p>

            {/* Select contract */}
            <div className="pt-3 flex items-center gap-3">
              <span className="text-xs text-gray-300 font-bold whitespace-nowrap">Válassz Szerződést:</span>
              <select
                value={selectedPartnerContract?.id || ''}
                onChange={(e) => {
                  const match = contracts.find((c) => c.id === e.target.value);
                  if (match) setSelectedPartnerContract(match);
                }}
                className="w-full bg-[#111726] border border-[#232F47] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
              >
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber} • {c.partnerName} ({c.campaignTitle}) - [{c.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {acceptSuccess && (
            <div className="p-4 bg-green-500/10 border border-green-500/40 text-green-400 rounded-2xl flex items-center gap-3 font-bold text-sm">
              <ShieldCheck size={24} />
              A szerződés sikeresen elfogadva! Az IP cím és időbélyeg jogilag kötelező érvénnyel rögzítve. A kampány státusza AKTÍV-ra frissült.
            </div>
          )}

          {selectedPartnerContract && (
            <div className="bg-[#111111] border border-[#222] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Header Box */}
              <div className="flex items-center justify-between border-b border-[#222] pb-4">
                <div>
                  <span className="text-xs font-mono font-extrabold text-accent block">
                    {selectedPartnerContract.contractNumber}
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    {selectedPartnerContract.campaignTitle}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-accent font-mono">
                    {selectedPartnerContract.amount.toLocaleString('hu-HU')} Ft <span className="text-xs font-normal text-gray-400">+ ÁFA</span>
                  </div>
                  <span className="text-xs text-gray-400">Érvényes: {selectedPartnerContract.startDate} - {selectedPartnerContract.endDate}</span>
                </div>
              </div>

              {/* Document Text Box */}
              <div className="p-6 bg-[#0B0F19] border border-[#1E293B] rounded-2xl font-mono text-xs text-gray-300 leading-relaxed space-y-4 whitespace-pre-wrap">
                {selectedPartnerContract.content}
              </div>

              {/* Acceptance Audit Stamp if already accepted */}
              {selectedPartnerContract.acceptanceLog && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl space-y-2">
                  <div className="text-xs font-extrabold text-green-400 flex items-center gap-2">
                    <ShieldCheck size={18} /> ELEKTRONIKUSAN ELFOGADVA ÉS IGAZOLVA
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-300 font-mono pt-1 border-t border-green-500/20">
                    <div>Elfogadó: <strong>{selectedPartnerContract.acceptanceLog.acceptedBy}</strong></div>
                    <div>Email: <strong>{selectedPartnerContract.acceptanceLog.email}</strong></div>
                    <div>Dátum: <strong>{selectedPartnerContract.acceptanceLog.acceptedAt}</strong></div>
                    <div>IP Cím: <strong>{selectedPartnerContract.acceptanceLog.ipAddress}</strong></div>
                  </div>
                </div>
              )}

              {/* Acceptance Form if not yet accepted */}
              {selectedPartnerContract.status !== 'accepted' && (
                <form onSubmit={handlePartnerAcceptance} className="p-6 bg-[#161616] border border-[#222] rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck size={18} className="text-accent" /> Nyilatkozat & Elfogadás Rögzítése
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 font-semibold block mb-1">Képviselő Neve</label>
                      <input
                        type="text"
                        required
                        value={partnerSignName}
                        onChange={(e) => setPartnerSignName(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-semibold block mb-1">Képviselő Email Címe</label>
                      <input
                        type="email"
                        required
                        value={partnerSignEmail}
                        onChange={(e) => setPartnerSignEmail(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        updateContractStatus(selectedPartnerContract.id, 'declined');
                        alert('Módosítási kérelem továbbítva az adminisztrátornak!');
                        loadData();
                      }}
                      className="px-4 py-2.5 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold text-xs rounded-xl flex items-center gap-2"
                    >
                      <XCircle size={14} className="text-red-400" /> Kérdés / Módosítás Kérése
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Check size={16} /> [ Elfogadom a Szerződést ]
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* PRINTABLE CONTRACT VIEW MODAL */}
      {showContractViewer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#222] rounded-3xl w-full max-w-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-accent">{showContractViewer.contractNumber}</span>
                <h3 className="text-lg font-bold text-white">Szerződéses Hivatalos Dokumentum</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-accent-hover flex items-center gap-1.5"
                >
                  <Printer size={14} /> Nyomtatás / PDF
                </button>
                <button onClick={() => setShowContractViewer(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
              </div>
            </div>

            <div className="p-6 bg-white text-gray-900 rounded-2xl space-y-4 text-xs font-mono leading-relaxed whitespace-pre-wrap shadow-inner">
              {showContractViewer.content}

              {showContractViewer.acceptanceLog && (
                <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-400 space-y-1 text-[11px] text-gray-800">
                  <div className="font-bold text-green-700 flex items-center gap-1">
                    <ShieldCheck size={14} /> ELEKTRONIKUSAN ELFOGADOTT ÉS RÖGZÍTETT OKIRAT
                  </div>
                  <div>Elfogadó: {showContractViewer.acceptanceLog.acceptedBy} ({showContractViewer.acceptanceLog.email})</div>
                  <div>Időbélyeg: {showContractViewer.acceptanceLog.acceptedAt}</div>
                  <div>Rögzített IP Cím: {showContractViewer.acceptanceLog.ipAddress}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VERSION MODAL */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#222] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History size={18} className="text-accent" /> Új Verzió Létrehozása (v{(showVersionModal.versions?.length || 1) + 1})
              </h3>
              <button onClick={() => setShowVersionModal(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateVersionSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Módosított Díj (Ft + ÁFA)</label>
                <input
                  type="number"
                  required
                  value={newVersionAmount}
                  onChange={(e) => setNewVersionAmount(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Változás Indoklása / Megjegyzés</label>
                <textarea
                  rows={3}
                  value={newVersionNote}
                  onChange={(e) => setNewVersionNote(e.target.value)}
                  placeholder="pl. Díj emelése 299 000 Ft-ra új felületi kiemelés miatt..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(null)}
                  className="px-4 py-2 bg-[#1A1A1A] text-gray-400 font-semibold text-xs rounded-xl hover:text-white"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-accent-hover shadow-lg"
                >
                  Új Verzió Mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW CAMPAIGN V2 MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#222] rounded-3xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={20} className="text-accent" /> Új Reklámkampány & Szerződés Indítása
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Partner / Cég Neve</label>
                  <input
                    type="text"
                    required
                    value={sponsorName}
                    onChange={(e) => setSponsorName(e.target.value)}
                    placeholder="pl. Bosch Professional"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Kampány Címe</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="pl. Akkus Szerszámgépek 2026"
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Reklámcsomag Választó</label>
                  <select
                    value={packageTier}
                    onChange={(e) => {
                      const tier = e.target.value as PackageTier;
                      setPackageTier(tier);
                      const pkg = AD_PACKAGES.find((p) => p.id === tier);
                      if (pkg) {
                        setPriceHuf(pkg.monthlyPriceHuf);
                        setPlacementSlot(pkg.recommendedPlacement);
                      }
                    }}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="bronze">Bronze Csomag (49 000 Ft/hó)</option>
                    <option value="silver">Silver Csomag (99 000 Ft/hó)</option>
                    <option value="gold">Gold Csomag (249 000 Ft/hó)</option>
                    <option value="custom">Egyedi Szponzori Csomag</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Hirdetési Elhelyezés</label>
                  <select
                    value={placementSlot}
                    onChange={(e) => setPlacementSlot(e.target.value as 'top_banner' | 'sidebar' | 'in_feed')}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="top_banner">Fejléc Banner (top_banner)</option>
                    <option value="sidebar">Oldalsáv Kártya (sidebar)</option>
                    <option value="in_feed">Beágyazott Hirdetés (in_feed)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Díj (Ft + ÁFA)</label>
                  <input
                    type="number"
                    value={priceHuf}
                    onChange={(e) => setPriceHuf(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Fizetési Állapot</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="paid">Kiegyenlítve</option>
                    <option value="unpaid">Fizetésre vár</option>
                    <option value="partially_paid">Részben fizetve</option>
                    <option value="overdue">Fizetési hiba / Lejárt</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Szerződés Típusa</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as ContractType)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="once">Egyszeri Kampány</option>
                    <option value="monthly">Havi Előfizetés</option>
                    <option value="annual">Éves Partner Csomag</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Kezdő Állapot</label>
                  <select
                    value={statusV2}
                    onChange={(e) => setStatusV2(e.target.value as CampaignStatusV2)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="draft">🟡 Ajánlat készül</option>
                    <option value="contracting">🟠 Szerződés alatt</option>
                    <option value="pending_payment">🔵 Fizetésre vár</option>
                    <option value="active">🟢 Aktív</option>
                    <option value="renewing">🟣 Hosszabbítás alatt</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Kezdő Dátum</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Lejárati Dátum</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="pt-3 border-t border-[#222] space-y-3">
                <span className="text-xs font-bold text-accent block">Kapcsolattartó Adatai</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Név (pl. Nagy Péter)"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                  <input
                    type="email"
                    placeholder="Email (pl. nagy@partner.hu)"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                  <input
                    type="text"
                    placeholder="Telefon (pl. +36 30 123 4567)"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Cél URL (Website Link)</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] text-gray-400 font-semibold text-xs rounded-xl hover:text-white"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-accent-hover shadow-lg"
                >
                  Kampány & Szerződés Indítása
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
