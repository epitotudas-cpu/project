import { supabase } from '../lib/supabase';

export interface ManagedAdPackage {
  id: string;
  name: string;
  value_promise: string;
  internal_name?: string;
  price_huf: number;
  price_type: 'fixed' | 'custom';
  currency: 'HUF' | 'EUR';
  billing_period: 'monthly' | 'quarterly' | 'annual' | 'once';
  duration_days: number;
  duration_options?: string[];
  description: string;
  features: string[];
  placements_summary?: string;
  target_audiences_summary?: string;
  impression_limit?: number | null;
  guaranteed_impressions?: number | null;
  guarantee_terms?: string | null;
  creative_updates_count: number;
  sponsored_articles_count: number;
  has_featured_profile: boolean;
  has_detailed_reports: boolean;
  cta_text: string;
  is_featured: boolean;
  is_popular: boolean;
  visibility: 'public' | 'admin_only';
  status: 'active' | 'inactive' | 'archived';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'epitotudas_managed_ad_packages_v2';

export const INITIAL_MANAGED_PACKAGES: ManagedAdPackage[] = [
  {
    id: 'pkg-bronze',
    name: 'Bronze – Láthatóság',
    value_promise: 'Célzott jelenlét',
    internal_name: 'Bronze B2B Starter',
    price_huf: 49000,
    price_type: 'fixed',
    currency: 'HUF',
    billing_period: 'monthly',
    duration_days: 30,
    duration_options: ['30 nap'],
    description: 'Azonnali célzott jelenlét releváns építőipari felületeken a márkaismertség növeléséhez.',
    features: [
      'Rotációs bannerelhelyezés oldalsávon vagy partneri ajánlókban',
      'Célzott rotációs megjelenés releváns szakmai felületeken',
      'Partneri profil az ÉpítőTudás oldalon',
      'Havi alap teljesítményriport (Megjelenések, kattintások és CTR adatai)',
    ],
    placements_summary: 'Oldalsáv és partneri ajánlók',
    target_audiences_summary: 'Általános szakmai látogatók',
    creative_updates_count: 0,
    sponsored_articles_count: 0,
    has_featured_profile: false,
    has_detailed_reports: false,
    cta_text: 'Bronze csomag kiválasztása',
    is_featured: false,
    is_popular: false,
    visibility: 'public',
    status: 'active',
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pkg-silver',
    name: 'Silver – Szakmai jelenlét',
    value_promise: 'Szakmai jelenlét',
    internal_name: 'Silver B2B Core',
    price_huf: 99000,
    price_type: 'fixed',
    currency: 'HUF',
    billing_period: 'monthly',
    duration_days: 30,
    duration_options: ['30 nap'],
    description: 'Folyamatos láthatóság a cikkoldalakon és az Eszköz & Gép katalógusban magasabb prioritással.',
    features: [
      'Megjelenés releváns szakmai cikkoldalakon',
      'Megjelenés az Eszközök & Gépek katalógusban',
      'Magasabb rotációs prioritás a hirdetési helyeken',
      'Kiemelt partneri profil & Partneri jelvény',
      'Havi részletes teljesítményriport',
      'Havi 1 kampány- vagy kreatívfrissítés',
    ],
    placements_summary: 'Cikkek, Eszközök & Gépek katalógus, oldalsávok',
    target_audiences_summary: 'Szakemberek és döntéshozók',
    creative_updates_count: 1,
    sponsored_articles_count: 0,
    has_featured_profile: true,
    has_detailed_reports: true,
    cta_text: 'Silver csomag kiválasztása',
    is_featured: false,
    is_popular: true,
    visibility: 'public',
    status: 'active',
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pkg-gold',
    name: 'Gold – Tartalmi partner',
    value_promise: 'Tartalmi partner',
    internal_name: 'Gold Content Partner',
    price_huf: 249000,
    price_type: 'fixed',
    currency: 'HUF',
    billing_period: 'monthly',
    duration_days: 30,
    duration_options: ['30 nap', '60 nap', '90 nap'],
    description: 'Exkluzív főoldali és cikkoldali megjelenés, szponzorált tartalmak és célzott elhelyezések.',
    features: [
      'Kiemelt megjelenés a főoldali partneri ajánlóban vagy top-banner rotációban',
      'Magas prioritású megjelenés releváns szakmai oldalakon',
      '1 db Szponzorált / Partneri szakmai cikk vagy ajánló',
      'Célzott elhelyezés kapcsolódó eszköz-, anyag-, szakma- vagy cikkoldalakon',
      'Kiemelt partneri profil & Részletes havi riport',
      'Havi 1 kreatív- vagy kampányfrissítés',
    ],
    placements_summary: 'Főoldal top-banner, szponzorált cikk, eszköz & anyag oldalak',
    target_audiences_summary: 'Kiemelt kivitelezők, beruházók és vásárlók',
    creative_updates_count: 1,
    sponsored_articles_count: 1,
    has_featured_profile: true,
    has_detailed_reports: true,
    cta_text: 'Gold csomag kiválasztása',
    is_featured: true,
    is_popular: false,
    visibility: 'public',
    status: 'active',
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pkg-enterprise',
    name: 'Enterprise – Egyedi partnerprogram',
    value_promise: 'Egyedi partnerprogram',
    internal_name: 'Enterprise Strategic Partner',
    price_huf: 0,
    price_type: 'custom',
    currency: 'HUF',
    billing_period: 'monthly',
    duration_days: 90,
    duration_options: ['3 hónap', '6 hónap', '12 hónap'],
    description: 'Teljes körű stratégiai partnerprogram egyedi elhelyezésekkel, szponzorációval és dedikált támogatással.',
    features: [
      'Egyedi elhelyezések & Kategória-, szakma- vagy tudástári szponzoráció',
      'Több kreatív és több egyidejű kampány',
      'Egyedi szakmai tartalom vagy esettanulmány & Dedikált partneri oldal',
      'Egyedi riportolás & Negyedéves együttműködési és kampányterv',
      'Kiemelt dedikált kapcsolattartói támogatás',
    ],
    placements_summary: 'Egyedi exkluzív elhelyezések, tudástári szponzoráció',
    target_audiences_summary: 'Teljes építőipari piac és B2B hálózat',
    creative_updates_count: 99,
    sponsored_articles_count: 99,
    has_featured_profile: true,
    has_detailed_reports: true,
    cta_text: 'Egyedi ajánlat kérése',
    is_featured: false,
    is_popular: false,
    visibility: 'public',
    status: 'active',
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getAdPackages(): Promise<ManagedAdPackage[]> {
  try {
    const { data, error } = await supabase
      .from('ad_packages')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as ManagedAdPackage[];
    }
  } catch (err) {
    console.warn('Ad packages table query warning:', err);
  }

  // Fallback to localStorage or seed data
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => a.sort_order - b.sort_order);
      }
    }
  } catch {
    // Ignore storage parse error
  }

  // Save initial seed packages to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MANAGED_PACKAGES));
  } catch {}

  return INITIAL_MANAGED_PACKAGES;
}

export async function saveAdPackage(pkg: Partial<ManagedAdPackage> & { name: string }): Promise<ManagedAdPackage> {
  const existingList = await getAdPackages();
  const now = new Date().toISOString();

  let target: ManagedAdPackage;
  if (pkg.id) {
    const foundIndex = existingList.findIndex((p) => p.id === pkg.id);
    if (foundIndex >= 0) {
      target = {
        ...existingList[foundIndex],
        ...pkg,
        updated_at: now,
      } as ManagedAdPackage;
    } else {
      target = {
        ...INITIAL_MANAGED_PACKAGES[0],
        ...pkg,
        id: pkg.id,
        created_at: now,
        updated_at: now,
      } as ManagedAdPackage;
    }
  } else {
    target = {
      id: `pkg-${Date.now()}`,
      name: pkg.name,
      value_promise: pkg.value_promise || 'Szakmai ajánlat',
      internal_name: pkg.internal_name || pkg.name,
      price_huf: pkg.price_huf ?? 0,
      price_type: pkg.price_type || (pkg.price_huf === 0 ? 'custom' : 'fixed'),
      currency: pkg.currency || 'HUF',
      billing_period: pkg.billing_period || 'monthly',
      duration_days: pkg.duration_days ?? 30,
      duration_options: pkg.duration_options || ['30 nap'],
      description: pkg.description || '',
      features: pkg.features || [],
      placements_summary: pkg.placements_summary || '',
      target_audiences_summary: pkg.target_audiences_summary || '',
      creative_updates_count: pkg.creative_updates_count ?? 0,
      sponsored_articles_count: pkg.sponsored_articles_count ?? 0,
      has_featured_profile: Boolean(pkg.has_featured_profile),
      has_detailed_reports: Boolean(pkg.has_detailed_reports),
      cta_text: pkg.cta_text || 'Ajánlat kérése',
      is_featured: Boolean(pkg.is_featured),
      is_popular: Boolean(pkg.is_popular),
      visibility: pkg.visibility || 'public',
      status: pkg.status || 'active',
      sort_order: pkg.sort_order ?? existingList.length + 1,
      created_at: now,
      updated_at: now,
    };
  }

  // Upsert to Supabase if table exists
  try {
    const { data, error } = await supabase
      .from('ad_packages')
      .upsert(target as any)
      .select('*')
      .single();

    if (!error && data) {
      target = data as ManagedAdPackage;
    }
  } catch (err) {
    console.warn('Supabase ad_packages save fallback:', err);
  }

  // Update local storage backup
  const updatedList = existingList.filter((p) => p.id !== target.id);
  updatedList.push(target);
  updatedList.sort((a, b) => a.sort_order - b.sort_order);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch {}

  return target;
}

export async function deleteAdPackage(id: string): Promise<void> {
  try {
    await supabase.from('ad_packages').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase delete error:', err);
  }

  const existingList = await getAdPackages();
  const filtered = existingList.filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

export async function duplicateAdPackage(id: string): Promise<ManagedAdPackage> {
  const existingList = await getAdPackages();
  const source = existingList.find((p) => p.id === id);
  if (!source) throw new Error('A másolandó csomag nem található.');

  const cloned: Partial<ManagedAdPackage> = {
    ...source,
    id: `pkg-${Date.now()}`,
    name: `${source.name} (Másolat)`,
    internal_name: `${source.internal_name || source.name} Copy`,
    sort_order: existingList.length + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return saveAdPackage(cloned as any);
}

export async function reorderAdPackages(orderedIds: string[]): Promise<ManagedAdPackage[]> {
  const existingList = await getAdPackages();
  const updatedList = existingList.map((pkg) => {
    const idx = orderedIds.indexOf(pkg.id);
    if (idx >= 0) {
      return { ...pkg, sort_order: idx + 1 };
    }
    return pkg;
  });

  updatedList.sort((a, b) => a.sort_order - b.sort_order);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch {}

  for (const pkg of updatedList) {
    try {
      await supabase.from('ad_packages').update({ sort_order: pkg.sort_order }).eq('id', pkg.id);
    } catch {}
  }

  return updatedList;
}
