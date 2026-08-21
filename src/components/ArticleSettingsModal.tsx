import { useState } from 'react';
import { X, Save, Settings } from 'lucide-react';
import {
  getArticleSettings,
  saveArticleSettings,
  type ArticleSettings,
} from '../services/articleSettingsService';
import { useToast } from './ToastProvider';
import { useSiteSettings, adjustColorBrightness } from '../services/siteSettingsService';

interface ArticleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArticleSettingsModal({ isOpen, onClose }: ArticleSettingsModalProps) {
  const toast = useToast();
  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const headerBg = adjustColorBrightness(cardBg, 4);

  const [form, setForm] = useState<ArticleSettings>(() => getArticleSettings());
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  function update<K extends keyof ArticleSettings>(key: K, value: ArticleSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      saveArticleSettings(form);
      toast.success('Tudástár cikk- és szűrőbeállítások sikeresen elmentve!');
      onClose();
    } catch {
      toast.error('Hiba történt a beállítások mentésekor.');
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full border rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => !saving && onClose()}
    >
      <div
        style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        className="border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{ backgroundColor: headerBg, borderColor: cardBorder }}
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
        >
          <div className="flex items-center gap-2">
            <Settings style={{ color: cardHighlight }} size={20} />
            <h2 className="text-base font-black text-white">Tudástár – Cikkek és szűrők beállításai</h2>
          </div>
          <button onClick={onClose} disabled={saving} className="text-gray-500 hover:text-gray-300 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-6">
          
          {/* Page Titles */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-[#FFC400] tracking-wider">
              1. Nyilvános Oldal Fejléc &amp; SEO Szövegek
            </h3>
            
            <div>
              <label className={labelClass}>Oldalcím</label>
              <input
                className={fieldClass}
                value={form.articlesPageTitle}
                onChange={(e) => update('articlesPageTitle', e.target.value)}
                placeholder="Építőipari cikkek és útmutatók"
              />
            </div>

            <div>
              <label className={labelClass}>Bevezető Szöveg</label>
              <textarea
                className={`${fieldClass} resize-none`}
                rows={2}
                value={form.articlesPageDescription}
                onChange={(e) => update('articlesPageDescription', e.target.value)}
                placeholder="Gyakorlati útmutatók, szabványok, technológiai leírások és kivitelezési tippek."
              />
            </div>
          </div>

          {/* Grid Layout & Pagination */}
          <div className="space-y-4 pt-4 border-t border-[#222]">
            <h3 className="text-xs font-black uppercase text-[#FFC400] tracking-wider">
              2. Megjelenítés &amp; Rács Elrendezés
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Oldalankénti Cikkszám</label>
                <input
                  type="number"
                  min={3}
                  max={48}
                  className={fieldClass}
                  value={form.articlesPerPage}
                  onChange={(e) => update('articlesPerPage', Number(e.target.value))}
                />
              </div>

              <div>
                <label className={labelClass}>Asztali Oszlopszám</label>
                <select
                  className={fieldClass}
                  value={form.desktopGridColumns}
                  onChange={(e) => update('desktopGridColumns', Number(e.target.value) as 2 | 3 | 4)}
                >
                  <option value={2}>2 Oszlopos Rács</option>
                  <option value={3}>3 Oszlopos Rács (Ajánlott)</option>
                  <option value={4}>4 Oszlopos Rács</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Alapértelmezett Rendezési Mód</label>
                <select
                  className={fieldClass}
                  value={form.defaultSortMode}
                  onChange={(e) => update('defaultSortMode', e.target.value as ArticleSettings['defaultSortMode'])}
                >
                  <option value="latest">Legújabb cikkek elöl</option>
                  <option value="featured">Kiemelt cikkek elöl</option>
                  <option value="popular">Legnépszerűbbek elöl</option>
                  <option value="manual">Kézi sorrend</option>
                </select>
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.showLoadMoreButton}
                    onChange={(e) => update('showLoadMoreButton', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 text-[#FFC400] focus:ring-[#FFC400]"
                  />
                  <span>„További cikkek betöltése” gomb engedélyezése</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section Visibility & Toggles */}
          <div className="space-y-4 pt-4 border-t border-[#222]">
            <h3 className="text-xs font-black uppercase text-[#FFC400] tracking-wider">
              3. Blokkok &amp; Statisztikák Megjelenítése
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-[#161616] border border-[#222] rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-white block">Nagy Kategóriacsempe-blokk megjelenítése</span>
                  <span className="text-[11px] text-gray-500">Alapértelmezetten KIKAPCSOLVA (a cikkrács közvetlenül a szűrők alá kerül).</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.showCategoryTilesBlock}
                  onChange={(e) => update('showCategoryTilesBlock', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-[#FFC400] focus:ring-[#FFC400]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#161616] border border-[#222] rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-white block">Üres kategóriák megjelenítése a szűrőben</span>
                  <span className="text-[11px] text-gray-500">Engedélyezi a 0 cikkes kategóriák láthatóságát a szűrőpanelben.</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.showEmptyCategoriesInFilter}
                  onChange={(e) => update('showEmptyCategoriesInFilter', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-[#FFC400] focus:ring-[#FFC400]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#161616] border border-[#222] rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-white block">Megtekintések számának megjelenítése a csempéken</span>
                  <span className="text-[11px] text-gray-500">Alapértelmezetten KIKAPCSOLVA (csak valós, automatikus statisztika jelenhet meg).</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.showViewCount}
                  onChange={(e) => update('showViewCount', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-[#FFC400] focus:ring-[#FFC400]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#161616] border border-[#222] rounded-xl cursor-pointer">
                <div>
                  <span className="text-xs font-extrabold text-white block">Értékelések (csillagok) megjelenítése a csempéken</span>
                  <span className="text-[11px] text-gray-500">Alapértelmezetten KIKAPCSOLVA (csak valós szavazatok meglétekor jelenhet meg).</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.showRatings}
                  onChange={(e) => update('showRatings', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-[#FFC400] focus:ring-[#FFC400]"
                />
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: cardBorder }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: cardHighlight, color: '#000000' }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl hover:opacity-90 disabled:opacity-60 transition-colors shadow-md"
            >
              <Save size={14} /> {saving ? 'Mentés...' : 'Beállítások Mentése'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
