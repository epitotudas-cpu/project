import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  Building2,
  AlertTriangle,
  Send,
  Save,
  HelpCircle,
  Sparkles,
  Calendar,
  BookOpen,
  Eye,
} from 'lucide-react';
import {
  getArticlesLocal,
  listArticles,
  upsertPartnerArticle,
  deletePartnerArticle,
} from '../services/articleService';
import { listCategories } from '../services/categoryService';
import type { Partner, Category, Article } from '../lib/supabase';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

interface PartnerArticlesPageProps {
  currentPartner: Partner;
  onNavigate?: (page: string, params?: { articleSlug?: string }) => void;
}

export default function PartnerArticlesPage({ currentPartner, onNavigate: _onNavigate }: PartnerArticlesPageProps) {
  void _onNavigate;
  const toast = useToast();
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<Article[]>(() => getArticlesLocal());
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'tags_docs' | 'media'>('basic');
  const [previewItem, setPreviewItem] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Article>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    article_type: 'utmutatok',
    category_id: '',
    subcategory_name: '',
    tags: [],
    author: currentPartner.name || 'Partner Szerkesztőség',
    partner_id: currentPartner.id,
    partner_name: currentPartner.name,
    featured_image: '',
    documents: [],
    status: 'draft',
    rejection_note: null,
  });

  const [tagInput, setTagInput] = useState('');
  const [docTitleInput, setDocTitleInput] = useState('');
  const [docUrlInput, setDocUrlInput] = useState('');

  useEffect(() => {
    let cancelled = false;
    function reload() {
      setAllItems(getArticlesLocal());
    }
    listArticles({ status: 'all', partnerId: currentPartner.id, pageSize: 200 })
      .then((res) => {
        if (!cancelled) setAllItems(res.rows);
      })
      .catch(() => {
        if (!cancelled) reload();
      });
    listCategories().then(setCategories).catch(() => {});
    window.addEventListener('articles-updated', reload);
    return () => {
      cancelled = true;
      window.removeEventListener('articles-updated', reload);
    };
  }, []);

  // 🔒 STRICT SECURITY SCOPING: Filter articles belonging ONLY to currentPartner
  const partnerItems = allItems.filter((i) => i.partner_id === currentPartner.id);

  // Filtered by status, type, and search query
  const filteredItems = partnerItems.filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchType = typeFilter === 'all' || item.article_type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.excerpt && item.excerpt.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some((t: string) => t.toLowerCase().includes(q)));

    return matchStatus && matchType && matchQuery;
  });

  const handleOpenCreateModal = () => {
    const defaultCat = categories[0];
    setEditingItem(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      article_type: 'hirek',
      category_id: defaultCat?.id || '',
      subcategory_name: '',
      tags: ['építőipar', 'partneri hír'],
      author: currentPartner.name,
      partner_id: currentPartner.id,
      partner_name: currentPartner.name,
      featured_image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      documents: [],
      status: 'draft',
      rejection_note: null,
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Article) => {
    // 🔒 SECURITY CHECK: Ensure partner owns item before editing
    if (item.partner_id !== currentPartner.id) {
      toast.error('Biztonsági figyelmeztetés: Csak a saját cikkeit szerkesztheti!');
      return;
    }
    setEditingItem(item);
    setFormData({ ...item });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    const item = partnerItems.find((i) => i.id === id);
    if (!item) return;

    // 🔒 SECURITY CHECK: Ensure partner owns item before deleting
    if (item.partner_id !== currentPartner.id) {
      toast.error('Biztonsági figyelmeztetés: Csak a saját cikkeit törölheti!');
      return;
    }

    setDeleteArticleId(id);
  };

  const handleSaveForm = async (targetStatus: 'draft' | 'pending') => {
    if (saving) return;
    if (!formData.title || !formData.excerpt) {
      toast.error('Kérjük, töltse ki a cikk címét és a rövid összefoglalót!');
      return;
    }

    setSaving(true);

    const generatedSlug =
      formData.slug ||
      formData.title
        .toLowerCase()
        .replace(/[^a-z0-9áéíóöőúüű]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    try {
      const payload: Partial<Article> & { status: 'draft' | 'pending' } = {
        ...(editingItem ? { id: editingItem.id } : {}),
        title: formData.title,
        slug: generatedSlug,
        excerpt: formData.excerpt,
        content: formData.content || '',
        article_type: (formData.article_type as Article['article_type']) || 'hirek',
        category_id: formData.category_id || categories[0]?.id || null,
        subcategory_name: formData.subcategory_name || null,
        tags: formData.tags || [],
        author: formData.author || currentPartner.name,
        featured_image:
          formData.featured_image ||
          editingItem?.featured_image ||
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
        documents: formData.documents || [],
        read_time: editingItem?.read_time || 5,
        status: targetStatus,
      };

      const saved = await upsertPartnerArticle(currentPartner.id, payload);
      if (editingItem) {
        setAllItems((prev) => prev.map((i) => (i.id === editingItem.id ? saved : i)));
        toast.success(targetStatus === 'pending' ? 'Cikk beküldve jóváhagyásra!' : 'Piszkozat mentve!');
      } else {
        setAllItems((prev) => [saved, ...prev]);
        toast.success(targetStatus === 'pending' ? 'Új cikk beküldve jóváhagyásra!' : 'Új piszkozat mentve!');
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hiba történt a cikk mentése során.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const t = tagInput.trim().toLowerCase();
    if (!formData.tags?.includes(t)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), t],
      });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t: string) => t !== tagToRemove),
    });
  };

  const handleAddDocument = () => {
    if (!docTitleInput.trim() || !docUrlInput.trim()) return;
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: docTitleInput.trim(),
      file_url: docUrlInput.trim(),
      doc_type: 'utmutato',
      file_size: 'PDF',
    };
    setFormData({
      ...formData,
      documents: [...(formData.documents || []), newDoc],
    });
    setDocTitleInput('');
    setDocUrlInput('');
  };

  const handleRemoveDocument = (docId: string) => {
    setFormData({
      ...formData,
      documents: formData.documents?.filter((d: { id: string }) => d.id !== docId),
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Building2 size={13} /> {currentPartner.name} • Partner Portal
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Saját Cikkek, Hírek &amp; Útmutatók
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Hozzon létre szakmai híreket, termékújdonságokat és útmutatókat, majd küldje be ellenőrzésre az adminisztrátornak!
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} /> Új Cikk Beküldése
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Keresés saját cikkek között..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-white">Összes típus</option>
            <option value="hirek" className="bg-slate-900 text-white">Hírek</option>
            <option value="ujdonsagok" className="bg-slate-900 text-white">Újdonságok</option>
            <option value="utmutatok" className="bg-slate-900 text-white">Útmutatók</option>
          </select>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center bg-slate-950/70 border border-slate-800 p-1 rounded-xl text-xs font-bold gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-blue-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Összes ({partnerItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'published'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Publikált
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Jóváhagyásra vár
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'draft' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Piszkozat
            </button>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      {filteredItems.length > 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Cikk Címe &amp; Típusa</th>
                  <th className="py-3 px-4">Címkék</th>
                  <th className="py-3 px-4">Dokumentumok</th>
                  <th className="py-3 px-4">Státusz</th>
                  <th className="py-3 px-4 text-right">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.featured_image && (
                          <img
                            src={item.featured_image}
                            alt={item.title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider border ${
                                item.article_type === 'hirek'
                                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                  : item.article_type === 'ujdonsagok'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              }`}
                            >
                              {item.article_type === 'hirek'
                                ? 'Hír'
                                : item.article_type === 'ujdonsagok'
                                ? 'Újdonság'
                                : 'Útmutató'}
                            </span>
                          </div>
                          <span className="font-bold text-white block">{item.title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.tags && item.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold rounded-md">
                              #{t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.documents && item.documents.length > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-400 text-[11px]">
                          <FileText size={13} /> {item.documents.length} PDF
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Nincs</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 size={13} /> Publikált
                        </span>
                      ) : item.status === 'pending' || item.status === 'review' ? (
                        <span className="inline-flex items-center gap-1 text-amber-300 font-bold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          <Clock size={13} /> Jóváhagyásra vár
                        </span>
                      ) : item.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-red-300 font-bold text-[11px] bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                          <AlertTriangle size={13} /> Elutasítva (Javítandó)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold text-[11px]">Piszkozat</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1.5 text-slate-300 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Előnézet"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-300 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Szerkesztés"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Törlés"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/80 rounded-2xl p-10 text-center space-y-3 border border-slate-800">
          <HelpCircle size={32} className="mx-auto text-slate-600" />
          <h4 className="font-bold text-slate-200 text-sm">Önnek jelenleg nincs saját feltöltött cikke ebben a nézetben</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hozzon létre új Hírt, Újdonságot vagy Útmutatót az „Új Cikk Beküldése” gombra kattintva!
          </p>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL FOR PARTNER ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="bg-slate-950 text-white p-5 rounded-t-3xl sticky top-0 z-10 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-black flex items-center gap-2">
                <FileText size={17} className="text-blue-400" />
                {editingItem ? 'Saját Cikk Szerkesztése' : 'Új Cikk Beküldése'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Rejection Alert if editing rejected item */}
            {formData.status === 'rejected' && formData.rejection_note && (
              <div className="bg-red-950/50 border-b border-red-800/60 p-4 space-y-1">
                <span className="font-extrabold text-red-300 text-xs flex items-center gap-1">
                  <AlertTriangle size={14} /> AZ ADMINISZTRÁTOR MEGJEGYZÉSE AZ ELUTASÍTÁSHOZ:
                </span>
                <p className="text-xs text-red-100 font-medium">{formData.rejection_note}</p>
              </div>
            )}

            {/* Subnav Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-3 gap-2 overflow-x-auto">
              {[
                { id: 'basic', label: '1. Alapadatok' },
                { id: 'content', label: '2. Tartalom' },
                { id: 'tags_docs', label: '3. Címkék & PDF-ek' },
                { id: 'media', label: '4. Kiemelt Kép' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
                    activeTab === t.id
                      ? 'border-blue-400 text-blue-400 bg-slate-900 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="p-6 space-y-5 text-xs flex-1 text-slate-100">
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Cikk Típusa *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'hirek', label: 'Hír', icon: Sparkles },
                        { id: 'ujdonsagok', label: 'Újdonság', icon: Calendar },
                        { id: 'utmutatok', label: 'Útmutató', icon: BookOpen },
                      ].map((t) => {
                        const IconComponent = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, article_type: t.id as typeof formData.article_type })}
                            className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              formData.article_type === t.id
                                ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-sm'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <IconComponent size={14} className={formData.article_type === t.id ? 'text-slate-950' : 'text-blue-400'} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Cikk Címe *</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="pl. Új környezetbarát szigetelőanyagok a hazai piacon"
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Kategória *</label>
                      <select
                        value={formData.category_id || ''}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Szerző Megnevezése</label>
                      <input
                        type="text"
                        value={formData.author || ''}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Szakma / Alkategória</label>
                      <input
                        type="text"
                        placeholder="pl. Kőműves / Hőszigetelő"
                        value={formData.subcategory_name || ''}
                        onChange={(e) => setFormData({ ...formData, subcategory_name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Nehézségi Szint</label>
                      <select
                        value={formData.difficulty || 'intermediate'}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as typeof formData.difficulty })}
                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="beginner" className="bg-slate-900 text-white">Kezdő</option>
                        <option value="intermediate" className="bg-slate-900 text-white">Haladó</option>
                        <option value="advanced" className="bg-slate-900 text-white">Tapasztalt</option>
                        <option value="expert" className="bg-slate-900 text-white">Szakértő</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Rövid Összefoglaló (Kivonat) *</label>
                    <textarea
                      rows={3}
                      value={formData.excerpt || ''}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Néhány mondatos bevezető a kártyás megjelenítéshez..."
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Teljes Cikktartalom (Markdown)</label>
                    <textarea
                      rows={10}
                      value={formData.content || ''}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="A cikk teljes szövege alcímekkel (##), felsorolásokkal..."
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: TAGS & DOCS */}
              {activeTab === 'tags_docs' && (
                <div className="space-y-5">
                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-300 block">Címkék (Tags)</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {formData.tags?.map((t: string) => (
                        <span key={t} className="bg-blue-500/10 border border-blue-500/30 text-blue-300 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          #{t}
                          <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-400 cursor-pointer">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Új címke (pl. szigetelés, technológia)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-1.5 text-xs flex-1 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        + Hozzáadás
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <h5 className="font-extrabold text-white flex items-center gap-1.5">
                      <FileText size={15} className="text-blue-400" /> Csatolt PDF Dokumentumok
                    </h5>
                    {formData.documents && formData.documents.length > 0 && (
                      <div className="space-y-1.5">
                        {formData.documents.map((d: { id: string; title: string }) => (
                          <div key={d.id} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
                            <span className="font-bold text-slate-100">{d.title}</span>
                            <button type="button" onClick={() => handleRemoveDocument(d.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Dokumentum címe (pl. Műszaki_Adatlap.pdf)"
                        value={docTitleInput}
                        onChange={(e) => setDocTitleInput(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="PDF Fájl URL (pl. /docs/adatlap.pdf)"
                        value={docUrlInput}
                        onChange={(e) => setDocUrlInput(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      + PDF Csatolása
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Kiemelt Kép URL *</label>
                    <input
                      type="text"
                      value={formData.featured_image || ''}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {formData.featured_image && (
                    <div className="border border-slate-700 rounded-2xl overflow-hidden max-h-48">
                      <img src={formData.featured_image} alt="Kiemelt kép előnézet" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-950/80 border-t border-slate-800 p-4 px-6 rounded-b-3xl flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Mégse
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveForm('draft')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} /> {saving ? 'Mentés...' : 'Mentés Piszkozatként'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveForm('pending')}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} /> {saving ? 'Küldés...' : 'Beküldés Ellenőrzésre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE PREVIEW MODAL ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-700 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-extrabold text-xs text-blue-400 flex items-center gap-1.5">
                <Eye size={15} /> Saját Cikk Előnézete
              </span>
              <button onClick={() => setPreviewItem(null)} className="p-1 text-slate-400 hover:text-white rounded-full cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <h2 className="text-xl font-bold text-white">{previewItem.title}</h2>
              <p className="text-slate-200 font-medium bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                {previewItem.excerpt}
              </p>
              <div className="prose prose-invert text-xs whitespace-pre-line text-slate-300">{previewItem.content}</div>
            </div>
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button onClick={() => setPreviewItem(null)} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer">
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteArticleId)}
        title="Cikk törlése"
        message="Biztosan törölni szeretné ezt a saját cikket?"
        confirmLabel="Törlés"
        destructive
        onConfirm={async () => {
          if (deleteArticleId) {
            try {
              await deletePartnerArticle(deleteArticleId);
              setAllItems((prev) => prev.filter((i) => i.id !== deleteArticleId));
              toast.success('Cikk törölve.');
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : 'Hiba történt a cikk törlésekor.');
            }
          }
          setDeleteArticleId(null);
        }}
        onCancel={() => setDeleteArticleId(null)}
      />
    </div>
  );
}
