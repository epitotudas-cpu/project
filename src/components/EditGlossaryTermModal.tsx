import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Globe, Plus, Trash2, ChevronDown, ChevronUp, Edit3, Search } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { GlossaryTerm } from '../lib/supabase';
import { createGlossaryTerm, updateGlossaryTerm, listTermTranslations, upsertTermTranslation, deleteTermTranslation } from '../services/glossaryService';
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
  video_urls: '',
  image_urls: '',
};

function formFromTerm(t: GlossaryTerm): FormState {
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
  source?: string;
}

export default function EditGlossaryTermModal({ term, onClose, onSaved }: EditGlossaryTermModalProps) {
  const { activeLanguages } = useGlossaryLanguages();
  const isCreate = term === null;
  const [form, setForm] = useState<FormState>(() => (term ? formFromTerm(term) : { ...EMPTY_FORM }));
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Translations State: record keyed by lowecased ISO code (e.g. 'en', 'de', 'ro')
  const [dynTranslations, setDynTranslations] = useState<Record<string, DynamicTranslationItem>>(() => {
    const initial: Record<string, DynamicTranslationItem> = {};
    if (term && term.translations) {
      Object.entries(term.translations).forEach(([k, v]) => {
        const code = k.toLowerCase();
        if (code === 'hu') return; // Skip HU base language in translations panel
        initial[code] = {
          translated_term: typeof v === 'string' ? v : (v as any)?.translated_term || '',
          definition: typeof v === 'string' ? '' : (v as any)?.definition || '',
          synonyms: typeof v === 'string' ? '' : Array.isArray((v as any)?.synonyms) ? (v as any).synonyms.join(', ') : '',
          status: typeof v === 'string' ? 'published' : (v as any)?.status || 'published',
          source: typeof v === 'string' ? '' : (v as any)?.source || '',
        };
      });
    }
    return initial;
  });

  // Track which translation row is expanded (null = all collapsed by default)
  const [openTranslationKey, setOpenTranslationKey] = useState<string | null>(null);

  // Track whether the "Fordítások" overall panel is expanded
  const [isTranslationsPanelOpen, setIsTranslationsPanelOpen] = useState(true);

  // Modal for selecting a new target language to add
  const [addLangModalOpen, setAddLangModalOpen] = useState(false);
  const [addLangSearch, setAddLangSearch] = useState('');

  // Track languages pending removal confirmation
  const [removeConfirmIso, setRemoveConfirmIso] = useState<string | null>(null);

  // Track ISO codes explicitly removed during session
  const [removedIsoCodes, setRemovedIsoCodes] = useState<Set<string>>(new Set());

  // Load existing translations table rows if available
  useEffect(() => {
    if (term && term.id) {
      listTermTranslations(term.id)
        .then((rows) => {
          if (rows && rows.length > 0) {
            setDynTranslations((prev) => {
              const updated = { ...prev };
              rows.forEach((r) => {
                const code = r.language_code.toLowerCase();
                if (code === 'hu') return;
                updated[code] = {
                  translated_term: r.translated_term || '',
                  definition: r.definition || '',
                  synonyms: Array.isArray(r.synonyms) ? r.synonyms.join(', ') : '',
                  status: r.status || 'published',
                  source: r.source || '',
                };
              });
              return updated;
            });
          }
        })
        .catch((err) => console.warn('Hiba a fogalom fordításainak betöltésekor:', err));
    }
  }, [term]);

  useEffect(() => {
    if (term) {
      setForm(formFromTerm(term));
      setSlugTouched(true);
      if (term.translations) {
        const initial: Record<string, DynamicTranslationItem> = {};
        Object.entries(term.translations).forEach(([k, v]) => {
          const code = k.toLowerCase();
          if (code === 'hu') return;
          initial[code] = {
            translated_term: typeof v === 'string' ? v : (v as any)?.translated_term || '',
            definition: typeof v === 'string' ? '' : (v as any)?.definition || '',
            synonyms: typeof v === 'string' ? '' : Array.isArray((v as any)?.synonyms) ? (v as any).synonyms.join(', ') : '',
            status: typeof v === 'string' ? 'published' : (v as any)?.status || 'published',
            source: typeof v === 'string' ? '' : (v as any)?.source || '',
          };
        });
        setDynTranslations(initial);
      }
      setOpenTranslationKey(null);
      setRemovedIsoCodes(new Set());
    } else {
      setForm({ ...EMPTY_FORM });
      setSlugTouched(false);
      setDynTranslations({});
      setOpenTranslationKey(null);
      setRemovedIsoCodes(new Set());
    }
    setError(null);
  }, [term]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) {
        if (addLangModalOpen) {
          setAddLangModalOpen(false);
        } else if (removeConfirmIso) {
          setRemoveConfirmIso(null);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, addLangModalOpen, removeConfirmIso, onClose]);

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

  // Handle adding a new target translation language
  function handleAddLanguage(isoCode: string) {
    const code = isoCode.toLowerCase();
    setDynTranslations((prev) => ({
      ...prev,
      [code]: {
        translated_term: '',
        definition: '',
        synonyms: '',
        status: 'published',
        source: '',
      },
    }));
    setRemovedIsoCodes((prev) => {
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
    setOpenTranslationKey(code);
    setIsTranslationsPanelOpen(true);
    setAddLangModalOpen(false);
    setAddLangSearch('');
  }

  // Handle removing a translation from this term
  function handleConfirmRemoveTranslation() {
    if (!removeConfirmIso) return;
    const code = removeConfirmIso.toLowerCase();
    
    setDynTranslations((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });

    setRemovedIsoCodes((prev) => new Set(prev).add(code));

    if (openTranslationKey === code) {
      setOpenTranslationKey(null);
    }
    setRemoveConfirmIso(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.term.trim()) {
      setError('❗ Kötelező mező hiányzik: "Kifejezés neve" – töltsd ki a fogalom nevét.');
      return;
    }
    if (!form.definition.trim()) {
      setError('❗ Kötelező mező hiányzik: "Definíció" – írj le rövid meghatározást.');
      return;
    }
    const finalSlug = form.slug.trim() || slugify(form.term);
    if (!finalSlug) {
      setError('❗ A slug érvénytelen – csak kisbetűk, számok és kötőjelek megengedettek.');
      return;
    }
    const imageLines = form.image_urls.split('\n').map((u) => u.trim()).filter(Boolean);
    const videoLines = form.video_urls.split('\n').map((u) => u.trim()).filter(Boolean);
    
    const syntaxInvalidUrls = imageLines.filter((u) => !isValidUrl(u));
    if (syntaxInvalidUrls.length > 0) {
      setError('❗ Kép URL hiba – az alábbi sorok nem érvényesek:\n' + syntaxInvalidUrls.join('\n'));
      return;
    }

    const syntaxInvalidVideoUrls = videoLines.filter((u) => !isValidUrl(u));
    if (syntaxInvalidVideoUrls.length > 0) {
      setError('❗ Videó URL hiba – az alábbi sorok nem érvényesek:\n' + syntaxInvalidVideoUrls.join('\n'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Build translations object for glossary_terms.translations JSONB
      const translationsPayload: Record<string, any> = {};

      Object.entries(dynTranslations).forEach(([k, item]) => {
        const code = k.toLowerCase();
        if (item.translated_term.trim()) {
          translationsPayload[code] = {
            translated_term: item.translated_term.trim(),
            definition: item.definition.trim() || undefined,
            synonyms: parseList(item.synonyms),
            status: item.status,
            source: item.source?.trim() || undefined,
          };
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

      // Synchronize with glossary_term_translations table
      if (data && data.id) {
        // Upsert all defined dynamic translations
        for (const [code, item] of Object.entries(dynTranslations)) {
          if (item.translated_term.trim()) {
            try {
              await upsertTermTranslation({
                glossary_term_id: data.id,
                language_code: code,
                translated_term: item.translated_term.trim(),
                definition: item.definition.trim() || null,
                synonyms: parseList(item.synonyms),
                status: item.status,
                source: item.source?.trim() || null,
              });
            } catch (trErr) {
              console.warn(`Hiba a(z) ${code} fordítás mentésekor:`, trErr);
            }
          }
        }

        // Delete removed translation rows if any
        for (const removedCode of removedIsoCodes) {
          try {
            await deleteTermTranslation(data.id, removedCode);
          } catch (delErr) {
            console.warn(`Hiba a(z) ${removedCode} fordítás törlésekor:`, delErr);
          }
        }
      }

      window.dispatchEvent(new CustomEvent('glossary-updated'));
      setTimeout(() => {
        onSaved(data);
      }, 1000);
    } catch (err) {
      setError(parseSupabaseError(err));
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

  // Candidate languages for the "Add Translation" picker
  const candidateLanguages = activeLanguages.filter((l) => {
    const code = l.iso_code.toLowerCase();
    return code !== 'hu' && !dynTranslations[code];
  });

  const filteredCandidateLanguages = candidateLanguages.filter((l) => {
    if (!addLangSearch.trim()) return true;
    const q = addLangSearch.trim().toLowerCase();
    return (
      l.name_hu.toLowerCase().includes(q) ||
      l.name_native.toLowerCase().includes(q) ||
      l.iso_code.toLowerCase().includes(q) ||
      l.short_label.toLowerCase().includes(q)
    );
  });

  const addedLanguagesCount = Object.keys(dynTranslations).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
        className="border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
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
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-xs font-medium whitespace-pre-line animate-fadeIn">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* 1. MAGYAR ALAPADATOK */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-gray-700/50">
                <h3 style={{ color: cardHighlight }} className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  🇭🇺 Magyar Alapadatok (Alapnyelv)
                </h3>
              </div>

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
                  <label style={labelStyle} className={labelClass}>Fogalom Neve (HU) *</label>
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
                <label style={labelStyle} className={labelClass}>Rövid Definíció (HU) *</label>
                <textarea
                  style={fieldStyle}
                  className={`${fieldClass} resize-none`}
                  rows={3}
                  value={form.definition}
                  onChange={(e) => update('definition', e.target.value)}
                  placeholder="Rövid, pontos összefoglaló magyar nyelvű meghatározás..."
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
                    <label style={labelStyle} className={labelClass}>Hosszú / Részletes Műszaki Magyarázat</label>
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
                      placeholder="Tipikus hibák és megelőzésük..."
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle} className={labelClass}>Kategória / Szakág</label>
                  <input style={fieldStyle} className={fieldClass} value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="pl. Falazás" />
                </div>
                <div>
                  <label style={labelStyle} className={labelClass}>Szint</label>
                  <input style={fieldStyle} className={fieldClass} value={form.szint} onChange={(e) => update('szint', e.target.value)} placeholder="pl. Kezdő" />
                </div>
              </div>

              <div>
                <label style={labelStyle} className={labelClass}>Szinonimák / Kulcsszavak (vesszővel elválasztva)</label>
                <input style={fieldStyle} className={fieldClass} value={form.kulcsszavak} onChange={(e) => update('kulcsszavak', e.target.value)} placeholder="beton, vas, szilárdság" />
              </div>
            </div>

            {/* 2. FORDÍTÁSOK SZAKASZ */}
            <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="border rounded-2xl overflow-hidden shadow-sm transition-all">
              {/* Panel Fejléc */}
              <div className="p-4 flex items-center justify-between flex-wrap gap-3 border-b border-gray-700/40">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTranslationsPanelOpen((prev) => !prev)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left cursor-pointer"
                  >
                    <Globe size={18} className="text-amber-400" />
                    <span style={{ color: textColor }} className="font-extrabold text-sm">
                      Fordítások
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {addedLanguagesCount > 0 ? `${addedLanguagesCount} nyelv hozzáadva` : 'Nincs fordítás hozzáadva'}
                    </span>
                    {isTranslationsPanelOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setAddLangModalOpen(true)}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-3.5 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90 cursor-pointer"
                >
                  <Plus size={15} /> Fordítás hozzáadása
                </button>
              </div>

              {/* Panel Tartalom */}
              {isTranslationsPanelOpen && (
                <div className="p-4 space-y-3">
                  {addedLanguagesCount === 0 ? (
                    <div className="p-5 text-center border border-dashed rounded-xl border-gray-700/60 text-gray-400 text-xs space-y-2">
                      <Globe size={24} className="mx-auto text-gray-500 opacity-60" />
                      <p>Kezdetben csak a magyar alapadatok jelennek meg.</p>
                      <p className="text-gray-500">
                        Új fordítási nyelv felvételéhez kattints a feljebb található <strong className="text-amber-400">+ Fordítás hozzáadása</strong> gombra.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(dynTranslations).map(([code, item]) => {
                        const langInfo = activeLanguages.find((l) => l.iso_code.toLowerCase() === code);
                        const flag = langInfo?.flag_emoji || '🌐';
                        const nameHu = langInfo?.name_hu || code.toUpperCase();
                        const shortLabel = langInfo?.short_label || code.toUpperCase();
                        const isExpanded = openTranslationKey === code;
                        const hasTerm = Boolean(item.translated_term.trim());

                        return (
                          <div
                            key={code}
                            style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                            className="border rounded-xl overflow-hidden transition-all shadow-xs"
                          >
                            {/* Kompakt Összecsukható Sor Fejléc */}
                            <div
                              onClick={() => setOpenTranslationKey(isExpanded ? null : code)}
                              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors gap-3 select-none"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base leading-none">{flag}</span>
                                <span style={{ color: textColor }} className="font-bold text-xs truncate">
                                  {nameHu} ({shortLabel})
                                </span>
                                {hasTerm && (
                                  <span className="text-xs font-mono text-gray-400 hidden sm:inline truncate max-w-[150px]">
                                    — {item.translated_term}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Státusz badge */}
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                    item.status === 'published'
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                      : item.status === 'reviewed'
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-gray-500/20 text-gray-400 border-gray-500/40'
                                  }`}
                                >
                                  {item.status === 'published'
                                    ? '🟢 Publikált'
                                    : item.status === 'reviewed'
                                    ? '🟡 Ellenőrzött'
                                    : '⚪ Piszkozat'}
                                </span>

                                {/* Szerkesztés gomb */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenTranslationKey(isExpanded ? null : code);
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-700 bg-black/20 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 size={13} />
                                  <span>{isExpanded ? 'Bezárás' : 'Szerkesztés'}</span>
                                </button>

                                {/* Eltávolítás gomb */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRemoveConfirmIso(code);
                                  }}
                                  title="Fordítás eltávolítása"
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Kibontott Szerkesztő Űrlap */}
                            {isExpanded && (
                              <div
                                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                                className="p-4 border-t space-y-3 animate-fadeIn"
                              >
                                {/* Readonly címke */}
                                <div className="flex items-center justify-between bg-black/30 px-3 py-1.5 rounded-lg border border-gray-800 text-xs">
                                  <span className="text-gray-400 font-medium">
                                    Nyelv: <strong className="text-amber-400">{flag} {nameHu} ({shortLabel})</strong> — csak olvasható címke
                                  </span>
                                  <span className="text-[10px] font-mono text-gray-500">ISO: {code}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Idegen nyelvű szakkifejezés */}
                                  <div>
                                    <label style={labelStyle} className="block text-[11px] font-bold mb-1">
                                      Idegen Nyelvű Szakkifejezés *
                                    </label>
                                    <input
                                      style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                                      className={fieldClass}
                                      value={item.translated_term}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDynTranslations((prev) => ({
                                          ...prev,
                                          [code]: { ...item, translated_term: val },
                                        }));
                                      }}
                                      placeholder={`pl. ${nameHu} elnevezés...`}
                                      required
                                    />
                                  </div>

                                  {/* Fordítás Állapota */}
                                  <div>
                                    <label style={labelStyle} className="block text-[11px] font-bold mb-1">
                                      Fordítás Állapota
                                    </label>
                                    <select
                                      style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                                      className={fieldClass}
                                      value={item.status}
                                      onChange={(e) => {
                                        const st = e.target.value as DynamicTranslationItem['status'];
                                        setDynTranslations((prev) => ({
                                          ...prev,
                                          [code]: { ...item, status: st },
                                        }));
                                      }}
                                    >
                                      <option value="published">🟢 Publikált (published)</option>
                                      <option value="reviewed">🟡 Ellenőrzött (reviewed)</option>
                                      <option value="draft">⚪ Piszkozat (draft)</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Rövid Definíció */}
                                <div>
                                  <label style={labelStyle} className="block text-[11px] font-bold mb-1">
                                    Rövid Definíció / Magyarázat ({shortLabel}) — Opcionális
                                  </label>
                                  <textarea
                                    rows={2}
                                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                                    className={`${fieldClass} resize-none`}
                                    value={item.definition}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setDynTranslations((prev) => ({
                                        ...prev,
                                        [code]: { ...item, definition: val },
                                      }));
                                    }}
                                    placeholder={`Rövid magyarázat ${nameHu} nyelven...`}
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Szinonimák */}
                                  <div>
                                    <label style={labelStyle} className="block text-[11px] font-bold mb-1">
                                      Szinonimák ({shortLabel}) — Vesszővel
                                    </label>
                                    <input
                                      style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                                      className={fieldClass}
                                      value={item.synonyms}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDynTranslations((prev) => ({
                                          ...prev,
                                          [code]: { ...item, synonyms: val },
                                        }));
                                      }}
                                      placeholder="szinonima1, szinonima2"
                                    />
                                  </div>

                                  {/* Forrás vagy megjegyzés */}
                                  <div>
                                    <label style={labelStyle} className="block text-[11px] font-bold mb-1">
                                      Forrás vagy Megjegyzés — Opcionális
                                    </label>
                                    <input
                                      style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                                      className={fieldClass}
                                      value={item.source || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDynTranslations((prev) => ({
                                          ...prev,
                                          [code]: { ...item, source: val },
                                        }));
                                      }}
                                      placeholder="pl. DIN EN 1992-1-1 / Szakszótár"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setOpenTranslationKey(null)}
                                    className="px-3 py-1 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                                  >
                                    Összecsukás ▲
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Média / URL-ek */}
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

      {/* 3. MODAL: NYELV HOZZÁADÁSA */}
      {addLangModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
            className="border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-amber-400" />
                <h3 className="font-extrabold text-sm" style={{ color: textColor }}>
                  Fordítási nyelv hozzáadása
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddLangModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              <p className="text-xs text-gray-400">
                Válassz ki egy nyelvet a központi nyelvkezelésben elérhető aktív nyelvek közül:
              </p>

              {/* Keresőmező */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={addLangSearch}
                  onChange={(e) => setAddLangSearch(e.target.value)}
                  placeholder="Keresés nyelv neve vagy kódja alapján..."
                  style={fieldStyle}
                  className={`${fieldClass} pl-9`}
                  autoFocus
                />
              </div>

              {/* Nyelvlista */}
              {filteredCandidateLanguages.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed rounded-xl border-gray-700">
                  {candidateLanguages.length === 0
                    ? 'Minden elérhető aktív nyelv hozzá van már adva ehhez a fogalomhoz!'
                    : 'Nincs a keresésnek megfelelő elérhető nyelv.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredCandidateLanguages.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => handleAddLanguage(lang.iso_code)}
                      style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                      className="w-full p-3 border rounded-xl flex items-center justify-between hover:border-amber-400 hover:bg-white/5 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl leading-none">{lang.flag_emoji || '🌐'}</span>
                        <div>
                          <div style={{ color: textColor }} className="font-bold text-xs group-hover:text-amber-400 transition-colors">
                            {lang.name_hu} ({lang.short_label})
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {lang.name_native} — ISO: {lang.iso_code}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{ backgroundColor: cardHighlight, color: '#000000' }}
                        className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg flex items-center gap-1 shadow-xs group-hover:scale-105 transition-transform"
                      >
                        <Plus size={13} /> Hozzáadás
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: headerBg, borderColor: cardBorder }} className="px-5 py-3 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setAddLangModalOpen(false)}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-4 py-1.5 text-xs font-bold rounded-xl border hover:opacity-80 transition-colors cursor-pointer"
              >
                Mégse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: FORDÍTÁS ELTÁVOLÍTÁSA MEGERŐSÍTÉS */}
      {removeConfirmIso && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
            className="border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-sm"
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <h3 className="font-extrabold text-base text-white">Fordítás eltávolítása</h3>
            </div>

            {(() => {
              const langInfo = activeLanguages.find((l) => l.iso_code.toLowerCase() === removeConfirmIso.toLowerCase());
              const nameHu = langInfo?.name_hu || removeConfirmIso.toUpperCase();
              const flag = langInfo?.flag_emoji || '🌐';

              return (
                <div className="space-y-2 text-xs text-gray-300">
                  <p>
                    Biztosan el szeretnéd távolítani a(z) <strong className="text-white font-bold">{flag} {nameHu} ({removeConfirmIso.toUpperCase()})</strong> fordítást erről a fogalomról?
                  </p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                    💡 <strong>Megjegyzés:</strong> Ez a művelet kizárólag ennek a konkrét fogalomnak a fordítását törli. A nyelv megmarad a központi nyelvkezelőben és más fogalmak fordításaiban.
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRemoveConfirmIso(null)}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-4 py-2 border font-bold text-xs rounded-xl hover:opacity-80 transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveTranslation}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Igen, fordítás törlése
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
