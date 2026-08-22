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
    id: 'art-demo-1',
    category_id: 'cat-1',
    title: 'Gipszkarton válaszfal készítése lépésről lépésre',
    slug: 'gipszkarton-valaszfal-keszitese-lepesrol-lepesre',
    excerpt: 'Részletes, szakmai útmutató gipszkarton válaszfalak szakszerű építéséhez: kitűzés, UW/CW profilok rögzítése, hangszigetelés, kartonozás és Q2 glettelés.',
    content: "Ez a szakmai útmutató lépésről lépésre bemutatja a gipszkarton válaszfal szakszerű építésének teljes folyamatát, a pontos vázszerkezet kitűzésétől a hőszigetelés elhelyezésén át a rétegrendek rögzítéséig és a glettelésig.\n\n## Szükséges Anyagok\n\n| Anyag megnevezése | Méret / Típus | Egység | Megjegyzés |\n| --- | --- | --- | --- |\n| UW 75 profil | 75 mm / 4 m | fm | Vízszintes vezetőprofil padlóra és mennyezetre |\n| CW 75 profil | 75 mm / 2.75 m | fm | Függőleges tartóprofil 600 mm kiosztással |\n| Gipszkarton lap (RB) | 12.5 mm / 1200x2000 mm | m² | Normál beltéri szárazgipsz lap |\n| Akusztikai szigetelőszalag | 75 mm szél. | tekercs | Rezgéscsillapító PE szalag a peremprofil alá |\n| Beütődübel | 6x40 mm | doboz | UW profil rögzítéséhez aljzatra és födémre |\n| Gipszkarton csavar (TN 25) | 3.5x25 mm | doboz | Lapok vázhoz rögzítéséhez |\n| Ásványgyapot hőszigetelés | 75 mm vastag | m² | Hang- és hőszigetelő kitöltés |\n\n## Szükséges Szerszámok\n\n- [Mérőeszközök] Lézeres vízmérték, csapózsinór és mérőszalag\n- [Vágóeszközök] Kézi lemezvágó olló profilokhoz és szike a kartonhoz\n- [Gépek] Akkus csavarbehajtó mélységhatárolóval és fúrókalapács\n- [Felületképzés] Spakli, lepke glettvas és csiszolóháló\n\n## Munkavédelem & Biztonság\n\n> **🛑 BIZTONSÁG**: Ásványgyapot szigetelés vágásánál és glettelés csiszolásánál FFP2 pormaszk, védőszemüveg és munkavédelmi kesztyű használata kötelező!\n\n## Lépésenkénti Kivitelezés\n\n### 1. Lépés: Nyomvonal kitűzése és keretprofilok szerelése\n\nLézeres szintjelzővel jelöld ki a fal nyomvonalát a padlón, az oldalfalakon és a mennyezeten. Ragassz akusztikai szigetelőszalagot az UW 75 profilok talpára, majd fúrj és rögzíts beütődübellel max. 80 cm-es távolságonként.\n\n![UW profil rögzítése akusztikai szalaggal](https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80)\n*UW padlóprofil rögzítése rezgéscsillapító szalaggal*\n\n### 2. Lépés: CW profilok beállítása és tengelytávolság\n\nÁllítsd be a CW 75 függőleges tartóprofilokat az UW keretbe pontosan 600 mm tengelytávolsággal. A CW profilokat ne csavarozd mereven az UW profilhoz, hagyj 1-1.5 cm dilatációs hézagot a födémnél.\n\n### 3. Lépés: Első oldali burkolás és szigetelés\n\nRögzítsd a 12.5 mm-es gipszkarton lapokat az egyik oldalon TN 25 csavarokkal max. 25 cm-es csavartávolsággal. Ezt követően helyezd be a 75 mm-es ásványgyapot hangszigetelő táblákat hégmentesen a profilközökbe.\n\n> **[Szakmai tipp] Eltolt hézagolási szabály**\n> A kétoldali burkolat gipszkarton lapjainak függőleges és vízszintes toldásai ne essenek egy vonalba! A másik oldalon 60 cm-es eltolással indítsd a lapokat.\n\n### 4. Lépés: Másik oldali zárás és glettelés\n\nZárd be a falat a másik oldali gipszkarton burkolattal. A hézagokat erősítsd meg üvegszálas vagy papír hézagerősítő szalaggal, majd gletteld Q2 minőségben két rétegben.\n\n## Minőségellenőrző Lista\n\n- [ ] Az UW keret alatt jelen van az akusztikai szigetelőszalag\n- [ ] A CW profilok tengelytávolsága hajszálpontosan 600 mm\n- [ ] A csavarfejek nincsenek átszakadva, a kartonpapír ép\n- [ ] Az eltolt lapillesztések betartásra kerültek\n- [ ] A glettelt hézagok repedésmentesek és csiszoltak\n\n## Összefoglalás\n\nA szakszerűen megépített gipszkarton válaszfal tökéletesen sík felületet, kiváló akusztikai gátat és gyors, száraz kivitelezést biztosít.\n\n\n\n[EPITOTUDAS_BLOCKS_DATA:{\"blocks\":[{\"id\":\"a1_1\",\"type\":\"text\",\"content\":\"Ez a szakmai útmutató lépésről lépésre bemutatja a gipszkarton válaszfal szakszerű építésének teljes folyamatát, a pontos vázszerkezet kitűzésétől a hőszigetelés elhelyezésén át a rétegrendek rögzítéséig és a glettelésig.\"},{\"id\":\"a1_2\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Szükséges Anyagok\"},{\"id\":\"a1_3\",\"type\":\"table\",\"tableHeaders\":[\"Anyag megnevezése\",\"Méret / Típus\",\"Egység\",\"Megjegyzés\"],\"tableRows\":[[\"UW 75 profil\",\"75 mm / 4 m\",\"fm\",\"Vízszintes vezetőprofil padlóra és mennyezetre\"],[\"CW 75 profil\",\"75 mm / 2.75 m\",\"fm\",\"Függőleges tartóprofil 600 mm kiosztással\"],[\"Gipszkarton lap (RB)\",\"12.5 mm / 1200x2000 mm\",\"m²\",\"Normál beltéri szárazgipsz lap\"],[\"Akusztikai szigetelőszalag\",\"75 mm szél.\",\"tekercs\",\"Rezgéscsillapító PE szalag a peremprofil alá\"],[\"Beütődübel\",\"6x40 mm\",\"doboz\",\"UW profil rögzítéséhez aljzatra és födémre\"],[\"Gipszkarton csavar (TN 25)\",\"3.5x25 mm\",\"doboz\",\"Lapok vázhoz rögzítéséhez\"],[\"Ásványgyapot hőszigetelés\",\"75 mm vastag\",\"m²\",\"Hang- és hőszigetelő kitöltés\"]]},{\"id\":\"a1_4\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Szükséges Szerszámok\"},{\"id\":\"a1_5\",\"type\":\"list\",\"items\":[\"[Mérőeszközök] Lézeres vízmérték, csapózsinór és mérőszalag\",\"[Vágóeszközök] Kézi lemezvágó olló profilokhoz és szike a kartonhoz\",\"[Gépek] Akkus csavarbehajtó mélységhatárolóval és fúrókalapács\",\"[Felületképzés] Spakli, lepke glettvas és csiszolóháló\"]},{\"id\":\"a1_6\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Munkavédelem & Biztonság\"},{\"id\":\"a1_7\",\"type\":\"warning\",\"warningType\":\"safety\",\"content\":\"Ásványgyapot szigetelés vágásánál és glettelés csiszolásánál FFP2 pormaszk, védőszemüveg és munkavédelmi kesztyű használata kötelező!\"},{\"id\":\"a1_8\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Lépésenkénti Kivitelezés\"},{\"id\":\"a1_9\",\"type\":\"heading\",\"level\":\"h3\",\"content\":\"1. Lépés: Nyomvonal kitűzése és keretprofilok szerelése\"},{\"id\":\"a1_10\",\"type\":\"text\",\"content\":\"Lézeres szintjelzővel jelöld ki a fal nyomvonalát a padlón, az oldalfalakon és a mennyezeten. Ragassz akusztikai szigetelőszalagot az UW 75 profilok talpára, majd fúrj és rögzíts beütődübellel max. 80 cm-es távolságonként.\"},{\"id\":\"a1_11\",\"type\":\"image\",\"imageUrl\":\"https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80\",\"imageAlt\":\"UW profil rögzítése akusztikai szalaggal\",\"imageCaption\":\"UW padlóprofil rögzítése rezgéscsillapító szalaggal\"},{\"id\":\"a1_12\",\"type\":\"heading\",\"level\":\"h3\",\"content\":\"2. Lépés: CW profilok beállítása és tengelytávolság\"},{\"id\":\"a1_13\",\"type\":\"text\",\"content\":\"Állítsd be a CW 75 függőleges tartóprofilokat az UW keretbe pontosan 600 mm tengelytávolsággal. A CW profilokat ne csavarozd mereven az UW profilhoz, hagyj 1-1.5 cm dilatációs hézagot a födémnél.\"},{\"id\":\"a1_14\",\"type\":\"heading\",\"level\":\"h3\",\"content\":\"3. Lépés: Első oldali burkolás és szigetelés\"},{\"id\":\"a1_15\",\"type\":\"text\",\"content\":\"Rögzítsd a 12.5 mm-es gipszkarton lapokat az egyik oldalon TN 25 csavarokkal max. 25 cm-es csavartávolsággal. Ezt követően helyezd be a 75 mm-es ásványgyapot hangszigetelő táblákat hégmentesen a profilközökbe.\"},{\"id\":\"a1_16\",\"type\":\"highlight\",\"highlightType\":\"Szakmai tipp\",\"highlightTitle\":\"Eltolt hézagolási szabály\",\"content\":\"A kétoldali burkolat gipszkarton lapjainak függőleges és vízszintes toldásai ne essenek egy vonalba! A másik oldalon 60 cm-es eltolással indítsd a lapokat.\"},{\"id\":\"a1_17\",\"type\":\"heading\",\"level\":\"h3\",\"content\":\"4. Lépés: Másik oldali zárás és glettelés\"},{\"id\":\"a1_18\",\"type\":\"text\",\"content\":\"Zárd be a falat a másik oldali gipszkarton burkolattal. A hézagokat erősítsd meg üvegszálas vagy papír hézagerősítő szalaggal, majd gletteld Q2 minőségben két rétegben.\"},{\"id\":\"a1_19\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Minőségellenőrző Lista\"},{\"id\":\"a1_20\",\"type\":\"checklist\",\"checkItems\":[{\"id\":\"c1\",\"text\":\"Az UW keret alatt jelen van az akusztikai szigetelőszalag\"},{\"id\":\"c2\",\"text\":\"A CW profilok tengelytávolsága hajszálpontosan 600 mm\"},{\"id\":\"c3\",\"text\":\"A csavarfejek nincsenek átszakadva, a kartonpapír ép\"},{\"id\":\"c4\",\"text\":\"Az eltolt lapillesztések betartásra kerültek\"},{\"id\":\"c5\",\"text\":\"A glettelt hézagok repedésmentesek és csiszoltak\"}]},{\"id\":\"a1_21\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Összefoglalás\"},{\"id\":\"a1_22\",\"type\":\"text\",\"content\":\"A szakszerűen megépített gipszkarton válaszfal tökéletesen sík felületet, kiváló akusztikai gátat és gyors, száraz kivitelezést biztosít.\"}],\"seo\":{\"seoTitle\":\"Gipszkarton válaszfal készítése lépésről lépésre | ÉpítőTudás\",\"metaDescription\":\"Részletes építőipari útmutató gipszkarton válaszfal építéséhez: szerkezet kitűzése, profilozás, szigetelés, lapozás és glettelés.\",\"primaryKeyword\":\"gipszkarton válaszfal építése\",\"relatedKeywords\":\"UW profil, CW profil, szárazépítés, gipszkarton szerelés\"}}]",
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 0,
    rating: 4.9,
    rating_count: 32,
    featured_image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    read_time: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-2',
    category_id: 'cat-1',
    title: 'Mi az a CW és UW gipszkarton profil, és mi a szerepük?',
    slug: 'mi-az-a-cw-es-uw-gipszkarton-profil',
    excerpt: 'Részletes szakmai elemzés az UW vezetőprofilok és CW tartóprofilok működéséről, méretválasztékáról és a teherhordó vázszerkezet felépítéséről.',
    content: "A szárazépítészetben a válaszfalak és álmennyezetek szilárdságát a horganyzott acélprofilok biztosítják. Ebben a cikkben részletesen elmagyarázzuk a CW és UW profilok közötti különbséget és feladatukat.\n\n## Mi az a CW és UW gipszkarton profil?\n\nA gipszkarton válaszfalak vázszerkezete két fő profil típusból áll:\n\n- **UW Profil (U-Profil Wand):** Vízszintes vezetőprofil, amelyet a padlóra és a mennyezetre rögzítünk beütődübellel. Ez adja meg a fal nyomvonalát.\n- **CW Profil (C-Profil Wand):** Függőleges tartóprofil, amelyet az UW profilba állítunk be belecsúsztatva. Erre csavarozzuk fel a gipszkarton lapokat.\n\n## Méretezés és Profilválaszték\n\n| Profil Típus | Szélesség | Falvastagság (1 r. gipszkarton) | Alkalmazási Terület |\n| --- | --- | --- | --- |\n| UW 50 / CW 50 | 50 mm | 75 mm | Keskeny helyigényű válaszfalak, csővezetékek elfedése |\n| UW 75 / CW 75 | 75 mm | 100 mm | Standard lakossági és irodai válaszfalak, jó hangszigetelés |\n| UW 100 / CW 100 | 100 mm | 125 mm | Nagy belmagasságú falak, beépített gépészet és magas akusztika |\n\n## Beépítési Szabályok és Tipikus Hibák\n\n> **📌 MŰSZAKI FELTÉTEL**: FONTOS MŰSZAKI FELTÉTEL: A CW profilt ne csavarozd hozzá mereven az UW padló- és mennyezeti profilhoz! A CW profilnak hőtágulási és épületmozgási dilatáció miatt függőlegesen mozognia kell az UW-ben.\n\n> **[Jó tudni] Profilok Hossza**\n> A CW profilokat úgy kell méretre vágni lemezvágó ollóval, hogy a belmagasságnál 10-15 mm-rel rövidebbek legyenek, megakadályozva a födémlehajlás miatti feszültséget.\n\n## Összefoglalás\n\nAz UW és CW profilok helyes méretezése és szakszerű, dilatációt biztosító szerelése garantálja a gipszkarton válaszfal stabil, repedésmentes szerkezetét.\n\n\n\n[EPITOTUDAS_BLOCKS_DATA:{\"blocks\":[{\"id\":\"a2_1\",\"type\":\"text\",\"content\":\"A szárazépítészetben a válaszfalak és álmennyezetek szilárdságát a horganyzott acélprofilok biztosítják. Ebben a cikkben részletesen elmagyarázzuk a CW és UW profilok közötti különbséget és feladatukat.\"},{\"id\":\"a2_2\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Mi az a CW és UW gipszkarton profil?\"},{\"id\":\"a2_3\",\"type\":\"text\",\"content\":\"A gipszkarton válaszfalak vázszerkezete két fő profil típusból áll:\\n\\n- **UW Profil (U-Profil Wand):** Vízszintes vezetőprofil, amelyet a padlóra és a mennyezetre rögzítünk beütődübellel. Ez adja meg a fal nyomvonalát.\\n- **CW Profil (C-Profil Wand):** Függőleges tartóprofil, amelyet az UW profilba állítunk be belecsúsztatva. Erre csavarozzuk fel a gipszkarton lapokat.\"},{\"id\":\"a2_4\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Méretezés és Profilválaszték\"},{\"id\":\"a2_5\",\"type\":\"table\",\"tableHeaders\":[\"Profil Típus\",\"Szélesség\",\"Falvastagság (1 r. gipszkarton)\",\"Alkalmazási Terület\"],\"tableRows\":[[\"UW 50 / CW 50\",\"50 mm\",\"75 mm\",\"Keskeny helyigényű válaszfalak, csővezetékek elfedése\"],[\"UW 75 / CW 75\",\"75 mm\",\"100 mm\",\"Standard lakossági és irodai válaszfalak, jó hangszigetelés\"],[\"UW 100 / CW 100\",\"100 mm\",\"125 mm\",\"Nagy belmagasságú falak, beépített gépészet és magas akusztika\"]]},{\"id\":\"a2_6\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Beépítési Szabályok és Tipikus Hibák\"},{\"id\":\"a2_7\",\"type\":\"warning\",\"warningType\":\"technical\",\"content\":\"FONTOS MŰSZAKI FELTÉTEL: A CW profilt ne csavarozd hozzá mereven az UW padló- és mennyezeti profilhoz! A CW profilnak hőtágulási és épületmozgási dilatáció miatt függőlegesen mozognia kell az UW-ben.\"},{\"id\":\"a2_8\",\"type\":\"highlight\",\"highlightType\":\"Jó tudni\",\"highlightTitle\":\"Profilok Hossza\",\"content\":\"A CW profilokat úgy kell méretre vágni lemezvágó ollóval, hogy a belmagasságnál 10-15 mm-rel rövidebbek legyenek, megakadályozva a födémlehajlás miatti feszültséget.\"},{\"id\":\"a2_9\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Összefoglalás\"},{\"id\":\"a2_10\",\"type\":\"text\",\"content\":\"Az UW és CW profilok helyes méretezése és szakszerű, dilatációt biztosító szerelése garantálja a gipszkarton válaszfal stabil, repedésmentes szerkezetét.\"}],\"seo\":{\"seoTitle\":\"Mi az a CW és UW gipszkarton profil? | ÉpítőTudás Fogalomtár\",\"metaDescription\":\"Ismerd meg a CW és UW gipszkarton profilok különbségeit, méreteit (50, 75, 100 mm) és a szakszerű beépítési szabályokat.\",\"primaryKeyword\":\"CW és UW profil\",\"relatedKeywords\":\"gipszkarton profilok, szárazépítési váz, UW75, CW75\"}}]",
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 0,
    rating: 4.8,
    rating_count: 21,
    featured_image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    read_time: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-3',
    category_id: 'cat-2',
    title: 'Gipszkarton lapok típusai: melyiket mikor használjuk?',
    slug: 'gipszkarton-lapok-tipusai-melyiket-mikor-hasznaljuk',
    excerpt: 'Átfogó útmutató a normál (RB), impregnált (RBI), tűzgátló (RF) és akusztikai gipszkarton lapok tulajdonságairól és alkalmazási területeiről.',
    content: "A gipszkarton lapok napjaink legsokoldalúbb szárazépészeti anyagai. Az építési helyszín és a funkció függvényében azonban pontosan meg kell választani a megfelelő lap típust.\n\n## Gipszkarton Lapok Szín- és Típuskódolása\n\n| Típus kód | Szín | Jellemző tulajdonság | Ajánlott felhasználási terület |\n| --- | --- | --- | --- |\n| RB (Normál) | Fehér / Szürke | Standard beltéri gipszkarton | Nappali, hálószoba, iroda normál páratartalomnál |\n| RBI (Impregnált) | Zöld | Pára- és vízálló adalékolás | Fürdőszoba, WC, konyha, vizes helyiségek |\n| RF (Tűzgátló) | Rózsaszín / Piros | Üvegszál erősítésű tűzálló mag | Kazánház, tetőtéri beépítés, menekülőutak |\n| Blue / Silent | Kék | Fokozott sűrűség és akusztika | Hálószobák közötti elválasztó falak, tárgyalók |\n\n## Alkalmazási és Beépítési Szabályok\n\nA gipszkarton lapok rögzítésénél és vágásánál ügyelni kell a lapok élszerkezetére (HRAK vagy AK élek), amelyek a hézagoló glett megfelelő megtapadását biztosítják.\n\n> **🛑 BIZTONSÁG**: A zöld impregnált (RBI) gipszkarton lap páraálló, de nem vízszigetelő! Zuhanyzóknál és kádaknál a csempézés előtt kenhető vízszigetelést kell felhordani a felületre.\n\n> **[Szakmai tipp] Dupla kartonozás előnyei**\n> Kétrétegű burkolásnál (2x12.5 mm RB lap) a fal teherbírása és hanggátlása megsokszorozódik. A nehéz tárgyalók (pl. tv, konyhaszekrény) felfüggesztése lényegesen biztonságosabb.\n\n## Összefoglalás\n\nA funkciónak megfelelő gipszkarton lap kiválasztása szavatolja az épület tűzvédelmi, akusztikai és párastabilitási követelményeinek teljesülését.\n\n\n\n[EPITOTUDAS_BLOCKS_DATA:{\"blocks\":[{\"id\":\"a3_1\",\"type\":\"text\",\"content\":\"A gipszkarton lapok napjaink legsokoldalúbb szárazépészeti anyagai. Az építési helyszín és a funkció függvényében azonban pontosan meg kell választani a megfelelő lap típust.\"},{\"id\":\"a3_2\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Gipszkarton Lapok Szín- és Típuskódolása\"},{\"id\":\"a3_3\",\"type\":\"table\",\"tableHeaders\":[\"Típus kód\",\"Szín\",\"Jellemző tulajdonság\",\"Ajánlott felhasználási terület\"],\"tableRows\":[[\"RB (Normál)\",\"Fehér / Szürke\",\"Standard beltéri gipszkarton\",\"Nappali, hálószoba, iroda normál páratartalomnál\"],[\"RBI (Impregnált)\",\"Zöld\",\"Pára- és vízálló adalékolás\",\"Fürdőszoba, WC, konyha, vizes helyiségek\"],[\"RF (Tűzgátló)\",\"Rózsaszín / Piros\",\"Üvegszál erősítésű tűzálló mag\",\"Kazánház, tetőtéri beépítés, menekülőutak\"],[\"Blue / Silent\",\"Kék\",\"Fokozott sűrűség és akusztika\",\"Hálószobák közötti elválasztó falak, tárgyalók\"]]},{\"id\":\"a3_4\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Alkalmazási és Beépítési Szabályok\"},{\"id\":\"a3_5\",\"type\":\"text\",\"content\":\"A gipszkarton lapok rögzítésénél és vágásánál ügyelni kell a lapok élszerkezetére (HRAK vagy AK élek), amelyek a hézagoló glett megfelelő megtapadását biztosítják.\"},{\"id\":\"a3_6\",\"type\":\"warning\",\"warningType\":\"safety\",\"content\":\"A zöld impregnált (RBI) gipszkarton lap páraálló, de nem vízszigetelő! Zuhanyzóknál és kádaknál a csempézés előtt kenhető vízszigetelést kell felhordani a felületre.\"},{\"id\":\"a3_7\",\"type\":\"highlight\",\"highlightType\":\"Szakmai tipp\",\"highlightTitle\":\"Dupla kartonozás előnyei\",\"content\":\"Kétrétegű burkolásnál (2x12.5 mm RB lap) a fal teherbírása és hanggátlása megsokszorozódik. A nehéz tárgyalók (pl. tv, konyhaszekrény) felfüggesztése lényegesen biztonságosabb.\"},{\"id\":\"a3_8\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Összefoglalás\"},{\"id\":\"a3_9\",\"type\":\"text\",\"content\":\"A funkciónak megfelelő gipszkarton lap kiválasztása szavatolja az épület tűzvédelmi, akusztikai és párastabilitási követelményeinek teljesülését.\"}],\"seo\":{\"seoTitle\":\"Gipszkarton lapok típusai: normál, impregnált, tűzgátló | ÉpítőTudás\",\"metaDescription\":\"Részletes áttekintés a fehér, zöld, rózsaszín és kék gipszkarton lapokról: melyiket mikor használjuk a szárazépítésben?\",\"primaryKeyword\":\"gipszkarton lapok típusai\",\"relatedKeywords\":\"impregnált gipszkarton, tűzgátló gipszkarton, RB, RBI, RF lapok\"}}]",
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 0,
    rating: 5.0,
    rating_count: 45,
    featured_image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    read_time: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-4',
    category_id: 'cat-1',
    title: 'Gipszkarton vagy tégla válaszfal – melyiket mikor érdemes választani?',
    slug: 'gipszkarton-vagy-tegla-valaszfal-melyiket-valasszuk',
    excerpt: 'Objektív szakmai összehasonlítás a szárazépítés (gipszkarton) és a hagyományos falazat (válaszfal tégla/Ytong) között: ár, súly, kivitelezési idő és hangszigetelés.',
    content: "Új válaszfal építésénél vagy lakásfelújításnál az egyik leggyakoribb kérdés: gipszkartonból vagy hagyományos falazóelemből (tégla / Ytong) építsük meg a falat? Ebben a cikkben összehasonlítjuk a két technológiát.\n\n## Összehasonlító Műszaki Táblázat\n\n| Szempont | Gipszkarton Válaszfal (W112) | Tégla / Ytong Válaszfal |\n| --- | --- | --- |\n| Súly (m²) | kb. 25–30 kg/m² (Könnyű) | kb. 110–160 kg/m² (Nehéz) |\n| Kivitelezési idő | Gyors, száraz technológia (1-2 nap) | Lassabb, nedves falazás és vakolás (5-7 nap) |\n| Száradási idő | Azonnal festhető / burkolható | Hetekig tartó száradás vakolás után |\n| Hangszigetelés (Rw) | Kiváló (akár 52-58 dB gyapottal) | Jó (40-48 dB tömegfüggő) |\n| Födémterhelés | Minimális, nem igényel statikai méretezést | Jelentős, meglévő födémnél ellenőrizni kell |\n| Szerelvényezés | Gépészet rejtve a profilok között | Horonymarás és vésés szükséges |\n\n## Előnyök és Hátrányok Elemzése\n\nA gipszkarton legnagyobb előnye a száraz technológia és a kiváló hangszigetelés ásványgyapottal. A tégla falazat előnye a nagy egy ponti teherbírás és a tömör érzet, de jelentős nedvességet visz a szerkezetbe.\n\n> **[Szakmai tipp] Döntési javaslat felújításhoz**\n> Régi társasházak fagerendás vagy üreges födémeinél a tégla falazat súlya statikailag veszélyes lehet. Ilyen esetekben kizárólag a gipszkarton válaszfal az ajánlott megoldás!\n\n## Összefoglalás\n\nAmennyiben gyorsaságra, tiszta munkára és jó hangszigetelésre van szükség, a gipszkarton a nyerő. Ha tömör felületre és rendkívül nehéz bútorok felfüggesztésére van szükség, a tégla lehet a befutó.\n\n\n\n[EPITOTUDAS_BLOCKS_DATA:{\"blocks\":[{\"id\":\"a4_1\",\"type\":\"text\",\"content\":\"Új válaszfal építésénél vagy lakásfelújításnál az egyik leggyakoribb kérdés: gipszkartonból vagy hagyományos falazóelemből (tégla / Ytong) építsük meg a falat? Ebben a cikkben összehasonlítjuk a két technológiát.\"},{\"id\":\"a4_2\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Összehasonlító Műszaki Táblázat\"},{\"id\":\"a4_3\",\"type\":\"table\",\"tableHeaders\":[\"Szempont\",\"Gipszkarton Válaszfal (W112)\",\"Tégla / Ytong Válaszfal\"],\"tableRows\":[[\"Súly (m²)\",\"kb. 25–30 kg/m² (Könnyű)\",\"kb. 110–160 kg/m² (Nehéz)\"],[\"Kivitelezési idő\",\"Gyors, száraz technológia (1-2 nap)\",\"Lassabb, nedves falazás és vakolás (5-7 nap)\"],[\"Száradási idő\",\"Azonnal festhető / burkolható\",\"Hetekig tartó száradás vakolás után\"],[\"Hangszigetelés (Rw)\",\"Kiváló (akár 52-58 dB gyapottal)\",\"Jó (40-48 dB tömegfüggő)\"],[\"Födémterhelés\",\"Minimális, nem igényel statikai méretezést\",\"Jelentős, meglévő födémnél ellenőrizni kell\"],[\"Szerelvényezés\",\"Gépészet rejtve a profilok között\",\"Horonymarás és vésés szükséges\"]]},{\"id\":\"a4_4\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Előnyök és Hátrányok Elemzése\"},{\"id\":\"a4_5\",\"type\":\"text\",\"content\":\"A gipszkarton legnagyobb előnye a száraz technológia és a kiváló hangszigetelés ásványgyapottal. A tégla falazat előnye a nagy egy ponti teherbírás és a tömör érzet, de jelentős nedvességet visz a szerkezetbe.\"},{\"id\":\"a4_6\",\"type\":\"highlight\",\"highlightType\":\"Szakmai tipp\",\"highlightTitle\":\"Döntési javaslat felújításhoz\",\"content\":\"Régi társasházak fagerendás vagy üreges födémeinél a tégla falazat súlya statikailag veszélyes lehet. Ilyen esetekben kizárólag a gipszkarton válaszfal az ajánlott megoldás!\"},{\"id\":\"a4_7\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Összefoglalás\"},{\"id\":\"a4_8\",\"type\":\"text\",\"content\":\"Amennyiben gyorsaságra, tiszta munkára és jó hangszigetelésre van szükség, a gipszkarton a nyerő. Ha tömör felületre és rendkívül nehéz bútorok felfüggesztésére van szükség, a tégla lehet a befutó.\"}],\"seo\":{\"seoTitle\":\"Gipszkarton vagy tégla válaszfal? Melyiket válaszd? | ÉpítőTudás\",\"metaDescription\":\"Objektív szakmai összehasonlítás: gipszkarton vs tégla/Ytong válaszfal. Ár, súly, kivitelezési idő és hangszigetelés szempontjából.\",\"primaryKeyword\":\"gipszkarton vagy tégla válaszfal\",\"relatedKeywords\":\"szárazépítés vs falazás, Ytong válaszfal, hangszigetelés, födémterhelés\"}}]",
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 0,
    rating: 4.9,
    rating_count: 29,
    featured_image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=1200&q=80',
    read_time: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'art-demo-5',
    category_id: 'cat-1',
    title: 'Gipszkartonozás: a leggyakoribb kivitelezési hibák és hogyan előzhetők meg',
    slug: 'gipszkartonozas-leggyakoribb-kivitelezesi-hibak',
    excerpt: 'A 10 leggyakoribb szakmai hiba a gipszkartonozás során: elmaradt akusztikai szalag, keresztfések, túlmély csavarfejek és repedező hézagok megelőzése.',
    content: "## Gipszkartonozási Kivitelezési Hibák\n\nA gipszkartonozás egyszerűnek tűnő folyamat, azonban a szakszerűtlen kivitelezés idővel falrepedésekhez, gyenge hangszigeteléshez és kilazuló elemekhez vezet. Íme a leggyakoribb hibák és megelőzésük.\n\n## 1. Akusztikai szigetelőszalag elhagyása az UW profil alól\n\n> **⚡ SZAKEMBER**: Ha az UW profilt közvetlenül a betonra rögzítik szigetelőszalag nélkül, a padló rezgései és a testhangok akadálytalanul átterjednek a válaszfalra!\n\n## 2. Keresztkötések és nyílások sarki lapillesztései\n\nGyakori hiba, hogy a gipszkarton lapok függőleges toldását pontosan az ajtótok sarkához illesztik. Az ajtó csapódása miatt a sarkoknál elkerülhetetlenül megreped a glettelés.\n\n> **[Figyelem] Ajtónyílások lapozási szabálya**\n> Az ajtónyílások felett mindig L-alakban kivágott gipszkarton lapot kell alkalmazni, úgy, hogy a lapillesztés legalább 15-20 cm-re essen az ajtó sarkától!\n\n## 3. A csavarfejek átszakítása\n\nHa a csavarbehajtó túl mélyre engedi a csavart és átszakítja a papírréteget, a csavar tartóereje nullára csökken. Használj mélységhatároló bitfejet!\n\n## Minőségellenőrző Lista a Hibák Ellen\n\n- [ ] Az UW keret alatt jelen van a szigetelőszalag\n- [ ] Az ajtósarkoknál L-kivágású lapok találhatók\n- [ ] A csavarfejek 0.5-1 mm-re süllyednek, a karton nem szakadt\n- [ ] Minden hézagnál jelen van az üvegszálas vagy papír szalag\n- [ ] A CW profilok nincsenek mereven hozzácsavarozva az UW profilhoz\n\n## Összefoglalás\n\nA technológiai utasítások és dilatációs szabályok betartásával hosszú évtizedekig repedésmentes, szilárd gipszkarton szerkezetet kapunk.\n\n\n\n[EPITOTUDAS_BLOCKS_DATA:{\"blocks\":[{\"id\":\"a5_1\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Gipszkartonozási Kivitelezési Hibák\"},{\"id\":\"a5_2\",\"type\":\"text\",\"content\":\"A gipszkartonozás egyszerűnek tűnő folyamat, azonban a szakszerűtlen kivitelezés idővel falrepedésekhez, gyenge hangszigeteléshez és kilazuló elemekhez vezet. Íme a leggyakoribb hibák és megelőzésük.\"},{\"id\":\"a5_3\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"1. Akusztikai szigetelőszalag elhagyása az UW profil alól\"},{\"id\":\"a5_4\",\"type\":\"warning\",\"warningType\":\"specialist\",\"content\":\"Ha az UW profilt közvetlenül a betonra rögzítik szigetelőszalag nélkül, a padló rezgései és a testhangok akadálytalanul átterjednek a válaszfalra!\"},{\"id\":\"a5_5\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"2. Keresztkötések és nyílások sarki lapillesztései\"},{\"id\":\"a5_6\",\"type\":\"text\",\"content\":\"Gyakori hiba, hogy a gipszkarton lapok függőleges toldását pontosan az ajtótok sarkához illesztik. Az ajtó csapódása miatt a sarkoknál elkerülhetetlenül megreped a glettelés.\"},{\"id\":\"a5_7\",\"type\":\"highlight\",\"highlightType\":\"Figyelem\",\"highlightTitle\":\"Ajtónyílások lapozási szabálya\",\"content\":\"Az ajtónyílások felett mindig L-alakban kivágott gipszkarton lapot kell alkalmazni, úgy, hogy a lapillesztés legalább 15-20 cm-re essen az ajtó sarkától!\"},{\"id\":\"a5_8\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"3. A csavarfejek átszakítása\"},{\"id\":\"a5_9\",\"type\":\"text\",\"content\":\"Ha a csavarbehajtó túl mélyre engedi a csavart és átszakítja a papírréteget, a csavar tartóereje nullára csökken. Használj mélységhatároló bitfejet!\"},{\"id\":\"a5_10\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Minőségellenőrző Lista a Hibák Ellen\"},{\"id\":\"a5_11\",\"type\":\"checklist\",\"checkItems\":[{\"id\":\"chk1\",\"text\":\"Az UW keret alatt jelen van a szigetelőszalag\"},{\"id\":\"chk2\",\"text\":\"Az ajtósarkoknál L-kivágású lapok találhatók\"},{\"id\":\"chk3\",\"text\":\"A csavarfejek 0.5-1 mm-re süllyednek, a karton nem szakadt\"},{\"id\":\"chk4\",\"text\":\"Minden hézagnál jelen van az üvegszálas vagy papír szalag\"},{\"id\":\"chk5\",\"text\":\"A CW profilok nincsenek mereven hozzácsavarozva az UW profilhoz\"}]},{\"id\":\"a5_12\",\"type\":\"heading\",\"level\":\"h2\",\"content\":\"Összefoglalás\"},{\"id\":\"a5_13\",\"type\":\"text\",\"content\":\"A technológiai utasítások és dilatációs szabályok betartásával hosszú évtizedekig repedésmentes, szilárd gipszkarton szerkezetet kapunk.\"}],\"seo\":{\"seoTitle\":\"Gipszkartonozás hibái és megelőzésük | ÉpítőTudás Kivitelezés\",\"metaDescription\":\"A 10 leggyakoribb gipszkartonozási hiba: akusztikai szalag elhagyása, sarokrepedések, átszakadt csavarok megelőzése.\",\"primaryKeyword\":\"gipszkartonozás hibái\",\"relatedKeywords\":\"gipszkarton repedés, hézagolás, csavarbehajtás, akusztikai szalag\"}}]",
    author: 'ÉpítőTudás Szerkesztőség',
    status: 'published',
    views: 0,
    rating: 4.8,
    rating_count: 17,
    featured_image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
    read_time: 8,
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

export async function incrementArticleViews(articleId: string): Promise<number> {
  if (!articleId) return 0;
  try {
    const { data, error } = await supabase.rpc('increment_article_views', {
      article_id_input: articleId,
    });
    if (!error && typeof data === 'number') {
      return data;
    }
  } catch (e) {
    console.error('Failed to increment article views via RPC:', e);
  }

  try {
    const key = `epitotudas_article_views_${articleId}`;
    const current = parseInt(localStorage.getItem(key) || '0', 10);
    const updated = current + 1;
    localStorage.setItem(key, updated.toString());
    return updated;
  } catch {
    return 1;
  }
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
