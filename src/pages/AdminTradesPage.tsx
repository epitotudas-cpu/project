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
  Plus,
  Trash2,
  History,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  useTrades,
  saveTradeItems,
  DEFAULT_TRADE_ITEMS,
  type TradeItem,
} from '../services/tradeService';
import { type TimelineStation, type FutureTechCard } from '../data/tradeDetailsData';
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
  const [modalTab, setModalTab] = useState<'basic' | 'timeline' | 'futureTech'>('basic');

  // Form State - Basic
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [overview, setOverview] = useState('');
  const [tasksText, setTasksText] = useState('');
  const [prosText, setProsText] = useState('');
  const [consText, setConsText] = useState('');
  const [workplacesText, setWorkplacesText] = useState('');
  const [careerPathText, setCareerPathText] = useState('');

  // Form State - Timeline
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineSubtitle, setTimelineSubtitle] = useState('');
  const [timelineImage, setTimelineImage] = useState('');
  const [timelineImageAlt, setTimelineImageAlt] = useState('');
  const [timelineStations, setTimelineStations] = useState<TimelineStation[]>([]);

  // Form State - Future Tech
  const [futureTechTitle, setFutureTechTitle] = useState('');
  const [futureTechSubtitle, setFutureTechSubtitle] = useState('');
  const [futureTechCards, setFutureTechCards] = useState<FutureTechCard[]>([]);
  const [futureTechClosure, setFutureTechClosure] = useState('');

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

  const handleOpenCreateModal = () => {
    setEditingTrade(null);
    setModalTab('basic');
    setName('');
    setTagline('');
    setCategoryLabel('Építőipari Szakma');
    setOverview('');
    setTasksText('');
    setProsText('');
    setConsText('');
    setWorkplacesText('');
    setCareerPathText('');

    // Default timeline templates for new trade
    setTimelineTitle('Honnan indult és merre tart a szakma?');
    setTimelineSubtitle('A kézi alapoktól a modern gépesített és robotizált technológiákig');
    setTimelineImage('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80');
    setTimelineImageAlt('Szakmai fejlődés illusztráció');
    setTimelineStations([
      { id: `st-${Date.now()}-1`, badge: 'RÉGEN', title: 'Hagyományos kézi munkamódszerek', period: '19-20. század', description: 'Kézi szerszámok és nehéz fizikai igénybevétel.' },
      { id: `st-${Date.now()}-2`, badge: 'MA', title: 'Gépesített és lézeres szintezés', period: 'Napjainkban', description: 'Korszerű teljesítménygépek és precíziós szerszámok.' },
      { id: `st-${Date.now()}-3`, badge: 'JÖVŐ', title: 'Robotizált és 3D nyomtatású rendszerek', period: 'Közeli jövő', description: 'Automatizált kivitelezés és BIM modell alapú építés.' },
      { id: `st-${Date.now()}-4`, badge: 'TE', title: 'Digitális felkészültségű szakember', period: 'Holnap', description: 'A csúcstechnológiát magabiztosan kezelő mester.' },
    ]);

    // Default future tech templates for new trade
    setFutureTechTitle('Merre tart a szakma?');
    setFutureTechSubtitle('Innovatív gépek, digitális támogatás és új generációs anyagok');
    setFutureTechCards([
      { id: `ft-${Date.now()}-1`, title: 'Automatizált Építőipari Robotika', category: 'MÁR LÉTEZŐ', description: 'Automatizált szerkezetépítő berendezések és gépsorok.', sourceName: 'Construction Tech', sourceUrl: 'https://example.com', sourceDate: '2025' },
      { id: `ft-${Date.now()}-2`, title: 'Kiterjesztett Valóság (AR) Munkaszemüvegek', category: 'FEJLŐDŐ', description: 'Helyszíni virtuális tervrajz kivetítés AR szemüvegen keresztül.', sourceName: 'BIM World', sourceUrl: 'https://example.com', sourceDate: '2025' },
    ]);
    setFutureTechClosure('A szakma a fizikai terhelésből a csúcstechnológiás digitális kivitelezés mesterségévé fejlődik.');

    setShowModal(true);
  };

  const handleOpenEditModal = (trade: TradeItem) => {
    setEditingTrade(trade);
    setModalTab('basic');
    setName(trade.name);
    setTagline(trade.tagline);
    setCategoryLabel(trade.categoryLabel);
    setOverview(trade.overview);
    setTasksText((trade.whatDoesDo?.tasks || []).join('\n'));
    setProsText((trade.pros || []).join('\n'));
    setConsText((trade.cons || []).join('\n'));
    setWorkplacesText((trade.workplaces || []).join('\n'));
    setCareerPathText((trade.careerPath || []).join('\n'));

    // Timeline state
    setTimelineTitle(trade.timelineTitle || 'Honnan indult és merre tart a szakma?');
    setTimelineSubtitle(trade.timelineSubtitle || '');
    setTimelineImage(trade.timelineImage || '');
    setTimelineImageAlt(trade.timelineImageAlt || '');
    setTimelineStations(trade.timelineStations ? JSON.parse(JSON.stringify(trade.timelineStations)) : []);

    // Future tech state
    setFutureTechTitle(trade.futureTechTitle || 'Merre tart a szakma?');
    setFutureTechSubtitle(trade.futureTechSubtitle || '');
    setFutureTechCards(trade.futureTechCards ? JSON.parse(JSON.stringify(trade.futureTechCards)) : []);
    setFutureTechClosure(trade.futureTechClosure || '');

    setShowModal(true);
  };

  const handleDeleteTrade = (id: string, tradeName: string) => {
    if (window.confirm(`Biztosan törölni szeretnéd a(z) "${tradeName}" szakmai karrierútvonalat?`)) {
      const updated = trades.filter((t) => t.id !== id);
      saveTradeItems(updated);
      triggerSuccessNotify();
    }
  };

  const handleSaveTrade = (e: React.FormEvent) => {
    e.preventDefault();

    const parseLines = (text: string) =>
      text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    let updated: TradeItem[];
    if (editingTrade) {
      updated = trades.map((t) => {
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
          timelineTitle: timelineTitle.trim(),
          timelineSubtitle: timelineSubtitle.trim(),
          timelineImage: timelineImage.trim(),
          timelineImageAlt: timelineImageAlt.trim(),
          timelineStations,
          futureTechTitle: futureTechTitle.trim(),
          futureTechSubtitle: futureTechSubtitle.trim(),
          futureTechCards,
          futureTechClosure: futureTechClosure.trim(),
        };
      });
    } else {
      const newTrade: TradeItem = {
        id: `trade-${Date.now()}`,
        name: name.trim() || 'Új Szakmai Útvonal',
        iconName: 'Hammer',
        tagline: tagline.trim() || 'Szakmai leírás',
        categoryLabel: categoryLabel.trim() || 'Szakma',
        overview: overview.trim() || '',
        whatDoesDo: {
          tasks: parseLines(tasksText),
          buildings: ['Lakóépületek', 'Ipari létesítmények'],
          workflows: ['Előkészítés', 'Kivitelezés', 'Minőségellenőrzés'],
          soloWork: 'Önálló munkavégzés lehetséges',
          teamWork: 'Csapatmunkában is végezhető',
        },
        toolsAndMaterials: [],
        knowledgeToLearn: {
          theory: ['Szakmai alapismeretek', 'Anyagismeret'],
          practice: ['Gyakorlati fogások', 'Szerszámhasználat'],
          safety: ['Munkavédelmi szabályok', 'Védőfelszerelések'],
        },
        trainingOverview: ['Alapszintű elmélet', 'Gyakorlati képzés', 'Szakmai vizsga'],
        difficulty: {
          physical: 'Közepes fizikai terhelés',
          mental: 'Közepes szellemi kihívás',
          precision: 'Magas precizitást igényel',
        },
        suitableAttributes: ['Precíz munkavégzés', 'Kézügyesség'],
        unsuitableAttributes: ['Fizikai munka kerülése'],
        workConditions: {
          location: 'Építési munkaterület',
          weatherExposure: 'Változó környezet',
          noiseAndDust: 'Közepes terhelés',
          heightAndPhysical: 'Közepes igénybevétel',
        },
        pros: parseLines(prosText),
        cons: parseLines(consText),
        workplaces: parseLines(workplacesText),
        careerPath: parseLines(careerPathText),
        entrepreneurship: {
          possible: true,
          services: ['Szakmai kivitelezés', 'Karbantartás'],
          clients: ['Magánmegrendelők', 'Cégek'],
          prosAndCons: 'Jó piaci kereslet, felelősségteljes vállalkozói munka',
        },
        summaryChecklist: {
          goodFitIf: ['Szeretsz alkotni', 'Jó a kézügyességed'],
          considerOtherIf: ['Nem szereted a fizikai munkát'],
        },
        isActive: true,
        displayOrder: trades.length + 1,
        timelineTitle: timelineTitle.trim(),
        timelineSubtitle: timelineSubtitle.trim(),
        timelineImage: timelineImage.trim(),
        timelineImageAlt: timelineImageAlt.trim(),
        timelineStations,
        futureTechTitle: futureTechTitle.trim(),
        futureTechSubtitle: futureTechSubtitle.trim(),
        futureTechCards,
        futureTechClosure: futureTechClosure.trim(),
      };
      updated = [newTrade, ...trades];
    }

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

  // Timeline station helpers
  const handleAddTimelineStation = () => {
    setTimelineStations((prev) => [
      ...prev,
      {
        id: `station-${Date.now()}`,
        badge: 'ÚJ MÉRRFÖLDNÖK',
        title: 'Új állomás megnevezése',
        period: 'Időszak',
        description: 'Állomás részletes leírása...',
      },
    ]);
  };

  const handleUpdateTimelineStation = (index: number, field: keyof TimelineStation, val: any) => {
    setTimelineStations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveTimelineStation = (index: number) => {
    setTimelineStations((prev) => prev.filter((_, i) => i !== index));
  };

  // Future tech card helpers
  const handleAddFutureTechCard = () => {
    setFutureTechCards((prev) => [
      ...prev,
      {
        id: `tech-${Date.now()}`,
        title: 'Új Technológiai Innováció',
        category: 'FEJLŐDŐ',
        description: 'Innováció rövid leírása...',
        sourceName: 'Építőipari Hírek',
        sourceUrl: '',
        sourceDate: '2025',
      },
    ]);
  };

  const handleUpdateFutureTechCard = (index: number, field: keyof FutureTechCard, val: any) => {
    setFutureTechCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveFutureTechCard = (index: number) => {
    setFutureTechCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen" style={{ color: textColor }}>
      {/* Header */}
      <div style={{ borderColor: cardBorder }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-black flex items-center gap-2.5">
            <Briefcase style={{ color: cardHighlight }} size={28} /> Tanulási Útvonalak &amp; Szakmai Karrierlépcsők
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Hozz létre, szerkessz vagy törölj szakmai karrierutakat, idővonal állomásokat és jövőbeli technológiai kártyákat.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            style={{ backgroundColor: cardHighlight, color: '#000' }}
            className="px-4 py-2.5 font-black text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Plus size={16} /> Új Szakmai Karrierút
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
            className="px-4 py-2.5 border font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={14} /> Alapértelmezett Visszaállítása
          </button>
        </div>
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
              <div className="space-y-1">
                <span className="text-[11px] text-gray-500 font-mono block">
                  {trade.timelineStations?.length || 0} db idővonal állomás
                </span>
                <span className="text-[11px] text-gray-500 font-mono block">
                  {trade.futureTechCards?.length || 0} db tech kártya
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(trade)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-3 py-1.5 border text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <Edit3 size={13} /> Szerkesztés
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTrade(trade.id, trade.name)}
                  className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Szakmai Karrierút Törlése"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto admin-scroll text-xs">
            
            {/* Modal Header */}
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-3">
              <h3 style={{ color: textColor }} className="text-base font-extrabold flex items-center gap-2">
                <Briefcase size={18} style={{ color: cardHighlight }} />
                {editingTrade ? `Szakmai Útmutató Szerkesztése (${editingTrade.name})` : 'Új Szakmai Karrierút Létrehozása'}
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

            {/* Modal Navigation Tabs */}
            <div style={{ borderColor: cardBorder }} className="flex items-center gap-2 border-b pb-2">
              <button
                type="button"
                onClick={() => setModalTab('basic')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'basic'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'bg-gray-800/60 text-gray-400 hover:text-white'
                }`}
              >
                <Layers size={14} /> Alapadatok &amp; Leírás
              </button>
              <button
                type="button"
                onClick={() => setModalTab('timeline')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'timeline'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'bg-gray-800/60 text-gray-400 hover:text-white'
                }`}
              >
                <History size={14} /> Múlt → Jelen → Jövő Idővonal ({timelineStations.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('futureTech')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'futureTech'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'bg-gray-800/60 text-gray-400 hover:text-white'
                }`}
              >
                <Cpu size={14} /> Jövőbeli Technológiák ({futureTechCards.length})
              </button>
            </div>

            <form onSubmit={handleSaveTrade} className="space-y-4">
              
              {/* TAB 1: BASIC DETAILS */}
              {modalTab === 'basic' && (
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
              )}

              {/* TAB 2: TIMELINE (MÚLT -> JELEN -> JÖVŐ) */}
              {modalTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Idővonal Szekció Címe</label>
                      <input
                        type="text"
                        value={timelineTitle}
                        onChange={(e) => setTimelineTitle(e.target.value)}
                        placeholder="Pl. Honnan indult és merre tart a szakma?"
                        style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                        className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Idővonal Alcím</label>
                      <input
                        type="text"
                        value={timelineSubtitle}
                        onChange={(e) => setTimelineSubtitle(e.target.value)}
                        placeholder="Rövid magyarázó alcím..."
                        style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                        className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Illusztráció Kép URL</label>
                      <input
                        type="text"
                        value={timelineImage}
                        onChange={(e) => setTimelineImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                        className="w-full border rounded-xl px-4 py-2 text-[11px] focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Kép Képaláírás / ALT Szöveg</label>
                      <input
                        type="text"
                        value={timelineImageAlt}
                        onChange={(e) => setTimelineImageAlt(e.target.value)}
                        placeholder="Kép leírása..."
                        style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                        className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Station Manager */}
                  <div style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm flex items-center gap-2">
                        <History size={16} className="text-amber-400" /> Idővonal Állomások ({timelineStations.length} db)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddTimelineStation}
                        className="px-3 py-1.5 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus size={14} /> + Állomás Hozzáadása
                      </button>
                    </div>

                    {timelineStations.map((st, idx) => (
                      <div
                        key={st.id || idx}
                        style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                        className="p-4 border rounded-2xl space-y-3 relative"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">
                            #{idx + 1} Állomás
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTimelineStation(idx)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold p-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Jelvény / Címke (pl. RÉGEN, MA, JÖVŐ, TE)</label>
                            <input
                              type="text"
                              value={st.badge}
                              onChange={(e) => handleUpdateTimelineStation(idx, 'badge', e.target.value)}
                              style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                              className="w-full border rounded-lg px-3 py-1.5 font-bold text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Időszak (pl. 19-20. század)</label>
                            <input
                              type="text"
                              value={st.period}
                              onChange={(e) => handleUpdateTimelineStation(idx, 'period', e.target.value)}
                              style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                              className="w-full border rounded-lg px-3 py-1.5 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Állomás Címe</label>
                            <input
                              type="text"
                              value={st.title}
                              onChange={(e) => handleUpdateTimelineStation(idx, 'title', e.target.value)}
                              style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                              className="w-full border rounded-lg px-3 py-1.5 font-bold text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Állomás Leírása</label>
                          <textarea
                            rows={2}
                            value={st.description}
                            onChange={(e) => handleUpdateTimelineStation(idx, 'description', e.target.value)}
                            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                            className="w-full border rounded-lg p-2.5 text-xs leading-relaxed"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: FUTURE TECH & CLOSURE */}
              {modalTab === 'futureTech' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Jövőbeli Technológiák Szekció Címe</label>
                      <input
                        type="text"
                        value={futureTechTitle}
                        onChange={(e) => setFutureTechTitle(e.target.value)}
                        placeholder="Pl. MERRE TART A SZAKMA?"
                        style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                        className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Jövőbeli Szekció Alcím</label>
                      <input
                        type="text"
                        value={futureTechSubtitle}
                        onChange={(e) => setFutureTechSubtitle(e.target.value)}
                        placeholder="Rövid felvezető alcím..."
                        style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                        className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Future Tech Card Manager */}
                  <div style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm flex items-center gap-2">
                        <Cpu size={16} className="text-purple-400" /> Technológiai Kártyák ({futureTechCards.length} db)
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddFutureTechCard}
                        className="px-3 py-1.5 bg-purple-400/20 text-purple-300 hover:bg-purple-400/30 border border-purple-400/40 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus size={14} /> + Tech Kártya Hozzáadása
                      </button>
                    </div>

                    {futureTechCards.map((card, idx) => (
                      <div
                        key={card.id || idx}
                        style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                        className="p-4 border rounded-2xl space-y-3 relative"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                            #{idx + 1} Kártya
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFutureTechCard(idx)}
                            className="text-red-400 hover:text-red-300 text-xs font-bold p-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Kategória</label>
                            <select
                              value={card.category}
                              onChange={(e) => handleUpdateFutureTechCard(idx, 'category', e.target.value)}
                              style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                              className="w-full border rounded-lg px-3 py-1.5 font-bold text-xs"
                            >
                              <option value="MÁR LÉTEZŐ">MÁR LÉTEZŐ</option>
                              <option value="FEJLŐDŐ">FEJLŐDŐ</option>
                              <option value="KÍSÉRLETI">KÍSÉRLETI</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Technológia Címe</label>
                            <input
                              type="text"
                              value={card.title}
                              onChange={(e) => handleUpdateFutureTechCard(idx, 'title', e.target.value)}
                              style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                              className="w-full border rounded-lg px-3 py-1.5 font-bold text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Technológia Leírása</label>
                          <textarea
                            rows={2}
                            value={card.description}
                            onChange={(e) => handleUpdateFutureTechCard(idx, 'description', e.target.value)}
                            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                            className="w-full border rounded-lg p-2.5 text-xs leading-relaxed"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div>
                            <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Forrás Neve (pl. Construction Europe)</label>
                            <input
                              type="text"
                              value={card.sourceName || ''}
                              onChange={(e) => handleUpdateFutureTechCard(idx, 'sourceName', e.target.value)}
                              style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                              className="w-full border rounded-lg px-3 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Forrás URL (pl. https://...)</label>
                            <input
                              type="text"
                              value={card.sourceUrl || ''}
                              onChange={(e) => handleUpdateFutureTechCard(idx, 'sourceUrl', e.target.value)}
                              style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                              className="w-full border rounded-lg px-3 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block font-bold mb-0.5">Forrás Éve / Dátuma (pl. 2025)</label>
                            <input
                              type="text"
                              value={card.sourceDate || ''}
                              onChange={(e) => handleUpdateFutureTechCard(idx, 'sourceDate', e.target.value)}
                              style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                              className="w-full border rounded-lg px-3 py-1.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Closure text */}
                  <div style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-2">
                    <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">
                      „TE MILYEN SZAKEMBER LESZEL?” Záró Gondolat
                    </label>
                    <textarea
                      rows={3}
                      value={futureTechClosure}
                      onChange={(e) => setFutureTechClosure(e.target.value)}
                      placeholder="Pl. A kőműves szakma a fizikai erőkifejtésből a digitális precizitás és az automatizált szerkezetépítés mesterségévé alakul."
                      style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                      className="w-full border rounded-xl p-3 leading-relaxed focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
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
