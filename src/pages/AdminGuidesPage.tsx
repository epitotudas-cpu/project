import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Settings,
  Save,
  HardHat,
} from 'lucide-react';
import type { Article, Category } from '../lib/supabase';
import * as articleService from '../services/articleService';
import { listCategories } from '../services/categoryService';
import {
  getArticleSettingsForType,
  saveArticleSettingsForType,
  type TypePageSettings,
} from '../services/articleSettingsService';
import { useToast } from '../components/ToastProvider';
import EditArticleModal from '../components/EditArticleModal';
import { useSiteSettings, adjustColorBrightness } from '../services/siteSettingsService';

export type GuidesSubTab = 'list' | 'by-trade' | 'templates' | 'settings';

const STATUS_BADGES: Record<Article['status'], { label: string; class: string }> = {
  draft: { label: 'Piszkozat', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  pending: { label: 'Jóváhagyásra vár', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  review: { label: 'Felülvizsgálat', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Jóváhagyva', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  published: { label: 'Közzétéve', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected: { label: 'Elutasítva', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  archived: { label: 'Archivált', class: 'bg-gray-700/10 text-gray-500 border-gray-700/20' },
};

const TRADES_LIST = [
  'Hőszigetelő',
  'Kőműves',
  'Szárazépítő / Gipszkartonozó',
  'Burkoló',
  'Ács / Zsaluzó',
  'Tetőfedő',
  'Épületgépész',
  'Villanyszerelő',
  'Festő & Mázoló',
];

const PREDEFINED_TEMPLATES = [
  {
    id: 'eps-insulation',
    title: 'EPS Homlokzati Hőszigetelés Lépésről Lépésre',
    trade: 'Hőszigetelő',
    difficulty: 'intermediate',
    excerpt: 'Gyakorlati útmutató EPS homlokzati hőszigetelés előkészítéséhez, ragasztásához, dübelezéséhez és hálózásához.',
    content: `## 1. BEVEZETÉS ÉS ALKALMAZÁSI TERÜLET
Az EPS (expandált polisztirol) homlokzati hőszigetelés az egyik leghatékonyabb és legelterjedtebb hőszigetelési technológia.

## 2. ELŐKÉSZÍTÉS ÉS FÜLEK
- Falfelület tisztítása, pormentesítése, alapozása
- Indítóprofil vízszintes rögzítése beütődűbellel

## 3. LÉPÉSRŐL LÉPÉSRE KIVITELEZÉS
1. **Ragasztó bekeverése**: Előírt vízmennyiséggel csomómentesre keverni.
2. **Pont-perem módszer**: A lapok szélén körbe, közepén 3 ponton kenjük a ragasztót (min. 40% fedés).
3. **Kötésben rakás**: A lapokat alulról felfelé, kötésben helyezzük el.
4. **Dübelezés**: Ragasztó száradása után (24h) m²-enként 6 db tárcsás dübel beépítése.
5. **Üvegszövet háló beágyazása**: Háló átfedése min. 10 cm.

## 4. GYAKORI KIVITELEZÉSI HIBAK
- Hézagok ragasztóval való kitöltése (hőhíd)
- Pont-perem módszer kihagyása (csak pogácsázás)
- Dübelezés elmulasztása vagy nem megfelelő mélysége

## 5. MINŐSÉGELLENŐRZÉSI ELLENŐRZŐLISTA
- [ ] Falfelület egyenessége és tapadása ellenőrizve
- [ ] Lapok síkpontossága ellenőrizve csiszolással
- [ ] Dübelek tányérja egy síkban van az EPS lappal
- [ ] Hálóátfedések min. 10 cm-esek`,
  },
  {
    id: 'drywall-wall',
    title: 'Gipszkarton Válaszfal Építése Szerkezetépítéssel',
    trade: 'Szárazépítő / Gipszkartonozó',
    difficulty: 'intermediate',
    excerpt: 'Lépésről lépésre gipszkarton válaszfal váza, szigetelése és borítása.',
    content: `## 1. ALAPOK ÉS ELŐKÉSZÍTÉS
UW profilok rögzítése aljzatra és födémre szigetelő szalaggal ellátva.

## 2. KIVITELEZÉS
1. CW profilok beállítása 60 cm tengelytávval.
2. Egyoldali gipszkarton borítás.
3. Ásványgyapot szigetelés elhelyezése.
4. Másik oldali borítás és hézagolás (Q1-Q4).`,
  },
  {
    id: 'tiling-bathroom',
    title: 'Fürdőszobai Hidegburkolás és Vízszigetelés Rétegrendje',
    trade: 'Burkoló',
    difficulty: 'advanced',
    excerpt: 'Szakszerű kenhető vízszigetelés és lapburkolás fürdőszobában.',
    content: `## 1. ELŐKÉSZÍTÉS
Aljzat kiegyenlítése, felület portalanítása és mélyalapozása.

## 2. LÉPÉSEK
1. **Hajlatszalag beágyazása**: A sarokcsatlakozásoknál rugalmas hajlatszalag beágyazása.
2. **Kent vízszigetelés**: Két réteg keresztirányú felhordása.
3. **Ragasztás (Kétoldali kenés)**: Csemperagasztó felhordása fogazott simítóval aljzatra és csempére egyaránt (Buttering-Floating).
4. **Fugázás és szilikonozás**: Csemperagasztó száradása után fugázás, sarkokban szaniter szilikon.`,
  },
];

interface AdminGuidesPageProps {
  initialSearchQuery?: string;
}

export default function AdminGuidesPage({ initialSearchQuery }: AdminGuidesPageProps = {}) {
  const toast = useToast();
  const siteSettings = useSiteSettings();

  const [activeSubTab, setActiveSubTab] = useState<GuidesSubTab>('list');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Modals & Selection States
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  // Page Settings for utmutatok
  const [pageSettings, setPageSettings] = useState<TypePageSettings>(() =>
    getArticleSettingsForType('utmutatok')
  );

  // Styling matching Admin Theme
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await listCategories();
      setCategories(cats);

      // List all articles filtered by article_type === 'utmutatok'
      const artsRes = await articleService.listArticles({ pageSize: 300 });
      const allArts = (artsRes.rows as unknown as Article[]) || [];
      const guidesOnly = allArts.filter((a) => a.article_type === 'utmutatok');
      setArticles(guidesOnly);

      setPageSettings(getArticleSettingsForType('utmutatok'));
    } catch {
      toast.error('Hiba a Kivitelezési Útmutatók betöltésekor.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics
  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter((a) => a.status === 'published').length;
    const draft = articles.filter((a) => a.status === 'draft').length;
    const pending = articles.filter((a) => a.status === 'pending' || a.status === 'review').length;
    const archived = articles.filter((a) => a.status === 'archived').length;
    const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

    const tradesSet = new Set<string>();
    articles.forEach((a) => {
      if (a.subcategory_name) tradesSet.add(a.subcategory_name);
    });

    return { total, published, draft, pending, archived, totalViews, tradesCount: tradesSet.size };
  }, [articles]);

  // Filtered Guides
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && a.category_id !== categoryFilter) return false;
      if (tradeFilter !== 'all') {
        const tradeLower = tradeFilter.toLowerCase();
        const subLower = (a.subcategory_name || '').toLowerCase();
        if (!subLower.includes(tradeLower)) return false;
      }
      if (difficultyFilter !== 'all' && a.difficulty !== difficultyFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const t = a.title.toLowerCase();
        const ex = (a.excerpt || '').toLowerCase();
        const sub = (a.subcategory_name || '').toLowerCase();
        const aut = (a.author || '').toLowerCase();
        return t.includes(q) || ex.includes(q) || sub.includes(q) || aut.includes(q);
      }
      return true;
    });
  }, [articles, statusFilter, categoryFilter, tradeFilter, difficultyFilter, search]);

  // Actions
  const handleOpenCreateModal = (template?: typeof PREDEFINED_TEMPLATES[0]) => {
    if (template) {
      setEditingArticle({
        id: '',
        title: template.title,
        slug: '',
        excerpt: template.excerpt,
        content: template.content,
        article_type: 'utmutatok',
        difficulty: template.difficulty as any,
        subcategory_name: template.trade,
        status: 'draft',
        created_at: new Date().toISOString(),
      } as Article);
    } else {
      setEditingArticle(null);
    }
    setEditorOpen(true);
  };

  const handleDuplicate = async (artId: string) => {
    try {
      const dup = await articleService.duplicateArticle(artId);
      if (dup) {
        toast.success(`Útmutató duplikálva: "${dup.title}"`);
        await loadData();
      }
    } catch {
      toast.error('Duplikálás hiba.');
    }
  };

  const handleTogglePublish = async (art: Article) => {
    try {
      const newStatus = art.status === 'published' ? 'draft' : 'published';
      await articleService.setArticleStatus(art.id, newStatus);
      toast.success(
        newStatus === 'published'
          ? `"${art.title}" útmutató közzétéve!`
          : `"${art.title}" útmutató piszkozatba helyezve.`
      );
      await loadData();
    } catch {
      toast.error('Státusz frissítési hiba.');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingArticle) return;
    try {
      await articleService.deleteArticle(deletingArticle.id);
      toast.success(`"${deletingArticle.title}" útmutató törölve.`);
      setDeletingArticle(null);
      await loadData();
    } catch {
      toast.error('Törlési hiba.');
    }
  };

  const handleSavePageSettings = () => {
    saveArticleSettingsForType('utmutatok', pageSettings);
    toast.success('Kivitelezési útmutatók oldal beállításai sikeresen elmentve!');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner & Actions */}
      <div
        className="rounded-3xl p-6 md:p-8 border shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden"
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
      >
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/15 border border-accent/30 text-accent font-bold text-xs rounded-full">
            <BookOpen size={14} /> Kivitelezési Útmutatók Kezelőközpont
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Kivitelezési Útmutatók Kezelése
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            Strukturált gyakorlati útmutatók, lépésről lépésre technológiai leírások, munkavédelmi előírások és ellenőrzőlisták központi szerkesztése.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => handleOpenCreateModal()}
            className="px-5 py-3 rounded-2xl text-xs font-black text-black transition-all shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
            style={{ backgroundColor: cardHighlight }}
          >
            <Plus size={16} strokeWidth={3} /> Új Kivitelezési Útmutató
          </button>
        </div>
      </div>

      {/* 2. Top Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl border bg-[#151515] border-[#252525] space-y-1">
          <span className="text-xs font-medium text-gray-400">Összes Útmutató</span>
          <div className="text-2xl font-black text-white">{stats.total}</div>
        </div>
        <div className="p-5 rounded-2xl border bg-[#151515] border-[#252525] space-y-1">
          <span className="text-xs font-medium text-green-400">Közzétéve</span>
          <div className="text-2xl font-black text-green-400">{stats.published}</div>
        </div>
        <div className="p-5 rounded-2xl border bg-[#151515] border-[#252525] space-y-1">
          <span className="text-xs font-medium text-amber-400">Jóváhagyásra vár</span>
          <div className="text-2xl font-black text-amber-400">{stats.pending}</div>
        </div>
        <div className="p-5 rounded-2xl border bg-[#151515] border-[#252525] space-y-1">
          <span className="text-xs font-medium text-gray-400">Piszkozat</span>
          <div className="text-2xl font-black text-gray-300">{stats.draft}</div>
        </div>
        <div className="p-5 rounded-2xl border bg-[#151515] border-[#252525] space-y-1">
          <span className="text-xs font-medium text-blue-400">Lefedett Szakmák</span>
          <div className="text-2xl font-black text-blue-400">{stats.tradesCount}</div>
        </div>
        <div className="p-5 rounded-2xl border bg-[#151515] border-[#252525] space-y-1">
          <span className="text-xs font-medium text-accent">Összes Megtekintés</span>
          <div className="text-2xl font-black text-accent">{stats.totalViews}</div>
        </div>
      </div>

      {/* 3. Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#252525] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeSubTab === 'list'
              ? 'bg-accent text-black font-bold shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={15} /> Útmutatók Listája ({filteredArticles.length})
        </button>

        <button
          onClick={() => setActiveSubTab('by-trade')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeSubTab === 'by-trade'
              ? 'bg-accent text-black font-bold shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HardHat size={15} /> Szakmák &amp; Munkafolyamatok
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeSubTab === 'templates'
              ? 'bg-accent text-black font-bold shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles size={15} /> Útmutató Sablonok &amp; Segéd
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeSubTab === 'settings'
              ? 'bg-accent text-black font-bold shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={15} /> Oldal Beállítások
        </button>
      </div>

      {/* 4. TAB 1: GUIDES LIST & FILTERS */}
      {activeSubTab === 'list' && (
        <div className="space-y-6">
          {/* Search & Multi-Filter Bar */}
          <div className="bg-[#151515] border border-[#252525] p-5 rounded-3xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Live Search Input */}
              <div className="relative lg:col-span-2">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Keresés cím, szakma vagy szerző alapján..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#1e1e1e] border border-[#333] text-gray-200 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent"
              >
                <option value="all">Minden Státusz</option>
                <option value="published">Közzétéve</option>
                <option value="draft">Piszkozat</option>
                <option value="pending">Jóváhagyásra vár</option>
                <option value="archived">Archivált</option>
              </select>

              {/* Trade Filter */}
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="bg-[#1e1e1e] border border-[#333] text-gray-200 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent"
              >
                <option value="all">Minden Szakma</option>
                {TRADES_LIST.map((tr) => (
                  <option key={tr} value={tr}>
                    {tr}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#1e1e1e] border border-[#333] text-gray-200 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent"
              >
                <option value="all">Minden Kategória</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-[#1e1e1e] border border-[#333] text-gray-200 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-accent"
              >
                <option value="all">Minden Nehézségi Szint</option>
                <option value="kezdő">Kezdő</option>
                <option value="intermediate">Középhaladó</option>
                <option value="haladó">Haladó</option>
                <option value="mester">Mester</option>
              </select>
            </div>
          </div>

          {/* Guides Table */}
          {loading ? (
            <div className="py-20 text-center text-gray-400 space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
              <p className="text-xs font-bold">Kivitelezési útmutatók betöltése...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-16 text-center text-gray-500 bg-[#141414] border border-[#252525] rounded-3xl space-y-3">
              <BookOpen size={36} className="mx-auto text-gray-600 opacity-60" />
              <h3 className="text-base font-bold text-gray-300">Nincs találat</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Próbáld meg módosítani a keresési vagy szűrési feltételeket, vagy hozz létre egy új kivitelezési útmutatót!
              </p>
              <button
                onClick={() => handleOpenCreateModal()}
                className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl shadow-md"
              >
                + Új Útmutató
              </button>
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#252525] rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#1a1a1a] text-gray-400 font-bold uppercase tracking-wider border-b border-[#252525]">
                    <tr>
                      <th className="px-6 py-4">Útmutató Címe</th>
                      <th className="px-4 py-4">Szakma / Kategória</th>
                      <th className="px-4 py-4">Nehézség</th>
                      <th className="px-4 py-4">Státusz</th>
                      <th className="px-4 py-4 text-center">Megtekintés</th>
                      <th className="px-6 py-4 text-right">Műveletek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {filteredArticles.map((art) => {
                      const badge = STATUS_BADGES[art.status] || STATUS_BADGES.draft;
                      const catObj = categories.find((c) => c.id === art.category_id);

                      return (
                        <tr key={art.id} className="hover:bg-[#1a1a1a]/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-white text-sm leading-snug line-clamp-1">
                              {art.title}
                            </div>
                            {art.excerpt && (
                              <p className="text-gray-400 text-[11px] line-clamp-1 mt-0.5">{art.excerpt}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {art.subcategory_name && (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                  {art.subcategory_name}
                                </span>
                              )}
                              {catObj && (
                                <div className="text-[11px] text-gray-400 font-medium">{catObj.name}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="capitalize text-xs font-semibold text-gray-300">
                              {art.difficulty || 'Középhaladó'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badge.class}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-mono font-bold text-accent">
                            {art.views || 0}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewArticle(art)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Előnézet"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingArticle(art);
                                  setEditorOpen(true);
                                }}
                                className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors font-bold"
                                title="Szerkesztés"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => handleTogglePublish(art)}
                                className={`p-2 rounded-lg transition-colors ${
                                  art.status === 'published'
                                    ? 'text-amber-400 hover:bg-amber-400/10'
                                    : 'text-green-400 hover:bg-green-400/10'
                                }`}
                                title={art.status === 'published' ? 'Visszavonás piszkozatba' : 'Közzététel'}
                              >
                                {art.status === 'published' ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                              </button>
                              <button
                                onClick={() => handleDuplicate(art.id)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Duplikálás"
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                onClick={() => setDeletingArticle(art)}
                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                title="Törlés"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2: GROUPED BY TRADE */}
      {activeSubTab === 'by-trade' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRADES_LIST.map((tradeName) => {
              const tradeArticles = articles.filter((a) =>
                (a.subcategory_name || '').toLowerCase().includes(tradeName.toLowerCase())
              );

              return (
                <div key={tradeName} className="bg-[#141414] border border-[#252525] rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-accent/15 border border-accent/30 text-accent">
                        <HardHat size={18} />
                      </div>
                      <h3 className="font-extrabold text-white text-base">{tradeName}</h3>
                    </div>
                    <span className="text-xs bg-accent/20 text-accent font-bold px-3 py-1 rounded-full border border-accent/30">
                      {tradeArticles.length} útmutató
                    </span>
                  </div>

                  {tradeArticles.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4 text-center">
                      Még nincs közzétett útmutató ehhez a szakmához.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tradeArticles.map((art) => (
                        <div
                          key={art.id}
                          className="p-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl flex items-center justify-between gap-3 hover:border-accent/40 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-xs font-bold text-white line-clamp-1">{art.title}</div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-2">
                              <span>{art.author || 'ÉpítőTudás'}</span>
                              <span>•</span>
                              <span className="text-accent">{art.views || 0} megtekintés</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setEditingArticle(art);
                              setEditorOpen(true);
                            }}
                            className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors shrink-0"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setEditingArticle({
                        id: '',
                        title: `${tradeName} kivitelezési útmutató`,
                        slug: '',
                        article_type: 'utmutatok',
                        subcategory_name: tradeName,
                        status: 'draft',
                      } as Article);
                      setEditorOpen(true);
                    }}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Új Útmutató Ehhez a Szakmához
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TAB 3: GUIDES TEMPLATES & ASSISTANT */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          <div className="p-6 bg-accent/10 border border-accent/30 rounded-3xl space-y-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles size={20} className="text-accent" /> Gyors Útmutató Sablonok &amp; Vázlatok
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
              Válassz az előre strukturált gyakorlati sablonok közül, hogy azonnal szabványos, könnyen érthető és lépésről lépésre tagolt kivitelezési tartalommal töltsd fel a rendszert!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PREDEFINED_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-[#141414] border border-[#252525] p-6 rounded-3xl space-y-4 flex flex-col justify-between hover:border-accent/50 transition-all"
              >
                <div className="space-y-3">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {tmpl.trade}
                  </span>
                  <h3 className="font-extrabold text-white text-base leading-snug">{tmpl.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{tmpl.excerpt}</p>
                </div>

                <button
                  onClick={() => handleOpenCreateModal(tmpl)}
                  className="w-full py-3 bg-accent text-black font-extrabold text-xs rounded-xl shadow-lg hover:bg-accent-hover transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Vázlat Létrehozása Ebből a Sablonból
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB 4: PAGE SETTINGS (utmutatok category page) */}
      {activeSubTab === 'settings' && (
        <div className="bg-[#141414] border border-[#252525] p-6 md:p-8 rounded-3xl space-y-6 max-w-4xl">
          <div className="space-y-1 border-b border-[#222] pb-4">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Settings size={20} className="text-accent" /> Kivitelezési Útmutatók Oldal Testreszabása
            </h2>
            <p className="text-xs text-gray-400">
              A nyilvános `/category?type=utmutatok` listaoldal címsorának, leírásának és megjelenésének beállításai.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Oldal Főcíme</label>
              <input
                type="text"
                value={pageSettings.articlesPageTitle}
                onChange={(e) =>
                  setPageSettings((prev) => ({ ...prev, articlesPageTitle: e.target.value }))
                }
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Oldal Leírása</label>
              <textarea
                rows={3}
                value={pageSettings.articlesPageDescription}
                onChange={(e) =>
                  setPageSettings((prev) => ({ ...prev, articlesPageDescription: e.target.value }))
                }
                className="w-full bg-[#1e1e1e] border border-[#333] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Útmutatók Száma Oldalanként</label>
              <input
                type="number"
                min={4}
                max={48}
                value={pageSettings.articlesPerPage}
                onChange={(e) =>
                  setPageSettings((prev) => ({ ...prev, articlesPerPage: Number(e.target.value) || 12 }))
                }
                className="w-full max-w-xs bg-[#1e1e1e] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
              />
            </div>

            <div className="pt-4 border-t border-[#222]">
              <button
                onClick={handleSavePageSettings}
                className="px-6 py-3 bg-accent text-black font-extrabold text-xs rounded-xl shadow-lg hover:bg-accent-hover transition-all flex items-center gap-2"
              >
                <Save size={16} /> Beállítások Mentése
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT/CREATE ARTICLE MODAL (LOCKED TO utmutatok) */}
      {editorOpen && (
        <EditArticleModal
          article={editingArticle}
          categories={categories}
          lockedArticleType="utmutatok"
          onClose={() => setEditorOpen(false)}
          onSaved={async () => {
            setEditorOpen(false);
            await loadData();
          }}
        />
      )}

      {/* PREVIEW MODAL */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#333] rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#333] pb-4">
              <div className="flex items-center gap-2 text-xs text-accent font-bold">
                <BookOpen size={14} /> Előnézet: {previewArticle.subcategory_name || 'Kivitelezési Útmutató'}
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-white">{previewArticle.title}</h2>
              {previewArticle.excerpt && (
                <p className="text-sm text-gray-300 leading-relaxed font-medium bg-white/5 p-4 rounded-2xl border border-white/10">
                  {previewArticle.excerpt}
                </p>
              )}
            </div>

            <div className="prose prose-invert max-w-none text-xs leading-relaxed">
              <div className="whitespace-pre-wrap">{previewArticle.content}</div>
            </div>

            <div className="pt-4 border-t border-[#333] flex justify-end">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#333] rounded-3xl w-full max-w-md p-6 space-y-6 text-white shadow-2xl">
            <div className="space-y-2 text-center">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full w-fit mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-black">Biztosan törölni szeretnéd?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                A(z) <strong className="text-white">"{deletingArticle.title}"</strong> kivitelezési útmutató véglegesen törlődik a rendszerből.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingArticle(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl"
              >
                Mégse
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Végleges Törlés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
