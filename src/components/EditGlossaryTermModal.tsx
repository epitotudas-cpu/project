import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Image, Video, Info, CheckCircle2, Globe } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { GlossaryTerm, GlossaryLanguage } from '../lib/supabase';
import { createGlossaryTerm, updateGlossaryTerm } from '../services/glossaryService';
import { useGlossaryLanguages } from '../services/languageService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

function isValidUrl(url: string): boolean {
  if (!url.trim()) return true;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Supabase/PostgrestError-t olvas ki és magyar szöveggé fordítja */
function parseSupabaseError(err: unknown): string {
  if (!err) return 'Ismeretlen hiba történt.';

  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const code = String(e.code ?? '');
    const message = String(e.message ?? '');
    const details = e.details ? `\nRészletek: ${e.details}` : '';
    const hint = e.hint ? `\nTipp: ${e.hint}` : '';

    if (code === '23505' || /duplicate|unique/i.test(message)) {
      return `❗ Ez a slug már foglalt – válassz másik azonosítót.${details}`;
    }
    if (code === '23502' || /not.null|null value/i.test(message)) {
      const col = message.match(/column "([^"]+)"/)?.[1];
      return `❗ Kötelező mező hiányzik${col ? `: "${col}"` : ''}.${details}`;
    }
    if (code === '22P02' || /invalid input/i.test(message)) {
      return `❗ Érvénytelen adat formátum – ellenőrizd a bevítt értékeket.${details}${hint}`;
    }
    if (code === '42703' || /column.*does not exist/i.test(message)) {
      const col = message.match(/column "([^"]+)"/)?.[1];
      return `❗ Az adatbázis nem ismeri fel ezt a mezőt${col ? `: "${col}"` : ''} – lehet, hogy hozzá kell adni a táblához.${details}`;
    }
    if (code === 'PGRST204' || /Could not find the '([^']+)' column/i.test(message)) {
      const col = message.match(/column '([^']+)'/i)?.[1] || message.match(/column "([^"]+)"/i)?.[1];
      return `❗ Adatbázis sémakövetési hiba: A(z) ${col ? `'${col}'` : 'kívánt'} oszlop hiányzik az adatbázisból.${details}`;
    }
    if (code === 'PGRST116') {
      return '❗ Nem található a rekord – már törölhetett valaki más.';
    }
    if (/permission denied|rls|row.level/i.test(message)) {
      return '❗ Jogosultság megtagadva – nincs jogod ezt szerkeszteni (Row-Level Security).';
    }
    if (/network|fetch|connection/i.test(message)) {
      return '❗ Hálózati hiba – ellenőrizd az internetkapcsolatot és próbáld újra.';
    }
    if (message) {
      return `❗ Adatbázis hiba (${code || '?'}): ${message}${details}${hint}`;
    }
  }

  if (err instanceof Error) {
    return `❗ ${err.message}`;
  }

  return 'Ismeretlen hiba történt a mentéskor.';
}

interface EditGlossaryTermModalProps {
  term: GlossaryTerm | null; // null = create mode
  onClose: () => void;
  onSaved: (saved: GlossaryTerm) => void;
}

interface FormState {
  term: string;
  slug: string;
  definition: string;
  category: string;
  szint: string;
  kulcsszavak: string;
  kapcsolodofogalmak: string;
  entry_type: 'technical_concept' | 'industry_term';
  official_term_id: string;
  official_term_name: string;
  detailed_description: string;
  practical_applications: string;
  common_mistakes: string;
  usage_example: string;
  origin_note: string;
  jargon_subtype: 'brand_name' | 'german_origin' | 'workplace_slang' | 'synonym' | '';
  trans_en: string;
  trans_de: string;
  trans_ro: string;
  video_urls: string;
  image_urls: string;
}

const EMPTY_FORM: FormState = {
  term: '',
  slug: '',
  definition: '',
  category: '',
  szint: '',
  kulcsszavak: '',
  kapcsolodofogalmak: '',
  entry_type: 'technical_concept',
  official_term_id: '',
  official_term_name: '',
  detailed_description: '',
  practical_applications: '',
  common_mistakes: '',
  usage_example: '',
  origin_note: '',
  jargon_subtype: '',
  trans_en: '',
  trans_de: '',
  trans_ro: '',
  video_urls: '',
  image_urls: '',
};

function formFromTerm(t: GlossaryTerm): FormState {
  const trans = t.translations ?? {};
  const vUrls = t.video_urls && t.video_urls.length > 0
    ? t.video_urls
    : (t.video_url ? [t.video_url] : []);

  return {
    term: t.term,
    slug: t.slug,
    definition: t.definition,
    category: t.category ?? '',
    szint: t.szint ?? '',
    kulcsszavak: (t.kulcsszavak ?? []).join(', '),
    kapcsolodofogalmak: (t.kapcsolodofogalmak ?? []).join(', '),
    entry_type: t.entry_type ?? 'technical_concept',
    official_term_id: t.official_term_id ?? '',
    official_term_name: t.official_term_name ?? '',
    detailed_description: t.detailed_description ?? '',
    practical_applications: t.practical_applications ?? '',
    common_mistakes: t.common_mistakes ?? '',
    usage_example: t.usage_example ?? '',
    origin_note: t.origin_note ?? '',
    jargon_subtype: t.jargon_subtype ?? '',
    trans_en: trans.en ?? '',
    trans_de: trans.de ?? '',
    trans_ro: trans.ro ?? '',
    video_urls: vUrls.join('\n'),
    image_urls: (t.image_urls ?? []).join('\n'),
  };
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface DynamicTranslationItem {
  translated_term: string;
  definition: string;
  synonyms: string;
  status: 'draft' | 'reviewed' | 'published';
}

export default function EditGlossaryTermModal({ term, onClose, onSaved }: EditGlossaryTermModalProps) {
  const { activeLanguages } = useGlossaryLanguages();
  const isCreate = term === null;
  const [form, setForm] = useState<FormState>(() => (term ? formFromTerm(term) : { ...EMPTY_FORM }));
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [dynTranslations, setDynTranslations] = useState<Record<string, DynamicTranslationItem>>(() => {
    const initial: Record<string, DynamicTranslationItem> = {};
    if (term && term.translations) {
      Object.entries(term.translations).forEach(([k, v]) => {
        initial[k.toLowerCase()] = {
          translated_term: typeof v === 'string' ? v : (v as any)?.translated_term || '',
          definition: typeof v === 'string' ? '' : (v as any)?.definition || '',
          synonyms: '',
          status: 'published',
        };
      });
    }
    return initial;
  });

  useEffect(() => {
    if (term) {
      setForm(formFromTerm(term));
      setSlugTouched(true);
      if (term.translations) {
        const initial: Record<string, DynamicTranslationItem> = {};
        Object.entries(term.translations).forEach(([k, v]) => {
          initial[k.toLowerCase()] = {
            translated_term: typeof v === 'string' ? v : (v as any)?.translated_term || '',
            definition: typeof v === 'string' ? '' : (v as any)?.definition || '',
            synonyms: '',
            status: 'published',
          };
        });
        setDynTranslations(initial);
      }
    } else {
      setForm({ ...EMPTY_FORM });
      setSlugTouched(false);
      setDynTranslations({});
    }
    setError(null);
    setSaveStatus('idle');
  }, [term]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTermChange(value: string) {
    update('term', value);
    if (!slugTouched) update('slug', slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    update('slug', slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.term.trim()) {
      setError('❗ Kötelező mező hiányzik: "Kifejezés neve" – töltsd ki a fogalom nevét.');
      setSaveStatus('error');
      return;
    }
    if (!form.definition.trim()) {
      setError('❗ Kötelező mező hiányzik: "Definíció" – írj le rövid meghatározást.');
      setSaveStatus('error');
      return;
    }
    const finalSlug = form.slug.trim() || slugify(form.term);
    if (!finalSlug) {
      setError('❗ A slug érvénytelen – csak kisbetűk, számok és kötőjelek megengedettek.');
      setSaveStatus('error');
      return;
    }
    const imageLines = form.image_urls.split('\n').map((u) => u.trim()).filter(Boolean);
    const videoLines = form.video_urls.split('\n').map((u) => u.trim()).filter(Boolean);
    
    const syntaxInvalidUrls = imageLines.filter((u) => !isValidUrl(u));
    if (syntaxInvalidUrls.length > 0) {
      setError('❗ Kép URL hiba – az alábbi sorok nem érvényesek:\n' + syntaxInvalidUrls.join('\n'));
      setSaveStatus('error');
      return;
    }

    const syntaxInvalidVideoUrls = videoLines.filter((u) => !isValidUrl(u));
    if (syntaxInvalidVideoUrls.length > 0) {
      setError('❗ Videó URL hiba – az alábbi sorok nem érvényesek:\n' + syntaxInvalidVideoUrls.join('\n'));
      setSaveStatus('error');
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    setError(null);
    try {
      const translationsPayload: Record<string, string> = {};
      if (form.trans_en.trim()) translationsPayload.en = form.trans_en.trim();
      if (form.trans_de.trim()) translationsPayload.de = form.trans_de.trim();
      if (form.trans_ro.trim()) translationsPayload.ro = form.trans_ro.trim();

      Object.entries(dynTranslations).forEach(([k, item]) => {
        if (item.translated_term.trim()) {
          translationsPayload[k.toLowerCase()] = item.translated_term.trim();
        }
      });

      const payload = {
        term: form.term.trim(),
        slug: finalSlug,
        definition: form.definition.trim(),
        letter: form.term.trim().charAt(0).toUpperCase(),
        category: form.category.trim() || null,
        szint: form.szint.trim() || null,
        kulcsszavak: parseList(form.kulcsszavak),
        kapcsolodofogalmak: parseList(form.kapcsolodofogalmak),
        entry_type: form.entry_type,
        official_term_id: form.official_term_id.trim() || null,
        official_term_name: form.official_term_name.trim() || null,
        detailed_description: form.detailed_description.trim() || null,
        practical_applications: form.practical_applications.trim() || null,
        common_mistakes: form.common_mistakes.trim() || null,
        usage_example: form.usage_example.trim() || null,
        origin_note: form.origin_note.trim() || null,
        jargon_subtype: form.jargon_subtype || null,
        translations: translationsPayload,
        video_url: videoLines.length > 0 ? videoLines.join('\n') : null,
        image_urls: imageLines,
      };
      
      let data: GlossaryTerm;
      if (term) {
        data = await updateGlossaryTerm(term.id, payload);
      } else {
        data = await createGlossaryTerm(payload);
      }
      setSaveStatus('success');
      window.dispatchEvent(new CustomEvent('glossary-updated'));
      setTimeout(() => {
        onSaved(data);
      }, 1200);
    } catch (err) {
      setError(parseSupabaseError(err));
      setSaveStatus('error');
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

  const fieldStyle = { backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor };
  const labelStyle = { color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' };
  const labelClass = 'block text-xs font-bold mb-1';
  const fieldClass = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
        className="border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Fejléc */}
        <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="px-6 py-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 style={{ color: textColor }} className="text-lg font-black">
              {isCreate ? 'Új fogalom létrehozása' : `Fogalom szerkesztése: ${term.term}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-xs font-medium whitespace-pre-line animate-fadeIn">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Fogalom típusa */}
            <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="p-3 border rounded-xl flex items-center gap-4">
              <span style={labelStyle} className="text-xs font-bold">Fogalom Típusa:</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="radio"
                  name="entry_type"
                  checked={form.entry_type === 'technical_concept'}
                  onChange={() => update('entry_type', 'technical_concept')}
                />
                📘 Szakmai Fogalom
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                <input
                  type="radio"
                  name="entry_type"
                  checked={form.entry_type === 'industry_term'}
                  onChange={() => update('entry_type', 'industry_term')}
                />
                🗣 Zsargon / Szleng
              </label>
            </div>

            {/* Alap adatok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle} className={labelClass}>Kifejezés Neve *</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.term}
                  onChange={(e) => handleTermChange(e.target.value)}
                  placeholder="pl. Vasbeton"
                  required
                />
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>URL Slug *</label>
                <input
                  style={fieldStyle}
                  className={fieldClass}
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="vasbeton"
                  required
                />
              </div>
            </div>

            {/* Definíció */}
            <div>
              <label style={labelStyle} className={labelClass}>Rövid Definíció / Meghatározás *</label>
              <textarea
                style={fieldStyle}
                className={`${fieldClass} resize-none`}
                rows={3}
                value={form.definition}
                onChange={(e) => update('definition', e.target.value)}
                placeholder="Rövid, pontos összefoglaló magyarázat..."
                required
              />
            </div>

            {/* Zsargon-specifikus mezők */}
            {form.entry_type === 'industry_term' && (
              <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="p-4 border rounded-xl space-y-3 shadow-sm">
                <h4 style={{ color: cardHighlight }} className="text-xs font-bold uppercase tracking-wider">
                  Zsargon &amp; Szleng Részletek
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle} className={labelClass}>Hivatalos Megfelelő Neve</label>
                    <input
                      style={fieldStyle}
                      className={fieldClass}
                      value={form.official_term_name}
                      onChange={(e) => update('official_term_name', e.target.value)}
                      placeholder="pl. Betonkeverő"
                    />
                  </div>

                  <div>
                    <label style={labelStyle} className={labelClass}>Zsargon Alkategória</label>
                    <select
                      style={fieldStyle}
                      className={fieldClass}
                      value={form.jargon_subtype}
                      onChange={(e) => update('jargon_subtype', e.target.value as FormState['jargon_subtype'])}
                    >
                      <option value="">— Válassz —</option>
                      <option value="brand_name">Márkanév (pl. Flex, Hilti)</option>
                      <option value="german_origin">Német eredetű szakszó (pl. Stafni)</option>
                      <option value="workplace_slang">Munkaterületi szleng (pl. Malter)</option>
                      <option value="synonym">Szinonima / Rövidítés</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Példamondat / Építkezési Használat</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.usage_example}
                    onChange={(e) => update('usage_example', e.target.value)}
                    placeholder="„Hozd a flexet a sarok csiszolásához!”"
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Eredet / Etimológiai Megjegyzés</label>
                  <input
                    style={fieldStyle}
                    className={fieldClass}
                    value={form.origin_note}
                    onChange={(e) => update('origin_note', e.target.value)}
                    placeholder="A német 'Staffel' szóból ered..."
                  />
                </div>
              </div>
            )}

            {/* Szakmai-specifikus mezők */}
            {form.entry_type === 'technical_concept' && (
              <>
                <div>
                  <label style={labelStyle} className={labelClass}>Részletes Műszaki Magyarázat</label>
                  <textarea
                    style={fieldStyle}
                    className={`${fieldClass} resize-none`}
                    rows={4}
                    value={form.detailed_description}
                    onChange={(e) => update('detailed_description', e.target.value)}
                    placeholder="Részletes szabványi és szerkezeti leírás..."
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Gyakorlati Alkalmazások &amp; Technológia</label>
                  <textarea
                    style={fieldStyle}
                    className={`${fieldClass} resize-none`}
                    rows={2}
                    value={form.practical_applications}
                    onChange={(e) => update('practical_applications', e.target.value)}
                    placeholder="Hol és hogyan használják a kivitelezés során..."
                  />
                </div>

                <div>
                  <label style={labelStyle} className={labelClass}>Gyakori Kivitelezési Hibák</label>
                  <textarea
                    style={fieldStyle}
                    className={`${fieldClass} resize-none`}
                    rows={2}
                    value={form.common_mistakes}
                    onChange={(e) => update('common_mistakes', e.target.value)}
                    placeholder="Typikus hibák és megelőzésük..."
                  />
                </div>
              </>
            )}

            {/* Multilingual Translation Inputs */}
            <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="p-4 border rounded-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 style={{ color: cardHighlight }} className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Globe size={14} /> Többnyelvű Fordítások Kezelése ({activeLanguages.filter((l) => l.iso_code !== 'hu').length} aktív célnyelv)
                </h4>
              </div>

              <div className="space-y-4">
                {activeLanguages.filter((l) => l.iso_code !== 'hu').map((lang) => {
                  const code = lang.iso_code.toLowerCase();
                  const transItem = dynTranslations[code] || {
                    translated_term: code === 'en' ? form.trans_en : code === 'de' ? form.trans_de : code === 'ro' ? form.trans_ro : '',
                    definition: '',
                    synonyms: '',
                    status: 'published' as const,
                  };

                  const isDefined = Boolean(transItem.translated_term.trim());

                  return (
                    <div
                      key={lang.id}
                      style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                      className="p-3 border rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag_emoji}</span>
                          <span className="font-bold text-xs" style={{ color: textColor }}>
                            {lang.name_hu} ({lang.short_label})
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">[{lang.iso_code}]</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isDefined ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-gray-500/20 text-gray-400 border-gray-500/40'
                        }`}>
                          {isDefined ? 'Fordítás kitöltve' : 'Nincs fordítás'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label style={labelStyle} className="block text-[10px] font-bold mb-1">
                            Szakkifejezés neve ({lang.short_label})
                          </label>
                          <input
                            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                            className={fieldClass}
                            value={transItem.translated_term}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDynTranslations((prev) => ({
                                ...prev,
                                [code]: { ...transItem, translated_term: val },
                              }));
                              if (code === 'en') update('trans_en', val);
                              if (code === 'de') update('trans_de', val);
                              if (code === 'ro') update('trans_ro', val);
                            }}
                            placeholder={`Fordítás ${lang.name_hu} nyelven...`}
                          />
                        </div>

                        <div>
                          <label style={labelStyle} className="block text-[10px] font-bold mb-1">
                            Fordítás állapota
                          </label>
                          <select
                            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                            className={fieldClass}
                            value={transItem.status}
                            onChange={(e) => {
                              const st = e.target.value as 'draft' | 'reviewed' | 'published';
                              setDynTranslations((prev) => ({
                                ...prev,
                                [code]: { ...transItem, status: st },
                              }));
                            }}
                          >
                            <option value="published">🟢 Publikált (published)</option>
                            <option value="reviewed">🟡 Ellenőrzött (reviewed)</option>
                            <option value="draft">⚪ Piszkozat (draft)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label style={labelStyle} className="block text-[10px] font-bold mb-1">
                            Definíció / Magyarázat ({lang.short_label}) - Opcionális
                          </label>
                          <textarea
                            rows={2}
                            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: inputTextColor }}
                            className={`${fieldClass} resize-none`}
                            value={transItem.definition}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDynTranslations((prev) => ({
                                ...prev,
                                [code]: { ...transItem, definition: val },
                              }));
                            }}
                            placeholder={`Rövid leírás ${lang.name_hu} nyelven...`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle} className={labelClass}>Szakág / Témakör</label>
                <input style={fieldStyle} className={fieldClass} value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="pl. Falazás" />
              </div>
              <div>
                <label style={labelStyle} className={labelClass}>Szint</label>
                <input style={fieldStyle} className={fieldClass} value={form.szint} onChange={(e) => update('szint', e.target.value)} placeholder="pl. Kezdő" />
              </div>
            </div>

            <div>
              <label style={labelStyle} className={labelClass}>Kulcsszavak (vesszővel)</label>
              <input style={fieldStyle} className={fieldClass} value={form.kulcsszavak} onChange={(e) => update('kulcsszavak', e.target.value)} placeholder="beton, vas, szilárdság" />
            </div>

            {/* Kép és Videó URL-ek */}
            <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="p-4 border rounded-xl space-y-3 shadow-sm">
              <h4 style={{ color: cardHighlight }} className="text-xs font-bold uppercase tracking-wider">
                Média / URL-ek
              </h4>

              <div>
                <label style={labelStyle} className={labelClass}>Oktatóvideó URL-ek (soronként 1 URL)</label>
                <textarea
                  style={fieldStyle}
                  className={`${fieldClass} font-mono text-xs resize-none`}
                  rows={2}
                  value={form.video_urls}
                  onChange={(e) => update('video_urls', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>Képek / Illusztrációk URL-ek (soronként 1 URL)</label>
                <textarea
                  style={fieldStyle}
                  className={`${fieldClass} font-mono text-xs resize-none`}
                  rows={2}
                  value={form.image_urls}
                  onChange={(e) => update('image_urls', e.target.value)}
                  placeholder="https://domain.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="px-6 py-4 border-t sticky bottom-0 z-10 backdrop-blur-md flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
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
              className="px-5 py-2 font-black text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-md cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} /> {saving ? 'Mentés...' : 'Fogalom Mentése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
