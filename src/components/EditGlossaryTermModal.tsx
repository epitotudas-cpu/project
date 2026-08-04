import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Image, Video, Info } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { GlossaryTerm } from '../lib/supabase';
import { createGlossaryTerm, updateGlossaryTerm } from '../services/glossaryService';

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

  // Supabase PostgrestError: { code, message, details, hint }
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const code = String(e.code ?? '');
    const message = String(e.message ?? '');
    const details = e.details ? `\nRészletek: ${e.details}` : '';
    const hint = e.hint ? `\nTipp: ${e.hint}` : '';

    // Ismert Postgres hiba kódok
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
  video_url: string;
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
  video_url: '',
  image_urls: '',
};

function formFromTerm(t: GlossaryTerm): FormState {
  const trans = t.translations ?? {};
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
    video_url: t.video_url ?? '',
    image_urls: (t.image_urls ?? []).join('\n'),
  };
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function EditGlossaryTermModal({ term, onClose, onSaved }: EditGlossaryTermModalProps) {
  const isCreate = term === null;
  const [form, setForm] = useState<FormState>(() => (term ? formFromTerm(term) : { ...EMPTY_FORM }));
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (term) {
      setForm(formFromTerm(term));
      setSlugTouched(true);
    } else {
      setForm({ ...EMPTY_FORM });
      setSlugTouched(false);
    }
    setError(null);
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
      setError('\u2757 Kötelező mező hiányzik: "Kifejezés neve" – töltsd ki a fogalom nevét.');
      return;
    }
    if (!form.definition.trim()) {
      setError('\u2757 Kötelező mező hiányzik: "Definíció" – írj le rövid meghatározást.');
      return;
    }
    const finalSlug = form.slug.trim() || slugify(form.term);
    if (!finalSlug) {
      setError('\u2757 A slug érvénytelen – csak kisbetűk, számok és kötőjelek megengedettek.');
      return;
    }
    // Kép URL-ek szintaktikai validálása (csak formátum ellenőrzés, nem blokk)
    const imageLines = form.image_urls.split('\n').map((u) => u.trim()).filter(Boolean);
    const syntaxInvalidUrls = imageLines.filter((u) => !isValidUrl(u));
    if (syntaxInvalidUrls.length > 0) {
      setError(
        '\u2757 Kép URL hiba – az alábbi sorok nem érvényes linkek (csak https:// kezdetű linkek elfogadottak):\n' +
        syntaxInvalidUrls.map((u, i) => `  ${i + 1}. sor: "${u}"`).join('\n')
      );
      return;
    }
    // Videó URL szintaktikai validálása
    if (form.video_url.trim() && !isValidUrl(form.video_url)) {
      setError('\u2757 Videó URL hiba – csak https:// vagy http:// kezdetű link elfogadott (pl. https://youtu.be/... vagy https://youtube.com/watch?v=...)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const translationsPayload: Record<string, string> = {};
      if (form.trans_en.trim()) translationsPayload.en = form.trans_en.trim();
      if (form.trans_de.trim()) translationsPayload.de = form.trans_de.trim();
      if (form.trans_ro.trim()) translationsPayload.ro = form.trans_ro.trim();

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
        video_url: form.video_url.trim() || null,
        image_urls: imageLines,
      };
      let data: GlossaryTerm;
      if (term) {
        data = await updateGlossaryTerm(term.id, payload);
      } else {
        data = await createGlossaryTerm(payload);
      }
      onSaved(data);
      window.dispatchEvent(new CustomEvent('glossary-updated'));
    } catch (err) {
      setError(parseSupabaseError(err));
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FFC400]/50 transition-colors';
  const labelClass = 'block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !saving && onClose()}>
      <div
        className="bg-[#111] border border-[#1E1E1E] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E] sticky top-0 bg-[#111] z-10">
          <h2 className="text-base font-black text-white">{isCreate ? 'Új bejegyzés létrehozása' : 'Bejegyzés szerkesztése'}</h2>
          <button onClick={onClose} disabled={saving} className="text-gray-500 hover:text-gray-300 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Hiba panel */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  {error.split('\n').map((line, i) => (
                    <p key={i} className={`text-red-400 text-sm ${i > 0 ? 'mt-1 text-xs opacity-80' : ''}`}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Tartalom Típusa</label>
            <select
              className={fieldClass}
              value={form.entry_type}
              onChange={(e) => update('entry_type', e.target.value as 'technical_concept' | 'industry_term')}
            >
              <option value="technical_concept">📘 Szakmai Fogalom (technical_concept)</option>
              <option value="industry_term">🗣 Nyelvi Szótár / Zsargon (industry_term)</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Kifejezés neve <span className="text-red-400">*</span></label>
            <input
              className={fieldClass}
              value={form.term}
              onChange={(e) => handleTermChange(e.target.value)}
              placeholder={form.entry_type === 'industry_term' ? 'pl. Malter' : 'pl. Betonacél'}
              autoFocus={isCreate}
            />
          </div>

          <div>
            <label className={labelClass}>Slug</label>
            <input className={fieldClass} value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="url-barat-azonosito" />
          </div>

          <div>
            <label className={labelClass}>{form.entry_type === 'industry_term' ? 'Jelentése / Leírás' : 'Definíció'} <span className="text-red-400">*</span></label>
            <textarea
              className={`${fieldClass} resize-none`}
              rows={3}
              value={form.definition}
              onChange={(e) => update('definition', e.target.value)}
              placeholder="Definíció vagy jelentés..."
            />
          </div>

          {form.entry_type === 'industry_term' ? (
            <>
              <div>
                <label className={labelClass}>Hivatalos Szakmai Megfelelő Neve</label>
                <input
                  className={fieldClass}
                  value={form.official_term_name}
                  onChange={(e) => update('official_term_name', e.target.value)}
                  placeholder="pl. Habarcs"
                />
              </div>

              <div>
                <label className={labelClass}>Használati Példamondat</label>
                <input
                  className={fieldClass}
                  value={form.usage_example}
                  onChange={(e) => update('usage_example', e.target.value)}
                  placeholder='pl. "A maltert bekevertük a falazáshoz."'
                />
              </div>

              <div>
                <label className={labelClass}>Zsargon Sub-típus</label>
                <select
                  className={fieldClass}
                  value={form.jargon_subtype}
                  onChange={(e) => update('jargon_subtype', e.target.value as FormState['jargon_subtype'])}
                >
                  <option value="">(Nincs kiválasztva)</option>
                  <option value="brand_name">🏷️ Márkanévből lett köznév (pl. Flex, Hilti, Dryvit)</option>
                  <option value="german_origin">🏷️ Német mesterszó (pl. Malter, Stafni, Trepedli)</option>
                  <option value="workplace_slang">🏷️ Munkanyelvi szleng (pl. Béka, Zsiráf, Cigi)</option>
                  <option value="synonym">🏷️ Műszaki szinonima (pl. Falazóhabarcs)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Eredet / Etimológia</label>
                <input
                  className={fieldClass}
                  value={form.origin_note}
                  onChange={(e) => update('origin_note', e.target.value)}
                  placeholder="pl. Német eredetű szakmai szó (Mörtel)."
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelClass}>Részletes Műszaki Leírás</label>
                <textarea
                  className={`${fieldClass} resize-none`}
                  rows={3}
                  value={form.detailed_description}
                  onChange={(e) => update('detailed_description', e.target.value)}
                  placeholder="Anyagösszetétel, szabványok, működés..."
                />
              </div>

              <div>
                <label className={labelClass}>Gyakorlati Alkalmazás</label>
                <textarea
                  className={`${fieldClass} resize-none`}
                  rows={2}
                  value={form.practical_applications}
                  onChange={(e) => update('practical_applications', e.target.value)}
                  placeholder="Hol és hogyan használják a kivitelezés során..."
                />
              </div>

              <div>
                <label className={labelClass}>Gyakori Kivitelezési Hibák</label>
                <textarea
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
          <div className="p-4 bg-[#161616] border border-[#222] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#FFC400] uppercase tracking-wider">🌐 Többnyelvű Szakszótár (HU - EN - DE - RO)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">🇬🇧 Angol (EN)</label>
                <input
                  className={fieldClass}
                  value={form.trans_en}
                  onChange={(e) => update('trans_en', e.target.value)}
                  placeholder="pl. Mortar"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">🇩🇪 Német (DE)</label>
                <input
                  className={fieldClass}
                  value={form.trans_de}
                  onChange={(e) => update('trans_de', e.target.value)}
                  placeholder="pl. Mörtel"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">🇷🇴 Román (RO)</label>
                <input
                  className={fieldClass}
                  value={form.trans_ro}
                  onChange={(e) => update('trans_ro', e.target.value)}
                  placeholder="pl. Mortar"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Szakág / Témakör</label>
              <input className={fieldClass} value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="pl. Falazás" />
            </div>
            <div>
              <label className={labelClass}>Szint</label>
              <input className={fieldClass} value={form.szint} onChange={(e) => update('szint', e.target.value)} placeholder="pl. Kezdő" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Kulcsszavak (vesszővel)</label>
            <input className={fieldClass} value={form.kulcsszavak} onChange={(e) => update('kulcsszavak', e.target.value)} placeholder="beton, vas, szilárdság" />
          </div>

          {/* Kép és Videó URL-ek */}
          <div className="p-4 bg-[#161616] border border-[#222] rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-[#FFC400] uppercase tracking-wider flex items-center gap-2">
              <Image size={12} /> Média (Képek &amp; Videó)
            </h4>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1">
                <Image size={10} className="inline mr-1" />
                Kép URL-ek (soronként egy, https://... kezdetű)
              </label>
              <textarea
                className={`${fieldClass} resize-none font-mono text-[11px]`}
                rows={3}
                value={form.image_urls}
                onChange={(e) => update('image_urls', e.target.value)}
                placeholder={`https://images.pexels.com/photos/11891953/pexels-photo-11891953.jpeg\nhttps://example.com/masik-kep.jpg`}
              />
              {/* Valós idejű szintaxis-ellenőrzés */}
              {form.image_urls.split('\n').map((u) => u.trim()).filter(Boolean).map((u, i) =>
                !isValidUrl(u) ? (
                  <p key={i} className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {i + 1}. sor: Érvénytelen URL formátum (https://... szükséges)
                  </p>
                ) : null
              )}
              {/* Pexels útmutató */}
              {form.image_urls.includes('pexels.com') && !form.image_urls.includes('images.pexels.com') && (
                <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-1.5 text-[10px] text-amber-400">
                    <Info size={10} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Pexels oldal URL</strong> – ez egy weblap, nem közvetlen kép. A kép helyes URL-jéhez:
                      <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                        <li>Nyisd meg a Pexels oldalt</li>
                        <li>Jobb klikk a képen → "Kép link másolása" (Copy image address)</li>
                        <li>Az eredmény valami ilyesmi lesz: <code className="bg-black/30 px-1 rounded">https://images.pexels.com/photos/.../...</code></li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-600 mt-1">Ha nem tölt be a kép, a fogalomkártyán automatikusan kategória ikon jeleník meg helyette.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1">
                <Video size={10} className="inline mr-1" />
                Videó URL (YouTube / Vimeo, https://... kezdetű)
              </label>
              <input
                className={fieldClass}
                value={form.video_url}
                onChange={(e) => update('video_url', e.target.value)}
                placeholder="https://youtu.be/... vagy https://youtube.com/watch?v=..."
              />
              {form.video_url.trim() && !isValidUrl(form.video_url) && (
                <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> Érvénytelen videó URL – csak https:// kezdetű link elfogadott.
                </p>
              )}
              {form.video_url.trim() && isValidUrl(form.video_url) && (
                <p className="text-emerald-400 text-[10px] mt-1 flex items-center gap-1">
                  ✓ Érvényes videó URL
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors">
              Mégse
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC400] text-black text-sm font-black rounded-lg hover:bg-[#E6B000] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              <Save size={14} /> {saving ? 'Mentés...' : isCreate ? 'Létrehozás' : 'Mentés'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
