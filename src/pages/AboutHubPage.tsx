import {
  Building2,
  ShieldCheck,
  Target,
  Users,
  Mail,
  ChevronRight,
  BookOpen,
  Globe,
  Award,
  FileText,
  Phone,
} from 'lucide-react';
import { LEGAL_METADATA } from '../data/legalDocs';

interface AboutHubPageProps {
  onNavigate: (page: string) => void;
}

export default function AboutHubPage({ onNavigate }: AboutHubPageProps) {
  return (
    <div className="bg-[#f5f5f5] text-[#202628] min-h-screen pb-16">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Rólunk</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
                Rólunk
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Az ÉpítőTudásról és küldetésünkről
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Magyarország online építőipari tudásbázisa. Célunk a szakképesítés támogatása, a szakmai normák terjesztése és az iparági szereplők összekapcsolása.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('partners')}
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-black text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Building2 size={16} /> Partnereink
              </button>
              <button
                onClick={() => onNavigate('impressum')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2"
              >
                <FileText size={16} /> Impresszum
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Sub-navigation */}
      <nav
        aria-label="Rólunk navigáció"
        className="sticky top-[57px] z-40 bg-primary-800/95 backdrop-blur-md border-b border-primary-700 shadow-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto">
          <a
            href="#celunk"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Target size={14} className="text-accent" /> Célunk
          </a>
          <a
            href="#platform"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Globe size={14} className="text-accent" /> Az ÉpítőTudás
          </a>
          <button
            onClick={() => onNavigate('partners')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Building2 size={14} className="text-accent" /> Partnerek
          </button>
          <a
            href="#forrasok"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <BookOpen size={14} className="text-accent" /> Ajánlott források
          </a>
          <button
            onClick={() => onNavigate('impressum')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <FileText size={14} className="text-accent" /> Kapcsolat és impresszum
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 text-[#202628]">
        {/* Section 1: Célunk (Mission) */}
        <section id="celunk" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#202628] flex items-center gap-2">
              <Target className="text-accent" size={24} /> Célunk és küldetésünk
            </h2>
            <p className="text-[#5f6868] text-xs md:text-sm">
              Az ÉpítőTudás egy független szakmai digitális platform, amely a minőségi kivitelezést és a szakoktatást szolgálja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <BookOpen size={22} />
              </div>
              <h3 className="text-base font-bold text-[#202628]">1. Műszaki tudásmegosztás</h3>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Szabványosított műszaki kifejezések, szakszótár, kivitelezési tippek és közérthető magyarázatok biztosítása mindenkinek.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <Award size={22} />
              </div>
              <h3 className="text-base font-bold text-[#202628]">2. Utánpótlás és szakképzés</h3>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Az építőipari szakképzésben tanuló diákok, pályakezdők és átképzésben résztvevők digitális támogatása interaktív tananyagokkal.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Users size={22} />
              </div>
              <h3 className="text-base font-bold text-[#202628]">3. Iparági összefogás</h3>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Kereskedők, gyártók, kivitelező cégek és oktatási intézmények hálózatba szervezése a kiszámítható együttműködésért.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Az ÉpítőTudásról (Platform Features) */}
        <section id="platform" className="border-t border-gray-200 pt-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#202628] flex items-center gap-2">
              <Globe className="text-accent" size={24} /> Az ÉpítőTudás moduljai
            </h2>
            <p className="text-[#5f6868] text-xs md:text-sm">
              Fedezd fel platformunk moduljait és funkcióit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onNavigate('category')}
              className="bg-white border border-gray-200 hover:border-accent p-5 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md space-y-2 group"
            >
              <h4 className="text-sm font-bold text-[#202628] group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Szakmai cikkek</span>
                <ChevronRight size={14} className="text-accent" />
              </h4>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Gyakorlati kivitelezési útmutatók, technológiai leírások és szabványok.
              </p>
            </div>

            <div
              onClick={() => onNavigate('glossary')}
              className="bg-white border border-gray-200 hover:border-accent p-5 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md space-y-2 group"
            >
              <h4 className="text-sm font-bold text-[#202628] group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Fogalomtár és szótár</span>
                <ChevronRight size={14} className="text-accent" />
              </h4>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Több mint 300 szakmai kifejezés és műszaki szleng szótár a tudásgráfban.
              </p>
            </div>

            <div
              onClick={() => onNavigate('tool')}
              className="bg-white border border-gray-200 hover:border-accent p-5 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md space-y-2 group"
            >
              <h4 className="text-sm font-bold text-[#202628] group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Eszköz enciklopédia</span>
                <ChevronRight size={14} className="text-accent" />
              </h4>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Építőipari kéziszerszámok, gépek, mérőeszközök és döntési segédlet.
              </p>
            </div>

            <div
              onClick={() => onNavigate('paths')}
              className="bg-white border border-gray-200 hover:border-accent p-5 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md space-y-2 group"
            >
              <h4 className="text-sm font-bold text-[#202628] group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Pályák és karrier</span>
                <ChevronRight size={14} className="text-accent" />
              </h4>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Kurzusok, vizsgatesztek, állásajánlatok és duális képzési helyek.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 & Section 5: CTAs (Partnerek + Impresszum) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-10">
          {/* Partners Box */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl">
                <Building2 size={28} />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-200 rounded-md">
                  Szakmai hálózat
                </span>
                <h3 className="text-xl font-bold text-[#202628] mt-1">Partnerek és támogatók</h3>
              </div>
            </div>
            <p className="text-xs text-[#5f6868] leading-relaxed">
              Ismerd meg az ÉpítőTudás szakmai partnereit: elismert gyártókat, építőanyag-kereskedőket, kivitelezőket és oktatási intézményeket.
            </p>
            <button
              onClick={() => onNavigate('partners')}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Building2 size={16} /> Megtekintés a Partnerek oldalon
            </button>
          </div>

          {/* Impressum & Contact Box */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl">
                <ShieldCheck size={28} />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold text-blue-900 bg-blue-100 border border-blue-200 rounded-md">
                  Elérhetőségek
                </span>
                <h3 className="text-xl font-bold text-[#202628] mt-1">Kapcsolat és impresszum</h3>
              </div>
            </div>
            <p className="text-xs text-[#5f6868] leading-relaxed">
              Hivatalos szolgáltatói adatok, céginformációk, elérhetőségek, adatvédelmi és jogi nyilatkozatok transzparens módon.
            </p>
            <div className="space-y-1.5 text-xs text-[#202628] bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-primary font-bold" /> <span>{LEGAL_METADATA.company.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-primary font-bold" /> <span>{LEGAL_METADATA.company.phone}</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('impressum')}
              className="w-full py-3 bg-primary hover:bg-primary-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText size={16} /> Ugrás az Impresszum oldalra
            </button>
          </div>
        </section>

        {/* Section 4: Ajánlott források (Placeholder) */}
        <section id="forrasok" className="border-t border-gray-200 pt-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#202628] flex items-center gap-2">
              <BookOpen className="text-accent" size={20} /> Ajánlott források és szabványok
            </h2>
            <span className="text-[11px] font-semibold text-gray-600 bg-gray-200 px-3 py-1 rounded-full">
              Folyamatosan frissül
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-2 shadow-sm">
            <p className="text-xs text-[#5f6868]">
              A hivatalos építőipari szabványgyűjtemény, szakmai ajánlások és szakirodalmi források jegyzéke hamarosan elérhető ezen a felületen.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
