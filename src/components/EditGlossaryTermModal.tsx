import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { GlossaryTerm } from '../lib/supabase';
import { createGlossaryTerm, updateGlossaryTerm } from '../services/glossaryService';

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
      setError('A kifejezés neve megadása kötelező.');
      return;
    }
    if (!form.definition.trim()) {
      setError('A definíció / jelentés megadása kötelező.');
      return;
    }
    const finalSlug = form.slug.trim() || slugify(form.term);
    if (!finalSlug) {
      setError('A slug érvénytelen.');
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
        image_urls: form.image_urls.split('\n').map((u) => u.trim()).filter(Boolean),
      };
      let data: GlossaryTerm;
      if (term) {
        data = await updateGlossaryTerm(term.id, payload);
      } else {
        data = await createGlossaryTerm(payload);
      }
      onSaved(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mentés sikertelen.';
      if (/duplicate|unique|23505/i.test(msg)) {
        setError('Ez a slug már foglalt.');
      } else {
        setError(msg);
      }
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
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
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
