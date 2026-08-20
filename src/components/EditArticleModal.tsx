import React, { useState, useEffect, useId } from 'react';
import {
  X, Save, AlertCircle, BarChart3, Calculator, Sparkles, Plus, Trash2,
  ChevronUp, ChevronDown, Eye, ChevronRight, Check, Image as ImageIcon,
  Wrench, ShieldAlert, AlertTriangle, FileText, Table, CheckSquare,
  HelpCircle, BookOpen, Layers, Tag, RotateCcw, Copy, Info, ListOrdered,
  BookMarked, HelpCircle as HelpIcon, CheckCircle2
} from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Article, Category } from '../lib/supabase';
import { createArticle, updateArticle } from '../services/articleService';
import { listGlossaryTerms } from '../services/glossaryService';

interface EditArticleModalProps {
  article: Article | null; // null = create mode
  categories: Category[];
  onClose: () => void;
  onSaved: (saved: Article) => void;
}

const STATUS_OPTIONS: { value: Article['status'] | 'archived'; label: string }[] = [
  { value: 'draft', label: 'Piszkozat' },
  { value: 'review', label: 'Felülvizsgálaton' },
  { value: 'published', label: 'Publikált' },
  { value: 'archived', label: 'Archivált' },
];

// Structure Interfaces
export interface GuideWarning {
  id: string;
  type: 'warning' | 'safety' | 'specialist' | 'technical';
  text: string;
}

export interface GuideWorkflowStep {
  id: string;
  title: string;
}

export interface GuideMaterial {
  id: string;
  name: string;
  sizeType: string;
  unit: string;
  note: string;
}

export interface GuideTool {
  id: string;
  name: string;
  category: 'Alapvető szerszámok' | 'Mérő- és jelölőeszközök' | 'Gépek' | 'Kiegészítők' | 'Munkavédelmi eszközök';
  note: string;
}

export interface GuideSafetyItem {
  id: string;
  hazardType: 'Vágásveszély' | 'Por' | 'Zaj' | 'Elektromos veszély' | 'Magassági munkavégzés' | 'Anyagmozgatás' | 'Vegyi anyag' | 'Egyéb';
  hazardName: string;
  explanation: string;
  prevention: string;
}

export interface GuideExecutionStep {
  id: string;
  title: string;
  whatWeDo: string;
  howWeDo: string;
  whatToWatch: string;
  commonMistake: string;
  verification: string;
  neededMaterials?: string;
  neededTools?: string;
  imageUrl?: string;
  imageCaption?: string;
  imageAlt?: string;
  imagePurpose?: string;
  imagePrompt?: string;
}

export interface GuideImageItem {
  id: string;
  url: string;
  caption: string;
  alt: string;
  purpose: string;
  prompt: string;
}

export interface GuideTechDataItem {
  id: string;
  element: string;
  value: string;
  unit: string;
  valueType: 'Előírt' | 'Tipikus' | 'Rendszerfüggő' | 'Gyártói előírás szerint';
  note: string;
}

export interface GuideMistakeItem {
  id: string;
  mistake: string;
  whyProblem: string;
  prevention: string;
  fix: string;
}

export interface GuideHighlightItem {
  id: string;
  type: 'Jó tudni' | 'Figyelem' | 'Szakmai tipp' | 'Fontos' | 'Biztonság';
  title: string;
  content: string;
}

export interface GuideChecklistItem {
  id: string;
  text: string;
}

export interface GuideCalculationItem {
  inputData: string;
  formula: string;
  calculation: string;
  result: string;
  note: string;
}

export interface GuideSEOData {
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  relatedKeywords: string;
}

export interface GuideData {
  introduction: string;
  warnings: GuideWarning[];
  workflow: GuideWorkflowStep[];
  materials: GuideMaterial[];
  tools: GuideTool[];
  safety: GuideSafetyItem[];
  steps: GuideExecutionStep[];
  galleryImages: GuideImageItem[];
  techData: GuideTechDataItem[];
  mistakes: GuideMistakeItem[];
  highlights: GuideHighlightItem[];
  checklist: GuideChecklistItem[];
  relatedTerms: string[];
  calculation: GuideCalculationItem;
  summary: string;
  relatedGuides: string[];
  seo: GuideSEOData;
}

function createEmptyGuideData(): GuideData {
  return {
    introduction: '',
    warnings: [],
    workflow: [],
    materials: [],
    tools: [],
    safety: [],
    steps: [],
    galleryImages: [],
    techData: [],
    mistakes: [],
    highlights: [],
    checklist: [],
    relatedTerms: [],
    calculation: {
      inputData: '',
      formula: '',
      calculation: '',
      result: '',
      note: '',
    },
    summary: '',
    relatedGuides: [],
    seo: {
      seoTitle: '',
      metaDescription: '',
      primaryKeyword: '',
      relatedKeywords: '',
    },
  };
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category_id: string;
  status: Article['status'];
  author: string;
  read_time: number;
  featured_image: string;
  featured_image_alt: string;
  featured_image_caption: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category_id: '',
  status: 'draft',
  author: 'ÉpítőTudás Szerkesztőség',
  read_time: 5,
  featured_image: '',
  featured_image_alt: '',
  featured_image_caption: '',
};

function formFromArticle(article: Article): FormState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? '',
    content: article.content ?? '',
    category_id: article.category_id ?? '',
    status: article.status || 'draft',
    author: article.author ?? 'ÉpítőTudás Szerkesztőség',
    read_time: article.read_time || 5,
    featured_image: article.featured_image ?? '',
    featured_image_alt: '',
    featured_image_caption: '',
  };
}

function calculateReadTime(text: string): number {
  if (!text.trim()) return 5;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// Data serialization helpers
function serializeGuideToContent(guide: GuideData): string {
  let md = '';

  if (guide.introduction?.trim()) {
    md += `## Bevezetés\n\n${guide.introduction.trim()}\n\n`;
  }

  if (guide.warnings.length > 0) {
    md += `## Fontos Figyelmeztetések\n\n`;
    guide.warnings.forEach((w) => {
      const badge =
        w.type === 'warning' ? '⚠️ FIGYELEM' :
        w.type === 'safety' ? '🛑 BIZTONSÁG' :
        w.type === 'specialist' ? '⚡ SZAKEMBER SZÜKSÉGES' : '📌 FONTOS MŰSZAKI FELTÉTEL';
      md += `> **${badge}**: ${w.text}\n\n`;
    });
  }

  if (guide.workflow.length > 0) {
    md += `## A Munkafolyamat Áttekintése\n\n`;
    guide.workflow.forEach((step, idx) => {
      md += `${idx + 1}. ${step.title}\n`;
    });
    md += `\n`;
  }

  if (guide.materials.length > 0) {
    md += `## Szükséges Anyagok\n\n`;
    guide.materials.forEach((m) => {
      md += `- **${m.name}** | Méret/típus: ${m.sizeType || '-'} | Egység: ${m.unit || '-'}${m.note ? ` (${m.note})` : ''}\n`;
    });
    md += `\n`;
  }

  if (guide.tools.length > 0) {
    md += `## Szükséges Szerszámok\n\n`;
    guide.tools.forEach((t) => {
      md += `- **[${t.category}] ${t.name}**${t.note ? `: ${t.note}` : ''}\n`;
    });
    md += `\n`;
  }

  if (guide.safety.length > 0) {
    md += `## Munkavédelem & Biztonság\n\n`;
    guide.safety.forEach((s) => {
      md += `### 🛡️ ${s.hazardName} (${s.hazardType})\n`;
      if (s.explanation) md += `- **Magyarázat:** ${s.explanation}\n`;
      if (s.prevention) md += `- **Megelőzés:** ${s.prevention}\n\n`;
    });
  }

  if (guide.steps.length > 0) {
    md += `## Lépésenkénti Kivitelezés\n\n`;
    guide.steps.forEach((s, idx) => {
      md += `### ${idx + 1}. Lépés: ${s.title}\n\n`;
      if (s.whatWeDo) md += `**Mit csinálunk?**\n${s.whatWeDo}\n\n`;
      if (s.howWeDo) md += `**Hogyan csináljuk?**\n${s.howWeDo}\n\n`;
      if (s.whatToWatch) md += `**Mire figyelj?**\n${s.whatToWatch}\n\n`;
      if (s.commonMistake) md += `**Gyakori hiba:**\n${s.commonMistake}\n\n`;
      if (s.verification) md += `**Ellenőrzés:**\n${s.verification}\n\n`;
      if (s.neededMaterials) md += `*Szükséges anyagok:* ${s.neededMaterials}\n\n`;
      if (s.neededTools) md += `*Szükséges szerszámok:* ${s.neededTools}\n\n`;
      if (s.imageUrl) {
        md += `![${s.imageAlt || s.title}](${s.imageUrl})\n*${s.imageCaption || ''}*\n\n`;
      }
    });
  }

  if (guide.techData.length > 0) {
    md += `## Méretek és Műszaki Adatok\n\n`;
    md += `*(Ellenőrizd a gyártói / rendszerelőírást!)*\n\n`;
    md += `| Elem / Művelet | Érték | Egység | Típus | Megjegyzés |\n`;
    md += `| --- | --- | --- | --- | --- |\n`;
    guide.techData.forEach((td) => {
      md += `| ${td.element} | ${td.value} | ${td.unit} | ${td.valueType} | ${td.note || '-'} |\n`;
    });
    md += `\n`;
  }

  if (guide.mistakes.length > 0) {
    md += `## Gyakori Hibák\n\n`;
    guide.mistakes.forEach((m) => {
      md += `### ❌ ${m.mistake}\n`;
      if (m.whyProblem) md += `- **Miért probléma:** ${m.whyProblem}\n`;
      if (m.prevention) md += `- **Megelőzés:** ${m.prevention}\n`;
      if (m.fix) md += `- **Javítás:** ${m.fix}\n\n`;
    });
  }

  if (guide.highlights.length > 0) {
    md += `## Szakmai Kiemelések\n\n`;
    guide.highlights.forEach((h) => {
      md += `> **[${h.type}] ${h.title}**\n> ${h.content}\n\n`;
    });
  }

  if (guide.checklist.length > 0) {
    md += `## Minőségellenőrző Lista\n\n`;
    guide.checklist.forEach((c) => {
      md += `- [ ] ${c.text}\n`;
    });
    md += `\n`;
  }

  if (guide.calculation) {
    const calc = guide.calculation;
    if (calc.inputData || calc.formula || calc.result) {
      md += `## Anyagszükséglet / Számítási Példa\n\n`;
      if (calc.inputData) md += `- **Kiinduló adatok:** ${calc.inputData}\n`;
      if (calc.formula) md += `- **Képlet:** \`${calc.formula}\`\n`;
      if (calc.calculation) md += `- **Számítás:** ${calc.calculation}\n`;
      if (calc.result) md += `- **Eredmény:** **${calc.result}**\n`;
      if (calc.note) md += `- **Megjegyzés:** ${calc.note}\n`;
      md += `\n`;
    }
  }

  if (guide.summary?.trim()) {
    md += `## Összefoglalás\n\n${guide.summary.trim()}\n\n`;
  }

  if (guide.relatedTerms.length > 0) {
    md += `**Kapcsolódó szakmai fogalmak:** ${guide.relatedTerms.join(', ')}\n\n`;
  }

  if (guide.relatedGuides.length > 0) {
    md += `**Kapcsolódó útmutatók:** ${guide.relatedGuides.join(', ')}\n\n`;
  }

  const payload = JSON.stringify(guide);
  md += `\n\n[EPITOTUDAS_GUIDE_DATA:${payload}]`;

  return md;
}

function parseGuideFromContent(content: string): GuideData {
  if (!content) return createEmptyGuideData();

  const match = content.match(/\[EPITOTUDAS_GUIDE_DATA:(.*)\]$/s);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return { ...createEmptyGuideData(), ...parsed };
    } catch (e) {
      console.error('EPITOTUDAS_GUIDE_DATA parse error:', e);
    }
  }

  const cleanedText = content.replace(/\[EPITOTUDAS_GUIDE_DATA:.*\]$/s, '').trim();
  const guide = createEmptyGuideData();
  guide.introduction = cleanedText;
  return guide;
}

// Starter Templates for Quick Construction Guide Creation
const STARTER_TEMPLATES: { name: string; icon: string; apply: () => GuideData } = {
  drywall: {
    name: 'Gipszkarton válaszfal építése',
    icon: '🏗️',
    apply: () => ({
      ...createEmptyGuideData(),
      introduction: 'Ez az útmutató bemutatja a gipszkarton válaszfal szakszerű építésének teljes folyamatát, a vázszerkezet kitűzésétől a hőszigetelés elhelyezésén át a hézagolásig.',
      warnings: [
        { id: 'w1', type: 'specialist', text: 'Elektromos hálózat és vízvezetékek bekötését csak szakképzett szerelő végezheti!' },
        { id: 'w2', type: 'technical', text: 'Mindig ellenőrizd a gyártói válaszfal-rendszer előírásait a profiltávolságok tekintetében.' }
      ],
      workflow: [
        { id: 'wf1', title: 'Tervezés és kitűzés' },
        { id: 'wf2', title: 'UW profilok rögzítése alsó szigetelőszalaggal' },
        { id: 'wf3', title: 'CW profilok beállítása és tengelytávolság ellenőrzése' },
        { id: 'wf4', title: 'Első oldali burkolás gipszkarton lapokkal' },
        { id: 'wf5', title: 'Hő- és hangszigetelés elhelyezése' },
        { id: 'wf6', title: 'Második oldali burkolás eltolt hézagokkal' },
        { id: 'wf7', title: 'Hézagolás, glettelés és csiszolás' }
      ],
      materials: [
        { id: 'm1', name: 'UW 75 profil', sizeType: '75 mm / 4 m', unit: 'fm', note: 'Vízszintes vezetőprofil padlóra és mennyezetre' },
        { id: 'm2', name: 'CW 75 profil', sizeType: '75 mm / 2.75 m', unit: 'fm', note: 'Függőleges tartóprofil' },
        { id: 'm3', name: 'Gipszkarton lap', sizeType: '12.5 mm RB', unit: 'db', note: 'Normál szárazgipsz lap' },
        { id: 'm4', name: 'Akusztikai szigetelőszalag', sizeType: '75 mm', unit: 'tekercs', note: 'Rezgéscsillapító szalag profil alá' },
        { id: 'm5', name: 'Gipszkarton csavar (TN 25)', sizeType: '3.5x25 mm', unit: 'doboz', note: 'Lapok rögzítéséhez' }
      ],
      tools: [
        { id: 't1', name: 'Lézerező / Vízmérték', category: 'Mérő- és jelölőeszközök', note: 'Pontos függőleges és vízszintes beállításhoz' },
        { id: 't2', name: 'Lemezvágó olló', category: 'Alapvető szerszámok', note: 'Profilok méretre vágásához' },
        { id: 't3', name: 'Akkus csavarbehajtó mélységhatárolóval', category: 'Gépek', note: 'Megakadályozza a karton átszakadását' }
      ],
      safety: [
        { id: 's1', hazardType: 'Por', hazardName: 'Gipsz- és szigetelőanyag por', explanation: 'Glettelésnél és ásványgyapot vágásánál por képződik.', prevention: 'FFP2 pormaszk és védőszemüveg viselése kötelező.' }
      ],
      steps: [
        {
          id: 'st1',
          title: 'UW keretprofilok kitűzése és rögzítése',
          whatWeDo: 'A padlóra és a mennyezetre felrajzoljuk a fal tengelyét, ráragasztjuk a szigetelőszalagot az UW profilra, majd beütődübellel rögzítjük.',
          howWeDo: '1. Lézerrel jelöld ki a fal nyomvonalát.\n2. Ragassz szigetelőszalagot az UW 75 profil talpára.\n3. Fúrj beütő dübel helyeket max. 80 cm-enként.\n4. Rögzítsd a profilokat szilárdan.',
          whatToWatch: 'Ellenőrizd a felület tisztaságát a szalag ragasztása előtt!',
          commonMistake: 'Szigetelőszalag elhagyása, ami testhanggátlási hibát okoz.',
          verification: 'Próbáld meg elmozdítani a profilt – szilárdan kell állnia.',
          neededMaterials: 'UW 75 profil, szigetelőszalag, beütődübel',
          neededTools: 'Fúrókalapács, lézer, kalapács',
          imageUrl: '',
          imageCaption: 'UW profil rögzítése alsó akusztikai szalaggal',
          imageAlt: 'Gipszkarton UW profil szerelés',
          imagePurpose: 'A padlóprofil helyes rögzítésének bemutatása',
          imagePrompt: 'Műszaki illusztráció: Gipszkarton UW 75 profil rögzítése betonpadlóra beütődübellel, alatta öntapadó akusztikai szigetelőszalag látható, szakmailag pontos részletekkel.'
        }
      ],
      galleryImages: [],
      techData: [
        { id: 'td1', element: 'CW profil tengelytávolság', value: '600', unit: 'mm', valueType: 'Rendszerfüggő', note: 'A gipszkarton szélességének fele' },
        { id: 'td2', element: 'Csavartávolság burkolásnál', value: '250', unit: 'mm', valueType: 'Előírt', note: 'Első réteg lapoknál' },
        { id: 'td3', element: 'Dübeltávolság UW profilnál', value: 'max. 800', unit: 'mm', valueType: 'Előírt', note: 'Profilvégektől max. 200 mm' }
      ],
      mistakes: [
        { id: 'mi1', mistake: 'A csavarfej túl mélyre kerül és átszakítja a kartont', whyProblem: 'A csavar nem tart, a lap kilazulhat.', prevention: 'Használj mélységhatárolós csavarbehajtó bitfejet.', fix: 'Helyezz el egy új csavart tőle 2-3 cm-re, a hibás lyukat pedig gletteld be.' }
      ],
      highlights: [
        { id: 'h1', type: 'Szakmai tipp', title: 'Toldási szabály', content: 'A gipszkarton lapok függőleges toldásai nem eshetnek egy vonalba az ajtónyílások sarkaival (L-alakú kivágás szükséges).' }
      ],
      checklist: [
        { id: 'c1', text: 'A kitűzés pontos és függőleges' },
        { id: 'c2', text: 'Az UW profilok alatt jelen van az akusztikai szalag' },
        { id: 'c3', text: 'A CW profilok kiosztása 600 mm' },
        { id: 'c4', text: 'A csavarfejek nincsenek átszakadva' }
      ],
      relatedTerms: ['UW profil', 'CW profil', 'HRAK élképzés', 'Akusztikai szigetelés', 'Q2'],
      calculation: {
        inputData: 'Fal hossza: 4 m, Magasság: 2.5 m (Felület: 10 m²)',
        formula: 'Gipszkarton szorzó: 2 x 10 m² = 20 m²',
        calculation: '20 m² lap + 10% hulladék = 22 m²',
        result: '22 m² gipszkarton, 8 fm UW profil, 9 db CW profil',
        note: 'Kétoldali egyrétegű burkolásra méretezve.'
      },
      summary: 'A gipszkarton válaszfal gyors, száraz és kiváló hangszigetelő megoldás. A siker kulcsa a pontos kitűzés, a beütő dűbelek helyes kiosztása és a csavartávolságok betartása.',
      relatedGuides: ['gipszkarton-mennyezet-szerelese', 'belteri-festes-alapjai'],
      seo: {
        seoTitle: 'Gipszkarton válaszfal építése lépésről lépésre kezdőknek',
        metaDescription: 'Részletes építőipari szakmai útmutató gipszkarton válaszfal építéséhez: profilok rögzítése, szigetelés, burkolás és hézagolás.',
        primaryKeyword: 'gipszkarton válaszfal',
        relatedKeywords: 'UW profil, CW profil, szigetelés, glettelés'
      }
    })
  }
};

function EditArticleModal({ article, categories, onClose, onSaved }: EditArticleModalProps) {
  const isCreate = article === null;
  const [form, setForm] = useState<FormState>(() => (article ? formFromArticle(article) : { ...EMPTY_FORM }));
  const [guide, setGuide] = useState<GuideData>(() => (article ? parseGuideFromContent(article.content || '') : createEmptyGuideData()));
  
  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [glossaryTermsList, setGlossaryTermsList] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  // Accordion Sections State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    tileData: true,
    intro: true,
    warnings: false,
    workflow: false,
    materials: false,
    tools: false,
    safety: false,
    steps: true, // PRIMARY
    images: false,
    techData: false,
    mistakes: false,
    highlights: false,
    checklist: false,
    calculation: false,
    summary: false,
    seo: false,
  });

  useEffect(() => {
    if (article) {
      setForm(formFromArticle(article));
      setGuide(parseGuideFromContent(article.content || ''));
      setSlugTouched(true);
    } else {
      setForm({ ...EMPTY_FORM });
      setGuide(createEmptyGuideData());
      setSlugTouched(false);
    }
    setError(null);
    setDirty(false);
  }, [article]);

  useEffect(() => {
    listGlossaryTerms()
      .then((terms) => setGlossaryTermsList(terms.map((t) => t.term)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  function toggleSection(sec: string) {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function updateGuide(updater: (prev: GuideData) => GuideData) {
    setGuide((prev) => {
      const next = updater(prev);
      setDirty(true);
      return next;
    });
  }

  function handleTitleChange(value: string) {
    updateForm('title', value);
    if (!slugTouched) updateForm('slug', slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    updateForm('slug', slugify(value));
  }

  function handleAutoReadTime() {
    const serialized = serializeGuideToContent(guide);
    const autoTime = calculateReadTime(serialized);
    updateForm('read_time', autoTime);
  }

  function applyTemplate(key: string) {
    if (STARTER_TEMPLATES[key as keyof typeof STARTER_TEMPLATES]) {
      if (window.confirm('Biztosan beöltöd a sablont? A jelenlegi kitöltött útmutató mezők felülíródnak.')) {
        const templated = STARTER_TEMPLATES[key as keyof typeof STARTER_TEMPLATES].apply();
        setGuide(templated);
        if (!form.title) updateForm('title', STARTER_TEMPLATES[key as keyof typeof STARTER_TEMPLATES].name);
        setDirty(true);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('A cím megadása kötelező.');
      return;
    }
    if (!form.slug.trim()) {
      setError('A slug megadása kötelező.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const serializedContent = serializeGuideToContent(guide);
      const calculatedReadTime = form.read_time || calculateReadTime(serializedContent);

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || null,
        content: serializedContent,
        category_id: form.category_id || null,
        status: form.status,
        author: form.author.trim() || null,
        read_time: calculatedReadTime,
        featured_image: form.featured_image.trim() || null,
      };

      let savedData: Article;
      if (article) {
        savedData = await updateArticle(article.id, payload);
      } else {
        savedData = await createArticle(payload);
      }
      setDirty(false);
      onSaved(savedData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Mentés sikertelen.';
      if (/duplicate|unique|23505/i.test(msg)) {
        setError('Ez a slug már foglalt. Válasszon másikat.');
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
  const sectionHeaderClass =
    'w-full flex items-center justify-between px-4 py-3 bg-[#161616] hover:bg-[#1C1C1C] border border-[#252525] rounded-xl text-left transition-colors cursor-pointer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md" onClick={() => !saving && onClose()}>
      <div
        className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#141414] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFC400]/10 border border-[#FFC400]/20 rounded-lg text-[#FFC400]">
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>{isCreate ? 'Új Építőipari Szakmai Útmutató' : 'Szakmai Útmutató Szerkesztése'}</span>
              </h2>
              <p className="text-xs text-gray-400">Strukturált, lépésről lépésre felépített kivitelezési útmutató editor</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            <span className="text-xs font-medium flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full text-gray-400">
              {saving ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-400 font-bold">Mentés folyamatban...</span>
                </>
              ) : dirty ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-400">Módosítások vannak</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400">Mentve</span>
                </>
              )}
            </span>

            {/* Editor vs Preview Toggle */}
            <div className="flex bg-[#0A0A0A] p-1 border border-[#222] rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'editor' ? 'bg-[#FFC400] text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileText size={14} /> Szerkesztő
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'preview' ? 'bg-[#FFC400] text-black shadow-sm' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Eye size={14} /> Előnézet
              </button>
            </div>

            <button onClick={onClose} disabled={saving} className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg border border-[#222] hover:bg-[#1E1E1E]">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {activeTab === 'preview' ? (
            /* PREVIEW VIEW */
            <div className="bg-[#0A0A0A] border border-[#222] rounded-2xl p-6 space-y-6 text-gray-200">
              <div className="border-b border-[#222] pb-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#FFC400] tracking-wider">
                  Cikkmegjelenítés Élő Előnézete
                </span>
                <span className="text-xs text-gray-500">Formázott nézet mint a nyilvános Tudástárban</span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{form.title || 'Útmutató címe'}</h1>
                <p className="text-sm text-gray-400 mt-2">{form.excerpt || 'Kivonat nem lett megadva.'}</p>
              </div>

              {form.featured_image && (
                <div className="rounded-xl overflow-hidden h-64 border border-[#222]">
                  <img src={form.featured_image} alt={form.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-6 text-sm leading-relaxed font-sans whitespace-pre-line border-t border-[#222] pt-6">
                {serializeGuideToContent(guide).replace(/\[EPITOTUDAS_GUIDE_DATA:.*\]$/s, '')}
              </div>
            </div>
          ) : (
            /* EDITOR FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* STARTER TEMPLATE PICKER */}
              <div className="p-4 bg-[#141414] border border-[#222] rounded-xl flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#FFC400]" />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Építőipari Útmutató Sablonok:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(STARTER_TEMPLATES).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyTemplate(key)}
                      className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-lg text-xs font-medium text-gray-200 flex items-center gap-1.5 transition-colors"
                    >
                      <span>{t.icon}</span> <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION: CSEMPEADATOK & LISTAOLDAL */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection('tileData')}
                  className={sectionHeaderClass}
                >
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <BookMarked size={16} /> 1. Cikkadatok &amp; Listaoldali Megjelenés
                  </span>
                  {openSections.tileData ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {openSections.tileData && (
                  <div className="p-5 space-y-4 border-t border-[#222]">
                    <div>
                      <label className={labelClass}>Cikk Címe <span className="text-red-400">*</span></label>
                      <input
                        className={fieldClass}
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Pl. Gipszkarton válaszfal építése lépésről lépésre"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>URL-Azonosító (Slug) <span className="text-red-400">*</span></label>
                      <input className={fieldClass} value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="url-barat-azonosito" />
                      <p className="text-[11px] text-gray-500 mt-1">Automatikusan generálódik a címből.</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={labelClass}>Rövid Kivonat (Csempe leírás)</label>
                        <span className={`text-[11px] font-mono ${form.excerpt.length > 180 ? 'text-amber-400' : 'text-gray-500'}`}>
                          Ajánlott: 150–180 kar. (Jelenleg: {form.excerpt.length})
                        </span>
                      </div>
                      <textarea
                        className={`${fieldClass} resize-none`}
                        rows={3}
                        value={form.excerpt}
                        onChange={(e) => updateForm('excerpt', e.target.value)}
                        placeholder="Kompakt, szakmailag pontos összefoglaló a csempekártyára..."
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Borítókép URL</label>
                      <input className={fieldClass} value={form.featured_image} onChange={(e) => updateForm('featured_image', e.target.value)} placeholder="https://..." />
                      {form.featured_image && (
                        <div className="mt-3 relative group h-36 w-full overflow-hidden rounded-xl border border-[#222]">
                          <img src={form.featured_image} alt="Borítókép előnézet" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateForm('featured_image', '')}
                            className="absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-lg opacity-90 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Kategória</label>
                        <select className={fieldClass} value={form.category_id} onChange={(e) => updateForm('category_id', e.target.value)}>
                          <option value="">— Nincs —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>Publikálási Státusz</label>
                        <select className={fieldClass} value={form.status} onChange={(e) => updateForm('status', e.target.value as Article['status'])}>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className={labelClass}>Olvasási Idő (perc)</label>
                          <button
                            type="button"
                            onClick={handleAutoReadTime}
                            className="text-[11px] text-[#FFC400] font-bold hover:underline flex items-center gap-1"
                          >
                            <Calculator size={11} /> Automatikus Számítás
                          </button>
                        </div>
                        <input type="number" min={1} className={fieldClass} value={form.read_time} onChange={(e) => updateForm('read_time', Number(e.target.value))} />
                      </div>

                      <div>
                        <label className={labelClass}>Szerző / Forrás</label>
                        <input className={fieldClass} value={form.author} onChange={(e) => updateForm('author', e.target.value)} placeholder="ÉpítőTudás Szerkesztőség" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 1: BEVEZETÉS */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('intro')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <FileText size={16} /> 2. Bevezetés
                  </span>
                  {openSections.intro ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.intro && (
                  <div className="p-5 space-y-2 border-t border-[#222]">
                    <p className="text-xs text-gray-400 italic">
                      Röviden mutasd be, mit tanul meg az olvasó, mire használható a megoldás, milyen előnyei vannak, és milyen előzetes tudás szükséges.
                    </p>
                    <textarea
                      className={`${fieldClass} resize-y min-h-[100px]`}
                      rows={4}
                      value={guide.introduction}
                      onChange={(e) => updateGuide((g) => ({ ...g, introduction: e.target.value }))}
                      placeholder="Írd le a cikk bevezetőjét..."
                    />
                  </div>
                )}
              </div>

              {/* SECTION 2: FONTOS FIGYELMEZTETÉSEK */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('warnings')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <AlertTriangle size={16} /> 3. Fontos Figyelmeztetések ({guide.warnings.length} db)
                  </span>
                  {openSections.warnings ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.warnings && (
                  <div className="p-5 space-y-4 border-t border-[#222]">
                    {guide.warnings.map((w, idx) => (
                      <div key={w.id} className="p-3 bg-[#0A0A0A] border border-[#222] rounded-xl flex items-center gap-3">
                        <select
                          className={`${fieldClass} w-48 shrink-0`}
                          value={w.type}
                          onChange={(e) => {
                            const val = e.target.value as GuideWarning['type'];
                            updateGuide((g) => {
                              const list = [...g.warnings];
                              list[idx].type = val;
                              return { ...g, warnings: list };
                            });
                          }}
                        >
                          <option value="warning">⚠️ Figyelem</option>
                          <option value="safety">🛑 Biztonság</option>
                          <option value="specialist">⚡ Szakember szükséges</option>
                          <option value="technical">📌 Fontos műszaki feltétel</option>
                        </select>
                        <input
                          className={fieldClass}
                          value={w.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.warnings];
                              list[idx].text = val;
                              return { ...g, warnings: list };
                            });
                          }}
                          placeholder="Pl. Elektromos hálózat bekötését csak szakképzett villanyszerelő végezheti."
                        />
                        <button
                          type="button"
                          onClick={() => updateGuide((g) => ({ ...g, warnings: g.warnings.filter((_, i) => i !== idx) }))}
                          className="p-2 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          warnings: [...g.warnings, { id: Date.now().toString(), type: 'warning', text: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Figyelmeztetés Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 3: A MUNKAFOLYAMAT ÁTTEKINTÉSE */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('workflow')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <ListOrdered size={16} /> 4. A Munkafolyamat Áttekintése ({guide.workflow.length} lépés)
                  </span>
                  {openSections.workflow ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.workflow && (
                  <div className="p-5 space-y-3 border-t border-[#222]">
                    {guide.workflow.map((wf, idx) => (
                      <div key={wf.id} className="flex items-center gap-3 p-2 bg-[#0A0A0A] border border-[#222] rounded-xl">
                        <span className="w-6 h-6 rounded-full bg-[#FFC400]/10 text-[#FFC400] font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          className={fieldClass}
                          value={wf.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.workflow];
                              list[idx].title = val;
                              return { ...g, workflow: list };
                            });
                          }}
                          placeholder="Lépés elnevezése (pl. UW profilok rögzítése)"
                        />
                        <button
                          type="button"
                          onClick={() => updateGuide((g) => ({ ...g, workflow: g.workflow.filter((_, i) => i !== idx) }))}
                          className="p-2 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          workflow: [...g.workflow, { id: Date.now().toString(), title: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Áttekintő Lépés Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 4: SZÜKSÉGES ANYAGOK */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('materials')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <Layers size={16} /> 5. Szükséges Anyagok ({guide.materials.length} tétel)
                  </span>
                  {openSections.materials ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.materials && (
                  <div className="p-5 space-y-3 border-t border-[#222]">
                    {guide.materials.map((m, idx) => (
                      <div key={m.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 bg-[#0A0A0A] border border-[#222] rounded-xl relative">
                        <input
                          className={fieldClass}
                          placeholder="Anyag neve (pl. UW 75 profil)"
                          value={m.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.materials];
                              list[idx].name = val;
                              return { ...g, materials: list };
                            });
                          }}
                        />
                        <input
                          className={fieldClass}
                          placeholder="Méret / típus (pl. 4 m)"
                          value={m.sizeType}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.materials];
                              list[idx].sizeType = val;
                              return { ...g, materials: list };
                            });
                          }}
                        />
                        <input
                          className={fieldClass}
                          placeholder="Egység (pl. fm, db)"
                          value={m.unit}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.materials];
                              list[idx].unit = val;
                              return { ...g, materials: list };
                            });
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            className={fieldClass}
                            placeholder="Megjegyzés"
                            value={m.note}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.materials];
                                list[idx].note = val;
                                return { ...g, materials: list };
                              });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateGuide((g) => ({ ...g, materials: g.materials.filter((_, i) => i !== idx) }))}
                            className="p-2 text-gray-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          materials: [...g.materials, { id: Date.now().toString(), name: '', sizeType: '', unit: '', note: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Anyag Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 5: SZÜKSÉGES SZERSZÁMOK */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('tools')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <Wrench size={16} /> 6. Szükséges Szerszámok ({guide.tools.length} tétel)
                  </span>
                  {openSections.tools ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.tools && (
                  <div className="p-5 space-y-3 border-t border-[#222]">
                    {guide.tools.map((t, idx) => (
                      <div key={t.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-[#0A0A0A] border border-[#222] rounded-xl">
                        <select
                          className={fieldClass}
                          value={t.category}
                          onChange={(e) => {
                            const val = e.target.value as GuideTool['category'];
                            updateGuide((g) => {
                              const list = [...g.tools];
                              list[idx].category = val;
                              return { ...g, tools: list };
                            });
                          }}
                        >
                          <option value="Alapvető szerszámok">Alapvető szerszámok</option>
                          <option value="Mérő- és jelölőeszközök">Mérő- és jelölőeszközök</option>
                          <option value="Gépek">Gépek</option>
                          <option value="Kiegészítők">Kiegészítők</option>
                          <option value="Munkavédelmi eszközök">Munkavédelmi eszközök</option>
                        </select>
                        <input
                          className={fieldClass}
                          placeholder="Szerszám neve (pl. Lemezvágó olló)"
                          value={t.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.tools];
                              list[idx].name = val;
                              return { ...g, tools: list };
                            });
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            className={fieldClass}
                            placeholder="Megjegyzés"
                            value={t.note}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.tools];
                                list[idx].note = val;
                                return { ...g, tools: list };
                              });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateGuide((g) => ({ ...g, tools: g.tools.filter((_, i) => i !== idx) }))}
                            className="p-2 text-gray-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          tools: [...g.tools, { id: Date.now().toString(), name: '', category: 'Alapvető szerszámok', note: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Szerszám Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 6: MUNKAVÉDELEM */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('safety')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <ShieldAlert size={16} /> 7. Munkavédelem &amp; Biztonság ({guide.safety.length} tétel)
                  </span>
                  {openSections.safety ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.safety && (
                  <div className="p-5 space-y-3 border-t border-[#222]">
                    {guide.safety.map((s, idx) => (
                      <div key={s.id} className="p-4 bg-[#0A0A0A] border border-[#222] rounded-xl space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            className={fieldClass}
                            value={s.hazardType}
                            onChange={(e) => {
                              const val = e.target.value as GuideSafetyItem['hazardType'];
                              updateGuide((g) => {
                                const list = [...g.safety];
                                list[idx].hazardType = val;
                                return { ...g, safety: list };
                              });
                            }}
                          >
                            <option value="Vágásveszély">Vágásveszély</option>
                            <option value="Por">Por</option>
                            <option value="Zaj">Zaj</option>
                            <option value="Elektromos veszély">Elektromos veszély</option>
                            <option value="Magassági munkavégzés">Magassági munkavégzés</option>
                            <option value="Anyagmozgatás">Anyagmozgatás</option>
                            <option value="Vegyi anyag">Vegyi anyag</option>
                            <option value="Egyéb">Egyéb</option>
                          </select>
                          <input
                            className={fieldClass}
                            placeholder="Veszély megnevezése"
                            value={s.hazardName}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.safety];
                                list[idx].hazardName = val;
                                return { ...g, safety: list };
                              });
                            }}
                          />
                        </div>
                        <textarea
                          className={`${fieldClass} resize-none`}
                          rows={2}
                          placeholder="Magyarázat"
                          value={s.explanation}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.safety];
                              list[idx].explanation = val;
                              return { ...g, safety: list };
                            });
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            className={fieldClass}
                            placeholder="Megelőzés (pl. FFP2 maszk használata)"
                            value={s.prevention}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.safety];
                                list[idx].prevention = val;
                                return { ...g, safety: list };
                              });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateGuide((g) => ({ ...g, safety: g.safety.filter((_, i) => i !== idx) }))}
                            className="p-2 text-gray-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          safety: [...g.safety, { id: Date.now().toString(), hazardType: 'Por', hazardName: '', explanation: '', prevention: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Munkavédelmi Figyelmeztetés
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 7: LÉPÉSENKÉNTI KIVITELEZÉS (PRIMARY SECTION) */}
              <div className="bg-[#141414] border-2 border-[#FFC400]/40 rounded-2xl overflow-hidden shadow-lg">
                <button type="button" onClick={() => toggleSection('steps')} className={`${sectionHeaderClass} bg-[#1E1A0A] hover:bg-[#28220A]`}>
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-[#FFC400] text-black rounded-lg text-xs font-black">LEGFONTOSABB</span>
                    <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                      <ListOrdered size={18} /> 8. Lépésenkénti Kivitelezés ({guide.steps.length} kivitelezési lépés)
                    </span>
                  </div>
                  {openSections.steps ? <ChevronUp size={16} className="text-[#FFC400]" /> : <ChevronDown size={16} className="text-[#FFC400]" />}
                </button>

                {openSections.steps && (
                  <div className="p-6 space-y-6 border-t border-[#FFC400]/20 bg-[#0E0E0E]">
                    {guide.steps.map((st, idx) => (
                      <div key={st.id} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 space-y-4 relative shadow-md">
                        <div className="flex items-center justify-between border-b border-[#222] pb-3">
                          <span className="text-xs font-extrabold uppercase text-[#FFC400] flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#FFC400] text-black font-black text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            Lépés címe
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                updateGuide((g) => {
                                  const list = [...g.steps];
                                  const temp = list[idx - 1];
                                  list[idx - 1] = list[idx];
                                  list[idx] = temp;
                                  return { ...g, steps: list };
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === guide.steps.length - 1}
                              onClick={() => {
                                updateGuide((g) => {
                                  const list = [...g.steps];
                                  const temp = list[idx + 1];
                                  list[idx + 1] = list[idx];
                                  list[idx] = temp;
                                  return { ...g, steps: list };
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                            >
                              <ChevronDown size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateGuide((g) => ({ ...g, steps: g.steps.filter((_, i) => i !== idx) }))}
                              className="p-1 text-red-400 hover:text-red-300 ml-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={labelClass}>Lépés Címe</label>
                          <input
                            className={fieldClass}
                            placeholder="Pl. Profilok kitűzése és rögzítése"
                            value={st.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.steps];
                                list[idx].title = val;
                                return { ...g, steps: list };
                              });
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>MIT CSINÁLUNK?</label>
                            <textarea
                              className={`${fieldClass} resize-y min-h-[70px]`}
                              rows={2}
                              placeholder="Rövid leírás, a lépés célja..."
                              value={st.whatWeDo}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.steps];
                                  list[idx].whatWeDo = val;
                                  return { ...g, steps: list };
                                });
                              }}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>HOGYAN CSINÁLJUK?</label>
                            <textarea
                              className={`${fieldClass} resize-y min-h-[70px]`}
                              rows={3}
                              placeholder="Konkrét végrehajtási pontok, sorrend..."
                              value={st.howWeDo}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.steps];
                                  list[idx].howWeDo = val;
                                  return { ...g, steps: list };
                                });
                              }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className={labelClass}>MIRE FIGYELJ?</label>
                            <textarea
                              className={`${fieldClass} resize-y min-h-[60px]`}
                              rows={2}
                              placeholder="Szakmai szempontok..."
                              value={st.whatToWatch}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.steps];
                                  list[idx].whatToWatch = val;
                                  return { ...g, steps: list };
                                });
                              }}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>GYAKORI HIBA</label>
                            <textarea
                              className={`${fieldClass} resize-y min-h-[60px]`}
                              rows={2}
                              placeholder="Tipikus kezdő hiba ennél a lépésnél..."
                              value={st.commonMistake}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.steps];
                                  list[idx].commonMistake = val;
                                  return { ...g, steps: list };
                                });
                              }}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>ELLENŐRZÉS</label>
                            <textarea
                              className={`${fieldClass} resize-y min-h-[60px]`}
                              rows={2}
                              placeholder="Hogyan ellenőrizhető a végeredmény..."
                              value={st.verification}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.steps];
                                  list[idx].verification = val;
                                  return { ...g, steps: list };
                                });
                              }}
                            />
                          </div>
                        </div>

                        {/* KÉPI SZEMLÉLTETÉS & PROMPT THIS STEP */}
                        <div className="p-4 bg-[#0A0A0A] border border-[#222] rounded-xl space-y-3">
                          <span className="text-xs font-extrabold uppercase text-[#FFC400] flex items-center gap-1.5">
                            <ImageIcon size={14} /> Képi szemléltetés ehhez a lépéshez (Opcionális)
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelClass}>Kép URL / Forrás</label>
                              <input
                                className={fieldClass}
                                placeholder="https://..."
                                value={st.imageUrl || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateGuide((g) => {
                                    const list = [...g.steps];
                                    list[idx].imageUrl = val;
                                    return { ...g, steps: list };
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Képaláírás</label>
                              <input
                                className={fieldClass}
                                placeholder="Pl. Az akusztikai szigetelőszalag felragasztása az UW profilra."
                                value={st.imageCaption || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateGuide((g) => {
                                    const list = [...g.steps];
                                    list[idx].imageCaption = val;
                                    return { ...g, steps: list };
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelClass}>ALT Szöveg</label>
                              <input
                                className={fieldClass}
                                placeholder="Gipszkarton UW profil alsó szigeteléssel"
                                value={st.imageAlt || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateGuide((g) => {
                                    const list = [...g.steps];
                                    list[idx].imageAlt = val;
                                    return { ...g, steps: list };
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Kép Célja / Helye</label>
                              <input
                                className={fieldClass}
                                placeholder="Profil talp rögzítés illusztrálása"
                                value={st.imagePurpose || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateGuide((g) => {
                                    const list = [...g.steps];
                                    list[idx].imagePurpose = val;
                                    return { ...g, steps: list };
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={labelClass}>Képgenerálási AI Prompt (Műszaki Illusztrációhoz)</label>
                            <textarea
                              className={`${fieldClass} resize-y min-h-[60px] text-xs font-mono`}
                              rows={2}
                              value={st.imagePrompt || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.steps];
                                  list[idx].imagePrompt = val;
                                  return { ...g, steps: list };
                                });
                              }}
                              placeholder="Írd le pontosan, mit kell a képen megjeleníteni..."
                            />
                            <p className="text-[11px] text-[#FFC400]/80 mt-1 italic">
                              Segítség: Írd le pontosan, mit kell a képen megjeleníteni. A kép legyen szakmailag pontos, az építési sorrendet és a szerkezeti részleteket helyesen mutassa.
                            </p>
                          </div>

                          {st.imageUrl && (
                            <div className="mt-2 h-28 w-[#200px] overflow-hidden rounded-lg border border-[#222]">
                              <img src={st.imageUrl} alt={st.imageAlt || 'Előnézet'} className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          steps: [
                            ...g.steps,
                            {
                              id: Date.now().toString(),
                              title: '',
                              whatWeDo: '',
                              howWeDo: '',
                              whatToWatch: '',
                              commonMistake: '',
                              verification: '',
                              imageUrl: '',
                              imagePrompt: '',
                            }
                          ]
                        }))
                      }
                      className="w-full py-3 bg-[#FFC400] hover:bg-[#E6B000] text-black text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
                    >
                      <Plus size={16} /> Új Kivitelezési Lépés Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 9: MÉRETEK ÉS MŰSZAKI ADATOK */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('techData')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <Table size={16} /> 9. Méretek és Műszaki Adatok ({guide.techData.length} adat)
                  </span>
                  {openSections.techData ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.techData && (
                  <div className="p-5 space-y-4 border-t border-[#222]">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-amber-400 font-bold flex items-center gap-2">
                        <AlertCircle size={16} /> Ellenőrizd a gyártói / rendszerelőírást!
                      </span>
                      <span className="text-[11px] text-gray-400">Rendszerfüggő és előírt értékek jelölhetők</span>
                    </div>

                    {guide.techData.map((td, idx) => (
                      <div key={td.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 bg-[#0A0A0A] border border-[#222] rounded-xl">
                        <input
                          className={fieldClass}
                          placeholder="Elem / művelet"
                          value={td.element}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.techData];
                              list[idx].element = val;
                              return { ...g, techData: list };
                            });
                          }}
                        />
                        <input
                          className={fieldClass}
                          placeholder="Érték"
                          value={td.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.techData];
                              list[idx].value = val;
                              return { ...g, techData: list };
                            });
                          }}
                        />
                        <input
                          className={fieldClass}
                          placeholder="Mértékegység (mm, cm)"
                          value={td.unit}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.techData];
                              list[idx].unit = val;
                              return { ...g, techData: list };
                            });
                          }}
                        />
                        <select
                          className={fieldClass}
                          value={td.valueType}
                          onChange={(e) => {
                            const val = e.target.value as GuideTechDataItem['valueType'];
                            updateGuide((g) => {
                              const list = [...g.techData];
                              list[idx].valueType = val;
                              return { ...g, techData: list };
                            });
                          }}
                        >
                          <option value="Előírt">Előírt</option>
                          <option value="Tipikus">Tipikus</option>
                          <option value="Rendszerfüggő">Rendszerfüggő</option>
                          <option value="Gyártói előírás szerint">Gyártói előírás szerint</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            className={fieldClass}
                            placeholder="Megjegyzés"
                            value={td.note}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.techData];
                                list[idx].note = val;
                                return { ...g, techData: list };
                              });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateGuide((g) => ({ ...g, techData: g.techData.filter((_, i) => i !== idx) }))}
                            className="p-2 text-gray-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          techData: [...g.techData, { id: Date.now().toString(), element: '', value: '', unit: '', valueType: 'Rendszerfüggő', note: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Műszaki Adat Sor Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 10: GYAKORI HIBÁK */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('mistakes')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <AlertCircle size={16} /> 10. Gyakori Hibák ({guide.mistakes.length} hiba)
                  </span>
                  {openSections.mistakes ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.mistakes && (
                  <div className="p-5 space-y-4 border-t border-[#222]">
                    {guide.mistakes.map((m, idx) => (
                      <div key={m.id} className="p-4 bg-[#0A0A0A] border border-[#222] rounded-xl space-y-3">
                        <div>
                          <label className={labelClass}>Mi a hiba?</label>
                          <input
                            className={fieldClass}
                            placeholder="Pl. A gipszkarton csavarfej túl mélyre kerül."
                            value={m.mistake}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.mistakes];
                                list[idx].mistake = val;
                                return { ...g, mistakes: list };
                              });
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className={labelClass}>Miért probléma?</label>
                            <textarea
                              className={`${fieldClass} resize-none`}
                              rows={2}
                              placeholder="Átszakítja a kartonréteget..."
                              value={m.whyProblem}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.mistakes];
                                  list[idx].whyProblem = val;
                                  return { ...g, mistakes: list };
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Hogyan előzhető meg?</label>
                            <textarea
                              className={`${fieldClass} resize-none`}
                              rows={2}
                              placeholder="Mélységhatárolós bit használata..."
                              value={m.prevention}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.mistakes];
                                  list[idx].prevention = val;
                                  return { ...g, mistakes: list };
                                });
                              }}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Hogyan javítható?</label>
                            <textarea
                              className={`${fieldClass} resize-none`}
                              rows={2}
                              placeholder="Új csavar elhelyezése..."
                              value={m.fix}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateGuide((g) => {
                                  const list = [...g.mistakes];
                                  list[idx].fix = val;
                                  return { ...g, mistakes: list };
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => updateGuide((g) => ({ ...g, mistakes: g.mistakes.filter((_, i) => i !== idx) }))}
                            className="text-xs text-red-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <Trash2 size={14} /> Hiba Törlése
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          mistakes: [...g.mistakes, { id: Date.now().toString(), mistake: '', whyProblem: '', prevention: '', fix: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Gyakori Hiba Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 11: SZAKMAI KIEMELÉSEK */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('highlights')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <Sparkles size={16} /> 11. Szakmai Kiemelések ({guide.highlights.length} kiemelés)
                  </span>
                  {openSections.highlights ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.highlights && (
                  <div className="p-5 space-y-3 border-t border-[#222]">
                    {guide.highlights.map((h, idx) => (
                      <div key={h.id} className="p-4 bg-[#0A0A0A] border border-[#222] rounded-xl space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            className={fieldClass}
                            value={h.type}
                            onChange={(e) => {
                              const val = e.target.value as GuideHighlightItem['type'];
                              updateGuide((g) => {
                                const list = [...g.highlights];
                                list[idx].type = val;
                                return { ...g, highlights: list };
                              });
                            }}
                          >
                            <option value="Jó tudni">💡 Jó tudni</option>
                            <option value="Figyelem">⚠️ Figyelem</option>
                            <option value="Szakmai tipp">🔧 Szakmai tipp</option>
                            <option value="Fontos">📌 Fontos</option>
                            <option value="Biztonság">🛑 Biztonság</option>
                          </select>
                          <input
                            className={fieldClass}
                            placeholder="Kiemelés címe"
                            value={h.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.highlights];
                                list[idx].title = val;
                                return { ...g, highlights: list };
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <textarea
                            className={`${fieldClass} resize-none`}
                            rows={2}
                            placeholder="Kiemelés tartalma..."
                            value={h.content}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateGuide((g) => {
                                const list = [...g.highlights];
                                list[idx].content = val;
                                return { ...g, highlights: list };
                              });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => updateGuide((g) => ({ ...g, highlights: g.highlights.filter((_, i) => i !== idx) }))}
                            className="p-2 text-gray-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          highlights: [...g.highlights, { id: Date.now().toString(), type: 'Szakmai tipp', title: '', content: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Szakmai Kiemelés Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 12: MINŐSÉGELLENŐRZŐ LISTA */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('checklist')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <CheckSquare size={16} /> 12. Minőségellenőrző Lista ({guide.checklist.length} pont)
                  </span>
                  {openSections.checklist ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.checklist && (
                  <div className="p-5 space-y-3 border-t border-[#222]">
                    {guide.checklist.map((c, idx) => (
                      <div key={c.id} className="flex items-center gap-3 p-2 bg-[#0A0A0A] border border-[#222] rounded-xl">
                        <CheckCircle2 size={18} className="text-gray-500 shrink-0" />
                        <input
                          className={fieldClass}
                          placeholder="Ellenőrző pont (pl. ☐ A kitűzés pontos)"
                          value={c.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateGuide((g) => {
                              const list = [...g.checklist];
                              list[idx].text = val;
                              return { ...g, checklist: list };
                            });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => updateGuide((g) => ({ ...g, checklist: g.checklist.filter((_, i) => i !== idx) }))}
                          className="p-2 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateGuide((g) => ({
                          ...g,
                          checklist: [...g.checklist, { id: Date.now().toString(), text: '' }]
                        }))
                      }
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-xl flex items-center gap-1.5 border border-[#333]"
                    >
                      <Plus size={14} /> Új Ellenőrző Pont Hozzáadása
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 13: ANYAGSZÜKSÉGLET / SZÁMÍTÁSI PÉLDA */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('calculation')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <Calculator size={16} /> 13. Anyagszükséglet / Számítási Példa (Opcionális)
                  </span>
                  {openSections.calculation ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.calculation && (
                  <div className="p-5 space-y-3 border-t border-[#222]">
                    <div>
                      <label className={labelClass}>Kiinduló Adatok</label>
                      <input
                        className={fieldClass}
                        placeholder="Pl. Fal hossza: 4 m, Magasság: 2,5 m"
                        value={guide.calculation?.inputData || ''}
                        onChange={(e) => updateGuide((g) => ({ ...g, calculation: { ...g.calculation, inputData: e.target.value } }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Képlet</label>
                        <input
                          className={fieldClass}
                          placeholder="Pl. 4 x 2,5 = 10 m²"
                          value={guide.calculation?.formula || ''}
                          onChange={(e) => updateGuide((g) => ({ ...g, calculation: { ...g.calculation, formula: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Számítás</label>
                        <input
                          className={fieldClass}
                          placeholder="Pl. 10 m² x 2 oldal = 20 m²"
                          value={guide.calculation?.calculation || ''}
                          onChange={(e) => updateGuide((g) => ({ ...g, calculation: { ...g.calculation, calculation: e.target.value } }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Eredmény</label>
                        <input
                          className={fieldClass}
                          placeholder="Pl. 22 m² gipszkarton"
                          value={guide.calculation?.result || ''}
                          onChange={(e) => updateGuide((g) => ({ ...g, calculation: { ...g.calculation, result: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Megjegyzés</label>
                        <input
                          className={fieldClass}
                          placeholder="Pl. 10% hulladékkal növelve"
                          value={guide.calculation?.note || ''}
                          onChange={(e) => updateGuide((g) => ({ ...g, calculation: { ...g.calculation, note: e.target.value } }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 14: ÖSSZEFOGLALÁS */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('summary')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <CheckCircle2 size={16} /> 14. Összefoglalás
                  </span>
                  {openSections.summary ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.summary && (
                  <div className="p-5 border-t border-[#222]">
                    <textarea
                      className={`${fieldClass} resize-y min-h-[80px]`}
                      rows={3}
                      placeholder="Rövid összefoglaló a legfontosabb szakmai tanulságokról..."
                      value={guide.summary}
                      onChange={(e) => updateGuide((g) => ({ ...g, summary: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {/* SECTION 15: SEO ÉS METAADATOK */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
                <button type="button" onClick={() => toggleSection('seo')} className={sectionHeaderClass}>
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] flex items-center gap-2">
                    <Tag size={16} /> 15. SEO és Metaadatok
                  </span>
                  {openSections.seo ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {openSections.seo && (
                  <div className="p-5 space-y-3 border-t border-[#222]">
                    <div>
                      <label className={labelClass}>SEO Cím</label>
                      <input
                        className={fieldClass}
                        placeholder="Keresőoptimalizált cím..."
                        value={guide.seo?.seoTitle || ''}
                        onChange={(e) => updateGuide((g) => ({ ...g, seo: { ...g.seo, seoTitle: e.target.value } }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Meta Leírás</label>
                      <textarea
                        className={`${fieldClass} resize-none`}
                        rows={2}
                        placeholder="Keresőmotor leírás..."
                        value={guide.seo?.metaDescription || ''}
                        onChange={(e) => updateGuide((g) => ({ ...g, seo: { ...g.seo, metaDescription: e.target.value } }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Fő Kulcsszó</label>
                        <input
                          className={fieldClass}
                          placeholder="Pl. gipszkarton válaszfal"
                          value={guide.seo?.primaryKeyword || ''}
                          onChange={(e) => updateGuide((g) => ({ ...g, seo: { ...g.seo, primaryKeyword: e.target.value } }))}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Kapcsolódó Kulcsszavak</label>
                        <input
                          className={fieldClass}
                          placeholder="Pl. profil, szigetelés, glettelés"
                          value={guide.seo?.relatedKeywords || ''}
                          onChange={(e) => updateGuide((g) => ({ ...g, seo: { ...g.seo, relatedKeywords: e.target.value } }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-between pt-4 border-t border-[#222] shrink-0 sticky bottom-0 bg-[#111] z-10 py-3">
                <span className="text-[11px] text-gray-500 italic">
                  Csak „Publikált” státuszú cikkek jelennek meg a nyilvános Tudástárban.
                </span>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-200 disabled:opacity-40 transition-colors">
                    Mégse
                  </button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FFC400] text-black text-xs font-black rounded-xl hover:bg-[#E6B000] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md">
                    <Save size={16} /> {saving ? 'Mentés...' : isCreate ? 'Szakmai Útmutató Létrehozása' : 'Módosítások Mentése'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditArticleModal;

