import { useState } from 'react';
import {
  Palette,
  Compass,
  Megaphone,
  ShieldAlert,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  RotateCcw,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  getSiteSettings,
  saveSiteSettings,
  applySiteSettings,
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from '../services/siteSettingsService';
import {
  getImpressumData,
  saveImpressumData,
  DEFAULT_IMPRESSUM_DATA,
  type ImpressumData,
} from '../services/impressumService';

interface AdminSettingsPageProps {
  onNavigate?: (page: string) => void;
}

const PRESET_PALETTES = [
  { name: 'Építkezős Klasszikus (Arany/Sárga)', primary: '#FFC400', previewBg: '#FFC400' },
  { name: 'Ipari Kék (Professional Blue)', primary: '#2563EB', previewBg: '#2563EB' },
  { name: 'Sötét Építész (Modern Architecture)', primary: '#0B0F19', previewBg: '#3B82F6' },
  { name: 'Munkavédelmi Smaragdzöld', primary: '#059669', previewBg: '#059669' },
];

export default function AdminSettingsPage({ onNavigate }: AdminSettingsPageProps) {
  const [settings, setSettings] = useState<SiteSettings>(() => getSiteSettings());
  const [impressumData, setImpressumData] = useState<ImpressumData>(() => getImpressumData());
  const [activeTab, setActiveTab] = useState<'design' | 'impressum' | 'navigation' | 'ads' | 'system'>('design');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    saveSiteSettings(settings);
    saveImpressumData(impressumData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Biztosan visszaállítod az összes beállítást és impresszum adatot az alapértelmezett értékekre?')) {
      setSettings({ ...DEFAULT_SITE_SETTINGS });
      setImpressumData({ ...DEFAULT_IMPRESSUM_DATA });
      saveSiteSettings(DEFAULT_SITE_SETTINGS);
      saveImpressumData(DEFAULT_IMPRESSUM_DATA);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const toggleNavItem = (key: keyof SiteSettings['enabledNavItems']) => {
    setSettings((prev) => ({
      ...prev,
      enabledNavItems: {
        ...prev.enabledNavItems,
        [key]: !prev.enabledNavItems[key],
      },
    }));
  };

  return (
    <div className="space-[#111] min-h-screen text-gray-200 p-4 md:p-8 space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Palette className="text-accent" size={32} />
            Rendszer- és Design Beállítások
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Weboldal arculat, impresszum adatok, logó, navigációs menüpontok és reklámok központi testreszabása.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2"
          >
            <RotateCcw size={14} /> Alapértelmezett
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save size={16} /> Mentés & Alkalmazás
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl flex items-center gap-3 animate-fade-in text-sm font-bold">
          <CheckCircle2 size={20} />
          A beállítások és impresszum adatok sikeresen elmentve és alkalmazva a teljes weboldalon!
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#222] overflow-x-auto pb-2">
        {[
          { id: 'design', label: '🎨 Arculat & Színek', icon: Palette },
          { id: 'impressum', label: '🏢 Impresszum & Kapcsolat', icon: Building },
          { id: 'navigation', label: '🧭 Navigáció & Menü', icon: Compass },
          { id: 'ads', label: '📢 Reklámok & Ajánlatok', icon: Megaphone },
          { id: 'system', label: '⚙️ Rendszer & Biztonság', icon: ShieldAlert },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-accent text-black shadow-lg scale-105'
                  : 'bg-[#141414] border border-[#222] text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
              }`}
            >
              <IconComp size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BRANDING & DESIGN */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Branding Inputs */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white border-b border-[#222] pb-3 flex items-center gap-2">
              <ImageIcon size={20} className="text-accent" /> Weboldal Arculati Adatok
            </h2>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-2">Weboldal Neve (Site Title)</label>
              <input
                type="text"
                value={settings.siteTitle}
                onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                placeholder="ÉpítőTudás"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-2">Weboldal Szlogenje (Tagline)</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                placeholder="Építőipari Tudásbázis & Szakmai Enciklopédia"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-2">Weboldal Logó Képhivatkozás (Logo URL)</label>
              <input
                type="text"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent font-mono text-xs"
                placeholder="Hagyd üresen az alapértelmezett logóhoz (/logo.png)"
              />
              <p className="text-[11px] text-gray-500 mt-1">Ha üresen hagyod, az alapértelmezett ÉpítőTudás logó jelenik meg.</p>
            </div>
          </div>

          {/* Right Column: Theme & Live Preview */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white border-b border-[#222] pb-3 flex items-center gap-2">
              <Palette size={20} className="text-accent" /> Színtéma & Paletták
            </h2>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-300 block">Előre összeállított színpaletták</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_PALETTES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      const updated = { ...settings, primaryColor: preset.primary };
                      setSettings(updated);
                      applySiteSettings(updated);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      settings.primaryColor === preset.primary
                        ? 'border-accent bg-accent/10'
                        : 'border-[#222] bg-[#161616] hover:border-gray-500'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full shrink-0 shadow" style={{ backgroundColor: preset.previewBg }} />
                    <span className="text-xs font-bold text-white">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-2">Egyedi Elsődleges Színkód (Primary Color Hex)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => {
                    const updated = { ...settings, primaryColor: e.target.value };
                    setSettings(updated);
                    applySiteSettings(updated);
                  }}
                  className="w-12 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => {
                    const updated = { ...settings, primaryColor: e.target.value };
                    setSettings(updated);
                    applySiteSettings(updated);
                  }}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Live Header Preview Card */}
            <div className="pt-4 border-t border-[#222] space-y-2">
              <span className="text-xs font-bold text-gray-400 block">Fejléc Élő Előnézete</span>
              <div className="p-4 bg-[#0A0D14] border border-[#222] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={settings.logoUrl || '/logo.png'}
                    alt="Preview Logo"
                    className="h-8 w-auto object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  <span className="text-base font-bold text-white">
                    {settings.siteTitle || 'ÉpítőTudás'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-extrabold text-black" style={{ backgroundColor: settings.primaryColor }}>
                    Kiemelés
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: IMPRESSUM & CONTACT EDITING */}
      {activeTab === 'impressum' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Szolgáltatói & Kapcsolati Adatok */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white border-b border-[#222] pb-3 flex items-center gap-2">
              <ShieldCheck size={20} className="text-accent" /> 1. Szolgáltató Cégadatai &amp; Kapcsolat
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Building size={14} className="text-accent" /> Hivatalos Cégnév
                </label>
                <input
                  type="text"
                  value={impressumData.companyName}
                  onChange={(e) => setImpressumData({ ...impressumData, companyName: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5">Cégjegyzékszám</label>
                  <input
                    type="text"
                    value={impressumData.regNumber}
                    onChange={(e) => setImpressumData({ ...impressumData, regNumber: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5">Adószám</label>
                  <input
                    type="text"
                    value={impressumData.taxNumber}
                    onChange={(e) => setImpressumData({ ...impressumData, taxNumber: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-accent" /> Székhely Címe
                </label>
                <input
                  type="text"
                  value={impressumData.address}
                  onChange={(e) => setImpressumData({ ...impressumData, address: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-accent" /> Központi Email Cím
                  </label>
                  <input
                    type="email"
                    value={impressumData.email}
                    onChange={(e) => setImpressumData({ ...impressumData, email: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                    <Phone size={14} className="text-accent" /> Telefonszám
                  </label>
                  <input
                    type="text"
                    value={impressumData.phone}
                    onChange={(e) => setImpressumData({ ...impressumData, phone: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Tárhelyszolgáltató, Dokumentum metaadatok & Szerzői jogok */}
          <div className="space-y-6">
            {/* Tárhelyszolgáltató */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-[#222] pb-3 flex items-center gap-2">
                <Globe size={20} className="text-accent" /> 2. Tárhelyszolgáltató Adatai
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Szolgáltató Neve</label>
                  <input
                    type="text"
                    value={impressumData.hostingName}
                    onChange={(e) => setImpressumData({ ...impressumData, hostingName: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Cím / Székhely</label>
                  <input
                    type="text"
                    value={impressumData.hostingAddress}
                    onChange={(e) => setImpressumData({ ...impressumData, hostingAddress: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Weboldal URL</label>
                  <input
                    type="text"
                    value={impressumData.hostingWebsite}
                    onChange={(e) => setImpressumData({ ...impressumData, hostingWebsite: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Dokumentum Verzió & Szerzői jogok */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-[#222] pb-3 flex items-center gap-2">
                <FileText size={20} className="text-accent" /> 3. Jogi Nyilatkozat &amp; Verzió
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Hatálybalépés Kelte</label>
                  <input
                    type="text"
                    value={impressumData.effectiveDate}
                    onChange={(e) => setImpressumData({ ...impressumData, effectiveDate: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Verziószám</label>
                  <input
                    type="text"
                    value={impressumData.version}
                    onChange={(e) => setImpressumData({ ...impressumData, version: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Szerzői Jogok Nyilatkozata</label>
                <textarea
                  rows={4}
                  value={impressumData.copyrightContent}
                  onChange={(e) => setImpressumData({ ...impressumData, copyrightContent: e.target.value })}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NAVIGATION & MENU ITEMS */}
      {activeTab === 'navigation' && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl">
          <div>
            <h2 className="text-lg font-bold text-white border-b border-[#222] pb-3 flex items-center gap-2">
              <Compass size={20} className="text-accent" /> Felső Menüsor Elemek Kapcsolója
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Itt ki- és bekapcsolhatod a weboldal felső navigációs sávjában megjelenő menüpontokat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'home', label: 'Főoldal', desc: 'Kezdőlap és kiemelt szakmai témák', mandatory: true },
              { key: 'category', label: 'Kategóriák & Cikkek', desc: 'Építőipari kategóriák és cikktár' },
              { key: 'glossary', label: 'Fogalomtár', desc: 'Szakmai fogalmak és enciklopédia' },
              { key: 'tool', label: 'Eszközök (Enciklopédia)', desc: 'Szerszámok, gépek és eszközválasztó segéd' },
              { key: 'courses', label: 'Oktatás (Kurzusok)', desc: 'Szakmai képzések és tananyagok' },
              { key: 'careers', label: 'Karrier (Állások)', desc: 'Építőipari állásbörze' },
              { key: 'partners', label: 'Partnerek', desc: 'Gyártók, iskolák és szponzorok' },
            ].map((item) => {
              const isEnabled = settings.enabledNavItems[item.key as keyof SiteSettings['enabledNavItems']];

              return (
                <div
                  key={item.key}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    isEnabled
                      ? 'bg-[#181F33] border-blue-500/30'
                      : 'bg-[#161616] border-[#222] opacity-60'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{item.label}</h4>
                      {item.mandatory && (
                        <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded font-bold">Mindig Aktív</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>

                  {!item.mandatory && (
                    <button
                      onClick={() => toggleNavItem(item.key as keyof SiteSettings['enabledNavItems'])}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                        isEnabled ? 'bg-accent' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                          isEnabled ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ADS & MONETIZATION */}
      {activeTab === 'ads' && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl">
          <div>
            <h2 className="text-lg font-bold text-white border-b border-[#222] pb-3 flex items-center gap-2">
              <Megaphone size={20} className="text-accent" /> Reklámok & Partneri Ajánlatok Globális Kapcsolói
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Engedélyezd vagy tiltsd le a weboldalon megjelenő reklám- és affiliate felületeket.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                key: 'showTopBanners',
                title: 'Felső Kiemelt Reklámsáv (Top Banner)',
                desc: 'A főoldal tetején megjelenő széles partneri reklámsáv engedélyezése.',
                value: settings.showTopBanners,
              },
              {
                key: 'showSidebarAds',
                title: 'Oldalsávos Hirdetések (Sidebar Ads)',
                desc: 'A cikkek és kategóriák oldalsávjában megjelenő szponzori kártyák.',
                value: settings.showSidebarAds,
              },
              {
                key: 'showAffiliateOffers',
                title: 'Partneri & Affiliate Ajánlatok az Eszközök alatt',
                desc: 'Az Eszközök adatlapjának alján található vásárlási hivatkozások.',
                value: settings.showAffiliateOffers,
              },
            ].map((adOption) => (
              <div
                key={adOption.key}
                className="p-5 bg-[#161616] border border-[#222] rounded-2xl flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{adOption.title}</h4>
                  <p className="text-xs text-gray-400">{adOption.desc}</p>
                </div>

                <button
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      [adOption.key]: !prev[adOption.key as keyof SiteSettings],
                    }))
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    adOption.value ? 'bg-accent' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                      adOption.value ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {onNavigate && (
            <div className="pt-4 border-t border-[#222] flex items-center justify-between">
              <span className="text-xs text-gray-400">Egyedi reklámkampányok kezelése az Admin Ads menüben</span>
              <button
                onClick={() => onNavigate('ads')}
                className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent font-bold text-xs rounded-xl hover:bg-accent hover:text-black transition-all"
              >
                Ugrás a Reklámkezelőbe
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SYSTEM & SECURITY */}
      {activeTab === 'system' && (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-6 shadow-xl max-w-4xl">
          <div>
            <h2 className="text-lg font-bold text-white border-b border-[#222] pb-3 flex items-center gap-2">
              <ShieldAlert size={20} className="text-accent" /> Rendszer & Biztonsági Beállítások
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Karbantartási mód, látogatói korlátozások és regisztráció kezelése.
            </p>
          </div>

          <div className="space-y-6">
            {/* Maintenance mode */}
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-400">Karbantartási Mód (Maintenance Mode)</h4>
                  <p className="text-xs text-amber-200/80">Ha be van kapcsolva, a látogatóknak karbantartási üzenet jelenik meg.</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                    settings.maintenanceMode ? 'bg-amber-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                      settings.maintenanceMode ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {settings.maintenanceMode && (
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">Karbantartási Üzenet</label>
                  <textarea
                    rows={2}
                    value={settings.maintenanceMessage}
                    onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>

            {/* Registration toggle */}
            <div className="p-5 bg-[#161616] border border-[#222] rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Új Felhasználók Regisztrációjának Engedélyezése</h4>
                <p className="text-xs text-gray-400">Ha kikapcsolod, az új regisztrációk ideiglenesen fel vannak függesztve.</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                  settings.allowRegistration ? 'bg-accent' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                    settings.allowRegistration ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Auth requirement for detailed glossary */}
            <div className="p-5 bg-[#161616] border border-[#222] rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Részletes Fogalomtár Regisztrációhoz Kötése</h4>
                <p className="text-xs text-gray-400">A fogalmak részletes videói, leírásai és diáit csak a bejelentkezett userek láthatják.</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, requireAuthForDetailedGlossary: !settings.requireAuthForDetailedGlossary })}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                  settings.requireAuthForDetailedGlossary ? 'bg-accent' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                    settings.requireAuthForDetailedGlossary ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
