import { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  X,
  Building2,
  Award,
  AlertTriangle,
  Send,
  Save,
  HelpCircle,
  Wrench,
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
import type { Partner } from '../lib/supabase';

interface PartnerMaterialsPageProps {
  currentPartner: Partner;
  onNavigateHome?: () => void;
}

export default function PartnerMaterialsPage({ currentPartner }: PartnerMaterialsPageProps) {
  const [allItems, setAllItems] = useState<MaterialItem[]>(() => getMaterialsLocal());
  const [categories] = useState<MaterialCategory[]>(() => getMaterialCategoriesLocal());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'specs' | 'media'>('basic');

  // Form State
  const [formData, setFormData] = useState<Partial<MaterialItem>>({
    name: '',
    slug: '',
    category_id: '',
    category_name: '',
    subcategory_name: '',
    brand: currentPartner.name || '',
    partner_id: currentPartner.id,
    partner_name: currentPartner.name,
    sku: '',
    barcode: '',
    short_description: '',
    full_description: '',
    application_area: '',
    technical_specs: [],
    main_image_url: '',
    gallery_image_urls: [],
    documents: [],
    status: 'draft',
    rejection_note: null,
  });

  const [specLabelInput, setSpecLabelInput] = useState('');
  const [specValueInput, setSpecValueInput] = useState('');
  const [specUnitInput, setSpecUnitInput] = useState('');

  const [docTitleInput, setDocTitleInput] = useState('');
  const [docUrlInput, setDocUrlInput] = useState('');

  useEffect(() => {
    function reload() {
      setAllItems(getMaterialsLocal());
    }
    reload();
    window.addEventListener('materials-updated', reload);
    return () => window.removeEventListener('materials-updated', reload);
  }, []);

  // 🔒 STRICT SECURITY SCOPING: Filter items belonging ONLY to currentPartner
  const partnerItems = allItems.filter((i) => i.partner_id === currentPartner.id);

  // Filtered by status and search query
  const filteredItems = partnerItems.filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category_name.toLowerCase().includes(q) ||
      (item.sku && item.sku.toLowerCase().includes(q));

    return matchStatus && matchQuery;
  });

  const handleOpenCreateModal = () => {
    const defaultCat = categories[0];
    setEditingItem(null);
    setFormData({
      name: '',
      slug: '',
      category_id: defaultCat?.id || 'mat-cat-1',
      category_name: defaultCat?.name || 'Szigetelőanyagok',
      subcategory_name: '',
      brand: currentPartner.name,
      partner_id: currentPartner.id,
      partner_name: currentPartner.name,
      sku: '',
      short_description: '',
      full_description: '',
      application_area: '',
      technical_specs: [],
      main_image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop',
      gallery_image_urls: [],
      documents: [],
      status: 'draft',
      rejection_note: null,
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MaterialItem) => {
    // 🔒 SECURITY CHECK: Ensure partner owns item before editing
    if (item.partner_id !== currentPartner.id) {
      alert('Biztonsági figyelmeztetés: Csak a saját anyagait szerkesztheti!');
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
      alert('Biztonsági figyelmeztetés: Csak a saját anyagait törölheti!');
      return;
    }

    if (window.confirm('Biztosan törölni szeretné ezt a saját anyagot?')) {
      const updated = allItems.filter((i) => i.id !== id);
      setAllItems(updated);
      saveMaterialsLocal(updated);
    }
  };

  const handleSaveForm = (targetStatus: 'draft' | 'pending_approval') => {
    if (!formData.name || !formData.short_description) {
      alert('Kérjük, töltse ki az anyag nevét és a rövid leírást!');
      return;
    }

    const selectedCat = categories.find((c) => c.id === formData.category_id);
    const generatedSlug =
      formData.slug ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9áéíóöőúüű]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const now = new Date().toISOString();
    let updatedAll: MaterialItem[];

    if (editingItem) {
      updatedAll = allItems.map((i) =>
        i.id === editingItem.id
          ? ({
              ...i,
              ...formData,
              partner_id: currentPartner.id, // Force current partner ownership
              partner_name: currentPartner.name,
              category_name: selectedCat?.name || formData.category_name || '',
              slug: generatedSlug,
              status: targetStatus,
              rejection_note: targetStatus === 'pending_approval' ? null : formData.rejection_note,
              updated_at: now,
            } as MaterialItem)
          : i
      );
    } else {
      const newItem: MaterialItem = {
        id: `mat-partner-${Date.now()}`,
        name: formData.name || '',
        slug: generatedSlug,
        category_id: formData.category_id || categories[0]?.id || 'mat-cat-1',
        category_name: selectedCat?.name || 'Szigetelőanyagok',
        subcategory_name: formData.subcategory_name || null,
        brand: formData.brand || currentPartner.name,
        partner_id: currentPartner.id, // 🔒 Bound strictly to partner
        partner_name: currentPartner.name,
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
        related_material_ids: [],
        status: targetStatus,
        rejection_note: null,
        featured: false,
        sort_order: partnerItems.length + 1,
        views: 0,
        seo_title: null,
        seo_description: null,
        keywords: [],
        created_at: now,
        updated_at: now,
      };
      updatedAll = [newItem, ...allItems];
    }

    setAllItems(updatedAll);
    saveMaterialsLocal(updatedAll);
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
      doc_type: 'muszaki_adatlap',
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
          <h2 className="text-xl font-extrabold text-gray-900 mt-1">Saját Építőanyagok &amp; Termékek</h2>
          <p className="text-xs text-gray-500">
            Kezelje saját építőanyagait, töltsön fel műszaki adatlapokat és kövesse az adminisztrátori jóváhagyás státuszát.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} /> + Új Építőanyag Hozzáadása
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Keresés saját anyagok között..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-accent"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-gray-200/70 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
            }`}
          >
            Összes ({partnerItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'published' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Publikált
          </button>
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending_approval' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Jóváhagyásra vár
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'draft' ? 'bg-gray-700 text-white shadow-xs' : 'text-gray-600'
            }`}
          >
            Piszkozat
          </button>
        </div>
      </div>

      {/* Materials Table */}
      {filteredItems.length > 0 ? (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Termék Neve</th>
                <th className="py-3 px-4">Kategória</th>
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
                      <img
                        src={item.main_image_url}
                        alt={item.name}
                        className="w-9 h-9 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-gray-900 block">{item.name}</span>
                        {item.sku && <span className="font-mono text-[10px] text-gray-400">SKU: {item.sku}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-700">{item.category_name}</td>
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
                    ) : item.status === 'pending_approval' ? (
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
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
          <h4 className="font-bold text-gray-800 text-sm">Önnek jelenleg nincs saját feltöltött építőanyaga</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Hozzon létre új terméket az "+ Új Építőanyag Hozzáadása" gombra kattintva!
          </p>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL FOR PARTNER ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="bg-primary text-white p-5 rounded-t-3xl sticky top-0 z-10 flex items-center justify-between border-b border-primary-700">
              <h3 className="text-base font-black flex items-center gap-2">
                <Layers size={17} className="text-accent" />
                {editingItem ? 'Saját Építőanyag Szerkesztése' : 'Új Építőanyag Hozzáadása'}
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
                { id: 'content', label: '2. Leírás' },
                { id: 'specs', label: '3. Specifikációk' },
                { id: 'media', label: '4. Képek & PDF-ek' },
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
                    <label className="font-bold text-gray-700 block mb-1">Anyag / Termék Neve *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="pl. Masterplast Műanyag Dübel 100mm"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <label className="font-bold text-gray-700 block mb-1">Márka / Gyártó</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Cikkszám / Termékkód (SKU)</label>
                    <input
                      type="text"
                      value={formData.sku || ''}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="pl. MP-DUBEL-100"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Rövid Leírás *</label>
                    <textarea
                      rows={3}
                      value={formData.short_description}
                      onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                      placeholder="Néhány mondatos összefoglaló a vásárlóknak..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Részletes Leírás &amp; Előnyök</label>
                    <textarea
                      rows={6}
                      value={formData.full_description}
                      onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                      placeholder="Részletes bemutató szöveg..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SPECS */}
              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Wrench size={15} className="text-accent" /> Műszaki Adatok
                  </h4>

                  {formData.technical_specs && formData.technical_specs.length > 0 && (
                    <div className="space-y-2">
                      {formData.technical_specs.map((s, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-gray-700">{s.label}:</span>{' '}
                            <span className="font-extrabold text-gray-900">{s.value} {s.unit || ''}</span>
                          </div>
                          <button type="button" onClick={() => handleRemoveSpec(idx)} className="text-red-600 p-1 cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Tulajdonság (pl. Méret)"
                        value={specLabelInput}
                        onChange={(e) => setSpecLabelInput(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Érték (pl. 25)"
                        value={specValueInput}
                        onChange={(e) => setSpecValueInput(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Mértékegység (pl. kg)"
                        value={specUnitInput}
                        onChange={(e) => setSpecUnitInput(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="px-3 py-1 bg-primary text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      + Hozzáadás
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA & DOCS */}
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

                  {/* Documents */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <h5 className="font-extrabold text-gray-900">Csatolt PDF Dokumentumok</h5>
                    {formData.documents && formData.documents.length > 0 && (
                      <div className="space-y-1.5">
                        {formData.documents.map((d) => (
                          <div key={d.id} className="bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-between">
                            <span className="font-bold text-gray-900">{d.title}</span>
                            <button type="button" onClick={() => handleRemoveDocument(d.id)} className="text-red-600 p-1 cursor-pointer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
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
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      + PDF Csatolása
                    </button>
                  </div>
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
                  onClick={() => handleSaveForm('pending_approval')}
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} /> Beküldés Ellenőrzésre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
