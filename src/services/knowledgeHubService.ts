import { supabase } from '../lib/supabase';

export interface EducationalDocument {
  id: string;
  name: string;
  file_url: string;
  file_type: string; // pdf, doc, etc.
  size?: string;
  description?: string;
}

export interface EducationalContentItem {
  id: string;
  hub_type: 'safety' | 'standards' | 'general';
  title: string;
  slug: string;
  summary: string;
  content: string; // Detailed content (Markdown/HTML)
  important_notes?: string | null;
  practical_examples?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  topic: string;
  standard_code?: string | null; // e.g. MSZ EN 361:2002 or 1993. évi XCIII. törvény
  target_audience: 'all' | 'students' | 'professionals';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  keywords: string[];
  tags: string[];
  documents: EducationalDocument[];
  related_rule_ids: string[];
  related_item_ids: string[];
  image_url?: string | null;
  video_url?: string | null;
  author: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  sort_order: number;
  views: number;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = 'epitotudas_knowledge_hub_items_v1';
const SUPABASE_SYSTEM_ROW_ID = '00000000-0000-0000-0000-000000000008';

export const DEFAULT_KNOWLEDGE_ITEMS: EducationalContentItem[] = [
  // ── MUNKAVÉDELEM ITEMS ──
  {
    id: 'kh-safe-001',
    hub_type: 'safety',
    title: 'Építőipari munkavédelem és egyéni védőeszközök (EVE)',
    slug: 'egyeni-vedoeszkozok-es-alapelvek',
    summary: 'A legfontosabb munkavédelmi előírások, védősisakok, védőlábbelik és egyéni védőeszközök helyes kiválasztása és használata az építési munkaterületen.',
    content: `## Munkavédelmi Alapelvek az Építőiparban

Az építéshelyszínen végzett munka fokozottan veszélyes tevékenység. Az egyéni védőeszközök (EVE) használata nem csupán jogszabályi kötelezettség, hanem a balesetek megelőzésének elsődleges eszköze.

### Kötelező Alapvető Védőfelszerelések:
1. **Munkavédelmi védősisak (EN 397):** Fejsérülések megelőzése leeső tárgyak és tárgyütközés ellen.
2. **Biztonsági védőlábbeli (S3 / EN ISO 20345):** Acél/kompozit orrmerevítővel és átszúrásmentes talppal rendelkező bakancs.
3. **Láthatósági védőruházat (EN ISO 20471):** Megfelelő fényvisszaverő csíkokkal ellátott mellény vagy kabát.
4. **Védőszemüveg és hallásvédő:** Por, forgács és kemény zajártalom ellen.`,
    important_notes: 'Minden munkavállaló köteles a számára biztosított védőeszközöket rendeltetésszerűen használni és azok épségét a munka megkezdése előtt ellenőrizni!',
    practical_examples: 'Esettanulmány: Egy 4 méter magas zsaluzási munkánál az acélbetétes bakancs megakadályozta egy lezuhanó gerenda miatti lábfejtörést, míg a sisak tompította a leeső zsalukapocs ütését.',
    category_id: 'cat-news-001',
    category_name: 'Építőipari munkavédelem',
    topic: 'Egyéni védőeszközök',
    standard_code: '1993. évi XCIII. törvény / EN ISO 20345',
    target_audience: 'all',
    difficulty_level: 'beginner',
    keywords: ['védőeszköz', 'munkavédelem', 'sisak', 'munkavédelmi bakancs', 'láthatósági mellény'],
    tags: ['munkavédelem', 'egyéni védőeszköz', 'biztonság'],
    documents: [
      {
        id: 'doc-001',
        name: 'Munkavédelmi_Egyéni_Védőeszközök_Jegyzéke.pdf',
        file_url: '/docs/munkavedelem_eve_utmutato.pdf',
        file_type: 'pdf',
        size: '1.4 MB',
        description: 'Hivatalos útmutató az építőipari egyéni védőeszközök besorolásához.',
      },
    ],
    related_rule_ids: ['kh-std-001'],
    related_item_ids: ['kh-safe-002'],
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    author: 'ÉpítőTudás Munkavédelmi Szakértői Csoport',
    status: 'published',
    featured: true,
    sort_order: 1,
    views: 342,
    seo_title: 'Munkavédelem és Egyéni Védőeszközök | ÉpítőTudás',
    seo_description: 'Részletes munkavédelmi útmutató építőipari védőeszközökről és biztonsági előírásokról.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'kh-safe-002',
    hub_type: 'safety',
    title: 'Magasban végzett munka és állványozási biztonságtechnika',
    slug: 'magasban-vegzett-munka-es-allvanyozas',
    summary: 'Leesés elleni védelem, védőkorlátok, kikötési pontok és homlokzati állványok biztonsági vizsgálatai.',
    content: `## Magasban Végzett Munka Előírásai

A 2 métert meghaladó szintkülönbség esetén a leesés elleni védelmet kollektív (korlátok, védőhálók) vagy egyéni kikötési rendszerekkel kell biztosítani.

### Állványzatok Biztonsági Előírásai:
- Homlokzati állványt csak szakképzett személy építhet és adhat át működésre.
- Minden állványszintet teljes felületű padlóval, 1,00 m magas védőkorláttal, közbenső léccel és legalább 15 cm-es lábléccel kell ellátni.
- Szeles, jeges időben a magasban végzett munkát azonnal fel kell függeszteni.`,
    important_notes: 'A leesés elleni egyéni védőeszközöket (hámok, energiaelnyelők, kikötőkötelek) 12 havonta felülvizsgálatra kell küldeni!',
    practical_examples: 'Gyakorlati tanács: Állvány átvételekor ellenőrizze a zöld színű átadási bárcát és a kikötési pontok teherbírását!',
    category_id: 'cat-news-001',
    category_name: 'Építőipari munkavédelem',
    topic: 'Magasban végzett munka',
    standard_code: 'MSZ EN 361:2002 / 4/2002. (II. 20.) SzCsM-EüM rendelet',
    target_audience: 'professionals',
    difficulty_level: 'intermediate',
    keywords: ['állványozás', 'leesés elleni védelem', 'magasban végzett munka', 'kikötési pont', 'biztonsági hám'],
    tags: ['állvány', 'magasban végzett munka', 'leesés elleni védelem'],
    documents: [
      {
        id: 'doc-002',
        name: 'Állványzat_Biztonsági_Átadási_Csekklista.pdf',
        file_url: '/docs/allvanyozas_csekklista.pdf',
        file_type: 'pdf',
        size: '890 KB',
        description: 'Munkaterületi ellenőrző lista homlokzati és gurulóállványok használatbavételéhez.',
      },
    ],
    related_rule_ids: ['kh-std-001'],
    related_item_ids: ['kh-safe-001'],
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?q=80&w=800&auto=format&fit=crop',
    video_url: null,
    author: 'Munkavédelmi Mestermérnök',
    status: 'published',
    featured: true,
    sort_order: 2,
    views: 289,
    seo_title: 'Magasban végzett munka és állványozás | ÉpítőTudás',
    seo_description: 'Munkavédelmi előírások magasban végzett munkákhoz, kikötési pontokhoz és állványozáshoz.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // ── SZABÁLYOK, SZABVÁNYOK ITEMS ──
  {
    id: 'kh-std-001',
    hub_type: 'standards',
    title: 'MSZ EN 361:2002 – Egyéni védőeszközök magasból való leesés ellen. Teljes testhevederzetek',
    slug: 'msz-en-361-2002-testhevederzetek',
    summary: 'A leesés elleni teljes testhevederzetek műszaki követelményei, vizsgálati módszerei, jelölése és használati útmutatója.',
    content: `## MSZ EN 361:2002 Szabvány Részletes Ismertetése

Ez a szabvány határozza meg a magasból való leesés elleni védelemre szolgáló teljes testhevederzetek műszaki paramétereit.

### Főbb követelmények:
- **Hevederszalagok szélessége:** Minimum 40 mm a főhevedernél.
- **Teherbírás:** Legalább 15 kN statikus húzóerő ellenállás.
- **Kikötési pontok jelölése:** A hátoldali és mellkasi kikötési pontokat jól látható **'A'** betűvel kell megjelölni.
- **Csatolási mechanizmus:** Önzáró vagy csavaros biztonsági csatok használata kötelező.`,
    important_notes: 'A hevederzetet leesés megtartása után azonnal ki kell vonni a használatból és le kell selejtezni!',
    practical_examples: 'Gyakorlati alkalmazás: Állványozók és tetőfedők munka közben kizárólag a szabványnak megfelelő, érvényes felülvizsgálati matricával ellátott hevedereket használhatnak.',
    category_id: 'cat-guides-003',
    category_name: 'Szabványok & Jogszabályok',
    topic: 'Munkavédelmi szabványok',
    standard_code: 'MSZ EN 361:2002',
    target_audience: 'professionals',
    difficulty_level: 'advanced',
    keywords: ['MSZ EN 361', 'testheveder', 'szabvány', 'leesés elleni védelem'],
    tags: ['szabvány', 'MSZ EN 361', 'munkavédelem'],
    documents: [
      {
        id: 'doc-std-001',
        name: 'MSZ_EN_361_Szabványösszefoglaló_Útmutató.pdf',
        file_url: '/docs/msz_en_361_osszegzes.pdf',
        file_type: 'pdf',
        size: '2.1 MB',
        description: 'Hivatalos kivonat és gyakorlati magyarázat az MSZ EN 361 szabványhoz.',
      },
    ],
    related_rule_ids: ['kh-std-002'],
    related_item_ids: ['kh-safe-001', 'kh-safe-002'],
    image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    video_url: null,
    author: 'Magyar Szabványosítási Testület Referencia',
    status: 'published',
    featured: true,
    sort_order: 1,
    views: 412,
    seo_title: 'MSZ EN 361:2002 Szabvány Ismertető | ÉpítőTudás',
    seo_description: 'Az MSZ EN 361:2002 szabvány részletes magyarázata és gyakorlati alkalmazása.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'kh-std-002',
    hub_type: 'standards',
    title: '1993. évi XCIII. törvény a munkavédelemről (Mvt.) és építőipari végrehajtási rendeletei',
    slug: '1993-evi-xciii-torveny-munkavedelemrol',
    summary: 'A munkavédelemről szóló törvény alapvető rendelkezései, a munkáltató és munkavállaló jogaik és kötelezettségeik.',
    content: `## A Munkavédelmi Törvény (Mvt.) Alapjai

Az 1993. évi XCIII. törvény határozza meg Magyarországon az egészséget nem veszélyeztető és biztonságos munkavégzés személyi, tárgyi és szervezeti feltételeit.

### Munkáltatói kötelezettségek:
1. **Kockázatértékelés elkészítése:** Évente vagy a munkakörülmények lényeges megváltozásakor felülvizsgálandó.
2. **Munkavédelmi oktatás:** Munkába álláskor, munkahely megváltozásakor és időszakosan.
3. **Munkabalesetek kivizsgálása:** Súlyos balesetek azonnali bejelentése a hatóságnak.`,
    important_notes: 'Munkavédelmi oktatás nélkül munkavállaló az építési munkaterületen munkát nem végezhet!',
    practical_examples: 'Esettanulmány: Az építésvezetőnek minden alvállalkozó belépése előtt ellenőriznie kell a munkavédelmi oktatási jegyzőkönyvet.',
    category_id: 'cat-guides-003',
    category_name: 'Szabványok & Jogszabályok',
    topic: 'Jogszabályok & Törvények',
    standard_code: '1993. évi XCIII. törvény',
    target_audience: 'all',
    difficulty_level: 'intermediate',
    keywords: ['Mvt', 'munkavédelmi törvény', 'jogszabály', 'kockázatértékelés'],
    tags: ['törvény', 'Mvt', 'jogszabály'],
    documents: [
      {
        id: 'doc-std-002',
        name: 'Mvt_Építőipari_Végrehajtási_Útmutató.pdf',
        file_url: '/docs/mvt_epitoipari_utmutato.pdf',
        file_type: 'pdf',
        size: '3.2 MB',
        description: 'Kompatibilis jogszabálygyűjtemény építőipari kivitelezők számára.',
      },
    ],
    related_rule_ids: ['kh-std-001'],
    related_item_ids: ['kh-safe-001'],
    image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop',
    video_url: null,
    author: 'Jogász & Munkavédelmi Szakértő',
    status: 'published',
    featured: true,
    sort_order: 2,
    views: 520,
    seo_title: 'Munkavédelmi Törvény (Mvt.) Építőipari Alkalmazása | ÉpítőTudás',
    seo_description: 'Az 1993. évi XCIII. törvény építőipari kivonata és gyakorlati magyarázata.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function getKnowledgeItemsLocal(): EducationalContentItem[] {
  if (typeof window === 'undefined') return DEFAULT_KNOWLEDGE_ITEMS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Hiba a Tudástár elemek olvasásakor:', err);
  }
  return DEFAULT_KNOWLEDGE_ITEMS;
}

export function saveKnowledgeItemsLocal(items: EducationalContentItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('knowledge-hub-updated'));

    // Sync to Supabase system config row
    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_SYSTEM_ROW_ID,
          name: '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__',
          slug: 'system-knowledge-hub-config',
          description: JSON.stringify(items),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase knowledge items sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a Tudástár elemek mentésekor:', err);
  }
}

export async function fetchKnowledgeItemsFromCloud(): Promise<EducationalContentItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_SYSTEM_ROW_ID)
      .maybeSingle();

    if (!error && data?.description && data.description.startsWith('[')) {
      const parsed = JSON.parse(data.description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          window.dispatchEvent(new Event('knowledge-hub-updated'));
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Cloud knowledge items fetch info:', err);
  }
  return null;
}
