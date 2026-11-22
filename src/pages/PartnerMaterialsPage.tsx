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
  AlertTriangle,
  Send,
  Save,
  HelpCircle,
  Wrench,
  Upload,
  Image as ImageIcon,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  getMaterialsLocal,
  getMaterialCategoriesLocal,
  fetchMaterialsFromCloud,
  upsertPartnerMaterialItem,
  deletePartnerMaterialItem,
  uploadPartnerMaterialImage,
  deletePartnerMaterialImages,
  type MaterialItem,
  type MaterialCategory,
  type MaterialSpec,
  type MaterialDocument,
} from '../services/materialsService';
import type { Partner } from '../lib/supabase';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import RichTextEditor from '../components/RichTextEditor';
import { compressImageToWebP, formatFileSize } from '../lib/imageCompression';

const DEFAULT_FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop';
const MAX_PRODUCT_IMAGES = 10;

interface PartnerMaterialsPageProps {
  currentPartner: Partner;
  onNavigateHome?: () => void;
}

const DOC_TYPE_OPTIONS: Array<{ value: MaterialDocument['doc_type']; label: string }> = [
  { value: 'muszaki_adatlap', label: 'Műszaki adatlap' },
  { value: 'teljesitmenynyilatkozat', label: 'Teljesítménynyilatkozat' },
  { value: 'biztonsagi_adatlap', label: 'Biztonsági adatlap' },
  { value: 'utmutato', label: 'Alkalmazástechnikai útmutató' },
  { value: 'katalogus', label: 'Termékkatalógus' },
  { value: 'tanusitvany', label: 'Tanúsítvány / ÉME' },
  { value: 'egyeb', label: 'Egyéb dokumentum' },
];

const DOC_TYPE_LABELS: Record<MaterialDocument['doc_type'], string> = {
  muszaki_adatlap: 'Műszaki adatlap',
  teljesitmenynyilatkozat: 'Teljesítménynyilatkozat',
  biztonsagi_adatlap: 'Biztonsági adatlap',
  utmutato: 'Alkalmazástechnikai útmutató',
  katalogus: 'Termékkatalógus',
  tanusitvany: 'Tanúsítvány / ÉME',
  egyeb: 'Egyéb dokumentum',
};

function isPartnerEditableStatus(status: MaterialItem['status']): boolean {
  return (
    status === 'draft' ||
    status === 'pending_approval' ||
    status === 'rejected' ||
    status === 'published'
  );
}

export default function PartnerMaterialsPage({ currentPartner }: PartnerMaterialsPageProps) {
  const toast = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<MaterialItem[]>(() => getMaterialsLocal());
  const [categories] = useState<MaterialCategory[]>(() => getMaterialCategoriesLocal());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaterialItem | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'specs' | 'media'>('basic');
  const [saving, setSaving] = useState(false);

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
  const [docTypeInput, setDocTypeInput] = useState<MaterialDocument['doc_type']>('muszaki_adatlap');

  // Image Upload State
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [compressionStats, setCompressionStats] = useState<
    Array<{ name: string; originalSize: number; compressedSize: number }>
  >([]);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [sessionUploadedUrls, setSessionUploadedUrls] = useState<string[]>([]);
  const [pendingDeleteImageUrls, setPendingDeleteImageUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    function reload() {
      setAllItems(getMaterialsLocal());
    }
    reload();
    fetchMaterialsFromCloud({ partnerId: currentPartner.id })
      .then(({ items }) => {
        if (!cancelled && items) setAllItems(items);
      })
      .catch(() => {});
    window.addEventListener('materials-updated', reload);
    return () => {
      cancelled = true;
      window.removeEventListener('materials-updated', reload);
    };
  }, [currentPartner.id]);

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

  const resetImageUploadState = () => {
    setUploadingImages(false);
    setUploadProgressText(null);
    setUploadErrors([]);
    setCompressionStats([]);
    setIsDraggingImages(false);
    setSessionUploadedUrls([]);
    setPendingDeleteImageUrls([]);
  };

  const handleOpenCreateModal = () => {
    const defaultCat = categories[0];
    setEditingItem(null);
    resetImageUploadState();
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
      barcode: '',
      short_description: '',
      full_description: '',
      application_area: '',
      technical_specs: [],
      main_image_url: DEFAULT_FALLBACK_IMAGE_URL,
      gallery_image_urls: [],
      documents: [],
      status: 'published',
      rejection_note: null,
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MaterialItem) => {
    // 🔒 SECURITY CHECK: Ensure partner owns item before editing
    if (item.partner_id !== currentPartner.id) {
      toast.error('Biztonsági figyelmeztetés: Csak a saját termékeit szerkesztheti!');
      return;
    }
    if (!isPartnerEditableStatus(item.status)) {
      toast.notify('Ez a termék jelenlegi státuszában nem módosítható.', 'warning');
      return;
    }
    setEditingItem(item);
    resetImageUploadState();
    setFormData({ ...item, gallery_image_urls: item.gallery_image_urls || [] });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (uploadingImages) return;
    if (sessionUploadedUrls.length > 0) {
      deletePartnerMaterialImages(currentPartner.id, sessionUploadedUrls, editingItem?.id).catch(() => {});
    }
    resetImageUploadState();
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    const item = partnerItems.find((i) => i.id === id);
    if (!item) return;

    // 🔒 SECURITY CHECK: Ensure partner owns item before deleting
    if (item.partner_id !== currentPartner.id) {
      toast.error('Biztonsági figyelmeztetés: Csak a saját termékeit törölheti!');
      return;
    }
    if (!isPartnerEditableStatus(item.status)) {
      toast.notify('Ez a termék jelenlegi státuszában nem törölhető.', 'warning');
      return;
    }

    setConfirmDeleteId(id);
  };

  const handleSaveForm = async (targetStatus: 'draft' | 'published') => {
    if (saving || uploadingImages) return;
    if (!formData.name || !formData.short_description?.trim()) {
      toast.notify('Kérjük, töltse ki a termék nevét és a rövid leírást!', 'warning');
      return;
    }
    if ((formData.short_description || '').length > 1000) {
      toast.notify('A rövid leírás Markdown tartalma legfeljebb 1000 karakter lehet!', 'warning');
      return;
    }

    setSaving(true);
    const selectedCat = categories.find((c) => c.id === formData.category_id);
    const generatedSlug =
      formData.slug ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9áéíóöőúüű]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    try {
      const payload: Partial<MaterialItem> & { status: 'draft' | 'published' } = {
        ...(editingItem ? { id: editingItem.id } : {}),
        name: formData.name,
        slug: generatedSlug,
        category_id: formData.category_id || categories[0]?.id || 'mat-cat-1',
        category_name: selectedCat?.name || formData.category_name || 'Általános anyagok',
        subcategory_name: formData.subcategory_name?.trim() || null,
        brand: formData.brand || currentPartner.name,
        sku: formData.sku?.trim() || null,
        barcode: formData.barcode?.trim() || null,
        short_description: formData.short_description,
        full_description: formData.full_description || '',
        application_area: formData.application_area?.trim() || null,
        technical_specs: formData.technical_specs || [],
        main_image_url:
          formData.main_image_url ||
          editingItem?.main_image_url ||
          DEFAULT_FALLBACK_IMAGE_URL,
        gallery_image_urls: formData.gallery_image_urls || [],
        documents: formData.documents || [],
        status: targetStatus,
      };

      const saved = await upsertPartnerMaterialItem(currentPartner.id, payload);
      if (pendingDeleteImageUrls.length > 0) {
        deletePartnerMaterialImages(currentPartner.id, pendingDeleteImageUrls, saved.id).catch(() => {});
      }
      if (editingItem) {
        setAllItems((prev) => prev.map((i) => (i.id === editingItem.id ? saved : i)));
        toast.success(targetStatus === 'published' ? 'Termék frissítve és publikálva!' : 'Piszkozat mentve!');
      } else {
        setAllItems((prev) => [saved, ...prev]);
        toast.success(targetStatus === 'published' ? 'Új termék mentve és publikálva!' : 'Új piszkozat mentve!');
      }
      resetImageUploadState();
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hiba történt a termék mentése során.');
    } finally {
      setSaving(false);
    }
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
      file_size: docUrlInput.trim().toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC',
    };
    setFormData({
      ...formData,
      documents: [...(formData.documents || []), newDoc],
    });
    setDocTitleInput('');
    setDocUrlInput('');
    setDocTypeInput('muszaki_adatlap');
  };

  const handleRemoveDocument = (docId: string) => {
    setFormData({
      ...formData,
      documents: formData.documents?.filter((d) => d.id !== docId),
    });
  };

  const getProductImageList = (data: Partial<MaterialItem> = formData): string[] => {
    const main = (data.main_image_url || '').trim();
    const gallery = Array.isArray(data.gallery_image_urls)
      ? data.gallery_image_urls.filter((u) => typeof u === 'string' && u.trim().length > 0)
      : [];
    const list: string[] = [];
    if (main && main !== DEFAULT_FALLBACK_IMAGE_URL) {
      list.push(main);
    }
    for (const g of gallery) {
      if (!list.includes(g)) list.push(g);
    }
    return list;
  };

  const applyImageListToForm = (images: string[]) => {
    setFormData((prev) => ({
      ...prev,
      main_image_url: images[0] || DEFAULT_FALLBACK_IMAGE_URL,
      gallery_image_urls: images.slice(1),
    }));
  };

  const handleUploadImageFiles = async (files: FileList | File[]) => {
    const selected = Array.from(files || []);
    if (selected.length === 0 || uploadingImages) return;

    const currentImages = getProductImageList();
    const availableSlots = MAX_PRODUCT_IMAGES - currentImages.length;
    if (availableSlots <= 0) {
      toast.notify(`Termékenként legfeljebb ${MAX_PRODUCT_IMAGES} kép tölthető fel.`, 'warning');
      return;
    }

    const toProcess = selected.slice(0, availableSlots);
    if (selected.length > availableSlots) {
      setUploadErrors([
        `Legfeljebb ${MAX_PRODUCT_IMAGES} kép engedélyezett termékenként, így csak az első ${availableSlots} kép kerül feltöltésre.`,
      ]);
    } else {
      setUploadErrors([]);
    }

    setUploadingImages(true);
    const errors: string[] = [];
    const newUrls: string[] = [];
    const stats: Array<{ name: string; originalSize: number; compressedSize: number }> = [];

    for (let i = 0; i < toProcess.length; i++) {
      const file = toProcess[i];
      setUploadProgressText(`Feldolgozás és feltöltés: ${i + 1} / ${toProcess.length} (${file.name})`);
      try {
        const compressed = await compressImageToWebP(file);
        const uploaded = await uploadPartnerMaterialImage(
          currentPartner.id,
          compressed.file,
          editingItem?.id || 'draft'
        );
        newUrls.push(uploaded.url);
        stats.push({
          name: file.name,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        });
      } catch (err: unknown) {
        errors.push(err instanceof Error ? err.message : `„${file.name}”: sikertelen feltöltés.`);
      }
    }

    if (newUrls.length > 0) {
      setSessionUploadedUrls((prev) => [...prev, ...newUrls]);
      setFormData((prev) => {
        const merged = [...getProductImageList(prev), ...newUrls].slice(0, MAX_PRODUCT_IMAGES);
        return {
          ...prev,
          main_image_url: merged[0] || DEFAULT_FALLBACK_IMAGE_URL,
          gallery_image_urls: merged.slice(1),
        };
      });
      setCompressionStats((prev) => [...prev, ...stats]);
      toast.success(`${newUrls.length} kép sikeresen feltöltve a Cloudflare R2 tárhelyre.`);
    }

    if (errors.length > 0) {
      setUploadErrors((prev) => [...prev, ...errors]);
    }

    setUploadingImages(false);
    setUploadProgressText(null);
  };

  const handleReplaceImageAt = async (index: number, file: File) => {
    if (uploadingImages) return;
    const currentImages = getProductImageList();
    const oldUrl = currentImages[index];
    if (!oldUrl) return;

    setUploadingImages(true);
    setUploadErrors([]);
    setUploadProgressText(`Kép cseréje: ${file.name}`);

    try {
      const compressed = await compressImageToWebP(file);
      const uploaded = await uploadPartnerMaterialImage(
        currentPartner.id,
        compressed.file,
        editingItem?.id || 'draft'
      );

      setSessionUploadedUrls((prev) => [...prev, uploaded.url]);
      setCompressionStats((prev) => [
        ...prev,
        {
          name: file.name,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        },
      ]);

      const updatedImages = currentImages.map((u, idx) => (idx === index ? uploaded.url : u));
      applyImageListToForm(updatedImages);

      if (sessionUploadedUrls.includes(oldUrl)) {
        setSessionUploadedUrls((prev) => prev.filter((u) => u !== oldUrl));
        deletePartnerMaterialImages(currentPartner.id, [oldUrl], editingItem?.id).catch(() => {});
      } else {
        setPendingDeleteImageUrls((prev) => (prev.includes(oldUrl) ? prev : [...prev, oldUrl]));
      }

      toast.success('Kép sikeresen lecserélve.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'A kép cseréje sikertelen.';
      setUploadErrors([msg]);
      toast.error(msg);
    } finally {
      setUploadingImages(false);
      setUploadProgressText(null);
    }
  };

  const handleSetMainImage = (index: number) => {
    const currentImages = getProductImageList();
    if (index <= 0 || index >= currentImages.length) return;
    const chosen = currentImages[index];
    const reordered = [chosen, ...currentImages.filter((_, idx) => idx !== index)];
    applyImageListToForm(reordered);
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    const currentImages = getProductImageList();
    const target = index + direction;
    if (target < 0 || target >= currentImages.length) return;
    const copy = [...currentImages];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    applyImageListToForm(copy);
  };

  const handleRemoveImageAt = (index: number) => {
    const currentImages = getProductImageList();
    const targetUrl = currentImages[index];
    if (!targetUrl) return;

    const remaining = currentImages.filter((_, idx) => idx !== index);
    applyImageListToForm(remaining);

    if (sessionUploadedUrls.includes(targetUrl)) {
      setSessionUploadedUrls((prev) => prev.filter((u) => u !== targetUrl));
      deletePartnerMaterialImages(currentPartner.id, [targetUrl], editingItem?.id).catch(() => {});
    } else {
      setPendingDeleteImageUrls((prev) => (prev.includes(targetUrl) ? prev : [...prev, targetUrl]));
    }
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
            Termékek és anyagok
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Kezelje saját termékeit és építőanyagait, töltsön fel műszaki adatlapokat és kövesse az adminisztrátori jóváhagyás státuszát.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} /> Új termék hozzáadása
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-slate-900/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Keresés saját termékek között..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center bg-slate-950/70 border border-slate-800 p-1 rounded-xl text-xs font-bold w-full sm:w-auto gap-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-blue-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Összes ({partnerItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'published'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Publikált
          </button>
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending_approval'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Jóváhagyásra vár
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'draft' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Piszkozat
          </button>
        </div>
      </div>

      {/* Materials Table */}
      {filteredItems.length > 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Termék neve</th>
                  <th className="py-3 px-4">Kategória</th>
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
                        <img
                          src={item.main_image_url}
                          alt={item.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-white block">{item.name}</span>
                          {item.sku && <span className="font-mono text-[10px] text-slate-400">SKU: {item.sku}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300 whitespace-nowrap">{item.category_name}</td>
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
                      ) : item.status === 'pending_approval' ? (
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
                      {(() => {
                        const canEditOrDelete = isPartnerEditableStatus(item.status);
                        return (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              disabled={!canEditOrDelete}
                              onClick={() => handleOpenEditModal(item)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                canEditOrDelete
                                  ? 'text-slate-300 hover:text-blue-400 hover:bg-slate-800 cursor-pointer'
                                  : 'text-slate-600 cursor-not-allowed'
                              }`}
                              title={
                                canEditOrDelete
                                  ? 'Szerkesztés'
                                  : 'Jóváhagyott vagy közzétett termék nem szerkeszthető'
                              }
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              disabled={!canEditOrDelete}
                              onClick={() => handleDeleteItem(item.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                canEditOrDelete
                                  ? 'text-slate-300 hover:text-red-400 hover:bg-slate-800 cursor-pointer'
                                  : 'text-slate-600 cursor-not-allowed'
                              }`}
                              title={
                                canEditOrDelete
                                  ? 'Törlés'
                                  : 'Jóváhagyott vagy közzétett termék nem törölhető'
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })()}
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
          <h4 className="font-bold text-slate-200 text-sm">Önnek jelenleg nincs saját feltöltött terméke</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hozzon létre új terméket az „Új termék hozzáadása” gombra kattintva!
          </p>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL FOR PARTNER ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-700 max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="bg-slate-950 text-white p-5 rounded-t-3xl shrink-0 z-10 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-black flex items-center gap-2">
                <Layers size={17} className="text-accent" />
                {editingItem ? 'Termék szerkesztése' : 'Új termék hozzáadása'}
              </h3>
              <button
                type="button"
                disabled={uploadingImages}
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Rejection Alert if editing rejected item */}
            {formData.status === 'rejected' && formData.rejection_note && (
              <div className="bg-red-950/50 border-b border-red-800/60 p-4 space-y-1 shrink-0">
                <span className="font-extrabold text-red-300 text-xs flex items-center gap-1">
                  <AlertTriangle size={14} /> AZ ADMINISZTRÁTOR MEGJEGYZÉSE AZ ELUTASÍTÁSHOZ:
                </span>
                <p className="text-xs text-red-100 font-medium">{formData.rejection_note}</p>
              </div>
            )}

            {/* Subnav Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-3 gap-2 overflow-x-auto shrink-0">
              {[
                { id: 'basic', label: '1. Alapadatok' },
                { id: 'content', label: '2. Leírás' },
                { id: 'specs', label: '3. Specifikációk' },
                { id: 'media', label: '4. Képek és PDF-ek' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as 'basic' | 'content' | 'specs' | 'media')}
                  className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
                    activeTab === t.id
                      ? 'border-accent text-accent bg-slate-900 rounded-t-lg'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="p-6 space-y-5 text-xs flex-1 min-h-0 overflow-y-auto text-slate-100">
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Termék neve *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="pl. Masterplast Műanyag Dübel 100mm"
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Kategória *</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => {
                          const cat = categories.find((c) => c.id === e.target.value);
                          setFormData({ ...formData, category_id: e.target.value, category_name: cat?.name || '' });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-accent"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Alkategória</label>
                      <input
                        type="text"
                        value={formData.subcategory_name || ''}
                        onChange={(e) => setFormData({ ...formData, subcategory_name: e.target.value })}
                        placeholder="pl. Homlokzati hőszigetelés"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Márka / gyártó</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Cikkszám / termékkód (SKU)</label>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="pl. MP-DUBEL-100"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-300 block mb-1">Vonalkód (EAN / GTIN)</label>
                      <input
                        type="text"
                        value={formData.barcode || ''}
                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                        placeholder="pl. 5998123456789"
                        className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1.5">Rövid leírás *</label>
                    <RichTextEditor
                      value={formData.short_description || ''}
                      onChange={(md) => setFormData((prev) => ({ ...prev, short_description: md }))}
                      placeholder="Néhány mondatos összefoglaló a vásárlóknak..."
                      minHeightClass="min-h-[84px]"
                      maxLength={1000}
                      backgroundColor="#1e293b"
                      borderColor="#334155"
                      textColor="#f1f5f9"
                      ariaLabel="Rövid leírás"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1.5">Részletes leírás és előnyök</label>
                    <RichTextEditor
                      value={formData.full_description || ''}
                      onChange={(md) => setFormData((prev) => ({ ...prev, full_description: md }))}
                      placeholder="Részletes bemutató szöveg..."
                      minHeightClass="min-h-[180px]"
                      backgroundColor="#1e293b"
                      borderColor="#334155"
                      textColor="#f1f5f9"
                      ariaLabel="Részletes leírás"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Alkalmazási terület</label>
                    <textarea
                      rows={2}
                      value={formData.application_area || ''}
                      onChange={(e) => setFormData({ ...formData, application_area: e.target.value })}
                      placeholder="pl. Külső teherhordó falak, homlokzati hőszigetelés vagy beltéri burkolás..."
                      className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SPECS */}
              {activeTab === 'specs' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-100 flex items-center gap-1.5">
                    <Wrench size={15} className="text-accent" /> Műszaki adatok
                  </h4>

                  {formData.technical_specs && formData.technical_specs.length > 0 && (
                    <div className="space-y-2">
                      {formData.technical_specs.map((s, idx) => (
                        <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-300">{s.label}:</span>{' '}
                            <span className="font-extrabold text-white">{s.value} {s.unit || ''}</span>
                          </div>
                          <button type="button" onClick={() => handleRemoveSpec(idx)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(() => {
                    const counts = new Map<string, { label: string; count: number }>();
                    (formData.technical_specs || []).forEach((s) => {
                      const trimmed = (s.label || '').trim();
                      if (!trimmed) return;
                      const key = trimmed.toLowerCase();
                      const prev = counts.get(key);
                      if (prev) {
                        prev.count += 1;
                      } else {
                        counts.set(key, { label: trimmed, count: 1 });
                      }
                    });
                    const duplicates = Array.from(counts.values())
                      .filter((entry) => entry.count > 1)
                      .map((entry) => entry.label);
                    const pendingNorm = specLabelInput.trim().toLowerCase();
                    const pendingDuplicate = Boolean(pendingNorm && counts.has(pendingNorm));

                    return (
                      <>
                        {duplicates.length > 0 && (
                          <div className="bg-amber-950/50 border border-amber-700/60 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
                            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <strong>Figyelmeztetés:</strong> A következő műszaki paraméterek többször szerepelnek:{' '}
                              <span className="font-bold text-white">{duplicates.join(', ')}</span>. A termék-összehasonlítóban ezek egy sorba kerülnek. A mentés ettől függetlenül engedélyezett.
                            </div>
                          </div>
                        )}
                        {pendingDuplicate && (
                          <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                            <AlertTriangle size={12} /> A(z) „{specLabelInput.trim()}” paraméternév már szerepel a listában.
                          </p>
                        )}
                      </>
                    );
                  })()}

                  <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Tulajdonság (pl. Méret)"
                        value={specLabelInput}
                        onChange={(e) => setSpecLabelInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                      />
                      <input
                        type="text"
                        placeholder="Érték (pl. 25)"
                        value={specValueInput}
                        onChange={(e) => setSpecValueInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-accent"
                      />
                      <input
                        type="text"
                        placeholder="Mértékegység (pl. kg)"
                        value={specUnitInput}
                        onChange={(e) => setSpecUnitInput(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-lg cursor-pointer"
                    >
                      + Hozzáadás
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: MEDIA & DOCS */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  {/* Multi-Image R2 Uploader */}
                  {(() => {
                    const images = getProductImageList();
                    const remainingSlots = MAX_PRODUCT_IMAGES - images.length;
                    const totalSaved = compressionStats.reduce(
                      (acc, s) => ({ orig: acc.orig + s.originalSize, comp: acc.comp + s.compressedSize }),
                      { orig: 0, comp: 0 }
                    );
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <label className="font-bold text-slate-200 block">
                              Termékképek ({images.length} / {MAX_PRODUCT_IMAGES})
                            </label>
                            <p className="text-[11px] text-slate-400">
                              JPEG, PNG vagy WebP • Automatikus WebP tömörítés (max. 1920 px, max. 5 MB/kép) • Cloudflare R2 tárhely
                            </p>
                          </div>
                          {compressionStats.length > 0 && totalSaved.orig > 0 && (
                            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                              Tömörítés: {formatFileSize(totalSaved.orig)} → {formatFileSize(totalSaved.comp)}
                            </span>
                          )}
                        </div>

                        <label
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!uploadingImages && remainingSlots > 0) setIsDraggingImages(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingImages(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingImages(false);
                            if (!uploadingImages && e.dataTransfer.files?.length) {
                              handleUploadImageFiles(e.dataTransfer.files);
                            }
                          }}
                          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
                            remainingSlots <= 0 || uploadingImages
                              ? 'border-slate-700 bg-slate-800/40 opacity-60 cursor-not-allowed'
                              : isDraggingImages
                                ? 'border-blue-400 bg-blue-500/10 cursor-copy'
                                : 'border-slate-700 bg-slate-800/60 hover:border-blue-500/60 hover:bg-slate-800 cursor-pointer'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            disabled={uploadingImages || remainingSlots <= 0}
                            onChange={(e) => {
                              if (e.target.files?.length) {
                                handleUploadImageFiles(e.target.files);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                          />
                          {uploadingImages ? (
                            <Loader2 size={24} className="text-blue-400 animate-spin" />
                          ) : (
                            <Upload size={22} className="text-blue-400" />
                          )}
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-200 text-xs">
                              {uploadingImages
                                ? uploadProgressText || 'Képek feldolgozása és feltöltése...'
                                : remainingSlots <= 0
                                  ? `Elérte a maximum ${MAX_PRODUCT_IMAGES} képet`
                                  : 'Húzza ide a képeket, vagy kattintson a tallózáshoz (egyszerre több is)'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Az első kép lesz a fő termékkép, a többi a galériában jelenik meg.
                            </p>
                          </div>
                        </label>

                        {uploadErrors.length > 0 && (
                          <div className="bg-red-950/50 border border-red-700/60 rounded-xl p-3 space-y-1 text-xs text-red-200">
                            {uploadErrors.map((errMsg, i) => (
                              <p key={i} className="flex items-start gap-1.5">
                                <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                                <span>{errMsg}</span>
                              </p>
                            ))}
                          </div>
                        )}

                        {images.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {images.map((imgUrl, idx) => {
                              const isMain = idx === 0;
                              return (
                                <div
                                  key={`${imgUrl}-${idx}`}
                                  className={`bg-slate-800/80 rounded-xl border overflow-hidden flex flex-col ${
                                    isMain ? 'border-blue-400 ring-1 ring-blue-400/40' : 'border-slate-700'
                                  }`}
                                >
                                  <div className="relative aspect-square bg-slate-950">
                                    <img
                                      src={imgUrl}
                                      alt={isMain ? 'Fő termékkép' : `Galériakép ${idx}`}
                                      className="w-full h-full object-cover"
                                    />
                                    {isMain && (
                                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-blue-500 text-slate-950 font-black text-[10px] rounded-full flex items-center gap-1 shadow">
                                        <Star size={10} /> Fő kép
                                      </span>
                                    )}
                                  </div>

                                  <div className="p-2 flex items-center justify-between gap-1 bg-slate-900/90">
                                    <div className="flex items-center gap-1">
                                      {!isMain && (
                                        <button
                                          type="button"
                                          disabled={uploadingImages}
                                          onClick={() => handleSetMainImage(idx)}
                                          title="Beállítás fő képként"
                                          className="p-1 text-slate-300 hover:text-amber-300 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer"
                                        >
                                          <Star size={12} />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        disabled={uploadingImages || idx === 0}
                                        onClick={() => handleMoveImage(idx, -1)}
                                        title="Mozgatás előre"
                                        className="p-1 text-slate-300 hover:text-white disabled:opacity-30 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer disabled:cursor-not-allowed"
                                      >
                                        <ArrowLeft size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={uploadingImages || idx === images.length - 1}
                                        onClick={() => handleMoveImage(idx, 1)}
                                        title="Mozgatás hátra"
                                        className="p-1 text-slate-300 hover:text-white disabled:opacity-30 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer disabled:cursor-not-allowed"
                                      >
                                        <ArrowRight size={12} />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <label
                                        title="Kép cseréje"
                                        className={`p-1 text-slate-300 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 rounded-md ${
                                          uploadingImages ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                      >
                                        <RefreshCw size={12} />
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/png,image/webp"
                                          disabled={uploadingImages}
                                          onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                              handleReplaceImageAt(idx, f);
                                              e.target.value = '';
                                            }
                                          }}
                                          className="hidden"
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        disabled={uploadingImages}
                                        onClick={() => handleRemoveImageAt(idx)}
                                        title="Kép eltávolítása"
                                        className="p-1 text-red-400 hover:text-red-300 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <ImageIcon size={15} className="text-slate-500" />
                            <span>Még nincs feltöltött termékkép. Mentéskor alapértelmezett előnézeti kép jelenik meg.</span>
                          </div>
                        )}

                        <div>
                          <label className="font-bold text-slate-400 block mb-1 text-[11px]">
                            Fő kép URL (opcionális külső hivatkozás)
                          </label>
                          <input
                            type="text"
                            value={formData.main_image_url || ''}
                            onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Documents */}
                  <div className="border-t border-slate-800 pt-4 space-y-2">
                    <h5 className="font-extrabold text-slate-100">Csatolt PDF-dokumentumok</h5>
                    {formData.documents && formData.documents.length > 0 && (
                      <div className="space-y-1.5">
                        {formData.documents.map((d) => (
                          <div key={d.id} className="bg-slate-800 border border-slate-700 rounded-xl p-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-slate-100 truncate">{d.title}</span>
                              <span className="text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md shrink-0">
                                {DOC_TYPE_LABELS[d.doc_type] || d.doc_type}
                              </span>
                            </div>
                            <button type="button" onClick={() => handleRemoveDocument(d.id)} className="text-red-400 hover:text-red-300 p-1 cursor-pointer shrink-0">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Dokumentum címe (pl. Műszaki_Adatlap.pdf)"
                        value={docTitleInput}
                        onChange={(e) => setDocTitleInput(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-accent"
                      />
                      <input
                        type="text"
                        placeholder="PDF-fájl URL (pl. /docs/adatlap.pdf)"
                        value={docUrlInput}
                        onChange={(e) => setDocUrlInput(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-accent"
                      />
                      <select
                        value={docTypeInput}
                        onChange={(e) => setDocTypeInput(e.target.value as MaterialDocument['doc_type'])}
                        aria-label="Dokumentum típusa"
                        className="bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 text-xs font-medium cursor-pointer focus:outline-none focus:border-accent"
                      >
                        {DOC_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      + PDF csatolása
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Partner Responsibility Notice & Modal Actions */}
            <div className="bg-slate-950/80 border-t border-slate-800 p-4 px-6 rounded-b-3xl space-y-3 shrink-0">
              <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl px-3 py-2 text-[11px] text-slate-300 flex items-start gap-2">
                <AlertTriangle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                <span>
                  A termékadatok, a leírás, a műszaki adatok pontosságáért, az árakért és a feltöltött képek jogszerű felhasználásáért a partner felel. A publikált termék azonnal megjelenik a nyilvános katalógusban.
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={uploadingImages}
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Mégse
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {editingItem && (
                    <button
                      type="button"
                      disabled={saving || uploadingImages}
                      onClick={() => handleSaveForm('draft')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save size={14} /> {saving ? 'Mentés...' : 'Mentés piszkozatként'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={saving || uploadingImages}
                    onClick={() => handleSaveForm('published')}
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={14} /> {saving ? 'Publikálás...' : 'Mentés és publikálás'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Termék törlése"
        message="Biztosan törölni szeretné ezt a terméket?"
        confirmLabel="Törlés"
        destructive
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          const targetItem = partnerItems.find((i) => i.id === confirmDeleteId);
          try {
            await deletePartnerMaterialItem(currentPartner.id, confirmDeleteId);
            setAllItems((prev) => prev.filter((i) => i.id !== confirmDeleteId));
            if (targetItem) {
              const itemImages = [
                targetItem.main_image_url,
                ...(Array.isArray(targetItem.gallery_image_urls) ? targetItem.gallery_image_urls : []),
              ].filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
              if (itemImages.length > 0) {
                deletePartnerMaterialImages(currentPartner.id, itemImages).catch(() => {});
              }
            }
            toast.success('Termék törölve.');
          } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Hiba történt a termék törlésekor.');
          } finally {
            setConfirmDeleteId(null);
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
