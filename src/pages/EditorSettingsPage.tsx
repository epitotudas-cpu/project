import { useState } from 'react';
import { Palette, Check, Save, RotateCcw, Sparkles, UserCheck, Shield } from 'lucide-react';
import {
  EDITOR_THEME_PRESETS,
  getStoredEditorThemeId,
  setEditorThemeId,
  getEditorThemePreset,
} from '../services/editorThemeService';

export function EditorSettingsPage() {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(getStoredEditorThemeId);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentPreset = getEditorThemePreset(selectedThemeId);

  const handleSave = () => {
    setEditorThemeId(selectedThemeId);
    setToastMessage('A Szerkesztői Panel témaszínei sikeresen frissültek!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReset = () => {
    setSelectedThemeId('purple');
    setEditorThemeId('purple');
    setToastMessage('Szerkesztői téma visszaállítva az alapértelmezett bíbor/lila változatra.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-900/90 border border-emerald-500/50 text-emerald-100 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className={`bg-gradient-to-r ${currentPreset.bgGradient} border ${currentPreset.borderSubtle} rounded-2xl p-6 md:p-8 shadow-xl transition-all duration-300`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${currentPreset.bgSubtle} border ${currentPreset.borderStrong} ${currentPreset.textAccent} text-xs font-semibold uppercase tracking-wider`}>
              <Palette className="w-3.5 h-3.5" />
              Szerkesztői Munkatér Testreszabása
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Panel Színvilág & Beállítások
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Válaszd ki a számodra leginkább inspiráló színvilágot a Szerkesztői Panelhez. A beállított téma azonnal alkalmazásra kerül az oldalsávon, a vezérlőpulton és a gombokon.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              Alapértelmezett
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2.5 ${currentPreset.buttonBg} ${currentPreset.buttonHover} ${currentPreset.buttonText} font-semibold rounded-xl text-sm shadow-lg ${currentPreset.shadow} transition-all hover:scale-[1.02]`}
            >
              <Save className="w-4 h-4" />
              Mentés Most
            </button>
          </div>
        </div>
      </div>

      {/* Preset Color Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${currentPreset.textAccent}`} />
            Választható Színtémák
          </h2>
          <span className="text-xs text-slate-400">Válassz egyet a meglévő paletták közül</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {EDITOR_THEME_PRESETS.map((preset) => {
            const isSelected = selectedThemeId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setSelectedThemeId(preset.id)}
                className={`cursor-pointer rounded-2xl p-6 border transition-all relative overflow-hidden bg-slate-900/80 ${
                  isSelected
                    ? `${preset.borderStrong} shadow-xl ring-2 ring-offset-2 ring-offset-slate-950`
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                style={{ ringColor: isSelected ? preset.hex : undefined }}
              >
                {/* Header info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border border-white/20 shadow-md shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <div>
                      <h3 className="font-bold text-white text-base">{preset.name}</h3>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{preset.badge}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div
                      className="p-1 rounded-full text-slate-950 shadow-md"
                      style={{ backgroundColor: preset.hex }}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Live mini preview */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Minta gomb</span>
                    <span
                      className="px-3 py-1 rounded-lg font-semibold text-[11px]"
                      style={{ backgroundColor: preset.hex, color: preset.buttonText === 'text-slate-950' ? '#020617' : '#ffffff' }}
                    >
                      Aktív
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Oldalsáv ikon</span>
                    <UserCheck className="w-4 h-4" style={{ color: preset.hex }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Bottom Bar */}
      <div className="sticky bottom-6 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between">
        <p className="text-xs text-slate-400">
          A kiválasztott szín téma azonnal életbe lép az oldal mentése után.
        </p>

        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 ${currentPreset.buttonBg} ${currentPreset.buttonHover} ${currentPreset.buttonText} font-semibold rounded-xl text-sm transition-all shadow-lg ${currentPreset.shadow}`}
        >
          <Save className="w-4 h-4" />
          Mentés
        </button>
      </div>
    </div>
  );
}
