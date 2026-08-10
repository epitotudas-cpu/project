import {
  GraduationCap,
  Briefcase,
  Wrench,
  BookOpen,
  ChevronRight,
  ArrowRight,
  Layers,
  CheckCircle2,
  HardHat,
  Hammer,
  Building,
  Zap,
  Flame,
  Home as HomeIcon,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';

interface PathsHubPageProps {
  onNavigate: (page: string) => void;
}

const TRADES = [
  {
    id: 'komuves',
    name: 'Kőműves',
    icon: Hammer,
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    description: 'Teherhordó és elválasztó falazatok, alapozás, vakolás, falazási rendszerek és falazási technológiák.',
  },
  {
    id: 'acs',
    name: 'Ács és Zsaluzó ács',
    icon: HomeIcon,
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    description: 'Tetőszerkezetek, fafödémek, zsaluzási rendszerek, állványzatok és faszerkezet-építés.',
  },
  {
    id: 'burkolo',
    name: 'Burkoló',
    icon: Layers,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    description: 'Hideg- és melegburkolás, aljzatkészítés, vízszigetelés, csempe- és járólap fektetés.',
  },
  {
    id: 'villanyszerelo',
    name: 'Villanyszerelő',
    icon: Zap,
    color: 'bg-amber-100 border-amber-300 text-amber-900',
    description: 'Épületvillamosság, hálózatépítés, elosztók, világítási rendszerek, villamos biztonságtechnika.',
  },
  {
    id: 'epuletgepesz',
    name: 'Épületgépész',
    icon: Flame,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    description: 'Víz-, gáz-, fűtéskészítés, szellőzés, klímatechnika, megújuló energiaforrások.',
  },
  {
    id: 'tetofedo',
    name: 'Tetőfedő és Bádogos',
    icon: Building,
    color: 'bg-red-50 border-red-200 text-red-800',
    description: 'Magastetők héjazata, lapostetők vízszigetelése, csapadékelvezetés, bádogos szerkezetek.',
  },
];

export default function PathsHubPage({ onNavigate }: PathsHubPageProps) {
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
            <span className="text-gray-200 font-medium">Pályák Központ</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
                Pályák
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Építőipari pályák és karrierútvonalak
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Ismerd meg az építőipari szakmákat, lépj be a tanulási útvonalakba, végezz el elismert képzéseket és válogass a legújabb karrierlehetőségek között!
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('courses')}
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-black text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <GraduationCap size={16} /> Kurzusok megtekintése
              </button>
              <button
                onClick={() => onNavigate('careers')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2"
              >
                <Briefcase size={16} /> Állásajánlatok
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Pályák navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Szakmák',
            href: '#szakmak',
            icon: <HardHat size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Tanulás',
            href: '#tanulas',
            icon: <BookOpen size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Képzések',
            page: 'courses',
            icon: <GraduationCap size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Karrier',
            page: 'careers',
            icon: <Briefcase size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 text-[#202628]">
        {/* Section 1: Szakmák (Trades) */}
        <section id="szakmak" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#202628] flex items-center gap-2">
                <HardHat className="text-accent" size={24} /> Építőipari szakmák
              </h2>
              <p className="text-[#5f6868] text-xs md:text-sm mt-1">
                Ismerd meg az egyes szakmák kulcsfontosságú feladatait, eszközigényét és szabványait.
              </p>
            </div>
            <button
              onClick={() => onNavigate('glossary')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Fogalomtár böngészése <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRADES.map((trade) => {
              const IconComp = trade.icon;
              return (
                <div
                  key={trade.id}
                  className="bg-white border border-gray-200 hover:border-accent rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${trade.color}`}
                    >
                      <IconComp size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-[#202628] group-hover:text-primary transition-colors">
                      {trade.name}
                    </h3>
                    <p className="text-xs text-[#5f6868] leading-relaxed">
                      {trade.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
                    <button
                      onClick={() => onNavigate('glossary')}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Szakmai kifejezések <ChevronRight size={13} />
                    </button>
                    <button
                      onClick={() => onNavigate('tool')}
                      className="text-[#5f6868] hover:text-[#202628] transition-colors flex items-center gap-1"
                    >
                      Szerszámok <Wrench size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Tanulás (Learning Pathways) */}
        <section id="tanulas" className="space-y-6">
          <div className="border-t border-gray-200 pt-10">
            <h2 className="text-2xl font-bold text-[#202628] flex items-center gap-2 mb-1">
              <BookOpen className="text-accent" size={24} /> Tanulás és tudásszerzés
            </h2>
            <p className="text-[#5f6868] text-xs md:text-sm">
              Alapozd meg tudásodat felépített tanulási útvonalakon és gyakorlati útmutatókon keresztül.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-[#202628]">Kezdőknek és pályakezdőknek</h3>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Alapozó műszaki fogalmak, biztonságtechnikai előírások és szerszámismereti alapok az első lépésekhez.
              </p>
              <button
                onClick={() => onNavigate('glossary')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-2"
              >
                Kifejezések tanulása <ArrowRight size={13} />
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-[#202628]">Szakmai tanulási útvonalak</h3>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Lépésről lépésre felépített tudásgráf modulok, amelyek összekötik az elméletet a gyakorlat kivitelezésével.
              </p>
              <button
                onClick={() => onNavigate('category')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-2"
              >
                Útmutatók és cikkek <ArrowRight size={13} />
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-[#202628]">Interaktív képzések</h3>
              <p className="text-xs text-[#5f6868] leading-relaxed">
                Strukturált e-learning leckék, ellenőrző tesztek és felkészülés a szakmai vizsgákra.
              </p>
              <button
                onClick={() => onNavigate('courses')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-2"
              >
                Kurzusok indítása <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </section>

        {/* Section 3: Képzések & Karrier Hub CTAs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-10">
          {/* Courses Box */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl">
                <GraduationCap size={28} />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold text-blue-900 bg-blue-100 border border-blue-200 rounded-md">
                  E-learning központ
                </span>
                <h3 className="text-xl font-bold text-[#202628] mt-1">Képzések és kurzusok</h3>
              </div>
            </div>
            <p className="text-xs text-[#5f6868] leading-relaxed">
              Végezd el szakmai kurzusainkat, teszteld a tudásodat és szerezz digitális tanúsítványt, amellyel igazolhatod felkészültségedet!
            </p>
            <ul className="space-y-2 text-xs text-[#202628]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0" /> Szakági e-learning tananyagok és videóleckék
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0" /> Interaktív vizsgatesztek és szintfelmérők
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0" /> Letölthető digitális tanúsítványok
              </li>
            </ul>
            <button
              onClick={() => onNavigate('courses')}
              className="w-full py-3 bg-primary hover:bg-primary-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <GraduationCap size={16} /> Tovább a Képzésekhez
            </button>
          </div>

          {/* Careers Box */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl">
                <Briefcase size={28} />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-200 rounded-md">
                  Karrierportál és állásbörze
                </span>
                <h3 className="text-xl font-bold text-[#202628] mt-1">Építőipari karrier</h3>
              </div>
            </div>
            <p className="text-xs text-[#5f6868] leading-relaxed">
              Találd meg az igényeidnek megfelelő állásajánlatot, jelentkezz duális képzési gyakorlati helyekre vagy adj fel saját álláshirdetést!
            </p>
            <ul className="space-y-2 text-xs text-[#202628]">
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-600 shrink-0" /> Teljes munkaidős és részmunkaidős szakember állások
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-600 shrink-0" /> Duális szakképzési gyakorlati helyek tanulóknak
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-amber-600 shrink-0" /> Közvetlen kapcsolatfelvétel a munkaadókkal
              </li>
            </ul>
            <button
              onClick={() => onNavigate('careers')}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Briefcase size={16} /> Tovább a KarrierPortálra
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
