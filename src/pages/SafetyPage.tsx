import { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
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
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import {
  getKnowledgeItemsLocal,
  fetchKnowledgeItemsFromCloud,
  type EducationalContentItem,
} from '../services/knowledgeHubService';

interface SafetyPageProps {
  onNavigate: (page: string) => void;
}

export default function SafetyPage({ onNavigate }: SafetyPageProps) {
  const [items, setItems] = useState<EducationalContentItem[]>(() =>
    getKnowledgeItemsLocal().filter((i) => i.hub_type === 'safety' && i.status === 'published')
  );
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<'all' | 'students' | 'professionals'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<EducationalContentItem | null>(null);

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

  // Unique topics list
  const availableTopics = useMemo(() => {
    const topics = new Set<string>();
    items.forEach((i) => {
      if (i.topic) topics.add(i.topic);
    });
    return Array.from(topics);
  }, [items]);

  // Filtered items list
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
                <ShieldAlert size={14} /> Munkavédelmi Oktatási Tudásbázis
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Építőipari Munkavédelem &amp; Balesetmegelőzés
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Strukturált szakmai tudásbázis tanulóknak és szakembereknek egyaránt. Egyéni védőeszközök, magasban végzett munka, gépbiztonság és munkaterületi előírások.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs bg-white/10 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl backdrop-blur-sm">
                Publikált tananyagok: <strong className="text-accent">{items.length}</strong>
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
          { label: 'Fogalomtár', page: 'glossary', icon: <BookOpen size={14} className="text-accent" />, active: false },
          { label: 'Számítások', page: 'calculations', icon: <FileText size={14} className="text-accent" />, active: false },
          { label: 'Szakmai könyvek', page: 'books', icon: <BookOpen size={14} className="text-accent" />, active: false },
          { label: 'Munkavédelem', page: 'safety', icon: <ShieldAlert size={14} className="text-accent" />, active: true },
          { label: 'Szabályok, szabványok', page: 'standards', icon: <ShieldCheck size={14} className="text-accent" />, active: false },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl w-full lg:w-auto shrink-0">
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
                    className={`flex-1 lg:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      active ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <IconComp size={14} className={active ? 'text-accent' : 'text-gray-500'} />
                    <span>{tab.label}</span>
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

        {/* Content Cards Grid */}
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
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-gray-500 font-medium">
                    {item.documents && item.documents.length > 0 && (
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <FileText size={13} /> {item.documents.length} PDF
                      </span>
                    )}
                    {item.standard_code && (
                      <span className="font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        {item.standard_code.split('/')[0]}
                      </span>
                    )}
                  </div>

                  <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
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

      {/* ── DETAILED ARTICLE MODAL / DRAWER WITH TABLE OF CONTENTS ── */}
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
