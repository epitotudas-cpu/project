import React, { useState, useEffect } from 'react';
import {
  X, Save, AlertCircle, Calculator, Sparkles, Plus, Trash2,
  ChevronUp, ChevronDown, Eye, Image as ImageIcon,
  Wrench, ShieldAlert, FileText, Table as TableIcon, CheckSquare,
  Tag, ListOrdered, BookMarked, CheckCircle2, Copy, Heading, Type, Minus,
  List
} from 'lucide-react';
import { slugify } from '../lib/slugify';
import type { Article, Category } from '../lib/supabase';
import { createArticle, updateArticle } from '../services/articleService';

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

// Block Types Definition
export type BlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'gallery'
  | 'list'
  | 'numbered_list'
  | 'table'
  | 'highlight'
  | 'warning'
  | 'checklist'
  | 'calculation'
  | 'divider';

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  caption: string;
  prompt: string;
}

export interface CheckItem {
  id: string;
  text: string;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  content?: string;
  level?: 'h2' | 'h3' | 'h4';
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  imagePrompt?: string;
  galleryImages?: GalleryImage[];
  items?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  highlightType?: 'Jó tudni' | 'Figyelem' | 'Szakmai tipp' | 'Fontos' | 'Biztonság';
  highlightTitle?: string;
  warningType?: 'warning' | 'safety' | 'specialist' | 'technical';
  checkItems?: CheckItem[];
  calcInput?: string;
  calcFormula?: string;
  calcProcess?: string;
  calcResult?: string;
  calcNote?: string;
}

export interface GuideSEOData {
  seoTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  relatedKeywords: string;
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  category_id: string;
  status: Article['status'];
  author: string;
  read_time: number;
  featured_image: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  category_id: '',
  status: 'draft',
  author: 'ÉpítőTudás Szerkesztőség',
  read_time: 5,
  featured_image: '',
};

const DEFAULT_SEO: GuideSEOData = {
  seoTitle: '',
  metaDescription: '',
  primaryKeyword: '',
  relatedKeywords: '',
};

function formFromArticle(article: Article): FormState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? '',
    category_id: article.category_id ?? '',
    status: article.status || 'draft',
    author: article.author ?? 'ÉpítőTudás Szerkesztőség',
    read_time: article.read_time || 5,
    featured_image: article.featured_image ?? '',
  };
}

function calculateReadTimeFromBlocks(blocks: ContentBlock[]): number {
  let wordCount = 0;
  blocks.forEach((b) => {
    if (b.content) wordCount += b.content.trim().split(/\s+/).length;
    if (b.items) wordCount += b.items.join(' ').trim().split(/\s+/).length;
    if (b.tableRows) wordCount += b.tableRows.flat().join(' ').trim().split(/\s+/).length;
  });
  if (wordCount === 0) return 5;
  return Math.max(1, Math.ceil(wordCount / 200));
}

// ----------------------------------------------------------------------
// DATA SERIALIZATION & BACKWARD COMPATIBILITY HELPERS
// ----------------------------------------------------------------------

function serializeBlocksToContent(blocks: ContentBlock[], seo: GuideSEOData): string {
  let md = '';

  blocks.forEach((block) => {
    switch (block.type) {
      case 'text':
        if (block.content?.trim()) {
          md += `${block.content.trim()}\n\n`;
        }
        break;

      case 'heading': {
        const prefix = block.level === 'h3' ? '###' : block.level === 'h4' ? '####' : '##';
        if (block.content?.trim()) {
          md += `${prefix} ${block.content.trim()}\n\n`;
        }
        break;
      }

      case 'image':
        if (block.imageUrl?.trim()) {
          md += `![${block.imageAlt || ''}](${block.imageUrl.trim()})\n`;
          if (block.imageCaption?.trim()) {
            md += `*${block.imageCaption.trim()}*\n`;
          }
          md += `\n`;
        }
        break;

      case 'gallery':
        if (block.galleryImages && block.galleryImages.length > 0) {
          block.galleryImages.forEach((img) => {
            if (img.url?.trim()) {
              md += `![${img.alt || ''}](${img.url.trim()})\n`;
              if (img.caption?.trim()) md += `*${img.caption.trim()}*\n`;
            }
          });
          md += `\n`;
        }
        break;

      case 'list':
        if (block.items && block.items.length > 0) {
          block.items.forEach((item) => {
            if (item.trim()) md += `- ${item.trim()}\n`;
          });
          md += `\n`;
        }
        break;

      case 'numbered_list':
        if (block.items && block.items.length > 0) {
          block.items.forEach((item, idx) => {
            if (item.trim()) md += `${idx + 1}. ${item.trim()}\n`;
          });
          md += `\n`;
        }
        break;

      case 'table':
        if (block.tableHeaders && block.tableHeaders.length > 0 && block.tableRows) {
          md += `| ${block.tableHeaders.join(' | ')} |\n`;
          md += `| ${block.tableHeaders.map(() => '---').join(' | ')} |\n`;
          block.tableRows.forEach((row) => {
            md += `| ${row.join(' | ')} |\n`;
          });
          md += `\n`;
        }
        break;

      case 'highlight':
        if (block.content?.trim()) {
          md += `> **[${block.highlightType || 'Szakmai tipp'}] ${block.highlightTitle || ''}**\n> ${block.content.trim()}\n\n`;
        }
        break;

      case 'warning':
        if (block.content?.trim()) {
          const badge =
            block.warningType === 'safety' ? '🛑 BIZTONSÁG' :
            block.warningType === 'specialist' ? '⚡ SZAKEMBER' :
            block.warningType === 'technical' ? '📌 MŰSZAKI FELTÉTEL' : '⚠️ FIGYELEM';
          md += `> **${badge}**: ${block.content.trim()}\n\n`;
        }
        break;

      case 'checklist':
        if (block.checkItems && block.checkItems.length > 0) {
          block.checkItems.forEach((ci) => {
            if (ci.text.trim()) md += `- [ ] ${ci.text.trim()}\n`;
          });
          md += `\n`;
        }
        break;

      case 'calculation':
        if (block.calcInput || block.calcFormula || block.calcResult) {
          md += `### Anyagszükséglet / Számítási Példa\n\n`;
          if (block.calcInput) md += `- **Kiinduló adatok:** ${block.calcInput}\n`;
          if (block.calcFormula) md += `- **Képlet:** \`${block.calcFormula}\`\n`;
          if (block.calcProcess) md += `- **Számítás:** ${block.calcProcess}\n`;
          if (block.calcResult) md += `- **Eredmény:** **${block.calcResult}**\n`;
          if (block.calcNote) md += `- **Megjegyzés:** ${block.calcNote}\n`;
          md += `\n`;
        }
        break;

      case 'divider':
        md += `---\n\n`;
        break;
    }
  });

  const payload = JSON.stringify({ blocks, seo });
  md += `\n\n[EPITOTUDAS_BLOCKS_DATA:${payload}]`;
  return md;
}

function parseBlocksFromContent(content: string): { blocks: ContentBlock[]; seo: GuideSEOData } {
  if (!content) {
    return { blocks: [], seo: { ...DEFAULT_SEO } };
  }

  // 1. Try parsing modern EPITOTUDAS_BLOCKS_DATA
  const blocksMatch = content.match(/\[EPITOTUDAS_BLOCKS_DATA:(.*)\]$/s);
  if (blocksMatch) {
    try {
      const parsed = JSON.parse(blocksMatch[1]);
      return {
        blocks: parsed.blocks || [],
        seo: parsed.seo || { ...DEFAULT_SEO },
      };
    } catch (e) {
      console.error('EPITOTUDAS_BLOCKS_DATA parse error:', e);
    }
  }

  // 2. Try parsing legacy EPITOTUDAS_GUIDE_DATA for backward compatibility
  const legacyMatch = content.match(/\[EPITOTUDAS_GUIDE_DATA:(.*)\]$/s);
  if (legacyMatch) {
    try {
      const g = JSON.parse(legacyMatch[1]);
      const blocks: ContentBlock[] = [];

      if (g.introduction?.trim()) {
        blocks.push({ id: 'legacy_intro', type: 'text', content: g.introduction.trim() });
      }

      if (g.warnings && g.warnings.length > 0) {
        g.warnings.forEach((w: any, idx: number) => {
          blocks.push({
            id: `legacy_warn_${idx}`,
            type: 'warning',
            warningType: w.type || 'warning',
            content: w.text || '',
          });
        });
      }

      if (g.workflow && g.workflow.length > 0) {
        blocks.push({ id: 'legacy_wf_title', type: 'heading', level: 'h2', content: 'A Munkafolyamat Áttekintése' });
        blocks.push({
          id: 'legacy_wf_list',
          type: 'numbered_list',
          items: g.workflow.map((item: any) => item.title || ''),
        });
      }

      if (g.materials && g.materials.length > 0) {
        blocks.push({ id: 'legacy_mat_title', type: 'heading', level: 'h2', content: 'Szükséges Anyagok' });
        blocks.push({
          id: 'legacy_mat_table',
          type: 'table',
          tableHeaders: ['Anyag', 'Méret / Típus', 'Egység', 'Megjegyzés'],
          tableRows: g.materials.map((m: any) => [m.name || '', m.sizeType || '', m.unit || '', m.note || '']),
        });
      }

      if (g.tools && g.tools.length > 0) {
        blocks.push({ id: 'legacy_tool_title', type: 'heading', level: 'h2', content: 'Szükséges Szerszámok' });
        blocks.push({
          id: 'legacy_tool_list',
          type: 'list',
          items: g.tools.map((t: any) => `[${t.category || 'Szerszám'}] ${t.name || ''}${t.note ? `: ${t.note}` : ''}`),
        });
      }

      if (g.safety && g.safety.length > 0) {
        blocks.push({ id: 'legacy_safe_title', type: 'heading', level: 'h2', content: 'Munkavédelem & Biztonság' });
        g.safety.forEach((s: any, idx: number) => {
          blocks.push({
            id: `legacy_safe_${idx}`,
            type: 'warning',
            warningType: 'safety',
            content: `${s.hazardName || ''} (${s.hazardType || ''}): ${s.prevention || s.explanation || ''}`,
          });
        });
      }

      if (g.steps && g.steps.length > 0) {
        blocks.push({ id: 'legacy_steps_title', type: 'heading', level: 'h2', content: 'Lépésenkénti Kivitelezés' });
        g.steps.forEach((st: any, idx: number) => {
          blocks.push({
            id: `legacy_step_h_${idx}`,
            type: 'heading',
            level: 'h3',
            content: `${idx + 1}. Lépés: ${st.title || ''}`,
          });
          const textContent = [
            st.whatWeDo ? `**Mit csinálunk?**\n${st.whatWeDo}` : '',
            st.howWeDo ? `**Hogyan csináljuk?**\n${st.howWeDo}` : '',
            st.whatToWatch ? `**Mire figyelj?**\n${st.whatToWatch}` : '',
            st.commonMistake ? `**Gyakori hiba:**\n${st.commonMistake}` : '',
            st.verification ? `**Ellenőrzés:**\n${st.verification}` : '',
          ].filter(Boolean).join('\n\n');

          if (textContent) {
            blocks.push({ id: `legacy_step_txt_${idx}`, type: 'text', content: textContent });
          }

          if (st.imageUrl) {
            blocks.push({
              id: `legacy_step_img_${idx}`,
              type: 'image',
              imageUrl: st.imageUrl,
              imageAlt: st.imageAlt || '',
              imageCaption: st.imageCaption || '',
              imagePrompt: st.imagePrompt || '',
            });
          }
        });
      }

      if (g.techData && g.techData.length > 0) {
        blocks.push({ id: 'legacy_tech_title', type: 'heading', level: 'h2', content: 'Méretek és Műszaki Adatok' });
        blocks.push({
          id: 'legacy_tech_table',
          type: 'table',
          tableHeaders: ['Elem / Művelet', 'Érték', 'Egység', 'Típus', 'Megjegyzés'],
          tableRows: g.techData.map((td: any) => [td.element || '', td.value || '', td.unit || '', td.valueType || '', td.note || '']),
        });
      }

      if (g.mistakes && g.mistakes.length > 0) {
        blocks.push({ id: 'legacy_mistakes_title', type: 'heading', level: 'h2', content: 'Gyakori Hibák' });
        g.mistakes.forEach((m: any, idx: number) => {
          blocks.push({
            id: `legacy_mistake_${idx}`,
            type: 'highlight',
            highlightType: 'Figyelem',
            highlightTitle: m.mistake || 'Gyakori hiba',
            content: `Miért probléma: ${m.whyProblem || ''}\nMegelőzés: ${m.prevention || ''}\nJavítás: ${m.fix || ''}`,
          });
        });
      }

      if (g.highlights && g.highlights.length > 0) {
        g.highlights.forEach((h: any, idx: number) => {
          blocks.push({
            id: `legacy_hl_${idx}`,
            type: 'highlight',
            highlightType: h.type || 'Szakmai tipp',
            highlightTitle: h.title || '',
            content: h.content || '',
          });
        });
      }

      if (g.checklist && g.checklist.length > 0) {
        blocks.push({ id: 'legacy_chk_title', type: 'heading', level: 'h2', content: 'Minőségellenőrző Lista' });
        blocks.push({
          id: 'legacy_chk_list',
          type: 'checklist',
          checkItems: g.checklist.map((c: any) => ({ id: c.id || Date.now().toString(), text: c.text || '' })),
        });
      }

      if (g.calculation && (g.calculation.inputData || g.calculation.formula || g.calculation.result)) {
        blocks.push({
          id: 'legacy_calc',
          type: 'calculation',
          calcInput: g.calculation.inputData || '',
          calcFormula: g.calculation.formula || '',
          calcProcess: g.calculation.calculation || '',
          calcResult: g.calculation.result || '',
          calcNote: g.calculation.note || '',
        });
      }

      if (g.summary?.trim()) {
        blocks.push({ id: 'legacy_summary_title', type: 'heading', level: 'h2', content: 'Összefoglalás' });
        blocks.push({ id: 'legacy_summary', type: 'text', content: g.summary.trim() });
      }

      const seo: GuideSEOData = g.seo ? { ...g.seo } : { ...DEFAULT_SEO };
      return { blocks, seo };
    } catch (e) {
      console.error('Legacy guide parse error:', e);
    }
  }

  // 3. Fallback: Parse plain markdown text into basic text/heading blocks
  const cleanedText = content.replace(/\[EPITOTUDAS_.*\]$/s, '').trim();
  if (!cleanedText) return { blocks: [], seo: { ...DEFAULT_SEO } };

  const paragraphs = cleanedText.split(/\n\n+/);
  const blocks: ContentBlock[] = paragraphs.map((p, idx) => {
    if (/^##\s+/.test(p)) {
      return { id: `p_h2_${idx}`, type: 'heading', level: 'h2', content: p.replace(/^##\s+/, '') };
    }
    if (/^###\s+/.test(p)) {
      return { id: `p_h3_${idx}`, type: 'heading', level: 'h3', content: p.replace(/^###\s+/, '') };
    }
    return { id: `p_txt_${idx}`, type: 'text', content: p };
  });

  return { blocks, seo: { ...DEFAULT_SEO } };
}

// ----------------------------------------------------------------------
// STARTER TEMPLATES
// ----------------------------------------------------------------------

const STARTER_TEMPLATES: Record<
  string,
  { name: string; icon: string; description: string; getBlocks: () => ContentBlock[] }
> = {
  step_by_step: {
    name: 'Lépésről lépésre útmutató',
    icon: '🏗️',
    description: 'Kivitelezési útmutató anyag- és szerszámlistával, műveleti lépésekkel és ellenőrzőlistával.',
    getBlocks: () => [
      {
        id: 'b1',
        type: 'text',
        content: 'Rövid bevezetés: mutasd be a kivitelezés célját, a várt eredményt és a szükséges előfeltételeket.',
      },
      { id: 'b2', type: 'heading', level: 'h2', content: 'Szükséges Anyagok' },
      {
        id: 'b3',
        type: 'table',
        tableHeaders: ['Anyag megnevezése', 'Méret / Típus', 'Mennyiség / Egység', 'Megjegyzés'],
        tableRows: [
          ['Fő alapanyag', 'Standard méret', '10 m²', 'Első osztályú minőség'],
          ['Rögzítőelem', 'Standard csavar', '1 doboz', 'Gyártói ajánlásra'],
        ],
      },
      { id: 'b4', type: 'heading', level: 'h2', content: 'Szükséges Szerszámok' },
      {
        id: 'b5',
        type: 'list',
        items: [
          '[Mérőeszközök] Lézeres vízmérték és mérőszalag',
          '[Alapvető szerszámok] Kézi lemezvágó olló és szike',
          '[Gépek] Akkus csavarbehajtó mélységhatárolóval',
        ],
      },
      { id: 'b6', type: 'heading', level: 'h2', content: 'Munkavédelem & Biztonság' },
      {
        id: 'b7',
        type: 'warning',
        warningType: 'safety',
        content: 'Pormaszk (FFP2) és védőszemüveg viselése kötelező a vágási és csiszolási munkáknál!',
      },
      { id: 'b8', type: 'heading', level: 'h2', content: 'Lépésenkénti Kivitelezés' },
      { id: 'b9', type: 'heading', level: 'h3', content: '1. Lépés: Előkészítés és kitűzés' },
      {
        id: 'b10',
        type: 'text',
        content: 'Pontosan jelöld ki a nyomvonalat. Használj lézert vagy csapózsinórt a függőleges és vízszintes vonalak felrajzolásához.',
      },
      {
        id: 'b11',
        type: 'image',
        imageUrl: '',
        imageAlt: 'Kitűzés folyamata',
        imageCaption: 'Lézeres nyomvonal kitűzése a felületen',
        imagePrompt: 'Műszaki illusztráció: Építési felület lézeres kitűzése pontos méretekkel.',
      },
      { id: 'b12', type: 'heading', level: 'h3', content: '2. Lépés: Szerelés és rögzítés' },
      {
        id: 'b13',
        type: 'text',
        content: 'Rögzítsd az elemeket az előírt távolságok betartásával. Ügyelj rá, hogy a csavarfejek ne szakítsák át az anyagot.',
      },
      {
        id: 'b14',
        type: 'highlight',
        highlightType: 'Szakmai tipp',
        highlightTitle: 'Toldási szabály',
        content: 'Soha ne helyezz toldást ajtó- vagy ablaknyílások sarkához egy vonalban.',
      },
      { id: 'b15', type: 'heading', level: 'h2', content: 'Minőségellenőrző Lista' },
      {
        id: 'b16',
        type: 'checklist',
        checkItems: [
          { id: 'c1', text: 'A kitűzés pontos és függőleges' },
          { id: 'c2', text: 'A rögzítések szilárdak' },
          { id: 'c3', text: 'Az eltolt hézagolás szabályos' },
        ],
      },
      { id: 'b17', type: 'heading', level: 'h2', content: 'Összefoglalás' },
      {
        id: 'b18',
        type: 'text',
        content: 'A szakszerűen elvégzett munka szavatolja a tartósságot és a jó hangszigetelést.',
      },
    ],
  },
  concept_explainer: {
    name: 'Fogalommagyarázó / Szakmai cikk',
    icon: '💡',
    description: 'Építőipari szakkifejezések, technológiák és szabványok közérthető magyarázata.',
    getBlocks: () => [
      {
        id: 'b1',
        type: 'text',
        content: 'Bevezető: miért fontos ez a fogalom vagy technológia az építőiparban?',
      },
      { id: 'b2', type: 'heading', level: 'h2', content: 'Mi ez a technológia és mi a lényege?' },
      {
        id: 'b3',
        type: 'text',
        content: 'Írd le a pontos szakmai meghatározást, működési elvet és a történeti/szabványi hátteret.',
      },
      { id: 'b4', type: 'heading', level: 'h2', content: 'Hol és mikor alkalmazzák?' },
      {
        id: 'b5',
        type: 'text',
        content: 'Részletezd a tipikus építőipari alkalmazási területeket és a leggyakoribb épülettípusokat.',
      },
      {
        id: 'b6',
        type: 'highlight',
        highlightType: 'Jó tudni',
        highlightTitle: 'Fontos megkülönböztetés',
        content: 'Ne keverjük össze a rokon technológiákkal – a fő különbség az anyagösszetételben van.',
      },
      { id: 'b7', type: 'heading', level: 'h2', content: 'Főbb előnyök és hátrányok' },
      {
        id: 'b8',
        type: 'table',
        tableHeaders: ['Jellemző', 'Előnyök', 'Kihívások / Hátrányok'],
        tableRows: [
          ['Gyorsaság', 'Szárazépítés, azonnal folytatható', 'Környezeti páratartalomra érzékeny'],
          ['Költség', 'Gazdaságos anyagszükséglet', 'Szakszerű beépítést igényel'],
        ],
      },
      { id: 'b9', type: 'heading', level: 'h2', content: 'Összefoglalás' },
      { id: 'b10', type: 'text', content: 'Összegzés a legfontosabb szakmai tanulságokról.' },
    ],
  },
  material_overview: {
    name: 'Anyag- és technológiaismertető',
    icon: '🧱',
    description: 'Építőanyagok műszaki paraméterei, típusai, beépítési szabályai.',
    getBlocks: () => [
      {
        id: 'b1',
        type: 'text',
        content: 'Bevezetés az építőanyag világába: mire való, milyen szabványoknak felel meg.',
      },
      { id: 'b2', type: 'heading', level: 'h2', content: 'Anyagjellemzők és Típusok' },
      {
        id: 'b3',
        type: 'table',
        tableHeaders: ['Típus', 'Vastagság / Méret', 'Alkalmazási terület', 'Műszaki jellemző'],
        tableRows: [
          ['Normál (RB)', '12.5 mm', 'Beltéri válaszfalak', 'Standard száraz környezet'],
          ['Impregnált (RBI)', '12.5 mm', 'Vizes helyiségek', 'Fokozott páratűrés'],
        ],
      },
      { id: 'b4', type: 'heading', level: 'h2', content: 'Alkalmazási és Beépítési Szabályok' },
      {
        id: 'b5',
        type: 'text',
        content: 'A tárolási, szállítási és beépítési előírások betartása elengedhetetlen a szavatossághoz.',
      },
      {
        id: 'b6',
        type: 'warning',
        warningType: 'technical',
        content: 'Mindig fagymentes, száraz helyen tárolandó a beépítés előtt!',
      },
      { id: 'b7', type: 'heading', level: 'h2', content: 'Összefoglalás' },
      { id: 'b8', type: 'text', content: 'Összefoglaló tanácsok az anyagválasztáshoz.' },
    ],
  },
  comparison: {
    name: 'Összehasonlító cikk',
    icon: '⚖️',
    description: 'Két vagy több építőipari megoldás, anyag vagy technológia összevetése.',
    getBlocks: () => [
      {
        id: 'b1',
        type: 'text',
        content: 'Melyik a jobb választás a feladatra? Ebben a cikkben összehasonlítjuk az A és B opciót.',
      },
      { id: 'b2', type: 'heading', level: 'h2', content: 'Mikor melyik megoldást válasszuk?' },
      {
        id: 'b3',
        type: 'table',
        tableHeaders: ['Szempont', 'A Opció', 'B Opció'],
        tableRows: [
          ['Beépítési idő', 'Gyors', 'Lassabb'],
          ['Hangszigetelés', 'Közepes', 'Kiváló'],
          ['Árfekvés', 'Kedvezőbb', 'Magasabb'],
        ],
      },
      {
        id: 'b4',
        type: 'highlight',
        highlightType: 'Szakmai tipp',
        highlightTitle: 'Döntési javaslat',
        content: 'Nagyobb terhelésnél a B opciót, normál beltéri használatra az A opciót ajánljuk.',
      },
      { id: 'b5', type: 'heading', level: 'h2', content: 'Összefoglalás' },
      { id: 'b6', type: 'text', content: 'Végső konklúzió és döntési segítség.' },
    ],
  },
  blank: {
    name: 'Üres cikk',
    icon: '📄',
    description: 'Tiszta lap, teljesen szabadon felépíthető tartalom.',
    getBlocks: () => [
      { id: 'b1', type: 'heading', level: 'h2', content: 'Bevezetés' },
      { id: 'b2', type: 'text', content: 'Kezdd el írni a cikk tartalmát...' },
    ],
  },
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export function EditArticleModal({ article, categories, onClose, onSaved }: EditArticleModalProps) {
  const isCreate = article === null;
  const [form, setForm] = useState<FormState>(() => (article ? formFromArticle(article) : { ...EMPTY_FORM }));
  
  const parsedData = article ? parseBlocksFromContent(article.content || '') : { blocks: [], seo: { ...DEFAULT_SEO } };
  const [blocks, setBlocks] = useState<ContentBlock[]>(parsedData.blocks);
  const [seo, setSeo] = useState<GuideSEOData>(parsedData.seo);

  const [slugTouched, setSlugTouched] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (article) {
      setForm(formFromArticle(article));
      const p = parseBlocksFromContent(article.content || '');
      setBlocks(p.blocks);
      setSeo(p.seo);
      setSlugTouched(true);
    } else {
      setForm({ ...EMPTY_FORM });
      setBlocks(STARTER_TEMPLATES.blank.getBlocks());
      setSeo({ ...DEFAULT_SEO });
      setSlugTouched(false);
    }
    setError(null);
    setDirty(false);
  }, [article]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !saving) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function updateBlocks(updater: (prev: ContentBlock[]) => ContentBlock[]) {
    setBlocks((prev) => {
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
    const autoTime = calculateReadTimeFromBlocks(blocks);
    updateForm('read_time', autoTime);
  }

  function applyTemplate(key: string) {
    const tmpl = STARTER_TEMPLATES[key];
    if (tmpl) {
      if (blocks.length === 0 || window.confirm('Biztosan betöltöd a sablont? A jelenlegi blokkok felülíródnak.')) {
        setBlocks(tmpl.getBlocks());
        setDirty(true);
      }
    }
  }

  // Block management helpers
  function addBlock(type: BlockType) {
    const newBlock: ContentBlock = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      type,
    };

    switch (type) {
      case 'text':
        newBlock.content = '';
        break;
      case 'heading':
        newBlock.level = 'h2';
        newBlock.content = '';
        break;
      case 'image':
        newBlock.imageUrl = '';
        newBlock.imageAlt = '';
        newBlock.imageCaption = '';
        newBlock.imagePrompt = '';
        break;
      case 'gallery':
        newBlock.galleryImages = [];
        break;
      case 'list':
      case 'numbered_list':
        newBlock.items = [''];
        break;
      case 'table':
        newBlock.tableHeaders = ['Oszlop 1', 'Oszlop 2'];
        newBlock.tableRows = [['Adat 1', 'Adat 2']];
        break;
      case 'highlight':
        newBlock.highlightType = 'Szakmai tipp';
        newBlock.highlightTitle = '';
        newBlock.content = '';
        break;
      case 'warning':
        newBlock.warningType = 'warning';
        newBlock.content = '';
        break;
      case 'checklist':
        newBlock.checkItems = [{ id: Date.now().toString(), text: '' }];
        break;
      case 'calculation':
        newBlock.calcInput = '';
        newBlock.calcFormula = '';
        newBlock.calcProcess = '';
        newBlock.calcResult = '';
        newBlock.calcNote = '';
        break;
    }

    updateBlocks((prev) => [...prev, newBlock]);
  }

  function moveBlock(index: number, direction: 'up' | 'down') {
    updateBlocks((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const list = [...prev];
      const temp = list[targetIndex];
      list[targetIndex] = list[index];
      list[index] = temp;
      return list;
    });
  }

  function duplicateBlock(index: number) {
    updateBlocks((prev) => {
      const original = prev[index];
      const copy: ContentBlock = JSON.parse(JSON.stringify(original));
      copy.id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      const list = [...prev];
      list.splice(index + 1, 0, copy);
      return list;
    });
  }

  function removeBlock(index: number) {
    updateBlocks((prev) => prev.filter((_, i) => i !== index));
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
      const serializedContent = serializeBlocksToContent(blocks, seo);
      const calculatedReadTime = form.read_time || calculateReadTimeFromBlocks(blocks);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#141414] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFC400]/10 border border-[#FFC400]/20 rounded-lg text-[#FFC400]">
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>{isCreate ? 'Új Szakmai Cikk Létrehozása' : 'Szakmai Cikk Szerkesztése'}</span>
              </h2>
              <p className="text-xs text-gray-400">Rugalmas, blokkalapú építőipari cikkszerkesztő</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            <span className="text-xs font-medium flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full text-gray-400">
              {saving ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-400 font-bold">Mentés...</span>
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

            <button
              onClick={onClose}
              disabled={saving}
              className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg border border-[#222] hover:bg-[#1E1E1E]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
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
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{form.title || 'Cikk címe'}</h1>
                <p className="text-sm text-gray-400 mt-2">{form.excerpt || 'Kivonat nem lett megadva.'}</p>
              </div>

              {form.featured_image && (
                <div className="rounded-xl overflow-hidden h-64 border border-[#222]">
                  <img src={form.featured_image} alt={form.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-6 text-sm leading-relaxed font-sans whitespace-pre-line border-t border-[#222] pt-6">
                {serializeBlocksToContent(blocks, seo).replace(/\[EPITOTUDAS_BLOCKS_DATA:.*\]$/s, '')}
              </div>
            </div>
          ) : (
            /* EDITOR FORM VIEW */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: CIKK ADATAI */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#222]">
                  <BookMarked size={18} className="text-[#FFC400]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#FFC400]">
                    1. Cikk Alapadatok &amp; Megjelenés
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Cikk Címe <span className="text-red-400">*</span></label>
                    <input
                      className={fieldClass}
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Pl. Alaksajtolás és lemezmegmunkálás az építőiparban"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>URL-Azonosító (Slug) <span className="text-red-400">*</span></label>
                    <input
                      className={fieldClass}
                      value={form.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="url-barat-azonosito"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass}>Rövid Kivonat (Csempe leírás)</label>
                    <span className={`text-[11px] font-mono ${form.excerpt.length > 180 ? 'text-amber-400' : 'text-gray-500'}`}>
                      {form.excerpt.length} kar.
                    </span>
                  </div>
                  <textarea
                    className={`${fieldClass} resize-none`}
                    rows={2}
                    value={form.excerpt}
                    onChange={(e) => updateForm('excerpt', e.target.value)}
                    placeholder="Kompakt, szakmailag pontos összefoglaló a csempekártyára..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Borítókép URL</label>
                    <input
                      className={fieldClass}
                      value={form.featured_image}
                      onChange={(e) => updateForm('featured_image', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Kategória</label>
                    <select
                      className={fieldClass}
                      value={form.category_id}
                      onChange={(e) => updateForm('category_id', e.target.value)}
                    >
                      <option value="">— Nincs —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Publikálási Státusz</label>
                    <select
                      className={fieldClass}
                      value={form.status}
                      onChange={(e) => updateForm('status', e.target.value as Article['status'])}
                    >
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
                    <input
                      type="number"
                      min={1}
                      className={fieldClass}
                      value={form.read_time}
                      onChange={(e) => updateForm('read_time', Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Szerző / Forrás</label>
                    <input
                      className={fieldClass}
                      value={form.author}
                      onChange={(e) => updateForm('author', e.target.value)}
                      placeholder="ÉpítőTudás Szerkesztőség"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: KEZDŐSABLONOK */}
              <div className="p-4 bg-[#141414] border border-[#222] rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#FFC400]" />
                  <span className="text-xs font-black uppercase text-gray-300 tracking-wide">
                    Opcionális Kezdősablon Betöltése:
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(STARTER_TEMPLATES).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyTemplate(key)}
                      className="p-2.5 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-left transition-colors flex flex-col justify-between group"
                    >
                      <span className="text-base mb-1">{t.icon}</span>
                      <span className="text-xs font-bold text-gray-200 group-hover:text-[#FFC400]">
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 3: CIKK TARTALMA (BLOKKALAPÚ EDITOR) */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#FFC400]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#FFC400]">
                      2. Cikk Tartalma ({blocks.length} blokk)
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 italic">
                    Szabadon felépíthető tartalom blokkokból
                  </span>
                </div>

                {/* BLOCK LIST */}
                {blocks.length === 0 ? (
                  <div className="text-center py-10 bg-[#0A0A0A] border border-dashed border-[#333] rounded-2xl space-y-3">
                    <Type size={32} className="mx-auto text-gray-600" />
                    <p className="text-sm text-gray-400 font-medium">A cikk jelenleg üres.</p>
                    <p className="text-xs text-gray-500">Kattints az alábbi gombok egyikére a tartalom felépítéséhez!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blocks.map((block, idx) => (
                      <div
                        key={block.id}
                        className="bg-[#0A0A0A] border border-[#222] rounded-xl p-4 space-y-3 relative group transition-colors hover:border-[#333]"
                      >
                        {/* BLOCK CONTROLS HEADER */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A]">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#1E1E1E] text-[#FFC400] text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black uppercase tracking-wider text-gray-300">
                              {block.type === 'text' && '📝 Szöveg'}
                              {block.type === 'heading' && `📌 Címsor (${block.level || 'h2'})`}
                              {block.type === 'image' && '🖼️ Kép'}
                              {block.type === 'gallery' && '🖼️🖼️ Képgaléria'}
                              {block.type === 'list' && '• Pontozott Lista'}
                              {block.type === 'numbered_list' && '1. Számozott Lista'}
                              {block.type === 'table' && '📊 Táblázat'}
                              {block.type === 'highlight' && `💡 Kiemelés (${block.highlightType || 'Szakmai tipp'})`}
                              {block.type === 'warning' && '⚠️ Munkavédelem & Biztonság'}
                              {block.type === 'checklist' && '☑️ Minőségellenőrző Lista'}
                              {block.type === 'calculation' && '🧮 Számítás / Képlet'}
                              {block.type === 'divider' && '➖ Elválasztó Vonal'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveBlock(idx, 'up')}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                              title="Mozgatás fel"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === blocks.length - 1}
                              onClick={() => moveBlock(idx, 'down')}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-20"
                              title="Mozgatás le"
                            >
                              <ChevronDown size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateBlock(idx)}
                              className="p-1 text-gray-500 hover:text-[#FFC400]"
                              title="Másolás"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeBlock(idx)}
                              className="p-1 text-gray-500 hover:text-red-400"
                              title="Törlés"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* BLOCK EDITORS */}
                        {block.type === 'text' && (
                          <textarea
                            className={`${fieldClass} resize-y min-h-[80px]`}
                            rows={3}
                            placeholder="Írd ide a bekezdés tartalmát..."
                            value={block.content || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateBlocks((list) => {
                                const next = [...list];
                                next[idx].content = val;
                                return next;
                              });
                            }}
                          />
                        )}

                        {block.type === 'heading' && (
                          <div className="flex items-center gap-2">
                            <select
                              className={`${fieldClass} w-32 shrink-0`}
                              value={block.level || 'h2'}
                              onChange={(e) => {
                                const val = e.target.value as 'h2' | 'h3' | 'h4';
                                updateBlocks((list) => {
                                  const next = [...list];
                                  next[idx].level = val;
                                  return next;
                                });
                              }}
                            >
                              <option value="h2">H2 (Főfejezet)</option>
                              <option value="h3">H3 (Alfejezet)</option>
                              <option value="h4">H4 (Aféle)</option>
                            </select>
                            <input
                              className={fieldClass}
                              placeholder="Címsor szövege..."
                              value={block.content || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateBlocks((list) => {
                                  const next = [...list];
                                  next[idx].content = val;
                                  return next;
                                });
                              }}
                            />
                          </div>
                        )}

                        {block.type === 'image' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>Kép URL</label>
                                <input
                                  className={fieldClass}
                                  placeholder="https://..."
                                  value={block.imageUrl || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].imageUrl = val;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Képaláírás</label>
                                <input
                                  className={fieldClass}
                                  placeholder="Pl. Beépítési illusztráció"
                                  value={block.imageCaption || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].imageCaption = val;
                                      return next;
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
                                  placeholder="Keresőleírás"
                                  value={block.imageAlt || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].imageAlt = val;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>AI Generálási Prompt (Opcionális)</label>
                                <input
                                  className={fieldClass}
                                  placeholder="Képleírás az AI generátorhoz..."
                                  value={block.imagePrompt || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].imagePrompt = val;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                            </div>

                            {block.imageUrl && (
                              <div className="h-32 w-full overflow-hidden rounded-lg border border-[#222]">
                                <img src={block.imageUrl} alt={block.imageAlt || 'Előnézet'} className="h-full w-full object-cover" />
                              </div>
                            )}
                          </div>
                        )}

                        {block.type === 'gallery' && (
                          <div className="space-y-3">
                            <label className={labelClass}>Képek a galériában ({block.galleryImages?.length || 0} db)</label>
                            {block.galleryImages?.map((gImg, gIdx) => (
                              <div key={gImg.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-[#141414] border border-[#222] rounded-lg">
                                <input
                                  className={fieldClass}
                                  placeholder="Kép URL"
                                  value={gImg.url}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      const imgs = [...(next[idx].galleryImages || [])];
                                      imgs[gIdx].url = val;
                                      next[idx].galleryImages = imgs;
                                      return next;
                                    });
                                  }}
                                />
                                <input
                                  className={fieldClass}
                                  placeholder="Képaláírás"
                                  value={gImg.caption}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      const imgs = [...(next[idx].galleryImages || [])];
                                      imgs[gIdx].caption = val;
                                      next[idx].galleryImages = imgs;
                                      return next;
                                    });
                                  }}
                                />
                                <div className="flex items-center gap-2">
                                  <input
                                    className={fieldClass}
                                    placeholder="ALT szöveg"
                                    value={gImg.alt}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateBlocks((list) => {
                                        const next = [...list];
                                        const imgs = [...(next[idx].galleryImages || [])];
                                        imgs[gIdx].alt = val;
                                        next[idx].galleryImages = imgs;
                                        return next;
                                      });
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateBlocks((list) => {
                                        const next = [...list];
                                        next[idx].galleryImages = next[idx].galleryImages?.filter((_, i) => i !== gIdx);
                                        return next;
                                      });
                                    }}
                                    className="p-2 text-gray-500 hover:text-red-400"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                updateBlocks((list) => {
                                  const next = [...list];
                                  const imgs = [...(next[idx].galleryImages || [])];
                                  imgs.push({ id: Date.now().toString(), url: '', caption: '', alt: '', prompt: '' });
                                  next[idx].galleryImages = imgs;
                                  return next;
                                });
                              }}
                              className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-lg border border-[#333] flex items-center gap-1"
                            >
                              <Plus size={14} /> Új Kép a Galériába
                            </button>
                          </div>
                        )}

                        {(block.type === 'list' || block.type === 'numbered_list') && (
                          <div className="space-y-2">
                            {block.items?.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-500 w-5 text-center">
                                  {block.type === 'numbered_list' ? `${itemIdx + 1}.` : '•'}
                                </span>
                                <input
                                  className={fieldClass}
                                  placeholder="Lista elem szövege..."
                                  value={item}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      const items = [...(next[idx].items || [])];
                                      items[itemIdx] = val;
                                      next[idx].items = items;
                                      return next;
                                    });
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].items = next[idx].items?.filter((_, i) => i !== itemIdx);
                                      return next;
                                    });
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-red-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                updateBlocks((list) => {
                                  const next = [...list];
                                  const items = [...(next[idx].items || []), ''];
                                  next[idx].items = items;
                                  return next;
                                });
                              }}
                              className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-lg border border-[#333] flex items-center gap-1"
                            >
                              <Plus size={14} /> Új Lista Elem
                            </button>
                          </div>
                        )}

                        {block.type === 'table' && (
                          <div className="space-y-3 overflow-x-auto">
                            <div className="flex items-center justify-between">
                              <label className={labelClass}>Táblázat Fejlécek és Sorok</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      const headers = [...(next[idx].tableHeaders || []), `Oszlop ${(next[idx].tableHeaders?.length || 0) + 1}`];
                                      const rows = (next[idx].tableRows || []).map((row) => [...row, '']);
                                      next[idx].tableHeaders = headers;
                                      next[idx].tableRows = rows;
                                      return next;
                                    });
                                  }}
                                  className="px-2 py-1 bg-[#1E1E1E] text-[11px] font-bold text-gray-300 rounded border border-[#333]"
                                >
                                  + Oszlop
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      const colCount = next[idx].tableHeaders?.length || 2;
                                      const rows = [...(next[idx].tableRows || []), new Array(colCount).fill('')];
                                      next[idx].tableRows = rows;
                                      return next;
                                    });
                                  }}
                                  className="px-2 py-1 bg-[#1E1E1E] text-[11px] font-bold text-gray-300 rounded border border-[#333]"
                                >
                                  + Sor
                                </button>
                              </div>
                            </div>

                            {/* HEADERS */}
                            <div className="flex gap-2">
                              {block.tableHeaders?.map((header, hIdx) => (
                                <input
                                  key={hIdx}
                                  className={`${fieldClass} font-bold text-center bg-[#141414] min-w-[120px]`}
                                  value={header}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      const headers = [...(next[idx].tableHeaders || [])];
                                      headers[hIdx] = val;
                                      next[idx].tableHeaders = headers;
                                      return next;
                                    });
                                  }}
                                />
                              ))}
                            </div>

                            {/* ROWS */}
                            {block.tableRows?.map((row, rIdx) => (
                              <div key={rIdx} className="flex gap-2 items-center">
                                {row.map((cell, cIdx) => (
                                  <input
                                    key={cIdx}
                                    className={`${fieldClass} min-w-[120px]`}
                                    value={cell}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateBlocks((list) => {
                                        const next = [...list];
                                        const rows = [...(next[idx].tableRows || [])];
                                        rows[rIdx] = [...rows[rIdx]];
                                        rows[rIdx][cIdx] = val;
                                        next[idx].tableRows = rows;
                                        return next;
                                      });
                                    }}
                                  />
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].tableRows = next[idx].tableRows?.filter((_, i) => i !== rIdx);
                                      return next;
                                    });
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-red-400 shrink-0"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {block.type === 'highlight' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select
                                className={fieldClass}
                                value={block.highlightType || 'Szakmai tipp'}
                                onChange={(e) => {
                                  const val = e.target.value as ContentBlock['highlightType'];
                                  updateBlocks((list) => {
                                    const next = [...list];
                                    next[idx].highlightType = val;
                                    return next;
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
                                placeholder="Kiemelés címe..."
                                value={block.highlightTitle || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateBlocks((list) => {
                                    const next = [...list];
                                    next[idx].highlightTitle = val;
                                    return next;
                                  });
                                }}
                              />
                            </div>
                            <textarea
                              className={`${fieldClass} resize-none`}
                              rows={2}
                              placeholder="Kiemelés szöveges tartalma..."
                              value={block.content || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateBlocks((list) => {
                                  const next = [...list];
                                  next[idx].content = val;
                                  return next;
                                });
                              }}
                            />
                          </div>
                        )}

                        {block.type === 'warning' && (
                          <div className="space-y-2">
                            <select
                              className={`${fieldClass} w-48`}
                              value={block.warningType || 'warning'}
                              onChange={(e) => {
                                const val = e.target.value as ContentBlock['warningType'];
                                updateBlocks((list) => {
                                  const next = [...list];
                                  next[idx].warningType = val;
                                  return next;
                                });
                              }}
                            >
                              <option value="warning">⚠️ Figyelem</option>
                              <option value="safety">🛑 Biztonság</option>
                              <option value="specialist">⚡ Szakember szükséges</option>
                              <option value="technical">📌 Műszaki feltétel</option>
                            </select>
                            <input
                              className={fieldClass}
                              placeholder="Figyelmeztető vagy biztonsági előírás..."
                              value={block.content || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateBlocks((list) => {
                                  const next = [...list];
                                  next[idx].content = val;
                                  return next;
                                });
                              }}
                            />
                          </div>
                        )}

                        {block.type === 'checklist' && (
                          <div className="space-y-2">
                            {block.checkItems?.map((ci, ciIdx) => (
                              <div key={ci.id} className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-gray-500 shrink-0" />
                                <input
                                  className={fieldClass}
                                  placeholder="Ellenőrző pont..."
                                  value={ci.text}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      const items = [...(next[idx].checkItems || [])];
                                      items[ciIdx].text = val;
                                      next[idx].checkItems = items;
                                      return next;
                                    });
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].checkItems = next[idx].checkItems?.filter((_, i) => i !== ciIdx);
                                      return next;
                                    });
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-red-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                updateBlocks((list) => {
                                  const next = [...list];
                                  const items = [...(next[idx].checkItems || []), { id: Date.now().toString(), text: '' }];
                                  next[idx].checkItems = items;
                                  return next;
                                });
                              }}
                              className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#252525] text-xs font-bold text-[#FFC400] rounded-lg border border-[#333] flex items-center gap-1"
                            >
                              <Plus size={14} /> Új Ellenőrző Pont
                            </button>
                          </div>
                        )}

                        {block.type === 'calculation' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>Kiinduló adatok</label>
                                <input
                                  className={fieldClass}
                                  placeholder="Pl. Fal hossza: 4m, magasság: 2.5m"
                                  value={block.calcInput || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].calcInput = val;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Képlet</label>
                                <input
                                  className={fieldClass}
                                  placeholder="Pl. 4 x 2.5 = 10 m²"
                                  value={block.calcFormula || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].calcFormula = val;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelClass}>Eredmény</label>
                                <input
                                  className={fieldClass}
                                  placeholder="Pl. 22 m² gipszkarton lap"
                                  value={block.calcResult || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].calcResult = val;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Megjegyzés / Hulladék</label>
                                <input
                                  className={fieldClass}
                                  placeholder="Pl. 10% szorzóval számolva"
                                  value={block.calcNote || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateBlocks((list) => {
                                      const next = [...list];
                                      next[idx].calcNote = val;
                                      return next;
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {block.type === 'divider' && (
                          <div className="py-2 flex items-center justify-center">
                            <div className="w-full border-t border-[#333]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ADD BLOCK TOOLBAR */}
                <div className="pt-4 border-t border-[#222] space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC400] block mb-2">
                    + Tartalom Hozzáadása:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    <button
                      type="button"
                      onClick={() => addBlock('text')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Type size={14} /> Szöveg
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('heading')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Heading size={14} /> Címsor
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('image')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ImageIcon size={14} /> Kép
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('gallery')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ImageIcon size={14} /> Galéria
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('list')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <List size={14} /> Lista
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('numbered_list')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ListOrdered size={14} /> Számozott
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('table')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <TableIcon size={14} /> Táblázat
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('highlight')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={14} /> Kiemelés
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('warning')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldAlert size={14} /> Munkavédelem
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('checklist')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckSquare size={14} /> Checklist
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('calculation')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Calculator size={14} /> Számítás
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('divider')}
                      className="px-3 py-2 bg-[#1E1E1E] hover:bg-[#282828] border border-[#333] rounded-xl text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Minus size={14} /> Elválasztó
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 4: SEO ÉS METAADATOK */}
              <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#222]">
                  <Tag size={18} className="text-[#FFC400]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#FFC400]">
                    3. SEO és Metaadatok (Opcionális)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>SEO Cím</label>
                    <input
                      className={fieldClass}
                      placeholder="Keresőoptimalizált cím..."
                      value={seo.seoTitle}
                      onChange={(e) => {
                        setSeo((prev) => ({ ...prev, seoTitle: e.target.value }));
                        setDirty(true);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Meta Leírás</label>
                    <input
                      className={fieldClass}
                      placeholder="Keresőmotor leírás..."
                      value={seo.metaDescription}
                      onChange={(e) => {
                        setSeo((prev) => ({ ...prev, metaDescription: e.target.value }));
                        setDirty(true);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Fő Kulcsszó</label>
                    <input
                      className={fieldClass}
                      placeholder="Pl. lemezmegmunkálás"
                      value={seo.primaryKeyword}
                      onChange={(e) => {
                        setSeo((prev) => ({ ...prev, primaryKeyword: e.target.value }));
                        setDirty(true);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Kapcsolódó Kulcsszavak</label>
                    <input
                      className={fieldClass}
                      placeholder="Pl. alaksajtolás, hidegalakítás, sajtolás"
                      value={seo.relatedKeywords}
                      onChange={(e) => {
                        setSeo((prev) => ({ ...prev, relatedKeywords: e.target.value }));
                        setDirty(true);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-between pt-4 border-t border-[#222] shrink-0 sticky bottom-0 bg-[#111] z-10 py-3">
                <span className="text-[11px] text-gray-500 italic">
                  Csak „Publikált” státuszú cikkek jelennek meg a nyilvános Tudástárban.
                </span>

                <div className="flex items-center gap-3">
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
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#FFC400] text-black text-xs font-black rounded-xl hover:bg-[#E6B000] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    <Save size={16} /> {saving ? 'Mentés...' : isCreate ? 'Cikk Létrehozása' : 'Módosítások Mentése'}
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
