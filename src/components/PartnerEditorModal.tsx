import { useState, useEffect } from 'react';
import {
  Building2,
  X,
  Image as ImageIcon,
  PhoneCall,
  Share2,
  Wrench,
  FolderGit2,
  ShieldCheck,
  BookOpen,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type {
  ExtendedPartner,
  PartnerCategory,
  ServiceItem,
  ReferenceItem,
  CertificateItem,
  RelatedContentItem,
} from '../services/partnerService';

interface PartnerEditorModalProps {
  partner: ExtendedPartner | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ExtendedPartner>) => Promise<void>;
}

type TabKey =
  | 'basic'
  | 'media'
  | 'contact'
  | 'social'
  | 'services'
  | 'references'
  | 'certificates'
  | 'related'
  | 'seo';

const PRESET_SPECIALTIES = [
  'Generálkivitelezés',
  'Szerkezetépítés',
  'Magasépítés',
  'Mélyépítés',
  'Épületfelújítás',
  'Építőanyag-kereskedelem',
  'Szerszám- és gépforgalmazás',
  'Építőipari Szakképzés',
];

export default function PartnerEditorModal({
  partner,
  isOpen,
  onClose,
  onSave,
}: PartnerEditorModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [officialName, setOfficialName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<PartnerCategory>('ceg');
  const [partnerType, setPartnerType] = useState('');
  const [description, setDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'inactive'>('published');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  // Media
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [logoBg, setLogoBg] = useState<'white' | 'light_gray' | 'transparent'>('white');

  // Contact
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonTitle, setContactPersonTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [operatingArea, setOperatingArea] = useState<'local' | 'county' | 'national'>('national');
  const [businessHours, setBusinessHours] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');

  // Social
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');

  // Repeatables
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [relatedContent, setRelatedContent] = useState<RelatedContentItem[]>([]);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isIndexable, setIsIndexable] = useState(true);

  useEffect(() => {
    if (partner) {
      setName(partner.name || '');
      setOfficialName(partner.official_name || '');
      setSlug(partner.slug || '');
      setCategory((partner.category as PartnerCategory) || 'ceg');
      setPartnerType(partner.partner_type || '');
      setDescription(partner.description || '');
      setDetailedDescription(partner.detailed_description || '');
      setStatus(partner.status || 'published');
      setIsFeatured(partner.is_featured || false);
      setIsVerified(partner.is_verified ?? true);

      setLogoUrl(partner.logo_url || '');
      setCoverUrl(partner.cover_url || '');
      setLogoBg(partner.logo_bg || 'white');

      setContactPersonName(partner.contact_person_name || '');
      setContactPersonTitle(partner.contact_person_title || '');
      setContactEmail(partner.contact_email || '');
      setContactPhone(partner.contact_phone || '');
      setWebsiteUrl(partner.website_url || '');
      setAddress(partner.address || '');
      setZipCode(partner.zip_code || '');
      setCity(partner.city || '');
      setCounty(partner.county || '');
      setOperatingArea(partner.operating_area || 'national');
      setBusinessHours(partner.business_hours || '');
      setInquiryEmail(partner.inquiry_email || '');

      setSocialFacebook(partner.social_facebook || '');
      setSocialLinkedin(partner.social_linkedin || '');
      setSocialInstagram(partner.social_instagram || '');
      setSocialYoutube(partner.social_youtube || '');

      setServices(partner.services || []);
      setReferences(partner.references || []);
      setCertificates(partner.certificates || []);
      setRelatedContent(partner.related_content || []);

      setSeoTitle(partner.seo_title || '');
      setSeoDescription(partner.seo_description || '');
      setIsIndexable(partner.is_indexable ?? true);
    } else {
      // New Partner Defaults
      setName('');
      setOfficialName('');
      setSlug('');
      setCategory('ceg');
      setPartnerType('');
      setDescription('');
      setDetailedDescription('');
      setStatus('published');
      setIsFeatured(false);
      setIsVerified(true);
      setLogoUrl('');
      setCoverUrl('');
      setLogoBg('white');
      setContactPersonName('');
      setContactPersonTitle('');
      setContactEmail('');
      setContactPhone('');
      setWebsiteUrl('');
      setAddress('');
      setZipCode('');
      setCity('');
      setCounty('');
      setOperatingArea('national');
      setBusinessHours('');
      setInquiryEmail('');
      setSocialFacebook('');
      setSocialLinkedin('');
      setSocialInstagram('');
      setSocialYoutube('');
      setServices([]);
      setReferences([]);
      setCertificates([]);
      setRelatedContent([]);
      setSeoTitle('');
      setSeoDescription('');
      setIsIndexable(true);
    }
    setSaveSuccess(false);
  }, [partner, isOpen]);

  if (!isOpen) return null;

  function generateSlugFromName(inputName: string) {
    const generated = inputName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generated || 'uj-partner');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert('Kérjük, adja meg a szervezet nevét!');
      return;
    }
    setSaving(true);

    const payload: Partial<ExtendedPartner> = {
      name: name.trim(),
      official_name: officialName.trim() || null,
      slug: (slug.trim() || name.trim()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category,
      partner_type: partnerType.trim() || null,
      description: description.trim() || null,
      detailed_description: detailedDescription.trim() || null,
      status,
      is_featured: isFeatured,
      is_verified: isVerified,
      logo_url: logoUrl.trim() || null,
      cover_url: coverUrl.trim() || null,
      logo_bg: logoBg,
      contact_person_name: contactPersonName.trim() || null,
      contact_person_title: contactPersonTitle.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      website_url: websiteUrl.trim() || null,
      address: address.trim() || null,
      zip_code: zipCode.trim() || null,
      city: city.trim() || null,
      county: county.trim() || null,
      operating_area: operatingArea,
      business_hours: businessHours.trim() || null,
      inquiry_email: inquiryEmail.trim() || null,
      social_facebook: socialFacebook.trim() || null,
      social_linkedin: socialLinkedin.trim() || null,
      social_instagram: socialInstagram.trim() || null,
      social_youtube: socialYoutube.trim() || null,
      services,
      references,
      certificates,
      related_content: relatedContent,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      is_indexable: isIndexable,
    };

    try {
      await onSave(payload);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Hiba a partner mentésekor:', err);
      alert('A partner adatainak mentésekor hiba történt.');
    } finally {
      setSaving(false);
    }
  }

  // Preset addition helper for services
  function addPresetService(serviceName: string) {
    if (services.some((s) => s.name === serviceName)) return;
    const newItem: ServiceItem = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: serviceName,
      description: '',
      icon_category: 'building',
      display_order: services.length + 1,
      is_active: true,
    };
    setServices([...services, newItem]);
  }

  const navTabs: { id: TabKey; label: string; icon: any }[] = [
    { id: 'basic', label: '1. Alapadatok', icon: Building2 },
    { id: 'media', label: '2. Megjelenés & Média', icon: ImageIcon },
    { id: 'contact', label: '3. Elérhetőségek', icon: PhoneCall },
    { id: 'social', label: '4. Közösségi Felületek', icon: Share2 },
    { id: 'services', label: '5. Szolgáltatások', icon: Wrench },
    { id: 'references', label: '6. Referenciák', icon: FolderGit2 },
    { id: 'certificates', label: '7. Tanúsítványok', icon: ShieldCheck },
    { id: 'related', label: '8. Kapcsolódó Tartalmak', icon: BookOpen },
    { id: 'seo', label: '9. SEO & Publikálás', icon: Globe },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="w-full max-w-6xl h-[92vh] bg-[#141719] text-white border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-800 bg-[#1a1d20] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {partner ? `Partner Szerkesztése: ${partner.name}` : 'Új Szervezet / Partner Hozzáadása'}
              </h2>
              <p className="text-xs text-gray-400">
                Részletes adatok, média, szakterületek és referenciák kezelése
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {partner?.slug && (
              <a
                href={`#partnerek/${partner.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-bold rounded-xl border border-white/10 transition-colors"
              >
                <Globe size={14} /> Előnézet <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Container (Left Nav + Right Form) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Navigation Bar */}
          <div className="w-full md:w-64 bg-[#181b1e] border-b md:border-b-0 md:border-r border-gray-800 p-2 sm:p-3 overflow-x-auto md:overflow-y-auto shrink-0 flex flex-row md:flex-col gap-1">
            {navTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap md:whitespace-normal text-left ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Form Content Area */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-[#141719]">
            <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6">
              {/* TAB 1: ALAPADATOK */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                    <Building2 className="text-amber-400" size={20} /> Szervezet Alapadatai
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        Szervezet Neve <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (!slug) generateSlugFromName(e.target.value);
                        }}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Hivatalos Cégnév</label>
                      <input
                        type="text"
                        value={officialName}
                        onChange={(e) => setOfficialName(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Egyedi URL azonosító (slug)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          placeholder=""
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm font-mono text-amber-400 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => generateSlugFromName(name)}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl shrink-0"
                        >
                          Generálás
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Partner Kategória</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as PartnerCategory)}
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                      >
                        <option value="gyarto">Gyártó</option>
                        <option value="kereskedo">Kereskedő</option>
                        <option value="ceg">Kivitelező Cég</option>
                        <option value="iskola">Oktatási Intézmény</option>
                        <option value="oktato">Oktató / Tréner</option>
                        <option value="tamogato">Támogató</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Partner Típusa</label>
                      <input
                        type="text"
                        value={partnerType}
                        onChange={(e) => setPartnerType(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Státusz</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                      >
                        <option value="published">Publikálva (Nyilvános)</option>
                        <option value="draft">Piszkozat (Rejtett)</option>
                        <option value="inactive">Inaktív</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-300">Rövid bemutatkozás (Kártyákhoz)</label>
                      <span className={`text-xs ${description.length > 220 ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                        {description.length} / 220 karakter
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder=""
                      className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl p-3 text-sm text-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">Részletes bemutatkozás (Publikus adatlapra)</label>
                    <textarea
                      rows={6}
                      value={detailedDescription}
                      onChange={(e) => setDetailedDescription(e.target.value)}
                      placeholder=""
                      className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl p-4 text-sm text-white focus:outline-hidden"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-800">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVerified}
                        onChange={(e) => setIsVerified(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-400 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Minősített Partner (Verified badge)
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-400 focus:ring-0"
                      />
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles size={14} /> Kiemelt Partner (Featured listázás)
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: MEGJELENÉS ÉS MÉDIA */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                    <ImageIcon className="text-amber-400" size={20} /> Megjelenés & Média
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Settings */}
                    <div className="bg-[#1a1d20] border border-gray-800 rounded-2xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white">Partner Logó</h4>

                      <div className="flex items-center gap-4">
                        <div
                          className={`w-24 h-24 rounded-xl border border-gray-700 p-2 flex items-center justify-center overflow-hidden shrink-0 ${
                            logoBg === 'white'
                              ? 'bg-white'
                              : logoBg === 'light_gray'
                              ? 'bg-gray-200'
                              : 'bg-transparent'
                          }`}
                        >
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-xs font-bold text-gray-500 uppercase">{name.substring(0, 2) || 'LOGÓ'}</span>
                          )}
                        </div>

                        <div className="space-y-2 flex-1">
                          <input
                            type="text"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder=""
                            className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <p className="text-[11px] text-gray-400">
                            Ajánlott méret: minimum 400 × 400 px (`object-fit: contain`)
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Logó háttérszíne</label>
                        <div className="flex gap-2">
                          {[
                            { id: 'white', label: 'Fehér' },
                            { id: 'light_gray', label: 'Szürke' },
                            { id: 'transparent', label: 'Átlátszó' },
                          ].map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setLogoBg(b.id as any)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                logoBg === b.id
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'bg-gray-800 text-gray-300 border-gray-700'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cover Settings */}
                    <div className="bg-[#1a1d20] border border-gray-800 rounded-2xl p-5 space-y-4">
                      <h4 className="text-sm font-bold text-white">Borítókép (Cover Banner)</h4>

                      <div className="h-24 rounded-xl border border-gray-700 overflow-hidden relative bg-gray-900">
                        {coverUrl ? (
                          <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold">
                            Nincs borítókép beállítva
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          placeholder=""
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white"
                        />
                        <p className="text-[11px] text-gray-400">
                          Ajánlott méret: minimum 1600 × 600 px (nagy felbontású tájkép)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ELÉRHETŐSÉGEK */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                    <PhoneCall className="text-amber-400" size={20} /> Elérhetőségek & Cím
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Kapcsolattartó Neve</label>
                      <input
                        type="text"
                        value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Kapcsolattartó Beosztása</label>
                      <input
                        type="text"
                        value={contactPersonTitle}
                        onChange={(e) => setContactPersonTitle(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Nyilvános E-mail</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Nyilvános Telefonszám</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Hivatalos Weboldal</label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Ajánlatkérő E-mail (ha eltér)</label>
                      <input
                        type="email"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Székhely / Telephely Cím</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Irányítószám</label>
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder=""
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-3 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Település</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder=""
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-3 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Vármegye / Régió</label>
                      <input
                        type="text"
                        value={county}
                        onChange={(e) => setCounty(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Működési Terület</label>
                      <select
                        value={operatingArea}
                        onChange={(e) => setOperatingArea(e.target.value as any)}
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      >
                        <option value="local">Helyi / Városi</option>
                        <option value="county">Vármegyei / Regionális</option>
                        <option value="national">Országos</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Nyitvatartás</label>
                      <input
                        type="text"
                        value={businessHours}
                        onChange={(e) => setBusinessHours(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: KÖZÖSSÉGI FELÜLETEK */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                    <Share2 className="text-amber-400" size={20} /> Közösségi Média Profilok
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Facebook URL</label>
                      <input
                        type="url"
                        value={socialFacebook}
                        onChange={(e) => setSocialFacebook(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">LinkedIn URL</label>
                      <input
                        type="url"
                        value={socialLinkedin}
                        onChange={(e) => setSocialLinkedin(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Instagram URL</label>
                      <input
                        type="url"
                        value={socialInstagram}
                        onChange={(e) => setSocialInstagram(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">YouTube URL</label>
                      <input
                        type="url"
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SZOLGÁLTATÁSOK ÉS SZAKTERÜLETEK */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Wrench className="text-amber-400" size={20} /> Szolgáltatások & Szakterületek
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setServices([
                          ...services,
                          {
                            id: `s-${Date.now()}`,
                            name: '',
                            description: '',
                            display_order: services.length + 1,
                            is_active: true,
                          },
                        ])
                      }
                      className="px-3.5 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Szakterület Hozzáadása
                    </button>
                  </div>

                  {/* Preset Chips */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 block">Gyors hozzáadás mintákból:</span>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_SPECIALTIES.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => addPresetService(preset)}
                          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg border border-gray-700 transition-colors"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Repeatable List */}
                  <div className="space-y-3 pt-2">
                    {services.length === 0 ? (
                      <div className="p-8 border border-gray-800 rounded-2xl text-center text-xs text-gray-500">
                        Még nem adtál hozzá egyetlen szakterületet sem. Használd a fenti mintákat!
                      </div>
                    ) : (
                      services.map((item, index) => (
                        <div
                          key={item.id}
                          className="bg-[#1a1d20] border border-gray-800 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const next = [...services];
                                next[index].name = e.target.value;
                                setServices(next);
                              }}
                              placeholder=""
                              className="flex-1 bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white font-bold"
                            />

                            <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(e) => {
                                  const next = [...services];
                                  next[index].is_active = e.target.checked;
                                  setServices(next);
                                }}
                                className="w-4 h-4 rounded text-emerald-500"
                              />
                              Aktív
                            </label>

                            <button
                              type="button"
                              onClick={() => setServices(services.filter((_, i) => i !== index))}
                              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => {
                              const next = [...services];
                              next[index].description = e.target.value;
                              setServices(next);
                            }}
                            placeholder=""
                            className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-gray-300"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: REFERENCIÁK */}
              {activeTab === 'references' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FolderGit2 className="text-amber-400" size={20} /> Referencia Projektek
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setReferences([
                          ...references,
                          {
                            id: `r-${Date.now()}`,
                            title: '',
                            image_url: '',
                            location: '',
                            year: '',
                            description: '',
                            is_published: true,
                            display_order: references.length + 1,
                          },
                        ])
                      }
                      className="px-3.5 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Projekt Hozzáadása
                    </button>
                  </div>

                  <div className="space-y-4">
                    {references.length === 0 ? (
                      <div className="p-8 border border-gray-800 rounded-2xl text-center text-xs text-gray-500">
                        Nincsenek bejegyzett referenciák. Adjon hozzá elvégzett projekteket!
                      </div>
                    ) : (
                      references.map((item, index) => (
                        <div
                          key={item.id}
                          className="bg-[#1a1d20] border border-gray-800 rounded-2xl p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const next = [...references];
                                next[index].title = e.target.value;
                                setReferences(next);
                              }}
                              placeholder=""
                              className="flex-1 bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm font-bold text-white"
                            />

                            <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.is_published}
                                onChange={(e) => {
                                  const next = [...references];
                                  next[index].is_published = e.target.checked;
                                  setReferences(next);
                                }}
                                className="w-4 h-4 rounded text-emerald-500"
                              />
                              Publikálva
                            </label>

                            <button
                              type="button"
                              onClick={() => setReferences(references.filter((_, i) => i !== index))}
                              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={item.location || ''}
                              onChange={(e) => {
                                const next = [...references];
                                next[index].location = e.target.value;
                                setReferences(next);
                              }}
                              placeholder=""
                              className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <input
                              type="text"
                              value={item.year || ''}
                              onChange={(e) => {
                                const next = [...references];
                                next[index].year = e.target.value;
                                setReferences(next);
                              }}
                              placeholder=""
                              className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <input
                              type="text"
                              value={item.image_url || ''}
                              onChange={(e) => {
                                const next = [...references];
                                next[index].image_url = e.target.value;
                                setReferences(next);
                              }}
                              placeholder=""
                              className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>

                          <textarea
                            rows={2}
                            value={item.description || ''}
                            onChange={(e) => {
                              const next = [...references];
                              next[index].description = e.target.value;
                              setReferences(next);
                            }}
                            placeholder=""
                            className="w-full bg-[#1e2225] border border-gray-700 rounded-xl p-3 text-xs text-white"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: TANÚSÍTVÁNYOK */}
              {activeTab === 'certificates' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="text-amber-400" size={20} /> Tanúsítványok & Minősítések
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setCertificates([
                          ...certificates,
                          {
                            id: `c-${Date.now()}`,
                            title: '',
                            issuer: '',
                            valid_until: '',
                            doc_url: '',
                            is_published: true,
                            display_order: certificates.length + 1,
                          },
                        ])
                      }
                      className="px-3.5 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Tanúsítvány Hozzáadása
                    </button>
                  </div>

                  <div className="space-y-3">
                    {certificates.length === 0 ? (
                      <div className="p-8 border border-gray-800 rounded-2xl text-center text-xs text-gray-500">
                        Még nem adtál hozzá minősítéseket vagy ISO tanúsítványokat.
                      </div>
                    ) : (
                      certificates.map((item, index) => (
                        <div
                          key={item.id}
                          className="bg-[#1a1d20] border border-gray-800 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const next = [...certificates];
                                next[index].title = e.target.value;
                                setCertificates(next);
                              }}
                              placeholder=""
                              className="flex-1 bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm font-bold text-white"
                            />

                            <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.is_published}
                                onChange={(e) => {
                                  const next = [...certificates];
                                  next[index].is_published = e.target.checked;
                                  setCertificates(next);
                                }}
                                className="w-4 h-4 rounded text-emerald-500"
                              />
                              Publikálva
                            </label>

                            <button
                              type="button"
                              onClick={() => setCertificates(certificates.filter((_, i) => i !== index))}
                              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={item.issuer || ''}
                              onChange={(e) => {
                                const next = [...certificates];
                                next[index].issuer = e.target.value;
                                setCertificates(next);
                              }}
                              placeholder=""
                              className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <input
                              type="date"
                              value={item.valid_until || ''}
                              onChange={(e) => {
                                const next = [...certificates];
                                next[index].valid_until = e.target.value;
                                setCertificates(next);
                              }}
                              className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: KAPCSOLÓDÓ TARTALMAK */}
              {activeTab === 'related' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <BookOpen className="text-amber-400" size={20} /> Kapcsolódó ÉpítőTudás Tartalmak (Max 6)
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (relatedContent.length >= 6) {
                          alert('Legfeljebb 6 kapcsolódó tartalom jelenhet meg a partner adatlapon.');
                          return;
                        }
                        setRelatedContent([
                          ...relatedContent,
                          {
                            id: `rc-${Date.now()}`,
                            title: '',
                            type: 'cikk',
                            url: '',
                            display_order: relatedContent.length + 1,
                          },
                        ]);
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Tartalom Csatolása
                    </button>
                  </div>

                  <div className="space-y-3">
                    {relatedContent.length === 0 ? (
                      <div className="p-8 border border-gray-800 rounded-2xl text-center text-xs text-gray-500">
                        Nincsenek csatolt platform tartalmak. Linkelhetsz szakmai cikkeket, útmutatókat vagy kalkulátorokat!
                      </div>
                    ) : (
                      relatedContent.map((item, index) => (
                        <div
                          key={item.id}
                          className="bg-[#1a1d20] border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                        >
                          <select
                            value={item.type}
                            onChange={(e) => {
                              const next = [...relatedContent];
                              next[index].type = e.target.value;
                              setRelatedContent(next);
                            }}
                            className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold"
                          >
                            <option value="cikk">Szakmai Cikk</option>
                            <option value="utmutato">Kivitelezési Útmutató</option>
                            <option value="kalkulator">Kalkulátor</option>
                            <option value="kepzes">Képzés / Kurzus</option>
                            <option value="konyv">Szakmai Könyv</option>
                          </select>

                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const next = [...relatedContent];
                              next[index].title = e.target.value;
                              setRelatedContent(next);
                            }}
                            placeholder=""
                            className="flex-1 bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                          />

                          <input
                            type="text"
                            value={item.url}
                            onChange={(e) => {
                              const next = [...relatedContent];
                              next[index].url = e.target.value;
                              setRelatedContent(next);
                            }}
                            placeholder=""
                            className="w-48 bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-gray-300"
                          />

                          <button
                            type="button"
                            onClick={() => setRelatedContent(relatedContent.filter((_, i) => i !== index))}
                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 9: SEO ÉS PUBLIKÁLÁS */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                    <Globe className="text-amber-400" size={20} /> SEO & Keresőoptimálás
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">SEO Cím (Title tag)</label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">SEO Meta Leírás (Description)</label>
                      <textarea
                        rows={3}
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-amber-400 rounded-xl p-3 text-sm text-white"
                      />
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={isIndexable}
                        onChange={(e) => setIsIndexable(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-400"
                      />
                      <span className="text-xs font-bold text-gray-200">
                        Keresőmotorok által indexelhető (Robots: index, follow)
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer Bar */}
            <div className="p-4 sm:p-5 border-t border-gray-800 bg-[#1a1d20] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Bezárás
              </button>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold animate-fade-in">
                    <CheckCircle2 size={16} />
                    <span>Mentés sikeres!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-black border-r-transparent" />
                      <span>Mentés folyamatban...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Változtatások Mentése & Publikálás</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
