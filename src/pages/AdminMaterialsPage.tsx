import { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  X,
  Building2,
  Award,
  AlertTriangle,
  Plus,
  Wrench,
  Check,
  Ban,
} from 'lucide-react';
import {
  getMaterialsLocal,
  saveMaterialsLocal,
  getMaterialCategoriesLocal,
  type MaterialItem,
  type MaterialCategory,
  type MaterialSpec,
  type MaterialDocument,
} from '../services/materialsService';
import { listPartners } from '../services/partnerService';
import type { Partner } from '../lib/supabase';

interface AdminMaterialsPageProps {
  initialSearchQuery?: string;
}

export default function AdminMaterialsPage({ initialSearchQuery = '' }: AdminMaterialsPageProps) {
  const [items, setItems] = useState<MaterialItem[]>(() => getMaterialsLocal());
  const [categories, setCategories] = useState<MaterialCategory[]>(() => getMaterialCategoriesLocal());
  const [partners, setPartners] = useState<Partner[]>([]);

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'specs' | 'media' | 'seo'>('basic');
  const [previewItem, setPreviewItem] = useState<MaterialItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<MaterialItem | null>(null);
  const [rejectionNoteInput, setRejectionNoteInput] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<MaterialItem>>({
    name: '',
    slug: '',
    category_id: '',
    category_name: '',
    subcategory_name: '',
    brand: '',
    partner_id: '',
    partner_name: '',
    sku: '',
    barcode: '',
    short_description: '',
    full_description: '',
    application_area: '',
    technical_specs: [],
    main_image_url: '',
    gallery_image_urls: [],
    documents: [],
    related_material_ids: [],
    status: 'published',
    rejection_note: '',
    featured: false,
    sort_order: 1,
    views: 0,
    seo_title: '',
    seo_description: '',
    keywords: [],
  });

  // Spec Input State
  const [specLabelInput, setSpecLabelInput] = useState('');
  const [specValueInput, setSpecValueInput] = useState('');
  const [specUnitInput, setSpecUnitInput] = useState('');

  // Document Input State
  const [docTitleInput, setDocTitleInput] = useState('');
  const [docUrlInput, setDocUrlInput] = useState('');
  const [docTypeInput, setDocTypeInput] = useState<MaterialDocument['doc_type']>('muszaki_adatlap');

  // Keyword Input
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    function reload() {
      setItems(getMaterialsLocal());
      setCategories(getMaterialCategoriesLocal());
    }
    reload();

    void listPartners().then((p) => setPartners(p));

    window.addEventListener('materials-updated', reload);
    return () => window.removeEventListener('materials-updated', reload);
  }, []);

  const pendingCount = items.filter((i) => i.status === 'pending_approval').length;

  const handleOpenCreateModal = () => {
    const defaultPartner = partners[0];
    const defaultCat = categories[0];

    setEditingItem(null);
    setFormData({
      name: '',
      slug: '',
      category_id: defaultCat?.id || '',
      category_name: defaultCat?.name || '',
      subcategory_name: '',
      brand: 'Leier',
      partner_id: defaultPartner?.id || 'p-1',
      partner_name: defaultPartner?.name || 'Leier Hungária Kft.',
      sku: '',
      barcode: '',
      short_description: '',
      full_description: '',
      application_area: '',
      technical_specs: [
        { label: 'Méret', value: '250 x 300 x 249', unit: 'mm' },
        { label: 'Nyomószilárdság', value: '11', unit: 'N/mm²' },
      ],
      main_image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop',
      gallery_image_urls: [],
      documents: [],
      related_material_ids: [],
      status: 'published',
      rejection_note: '',
      featured: false,
      sort_order: items.length + 1,
      views: 0,
      seo_title: '',
      seo_description: '',
      keywords: ['építőanyag'],
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MaterialItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Biztosan törölni szeretné ezt az építőanyagot?')) {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      saveMaterialsLocal(updated);
    }
  };

  const handleApprovePublish = (item: MaterialItem) => {
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, status: 'published' as const, rejection_note: null, updated_at: new Date().toISOString() } : i
    );
    setItems(updated);
    saveMaterialsLocal(updated);
  };

  const handleRejectConfirm = () => {
    if (!rejectModalItem) return;
    const updated = items.map((i) =>
      i.id === rejectModalItem.id
        ? {
            ...i,
            status: 'rejected' as const,
            rejection_note: rejectionNoteInput.trim() || 'Kérjük, javítsa a hiányzó műszaki adatokat vagy csatolmányokat.',
            updated_at: new Date().toISOString(),
          }
        : i
    );
    setItems(updated);
    saveMaterialsLocal(updated);
    setRejectModalItem(null);
    setRejectionNoteInput('');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.short_description) {
      alert('Kérjük, adja meg az anyag nevét és a rövid leírást!');
      return;
    }

    const selectedCat = categories.find((c) => c.id === formData.category_id);
    const selectedPart = partners.find((p) => p.id === formData.partner_id);

    const generatedSlug =
      formData.slug ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9áéíóöőúüű]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const now = new Date().toISOString();
    let updatedList: MaterialItem[];

    if (editingItem) {
      updatedList = items.map((i) =>
        i.id === editingItem.id
          ? ({
              ...i,
              ...formData,
              category_name: selectedCat?.name || formData.category_name || '',
              partner_name: selectedPart?.name || formData.partner_name || '',
              slug: generatedSlug,
              updated_at: now,
            } as MaterialItem)
          : i
      );
    } else {
      const newItem: MaterialItem = {
        id: `mat-custom-${Date.now()}`,
        name: formData.name || '',
        slug: generatedSlug,
        category_id: formData.category_id || categories[0]?.id || 'mat-cat-1',
        category_name: selectedCat?.name || 'Általános Anyagok',
        subcategory_name: formData.subcategory_name || null,
        brand: formData.brand || 'Általános Gyártó',
        partner_id: formData.partner_id || partners[0]?.id || 'p-1',
        partner_name: selectedPart?.name || 'Leier Hungária Kft.',
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        short_description: formData.short_description || '',
        full_description: formData.full_description || '',
        application_area: formData.application_area || null,
        technical_specs: formData.technical_specs || [],
        main_image_url:
          formData.main_image_url ||
          'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop',
        gallery_image_urls: formData.gallery_image_urls || [],
        documents: formData.documents || [],
        related_material_ids: formData.related_material_ids || [],
        status: formData.status || 'published',
        rejection_note: formData.rejection_note || null,
        featured: formData.featured || false,
        sort_order: formData.sort_order || 1,
        views: 0,
        seo_title: formData.seo_title || null,
        seo_description: formData.seo_description || null,
        keywords: formData.keywords || [],
        created_at: now,
        updated_at: now,
      };
      updatedList = [newItem, ...items];
    }

    setItems(updatedList);
    saveMaterialsLocal(updatedList);
    setIsModalOpen(false);
  };

  const handleAddSpec = () => {
    if (!specLabelInput.trim() || !specValueInput.trim()) return;
    const newSpec: MaterialSpec = {
      label: specLabelInput.trim(),
      value: specValueInput.trim(),
      unit: specUnitInput.trim() || undefined,
    };
    setFormData({
      ...formData,
      technical_specs: [...(formData.technical_specs || []), newSpec],
    });
    setSpecLabelInput('');
    setSpecValueInput('');
    setSpecUnitInput('');
  };

  const handleRemoveSpec = (idx: number) => {
    setFormData({
      ...formData,
      technical_specs: formData.technical_specs?.filter((_, i) => i !== idx),
    });
  };

  const handleAddDocument = () => {
    if (!docTitleInput.trim() || !docUrlInput.trim()) return;
    const newDoc: MaterialDocument = {
      id: `doc-${Date.now()}`,
      title: docTitleInput.trim(),
      file_url: docUrlInput.trim(),
      doc_type: docTypeInput,
      file_size: docUrlInput.endsWith('.pdf') ? '1.5 MB' : 'DOC',
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

  // Filtered list
  const filteredItems = items.filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchPartner = partnerFilter === 'all' || item.partner_id === partnerFilter;
    const matchCategory = categoryFilter === 'all' || item.category_id === categoryFilter;

    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.brand.toLowerCase().includes(q) ||
      item.partner_name.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q));

    return matchStatus && matchPartner && matchCategory && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-wider">
            Építőipari Anyagkatalógus Kezelő
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-1">
            Építőanyagok &amp; Gyártói Katalógus Kezelése
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Partnerek által feltöltött anyagok jóváhagyása, publikálása, kategóriák és műszaki adatok adminisztrációja.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-primary hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={15} /> + Új Építőanyag Felvitele
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
            placeholder="Keresés anyagnév, márka, partner vagy cikkszám alapján..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Összes
            </button>
            <button
              onClick={() => setStatusFilter('pending_approval')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                statusFilter === 'pending_approval' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-800'
              }`}
            >
              Jóváhagyásra vár {pendingCount > 0 && <span className="bg-amber-800 text-white px-1.5 py-0.2 rounded-full text-[10px]">{pendingCount}</span>}
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
              onClick={() => setStatusFilter('rejected')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'rejected' ? 'bg-red-600 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Elutasított
            </button>
          </div>

          {/* Partner Select */}
          {partners.length > 0 && (
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">Összes partner</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Category Select */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">Összes kategória</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Anyag Neve &amp; Márka</th>
                <th className="py-3.5 px-4">Kategória</th>
                <th className="py-3.5 px-4">Partner (Forgalmazó)</th>
                <th className="py-3.5 px-4">Dokumentumok</th>
                <th className="py-3.5 px-4">Státusz</th>
                <th className="py-3.5 px-4 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3 max-w-sm">
                      <img
                        src={item.main_image_url}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                      <div className="space-y-0.5 truncate">
                        <span className="font-bold text-gray-900 block truncate">{item.name}</span>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span className="font-extrabold text-amber-700 flex items-center gap-0.5">
                            <Award size={11} /> {item.brand}
                          </span>
                          {item.sku && <span className="font-mono text-gray-400">SKU: {item.sku}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-800 font-bold rounded-md text-[11px]">
                      {item.category_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-gray-800 text-[11px]">
                      <Building2 size={12} className="text-accent" /> {item.partner_name}
                    </span>
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
                        <CheckCircle2 size={13} /> Publikált
                      </span>
                    ) : item.status === 'pending_approval' ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock size={13} /> Jóváhagyásra vár
                      </span>
                    ) : item.status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 text-red-700 font-bold text-[11px]">
                        <Ban size={13} /> Elutasítva
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Piszkozat</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Approve Button */}
                      {item.status !== 'published' && (
                        <button
                          onClick={() => handleApprovePublish(item)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Jóváhagyás és Publikálás"
                        >
                          <Check size={12} /> Publikálás
                        </button>
                      )}

                      {/* Reject Button */}
                      {item.status === 'pending_approval' && (
                        <button
                          onClick={() => {
                            setRejectModalItem(item);
                            setRejectionNoteInput('');
                          }}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Elutasítás indoklással"
                        >
                          <Ban size={12} /> Elutasítás
                        </button>
                      )}

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
                <Layers size={18} className="text-accent" />
                {editingItem ? 'Építőanyag Szerkesztése' : 'Új Építőanyag Felvitele'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Subnav Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 gap-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'basic', label: 'Alapadatok' },
                { id: 'content', label: 'Leírás & Alkalmazás' },
                { id: 'specs', label: 'Műszaki Adatok' },
                { id: 'media', label: 'Képek & PDF-ek' },
                { id: 'seo', label: 'SEO' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
                    activeTab === t.id ? 'border-accent text-primary bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 text-xs">
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Anyag Neve *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="pl. LeierPLAN 30 Csiszolt Kerámia Falazóelem"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Gyártó / Márka *</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="pl. Leier, Austrotherm, Cemex"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Forgalmazó Partner</label>
                      <select
                        value={formData.partner_id}
                        onChange={(e) => {
                          const p = partners.find((part) => part.id === e.target.value);
                          setFormData({ ...formData, partner_id: e.target.value, partner_name: p?.name || '' });
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Kategória *</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => {
                          const cat = categories.find((c) => c.id === e.target.value);
                          setFormData({ ...formData, category_id: e.target.value, category_name: cat?.name || '' });
                        }}
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
                      <label className="font-bold text-gray-700 block mb-1">Alkategória</label>
                      <input
                        type="text"
                        value={formData.subcategory_name || ''}
                        onChange={(e) => setFormData({ ...formData, subcategory_name: e.target.value })}
                        placeholder="pl. Kerámia Falazóelemek"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Cikkszám / SKU</label>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="LEIER-PL30-001"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Státusz</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      >
                        <option value="published">Publikált</option>
                        <option value="pending_approval">Jóváhagyásra vár</option>
                        <option value="draft">Piszkozat</option>
                        <option value="rejected">Elutasítva</option>
                        <option value="archived">Archivált</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.featured || false}
                          onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                          className="rounded text-accent focus:ring-accent"
                        />
                        Kiemelt anyag a főoldalon
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT & APPLICATION */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Rövid Leírás *</label>
                    <textarea
                      rows={3}
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      placeholder="Néhány mondatos összefoglaló a kártyás megjelenítéshez..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Részletes Termékleírás (Markdown / HTML)</label>
                    <textarea
                      rows={8}
                      value={formData.full_description}
                      onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                      placeholder="A termék teljes bemutatása, előnyei, kivitelezési tanácsok..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Alkalmazási Terület</label>
                    <textarea
                      rows={2}
                      value={formData.application_area || ''}
                      onChange={(e) => setFormData({ ...formData, application_area: e.target.value })}
                      placeholder="pl. Külső teherhordó falak és pillérek építésére..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: TECHNICAL SPECS */}
              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Wrench size={15} className="text-accent" /> Műszaki Paraméterek Megadása
                  </h4>

                  {formData.technical_specs && formData.technical_specs.length > 0 && (
                    <div className="space-y-2">
                      {formData.technical_specs.map((spec, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-gray-700">{spec.label}:</span>{' '}
                            <span className="font-extrabold text-gray-900">{spec.value} {spec.unit || ''}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(idx)}
                            className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
                    <span className="font-bold text-gray-700 block text-[11px]">Új Műszaki Paraméter Hozzáadása</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Megnevezés (pl. Hővezetési tényező λ)"
                        value={specLabelInput}
                        onChange={(e) => setSpecLabelInput(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Érték (pl. 0.031)"
                        value={specValueInput}
                        onChange={(e) => setSpecValueInput(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Mértékegység (pl. W/mK)"
                        value={specUnitInput}
                        onChange={(e) => setSpecUnitInput(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-800 cursor-pointer"
                    >
                      + Specifikáció Hozzáadása
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA & DOCUMENTS */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Fő Kép URL *</label>
                    <input
                      type="text"
                      value={formData.main_image_url}
                      onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  {/* Attached Documents Section */}
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <h4 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                      <FileText size={15} className="text-accent" /> Csatolt PDF Dokumentumok
                    </h4>

                    {formData.documents && formData.documents.length > 0 && (
                      <div className="space-y-2">
                        {formData.documents.map((d) => (
                          <div key={d.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-gray-900 block">{d.title}</span>
                              <span className="text-[11px] font-mono text-gray-500">{d.file_url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(d.id)}
                              className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
                      <span className="font-bold text-gray-700 block text-[11px]">Új PDF Dokumentum Csatolása</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Dokumentum címe (pl. Műszaki_Adatlap.pdf)"
                          value={docTitleInput}
                          onChange={(e) => setDocTitleInput(e.target.value)}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Fájl URL (pl. /docs/leierplan.pdf)"
                          value={docUrlInput}
                          onChange={(e) => setDocUrlInput(e.target.value)}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                        />
                        <select
                          value={docTypeInput}
                          onChange={(e) => setDocTypeInput(e.target.value as any)}
                          className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium"
                        >
                          <option value="muszaki_adatlap">Műszaki Adatlap</option>
                          <option value="teljesitmenynyilatkozat">Teljesítménynyilatkozat</option>
                          <option value="biztonsagi_adatlap">Biztonsági Adatlap</option>
                          <option value="utmutato">Alkalmazástechnikai Útmutató</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddDocument}
                        className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-800 cursor-pointer"
                      >
                        + Dokumentum Csatolása
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: SEO */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seo_title || ''}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder="LeierPLAN 30 Csiszolt Kerámia Falazóelem | ÉpítőTudás"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">SEO Meta Description</label>
                    <textarea
                      rows={3}
                      value={formData.seo_description || ''}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="Google keresési leírás..."
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
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                keywords: formData.keywords?.filter((k) => k !== kw),
                              })
                            }
                            className="hover:text-red-600"
                          >
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
                            if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
                              setFormData({
                                ...formData,
                                keywords: [...(formData.keywords || []), keywordInput.trim()],
                              });
                              setKeywordInput('');
                            }
                          }
                        }}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
                            setFormData({
                              ...formData,
                              keywords: [...(formData.keywords || []), keywordInput.trim()],
                            });
                            setKeywordInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-xs rounded-xl cursor-pointer"
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

      {/* ── REJECTION REASON MODAL ── */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm">
              <AlertTriangle size={18} /> Beküldött Építőanyag Elutasítása
            </div>
            <p className="text-xs text-gray-600">
              Kérjük, adja meg az elutasítás okát, amit a partner látni fog a felületén a javítás érdekében:
            </p>
            <textarea
              rows={3}
              value={rejectionNoteInput}
              onChange={(e) => setRejectionNoteInput(e.target.value)}
              placeholder="pl. Hiányzik a kötelező teljesítménynyilatkozat PDF csatolmány..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Mégse
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Elutasítás Beküldése
              </button>
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
                <Eye size={15} /> Élő Előnézet (Admin Preview)
              </span>
              <button onClick={() => setPreviewItem(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <h2 className="text-xl font-bold text-gray-900">{previewItem.name}</h2>
              <p className="text-gray-600 font-medium bg-amber-50 p-3 rounded-xl border border-amber-200">
                {previewItem.short_description}
              </p>
              <div className="prose text-xs whitespace-pre-line text-gray-800">{previewItem.full_description}</div>
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
