import { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  ChevronRight,
  BookOpen,
  FileText,
  Download,
  Users,
  GraduationCap,
  HardHat,
  Filter,
  X,
  HelpCircle,
  Tag,
  Calculator,
  Library,
  FileCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ShieldCheck,
  Info,
  Calendar,
  Layers,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import {
  getKnowledgeItemsLocal,
  fetchKnowledgeItemsFromCloud,
  type EducationalContentItem,
} from '../services/knowledgeHubService';
import { OFFICIAL_SAFETY_CARDS, type SafetyCardItem } from '../data/safetyCardsData';

interface SafetyPageProps {
  onNavigate: (page: string) => void;
}

export default function SafetyPage({ onNavigate }: SafetyPageProps) {
  const [activeTab, setActiveTab] = useState<'cards' | 'articles'>('cards');
  const [items, setItems] = useState<EducationalContentItem[]>(() =>
    getKnowledgeItemsLocal().filter((i) => i.hub_type === 'safety' && i.status === 'published')
  );
  
  // Filtering for Articles
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<'all' | 'students' | 'professionals'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<EducationalContentItem | null>(null);

  // Filtering for Official Safety Cards (Multi-selection & Modal Panel)
  const [selectedCardCategories, setSelectedCardCategories] = useState<string[]>([]);
  const [selectedCardAudiences, setSelectedCardAudiences] = useState<string[]>([]);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [activeCard, setActiveCard] = useState<SafetyCardItem | null>(null);

  // Filter Modal Panel State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [modalCategories, setModalCategories] = useState<string[]>([]);
  const [modalAudiences, setModalAudiences] = useState<string[]>([]);

  useEffect(() => {
    function loadData() {
      const all = getKnowledgeItemsLocal().filter((i) => i.hub_type === 'safety' && i.status === 'published');
      setItems(all);
    }
    loadData();

    void fetchKnowledgeItemsFromCloud().then((cloudItems) => {
      if (cloudItems) {
        setItems(cloudItems.filter((i) => i.hub_type === 'safety' && i.status === 'published'));
      }
    });

    window.addEventListener('knowledge-hub-updated', loadData);
    return () => window.removeEventListener('knowledge-hub-updated', loadData);
  }, []);

  // Close filter modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFilterModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unique card categories list
  const availableCardCategories = useMemo(() => {
    const categories = new Set<string>();
    OFFICIAL_SAFETY_CARDS.forEach((card) => {
      if (card.type) categories.add(card.type);
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b, 'hu'));
  }, []);

  // Card category counts map
  const cardCategoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    OFFICIAL_SAFETY_CARDS.forEach((card) => {
      if (card.type) {
        map.set(card.type, (map.get(card.type) ?? 0) + 1);
      }
    });
    return map;
  }, []);

  // Filtered Cards list
  const filteredCards = useMemo(() => {
    return OFFICIAL_SAFETY_CARDS.filter((card) => {
      const matchesCategory =
        selectedCardCategories.length === 0 || selectedCardCategories.includes(card.type);
      const matchesAudience =
        selectedCardAudiences.length === 0 ||
        selectedCardAudiences.some((aud) => card.target_audience.includes(aud as any));

      const q = cardSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        card.title.toLowerCase().includes(q) ||
        card.summary.toLowerCase().includes(q) ||
        card.danger.toLowerCase().includes(q) ||
        card.required_action.toLowerCase().includes(q) ||
        card.legal_sources.some(
          (src) => src.name.toLowerCase().includes(q) || src.section.toLowerCase().includes(q)
        );

      return matchesCategory && matchesAudience && matchesQuery;
    });
  }, [selectedCardCategories, selectedCardAudiences, cardSearchQuery]);

  // Unique topics list for Articles
  const availableTopics = useMemo(() => {
    const topics = new Set<string>();
    items.forEach((i) => {
      if (i.topic) topics.add(i.topic);
    });
    return Array.from(topics);
  }, [items]);

  // Filtered items list for Articles
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTopic = selectedTopic === 'all' || item.topic === selectedTopic;
      const matchesAudience =
        selectedAudience === 'all' || item.target_audience === 'all' || item.target_audience === selectedAudience;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.standard_code && item.standard_code.toLowerCase().includes(q)) ||
        item.keywords.some((k) => k.toLowerCase().includes(q));

      return matchesTopic && matchesAudience && matchesQuery;
    });
  }, [items, selectedTopic, selectedAudience, searchQuery]);

  // Modal Panel Handlers
  const handleOpenFilterModal = () => {
    setModalCategories([...selectedCardCategories]);
    setModalAudiences([...selectedCardAudiences]);
    setIsFilterModalOpen(true);
  };

  const handleApplyFilterModal = () => {
    setSelectedCardCategories([...modalCategories]);
    setSelectedCardAudiences([...modalAudiences]);
    setIsFilterModalOpen(false);
  };

  const handleClearAllFilters = () => {
    setSelectedCardCategories([]);
    setSelectedCardAudiences([]);
    setCardSearchQuery('');
    setModalCategories([]);
    setModalAudiences([]);
  };

  const handleRemoveCategoryChip = (cat: string) => {
    setSelectedCardCategories((prev) => prev.filter((c) => c !== cat));
  };

  const handleRemoveAudienceChip = (aud: string) => {
    setSelectedCardAudiences((prev) => prev.filter((a) => a !== aud));
  };

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20 selection:bg-accent selection:text-black">
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
            <button onClick={() => onNavigate('tudastar')} className="hover:text-white transition-colors">
              Tudástár
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Munkavédelem</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-full">
                <ShieldAlert size={14} /> Hivatalos Jogszabályalapú Tudásbázis
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Építőipari Munkavédelmi Tudástár
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Hatályos magyar munkavédelmi jogszabályokra és az NJT hivatalos jogszabályszövegeire épülő, strukturált és gyakorlatias szakmai útmutatók.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs bg-white/10 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl backdrop-blur-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-accent" /> Hivatalos Kártyák: <strong className="text-accent">{OFFICIAL_SAFETY_CARDS.length} db</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Tudástár navigáció"
        onNavigate={onNavigate}
        items={[
          { label: 'Fogalomtár & Szótár', page: 'glossary', icon: <BookOpen size={14} className="text-accent" />, active: false },
          { label: 'Számítások & Kalkulátorok', page: 'calculations', icon: <Calculator size={14} className="text-accent" />, active: false },
          { label: 'Szakmai Könyvek', page: 'books', icon: <Library size={14} className="text-accent" />, active: false },
          { label: 'Munkavédelem', page: 'safety', icon: <ShieldAlert size={14} className="text-accent" />, active: true },
          { label: 'Szabályok, szabványok', page: 'standards', icon: <FileCheck size={14} className="text-accent" />, active: false },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Main View Mode Selector Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ShieldAlert size={18} className={activeTab === 'cards' ? 'text-accent' : 'text-amber-600'} />
              <span>Hivatalos Munkavédelmi Kártyák ({OFFICIAL_SAFETY_CARDS.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('articles')}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'articles'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BookOpen size={18} className={activeTab === 'articles' ? 'text-accent' : 'text-blue-600'} />
              <span>Tananyagok &amp; Útmutatók ({items.length})</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium px-4 hidden lg:block">
            {activeTab === 'cards' ? 'Hatályos magyar jogszabályokon (NJT) alapuló kártyák' : 'Oktatási anyagok és szakmai útmutatók'}
          </div>
        </div>

        {/* ── TAB 1: OFFICIAL SAFETY CARDS ── */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            
            {/* SEARCH AND FILTER BAR WITH MODAL TRIGGER */}
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                
                {/* Live Search */}
                <div className="relative flex-1 w-full">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Keresés a 32 hivatalos kártya között (pl. korlát, sisak, gödör, Mvt. 54. §, FI-relé)..."
                    value={cardSearchQuery}
                    onChange={(e) => setCardSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-accent font-medium"
                  />
                  {cardSearchQuery && (
                    <button
                      onClick={() => setCardSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Filter Action Button (opens Filter Panel) */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={handleOpenFilterModal}
                    className={`w-full md:w-auto px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-between gap-2.5 border shadow-xs cursor-pointer ${
                      selectedCardCategories.length > 0 || selectedCardAudiences.length > 0
                        ? 'bg-primary text-white border-primary-700 shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={16} className={selectedCardCategories.length > 0 || selectedCardAudiences.length > 0 ? 'text-accent' : 'text-gray-600'} />
                      <span>
                        {selectedCardCategories.length > 0 || selectedCardAudiences.length > 0
                          ? `Szűrők (${selectedCardCategories.length + selectedCardAudiences.length})`
                          : 'Kategóriák és Szűrők'}
                      </span>
                    </div>
                    <ChevronDown size={15} />
                  </button>
                </div>
              </div>

              {/* Active Removable Filter Chips Bar */}
              {(selectedCardCategories.length > 0 || selectedCardAudiences.length > 0 || cardSearchQuery.trim()) && (
                <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-500 mr-1 flex items-center gap-1">
                    <Filter size={13} /> Aktív szűrők:
                  </span>

                  {/* Audience Chips */}
                  {selectedCardAudiences.map((aud) => (
                    <span
                      key={aud}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs rounded-full shadow-2xs"
                    >
                      <span>Célcsoport: {aud === 'munkavállaló' ? 'Tanuló' : 'Szakember'}</span>
                      <button
                        onClick={() => handleRemoveAudienceChip(aud)}
                        className="hover:bg-amber-200/60 rounded-full p-0.5"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}

                  {/* Category Chips */}
                  {selectedCardCategories.map((catName) => (
                    <span
                      key={catName}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary-950 font-bold text-xs rounded-full shadow-2xs"
                    >
                      <span>{catName}</span>
                      <button
                        onClick={() => handleRemoveCategoryChip(catName)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}

                  {/* Search Query Chip */}
                  {cardSearchQuery.trim() && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs rounded-full shadow-2xs">
                      <span>{`Keresés: „${cardSearchQuery}”`}</span>
                      <button
                        onClick={() => setCardSearchQuery('')}
                        className="hover:bg-blue-200/60 rounded-full p-0.5"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  )}

                  {/* Clear All Button */}
                  <button
                    onClick={handleClearAllFilters}
                    className="text-xs font-bold text-accent hover:underline ml-2 cursor-pointer"
                  >
                    Összes szűrő törlése
                  </button>
                </div>
              )}
            </div>

            {/* Cards Header & Count */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">
                  {selectedCardCategories.length > 0 || selectedCardAudiences.length > 0
                    ? 'Szűrt Munkavédelmi Kártyák'
                    : cardSearchQuery
                    ? 'Keresési Találatok'
                    : 'Összes Munkavédelmi Kártya'}
                </h2>
                <span className="text-xs text-gray-500 font-bold bg-gray-200/60 px-2.5 py-0.5 rounded-full">
                  {filteredCards.length} db
                </span>
              </div>
            </div>

            {/* Official Cards Grid */}
            {filteredCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setActiveCard(card)}
                    className="bg-white rounded-3xl border border-gray-200 hover:border-accent p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-4 group relative overflow-hidden"
                  >
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary to-accent" />

                    <div className="space-y-3 pt-1">
                      {/* Category Badge & Audience */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-extrabold rounded-lg">
                          <Layers size={12} className="text-amber-700" /> {card.type}
                        </span>
                        <div className="flex items-center gap-1">
                          {card.target_audience.map((aud) => (
                            <span
                              key={aud}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md"
                            >
                              {aud === 'munkavállaló' ? 'Tanuló' : 'Szakember'}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Title */}
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {card.title}
                      </h3>

                      {/* Short Summary */}
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {card.summary}
                      </p>

                      {/* Danger Highlight Pill */}
                      <div className="bg-red-50/70 border border-red-100 rounded-xl p-2.5 text-[11px] text-red-900 flex items-start gap-2 line-clamp-2 font-medium">
                        <AlertTriangle size={13} className="text-red-600 shrink-0 mt-0.5" />
                        <span>{card.danger}</span>
                      </div>
                    </div>

                    {/* Legal Source Footer */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[11px] min-w-0 flex-1">
                        <FileCheck size={13} className="text-emerald-600 shrink-0" />
                        <span className="truncate block font-medium" title={card.legal_sources[0]?.name}>
                          {card.legal_sources[0]?.name.split(' ')[0]} {card.legal_sources[0]?.section}
                        </span>
                      </div>

                      <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs shrink-0 whitespace-nowrap">
                        <span>Megnyitás</span> <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
                  <HelpCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Nincs találat a megadott szűrésre</h3>
                <p className="text-xs text-gray-600">
                  Próbálja meg eltávolítani a keresési kifejezést vagy válasszon másik kategóriát.
                </p>
                <button
                  onClick={handleClearAllFilters}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-800 transition-colors"
                >
                  Szűrők alaphelyzetbe állítása
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: ARTICLES & GUIDES ── */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            {/* Search & Audience Selector Filter Bar */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col lg:flex-row items-center gap-4">
                {/* Live Search */}
                <div className="relative flex-1 w-full">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Keresés munkavédelmi témák, védőeszközök, előírások között..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-accent font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Target Audience Tabs */}
                <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-none shrink-0">
                  {[
                    { id: 'all', label: 'Összes célközönség', icon: Users },
                    { id: 'students', label: 'Tanulók részére', icon: GraduationCap },
                    { id: 'professionals', label: 'Szakembereknek', icon: HardHat },
                  ].map((tab) => {
                    const IconComp = tab.icon;
                    const active = selectedAudience === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedAudience(tab.id as any)}
                        className={`flex-1 min-w-fit px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                          active ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        <IconComp size={14} className={active ? 'text-accent' : 'text-gray-500'} />
                        <span className="truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Pills Filter */}
              {availableTopics.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-gray-100 pt-4">
                  <span className="text-xs font-bold text-gray-500 shrink-0 mr-1 flex items-center gap-1">
                    <Filter size={13} /> Témakörök:
                  </span>
                  <button
                    onClick={() => setSelectedTopic('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                      selectedTopic === 'all'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Összes témakör
                  </button>
                  {availableTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                        selectedTopic === topic
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Articles Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className="bg-white rounded-3xl border border-gray-200 hover:border-accent p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold rounded-lg">
                          <ShieldAlert size={12} /> {item.topic}
                        </span>
                        {item.target_audience === 'students' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-md border border-blue-200">
                            <GraduationCap size={11} /> Tanuló
                          </span>
                        ) : item.target_audience === 'professionals' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-extrabold rounded-md border border-slate-300">
                            <HardHat size={11} /> Szakember
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {item.summary}
                      </p>
                    </div>

                    {/* Footer Metadata & CTA */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3 text-gray-500 font-medium min-w-0 flex-1">
                        {item.documents && item.documents.length > 0 && (
                          <span className="flex items-center gap-1 text-primary font-bold shrink-0">
                            <FileText size={13} /> {item.documents.length} PDF
                          </span>
                        )}
                        {item.standard_code && (
                          <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700 truncate" title={item.standard_code}>
                            {item.standard_code.split('/')[0]}
                          </span>
                        )}
                      </div>

                      <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs shrink-0 whitespace-nowrap">
                        Részletek <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
                  <HelpCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Ehhez a szűréshez jelenleg még nincs elérhető oktatási anyag</h3>
                <p className="text-xs text-gray-600">
                  Próbálja meg eltávolítani a keresési kifejezést vagy állítsa vissza a témakör szűrőt.
                </p>
                <button
                  onClick={() => {
                    setSelectedTopic('all');
                    setSelectedAudience('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-800 transition-colors"
                >
                  Szűrők alaphelyzetbe állítása
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CATEGORY & FILTER MODAL PANEL ── */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col p-6 sm:p-8 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-primary" />
                  Munkavédelmi Szűrők &amp; Kategóriák
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Válassza ki a megjeleníteni kívánt kategóriákat és célcsoportokat
                </p>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-1">
              
              {/* Section 1: Célcsoport szűrő (Checkboxes) */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-primary" /> Célcsoport Kijelölése
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'munkavállaló', label: 'Tanulók részére', icon: GraduationCap },
                    { id: 'szakember', label: 'Szakembereknek', icon: HardHat },
                  ].map((aud) => {
                    const IconComp = aud.icon;
                    const isChecked = modalAudiences.includes(aud.id);
                    return (
                      <label
                        key={aud.id}
                        className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500 text-amber-950 shadow-2xs'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setModalAudiences((prev) =>
                              prev.includes(aud.id)
                                ? prev.filter((a) => a !== aud.id)
                                : [...prev, aud.id]
                            );
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <IconComp size={16} className={isChecked ? 'text-amber-700' : 'text-gray-400'} />
                        <span>{aud.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Kategóriák szűrő (Checkboxes with counts) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-primary" /> Kártya Kategóriák
                  </h4>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => setModalCategories([...availableCardCategories])}
                      className="text-primary font-bold hover:underline cursor-pointer"
                    >
                      Összes kijelölése
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setModalCategories([])}
                      className="text-gray-500 hover:text-gray-800 cursor-pointer"
                    >
                      Törlés
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableCardCategories.map((catName) => {
                    const count = cardCategoryCounts.get(catName) || 0;
                    const isChecked = modalCategories.includes(catName);
                    return (
                      <label
                        key={catName}
                        className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-primary/10 border-primary text-primary-950 shadow-2xs'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setModalCategories((prev) =>
                                prev.includes(catName)
                                  ? prev.filter((c) => c !== catName)
                                  : [...prev, catName]
                              );
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                          />
                          <span className="truncate">{catName}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 shrink-0">
                          {count} kártya
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setModalCategories([]);
                  setModalAudiences([]);
                }}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 underline decoration-dotted cursor-pointer"
              >
                Kijelölések törlése
              </button>

              <button
                onClick={handleApplyFilterModal}
                className="px-6 py-3 bg-primary hover:bg-primary-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 size={16} className="text-accent" />
                Kártyák megjelenítése
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── OFFICIAL SAFETY CARD MODAL ── */}
      {activeCard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-primary text-white p-6 sm:p-8 rounded-t-3xl sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-primary-700 shadow-sm">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-amber-400 text-black font-extrabold rounded-lg uppercase tracking-wider text-[11px]">
                    {activeCard.type}
                  </span>
                  <span className="px-2.5 py-0.5 bg-white/10 text-gray-200 font-medium rounded-md">
                    Hatályos magyar forrás
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeCard.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveCard(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Rövid Lényeg */}
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed flex items-start gap-3">
                <ShieldAlert size={22} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-amber-900 mb-1 text-xs uppercase tracking-wider">RÖVID LÉNYEG</h4>
                  <p>{activeCard.summary}</p>
                </div>
              </div>

              {/* Veszély & Kockázat Box */}
              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-2xl space-y-2">
                <div className="flex items-center gap-2 text-red-900 font-extrabold text-xs uppercase tracking-wider">
                  <AlertTriangle size={18} className="text-red-600" /> VESZÉLY ÉS KOCKÁZAT
                </div>
                <p className="text-xs sm:text-sm text-red-950 leading-relaxed font-medium">
                  {activeCard.danger}
                </p>
              </div>

              {/* Mit kell tenni? Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={18} className="text-emerald-700" /> MIT KELL TENNI? (GYAKORLATI TEENDŐK)
                </div>
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
                  {activeCard.required_action}
                </p>
              </div>

              {/* Mit nem szabad? Box */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs uppercase tracking-wider">
                  <Ban size={18} className="text-rose-700" /> MIT NEM SZABAD? (TILTAKOZÁSOK &amp; TILTÁSOK)
                </div>
                <p className="text-xs sm:text-sm text-rose-950 leading-relaxed font-medium">
                  {activeCard.prohibited_action}
                </p>
              </div>

              {/* Miért fontos? Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
                  <Info size={18} className="text-blue-700" /> MIÉRT FONTOS? (SZAKMAI INDOKLÁS)
                </div>
                <p className="text-xs sm:text-sm text-blue-950 leading-relaxed">
                  {activeCard.why_it_matters}
                </p>
              </div>

              {/* Mikor alkalmazandó? */}
              {activeCard.when_applicable && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-1">
                  <span className="font-extrabold text-gray-900 block uppercase text-[10px] tracking-wider text-gray-500">
                    MIKOR ALKALMAZANDÓ?
                  </span>
                  <p className="text-gray-800 font-medium">{activeCard.when_applicable}</p>
                </div>
              )}

              {/* Gyakorlati / Oktatási példa */}
              {activeCard.practical_example && (
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-1">
                  <span className="font-extrabold text-amber-900 block uppercase text-[10px] tracking-wider">
                    GYAKORLATI / OKTATÁSI PÉLDA
                  </span>
                  <p className="text-amber-950 italic">{activeCard.practical_example}</p>
                </div>
              )}

              {/* Jogszabályi / Hivatalos Források */}
              <div className="border-t border-gray-200 pt-5 space-y-3">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck size={16} className="text-emerald-600" /> Hivatalos Jogszabályi Forrás (NJT)
                </h4>
                <div className="space-y-2">
                  {activeCard.legal_sources.map((src, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-gray-900 block">{src.name}</span>
                        <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700 inline-block">
                          {src.section}
                        </span>
                      </div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-primary hover:bg-primary-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                      >
                        <ExternalLink size={13} /> NJT Forrás Megnyitása
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forrás Ellenőrzési Adatok */}
              <div className="bg-slate-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>Státusz: <strong className="text-emerald-700 uppercase font-bold">{activeCard.legal_sources[0]?.status || 'hatályos'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-slate-500" />
                  <span>Ellenőrizve: <strong>{activeCard.source_checked_at}</strong></span>
                </div>
                <div>
                  <span>Bizalmi szint: <strong className="text-primary uppercase font-bold">{activeCard.confidence}</strong></span>
                </div>
              </div>

              {/* Legal Disclaimer Note */}
              <p className="text-[10px] text-gray-400 italic text-center border-t border-gray-100 pt-4 leading-normal">
                Jogi nyilatkozat: A munkavédelmi kártya tájékoztató jellegű, és nem helyettesíti a munkáltatói kockázatértékelést, a munkavédelmi oktatást, a munkavédelmi szakember véleményét vagy az orvosi alkalmassági vizsgálatot.
              </p>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 sm:px-8 rounded-b-3xl flex items-center justify-between">
              <button
                onClick={() => setActiveCard(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Bezárás
              </button>
              <span className="text-[11px] text-gray-400">ÉpítőTudás Munkavédelmi Kártyatár</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ARTICLE DETAIL MODAL ── */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Modal Header */}
            <div className="bg-primary text-white p-6 sm:p-8 rounded-t-3xl sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-primary-700">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 bg-accent/20 border border-accent/40 text-accent font-bold rounded-md">
                    {activeItem.topic}
                  </span>
                  {activeItem.standard_code && (
                    <span className="px-2.5 py-0.5 bg-white/10 text-gray-200 font-mono rounded-md">
                      {activeItem.standard_code}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeItem.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Summary Box */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed flex items-start gap-3">
                <ShieldAlert size={20} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-amber-900 mb-1">Rövid Összefoglaló:</h4>
                  <p>{activeItem.summary}</p>
                </div>
              </div>

              {/* Table of Contents / Main Content Layout */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Main Article Body */}
                <div className="md:col-span-3 space-y-6 text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                  <div className="prose max-w-none text-xs sm:text-sm space-y-4">
                    {activeItem.content}
                  </div>

                  {/* Important Safety Notes Callout */}
                  {activeItem.important_notes && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl space-y-1 my-4">
                      <div className="flex items-center gap-2 text-red-800 font-extrabold text-xs">
                        <ShieldAlert size={16} /> FONTOS MUNKAVÉDELMI FIGYELMEZTETÉS
                      </div>
                      <p className="text-xs text-red-900 leading-relaxed font-medium">
                        {activeItem.important_notes}
                      </p>
                    </div>
                  )}

                  {/* Practical Example / Case Study Box */}
                  {activeItem.practical_examples && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-2 my-4">
                      <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                        <BookOpen size={16} className="text-blue-700" /> GYAKORLATI ESETTANULMÁNY / PÉLDA
                      </div>
                      <p className="text-xs text-blue-950 leading-relaxed">
                        {activeItem.practical_examples}
                      </p>
                    </div>
                  )}

                  {/* Attached PDF Documents */}
                  {activeItem.documents && activeItem.documents.length > 0 && (
                    <div className="border-t border-gray-200 pt-6 space-y-3">
                      <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                        <FileText size={16} className="text-accent" /> Csatolt Dokumentumok és Segédletek
                      </h4>
                      <div className="space-y-2">
                        {activeItem.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-gray-300 transition-all"
                          >
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-gray-900 block">{doc.name}</span>
                              {doc.description && <p className="text-[11px] text-gray-500">{doc.description}</p>}
                            </div>
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 bg-primary hover:bg-primary-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
                            >
                              <Download size={13} /> Megtekintés / Letöltés
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Metadata & Quick Info */}
                <div className="space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 text-xs">
                    <h5 className="font-extrabold text-gray-900 border-b border-gray-200 pb-2">Információk</h5>
                    <div className="space-y-2 text-gray-600">
                      <div>
                        <span className="text-gray-400 block text-[10px]">SZERZŐ / FORRÁS</span>
                        <span className="font-bold text-gray-800">{activeItem.author}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">CÉLKÖZÖNSÉG</span>
                        <span className="font-bold text-gray-800 uppercase">
                          {activeItem.target_audience === 'students' ? 'Tanulók' : activeItem.target_audience === 'professionals' ? 'Szakemberek' : 'Mindenki'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">NEHÉZSÉG</span>
                        <span className="font-bold text-gray-800 capitalize">{activeItem.difficulty_level}</span>
                      </div>
                    </div>
                  </div>

                  {activeItem.keywords && activeItem.keywords.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-extrabold text-xs text-gray-700 flex items-center gap-1">
                        <Tag size={13} /> Kulcsszavak:
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {activeItem.keywords.map((kw) => (
                          <span key={kw} className="px-2 py-1 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-md">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 sm:px-8 rounded-b-3xl flex items-center justify-between">
              <button
                onClick={() => setActiveItem(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Bezárás
              </button>
              <span className="text-[11px] text-gray-400">ÉpítőTudás Oktatási Tudásbázis v2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
