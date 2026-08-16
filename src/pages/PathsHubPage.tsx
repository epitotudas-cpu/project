import { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Briefcase,
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
  Maximize2,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Search,
  BookOpen,
  Wrench,
  Briefcase as BriefcaseIcon,
  ShieldCheck,
  Award,
  UserCheck,
  UserX,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { type TradeDetail } from '../data/tradeDetailsData';
import { useTrades } from '../services/tradeService';
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from '../components/AuthPromptModal';

interface PathsHubPageProps {
  onNavigate: (page: string) => void;
}

const TRADE_CARDS = [
  { id: 'komuves', name: 'Kőműves', icon: Hammer, color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'acs', name: 'Ács és Zsaluzó ács', icon: HomeIcon, color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  { id: 'burkolo', name: 'Burkoló', icon: Layers, color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  { id: 'villanyszerelo', name: 'Villanyszerelő', icon: Zap, color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { id: 'epuletgepesz', name: 'Épületgépész', icon: Flame, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { id: 'tetofedo', name: 'Tetőfedő és Bádogos', icon: Building, color: 'bg-red-50 border-red-200 text-red-800' },
  { id: 'gipszkartonozo', name: 'Gipszkartonozó / Szárazépítő', icon: Maximize2, color: 'bg-teal-50 border-teal-200 text-teal-800' },
  { id: 'festo', name: 'Festő, Mázoló és Tapétázó', icon: Sparkles, color: 'bg-purple-50 border-purple-200 text-purple-800' },
];

export default function PathsHubPage({ onNavigate }: PathsHubPageProps) {
  const { user } = useAuth();
  const trades = useTrades();
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [tradeSearch, setTradeSearch] = useState<string>('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingTradeName, setPendingTradeName] = useState<string | undefined>(undefined);

  const handleTradeSelect = (tradeId: string, tradeName: string) => {
    if (!user) {
      setPendingTradeName(tradeName);
      setAuthModalOpen(true);
      return;
    }
    setSelectedTradeId(tradeId);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const activeTrade: TradeDetail | null = useMemo(() => {
    if (!selectedTradeId) return null;
    const found = trades.find((t) => t.id === selectedTradeId && t.isActive !== false);
    return found || null;
  }, [selectedTradeId, trades]);

  useEffect(() => {
    if (activeTrade) {
      const pageTitle = `${activeTrade.name} szakma – Feladatok, képzés, munkakörülmények | ÉpítőTudás`;
      const pageDesc = `Ismerd meg a ${activeTrade.name.toLowerCase()} szakmát: ${activeTrade.tagline.toLowerCase()}. Mit csinál, milyen eszközökkel dolgozik és milyen szakmai lehetőségek várnak rád.`;
      const pageUrl = `https://epitotudas.hu/#paths?trade=${activeTrade.id}`;

      document.title = pageTitle;

      const updateMeta = (selector: string, content: string) => {
        const el = document.querySelector(selector);
        if (el) {
          el.setAttribute('content', content);
        }
      };

      updateMeta('meta[name="description"]', pageDesc);
      updateMeta('meta[property="og:title"]', pageTitle);
      updateMeta('meta[property="og:description"]', pageDesc);
      updateMeta('meta[property="og:url"]', pageUrl);
      updateMeta('meta[name="twitter:title"]', pageTitle);
      updateMeta('meta[name="twitter:description"]', pageDesc);
    } else {
      document.title = 'ÉpítőTudás – Építőipari tudásbázis és szakmai képzések';
      const defaultDesc = 'Építőipari tudásbázis szakembereknek, tanulóknak és kivitelezőknek. Szakmai fogalmak, technológiák, szakmák, számítások és gyakorlati tudás egy helyen.';
      const updateMeta = (selector: string, content: string) => {
        const el = document.querySelector(selector);
        if (el) {
          el.setAttribute('content', content);
        }
      };
      updateMeta('meta[name="description"]', defaultDesc);
      updateMeta('meta[property="og:title"]', 'ÉpítőTudás – Építőipari tudásbázis és szakmai képzések');
      updateMeta('meta[property="og:description"]', defaultDesc);
      updateMeta('meta[property="og:url"]', 'https://epitotudas.hu');
      updateMeta('meta[name="twitter:title"]', 'ÉpítőTudás – Építőipari tudásbázis és szakmai képzések');
      updateMeta('meta[name="twitter:description"]', defaultDesc);
    }
  }, [activeTrade]);

  const filteredTradeCards = useMemo(() => {
    if (!tradeSearch.trim()) return TRADE_CARDS;
    return TRADE_CARDS.filter((tc) =>
      tc.name.toLowerCase().includes(tradeSearch.toLowerCase())
    );
  }, [tradeSearch]);

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
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
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                <HardHat size={13} /> Építőipari Pályaorientáció &amp; Szakmaismertető
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Építőipari Szakmák Részletes Bemutatása
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Őszinte, valósághű és gyakorlatias szakmaismertető leendő tanulóknak és pályaválasztóknak.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('courses')}
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-primary text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
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

      {/* Sub-navigation */}
      <SectionSubNav
        ariaLabel="Pályák navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Szakmák',
            href: '#szakmak',
            icon: <HardHat size={14} className="text-accent" />,
            active: !selectedTradeId,
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* VIEW 1: TRADE PROFESSION SELECTION GRID */}
        {!selectedTradeId && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-md-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <HardHat className="text-accent" size={22} /> Válassz egy Építőipari Szakmát!
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Kattints a kártyákra a részletes és őszinte szakmai pályaismertető megnyitásához.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Keresés szakma neve alapján..."
                  value={tradeSearch}
                  onChange={(e) => setTradeSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTradeCards.map((card) => {
                const IconComp = card.icon;
                const detailData = trades.find((t) => t.id === card.id);
                return (
                  <div
                    key={card.id}
                    className="bg-white border border-gray-200 hover:border-accent rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between space-y-5 group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${card.color} shadow-sm group-hover:scale-110 transition-transform`}>
                        <IconComp size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                          {detailData?.categoryLabel || 'Szakma'}
                        </span>
                        <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                          {card.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {detailData?.overview || 'Részletes pályaorientációs és oktatási szakmaismertető.'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleTradeSelect(card.id, card.name)}
                      className="w-full py-2.5 bg-primary hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 group-hover:bg-accent group-hover:text-primary"
                    >
                      <span>Szakma bemutatása</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: FULL UNNUMBERED TRADE PROFESSION ORIENTATION GUIDE */}
        {activeTrade && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Back Header */}
            <div className="flex items-center justify-between bg-white p-4 px-6 rounded-2xl border border-gray-200 shadow-sm">
              <button
                onClick={() => setSelectedTradeId(null)}
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowRight size={14} className="rotate-180" /> Vissza az összes szakmához
              </button>
              <div className="text-xs text-gray-400 font-medium">
                Pályaorientációs Útmutató
              </div>
            </div>

            {/* Trade Hero Card */}
            <div className="bg-primary text-white rounded-3xl p-6 md:p-10 shadow-xl border border-primary-700 relative overflow-hidden">
              <div className="space-y-3 relative z-10">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                  <HardHat size={13} /> {activeTrade.categoryLabel}
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {activeTrade.name}
                </h1>
                <p className="text-accent text-sm md:text-lg font-bold">{activeTrade.tagline}</p>
              </div>
            </div>

            {/* Sticky Table of Contents Quick Nav */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm sticky top-4 z-30 overflow-x-auto scrollbar-none flex items-center gap-2">
              {[
                { id: 'sec-1', label: 'Mi ez a szakma?' },
                { id: 'sec-2', label: 'Mit csinál?' },
                { id: 'sec-4', label: 'Eszközök & Anyagok' },
                { id: 'sec-5-6', label: 'Mit kell megtanulni?' },
                { id: 'sec-7-10', label: 'Terhelés & Körülmények' },
                { id: 'sec-11-12', label: 'Előnyök & Hátrányok' },
                { id: 'sec-13-15', label: 'Karrier & Vállalkozás' },
                { id: 'sec-19', label: 'Neked való?' },
              ].map((nav) => (
                <a
                  key={nav.id}
                  href={`#${nav.id}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-primary hover:text-white text-gray-700 whitespace-nowrap transition-all"
                >
                  {nav.label}
                </a>
              ))}
            </div>

            {/* UNNUMBERED FEJEZET TARTALOM */}
            <div className="space-y-10">
              
              {/* MI EZ A SZAKMA? */}
              <section id="sec-1" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                    <BookOpen size={18} />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">MI EZ A SZAKMA?</h2>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed font-medium bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  {activeTrade.overview}
                </p>
              </section>

              {/* MIT CSINÁL EGY [SZAKMA]? */}
              <section id="sec-2" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                    <Wrench size={18} />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">MIT CSINÁL EGY {activeTrade.name.toUpperCase()}?</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tipikus Feladatok</h3>
                    <ul className="space-y-2">
                      {activeTrade.whatDoesDo.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-gray-800 font-medium">
                          <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Épületek &amp; Helyszínek</h3>
                    <ul className="space-y-2">
                      {activeTrade.whatDoesDo.buildings.map((b, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-gray-800 font-medium">
                          <Building size={16} className="text-primary shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                    <strong className="text-gray-900 block font-bold">Önálló munkavégzés:</strong>
                    <p className="text-gray-600 leading-relaxed">{activeTrade.whatDoesDo.soloWork}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                    <strong className="text-gray-900 block font-bold">Csapatmunka &amp; Társ-szakmák:</strong>
                    <p className="text-gray-600 leading-relaxed">{activeTrade.whatDoesDo.teamWork}</p>
                  </div>
                </div>
              </section>

              {/* MIVEL DOLGOZIK? */}
              <section id="sec-4" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
                    <Wrench size={18} />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">MIVEL DOLGOZIK? (ANYAGOK, SZERSZÁMOK &amp; GÉPEK)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTrade.toolsAndMaterials.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{item.category}</span>
                      <h4 className="text-xs font-bold text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* MIT KELL MEGTANULNI A KÉPZÉS SORÁN? */}
              <section id="sec-5-6" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center font-bold">
                    <GraduationCap size={18} />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">MIT KELL MEGTANULNI A KÉPZÉS SORÁN?</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                    <h3 className="text-xs font-extrabold text-blue-900 uppercase">Elméleti Tudás</h3>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      {activeTrade.knowledgeToLearn.theory.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                    <h3 className="text-xs font-extrabold text-amber-900 uppercase">Gyakorlati Munkák</h3>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      {activeTrade.knowledgeToLearn.practice.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                    <h3 className="text-xs font-extrabold text-emerald-900 uppercase">Munkavédelem</h3>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      {activeTrade.knowledgeToLearn.safety.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* TERHELÉS, KINEK VALÓ & MUNKAKÖRÜLMÉNYEK */}
              <section id="sec-7-10" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold">
                    <ShieldCheck size={18} />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">TERHELÉS, KINEK VALÓ &amp; MUNKAKÖRÜLMÉNYEK</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <span className="text-xs font-extrabold text-gray-900 block">Fizikai Nehézség</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{activeTrade.difficulty.physical}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <span className="text-xs font-extrabold text-gray-900 block">Szellemi Nehézség</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{activeTrade.difficulty.mental}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <span className="text-xs font-extrabold text-gray-900 block">Pontossági Elvárások</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{activeTrade.difficulty.precision}</p>
                  </div>
                </div>

                {/* Suitable vs Unsuitable Side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 space-y-3">
                    <h3 className="text-sm font-extrabold text-emerald-900 flex items-center gap-2">
                      <UserCheck size={18} className="text-emerald-600" /> Milyen embernek való?
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-700">
                      {activeTrade.suitableAttributes.map((attr, i) => (
                        <li key={i} className="flex items-center gap-2 font-medium">
                          <Check size={14} className="text-emerald-600 shrink-0" />
                          <span>{attr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20 space-y-3">
                    <h3 className="text-sm font-extrabold text-red-900 flex items-center gap-2">
                      <UserX size={18} className="text-red-600" /> Kinek NEM ajánlott?
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-700">
                      {activeTrade.unsuitableAttributes.map((attr, i) => (
                        <li key={i} className="flex items-center gap-2 font-medium">
                          <X size={14} className="text-red-600 shrink-0" />
                          <span>{attr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* A SZAKMA ELŐNYEI ÉS HÁTRÁNYAI */}
              <section id="sec-11-12" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                    <Award size={18} />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">A SZAKMA ELŐNYEI ÉS HÁTRÁNYAI</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-5 bg-emerald-50/40 border border-emerald-200 rounded-3xl">
                    <h3 className="text-xs font-extrabold text-emerald-900 uppercase">A Szakma Előnyei</h3>
                    <ul className="space-y-2 text-xs text-gray-800 font-medium">
                      {activeTrade.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3 p-5 bg-amber-50/40 border border-amber-200 rounded-3xl">
                    <h3 className="text-xs font-extrabold text-amber-900 uppercase">A Szakma Hátrányai</h3>
                    <ul className="space-y-2 text-xs text-gray-800 font-medium">
                      {activeTrade.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* MUNKALEHETŐSÉGEK, KARRIERÚT & VÁLLALKOZÁS */}
              <section id="sec-13-15" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                    <BriefcaseIcon size={18} />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">MUNKALEHETŐSÉGEK, KARRIERÚT &amp; VÁLLALKOZÁS</h2>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Fejlődési Karrierlépcső</h3>
                  <div className="p-4 bg-primary text-white rounded-2xl text-xs font-bold text-center">
                    {activeTrade.careerPath.join(' → ')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Hol Lehet Dolgozni?</h3>
                    <ul className="space-y-2 text-xs text-gray-700">
                      {activeTrade.workplaces.map((wp, i) => (
                        <li key={i} className="flex items-center gap-2 font-medium">
                          <Building size={14} className="text-primary shrink-0" />
                          <span>{wp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Lehet-e Vállalkozást Indítani?</h3>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                      <p className="text-gray-800 font-bold">
                        {activeTrade.entrepreneurship.possible ? 'Igen, a szakmával reálisan indítható önálló vállalkozás.' : 'Főként vállalati kötelékben gyakorolható.'}
                      </p>
                      <p className="text-gray-600 leading-relaxed">{activeTrade.entrepreneurship.prosAndCons}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* RÖVID ÖSSZEFOGLALÓ - NEKED VALÓ EZ A SZAKMA? */}
              <section id="sec-19" className="bg-primary text-white rounded-3xl p-6 md:p-10 shadow-xl space-y-6">
                <div className="space-y-2 text-center max-w-2xl mx-auto">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">Összegző döntési segédlet</span>
                  <h2 className="text-2xl md:text-3xl font-black">Neked való ez a szakma?</h2>
                  <p className="text-xs text-gray-300">
                    Gondold át reálisan az alábbi szempontokat a pálya orientációs döntésed előtt!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="p-6 bg-white/10 rounded-3xl border border-white/20 space-y-3">
                    <h3 className="text-sm font-extrabold text-accent flex items-center gap-2">
                      <CheckCircle2 size={18} /> Akkor lehet jó választás számodra, ha...
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-200">
                      {activeTrade.summaryChecklist.goodFitIf.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 font-medium">
                          <Check size={14} className="text-accent shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-6 bg-white/10 rounded-3xl border border-white/20 space-y-3">
                    <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2">
                      <AlertCircle size={18} /> Érdemes más szakmát is megnézned, ha...
                    </h3>
                    <ul className="space-y-2 text-xs text-gray-200">
                      {activeTrade.summaryChecklist.considerOtherIf.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 font-medium">
                          <X size={14} className="text-amber-300 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

            </div>
          </div>
        )}

      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={onNavigate}
        contentType="trade"
        contentTitle={pendingTradeName}
        returnPage="paths"
      />

    </div>
  );
}
