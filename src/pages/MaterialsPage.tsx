import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  ChevronRight,
  FileText,
  Download,
  Building2,
  Filter,
  X,
  LayoutGrid,
  List,
  HelpCircle,
  Tag,
  ExternalLink,
  Award,
  Package,
  Wrench,
  Sparkles,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import {
  getMaterialsLocal,
  getMaterialCategoriesLocal,
  fetchMaterialsFromCloud,
  type MaterialItem,
  type MaterialCategory,
} from '../services/materialsService';
import { listPartners } from '../services/partnerService';
import type { Partner } from '../lib/supabase';

interface MaterialsPageProps {
  onNavigate: (page: string) => void;
}

export default function MaterialsPage({ onNavigate }: MaterialsPageProps) {
  const [items, setItems] = useState<MaterialItem[]>(() =>
    getMaterialsLocal().filter((i) => i.status === 'published')
  );
  const [categories, setCategories] = useState<MaterialCategory[]>(() => getMaterialCategoriesLocal());
  const [partners, setPartners] = useState<Partner[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeItem, setActiveItem] = useState<MaterialItem | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  useEffect(() => {
    function loadData() {
      const all = getMaterialsLocal().filter((i) => i.status === 'published');
      setItems(all);
      setCategories(getMaterialCategoriesLocal());
    }
    loadData();

    void listPartners().then((p) => setPartners(p));

    void fetchMaterialsFromCloud().then(({ items: cloudItems, categories: cloudCats }) => {
      if (cloudItems) {
        setItems(cloudItems.filter((i) => i.status === 'published'));
      }
      if (cloudCats) {
        setCategories(cloudCats);
      }
    });

    window.addEventListener('materials-updated', loadData);
    return () => window.removeEventListener('materials-updated', loadData);
  }, []);

  // Unique Brands
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    items.forEach((i) => {
      if (i.brand) brands.add(i.brand);
    });
    return Array.from(brands);
  }, [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category_id === selectedCategory;
      const matchBrand = selectedBrand === 'all' || item.brand === selectedBrand;
      const matchPartner = selectedPartner === 'all' || item.partner_id === selectedPartner;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.category_name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.short_description && item.short_description.toLowerCase().includes(q)) ||
        item.keywords.some((k) => k.toLowerCase().includes(q));

      return matchCat && matchBrand && matchPartner && matchQuery;
    });
  }, [items, selectedCategory, selectedBrand, selectedPartner, searchQuery]);

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20 selection:bg-accent selection:text-black">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <button onClick={() => onNavigate('tool')} className="hover:text-white transition-colors">
              Eszközök
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Anyagok</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-full">
                <Layers size={14} /> Építőipari Anyag-Katalógus
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Építőipari Anyagok &amp; Termékek
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Gyártói és forgalmazói építőanyag-adatbázis. Szigetelőanyagok, festékek, vakolatok, kerámiák, transzportbeton és szárazépítési anyagok műszaki adatlapokkal.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs bg-white/10 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl backdrop-blur-sm">
                Publikált anyagok: <strong className="text-accent">{items.length}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Eszközök navigáció"
        onNavigate={onNavigate}
        items={[
          { label: 'Gép & Szerszám Katalógus', page: 'tool', icon: <Wrench size={14} className="text-accent" />, active: false },
          { label: 'Anyagok', page: 'materials', icon: <Layers size={14} className="text-accent" />, active: true },
          { label: 'Szoftverek', page: 'software', icon: <Package size={14} className="text-accent" />, active: false },
          { label: 'Eszközválasztó Modul', page: 'valaszto', icon: <Sparkles size={14} className="text-accent" />, active: false },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Live Search */}
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Keresés anyag neve, márka (pl. Leier, Austrotherm), cikkszám vagy kulcsszó alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-accent font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
              {/* Brand Select */}
              {availableBrands.length > 0 && (
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold px-3 py-3 rounded-2xl focus:outline-none cursor-pointer"
                >
                  <option value="all">Minden márka / gyártó</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              )}

              {/* Partner Select */}
              {partners.length > 0 && (
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold px-3 py-3 rounded-2xl focus:outline-none cursor-pointer"
                >
                  <option value="all">Minden forgalmazó partner</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                  title="Kártyás nézet"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'list' ? 'bg-primary text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                  title="Listanézet"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-gray-100 pt-4">
            <span className="text-xs font-bold text-gray-500 shrink-0 mr-1 flex items-center gap-1">
              <Filter size={13} /> Kategóriák:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Összes anyagkategória
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Items Listing */}
        {filteredItems.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item);
                    setActiveGalleryIndex(0);
                  }}
                  className="bg-white rounded-3xl border border-gray-200 hover:border-accent shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group overflow-hidden"
                >
                  {/* Image Header */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={item.main_image_url || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 bg-primary/90 text-white font-extrabold text-[10px] rounded-lg backdrop-blur-xs">
                        {item.category_name}
                      </span>
                    </div>
                    {item.brand && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-white/90 text-gray-900 font-extrabold text-[11px] rounded-lg shadow-sm backdrop-blur-xs flex items-center gap-1">
                        <Award size={12} className="text-amber-600" /> {item.brand}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 text-gray-500 font-semibold text-[11px]">
                          <Building2 size={12} className="text-accent" /> {item.partner_name}
                        </span>
                        {item.sku && (
                          <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {item.name}
                      </h3>

                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                        {item.short_description}
                      </p>
                    </div>

                    {/* Tech Specs Preview Badges */}
                    {item.technical_specs && item.technical_specs.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {item.technical_specs.slice(0, 2).map((spec, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-700 text-[10px] font-medium rounded-md">
                            {spec.label}: <strong>{spec.value} {spec.unit || ''}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-primary">
                    <div className="flex items-center gap-2">
                      {item.documents && item.documents.length > 0 && (
                        <span className="text-gray-500 font-medium flex items-center gap-1 text-[11px]">
                          <FileText size={13} className="text-primary" /> {item.documents.length} Dokumentum
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-primary group-hover:translate-x-0.5 transition-transform">
                      Részletes Adatlap <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item);
                    setActiveGalleryIndex(0);
                  }}
                  className="bg-white rounded-3xl border border-gray-200 hover:border-accent p-4 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                    <img
                      src={item.main_image_url || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop'}
                      alt={item.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 border border-gray-200"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold rounded-md text-[10px]">
                          {item.category_name}
                        </span>
                        <span className="font-extrabold text-gray-700 text-xs flex items-center gap-1">
                          <Award size={12} className="text-amber-600" /> {item.brand}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500 font-semibold text-xs flex items-center gap-1">
                          <Building2 size={12} className="text-accent" /> {item.partner_name}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>

                      <p className="text-xs text-gray-600 line-clamp-1 max-w-2xl">
                        {item.short_description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                    {item.documents && item.documents.length > 0 && (
                      <span className="text-xs text-gray-500 font-bold flex items-center gap-1">
                        <FileText size={14} className="text-primary" /> {item.documents.length} PDF
                      </span>
                    )}
                    <span className="px-4 py-2 bg-primary group-hover:bg-primary-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors">
                      Megtekintés <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
              <HelpCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">A megadott szűrők alapján nincs találat</h3>
            <p className="text-xs text-gray-600">
              Próbálja meg módosítani a keresési kifejezést vagy állítsa vissza a kategória és márka szűrőket.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedBrand('all');
                setSelectedPartner('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-800 transition-colors cursor-pointer"
            >
              Szűrők alaphelyzetbe állítása
            </button>
          </div>
        )}
      </div>

      {/* ── DETAILED MATERIAL MODAL / ADATLAP ── */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            {/* Modal Header */}
            <div className="bg-primary text-white p-6 sm:p-8 rounded-t-3xl sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-primary-700">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-accent text-black font-extrabold rounded-md">
                    {activeItem.category_name}
                  </span>
                  <span className="px-2.5 py-0.5 bg-white/10 text-gray-200 font-bold rounded-md flex items-center gap-1">
                    <Award size={12} className="text-accent" /> Gyártó: {activeItem.brand}
                  </span>
                  {activeItem.sku && (
                    <span className="px-2.5 py-0.5 bg-white/10 text-gray-300 font-mono text-[11px] rounded-md">
                      SKU: {activeItem.sku}
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {activeItem.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Image Gallery Component */}
              <div className="space-y-3">
                <div className="h-64 sm:h-80 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                  <img
                    src={
                      activeGalleryIndex === 0
                        ? activeItem.main_image_url
                        : activeItem.gallery_image_urls[activeGalleryIndex - 1] || activeItem.main_image_url
                    }
                    alt={activeItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {activeItem.gallery_image_urls && activeItem.gallery_image_urls.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setActiveGalleryIndex(0)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activeGalleryIndex === 0 ? 'border-accent ring-2 ring-accent/30' : 'border-transparent opacity-70'
                      }`}
                    >
                      <img src={activeItem.main_image_url} alt="Fő kép" className="w-full h-full object-cover" />
                    </button>
                    {activeItem.gallery_image_urls.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveGalleryIndex(idx + 1)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          activeGalleryIndex === idx + 1 ? 'border-accent ring-2 ring-accent/30' : 'border-transparent opacity-70'
                        }`}
                      >
                        <img src={imgUrl} alt={`Kép ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Short & Full Description */}
              <div className="space-y-4">
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                  <h4 className="font-extrabold text-amber-900 mb-1">Rövid Összefoglaló:</h4>
                  <p>{activeItem.short_description}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-gray-900 text-sm">Részletes Leírás &amp; Jellemzők:</h4>
                  <div className="prose max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {activeItem.full_description}
                  </div>
                </div>

                {activeItem.application_area && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
                    <h5 className="font-extrabold text-xs text-blue-900">Alkalmazási Terület:</h5>
                    <p className="text-xs text-blue-950 leading-relaxed">{activeItem.application_area}</p>
                  </div>
                )}
              </div>

              {/* Technical Specifications Table */}
              {activeItem.technical_specs && activeItem.technical_specs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <Wrench size={16} className="text-accent" /> Műszaki Paraméterek &amp; Teljesítményadatok
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody>
                        {activeItem.technical_specs.map((spec, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'}>
                            <td className="py-2.5 px-4 font-bold text-gray-600 w-1/2 border-r border-gray-100">
                              {spec.label}
                            </td>
                            <td className="py-2.5 px-4 font-extrabold text-gray-900 w-1/2">
                              {spec.value} {spec.unit || ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Downloadable Documents */}
              {activeItem.documents && activeItem.documents.length > 0 && (
                <div className="space-y-3 border-t border-gray-200 pt-6">
                  <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-accent" /> Hivatalos Dokumentumok &amp; Adatlapok
                  </h4>
                  <div className="space-y-2">
                    {activeItem.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-gray-300 transition-all"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-extrabold text-gray-900 block">{doc.title}</span>
                          <span className="text-[11px] text-gray-500 capitalize">{doc.doc_type.replace('_', ' ')} • {doc.file_size || 'PDF'}</span>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-primary hover:bg-primary-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                        >
                          <Download size={13} /> Letöltés (PDF)
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords Tags */}
              {activeItem.keywords && activeItem.keywords.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <h5 className="font-extrabold text-xs text-gray-700 flex items-center gap-1.5">
                    <Tag size={13} className="text-accent" /> Keresési Kulcsszavak:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {activeItem.keywords.map((kw) => (
                      <span key={kw} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-lg">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Partner Distributor Info Card */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider flex items-center gap-1">
                    <Building2 size={14} className="text-accent" /> Forgalmazó Partner Információ
                  </span>
                  <button
                    onClick={() => {
                      setActiveItem(null);
                      onNavigate('partners');
                    }}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Partner Profilja <ExternalLink size={12} />
                  </button>
                </div>
                <div className="space-y-1">
                  <h5 className="text-base font-extrabold text-gray-900">{activeItem.partner_name}</h5>
                  <p className="text-xs text-gray-600">
                    Regisztrált és ellenőrzött építőipari partner. Az anyag műszaki paramétereiért a gyártó/forgalmazó vállal garanciát.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 sm:px-8 rounded-b-3xl flex items-center justify-between">
              <button
                onClick={() => setActiveItem(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Bezárás
              </button>
              <span className="text-[11px] text-gray-400">ÉpítőTudás Építőipari Anyagkatalógus v1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
