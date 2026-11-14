import { supabase, type Category } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'epitotudas_custom_categories_v2';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'hirek',
    name: 'Hírek',
    slug: 'hirek',
    description: 'Friss építőipari hírek, piaci trendek, szabályozási változások és szektorbeli események.',
    icon_name: 'FileText',
    color: '#3B82F6',
    image_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 1,
    seo_title: 'Építőipari Hírek & Események | ÉpítőTudás',
    seo_description: 'A legfrissebb építőipari hírek, jogszabályváltozások és piaci elemzések egy helyen.',
    article_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ujdonsagok',
    name: 'Újdonságok',
    slug: 'ujdonsagok',
    description: 'Innovatív építési technológiák, új gépek, szerszámok és anyagfejlesztések.',
    icon_name: 'Sparkles',
    color: '#F59E0B',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 2,
    seo_title: 'Építőipari Újdonságok & Innovációk | ÉpítőTudás',
    seo_description: 'Legújabb építőipari technológiák, anyagok és eszközfejlesztések bemutatása.',
    article_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'utmutatok',
    name: 'Útmutatók',
    slug: 'utmutatok',
    description: 'Lépésről lépésre követhető kivitelezési, szerelési és gyakorlati építési útmutatók.',
    icon_name: 'BookOpen',
    color: '#10B981',
    image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 3,
    seo_title: 'Kivitelezési & Szerelési Útmutatók | ÉpítőTudás',
    seo_description: 'Szakmai útmutatók és mesterfogások építkezéshez, felújításhoz és szereléshez.',
    article_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'szerkezetepites',
    name: 'Szerkezetépítés',
    slug: 'szerkezetepites',
    description: 'Vasbeton szerkezetek, falazatok, zsaluzási technológiák és áthidalók.',
    icon_name: 'Building',
    color: '#FFC400',
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 4,
    seo_title: 'Szerkezetépítés – Vasbeton, falazás és zsaluzás | Építőtudás',
    seo_description: 'Szakmai útmutatók vasbeton szerkezetekről, falazási technológiákról és áthidalókról.',
    article_count: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'hoszigeteles',
    name: 'Hőszigetelés',
    slug: 'hoszigeteles',
    description: 'EPS, XPS, kőzetgyapot és homlokzati hőszigetelési technológiák.',
    icon_name: 'Thermometer',
    color: '#10B981',
    image_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 5,
    seo_title: 'Hőszigetelés – EPS, kőzetgyapot és homlokzati rendszerek',
    seo_description: 'Homlokzati és lábazati hőszigetelés kivitelezése és megelőző szabályok.',
    article_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tetofedes',
    name: 'Tető',
    slug: 'tetofedes',
    description: 'Tetőszerkezetek, magastetők, lapostetők és bádogos ipari szigetelések.',
    icon_name: 'Home',
    color: '#EF4444',
    image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 6,
    seo_title: 'Tetőfedés & Szarufák – Magastető és szigetelési útmutatók',
    seo_description: 'Tetőfedési anyagok, cseréplécezés és bádogos vízelvezetők.',
    article_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'burkolas',
    name: 'Burkolás',
    slug: 'burkolas',
    description: 'Hideg- és melegburkolás, aljzatkiegyenlítés, csemperagasztási és glettelési technikák.',
    icon_name: 'Grid',
    color: '#EC4899',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 7,
    seo_title: 'Burkolás & Finomfinis – Csempézés, aljzatkiegyenlítés és glettelés',
    seo_description: 'Hideg- és melegburkolási technikák, csemperagasztók és felületkezelés.',
    article_count: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'szarazepites',
    name: 'Szárazépítés',
    slug: 'szarazepites',
    description: 'Gipszkarton válaszfalak, álmennyezetek és szárazpadló rendszerek.',
    icon_name: 'Layers',
    color: '#8B5CF6',
    image_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 8,
    seo_title: 'Szárazépítés – Gipszkartonozás, profilozás és szigetelés',
    seo_description: 'Gipszkarton vázszerkezetek, hangszigetelés és felületképzés.',
    article_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'feluletkepzes',
    name: 'Felületképzés',
    slug: 'feluletkepzes',
    description: 'Beltéri és kültéri vakolatok, glettelés, falfestés és dekoratív bevonatok.',
    icon_name: 'Paintbrush',
    color: '#F59E0B',
    image_url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 9,
    seo_title: 'Felületképzés – Glettelés, vakolás és falfestés',
    seo_description: 'Szakmai felületképzési eljárások, glettelési Q1-Q4 minőségi szintek és festési technikák.',
    article_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'epuletgepeszet',
    name: 'Épületgépészet',
    slug: 'epuletgepeszet',
    description: 'Víz-, gáz-, fűtésszerelés, csőhálózatok és szellőzéstechnika.',
    icon_name: 'Droplets',
    color: '#06B6D4',
    image_url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: false,
    sort_order: 10,
    seo_title: 'Épületgépészet & Csőhálózat – Víz-, gáz-, fűtésszerelés és gépészet',
    seo_description: 'Épületgépészeti alapelvek, csőhálózat szerelés és korszerű fűtési rendszerek.',
    article_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'villanyszereles',
    name: 'Villanyszerelés',
    slug: 'villanyszereles',
    description: 'Védőcsövezés, elosztótáblák, Fi-relék, érintésvédelem és villamossági szabványok.',
    icon_name: 'Zap',
    color: '#F59E0B',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 11,
    seo_title: 'Villanyszerelés & Hálózat – Érintésvédelem és elosztók',
    seo_description: 'Villanyszerelési szabványok, Fi-relé méretezés és hálózatépítési útmutatók.',
    article_count: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'alapozas',
    name: 'Alapozás',
    slug: 'alapozas',
    description: 'Alapok, talajmunkák és sávalapozási technológiák.',
    icon_name: 'Home',
    color: '#3B82F6',
    image_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: true,
    sort_order: 12,
    seo_title: 'Alapozási Technológiák – Talajmunka és szerkezetalapozás',
    seo_description: 'Minden amit a sávalapokról, lemezalapozásról és munkagödrök dúcolásáról tudni kell.',
    article_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'anyagismeret',
    name: 'Anyagismeret',
    slug: 'anyagismeret',
    description: 'Építőanyagok fizikája, szilárdsága és vegyi tulajdonságai.',
    icon_name: 'Layers',
    color: '#10B981',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: false,
    sort_order: 13,
    seo_title: 'Anyagismeret – Építőanyagok és szabványok',
    seo_description: 'Minden amit a betonról, tégláról, habarcsról és szigetelőanyagokról tudni kell.',
    article_count: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'szerszamok-mester',
    name: 'Gépek, Szerszámok & Mérés',
    slug: 'szerszamok-mester',
    description: 'Méréstechnika, lézeres szintezők, sarokcsiszolók és biztonságtechnika.',
    icon_name: 'Wrench',
    color: '#8B5CF6',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1200&auto=format&fit=crop',
    image_fit: 'cover',
    image_position: 'center',
    image_zoom: 100,
    featured: false,
    sort_order: 14,
    seo_title: 'Gépek, Szerszámok & Mérés – Építőipari szerszámok és méréstechnika',
    seo_description: 'Mérőeszközök, szintezők és profi építőipari kisgépek összehasonlítása.',
    article_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getLocalCategories(): Record<string, Category> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCategory(cat: Category) {
  if (typeof window === 'undefined') return;
  try {
    const map = getLocalCategories();
    map[cat.id] = cat;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

const DELETED_STORAGE_KEY = 'epitotudas_deleted_category_ids';

function getDeletedCategoryIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDeletedCategoryId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getDeletedCategoryIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

export async function listCategories(): Promise<Category[]> {
  const localMap = getLocalCategories();
  const deletedIds = getDeletedCategoryIds();

  const isPublicCategory = (c: Category) =>
    !deletedIds.includes(c.id) && !c.name.startsWith('__SYSTEM_CONFIG_');

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .not('name', 'ilike', '__SYSTEM_CONFIG_%')
      .neq('id', '00000000-0000-0000-0000-000000000001')
      .order('sort_order', { ascending: true })
      .limit(200);

    if (!error && data && data.length > 0) {
      // Merge with local overrides if present and filter system/deleted categories
      return data
        .map((c) => (localMap[c.id] ? { ...c, ...localMap[c.id] } : c))
        .filter(isPublicCategory);
    }
  } catch (err) {
    void err;
  }

  // Fallback to default categories merged with local overrides
  return DEFAULT_CATEGORIES.map((c) => (localMap[c.id] ? { ...c, ...localMap[c.id] } : c)).filter(
    isPublicCategory
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Kategória törlése sikertelen.');
  }

  addDeletedCategoryId(id);

  if (typeof window !== 'undefined') {
    try {
      const map = getLocalCategories();
      delete map[id];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const list = await listCategories();
  return list.find((c) => c.slug === slug) || list[0] || null;
}

export async function createCategory(payload: Record<string, unknown>): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert(payload).select('*').single();
  if (error || !data) {
    throw new Error(error?.message || 'Kategória létrehozása sikertelen.');
  }

  const created = data as Category;
  saveLocalCategory(created);
  return created;
}

export async function updateCategory(id: string, payload: Record<string, unknown>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Kategória frissítése sikertelen.');
  }

  const updated = data as Category;
  saveLocalCategory(updated);
  return updated;
}

export async function countArticlesByCategory(categoryId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);
    if (!error) return count ?? 0;
  } catch {
    // ignore
  }
  return 0;
}

export async function countCategories(): Promise<number> {
  const list = await listCategories();
  return list.length;
}

export async function countArticlesForCategories(categoryIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const id of categoryIds) {
    counts.set(id, 0);
  }
  if (categoryIds.length === 0) return counts;

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('category_id')
      .in('category_id', categoryIds);

    if (!error && Array.isArray(data)) {
      for (const row of data as Array<{ category_id: string | null }>) {
        if (row.category_id && counts.has(row.category_id)) {
          counts.set(row.category_id, (counts.get(row.category_id) || 0) + 1);
        }
      }
      return counts;
    }
  } catch (err) {
    console.warn('Supabase countArticlesForCategories fallback:', err);
  }

  const entries = await Promise.all(
    categoryIds.map(async (id) => {
      const cnt = await countArticlesByCategory(id);
      return [id, cnt] as const;
    })
  );
  return new Map(entries);
}

export async function deleteCategoryAndReassignArticles(
  sourceCategoryId: string,
  targetCategoryId: string
): Promise<void> {
  // Reassign local articles
  try {
    const rawArticles = localStorage.getItem('epitotudas_articles_v2');
    if (rawArticles) {
      const parsed = JSON.parse(rawArticles);
      if (Array.isArray(parsed)) {
        const updated = parsed.map((a: { category_id?: string; [key: string]: unknown }) =>
          a.category_id === sourceCategoryId ? { ...a, category_id: targetCategoryId } : a
        );
        localStorage.setItem('epitotudas_articles_v2', JSON.stringify(updated));
        window.dispatchEvent(new Event('articles-updated'));
      }
    }
  } catch (err) {
    console.warn('Reassign local articles warning:', err);
  }

  // Reassign Supabase articles
  const { error: reassignError } = await supabase
    .from('articles')
    .update({ category_id: targetCategoryId })
    .eq('category_id', sourceCategoryId);
  if (reassignError) {
    throw new Error(reassignError.message || 'Cikkek átsorolása sikertelen.');
  }

  // Delete from Supabase
  const { error: deleteError } = await supabase.from('categories').delete().eq('id', sourceCategoryId);
  if (deleteError) {
    throw new Error(deleteError.message || 'Kategória törlése sikertelen.');
  }

  // Mark category as deleted locally
  addDeletedCategoryId(sourceCategoryId);
}

