import { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Monitor,
  Smartphone,
  Save,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  Layout,
  Play,
  Calendar,
  Eye,
  Building2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  getStoredCreatives,
  saveBannerCreative,
  resetCreativeToDefaults,
} from '../services/bannerCreativeService';
import { listAdCampaigns } from '../services/advertisementService';
import type {
  AdCreative,
  ExtendedAdCampaign,
  BackgroundStyle,
  ButtonStyle,
  TextAlign,
  AnimationType,
  TransitionEffect,
} from '../lib/supabase';

export function BannerCreativeEditor() {
  const [campaigns, setCampaigns] = useState<ExtendedAdCampaign[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState<'top_banner' | 'in_feed' | 'sidebar'>('top_banner');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('default');
  const [activeCreative, setActiveCreative] = useState<AdCreative | null>(null);

  // Preview options
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [simulateReducedMotion, setSimulateReducedMotion] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function initData() {
      const camps = await listAdCampaigns();
      setCampaigns(camps);
      loadCreativeForSelection(selectedPlacement, selectedCampaignId, camps);
    }
    initData();
  }, [selectedPlacement]);

  function loadCreativeForSelection(
    placementKey: 'top_banner' | 'in_feed' | 'sidebar',
    campaignId: string,
    campsList: ExtendedAdCampaign[] = campaigns
  ) {
    const list = getStoredCreatives();

    // Check if campaignId matches a specific campaign
    if (campaignId !== 'default') {
      const camp = campsList.find((c) => c.id === campaignId);
      if (camp) {
        const match = list.find((c) => c.campaign_id === camp.id || c.partner_name.toLowerCase() === camp.sponsor_name.toLowerCase());
        if (match) {
          setActiveCreative({
            ...match,
            placement_key: (camp.placement_slot as AdCreative['placement_key']) || placementKey,
          });
          return;
        } else {
          // Construct a creative template for this specific campaign
          const newCreativeForCampaign: AdCreative = {
            id: `creative-${camp.id}`,
            campaign_id: camp.id,
            placement_key: (camp.placement_slot as AdCreative['placement_key']) || placementKey,
            partner_name: camp.sponsor_name,
            badge_text: 'Hivatalos Partner',
            headline: camp.title,
            description: `Exkluzív ajánlat a(z) ${camp.sponsor_name} hivatalos kínálatából.`,
            cta_text: 'Ajánlat megtekintése',
            cta_url: camp.target_url || 'https://example.com',
            image_url: camp.banner_image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            mobile_image_url: camp.banner_image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
            background_style: 'light_neutral',
            overlay_style: 'none',
            button_style: 'petrol_teal',
            text_align: 'left',
            animation_type: 'pulse',
            transition_effect: 'slide_left',
            rotation_seconds: 6,
            is_active: camp.status_v2 === 'active',
            starts_at: camp.start_date || new Date().toISOString().split('T')[0],
            ends_at: camp.end_date || null,
            sort_order: 1,
            created_by: 'Admin',
            updated_at: new Date().toISOString(),
          };
          setActiveCreative(newCreativeForCampaign);
          return;
        }
      }
    }

    // Default fallback by placement
    const match = list.find((c) => c.placement_key === placementKey);
    if (match) {
      setActiveCreative({ ...match });
    } else {
      const defaultItem: AdCreative = {
        id: `creative-${placementKey}`,
        placement_key: placementKey,
        partner_name: 'Partner Cég Neve',
        badge_text: 'Hivatalos Partner',
        headline: 'Minta Hirdetési Főcím 2026',
        description: 'Ez a hirdetés leírása, amely részletezi a partneri ajánlatot.',
        cta_text: 'Ajánlat megtekintése',
        cta_url: 'https://example.com',
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
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: null,
        sort_order: 1,
        created_by: 'Admin',
        updated_at: new Date().toISOString(),
      };
      setActiveCreative(defaultItem);
    }
  }

  function handleCampaignSelect(campId: string) {
    setSelectedCampaignId(campId);
    if (campId !== 'default') {
      const camp = campaigns.find((c) => c.id === campId);
      if (camp?.placement_slot) {
        setSelectedPlacement(camp.placement_slot as typeof selectedPlacement);
      }
    }
    loadCreativeForSelection(selectedPlacement, campId, campaigns);
  }

  function handlePlacementSelect(placementKey: typeof selectedPlacement) {
    setSelectedPlacement(placementKey);
    setSelectedCampaignId('default');
    loadCreativeForSelection(placementKey, 'default', campaigns);
  }

  function handleInputChange<K extends keyof AdCreative>(field: K, value: AdCreative[K]) {
    if (!activeCreative) return;
    setActiveCreative({
      ...activeCreative,
      [field]: value,
    });
  }

  function handleSave(isDraft: boolean = false) {
    if (!activeCreative) return;

    const creativeToSave: AdCreative = {
      ...activeCreative,
      is_active: isDraft ? false : true,
    };

    saveBannerCreative(creativeToSave);
    setActiveCreative({ ...creativeToSave });
    setSaveSuccessMessage(
      isDraft
        ? 'Vázlat sikeresen elmentve (Rejtett állapotban)!'
        : 'Kreatív sikeresen élesítve és elmentve (Aktív állapotban)!'
    );
    setTimeout(() => setSaveSuccessMessage(null), 4000);
    loadCreativeForSelection(selectedPlacement, selectedCampaignId, campaigns);
  }

  function handleReset() {
    if (!confirm('Biztosan visszaállítod az alapértelmezett beállításokat erre a bannerre?')) return;
    const resetItem = resetCreativeToDefaults(selectedPlacement);
    setActiveCreative({ ...resetItem });
    setSaveSuccessMessage('Alaphelyzet sikeresen visszaállítva!');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  }

  if (!activeCreative) {
    return <div className="p-8 text-center text-gray-400">Kreatív szerkesztő betöltése...</div>;
  }

  // Animation CSS helpers
  const getAnimationClass = (anim: AnimationType) => {
    if (simulateReducedMotion) return '';
    switch (anim) {
      case 'fade_in':
        return 'animate-banner-fade-in';
      case 'float':
        return 'animate-banner-float';
      case 'pulse':
        return 'animate-banner-pulse';
      case 'marquee':
        return 'animate-banner-marquee';
      default:
        return '';
    }
  };

  // Background style helper
  const getBackgroundClasses = (bg: BackgroundStyle) => {
    switch (bg) {
      case 'light_neutral':
        return 'bg-slate-50 border border-slate-200 text-slate-900 shadow-sm';
      case 'dark_slate':
        return 'bg-slate-950 border border-slate-800 text-white shadow-xl';
      case 'petrol_teal':
        return 'bg-[#0F766E] border border-teal-600 text-white shadow-lg';
      case 'glassmorphism':
        return 'bg-slate-900/90 backdrop-blur-xl border border-white/20 text-white shadow-xl';
      case 'soft_gradient':
        return 'bg-gradient-to-r from-teal-900 via-slate-900 to-amber-950 border border-teal-500/40 text-white shadow-xl';
      default:
        return 'bg-slate-50 border border-slate-200 text-slate-900';
    }
  };

  // Button style helper
  const getButtonClasses = (btn: ButtonStyle) => {
    switch (btn) {
      case 'petrol_teal':
        return 'bg-[#0F766E] hover:bg-[#115E59] text-white border border-teal-500/40 shadow-sm';
      case 'amber_gold':
        return 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-400/50 shadow-md';
      case 'dark_slate':
        return 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/50 shadow-sm';
      case 'outline':
        return 'bg-transparent border-2 border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white font-black';
      default:
        return 'bg-[#0F766E] text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign & Placement Switcher Bar */}
      <div className="bg-[#111] border border-[#222] p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Campaign Selector Dropdown */}
          <div className="flex items-center gap-3 min-w-[320px] flex-1">
            <span className="text-xs font-extrabold text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20 flex items-center gap-2 shrink-0">
              <Building2 size={15} /> 🎯 Szerkesztendő Hirdető / Kampány:
            </span>
            <select
              value={selectedCampaignId}
              onChange={(e) => handleCampaignSelect(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333] hover:border-accent text-white text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="default">-- Alapértelmezett Placement Kreatívok --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  🏢 {c.sponsor_name} — {c.title} [{c.placement_slot.toUpperCase()}] ({c.status_v2 === 'active' ? '🟢 Aktív' : '🟡 ' + c.status_v2})
                </option>
              ))}
            </select>
          </div>

          {/* Save notification */}
          {saveSuccessMessage && (
            <div className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 size={14} /> {saveSuccessMessage}
            </div>
          )}
        </div>

        {/* Placement Quick Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#222]">
          <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
            <Palette size={13} className="text-accent" /> Elhelyezési Sáv:
          </span>
          {[
            { id: 'top_banner', label: '📍 Főoldali Fejléc Banner (Top Banner)' },
            { id: 'in_feed', label: '📍 Beágyazott Kártya Banner (In-Feed)' },
            { id: 'sidebar', label: '📍 Oldalsáv Banner (Sidebar)' },
          ].map((placement) => (
            <button
              key={placement.id}
              onClick={() => handlePlacementSelect(placement.id as typeof selectedPlacement)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlacement === placement.id
                  ? 'bg-accent text-black shadow-md scale-105'
                  : 'bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400 hover:text-white'
              }`}
            >
              {placement.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls Form (6 Cols) */}
        <div className="lg:col-span-6 bg-[#111111] border border-[#222] rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layout size={18} className="text-accent" /> Kreatív Vizuális Beállítások
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Kreatív ID: {activeCreative.id}
            </span>
          </div>

          {/* Form Controls Grid */}
          <div className="space-y-4 text-xs">
            {/* Active Switcher & Sort Order */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-[#161616] border border-[#222] rounded-2xl">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveCheckbox"
                  checked={activeCreative.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 rounded border-[#333] text-accent focus:ring-accent"
                />
                <label htmlFor="isActiveCheckbox" className="font-bold text-white cursor-pointer">
                  Banner Aktív (Megjelenik)
                </label>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <label className="text-gray-400 font-semibold">Prioritás (Sorrend):</label>
                <input
                  type="number"
                  value={activeCreative.sort_order}
                  onChange={(e) => handleInputChange('sort_order', Number(e.target.value))}
                  className="w-16 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2 py-1 text-white font-mono text-center"
                />
              </div>
            </div>

            {/* Partner Name & Badge Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 font-semibold block mb-1">Partner Neve</label>
                <input
                  type="text"
                  value={activeCreative.partner_name}
                  onChange={(e) => handleInputChange('partner_name', e.target.value)}
                  placeholder="pl. Bosch Professional"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent font-bold"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Felső Címke / Badge Szöveg</label>
                <input
                  type="text"
                  value={activeCreative.badge_text}
                  onChange={(e) => handleInputChange('badge_text', e.target.value)}
                  placeholder="pl. Hivatalos Partner / Kiemelt Ajánlat"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="text-gray-400 font-semibold block mb-1">Főcím (Headline)</label>
              <input
                type="text"
                value={activeCreative.headline}
                onChange={(e) => handleInputChange('headline', e.target.value)}
                placeholder="pl. Bosch Akkus Szerszámgépek & Zöld Lézeres Szintezők"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-accent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-gray-400 font-semibold block mb-1">Leírás (Description)</label>
              <textarea
                rows={2}
                value={activeCreative.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Rövid tájékoztató szöveg a hirdetésről..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* CTA Button Text & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 font-semibold block mb-1">CTA Gomb Szövege</label>
                <input
                  type="text"
                  value={activeCreative.cta_text}
                  onChange={(e) => handleInputChange('cta_text', e.target.value)}
                  placeholder="pl. Ajánlat megtekintése / Felfedezem"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">CTA Cél Link (URL)</label>
                <input
                  type="url"
                  value={activeCreative.cta_url}
                  onChange={(e) => handleInputChange('cta_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Image URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 font-semibold block mb-1 flex items-center gap-1">
                  <ImageIcon size={12} className="text-accent" /> Desktop Kép URL
                </label>
                <input
                  type="url"
                  value={activeCreative.image_url || ''}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://images.unsplash..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1 flex items-center gap-1">
                  <Smartphone size={12} className="text-accent" /> Mobil Kép URL (Külön)
                </label>
                <input
                  type="url"
                  value={activeCreative.mobile_image_url || ''}
                  onChange={(e) => handleInputChange('mobile_image_url', e.target.value)}
                  placeholder="https://images.unsplash..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Visual Styling Grid (Background, Button, Align, Animation) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#161616] border border-[#222] rounded-2xl">
              <div>
                <label className="text-gray-400 font-semibold block mb-1">Háttér Stílus</label>
                <select
                  value={activeCreative.background_style}
                  onChange={(e) => handleInputChange('background_style', e.target.value as BackgroundStyle)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                >
                  <option value="light_neutral">Világos Semleges (Light Neutral)</option>
                  <option value="dark_slate">Sötét Pala (Dark Slate)</option>
                  <option value="petrol_teal">Petrol Türkiz (Petrol Teal)</option>
                  <option value="glassmorphism">Üveg Hatás (Glassmorphism)</option>
                  <option value="soft_gradient">Finom Átmenet (Soft Gradient)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Gomb Stílus</label>
                <select
                  value={activeCreative.button_style}
                  onChange={(e) => handleInputChange('button_style', e.target.value as ButtonStyle)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                >
                  <option value="petrol_teal">Petrol Türkiz Gomb</option>
                  <option value="amber_gold">Borostyán Arany Gomb</option>
                  <option value="dark_slate">Sötét Grafitszürke Gomb</option>
                  <option value="outline">Szegélyes (Outline) Gomb</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Szöveg Igazítása</label>
                <select
                  value={activeCreative.text_align}
                  onChange={(e) => handleInputChange('text_align', e.target.value as TextAlign)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                >
                  <option value="left">Balra igazított (Left)</option>
                  <option value="center">Középre igazított (Center)</option>
                  <option value="right">Jobbra igazított (Right)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1 flex items-center gap-1">
                  <Play size={12} className="text-accent" /> Animáció Típusa
                </label>
                <select
                  value={activeCreative.animation_type}
                  onChange={(e) => handleInputChange('animation_type', e.target.value as AnimationType)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                >
                  <option value="none">Nincs animáció (Statikus)</option>
                  <option value="fade_in">Finom Fade-in Áttűnés</option>
                  <option value="float">Lassú Lebegés / Finom Mozgás</option>
                  <option value="marquee">Futó Szöveg / Ticker Jelzés</option>
                  <option value="pulse">Pulzáló Kiemelés</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1 flex items-center gap-1">
                  <Clock size={12} className="text-accent" /> Rotációs Időtartam (másodperc)
                </label>
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={activeCreative.rotation_seconds || 6}
                  onChange={(e) => handleInputChange('rotation_seconds', Math.max(2, Number(e.target.value)))}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1 flex items-center gap-1">
                  <RefreshCw size={12} className="text-accent" /> Áttűnés Stílusa Váltáskor
                </label>
                <select
                  value={activeCreative.transition_effect || 'slide_left'}
                  onChange={(e) => handleInputChange('transition_effect', e.target.value as TransitionEffect)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                >
                  <option value="slide_left">Csúsztatás Balra (Slide Left)</option>
                  <option value="slide_up">Csúsztatás Felfelé (Slide Up)</option>
                  <option value="fade">Finom Áttűnés (Fade)</option>
                  <option value="zoom">Zoom Pop-in Áttűnés</option>
                  <option value="instant">Azonnali Váltás (Nincs áttűnés)</option>
                </select>
              </div>
            </div>

            {/* Schedule Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 font-semibold block mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Időzítés: Kezdő Dátum
                </label>
                <input
                  type="date"
                  value={activeCreative.starts_at ? activeCreative.starts_at.split('T')[0] : ''}
                  onChange={(e) => handleInputChange('starts_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Időzítés: Lejárati Dátum
                </label>
                <input
                  type="date"
                  value={activeCreative.ends_at ? activeCreative.ends_at.split('T')[0] : ''}
                  onChange={(e) => handleInputChange('ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-4 border-t border-[#222] flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-[#161616] border border-[#333] hover:bg-[#222] text-gray-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={14} /> Alaphelyzet Visszaállítása
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave(true)}
                className="px-4 py-2.5 bg-[#181F33] border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save size={14} /> Vázlat Mentése
              </button>

              <button
                onClick={() => handleSave(false)}
                className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} /> [ Élesítés & Mentés ]
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Real-Time Banner Preview (6 Cols) */}
        <div className="lg:col-span-6 space-y-4 sticky top-6">
          {/* Preview Toolbar */}
          <div className="bg-[#111111] border border-[#222] rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye size={14} className="text-accent" /> Élő Előnézet (Live Preview)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop / Mobile Viewport Switcher */}
              <div className="bg-[#1A1A1A] p-1 rounded-xl flex items-center gap-1 border border-[#2B2B2B]">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'desktop'
                      ? 'bg-accent text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Monitor size={14} /> Desktop
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'mobile'
                      ? 'bg-accent text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Smartphone size={14} /> Mobil (375px)
                </button>
              </div>

              {/* Reduced Motion Toggle */}
              <button
                onClick={() => setSimulateReducedMotion(!simulateReducedMotion)}
                title="Szimulálja a böngésző prefers-reduced-motion beállítását"
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  simulateReducedMotion
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-[#1A1A1A] text-gray-400 border-[#2A2A2A] hover:text-white'
                }`}
              >
                ♿ Reduced Motion: {simulateReducedMotion ? 'BE' : 'KI'}
              </button>
            </div>
          </div>

          {/* Render Preview Frame */}
          <div
            className={`transition-all duration-300 mx-auto ${
              viewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
            }`}
          >
            <div className="bg-[#0A0D14] border border-[#222] rounded-3xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-[11px] text-gray-500 border-b border-[#1E1E1E] pb-2 font-mono">
                <span>Nézet: {viewMode === 'desktop' ? 'Desktop (Széles)' : 'Mobil (Keskeny)'}</span>
                <span>Placement: {activeCreative.placement_key}</span>
              </div>

              {/* LIVE RENDERED BANNER CREATIVE */}
              <div
                className={`w-full transition-all duration-300 p-4 rounded-2xl ${getBackgroundClasses(
                  activeCreative.background_style
                )} ${getAnimationClass(activeCreative.animation_type)}`}
              >
                <div
                  className={`flex items-center justify-between gap-4 flex-wrap ${
                    viewMode === 'mobile'
                      ? 'flex-col text-center items-center justify-center'
                      : activeCreative.text_align === 'center'
                      ? 'flex-col text-center items-center justify-center'
                      : activeCreative.text_align === 'right'
                      ? 'flex-row-reverse text-right items-center justify-between'
                      : 'flex-row text-left items-center justify-between'
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 min-w-0 ${
                      viewMode === 'mobile'
                        ? 'flex-col text-center items-center'
                        : activeCreative.text_align === 'center'
                        ? 'flex-col text-center items-center'
                        : activeCreative.text_align === 'right'
                        ? 'flex-row-reverse text-right items-center'
                        : 'flex-row text-left items-center'
                    }`}
                  >
                    {/* Image / Thumbnail */}
                    {(viewMode === 'mobile' ? activeCreative.mobile_image_url || activeCreative.image_url : activeCreative.image_url) ? (
                      <div className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200/40 w-12 h-12 bg-slate-100 shadow-sm">
                        <img
                          src={
                            viewMode === 'mobile'
                              ? activeCreative.mobile_image_url || activeCreative.image_url || ''
                              : activeCreative.image_url || ''
                          }
                          alt={activeCreative.partner_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
                        <Sparkles size={20} />
                      </div>
                    )}

                    {/* Text block */}
                    <div
                      className={`min-w-0 space-y-1 ${
                        activeCreative.text_align === 'center' || viewMode === 'mobile'
                          ? 'text-center'
                          : activeCreative.text_align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 flex-wrap ${
                          activeCreative.text_align === 'center' || viewMode === 'mobile'
                            ? 'justify-center'
                            : activeCreative.text_align === 'right'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/30 text-[#0F766E] font-bold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse" />
                          {activeCreative.partner_name}
                        </span>

                        {activeCreative.badge_text && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800">
                            <ShieldCheck size={13} className="text-[#0F766E]" /> {activeCreative.badge_text}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-extrabold leading-tight">
                        {activeCreative.headline}
                      </h4>

                      {activeCreative.description && (
                        <p className="text-xs opacity-80 leading-relaxed line-clamp-2">
                          {activeCreative.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <a
                    href={activeCreative.cta_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.preventDefault()}
                    className={`w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 ${getButtonClasses(
                      activeCreative.button_style
                    )}`}
                  >
                    <span>{activeCreative.cta_text || 'Ajánlat megtekintése'}</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Status Note */}
              <div className="text-[11px] text-gray-400 flex items-center justify-between pt-2 border-t border-[#1E1E1E]">
                <span>Státusz: <strong className={activeCreative.is_active ? 'text-green-400' : 'text-yellow-400'}>{activeCreative.is_active ? '🟢 AKTÍV (Megjelenik)' : '🟡 VÁZLAT (Rejtett)'}</strong></span>
                <span>Animáció: <strong className="text-accent">{activeCreative.animation_type}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
