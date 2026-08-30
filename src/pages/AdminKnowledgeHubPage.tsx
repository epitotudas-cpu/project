import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  FileText,
  X,
  BookOpen,
  GraduationCap,
  HardHat,
} from 'lucide-react';
import {
  getKnowledgeItemsLocal,
  saveKnowledgeItemsLocal,
  type EducationalContentItem,
  type EducationalDocument,
} from '../services/knowledgeHubService';

interface AdminKnowledgeHubPageProps {
  initialSearchQuery?: string;
}

export default function AdminKnowledgeHubPage({ initialSearchQuery = '' }: AdminKnowledgeHubPageProps) {
  const [items, setItems] = useState<EducationalContentItem[]>(() => getKnowledgeItemsLocal());
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sectionFilter, setSectionFilter] = useState<'all' | 'safety' | 'standards'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationalContentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'media' | 'seo'>('basic');
  const [previewItem, setPreviewItem] = useState<EducationalContentItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<EducationalContentItem>>({
    hub_type: 'safety',
    title: '',
    slug: '',
    summary: '',
    content: '',
    important_notes: '',
    practical_examples: '',
    topic: 'Építőipari munkavédelem',
    standard_code: '',
    target_audience: 'all',
    difficulty_level: 'beginner',
    keywords: [],
    tags: [],
    documents: [],
    author: 'ÉpítőTudás Szakértői Csoport',
    status: 'published',
    featured: false,
    sort_order: 1,
    views: 0,
    seo_title: '',
    seo_description: '',
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [docNameInput, setDocNameInput] = useState('');
  const [docUrlInput, setDocUrlInput] = useState('');
  const [docDescInput, setDocDescInput] = useState('');

  useEffect(() => {
    function reload() {
      setItems(getKnowledgeItemsLocal());
    }
    reload();
    window.addEventListener('knowledge-hub-updated', reload);
    return () => window.removeEventListener('knowledge-hub-updated', reload);
  }, []);

  const handleOpenCreateModal = (hubType: 'safety' | 'standards' = 'safety') => {
    setEditingItem(null);
    setFormData({
      hub_type: hubType,
      title: '',
      slug: '',
      summary: '',
      content: '',
      important_notes: '',
      practical_examples: '',
      topic: hubType === 'safety' ? 'Egyéni védőeszközök' : 'Munkavédelmi szabványok',
      standard_code: '',
      target_audience: 'all',
      difficulty_level: 'beginner',
      keywords: ['munkavédelem', 'építőipar'],
      tags: ['oktatás'],
      documents: [],
      author: 'ÉpítőTudás Szakértői Csoport',
      status: 'published',
      featured: false,
      sort_order: items.length + 1,
      views: 0,
      seo_title: '',
      seo_description: '',
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: EducationalContentItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Biztosan törölni szeretné ezt az oktatási tartalmat?')) {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      saveKnowledgeItemsLocal(updated);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.summary) {
      alert('Kérjük, töltse ki a címet és a rövid összefoglalót!');
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
    let updatedList: EducationalContentItem[];

    if (editingItem) {
      updatedList = items.map((i) =>
        i.id === editingItem.id
          ? ({
              ...i,
              ...formData,
              slug: generatedSlug,
              updated_at: now,
            } as EducationalContentItem)
          : i
      );
    } else {
      const newItem: EducationalContentItem = {
        id: `kh-custom-${Date.now()}`,
        hub_type: formData.hub_type || 'safety',
        title: formData.title || '',
        slug: generatedSlug,
        summary: formData.summary || '',
        content: formData.content || '',
        important_notes: formData.important_notes || null,
        practical_examples: formData.practical_examples || null,
        category_id: formData.category_id || null,
        category_name: formData.category_name || null,
        topic: formData.topic || 'Általános témakör',
        standard_code: formData.standard_code || null,
        target_audience: formData.target_audience || 'all',
        difficulty_level: formData.difficulty_level || 'beginner',
        keywords: formData.keywords || [],
        tags: formData.tags || [],
        documents: formData.documents || [],
        related_rule_ids: formData.related_rule_ids || [],
        related_item_ids: formData.related_item_ids || [],
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
        author: formData.author || 'Adminisztrátor',
        status: formData.status || 'published',
        featured: formData.featured || false,
        sort_order: formData.sort_order || 1,
        views: formData.views || 0,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        created_at: now,
        updated_at: now,
      };
      updatedList = [newItem, ...items];
    }

    setItems(updatedList);
    saveKnowledgeItemsLocal(updatedList);
    setIsModalOpen(false);
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const kw = keywordInput.trim();
    if (!formData.keywords?.includes(kw)) {
      setFormData({ ...formData, keywords: [...(formData.keywords || []), kw] });
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter((k) => k !== kw),
    });
  };

  const handleAddDocument = () => {
    if (!docNameInput.trim() || !docUrlInput.trim()) {
      alert('Kérjük, adja meg a dokumentum nevét és a fájl URL-jét!');
      return;
    }
    const newDoc: EducationalDocument = {
      id: `doc-${Date.now()}`,
      name: docNameInput.trim(),
      file_url: docUrlInput.trim(),
      file_type: docUrlInput.endsWith('.pdf') ? 'pdf' : 'doc',
      description: docDescInput.trim() || undefined,
    };
    setFormData({
      ...formData,
      documents: [...(formData.documents || []), newDoc],
    });
    setDocNameInput('');
    setDocUrlInput('');
    setDocDescInput('');
  };

  const handleRemoveDocument = (docId: string) => {
    setFormData({
      ...formData,
      documents: formData.documents?.filter((d) => d.id !== docId),
    });
  };

  // Filtered Items for Table
  const filteredItems = items.filter((item) => {
    const matchesSection = sectionFilter === 'all' || item.hub_type === sectionFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      (item.standard_code && item.standard_code.toLowerCase().includes(q)) ||
      item.topic.toLowerCase().includes(q);

    return matchesSection && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Oktatási Tudásbázis Kezelő
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            Munkavédelem &amp; Szabályok, Szabványok Kezelése
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Oktatási tartalmak, témakörök, szabványismertetők és csatolt dokumentumok dinamikus adminisztrációja.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenCreateModal('safety')}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldAlert size={15} /> + Új Munkavédelmi Tartalom
          </button>
          <button
            onClick={() => handleOpenCreateModal('standards')}
            className="px-4 py-2.5 bg-primary hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck size={15} /> + Új Szabvány / Szabály
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Keresés cím, témakör vagy szabványszám alapján..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-accent"
          />
        </div>

        {/* Section & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Section Filter */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSectionFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                sectionFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Összes modul
            </button>
            <button
              onClick={() => setSectionFilter('safety')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                sectionFilter === 'safety' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Munkavédelem
            </button>
            <button
              onClick={() => setSectionFilter('standards')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                sectionFilter === 'standards' ? 'bg-primary text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Szabályok, szabványok
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Összes státusz
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
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'draft' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Piszkozat
            </button>
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Modul / Típus</th>
                <th className="py-3.5 px-4">Cím &amp; Témakör</th>
                <th className="py-3.5 px-4">Célközönség</th>
                <th className="py-3.5 px-4">Dokumentumok</th>
                <th className="py-3.5 px-4">Státusz</th>
                <th className="py-3.5 px-4 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    {item.hub_type === 'safety' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-lg text-[11px]">
                        <ShieldAlert size={12} /> Munkavédelem
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-[11px]">
                        <ShieldCheck size={12} /> Szabvány
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 max-w-md">
                      <span className="font-bold text-gray-900 block truncate">{item.title}</span>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span className="font-medium">{item.topic}</span>
                        {item.standard_code && (
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                            {item.standard_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.target_audience === 'students' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px]">
                        <GraduationCap size={11} /> Tanuló
                      </span>
                    ) : item.target_audience === 'professionals' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded text-[10px]">
                        <HardHat size={11} /> Szakember
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[11px]">Mindenki</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.documents && item.documents.length > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-primary text-[11px]">
                        <FileText size={13} /> {item.documents.length} db PDF
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Nincs</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.status === 'published' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle size={13} /> Publikált
                      </span>
                    ) : item.status === 'draft' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                        <Clock size={13} /> Piszkozat
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Archivált</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Előnézet"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="Szerkesztés"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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

      {/* ── CREATE / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="bg-primary text-white p-6 rounded-t-3xl sticky top-0 z-10 flex items-center justify-between border-b border-primary-700">
              <h2 className="text-lg font-black flex items-center gap-2">
                {formData.hub_type === 'safety' ? <ShieldAlert size={18} className="text-accent" /> : <ShieldCheck size={18} className="text-accent" />}
                {editingItem ? 'Oktatási Tartalom Szerkesztése' : 'Új Oktatási Tartalom / Szabvány Felvitele'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Subnav Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 gap-2">
              {[
                { id: 'basic', label: 'Alapadatok' },
                { id: 'content', label: 'Tartalom & Leírás' },
                { id: 'media', label: 'Média & Dokumentumok' },
                { id: 'seo', label: 'SEO' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === t.id ? 'border-accent text-primary bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 text-xs">
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Modul Típusa</label>
                      <select
                        value={formData.hub_type}
                        onChange={(e) => setFormData({ ...formData, hub_type: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <option value="safety">Munkavédelem</option>
                        <option value="standards">Szabályok, szabványok</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Státusz</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <option value="published">Publikált</option>
                        <option value="draft">Piszkozat</option>
                        <option value="archived">Archivált</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Cím / Megnevezés *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="pl. Magasban végzett munka és állványozási biztonság"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Témakör *</label>
                      <input
                        type="text"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        placeholder="pl. Egyéni védőeszközök"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Szabványszám / Jogszabály hivatkozás</label>
                      <input
                        type="text"
                        value={formData.standard_code || ''}
                        onChange={(e) => setFormData({ ...formData, standard_code: e.target.value })}
                        placeholder="pl. MSZ EN 361:2002"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Célközönség</label>
                      <select
                        value={formData.target_audience}
                        onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <option value="all">Mindenki (Tanuló &amp; Szakember)</option>
                        <option value="students">Kifejezetten tanulók részére</option>
                        <option value="professionals">Tapasztalt szakembereknek</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Szerző / Forrás</label>
                      <input
                        type="text"
                        value={formData.author}
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
                    <label className="font-bold text-gray-700 block mb-1">Rövid Összefoglaló *</label>
                    <textarea
                      rows={3}
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Néhány mondatos áttekintés a kártyás nézethez..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Részletes Oktatási Tartalom (Markdown / HTML)</label>
                    <textarea
                      rows={8}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Teljes leírás, alcímekkel és részletes magyarázattal..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-red-700 block mb-1 flex items-center gap-1">
                      <ShieldAlert size={14} /> Fontos Munkavédelmi Figyelmeztetés (Kiemelt kártya)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.important_notes || ''}
                      onChange={(e) => setFormData({ ...formData, important_notes: e.target.value })}
                      placeholder="Piros kiemelt figyelmeztetés..."
                      className="w-full bg-red-50/50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-blue-700 block mb-1 flex items-center gap-1">
                      <BookOpen size={14} /> Gyakorlati Példa / Esettanulmány (Kék kártya)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.practical_examples || ''}
                      onChange={(e) => setFormData({ ...formData, practical_examples: e.target.value })}
                      placeholder="Gyakorlati szemléltető példa vagy esettanulmány..."
                      className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-900 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA & DOCUMENTS */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Kiemelt Kép URL</label>
                      <input
                        type="text"
                        value={formData.image_url || ''}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Beágyazott Videó URL</label>
                      <input
                        type="text"
                        value={formData.video_url || ''}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        placeholder="https://www.youtube.com/..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* Attached Documents Section */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h4 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                      <FileText size={15} className="text-accent" /> Csatolt PDF Dokumentumok Kezelése
                    </h4>

                    {formData.documents && formData.documents.length > 0 && (
                      <div className="space-y-2">
                        {formData.documents.map((d) => (
                          <div key={d.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-gray-900 block">{d.name}</span>
                              <span className="text-[11px] font-mono text-gray-500">{d.file_url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(d.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
                      <span className="font-bold text-gray-700 block text-[11px]">Új Dokumentum Csatolása</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Dokumentum neve (pl. Állványozási_Csekklista.pdf)"
                          value={docNameInput}
                          onChange={(e) => setDocNameInput(e.target.value)}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Fájl URL (pl. /docs/allvanyozas.pdf)"
                          value={docUrlInput}
                          onChange={(e) => setDocUrlInput(e.target.value)}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddDocument}
                        className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-800 cursor-pointer"
                      >
                        + Csatolás
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SEO & KEYWORDS */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">SEO Cím (Title)</label>
                    <input
                      type="text"
                      value={formData.seo_title || ''}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder="pl. Munkavédelem és Egyéni Védőeszközök | ÉpítőTudás"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">SEO Leírás (Meta Description)</label>
                    <textarea
                      rows={3}
                      value={formData.seo_description || ''}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="Google keresőben megjelenő leírás..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Kulcsszavak</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {formData.keywords?.map((kw) => (
                        <span key={kw} className="bg-primary/10 text-primary-950 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          #{kw}
                          <button type="button" onClick={() => handleRemoveKeyword(kw)} className="hover:text-red-600">
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Új kulcsszó hozzáadása..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-xs rounded-xl"
                      >
                        Hozzáadás
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Mentés &amp; Publikálás
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LIVE PREVIEW MODAL ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="font-extrabold text-xs text-primary flex items-center gap-1.5">
                <Eye size={15} /> Élő Előnézet (Admin Preview)
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <h2 className="text-xl font-bold text-gray-900">{previewItem.title}</h2>
              <p className="text-gray-600 leading-relaxed font-medium bg-amber-50 p-3 rounded-xl border border-amber-200">
                {previewItem.summary}
              </p>
              <div className="prose text-xs whitespace-pre-line text-gray-800">{previewItem.content}</div>
            </div>
            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
