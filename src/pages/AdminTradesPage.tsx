import { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  Hammer,
} from 'lucide-react';
import {
  useTrades,
  saveTradeItems,
  DEFAULT_TRADE_ITEMS,
  type TradeItem,
} from '../services/tradeService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

interface AdminTradesPageProps {
  initialSearchQuery?: string;
}

export default function AdminTradesPage({ initialSearchQuery }: AdminTradesPageProps = {}) {
  const trades = useTrades();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
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

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const filteredTrades = trades.filter((t) => {
    return (
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tagline.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  useEffect(() => {
    if (searchQuery && filteredTrades.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`admin-trade-${filteredTrades[0].id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-amber-400', 'transition-all');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-amber-400');
          }, 2500);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredTrades]);

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
    setTasksText((trade.whatDoesDo?.tasks || []).join('\n'));
    setProsText((trade.pros || []).join('\n'));
    setConsText((trade.cons || []).join('\n'));
    setWorkplacesText((trade.workplaces || []).join('\n'));
    setCareerPathText((trade.careerPath || []).join('\n'));
    setShowModal(true);
  };

  const handleSaveTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrade) return;

    const parseLines = (text: string) =>
      text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    const updated: TradeItem[] = trades.map((t) => {
      if (t.id !== editingTrade.id) return t;
      return {
        ...t,
        name: name.trim(),
        tagline: tagline.trim(),
        categoryLabel: categoryLabel.trim(),
        overview: overview.trim(),
        whatDoesDo: {
          ...t.whatDoesDo,
          tasks: parseLines(tasksText),
        },
        pros: parseLines(prosText),
        cons: parseLines(consText),
        workplaces: parseLines(workplacesText),
        careerPath: parseLines(careerPathText),
      };
    });

    saveTradeItems(updated);
    setShowModal(false);
    triggerSuccessNotify();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Biztosan visszaállítod az összes szakma leírást az alapértelmezettre?')) {
      saveTradeItems(DEFAULT_TRADE_ITEMS);
      triggerSuccessNotify();
    }
  };

  const triggerSuccessNotify = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen" style={{ color: textColor }}>
      {/* Header */}
      <div style={{ borderColor: cardBorder }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-black flex items-center gap-2.5">
            <Briefcase style={{ color: cardHighlight }} size={28} /> Építőipari Szakmák Áttekintése &amp; Szerkesztése
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Testreszabhatod a szakmai karrierutak leírásait, feladatait, előnyeit és elhelyezkedési lehetőségeit.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
          className="px-4 py-2.5 border font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shrink-0"
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
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border p-4 rounded-2xl max-w-md relative shadow-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Keresés szakma név vagy leírás alapján..."
          style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
          className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs placeholder-gray-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTrades.map((trade) => (
          <div
            key={trade.id}
            id={`admin-trade-${trade.id}`}
            style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            className={`border rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all ${
              trade.isActive !== false ? '' : 'opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }} className="px-2.5 py-1 border font-bold text-[10px] rounded-full">
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

              <h3 style={{ color: textColor }} className="text-lg font-extrabold flex items-center gap-2">
                <Hammer size={18} style={{ color: cardHighlight }} />
                {trade.name}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-2">{trade.tagline}</p>
              <p className="text-xs text-gray-500 line-clamp-3">{trade.overview}</p>
            </div>

            <div style={{ borderColor: cardBorder }} className="pt-3 border-t flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-mono">
                {trade.whatDoesDo?.tasks?.length || 0} db feladat
              </span>
              <button
                type="button"
                onClick={() => handleOpenEditModal(trade)}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-3.5 py-1.5 border text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer hover:opacity-90"
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
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto admin-scroll text-xs">
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-3">
              <h3 style={{ color: textColor }} className="text-base font-extrabold flex items-center gap-2">
                <Briefcase size={18} style={{ color: cardHighlight }} />
                Szakmai Útmutató Szerkesztése ({editingTrade.name})
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: inputBg, color: textColor }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer hover:opacity-90"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTrade} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Szakma Neve *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Kategória Címke</label>
                  <input
                    type="text"
                    value={categoryLabel}
                    onChange={(e) => setCategoryLabel(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Szlogen / Rövid Jelmondat</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Szakma Részletes Áttekintése</label>
                  <textarea
                    rows={4}
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl p-3 leading-relaxed focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Mit Csinál? (Fő Feladatok - Soronként 1 elem)</label>
                  <textarea
                    rows={4}
                    value={tasksText}
                    onChange={(e) => setTasksText(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl p-3 font-mono text-[11px] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Szakma Előnyei (Soronként 1 elem)</label>
                  <textarea
                    rows={3}
                    value={prosText}
                    onChange={(e) => setProsText(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl p-3 font-mono text-[11px] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Szakma Hátrányai (Soronként 1 elem)</label>
                  <textarea
                    rows={3}
                    value={consText}
                    onChange={(e) => setConsText(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl p-3 font-mono text-[11px] focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Tipikus Munkaterületek &amp; Munkáltatók (Soronként 1 elem)</label>
                  <textarea
                    rows={3}
                    value={workplacesText}
                    onChange={(e) => setWorkplacesText(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl p-3 font-mono text-[11px] focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Karrierút &amp; Továbbfejlődési Lehetőségek (Soronként 1 elem)</label>
                  <textarea
                    rows={3}
                    value={careerPathText}
                    onChange={(e) => setCareerPathText(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl p-3 font-mono text-[11px] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div style={{ borderColor: cardBorder }} className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border font-bold rounded-xl transition-colors cursor-pointer hover:opacity-90"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2 font-extrabold rounded-xl transition-all shadow-lg cursor-pointer hover:opacity-90"
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
