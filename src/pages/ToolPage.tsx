import { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Search,
  ChevronRight,
  Home,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  Cpu,
  Ruler,
  HardHat,
  Compass,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { getActiveTools } from '../services/toolService';
import { getAdsForTool, recordAdClick } from '../services/advertisementService';
import type { Tool, AdCampaign } from '../lib/supabase';
import SectionSubNav from '../components/SectionSubNav';
import { Laptop } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from '../components/AuthPromptModal';

interface ToolPageProps {
  onNavigate: (page: string) => void;
  activeSubTab?: string;
}

const CATEGORIES_CONFIG = [
  {
    id: 'Kéziszerszámok',
    name: 'Kéziszerszámok',
    icon: Wrench,
    color: 'from-amber-50 via-amber-50/70 to-orange-100/80 border-amber-200/90 text-amber-950',
    badgeBg: 'bg-amber-100 text-amber-900 border border-amber-200',
    iconBg: 'bg-amber-500 text-white',
    arrowColor: 'text-amber-800',
    description: 'Kalapácsok, vésők, fogók, csavarhúzók, fűrészek, kőműves- és burkolószerszámok.',
    subtypes: [
      'Kalapácsok',
      'Vésők',
      'Fogók',
      'Csavarhúzók',
      'Kulcsok',
      'Mérőszalagok & Vízmértékek',
      'Kézifűrészek',
      'Vakoló & Kőműves szerszámok',
      'Burkoló szerszámok',
      'Ács szerszámok',
      'Festő szerszámok',
    ],
  },
  {
    id: 'Gépek és kisgépek',
    name: 'Gépek és kisgépek',
    icon: Cpu,
    color: 'from-blue-50 via-sky-50/70 to-cyan-100/80 border-blue-200/90 text-blue-950',
    badgeBg: 'bg-blue-100 text-blue-900 border border-blue-200',
    iconBg: 'bg-blue-600 text-white',
    arrowColor: 'text-blue-800',
    description: 'Fúrógépek, fúrókalapácsok, sarokcsiszolók, betonkeverők, döngölők, lapvibrátorok.',
    subtypes: [
      'Fúrógépek',
      'Fúrókalapácsok',
      'Bontókalapácsok',
      'Sarokcsiszolók',
      'Betonkeverők',
      'Döngölők',
      'Lapvibrátorok',
      'Fűrészgépek',
      'Kompresszorok',
    ],
  },
  {
    id: 'Mérőeszközök',
    name: 'Mérőeszközök',
    icon: Ruler,
    color: 'from-emerald-50 via-teal-50/70 to-emerald-100/80 border-emerald-200/90 text-emerald-950',
    badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    iconBg: 'bg-emerald-600 text-white',
    arrowColor: 'text-emerald-800',
    description: 'Lézeres szintezők, távolságmérők, vízmértékek, mérőszalagok, mérőállványok.',
    subtypes: ['Mérőszalagok', 'Vízmértékek', 'Lézeres szintezők', 'Távolságmérők', 'Derékszögek', 'Mérőállványok'],
  },
  {
    id: 'Állványok és segédeszközök',
    name: 'Állványok és segédeszközök',
    icon: Layers,
    color: 'from-purple-50 via-indigo-50/70 to-purple-100/80 border-purple-200/90 text-purple-950',
    badgeBg: 'bg-purple-100 text-purple-900 border border-purple-200',
    iconBg: 'bg-purple-600 text-white',
    arrowColor: 'text-purple-800',
    description: 'Homlokzati állványrendszerek, bakok, pallók, támaszok, emelőeszközök.',
    subtypes: ['Állványrendszerek', 'Bakok', 'Pallók', 'Lépcsők', 'Támaszok', 'Emelőeszközök'],
  },
  {
    id: 'Munkavédelmi eszközök',
    name: 'Munkavédelmi eszközök',
    icon: HardHat,
    color: 'from-red-50 via-rose-50/70 to-red-100/80 border-red-200/90 text-red-950',
    badgeBg: 'bg-red-100 text-red-900 border border-red-200',
    iconBg: 'bg-red-600 text-white',
    arrowColor: 'text-red-800',
    description: 'Védősisakok, munkavédelmi cipők, védőszemüvegek, hallás- és légzésvédelem.',
    subtypes: ['Védősisakok', 'Munkavédelmi cipők', 'Védőszemüvegek', 'Hallásvédelem', 'Légzésvédelem', 'Leesés elleni védelem'],
  },
  {
    id: 'Digitális eszközök és szoftverek',
    name: 'Digitális szoftverek',
    icon: Compass,
    color: 'from-cyan-50 via-blue-50/70 to-sky-100/80 border-cyan-200/90 text-cyan-950',
    badgeBg: 'bg-cyan-100 text-cyan-900 border border-cyan-200',
    iconBg: 'bg-cyan-600 text-white',
    arrowColor: 'text-cyan-800',
    description: 'CAD tervezőprogramok, BIM rendszerek, költségvetés készítők, PlanRadar, AI segédek.',
    subtypes: ['Tervezőprogramok', 'CAD szoftverek', 'BIM rendszerek', 'Költségvetés készítők', 'Munkaszervezők', 'AI tervezési segédek'],
  },
];

const ALL_PROFESSIONS = ['Ács', 'Zsaluzó ács', 'Tetőfedő', 'Kőműves', 'Burkoló', 'Villanyszerelő', 'Épületgépész', 'Lakatos', 'Gipszkartonozó'];

export default function ToolPage({ onNavigate }: ToolPageProps) {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'catalog' | 'wizard' | 'brands'>('catalog');
  const [partnerAds, setPartnerAds] = useState<AdCampaign[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingToolName, setPendingToolName] = useState<string | undefined>(undefined);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardTask, setWizardTask] = useState<'beton_furas' | 'fem_vagas' | 'burkolas' | 'szintezes' | 'zsaluzas' | null>(null);
  const [wizardFrequency, setWizardFrequency] = useState<'hobby' | 'pro' | 'heavy' | null>(null);

  const handleToolSelect = (tool: Tool) => {
    if (!user) {
      setPendingToolName(tool.name);
      setAuthModalOpen(true);
      return;
    }
    setSelectedTool(tool);
  };

  useEffect(() => {
    async function loadTools() {
      try {
        setLoading(true);
        const data = await getActiveTools();
        setTools(data);
      } catch (err) {
        console.error('Hiba az eszközök betöltésekor:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }, []);

  // Dynamic SEO Injection
  useEffect(() => {
    if (selectedTool) {
      const title = selectedTool.seo_title || `${selectedTool.name} – Építőipari Eszköz Enciklopédia | ÉpítőTudás`;
      const desc = selectedTool.seo_description || selectedTool.description || `${selectedTool.name} részletes szakmai bemutatója.`;
      document.title = title;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', desc);

      if (selectedTool.keywords && selectedTool.keywords.length > 0) {
        let metaKw = document.querySelector('meta[name="keywords"]');
        if (!metaKw) {
          metaKw = document.createElement('meta');
          metaKw.setAttribute('name', 'keywords');
          document.head.appendChild(metaKw);
        }
        metaKw.setAttribute('content', selectedTool.keywords.join(', '));
      }
    } else {
      document.title = 'Építőipari Eszköz- és Gépismereti Enciklopédia | ÉpítőTudás';
    }
  }, [selectedTool]);

  // Load Targeted Partner Ads
  useEffect(() => {
    getAdsForTool(selectedTool?.id, selectedTool?.type || selectedCategory || undefined).then(setPartnerAds);
  }, [selectedTool, selectedCategory]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchCategory = !selectedCategory || tool.type === selectedCategory;
      const matchSubtype = !selectedSubtype || tool.subtype === selectedSubtype;
      const matchProf =
        !selectedProfession || (tool.professions && tool.professions.includes(selectedProfession));
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        (tool.description && tool.description.toLowerCase().includes(q)) ||
        (tool.brand && tool.brand.toLowerCase().includes(q));

      return matchCategory && matchSubtype && matchProf && matchQuery;
    });
  }, [tools, selectedCategory, selectedSubtype, selectedProfession, searchQuery]);

  const activeCategoryConfig = useMemo(() => {
    if (!selectedCategory) return null;
    return CATEGORIES_CONFIG.find((c) => c.id === selectedCategory) || null;
  }, [selectedCategory]);

  const availableSubtypes = useMemo(() => {
    if (activeCategoryConfig) {
      return activeCategoryConfig.subtypes;
    }
    const set = new Set<string>();
    tools.forEach((t) => {
      if (t.subtype) set.add(t.subtype);
    });
    return Array.from(set);
  }, [activeCategoryConfig, tools]);

  // Wizard result recommendation
  const wizardResultTool = useMemo(() => {
    if (!wizardTask) return null;
    if (wizardTask === 'beton_furas') return tools.find((t) => t.slug === 'sds-plus-furokalapacs') || tools[2];
    if (wizardTask === 'fem_vagas') return tools.find((t) => t.slug === 'sarokcsiszolo') || tools[3];
    if (wizardTask === 'burkolas') return tools.find((t) => t.slug === 'lezeres-szintezo') || tools[4];
    if (wizardTask === 'szintezes') return tools.find((t) => t.slug === 'lezeres-szintezo') || tools[4];
    if (wizardTask === 'zsaluzas') return tools.find((t) => t.slug === 'acskalapacs') || tools[0];
    return tools[0];
  }, [wizardTask, tools]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center text-gray-900">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-3" />
          <p className="text-gray-600 text-sm font-medium">Építőipari Eszköz Enciklopédia betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-gray-900 min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-white transition-colors">
              <Home size={13} /> Főoldal
            </button>
            <ChevronRight size={13} />
            <span className="text-accent font-bold">Eszközök & Gépek Enciklopédiája</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-accent/20 border border-accent/40 text-accent px-3 py-1 rounded-full uppercase tracking-wider">
                  Szakmai Enciklopédia
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Építőipari Eszköz- és Gépismereti Enciklopédia
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                Szakmai leírások, működési elv, felépítés, vásárlási útmutatók, kivitelezési hibák és ajánlott gyártók.
              </p>
            </div>

            {/* Sub-view switcher tabs */}
            <div className="flex items-center gap-2 bg-primary-900/60 p-1.5 rounded-2xl border border-primary-700/50 backdrop-blur-sm">
              <button
                onClick={() => {
                  setActiveViewTab('catalog');
                  setSelectedTool(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeViewTab === 'catalog' && !selectedTool
                    ? 'bg-accent text-primary-950 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookOpen size={14} /> Katalógus
              </button>
              <button
                onClick={() => {
                  setActiveViewTab('wizard');
                  setSelectedTool(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeViewTab === 'wizard'
                    ? 'bg-accent text-primary-950 shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sparkles size={14} /> Eszközválasztó Segéd
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Eszközök navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Katalógus',
            page: 'tool',
            icon: <Wrench size={14} className="text-accent" />,
            active: activeViewTab === 'catalog' && !selectedTool,
          },
          {
            label: 'Szoftverek',
            page: 'software',
            icon: <Laptop size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Eszközválasztó',
            page: 'valaszto',
            icon: <Sparkles size={14} className="text-accent" />,
            active: activeViewTab === 'wizard',
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* VIEW 1: DETAILED TOOL ENCYCLOPEDIA VIEW */}
        {selectedTool ? (
          <div className="space-y-8">
            <button
              onClick={() => setSelectedTool(null)}
              className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-xs"
            >
              ← Vissza az Eszközök Katalógusához
            </button>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 space-y-8 shadow-sm">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 pb-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTool.type && (
                      <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                        {selectedTool.type}
                      </span>
                    )}
                    {selectedTool.subtype && (
                      <span className="text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1 rounded-full">
                        {selectedTool.subtype}
                      </span>
                    )}
                    {selectedTool.brand && (
                      <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                        Gyártók: {selectedTool.brand}
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-black text-gray-900">{selectedTool.name}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed max-w-3xl">
                    {selectedTool.description}
                  </p>
                </div>

                {selectedTool.image_url && (
                  <div className="w-full md:w-64 h-48 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0 shadow-xs">
                    <img
                      src={selectedTool.image_url}
                      alt={selectedTool.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Professions & Practical Uses Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" /> Ki használja ezt az eszközt? (Szakmák)
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(selectedTool.professions || ['Ács', 'Kőműves', 'Burkoló']).map((prof) => (
                      <span
                        key={prof}
                        className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary-900 font-bold text-xs rounded-xl"
                      >
                        👤 {prof}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <Wrench size={18} className="text-blue-600" /> Mire használják? (Felhasználási területek)
                  </h3>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    {(selectedTool.uses || ['Szerkezetépítés', 'Zsaluzás']).map((use, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                        <span>{use}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Parts & Anatomy Section */}
              {selectedTool.parts && selectedTool.parts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Layers size={20} className="text-primary" /> Az eszköz részei és felépítése (Anatómia)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedTool.parts.map((part, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1">
                        <h4 className="text-xs font-bold text-primary">{part.name}</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">{part.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buying Guide Section */}
              {selectedTool.buying_guide && selectedTool.buying_guide.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-600" /> Mire figyelj vásárláskor? (Szakmai Tanácsok)
                  </h3>
                  <ul className="space-y-2 text-xs text-amber-950">
                    {selectedTool.buying_guide.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold shrink-0">✔</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Common Mistakes Section */}
              {selectedTool.common_mistakes && selectedTool.common_mistakes.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-red-900 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-600" /> Gyakori kivitelezési és használati hibák
                  </h3>
                  <ul className="space-y-2 text-xs text-red-950">
                    {selectedTool.common_mistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-500 font-bold shrink-0">•</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Specifications Sheet */}
              {selectedTool.technical_specs && Object.keys(selectedTool.technical_specs).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-extrabold text-gray-900">Műszaki Specifikációk</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <tbody>
                        {Object.entries(selectedTool.technical_specs).map(([key, val], idx) => (
                          <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-5 py-3 font-bold text-gray-600 w-1/3 border-r border-gray-200">
                              {key}
                            </td>
                            <td className="px-5 py-3 text-gray-900 font-medium">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommended Partner Products & Dynamic Affiliate Campaigns */}
              {((selectedTool.recommended_products && selectedTool.recommended_products.length > 0) || partnerAds.length > 0) && (
                <div className="pt-8 border-t border-gray-200 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">A témához kapcsolódó termékek & partneri ajánlatok</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Kiemelt szponzorok, forgalmazók és affiliate kampányok</p>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">
                      Partneri & Affiliate Ajánlatok
                    </span>
                  </div>

                  {partnerAds.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {partnerAds.map((ad) => (
                        <a
                          key={ad.id}
                          href={ad.target_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => recordAdClick(ad.id)}
                          className="bg-white border border-amber-300 hover:border-amber-500 rounded-2xl p-5 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold bg-amber-400 text-black px-2 py-0.5 rounded">
                              Kiemelt Szponzor: {ad.sponsor_name}
                            </span>
                            <h4 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">
                              {ad.title}
                            </h4>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              Kattints az ajánlat megtekintéséhez <ExternalLink size={12} />
                            </span>
                          </div>
                          {ad.banner_image_url && (
                            <img
                              src={ad.banner_image_url}
                              alt={ad.title}
                              className="w-16 h-16 object-cover rounded-xl shrink-0 border border-gray-200"
                            />
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  {selectedTool.recommended_products && selectedTool.recommended_products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedTool.recommended_products.map((prod, idx) => (
                        <a
                          key={idx}
                          href={prod.partner_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white border border-gray-200 hover:border-primary rounded-2xl p-4 transition-all flex items-center gap-4 group shadow-xs hover:shadow-sm"
                        >
                          {prod.image_url && (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-14 h-14 object-cover rounded-xl shrink-0 bg-gray-50"
                            />
                          )}
                          <div className="flex-1 space-y-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                              {prod.brand}
                            </span>
                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                              {prod.name}
                            </h4>
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              Megtekintés partnernél <ExternalLink size={10} />
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeViewTab === 'wizard' ? (
          /* VIEW 2: INTERACTIVE TOOL SELECTOR WIZARD */
          <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 space-y-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Interaktív Segéd
                </span>
                <h2 className="text-2xl font-black text-gray-900">Milyen gépre / szerszámra van szükséged?</h2>
              </div>
              <button
                onClick={() => {
                  setWizardStep(1);
                  setWizardTask(null);
                  setWizardFrequency(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                title="Újrakezdés"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700">1. Lépés: Mit szeretnél csinálni / felújítani?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'beton_furas', label: 'Beton vagy tégla fúrása / vésése', icon: Cpu },
                    { id: 'fem_vagas', label: 'Betonacél, fém vagy csempe vágása', icon: Wrench },
                    { id: 'szintezes', label: 'Pontos szintezés beltérben / burkolásnál', icon: Ruler },
                    { id: 'zsaluzas', label: 'Faszerkezetek építése és zsaluzás', icon: Layers },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setWizardTask(item.id as 'beton_furas' | 'fem_vagas' | 'burkolas' | 'szintezes' | 'zsaluzas');
                        setWizardStep(2);
                      }}
                      className="p-4 bg-gray-50 border border-gray-200 hover:border-primary hover:bg-primary/5 rounded-2xl text-left font-bold text-xs text-gray-900 hover:text-primary transition-all flex items-center gap-3 shadow-xs"
                    >
                      <item.icon size={20} className="text-primary" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700">2. Lépés: Milyen gyakran fogod használni az eszközt?</h3>
                <div className="space-y-2">
                  {[
                    { id: 'hobby', label: 'Alkalmi otthoni felújítás (Hobbi)', desc: 'Évente néhányszor végzett feladatok' },
                    { id: 'pro', label: 'Rendszeres szakmai kivitelezés (Profi)', desc: 'Heti rendszerességű munkavégzés' },
                    { id: 'heavy', label: 'Napi ipari / nehéz igénybevétel (Ipari)', desc: 'Egész napos nehéz terhelés' },
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      onClick={() => {
                        setWizardFrequency(freq.id as 'hobby' | 'pro' | 'heavy');
                        setWizardStep(3);
                      }}
                      className="w-full p-4 bg-gray-50 border border-gray-200 hover:border-primary hover:bg-primary/5 rounded-2xl text-left transition-all shadow-xs"
                    >
                      <h4 className="text-xs font-bold text-gray-900">{freq.label}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{freq.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 3 && wizardResultTool && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 space-y-6 text-center text-gray-900">
                <div className="p-4 bg-amber-100 border border-amber-200 rounded-2xl inline-block text-amber-800">
                  <Sparkles size={32} className="mx-auto" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Ajánlott Eszköz ({wizardFrequency === 'heavy' ? 'Ipari kategória' : wizardFrequency === 'pro' ? 'Profi szakmai kategória' : 'Alkalmi hobbi kategória'}):
                  </span>
                  <h3 className="text-2xl font-black text-gray-900">{wizardResultTool.name}</h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">{wizardResultTool.description}</p>
                </div>

                <div className="pt-4 border-t border-amber-200 flex justify-center gap-3">
                  <button
                    onClick={() => handleToolSelect(wizardResultTool)}
                    className="px-6 py-3 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-800 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    Szakmai Enciklopédia Adatlap Megnyitása <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* VIEW 3: CATALOG & SEARCH VIEW */
          <div className="space-y-8">
            {/* Active Partner Banners */}
            {partnerAds.length > 0 && (
              <div className="bg-white border border-amber-300 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black bg-amber-400 px-3 py-1 rounded-full uppercase tracking-wider">
                    📢 Kiemelt Szponzori & Partneri Ajánlatok
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">Aktív Hirdetések</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partnerAds.map((ad) => (
                    <a
                      key={ad.id}
                      href={ad.target_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => recordAdClick(ad.id)}
                      className="bg-gray-50 border border-gray-200 hover:border-primary rounded-2xl p-4 transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {ad.sponsor_name}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                          {ad.title}
                        </h4>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          Ajánlat megtekintése <ExternalLink size={10} />
                        </span>
                      </div>
                      {ad.banner_image_url && (
                        <img
                          src={ad.banner_image_url}
                          alt={ad.title}
                          className="w-12 h-12 object-cover rounded-xl shrink-0 border border-gray-200"
                        />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Live Search */}
            <div className="relative max-w-2xl">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Keress szerszámot, gépet, szakmát vagy márkát..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl pl-11 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none text-sm font-medium shadow-xs"
              />
            </div>

            {/* 6 Category Overview Cards Grid (When no specific category selected) */}
            {!selectedCategory && !searchQuery && (
              <div className="space-y-4">
                <h2 className="text-lg font-extrabold text-gray-900">Építőipari Eszköz Főkategóriák</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {CATEGORIES_CONFIG.map((cat) => {
                    const IconComp = cat.icon;
                    const catToolsCount = tools.filter((t) => t.type === cat.id).length;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`group bg-gradient-to-br ${cat.color} border rounded-3xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:scale-[1.02] shadow-sm hover:shadow-md`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className={`p-3 ${cat.iconBg} rounded-2xl shadow-sm`}>
                              <IconComp size={24} />
                            </div>
                            <span className={`text-xs font-bold ${cat.badgeBg} px-3 py-1 rounded-full`}>
                              {catToolsCount} eszköz
                            </span>
                          </div>

                          <h3 className="text-lg font-extrabold text-gray-900">{cat.name}</h3>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                            {cat.description}
                          </p>
                        </div>

                        <div className={`pt-3 border-t border-gray-200/80 text-xs font-bold ${cat.arrowColor} flex items-center justify-between`}>
                          <span>Böngészés & Típusok</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subtype & Category Selector Chips */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                  <Filter size={14} className="text-primary" /> Szűrés Kategória Szerint:
                </h3>
                {selectedCategory && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubtype(null);
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Összes kategória
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubtype(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === null
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-xs'
                  }`}
                >
                  Összes ({tools.length})
                </button>
                {CATEGORIES_CONFIG.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setSelectedSubtype(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === c.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-xs'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtypes Chips */}
            {availableSubtypes.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">Típus:</span>
                <button
                  onClick={() => setSelectedSubtype(null)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    selectedSubtype === null
                      ? 'bg-gray-800 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs'
                  }`}
                >
                  Összes Típus
                </button>
                {availableSubtypes.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedSubtype(selectedSubtype === st ? null : st)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      selectedSubtype === st
                        ? 'bg-gray-900 text-white border border-gray-900'
                        : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}

            {/* Profession Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">Szakma:</span>
              <button
                onClick={() => setSelectedProfession(null)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedProfession === null
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs'
                }`}
              >
                Összes Szakma
              </button>
              {ALL_PROFESSIONS.map((prof) => (
                <button
                  key={prof}
                  onClick={() => setSelectedProfession(selectedProfession === prof ? null : prof)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    selectedProfession === prof
                      ? 'bg-gray-900 text-white border border-gray-900'
                      : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs'
                  }`}
                >
                  {prof}
                </button>
              ))}
            </div>

            {/* Tools Grid Catalog */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-gray-900">
                  {activeCategoryConfig ? activeCategoryConfig.name : 'Szakmai Eszközök & Gépek'} ({filteredTools.length})
                </h2>
              </div>

              {filteredTools.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
                  <Wrench size={40} className="mx-auto text-gray-400" />
                  <h3 className="text-base font-bold text-gray-900">Nem található eszköz</h3>
                  <p className="text-xs text-gray-500">Próbáld meg módosítani a szűrőket vagy a keresőszót.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => handleToolSelect(tool)}
                      className="group bg-white border border-gray-200/80 hover:border-primary/50 hover:shadow-lg rounded-3xl p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-bold bg-primary/10 border border-primary/20 text-primary-900 px-2.5 py-0.5 rounded-full">
                            {tool.subtype || tool.type}
                          </span>
                          {tool.brand && (
                            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                              {tool.brand}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-primary font-bold">
                        <span>Szakmai Adatlap & Részei ➔</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={onNavigate}
        contentType="tool"
        contentTitle={pendingToolName}
        returnPage="tool"
      />

    </div>
  );
}
