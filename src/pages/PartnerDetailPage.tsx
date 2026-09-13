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
} from 'lucide-react';
import { getPartnerBySlug, getCategoryLabel } from '../services/partnerService';
import type { Partner } from '../lib/supabase';

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
  const [partner, setPartner] = useState<Partner | null>(null);
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
  const specialties = getCategorySpecialties(partner.category);

  return (
    <div className="bg-[#f5f5f5] text-[#202628] min-h-screen pb-16">
      {/* 1. Hero Header & Morzsanavigáció */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb / Morzsanavigáció */}
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              Főoldal
            </button>
            <ChevronRight size={13} className="text-gray-500 shrink-0" />
            <button
              onClick={() => onNavigate('about')}
              className="hover:text-white transition-colors font-medium"
            >
              Rólunk
            </button>
            <ChevronRight size={13} className="text-gray-500 shrink-0" />
            <button
              onClick={() => onNavigate('partners')}
              className="hover:text-white transition-colors font-medium"
            >
              Partnerek
            </button>
            <ChevronRight size={13} className="text-gray-500 shrink-0" />
            <span className="text-gray-200 font-bold truncate max-w-[200px] sm:max-w-none">
              {partner.name}
            </span>
          </nav>

          {/* 2. Partner Header / Hero Main Content */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Partner Large Logo or Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-white/20 p-2.5 shadow-xl flex items-center justify-center shrink-0">
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
                  <Building2 size={44} className="text-primary" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center flex-wrap gap-2">
                  {/* Partner Category Badge */}
                  <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-extrabold text-xs rounded-full uppercase tracking-wider">
                    {categoryLabel}
                  </span>

                  {/* Verified Partner Badge */}
                  {partner.is_verified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs rounded-full">
                      <ShieldCheck size={14} /> Minősített Partner
                    </span>
                  )}
                </div>

                {/* Partner Name */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {partner.name}
                </h1>

                {/* Short Tagline / Description */}
                <p className="text-gray-300 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed">
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

              <a
                href={`mailto:partner@epitotudas.hu?subject=${encodeURIComponent(`Kapcsolatfelvétel - ${partner.name}`)}`}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2"
              >
                <Mail size={16} /> Kapcsolatfelvétel
              </a>

              <a
                href={`mailto:partner@epitotudas.hu?subject=${encodeURIComponent(`Ajánlatkérés - ${partner.name}`)}`}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl transition-all border border-white/20 flex items-center justify-center gap-2"
              >
                <FileText size={16} /> Ajánlatkérés
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-[#202628]">
        {/* 3. Bemutatkozás Section */}
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

          <div className="text-[#5f6868] leading-relaxed space-y-4 text-sm sm:text-base pt-2">
            <p className="font-medium text-gray-800">
              {partner.description || `${partner.name} az ÉpítőTudás szakmai partnereként elkötelezett a magyar építőipari minőség és a gyakorlatorientált tudás terjesztése mellett.`}
            </p>
            <p>
              A szervezet tevékenységének középpontjában a szabványosított munkavégzés, a modern építéstechnológiai megoldások és az iparági szereplők – mérnökök, kivitelezők, oktatók és tanulók – hatékony együttműködése áll.
            </p>
            <p>
              Az ÉpítőTudás platformján keresztül a partner hozzájárul a hiteles szakmai információk, kivitelezési útmutatók és oktatási segédanyagok közzétételéhez, támogatva a felkészült építőipari szakemberutánpótlás nevelését.
            </p>
          </div>
        </section>

        {/* 4. Szolgáltatások és szakterületek Section */}
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
            {specialties.map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-5 space-y-2 hover:border-accent/60 hover:bg-white transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2.5 font-bold text-gray-900 text-sm">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-xs text-[#5f6868] leading-relaxed pl-7">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

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
