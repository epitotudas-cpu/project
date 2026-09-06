import { useState, useMemo } from 'react';
import {
  X, Save, Plus, Trash2, Globe, Shield, RefreshCw, CheckCircle2, AlertCircle, Pencil
} from 'lucide-react';
import {
  useGlossaryLanguages,
  saveGlossaryLanguage,
  toggleLanguageActive,
  deleteGlossaryLanguage,
} from '../services/languageService';
import type { GlossaryLanguage } from '../lib/supabase';
import { useToast } from './ToastProvider';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

interface GlossaryLanguageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PRESET_FLAGS = ['🇬🇧', '🇩🇪', '🇷🇴', '🇸kV', '🇸🇰', '🇭🇷', '🇮🇹', '🇫🇷', '🇪🇸', '🇵🇱', '🇺🇦', '🇹🇷'];

export default function GlossaryLanguageSettingsModal({
  isOpen,
  onClose,
}: GlossaryLanguageSettingsModalProps) {
  const toast = useToast();
  const { languages, loading, refresh } = useGlossaryLanguages();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLang, setEditingLang] = useState<GlossaryLanguage | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [nameHu, setNameHu] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [flagEmoji, setFlagEmoji] = useState('🌐');
  const [shortLabel, setShortLabel] = useState('');
  const [sortOrder, setSortOrder] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [isRtl, setIsRtl] = useState(false);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function resetForm() {
    setCode('');
    setNameHu('');
    setNativeName('');
    setFlagEmoji('🌐');
    setShortLabel('');
    setSortOrder(languages.length * 10 + 10);
    setIsActive(true);
    setIsRtl(false);
    setEditingLang(null);
    setShowAddForm(false);
  }

  function handleOpenCreate() {
    resetForm();
    setShowAddForm(true);
  }

  function handleOpenEdit(lang: GlossaryLanguage) {
    setEditingLang(lang);
    setCode(lang.iso_code);
    setNameHu(lang.name_hu);
    setNativeName(lang.name_native);
    setFlagEmoji(lang.flag_emoji || '🌐');
    setShortLabel(lang.short_label);
    setSortOrder(lang.sort_order);
    setIsActive(lang.is_active);
    setIsRtl(lang.is_rtl || false);
    setShowAddForm(true);
  }

  async function handleToggleActive(lang: GlossaryLanguage) {
    if (lang.is_system_protected || lang.iso_code === 'hu') {
      toast.error('Az alapértelmezett magyar (HU) nyelv nem kapcsolható ki!');
      return;
    }
    try {
      await toggleLanguageActive(lang.id);
      toast.success(`${lang.name_hu} (${lang.short_label}) állapota frissítve!`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hiba a nyelv állapotának módosításakor.');
    }
  }

  async function handleDelete(lang: GlossaryLanguage) {
    if (lang.is_system_protected || lang.iso_code === 'hu') {
      toast.error('Az alapértelmezett magyar (HU) nyelv nem törölhető!');
      return;
    }
    if (!window.confirm(`Biztosan törölni szeretnéd a(z) ${lang.name_hu} (${lang.short_label}) nyelvet?`)) {
      return;
    }

    try {
      await deleteGlossaryLanguage(lang.id);
      toast.success(`${lang.name_hu} sikeresen törölve!`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hiba történt a nyelv törlésekor.');
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const cleanCode = code.trim().toLowerCase();
    const cleanNameHu = nameHu.trim();
    const cleanNativeName = nativeName.trim() || cleanNameHu;
    const cleanShortLabel = (shortLabel.trim() || cleanCode).toUpperCase();

    if (!cleanCode || cleanCode.length < 2) {
      setStatusMessage({ type: 'error', text: 'Az ISO 639-1 nyelvkód legalább 2 karakteres legyen (pl. en, de, sk).' });
      return;
    }
    if (!cleanNameHu) {
      setStatusMessage({ type: 'error', text: 'A nyelv magyar neve kötelező!' });
      return;
    }

    // Uniqueness check for new language
    if (!editingLang && languages.some((l) => l.iso_code === cleanCode)) {
      setStatusMessage({ type: 'error', text: `A(z) "${cleanCode}" nyelvkód már létezik!` });
      return;
    }

    setSaving(true);
    try {
      await saveGlossaryLanguage({
        id: editingLang?.id,
        iso_code: cleanCode,
        name_hu: cleanNameHu,
        name_native: cleanNativeName,
        flag_emoji: flagEmoji.trim() || '🌐',
        short_label: cleanShortLabel,
        sort_order: Number(sortOrder) || 10,
        is_active: editingLang?.is_system_protected ? true : isActive,
        is_default: editingLang?.is_default || false,
        is_system_protected: editingLang?.is_system_protected || false,
        is_rtl: isRtl,
      });

      setStatusMessage({ type: 'success', text: 'A nyelv beállításai sikeresen elmentve!' });
      toast.success(`Nyelv mentve: ${cleanNameHu} (${cleanShortLabel})`);
      refresh();
      setTimeout(() => {
        resetForm();
      }, 1000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Hiba a mentés során.' });
    } finally {
      setSaving(false);
    }
  }

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);
  const inputBg = adjustColorBrightness(cardBg, -6);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };
  const labelStyle: React.CSSProperties = {
    color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563',
  };

  const sortedLanguages = useMemo(() => {
    return [...languages].sort((a, b) => a.sort_order - b.sort_order);
  }, [languages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
        className="border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="px-6 py-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }} className="p-2.5 border rounded-xl">
              <Globe size={20} />
            </div>
            <div>
              <h2 style={{ color: textColor }} className="text-lg font-black">Szótár Nyelveinek Kezelése</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Adj hozzá új célnyelveket a többnyelvű szakszótárhoz, szerkeszd vagy kapcsolod ki azokat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <span>Nyelvek száma:</span>
              <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded-full">{languages.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refresh}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-3 py-1.5 border text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer hover:opacity-90"
              >
                <RefreshCw size={13} /> Frissítés
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                style={{ backgroundColor: cardHighlight, color: '#000000' }}
                className="px-3.5 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-90 shadow-md"
              >
                <Plus size={14} /> + Új Nyelv Hozzáadása
              </button>
            </div>
          </div>

          {/* Form Modal/Accordion */}
          {showAddForm && (
            <form onSubmit={handleSubmitForm} style={{ backgroundColor: headerBg, borderColor: `${cardHighlight}60` }} className="border-2 rounded-xl p-5 space-y-4 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: cardBorder }}>
                <h3 style={{ color: cardHighlight }} className="font-black text-sm flex items-center gap-2">
                  <Globe size={16} /> {editingLang ? `"${editingLang.name_hu}" Nyelv Szerkesztése` : 'Új Nyelv Felvétele'}
                </h3>
                <button type="button" onClick={resetForm} className="text-xs text-gray-400 hover:text-white cursor-pointer">
                  Mégse
                </button>
              </div>

              {statusMessage && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${
                  statusMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {statusMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label style={labelStyle} className="text-xs font-bold block">ISO 639-1 Kód *</label>
                  <input
                    type="text"
                    required
                    disabled={editingLang?.is_system_protected}
                    placeholder="pl. en, de, sk, ro"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (!shortLabel) setShortLabel(e.target.value.toUpperCase());
                    }}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-xs font-mono placeholder-gray-500 focus:outline-none transition-colors uppercase"
                  />
                  <p className="text-[10px] text-gray-400">Egyedi 2 betűs kód</p>
                </div>

                <div className="space-y-1">
                  <label style={labelStyle} className="text-xs font-bold block">Név magyarul *</label>
                  <input
                    type="text"
                    required
                    placeholder="pl. Szlovák, Angol"
                    value={nameHu}
                    onChange={(e) => setNameHu(e.target.value)}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-xs placeholder-gray-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label style={labelStyle} className="text-xs font-bold block">Natív név</label>
                  <input
                    type="text"
                    placeholder="pl. Slovenčina, English"
                    value={nativeName}
                    onChange={(e) => setNativeName(e.target.value)}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-xs placeholder-gray-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label style={labelStyle} className="text-xs font-bold block">Rövid címke</label>
                  <input
                    type="text"
                    placeholder="pl. SK, EN, DE"
                    value={shortLabel}
                    onChange={(e) => setShortLabel(e.target.value.toUpperCase())}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-xs font-bold text-center placeholder-gray-500 focus:outline-none transition-colors uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label style={labelStyle} className="text-xs font-bold block">Zászló Emoji / Ikon</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={flagEmoji}
                      onChange={(e) => setFlagEmoji(e.target.value)}
                      placeholder="🇸🇰"
                      style={fieldStyle}
                      className="w-full border rounded-lg px-3 py-2 text-xs text-center font-bold text-base focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label style={labelStyle} className="text-xs font-bold block">Sorrend</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 10)}
                    style={fieldStyle}
                    className="w-full border rounded-lg px-3 py-2 text-xs font-bold text-center focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      disabled={editingLang?.is_system_protected}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded cursor-pointer"
                    />
                    <span>Aktív</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRtl}
                      onChange={(e) => setIsRtl(e.target.checked)}
                      className="h-4 w-4 rounded cursor-pointer"
                    />
                    <span>RTL</span>
                  </label>
                </div>
              </div>

              {/* Preset Emoji Row */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-gray-400 font-bold">Válassz zászlót gyorsan:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DEFAULT_PRESET_FLAGS.map((flag) => (
                    <button
                      key={flag}
                      type="button"
                      onClick={() => setFlagEmoji(flag)}
                      className={`px-2 py-1 border rounded text-sm hover:scale-125 transition-transform ${
                        flagEmoji === flag ? 'bg-amber-400/20 border-amber-400' : 'bg-black/20 border-gray-700'
                      }`}
                    >
                      {flag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: cardBorder }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border text-xs font-bold rounded-lg hover:opacity-80 transition-colors cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2 text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  <Save size={14} /> {saving ? 'Mentés...' : 'Nyelv Mentése'}
                </button>
              </div>
            </form>
          )}

          {/* Language List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-gray-400 font-bold animate-pulse">
                Nyelvek betöltése...
              </div>
            ) : sortedLanguages.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Még nincs rögzített nyelv a szótárban.
              </div>
            ) : (
              sortedLanguages.map((lang) => (
                <div
                  key={lang.id || lang.iso_code}
                  style={{
                    backgroundColor: lang.is_active ? headerBg : `${headerBg}50`,
                    borderColor: cardBorder,
                  }}
                  className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all ${
                    !lang.is_active ? 'opacity-60' : ''
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-2xl shrink-0 leading-none">{lang.flag_emoji || '🌐'}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 style={{ color: textColor }} className="font-bold text-sm">
                          {lang.name_hu}
                        </h4>
                        <span style={{ backgroundColor: `${cardHighlight}20`, borderColor: `${cardHighlight}40`, color: cardHighlight }} className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border">
                          {lang.short_label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">({lang.iso_code})</span>
                        {lang.is_system_protected && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <Shield size={10} /> Alapértelmezett Rendszernyelv
                          </span>
                        )}
                        {lang.is_rtl && (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            RTL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Natív: <span className="text-gray-300 italic">{lang.name_native}</span> • Sorrend: {lang.sort_order}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={lang.is_system_protected || lang.iso_code === 'hu'}
                      onClick={() => handleToggleActive(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        lang.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                      } ${lang.is_system_protected || lang.iso_code === 'hu' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {lang.is_active ? 'Aktív' : 'Inaktív'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(lang)}
                      style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                      className="p-2 border rounded-lg text-xs font-bold hover:opacity-80 transition-colors cursor-pointer"
                      title="Szerkesztés"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      disabled={lang.is_system_protected || lang.iso_code === 'hu'}
                      onClick={() => handleDelete(lang)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        lang.is_system_protected || lang.iso_code === 'hu'
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={lang.is_system_protected || lang.iso_code === 'hu' ? 'A védett alapnyelv nem törölhető' : 'Nyelv törlése'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="px-6 py-4 border-t sticky bottom-0 z-10 backdrop-blur-md flex items-center justify-between">
          <div className="text-xs text-gray-400">
            A rendszer automatikusan szinkronizálja az aktív nyelveket a nyilvános szótárral.
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="px-5 py-2 font-black text-xs rounded-xl transition-colors cursor-pointer hover:opacity-90 shadow-md"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
