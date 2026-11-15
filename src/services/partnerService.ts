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
  images?: string[];
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

const STORAGE_KEY = 'epitotudas_partners_v2';
const _SUPABASE_SYSTEM_ID = '00000000-0000-0000-0000-000000000011';
void _SUPABASE_SYSTEM_ID;

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
  references: [],
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

export const SAMPLE_ISOTERM: ExtendedPartner = {
  id: 'p-isoterm',
  name: 'IsoTerm Szigeteléstechnika Zrt.',
  official_name: 'IsoTerm Építőanyag-ipari és Szigeteléstechnikai Zrt.',
  slug: 'isoterm-szigeteles',
  category: 'gyarto',
  partner_type: 'Hőszigetelés & Anyaggyártó',
  description: 'Innovatív homlokzati EPS és szálas kőzetgyapot hőszigetelő rendszerek, lábazati XPS táblák és energiatakarékos építési megoldások gyártója.',
  detailed_description: `Az IsoTerm Szigeteléstechnika Zrt. Magyarország egyik vezető hőszigetelő rendszer gyártója és fejlesztője. Termékeink megfelelnek a legszigorúbb hazai (MSZ) és uniós épületenergetikai előírásoknak (Követelményérték U=0.20 W/m²K).

Termékkínálatunk gerincét a grafitos homlokzati polisztirol lapok, az A1 tűzvédelmi osztályú vakolható homlokzati kőzetgyapot táblák és a nagy nyomószilárdságú lábazati XPS lapok alkotják. Mérnöki csapatunk rendszergaranciával és beépítési útmutatókkal támogatja a hazai kivitelezőket.`,
  website_url: 'https://isoterm.hu',
  logo_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80',
  cover_url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1600&auto=format&fit=crop&q=80',
  logo_bg: 'white',
  is_verified: true,
  is_featured: true,
  status: 'published',
  contact_person_name: 'Horváth Péter',
  contact_person_title: 'Műszaki és Értékesítési Vezető',
  contact_email: 'iroda@isoterm.hu',
  contact_phone: '+36 1 456 7890',
  address: 'Ipari Park út 12.',
  zip_code: '2040',
  city: 'Budaörs',
  county: 'Pest vármegye',
  operating_area: 'national',
  business_hours: 'Hétfő - Péntek: 07:30 - 16:30',
  inquiry_email: 'ajanlatkeres@isoterm.hu',
  services: [
    { id: 's-iso-1', name: 'Rendszergaranciás hőszigetelés', description: 'Komplett homlokzati hőszigetelő rendszerek ragasztóval, hálóval és vékonyvakolattal', icon_category: 'shield', display_order: 1, is_active: true },
    { id: 's-iso-2', name: 'Akusztikai & Födémszigetelés', description: 'Lépéshang- és tűzvédelmi kőzetgyapot szigetelések többszintes épületekhez', icon_category: 'building', display_order: 2, is_active: true },
    { id: 's-iso-3', name: 'Energetikai anyagszámítás', description: 'Hőhídmentes csomóponti kalkuláció és rétegrend-tervezés', icon_category: 'calculator', display_order: 3, is_active: true },
  ],
  references: [
    { id: 'r-iso-1', title: 'Pannon Zöld Lakópark (120 lakás)', location: 'Győr', year: '2025', description: '15 cm vastag IsoTerm Grafitos homlokzati rendszer beépítése prémium szilikon vakolattal.', is_published: true, display_order: 1 },
    { id: 'r-iso-2', title: 'Nordic Irodaház Kőzetgyapot Szigetelés', location: 'Budapest XIII. kerület', year: '2024', description: 'A1 tűzvédelmi besorolású kőzetgyapot lamellás rendszer 6200 m² homlokzaton.', is_published: true, display_order: 2 },
  ],
  certificates: [
    { id: 'c-iso-1', title: 'ETA (Európai Műszaki Értékelés) Tanúsítvány', issuer: 'ÉMI Nonprofit Kft.', valid_until: '2029-05-31', is_published: true, display_order: 1 },
    { id: 'c-iso-2', title: 'Környezetbarát Építőanyag Védjegy', issuer: 'Környezetvédelmi Tanács', valid_until: '2028-11-30', is_published: true, display_order: 2 },
  ],
  related_content: [
    { id: 'rc-iso-1', title: 'Homlokzati és Födém Hőszigetelés Kalkulátor', type: 'kalkulator', url: '#calculations', display_order: 1 },
    { id: 'rc-iso-2', title: 'Hőhídmentes beépítés és szigetelési irányelvek', type: 'cikk', url: '#article?slug=energiahatekony-epites', display_order: 2 },
  ],
  seo_title: 'IsoTerm Szigeteléstechnika Zrt. - Prémium Hőszigetelő Rendszerek',
  seo_description: 'Minősített homlokzati EPS, XPS és kőzetgyapot hőszigetelő rendszerek gyártója.',
  is_indexable: true,
  created_at: new Date().toISOString(),
};

export const SAMPLE_DRYWALLPRO: ExtendedPartner = {
  id: 'p-drywallpro',
  name: 'DrywallPro Rendszerek Kft.',
  official_name: 'DrywallPro Építőipari és Szárazépítési Szakkereskedelmi Kft.',
  slug: 'drywallpro-rendszerek',
  category: 'kereskedo',
  partner_type: 'Szárazépítési Szakkereskedés',
  description: 'Professzionális gipszkarton lapok, akusztikai és tűzgátló válaszfal-rendszerek, UW/CW horganyzott profilok és beépítési szerszámok forgalmazója.',
  detailed_description: `A DrywallPro Rendszerek Kft. a modern szárazépítészet specialistája. Raktárkészletről kínálunk normál (RB), impregnált (RBI), tűzgátló (RF) és hanggátló prémium gipszkarton lapokat, horganyzott acélprofilokat, szintezőket és hézagoló anyagokat.

Közvetlen kapcsolatot ápolunk a szakképző intézményekkel és a gyakorló kivitelezőkkel, biztosítva a szakszerű beépítéshez szükséges elméleti és gyakorlati hátteret.`,
  website_url: 'https://drywallpro.hu',
  logo_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&auto=format&fit=crop&q=80',
  cover_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=1600&auto=format&fit=crop&q=80',
  logo_bg: 'white',
  is_verified: true,
  is_featured: true,
  status: 'published',
  contact_person_name: 'Varga Tamás',
  contact_person_title: 'Szárazépítési Szakértő',
  contact_email: 'kapcsolat@drywallpro.hu',
  contact_phone: '+36 1 345 6789',
  address: 'Profilozók útja 5.',
  zip_code: '1106',
  city: 'Budapest',
  county: 'Budapest',
  operating_area: 'national',
  business_hours: 'Hétfő - Péntek: 07:00 - 17:00',
  inquiry_email: 'rendeles@drywallpro.hu',
  services: [
    { id: 's-dw-1', name: 'Szárazépítési anyagszámítás', description: 'Komplett lap-, profil-, csavar- és glettszüskéglet számítás alaprajz alapján', icon_category: 'calculator', display_order: 1, is_active: true },
    { id: 's-dw-2', name: 'Tűzvédelmi minősített rétegrendek', description: 'EI30-EI90 tűzgátló válaszfalak és akusztikai dobozolások', icon_category: 'shield', display_order: 2, is_active: true },
    { id: 's-dw-3', name: 'Kivitelezői szerszámgép kölcsönzés', description: 'Akkus csavarozók, szalagcsiszolók és lézeres szintezők bérlése', icon_category: 'wrench', display_order: 3, is_active: true },
  ],
  references: [
    { id: 'r-dw-1', title: 'Corvin Technology Park Belsőépítészet', location: 'Budapest', year: '2025', description: '18 000 m² akusztikai álmennyezet és szárazépítési válaszfal rendszer szállítása.', is_published: true, display_order: 1 },
    { id: 'r-dw-2', title: 'Millenáris Rendezvényközpont Akusztika', location: 'Budapest', year: '2024', description: 'Perforált hangelnyelő gipszkarton panelek beépítése rejtett vázszerkezettel.', is_published: true, display_order: 2 },
  ],
  certificates: [
    { id: 'c-dw-1', title: 'Hivatalos Rendszerforgalmazói Minősítés', issuer: 'Szárazépítők Országos Szövetsége', valid_until: '2028-12-31', is_published: true, display_order: 1 },
  ],
  related_content: [
    { id: 'rc-dw-1', title: 'Gipszkarton és Szárazépítés Kalkulátor', type: 'kalkulator', url: '#calculations', display_order: 1 },
    { id: 'rc-dw-2', title: 'Gipszkartonozás és szárazépítési alapismeretek kurzus', type: 'kepzes', url: '#course-detail?slug=gipszkartonozas-es-szarazepitesi-alapismeretek', display_order: 2 },
  ],
  seo_title: 'DrywallPro Rendszerek Kft. - Szárazépítési Szakkereskedés',
  seo_description: 'Gipszkarton lapok, fémprofilok és szárazépítési rendszerek megbízható forrásból.',
  is_indexable: true,
  created_at: new Date().toISOString(),
};

export const SAMPLE_MASTERROOF: ExtendedPartner = {
  id: 'p-masterroof',
  name: 'MasterRoof Tetőcentrum Kft.',
  official_name: 'MasterRoof Tetőfedő és Épületbádogos Kivitelező Kft.',
  slug: 'masterroof-tetocentrum',
  category: 'kivitelezo',
  partner_type: 'Tetőfedő & Bádogos Szakcég',
  description: 'Prémium kerámia- és betoncserép fedések, korcolt lemezfedések, ereszek és szarufás ácsszerkezetek profi kivitelezője.',
  detailed_description: `A MasterRoof Tetőcentrum Kft. több évtizedes szakmai tapasztalattal vállalja családi házak, társasházak és műemlék jellegű épületek komplett tetőszerkezetének építését, felújítását és bádogozását.

Szakembergárdánk mesterleveles ácsokból és bádogosokból áll. Kiemelt figyelmet fordítunk az alátéthéjazatok páraáteresztő képességére, a szellőzőrések kialakítására és a viharbiztos rögzítési technológiákra.`,
  website_url: 'https://masterroof.hu',
  logo_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80',
  cover_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80',
  logo_bg: 'white',
  is_verified: true,
  is_featured: true,
  status: 'published',
  contact_person_name: 'Kovács Zoltán',
  contact_person_title: 'Tetőfedő Mester & Vezető Kivitelező',
  contact_email: 'info@masterroof.hu',
  contact_phone: '+36 30 987 6543',
  address: 'Fedélszék fasor 18.',
  zip_code: '2000',
  city: 'Szentendre',
  county: 'Pest vármegye',
  operating_area: 'county',
  business_hours: 'Hétfő - Szombat: 07:00 - 18:00',
  inquiry_email: 'tetofedes@masterroof.hu',
  services: [
    { id: 's-mr-1', name: 'Ácsszerkezet és Fedélszék építés', description: 'Hagyományos és modern ragasztott gerendás tetőszerkezetek megépítése', icon_category: 'hammer', display_order: 1, is_active: true },
    { id: 's-mr-2', name: 'Kerámia és betoncserép fedés', description: 'Viharálló rögzítés, gerincelemek, szellőzőcserepek és hófogók felszerelése', icon_category: 'building', display_order: 2, is_active: true },
    { id: 's-mr-3', name: 'Korcolt lemez és bádogos munkák', description: 'Ereszcsatornák, vápák, kémegszegélyek és modern korcolt lemezfedések', icon_category: 'wrench', display_order: 3, is_active: true },
  ],
  references: [
    { id: 'r-mr-1', title: 'Szentendrei Műemlék Polgárház Tetőfelújítás', location: 'Szentendre', year: '2025', description: 'Hódfarkú kerámia cserépfedés és vörösréz bádogozás 540 m² tetőfelületen.', is_published: true, display_order: 1 },
    { id: 'r-mr-2', title: 'Minimalista Családi Ház Korcolt Fémlemez Fedés', location: 'Telki', year: '2024', description: 'Titáncink állókorcos lemezfedés rejtett ereszcsatorna rendszerrel.', is_published: true, display_order: 2 },
  ],
  certificates: [
    { id: 'c-mr-1', title: 'ÉMSZ Mestervizsga Tanúsítvány (Tetőfedő & Bádogos)', issuer: 'Épületszigetelők, Tetőfedők és Bádogosok Magyarországi Szövetsége', valid_until: '2030-12-31', is_published: true, display_order: 1 },
  ],
  related_content: [
    { id: 'rc-mr-1', title: 'Tetőfedés és Cserépszükséglet Kalkulátor', type: 'kalkulator', url: '#calculations', display_order: 1 },
    { id: 'rc-mr-2', title: 'Tetőfedő és Bádogos szakmai ismeretek', type: 'utmutato', url: '#paths', display_order: 2 },
  ],
  seo_title: 'MasterRoof Tetőcentrum Kft. - Szakértő Tetőfedés és Bádogozás',
  seo_description: 'Magastetők és lapostetők minőségi építése, kerámia és korcolt fémlemez fedések.',
  is_indexable: true,
  created_at: new Date().toISOString(),
};

export const PILOT_PARTNERS: ExtendedPartner[] = [
  SAMPLE_78AS_EPITOK,
  SAMPLE_ISOTERM,
  SAMPLE_DRYWALLPRO,
  SAMPLE_MASTERROOF,
];

// Helper to filter out legacy demo partners
function filterDemoPartners(list: Partner[]): Partner[] {
  if (!Array.isArray(list)) return [];
  const demoIds = [
    'p-1',
    'p-2',
    'p-3',
    'p-4',
    'p-78as-epitok',
    'p-isoterm',
    'p-drywallpro',
    'p-masterroof',
  ];
  return list.filter((p) => p && !demoIds.includes(p.id));
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
  return [];
}

function saveStoredPartners(list: ExtendedPartner[]): void {
  const cleanList = filterDemoPartners(list);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
    }
  } catch (err) {
    void err;
  }
}

export async function listPartners(
  category?: string,
  limit: number = 100,
  options?: { includeInactive?: boolean }
): Promise<ExtendedPartner[]> {
  let query = supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  const { data, error } = await query;

  if (error) {
    console.error('Hiba a partnerek lekérdezésekor a Supabase-ből:', error);
    throw new Error(`Nem sikerült a partnerek betöltése az adatbázisból: ${error.message}`);
  }

  // Supabase sikeres válasz, nulla rekord -> üres tömb, nincs localStorage fallback
  if (!data || data.length === 0) {
    saveStoredPartners([]);
    return [];
  }

  // Supabase sikeres válasz, több rekord -> tiszta Supabase adatok
  const cleanSupabase = filterDemoPartners(data);
  const stored = getStoredPartners();

  const mergedList = cleanSupabase.map((sp) => {
    const spExt = sp as ExtendedPartner;
    const localExt = stored.find(
      (p) => p.id === sp.id || p.slug === sp.slug
    );
    if (!localExt) {
      return spExt;
    }
    return {
      ...localExt,
      ...spExt,
      id: sp.id,
      slug: sp.slug,
      name: sp.name,
      category: sp.category,
      description: sp.description,
      website_url: sp.website_url,
      logo_url: sp.logo_url,
      is_verified: sp.is_verified,
      services: Array.isArray(spExt.services) ? spExt.services : (localExt.services || []),
      references: localExt.references || [],
      certificates: Array.isArray(spExt.certificates) ? spExt.certificates : (localExt.certificates || []),
      related_content: Array.isArray(spExt.related_content) ? spExt.related_content : (localExt.related_content || []),
    } as ExtendedPartner;
  });

  saveStoredPartners(mergedList);

  const visibleList = options?.includeInactive
    ? mergedList
    : mergedList.filter((p) => (p.status ?? 'published') === 'published');

  if (category && category !== 'all') {
    return visibleList.filter((p) => p.category === category);
  }
  return visibleList;
}

function buildPartnerDbPayload(
  payload: Partial<ExtendedPartner> | CreatePartnerPayload,
  existing: ExtendedPartner | null,
  slugOverride?: string
): Record<string, unknown> {
  const trimOpt = (val: string | null | undefined, fallback?: string | null) =>
    val !== undefined ? (val?.trim() || null) : (fallback ?? null);

  const dbPayload: Record<string, unknown> = {
    name: payload.name !== undefined ? payload.name.trim() : existing?.name,
    slug: slugOverride ?? existing?.slug,
    category: payload.category !== undefined ? payload.category : existing?.category || 'ceg',
    description: trimOpt(payload.description, existing?.description),
    website_url: trimOpt(payload.website_url, existing?.website_url),
    logo_url: trimOpt(payload.logo_url, existing?.logo_url),
    is_verified: payload.is_verified !== undefined ? payload.is_verified : existing?.is_verified ?? true,
    status: payload.status !== undefined ? payload.status : existing?.status || 'published',
    is_featured: payload.is_featured !== undefined ? payload.is_featured : existing?.is_featured ?? false,
    official_name: trimOpt(payload.official_name, existing?.official_name),
    partner_type: trimOpt(payload.partner_type, existing?.partner_type),
    contact_person_name: trimOpt(payload.contact_person_name, existing?.contact_person_name),
    contact_person_title: trimOpt(payload.contact_person_title, existing?.contact_person_title),
    contact_email: trimOpt(payload.contact_email, existing?.contact_email),
    contact_phone: trimOpt(payload.contact_phone, existing?.contact_phone),
    address: trimOpt(payload.address, existing?.address),
    zip_code: trimOpt(payload.zip_code, existing?.zip_code),
    city: trimOpt(payload.city, existing?.city),
    county: trimOpt(payload.county, existing?.county),
    business_hours: trimOpt(payload.business_hours, existing?.business_hours),
    detailed_description: trimOpt(payload.detailed_description, existing?.detailed_description),
    cover_url: trimOpt(payload.cover_url, existing?.cover_url),
    inquiry_email: trimOpt(payload.inquiry_email, existing?.inquiry_email),
    logo_bg: payload.logo_bg !== undefined ? payload.logo_bg : existing?.logo_bg || 'white',
    operating_area: payload.operating_area !== undefined ? (payload.operating_area || null) : existing?.operating_area || null,
    social_facebook: trimOpt(payload.social_facebook, existing?.social_facebook),
    social_linkedin: trimOpt(payload.social_linkedin, existing?.social_linkedin),
    social_instagram: trimOpt(payload.social_instagram, existing?.social_instagram),
    social_youtube: trimOpt(payload.social_youtube, existing?.social_youtube),
    services: payload.services !== undefined ? payload.services : existing?.services,
    certificates: payload.certificates !== undefined ? payload.certificates : existing?.certificates,
    related_content: payload.related_content !== undefined ? payload.related_content : existing?.related_content,
    seo_title: trimOpt(payload.seo_title, existing?.seo_title),
    seo_description: trimOpt(payload.seo_description, existing?.seo_description),
    is_indexable: payload.is_indexable !== undefined ? payload.is_indexable : existing?.is_indexable ?? true,
  };

  Object.keys(dbPayload).forEach((k) => {
    if (dbPayload[k] === undefined) {
      delete dbPayload[k];
    }
  });
  return dbPayload;
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

  const insertPayload = buildPartnerDbPayload(payload, partnerObject, partnerObject.slug);
  const { data, error } = await supabase
    .from('partners')
    .insert(insertPayload as never)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Partner mentése az adatbázisba sikertelen.');
  }

  const merged = { ...partnerObject, ...data };
  const currentList = getStoredPartners();
  currentList.unshift(merged);
  saveStoredPartners(currentList);
  return merged;
}

export async function updatePartner(
  id: string,
  payload: Partial<ExtendedPartner>
): Promise<ExtendedPartner> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    throw new Error('Érvénytelen partnerazonosító: a partner mentéséhez valódi adatbázis UUID szükséges.');
  }

  const currentList = getStoredPartners();
  const index = currentList.findIndex((p) => p.id === id);
  const existing = index !== -1 ? currentList[index] : null;

  const updatedSlug = payload.slug
    ? payload.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : payload.name
    ? payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : existing?.slug;

  const updatePayload = buildPartnerDbPayload(payload, existing, updatedSlug);

  const { data: updateRes, error: updateErr } = await supabase
    .from('partners')
    .update(updatePayload)
    .eq('id', id)
    .select('*');

  if (updateErr) {
    throw new Error(`A partner mentése sikertelen az adatbázisban: ${updateErr.message}`);
  }

  if (!updateRes || updateRes.length === 0) {
    throw new Error('A partner mentése sikertelen: az adatbázisban nem található a megadott partnerrekord (0 módosított sor).');
  }

  const savedRecord = updateRes[0];
  const updatedPartner: ExtendedPartner = {
    ...(existing || {}),
    ...payload,
    ...savedRecord,
  };

  // Update local cache ONLY upon verified database update success
  if (index !== -1) {
    currentList[index] = updatedPartner;
  } else {
    currentList.unshift(updatedPartner);
  }
  saveStoredPartners(currentList);

  return updatedPartner;
}

export async function deletePartner(id: string): Promise<void> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) {
    throw new Error('Érvénytelen partnerazonosító: a törléshez valódi adatbázis UUID szükséges.');
  }

  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) {
    throw new Error(`A partner törlése sikertelen: ${error.message}`);
  }

  const list = getStoredPartners();
  const filtered = list.filter((p) => p.id !== id);
  saveStoredPartners(filtered);
}

export async function getPartnerBySlug(
  slugOrId: string,
  options?: { includeInactive?: boolean }
): Promise<ExtendedPartner | null> {
  if (!slugOrId) return null;
  const cleanKey = slugOrId.trim();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanKey);
  let query = supabase.from('partners').select('*');
  if (isUuid) {
    query = query.or(`slug.eq.${cleanKey},id.eq.${cleanKey}`);
  } else {
    query = query.eq('slug', cleanKey);
  }
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Hiba a partner lekérdezésekor a Supabase-ből:', error);
    throw new Error(`Adatbázishiba a partner lekérdezése közben: ${error.message}`);
  }

  // B) Supabase sikeres válasz, de nincs rekord -> azonnal null, nem vizsgálja a localStorage-t
  if (!data) {
    return null;
  }

  // A) Supabase sikeres válasz és létező rekord -> Supabase rekord az elsődleges
  const dataExt = data as ExtendedPartner;
  if (!options?.includeInactive && (dataExt.status ?? 'published') !== 'published') {
    return null;
  }

  const stored = getStoredPartners();
  const localExt = stored.find(
    (p) => p.slug === cleanKey || p.id === cleanKey || p.id === data.id || p.slug === data.slug
  );

  if (!localExt) {
    return dataExt;
  }

  return {
    ...localExt,
    ...dataExt,
    id: data.id,
    slug: data.slug,
    name: data.name,
    category: data.category,
    description: data.description,
    website_url: data.website_url,
    logo_url: data.logo_url,
    is_verified: data.is_verified,
    services: Array.isArray(dataExt.services) ? dataExt.services : (localExt.services || []),
    references: localExt.references || [],
    certificates: Array.isArray(dataExt.certificates) ? dataExt.certificates : (localExt.certificates || []),
    related_content: Array.isArray(dataExt.related_content) ? dataExt.related_content : (localExt.related_content || []),
  } as ExtendedPartner;
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

export interface SchoolClass {
  id: string;
  school_id: string;
  instructor_id: string;
  trade_id: string;
  name: string;
  grade?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  school_name?: string;
  instructor_name?: string;
  students_count?: number;
  active_code?: StudentInvitationCode | null;
}

export interface ClassMaterial {
  id: string;
  class_id?: string | null;
  student_id?: string | null;
  content_type: 'course' | 'article' | 'book' | 'material' | 'tool';
  content_id: string;
  assigned_by: string;
  assigned_at: string;
}

export interface StudentInvitationCode {
  id: string;
  code: string;
  school_id: string;
  instructor_id: string;
  trade_id: string;
  class_id?: string | null;
  created_by: string;
  expires_at: string;
  status: 'active' | 'inactive' | 'expired';
  usage_count: number;
  max_uses?: number | null;
  created_at: string;
  school_name?: string;
  instructor_name?: string;
  class_name?: string;
}

export interface StudentCodeInfoResult {
  valid: boolean;
  code?: string;
  school_id?: string;
  school_name?: string;
  instructor_id?: string;
  instructor_name?: string;
  trade_id?: string;
  class_id?: string;
  class_name?: string;
  class_grade?: number;
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
  class_id?: string;
  class_name?: string;
  message?: string;
}

export interface SchoolStudent {
  id: string;
  school_id: string;
  instructor_id: string;
  trade_id: string;
  class_id?: string | null;
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
  school_class?: {
    id: string;
    name: string;
    grade?: number | null;
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

  interface InstructorRow {
    user_id: string;
    trade_id?: string | null;
    profiles?: { full_name?: string | null; email?: string | null } | null;
  }
  for (const row of (data || []) as InstructorRow[]) {
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
  classId?: string | null;
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
      class_id: payload.classId ?? null,
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
 * E) Lists invitation codes generated for a school / instructor / class.
 */
export async function listStudentInvitationCodes(
  schoolId: string,
  instructorId?: string,
  classId?: string
): Promise<StudentInvitationCode[]> {
  let query = supabase
    .from('student_invitation_codes')
    .select('*, partners:school_id(name), profiles:instructor_id(full_name), school_classes:class_id(name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('listStudentInvitationCodes error notice:', error);
    return [];
  }

  type InvitationRow = StudentInvitationCode & {
    partners?: { name?: string | null } | null;
    profiles?: { full_name?: string | null } | null;
    school_classes?: { name?: string | null } | null;
  };
  return ((data || []) as InvitationRow[]).map((row) => ({
    ...row,
    school_name: row.partners?.name || 'Iskola',
    instructor_name: row.profiles?.full_name || 'Oktató',
    class_name: row.school_classes?.name || undefined,
  }));
}

/**
 * F) Fetches invitation code info (School name, Instructor name, Trade, Class) via get_student_code_info RPC.
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
 * H) Lists students enrolled in a school, optionally filtered by instructor, trade, or class.
 */
export async function listSchoolStudents(
  schoolId: string,
  instructorId?: string,
  tradeId?: string,
  classId?: string
): Promise<SchoolStudent[]> {
  let query = supabase
    .from('school_students')
    .select('*, profiles:student_id(id, full_name, email, avatar_url), instructor:instructor_id(id, full_name, email), school:school_id(id, name), school_class:class_id(id, name, grade)')
    .eq('school_id', schoolId)
    .order('joined_at', { ascending: false });

  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }

  if (tradeId) {
    query = query.eq('trade_id', tradeId);
  }

  if (classId) {
    query = query.eq('class_id', classId);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('listSchoolStudents error notice:', error);
    return [];
  }

  return (data || []) as SchoolStudent[];
}

/**
 * I) Creates a new explicit school class (e.g. "10.A", grade 10) for an instructor and trade.
 */
export async function createSchoolClass(payload: {
  schoolId: string;
  instructorId: string;
  tradeId: string;
  name: string;
  grade?: number | null;
}): Promise<SchoolClass> {
  const cleanTradeId = payload.tradeId.trim();

  // 1. Ensure instructor trade relationship exists in partner_user_trades so fk_school_classes_trade constraint passes
  try {
    await supabase.from('partner_user_trades').upsert(
      {
        partner_id: payload.schoolId,
        user_id: payload.instructorId,
        trade_id: cleanTradeId,
      },
      { onConflict: 'partner_id,user_id,trade_id' }
    );
  } catch (e) {
    console.warn('Notice ensuring partner_user_trades record:', e);
  }

  // 2. Insert into school_classes
  const { data, error } = await supabase
    .from('school_classes')
    .insert({
      school_id: payload.schoolId,
      instructor_id: payload.instructorId,
      trade_id: cleanTradeId,
      name: payload.name.trim(),
      grade: payload.grade ?? null,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Osztály létrehozása nem sikerült.');
  }

  return data as SchoolClass;
}

/**
 * J) Lists school classes for an instructor or school.
 */
export async function listInstructorClasses(
  schoolId: string,
  instructorId?: string
): Promise<SchoolClass[]> {
  let query = supabase
    .from('school_classes')
    .select(`
      *,
      partners:school_id(name),
      profiles:instructor_id(full_name)
    `)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (instructorId) {
    query = query.eq('instructor_id', instructorId);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('listInstructorClasses error notice:', error);
    return [];
  }

  type ClassRow = SchoolClass & {
    partners?: { name?: string | null } | null;
    profiles?: { full_name?: string | null } | null;
  };
  const classes: SchoolClass[] = ((data || []) as ClassRow[]).map((row) => ({
    ...row,
    school_name: row.partners?.name || 'Iskola',
    instructor_name: row.profiles?.full_name || 'Oktató',
  }));

  if (classes.length > 0) {
    const classIds = classes.map((cls) => cls.id);
    const nowIso = new Date().toISOString();

    const [{ data: codesData }, { data: studentsData }] = await Promise.all([
      supabase
        .from('student_invitation_codes')
        .select('*')
        .in('class_id', classIds)
        .eq('status', 'active')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false }),
      supabase
        .from('school_students')
        .select('class_id')
        .in('class_id', classIds),
    ]);

    const codeByClass = new Map<string, StudentInvitationCode>();
    for (const codeRow of (codesData || []) as StudentInvitationCode[]) {
      if (codeRow.class_id && !codeByClass.has(codeRow.class_id)) {
        codeByClass.set(codeRow.class_id, codeRow);
      }
    }

    const studentCountByClass = new Map<string, number>();
    for (const sRow of (studentsData || []) as Array<{ class_id: string | null }>) {
      if (sRow.class_id) {
        studentCountByClass.set(sRow.class_id, (studentCountByClass.get(sRow.class_id) || 0) + 1);
      }
    }

    for (const cls of classes) {
      cls.active_code = codeByClass.get(cls.id);
      cls.students_count = studentCountByClass.get(cls.id) || 0;
    }
  }

  return classes;
}

/**
 * K) Fetches a single school class by ID with enrolled students and active invitation code.
 */
export async function getSchoolClassById(classId: string): Promise<SchoolClass | null> {
  const { data, error } = await supabase
    .from('school_classes')
    .select(`
      *,
      partners:school_id(name),
      profiles:instructor_id(full_name)
    `)
    .eq('id', classId)
    .single();

  if (error || !data) {
    return null;
  }

  const typedData = data as SchoolClass & {
    partners?: { name?: string | null } | null;
    profiles?: { full_name?: string | null } | null;
  };
  const cls: SchoolClass = {
    ...typedData,
    school_name: typedData.partners?.name || 'Iskola',
    instructor_name: typedData.profiles?.full_name || 'Oktató',
  };

  const { data: codeData } = await supabase
    .from('student_invitation_codes')
    .select('*')
    .eq('class_id', cls.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (codeData) {
    cls.active_code = codeData as StudentInvitationCode;
  }

  const { count } = await supabase
    .from('school_students')
    .select('id', { count: 'exact', head: true })
    .eq('class_id', cls.id);

  cls.students_count = count || 0;

  return cls;
}

/**
 * L) Assigns materials to a class.
 */
export async function assignMaterialsToClass(
  classId: string,
  materials: Array<{ content_type: 'course' | 'article' | 'book' | 'material' | 'tool'; content_id: string }>
): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData.session?.user?.id;

  if (!currentUserId) {
    throw new Error('Nincs bejelentkezett munkamenet.');
  }

  if (materials.length === 0) return true;

  const records = materials.map((m) => ({
    class_id: classId,
    content_type: m.content_type,
    content_id: m.content_id,
    assigned_by: currentUserId,
  }));

  const { error } = await supabase
    .from('class_materials')
    .upsert(records, { onConflict: 'class_id,content_type,content_id' });

  if (error) {
    throw new Error(error.message || 'Tananyagok osztályhoz rendelése nem sikerült.');
  }

  return true;
}

/**
 * L2) Assigns materials to an individual student.
 */
export async function assignMaterialsToStudent(
  studentId: string,
  materials: Array<{ content_type: 'course' | 'article' | 'book' | 'material' | 'tool'; content_id: string }>
): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData.session?.user?.id;

  if (!currentUserId) {
    throw new Error('Nincs bejelentkezett munkamenet.');
  }

  if (materials.length === 0) return true;

  const records = materials.map((m) => ({
    student_id: studentId,
    content_type: m.content_type,
    content_id: m.content_id,
    assigned_by: currentUserId,
  }));

  const { error } = await supabase
    .from('class_materials')
    .upsert(records, { onConflict: 'student_id,content_type,content_id' });

  if (error) {
    throw new Error(error.message || 'Tananyagok tanulóhoz rendelése nem sikerült.');
  }

  return true;
}

/**
 * N2) Removes a material assignment from an individual student.
 */
export async function removeStudentMaterial(
  studentId: string,
  contentType: string,
  contentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('class_materials')
    .delete()
    .eq('student_id', studentId)
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  if (error) {
    throw new Error(error.message || 'Tananyag eltávolítása nem sikerült.');
  }

  return true;
}

/**
 * M) Lists materials assigned to a class.
 */
export async function listClassMaterials(classId: string): Promise<ClassMaterial[]> {
  const { data, error } = await supabase
    .from('class_materials')
    .select('*')
    .eq('class_id', classId)
    .order('assigned_at', { ascending: false });

  if (error) {
    console.warn('listClassMaterials error notice:', error);
    return [];
  }

  return (data || []) as ClassMaterial[];
}

/**
 * N) Removes a material assignment from a class.
 */
export async function removeClassMaterial(
  classId: string,
  contentType: string,
  contentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('class_materials')
    .delete()
    .eq('class_id', classId)
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  if (error) {
    throw new Error(error.message || 'Tananyag eltávolítása nem sikerült.');
  }

  return true;
}

/**
 * O) Updates a school class (name, grade, active state).
 */
export async function updateSchoolClass(
  classId: string,
  payload: { name?: string; grade?: number | null; is_active?: boolean }
): Promise<SchoolClass> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.grade !== undefined) updateData.grade = payload.grade;
  if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

  const { data, error } = await supabase
    .from('school_classes')
    .update(updateData)
    .eq('id', classId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Osztály frissítése nem sikerült.');
  }

  return data as SchoolClass;
}

/**
 * P) Deletes a school class.
 */
export async function deleteSchoolClass(classId: string): Promise<boolean> {
  const { error } = await supabase
    .from('school_classes')
    .delete()
    .eq('id', classId);

  if (error) {
    throw new Error(error.message || 'Osztály törlése nem sikerült.');
  }

  return true;
}

/**
 * Q) Removes a student from a specific class (un-assigns student, preserves user account).
 */
export async function removeStudentFromClass(studentId: string, classId: string): Promise<boolean> {
  const { error } = await supabase
    .from('school_students')
    .delete()
    .eq('student_id', studentId)
    .eq('class_id', classId);

  if (error) {
    throw new Error(error.message || 'Tanuló eltávolítása az osztályból nem sikerült.');
  }

  return true;
}

/**
 * R) Removes a teacher membership from a school (deletes partner_users link, preserves user account).
 */
export async function removeTeacherFromSchool(partnerId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('partner_users')
    .delete()
    .eq('partner_id', partnerId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message || 'Oktató eltávolítása az iskolából nem sikerült.');
  }

  return true;
}

export interface PartnerOfferItem {
  id: string;
  partner_id: string;
  title: string;
  discount: string;
  description: string;
  valid_until: string;
  expires_at?: string | null;
  views?: number;
  material_id?: string | null;
  status: 'Aktív' | 'Szüneteltetve' | 'Lejárt';
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

function isOfferNotExpired(offer: PartnerOfferItem, todayIso: string): boolean {
  if (!offer.expires_at) return true;
  return offer.expires_at >= todayIso;
}

/**
 * S) Lists partner offers for a partner (optionally filtered to active, non-expired offers only).
 */
export async function getPartnerOffers(
  partnerId: string,
  activeOnly = false
): Promise<PartnerOfferItem[]> {
  let query = supabase
    .from('partner_offers')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('status', 'Aktív');
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching partner offers:', error.message);
    throw new Error(`Nem sikerült a partneri ajánlatok betöltése: ${error.message}`);
  }
  const items = (data || []) as PartnerOfferItem[];
  if (!activeOnly) {
    return items;
  }
  const todayIso = new Date().toISOString().slice(0, 10);
  return items.filter((offer) => isOfferNotExpired(offer, todayIso));
}

/**
 * Lists all partner offers across partners for admin oversight.
 */
export async function getAllPartnerOffers(limit = 200): Promise<PartnerOfferItem[]> {
  const { data, error } = await supabase
    .from('partner_offers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Nem sikerült az ajánlatok betöltése: ${error.message}`);
  }
  return (data || []) as PartnerOfferItem[];
}

/**
 * T) Creates a new partner offer.
 */
export async function createPartnerOffer(input: {
  partner_id: string;
  title: string;
  discount?: string;
  description?: string;
  valid_until?: string;
  expires_at?: string | null;
  material_id?: string | null;
  status?: 'Aktív' | 'Szüneteltetve' | 'Lejárt';
  created_by?: string | null;
}): Promise<PartnerOfferItem> {
  const cleanExpiresAt = input.expires_at?.trim() || null;
  const cleanValidUntil = input.valid_until?.trim() || (cleanExpiresAt ? cleanExpiresAt : 'Visszavonásig');

  const { data, error } = await supabase
    .from('partner_offers')
    .insert({
      partner_id: input.partner_id,
      title: input.title.trim(),
      discount: input.discount?.trim() || 'Kiemelt ajánlat',
      description: input.description?.trim() || 'Partneri ajánlat.',
      valid_until: cleanValidUntil,
      expires_at: cleanExpiresAt,
      material_id: input.material_id?.trim() || null,
      status: input.status || 'Aktív',
      created_by: input.created_by ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Az ajánlat mentése nem sikerült.');
  }
  return data as PartnerOfferItem;
}

/**
 * U) Updates an existing partner offer (e.g., toggling status or editing fields).
 */
export async function updatePartnerOffer(
  offerId: string,
  updates: Partial<
    Pick<PartnerOfferItem, 'title' | 'discount' | 'description' | 'valid_until' | 'expires_at' | 'material_id' | 'status'>
  >
): Promise<PartnerOfferItem> {
  const { data, error } = await supabase
    .from('partner_offers')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offerId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Az ajánlat frissítése nem sikerült.');
  }
  return data as PartnerOfferItem;
}

/**
 * V) Deletes a partner offer.
 */
export async function deletePartnerOffer(offerId: string): Promise<boolean> {
  const { error } = await supabase
    .from('partner_offers')
    .delete()
    .eq('id', offerId);

  if (error) {
    throw new Error(error.message || 'Az ajánlat törlése nem sikerült.');
  }
  return true;
}

export interface PartnerAnalyticsSummary {
  profileViews: number;
  articlesCount: number;
  articleViewsSum: number;
  referencesCount: number;
  offersCount?: number;
  offerViewsSum?: number;
}

function shouldTrackViewOnce(sessionKey: string): boolean {
  if (typeof sessionStorage === 'undefined') {
    return true;
  }
  try {
    if (sessionStorage.getItem(sessionKey)) {
      return false;
    }
    sessionStorage.setItem(sessionKey, '1');
    return true;
  } catch {
    return true;
  }
}

/**
 * W) Atomically increments profile_views on a partner record via RPC (deduplicated per browser session).
 */
export async function incrementPartnerViews(partnerId: string): Promise<number> {
  if (!shouldTrackViewOnce(`viewed_partner_${partnerId}`)) {
    return 0;
  }
  try {
    const { data, error } = await supabase.rpc('increment_partner_views', {
      p_partner_id: partnerId,
    });
    if (!error && typeof data === 'number') {
      return data;
    }
  } catch (err) {
    console.warn('Error incrementing partner views:', err);
  }
  return 0;
}

/**
 * Atomically increments views on a partner offer via RPC (deduplicated per browser session).
 */
export async function incrementOfferViews(offerId: string): Promise<number> {
  if (!shouldTrackViewOnce(`viewed_offer_${offerId}`)) {
    return 0;
  }
  try {
    const { data, error } = await supabase.rpc('increment_offer_views', {
      p_offer_id: offerId,
    });
    if (!error && typeof data === 'number') {
      return data;
    }
  } catch (err) {
    console.warn('Error incrementing offer views:', err);
  }
  return 0;
}

/**
 * X) Fetches real analytics summary for a partner (profile views, partner articles & views, references, offers).
 */
export async function getPartnerAnalytics(partnerId: string): Promise<PartnerAnalyticsSummary> {
  const [partnerRes, articlesRes, refsRes, offersRes] = await Promise.all([
    supabase.from('partners').select('profile_views').eq('id', partnerId).maybeSingle(),
    supabase.from('articles').select('id, views').eq('partner_id', partnerId),
    supabase.from('partner_references').select('id', { count: 'exact', head: true }).eq('partner_id', partnerId),
    supabase.from('partner_offers').select('id, views').eq('partner_id', partnerId),
  ]);

  const profileViews = Number((partnerRes.data as { profile_views?: number } | null)?.profile_views || 0);
  const articleRows = (articlesRes.data || []) as Array<{ id: string; views?: number | null }>;
  const articlesCount = articleRows.length;
  const articleViewsSum = articleRows.reduce((sum, row) => sum + Number(row.views || 0), 0);
  const referencesCount = Number(refsRes.count || 0);
  const offerRows = (offersRes.data || []) as Array<{ id: string; views?: number | null }>;
  const offersCount = offerRows.length;
  const offerViewsSum = offerRows.reduce((sum, row) => sum + Number(row.views || 0), 0);

  return {
    profileViews,
    articlesCount,
    articleViewsSum,
    referencesCount,
    offersCount,
    offerViewsSum,
  };
}




