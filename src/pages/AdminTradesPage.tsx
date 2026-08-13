import { useState } from 'react';
import {
  Briefcase,
  Search,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  Hammer,
  Layers,
  Wrench,
  BookOpen,
} from 'lucide-react';
import {
  useTrades,
  saveTradeItems,
  DEFAULT_TRADE_ITEMS,
  type TradeItem,
} from '../services/tradeService';

export default function AdminTradesPage() {
  const trades = useTrades();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [overview, setOverview] = useState('');
  const [tasksText, setTasksText] = useState('');
  const [prosText, setProsText] = useState('');
  const [consText, setConsText] = useState('');
  const [workplacesText, setWorkplacesText] = useState('');
  const [careerPathText, setCareerPathText] = useState('');

  const filteredTrades = trades.filter((t) => {
    return (
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tagline.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleToggleActive = (id: string) => {
    const updated = trades.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t));
    saveTradeItems(updated);
    triggerSuccessNotify();
  };

  const handleOpenEditModal = (trade: TradeItem) => {
    setEditingTrade(trade);
    setName(trade.name);
    setTagline(trade.tagline);
    setCategoryLabel(trade.categoryLabel);
    setOverview(trade.overview);
    setTasksText(trade.whatDoesDo?.tasks ? trade.whatDoesDo.tasks.join('\n') : '');
    setProsText(trade.pros ? trade.pros.join('\n') : '');
    setConsText(trade.cons ? trade.cons.join('\n') : '');
    setWorkplacesText(trade.workplaces ? trade.workplaces.join('\n') : '');
    setCareerPathText(trade.careerPath ? trade.careerPath.join('\n') : '');
    setShowModal(true);
  };

  const handleSaveTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrade || !name.trim()) return;

    const updated = trades.map((t) =>
      t.id === editingTrade.id
        ? {
            ...t,
            name: name.trim(),
            tagline: tagline.trim(),
            categoryLabel: categoryLabel.trim(),
            overview: overview.trim(),
            whatDoesDo: {
              ...t.whatDoesDo,
              tasks: tasksText.split('\n').map((s) => s.trim()).filter(Boolean),
            },
            pros: prosText.split('\n').map((s) => s.trim()).filter(Boolean),
            cons: consText.split('\n').map((s) => s.trim()).filter(Boolean),
            workplaces: workplacesText.split('\n').map((s) => s.trim()).filter(Boolean),
            careerPath: careerPathText.split('\n').map((s) => s.trim()).filter(Boolean),
          }
        : t
    );

    saveTradeItems(updated);
    setShowModal(false);
    triggerSuccessNotify();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Biztosan visszaállítod a szakmai útmutatókat az alapértelmezett értékekre?')) {
      saveTradeItems(DEFAULT_TRADE_ITEMS);
      triggerSuccessNotify();
    }
  };

  const triggerSuccessNotify = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-[#111] min-h-screen text-gray-200 p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Briefcase className="text-accent" size={32} />
            Szakmák &amp; Karrierutak Kezelő
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Az ÉpítőTudás 8 fő építőipari szakmájának leírásai, feladatkörei, fizetései és karrierútjai.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-4 py-2.5 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RotateCcw size={14} /> Alapértelmezett Visszaállítása
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl flex items-center gap-3 animate-fade-in text-sm font-bold">
          <CheckCircle2 size={20} />
          A szakmai útmutatók módosításai sikeresen elmentve és alkalmazva a platformon!
        </div>
      )}

      {/* Filter */}
      <div className="bg-[#111111] border border-[#1E1E1E] p-4 rounded-2xl max-w-md relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Keresés szakma név vagy leírás alapján..."
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTrades.map((trade) => (
          <div
            key={trade.id}
            className={`bg-[#111111] border rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all ${
              trade.isActive !== false ? 'border-[#1E1E1E] hover:border-accent/40' : 'border-red-900/40 opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-accent/10 border border-accent/30 text-accent font-bold text-[10px] rounded-full">
                  {trade.categoryLabel}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleActive(trade.id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    trade.isActive !== false
                      ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  title={trade.isActive !== false ? 'Aktív (Kattints az elrejtéshez)' : 'Inaktív (Kattints a megjelenítéshez)'}
                >
                  {trade.isActive !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>

              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Hammer size={18} className="text-accent" />
                {trade.name}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-2">{trade.tagline}</p>
              <p className="text-xs text-gray-500 line-clamp-3">{trade.overview}</p>
            </div>

            <div className="pt-3 border-t border-[#222] flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-mono">
                {trade.whatDoesDo?.tasks?.length || 0} db feladat
              </span>
              <button
                type="button"
                onClick={() => handleOpenEditModal(trade)}
                className="px-3.5 py-1.5 bg-[#222] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 size={13} /> Szerkesztés
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showModal && editingTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#222] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto admin-scroll text-xs">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Briefcase size={18} className="text-accent" />
                Szakmai Útmutató Szerkesztése ({editingTrade.name})
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 bg-[#1A1A1A] rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrade} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Szakma Neve *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Kategória Címke</label>
                  <input
                    type="text"
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-300 block mb-1">Szlogen / Rövid Jelmondat</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-300 block mb-1">Szakma Részletes Áttekintése</label>
                  <textarea
                    rows={4}
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-300 block mb-1">Mit Csinál? (Fő Feladatok - Soronként 1 elem)</label>
                  <textarea
                    rows={4}
                    value={tasksText}
                    onChange={(e) => setTasksText(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Szakma Előnyei (Soronként 1 elem)</label>
                  <textarea
                    rows={3}
                    value={prosText}
                    onChange={(e) => setProsText(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Szakma Hátrányai (Soronként 1 elem)</label>
                  <textarea
                    rows={3}
                    value={consText}
                    onChange={(e) => setConsText(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent font-mono text-[11px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-300 block mb-1">Tipikus Munkaterületek &amp; Munkáltatók (Soronként 1 elem)</label>
                  <textarea
                    rows={3}
                    value={workplacesText}
                    onChange={(e) => setWorkplacesText(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent font-mono text-[11px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-300 block mb-1">Karrierút &amp; Továbbfejlődési Lehetőségek (Soronként 1 elem)</label>
                  <textarea
                    rows={3}
                    value={careerPathText}
                    onChange={(e) => setCareerPathText(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold rounded-xl transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-black font-extrabold rounded-xl transition-all shadow-lg"
                >
                  Módosítások Mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
