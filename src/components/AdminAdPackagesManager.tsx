import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Star,
  Eye,
  EyeOff,
  Search,
  Save,
  AlertCircle,
  FileText,
  DollarSign,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  getAdPackages,
  saveAdPackage,
  deleteAdPackage,
  duplicateAdPackage,
  reorderAdPackages,
  type ManagedAdPackage,
} from '../services/adPackageService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

export function AdminAdPackagesManager() {
  const [packages, setPackages] = useState<ManagedAdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'admin_only'>('all');

  // Modals & Actions State
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ManagedAdPackage | null>(null);
  const [deleteConfirmPkg, setDeleteConfirmPkg] = useState<ManagedAdPackage | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formValuePromise, setFormValuePromise] = useState('');
  const [formInternalName, setFormInternalName] = useState('');
  const [formPriceHuf, setFormPriceHuf] = useState<number>(49000);
  const [formPriceType, setFormPriceType] = useState<'fixed' | 'custom'>('fixed');
  const [formCurrency, setFormCurrency] = useState<'HUF' | 'EUR'>('HUF');
  const [formBillingPeriod, setFormBillingPeriod] = useState<'monthly' | 'quarterly' | 'annual' | 'once'>('monthly');
  const [formDurationDays, setFormDurationDays] = useState<number>(30);
  const [formDurationOptionsText, setFormDurationOptionsText] = useState('30 nap');
  const [formDescription, setFormDescription] = useState('');
  const [formFeaturesText, setFormFeaturesText] = useState('');
  const [formPlacementsSummary, setFormPlacementsSummary] = useState('');
  const [formTargetAudiencesSummary, setFormTargetAudiencesSummary] = useState('');
  const [formImpressionLimit, setFormImpressionLimit] = useState<string>('');
  const [formGuaranteedImpressions, setFormGuaranteedImpressions] = useState<string>('');
  const [formGuaranteeTerms, setFormGuaranteeTerms] = useState('');
  const [formCreativeUpdatesCount, setFormCreativeUpdatesCount] = useState<number>(1);
  const [formSponsoredArticlesCount, setFormSponsoredArticlesCount] = useState<number>(0);
  const [formHasFeaturedProfile, setFormHasFeaturedProfile] = useState(false);
  const [formHasDetailedReports, setFormHasDetailedReports] = useState(false);
  const [formCtaText, setFormCtaText] = useState('Csomag kiválasztása');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formVisibility, setFormVisibility] = useState<'public' | 'admin_only'>('public');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive' | 'archived'>('active');

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || siteSettings.adminAccentColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };
  const labelStyle = { color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' };
  const labelClass = 'block text-xs font-bold mb-1';
  const fieldClass = 'w-full border rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors';

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setLoading(true);
    try {
      const data = await getAdPackages();
      setPackages(data);
    } catch (err) {
      console.error('Hiba a reklámcsomagok betöltésekor:', err);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function openCreateModal() {
    setEditingPkg(null);
    setFormName('');
    setFormValuePromise('');
    setFormInternalName('');
    setFormPriceHuf(99000);
    setFormPriceType('fixed');
    setFormCurrency('HUF');
    setFormBillingPeriod('monthly');
    setFormDurationDays(30);
    setFormDurationOptionsText('30 nap');
    setFormDescription('');
    setFormFeaturesText('');
    setFormPlacementsSummary('');
    setFormTargetAudiencesSummary('');
    setFormImpressionLimit('');
    setFormGuaranteedImpressions('');
    setFormGuaranteeTerms('');
    setFormCreativeUpdatesCount(1);
    setFormSponsoredArticlesCount(0);
    setFormHasFeaturedProfile(true);
    setFormHasDetailedReports(true);
    setFormCtaText('Csomag kiválasztása');
    setFormIsFeatured(false);
    setFormIsPopular(false);
    setFormVisibility('public');
    setFormStatus('active');
    setShowModal(true);
  }

  function openEditModal(pkg: ManagedAdPackage) {
    setEditingPkg(pkg);
    setFormName(pkg.name);
    setFormValuePromise(pkg.value_promise);
    setFormInternalName(pkg.internal_name || '');
    setFormPriceHuf(pkg.price_huf);
    setFormPriceType(pkg.price_type);
    setFormCurrency(pkg.currency);
    setFormBillingPeriod(pkg.billing_period);
    setFormDurationDays(pkg.duration_days);
    setFormDurationOptionsText((pkg.duration_options || []).join(', ') || `${pkg.duration_days} nap`);
    setFormDescription(pkg.description);
    setFormFeaturesText(pkg.features.join('\n'));
    setFormPlacementsSummary(pkg.placements_summary || '');
    setFormTargetAudiencesSummary(pkg.target_audiences_summary || '');
    setFormImpressionLimit(pkg.impression_limit ? String(pkg.impression_limit) : '');
    setFormGuaranteedImpressions(pkg.guaranteed_impressions ? String(pkg.guaranteed_impressions) : '');
    setFormGuaranteeTerms(pkg.guarantee_terms || '');
    setFormCreativeUpdatesCount(pkg.creative_updates_count);
    setFormSponsoredArticlesCount(pkg.sponsored_articles_count);
    setFormHasFeaturedProfile(pkg.has_featured_profile);
    setFormHasDetailedReports(pkg.has_detailed_reports);
    setFormCtaText(pkg.cta_text);
    setFormIsFeatured(pkg.is_featured);
    setFormIsPopular(pkg.is_popular);
    setFormVisibility(pkg.visibility);
    setFormStatus(pkg.status);
    setShowModal(true);
  }

  async function handleSavePackage(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Kérlek add meg a csomag nevét!');
      return;
    }

    setSaving(true);
    try {
      const featuresArray = formFeaturesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const durationOpts = formDurationOptionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: Partial<ManagedAdPackage> & { name: string } = {
        id: editingPkg?.id,
        name: formName.trim(),
        value_promise: formValuePromise.trim() || 'Szakmai ajánlat',
        internal_name: formInternalName.trim() || formName.trim(),
        price_huf: formPriceType === 'custom' ? 0 : Number(formPriceHuf) || 0,
        price_type: formPriceType,
        currency: formCurrency,
        billing_period: formBillingPeriod,
        duration_days: Number(formDurationDays) || 30,
        duration_options: durationOpts.length > 0 ? durationOpts : [`${formDurationDays} nap`],
        description: formDescription.trim(),
        features: featuresArray,
        placements_summary: formPlacementsSummary.trim(),
        target_audiences_summary: formTargetAudiencesSummary.trim(),
        impression_limit: formImpressionLimit ? Number(formImpressionLimit) : null,
        guaranteed_impressions: formGuaranteedImpressions ? Number(formGuaranteedImpressions) : null,
        guarantee_terms: formGuaranteeTerms.trim() || null,
        creative_updates_count: Number(formCreativeUpdatesCount) || 0,
        sponsored_articles_count: Number(formSponsoredArticlesCount) || 0,
        has_featured_profile: formHasFeaturedProfile,
        has_detailed_reports: formHasDetailedReports,
        cta_text: formCtaText.trim() || 'Csomag kiválasztása',
        is_featured: formIsFeatured,
        is_popular: formIsPopular,
        visibility: formVisibility,
        status: formStatus,
      };

      await saveAdPackage(payload);
      await loadPackages();
      setShowModal(false);
      showToast(editingPkg ? 'Csomag sikeresen frissítve!' : 'Új reklámcsomag sikeresen létrehozva!');
    } catch (err) {
      console.error('Hiba a mentéskor:', err);
      alert('Hiba történt a csomag mentésekor.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateAdPackage(id);
      await loadPackages();
      showToast('Csomag sikeresen lemásolva!');
    } catch (err) {
      console.error('Hiba a másoláskor:', err);
      alert('Nem sikerült a csomag másolása.');
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === packages.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const copy = [...packages];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;

    const newOrderedIds = copy.map((p) => p.id);
    const updated = await reorderAdPackages(newOrderedIds);
    setPackages(updated);
  }

  async function handleToggleField(pkg: ManagedAdPackage, field: 'is_featured' | 'is_popular' | 'visibility' | 'status') {
    let update: Partial<ManagedAdPackage> = {};
    if (field === 'is_featured') update = { is_featured: !pkg.is_featured };
    if (field === 'is_popular') update = { is_popular: !pkg.is_popular };
    if (field === 'visibility') update = { visibility: pkg.visibility === 'public' ? 'admin_only' : 'public' };
    if (field === 'status') update = { status: pkg.status === 'active' ? 'inactive' : 'active' };

    await saveAdPackage({ ...pkg, ...update });
    await loadPackages();
    showToast('Csomag állapota frissítve!');
  }

  async function handleConfirmDelete() {
    if (!deleteConfirmPkg) return;
    try {
      await deleteAdPackage(deleteConfirmPkg.id);
      await loadPackages();
      setDeleteConfirmPkg(null);
      showToast('Csomag sikeresen törölve!');
    } catch (err) {
      console.error('Hiba a törléskor:', err);
      alert('Nem sikerült a csomag törlése.');
    }
  }

  // Filter packages for display
  const filteredPackages = packages.filter((pkg) => {
    if (statusFilter !== 'all' && pkg.status !== statusFilter) return false;
    if (visibilityFilter !== 'all' && pkg.visibility !== visibilityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        pkg.name.toLowerCase().includes(q) ||
        pkg.value_promise.toLowerCase().includes(q) ||
        (pkg.description && pkg.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="border rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package size={22} style={{ color: cardHighlight }} />
            <h2 style={{ color: textColor }} className="text-xl font-black tracking-tight">
              B2B Reklámcsomagok &amp; Árlista Kezelő
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {packages.length} csomag a rendszerben
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Dinamikusan kezelt partneri csomagok, árazás, időtartamok, B2B értékértékek és láthatóság.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{ backgroundColor: cardHighlight, color: '#000000' }}
          className="px-5 py-2.5 font-black text-xs rounded-xl shadow-md transition-all hover:opacity-90 flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} /> Új Reklámcsomag Létrehozása
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/20 p-4 rounded-2xl border border-gray-800">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés csomag neve vagy leírása alapján..."
            style={fieldStyle}
            className={`${fieldClass} pl-9`}
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={fieldStyle}
            className={fieldClass}
          >
            <option value="all">Minden állapot (Aktív / Inaktív / Archivált)</option>
            <option value="active">🟢 Csak Aktív csomagok</option>
            <option value="inactive">🔴 Csak Inaktív csomagok</option>
            <option value="archived">⚫ Csak Archivált csomagok</option>
          </select>
        </div>

        <div>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            style={fieldStyle}
            className={fieldClass}
          >
            <option value="all">Minden láthatóság (Nyilvános / Csak Admin)</option>
            <option value="public">🌐 Nyilvános csomagok</option>
            <option value="admin_only">🔒 Csak Adminban látható csomagok</option>
          </select>
        </div>
      </div>

      {/* Package Cards List */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-xs font-medium">Reklámcsomagok betöltése...</div>
      ) : filteredPackages.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-gray-800 rounded-2xl text-gray-400 text-xs">
          Nincs a szűrésnek megfelelő reklámcsomag a rendszerben.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {filteredPackages.map((pkg, idx) => {
            const isCustom = pkg.price_type === 'custom';

            return (
              <div
                key={pkg.id}
                style={{ backgroundColor: inputBg, borderColor: pkg.is_featured ? cardHighlight : cardBorder }}
                className={`p-6 rounded-3xl border flex flex-col justify-between space-y-5 transition-all shadow-lg relative group ${
                  pkg.status !== 'active' ? 'opacity-60' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Badges & Reorder Controls */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pkg.is_featured && (
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Star size={11} className="fill-emerald-400" /> Ajánlott
                        </span>
                      )}
                      {pkg.is_popular && (
                        <span className="px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles size={11} className="text-amber-400" /> Legnépszerűbb
                        </span>
                      )}
                      {pkg.visibility === 'admin_only' && (
                        <span className="px-2 py-0.5 rounded-md font-mono text-[9px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          🔒 Csak Admin
                        </span>
                      )}
                      {pkg.status !== 'active' && (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[9px] bg-red-500/20 text-red-300 border border-red-500/30">
                          {pkg.status === 'inactive' ? 'Inaktív' : 'Archivált'}
                        </span>
                      )}
                    </div>

                    {/* Move Up / Down */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-20 cursor-pointer text-gray-300"
                        title="Mozgatás fel"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === packages.length - 1}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-20 cursor-pointer text-gray-300"
                        title="Mozgatás le"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Value Promise */}
                  <div className="space-y-1">
                    <span style={{ color: cardHighlight }} className="text-[11px] font-black uppercase tracking-wider block">
                      {pkg.value_promise}
                    </span>
                    <h3 className="text-lg font-black text-white leading-tight">{pkg.name}</h3>
                    {pkg.internal_name && (
                      <span className="text-[10px] text-gray-400 font-mono block">Belső név: {pkg.internal_name}</span>
                    )}
                  </div>

                  {/* Price & Billing */}
                  <div className="p-3.5 bg-black/30 rounded-2xl border border-white/5 space-y-1">
                    <div className="text-xl font-black text-emerald-400">
                      {isCustom ? (
                        <span>Egyedi ajánlat</span>
                      ) : (
                        <span>
                          {pkg.price_huf.toLocaleString('hu-HU')} HUF{' '}
                          <span className="text-xs text-gray-400 font-normal">/ {pkg.billing_period === 'monthly' ? 'hó' : 'periódus'}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 font-medium">
                      Kampányidőszak: <strong className="text-white font-mono">{pkg.duration_days} nap</strong>
                      {pkg.duration_options && pkg.duration_options.length > 1 && (
                        <span> (Opciók: {pkg.duration_options.join(', ')})</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {pkg.description && (
                    <p className="text-xs text-gray-300 leading-relaxed italic line-clamp-2">
                      "{pkg.description}"
                    </p>
                  )}

                  {/* Features List */}
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      Csomag tartalma:
                    </span>
                    <ul className="space-y-1.5 text-xs text-gray-200">
                      {pkg.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 leading-tight">
                          <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* B2B Metrics Summary */}
                  <div className="p-3 bg-black/20 rounded-xl space-y-1 text-[11px] text-gray-300 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span>Kreatívfrissítés:</span>
                      <strong className="text-white font-mono">{pkg.creative_updates_count > 0 ? `${pkg.creative_updates_count} / hó` : 'Nincs'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Szponzorált cikk:</span>
                      <strong className="text-white font-mono">{pkg.sponsored_articles_count > 0 ? `${pkg.sponsored_articles_count} db` : 'Nincs'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Kiemelt profil:</span>
                      <strong className={pkg.has_featured_profile ? 'text-emerald-400' : 'text-gray-500'}>
                        {pkg.has_featured_profile ? '✔ Igen' : '✘ Nem'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Részletes riport:</span>
                      <strong className={pkg.has_detailed_reports ? 'text-emerald-400' : 'text-gray-500'}>
                        {pkg.has_detailed_reports ? '✔ Igen' : '✘ Nem'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(pkg)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 size={13} /> Szerkesztés
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(pkg.id)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy size={13} /> Másolás
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleField(pkg, 'visibility')}
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      {pkg.visibility === 'public' ? <Eye size={13} className="text-emerald-400" /> : <EyeOff size={13} className="text-slate-400" />}
                      <span>{pkg.visibility === 'public' ? 'Nyilvános' : 'Rejtett'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmPkg(pkg)}
                      className="text-red-400 hover:text-red-300 font-bold transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <Trash2 size={13} /> Törlés
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
            className="border rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
          >
            {/* Modal Header */}
            <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="px-6 py-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={20} style={{ color: cardHighlight }} />
                <h3 className="font-extrabold text-base" style={{ color: textColor }}>
                  {editingPkg ? `Reklámcsomag szerkesztése: ${editingPkg.name}` : 'Új B2B Reklámcsomag Létrehozása'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSavePackage} className="flex-1 flex flex-col min-h-0">
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Section 1: Alapadatok & Árazás */}
                <div className="space-y-4">
                  <h4 style={{ color: cardHighlight }} className="font-extrabold uppercase tracking-wider border-b border-gray-800 pb-1.5 flex items-center gap-2">
                    <DollarSign size={15} /> 1. Alapadatok &amp; Árazás
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle} className={labelClass}>Csomag Neve *</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="pl. Gold – Tartalmi partner"
                        style={fieldStyle}
                        className={fieldClass}
                        required
                      />
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Rövid Értékígéret / Alcím *</label>
                      <input
                        type="text"
                        value={formValuePromise}
                        onChange={(e) => setFormValuePromise(e.target.value)}
                        placeholder="pl. Tartalmi partner / Szakmai jelenlét"
                        style={fieldStyle}
                        className={fieldClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label style={labelStyle} className={labelClass}>Belső Admin Név (Opcionális)</label>
                      <input
                        type="text"
                        value={formInternalName}
                        onChange={(e) => setFormInternalName(e.target.value)}
                        placeholder="pl. Gold B2B 2026"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Ár Kijelzés Típusa</label>
                      <select
                        value={formPriceType}
                        onChange={(e) => setFormPriceType(e.target.value as any)}
                        style={fieldStyle}
                        className={fieldClass}
                      >
                        <option value="fixed">Fix áras csomag (HUF)</option>
                        <option value="custom">Egyedi ajánlat (Enterprise / Megállapodás)</option>
                      </select>
                    </div>

                    {formPriceType === 'fixed' && (
                      <div>
                        <label style={labelStyle} className={labelClass}>Ár (Ft / hó) *</label>
                        <input
                          type="number"
                          value={formPriceHuf}
                          onChange={(e) => setFormPriceHuf(Number(e.target.value))}
                          placeholder="249000"
                          style={fieldStyle}
                          className={fieldClass}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label style={labelStyle} className={labelClass}>Számlázási Periódus</label>
                      <select
                        value={formBillingPeriod}
                        onChange={(e) => setFormBillingPeriod(e.target.value as any)}
                        style={fieldStyle}
                        className={fieldClass}
                      >
                        <option value="monthly">Havi számlázás</option>
                        <option value="quarterly">Negyedéves számlázás</option>
                        <option value="annual">Éves számlázás</option>
                        <option value="once">Egyszeri díj</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Alapértelmezett Időtartam (napokban)</label>
                      <input
                        type="number"
                        value={formDurationDays}
                        onChange={(e) => setFormDurationDays(Number(e.target.value))}
                        placeholder="30"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Választható Időtartam Opciók (vesszővel)</label>
                      <input
                        type="text"
                        value={formDurationOptionsText}
                        onChange={(e) => setFormDurationOptionsText(e.target.value)}
                        placeholder="30 nap, 60 nap, 90 nap"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Leírás & Funkciók */}
                <div className="space-y-4">
                  <h4 style={{ color: cardHighlight }} className="font-extrabold uppercase tracking-wider border-b border-gray-800 pb-1.5 flex items-center gap-2">
                    <FileText size={15} /> 2. Leírás &amp; Csomag Előnyei
                  </h4>

                  <div>
                    <label style={labelStyle} className={labelClass}>Rövid Leírás</label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Csomag értékesítési leírása..."
                      style={fieldStyle}
                      className={`${fieldClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label style={labelStyle} className={labelClass}>Csomag Előnyeinek Listája (soronként 1 elem) *</label>
                    <textarea
                      rows={4}
                      value={formFeaturesText}
                      onChange={(e) => setFormFeaturesText(e.target.value)}
                      placeholder="Rotációs bannerelhelyezés oldalsávon&#10;Kiemelt partneri profil az ÉpítőTudás oldalon&#10;Havi részletes teljesítményriport"
                      style={fieldStyle}
                      className={`${fieldClass} resize-none font-mono`}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle} className={labelClass}>Kapcsolódó Elhelyezések Summary</label>
                      <input
                        type="text"
                        value={formPlacementsSummary}
                        onChange={(e) => setFormPlacementsSummary(e.target.value)}
                        placeholder="pl. Főoldal top-banner, szponzorált cikk, eszközoldal"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Célzott Felületek / Célcsoport Summary</label>
                      <input
                        type="text"
                        value={formTargetAudiencesSummary}
                        onChange={(e) => setFormTargetAudiencesSummary(e.target.value)}
                        placeholder="pl. Kiemelt kivitelezők és szakemberek"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: B2B Kapacitások & Szolgáltatások */}
                <div className="space-y-4">
                  <h4 style={{ color: cardHighlight }} className="font-extrabold uppercase tracking-wider border-b border-gray-800 pb-1.5 flex items-center gap-2">
                    <BarChart3 size={15} /> 3. B2B Kapacitások &amp; Szolgáltatások
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle} className={labelClass}>Kreatívfrissítések Száma / hó</label>
                      <input
                        type="number"
                        value={formCreativeUpdatesCount}
                        onChange={(e) => setFormCreativeUpdatesCount(Number(e.target.value))}
                        placeholder="1"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Szponzorált Cikkek Száma</label>
                      <input
                        type="number"
                        value={formSponsoredArticlesCount}
                        onChange={(e) => setFormSponsoredArticlesCount(Number(e.target.value))}
                        placeholder="1"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-gray-800 bg-black/20">
                      <input
                        type="checkbox"
                        checked={formHasFeaturedProfile}
                        onChange={(e) => setFormHasFeaturedProfile(e.target.checked)}
                      />
                      <span className="font-bold text-xs text-white">⭐ Kiemelt partneri profil engedélyezve</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-gray-800 bg-black/20">
                      <input
                        type="checkbox"
                        checked={formHasDetailedReports}
                        onChange={(e) => setFormHasDetailedReports(e.target.checked)}
                      />
                      <span className="font-bold text-xs text-white">📊 Részletes teljesítményriport engedélyezve</span>
                    </label>
                  </div>
                </div>

                {/* Section 4: Garanciák & Limitek (Opcionális) */}
                <div className="space-y-4">
                  <h4 style={{ color: cardHighlight }} className="font-extrabold uppercase tracking-wider border-b border-gray-800 pb-1.5 flex items-center gap-2">
                    <ShieldCheck size={15} /> 4. Garanciák &amp; Limitek (Opcionális)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle} className={labelClass}>Garantált Megjelenésszám (Opcionális)</label>
                      <input
                        type="number"
                        value={formGuaranteedImpressions}
                        onChange={(e) => setFormGuaranteedImpressions(e.target.value)}
                        placeholder="pl. 20000"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Megjelenési Limit (Opcionális)</label>
                      <input
                        type="number"
                        value={formImpressionLimit}
                        onChange={(e) => setFormImpressionLimit(e.target.value)}
                        placeholder="pl. 50000"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle} className={labelClass}>Garantált Megjelenés Feltételei</label>
                    <input
                      type="text"
                      value={formGuaranteeTerms}
                      onChange={(e) => setFormGuaranteeTerms(e.target.value)}
                      placeholder="pl. Célzott rotációs megjelenés releváns szakmai felületeken"
                      style={fieldStyle}
                      className={fieldClass}
                    />
                  </div>
                </div>

                {/* Section 5: Státusz & Megjelenés */}
                <div className="space-y-4">
                  <h4 style={{ color: cardHighlight }} className="font-extrabold uppercase tracking-wider border-b border-gray-800 pb-1.5 flex items-center gap-2">
                    <Sparkles size={15} /> 5. Státusz &amp; Megjelenési Jelvények
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle} className={labelClass}>CTA Gomb Felirata</label>
                      <input
                        type="text"
                        value={formCtaText}
                        onChange={(e) => setFormCtaText(e.target.value)}
                        placeholder="Gold csomag kiválasztása"
                        style={fieldStyle}
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label style={labelStyle} className={labelClass}>Láthatóság</label>
                      <select
                        value={formVisibility}
                        onChange={(e) => setFormVisibility(e.target.value as any)}
                        style={fieldStyle}
                        className={fieldClass}
                      >
                        <option value="public">🌐 Nyilvános (látható a partneri árlistán)</option>
                        <option value="admin_only">🔒 Csak Adminban látható (rejtett ajánlat)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-gray-800 bg-black/20">
                      <input
                        type="checkbox"
                        checked={formIsFeatured}
                        onChange={(e) => setFormIsFeatured(e.target.checked)}
                      />
                      <span className="font-bold text-xs text-white">⭐ „Ajánlott” Jelvény (Zöld)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-gray-800 bg-black/20">
                      <input
                        type="checkbox"
                        checked={formIsPopular}
                        onChange={(e) => setFormIsPopular(e.target.checked)}
                      />
                      <span className="font-bold text-xs text-white">✨ „Legnépszerűbb” Jelvény (Sárga)</span>
                    </label>

                    <div>
                      <label style={labelStyle} className={labelClass}>Státusz</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as any)}
                        style={fieldStyle}
                        className={fieldClass}
                      >
                        <option value="active">🟢 Aktív</option>
                        <option value="inactive">🔴 Inaktív</option>
                        <option value="archived">⚫ Archivált</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="px-6 py-4 border-t flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border font-bold text-xs rounded-xl hover:opacity-80 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-6 py-2.5 font-black text-xs rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  <Save size={15} /> {saving ? 'Mentés...' : editingPkg ? 'Csomag Mentése' : 'Reklámcsomag Létrehozása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmPkg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
            className="border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-extrabold text-base text-white">Reklámcsomag törlése</h3>
            </div>

            <p className="text-gray-300">
              Biztosan törölni szeretnéd a(z) <strong className="text-white font-bold">{deleteConfirmPkg.name}</strong> reklámcsomagot?
            </p>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
              💡 <strong>Megjegyzés:</strong> A törlés után a csomag nem lesz elérhető új kampányok létrehozásakor. A már meglévő aktív kampányok adatai változatlanok maradnak.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPkg(null)}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-4 py-2 border font-bold text-xs rounded-xl hover:opacity-80 transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Igen, csomag törlése
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
