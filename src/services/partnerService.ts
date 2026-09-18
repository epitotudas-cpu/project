import { supabase, type Partner } from '../lib/supabase';

export type PartnerCategory =
  | 'gyarto'
  | 'kereskedo'
  | 'ceg'
  | 'iskola'
  | 'oktato'
  | 'tamogato';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  icon_category?: string;
  display_order: number;
  is_active: boolean;
}

export interface ReferenceItem {
  id: string;
  title: string;
  image_url?: string;
  location?: string;
  year?: string;
  description?: string;
  is_published: boolean;
  display_order: number;
}

export interface CertificateItem {
  id: string;
  title: string;
  issuer?: string;
  valid_until?: string;
  doc_url?: string;
  is_published: boolean;
  display_order: number;
}

export interface RelatedContentItem {
  id: string;
  title: string;
  type: string; // 'cikk' | 'utmutato' | 'kalkulator' | 'kepzes' | 'konyv'
  url: string;
  display_order: number;
}

export interface ExtendedPartner extends Partner {
  official_name?: string | null;
  partner_type?: string | null;
  detailed_description?: string | null;
  status?: 'draft' | 'published' | 'inactive';
  is_featured?: boolean;
  cover_url?: string | null;
  logo_bg?: 'white' | 'light_gray' | 'transparent';
  contact_person_name?: string | null;
  contact_person_title?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  zip_code?: string | null;
  city?: string | null;
  county?: string | null;
  operating_area?: 'local' | 'county' | 'national' | null;
  business_hours?: string | null;
  inquiry_email?: string | null;
  social_facebook?: string | null;
  social_linkedin?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  services?: ServiceItem[];
  references?: ReferenceItem[];
  certificates?: CertificateItem[];
  related_content?: RelatedContentItem[];
  seo_title?: string | null;
  seo_description?: string | null;
  is_indexable?: boolean;
}

export interface CreatePartnerPayload {
  name: string;
  category: PartnerCategory;
  slug?: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  official_name?: string;
  partner_type?: string;
  detailed_description?: string;
  status?: 'draft' | 'published' | 'inactive';
  is_featured?: boolean;
  is_verified?: boolean;
  cover_url?: string;
  logo_bg?: 'white' | 'light_gray' | 'transparent';
  contact_person_name?: string;
  contact_person_title?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  zip_code?: string;
  city?: string;
  county?: string;
  operating_area?: 'local' | 'county' | 'national';
  business_hours?: string;
  inquiry_email?: string;
  social_facebook?: string;
  social_linkedin?: string;
  social_instagram?: string;
  social_youtube?: string;
  services?: ServiceItem[];
  references?: ReferenceItem[];
  certificates?: CertificateItem[];
  related_content?: RelatedContentItem[];
  seo_title?: string;
  seo_description?: string;
  is_indexable?: boolean;
}

const STORAGE_KEY = 'epitotudas_partners_v1';
const SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000011';

export const SAMPLE_78AS_EPITOK: ExtendedPartner = {
  id: 'p-78as-epitok',
  name: '78-as Építők Kft.',
  official_name: '78-as Építőipari és Kivitelező Korlátolt Felelősségű Társaság',
  slug: '78-as-epitok',
  category: 'ceg',
  partner_type: 'Generálkivitelező Cég',
  description: 'Magas- és mélyépítési generálkivitelezésre, szerkezetépítésre és ipari csarnokok megvalósítására szakosodott elismert építőipari cég.',
  detailed_description: `A 78-as Építők Kft. több mint 15 éves tapasztalattal rendelkező hazai generálkivitelező vállalkozás. Fő szakterületünk a lakó- és ipari épületek szerkezetkész és kulcsrakész kivitelezése, valamint a műszaki ellenőrzés.

Vállalkozásunk kiemelt figyelmet fordít a korszerű MSZ és EU szabványok szerinti munkavégzésre, a környezettudatos építési technológiákra és a legújabb hőszigetelési normák betartására. Projektjeink során mérnöki precizitással és megbízható alvállalkozói hálózattal dolgozunk.`,
  website_url: 'https://78asepitok.hu',
  logo_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80',
  cover_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1600&auto=format&fit=crop&q=80',
  logo_bg: 'white',
  is_verified: true,
  is_featured: true,
  status: 'published',
  contact_person_name: 'Nagy Gábor',
  contact_person_title: 'Ügyvezető Igazgató',
  contact_email: 'info@78asepitok.hu',
  contact_phone: '+36 1 234 5678',
  address: 'Kivitelezők útja 78.',
  zip_code: '1118',
  city: 'Budapest',
  county: 'Pest vármegye',
  operating_area: 'national',
  business_hours: 'Hétfő - Péntek: 08:00 - 17:00',
  inquiry_email: 'ajanlat@78asepitok.hu',
  social_facebook: 'https://facebook.com/78asepitok',
  social_linkedin: 'https://linkedin.com/company/78asepitok',
  services: [
    { id: 's-1', name: 'Generálkivitelezés', description: 'Teljes körű projektmenedzsment a tervezéstől az átadásig', icon_category: 'building', display_order: 1, is_active: true },
    { id: 's-2', name: 'Szerkezetépítés', description: 'Monolit vasbeton és falazott szerkezetek kivitelezése', icon_category: 'hammer', display_order: 2, is_active: true },
    { id: 's-3', name: 'Energetikai korszerűsítés', description: 'Homlokzati hőszigetelés és nyílászárók cseréje', icon_category: 'shield', display_order: 3, is_active: true },
    { id: 's-4', name: 'Ipari csarnokok építése', description: 'Acélszerkezetes és prefabricated ipari létesítmények', icon_category: 'warehouse', display_order: 4, is_active: true }
  ],
  references: [
    { id: 'r-1', title: 'Buda-Garten 24 lakásos Társasház', location: 'Budapest XI. kerület', year: '2025', description: 'A-kategóriás energetikai besorolású, monolit vasbeton szerkezetű lakópark kulcsrakész kivitelezése.', image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80', is_published: true, display_order: 1 },
    { id: 'r-2', title: 'Logisztikai Központ & Raktárcsarnok', location: 'Biatorbágy', year: '2024', description: '3500 m² alapterületű acélszerkezetes raktárcsarnok és irodaház kivitelezése.', image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80', is_published: true, display_order: 2 }
  ],
  certificates: [
    { id: 'c-1', title: 'ISO 9001:2015 Minőségirányítási Rendszer', issuer: 'TÜV Rheinland', valid_until: '2028-12-31', doc_url: '', is_published: true, display_order: 1 },
    { id: 'c-2', title: 'ÉVOSZ Minősített Kivitelezői Tanúsítvány', issuer: 'Építési Vállalkozók Országos Szakszövetsége', valid_until: '2027-06-30', doc_url: '', is_published: true, display_order: 2 }
  ],
  related_content: [
    { id: 'rc-1', title: 'Falazási munkák technológiai előírásai és MSZ szabványok', type: 'cikk', url: '#article?slug=falazasi-utmutato', display_order: 1 },
    { id: 'rc-2', title: 'Homlokzati hőszigetelés kalkulátor 2026', type: 'kalkulator', url: '#calculations', display_order: 2 }
  ],
  seo_title: '78-as Építők Kft. - Minősített Építőipari Generálkivitelező',
  seo_description: 'A 78-as Építők Kft. magas- és mélyépítési generálkivitelezésre, szerkezetépítésre szakosodott minősített építőipari partner.',
  is_indexable: true,
  created_at: new Date().toISOString()
};

// Helper to filter out legacy demo partners
function filterDemoPartners(list: Partner[]): Partner[] {
  if (!Array.isArray(list)) return [SAMPLE_78AS_EPITOK];
  const demoIds = ['p-1', 'p-2', 'p-3', 'p-4'];
  const demoSlugs = ['leier-hungaria', 'cemex-magyarorszag', 'bme-epito', 'stahlbau-kivitelezo'];
  const filtered = list.filter(
    (p) => p && !demoIds.includes(p.id) && !demoSlugs.includes(p.slug)
  );

  // Ensure 78-as Építők exists in sample list
  if (!filtered.some((p) => p.slug === '78-as-epitok' || p.id === 'p-78as-epitok')) {
    filtered.unshift(SAMPLE_78AS_EPITOK);
  }
  return filtered;
}

export function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    gyarto: 'Gyártó',
    kereskedo: 'Kereskedő',
    ceg: 'Kivitelező Cég',
    iskola: 'Oktatási Intézmény',
    oktato: 'Oktató / Tréner',
    tamogato: 'Támogató',
  };
  return map[cat] || cat;
}

function getStoredPartners(): ExtendedPartner[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return filterDemoPartners(parsed) as ExtendedPartner[];
        }
      }
    }
  } catch (err) {
    void err;
  }
  return [SAMPLE_78AS_EPITOK];
}

function saveStoredPartners(list: ExtendedPartner[]): void {
  const cleanList = filterDemoPartners(list);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    }

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ID,
          name: '__SYSTEM_CONFIG_PARTNERS__',
          slug: 'system-partners-config',
          description: JSON.stringify(cleanList),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        void err;
      }
    })();
  } catch (err) {
    void err;
  }
}

export async function listPartners(category?: string): Promise<ExtendedPartner[]> {
  let listFromSupabase: Partner[] | null = null;
  try {
    let query = supabase.from('partners').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      listFromSupabase = data;
    }
  } catch (err) {
    void err;
  }

  const stored = getStoredPartners();

  if (listFromSupabase && listFromSupabase.length > 0) {
    const cleanSupabase = filterDemoPartners(listFromSupabase);
    const mergedList = cleanSupabase.map((sp) => {
      const localExt = stored.find(
        (p) => p.id === sp.id || p.slug === sp.slug || p.id === sp.slug || p.slug === sp.id
      );
      if (!localExt) {
        return sp as ExtendedPartner;
      }
      return {
        ...sp,
        ...localExt,
        id: sp.id || localExt.id,
        slug: sp.slug || localExt.slug,
        name: localExt.name || sp.name,
        category: localExt.category || sp.category,
        description: localExt.description ?? sp.description,
        website_url: localExt.website_url ?? sp.website_url,
        logo_url: localExt.logo_url ?? sp.logo_url,
        is_verified: localExt.is_verified ?? sp.is_verified,
        services: localExt.services || [],
        references: localExt.references || [],
        certificates: localExt.certificates || [],
        related_content: localExt.related_content || [],
      } as ExtendedPartner;
    });

    const supabaseIds = new Set(cleanSupabase.map((s) => s.id));
    const supabaseSlugs = new Set(cleanSupabase.map((s) => s.slug));
    const localOnly = stored.filter(
      (p) => !supabaseIds.has(p.id) && !supabaseSlugs.has(p.slug) && !supabaseIds.has(p.slug)
    );

    const fullList = [...mergedList, ...localOnly];
    saveStoredPartners(fullList);

    if (category && category !== 'all') {
      return fullList.filter((p) => p.category === category);
    }
    return fullList;
  }

  // Fallback to local storage / system config
  let list = getStoredPartners();
  if (category && category !== 'all') {
    return list.filter((p) => p.category === category);
  }
  return list;
}

export async function createPartner(payload: CreatePartnerPayload): Promise<ExtendedPartner> {
  const slug = (payload.slug || payload.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const partnerObject: ExtendedPartner = {
    id: `p-${Date.now()}`,
    name: payload.name.trim(),
    official_name: payload.official_name?.trim() || null,
    slug: slug || `partner-${Date.now()}`,
    category: payload.category,
    partner_type: payload.partner_type?.trim() || null,
    description: payload.description?.trim() || null,
    detailed_description: payload.detailed_description?.trim() || null,
    status: payload.status || 'published',
    is_featured: payload.is_featured || false,
    is_verified: payload.is_verified ?? true,
    website_url: payload.website_url?.trim() || null,
    logo_url: payload.logo_url?.trim() || null,
    cover_url: payload.cover_url?.trim() || null,
    logo_bg: payload.logo_bg || 'white',
    contact_person_name: payload.contact_person_name?.trim() || null,
    contact_person_title: payload.contact_person_title?.trim() || null,
    contact_email: payload.contact_email?.trim() || null,
    contact_phone: payload.contact_phone?.trim() || null,
    address: payload.address?.trim() || null,
    zip_code: payload.zip_code?.trim() || null,
    city: payload.city?.trim() || null,
    county: payload.county?.trim() || null,
    operating_area: payload.operating_area || null,
    business_hours: payload.business_hours?.trim() || null,
    inquiry_email: payload.inquiry_email?.trim() || null,
    social_facebook: payload.social_facebook?.trim() || null,
    social_linkedin: payload.social_linkedin?.trim() || null,
    social_instagram: payload.social_instagram?.trim() || null,
    social_youtube: payload.social_youtube?.trim() || null,
    services: payload.services || [],
    references: payload.references || [],
    certificates: payload.certificates || [],
    related_content: payload.related_content || [],
    seo_title: payload.seo_title?.trim() || null,
    seo_description: payload.seo_description?.trim() || null,
    is_indexable: payload.is_indexable ?? true,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('partners')
      .insert({
        name: partnerObject.name,
        slug: partnerObject.slug,
        category: partnerObject.category,
        description: partnerObject.description,
        website_url: partnerObject.website_url,
        logo_url: partnerObject.logo_url,
        is_verified: partnerObject.is_verified,
      })
      .select('*')
      .single();

    if (!error && data) {
      const merged = { ...partnerObject, ...data };
      const currentList = getStoredPartners();
      currentList.unshift(merged);
      saveStoredPartners(currentList);
      return merged;
    }
  } catch (err) {
    void err;
  }

  // Fallback local save
  const list = getStoredPartners();
  list.unshift(partnerObject);
  saveStoredPartners(list);
  return partnerObject;
}

export async function updatePartner(
  id: string,
  payload: Partial<ExtendedPartner>
): Promise<ExtendedPartner> {
  const currentList = getStoredPartners();
  const index = currentList.findIndex(
    (p) => p.id === id || p.slug === id || (payload.slug && p.slug === payload.slug)
  );
  const existing = index !== -1 ? currentList[index] : null;

  const updatedSlug = payload.slug
    ? payload.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : payload.name
    ? payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : existing?.slug || id;

  const updatedPartner: ExtendedPartner = {
    ...(existing || {
      id,
      name: '',
      slug: updatedSlug,
      category: 'ceg',
      is_verified: true,
      created_at: new Date().toISOString(),
    }),
    ...payload,
    name: payload.name !== undefined ? payload.name.trim() : existing?.name || '',
    slug: updatedSlug,
    category: payload.category !== undefined ? payload.category : existing?.category || 'ceg',
    description: payload.description !== undefined ? (payload.description?.trim() || null) : existing?.description || null,
    website_url: payload.website_url !== undefined ? (payload.website_url?.trim() || null) : existing?.website_url || null,
    logo_url: payload.logo_url !== undefined ? (payload.logo_url?.trim() || null) : existing?.logo_url || null,
    is_verified: payload.is_verified !== undefined ? payload.is_verified : existing?.is_verified ?? true,
  };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  try {
    const updatePayload = {
      name: updatedPartner.name,
      slug: updatedPartner.slug,
      category: updatedPartner.category,
      description: updatedPartner.description,
      website_url: updatedPartner.website_url,
      logo_url: updatedPartner.logo_url,
      is_verified: updatedPartner.is_verified,
    };
    if (isUuid) {
      await supabase.from('partners').update(updatePayload).eq('id', id);
    } else if (existing?.slug || updatedSlug) {
      await supabase.from('partners').update(updatePayload).eq('slug', existing?.slug || updatedSlug);
    }
  } catch (err) {
    console.error('Supabase partner update warning:', err);
  }

  if (index !== -1) {
    currentList[index] = updatedPartner;
  } else {
    currentList.unshift(updatedPartner);
  }
  saveStoredPartners(currentList);
  return updatedPartner;
}

export async function deletePartner(id: string): Promise<void> {
  try {
    await supabase.from('partners').delete().eq('id', id);
  } catch (err) {
    void err;
  }
  const list = getStoredPartners();
  const filtered = list.filter((p) => p.id !== id);
  saveStoredPartners(filtered);
}

export async function getPartnerBySlug(slugOrId: string): Promise<ExtendedPartner | null> {
  if (!slugOrId) return null;
  const cleanKey = slugOrId.trim();

  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .or(`slug.eq.${cleanKey},id.eq.${cleanKey}`)
      .maybeSingle();

    if (!error && data) {
      const stored = getStoredPartners();
      const localExt = stored.find((p) => p.slug === cleanKey || p.id === cleanKey);
      return { ...localExt, ...data };
    }
  } catch (err) {
    void err;
  }

  // Fallback to local storage
  const stored = getStoredPartners();
  const found = stored.find((p) => p.slug === cleanKey || p.id === cleanKey);
  if (found) return found;

  // Default fallback if requested slug is 78-as-epitok
  if (cleanKey === '78-as-epitok' || cleanKey === 'p-78as-epitok') {
    return SAMPLE_78AS_EPITOK;
  }

  // Fallback partner generator
  const readableName = cleanKey
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    id: cleanKey,
    name: readableName || 'Hivatalos Partner',
    slug: cleanKey,
    category: 'ceg',
    description: `${readableName} az ÉpítőTudás elismert szakmai partnere. Szakterülete a minőségi kivitelezés, szakképzés és szakmai alapanyagok biztosítása.`,
    website_url: null,
    logo_url: null,
    is_verified: true,
    created_at: new Date().toISOString(),
  };
}

// ===============================================================================
// SCHOOL / INSTRUCTOR / TRADE / STUDENT SERVICE LAYER INTEGRATION (STEP 2)
// ===============================================================================

export interface PartnerUserTrade {
  partner_id: string;
  user_id: string;
  trade_id: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface StudentInvitationCode {
  id: string;
  code: string;
  school_id: string;
  instructor_id: string;
  trade_id: string;
  created_by: string;
  expires_at: string;
  status: 'active' | 'inactive' | 'expired';
  usage_count: number;
  max_uses?: number | null;
  created_at: string;
  school_name?: string;
  instructor_name?: string;
}

export interface StudentCodeInfoResult {
  valid: boolean;
  code?: string;
  school_id?: string;
  school_name?: string;
  instructor_id?: string;
  instructor_name?: string;
  trade_id?: string;
  expires_at?: string;
  error?: string;
}

export interface RedeemStudentCodeResult {
  success: boolean;
  already_enrolled?: boolean;
  school_id?: string;
  school_name?: string;
  instructor_id?: string;
  instructor_name?: string;
  trade_id?: string;
  message?: string;
}

export interface SchoolStudent {
  id: string;
  school_id: string;
  instructor_id: string;
  trade_id: string;
  student_id: string;
  invitation_code_id?: string | null;
  status: 'active' | 'graduated' | 'inactive';
  joined_at: string;
  profiles?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
  instructor?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
  } | null;
  school?: {
    id: string;
    name?: string;
  } | null;
}

/**
 * A) Assigns a construction trade to a school instructor/staff member.
 */
export async function assignInstructorTrade(
  partnerId: string,
  instructorId: string,
  tradeId: string
): Promise<PartnerUserTrade> {
  const { data, error } = await supabase
    .from('partner_user_trades')
    .insert({
      partner_id: partnerId,
      user_id: instructorId,
      trade_id: tradeId.trim(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Szakma oktatóhoz rendelése nem sikerült.');
  }

  return data as PartnerUserTrade;
}

/**
 * B) Lists trades assigned to a specific school instructor.
 */
export async function listInstructorTrades(
  partnerId: string,
  instructorId: string
): Promise<PartnerUserTrade[]> {
  const { data, error } = await supabase
    .from('partner_user_trades')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('user_id', instructorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('listInstructorTrades error notice:', error);
    return [];
  }

  return (data || []) as PartnerUserTrade[];
}

/**
 * C) Lists all school instructors with their assigned trades.
 */
export async function listSchoolInstructors(
  partnerId: string
): Promise<Array<{ user_id: string; full_name?: string | null; email?: string | null; trades: string[] }>> {
  const { data, error } = await supabase
    .from('partner_user_trades')
    .select('user_id, trade_id, profiles(id, full_name, email)')
    .eq('partner_id', partnerId);

  if (error) {
    console.warn('listSchoolInstructors error notice:', error);
    return [];
  }

  const instructorMap: Record<string, { user_id: string; full_name?: string | null; email?: string | null; trades: string[] }> = {};

  for (const row of (data || []) as any[]) {
    const uid = row.user_id;
    if (!instructorMap[uid]) {
      instructorMap[uid] = {
        user_id: uid,
        full_name: row.profiles?.full_name || null,
        email: row.profiles?.email || null,
        trades: [],
      };
    }
    if (row.trade_id && !instructorMap[uid].trades.includes(row.trade_id)) {
      instructorMap[uid].trades.push(row.trade_id);
    }
  }

  return Object.values(instructorMap);
}

function generateClassCode(tradeId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const tradePrefix = tradeId.toUpperCase().substring(0, 4);
  return `ET-${tradePrefix}-${rand}`;
}

/**
 * D) Generates a reusable class invitation code for a trade taught by an instructor.
 */
export async function generateStudentInvitationCode(payload: {
  schoolId: string;
  instructorId: string;
  tradeId: string;
  expiresAt: string;
  code?: string;
  maxUses?: number;
}): Promise<StudentInvitationCode> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData.session?.user?.id;

  if (!currentUserId) {
    throw new Error('Nincs bejelentkezett felhasználói munkamenet.');
  }

  const generatedCode = payload.code?.trim().toUpperCase() || generateClassCode(payload.tradeId);

  const { data, error } = await supabase
    .from('student_invitation_codes')
    .insert({
      code: generatedCode,
      school_id: payload.schoolId,
      instructor_id: payload.instructorId,
      trade_id: payload.tradeId.trim(),
      created_by: currentUserId,
      expires_at: payload.expiresAt,
      status: 'active',
      usage_count: 0,
      max_uses: payload.maxUses ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Osztálytermi meghívókód generálása nem sikerült.');
  }

  return data as StudentInvitationCode;
}

/**
 * E) Lists invitation codes generated for a school / instructor.
 */
export async function listStudentInvitationCodes(
  schoolId: string,
  instructorId?: string
): Promise<StudentInvitationCode[]> {
  let query = supabase
    .from('student_invitation_codes')
    .select('*, partners:school_id(name), profiles:instructor_id(full_name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('listStudentInvitationCodes error notice:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    school_name: row.partners?.name || 'Iskola',
    instructor_name: row.profiles?.full_name || 'Oktató',
  })) as StudentInvitationCode[];
}

/**
 * F) Fetches invitation code info (School name, Instructor name, Trade) via get_student_code_info RPC.
 */
export async function getStudentCodeInfo(code: string): Promise<StudentCodeInfoResult> {
  const cleanCode = code.trim().toUpperCase();
  const { data, error } = await supabase.rpc('get_student_code_info', {
    input_code: cleanCode,
  });

  if (error) {
    return {
      valid: false,
      error: error.message || 'A meghívókód ellenőrzése nem sikerült.',
    };
  }

  return data as StudentCodeInfoResult;
}

/**
 * G) Redeems a student invitation code server-side via redeem_student_invitation_code RPC.
 */
export async function redeemStudentInvitationCode(code: string): Promise<RedeemStudentCodeResult> {
  const cleanCode = code.trim().toUpperCase();

  const { data, error } = await supabase.rpc('redeem_student_invitation_code', {
    input_code: cleanCode,
  });

  if (error) {
    throw new Error(error.message || 'A meghívókód beváltása nem sikerült.');
  }

  return data as RedeemStudentCodeResult;
}

/**
 * H) Lists students enrolled in a school, optionally filtered by instructor or trade.
 */
export async function listSchoolStudents(
  schoolId: string,
  instructorId?: string,
  tradeId?: string
): Promise<SchoolStudent[]> {
  let query = supabase
    .from('school_students')
    .select('*, profiles:student_id(id, full_name, email, avatar_url), instructor:instructor_id(id, full_name, email), school:school_id(id, name)')
    .eq('school_id', schoolId)
    .order('joined_at', { ascending: false });

  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }

  if (tradeId) {
    query = query.eq('trade_id', tradeId);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('listSchoolStudents error notice:', error);
    return [];
  }

  return (data || []) as SchoolStudent[];
}

