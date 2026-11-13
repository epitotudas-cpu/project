import { useState, useEffect } from 'react';
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Award,
  Globe,
  Briefcase,
  GraduationCap,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  FolderGit2,
  BookOpen,
  X,
  Maximize2,
} from 'lucide-react';
import { getPartnerBySlug, getCategoryLabel, type ExtendedPartner } from '../services/partnerService';
import {
  getPartnerReferences,
  resolveReferenceImageUrl,
  type PartnerReference,
  type PartnerReferenceImage,
} from '../services/referenceService';
import FormattedText from '../components/FormattedText';

interface PartnerDetailPageProps {
  partnerSlug: string | null;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

function isValidLogoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.startsWith('/')) return true;
  return false;
}

function getCategorySpecialties(category: string): { title: string; desc: string }[] {
  switch (category) {
    case 'gyarto':
      return [
        { title: 'Építőanyag-gyártás & Fejlesztés', desc: 'Szabványosított, minősített és környezetbarát építőipari alapanyagok és rendszerek gyártása.' },
        { title: 'Műszaki Szaktanácsadás', desc: 'Mérnöki támogatás a megfelelő beépítési technológiák és csomópontok kiválasztásához.' },
        { title: 'Terméktanúsítványok & Szabványok', desc: 'Hivatalos európai (EU) és magyar (MSZ) normáknak való megfelelőségi dokumentációk biztosítása.' },
        { title: 'Gyakorlati Technológiai Útmutatók', desc: 'Lépésről lépésre követhető alkalmazástechnikai és kivitelezési segédletek mérnököknek és szakembereknek.' },
      ];
    case 'kereskedo':
      return [
        { title: 'Építőanyag-kereskedelem', desc: 'Kiváló minőségű építőanyagok, szerszámok és szakkivitelezési termékek széles körű forgalmazása.' },
        { title: 'Logisztika & Helyszíni Szállítás', desc: 'Pontos, megbízható és ütemezett építkezési helyszínre szállítás az egész ország területén.' },
        { title: 'Szakmai Mintaterem & Bemutató', desc: 'Személyesen megtekinthető termék-, burkolat- és szerkezetépítési technológiai bemutatók.' },
        { title: 'Vevőtájékoztatás & Árajánlatok', desc: 'Szakértői műszaki tanácsadás lakossági építkezőknek és vállalkozói kivitelező partnereknek.' },
      ];
    case 'ceg':
      return [
        { title: 'Generálkivitelezés & Projektmenedzsment', desc: 'Komplex építőipari projektek szakszerű lebonyolítása a tervezőasztaltól a kulcsrakész átadásig.' },
        { title: 'Szerkezetépítés & Falazás', desc: 'Alapozási, vasbeton- és falazási munkák precíz kivitelezése a legújabb technológiai előírások szerint.' },
        { title: 'Épületfelújítás & Energetikai Korszerűsítés', desc: 'Szakszerű homlokzati hőszigetelés, nyílászáró csere és teljes körű energetikai megújítás.' },
        { title: 'Minőségellenőrzés & Szabványosság', desc: 'Szigorú munkavédelmi, műszaki és minőségbiztosítási normák betartása minden munkaterületen.' },
      ];
    case 'iskola':
      return [
        { title: 'Építőipari Szakképzés', desc: 'Kőműves, ács, burkoló, szárazépítő és épületgépész szakmai képzések és képesítések.' },
        { title: 'Duális Gyakorlati Képzés', desc: 'Gyakorlatorientált oktatás valós építőipari kivitelező partnercégek munkaterületein.' },
        { title: 'Felnőttképzés & Átképzési Programok', desc: 'Korszerű moduláris felnőttképzések az építőipari karrierváltás és szakmai fejlődés támogatására.' },
        { title: 'Digitális Tananyagok & Tudásbázis', desc: 'Interaktív oktatási segédletek, szakmai fogalomtár és vizsgafelkészítő anyagtárak a tanulóknak.' },
      ];
    case 'oktato':
      return [
        { title: 'Szakmai Tréningek & Mesterkurzusok', desc: 'Gyakorlati továbbképzések és szakosított mesterkurzusok gyakorló kivitelezők számára.' },
        { title: 'Műszaki Oktatás & Technológia', desc: 'Korszerű építési normák, anyagtan és új kivitelezési technológiák oktatása.' },
        { title: 'Precizitás & Munkavédelem', desc: 'A szabványos munkavégzés, a balesetmentes kivitelezés és a minőségi átadás alapjainak elsajátítása.' },
      ];
    default:
      return [
        { title: 'Iparági Összefogás & Támogatás', desc: 'Szakmai tudásmegosztás és az építőipari szakképzés stratégiai támogatása.' },
        { title: 'Minőségbiztosítási Elvek', desc: 'Elkötelezettség a hazai építési kultúra és a szabványos kivitelezés fejlesztése mellett.' },
        { title: 'Digitális Platform Partnerség', desc: 'Aktív együttműködés az ÉpítőTudás digitális tudásbázis és szakmai közösség építésében.' },
      ];
  }
}

interface LightboxGalleryItem {
  url: string;
  caption?: string | null;
  width?: number;
  height?: number;
}

interface LightboxState {
  images: LightboxGalleryItem[];
  currentIndex: number;
  title: string;
  location?: string | null;
  year?: string | null;
}

function PartnerReferenceCard({
  reference,
  onOpenLightbox,
}: {
  reference: PartnerReference;
  onOpenLightbox: (state: LightboxState) => void;
}) {
  // Összegyűjtjük a referencia összes képét megbízható sorrendben (főkép elöl, majd sorrend szerint)
  const allImages: PartnerReferenceImage[] = [];
  if (reference.cover_image) {
    allImages.push(reference.cover_image);
  }
  if (reference.images && Array.isArray(reference.images)) {
    for (const img of reference.images) {
      if (!allImages.some((existing) => existing.id === img.id)) {
        allImages.push(img);
      }
    }
  }

  const sortedImages = [...allImages].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

  const [activeIdx, setActiveIdx] = useState(0);

  const currentImage = sortedImages[activeIdx] || sortedImages[0];
  const currentUrl = currentImage ? resolveReferenceImageUrl(currentImage) : '';

  const handleOpenLightbox = (indexToOpen: number) => {
    const lightboxItems: LightboxGalleryItem[] = sortedImages.map((img) => ({
      url: resolveReferenceImageUrl(img),
      caption: img.caption,
      width: img.width,
      height: img.height,
    }));
    onOpenLightbox({
      images: lightboxItems,
      currentIndex: indexToOpen,
      title: reference.title,
      location: reference.location,
      year: reference.year,
    });
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
  };

  return (
    <div className="bg-gray-50 border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs space-y-3 p-5 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Fő képkártya / Lapozható előnézet vágás nélkül */}
        {currentUrl && (
          <div
            onClick={() => handleOpenLightbox(activeIdx)}
            className="aspect-[16/10] sm:aspect-video w-full rounded-2xl overflow-hidden bg-gray-950 relative group cursor-pointer border border-gray-200/80 shadow-inner flex items-center justify-center select-none"
            title="Kattintson a teljes képernyős nagyításhoz"
          >
            {/* Elmosott háttér, hogy a kép arányaitól függetlenül kitöltse a teret fekete csíkok és vágás nélkül */}
            <img
              src={currentUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover filter blur-lg opacity-35 scale-110 pointer-events-none transition-all duration-300"
            />

            {/* Éles fő kép vágás nélkül (object-contain) */}
            <img
              src={currentUrl}
              alt={currentImage.caption || reference.title}
              className="relative z-10 max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />

            {/* Nagyítás jelvény a jobb felső sarokban */}
            <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-md group-hover:scale-105 border border-white/10">
              <Maximize2 size={12} />
              <span>Nagyítás</span>
            </div>

            {/* Képszámláló ha több kép van */}
            {sortedImages.length > 1 && (
              <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 shadow-md border border-white/10">
                <span>{activeIdx + 1} / {sortedImages.length} kép</span>
              </div>
            )}

            {/* Kártyán belüli lapozó nyilak ha több fotó van */}
            {sortedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  aria-label="Előző kép"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-all shadow-lg hover:scale-110 opacity-90 sm:opacity-0 group-hover:opacity-100 border border-white/10"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  aria-label="Következő kép"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm transition-all shadow-lg hover:scale-110 opacity-90 sm:opacity-0 group-hover:opacity-100 border border-white/10"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Bélyegkép lapozó sor több kép esetén */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
            {sortedImages.map((img, idx) => {
              const isSelected = idx === activeIdx;
              const thumbUrl = resolveReferenceImageUrl(img);
              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    isSelected
                      ? 'border-accent shadow-md ring-2 ring-accent/40 scale-105'
                      : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400'
                  }`}
                  title={img.caption || `${idx + 1}. kép`}
                >
                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}

        {/* Cím és metaadatok */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <h3 className="font-extrabold text-gray-900 text-base leading-snug">{reference.title}</h3>
          {reference.year && (
            <span className="px-2 py-0.5 bg-accent/20 text-accent-dark font-extrabold text-xs rounded shrink-0">
              {reference.year}
            </span>
          )}
        </div>

        {reference.location && (
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span>{reference.location}</span>
          </p>
        )}

        {reference.description && (
          <div className="pt-1">
            <FormattedText
              content={reference.description}
              paragraphClassName="text-xs text-[#5f6868] leading-relaxed mb-2"
              headingClassName="text-xs font-bold text-gray-900 mt-2.5 mb-1"
              listClassName="list-disc pl-4 text-xs text-[#5f6868] leading-relaxed my-1 space-y-0.5"
              strongClassName="font-bold text-gray-900"
            />
          </div>
        )}
      </div>

      {reference.website_url && (
        <div className="pt-2 border-t border-gray-100">
          <a
            href={reference.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-dark hover:underline"
          >
            Projekt részletei / weboldala <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

export default function PartnerDetailPage({ partnerSlug, onNavigate }: PartnerDetailPageProps) {
  const [partner, setPartner] = useState<ExtendedPartner | null>(null);
  const [referencesList, setReferencesList] = useState<PartnerReference[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [activeLightbox, setActiveLightbox] = useState<LightboxState | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (!activeLightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightbox(null);
      } else if (e.key === 'ArrowRight') {
        setActiveLightbox((curr) =>
          curr ? { ...curr, currentIndex: (curr.currentIndex + 1) % curr.images.length } : null
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveLightbox((curr) =>
          curr
            ? { ...curr, currentIndex: (curr.currentIndex - 1 + curr.images.length) % curr.images.length }
            : null
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightbox]);

  useEffect(() => {
    if (activeLightbox) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeLightbox]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !activeLightbox) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    if (diff > 50) {
      // Jobbra húzás -> előző kép
      setActiveLightbox((curr) =>
        curr
          ? { ...curr, currentIndex: (curr.currentIndex - 1 + curr.images.length) % curr.images.length }
          : null
      );
    } else if (diff < -50) {
      // Balra húzás -> következő kép
      setActiveLightbox((curr) =>
        curr ? { ...curr, currentIndex: (curr.currentIndex + 1) % curr.images.length } : null
      );
    }
    setTouchStartX(null);
  };

  useEffect(() => {
    async function loadPartner() {
      if (!partnerSlug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getPartnerBySlug(partnerSlug);
        setPartner(data);
        if (data?.id) {
          const refs = await getPartnerReferences(data.id, true);
          setReferencesList(refs);
        } else {
          setReferencesList([]);
        }
      } catch (err) {
        console.error('Hiba a partner betöltésekor:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPartner();
  }, [partnerSlug]);

  useEffect(() => {
    setImageError(false);
  }, [partner?.logo_url]);

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-background flex flex-col items-center justify-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-3" />
        <p className="text-xs text-gray-400 font-medium">Partner adatlapjának betöltése...</p>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-[60vh] bg-background flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Building2 size={48} className="text-gray-300 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">A keresett partner nem található</h2>
        <p className="text-sm text-gray-500 max-w-md">
          A megadott azonosítóval rendelkező partner adatlapja jelenleg nem érhető el vagy eltávolításra került.
        </p>
        <button
          onClick={() => onNavigate('partners')}
          className="px-5 py-2.5 bg-accent text-black font-bold text-xs rounded-xl hover:bg-accent-hover transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Vissza a Partnerek listájához
        </button>
      </div>
    );
  }

  const categoryLabel = getCategoryLabel(partner.category);
  // P0-D15: for explicit company categories, do not display a stale/legacy educational partner_type
  const isCompanyCategory = ['ceg', 'gyarto', 'kereskedo'].includes(partner.category);
  const partnerTypeLower = (partner.partner_type || '').toLowerCase();
  const hasEduPartnerType =
    partnerTypeLower.includes('iskola') ||
    partnerTypeLower.includes('oktatá') ||
    partnerTypeLower.includes('intezmen') ||
    partnerTypeLower.includes('intézmén');
  const displayType =
    isCompanyCategory && hasEduPartnerType ? categoryLabel : partner.partner_type || categoryLabel;
  const activeServices = partner.services?.filter((s) => s.is_active) || [];
  const publishedCertificates = partner.certificates?.filter((c) => c.is_published) || [];
  const hasRelatedContent = partner.related_content && partner.related_content.length > 0;

  const hasContactDetails =
    partner.contact_person_name ||
    partner.contact_email ||
    partner.contact_phone ||
    partner.address ||
    partner.city ||
    partner.operating_area ||
    partner.business_hours;

  const hasSocialLinks =
    partner.social_facebook || partner.social_linkedin || partner.social_instagram || partner.social_youtube;

  const logoBgClass =
    partner.logo_bg === 'light_gray'
      ? 'bg-gray-200'
      : partner.logo_bg === 'transparent'
      ? 'bg-transparent border-white/30'
      : 'bg-white';

  return (
    <div className="bg-[#f5f5f5] text-[#202628] min-h-screen pb-16">
      {/* 1. Hero Header & Morzsanavigáció */}
      <div className="relative bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Cover image background if available */}
        {partner.cover_url && (
          <div className="absolute inset-0 z-0">
            <img src={partner.cover_url} alt="Cover" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto space-y-6">
          {/* Morzsanavigáció */}
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-gray-300">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              Főoldal
            </button>
            <ChevronRight size={13} className="text-gray-400 shrink-0" />
            <button
              onClick={() => onNavigate('about')}
              className="hover:text-white transition-colors font-medium"
            >
              Rólunk
            </button>
            <ChevronRight size={13} className="text-gray-400 shrink-0" />
            <button
              onClick={() => onNavigate('partners')}
              className="hover:text-white transition-colors font-medium"
            >
              Partnerek
            </button>
            <ChevronRight size={13} className="text-gray-400 shrink-0" />
            <span className="text-white font-bold truncate max-w-[200px] sm:max-w-none">
              {partner.name}
            </span>
          </nav>

          {/* Partner Header Main Info */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Partner Logo or Avatar Monogram */}
              <div
                className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 max-w-[160px] max-h-[160px] rounded-2xl border-2 border-white/20 p-2.5 shadow-xl flex items-center justify-center shrink-0 ${logoBgClass}`}
              >
                {partner.logo_url && !imageError && isValidLogoUrl(partner.logo_url) ? (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : partner.category === 'iskola' ? (
                  <GraduationCap className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                ) : partner.category === 'oktato' ? (
                  <Briefcase className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <Building2 className="w-8 h-8 md:w-12 md:h-12 text-primary mb-1" />
                    <span className="text-sm sm:text-base md:text-lg font-black text-primary uppercase">
                      {partner.name ? partner.name.substring(0, 2) : 'EP'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-extrabold text-xs rounded-full uppercase tracking-wider">
                    {displayType}
                  </span>

                  {partner.is_verified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs rounded-full">
                      <ShieldCheck size={14} /> Minősített Partner
                    </span>
                  )}

                  {partner.is_featured && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs rounded-full">
                      <Sparkles size={14} /> Kiemelt Partner
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {partner.name}
                </h1>

                {partner.official_name && partner.official_name !== partner.name && (
                  <p className="text-xs text-gray-300 font-medium italic">{partner.official_name}</p>
                )}

                <p className="text-gray-200 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
                  {partner.description || `${partner.name} az ÉpítőTudás nemzeti tudásplatform minősített szakmai partnere.`}
                </p>
              </div>
            </div>

            {/* CTA Buttons Block */}
            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0">
              {partner.website_url && (
                <a
                  href={/^https?:\/\//i.test(partner.website_url) ? partner.website_url : `https://${partner.website_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Globe size={16} /> Hivatalos weboldal <ExternalLink size={14} />
                </a>
              )}

              {(partner.contact_email || partner.inquiry_email) && (
                <a
                  href={`mailto:${partner.inquiry_email || partner.contact_email}?subject=${encodeURIComponent(
                    `Kapcsolatfelvétel - ${partner.name}`
                  )}`}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2"
                >
                  <Mail size={16} /> Kapcsolatfelvétel
                </a>
              )}

              {(partner.inquiry_email || partner.contact_email) && (
                <a
                  href={`mailto:${partner.inquiry_email || partner.contact_email}?subject=${encodeURIComponent(
                    `Ajánlatkérés - ${partner.name}`
                  )}`}
                  className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2"
                >
                  <FileText size={16} /> Ajánlatkérés
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-[#202628]">
        {/* 2. Bemutatkozás Section */}
        {(partner.detailed_description || partner.description) && (
          <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#202628]">Bemutatkozás</h2>
                <p className="text-xs text-[#5f6868]">Ismerd meg partnerünk tevékenységét és szakmai céljait.</p>
              </div>
            </div>

            <div className="pt-2">
              <FormattedText
                content={partner.detailed_description || partner.description}
                paragraphClassName="text-[#5f6868] text-sm sm:text-base leading-relaxed mb-3"
                headingClassName="text-base sm:text-lg font-bold text-[#202628] mt-4 mb-2"
                listClassName="list-disc pl-5 text-[#5f6868] text-sm sm:text-base leading-relaxed my-2 space-y-1.5"
                strongClassName="font-bold text-[#202628]"
              />
            </div>
          </section>
        )}

        {/* 3. Szolgáltatások és szakterületek Section */}
        <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#202628]">Szolgáltatások és szakterületek</h2>
              <p className="text-xs text-[#5f6868]">Kiemelt szakterületek, kompetenciák és szakmai szolgáltatások.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeServices.length > 0
              ? activeServices.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-5 space-y-2 hover:border-accent/60 hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 font-bold text-gray-900 text-sm">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-[#5f6868] leading-relaxed pl-7">{item.description}</p>
                    )}
                  </div>
                ))
              : getCategorySpecialties(partner.category).map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-5 space-y-2 hover:border-accent/60 hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 font-bold text-gray-900 text-sm">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs text-[#5f6868] leading-relaxed pl-7">{item.desc}</p>
                  </div>
                ))}
          </div>
        </section>

        {/* 4. Elérhetőségek Section */}
        {hasContactDetails && (
          <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                <Phone size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#202628]">Elérhetőségi adatok</h2>
                <p className="text-xs text-[#5f6868]">Közvetlen kapcsolattartás és elérhetőségek.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
              {partner.contact_person_name && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Kapcsolattartó</span>
                  <div className="font-extrabold text-gray-900">{partner.contact_person_name}</div>
                  {partner.contact_person_title && (
                    <div className="text-xs text-gray-500 font-medium">{partner.contact_person_title}</div>
                  )}
                </div>
              )}

              {partner.contact_phone && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Telefonszám</span>
                  <a href={`tel:${partner.contact_phone}`} className="font-extrabold text-primary hover:text-accent transition-colors flex items-center gap-1.5">
                    <Phone size={14} /> {partner.contact_phone}
                  </a>
                </div>
              )}

              {(partner.contact_email || partner.inquiry_email) && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">E-mail Cím</span>
                  <a href={`mailto:${partner.contact_email || partner.inquiry_email}`} className="font-extrabold text-primary hover:text-accent transition-colors flex items-center gap-1.5 truncate">
                    <Mail size={14} /> {partner.contact_email || partner.inquiry_email}
                  </a>
                </div>
              )}

              {(partner.address || partner.city) && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Székhely / Telephely</span>
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin size={15} className="text-primary shrink-0" />
                    <span>
                      {partner.zip_code} {partner.city}, {partner.address} {partner.county ? `(${partner.county})` : ''}
                    </span>
                  </div>
                </div>
              )}

              {partner.business_hours && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nyitvatartás</span>
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Clock size={15} className="text-primary shrink-0" />
                    <span>{partner.business_hours}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. Közösségi Felületek Section */}
        {hasSocialLinks && (
          <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Közösségi Felületek</h3>
            <div className="flex flex-wrap gap-3">
              {partner.social_facebook && (
                <a
                  href={/^https?:\/\//i.test(partner.social_facebook) ? partner.social_facebook : `https://${partner.social_facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  Facebook profil megtekintése <ExternalLink size={12} />
                </a>
              )}
              {partner.social_linkedin && (
                <a
                  href={/^https?:\/\//i.test(partner.social_linkedin) ? partner.social_linkedin : `https://${partner.social_linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-sky-50 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 hover:bg-sky-100 transition-colors flex items-center gap-2"
                >
                  LinkedIn profil megtekintése <ExternalLink size={12} />
                </a>
              )}
              {partner.social_instagram && (
                <a
                  href={/^https?:\/\//i.test(partner.social_instagram) ? partner.social_instagram : `https://${partner.social_instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-pink-50 text-pink-700 font-bold text-xs rounded-xl border border-pink-200 hover:bg-pink-100 transition-colors flex items-center gap-2"
                >
                  Instagram profil megtekintése <ExternalLink size={12} />
                </a>
              )}
              {partner.social_youtube && (
                <a
                  href={/^https?:\/\//i.test(partner.social_youtube) ? partner.social_youtube : `https://${partner.social_youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-50 text-red-700 font-bold text-xs rounded-xl border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  YouTube csatorna megtekintése <ExternalLink size={12} />
                </a>
              )}
            </div>
          </section>
        )}

        {/* 6. Referenciák Section (ONLY IF PUBLISHED REFERENCES EXIST) */}
        {referencesList.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                <FolderGit2 size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#202628]">Kiemelt Referenciák</h2>
                <p className="text-xs text-[#5f6868]">Partnerünk elvégzett kiemelt projektjei és beruházásai.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {referencesList.map((ref) => (
                <PartnerReferenceCard
                  key={ref.id}
                  reference={ref}
                  onOpenLightbox={setActiveLightbox}
                />
              ))}
            </div>
          </section>
        )}

        {/* 7. Tanúsítványok és Minősítések Section (ONLY IF PUBLISHED CERTIFICATES EXIST) */}
        {publishedCertificates.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#202628]">Tanúsítványok & Minősítések</h2>
                <p className="text-xs text-[#5f6868]">Hivatalos szabványossági és minőségbiztosítási tanúsítványok.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publishedCertificates.map((cert) => (
                <div key={cert.id} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 space-y-2">
                  <div className="font-extrabold text-gray-900 text-sm">{cert.title}</div>
                  {cert.issuer && <div className="text-xs font-semibold text-gray-500">Kibocsátó: {cert.issuer}</div>}
                  {cert.valid_until && <div className="text-xs text-gray-400">Érvényes: {cert.valid_until}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Kapcsolódó ÉpítőTudás Tartalmak (ONLY IF LINKED CONTENT EXISTS) */}
        {hasRelatedContent && (
          <section className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                <BookOpen size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#202628]">Kapcsolódó ÉpítőTudás-tartalmak</h2>
                <p className="text-xs text-[#5f6868]">Szakmai útmutatók, cikkek és segédletek ehhez a partnerhez.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {partner.related_content!.slice(0, 6).map((item) => (
                <a
                  key={item.id}
                  href={item.url || '#'}
                  className="p-4 bg-gray-50 hover:bg-amber-500/10 border border-gray-200 hover:border-amber-400 rounded-2xl transition-all group space-y-2 block"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                  <div className="font-bold text-gray-900 text-xs group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                    <ExternalLink size={12} className="text-gray-400 group-hover:text-amber-500" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Actions & Navigation Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <button
            onClick={() => onNavigate('partners')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-all"
          >
            <ArrowLeft size={16} /> Vissza az összes partnerhez
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {partner.website_url && (
              <a
                href={/^https?:\/\//i.test(partner.website_url) ? partner.website_url : `https://${partner.website_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl transition-all shadow-sm"
              >
                <Globe size={16} /> Weboldal megnyitása <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Teljes képernyős Lightbox Galéria Modál */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn select-none"
          onClick={() => setActiveLightbox(null)}
        >
          {/* Felső fejléc sáv: Cím, infók, képszámláló és Bezárás gomb */}
          <div
            className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 max-w-[70vw]">
              <h3 className="font-extrabold text-base sm:text-lg text-white truncate">
                {activeLightbox.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-300 shrink-0">
                {activeLightbox.year && (
                  <span className="px-2 py-0.5 rounded bg-accent/25 text-accent font-bold">
                    {activeLightbox.year}
                  </span>
                )}
                {activeLightbox.location && (
                  <span className="text-gray-400 hidden sm:inline">
                    • {activeLightbox.location}
                  </span>
                )}
                {activeLightbox.images.length > 1 && (
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-full font-semibold text-white/90">
                    {activeLightbox.currentIndex + 1} / {activeLightbox.images.length} kép
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveLightbox(null)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer shrink-0"
            >
              <span>Bezárás</span>
              <X size={16} />
            </button>
          </div>

          {/* Középső színpad: Fő kép + Előző / Következő navigációs nyilak */}
          <div
            className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            {activeLightbox.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveLightbox((curr) =>
                    curr
                      ? {
                          ...curr,
                          currentIndex: (curr.currentIndex - 1 + curr.images.length) % curr.images.length,
                        }
                      : null
                  )
                }
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all shadow-xl hover:scale-110 border border-white/15 cursor-pointer"
                aria-label="Előző kép"
              >
                <ChevronLeft size={26} />
              </button>
            )}

            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img
                src={activeLightbox.images[activeLightbox.currentIndex]?.url}
                alt={activeLightbox.title}
                className="max-h-[70vh] sm:max-h-[75vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl transition-all"
              />
            </div>

            {activeLightbox.images.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveLightbox((curr) =>
                    curr ? { ...curr, currentIndex: (curr.currentIndex + 1) % curr.images.length } : null
                  )
                }
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all shadow-xl hover:scale-110 border border-white/15 cursor-pointer"
                aria-label="Következő kép"
              >
                <ChevronRight size={26} />
              </button>
            )}
          </div>

          {/* Alsó lábléc: Képaláírás és alsó bélyegkép-sor lapozáshoz */}
          <div
            className="pt-2 border-t border-white/10 shrink-0 flex flex-col items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {activeLightbox.images[activeLightbox.currentIndex]?.caption && (
              <p className="text-center text-xs sm:text-sm text-gray-200 font-medium max-w-2xl bg-black/60 px-4 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                {activeLightbox.images[activeLightbox.currentIndex].caption}
              </p>
            )}

            {activeLightbox.images.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-3xl py-1 px-2 scrollbar-thin">
                {activeLightbox.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setActiveLightbox((curr) => (curr ? { ...curr, currentIndex: idx } : null))
                    }
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      idx === activeLightbox.currentIndex
                        ? 'border-accent ring-2 ring-accent/60 scale-105'
                        : 'border-white/20 opacity-50 hover:opacity-100 hover:scale-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
