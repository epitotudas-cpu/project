import { supabase, type Article } from '../lib/supabase';
import { logAuditAction } from './auditLogService';

export interface ArticleWithCategory extends Article {
  categories: { name: string } | null;
}

export interface ListArticlesOptions {
  search?: string;
  status?: 'all' | Article['status'];
  articleType?: 'all' | 'hirek' | 'ujdonsagok' | 'utmutatok';
  categoryId?: string;
  partnerId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListArticlesResult {
  rows: ArticleWithCategory[];
  count: number;
}

const STORAGE_KEY = 'epitotudas_articles_v2';

export const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'art-demo-1',
    category_id: 'cat-1',
    subcategory_name: 'Gipszkarton szerelés',
    title: 'Gipszkarton válaszfal készítése lépésről lépésre',
    slug: 'gipszkarton-valaszfal-keszitese-lepesrol-lepesre',
    article_type: 'utmutatok',
    tags: ['szárazépítés', 'gipszkarton', 'válaszfal', 'útmutató', 'munkavédelem'],
    excerpt: 'Részletes, szakmai útmutató gipszkarton válaszfalak szakszerű építéséhez: kitűzés, UW/CW profilok rögzítése, hangszigetelés, kartonozás és Q2 glettelés.',
    content: "Ez a szakmai útmutató lépésről lépésre bemutatja a gipszkarton válaszfal szakszerű építésének teljes folyamatát, a pontos vázszerkezet kitűzésétől a hőszigetelés elhelyezésén át a rétegrendek rögzítéséig és a glettelésig.\n\n## Szükséges Anyagok\n\n| Anyag megnevezése | Méret / Típus | Egység | Megjegyzés |\n| --- | --- | --- | --- |\n| UW 75 profil | 75 mm / 4 m | fm | Vízszintes vezetőprofil padlóra és mennyezetre |\n| CW 75 profil | 75 mm / 2.75 m | fm | Függőleges tartóprofil 600 mm kiosztással |\n| Gipszkarton lap (RB) | 12.5 mm / 1200x2000 mm | m² | Normál beltéri szárazgipsz lap |\n| Akusztikai szigetelőszalag | 75 mm szél. | tekercs | Rezgéscsillapító PE szalag a peremprofil alá |\n| Beütődübel | 6x40 mm | doboz | UW profil rögzítéséhez aljzatra és födémre |\n| Gipszkarton csavar (TN 25) | 3.5x25 mm | doboz | Lapok vázhoz rögzítéséhez |\n| Ásványgyapot hőszigetelés | 75 mm vastag | m² | Hang- és hőszigetelő kitöltés |\n\n## Szükséges Szerszámok\n\n- [Mérőeszközök] Lézeres vízmérték, csapózsinór és mérőszalag\n- [Vágóeszközök] Kézi lemezvágó olló profilokhoz és szike a kartonhoz\n- [Gépek] Akkus csavarbehajtó mélységhatárolóval és fúrókalapács\n- [Felületképzés] Spakli, lepke glettvas és csiszolóháló\n\n## Munkavédelem & Biztonság\n\n> **🛑 BIZTONSÁG**: Ásványgyapot szigetelés vágásánál és glettelés csiszolásánál FFP2 pormaszk, védőszemüveg és munkavédelmi kesztyű használata kötelező!\n\n## Lépésenkénti Kivitelezés\n\n### 1. Lépés: Nyomvonal kitűzése és keretprofilok szerelése\n\nLézeres szintjelzővel jelöld ki a fal nyomvonalát a padlón, az oldalfalakon és a mennyezeten. Ragassz akusztikai szigetelőszalagot az UW 75 profilok talpára, majd fúrj és rögzíts beütődübellel max. 80 cm-es távolságonként.\n\n![UW profil rögzítése akusztikai szalaggal](https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80)\n*UW padlóprofil rögzítése rezgéscsillapító szalaggal*\n\n### 2. Lépés: CW profilok beállítása és tengelytávolság\n\nÁllítsd be a CW 75 függőleges tartóprofilokat az UW keretbe pontosan 600 mm tengelytávolsággal. A CW profilokat ne csavarozd mereven az UW profilhoz, hagyj 1-1.5 cm dilatációs hézagot a födémnél.\n\n### 3. Lépés: Első oldali burkolás és szigetelés\n\nRögzítsd a 12.5 mm-es gipszkarton lapokat az egyik oldalon TN 25 csavarokkal max. 25 cm-es csavartávolsággal. Ezt követően helyezd be a 75 mm-es ásványgyapot hangszigetelő táblákat hégmentesen a profilközökbe.\n\n> **[Szakmai tipp] Eltolt hézagolási szabály**\n> A kétoldali burkolat gipszkarton lapjainak függőleges és vízszintes toldásai ne essenek egy vonalba! A másik oldalon 60 cm-es eltolással indítsd a lapokat.\n\n### 4. Lépés: Másik oldali zárás és glettelés\n\nZárd be a falat a másik oldali gipszkarton burkolattal. A hézagokat erősítsd meg üvegszálas vagy papír hézagerősítő szalaggal, majd gletteld Q2 minőségben két rétegben.\n\n## Minőségellenőrző Lista\n\n- [ ] Az UW keret alatt jelen van az akusztikai szigetelőszalag\n- [ ] A CW profilok tengelytávolsága hajszálpontosan 600 mm\n- [ ] A csavarfejek nincsenek átszakadva, a kartonpapír ép\n- [ ] Az eltolt lapillesztések betartásra kerültek\n- [ ] A glettelt hézagok repedésmentesek és csiszoltak\n\n## Összefoglalás\n\nA szakszerűen megépített gipszkarton válaszfal tökéletesen sík felületet, kiváló akusztikai gátat és gyors, száraz kivitelezést biztosít.",
    author: 'ÉpítőTudás Szerkesztőség',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    status: 'published',
    rejection_note: null,
    featured: true,
    views: 1420,
    rating: 4.9,
    rating_count: 32,
    featured_image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    documents: [
      { id: 'doc-1', title: 'Gipszkarton_Szerelesi_Utmutato.pdf', file_url: '/docs/gipszkarton_utmutato.pdf', doc_type: 'utmutato', file_size: '2.4 MB' },
    ],
    read_time: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-news-1',
    category_id: 'cat-2',
    subcategory_name: 'Jogszabály & Szabvány',
    title: 'Változnak az építőipari kivitelezési szabályok és energetikai előírások',
    slug: 'valtoznak-az-epitoipari-kivitelezesi-szabalyok-es-energetikai-eloirasok',
    article_type: 'hirek',
    tags: ['hírek', 'szabvány', 'energetika', 'jogszabály', 'építésügy'],
    excerpt: 'Fontos jogszabályi változások lépnek életbe az építési engedélyezésben és az energetikai tanúsítványok követelményrendszerében.',
    content: "Az építésügyi hatóságok új rendelete szerint szigorodnak a lakóépületek hőátbocsátási tényezőire és az építési napló vezetésére vonatkozó szakmai szabályok.\n\n## Fő változások:\n- Szigorított kötelező hőszigetelési vastagságok\n- Digitális e-napló használata minden 300 m² feletti beruházásnál\n- Új minőségellenőrző szabványok a szerkezetépítésben",
    author: 'Kovács Péter Építészmérnök',
    partner_id: 'p-3',
    partner_name: 'BME Építőmérnöki Kar',
    status: 'published',
    rejection_note: null,
    featured: true,
    views: 890,
    rating: 4.8,
    rating_count: 19,
    featured_image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    read_time: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-news-2',
    category_id: 'cat-1',
    subcategory_name: 'Piaci Hírek',
    title: 'Rekordméretű építőipari szakkiállítás és konferencia indul Budapesten',
    slug: 'rekordmeretu-epitoipari-szakkiallitas-es-konferencia-indult-budapesten',
    article_type: 'hirek',
    tags: ['hírek', 'kiállítás', 'építőipar', 'konferencia', 'technológia'],
    excerpt: 'A Construma építőipari szakkiállításon idén több mint 400 kiállító mutatja be a fenntartható építészet legújabb vívmányait.',
    content: "Idén a fenntarthatóság, az okosotthon-rendszerek és az automatizált gépészeti megoldások állnak a szakkiállítás központjában.\n\n## Programok és bemutatók:\n- Építőipari robotika és lézeres méréstechnika élő bemutatók\n- Zöldhomlokzat és kőzetgyapot szigetelési szemináriumok\n- Diák és fiatal mérnök szakmai versenyek",
    author: 'ÉpítőTudás Hírszerkesztőség',
    partner_id: 'p-4',
    partner_name: 'Stahlbau Kivitelező Zrt.',
    status: 'published',
    rejection_note: null,
    featured: false,
    views: 640,
    rating: 4.9,
    rating_count: 14,
    featured_image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    read_time: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-nov-1',
    category_id: 'cat-1',
    subcategory_name: 'Innováció & Anyagok',
    title: 'Megérkeztek a legújabb ultra-könnyű hőszigetelő kerámia tégla rendszerek',
    slug: 'megerkeztek-a-legujabb-ultra-konnyu-hoszigetelo-keramia-tegla-rendszerek',
    article_type: 'ujdonsagok',
    tags: ['újdonságok', 'leier', 'tégla', 'hőszigetelés', 'innováció'],
    excerpt: 'A Leier bemutatja az új generációs kerámia falazóelemeit, amelyek beépített kőzetgyapot szigeteléssel érik el a passzívház-szintű U-értéket.',
    content: "Az új LeierPLAN kerámia falazóelemek forradalmasítják a hazai építőipart. A tégla üreges járataiba gyárilag elhelyezett kőzetgyapot hőszigetelés révén külön külső homlokzati szigetelés nélkül is teljesíthetők a legszigorúbb energiatakarékossági előírások.",
    author: 'Leier Műszaki Csapat',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    status: 'published',
    rejection_note: null,
    featured: true,
    views: 1150,
    rating: 5.0,
    rating_count: 28,
    featured_image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    read_time: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-nov-2',
    category_id: 'cat-2',
    subcategory_name: 'Intelligens Eszközök',
    title: 'Új önbeálló lézeres szintezőgépek érkeztek a szerszámpiacra',
    slug: 'uj-onbeallo-lezeres-szintezogepek-erkeztek-a-szerszampiacra',
    article_type: 'ujdonsagok',
    tags: ['újdonságok', 'méréstechnika', 'lézer', 'szintezés', 'eszközök'],
    excerpt: '360 fokos zöld lézersugárral ésBluetooth okostelefon-kapcsolattal rendelkező szintező műszerek segítenik a precíz kivitelezést.',
    content: "A zöld lézertechnológia akár négyszer jobb láthatóságot biztosít a megszokott piros lézereknél, kifejezetten erős napsütésben és csarnoképítkezéseken.",
    author: 'Műszaki Innovációs Osztály',
    partner_id: 'p-2',
    partner_name: 'Cemex Magyarország',
    status: 'published',
    rejection_note: null,
    featured: false,
    views: 780,
    rating: 4.7,
    rating_count: 16,
    featured_image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    read_time: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function getArticlesLocal(): Article[] {
  try {
    if (typeof window === 'undefined') return DEFAULT_ARTICLES;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Hiba a cikkek beolvasásakor:', e);
  }
  return DEFAULT_ARTICLES;
}

export function saveArticlesLocal(articles: Article[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
      window.dispatchEvent(new Event('articles-updated'));
    }
  } catch (e) {
    console.warn('Hiba a cikkek mentésekor:', e);
  }
}

export async function listArticles(options: ListArticlesOptions = {}): Promise<ListArticlesResult> {
  const {
    search,
    status = 'all',
    articleType = 'all',
    categoryId,
    partnerId,
    page = 1,
    pageSize = 12,
  } = options;

  try {
    let query = supabase.from('articles').select('*, categories(name)', { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (articleType !== 'all') {
      query = query.eq('article_type', articleType);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1).order('created_at', { ascending: false });

    const { data, count, error } = await query;
    if (!error && data && data.length > 0) {
      return {
        rows: (data as unknown as ArticleWithCategory[]) ?? [],
        count: count ?? data.length,
      };
    }
  } catch (err) {
    void err;
  }

  // Local Storage Fallback
  let localList = getArticlesLocal();
  if (status !== 'all') {
    localList = localList.filter((a) => a.status === status);
  }
  if (articleType !== 'all') {
    localList = localList.filter((a) => a.article_type === articleType);
  }
  if (categoryId) {
    localList = localList.filter((a) => a.category_id === categoryId);
  }
  if (partnerId) {
    localList = localList.filter((a) => a.partner_id === partnerId);
  }
  if (search) {
    const q = search.toLowerCase();
    localList = localList.filter((a) => a.title.toLowerCase().includes(q) || (a.excerpt && a.excerpt.toLowerCase().includes(q)));
  }

  const start = (page - 1) * pageSize;
  const paginated = localList.slice(start, start + pageSize).map((a) => ({
    ...a,
    categories: { name: 'Általános' },
  }));

  return {
    rows: paginated,
    count: localList.length,
  };
}

export async function getPublishedArticles(options?: {
  categoryId?: string;
  articleType?: 'all' | 'hirek' | 'ujdonsagok' | 'utmutatok';
  limit?: number;
  orderBy?: 'views' | 'rating' | 'created_at';
}): Promise<Article[]> {
  const allLocal = getArticlesLocal().filter((a) => a.status === 'published' || !a.status);

  let filtered = allLocal;
  if (options?.articleType && options.articleType !== 'all') {
    filtered = filtered.filter((a) => a.article_type === options.articleType);
  }
  if (options?.categoryId) {
    filtered = filtered.filter((a) => a.category_id === options.categoryId);
  }

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const localList = getArticlesLocal();
  const match = localList.find((a) => a.slug === slug);
  if (match) return match;
  return localList[0] || DEFAULT_ARTICLES[0];
}

export async function getPopularArticles(limit: number = 6): Promise<Article[]> {
  return getPublishedArticles({ limit, orderBy: 'views' });
}

export async function incrementArticleViews(articleId: string): Promise<number> {
  if (!articleId) return 0;
  const allLocal = getArticlesLocal();
  const updated = allLocal.map((a) => (a.id === articleId ? { ...a, views: (a.views || 0) + 1 } : a));
  saveArticlesLocal(updated);
  return (allLocal.find((a) => a.id === articleId)?.views || 0) + 1;
}

export async function getRelatedArticles(
  currentArticleId: string,
  categoryId?: string | null,
  limit: number = 3
): Promise<Article[]> {
  const allLocal = getArticlesLocal().filter((a) => a.id !== currentArticleId && a.status === 'published');
  if (categoryId) {
    const matchCat = allLocal.filter((a) => a.category_id === categoryId);
    if (matchCat.length > 0) return matchCat.slice(0, limit);
  }
  return allLocal.slice(0, limit);
}

export async function createArticle(payload: Record<string, unknown>): Promise<Article> {
  const now = new Date().toISOString();
  const newItem: Article = {
    id: `art-${Date.now()}`,
    title: (payload.title as string) || 'Cím nélkül',
    slug: (payload.slug as string) || `cikk-${Date.now()}`,
    excerpt: (payload.excerpt as string) || null,
    content: (payload.content as string) || null,
    article_type: (payload.article_type as any) || 'utmutatok',
    category_id: (payload.category_id as string) || 'cat-1',
    subcategory_name: (payload.subcategory_name as string) || null,
    tags: (payload.tags as string[]) || [],
    author: (payload.author as string) || 'ÉpítőTudás Szerkesztőség',
    partner_id: (payload.partner_id as string) || null,
    partner_name: (payload.partner_name as string) || null,
    read_time: Number(payload.read_time) || 5,
    views: 0,
    rating: 5.0,
    rating_count: 1,
    status: (payload.status as any) || 'draft',
    rejection_note: (payload.rejection_note as string) || null,
    featured: Boolean(payload.featured),
    featured_image: (payload.featured_image as string) || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    documents: (payload.documents as any) || [],
    created_at: now,
    updated_at: now,
  };

  const allLocal = getArticlesLocal();
  const updated = [newItem, ...allLocal];
  saveArticlesLocal(updated);

  try {
    await supabase.from('articles').insert(payload);
  } catch (err) {
    console.warn('Supabase article insert info:', err);
  }

  void logAuditAction('ARTICLE_CREATE', 'articles', `Új cikk létrehozva: "${newItem.title}" (${newItem.status})`);

  return newItem;
}

export async function updateArticle(id: string, payload: Record<string, unknown>): Promise<Article> {
  const allLocal = getArticlesLocal();
  let updatedArticle: Article | null = null;

  const updatedList = allLocal.map((a) => {
    if (a.id === id) {
      updatedArticle = {
        ...a,
        ...payload,
        updated_at: new Date().toISOString(),
      } as Article;
      return updatedArticle;
    }
    return a;
  });

  if (updatedArticle) {
    saveArticlesLocal(updatedList);
  }

  try {
    await supabase.from('articles').update(payload).eq('id', id);
  } catch (err) {
    console.warn('Supabase article update info:', err);
  }

  if (updatedArticle) {
    void logAuditAction('ARTICLE_UPDATE', 'articles', `Cikk frissítve: "${(updatedArticle as Article).title}"`);
  }

  return updatedArticle || (allLocal[0] as Article);
}

export async function setArticleStatus(id: string, status: Article['status'], rejectionNote?: string | null): Promise<void> {
  const allLocal = getArticlesLocal();
  let targetTitle = id;
  const updatedList = allLocal.map((a) => {
    if (a.id === id) {
      targetTitle = a.title;
      return { ...a, status, rejection_note: rejectionNote ?? null, updated_at: new Date().toISOString() };
    }
    return a;
  });
  saveArticlesLocal(updatedList);

  try {
    await supabase.from('articles').update({ status, rejection_note: rejectionNote ?? null }).eq('id', id);
  } catch (err) {
    console.warn('Supabase article status update info:', err);
  }

  void logAuditAction('ARTICLE_STATUS_CHANGE', 'articles', `Cikk státusza módosítva (${status}): "${targetTitle}"`);
}

export async function duplicateArticle(id: string): Promise<Article | null> {
  const allLocal = getArticlesLocal();
  const source = allLocal.find((a) => a.id === id);
  if (!source) return null;

  const duplicatedPayload: Record<string, unknown> = {
    ...source,
    id: `art-dup-${Date.now()}`,
    title: `${source.title} (Másolat)`,
    slug: `${source.slug}-masolat-${Date.now().toString().slice(-4)}`,
    status: 'draft',
    views: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const newArticle = await createArticle(duplicatedPayload);
  void logAuditAction('ARTICLE_DUPLICATE', 'articles', `Cikk duplikálva: "${source.title}" -> "${newArticle.title}"`);
  return newArticle;
}

export async function deleteArticle(id: string): Promise<void> {
  const allLocal = getArticlesLocal();
  const target = allLocal.find((a) => a.id === id);
  const updatedList = allLocal.filter((a) => a.id !== id);
  saveArticlesLocal(updatedList);

  try {
    await supabase.from('articles').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase article delete info:', err);
  }

  void logAuditAction('ARTICLE_DELETE', 'articles', `Cikk törölve: "${target?.title || id}"`);
}

export async function countArticles(): Promise<number> {
  return getArticlesLocal().length;
}
