import { useState, useEffect, useMemo } from 'react';
import { X, Save, Eye, EyeOff, Sparkles, Search, Layers, RefreshCw } from 'lucide-react';
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

const PRESET_EMOJIS = ['🏗️', '🚜', '🛠️', '🔧', '🛡️', '🌡️', '💧', '💨', '🧱', '🪵', '🏛️', '⚙️', '🏠', '⚡', '🖌️', '🔲', '🪚', '🧪', '📚', '🎯', '📦', '🏷️', '📐'];

export default function GlossaryCategorySettingsModal({
  isOpen,
  onClose,
  availableCategories = [],
}: GlossaryCategorySettingsModalProps) {
  const toast = useToast();
  const [settings, setSettings] = useState<GlossaryCategorySettings>(getGlossaryCategorySettings());
  const [searchFilter, setSearchFilter] = useState('');

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
      return {
        ...prev,
        categoryItems: {
          ...prev.categoryItems,
          [catName]: {
            ...existing,
            ...updates,
          },
        },
      };
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#222] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFC400]/10 border border-[#FFC400]/20 text-[#FFC400] rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Fogalomtár Kiemelt Kategóriák & Ikonok</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Állítsd be a kategóriák ikonjait, a megjelenítést vagy kapcsold ki őket teljesen.
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
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow transform transition duration-200 ease-in-out ${
                    settings.showFeaturedCategories ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 border-t sm:border-t-0 sm:border-l border-[#282828] pt-3 sm:pt-0 sm:pl-4">
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">Kategória Ikonok Kártyákon</div>
                <div className="text-[11px] text-gray-400">Ikonok megjelenítése a kategóriakártyákon</div>
              </div>
              <button
                type="button"
                onClick={() => toggleGlobalIcons(!settings.showCategoryIcons)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.showCategoryIcons ? 'bg-[#FFC400]' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow transform transition duration-200 ease-in-out ${
                    settings.showCategoryIcons ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Search Category */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Layers size={14} className="text-[#FFC400]" /> Kategóriák Testreszabása ({categoryList.length}):
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
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
            {categoryList.map((item) => (
              <div
                key={item.categoryName}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.enabled
                    ? 'bg-[#161616] border-[#262626]'
                    : 'bg-[#121212]/60 border-[#1E1E1E] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-xl shrink-0">
                    {item.icon || '—'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{item.categoryName}</div>
                    <div className="text-xs text-gray-400">
                      {item.enabled ? 'Aktív a kiemelt kategóriákban' : 'Rejtve a kiemelt listából'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  {/* Icon Input & Quick Emojis */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.icon}
                      onChange={(e) => updateCategoryItem(item.categoryName, { icon: e.target.value })}
                      placeholder="Ikon / emoji"
                      className="w-20 bg-[#222] border border-[#333] rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-white focus:outline-none focus:border-[#FFC400]"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto max-w-[140px] p-1 bg-[#1c1c1c] rounded-lg border border-[#2a2a2a]">
                      {PRESET_EMOJIS.slice(0, 5).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => updateCategoryItem(item.categoryName, { icon: emoji })}
                          className="hover:scale-125 transition-transform p-0.5 text-xs"
                          title={`Ikon beállítása: ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

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
                </div>
              </div>
            ))}
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
