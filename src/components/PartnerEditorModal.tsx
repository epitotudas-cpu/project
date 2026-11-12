import { useState, useEffect, useRef } from 'react';
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
  Upload,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  getCategoryLabel,
  type ExtendedPartner,
  type PartnerCategory,
  type ServiceItem,
  type ReferenceItem,
  type CertificateItem,
  type RelatedContentItem,
} from '../services/partnerService';
import {
  getPartnerReferences,
  syncPartnerReferences,
  resolveReferenceImageUrl,
} from '../services/referenceService';

interface PartnerEditorModalProps {
  partner: ExtendedPartner | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ExtendedPartner>) => Promise<void>;
  isAdmin?: boolean;
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
  isAdmin = false,
}: PartnerEditorModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Logo upload state & ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccessMessage, setLogoSuccessMessage] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [officialName, setOfficialName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<PartnerCategory>('ceg');
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
  const [loadingReferences, setLoadingReferences] = useState(false);
  const initialReferenceIdsRef = useRef<string[]>([]);
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
      setCertificates(partner.certificates || []);
      setRelatedContent(partner.related_content || []);

      // Referenciák betöltése az adatbázisból (partner_references & partner_reference_images)
      if (partner.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partner.id)) {
        setLoadingReferences(true);
        getPartnerReferences(partner.id, false)
          .then((dbRefs) => {
            if (dbRefs && dbRefs.length > 0) {
              initialReferenceIdsRef.current = dbRefs.map((r) => r.id);
              const mapped: ReferenceItem[] = dbRefs.map((r, idx) => {
                const cover = r.cover_image || r.images?.[0];
                const coverUrl = cover ? resolveReferenceImageUrl(cover) : '';
                const imgUrls = (r.images || []).map((img) => resolveReferenceImageUrl(img));
                return {
                  id: r.id,
                  title: r.title || '',
                  image_url: coverUrl,
                  images: imgUrls.length > 0 ? imgUrls : (coverUrl ? [coverUrl] : []),
                  location: r.location || '',
                  year: r.year || '',
                  description: r.description || '',
                  is_published: r.is_published ?? false,
                  display_order: idx + 1,
                };
              });
              setReferences(mapped);
            } else {
              initialReferenceIdsRef.current = [];
              setReferences(partner.references || []);
            }
          })
          .catch((err) => {
            console.warn('Nem sikerült betölteni a referenciákat az adatbázisból:', err);
            initialReferenceIdsRef.current = [];
            setReferences(partner.references || []);
          })
          .finally(() => {
            setLoadingReferences(false);
          });
      } else {
        initialReferenceIdsRef.current = [];
        setReferences(partner.references || []);
      }

      setSeoTitle(partner.seo_title || '');
      setSeoDescription(partner.seo_description || '');
      setIsIndexable(partner.is_indexable ?? true);
    } else {
      // New Partner Defaults
      setName('');
      setOfficialName('');
      setSlug('');
      setCategory('ceg');
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
      initialReferenceIdsRef.current = [];
      setCertificates([]);
      setRelatedContent([]);
      setSeoTitle('');
      setSeoDescription('');
      setIsIndexable(true);
    }
    setSaveSuccess(false);
    setSaveError(null);
    setLogoError(null);
    setLogoSuccessMessage(null);
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

  function handleLogoFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setLogoError(null);
    setLogoSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported formats: PNG, JPG, JPEG, SVG
    const validMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const validExtensions = /\.(png|jpe?g|svg)$/i;

    if (!validMimeTypes.includes(file.type.toLowerCase()) && !validExtensions.test(file.name)) {
      setLogoError('Nem támogatott fájlformátum. Csak PNG, JPG, JPEG és SVG formátumok engedélyezettek.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Max size: 2 MB
    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setLogoError('A feltöltött fájl mérete meghaladja a megengedett 2 MB-os korlátot.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result;
      if (typeof result === 'string') {
        setLogoUrl(result);
        setLogoSuccessMessage('A logó előnézete sikeresen betöltve. A véglegesítéshez kattintson a „Változtatások Mentése & Publikálás” gombra.');
      }
    };
    reader.onerror = () => {
      setLogoError('Hiba történt a fájl beolvasása során. Kérjük, próbálja újra.');
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    if (window.confirm('Biztosan törli a logót?')) {
      setLogoUrl('');
      setLogoError(null);
      setLogoSuccessMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert('Kérjük, adja meg a szervezet nevét!');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setLogoError(null);

    const payload: Partial<ExtendedPartner> = {
      name: name.trim(),
      official_name: officialName.trim() || null,
      description: description.trim() || null,
      detailed_description: detailedDescription.trim() || null,
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

    // Platformszintű mezők kizárólag admin módban kerülhetnek a mentési payloadba
    if (isAdmin) {
      payload.category = category;
      payload.slug = (slug.trim() || name.trim()).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      payload.status = status;
      payload.is_featured = isFeatured;
      payload.is_verified = isVerified;
    }

    try {
      await onSave(payload);

      // Referenciák és képeik szinkronizálása a partner_references és partner_reference_images táblákkal
      if (partner?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partner.id)) {
        try {
          const updatedDbRefs = await syncPartnerReferences(partner.id, references, initialReferenceIdsRef.current);
          if (updatedDbRefs && updatedDbRefs.length > 0) {
            initialReferenceIdsRef.current = updatedDbRefs.map((r) => r.id);
          }
        } catch (syncErr) {
          console.warn('Figyelmeztetés a referenciák adatbázis-szinkronizálásakor:', syncErr);
        }
      }

      setSaveSuccess(true);
      setLogoSuccessMessage(null);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Hiba a partner mentésekor:', err);
      const msg = err?.message || 'A partner adatainak mentésekor hiba történt. Kérjük, próbálja újra.';
      setSaveError(msg);
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
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
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
          <div className="w-full md:w-64 bg-[#181b1e] border-b md:border-b-0 md:border-r border-gray-800 p-2 sm:p-3 overflow-x-auto md:overflow-y-auto shrink-0 flex flex-row md:flex-col gap-1.5 scrollbar-none">
            {navTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-xl font-bold text-xs transition-all shrink-0 whitespace-nowrap md:whitespace-normal text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
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
            <div className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto space-y-6">
              {/* TAB 1: ALAPADATOK */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                    <Building2 className="text-blue-400" size={20} /> Szervezet Alapadatai
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">
                        Szervezet Neve <span className="text-blue-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (!slug && isAdmin) generateSlugFromName(e.target.value);
                        }}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Hivatalos Cégnév</label>
                      <input
                        type="text"
                        value={officialName}
                        onChange={(e) => setOfficialName(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                      />
                    </div>

                    {isAdmin ? (
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Egyedi URL azonosító (slug)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder=""
                            className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-mono text-blue-400 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => generateSlugFromName(name)}
                            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold rounded-xl shrink-0 transition-colors"
                          >
                            Generálás
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Egyedi URL azonosító (slug)</label>
                        <input
                          type="text"
                          value={slug}
                          readOnly
                          disabled
                          className="w-full bg-[#15181a] border border-gray-800 rounded-xl px-4 py-3 text-sm font-mono text-gray-400 cursor-not-allowed"
                        />
                      </div>
                    )}

                    {isAdmin ? (
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Partner Kategória</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as PartnerCategory)}
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                        >
                          <option value="gyarto">Gyártó</option>
                          <option value="kereskedo">Kereskedő</option>
                          <option value="ceg">Kivitelező Cég</option>
                          <option value="iskola">Oktatási Intézmény</option>
                          <option value="oktato">Oktató / Tréner</option>
                          <option value="tamogato">Támogató</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Partner Kategória</label>
                        <div className="w-full bg-[#15181a] border border-gray-800 rounded-xl px-4 py-3 text-sm font-semibold text-blue-400">
                          {getCategoryLabel(category)}
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Státusz</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-hidden"
                        >
                          <option value="published">Publikálva (Nyilvános)</option>
                          <option value="draft">Piszkozat (Rejtett)</option>
                          <option value="inactive">Inaktív</option>
                        </select>
                      </div>
                    )}
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
                      className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl p-3 text-sm text-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">Részletes bemutatkozás (Publikus adatlapra)</label>
                    <textarea
                      rows={6}
                      value={detailedDescription}
                      onChange={(e) => setDetailedDescription(e.target.value)}
                      placeholder=""
                      className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl p-4 text-sm text-white focus:outline-hidden"
                    />
                  </div>

                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-800">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isVerified}
                          onChange={(e) => setIsVerified(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500"
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
                          className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                          <Sparkles size={14} /> Kiemelt Partner (Featured listázás)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MEGJELENÉS ÉS MÉDIA */}
              {activeTab === 'media' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                    <ImageIcon className="text-blue-400" size={20} /> Megjelenés & Média
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Settings */}
                    <div className="bg-[#1a1d20] border border-gray-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Building2 size={16} className="text-blue-400" />
                          Partner Logó
                        </h4>
                        {logoUrl && (
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            Logó beállítva
                          </span>
                        )}
                      </div>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoFileSelect}
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml,.png,.jpg,.jpeg,.svg"
                        className="hidden"
                      />

                      {/* Preview Container + Actions */}
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        <div
                          className={`w-28 h-28 rounded-xl border border-gray-700 p-2.5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner ${
                            logoBg === 'white'
                              ? 'bg-white'
                              : logoBg === 'light_gray'
                              ? 'bg-gray-200'
                              : 'bg-transparent'
                          }`}
                        >
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt="Partner logó előnézet"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-2">
                              <Building2 className="w-8 h-8 text-gray-500 mb-1" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {name ? name.substring(0, 2).toUpperCase() : 'NINCS LOGÓ'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 flex-1 w-full text-center sm:text-left">
                          {!logoUrl ? (
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoError(null);
                                  fileInputRef.current?.click();
                                }}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                              >
                                <Upload size={15} />
                                Logó feltöltése
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoError(null);
                                  fileInputRef.current?.click();
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl border border-gray-700 transition-colors cursor-pointer"
                              >
                                <RefreshCw size={14} />
                                Logó cseréje
                              </button>
                              <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold text-xs rounded-xl border border-rose-800/60 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                                Logó törlése
                              </button>
                            </div>
                          )}

                          {/* Direct URL input fallback */}
                          <div className="pt-1">
                            <input
                              type="text"
                              value={logoUrl}
                              onChange={(e) => {
                                setLogoError(null);
                                setLogoUrl(e.target.value);
                              }}
                              placeholder="vagy adja meg a logó közvetlen URL címét (https://...)"
                              className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500"
                            />
                          </div>

                          {/* Error Banner */}
                          {logoError && (
                            <div className="p-2.5 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold flex items-start gap-2 text-left">
                              <AlertCircle size={15} className="shrink-0 mt-0.5" />
                              <span>{logoError}</span>
                            </div>
                          )}

                          {/* Pre-save informative hint */}
                          {logoSuccessMessage && (
                            <div className="p-2.5 bg-blue-950/50 border border-blue-800 text-blue-300 rounded-xl text-xs font-semibold flex items-start gap-2 text-left">
                              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-blue-400" />
                              <span>{logoSuccessMessage}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Required Guide Text */}
                      <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-800/60 pt-3">
                        Töltse fel vállalkozása logóját. Ajánlott méret: minimum 400 × 400 px. Támogatott formátumok: PNG, JPG, SVG. A logó a nyilvános partnerprofilján és a partnerlistában jelenik meg.
                      </p>

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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                logoBg === b.id
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
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
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white"
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
                    <PhoneCall className="text-blue-400" size={20} /> Elérhetőségek & Cím
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Kapcsolattartó Neve</label>
                      <input
                        type="text"
                        value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Kapcsolattartó Beosztása</label>
                      <input
                        type="text"
                        value={contactPersonTitle}
                        onChange={(e) => setContactPersonTitle(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Nyilvános E-mail</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Nyilvános Telefonszám</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Hivatalos Weboldal</label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Ajánlatkérő E-mail (ha eltér)</label>
                      <input
                        type="email"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Székhely / Telephely Cím</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
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
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-3 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1.5">Település</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder=""
                          className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-3 text-sm text-white"
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
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Működési Terület</label>
                      <select
                        value={operatingArea}
                        onChange={(e) => setOperatingArea(e.target.value as any)}
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
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
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: KÖZÖSSÉGI FELÜLETEK */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <h3 className="text-base font-bold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
                    <Share2 className="text-blue-400" size={20} /> Közösségi Média Profilok
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Facebook URL</label>
                      <input
                        type="url"
                        value={socialFacebook}
                        onChange={(e) => setSocialFacebook(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">LinkedIn URL</label>
                      <input
                        type="url"
                        value={socialLinkedin}
                        onChange={(e) => setSocialLinkedin(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">Instagram URL</label>
                      <input
                        type="url"
                        value={socialInstagram}
                        onChange={(e) => setSocialInstagram(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">YouTube URL</label>
                      <input
                        type="url"
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
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
                      <Wrench className="text-blue-400" size={20} /> Szolgáltatások & Szakterületek
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
                      className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-colors flex items-center gap-1.5"
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
                              className="flex-1 bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white font-bold"
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
                            className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-gray-300"
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
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <FolderGit2 className="text-blue-400" size={20} /> Referencia Projektek & Galéria
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Adja hozzá elvégzett beruházásait, referenciaépületeit és fotóit.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setReferences([
                          ...references,
                          {
                            id: `r-${Date.now()}`,
                            title: '',
                            image_url: '',
                            images: [],
                            location: '',
                            year: '',
                            description: '',
                            is_published: true,
                            display_order: references.length + 1,
                          },
                        ])
                      }
                      className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus size={14} /> Új Referencia Hozzáadása
                    </button>
                  </div>

                  <div className="space-y-4">
                    {loadingReferences ? (
                      <div className="p-8 border border-gray-800 rounded-2xl text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin text-blue-400" />
                        <span>Referenciák betöltése az adatbázisból...</span>
                      </div>
                    ) : references.length === 0 ? (
                      <div className="p-8 border border-gray-800 rounded-2xl text-center text-xs text-gray-500 space-y-2">
                        <FolderGit2 className="mx-auto text-gray-600" size={32} />
                        <p>Nincsenek még bejegyzett referenciák. Kattintson az „Új Referencia Hozzáadása” gombra!</p>
                      </div>
                    ) : (
                      references.map((item, index) => {
                        const allImgs = [
                          ...(item.image_url ? [item.image_url] : []),
                          ...((item.images || []).filter((u) => u !== item.image_url)),
                        ];

                        return (
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
                                placeholder="Projekt címe (pl. 24 lakásos Társasház kivitelezése)"
                                className="flex-1 bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm font-bold text-white placeholder-gray-500"
                              />

                              <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 cursor-pointer select-none">
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
                                title="Referencia törlése"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={item.location || ''}
                                onChange={(e) => {
                                  const next = [...references];
                                  next[index].location = e.target.value;
                                  setReferences(next);
                                }}
                                placeholder="Helyszín (pl. Budapest XI. kerület vagy Győr)"
                                className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500"
                              />
                              <input
                                type="text"
                                value={item.year || ''}
                                onChange={(e) => {
                                  const next = [...references];
                                  next[index].year = e.target.value;
                                  setReferences(next);
                                }}
                                placeholder="Megvalósítás éve (pl. 2024-2025)"
                                className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500"
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
                              placeholder="Projekt részletes leírása, főbb műszaki paraméterek és volumen..."
                              className="w-full bg-[#1e2225] border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500"
                            />

                            {/* FOTÓK ÉS KÉPFELTÖLTÉS */}
                            <div className="pt-2 border-t border-gray-800/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                  <ImageIcon size={14} className="text-blue-400" /> Referencia Képek ({allImgs.length} db)
                                </span>
                                <label className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
                                  <Upload size={12} /> Kép feltöltése
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (loadEvt) => {
                                        const res = loadEvt.target?.result;
                                        if (typeof res === 'string') {
                                          const next = [...references];
                                          const currImgs = next[index].images || [];
                                          next[index].images = [...currImgs, res];
                                          if (!next[index].image_url) {
                                            next[index].image_url = res;
                                          }
                                          setReferences(next);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                  />
                                </label>
                              </div>

                              {/* Kép URL közvetlen beillesztése */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={item.image_url || ''}
                                  onChange={(e) => {
                                    const next = [...references];
                                    next[index].image_url = e.target.value;
                                    setReferences(next);
                                  }}
                                  placeholder="Közvetlen főkép URL beillesztése (pl. https://images.unsplash.com/...)"
                                  className="flex-1 bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500"
                                />
                              </div>

                              {/* Képek előnézeti sora */}
                              {allImgs.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {allImgs.map((imgUrl, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-700 bg-black group"
                                    >
                                      <img
                                        src={imgUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                      {imgIdx === 0 && (
                                        <span className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-[9px] font-bold text-center py-0.5">
                                          Főkép
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = [...references];
                                          const filtered = (next[index].images || []).filter((_, i) => i !== imgIdx);
                                          next[index].images = filtered;
                                          if (next[index].image_url === imgUrl) {
                                            next[index].image_url = filtered[0] || '';
                                          }
                                          setReferences(next);
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Kép törlése"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: TANÚSÍTVÁNYOK */}
              {activeTab === 'certificates' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="text-blue-400" size={20} /> Tanúsítványok & Minősítések
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
                      className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-colors flex items-center gap-1.5"
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
                              className="flex-1 bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm font-bold text-white"
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
                      <BookOpen className="text-blue-400" size={20} /> Kapcsolódó ÉpítőTudás Tartalmak (Max 6)
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
                      className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-colors flex items-center gap-1.5"
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
                            className="bg-[#1e2225] border border-gray-700 rounded-xl px-3 py-2 text-xs text-blue-400 font-bold"
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
                    <Globe className="text-blue-400" size={20} /> SEO & Keresőoptimálás
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">SEO Cím (Title tag)</label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1.5">SEO Meta Leírás (Description)</label>
                      <textarea
                        rows={3}
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder=""
                        className="w-full bg-[#1e2225] border border-gray-700 focus:border-blue-500 rounded-xl p-3 text-sm text-white"
                      />
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={isIndexable}
                        onChange={(e) => setIsIndexable(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
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
            <div className="p-3.5 sm:p-5 border-t border-gray-800 bg-[#1a1d20] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
              >
                Bezárás
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {saveError && (
                  <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold animate-fade-in">
                    <AlertCircle size={16} />
                    <span>{saveError}</span>
                  </div>
                )}

                {saveSuccess && (
                  <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold animate-fade-in">
                    <CheckCircle2 size={16} />
                    <span>A partner adatai sikeresen elmentve.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                      <span>Mentés folyamatban...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Változtatások Mentése &amp; Publikálás</span>
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
