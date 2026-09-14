import { useState, useEffect } from 'react';

export interface EditorThemePreset {
  id: string;
  name: string;
  badge: string;
  hex: string;
  bgGradient: string;
  bgSubtle: string;
  borderSubtle: string;
  borderStrong: string;
  textAccent: string;
  buttonBg: string;
  buttonHover: string;
  buttonText: string;
  shadow: string;
}

export const EDITOR_THEME_PRESETS: EditorThemePreset[] = [
  {
    id: 'purple',
    name: 'Bíbor / Lila',
    badge: 'Kreatív',
    hex: '#A855F7',
    bgGradient: 'from-slate-900 via-purple-950/40 to-slate-900',
    bgSubtle: 'bg-purple-500/10',
    borderSubtle: 'border-purple-500/20',
    borderStrong: 'border-purple-500/40',
    textAccent: 'text-purple-400',
    buttonBg: 'bg-purple-500',
    buttonHover: 'hover:bg-purple-400',
    buttonText: 'text-white',
    shadow: 'shadow-purple-500/20',
  },
  {
    id: 'emerald',
    name: 'Smaragdzöld',
    badge: 'Természetes',
    hex: '#10B981',
    bgGradient: 'from-slate-900 via-emerald-950/40 to-slate-900',
    bgSubtle: 'bg-emerald-500/10',
    borderSubtle: 'border-emerald-500/20',
    borderStrong: 'border-emerald-500/40',
    textAccent: 'text-emerald-400',
    buttonBg: 'bg-emerald-500',
    buttonHover: 'hover:bg-emerald-400',
    buttonText: 'text-slate-950',
    shadow: 'shadow-emerald-500/20',
  },
  {
    id: 'blue',
    name: 'Királykék',
    badge: 'Üzleti',
    hex: '#3B82F6',
    bgGradient: 'from-slate-900 via-blue-950/40 to-slate-900',
    bgSubtle: 'bg-blue-500/10',
    borderSubtle: 'border-blue-500/20',
    borderStrong: 'border-blue-500/40',
    textAccent: 'text-blue-400',
    buttonBg: 'bg-blue-500',
    buttonHover: 'hover:bg-blue-400',
    buttonText: 'text-slate-950',
    shadow: 'shadow-blue-500/20',
  },
  {
    id: 'amber',
    name: 'Borostyán / Arany',
    badge: 'Építő',
    hex: '#F59E0B',
    bgGradient: 'from-slate-900 via-amber-950/40 to-slate-900',
    bgSubtle: 'bg-amber-500/10',
    borderSubtle: 'border-amber-500/20',
    borderStrong: 'border-amber-500/40',
    textAccent: 'text-amber-400',
    buttonBg: 'bg-amber-500',
    buttonHover: 'hover:bg-amber-400',
    buttonText: 'text-slate-950',
    shadow: 'shadow-amber-500/20',
  },
  {
    id: 'rose',
    name: 'Rózsa / Korall',
    badge: 'Dinamikus',
    hex: '#F43F5E',
    bgGradient: 'from-slate-900 via-rose-950/40 to-slate-900',
    bgSubtle: 'bg-rose-500/10',
    borderSubtle: 'border-rose-500/20',
    borderStrong: 'border-rose-500/40',
    textAccent: 'text-rose-400',
    buttonBg: 'bg-rose-500',
    buttonHover: 'hover:bg-rose-400',
    buttonText: 'text-white',
    shadow: 'shadow-rose-500/20',
  },
  {
    id: 'indigo',
    name: 'Indigókék',
    badge: 'Stílusos',
    hex: '#6366F1',
    bgGradient: 'from-slate-900 via-indigo-950/40 to-slate-900',
    bgSubtle: 'bg-indigo-500/10',
    borderSubtle: 'border-indigo-500/20',
    borderStrong: 'border-indigo-500/40',
    textAccent: 'text-indigo-400',
    buttonBg: 'bg-indigo-500',
    buttonHover: 'hover:bg-indigo-400',
    buttonText: 'text-white',
    shadow: 'shadow-indigo-500/20',
  },
];

const STORAGE_KEY = 'epitotudas_editor_theme';
const EVENT_KEY = 'epitotudas_editor_theme_change';

export function getStoredEditorThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'purple';
  } catch {
    return 'purple';
  }
}

export function getEditorThemePreset(presetId?: string): EditorThemePreset {
  const targetId = presetId || getStoredEditorThemeId();
  return EDITOR_THEME_PRESETS.find((p) => p.id === targetId) || EDITOR_THEME_PRESETS[0];
}

export function setEditorThemeId(presetId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, presetId);
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: presetId }));
  } catch (e) {
    console.error('Hiba a szerkesztői téma mentésekor:', e);
  }
}

export function useEditorTheme(): EditorThemePreset {
  const [theme, setTheme] = useState<EditorThemePreset>(() => getEditorThemePreset());

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      const newPresetId = e.detail || getStoredEditorThemeId();
      setTheme(getEditorThemePreset(newPresetId));
    };

    window.addEventListener(EVENT_KEY, handleThemeChange);
    return () => {
      window.removeEventListener(EVENT_KEY, handleThemeChange);
    };
  }, []);

  return theme;
}
