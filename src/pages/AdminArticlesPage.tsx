import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  FolderTree,
  Edit3,
  Layout,
  Sliders,
  Compass,
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Archive,
  AlertCircle,
  ChevronRight,
  Save,
  ArrowLeft,
  Link,
  CheckSquare,
} from 'lucide-react';
import type { Article, Category } from '../lib/supabase';
import * as articleService from '../services/articleService';
import { listCategories } from '../services/categoryService';
import { getArticleSettings, saveArticleSettings, type ArticleSettings } from '../services/articleSettingsService';
import { getArticleRedirects, type ArticleRedirect } from '../services/articleRedirectsService';
import { getRecommendationsMap, saveRecommendationConfig } from '../services/articleRecommendationsService';
import { useToast } from '../components/ToastProvider';
import EditArticleModal from '../components/EditArticleModal';
import EditCategoryModal from '../components/EditCategoryModal';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import { useSiteSettings, adjustColorBrightness } from '../services/siteSettingsService';

export type ArticleHubSubTab =
  | 'overview'
  | 'list'
  | 'categories'
  | 'content'
  | 'detail_layout'
  | 'category_layout'
  | 'recommendations'
  | 'seo';

interface ArticleHubTile {
  key: ArticleHubSubTab;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  badge?: string;
}

const HUB_TILES: ArticleHubTile[] = [
  {
    key: 'list',
    title: '1. Cikkek Lista & Műveletek',
    subtitle: 'Keresés, szűrés, státuszok, duplikálás és törlés',
    description: 'Böngéssz a cikkek között kategória, státusz (vázlat, ellenőrzésre vár, publikált, archivált), szerző és kiemelt állapot szerint.',
    icon: FileText,
  },
  {
    key: 'categories',
    title: '2. Cikk kategóriák',
    subtitle: 'Hírek, Újdonságok, Útmutatók & egyedi kategóriák',
    description: 'Kategóriák neve, leírása, slugja, sorrendje, ikonja és színe. Törlés esetén meglévő cikkek kötelező célkategóriás áthelyezése.',
    icon: FolderTree,
  },
  {
    key: 'content',
    title: '3. Cikk tartalma & Szerkesztő',
    subtitle: 'Rich text szerkesztő, vázlatmentés és URL átirányítások',
    description: 'Blokkalapú szövegszerkesztő címsorokkal, táblázatokkal és kiemelésekkel. Slug változásakor automatikus URL átirányítás.',
    icon: Edit3,
  },
  {
    key: 'detail_layout',
    title: '4. Cikkoldal elemei & Elrendezés',
    subtitle: 'Megjelenő elemek kapcsolói és széles 1-oszlopos elrendezés',
    description: 'Állítsd be, hogy a részletes cikkoldalon megjelenjen-e a szerző, dátum, képek, ajánlók, hozzászólások és partneri blokk.',
    icon: Layout,
  },
  {
    key: 'category_layout',
    title: '5. Kategóriaoldal elemei',
    subtitle: 'Listaoldal címe, leírása, keresője és kártyaelrendezése',
    description: 'Testreszabható cikklista beállítások: kártyák száma, rácselrendezés, rendezés (legújabb, kiemelt) és lapozási mód.',
    icon: Sliders,
  },
  {
    key: 'recommendations',
    title: '6. Cikkajánlók & Kapcsolódó Cikkek',
    subtitle: 'Automata vs kézi rögzítés és kizárások kezelése',
    description: 'Állíts be cikkenként manuálisan rögzített vagy kizárt kapcsolódó cikkeket. Nem publikált cikkek automatikusan kizárva.',
    icon: Compass,
  },
  {
    key: 'seo',
    title: '7. Keresőoptimalizálás (SEO Központ)',
    subtitle: 'SEO cím, meta leírás, kanonikus URL és ellenőrzőlista',
    description: 'Auditáld a cikkek keresőoptimalizálási hiányosságait (cím, lead, tartalom, meta leírás, kiemelt kép) publikálás előtt.',
    icon: Search,
  },
];

const STATUS_BADGES: Record<Article['status'], { label: string; class: string }> = {
  draft: { label: 'Piszkozat', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  pending: { label: 'Jóváhagyásra vár', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  review: { label: 'Felülvizsgálat', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Jóváhagyva', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  published: { label: 'Közzétéve', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected: { label: 'Elutasítva', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  archived: { label: 'Archivált', class: 'bg-gray-700/10 text-gray-500 border-gray-700/20' },
};

interface AdminArticlesPageProps {
  initialSearchQuery?: string;
}

export default function AdminArticlesPage({ initialSearchQuery }: AdminArticlesPageProps = {}) {
  const toast = useToast();
  const siteSettings = useSiteSettings();

  const [subTab, setSubTab] = useState<ArticleHubSubTab>('overview');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [redirects, setRedirects] = useState<ArticleRedirect[]>([]);
  const [articleSettings, setArticleSettingsState] = useState<ArticleSettings>(() => getArticleSettings());
  const [loading, setLoading] = useState(true);

  // Filters for Article List
  const [search, setSearch] = useState(initialSearchQuery || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');

  // Modals & Selection States
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false);

  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  // Curated Recommendations Selection
  const [selectedRecArticleId, setSelectedRecArticleId] = useState<string>('');
  const [pinnedRecIds, setPinnedRecIds] = useState<string[]>([]);
  const [excludedRecIds, setExcludedRecIds] = useState<string[]>([]);

  // Theme style calculation matching AdminSettingsPage
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await listCategories();
      setCategories(cats);

      const artsRes = await articleService.listArticles({ pageSize: 250 });
      setArticles(artsRes.rows as unknown as Article[]);

      setRedirects(getArticleRedirects());
      setArticleSettingsState(getArticleSettings());
    } catch (err) {
      toast.error('Hiba az adatok betöltésekor.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Sync recommendations form when selected article changes
  useEffect(() => {
    if (selectedRecArticleId) {
      const configMap = getRecommendationsMap();
      const cfg = configMap[selectedRecArticleId];
      if (cfg) {
        setPinnedRecIds(cfg.pinnedArticleIds || []);
        setExcludedRecIds(cfg.excludedArticleIds || []);
      } else {
        setPinnedRecIds([]);
        setExcludedRecIds([]);
      }
    }
  }, [selectedRecArticleId]);

  // Actions
  const handleSaveArticleSettings = (updated: ArticleSettings) => {
    saveArticleSettings(updated);
    setArticleSettingsState(updated);
    toast.success('Beállítások sikeresen elmentve!');
  };

  const handleDuplicateArticle = async (articleId: string) => {
    try {
      const dup = await articleService.duplicateArticle(articleId);
      if (dup) {
        toast.success(`Cikk sikeresen duplikálva: "${dup.title}"`);
        await loadAllData();
      }
    } catch (err) {
      toast.error('Duplikálás sikertelen.');
    }
  };

  const handleToggleArchiveArticle = async (art: Article) => {
    try {
      const newStatus = art.status === 'archived' ? 'draft' : 'archived';
      await articleService.setArticleStatus(art.id, newStatus);
      toast.success(`Cikk státusza frissítve: ${newStatus === 'archived' ? 'Archivált' : 'Piszkozat'}`);
      await loadAllData();
    } catch (err) {
      toast.error('Státuszmódosítás hiba.');
    }
  };

  const handleDeleteArticleConfirmed = async () => {
    if (!deletingArticle) return;
    try {
      await articleService.deleteArticle(deletingArticle.id);
      toast.success('Cikk sikeresen törölve.');
      setDeletingArticle(null);
      await loadAllData();
    } catch (err) {
      toast.error('Törlés hiba.');
    }
  };

  const handleSaveRecommendationConfig = () => {
    if (!selectedRecArticleId) return;
    saveRecommendationConfig({
      articleId: selectedRecArticleId,
      pinnedArticleIds: pinnedRecIds,
      excludedArticleIds: excludedRecIds,
      updatedAt: new Date().toISOString(),
    });
    toast.success('Cikkajánló beállítások elmentve!');
  };

  // Filtered articles list
  const filteredArticles = articles.filter((a) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchExcerpt = a.excerpt?.toLowerCase().includes(q);
      if (!matchTitle && !matchExcerpt) return false;
    }
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && a.category_id !== categoryFilter) return false;
    if (authorFilter !== 'all' && a.author !== authorFilter) return false;
    if (featuredFilter !== 'all') {
      const isFeat = featuredFilter === 'true';
      if (Boolean(a.featured) !== isFeat) return false;
    }
    return true;
  });

  // Unique Authors list
  const authorsList = Array.from(new Set(articles.map((a) => a.author).filter(Boolean)));

  // Published articles only (strictly enforced for recommendations)
  const publishedArticles = articles.filter((a) => a.status === 'published');

  // KPI Calculations
  const totalCount = articles.length;
  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft' || a.status === 'pending' || a.status === 'review').length;

  // SEO Completeness Audit
  const articlesWithSeoIssues = articles.filter(
    (a) => !a.title || !a.excerpt || !a.featured_image || !a.category_id || (a.content && a.content.length < 50)
  );

  return (
    <div className="space-y-6 text-white pb-20">
      {/* HUB TOP BANNER */}
      <div
        style={{ backgroundColor: headerBg, borderColor: cardBorder }}
        className="p-6 border rounded-2xl shadow-xl space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: `${cardHighlight}20`, color: cardHighlight, borderColor: `${cardHighlight}40` }}
              className="p-3 border rounded-xl"
            >
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <span>Cikkek Kezelése Központ</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold">
                  8 Kezelőmodul
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Áttekinthető csempés szerkezet a cikkek, kategóriák, tartalmak, elrendezés, ajánlók és SEO adminisztrációjához.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {subTab !== 'overview' && (
              <button
                onClick={() => setSubTab('overview')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition-colors border border-gray-700"
              >
                <ArrowLeft size={16} /> Vissza a Kezdőlapra
              </button>
            )}
            <button
              onClick={() => {
                setEditingArticle(null);
                setEditorOpen(true);
              }}
              style={{ backgroundColor: cardHighlight }}
              className="flex items-center gap-2 px-4 py-2 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all"
            >
              <Plus size={16} /> Új Cikk Létrehozása
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTAB 0: OVERVIEW HUB (CSEMPÉS KEZDŐLAP) */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI STATS BAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 border rounded-2xl">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Összes Cikk</div>
              <div className="text-2xl font-black text-white mt-1">{totalCount} db</div>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 border rounded-2xl">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Publikált</div>
              <div className="text-2xl font-black text-green-400 mt-1">{publishedCount} db</div>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 border rounded-2xl">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Piszkozat / Várakozó</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{draftCount} db</div>
            </div>
            <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 border rounded-2xl">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">SEO Hiányosság</div>
              <div className="text-2xl font-black text-red-400 mt-1">{articlesWithSeoIssues.length} cikk</div>
            </div>
          </div>

          {/* TILES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {HUB_TILES.map((tile) => {
              const Icon = tile.icon;
              return (
                <div
                  key={tile.key}
                  onClick={() => setSubTab(tile.key)}
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  className="group cursor-pointer p-6 border rounded-2xl hover:border-amber-400/60 transition-all duration-200 hover:shadow-xl hover:shadow-amber-400/5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        style={{ backgroundColor: `${cardHighlight}15`, color: cardHighlight, borderColor: `${cardHighlight}30` }}
                        className="p-3 border rounded-xl group-hover:scale-105 transition-transform"
                      >
                        <Icon size={24} />
                      </div>
                      <ChevronRight size={20} className="text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {tile.title}
                      </h3>
                      <p className="text-xs font-semibold text-amber-400/90 mt-0.5">{tile.subtitle}</p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed pt-1">
                      {tile.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 font-medium">
                    <span>Megnyitás</span>
                    <span className="text-amber-400 font-bold group-hover:underline">Kezelés &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTAB 1: CIKKEK LISTA & MŰVELETEK */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'list' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-6 border rounded-2xl space-y-6">
          {/* FILTER TOOLBAR */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-black/40 border border-gray-800 rounded-xl">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Keresés címben vagy leírásban..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">Minden Státusz</option>
                <option value="draft">Piszkozat</option>
                <option value="pending">Jóváhagyásra vár</option>
                <option value="review">Felülvizsgálat</option>
                <option value="approved">Jóváhagyva</option>
                <option value="published">Közzétéve</option>
                <option value="rejected">Elutasítva</option>
                <option value="archived">Archivált</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">Minden Kategória</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">Minden Szerző</option>
                {authorsList.filter((a): a is string => Boolean(a)).map((auth) => (
                  <option key={auth} value={auth}>
                    {auth}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Filter */}
            <div>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">Minden Cikk</option>
                <option value="true">Kiemelt Cikkek</option>
                <option value="false">Nem Kiemelt</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto border border-gray-800 rounded-xl">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-3">Cikk Címe & Slug</th>
                  <th className="p-3">Kategória</th>
                  <th className="p-3">Státusz</th>
                  <th className="p-3">Szerző</th>
                  <th className="p-3">Publikálva & Módosítva</th>
                  <th className="p-3 text-right">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      Cikkek betöltése...
                    </td>
                  </tr>
                ) : filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      Nem található cikk a keresési feltételek alapján.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((art) => {
                    const catObj = categories.find((c) => c.id === art.category_id);
                    const badge = STATUS_BADGES[art.status || 'draft'] || STATUS_BADGES.draft;
                    return (
                      <tr key={art.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{art.title}</div>
                          <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                            <span>/{art.slug}</span>
                            {art.featured && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                                Kiemelt
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 font-medium">
                            {catObj?.name || 'Általános'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge.class}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-gray-300">
                          {art.author || 'Szerkesztőség'}
                        </td>
                        <td className="p-3 text-[11px] text-gray-400 space-y-0.5">
                          <div>Publikálva: {art.created_at ? new Date(art.created_at).toLocaleDateString('hu-HU') : '-'}</div>
                          <div className="text-gray-500">Frissítve: {art.updated_at ? new Date(art.updated_at).toLocaleDateString('hu-HU') : '-'}</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingArticle(art);
                                setEditorOpen(true);
                              }}
                              title="Szerkesztés"
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-amber-400 rounded-lg transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDuplicateArticle(art.id)}
                              title="Duplikálás"
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg transition-colors"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              onClick={() => handleToggleArchiveArticle(art)}
                              title={art.status === 'archived' ? 'Visszaállítás' : 'Archiválás'}
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg transition-colors"
                            >
                              <Archive size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingArticle(art)}
                              title="Törlés"
                              className="p-1.5 bg-gray-800 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTAB 2: CIKK KATEGÓRIÁK */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'categories' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-6 border rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Cikk Kategóriák Kezelése</h2>
              <p className="text-xs text-gray-400">
                A nyilvános „Hírek / Újdonságok / Útmutatók” menüsáv automatikusan ezekből a kezelt kategóriákból épül fel.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
              style={{ backgroundColor: cardHighlight }}
              className="flex items-center gap-2 px-4 py-2 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all"
            >
              <Plus size={16} /> Új Kategória Hozzáadása
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const artCount = articles.filter((a) => a.category_id === cat.id).length;
              return (
                <div
                  key={cat.id}
                  style={{ backgroundColor: adjustColorBrightness(cardBg, -4), borderColor: cardBorder }}
                  className="p-5 border rounded-xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        style={{ backgroundColor: `${cat.color || '#FFC400'}20`, color: cat.color || '#FFC400' }}
                        className="p-2 rounded-lg border border-gray-700"
                      >
                        <FolderTree size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                        <span className="text-[11px] font-mono text-gray-400">/{cat.slug}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-amber-400 transition-colors"
                        title="Szerkesztés"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingCategory(cat);
                          setDeleteCategoryModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        title="Törlés áthelyezéssel"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 min-h-[2.5rem]">
                    {cat.description || 'Nincs leírás megadva.'}
                  </p>

                  <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                    <span>Cikkek száma: <strong className="text-amber-400">{artCount} db</strong></span>
                    <span>Sorrend: <strong className="text-gray-200">#{cat.sort_order || 1}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTAB 3: CIKK TARTALMA & SZERKESZTŐ & REDIRECTS */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'content' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-6 border rounded-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Cikk Tartalma, Szerkesztő & URL Átirányítások</h2>
            <p className="text-xs text-gray-400">
              Válassz ki egy cikket a blokkalapú tartalomszerkesztő megnyitásához, vagy tekintsd át a meglévő URL slug átirányításokat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Article Content Editor Selector */}
            <div className="p-5 bg-black/40 border border-gray-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Edit3 size={16} /> Cikk Tartalmának Szerkesztése
              </h3>
              <p className="text-xs text-gray-400">
                Nyisd meg a cikkszerkesztőt vázlatmentéssel, előnézettel és beépített blokkeszközökkel.
              </p>

              <select
                onChange={(e) => {
                  const found = articles.find((a) => a.id === e.target.value);
                  if (found) {
                    setEditingArticle(found);
                    setEditorOpen(true);
                  }
                }}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Válassz ki egy cikket szerkesztésre --</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Active URL Redirects List */}
            <div className="p-5 bg-black/40 border border-gray-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <Link size={16} /> Regisztrált URL Átirányítások ({redirects.length} db)
              </h3>
              <p className="text-xs text-gray-400">
                Amikor egy cikk URL slug-ja megváltozik, a rendszer automatikusan átirányítja a régi címet az újra.
              </p>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                {redirects.length === 0 ? (
                  <div className="text-gray-500 italic py-4 text-center">Nincsenek aktív URL átirányítások.</div>
                ) : (
                  redirects.map((r) => (
                    <div key={r.id} className="p-2.5 bg-gray-900/80 border border-gray-800 rounded-lg flex items-center justify-between">
                      <div className="truncate pr-2 font-mono text-[11px]">
                        <span className="text-red-400">/{r.oldSlug}</span> &rarr; <span className="text-green-400">/{r.newSlug}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 shrink-0">
                        {new Date(r.createdAt).toLocaleDateString('hu-HU')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTAB 4: CIKKOLDAL ELEMEI */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'detail_layout' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-6 border rounded-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Részletes Cikkoldal Elemei & Layout Beállítások</h2>
            <p className="text-xs text-gray-400">
              Kapcsold be vagy ki a cikkoldalakon megjelenő közös tartalmi elemeket. A cikkoldalak egységes, széles 1-oszlopos elrendezést használnak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'showAuthor', label: 'Szerző Megjelenítése', desc: 'Cikk írójának / partnérének neve a fejlécben' },
              { key: 'showDate', label: 'Publikálási Dátum', desc: 'Közzététel dátumának kijelzése' },
              { key: 'showReadTime', label: 'Olvasási Idő', desc: 'Becsült olvasási idő percben' },
              { key: 'showFeaturedImage', label: 'Kiemelt Kép', desc: 'Felső kiemelt borítókép megjelenítése' },
              { key: 'showTags', label: 'Címkék & Kulcsszavak', desc: 'Kapcsolódó témacímkék a cikk alján' },
              { key: 'showShareButtons', label: 'Közösségi Megosztás', desc: 'Megosztási gombok (Facebook, Linkedin, Link)' },
              { key: 'showRelatedArticles', label: 'Kapcsolódó Cikkek Blokk', desc: 'Ajánlott cikkek rácsa a cikk végén' },
              { key: 'showComments', label: 'Hozzászólások Blokk', desc: 'Szakmai visszajelzések és kommentek felülete' },
              { key: 'showPartnerBlock', label: 'Partneri Sponzor Kártya', desc: 'Partnerek által jegyzett tartalmi doboz' },
            ].map((item) => {
              const val = (articleSettings as any)[item.key];
              return (
                <div key={item.key} className="p-4 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.label}</h3>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      handleSaveArticleSettings({
                        ...articleSettings,
                        [item.key]: !val,
                      })
                    }
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      val ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}
                  >
                    {val ? 'BEKAPCSOLVA' : 'KIKAPCSOLVA'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-center gap-3 text-xs text-blue-200">
            <CheckSquare size={20} className="text-blue-400 shrink-0" />
            <span>
              <strong>Egyoszlopos elrendezés megerősítve:</strong> A részletes cikkoldalak jobb oldali oldalsávja ki van kapcsolva, a tartalom 100%-ban kitölti a rendelkezésre álló felületet.
            </span>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTAB 5: KATEGÓRIAOLDAL ELEMEI */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'category_layout' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-6 border rounded-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Kategória- és Cikklista Oldal Beállításai</h2>
            <p className="text-xs text-gray-400">
              Módosítsd a nyilvános cikklista oldal címét, leírását, keresőjét, kártyaelrendezését és lapozási módját.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Oldalcím</label>
              <input
                type="text"
                value={articleSettings.articlesPageTitle}
                onChange={(e) => setArticleSettingsState({ ...articleSettings, articlesPageTitle: e.target.value })}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bevezető Leírás</label>
              <textarea
                rows={2}
                value={articleSettings.articlesPageDescription}
                onChange={(e) => setArticleSettingsState({ ...articleSettings, articlesPageDescription: e.target.value })}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Keresőmező Placeholder Szövege</label>
              <input
                type="text"
                value={articleSettings.searchPlaceholderText}
                onChange={(e) => setArticleSettingsState({ ...articleSettings, searchPlaceholderText: e.target.value })}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Üres Állapot Szövege</label>
              <input
                type="text"
                value={articleSettings.emptyStateText}
                onChange={(e) => setArticleSettingsState({ ...articleSettings, emptyStateText: e.target.value })}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cikkek Száma Oldalanként</label>
                <input
                  type="number"
                  min={3}
                  max={48}
                  value={articleSettings.articlesPerPage}
                  onChange={(e) => setArticleSettingsState({ ...articleSettings, articlesPerPage: Number(e.target.value) })}
                  className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Grid Oszlopok (Desktop)</label>
                <select
                  value={articleSettings.desktopGridColumns}
                  onChange={(e) => setArticleSettingsState({ ...articleSettings, desktopGridColumns: Number(e.target.value) as any })}
                  className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={2}>2 Oszlop</option>
                  <option value={3}>3 Oszlop (Alapértelmezett)</option>
                  <option value={4}>4 Oszlop</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleSaveArticleSettings(articleSettings)}
              style={{ backgroundColor: cardHighlight }}
              className="flex items-center gap-2 px-6 py-2.5 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all mt-4"
            >
              <Save size={16} /> Kategóriaoldal Beállítások Mentése
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTAB 6: CIKKAJÁNLÓK */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'recommendations' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-6 border rounded-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Cikkajánlók & Kapcsolódó Cikkek Kezelése</h2>
            <p className="text-xs text-gray-400">
              Szigorú felületi szabály: Csak publikált cikkek jelenhetnek meg ajánlóként. Vázlatok, elutasított vagy archivált cikkek automatikusan ki vannak zárva.
            </p>
          </div>

          <div className="space-y-6 max-w-3xl">
            <div>
              <label className="block text-xs font-bold text-amber-400 uppercase mb-1">1. Válassz ki egy cikket a kurált ajánlók beállításához:</label>
              <select
                value={selectedRecArticleId}
                onChange={(e) => setSelectedRecArticleId(e.target.value)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Válassz ki egy cikket --</option>
                {publishedArticles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedRecArticleId && (
              <div className="space-y-5 p-5 bg-black/40 border border-gray-800 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-green-400 mb-2">Manuálisan Rögzített Kapcsolódó Cikkek (max 3 db)</h3>
                  <div className="space-y-2">
                    {publishedArticles
                      .filter((a) => a.id !== selectedRecArticleId)
                      .map((a) => {
                        const isPinned = pinnedRecIds.includes(a.id);
                        return (
                          <div key={a.id} className="flex items-center justify-between p-2 bg-gray-900/80 rounded-lg text-xs">
                            <span className="truncate pr-2 font-medium text-gray-200">{a.title}</span>
                            <button
                              onClick={() => {
                                if (isPinned) {
                                  setPinnedRecIds((prev) => prev.filter((id) => id !== a.id));
                                } else {
                                  if (pinnedRecIds.length >= 3) {
                                    toast.error('Maximum 3 cikk rögzíthető!');
                                    return;
                                  }
                                  setPinnedRecIds((prev) => [...prev, a.id]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                                isPinned ? 'bg-green-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
                              }`}
                            >
                              {isPinned ? 'RÖGZÍTVE' : '+ RÖGZÍTÉS'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <button
                  onClick={handleSaveRecommendationConfig}
                  style={{ backgroundColor: cardHighlight }}
                  className="flex items-center gap-2 px-5 py-2.5 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all"
                >
                  <Save size={16} /> Ajánlási Szabályok Mentése
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTAB 7: SEO KÖZPONT */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'seo' && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-6 border rounded-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Keresőoptimalizálás (SEO Audit Központ)</h2>
            <p className="text-xs text-gray-400">
              Tekintsd át a cikkek kötelező SEO elemeinek hiányosságait publikálás előtt.
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-800 rounded-xl">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-3">Cikk Címe</th>
                  <th className="p-3">Kategória</th>
                  <th className="p-3">Kiemelt Kép</th>
                  <th className="p-3">Lead / Bevezető</th>
                  <th className="p-3">SEO Állapot</th>
                  <th className="p-3 text-right">Művelet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {articles.map((art) => {
                  const hasImage = Boolean(art.featured_image);
                  const hasExcerpt = Boolean(art.excerpt && art.excerpt.length > 20);
                  const hasCat = Boolean(art.category_id);
                  const isComplete = hasImage && hasExcerpt && hasCat;

                  return (
                    <tr key={art.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="p-3 font-bold text-white">{art.title}</td>
                      <td className="p-3">{categories.find((c) => c.id === art.category_id)?.name || '-'}</td>
                      <td className="p-3">
                        {hasImage ? (
                          <span className="text-green-400 font-bold">Rendben</span>
                        ) : (
                          <span className="text-red-400 font-bold">Hiányzik</span>
                        )}
                      </td>
                      <td className="p-3">
                        {hasExcerpt ? (
                          <span className="text-green-400 font-bold">Rendben</span>
                        ) : (
                          <span className="text-red-400 font-bold">Hiányzik</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isComplete ? (
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                            Hiánytalan
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                            Hiányos
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setEditingArticle(art);
                            setEditorOpen(true);
                          }}
                          className="px-3 py-1 bg-amber-400 text-black font-bold rounded-lg text-xs hover:brightness-110"
                        >
                          SEO Javítása
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ---------------------------------------------------------------------- */}
      {/* EDIT ARTICLE MODAL */}
      {editorOpen && (
        <EditArticleModal
          article={editingArticle}
          categories={categories}
          onClose={() => {
            setEditorOpen(false);
            setEditingArticle(null);
          }}
          onSaved={() => {
            setEditorOpen(false);
            setEditingArticle(null);
            loadAllData();
          }}
        />
      )}

      {/* EDIT CATEGORY MODAL */}
      {categoryModalOpen && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => {
            setCategoryModalOpen(false);
            setEditingCategory(null);
          }}
          onSaved={() => {
            setCategoryModalOpen(false);
            setEditingCategory(null);
            loadAllData();
          }}
        />
      )}

      {/* DELETE CATEGORY MODAL WITH REASSIGNMENT */}
      {deleteCategoryModalOpen && deletingCategory && (
        <DeleteCategoryModal
          category={deletingCategory}
          allCategories={categories}
          isOpen={deleteCategoryModalOpen}
          onClose={() => {
            setDeleteCategoryModalOpen(false);
            setDeletingCategory(null);
          }}
          onSuccess={() => {
            setDeleteCategoryModalOpen(false);
            setDeletingCategory(null);
            loadAllData();
          }}
        />
      )}

      {/* DELETE ARTICLE CONFIRMATION MODAL */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121212] border border-red-500/30 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400 border-b border-gray-800 pb-3">
              <AlertCircle size={22} />
              <h3 className="text-lg font-bold">Cikk Törlése Megerősítéssel</h3>
            </div>
            <p className="text-sm text-gray-300">
              Biztosan törölni szeretnéd a(z) <strong className="text-white">"{deletingArticle.title}"</strong> című cikket? A művelet nem vonható vissza.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setDeletingArticle(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl"
              >
                Mégse
              </button>
              <button
                onClick={handleDeleteArticleConfirmed}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Törlés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
