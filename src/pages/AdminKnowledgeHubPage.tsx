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
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

interface AdminKnowledgeHubPageProps {
  initialSearchQuery?: string;
}

export default function AdminKnowledgeHubPage({ initialSearchQuery = '' }: AdminKnowledgeHubPageProps) {
  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || siteSettings.adminAccentColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };

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
    <div style={{ color: textColor }} className="space-y-6">
      {/* Header Bar */}
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border shadow-xl">
        <div>
          <span style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }} className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border">
            Oktatási Tudásbázis Kezelő
          </span>
          <h1 style={{ color: textColor }} className="text-2xl font-black mt-2">
            Munkavédelem &amp; Szabályok, Szabványok Kezelése
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Oktatási tartalmak, témakörök, szabványismertetők és csatolt dokumentumok dinamikus adminisztrációja.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenCreateModal('safety')}
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
            className="px-4 py-2.5 border font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:border-accent"
          >
            <ShieldAlert size={15} className="text-amber-400" /> Új Munkavédelmi Tartalom
          </button>
          <button
            onClick={() => handleOpenCreateModal('standards')}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ShieldCheck size={15} /> Új Szabvány / Szabály
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="p-4 rounded-2xl border shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Keresés cím, témakör vagy szabványszám alapján..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={fieldStyle}
            className="w-full border rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-accent"
          />
        </div>

        {/* Section & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Section Filter */}
          <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="flex items-center p-1 rounded-xl text-xs font-bold border">
            <button
              onClick={() => setSectionFilter('all')}
              style={{
                backgroundColor: sectionFilter === 'all' ? cardHighlight : 'transparent',
                color: sectionFilter === 'all' ? '#000000' : textColor,
              }}
              className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Összes modul
            </button>
            <button
              onClick={() => setSectionFilter('safety')}
              style={{
                backgroundColor: sectionFilter === 'safety' ? `${cardHighlight}40` : 'transparent',
                color: sectionFilter === 'safety' ? cardHighlight : textColor,
              }}
              className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Munkavédelem
            </button>
            <button
              onClick={() => setSectionFilter('standards')}
              style={{
                backgroundColor: sectionFilter === 'standards' ? `${cardHighlight}40` : 'transparent',
                color: sectionFilter === 'standards' ? cardHighlight : textColor,
              }}
              className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Szabályok, szabványok
            </button>
          </div>

          {/* Status Filter */}
          <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="flex items-center p-1 rounded-xl text-xs font-bold border">
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                backgroundColor: statusFilter === 'all' ? cardHighlight : 'transparent',
                color: statusFilter === 'all' ? '#000000' : textColor,
              }}
              className="px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Összes státusz
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'published' ? 'bg-emerald-500/30 text-emerald-300 font-extrabold' : 'text-emerald-400'
              }`}
            >
              Publikált
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'draft' ? 'bg-amber-500/30 text-amber-300 font-extrabold' : 'text-amber-400'
              }`}
            >
              Piszkozat
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="rounded-3xl border shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Modul / Típus</th>
                <th className="py-3.5 px-4">Cím &amp; Témakör</th>
                <th className="py-3.5 px-4">Célközönség</th>
                <th className="py-3.5 px-4">Dokumentumok</th>
                <th className="py-3.5 px-4">Státusz</th>
                <th className="py-3.5 px-4 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4">
                    {item.hub_type === 'safety' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-lg text-[11px]">
                        <ShieldAlert size={12} /> Munkavédelem
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold rounded-lg text-[11px]">
                        <ShieldCheck size={12} /> Szabvány
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 max-w-md">
                      <span style={{ color: textColor }} className="font-bold block truncate">{item.title}</span>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="font-medium">{item.topic}</span>
                        {item.standard_code && (
                          <span style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="font-mono border px-1.5 py-0.5 rounded text-amber-300">
                            {item.standard_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.target_audience === 'students' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold rounded text-[10px]">
                        <GraduationCap size={11} /> Tanuló
                      </span>
                    ) : item.target_audience === 'professionals' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700/50 text-slate-200 border border-slate-600 font-bold rounded text-[10px]">
                        <HardHat size={11} /> Szakember
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Mindenki</span>
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="rounded-3xl border max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Header */}
            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-6 rounded-t-3xl sticky top-0 z-10 flex items-center justify-between border-b">
              <h2 style={{ color: textColor }} className="text-lg font-black flex items-center gap-2">
                {formData.hub_type === 'safety' ? <ShieldAlert size={18} style={{ color: cardHighlight }} /> : <ShieldCheck size={18} style={{ color: cardHighlight }} />}
                {editingItem ? 'Oktatási Tartalom Szerkesztése' : 'Új Oktatási Tartalom / Szabvány Felvitele'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Subnav Tabs */}
            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="flex border-b px-6 pt-3 gap-2">
              {[
                { id: 'basic', label: 'Alapadatok' },
                { id: 'content', label: 'Tartalom & Leírás' },
                { id: 'media', label: 'Média & Dokumentumok' },
                { id: 'seo', label: 'SEO' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    backgroundColor: activeTab === t.id ? cardBg : 'transparent',
                    color: activeTab === t.id ? cardHighlight : textColor,
                    borderColor: activeTab === t.id ? cardHighlight : 'transparent',
                  }}
                  className="px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 rounded-t-lg"
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
                      <label className="font-bold text-gray-300 block mb-1">Modul Típusa</label>
                      <select
                        value={formData.hub_type}
                        onChange={(e) => setFormData({ ...formData, hub_type: e.target.value as any })}
                        style={fieldStyle}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                      >
                        <option value="safety" style={{ backgroundColor: cardBg, color: textColor }}>Munkavédelem</option>
                        <option value="standards" style={{ backgroundColor: cardBg, color: textColor }}>Szabályok, szabványok</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Státusz</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        style={fieldStyle}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                      >
                        <option value="published" style={{ backgroundColor: cardBg, color: textColor }}>Publikált</option>
                        <option value="draft" style={{ backgroundColor: cardBg, color: textColor }}>Piszkozat</option>
                        <option value="archived" style={{ backgroundColor: cardBg, color: textColor }}>Archivált</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Cím / Megnevezés *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="pl. Magasban végzett munka és állványozási biztonság"
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Témakör *</label>
                      <input
                        type="text"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        placeholder="pl. Egyéni védőeszközök"
                        style={fieldStyle}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Szabványszám / Jogszabály hivatkozás</label>
                      <input
                        type="text"
                        value={formData.standard_code || ''}
                        onChange={(e) => setFormData({ ...formData, standard_code: e.target.value })}
                        placeholder="pl. MSZ EN 361:2002"
                        style={fieldStyle}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Célközönség</label>
                      <select
                        value={formData.target_audience}
                        onChange={(e) => setFormData({ ...formData, target_audience: e.target.value as any })}
                        style={fieldStyle}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
                      >
                        <option value="all" style={{ backgroundColor: cardBg, color: textColor }}>Mindenki (Tanuló &amp; Szakember)</option>
                        <option value="students" style={{ backgroundColor: cardBg, color: textColor }}>Kifejezetten tanulók részére</option>
                        <option value="professionals" style={{ backgroundColor: cardBg, color: textColor }}>Tapasztalt szakembereknek</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Szerző / Forrás</label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        style={fieldStyle}
                        className="w-full border rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Rövid Összefoglaló *</label>
                    <textarea
                      rows={3}
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Néhány mondatos áttekintés a kártyás nézethez..."
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-2 text-xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Részletes Oktatási Tartalom (Markdown / HTML)</label>
                    <textarea
                      rows={8}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Teljes leírás, alcímekkel és részletes magyarázattal..."
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-amber-400 block mb-1 flex items-center gap-1">
                      <ShieldAlert size={14} /> Fontos Munkavédelmi Figyelmeztetés (Kiemelt kártya)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.important_notes || ''}
                      onChange={(e) => setFormData({ ...formData, important_notes: e.target.value })}
                      placeholder="Kiemelt figyelmeztetés..."
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-blue-400 block mb-1 flex items-center gap-1">
                      <BookOpen size={14} /> Gyakorlati Példa / Esettanulmány (Kék kártya)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.practical_examples || ''}
                      onChange={(e) => setFormData({ ...formData, practical_examples: e.target.value })}
                      placeholder="Gyakorlati szemléltető példa vagy esettanulmány..."
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA & DOCUMENTS */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Kiemelt Kép URL</label>
                      <input
                        type="text"
                        value={formData.image_url || ''}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://..."
                        style={fieldStyle}
                        className="w-full border rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-300 block mb-1">Beágyazott Videó URL</label>
                      <input
                        type="text"
                        value={formData.video_url || ''}
                        onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                        placeholder="https://www.youtube.com/..."
                        style={fieldStyle}
                        className="w-full border rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  {/* Attached Documents Section */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <h4 className="font-extrabold text-white flex items-center gap-1.5">
                      <FileText size={15} style={{ color: cardHighlight }} /> Csatolt PDF Dokumentumok Kezelése
                    </h4>

                    {formData.documents && formData.documents.length > 0 && (
                      <div className="space-y-2">
                        {formData.documents.map((d) => (
                          <div key={d.id} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="border rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white block">{d.name}</span>
                              <span className="text-[11px] font-mono text-gray-400">{d.file_url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(d.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-3.5 rounded-2xl border space-y-2">
                      <span className="font-bold text-gray-300 block text-[11px]">Új Dokumentum Csatolása</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Dokumentum neve (pl. Állványozási_Csekklista.pdf)"
                          value={docNameInput}
                          onChange={(e) => setDocNameInput(e.target.value)}
                          style={fieldStyle}
                          className="border rounded-xl px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Fájl URL (pl. /docs/allvanyozas.pdf)"
                          value={docUrlInput}
                          onChange={(e) => setDocUrlInput(e.target.value)}
                          style={fieldStyle}
                          className="border rounded-xl px-3 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddDocument}
                        style={{ backgroundColor: cardHighlight, color: '#000000' }}
                        className="px-3.5 py-1.5 font-extrabold text-xs rounded-xl hover:opacity-90 cursor-pointer shadow-sm"
                      >
                        Csatolás
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SEO & KEYWORDS */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">SEO Cím (Title)</label>
                    <input
                      type="text"
                      value={formData.seo_title || ''}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder="pl. Munkavédelem és Egyéni Védőeszközök | ÉpítőTudás"
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-300 block mb-1">SEO Leírás (Meta Description)</label>
                    <textarea
                      rows={3}
                      value={formData.seo_description || ''}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="Google keresőben megjelenő leírás..."
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="font-bold text-gray-300 block mb-1">Kulcsszavak</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {formData.keywords?.map((kw) => (
                        <span key={kw} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="px-2.5 py-1 border font-bold text-accent rounded-lg text-[11px] flex items-center gap-1.5">
                          #{kw}
                          <button type="button" onClick={() => handleRemoveKeyword(kw)} className="hover:text-red-400">
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
                        style={fieldStyle}
                        className="border rounded-xl px-3 py-1.5 text-xs flex-1 font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                        className="px-3.5 py-1.5 border font-bold text-xs rounded-xl cursor-pointer hover:border-accent"
                      >
                        Hozzáadás
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border font-bold text-xs rounded-xl cursor-pointer hover:opacity-90"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg cursor-pointer hover:opacity-90"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="rounded-3xl border max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: cardHighlight }}>
                <Eye size={15} /> Élő Előnézet (Admin Preview)
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 text-gray-400 hover:text-white rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <h2 style={{ color: textColor }} className="text-xl font-bold">{previewItem.title}</h2>
              <p style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }} className="leading-relaxed font-medium p-3 rounded-xl border shadow-xs">
                {previewItem.summary}
              </p>
              <div style={{ color: textColor }} className="prose prose-invert text-xs whitespace-pre-line">{previewItem.content}</div>
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                style={{ backgroundColor: cardHighlight, color: '#000000' }}
                className="px-4 py-2 font-bold text-xs rounded-xl cursor-pointer hover:opacity-90"
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
