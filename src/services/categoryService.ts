import { supabase, type Category } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'epitotudas_custom_categories_v2';

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '61549811-6f03-4a87-b1eb-83794a7eb826',
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
    id: 'd02f8602-358b-4b5a-9f15-446c9289a3fb',
    name: 'Alapozás',
    slug: 'alapozas',
    description: 'Alapok, talajmunkák és sávalapozási technológiák.',
    icon_name: 'Home',
    color: '#3B82F6',
    image_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
    featured: true,
    sort_order: 2,
    seo_title: 'Alapozási Technológiák – Talajmunka és szerkezetalapozás',
    seo_description: 'Minden amit a sávalapokról, lemezalapozásról és munkagödrök dúcolásáról tudni kell.',
    article_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5dfdcca1-d8b0-4823-b5a0-de99afbbf36c',
    name: 'Villanyszerelés & Hálózat',
    slug: 'villanyszereles',
    description: 'Védőcsövezés, elosztótáblák, Fi-relék, érintésvédelem és villamossági szabványok.',
    icon_name: 'Zap',
    color: '#F59E0B',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop',
    featured: true,
    sort_order: 3,
    seo_title: 'Villanyszerelés & Hálózat – Érintésvédelem és elosztók',
    seo_description: 'Villanyszerelési szabványok, Fi-relé méretezés és hálózatépítési útmutatók.',
    article_count: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e3b3a6c5-20cc-42d5-b20c-14f4afc05e96',
    name: 'Épületgépészet & Csőhálózat',
    slug: 'epuletgepeszet',
    description: 'Víz-, gáz-, fűtésszerelés, csőhálózatok és szellőzéstechnika.',
    icon_name: 'Droplets',
    color: '#06B6D4',
    image_url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    sort_order: 4,
    seo_title: 'Épületgépészet & Csőhálózat – Víz-, gáz-, fűtésszerelés és gépészet',
    seo_description: 'Épületgépészeti alapelvek, csőhálózat szerelés és korszerű fűtési rendszerek.',
    article_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '0a0374c2-3fbc-4327-a0c9-232a5bbc5647',
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
    id: 'ec8befee-19d3-4f0b-87e8-e9157bb640aa',
    name: 'Tetőfedés & Bádogozás',
    slug: 'tetofedes',
    description: 'Tetőszerek, magastetők, lapostetők és bádogos ipari szigetelések.',
    icon_name: 'HardHat',
    color: '#EF4444',
    image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    sort_order: 6,
    seo_title: 'Tetőfedés & Szarufák – Magastető és szigetelési útmutatók',
    seo_description: 'Tetőfedési anyagok, cseréplécezés és bádogos vízelvezetők.',
    article_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'fc9fb546-fa12-4076-a02b-b933427a5dd9',
    name: 'Anyagismeret',
    slug: 'anyagismeret',
    description: 'Építőanyagok fizikája, szilárdsága és vegyi tulajdonságai.',
    icon_name: 'Layers',
    color: '#10B981',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    sort_order: 7,
    seo_title: 'Anyagismeret – Építőanyagok és szabványok',
    seo_description: 'Minden amit a betonról, tégláról, habarcsról és szigetelőanyagokról tudni kell.',
    article_count: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '56816cc5-9fe4-446f-a344-48306c27f3be',
    name: 'Gépek, Szerszámok & Mérés',
    slug: 'szerszamok-mester',
    description: 'Méréstechnika, lézeres szintezők, sarokcsiszolók és biztonságtechnika.',
    icon_name: 'Wrench',
    color: '#8B5CF6',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
    banner_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    sort_order: 8,
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

export async function listCategories(): Promise<Category[]> {
  const localMap = getLocalCategories();

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      // Merge with local overrides if present
      return data.map((c) => (localMap[c.id] ? { ...c, ...localMap[c.id] } : c));
    }
  } catch (err) {
    void err;
  }

  // Fallback to default categories merged with local overrides
  return DEFAULT_CATEGORIES.map((c) => (localMap[c.id] ? { ...c, ...localMap[c.id] } : c));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const list = await listCategories();
  return list.find((c) => c.slug === slug) || list[0] || null;
}

export async function createCategory(payload: Record<string, unknown>): Promise<Category> {
  let created: Category | null = null;
  let supabaseErr: unknown = null;

  try {
    const res = await supabase.from('categories').insert(payload).select('*').single();
    if (!res.error && res.data) {
      created = res.data as Category;
    } else {
      supabaseErr = res.error;
    }
  } catch (err) {
    supabaseErr = err;
  }

  if (!created) {
    // If Supabase failed or blocked RLS, construct local fallback object
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}`;
    created = {
      id: newId,
      name: String(payload.name ?? 'Új kategória'),
      slug: String(payload.slug ?? `kat-${Date.now()}`),
      description: (payload.description as string) ?? null,
      icon_name: (payload.icon_name as string) ?? 'Layers',
      color: (payload.color as string) ?? '#FFC400',
      image_url: (payload.image_url as string) ?? null,
      banner_url: (payload.banner_url as string) ?? null,
      featured: Boolean(payload.featured),
      sort_order: Number(payload.sort_order ?? 1),
      seo_title: (payload.seo_title as string) ?? null,
      seo_description: (payload.seo_description as string) ?? null,
      article_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (supabaseErr && (supabaseErr as { message?: string }).message && !/RLS|duplicate/i.test((supabaseErr as { message: string }).message)) {
      console.warn('Supabase createCategory warning:', supabaseErr);
    }
  }

  saveLocalCategory(created);
  return created;
}

export async function updateCategory(id: string, payload: Record<string, unknown>): Promise<Category> {
  let updated: Category | null = null;
  let supabaseErr: unknown = null;

  try {
    const res = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (!res.error && res.data) {
      updated = res.data as Category;
    } else {
      supabaseErr = res.error;
    }
  } catch (err) {
    supabaseErr = err;
  }

  if (!updated) {
    // Retrieve existing category from current list and merge updated payload fields
    const currentList = await listCategories();
    const existing = currentList.find((c) => c.id === id);

    if (existing) {
      updated = {
        ...existing,
        name: (payload.name as string) ?? existing.name,
        slug: (payload.slug as string) ?? existing.slug,
        description: (payload.description as string) ?? existing.description,
        icon_name: (payload.icon_name as string) ?? existing.icon_name,
        color: (payload.color as string) ?? existing.color,
        image_url: (payload.image_url as string) ?? existing.image_url,
        banner_url: (payload.banner_url as string) ?? existing.banner_url,
        featured: payload.featured !== undefined ? Boolean(payload.featured) : existing.featured,
        sort_order: payload.sort_order !== undefined ? Number(payload.sort_order) : existing.sort_order,
        seo_title: (payload.seo_title as string) ?? existing.seo_title,
        seo_description: (payload.seo_description as string) ?? existing.seo_description,
        updated_at: new Date().toISOString(),
      };
    } else {
      throw supabaseErr || new Error('Kategória nem található.');
    }
  }

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
  const entries = await Promise.all(
    categoryIds.map(async (id) => {
      const cnt = await countArticlesByCategory(id);
      return [id, cnt] as const;
    })
  );
  return new Map(entries);
}
