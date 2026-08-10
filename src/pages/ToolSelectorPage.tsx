import { useState, useMemo } from 'react';
import { Wrench, ChevronRight, Filter, Sparkles, ArrowRight, RefreshCw, Laptop } from 'lucide-react';
import { MOCK_TOOLS, type Tool } from '../services/toolService';
import SectionSubNav from '../components/SectionSubNav';

interface ToolSelectorPageProps {
  onNavigate: (page: string) => void;
}

const TRADES_LIST = [
  'Ács',
  'Zsaluzó ács',
  'Tetőfedő',
  'Kőműves',
  'Burkoló',
  'Villanyszerelő',
  'Épületgépész',
];

const CATEGORIES_LIST = [
  'Kéziszerszámok',
  'Elektromos kéziszerszámok',
  'Mérőműszerek',
  'Vágó- és csiszolóeszközök',
  'Munkavédelem',
];

export default function ToolSelectorPage({ onNavigate }: ToolSelectorPageProps) {
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredTools = useMemo(() => {
    return MOCK_TOOLS.filter((tool: Tool) => {
      if (selectedTrade !== 'all' && !(tool.professions || []).some((p: string) => p.toLowerCase().includes(selectedTrade.toLowerCase()))) {
        return false;
      }
      if (selectedType !== 'all' && tool.type !== selectedType) {
        return false;
      }
      return true;
    });
  }, [selectedTrade, selectedType]);

  const resetFilters = () => {
    setSelectedTrade('all');
    setSelectedType('all');
  };

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
            <button
              onClick={() => onNavigate('tool')}
              className="hover:text-white transition-colors"
            >
              Eszközök
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Eszközválasztó</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
              Interaktív Modul
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Interaktív Eszköz- és Gépválasztó
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
              Válaszd ki a szakmádat és a keresett eszköztípust, mi pedig pontosan ajánljuk a legmegfelelőbb építőipari gépeket és szerszámokat!
            </p>
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
            active: false,
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
            active: true,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Interactive Selector Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-accent/10 border border-accent/30 rounded-xl text-primary font-bold">
                <Filter size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Eszköz Szűrési Feltételek</h3>
                <p className="text-xs text-gray-500">Állítsd be a szempontokat a célzott gépajánláshoz</p>
              </div>
            </div>

            {(selectedTrade !== 'all' || selectedType !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={13} /> Szűrők alaphelyzetbe
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Szakma választó */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                1. Építőipari Szakma / Terület
              </label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">Minden szakma (Összes)</option>
                {TRADES_LIST.map((t: string) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Típus választó */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                2. Eszköz Típus
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">Minden típus (Összes)</option>
                {CATEGORIES_LIST.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-accent" /> Ajánlott Eszközök &amp; Gépek ({filteredTools.length})
          </h2>
          <span className="text-xs text-gray-500">
            Szűrés alapján megjelenítve
          </span>
        </div>

        {/* Results Grid */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-3">
            <Wrench size={40} className="mx-auto text-gray-300" />
            <p className="text-gray-500 text-sm font-medium">
              A kiválasztott szűrőkkel nem található gép vagy szerszám.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-colors"
            >
              Szűrők alaphelyzetbe állítása
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool: Tool) => (
              <div
                key={tool.id}
                className="bg-white border border-gray-200 hover:border-primary/40 hover:shadow-md rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    {tool.type && (
                      <span className="bg-primary/10 text-primary-900 border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">
                        {tool.type}
                      </span>
                    )}
                    {tool.brand && (
                      <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                        {tool.brand}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-gray-900 leading-snug">
                    {tool.name}
                  </h3>

                  {tool.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  )}

                  {tool.professions && tool.professions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {tool.professions.map((tr: string) => (
                        <span key={tr} className="text-[10px] bg-accent/10 border border-accent/20 text-black px-2 py-0.5 rounded-md font-semibold">
                          {tr}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold">
                  <button
                    onClick={() => onNavigate('tool')}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    Megtekintés a Katalógusban <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
