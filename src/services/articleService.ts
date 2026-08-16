import { supabase, type Article } from '../lib/supabase';

export interface ArticleWithCategory extends Article {
  categories: { name: string } | null;
}

export interface ListArticlesOptions {
  search?: string;
  status?: 'all' | Article['status'];
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export interface ListArticlesResult {
  rows: ArticleWithCategory[];
  count: number;
}

export async function listArticles(options: ListArticlesOptions = {}): Promise<ListArticlesResult> {
  const {
    search,
    status = 'all',
    categoryId,
    page = 1,
    pageSize = 10,
  } = options;

  let query = supabase.from('articles').select('*, categories(name)', { count: 'exact' });

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1).order('updated_at', { ascending: false });

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    rows: (data as unknown as ArticleWithCategory[]) ?? [],
    count: count ?? 0,
  };
}

const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'art-1',
    category_id: 'cat-1',
    title: 'Betonozás lépésről lépésre: Alapozás, keverés és tömörítés',
    slug: 'betonozas-lepesrol-lepesre',
    excerpt: 'Átfogó útmutató a megfelelő betonösszetételről, keverési arányokról, zsaluzásról, döngölésről és utókezelésről.',
    content: `## A betonozás alapjai és előkészítése

A betonozás az építőipari kivitelezések egyik legkritikusabb folyamata. A megfelelő szilárdsági osztály (pl. C20/25) eléréséhez szigorúan be kell tartani a víz-cement tényezőt és a tömörítési technológiát.

### 1. Zsaluzás és Betonacél szerelés
- Győződj meg a zsaluzat teherbírásáról és merevítéséről.
- Használj műanyag távtartó csillagokat a megfelelő 3-5 cm-es betonfedés biztosításához.

### 2. Keverés és Bedolgozás
- A keverési arány: 1 rész cement, 3 rész sóder (0-16mm), és 0.5 rész víz.
- Betonvibrátor tüskével tömörítsd a betont a légbuborékok eltávolítására.

### 3. Utókezelés
- Nyáron naponta többször locsold és takard le fóliával a felületet a gyors kiszáradás és repedezés megelőzésére.`,
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 3420,
    rating: 4.9,
    rating_count: 15,
    featured_image: null,
    read_time: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-2',
    category_id: 'cat-1',
    title: 'Monolit vasbeton födémek méretezése és zsaluzása',
    slug: 'monolit-vasbeton-fodemek',
    excerpt: 'A B500B betonacél helyes elrendezése, távtartók használata és a födém zsaluzat teherbírása.',
    content: `## Monolit vasbeton födémek kivitelezése

A monolit födémek a legteherbíróbb szerkezetek a modern építészetben. Megfelelő méretezéssel és vasalással nagy fesztávok hidalhatók át.

### Vasalási alapelvek
- Alsó és felső acélháló elhelyezése hálós távtartó bakokkal (dramix / dista).
- A koszorúbekötések és nyíláskiváltások kiegészítő vasalása.`,
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 2150,
    rating: 4.8,
    rating_count: 10,
    featured_image: null,
    read_time: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-3',
    category_id: 'cat-2',
    title: 'Homlokzati Hőszigetelő Rendszer (THR / Dryvit) Kivitelezése',
    slug: 'homlokzati-hoszigetelo-rendszer-thr',
    excerpt: 'EPS és kőzetgyapot lapok ragasztása perem-pogácsa módszerrel, hálózás és fedővakolás.',
    content: `## Homlokzati szigetelés lépésről lépésre

A hőszigetelés csökkenti az épület hőveszteségét és megakadályozza a belső penészedést.

### Perem-pogácsa szabály
- A ragasztót mindig a lap szélén futó folytonos csíkban ÉS 3 belső pogácsában kell felhordani (legalább 40%-os felületi tapadás).
- Megakadályozza a lemez mögötti káros légáramlást.`,
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 4120,
    rating: 5.0,
    rating_count: 24,
    featured_image: null,
    read_time: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-4',
    category_id: 'cat-3',
    title: 'Összefolyók és kent vízszigetelések nedves helyiségekben',
    slug: 'osszefolyok-es-kent-vizszigeteles',
    excerpt: 'Fürdőszobai és terasz vízszigetelés kenhető fóliával és hajlatszigetelő szalaggal.',
    content: `## Vizesblokkok vízszigetelése

Zuhanyzók és épített zuhany tálcák vízzáró szigetelése kenhető folyékony fóliával.

### Csomópontok rögzítése
- Sarok- és hajlatszigetelő gumiszalag beágyazása az első réteg folyékony fóliába.
- Padlóösszefolyó gallér szakszerű tömítése.`,
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 1890,
    rating: 4.7,
    rating_count: 8,
    featured_image: null,
    read_time: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-5',
    category_id: 'cat-4',
    title: 'Védőcsövezés és vezetékezés vázkerámia falazatban',
    slug: 'vedocsovezes-es-vezetekezes',
    excerpt: 'Munkavédelmi és villamossági előírások falhorony marásnál és dobozok gipszelésénél.',
    content: `## Villanyszerelési védőcsövezés

Falhornyok marása horonymaró gép segítségével a teherhordó falak gyengítése nélkül.

### Szabályok
- Függőleges horonymarás megengedett, vízszintes marás statikailag korlátozott.
- Kismegszakítók és Fi-relék áramköri kiosztása.`,
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 2980,
    rating: 4.9,
    rating_count: 14,
    featured_image: null,
    read_time: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-6',
    category_id: 'cat-5',
    title: 'Nagyformátumú greslapok fektetése és szintező klipszek',
    slug: 'nagyformatumu-greslapok-fektetese',
    excerpt: 'Flexibilis C2TE csemperagasztó, fogazott glettvas választás és epoxi fugázás.',
    content: `## Greslapok és nagy lapok burkolása

Nagy méretű (60x60 cm feletti) burkolólapok lerakása kétoldali ragasztózással (buttering-floating).

### Kellékek
- Szintező klipszek és ékek a fogasság mentes sík felületért.
- Flexibilis C2TE / S1 osztályú ragasztó.`,
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 3100,
    rating: 4.8,
    rating_count: 18,
    featured_image: null,
    read_time: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getPublishedArticles(options?: {
  categoryId?: string;
  limit?: number;
  orderBy?: 'views' | 'rating' | 'created_at';
}): Promise<Article[]> {
  try {
    let query = supabase.from('articles').select('*').eq('status', 'published');

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    const orderColumn = options?.orderBy || 'views';
    query = query.order(orderColumn, { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    void err;
  }

  let filtered = DEFAULT_ARTICLES.filter((a) => a.status === 'published');
  if (options?.categoryId) {
    filtered = filtered.filter((a) => a.category_id === options.categoryId);
  }
  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  return filtered;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (!error && data) return data;
  } catch (err) {
    void err;
  }

  return DEFAULT_ARTICLES.find((a) => a.slug === slug) || DEFAULT_ARTICLES[0];
}

export async function getPopularArticles(limit: number = 6): Promise<Article[]> {
  return getPublishedArticles({ limit, orderBy: 'views' });
}

export async function getRelatedArticles(
  currentArticleId: string,
  categoryId?: string | null,
  limit: number = 3
): Promise<Article[]> {
  try {
    let query = supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .neq('id', currentArticleId);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.limit(limit);
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    void err;
  }

  return DEFAULT_ARTICLES.filter((a) => a.id !== currentArticleId).slice(0, limit);
}

export type ArticleInsert = Article extends infer T
  ? { [K in keyof T]: T[K] }
  : never;

export async function createArticle(payload: Record<string, unknown>): Promise<Article> {
  const res = await supabase.from('articles').insert(payload).select('*').single();
  if (res.error) throw res.error;
  return res.data as Article;
}

export async function updateArticle(id: string, payload: Record<string, unknown>): Promise<Article> {
  const res = await supabase.from('articles').update(payload).eq('id', id).select('*').single();
  if (res.error) throw res.error;
  return res.data as Article;
}

export async function setArticleStatus(id: string, status: Article['status']): Promise<void> {
  const { error } = await supabase.from('articles').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function countArticles(): Promise<number> {
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}
