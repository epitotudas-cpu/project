import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  FolderTree,
  Edit3,
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
  ArrowUp,
  ArrowDown,
  Settings,
  Newspaper,
  Sparkles,
  BookOpen,
  Layers,
  X,
  Eye,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Clock,
  Calendar,
  User,
} from 'lucide-react';
import type { Article, Category } from '../lib/supabase';
import * as articleService from '../services/articleService';
import { listCategories } from '../services/categoryService';
import {
  getArticleSettings,
  saveArticleSettings,
  getArticleSettingsForType,
  saveArticleSettingsForType,
  type ArticleSettings,
  type TypePageSettings,
} from '../services/articleSettingsService';
import { getArticleRedirects, type ArticleRedirect } from '../services/articleRedirectsService';
import { getRecommendationsMap, saveRecommendationConfig } from '../services/articleRecommendationsService';
import { useToast } from '../components/ToastProvider';
import EditArticleModal from '../components/EditArticleModal';
import EditCategoryModal from '../components/EditCategoryModal';
import DeleteCategoryModal from '../components/DeleteCategoryModal';
import { useSiteSettings, adjustColorBrightness } from '../services/siteSettingsService';

export type ArticleHubSubTab =
  | 'overview'
  | 'list-hirek'
  | 'list-ujdonsagok'
  | 'list-utmutatok'
  | 'list-all'
  | 'categories'
  | 'content'
  | 'detail_layout'
  | 'category_layout'
  | 'recommendations'
  | 'seo';

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
  const [sortMode, setSortMode] = useState<'latest' | 'oldest' | 'title' | 'manual'>('latest');

  // Modals & Selection States
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [lockedArticleTypeForModal, setLockedArticleTypeForModal] = useState<
    'hirek' | 'ujdonsagok' | 'utmutatok' | undefined
  >(undefined);

  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  const [typeSettingsModalType, setTypeSettingsModalType] = useState<'hirek' | 'ujdonsagok' | 'utmutatok' | null>(null);
  const [editingTypeSettings, setEditingTypeSettings] = useState<TypePageSettings | null>(null);

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

  const handleOpenTypeSettingsModal = (type: 'hirek' | 'ujdonsagok' | 'utmutatok') => {
    setTypeSettingsModalType(type);
    setEditingTypeSettings(getArticleSettingsForType(type));
  };

  const handleSaveTypeSettingsConfirmed = () => {
    if (!typeSettingsModalType || !editingTypeSettings) return;
    saveArticleSettingsForType(typeSettingsModalType, editingTypeSettings);
    setArticleSettingsState(getArticleSettings());
    const label = typeSettingsModalType === 'hirek' ? 'Hírek' : typeSettingsModalType === 'ujdonsagok' ? 'Újdonságok' : 'Útmutatók';
    toast.success(`${label} oldal beállításai sikeresen elmentve!`);
    setTypeSettingsModalType(null);
    setEditingTypeSettings(null);
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

  const handleTogglePublishStatus = async (art: Article) => {
    try {
      const newStatus = art.status === 'published' ? 'draft' : 'published';
      await articleService.setArticleStatus(art.id, newStatus);
      toast.success(
        newStatus === 'published'
          ? `"${art.title}" cikk sikeresen közzétéve!`
          : `"${art.title}" cikk piszkozatba helyezve.`
      );
      await loadAllData();
    } catch (err) {
      toast.error('Státuszmódosítás hiba.');
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

  const handleMoveArticleOrder = async (art: Article, direction: 'up' | 'down', currentList: Article[]) => {
    const idx = currentList.findIndex((a) => a.id === art.id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;

    const newList = [...currentList];
    const temp = newList[idx];
    newList[idx] = newList[targetIdx];
    newList[targetIdx] = temp;

    const orderedIds = newList.map((a) => a.id);
    try {
      await articleService.reorderArticles(orderedIds);
      toast.success('Cikkek sorrendje frissítve!');
      await loadAllData();
    } catch (err) {
      toast.error('Sorrend módosítása hiba.');
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

  // Determine current active sub-page category filter
  const currentTabType = subTab === 'list-hirek' ? 'hirek' : subTab === 'list-ujdonsagok' ? 'ujdonsagok' : subTab === 'list-utmutatok' ? 'utmutatok' : 'all';

  // Filtered articles list for current active view
  let filteredArticles = articles.filter((a) => {
    if (currentTabType !== 'all') {
      const artType = a.article_type || 'utmutatok';
      if (artType !== currentTabType) return false;
    }
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

  // Sorting
  if (sortMode === 'latest') {
    filteredArticles = [...filteredArticles].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  } else if (sortMode === 'oldest') {
    filteredArticles = [...filteredArticles].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
  } else if (sortMode === 'title') {
    filteredArticles = [...filteredArticles].sort((a, b) => a.title.localeCompare(b.title, 'hu'));
  }

  // Unique Authors list
  const authorsList = Array.from(new Set(articles.map((a) => a.author).filter(Boolean)));

  // Published articles only (strictly enforced for recommendations)
  const publishedArticles = articles.filter((a) => a.status === 'published');

  // Per-Type Counts for the 3 main cards
  const hirekArticles = articles.filter((a) => a.article_type === 'hirek');
  const hirekTotal = hirekArticles.length;
  const hirekPublished = hirekArticles.filter((a) => a.status === 'published').length;
  const hirekDraft = hirekArticles.filter((a) => a.status === 'draft' || a.status === 'pending' || a.status === 'review').length;

  const ujdonsagArticles = articles.filter((a) => a.article_type === 'ujdonsagok');
  const ujdonsagTotal = ujdonsagArticles.length;
  const ujdonsagPublished = ujdonsagArticles.filter((a) => a.status === 'published').length;
  const ujdonsagDraft = ujdonsagArticles.filter((a) => a.status === 'draft' || a.status === 'pending' || a.status === 'review').length;

  const utmutatoArticles = articles.filter((a) => (a.article_type || 'utmutatok') === 'utmutatok');
  const utmutatoTotal = utmutatoArticles.length;
  const utmutatoPublished = utmutatoArticles.filter((a) => a.status === 'published').length;
  const utmutatoDraft = utmutatoArticles.filter((a) => a.status === 'draft' || a.status === 'pending' || a.status === 'review').length;

  // KPI Calculations
  const totalCount = articles.length;

  const isListTab = subTab.startsWith('list-');

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
                  Szakmai Adminisztráció
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Áttekinthető, elkülönített kezelőközpont a Hírek, Újdonságok és Útmutatók független szerkesztéséhez.
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
                if (subTab === 'list-hirek') setLockedArticleTypeForModal('hirek');
                else if (subTab === 'list-ujdonsagok') setLockedArticleTypeForModal('ujdonsagok');
                else if (subTab === 'list-utmutatok') setLockedArticleTypeForModal('utmutatok');
                else setLockedArticleTypeForModal(undefined);

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
      {/* SUBTAB 0: OVERVIEW HUB (CSEMPÉS KEZDŐLAP 3 NAGY KEZELŐCSEMPÉVEL) */}
      {/* ---------------------------------------------------------------------- */}
      {subTab === 'overview' && (
        <div className="space-y-8">
          {/* SECTION HEADER */}
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Fő Kezelőmodulok</span>
              <span className="text-xs text-gray-400 font-normal">(Válassz egy típust a belépéshez)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Kattints a kártyákra vagy a gyorsgombokra az adott cikk-típus elkülönített kezeléséhez.
            </p>
          </div>

          {/* 3 LARGE MAIN TYPE TILES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TILE 1: HÍREK KEZELÉSE */}
            <div
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="group p-6 border rounded-2xl hover:border-amber-400/60 transition-all duration-200 hover:shadow-2xl hover:shadow-amber-400/5 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
                    <Newspaper size={28} />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20 font-bold uppercase tracking-wider">
                    1. Típus
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                    Hírek Kezelése
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Legfrissebb iparági hírek, piaci elemzések, jogszabályi változások és ágazati bejelentések.
                  </p>
                </div>

                {/* COUNTS COUNTER BADGES */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 border border-gray-800 rounded-xl text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Összes</div>
                    <div className="text-base font-black text-white">{hirekTotal} db</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Publikált</div>
                    <div className="text-base font-black text-green-400">{hirekPublished} db</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Piszkozat</div>
                    <div className="text-base font-black text-amber-400">{hirekDraft} db</div>
                  </div>
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="pt-4 border-t border-gray-800/80 flex items-center gap-2">
                <button
                  onClick={() => {
                    setLockedArticleTypeForModal('hirek');
                    setEditingArticle(null);
                    setEditorOpen(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> + Új Hír
                </button>
                <button
                  onClick={() => setSubTab('list-hirek')}
                  style={{ backgroundColor: cardHighlight }}
                  className="px-4 py-2 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-1"
                >
                  Kezelés &rarr;
                </button>
              </div>
            </div>

            {/* TILE 2: ÚJDONSÁGOK KEZELÉSE */}
            <div
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="group p-6 border rounded-2xl hover:border-amber-400/60 transition-all duration-200 hover:shadow-2xl hover:shadow-amber-400/5 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                    <Sparkles size={28} />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/20 font-bold uppercase tracking-wider">
                    2. Típus
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                    Újdonságok Kezelése
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Új technológiák, innovatív építőanyagok, modern szerszámok és prémium termékek bemutatói.
                  </p>
                </div>

                {/* COUNTS COUNTER BADGES */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 border border-gray-800 rounded-xl text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Összes</div>
                    <div className="text-base font-black text-white">{ujdonsagTotal} db</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Publikált</div>
                    <div className="text-base font-black text-green-400">{ujdonsagPublished} db</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Piszkozat</div>
                    <div className="text-base font-black text-amber-400">{ujdonsagDraft} db</div>
                  </div>
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="pt-4 border-t border-gray-800/80 flex items-center gap-2">
                <button
                  onClick={() => {
                    setLockedArticleTypeForModal('ujdonsagok');
                    setEditingArticle(null);
                    setEditorOpen(true);
                  }}
                  className="flex-1 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> + Új Újdonság
                </button>
                <button
                  onClick={() => setSubTab('list-ujdonsagok')}
                  style={{ backgroundColor: cardHighlight }}
                  className="px-4 py-2 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-1"
                >
                  Kezelés &rarr;
                </button>
              </div>
            </div>

            {/* TILE 3: ÚTMUTATÓK KEZELÉSE */}
            <div
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="group p-6 border rounded-2xl hover:border-amber-400/60 transition-all duration-200 hover:shadow-2xl hover:shadow-amber-400/5 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                    <BookOpen size={28} />
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-bold uppercase tracking-wider">
                    3. Típus
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                    Útmutatók Kezelése
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Gyakorlati lépésről lépésre kivitelezési útmutatók, rétegrendek és munkavédelmi leírások.
                  </p>
                </div>

                {/* COUNTS COUNTER BADGES */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 border border-gray-800 rounded-xl text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Összes</div>
                    <div className="text-base font-black text-white">{utmutatoTotal} db</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Publikált</div>
                    <div className="text-base font-black text-green-400">{utmutatoPublished} db</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Piszkozat</div>
                    <div className="text-base font-black text-amber-400">{utmutatoDraft} db</div>
                  </div>
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="pt-4 border-t border-gray-800/80 flex items-center gap-2">
                <button
                  onClick={() => {
                    setLockedArticleTypeForModal('utmutatok');
                    setEditingArticle(null);
                    setEditorOpen(true);
                  }}
                  className="flex-1 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> + Új Útmutató
                </button>
                <button
                  onClick={() => setSubTab('list-utmutatok')}
                  style={{ backgroundColor: cardHighlight }}
                  className="px-4 py-2 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-1"
                >
                  Kezelés &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* SECONDARY TILES: ÖSSZES CIKK & EGYÉB MODULOK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
            {/* ÖSSZES CIKK SECONDARY CARD */}
            <div
              onClick={() => setSubTab('list-all')}
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="group cursor-pointer p-5 border rounded-2xl hover:border-amber-400/50 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-xl">
                  <Layers size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    Összes Cikk Együttes Áttekintése ({totalCount} db)
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Másodlagos nézet: az összes cikk keresése, szűrése és tömeges ellenőrzése.
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
            </div>

            {/* CIKK KATEGÓRIÁK CARD */}
            <div
              onClick={() => setSubTab('categories')}
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className="group cursor-pointer p-5 border rounded-2xl hover:border-amber-400/50 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl">
                  <FolderTree size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    Cikk Kategóriák Kezelése ({categories.length} kategória)
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Kategóriák nevei, leírásai, színei és törlési áthelyezési szabályai.
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUBTABS 1: HÍREK, ÚJDONSÁGOK, ÚTMUTATÓK ÉS ÖSSZES CIKK DEDIKÁLT NÉZETEI */}
      {/* ---------------------------------------------------------------------- */}
      {isListTab && (
        <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-6 border rounded-2xl space-y-6">
          {/* TOP ARTICLE SUB-HUB NAV TABS */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/40 border border-gray-800 rounded-xl">
            <button
              onClick={() => setSubTab('list-hirek')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
                subTab === 'list-hirek'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Newspaper size={16} /> 1. Hírek Kezelése ({hirekTotal} db)
            </button>

            <button
              onClick={() => setSubTab('list-ujdonsagok')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
                subTab === 'list-ujdonsagok'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Sparkles size={16} /> 2. Újdonságok Kezelése ({ujdonsagTotal} db)
            </button>

            <button
              onClick={() => setSubTab('list-utmutatok')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
                subTab === 'list-utmutatok'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <BookOpen size={16} /> 3. Útmutatók Kezelése ({utmutatoTotal} db)
            </button>

            <button
              onClick={() => setSubTab('list-all')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
                subTab === 'list-all'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Layers size={16} /> Összes Cikk ({totalCount} db)
            </button>
          </div>

          {/* SUB-PAGE HEADER BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-black/40 border border-gray-800 rounded-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {subTab === 'list-hirek' && <>📰 Hírek Kezelése</>}
                {subTab === 'list-ujdonsagok' && <>✨ Újdonságok Kezelése</>}
                {subTab === 'list-utmutatok' && <>📚 Szakmai Útmutatók Kezelése</>}
                {subTab === 'list-all' && <>📂 Összes Cikk Kezelése</>}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {subTab === 'list-hirek' && 'Kizárólag a Hírek típusú cikkek listája, kategórián belüli sorrendezése és egyedi oldalbeállításai.'}
                {subTab === 'list-ujdonsagok' && 'Kizárólag az Újdonságok típusú cikkek listája, kategórián belüli sorrendezése és egyedi oldalbeállításai.'}
                {subTab === 'list-utmutatok' && 'Kizárólag a Szakmai Útmutatók típusú cikkek listája, kategórián belüli sorrendezése és egyedi oldalbeállításai.'}
                {subTab === 'list-all' && 'Az ÉpítőTudás teljes cikkbázisának áttekintése keresővel és szűrőkkel.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {(subTab === 'list-hirek' || subTab === 'list-ujdonsagok' || subTab === 'list-utmutatok') && (
                <button
                  onClick={() =>
                    handleOpenTypeSettingsModal(
                      subTab === 'list-hirek' ? 'hirek' : subTab === 'list-ujdonsagok' ? 'ujdonsagok' : 'utmutatok'
                    )
                  }
                  className="flex items-center gap-2 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-amber-400 text-xs font-bold rounded-xl border border-gray-700 transition-colors cursor-pointer"
                >
                  <Settings size={15} /> Oldal Beállításai
                </button>
              )}

              <button
                onClick={() => {
                  if (subTab === 'list-hirek') setLockedArticleTypeForModal('hirek');
                  else if (subTab === 'list-ujdonsagok') setLockedArticleTypeForModal('ujdonsagok');
                  else if (subTab === 'list-utmutatok') setLockedArticleTypeForModal('utmutatok');
                  else setLockedArticleTypeForModal(undefined);

                  setEditingArticle(null);
                  setEditorOpen(true);
                }}
                style={{ backgroundColor: cardHighlight }}
                className="flex items-center gap-2 px-4 py-2 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all cursor-pointer"
              >
                <Plus size={16} />
                {subTab === 'list-hirek' && 'Új Hír Létrehozása'}
                {subTab === 'list-ujdonsagok' && 'Új Újdonság Létrehozása'}
                {subTab === 'list-utmutatok' && 'Új Útmutató Létrehozása'}
                {subTab === 'list-all' && 'Új Cikk Létrehozása'}
              </button>
            </div>
          </div>

          {/* FILTER & SORT TOOLBAR */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-black/40 border border-gray-800 rounded-xl">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={
                  subTab === 'list-hirek'
                    ? 'Keresés a hírek között...'
                    : subTab === 'list-ujdonsagok'
                    ? 'Keresés az újdonságok között...'
                    : subTab === 'list-utmutatok'
                    ? 'Keresés az útmutatók között...'
                    : 'Keresés az összes cikk között...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
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

            {/* Sort Mode Select */}
            <div>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as any)}
                className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold text-amber-400"
              >
                <option value="latest">Legújabb elöl</option>
                <option value="oldest">Legrégebbi elöl</option>
                <option value="title">Cím szerint (A-Z)</option>
                <option value="manual">Kézi megadott sorrend</option>
              </select>
            </div>
          </div>

          {/* ARTICLE TABLE */}
          <div className="overflow-x-auto border border-gray-800 rounded-xl">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-black/60 border-b border-gray-800 text-gray-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="p-3 w-16">Sorrend</th>
                  <th className="p-3">Borítókép &amp; Cikk Címe</th>
                  <th className="p-3">Kategória</th>
                  <th className="p-3">Státusz</th>
                  <th className="p-3">Szerző</th>
                  <th className="p-3">Publikálva &amp; Módosítva</th>
                  <th className="p-3 text-right">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      Cikkek betöltése...
                    </td>
                  </tr>
                ) : filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      Nem található cikk a megadott keresési feltételekkel.
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((art, idx) => {
                    const catObj = categories.find((c) => c.id === art.category_id);
                    const badge = STATUS_BADGES[art.status || 'draft'] || STATUS_BADGES.draft;
                    const isPub = art.status === 'published';

                    return (
                      <tr key={art.id} className="hover:bg-gray-800/40 transition-colors">
                        {/* ORDERING REORDER BUTTONS */}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-mono text-gray-500 w-4 text-center">#{idx + 1}</span>
                            {subTab !== 'list-all' && (
                              <div className="flex flex-col gap-0.5">
                                <button
                                  disabled={idx === 0}
                                  onClick={() => handleMoveArticleOrder(art, 'up', filteredArticles)}
                                  title="Mozgatás felfelé"
                                  className="p-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 rounded transition-colors"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  disabled={idx === filteredArticles.length - 1}
                                  onClick={() => handleMoveArticleOrder(art, 'down', filteredArticles)}
                                  title="Mozgatás lefelé"
                                  className="p-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 rounded transition-colors"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* COVER THUMBNAIL & TITLE */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-900 border border-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                              {art.featured_image ? (
                                <img src={art.featured_image} alt={art.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={20} className="text-gray-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm leading-snug">{art.title}</div>
                              <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                                <span>/{art.slug}</span>
                                {art.featured && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                                    Kiemelt
                                  </span>
                                )}
                              </div>
                            </div>
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

                        {/* ACTION BUTTONS */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* PREVIEW */}
                            <button
                              onClick={() => setPreviewArticle(art)}
                              title="Előnézet"
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg transition-colors"
                            >
                              <Eye size={15} />
                            </button>

                            {/* PUBLISH TOGGLE */}
                            <button
                              onClick={() => handleTogglePublishStatus(art)}
                              title={isPub ? 'Visszavonás piszkozatba' : 'Közzététel'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isPub ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-800 text-gray-400 hover:text-green-400'
                              }`}
                            >
                              {isPub ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                            </button>

                            {/* EDIT */}
                            <button
                              onClick={() => {
                                setLockedArticleTypeForModal((art.article_type as any) || undefined);
                                setEditingArticle(art);
                                setEditorOpen(true);
                              }}
                              title="Szerkesztés"
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-amber-400 rounded-lg transition-colors"
                            >
                              <Pencil size={15} />
                            </button>

                            {/* DUPLICATE */}
                            <button
                              onClick={() => handleDuplicateArticle(art.id)}
                              title="Duplikálás"
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-lg transition-colors"
                            >
                              <Copy size={15} />
                            </button>

                            {/* ARCHIVE */}
                            <button
                              onClick={() => handleToggleArchiveArticle(art)}
                              title={art.status === 'archived' ? 'Visszaállítás' : 'Archiválás'}
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-lg transition-colors"
                            >
                              <Archive size={15} />
                            </button>

                            {/* DELETE */}
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
                    setLockedArticleTypeForModal((found.article_type as any) || undefined);
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
                            setLockedArticleTypeForModal((art.article_type as any) || undefined);
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

      {/* ARTICLE PREVIEW MODAL */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#121212] border border-blue-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/80">
              <div className="flex items-center gap-2 text-blue-400">
                <Eye size={20} />
                <h3 className="text-base font-bold">Cikk Előnézete</h3>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div>
                <span className="px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 font-bold text-xs uppercase">
                  {previewArticle.article_type === 'hirek'
                    ? 'Hír'
                    : previewArticle.article_type === 'ujdonsagok'
                    ? 'Újdonság'
                    : 'Útmutató'}
                </span>
                <h1 className="text-2xl font-black text-white mt-2 leading-tight">{previewArticle.title}</h1>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1"><User size={13} /> {previewArticle.author || 'Szerkesztőség'}</span>
                  <span className="flex items-center gap-1"><Calendar size={13} /> {new Date(previewArticle.created_at || Date.now()).toLocaleDateString('hu-HU')}</span>
                  <span className="flex items-center gap-1"><Clock size={13} /> {previewArticle.read_time || 5} perc</span>
                </div>
              </div>

              {previewArticle.excerpt && (
                <p className="text-sm text-gray-300 italic p-4 bg-gray-900/60 border-l-4 border-amber-400 rounded-r-xl">
                  {previewArticle.excerpt}
                </p>
              )}

              {previewArticle.featured_image && (
                <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-800">
                  <img src={previewArticle.featured_image} alt={previewArticle.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="text-sm text-gray-200 leading-relaxed space-y-4 whitespace-pre-line border-t border-gray-800 pt-6 font-sans">
                {previewArticle.content?.replace(/\[EPITOTUDAS_BLOCKS_DATA:.*\]$/s, '') || 'Nincs megjeleníthető tartalom.'}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800 flex items-center justify-end gap-3 bg-gray-900/80">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ARTICLE MODAL */}
      {editorOpen && (
        <EditArticleModal
          article={editingArticle}
          categories={categories}
          lockedArticleType={lockedArticleTypeForModal}
          onClose={() => {
            setEditorOpen(false);
            setEditingArticle(null);
            setLockedArticleTypeForModal(undefined);
          }}
          onSaved={() => {
            setEditorOpen(false);
            setEditingArticle(null);
            setLockedArticleTypeForModal(undefined);
            loadAllData();
          }}
        />
      )}

      {/* ISOLATED TYPE PAGE SETTINGS MODAL */}
      {typeSettingsModalType && editingTypeSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121212] border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3 text-amber-400">
                <Settings size={24} />
                <div>
                  <h3 className="text-lg font-bold">
                    {typeSettingsModalType === 'hirek'
                      ? 'Hírek Oldal Elkülenített Beállításai'
                      : typeSettingsModalType === 'ujdonsagok'
                      ? 'Újdonságok Oldal Elkülönített Beállításai'
                      : 'Útmutatók Oldal Elkülönített Beállításai'}
                  </h3>
                  <p className="text-xs text-gray-400">Kizárólag a publikus {typeSettingsModalType} oldal felületi beállításait módosítja.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTypeSettingsModalType(null);
                  setEditingTypeSettings(null);
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">1. Oldalcím (H1)</label>
                <input
                  type="text"
                  value={editingTypeSettings.articlesPageTitle}
                  onChange={(e) =>
                    setEditingTypeSettings({ ...editingTypeSettings, articlesPageTitle: e.target.value })
                  }
                  className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">2. Rövid Bevezető / Leírás</label>
                <textarea
                  rows={2}
                  value={editingTypeSettings.articlesPageDescription}
                  onChange={(e) =>
                    setEditingTypeSettings({ ...editingTypeSettings, articlesPageDescription: e.target.value })
                  }
                  className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">3. Keresőmező Helyőrző Szövege</label>
                <input
                  type="text"
                  value={editingTypeSettings.searchPlaceholderText}
                  onChange={(e) =>
                    setEditingTypeSettings({ ...editingTypeSettings, searchPlaceholderText: e.target.value })
                  }
                  className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">4. Üres Állapot Címe</label>
                  <input
                    type="text"
                    value={editingTypeSettings.emptyStateTitle || ''}
                    onChange={(e) =>
                      setEditingTypeSettings({ ...editingTypeSettings, emptyStateTitle: e.target.value })
                    }
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">5. Üres Állapot Szövege</label>
                  <input
                    type="text"
                    value={editingTypeSettings.emptyStateText}
                    onChange={(e) =>
                      setEditingTypeSettings({ ...editingTypeSettings, emptyStateText: e.target.value })
                    }
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">6. Oldalonkénti Cikkek</label>
                  <input
                    type="number"
                    min={3}
                    max={48}
                    value={editingTypeSettings.articlesPerPage}
                    onChange={(e) =>
                      setEditingTypeSettings({ ...editingTypeSettings, articlesPerPage: Number(e.target.value) })
                    }
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">7. Desktop Grid Oszlopok</label>
                  <select
                    value={editingTypeSettings.desktopGridColumns}
                    onChange={(e) =>
                      setEditingTypeSettings({
                        ...editingTypeSettings,
                        desktopGridColumns: Number(e.target.value) as any,
                      })
                    }
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={2}>2 Oszlop</option>
                    <option value={3}>3 Oszlop (Alapértelmezett)</option>
                    <option value={4}>4 Oszlop</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-400 uppercase mb-1">8. Kiemeltek Kezelése</label>
                  <select
                    value={editingTypeSettings.featuredMode || 'pin'}
                    onChange={(e) =>
                      setEditingTypeSettings({
                        ...editingTypeSettings,
                        featuredMode: e.target.value as any,
                      })
                    }
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="pin">Rögzítés a lista tetején</option>
                    <option value="show">Normál sorrendben</option>
                    <option value="hide">Elrejtés a listából</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">9. Alapértelmezett Rendezési Mód</label>
                <select
                  value={editingTypeSettings.defaultSortMode}
                  onChange={(e) =>
                    setEditingTypeSettings({
                      ...editingTypeSettings,
                      defaultSortMode: e.target.value as any,
                    })
                  }
                  className="w-full bg-black/60 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="latest">Legújabb elöl</option>
                  <option value="oldest">Legrégebbi elöl</option>
                  <option value="featured">Kiemeltek elöl</option>
                  <option value="manual">Kézi megadott sorrend</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => {
                  setTypeSettingsModalType(null);
                  setEditingTypeSettings(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl"
              >
                Mégse
              </button>
              <button
                onClick={handleSaveTypeSettingsConfirmed}
                style={{ backgroundColor: cardHighlight }}
                className="px-5 py-2 text-black font-extrabold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save size={16} /> Beállítások Mentése
              </button>
            </div>
          </div>
        </div>
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
