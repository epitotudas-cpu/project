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
    id: 'art-demo-szerkezetepites-1',
    category_id: 'szerkezetepites',
    subcategory_name: 'Kőműves / Zsaluzó',
    title: 'Monolit vasbeton szerkezetépítés és zsaluzási technológiák',
    slug: 'monolit-vasbeton-szerkezetepites-es-zsaluzasi-technologiak',
    article_type: 'utmutatok',
    tags: ['szerkezetépítés', 'vasbeton', 'zsaluzás', 'monolit', 'útmutató', 'munkavédelem'],
    excerpt: 'Átfogó kivitelezési útmutató monolit vasbeton szerkezetek, zsaluzatok, vasalás és betonozás szakszerű megvalósításához.',
    difficulty: 'advanced',
    read_time: 12,
    author: 'Kovács Péter Építészmérnök & Szerkezetépítő Szakértő',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    status: 'published',
    rejection_note: null,
    featured: true,
    views: 2450,
    rating: 4.95,
    rating_count: 58,
    featured_image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80',
    documents: [
      {
        id: 'doc-szep-1',
        title: 'Monolit_Vasbeton_Szerkezetepitesi_Utmutato.pdf',
        file_url: '/docs/szerkezetepites_utmutato.pdf',
        doc_type: 'utmutato',
        file_size: '4.2 MB',
      },
    ],
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    content: `Ez a szakmai kivitelezési útmutató bemutatja a monolit vasbeton szerkezetépítés, zsaluzás és vasalás legfontosabb lépéseit az alapozástól a födémbetonozásig.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-szerkezetepites-2',
    category_id: 'szerkezetepites',
    subcategory_name: 'Kőműves',
    title: 'Teherhordó falazatok és áthidalók beépítése lépésről lépésre',
    slug: 'teherhordo-falazatok-es-athidalok-beepitese-lepesrol-lepesre',
    article_type: 'utmutatok',
    tags: ['szerkezetépítés', 'falazás', 'áthidaló', 'kőműves', 'tégla', 'útmutató'],
    excerpt: 'A teherhordó tégla- és betonfalazatok szakszerű elhelyezése, habarcsolása és a nyílásáthidalók elhelyezési szabályai.',
    difficulty: 'intermediate',
    read_time: 9,
    author: 'Tóth István Mesterkőműves',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    status: 'published',
    rejection_note: null,
    featured: true,
    views: 1980,
    rating: 4.88,
    rating_count: 36,
    featured_image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    content: `Teherhordó falazatok és nyílásáthidalók szakszerű kivitelezése...`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-eps-utmutato',
    category_id: 'hoszigeteles',
    subcategory_name: 'Kőműves / Hőszigetelő',
    title: 'EPS homlokzati hőszigetelés kivitelezése lépésről lépésre',
    slug: 'eps-homlokzati-hoszigeteles-kivitelezese-lepesrol-lepesre',
    article_type: 'utmutatok',
    tags: ['hőszigetelés', 'eps', 'kőműves', 'homlokzat', 'dübel', 'útmutató', 'munkavédelem'],
    excerpt: 'Gyakorlati útmutató EPS homlokzati hőszigetelés előkészítéséhez, ragasztásához, dübelezéséhez és ellenőrzéséhez.',
    difficulty: 'intermediate',
    read_time: 10,
    author: 'Kovács Péter Építészmérnök & Hőszigetelő Szakértő',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    status: 'published',
    rejection_note: null,
    featured: true,
    views: 1850,
    rating: 4.95,
    rating_count: 42,
    featured_image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=1200&q=80',
    documents: [
      {
        id: 'doc-eps-1',
        title: 'EPS_Homlokzati_Hoszigetelesi_Utmutato.pdf',
        file_url: '/docs/eps_hoszigeteles_utmutato.pdf',
        doc_type: 'utmutato',
        file_size: '3.1 MB',
      },
    ],
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    content: `Ez a szakmai kivitelezési útmutató lépésről lépésre bemutatja az EPS (expandált polisztirol) homlokzati hőszigetelő rendszer szakszerű beépítését a falfelület ellenőrzésétől a ragasztáson és dübelezésen át a hálózásig és minőségellenőrzésig.

## Bevezetés

Az EPS homlokzati hőszigetelés az egyik legelterjedtebb és legköltséghatékonyabb épületenergetikai korszerűsítési megoldás. Megfelelő kivitelezéssel az épület hővesztesége 30-40%-kal csökkenthető, megelőzhető a hőhidak kialakulása és meghosszabbítható a tartószerkezet élettartama.

## Szükséges Anyagok

| Anyag megnevezése | Típus / Specifikáció | Egység | Anyagszükséglet |
| --- | --- | --- | --- |
| EPS 80 Hőszigetelő lap | 150 mm vastag / EPS 80 Grafite vagy White | m² | 1.05 m² / m² |
| Homlokzati ragasztótapasz | Cementbázisú ragasztó- és ágyazóhabarcs | kg | 8.0-10.0 kg / m² |
| Üvegszövet háló | 145 g/m² lúgálló bevonattal | m² | 1.15 m² / m² |
| Műanyag tárcsás dübel | 8x200 mm fém vagy műanyag szeggel | db | 6-8 db / m² |
| Mélyalapozó | Poralapozó / tapadáselősegítő emulzió | liter | 0.15-0.20 l / m² |

## Szükséges Szerszámok

- [Mérőeszközök] Lézeres vízmérték, mérőszalag és csapózsinór
- [Keverés & Felhordás] Elektromos keverőgép, 10-12 mm-es fogazott glettvas és kőműves spakli
- [Vágás & Csiszolás] Polisztirolvágó gép vagy polisztirol fűrész, csiszológyalu
- [Dübelezés] Fúrókalapács 8 mm-es SDS fúrószárral és gumikalapács
- [Állványzat] Megfelelő munkavédelmi homlokzati állvány

> **🛑 BIZTONSÁG**: Magasban végzett munka esetén megfelelő állványzatot és leesés elleni védelmet kell használni! A homlokzati állványzatnak korláttal és lábléccel felszereltnek kell lennie. Csiszoláskor FFP2 pormaszk és védőszemüveg viselése kötelező!

> **💡 SZAKMAI TIPP**: A ragasztó kötése előtt ellenőrizd, hogy a lapok síkja és illesztése megfelelő legyen! A lapok közötti hézagokba nem kerülhet ragasztó, az 2 mm feletti réseket EPS csíkkal vagy PUR habbal kell kitölteni.

## Kivitelezési Lépések

### 1. Lépés: Alapfelület ellenőrzése
Vizsgáld meg a homlokzati falazat szilárdságát, pormentességét és nedvességtartalmát. Távolítsd el a málló vakolatrészeket, és javítsd ki a 10 mm-nél nagyobb egyenetlenségeket.

### 2. Lépés: Felület előkészítése és alapozás
Hordd fel a mélyalapozót hengerrel vagy korongesettel a portalanított falra a megfelelő tapadás biztosítása érdekében. Állítsd be az alumínium lábazati indítóprofilt lézeres szintmérővel.

### 3. Lépés: Ragasztó felhordása (Perem-pont módszer)
Vidd fel a ragasztóhabarcsot a keret-pont módszerrel: a lap szélein körbefutó csíkban (kb. 5 cm szélességben) és a lap közepén 3-4 pontban. A ragasztási felület érje el a lap területének legalább 40%-át.

### 4. Lépés: EPS lapok felhelyezése (Téglakötésben)
Helyezd fel az EPS táblákat lentről felfelé haladva, szoros kötésben, téglakötéssel eltolt hézagokkal. A sarkoknál ügyelj a fogazott lapillesztésre.

### 5. Lépés: Dübelezés és ellenőrzés
A ragasztó száradása után (kb. 24 óra) fúrj lyukakat és rögzítsd a lapokat 6-8 db/m² sűrűséggel tárcsás dübelekkel. Süllyesztett dübelezés esetén használj EPS záródugót.

## Minőségellenőrző Lista

- [ ] Az alapfelület megfelelően elő lett készítve és portalanítva
- [ ] Az EPS lapok síkban vannak és téglakötésben helyezkednek el
- [ ] A ragasztás lefedettsége eléri a 40%-ot (perem-pont módszer)
- [ ] A dübelezés elkészült (6-8 db/m²) és síkba süllyesztett
- [ ] A felület ellenőrizve lett vízmértékkel és repedésmentes

## Összefoglalás

A szakszerűen kivitelezett EPS homlokzati hőszigetelés hosszú évtizedekre biztosítja az épület alacsony energiaköltségét és a komfortos belső klímát.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-1',
    category_id: 'szarazepites',
    subcategory_name: 'Gipszkarton szerelés',
    title: 'Gipszkarton válaszfal készítése lépésről lépésre',
    slug: 'gipszkarton-valaszfal-keszitese-lepesrol-lepesre',
    article_type: 'utmutatok',
    tags: ['szárazépítés', 'gipszkarton', 'válaszfal', 'útmutató', 'munkavédelem'],
    excerpt: 'Részletes, szakmai útmutató gipszkarton válaszfalak szakszerű építéséhez: kitűzés, UW/CW profilok rögzítése, hangszigetelés, kartonozás és Q2 glettelés.',
    difficulty: 'intermediate',
    read_time: 8,
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
    content: `Ez a szakmai útmutató lépésről lépésre bemutatja a gipszkarton válaszfal szakszerű építésének teljes folyamatát, a pontos vázszerkezet kitűzésétől a hőszigetelés elhelyezésén át a rétegrendek rögzítéséig és a glettelésig.\n\n## Szükséges Anyagok\n\n| Anyag megnevezése | Méret / Típus | Egység | Megjegyzés |\n| --- | --- | --- | --- |\n| UW 75 profil | 75 mm / 4 m | fm | Vízszintes vezetőprofil padlóra és mennyezetre |\n| CW 75 profil | 75 mm / 2.75 m | fm | Függőleges tartóprofil 600 mm kiosztással |\n| Gipszkarton lap (RB) | 12.5 mm / 1200x2000 mm | m² | Normál beltéri szárazgipsz lap |\n| Akusztikai szigetelőszalag | 75 mm szél. | tekercs | Rezgéscsillapító PE szalag a peremprofil alá |\n| Beütődübel | 6x40 mm | doboz | UW profil rögzítéséhez aljzatra és födémre |\n| Gipszkarton csavar (TN 25) | 3.5x25 mm | doboz | Lapok vázhoz rögzítéséhez |\n| Ásványgyapot hőszigetelés | 75 mm vastag | m² | Hang- és hőszigetelő kitöltés |\n\n## Szükséges Szerszámok\n\n- [Mérőeszközök] Lézeres vízmérték, csapózsinór és mérőszalag\n- [Vágóeszközök] Kézi lemezvágó olló profilokhoz és szike a kartonhoz\n- [Gépek] Akkus csavarbehajtó mélységhatárolóval és fúrókalapács\n- [Felületképzés] Spakli, lepke glettvas és csiszolóháló\n\n## Munkavédelem & Biztonság\n\n> **🛑 BIZTONSÁG**: Ásványgyapot szigetelés vágásánál és glettelés csiszolásánál FFP2 pormaszk, védőszemüveg és munkavédelmi kesztyű használata kötelező!\n\n## Lépésenkénti Kivitelezés\n\n### 1. Lépés: Nyomvonal kitűzése és keretprofilok szerelése\n\nLézeres szintjelzővel jelöld ki a fal nyomvonalát a padlón, az oldalfalakon és a mennyezeten. Ragassz akusztikai szigetelőszalagot az UW 75 profilok talpára, majd fúrj és rögzíts beütődübellel max. 80 cm-es távolságonként.\n\n![UW profil rögzítése akusztikai szalaggal](https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80)\n*UW padlóprofil rögzítése rezgéscsillapító szalaggal*\n\n### 2. Lépés: CW profilok beállítása és tengelytávolság\n\nÁllítsd be a CW 75 függőleges tartóprofilokat az UW keretbe pontosan 600 mm tengelytávolsággal. A CW profilokat ne csavarozd mereven az UW profilhoz, hagyj 1-1.5 cm dilatációs hézagot a födémnél.\n\n### 3. Lépés: Első oldali burkolás és szigetelés\n\nRögzítsd a 12.5 mm-es gipszkarton lapokat az egyik oldalon TN 25 csavarokkal max. 25 cm-es csavartávolsággal. Ezt követően helyezd be a 75 mm-es ásványgyapot hangszigetelő táblákat hégmentesen a profilközökbe.\n\n> **[Szakmai tipp] Eltolt hézagolási szabály**\n> A kétoldali burkolat gipszkarton lapjainak függőleges és vízszintes toldásai ne essenek egy vonalba! A másik oldalon 60 cm-es eltolással indítsd a lapokat.\n\n### 4. Lépés: Másik oldali zárás és glettelés\n\nZárd be a falat a másik oldali gipszkarton burkolattal. A hézagokat erősítsd meg üvegszálas vagy papír hézagerősítő szalaggal, majd gletteld Q2 minőségben két rétegben.\n\n## Minőségellenőrző Lista\n\n- [ ] Az UW keret alatt jelen van az akusztikai szigetelőszalag\n- [ ] A CW profilok tengelytávolsága hajszálpontosan 600 mm\n- [ ] A csavarfejek nincsenek átszakadva, a kartonpapír ép\n- [ ] Az eltolt lapillesztések betartásra kerültek\n- [ ] A glettelt hézagok repedésmentesek és csiszoltak\n\n## Összefoglalás\n\nA szakszerűen megépített gipszkarton válaszfal tökéletesen sík felületet, kiváló akusztikai gátat és gyors, száraz kivitelezést biztosít.`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-burkolas-1',
    category_id: 'burkolas',
    subcategory_name: 'Burkoló',
    title: 'Fürdőszobai hidegburkolás és kent vízszigetelés rétegrendje',
    slug: 'furdoszobai-hidegburkolas-es-kent-vizszigeteles-retegrendje',
    article_type: 'utmutatok',
    tags: ['burkolás', 'csempézés', 'vízszigetelés', 'fuga', 'útmutató'],
    excerpt: 'Szakszerű kenhető vízszigetelés, hajlatszalagok elhelyezése és csemperagasztási rétegrend fürdőszobákban.',
    difficulty: 'intermediate',
    read_time: 9,
    author: 'Nagy Gábor Burkoló Mester',
    partner_id: 'p-2',
    partner_name: 'Cemex Magyarország',
    status: 'published',
    rejection_note: null,
    featured: true,
    views: 1640,
    rating: 4.92,
    rating_count: 29,
    featured_image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    content: `Fürdőszobai kent vízszigetelés és csemperagasztás rétegrendje és lépései...`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-tetofedes-1',
    category_id: 'tetofedes',
    subcategory_name: 'Tetőfedő & Bádogos',
    title: 'Magastetők cseréplécezése és páraáteresztő fóliázása',
    slug: 'magastetok-csereplecezese-es-paraatereszto-foliazasa',
    article_type: 'utmutatok',
    tags: ['tető', 'tetőfedés', 'bádogozás', 'szarufa', 'fólia', 'útmutató'],
    excerpt: 'Páraáteresztő tetőfólia szakszerű beépítése, ellenlécezés és cseréplécezés a magastető szerkezeteken.',
    difficulty: 'intermediate',
    read_time: 10,
    author: 'Varga Balázs Okleveles Ács & Tetőfedő',
    partner_id: 'p-4',
    partner_name: 'Stahlbau Kivitelező Zrt.',
    status: 'published',
    rejection_note: null,
    featured: false,
    views: 1210,
    rating: 4.85,
    rating_count: 21,
    featured_image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    content: `Magastetők fóliázása, kiszellőztetése és cseréplécezési távolságok...`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-feluletkepzes-1',
    category_id: 'feluletkepzes',
    subcategory_name: 'Festő & Glettelő',
    title: 'Beltéri glettelés és falfestés mesterfogásai Q3-Q4 minőségben',
    slug: 'belteri-gletteles-es-falfestes-mesterfogasai-q3-q4-minosegben',
    article_type: 'utmutatok',
    tags: ['felületképzés', 'glettelés', 'festés', 'vakolás', 'útmutató'],
    excerpt: 'Glettelési fázisok, felületi csiszolás, alapozás és falfestékek szakszerű felhordási technikái.',
    difficulty: 'beginner',
    read_time: 7,
    author: 'Horváth Csaba Festő Mester',
    partner_id: 'p-2',
    partner_name: 'Cemex Magyarország',
    status: 'published',
    rejection_note: null,
    featured: false,
    views: 950,
    rating: 4.89,
    rating_count: 18,
    featured_image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    content: `Beltéri glettelési rétegek és festési műveletek...`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-epuletgepeszet-1',
    category_id: 'epuletgepeszet',
    subcategory_name: 'Épületgépész',
    title: 'Ötrétegű csőhálózat szerelése és fűtésszerelési alapelvek',
    slug: 'otretegu-csohalozat-szerelese-es-futesszerelesi-alapelvek',
    article_type: 'utmutatok',
    tags: ['épületgépészet', 'gépészet', 'csőhálózat', 'fűtés', 'vízszerelés', 'útmutató'],
    excerpt: 'Víz- és fűtésszerelési csőhálózatok kiépítése, préseidomok rögzítése és nyomáspróbája.',
    difficulty: 'intermediate',
    read_time: 9,
    author: 'Sipos Béla Épületgépész Mérnök',
    partner_id: 'p-3',
    partner_name: 'BME Építőmérnöki Kar',
    status: 'published',
    rejection_note: null,
    featured: false,
    views: 1120,
    rating: 4.91,
    rating_count: 25,
    featured_image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    content: `Ötrétegű csővezetékek szerelése, préselési szerszámok és nyomáspróba lefolytatása...`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-villanyszereles-1',
    category_id: 'villanyszereles',
    subcategory_name: 'Villanyszerelő',
    title: 'Lakossági elosztótábla szerelése és Fi-relé beépítése',
    slug: 'lakossagi-elosztotabla-szerelese-es-fi-rele-beepitese',
    article_type: 'utmutatok',
    tags: ['villanyszerelés', 'hálózat', 'fi-relé', 'érintésvédelem', 'elosztó', 'útmutató'],
    excerpt: 'Védőcsövezés, vezetékbebehúzás, Fi-relé bekötés és érintésvédelmi szabványok kivitelezése.',
    difficulty: 'intermediate',
    read_time: 8,
    author: 'Molnár Dániel Villanyszerelő Szakértő',
    partner_id: 'p-4',
    partner_name: 'Stahlbau Kivitelező Zrt.',
    status: 'published',
    rejection_note: null,
    featured: true,
    views: 1780,
    rating: 4.96,
    rating_count: 34,
    featured_image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    content: `Elosztótáblák kapcsolási rajzai, kismegszakítók méretezése és Fi-relé tesztelése...`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-news-1',
    category_id: 'hirek',
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
    featured_image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    read_time: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-news-2',
    category_id: 'hirek',
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
    category_id: 'szerkezetepites',
    subcategory_name: 'Innováció & Anyagok',
    title: 'Megérkeztek a legújabb ultra-könnyű hőszigetelő kerámia tégla rendszerek',
    slug: 'megerkeztek-a-legujabb-ultra-konnyu-hoszigetelo-keramia-tegla-rendszerek',
    article_type: 'ujdonsagok',
    tags: ['újdonságok', 'leier', 'tégla', 'hőszigetelés', 'innováció', 'szerkezetépítés'],
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
    category_id: 'szerszamok-mester',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade legacy category IDs (e.g. cat-1 / cat-2) in localStorage
        const sanitized = parsed.map((a: Article) => {
          const defMatch = DEFAULT_ARTICLES.find((d) => d.id === a.id);
          if (defMatch) {
            return { ...a, category_id: defMatch.category_id };
          }
          if (a.category_id === 'cat-1' || a.category_id === 'cat-2') {
            return { ...a, category_id: 'szerkezetepites' };
          }
          return a;
        });

        // Merge missing default articles into stored list
        const existingIds = new Set(sanitized.map((a: Article) => a.id));
        const missingDefaults = DEFAULT_ARTICLES.filter((d) => !existingIds.has(d.id));
        if (missingDefaults.length > 0 || JSON.stringify(sanitized) !== raw) {
          const merged = [...missingDefaults, ...sanitized];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
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
  try {
    let query = supabase.from('articles').select('*').eq('status', 'published');
    if (options?.articleType && options.articleType !== 'all') {
      query = query.eq('article_type', options.articleType);
    }
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data && data.length > 0) return data as Article[];
  } catch (err) {
    void err;
  }

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
  try {
    const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).maybeSingle();
    if (!error && data) return data as Article;
  } catch (err) {
    void err;
  }

  const localList = getArticlesLocal();
  const match = localList.find((a) => a.slug === slug);
  if (match) return match;
  return null;
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

export async function reorderArticles(orderedArticleIds: string[]): Promise<void> {
  const allLocal = getArticlesLocal();
  const idMap = new Map<string, number>();
  orderedArticleIds.forEach((id, idx) => idMap.set(id, idx));

  const updatedList = [...allLocal].sort((a, b) => {
    const idxA = idMap.has(a.id) ? idMap.get(a.id)! : 9999;
    const idxB = idMap.has(b.id) ? idMap.get(b.id)! : 9999;
    return idxA - idxB;
  });

  saveArticlesLocal(updatedList);
  void logAuditAction('ARTICLE_REORDER', 'articles', 'Cikkek sorrendje frissítve');
}

