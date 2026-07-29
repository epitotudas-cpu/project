import { supabase, type Category } from '../lib/supabase';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Szerkezetépítés',
    slug: 'szerkezetepites',
    description: 'Vasbeton szerkezetek, falazatok, zsaluzási technológiák és áthidalók.',
    icon_name: 'Layers',
    color: '#FFC400',
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
