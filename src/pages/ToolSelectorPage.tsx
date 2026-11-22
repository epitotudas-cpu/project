import { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Laptop,
  Layers,
  Library,
  Search,
  X,
  Building2,
  Check,
  Scale,
} from 'lucide-react';
import {
  fetchMaterialsFromCloud,
  type MaterialItem,
  type MaterialCategory,
} from '../services/materialsService';
import SectionSubNav from '../components/SectionSubNav';
import PaginationControls, { usePagination } from '../components/PaginationControls';
import { stripMarkdownToPlainText } from '../components/FormattedText';

const MAX_COMPARE_ITEMS = 4;

function formatCompareValue(value: string | null | undefined): string {
  if (typeof value !== 'string') return '—';
  const trimmed = value.trim();
  return trimmed ? trimmed : '—';
}

interface ToolSelectorPageProps {
  onNavigate: (page: string) => void;
}

export default function ToolSelectorPage({ onNavigate }: ToolSelectorPageProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [loadedMaterials, setLoadedMaterials] = useState<MaterialItem[]>([]);
  const [loadedCategories, setLoadedCategories] = useState<MaterialCategory[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareLimitNotice, setCompareLimitNotice] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingMaterials(true);
      setFetchError(false);
      try {
        const { items, categories, error } = await fetchMaterialsFromCloud();
        if (cancelled) return;
        if (error) {
          setLoadedMaterials([]);
          setFetchError(true);
          return;
        }
        const publishedOnly = (items || []).filter((item) => item.status === 'published');
        setLoadedMaterials(publishedOnly);
        if (Array.isArray(categories)) {
          setLoadedCategories(categories.filter((c) => c.is_active));
        }
      } catch {
        if (!cancelled) {
          setLoadedMaterials([]);
          setFetchError(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingMaterials(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableCategories = useMemo(() => {
    const map = new Map<string, string>();
    loadedCategories.forEach((cat) => {
      if (cat.id && cat.name) map.set(cat.id, cat.name);
    });
    loadedMaterials.forEach((item) => {
      const key = item.category_id || item.category_name;
      if (key && item.category_name && !map.has(key)) {
        map.set(key, item.category_name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'hu'));
  }, [loadedCategories, loadedMaterials]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    loadedMaterials.forEach((item) => {
      if (item.brand && item.brand.trim()) set.add(item.brand.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'hu'));
  }, [loadedMaterials]);

  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return loadedMaterials
      .filter((item) => {
        if (item.status !== 'published') return false;
        if (
          selectedCategory !== 'all' &&
          item.category_id !== selectedCategory &&
          item.category_name !== selectedCategory
        ) {
          return false;
        }
        if (selectedBrand !== 'all' && item.brand !== selectedBrand) {
          return false;
        }
        if (q) {
          const matchName = (item.name || '').toLowerCase().includes(q);
          const matchBrand = (item.brand || '').toLowerCase().includes(q);
          const matchPartner = (item.partner_name || '').toLowerCase().includes(q);
          const matchSku = (item.sku || '').toLowerCase().includes(q);
          const matchDesc = (item.short_description || '').toLowerCase().includes(q);
          const matchCat = (item.category_name || '').toLowerCase().includes(q);
          const matchKeywords = (item.keywords || []).some((k) => (k || '').toLowerCase().includes(q));
          if (!matchName && !matchBrand && !matchPartner && !matchSku && !matchDesc && !matchCat && !matchKeywords) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        return (a.name || '').localeCompare(b.name || '', 'hu');
      });
  }, [loadedMaterials, searchQuery, selectedCategory, selectedBrand]);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedMaterials,
  } = usePagination(filteredMaterials, 24, `${searchQuery}|${selectedCategory}|${selectedBrand}`);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
  };

  useEffect(() => {
    if (loadingMaterials) return;
    const validIds = new Set(loadedMaterials.map((item) => item.id));
    setSelectedCompareIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [loadedMaterials, loadingMaterials]);

  const selectedCompareProducts = useMemo(() => {
    const byId = new Map(loadedMaterials.map((item) => [item.id, item]));
    return selectedCompareIds
      .map((id) => byId.get(id))
      .filter((item): item is MaterialItem => Boolean(item));
  }, [loadedMaterials, selectedCompareIds]);

  useEffect(() => {
    if (isCompareOpen && selectedCompareProducts.length < 2) {
      setIsCompareOpen(false);
    }
  }, [isCompareOpen, selectedCompareProducts.length]);

  const toggleCompareItem = (id: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        setCompareLimitNotice(false);
        return prev.filter((itemId) => itemId !== id);
      }
      if (prev.length >= MAX_COMPARE_ITEMS) {
        setCompareLimitNotice(true);
        return prev;
      }
      setCompareLimitNotice(false);
      return [...prev, id];
    });
  };

  const clearCompareSelection = () => {
    setSelectedCompareIds([]);
    setCompareLimitNotice(false);
    setIsCompareOpen(false);
  };

  const comparedSpecRows = useMemo(() => {
    const labelByKey = new Map<string, string>();
    const valuesByProduct = new Map<string, Map<string, string[]>>();

    selectedCompareProducts.forEach((product) => {
      const productMap = new Map<string, string[]>();
      const specs = Array.isArray(product.technical_specs) ? product.technical_specs : [];
      specs.forEach((spec) => {
        if (!spec || typeof spec !== 'object') return;
        const rawLabel = typeof spec.label === 'string' ? spec.label.trim() : '';
        if (!rawLabel) return;

        const normKey = rawLabel.toLowerCase();
        if (!labelByKey.has(normKey)) {
          labelByKey.set(normKey, rawLabel);
        }

        const rawValue =
          typeof spec.value === 'string' || typeof spec.value === 'number'
            ? String(spec.value).trim()
            : '';
        if (!rawValue) return;

        const rawUnit = typeof spec.unit === 'string' ? spec.unit.trim() : '';
        const formatted = rawUnit ? `${rawValue} ${rawUnit}` : rawValue;
        const existing = productMap.get(normKey) || [];
        existing.push(formatted);
        productMap.set(normKey, existing);
      });
      valuesByProduct.set(product.id, productMap);
    });

    return Array.from(labelByKey.entries()).map(([key, label]) => ({
      key,
      label,
      values: selectedCompareProducts.map((product) => {
        const list = valuesByProduct.get(product.id)?.get(key);
        return list && list.length > 0 ? list.join(', ') : '—';
      }),
    }));
  }, [selectedCompareProducts]);

  return (
    <div className="bg-[#f5f5f5] text-[#202628] min-h-screen pb-16">
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
            <button
              onClick={() => onNavigate('tool')}
              className="hover:text-white transition-colors"
            >
              Eszközök
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Eszközválasztó</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Interaktív Eszköz- és Gépválasztó
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
              Válaszd ki a szakmádat és a keresett eszköztípust, mi pedig pontosan ajánljuk a legmegfelelőbb építőipari gépeket, szerszámokat és gyártói termékeket!
            </p>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Eszközök navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Gép & Szerszám Katalógus',
            page: 'tool',
            icon: <Wrench size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Anyagok',
            page: 'materials',
            icon: <Layers size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Szoftverek',
            page: 'software',
            icon: <Laptop size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Eszközválasztó',
            page: 'valaszto',
            icon: <Sparkles size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Szakmai Könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Interactive Selector Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-accent/10 border border-accent/30 rounded-xl text-primary font-bold">
                <Filter size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Eszköz Szűrési Feltételek</h3>
                <p className="text-xs text-gray-500">Állítsd be a szempontokat a célzott gépajánláshoz</p>
              </div>
            </div>

            {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} /> Szűrők alaphelyzetbe
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Szabad szavas kereső */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                1. Keresés (név, márka, partner, cikkszám)
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pl. hőszigetelő, Leier, SKU..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    aria-label="Keresés törlése"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Kategória választó */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                2. Kategória
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">Minden kategória (Összes)</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Márka / gyártó választó */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                3. Márka / Gyártó
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-medium focus:outline-none focus:border-primary transition-colors"
              >
                <option value="all">Minden márka (Összes)</option>
                {availableBrands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-accent" /> Publikált Partneri Termékek ({filteredMaterials.length})
          </h2>
          <span className="text-xs text-gray-500">
            {loadingMaterials
              ? 'Betöltés...'
              : fetchError
                ? 'A katalógus jelenleg nem érhető el'
                : 'Élő publikált partnerkatalógus'}
          </span>
        </div>

        {/* Results Grid */}
        {loadingMaterials ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-3">
            <RefreshCw size={32} className="mx-auto text-gray-300 animate-spin" />
            <p className="text-gray-500 text-sm font-medium">
              Termékkatalógus betöltése...
            </p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-red-200 space-y-3">
            <Wrench size={40} className="mx-auto text-red-300" />
            <p className="text-red-600 text-sm font-medium">
              A termékkatalógus betöltése sikertelen volt. Kérjük, próbálja meg később.
            </p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 space-y-3">
            <Wrench size={40} className="mx-auto text-gray-300" />
            <p className="text-gray-500 text-sm font-medium">
              {loadedMaterials.length === 0
                ? 'Jelenleg nincs publikált partneri termék a katalógusban.'
                : 'A kiválasztott szűrőkkel nem található termék.'}
            </p>
            {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-colors cursor-pointer"
              >
                Szűrők alaphelyzetbe állítása
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMaterials.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 hover:border-primary/40 hover:shadow-md rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    {item.category_name && (
                      <span className="bg-primary/10 text-primary-900 border border-primary/20 px-2.5 py-0.5 rounded-full font-bold truncate max-w-[160px]">
                        {item.category_name}
                      </span>
                    )}
                    {item.brand && (
                      <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                        {item.brand}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-gray-900 leading-snug">
                    {item.name}
                  </h3>

                  {item.short_description && (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {stripMarkdownToPlainText(item.short_description)}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500 pt-1">
                    {item.partner_name && (
                      <span className="inline-flex items-center gap-1 font-semibold truncate">
                        <Building2 size={12} className="text-accent shrink-0" /> {item.partner_name}
                      </span>
                    )}
                    {item.sku && (
                      <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 shrink-0">
                        SKU: {item.sku}
                      </span>
                    )}
                  </div>

                  {item.technical_specs && item.technical_specs.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-gray-100">
                      {item.technical_specs.slice(0, 2).map((spec, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-medium"
                        >
                          {spec.label}: <strong>{spec.value} {spec.unit || ''}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {item.featured && (
                    <div className="flex items-center gap-2 flex-wrap pt-1.5 border-t border-gray-100">
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={11} className="text-amber-600" /> Kiemelt termék
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                  <button
                    onClick={() => onNavigate('materials')}
                    className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Megtekintés a Katalógusban <ArrowRight size={13} />
                  </button>

                  {(() => {
                    const isSelected = selectedCompareIds.includes(item.id);
                    const isLimitReached = !isSelected && selectedCompareIds.length >= MAX_COMPARE_ITEMS;
                    return (
                      <button
                        type="button"
                        onClick={() => toggleCompareItem(item.id)}
                        aria-pressed={isSelected}
                        aria-disabled={isLimitReached}
                        title={
                          isLimitReached
                            ? `Legfeljebb ${MAX_COMPARE_ITEMS} termék hasonlítható össze`
                            : undefined
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : isLimitReached
                              ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check size={13} /> Kijelölve
                          </>
                        ) : (
                          '+ Összehasonlítás'
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMaterials.length}
          itemLabel="termék"
          onPageChange={setCurrentPage}
        />

        {/* Comparison Selection Bar */}
        {selectedCompareProducts.length > 0 && (
          <div className="sticky bottom-4 z-30 bg-white border border-primary/25 shadow-lg rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
                <Scale size={16} className="text-primary shrink-0" />
                <span>
                  Összehasonlításra kijelölve: {selectedCompareProducts.length} / {MAX_COMPARE_ITEMS} termék
                </span>
              </div>
              {compareLimitNotice || selectedCompareProducts.length >= MAX_COMPARE_ITEMS ? (
                <p className="text-xs font-semibold text-amber-700">
                  Elérted a maximumot: legfeljebb {MAX_COMPARE_ITEMS} termék jelölhető ki egyszerre.
                </p>
              ) : selectedCompareProducts.length === 1 ? (
                <p className="text-xs text-gray-500">
                  Az összehasonlításhoz válassz ki még legalább 1 terméket.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearCompareSelection}
                className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
              >
                Kijelölések törlése
              </button>
              <button
                type="button"
                disabled={selectedCompareProducts.length < 2}
                onClick={() => setIsCompareOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Scale size={14} /> Összehasonlítás ({selectedCompareProducts.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {isCompareOpen && selectedCompareProducts.length >= 2 && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsCompareOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Termékek összehasonlítása"
        >
          <div
            className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-primary shrink-0" />
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  Termékek összehasonlítása ({selectedCompareProducts.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearCompareSelection}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                >
                  Kijelölések törlése
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompareOpen(false)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Összehasonlítás bezárása"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse text-left text-xs sm:text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 font-extrabold text-gray-700 border-r border-gray-200 min-w-[150px] sm:min-w-[200px]">
                      Paraméter
                    </th>
                    {selectedCompareProducts.map((product) => (
                      <th
                        key={product.id}
                        className="px-4 py-3 font-black text-gray-900 align-top min-w-[180px]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="leading-snug">{formatCompareValue(product.name)}</span>
                          <button
                            type="button"
                            onClick={() => toggleCompareItem(product.id)}
                            className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            aria-label={`${formatCompareValue(product.name)} eltávolítása`}
                            title="Eltávolítás az összehasonlításból"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    {
                      label: 'Terméknév',
                      getValue: (p: MaterialItem) => formatCompareValue(p.name),
                    },
                    {
                      label: 'Márka',
                      getValue: (p: MaterialItem) => formatCompareValue(p.brand),
                    },
                    {
                      label: 'Partner',
                      getValue: (p: MaterialItem) => formatCompareValue(p.partner_name),
                    },
                    {
                      label: 'Kategória',
                      getValue: (p: MaterialItem) => formatCompareValue(p.category_name),
                    },
                    {
                      label: 'Alkategória',
                      getValue: (p: MaterialItem) => formatCompareValue(p.subcategory_name),
                    },
                    {
                      label: 'Cikkszám',
                      getValue: (p: MaterialItem) => formatCompareValue(p.sku),
                    },
                    {
                      label: 'Vonalkód',
                      getValue: (p: MaterialItem) => formatCompareValue(p.barcode),
                    },
                    {
                      label: 'Alkalmazási terület',
                      getValue: (p: MaterialItem) => formatCompareValue(p.application_area),
                    },
                    {
                      label: 'Dokumentumok száma',
                      getValue: (p: MaterialItem) =>
                        Array.isArray(p.documents) ? `${p.documents.length} db` : '—',
                    },
                  ].map((row) => (
                    <tr key={row.label} className="bg-white">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-gray-700 border-r border-gray-200">
                        {row.label}
                      </td>
                      {selectedCompareProducts.map((product) => (
                        <td key={product.id} className="px-4 py-3 text-gray-800 align-top">
                          {row.getValue(product)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {comparedSpecRows.length > 0 && (
                    <tr className="bg-gray-50/80">
                      <td
                        colSpan={selectedCompareProducts.length + 1}
                        className="px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-500"
                      >
                        Műszaki paraméterek
                      </td>
                    </tr>
                  )}

                  {comparedSpecRows.map((specRow) => (
                    <tr key={specRow.key} className="bg-white">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-gray-700 border-r border-gray-200">
                        {specRow.label}
                      </td>
                      {specRow.values.map((val, idx) => (
                        <td key={selectedCompareProducts[idx].id} className="px-4 py-3 text-gray-800 align-top">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
