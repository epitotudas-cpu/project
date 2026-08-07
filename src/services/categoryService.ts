import { supabase, type Category } from '../lib/supabase';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Szerkezetépítés',
    slug: 'szerkezetepites',
    description: 'Vasbeton szerkezetek, falazatok, zsaluzási technológiák és áthidalók.',
    icon_name: 'Layers',
    color: '#FFC400',
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop',
    featured: true,
    sort_order: 1,
    seo_title: 'Szerkezetépítés – Vasbeton, falazás és zsaluzás | Építőtudás',
    seo_description: 'Szakmai útmutatók vasbeton szerkezetekről, falazási technológiákról és áthidalókról.',
    article_count: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Szigetelés & Vízhatlanítás',
    slug: 'szigeteles',
    description: 'Homlokzati hőszigetelés (THR), kenhető vízszigetelés és talajnedvesség elleni védelem.',
    icon_name: 'Thermometer',
    color: '#3B82F6',
    image_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
    featured: true,
    sort_order: 2,
    seo_title: 'Szigetelés & Vízhatlanítás – Homlokzati hőszigetelés és vízvédelem',
    seo_description: 'Minden amit a kenhető vízszigetelésről és a homlokzati hőszigetelési rendszerekről tudni kell.',
    article_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Épületgépészet & Csőhálózat',
    slug: 'epuletgepeszet',
    description: 'Víz-, gáz-, fűtésszerelés, csőhálózatok és szellőzéstechnika.',
    icon_name: 'Droplets',
    color: '#06B6D4',
    image_url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    sort_order: 3,
    seo_title: 'Épületgépészet & Csőhálózat – Víz-, gáz-, fűtésszerelés és gépészet',
    seo_description: 'Épületgépészeti alapelvek, csőhálózat szerelés és korszerű fűtési rendszerek.',
    article_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Villanyszerelés & Hálózat',
    slug: 'villanyszereles',
    description: 'Védőcsövezés, elosztótáblák, Fi-relék, érintésvédelem és villamossági szabványok.',
    icon_name: 'Zap',
    color: '#F59E0B',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop',
    featured: true,
    sort_order: 4,
    seo_title: 'Villanyszerelés & Hálózat – Érintésvédelem és elosztók',
    seo_description: 'Villanyszerelési szabványok, Fi-relé méretezés és hálózatépítési útmutatók.',
    article_count: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-5',
    name: 'Burkolás & Finomfinis',
    slug: 'burkolas',
    description: 'Hideg- és melegburkolás, aljzatkiegyenlítés, csemperagasztási és glettelési technikák.',
    icon_name: 'Paintbrush',
    color: '#EC4899',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
    featured: true,
    sort_order: 5,
    seo_title: 'Burkolás & Finomfinis – Csempézés, aljzatkiegyenlítés és glettelés',
    seo_description: 'Hideg- és melegburkolási technikák, csemperagasztók és felületkezelés.',
    article_count: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-6',
    name: 'Gépek, Szerszámok & Mérés',
    slug: 'szerszamok-mester',
    description: 'Méréstechnika, lézeres szintezők, sarokcsiszolók és biztonságtechnika.',
    icon_name: 'Wrench',
    color: '#10B981',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    sort_order: 6,
    seo_title: 'Gépek, Szerszámok & Mérés – Építőipari szerszámok és méréstechnika',
    seo_description: 'Mérőeszközök, szintezők és profi építőipari kisgépek összehasonlítása.',
    article_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function listCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (!error && data && data.length > 0) return data;
  } catch (err) {
    void err;
  }
  return DEFAULT_CATEGORIES;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (!error && data) return data;
  } catch (err) {
    void err;
  }
  return DEFAULT_CATEGORIES.find((c) => c.slug === slug) || DEFAULT_CATEGORIES[0];
}

export async function createCategory(payload: Record<string, unknown>): Promise<Category> {
  const res = await supabase.from('categories').insert(payload).select('*').single();
  if (res.error) throw res.error;
  return res.data as Category;
}

export async function updateCategory(id: string, payload: Record<string, unknown>): Promise<Category> {
  const res = await supabase.from('categories').update(payload).eq('id', id).select('*').single();
  if (res.error) throw res.error;
  return res.data as Category;
}

export async function countArticlesByCategory(categoryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);
  if (error) throw error;
  return count ?? 0;
}

export async function countCategories(): Promise<number> {
  const { count, error } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function countArticlesForCategories(categoryIds: string[]): Promise<Map<string, number>> {
  const entries = await Promise.all(
    categoryIds.map((id) =>
      supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)
        .then(({ count, error }) => {
          if (error) throw error;
          return [id, count ?? 0] as const;
        })
    )
  );
  return new Map(entries);
}
