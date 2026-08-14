import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Eye, EyeOff, Sparkles, Search, Layers, RefreshCw, Plus, Trash2, Upload, Image as ImageIcon, Link } from 'lucide-react';
import {
  getGlossaryCategorySettings,
  saveGlossaryCategorySettings,
  type GlossaryCategorySettings,
  type GlossaryCategorySettingItem,
} from '../services/glossaryCategorySettingsService';
import { useToast } from './ToastProvider';

interface GlossaryCategorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCategories?: string[];
}

const PRESET_EMOJIS = [
  '🏗️', '🚜', '🛠️', '🔧', '🛡️', '🌡️', '💧', '💨',
  '🧱', '🪵', '🏛️', '⚙️', '🏠', '⚡', '🖌️', '🔲',
  '🪚', '🧪', '📚', '🎯', '📦', '🏷️', '📐', '🔨',
  '⛏️', '🪓', '🪜', '🔌', '🚽', '🚿', '🔑', '🎨',
  '🚪', '🪟', '🌱', '📜', '🔒', '🧲',
];

export default function GlossaryCategorySettingsModal({
  isOpen,
  onClose,
  availableCategories = [],
}: GlossaryCategorySettingsModalProps) {
  const toast = useToast();
  const [settings, setSettings] = useState<GlossaryCategorySettings>(getGlossaryCategorySettings());
  const [searchFilter, setSearchFilter] = useState('');

  // Form State for Adding a New Category Icon
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🧱');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Hidden File Input Ref for Local File Uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadCatName, setActiveUploadCatName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getGlossaryCategorySettings();
      const updatedItems = { ...current.categoryItems };

      // Ensure all available categories are present in the settings object
      availableCategories.forEach((cat) => {
        if (!updatedItems[cat]) {
          updatedItems[cat] = {
            categoryName: cat,
            icon: '🧱',
            enabled: true,
          };
        }
      });

      setSettings({
        ...current,
        categoryItems: updatedItems,
      });
    }
  }, [isOpen, availableCategories]);

  const categoryList = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    const items = Object.values(settings.categoryItems);
    if (!q) return items;
    return items.filter((item) => item.categoryName.toLowerCase().includes(q));
  }, [settings.categoryItems, searchFilter]);

  if (!isOpen) return null;

  function handleSave() {
    saveGlossaryCategorySettings(settings);
    toast.success('Fogalomtár kategória beállítások és ikonok elmentve!');
    onClose();
  }

  function toggleGlobalSection(val: boolean) {
    setSettings((prev) => ({ ...prev, showFeaturedCategories: val }));
  }

  function toggleGlobalIcons(val: boolean) {
    setSettings((prev) => ({ ...prev, showCategoryIcons: val }));
  }

  function updateCategoryItem(catName: string, updates: Partial<GlossaryCategorySettingItem>) {
    setSettings((prev) => {
      const existing = prev.categoryItems[catName] || {
        categoryName: catName,
        icon: '🧱',
        enabled: true,
      };
      const updatedItem = { ...existing, ...updates };

      const updatedCategoryItems = { ...prev.categoryItems };
      if (updates.categoryName && updates.categoryName !== catName) {
        delete updatedCategoryItems[catName];
        updatedCategoryItems[updates.categoryName] = updatedItem;
      } else {
        updatedCategoryItems[catName] = updatedItem;
      }

      return {
        ...prev,
        categoryItems: updatedCategoryItems,
      };
    });
  }

  function handleDeleteCategoryItem(catName: string) {
    if (window.confirm(`Biztosan törölni szeretnéd a(z) "${catName}" kategória ikon beállítását?`)) {
      setSettings((prev) => {
        const nextItems = { ...prev.categoryItems };
        delete nextItems[catName];
        return {
          ...prev,
          categoryItems: nextItems,
        };
      });
      toast.info(`"${catName}" kategória beállítása törölve.`);
    }
  }

  function handleAddCategoryItem() {
    const name = newCatName.trim();
    if (!name) {
      toast.error('Kérjük, add meg a kategória nevét!');
      return;
    }

    if (settings.categoryItems[name]) {
      toast.error('Ez a kategória már létezik a listában!');
      return;
    }

    setSettings((prev) => ({
      ...prev,
      categoryItems: {
        ...prev.categoryItems,
        [name]: {
          categoryName: name,
          icon: newCatIcon || '🧱',
          customImageUrl: newCatImageUrl.trim() || undefined,
          enabled: true,
          isCustom: true,
        },
      },
    }));

    toast.success(`"${name}" kategória sikeresen hozzáadva!`);
    setNewCatName('');
    setNewCatIcon('🧱');
    setNewCatImageUrl('');
    setShowAddForm(false);
  }

  // Handle Local Image File Upload
  function triggerLocalFileUpload(catName: string | null) {
    setActiveUploadCatName(catName);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A kép mérete maximum 2 MB lehet!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        if (activeUploadCatName) {
          updateCategoryItem(activeUploadCatName, { customImageUrl: dataUrl, icon: '🖼️' });
          toast.success(`Saját ikonkép sikeresen feltöltve a(z) "${activeUploadCatName}" kategóriához!`);
        } else {
          setNewCatImageUrl(dataUrl);
          setNewCatIcon('🖼️');
          toast.success('Saját ikonkép sikeresen beolvasva az új kategóriához!');
        }
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#222] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFC400]/10 border border-[#FFC400]/20 text-[#FFC400] rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Fogalomtár Kategóriák & Ikonok Kezelője</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Állíts be meglévő kategória ikonokat, tölts fel saját ikonképet (PNG, SVG, JPG) vagy adj hozzá új kategóriát.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-200">
          {/* Global Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#181818] border border-[#282828] rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">Kiemelt Kategóriák Szekció</div>
                <div className="text-[11px] text-gray-400">Szekció megjelenítése a Fogalomtárban</div>
              </div>
              <button
                type="button"
                onClick={() => toggleGlobalSection(!settings.showFeaturedCategories)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.showFeaturedCategories ? 'bg-[#FFC400]' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                    settings.showFeaturedCategories ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-t sm:border-t-0 sm:border-l border-[#282828] pt-3 sm:pt-0 sm:pl-4">
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">Kategória Ikonok Kártyákon</div>
                <div className="text-[11px] text-gray-400">Ikonok megjelenítése a kategóriáknál</div>
              </div>
              <button
                type="button"
                onClick={() => toggleGlobalIcons(!settings.showCategoryIcons)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.showCategoryIcons ? 'bg-[#FFC400]' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow transition duration-200 ease-in-out ${
                    settings.showCategoryIcons ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Add New Category Panel Toggle */}
          <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-[#FFC400]" />
                <h3 className="font-bold text-white text-xs sm:text-sm">Új Kategória &amp; Saját Ikon Felvitele</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1 bg-[#282828] hover:bg-[#333] text-gray-300 rounded-lg text-xs font-bold transition-colors"
              >
                {showAddForm ? 'Bezárás' : '+ Kategória Felvitele'}
              </button>
            </div>

            {showAddForm && (
              <div className="pt-3 border-t border-[#282828] space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-300 block">Kategória Neve</label>
                    <input
                      type="text"
                      placeholder="Pl. Bádogozás, Kertépítés..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC400]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300 block">Ikon Emoji VAGY Kép</label>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-[#282828] border border-[#383838] flex items-center justify-center text-lg shrink-0 overflow-hidden">
                        {newCatImageUrl ? (
                          <img src={newCatImageUrl} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          newCatIcon
                        )}
                      </div>
                      <input
                        type="text"
                        value={newCatIcon}
                        onChange={(e) => setNewCatIcon(e.target.value)}
                        placeholder="Emoji"
                        className="w-full bg-[#222] border border-[#333] rounded-lg px-2.5 py-2 text-xs text-center font-bold text-white focus:outline-none focus:border-[#FFC400]"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Image URL or Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-300 block flex items-center gap-1">
                      <Link size={12} className="text-[#FFC400]" /> Saját Ikon Kép URL (Opcionális)
                    </label>
                    <input
                      type="url"
                      placeholder="https://domain.com/my-icon.png"
                      value={newCatImageUrl}
                      onChange={(e) => setNewCatImageUrl(e.target.value)}
                      className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#FFC400]"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => triggerLocalFileUpload(null)}
                      className="w-full py-1.5 px-3 bg-[#282828] hover:bg-[#333] border border-[#383838] text-gray-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Upload size={13} className="text-[#FFC400]" /> Saját Kép Feltöltése
                    </button>
                  </div>
                </div>

                {/* Preset Emoji Picker for New Item */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 block">Választhatsz a szabvány emojik közül is:</span>
                  <div className="flex items-center gap-1.5 flex-wrap p-2 bg-[#141414] rounded-lg border border-[#262626] max-h-24 overflow-y-auto">
                    {PRESET_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setNewCatIcon(emoji);
                          setNewCatImageUrl('');
                        }}
                        className={`p-1 text-sm rounded transition-transform hover:scale-125 ${
                          newCatIcon === emoji && !newCatImageUrl ? 'bg-[#FFC400]/20 border border-[#FFC400] scale-110' : 'hover:bg-[#222]'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCategoryItem}
                    className="px-4 py-2 bg-[#FFC400] hover:bg-[#E6B000] text-black font-extrabold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <Plus size={14} /> Hozzáadás a Listához
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Category */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Layers size={14} className="text-[#FFC400]" /> Kategóriák &amp; Ikonképek Testreszabása ({categoryList.length}):
            </h3>
            <div className="relative w-48 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Kategória keresése..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#181818] border border-[#282828] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC400]"
              />
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-4 max-h-[38vh] overflow-y-auto pr-1">
            {categoryList.map((item) => {
              const hasCustomImg = item.customImageUrl || (item.icon && (item.icon.startsWith('http') || item.icon.startsWith('data:image')));

              return (
                <div
                  key={item.categoryName}
                  className={`p-4 rounded-xl border transition-all flex flex-col space-y-3 ${
                    item.enabled
                      ? 'bg-[#161616] border-[#262626]'
                      : 'bg-[#121212]/60 border-[#1E1E1E] opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Icon Preview & Category Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-xl shrink-0 overflow-hidden relative group">
                        {hasCustomImg ? (
                          <img
                            src={item.customImageUrl || item.icon}
                            alt=""
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          item.icon || '—'
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.categoryName}
                          onChange={(e) => updateCategoryItem(item.categoryName, { categoryName: e.target.value })}
                          className="font-bold text-white text-sm bg-transparent border-b border-transparent hover:border-[#444] focus:border-[#FFC400] focus:outline-none"
                        />
                        <div className="text-xs text-gray-400">
                          {item.enabled ? 'Aktív a kiemelt kategóriákban' : 'Rejtve a kiemelt listából'}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Upload Own Icon Button */}
                      <button
                        type="button"
                        onClick={() => triggerLocalFileUpload(item.categoryName)}
                        className="px-2.5 py-1.5 bg-[#222] hover:bg-[#2C2C2C] border border-[#333] text-gray-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                        title="Saját ikonkép feltöltése gépről (PNG, SVG, JPG)"
                      >
                        <Upload size={13} className="text-[#FFC400]" />
                        <span>Kép feltöltése</span>
                      </button>

                      {/* Toggle Enable/Disable Category */}
                      <button
                        type="button"
                        onClick={() => updateCategoryItem(item.categoryName, { enabled: !item.enabled })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          item.enabled
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                        }`}
                      >
                        {item.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>{item.enabled ? 'Látható' : 'Kikapcsolva'}</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCategoryItem(item.categoryName)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                        title="Kategória beállítás törlése"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Line: Custom Image URL Input & Emoji Shortcuts */}
                  <div className="pt-2 border-t border-[#222] grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <ImageIcon size={13} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={item.customImageUrl || (item.icon.startsWith('http') || item.icon.startsWith('data:') ? item.icon : '')}
                        onChange={(e) => updateCategoryItem(item.categoryName, { customImageUrl: e.target.value })}
                        placeholder="Saját ikonkép URL (https://...)"
                        className="w-full bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-2.5 py-1 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-[#FFC400]"
                      />
                      {item.customImageUrl && (
                        <button
                          type="button"
                          onClick={() => updateCategoryItem(item.categoryName, { customImageUrl: undefined })}
                          className="text-[10px] font-bold text-gray-400 hover:text-white shrink-0"
                          title="Saját ikonkép törlése, visszatérés emojihoz"
                        >
                          Töröl
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[11px] text-gray-400 font-bold shrink-0">Emoji:</span>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => updateCategoryItem(item.categoryName, { icon: e.target.value })}
                        placeholder="Emoji"
                        className="w-14 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-2 py-1 text-xs text-center font-bold text-white focus:outline-none focus:border-[#FFC400]"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto max-w-[90px] p-0.5 bg-[#1c1c1c] rounded-lg border border-[#2a2a2a]">
                        {PRESET_EMOJIS.slice(0, 4).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => updateCategoryItem(item.categoryName, { icon: emoji, customImageUrl: undefined })}
                            className="hover:scale-125 transition-transform p-0.5 text-xs"
                            title={`Emoji beállítása: ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#222] flex items-center justify-between bg-[#161616]">
          <button
            type="button"
            onClick={() => {
              setSettings(getGlossaryCategorySettings());
              toast.info('Beállítások visszaállítva az utolsó mentett állapotra.');
            }}
            className="px-3.5 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Alaphelyzet
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#222] hover:bg-[#2A2A2A] text-gray-300 font-bold text-xs rounded-xl transition-colors"
            >
              Mégse
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#FFC400] hover:bg-[#E6B000] text-black font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Save size={14} /> Beállítások Mentése
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
