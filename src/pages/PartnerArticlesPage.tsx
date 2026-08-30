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
  Tag,
  Download,
  Eye,
} from 'lucide-react';
import {
  getArticlesLocal,
  saveArticlesLocal,
  type Article,
} from '../services/articleService';
import { listCategories } from '../services/categoryService';
import type { Partner, Category } from '../lib/supabase';

interface PartnerArticlesPageProps {
  currentPartner: Partner;
  onNavigate?: (page: string, params?: { articleSlug?: string }) => void;
}

export default function PartnerArticlesPage({ currentPartner, onNavigate }: PartnerArticlesPageProps) {
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
    function reload() {
      setAllItems(getArticlesLocal());
    }
    reload();
    listCategories().then(setCategories).catch(() => {});
    window.addEventListener('articles-updated', reload);
    return () => window.removeEventListener('articles-updated', reload);
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
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));

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
      category_id: defaultCat?.id || 'cat-1',
      subcategory_name: '',
      tags: ['építőipar', 'partneri hír'],
      author: currentPartner.name,
      partner_id: currentPartner.id,
      partner_name: currentPartner.name,
      featured_image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
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
      alert('Biztonsági figyelmeztetés: Csak a saját cikkeit szerkesztheti!');
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
      alert('Biztonsági figyelmeztetés: Csak a saját cikkeit törölheti!');
      return;
    }

    if (window.confirm('Biztosan törölni szeretné ezt a saját cikket?')) {
      const updated = allItems.filter((i) => i.id !== id);
      setAllItems(updated);
      saveArticlesLocal(updated);
    }
  };

  const handleSaveForm = (targetStatus: 'draft' | 'pending') => {
    if (!formData.title || !formData.excerpt) {
      alert('Kérjük, töltse ki a cikk címét és a rövid összefoglalót!');
      return;
    }

    const generatedSlug =
      formData.slug ||
      formData.title
        .toLowerCase()
        .replace(/[^a-z0-9áéíóöőúüű]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const now = new Date().toISOString();
    let updatedAll: Article[];

    if (editingItem) {
      updatedAll = allItems.map((i) =>
        i.id === editingItem.id
          ? ({
              ...i,
              ...formData,
              partner_id: currentPartner.id, // Force current partner ownership
              partner_name: currentPartner.name,
              slug: generatedSlug,
              status: targetStatus,
              rejection_note: targetStatus === 'pending' ? null : formData.rejection_note,
              updated_at: now,
            } as Article)
          : i
      );
    } else {
      const newItem: Article = {
        id: `art-partner-${Date.now()}`,
        title: formData.title || '',
        slug: generatedSlug,
        excerpt: formData.excerpt || '',
        content: formData.content || '',
        article_type: (formData.article_type as any) || 'hirek',
        category_id: formData.category_id || categories[0]?.id || 'cat-1',
        subcategory_name: formData.subcategory_name || null,
        tags: formData.tags || [],
        author: formData.author || currentPartner.name,
        partner_id: currentPartner.id, // 🔒 Bound strictly to partner
        partner_name: currentPartner.name,
        featured_image:
          formData.featured_image ||
          'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
        documents: formData.documents || [],
        read_time: 5,
        views: 0,
        rating: 5.0,
        rating_count: 1,
        status: targetStatus,
        rejection_note: null,
        featured: false,
        created_at: now,
        updated_at: now,
      };
      updatedAll = [newItem, ...allItems];
    }

    setAllItems(updatedAll);
    saveArticlesLocal(updatedAll);
    setIsModalOpen(false);
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
      tags: formData.tags?.filter((t) => t !== tagToRemove),
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
      documents: formData.documents?.filter((d) => d.id !== docId),
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-primary font-bold text-xs rounded-full">
            <Building2 size={13} className="text-accent" /> {currentPartner.name} • Partner Portal
          </span>
          <h2 className="text-xl font-extrabold text-gray-900 mt-1">Saját Cikkek, Hírek &amp; Útmutatók</h2>
          <p className="text-xs text-gray-500">
            Hozzon létre szakmai híreket, termékújdonságokat és útmutatókat, majd küldje be ellenőrzésre az adminisztrátornak!
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} /> + Új Cikk Beküldése
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Keresés saját cikkek között..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-gray-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="all">Összes típus</option>
            <option value="hirek">Hírek</option>
            <option value="ujdonsagok">Újdonságok</option>
            <option value="utmutatok">Útmutatók</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center bg-gray-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Összes ({partnerItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'published' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Publikált
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Jóváhagyásra vár
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'draft' ? 'bg-gray-700 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Piszkozat
            </button>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      {filteredItems.length > 0 ? (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Cikk Címe &amp; Típusa</th>
                <th className="py-3 px-4">Címkék</th>
                <th className="py-3 px-4">Dokumentumok</th>
                <th className="py-3 px-4">Státusz</th>
                <th className="py-3 px-4 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {item.featured_image && (
                        <img
                          src={item.featured_image}
                          alt={item.title}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`px-2 py-0.2 text-[10px] font-black rounded-md uppercase tracking-wider ${
                              item.article_type === 'hirek'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : item.article_type === 'ujdonsagok'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                : 'bg-purple-100 text-purple-900 border border-purple-200'
                            }`}
                          >
                            {item.article_type === 'hirek'
                              ? 'Hír'
                              : item.article_type === 'ujdonsagok'
                              ? 'Újdonság'
                              : 'Útmutató'}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 block">{item.title}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {item.tags && item.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md">
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.documents && item.documents.length > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-primary text-[11px]">
                        <FileText size={13} /> {item.documents.length} PDF
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Nincs</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.status === 'published' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle2 size={13} /> Publikált
                      </span>
                    ) : item.status === 'pending' || item.status === 'review' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock size={13} /> Jóváhagyásra vár
                      </span>
                    ) : item.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 text-red-700 font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        <AlertTriangle size={13} /> Elutasítva (Javítandó)
                      </span>
                    ) : (
                      <span className="text-gray-500 font-bold text-[11px]">Piszkozat</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Előnézet"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Szerkesztés"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
      ) : (
        /* Empty State */
        <div className="bg-gray-50 rounded-2xl p-10 text-center space-y-3 border border-gray-200">
          <HelpCircle size={32} className="mx-auto text-gray-400" />
          <h4 className="font-bold text-gray-800 text-sm">Önnek jelenleg nincs saját feltöltött cikke ebben a nézetben</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Hozzon létre új Hírt, Újdonságot vagy Útmutatót az "+ Új Cikk Beküldése" gombra kattintva!
          </p>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL FOR PARTNER ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="bg-primary text-white p-5 rounded-t-3xl sticky top-0 z-10 flex items-center justify-between border-b border-primary-700">
              <h3 className="text-base font-black flex items-center gap-2">
                <FileText size={17} className="text-accent" />
                {editingItem ? 'Saját Cikk Szerkesztése' : 'Új Cikk Beküldése'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Rejection Alert if editing rejected item */}
            {formData.status === 'rejected' && formData.rejection_note && (
              <div className="bg-red-50 border-b border-red-200 p-4 space-y-1">
                <span className="font-extrabold text-red-800 text-xs flex items-center gap-1">
                  <AlertTriangle size={14} /> AZ ADMINISZTRÁTOR MEGJEGYZÉSE AZ ELUTASÍTÁSHOZ:
                </span>
                <p className="text-xs text-red-950 font-medium">{formData.rejection_note}</p>
              </div>
            )}

            {/* Subnav Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 px-5 pt-3 gap-2">
              {[
                { id: 'basic', label: '1. Alapadatok' },
                { id: 'content', label: '2. Tartalom' },
                { id: 'tags_docs', label: '3. Címkék & PDF-ek' },
                { id: 'media', label: '4. Kiemelt Kép' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === t.id ? 'border-accent text-primary bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="p-6 space-y-5 text-xs flex-1">
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Cikk Típusa *</label>
                    <div className="grid grid-cols-3 gap-2">
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
                            onClick={() => setFormData({ ...formData, article_type: t.id as any })}
                            className={`p-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              formData.article_type === t.id
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <IconComponent size={14} className={formData.article_type === t.id ? 'text-accent' : ''} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Cikk Címe *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="pl. Új környezetbarát szigetelőanyagok a hazai piacon"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Kategória *</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Szerző Megnevezése</label>
                      <input
                        type="text"
                        value={formData.author || ''}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Rövid Összefoglaló (Kivonat) *</label>
                    <textarea
                      rows={3}
                      value={formData.excerpt || ''}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Néhány mondatos bevezető a kártyás megjelenítéshez..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Teljes Cikktartalom (Markdown)</label>
                    <textarea
                      rows={10}
                      value={formData.content || ''}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="A cikk teljes szövege alcímekkel (##), felsorolásokkal..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: TAGS & DOCS */}
              {activeTab === 'tags_docs' && (
                <div className="space-y-5">
                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="font-bold text-gray-700 block">Címkék (Tags)</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {formData.tags?.map((t) => (
                        <span key={t} className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          #{t}
                          <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-600 cursor-pointer">
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
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        + Hozzáadás
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h5 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                      <FileText size={15} className="text-accent" /> Csatolt PDF Dokumentumok
                    </h5>
                    {formData.documents && formData.documents.length > 0 && (
                      <div className="space-y-1.5">
                        {formData.documents.map((d) => (
                          <div key={d.id} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between">
                            <span className="font-bold text-gray-900">{d.title}</span>
                            <button type="button" onClick={() => handleRemoveDocument(d.id)} className="text-red-600 p-1 cursor-pointer">
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
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="PDF Fájl URL (pl. /docs/adatlap.pdf)"
                        value={docUrlInput}
                        onChange={(e) => setDocUrlInput(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-xs rounded-xl cursor-pointer"
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
                    <label className="font-bold text-gray-700 block mb-1">Kiemelt Kép URL *</label>
                    <input
                      type="text"
                      value={formData.featured_image || ''}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  {formData.featured_image && (
                    <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-48">
                      <img src={formData.featured_image} alt="Kiemelt kép előnézet" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 rounded-b-3xl flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Mégse
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveForm('draft')}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} /> Mentés Piszkozatként
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveForm('pending')}
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} /> Beküldés Ellenőrzésre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE PREVIEW MODAL ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="font-extrabold text-xs text-primary flex items-center gap-1.5">
                <Eye size={15} /> Saját Cikk Előnézete
              </span>
              <button onClick={() => setPreviewItem(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <h2 className="text-xl font-bold text-gray-900">{previewItem.title}</h2>
              <p className="text-gray-600 font-medium bg-amber-50 p-3 rounded-xl border border-amber-200">
                {previewItem.excerpt}
              </p>
              <div className="prose text-xs whitespace-pre-line text-gray-800">{previewItem.content}</div>
            </div>
            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setPreviewItem(null)} className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl cursor-pointer">
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
