import { supabase } from '../lib/supabase';
import { DEFAULT_ENCYCLOPEDIA_TOOLS } from './toolService';
import { DEFAULT_MATERIALS } from './materialsService';
import { fetchBooksFromCloud, getBooks } from './bookService';

export interface GlobalSearchArticleResult {
  id: string;
  title: string;
  slug?: string;
  status: string;
}

export interface GlobalSearchCategoryResult {
  id: string;
  name: string;
  slug?: string;
}

export interface GlobalSearchGlossaryResult {
  id: string;
  term: string;
  slug?: string;
  category: string | null;
}

export interface GlobalSearchToolResult {
  id: string;
  name: string;
  slug?: string;
  type: string | null;
}

export interface GlobalSearchBookResult {
  id: string;
  title: string;
  author: string | null;
}

export interface GlobalSearchUserResult {
  id: string;
  email: string | null;
  full_name: string | null;
}

export interface GlobalSearchCalculatorResult {
  id: string;
  name: string;
  tab: string;
  description: string;
}

export interface GlobalSearchMaterialResult {
  id: string;
  name: string;
  slug?: string;
  brand?: string;
  category_name?: string;
}

export interface GlobalSearchAllResult {
  articles: GlobalSearchArticleResult[];
  categories: GlobalSearchCategoryResult[];
  glossary: GlobalSearchGlossaryResult[];
  tools: GlobalSearchToolResult[];
  books: GlobalSearchBookResult[];
  users: GlobalSearchUserResult[];
  calculators: GlobalSearchCalculatorResult[];
  materials: GlobalSearchMaterialResult[];
}

export const PREDEFINED_CALCULATORS: GlobalSearchCalculatorResult[] = [
  { id: 'calc-drywall', name: 'Gipszkarton Kalkulátor', tab: 'drywall', description: 'Gipszkartonlapok, profilok, csavarok és hézagolóanyag számítás' },
  { id: 'calc-concrete', name: 'Beton & Zsaluzat Kalkulátor', tab: 'concrete', description: 'Alapozás, födém, koszorú betonmennyiség és sóder szükséglet' },
  { id: 'calc-tiling', name: 'Hidegburkolat & Csemperagasztó Kalkulátor', tab: 'tiling', description: 'Csempe, járólap, ragasztó és fugázóanyag igény felmérése' },
  { id: 'calc-insulation', name: 'Hőszigetelés & U-érték Kalkulátor', tab: 'insulation', description: 'Homlokzati és födém hőszigetelő lapok, ragasztótapasz, háló' },
  { id: 'calc-masonry', name: 'Falazat & Téglamennyiség Kalkulátor', tab: 'masonry', description: 'Égetett kerámia téglák, zsalukő és falazóhabarcs számítás' },
  { id: 'calc-roofing', name: 'Tetőfedés & Cserép Kalkulátor', tab: 'roofing', description: 'Tetőfelület, cserépdarabszám, tetőléc és fólia anyagszükséglet' },
  { id: 'calc-rafter', name: 'Szarufahossz & Tetőszerkezet Kalkulátor', tab: 'rafter', description: 'Szarufaméretezés és faanyag térfogat felmérés' },
  { id: 'calc-paint', name: 'Festék & Glettanyag Kalkulátor', tab: 'paint', description: 'Falfelületek festék- és glettszükségletének kalkulációja' },
  { id: 'calc-paving', name: 'Térkő & Szegélykő Kalkulátor', tab: 'paving', description: 'Térburkolat felület, ágyazóréteg és besöprőhomok számítás' },
  { id: 'calc-underfloor', name: 'Padlófűtés & Esztrich Kalkulátor', tab: 'underfloor', description: 'Fűtéscső hossz, osztó-gyűjtő és esztrich beton szükséglet' },
  { id: 'calc-cable', name: 'Kábel Keresztmetszet & Feszültségesés Kalkulátor', tab: 'cable', description: 'Villanyszerelési rézkábel méretezés és feszültségesés ellenőrzés' },
  { id: 'calc-earthwork', name: 'Földkitermelés & Kavicságyazat Kalkulátor', tab: 'earthwork', description: 'Földmunka térfogat és tömörödési együttható számítás' },
];

export async function searchAll(query: string, limit = 5): Promise<GlobalSearchAllResult> {
  const qLower = query.toLowerCase().trim();
  const like = `%${query}%`;

  const [arts, cats, gloss, tools, cloudBooks, users] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, slug, status')
      .ilike('title', like)
      .order('updated_at', { ascending: false })
      .limit(limit),
    supabase
      .from('categories')
      .select('id, name, slug')
      .ilike('name', like)
      .order('name')
      .limit(limit),
    supabase
      .from('glossary_terms')
      .select('id, term, slug, category')
      .ilike('term', like)
      .order('term')
      .limit(limit),
    supabase
      .from('tools')
      .select('id, name, slug, type')
      .ilike('name', like)
      .order('name')
      .limit(limit),
    fetchBooksFromCloud().catch(() => null),
    supabase
      .from('profiles')
      .select('id, email, full_name')
      .or(`email.ilike.${like},full_name.ilike.${like}`)
      .limit(limit),
  ]);

  const allBooks = cloudBooks ?? getBooks();
  const matchedBooks: GlobalSearchBookResult[] = allBooks
    .filter(
      (b) =>
        b.title.toLowerCase().includes(qLower) ||
        (b.author && b.author.toLowerCase().includes(qLower))
    )
    .slice(0, limit)
    .map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author || null,
    }));

  // Kalkulátorok szűrése
  const matchedCalcs = PREDEFINED_CALCULATORS.filter((c) =>
    c.name.toLowerCase().includes(qLower) ||
    c.description.toLowerCase().includes(qLower) ||
    c.tab.toLowerCase().includes(qLower)
  ).slice(0, limit);

  // Szerszámok egyesítése DB + beépített enciklopédia
  const dbTools = (tools.data ?? []) as GlobalSearchToolResult[];
  const localTools = DEFAULT_ENCYCLOPEDIA_TOOLS.filter((t) =>
    t.name.toLowerCase().includes(qLower) ||
    (t.type && t.type.toLowerCase().includes(qLower)) ||
    (t.keywords && t.keywords.some((k) => k.toLowerCase().includes(qLower)))
  ).map((t) => ({ id: t.id, name: t.name, slug: t.slug, type: t.type }));

  const mergedToolsMap = new Map<string, GlobalSearchToolResult>();
  dbTools.forEach((t) => mergedToolsMap.set(t.name, t));
  localTools.forEach((t) => {
    if (!mergedToolsMap.has(t.name)) {
      mergedToolsMap.set(t.name, t);
    }
  });
  const finalTools = Array.from(mergedToolsMap.values()).slice(0, limit);

  // Építőanyagok szűrése
  const localMaterials: GlobalSearchMaterialResult[] = DEFAULT_MATERIALS.filter((m) =>
    m.name.toLowerCase().includes(qLower) ||
    m.brand.toLowerCase().includes(qLower) ||
    m.category_name.toLowerCase().includes(qLower) ||
    (m.keywords && m.keywords.some((k) => k.toLowerCase().includes(qLower)))
  ).map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    brand: m.brand,
    category_name: m.category_name,
  })).slice(0, limit);

  return {
    articles: (arts.data ?? []) as GlobalSearchArticleResult[],
    categories: (cats.data ?? []) as GlobalSearchCategoryResult[],
    glossary: (gloss.data ?? []) as GlobalSearchGlossaryResult[],
    tools: finalTools,
    books: matchedBooks,
    users: (users.data ?? []) as GlobalSearchUserResult[],
    calculators: matchedCalcs,
    materials: localMaterials,
  };
}
