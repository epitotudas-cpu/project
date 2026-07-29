import { useState, useMemo } from 'react';
import { Search, Home, ChevronRight, BookOpen, AlertCircle, GraduationCap, Lock, Sparkles } from 'lucide-react';
import { useGlossary } from '../contexts/GlossaryContext';
import { useAuth } from '../contexts/AuthContext';
import { getTradeEducationalPathways } from '../services/glossaryService';
import type { GlossaryTermFromJson } from '../lib/glossaryJsonService';
import AuthPromptModal from '../components/AuthPromptModal';
import TermDetailModal from '../components/TermDetailModal';

interface GlossaryPageProps {
  onNavigate: (page: string) => void;
}

export default function GlossaryPage({ onNavigate }: GlossaryPageProps) {
  const { user } = useAuth();
  const glossary = useGlossary();
  const [activeTab, setActiveTab] = useState<'technical' | 'industry'>('technical');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);

  // Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTermFromJson | null>(null);

  const handleTermClick = (item: GlossaryTermFromJson) => {
    setSelectedTerm(item);
    if (user) {
      setDetailModalOpen(true);
    } else {
      setAuthModalOpen(true);
    }
  };

  const tabTerms = useMemo(() => {
    if (activeTab === 'industry') {
      return glossary.terms.filter((t) => t.entry_type === 'industry_term');
    }
    return glossary.terms.filter((t) => t.entry_type !== 'industry_term');
  }, [glossary.terms, activeTab]);

  const pathways = useMemo(() => {
    if (!selectedTrade) return [];
    return getTradeEducationalPathways(selectedTrade);
  }, [selectedTrade]);

  const letters = useMemo(() => {
    const lettersSet = new Set<string>();
    tabTerms.forEach((term) => {
      const firstLetter = term.term.charAt(0).toUpperCase();
      if (firstLetter) {
        lettersSet.add(firstLetter);
      }
    });
    return Array.from(lettersSet).sort((a, b) => a.localeCompare(b, 'hu'));
  }, [tabTerms]);

  function handleTabChange(tab: 'technical' | 'industry') {
    setActiveTab(tab);
    setSelectedLetter(null);
    setSelectedCategory(null);
    setSearchQuery('');
  }

  const filteredTerms = useMemo(() => {
    let result = tabTerms;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (term) =>
          term.term.toLowerCase().includes(query) ||
          term.definition.toLowerCase().includes(query) ||
          (term.official_term_name ?? '').toLowerCase().includes(query) ||
          (term.usage_example ?? '').toLowerCase().includes(query)
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((term) => term.category === selectedCategory);
    }

    if (selectedLetter) {
      result = result.filter((term) => term.term.charAt(0).toUpperCase() === selectedLetter);
    }

    return result.sort((a, b) => a.term.localeCompare(b.term, 'hu'));
  }, [tabTerms, selectedLetter, selectedCategory, searchQuery]);

  // Find linked official term if user is searching for jargon
  const linkedOfficialTerm = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const matchedJargon = glossary.terms.find(
      (t) => t.entry_type === 'industry_term' && t.term.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (!matchedJargon) return null;
    if (matchedJargon.official_term_name) {
      return glossary.terms.find((t) => t.term.toLowerCase() === matchedJargon.official_term_name?.toLowerCase()) || null;
    }
    return null;
  }, [glossary.terms, searchQuery]);

  if (glossary.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
          <p className="mt-4 text-gray-500 text-sm">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (glossary.terms.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Nincs fogalom</h2>
          <p className="text-gray-600 text-sm">Az adatbázisban még nincsenek fogalmak. Kérlek az Admin Panelen adjon meg új fogalmakat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-primary border-b border-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-white">
              <Home size={13} /> Főoldal
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-300 font-medium">Tudásbázis & Szótár</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
                <BookOpen size={28} className="text-accent" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Építőipari Szakmai Fogalomtár & Nyelvi Szótár</h1>
                <p className="text-gray-400 text-sm mt-1">Egységes műszaki tudásgráf, szakági fogalmak és építkezési zsargon</p>
              </div>
            </div>

            {/* Type Switcher Tabs */}
            <div className="flex items-center gap-2 bg-[#161616] p-1.5 rounded-2xl border border-[#2A2A2A]">
              <button
                onClick={() => handleTabChange('technical')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'technical'
                    ? 'bg-accent text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📘 Szakmai Fogalomtár
              </button>
              <button
                onClick={() => handleTabChange('industry')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'industry'
                    ? 'bg-accent text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🗣 Nyelvi Szótár (Zsargon)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search */}
        <div>
          <div className="relative max-w-2xl">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'technical' ? 'Keress műszaki fogalmat (pl. Beton, Vasbeton)...' : 'Keress építkezési szleng szóra (pl. Malter, Stafni, Trepedli)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-accent rounded-xl pl-11 pr-4 py-3.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm font-medium"
            />
          </div>
        </div>

        {/* Connected Search Bridge Card */}
        {linkedOfficialTerm && (
          <div className="p-5 bg-accent/10 border border-accent/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-accent uppercase tracking-wider mb-1">
                🗣 Összekapcsolt Szakmai Találat
              </div>
              <h4 className="text-base font-bold text-gray-900">
                A szleng keresésedhez kapcsolódó hivatalos műszaki fogalom: <strong className="text-accent underline">{linkedOfficialTerm.term}</strong>
              </h4>
              <p className="text-xs text-gray-600 mt-1">{linkedOfficialTerm.definition}</p>
            </div>
            <button
              onClick={() => {
                handleTabChange('technical');
                setSearchQuery(linkedOfficialTerm.term);
              }}
              className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl hover:bg-accent-hover self-start md:self-auto transition-colors"
            >
              Ugrás a Szakmai Fogalomhoz ➔
            </button>
          </div>
        )}

        {/* Educational Pathway Widget */}
        <div className="p-5 bg-gradient-to-r from-primary-900 to-primary border border-primary-700 rounded-2xl text-white space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-accent/20 rounded-lg text-accent">
                <GraduationCap size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Szakmai Tanulási Útvonalak (Pathways)</h3>
                <p className="text-xs text-gray-400">Válassz szakmát a fokozatos fogalmi haladási útvonal megtekintéséhez</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {['Kőműves', 'Ács', 'Burkoló'].map((tr) => (
                <button
                  key={tr}
                  onClick={() => setSelectedTrade(selectedTrade === tr ? null : tr)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedTrade === tr
                      ? 'bg-accent text-black'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {tr} útvonal
                </button>
              ))}
            </div>
          </div>

          {selectedTrade && pathways.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/10">
              {pathways.map((step, idx) => (
                <div key={idx} className="bg-black/30 border border-white/10 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-accent">{step.level} szint</span>
                    <span className="text-gray-400">{step.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{step.title}</h4>
                  <p className="text-xs text-gray-300 leading-relaxed">{step.description}</p>
                  <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
                    {step.termNames.map((tName) => (
                      <button
                        key={tName}
                        onClick={() => setSearchQuery(tName)}
                        className="text-[10px] bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded hover:bg-accent/20"
                      >
                        {tName}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        {glossary.categories.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Szűrés témakör / szakág szerint:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedLetter(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all ${
                  selectedCategory === null && !searchQuery
                    ? 'bg-accent text-black font-bold'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-accent/40'
                }`}
              >
                Összes témakör
              </button>
              {glossary.categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedLetter(null);
                    setSearchQuery('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all ${
                    selectedCategory === category
                      ? 'bg-accent text-black font-bold'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-accent/40'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Letter Filter */}
        {!selectedCategory && !searchQuery && letters.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Szűrés kezdőbetű szerint:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLetter(null)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  selectedLetter === null
                    ? 'bg-accent text-black font-bold'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-accent/40'
                }`}
              >
                Összes
              </button>
              {letters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                    selectedLetter === letter
                      ? 'bg-accent text-black font-bold'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-accent/40'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {filteredTerms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 text-sm">Nincs találat a kiválasztott szűrőknek megfelelően.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTerms.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-accent/40 transition-all shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">{item.term}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
                        item.entry_type === 'industry_term'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-700'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-700'
                      }`}>
                        {item.entry_type === 'industry_term' ? '🗣 Nyelvi Szótár / Zsargon' : '📘 Szakmai Fogalom'}
                      </span>
                      {item.entry_type === 'industry_term' && (item.jargon_subtype === 'brand_name' || (item.origin_note && item.origin_note.includes('Márkanév'))) && (
                        <span className="text-xs bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded border border-purple-200">
                          🏷️ Márkanévből lett köznév
                        </span>
                      )}
                      {item.entry_type === 'industry_term' && (item.jargon_subtype === 'german_origin' || (item.origin_note && item.origin_note.includes('Német'))) && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                          🏷️ Német mesterszó
                        </span>
                      )}
                      {item.entry_type === 'industry_term' && (item.jargon_subtype === 'workplace_slang' || (item.origin_note && item.origin_note.includes('Munkanyelvi'))) && (
                        <span className="text-xs bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded border border-orange-200">
                          🏷️ Munkanyelvi szleng
                        </span>
                      )}
                      {item.entry_type === 'industry_term' && item.jargon_subtype === 'synonym' && (
                        <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                          🏷️ Műszaki szinonima
                        </span>
                      )}
                      {item.category && (
                        <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded">
                          {item.category}
                        </span>
                      )}
                      {item.szint && (
                        <span className="text-xs bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded">
                          {item.szint}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed">{item.definition}</p>
                  </div>
                </div>

                {/* Industry Term Specific Details */}
                {item.entry_type === 'industry_term' && (
                  <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2 text-xs">
                    {item.official_term_name && (
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="text-amber-700">Hivatalos Megfelelő:</span>
                        <button
                          onClick={() => {
                            setActiveTab('technical');
                            setSearchQuery(item.official_term_name || '');
                          }}
                          className="text-accent underline font-bold hover:text-accent-hover"
                        >
                          ➡ {item.official_term_name}
                        </button>
                      </div>
                    )}
                    {item.usage_example && (
                      <div className="text-gray-700 italic">
                        <strong>Használat:</strong> "{item.usage_example}"
                      </div>
                    )}
                    {item.origin_note && (
                      <div className="text-gray-500">
                        <strong>Eredet:</strong> {item.origin_note}
                      </div>
                    )}
                  </div>
                )}

                {/* Multilingual Translation Card */}
                {item.translations && (Object.keys(item.translations).length > 0) && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1 text-xs">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                      <span>🌐 Idegen Nyelvi Szakszótár:</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-gray-700">
                      {item.translations.en && (
                        <div>
                          <strong className="text-gray-900">🇬🇧 EN:</strong> {item.translations.en}
                        </div>
                      )}
                      {item.translations.de && (
                        <div>
                          <strong className="text-gray-900">🇩🇪 DE:</strong> {item.translations.de}
                        </div>
                      )}
                      {item.translations.ro && (
                        <div>
                          <strong className="text-gray-900">🇷🇴 RO:</strong> {item.translations.ro}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Technical Concept Specific Details */}
                {item.entry_type !== 'industry_term' && item.detailed_description && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-gray-900">Részletes Műszaki Információk</div>
                    <p className="text-gray-700 leading-relaxed">{item.detailed_description}</p>
                    {item.practical_applications && (
                      <div className="text-gray-700 pt-1">
                        <strong className="text-gray-900">Alkalmazás:</strong> {item.practical_applications}
                      </div>
                    )}
                    {item.common_mistakes && (
                      <div className="text-red-600 pt-1">
                        <strong>Gyakori kivitelezési hibák:</strong> {item.common_mistakes}
                      </div>
                    )}
                  </div>
                )}

                {/* Keywords & Related Terms */}
                {item.kapcsolodofogalmak && item.kapcsolodofogalmak.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-700">Kapcsolódó kifejezések:</span>
                    {item.kapcsolodofogalmak.map((relTerm) => (
                      <button
                        key={relTerm}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchQuery(relTerm);
                        }}
                        className="bg-accent/10 border border-accent/20 text-accent font-medium px-2 py-0.5 rounded hover:bg-accent/20 transition-colors"
                      >
                        {relTerm}
                      </button>
                    ))}
                  </div>
                )}

                {/* Premium Detailed View CTA Bar */}
                <div
                  onClick={() => handleTermClick(item)}
                  className="pt-3 border-t border-gray-100 flex items-center justify-between cursor-pointer group"
                >
                  {user ? (
                    <span className="text-xs font-extrabold text-accent flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      <Sparkles size={14} /> Részletes Adatlap, Slide-ok & Média Megtekintése ➔
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      <Lock size={14} /> Részletes Adatlap, Videók & Slide-ok Feloldása (Regisztrációhoz kötött) ➔
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-medium group-hover:text-gray-900 transition-colors">
                    Részletek ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={onNavigate}
        termTitle={selectedTerm?.term}
      />

      <TermDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        term={selectedTerm}
      />
    </div>
  );
}

