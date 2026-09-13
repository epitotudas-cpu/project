import { useState, useEffect } from 'react';
import {
  Building2,
  ExternalLink,
  ShieldCheck,
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
} from 'lucide-react';
import { getPartnerBySlug, getCategoryLabel, type ExtendedPartner } from '../services/partnerService';

interface PartnerDetailPageProps {
  partnerSlug: string | null;
  onNavigate: (page: string, params?: Record<string, any>) => void;
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

export default function PartnerDetailPage({ partnerSlug, onNavigate }: PartnerDetailPageProps) {
  const [partner, setPartner] = useState<ExtendedPartner | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      } catch (err) {
        console.error('Hiba a partner betöltésekor:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPartner();
  }, [partnerSlug]);

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
  const activeServices = partner.services?.filter((s) => s.is_active) || [];
  const publishedReferences = partner.references?.filter((r) => r.is_published) || [];
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
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-white/20 p-2.5 shadow-xl flex items-center justify-center shrink-0 ${logoBgClass}`}
              >
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={partner.name}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : partner.category === 'iskola' ? (
                  <GraduationCap size={44} className="text-primary" />
                ) : partner.category === 'oktato' ? (
                  <Briefcase size={44} className="text-primary" />
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-primary uppercase">
                    {partner.name.substring(0, 2)}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-extrabold text-xs rounded-full uppercase tracking-wider">
                    {partner.partner_type || categoryLabel}
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
                  href={partner.website_url}
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

            <div className="text-[#5f6868] leading-relaxed space-y-4 text-sm sm:text-base pt-2 whitespace-pre-line">
              {partner.detailed_description || partner.description}
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
                  href={partner.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  Facebook profil megtekintése <ExternalLink size={12} />
                </a>
              )}
              {partner.social_linkedin && (
                <a
                  href={partner.social_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-sky-50 text-sky-700 font-bold text-xs rounded-xl border border-sky-200 hover:bg-sky-100 transition-colors flex items-center gap-2"
                >
                  LinkedIn profil megtekintése <ExternalLink size={12} />
                </a>
              )}
              {partner.social_instagram && (
                <a
                  href={partner.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-pink-50 text-pink-700 font-bold text-xs rounded-xl border border-pink-200 hover:bg-pink-100 transition-colors flex items-center gap-2"
                >
                  Instagram profil megtekintése <ExternalLink size={12} />
                </a>
              )}
              {partner.social_youtube && (
                <a
                  href={partner.social_youtube}
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
        {publishedReferences.length > 0 && (
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
              {publishedReferences.map((ref) => (
                <div key={ref.id} className="bg-gray-50 border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs space-y-3 p-5">
                  {ref.image_url && (
                    <div className="h-40 rounded-xl overflow-hidden bg-gray-200 mb-2">
                      <img src={ref.image_url} alt={ref.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-gray-900 text-base">{ref.title}</h3>
                    {ref.year && <span className="px-2 py-0.5 bg-accent/20 text-accent-dark font-extrabold text-xs rounded">{ref.year}</span>}
                  </div>
                  {ref.location && <p className="text-xs font-semibold text-gray-500">{ref.location}</p>}
                  {ref.description && <p className="text-xs text-[#5f6868] leading-relaxed">{ref.description}</p>}
                </div>
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
                href={partner.website_url}
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
    </div>
  );
}
