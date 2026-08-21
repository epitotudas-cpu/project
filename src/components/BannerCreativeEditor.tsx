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
  Layout,
  Eye,
  Building2,
  Clock,
  RefreshCw,
  Plus,
  ArrowLeft,
  Edit3,
  Trash2,
  Check,
  Layers,
} from 'lucide-react';
import {
  getStoredCreatives,
  saveBannerCreative,
  saveStoredCreatives,
  resetCreativeToDefaults,
} from '../services/bannerCreativeService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';
import type {
  AdCreative,
  BackgroundStyle,
  ButtonStyle,
  TextAlign,
  AnimationType,
  TransitionEffect,
} from '../lib/supabase';

export function BannerCreativeEditor() {
  const [storedCreatives, setStoredCreatives] = useState<AdCreative[]>([]);
  
  // Navigation & View State: 'selector' (dashboard list of creatives) or 'editing' (form + live preview)
  const [editorView, setEditorView] = useState<'selector' | 'editing'>('selector');
  const [filterPlacement, setFilterPlacement] = useState<'all' | 'top_banner' | 'in_feed' | 'sidebar' | 'footer_banner'>('all');

  // Currently editing creative
  const [activeCreative, setActiveCreative] = useState<AdCreative | null>(null);

  // Preview options in editor mode
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [simulateReducedMotion, setSimulateReducedMotion] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);

  useEffect(() => {
    refreshCreativesList();
  }, []);

  function refreshCreativesList() {
    const creatives = getStoredCreatives();
    setStoredCreatives(creatives ? [...creatives] : []);
  }

  // Open editor for a specific creative
  function handleEditCreative(creative: AdCreative) {
    setActiveCreative({ ...creative });
    setEditorView('editing');
    setSaveSuccessMessage(null);
  }

  // Create a brand new creative for a placement
  function handleCreateNewCreative(placementKey: 'top_banner' | 'in_feed' | 'sidebar' | 'footer_banner' = 'top_banner') {
    const newId = `creative-${placementKey}-${Date.now()}`;
    const newCreative: AdCreative = {
      id: newId,
      placement_key: placementKey,
      partner_name: 'Új Hirdető Partner',
      badge_text: 'Hivatalos Ajánlat',
      headline: 'Új Szakmai Hirdetési Főcím 2026',
      description: 'Fedezd fel a legújabb ipari szerszámokat és akciókat.',
      cta_text: 'Ajánlat Megtekintése',
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
      sort_order: storedCreatives.filter((c) => c.placement_key === placementKey).length + 1,
      created_by: 'Admin',
      updated_at: new Date().toISOString(),
    };

    setActiveCreative(newCreative);
    setEditorView('editing');
    setSaveSuccessMessage(null);
  }

  // Toggle active status directly from selector card
  function handleToggleActive(creative: AdCreative, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = { ...creative, is_active: !creative.is_active, updated_at: new Date().toISOString() };
    saveBannerCreative(updated);
    refreshCreativesList();
  }

  // Delete creative record
  function handleDeleteCreative(creativeId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm('Biztosan törölni szeretnéd ezt a hirdetési kreatívot?')) return;
    const filtered = storedCreatives.filter((c) => c.id !== creativeId);
    saveStoredCreatives(filtered);
    refreshCreativesList();
  }

  // Return from editor to selector dashboard
  function handleBackToSelector() {
    refreshCreativesList();
    setEditorView('selector');
    setActiveCreative(null);
  }

  // Editor form input change handler
  function handleInputChange<K extends keyof AdCreative>(key: K, value: AdCreative[K]) {
    if (!activeCreative) return;
    setActiveCreative((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  // Save changes
  async function handleSave(isDraft = false) {
    if (!activeCreative) return;

    const toSave: AdCreative = {
      ...activeCreative,
      is_active: isDraft ? false : activeCreative.is_active,
      updated_at: new Date().toISOString(),
    };

    await saveBannerCreative(toSave);
    refreshCreativesList();

    setSaveSuccessMessage(
      isDraft
        ? '⚠️ Vázlatként elmentve! (Inaktív állapotban tárolva)'
        : '🎉 Hirdetés sikeresen mentve és élesítve!'
    );

    setTimeout(() => setSaveSuccessMessage(null), 4000);
  }

  // Reset current creative to default settings
  function handleReset() {
    if (!activeCreative) return;
    const resetItem = resetCreativeToDefaults(activeCreative.placement_key);
    setActiveCreative({ ...resetItem });
    refreshCreativesList();
    setSaveSuccessMessage('🔄 Alaphelyzet sikeresen visszaállítva!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  }

  // Visual style helpers for live preview & selector
  const getBackgroundClasses = (bg: BackgroundStyle) => {
    switch (bg) {
      case 'light_neutral':
        return 'bg-slate-50 text-slate-900 border border-slate-200 shadow-sm';
      case 'dark_slate':
        return 'bg-slate-950 text-white border border-slate-800 shadow-md';
      case 'petrol_teal':
        return 'bg-[#0F766E] text-white border border-teal-600 shadow-md';
      case 'glassmorphism':
        return 'bg-slate-900/90 backdrop-blur-xl text-white border border-white/20 shadow-md';
      case 'soft_gradient':
        return 'bg-gradient-to-r from-teal-900 via-slate-900 to-amber-950 text-white border border-teal-500/40 shadow-md';
      default:
        return 'bg-slate-50 text-slate-900';
    }
  };

  const getButtonClasses = (btn: ButtonStyle) => {
    switch (btn) {
      case 'petrol_teal':
        return 'bg-[#0F766E] hover:bg-[#115E59] text-white border border-teal-500/40';
      case 'amber_gold':
        return 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-400/50';
      case 'dark_slate':
        return 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/50';
      case 'outline':
        return 'bg-transparent border-2 border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white font-black';
      default:
        return 'bg-[#0F766E] text-white';
    }
  };

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

  // Filtered creatives list for selector
  const filteredCreatives = storedCreatives.filter(
    (c) => filterPlacement === 'all' || c.placement_key === filterPlacement
  );

  const topBannerCreatives = storedCreatives.filter((c) => c.placement_key === 'top_banner');
  const inFeedCreatives = storedCreatives.filter((c) => c.placement_key === 'in_feed');
  const sidebarCreatives = storedCreatives.filter((c) => c.placement_key === 'sidebar');
  const footerCreatives = storedCreatives.filter((c) => c.placement_key === 'footer_banner');

  // =========================================================================
  // VIEW 1: CREATIVE SELECTOR DASHBOARD (Directory of Advertisers/Banners)
  // =========================================================================
  if (editorView === 'selector') {
    return (
      <div className="space-y-8 animate-fade-in" style={{ color: textColor }}>
        {/* Header Bar */}
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} /> Kreatív Vizuális Kezelő Központ
            </div>
            <h2 style={{ color: textColor }} className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hirdetések &amp; Reklám Kreatívok Kiválasztása
            </h2>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Válaszd ki a szerkeszteni kívánt hirdetőt vagy hozz létre új vizuális banner kreatívot a kezdőlaphoz, cikkekhez vagy az aloldalakhoz.
            </p>
          </div>

          <button
            onClick={() => handleCreateNewCreative(filterPlacement === 'all' ? 'top_banner' : filterPlacement)}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="shrink-0 px-6 py-3.5 font-extrabold text-sm rounded-2xl shadow-lg transition-all duration-300 flex items-center gap-2.5 cursor-pointer hover:opacity-90 hover:scale-[1.02]"
          >
            <Plus size={18} />
            <span>Új Hirdetés Hozzáadása</span>
          </button>
        </div>

        {/* Filter Bar & Summary Statistics */}
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          {/* Placement Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setFilterPlacement('all')}
              style={
                filterPlacement === 'all'
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
              }
              className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                filterPlacement === 'all' ? 'shadow-sm font-extrabold' : 'hover:opacity-90'
              }`}
            >
              <Layers size={14} /> Összes ({storedCreatives.length})
            </button>

            <button
              onClick={() => setFilterPlacement('top_banner')}
              style={
                filterPlacement === 'top_banner'
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
              }
              className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                filterPlacement === 'top_banner' ? 'shadow-sm font-extrabold' : 'hover:opacity-90'
              }`}
            >
              📍 Fejléc Banner ({topBannerCreatives.length})
            </button>

            <button
              onClick={() => setFilterPlacement('in_feed')}
              style={
                filterPlacement === 'in_feed'
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
              }
              className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                filterPlacement === 'in_feed' ? 'shadow-sm font-extrabold' : 'hover:opacity-90'
              }`}
            >
              📍 In-Feed ({inFeedCreatives.length})
            </button>

            <button
              onClick={() => setFilterPlacement('sidebar')}
              style={
                filterPlacement === 'sidebar'
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
              }
              className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                filterPlacement === 'sidebar' ? 'shadow-sm font-extrabold' : 'hover:opacity-90'
              }`}
            >
              📍 Oldalsáv ({sidebarCreatives.length})
            </button>

            <button
              onClick={() => setFilterPlacement('footer_banner')}
              style={
                filterPlacement === 'footer_banner'
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
              }
              className={`px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                filterPlacement === 'footer_banner' ? 'shadow-sm font-extrabold' : 'hover:opacity-90'
              }`}
            >
              📍 Lábléc Banner ({footerCreatives.length})
            </button>
          </div>

          {/* Stats Pills */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded-xl">
              🟢 {storedCreatives.filter((c) => c.is_active).length} Aktív
            </span>
            <span className="bg-gray-500/10 border border-gray-500/30 text-gray-400 px-3 py-1 rounded-xl">
              ⚪ {storedCreatives.filter((c) => !c.is_active).length} Inaktív / Vázlat
            </span>
          </div>
        </div>

        {/* CREATIVE CARDS GRID GROUPED BY PLACEMENT */}
        {filteredCreatives.length === 0 ? (
          <div className="bg-[#111111] border border-[#222] rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto">
              <Layout size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-white">Nincs megjeleníthető hirdetés ebben a kategóriában</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Hozz létre egy új hirdetést a fenti gombra kattintva, vagy válts az "Összes" nézetre.
            </p>
            <button
              onClick={() => handleCreateNewCreative(filterPlacement === 'all' ? 'top_banner' : filterPlacement)}
              className="px-6 py-3 bg-accent text-black font-extrabold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <Plus size={16} /> Új Hirdetés Létrehozása
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. TOP BANNER GROUP */}
            {(filterPlacement === 'all' || filterPlacement === 'top_banner') && topBannerCreatives.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse" />
                    📍 Kezdőlapi Fejléc Hirdetési Sáv (Top Banner Rotator)
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {topBannerCreatives.length} Hirdetés a Rotátorban
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topBannerCreatives.map((creative) => (
                    <CreativeCard
                      key={creative.id}
                      creative={creative}
                      onEdit={() => handleEditCreative(creative)}
                      onToggleActive={(e) => handleToggleActive(creative, e)}
                      onDelete={(e) => handleDeleteCreative(creative.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 2. IN-FEED GROUP */}
            {(filterPlacement === 'all' || filterPlacement === 'in_feed') && inFeedCreatives.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                    📍 Tartalmak Közötti Hirdetési Sáv (In-Feed Rotator)
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {inFeedCreatives.length} Hirdetés a Rotátorban
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inFeedCreatives.map((creative) => (
                    <CreativeCard
                      key={creative.id}
                      creative={creative}
                      onEdit={() => handleEditCreative(creative)}
                      onToggleActive={(e) => handleToggleActive(creative, e)}
                      onDelete={(e) => handleDeleteCreative(creative.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 3. SIDEBAR GROUP */}
            {(filterPlacement === 'all' || filterPlacement === 'sidebar') && sidebarCreatives.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                    📍 Oldalsáv Banner Hirdetések (Sidebar)
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {sidebarCreatives.length} Hirdetés
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sidebarCreatives.map((creative) => (
                    <CreativeCard
                      key={creative.id}
                      creative={creative}
                      onEdit={() => handleEditCreative(creative)}
                      onToggleActive={(e) => handleToggleActive(creative, e)}
                      onDelete={(e) => handleDeleteCreative(creative.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4. FOOTER BANNER GROUP */}
            {(filterPlacement === 'all' || filterPlacement === 'footer_banner') && footerCreatives.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    📍 Lábléc Feletti Kiemelt Banner (Footer Banner)
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {footerCreatives.length} Hirdetés
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {footerCreatives.map((creative) => (
                    <CreativeCard
                      key={creative.id}
                      creative={creative}
                      onEdit={() => handleEditCreative(creative)}
                      onToggleActive={(e) => handleToggleActive(creative, e)}
                      onDelete={(e) => handleDeleteCreative(creative.id, e)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: VISUAL EDITOR & LIVE PREVIEW WORKSPACE
  // =========================================================================
  if (!activeCreative) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header Bar with Back Button & Quick Switcher */}
      <div className="bg-[#111111] border border-[#222] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleBackToSelector}
            className="px-4 py-2.5 bg-[#1A1A1A] hover:bg-[#2B2B2B] text-white font-bold text-xs rounded-xl border border-[#333] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Vissza a Hirdetések Listájához</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-accent uppercase font-bold">
                {activeCreative.placement_key}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-400">ID: {activeCreative.id}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white">
              Szerkesztés: {activeCreative.partner_name}
            </h2>
          </div>
        </div>

        {/* Quick Record Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <label className="text-xs text-gray-400 font-semibold hidden sm:inline-block">Másik Hirdetés:</label>
          <select
            value={activeCreative.id}
            onChange={(e) => {
              const target = storedCreatives.find((c) => c.id === e.target.value);
              if (target) handleEditCreative(target);
            }}
            className="bg-[#1A1A1A] border border-[#333] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-accent cursor-pointer"
          >
            {storedCreatives.map((c) => (
              <option key={c.id} value={c.id}>
                {c.partner_name} ({c.placement_key} - Prioritás: #{c.sort_order})
              </option>
            ))}
          </select>

          <button
            onClick={() => handleCreateNewCreative(activeCreative.placement_key)}
            className="px-3.5 py-2 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 text-teal-300 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Új</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccessMessage && (
        <div className="bg-teal-500/10 border border-teal-500/40 text-teal-300 p-4 rounded-2xl flex items-center gap-3 font-bold text-xs animate-banner-fade-in shadow-md">
          <CheckCircle2 size={18} className="text-teal-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Main Split-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls Form (6 Cols) */}
        <div className="lg:col-span-6 bg-[#111111] border border-[#222] rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layout size={18} className="text-accent" /> Kreatív Vizuális Beállítások
            </h3>
            <span className="text-xs text-gray-400 font-mono">
              Prioritás: #{activeCreative.sort_order}
            </span>
          </div>

          {/* Form Controls Grid */}
          <div className="space-y-4 text-xs">
            {/* Active Switcher & Sort Order */}
            <div className="grid grid-cols-2 gap-4 p-3.5 bg-[#161616] border border-[#222] rounded-2xl">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveCheckbox"
                  checked={activeCreative.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 rounded border-[#333] text-accent focus:ring-accent cursor-pointer"
                />
                <label htmlFor="isActiveCheckbox" className="font-bold text-white cursor-pointer select-none">
                  Banner Aktív (Megjelenik)
                </label>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <label className="text-gray-400 font-semibold">Prioritás (Sorrend):</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={activeCreative.sort_order}
                  onChange={(e) => handleInputChange('sort_order', Number(e.target.value))}
                  className="w-16 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2 py-1 text-white font-mono text-center font-bold"
                />
              </div>
            </div>

            {/* Placement Key & Partner Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 font-semibold block mb-1">Elhelyezési Sáv (Placement)</label>
                <select
                  value={activeCreative.placement_key}
                  onChange={(e) => handleInputChange('placement_key', e.target.value as AdCreative['placement_key'])}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent font-bold"
                >
                  <option value="top_banner">Fejléc Banner (Főoldal)</option>
                  <option value="in_feed">In-Feed Banner (Cikkek között)</option>
                  <option value="sidebar">Oldalsáv Banner (Sidebar)</option>
                  <option value="footer_banner">Lábléc Feletti Banner (Footer)</option>
                </select>
              </div>

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
            </div>

            {/* Badge Text & Headline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Description */}
            <div>
              <label className="text-gray-400 font-semibold block mb-1">Leírás (Description)</label>
              <textarea
                rows={2}
                value={activeCreative.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Fedezd fel a prémium ipari szerszámokat és akciókat..."
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent text-xs leading-relaxed"
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
                  placeholder="pl. Ajánlat megtekintése"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent font-bold"
                />
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">CTA Cél URL (Target Link)</label>
                <input
                  type="url"
                  value={activeCreative.cta_url}
                  onChange={(e) => handleInputChange('cta_url', e.target.value)}
                  placeholder="https://www.partner-weboldal.hu"
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

            {/* Visual Styling Grid */}
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
                  <option value="outline">Körvonalas Gomb (Outline)</option>
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
                <label className="text-gray-400 font-semibold block mb-1">Animáció Típusa</label>
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
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// HELPER COMPONENT: CREATIVE SELECTOR CARD
// =========================================================================
interface CreativeCardProps {
  creative: AdCreative;
  onEdit: () => void;
  onToggleActive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function CreativeCard({ creative, onEdit, onToggleActive, onDelete }: CreativeCardProps) {
  return (
    <div
      onClick={onEdit}
      className={`group relative bg-[#141414] border hover:border-accent rounded-3xl p-5 transition-all duration-300 shadow-xl flex flex-col justify-between gap-5 cursor-pointer hover:scale-[1.01] ${
        creative.is_active ? 'border-[#262626]' : 'border-red-500/20 opacity-75'
      }`}
    >
      <div className="space-y-4">
        {/* Card Header: Badges & Status */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border ${
                creative.is_active
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  creative.is_active ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              {creative.is_active ? 'Aktív' : 'Inaktív'}
            </span>

            <span className="bg-[#1F1F1F] border border-[#333] text-gray-300 font-mono text-[11px] px-2 py-0.5 rounded-full">
              Prioritás: #{creative.sort_order}
            </span>
          </div>

          <span className="text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5 uppercase">
            {creative.placement_key}
          </span>
        </div>

        {/* Thumbnail + Partner Info */}
        <div className="flex items-start gap-3.5">
          {creative.image_url ? (
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-black/40 shadow-sm">
              <img
                src={creative.image_url}
                alt={creative.partner_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Building2 size={20} />
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-white truncate group-hover:text-accent transition-colors">
                {creative.partner_name}
              </h4>
            </div>

            <p className="text-xs text-gray-300 font-semibold line-clamp-2 leading-snug">
              {creative.headline}
            </p>
          </div>
        </div>

        {/* Metadata Badges (Duration, Transition, Style) */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-400 pt-2 border-t border-[#1F1F1F]">
          <span className="bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Clock size={11} className="text-teal-400" /> {creative.rotation_seconds || 6} mp váltás
          </span>

          <span className="bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-0.5 rounded-lg flex items-center gap-1">
            <RefreshCw size={11} className="text-amber-400" /> {creative.transition_effect || 'slide_left'}
          </span>

          <span className="bg-[#1A1A1A] border border-[#2B2B2B] px-2 py-0.5 rounded-lg capitalize">
            🎨 {creative.background_style.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="pt-3 border-t border-[#1F1F1F] flex items-center justify-between gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-2 px-3 bg-accent/10 hover:bg-accent text-accent hover:text-black font-extrabold text-xs rounded-xl border border-accent/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Edit3 size={14} />
          <span>Szerkesztés</span>
        </button>

        <button
          onClick={onToggleActive}
          title={creative.is_active ? 'Inaktiválás' : 'Aktiválás'}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            creative.is_active
              ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          <Check size={14} />
        </button>

        <button
          onClick={onDelete}
          title="Reklám Törlése"
          className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
