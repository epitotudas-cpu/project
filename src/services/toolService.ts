import { supabase, type Tool } from '../lib/supabase';

const DEFAULT_ENCYCLOPEDIA_TOOLS: Tool[] = [
  {
    id: 'tool-1',
    name: 'Ácskalapács',
    slug: 'acskalapacs',
    type: 'Kéziszerszámok',
    subtype: 'Kalapácsok',
    brand: 'Fiskars / Stanley / Milwaukee',
    description: 'Az ácskalapács az fa szerkezetek és zsaluzási munkák építésénél használt legfontosabb kéziszerszám.',
    specs: { súly: '600g', nyél: 'Üvegszálas vagy acél', fej: 'Mágneses szegtartóval' },
    price: null,
    currency: 'HUF',
    features: ['Mágneses szegtartó fej', 'Körmös szegkihúzó kialakítás', 'Rezgéscsillapított ergonomikus nyél'],
    rating: 4.9,
    rating_count: 32,
    image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Ács', 'Zsaluzó ács', 'Tetőfedő'],
    uses: ['Szegezés', 'Zsaluzási munkák', 'Faszerkezetek összeállítása', 'Szegek eltávolítása bontáskor'],
    parts: [
      { name: 'Fej', description: 'Edzett acélból készült felület mágneses fészekkel a szeg beillesztéséhez.' },
      { name: 'Nyél', description: 'Rezgéscsillapított üvegszálas vagy monolit acél szerkezet kényelmes gumírozással.' },
      { name: 'Köröm', description: 'Hasított ívelt acél végződés a szegek gyors és hatékony kihúzásához.' },
      { name: 'Ütőfelület', description: 'Rovátkolt vagy sima edzett acél felület a szegfej elcsúszása ellen.' },
    ],
    buying_guide: [
      'Mindig a munkához illő súlyt válaszd (500g - 600g közötti a leguniverzálisabb).',
      'Előnyös a mágneses szegtartóval ellátott fej az egykezes indításhoz magasságban végzett munkáknál.',
      'Részesítsd előnyben az egybeöntött acél vagy üvegszálas nyelet a fa nyelekkel szemben.',
    ],
    common_mistakes: [
      '❌ Túl nehéz kalapács használata, ami gyors csukló- és vállfáradáshoz vezet.',
      '❌ Repedt vagy kilazult nyéllel való munkavégzés (balesetveszély!).',
      '❌ Nem megfelelő típus választása (pl. lakatos kalapáccsal zsaluzni).',
    ],
    technical_specs: {
      'Súly': '600 g',
      'Nyél anyaga': 'Üvegszálas erősítésű polimer',
      'Fej anyaga': 'Kovácsolt edzett szénacél',
      'Fej felülete': 'Rovátkolt mágneses szegtartóval',
    },
    video_url: 'https://www.youtube.com/embed/5a2d6GqJd_w',
    recommended_products: [
      { name: 'Stanley FatMax Ácskalapács 600g', brand: 'Stanley', partner_url: 'https://example.com/stanley-fatmax', image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=300&q=80' },
      { name: 'Milwaukee IsoCore Ácskalapács Mágneses', brand: 'Milwaukee', partner_url: 'https://example.com/milwaukee-isocore', image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=300&q=80' },
    ],
    seo_title: 'Ácskalapács Mágneses Szegtartóval – Építőipari Enciklopédia | ÉpítőTudás',
    seo_description: 'Minden az ácskalapácsról: felépítés, anatómia, mágneses fej, szegkihúzó köröm, zsaluzási tanácsok, vásárlási útmutató és hibák.',
    keywords: ['ácskalapács', 'zsaluzó kalapács', 'mágneses kalapács', 'stanley ácskalapács', 'milwaukee isocore'],
    canonical_url: 'https://epitotudas.hu/eszkozok/acskalapacs',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-2',
    name: 'Kőműves kalapács',
    slug: 'komuves-kalapacs',
    type: 'Kéziszerszámok',
    subtype: 'Kalapácsok',
    brand: 'Peddinghaus / Picard',
    description: 'A kőműves kalapács lapos vágóéllel ellátott szerszám tégla faragásához és igazításához.',
    specs: { súly: '500g', nyél: 'Fa vagy üvegszál' },
    price: null,
    currency: 'HUF',
    features: ['Vágóél a tégla pattintásához', 'Edzett acél fej'],
    rating: 4.8,
    rating_count: 20,
    image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Kőműves', 'Burkoló'],
    uses: ['Tégla igazítása falazáskor', 'Kisebb bontási munkák', 'Kő pattintása'],
    parts: [
      { name: 'Ütőlap', description: 'Négyzetes lap a tégla beütéséhez.' },
      { name: 'Vágóél', description: 'Lapos ék alakú él a tégla precíz elvágásához.' },
    ],
    buying_guide: ['Edzett pengéjű típust válassz, ami nem csorbul ki tégla vágásánál.'],
    common_mistakes: ['❌ Kőműves kalapáccsal fém vésőt ütni.'],
    technical_specs: { 'Súly': '500 g', 'Fej': 'Vágóéles edzett acél' },
    video_url: null,
    recommended_products: [
      { name: 'Peddinghaus Kőműveskalapács 500g', brand: 'Peddinghaus', partner_url: 'https://example.com/peddinghaus', image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=300&q=80' },
    ],
    seo_title: 'Kőműves Kalapács – Vágóéles Kézi Szerszám | ÉpítőTudás',
    seo_description: 'Minden a kőműves kalapácsról: vágóél használata tégla pattintásakor, felépítés és műszaki adatok.',
    keywords: ['kőműves kalapács', 'tégla vágás', 'vakoló kalapács'],
    canonical_url: 'https://epitotudas.hu/eszkozok/komuves-kalapacs',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-hammer-3',
    name: 'Lakatos kalapács',
    slug: 'lakatos-kalapacs',
    type: 'Kéziszerszámok',
    subtype: 'Kalapácsok',
    brand: 'Gedore / Hazet / Stanley',
    description: 'Négyzetes ütőfelülettel és gömbölyített vagy ék alakú szemből álló univerzális fémmegmunkáló kéziszerszám.',
    specs: { súly: '300g - 1000g', nyél: 'KőrisFA vagy hikkori' },
    price: null,
    currency: 'HUF',
    features: ['DIN 1041 szabványnak megfelelő kovácsolt fej', 'Hikkori vagy kőrisfa nyél acél védőhülvellyel'],
    rating: 4.85,
    rating_count: 25,
    image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Lakatos', 'Szerelő', 'Fémszerkezet építő'],
    uses: ['Fémidomok egyengetése', 'Csapszegek beütése', 'Vésők és pontozók ütése', 'Szerelési munkák'],
    parts: [
      { name: 'Pálya (Ütőfelület)', description: 'Síkra köszörült edzett acél felület.' },
      { name: 'Szem', description: 'Keresztirányú ék alakú végződés fém alakításához.' },
      { name: 'Hikkori nyél', description: 'Rugalmas, tömör faanyag a rezgés elnyelésére.' },
    ],
    buying_guide: ['DIN 1041 szabvány szerinti kovácsolt edzett fejet válassz acél nyélvédő hüvellyel.'],
    common_mistakes: ['❌ Kilazult faékű nyéllel dolgozni.'],
    technical_specs: { 'Szabvány': 'DIN 1041', 'Súly': '500 g', 'Nyél': 'Hikkori fa' },
    video_url: null,
    recommended_products: [],
    seo_title: 'Lakatos Kalapács DIN 1041 – Fémmegmunkálás | ÉpítőTudás',
    seo_description: 'DIN 1041 lakatos kalapács bemutatása, szerelési tanácsok és hikkori nyél jellemzői.',
    keywords: ['lakatos kalapács', 'din 1041', 'fémipari szerszám'],
    canonical_url: 'https://epitotudas.hu/eszkozok/lakatos-kalapacs',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-hammer-4',
    name: 'Gumikalapács (Kímélő ütőfejjel)',
    slug: 'gumikalapacs',
    type: 'Kéziszerszámok',
    subtype: 'Kalapácsok',
    brand: 'Rubi / Raimondi / Wiha',
    description: 'Rugalmas gumi ütőfejjel rendelkező kímélő kalapács burkolólapok, térkövek és érzékeny felületek beállításához.',
    specs: { súly: '450g - 900g', fej: 'Fehér vagy fekete gumi' },
    price: null,
    currency: 'HUF',
    features: ['Nyomot nem hagyó fehér gumi kiadás', 'Visszapattanás mentes (Dead-blow) kivitel'],
    rating: 4.9,
    rating_count: 38,
    image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Burkoló', 'Térkövező', 'Asztalos', 'Parkettás'],
    uses: ['Greslapok igazítása csemperagasztóban', 'Térkő ágyazása', 'Bútoripari elemek összeillesztése'],
    parts: [
      { name: 'Gumi ütőfej', description: 'Különböző keménységű szintetikus kaucsuk fej.' },
      { name: 'Fémpor töltet (visszapattanás gátló)', description: 'Dead-blow típusoknál acélsörét elnyeli a visszarúgást.' },
    ],
    buying_guide: ['Fehér burkolólapokhoz kizárólag nyomot nem hagyó FEHÉR gumikalapácsot szabad használni!'],
    common_mistakes: ['❌ Fekete gumikalapács használata világos greslapokon (feketén megjelöli a lapot!).'],
    technical_specs: { 'Fej keménység': 'Medium / Hard', 'Típus': 'Visszapattanás gátolt' },
    video_url: null,
    recommended_products: [
      { name: 'Rubi Fehér Gumikalapács 500g', brand: 'Rubi', partner_url: 'https://example.com/rubi-mallet', image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=300&q=80' },
    ],
    seo_title: 'Fehér Gumikalapács Burkolóknak & Térkövezőknek | ÉpítőTudás',
    seo_description: 'Miért kell fehér gumikalapács a burkoláshoz? Visszapattanás-gátolt dead-blow kivitel.',
    keywords: ['gumikalapács', 'fehér gumikalapács', 'burkoló szerszám', 'rubi kalapács'],
    canonical_url: 'https://epitotudas.hu/eszkozok/gumikalapacs',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-hammer-5',
    name: 'Fakalapács (Asztalos kalapács)',
    slug: 'fakalapacs',
    type: 'Kéziszerszámok',
    subtype: 'Kalapácsok',
    brand: 'Stubai / Kirschen',
    description: 'Kemény bükkfából készült szögletes fejű kalapács faipari vésők ütéséhez és csapozások összeállításához.',
    specs: { anyag: 'Gőzölt bükkfa', súly: '400g' },
    price: null,
    currency: 'HUF',
    features: ['Enyhén döntött ütőlapok', 'Fa vésőnyél kímélő kialakítás'],
    rating: 4.8,
    rating_count: 15,
    image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Asztalos', 'Ács', 'Műbútorasztalos'],
    uses: ['Woodchisel / Fafúró vésők ütése', 'Csapfészkek összeütése', 'Faszerkezeti kötések igazítása'],
    parts: [
      { name: 'Bükkfa fej', description: 'Trapéz keresztmetszetű gőzölt keményfa fej.' },
    ],
    buying_guide: ['Fa vésőkhöz kizárólag fakalapácsot vagy gumikalapácsot használj, mert a fémkalapács szétverné a fanyelet.'],
    common_mistakes: ['❌ Fémkalapáccsal ütni a fa nyelet.'],
    technical_specs: { 'Anyag': 'Gőzölt bükk', 'Súly': '400 g' },
    video_url: null,
    recommended_products: [],
    seo_title: 'Bükk Fakalapács Asztalosoknak | ÉpítőTudás',
    seo_description: 'Faipari fakalapács vésők kímélő ütéséhez és csapozási munkákhoz.',
    keywords: ['fakalapács', 'asztalos kalapács', 'bükkfa kalapács'],
    canonical_url: 'https://epitotudas.hu/eszkozok/fakalapacs',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-hammer-6',
    name: 'Ráverő kalapács (Bontó pöröly)',
    slug: 'ravero-kalapacs',
    type: 'Kéziszerszámok',
    subtype: 'Kalapácsok',
    brand: 'Stanley / Fiskars',
    description: 'Nagy súlyú (3kg - 5kg) kétkezes pöröly bontási munkákhoz és cölöpözéshez.',
    specs: { súly: '4000g', nyél: 'Üvegszálas 90cm' },
    price: null,
    currency: 'HUF',
    features: ['Rezgéscsillapított 90 cm-es nyél', 'Kovácsolt edzett pörölyfej'],
    rating: 4.9,
    rating_count: 22,
    image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Kőműves', 'Bontó szakmunkás', 'Alapozó'],
    uses: ['Betonszerkezetek bontása', 'Vésők mély beütése', 'Cölöpök és karók leverése'],
    parts: [
      { name: 'Pörölyfej', description: 'Kétoldalas sima edzett acél tömb.' },
      { name: 'Hosszú nyél', description: '90 cm-es üvegszálas vagy hikkori kar karos erőátvitelhez.' },
    ],
    buying_guide: ['Rezgéscsillapított gumi védőgalléros nyelet válassz a melléütési sérülések elkerülésére.'],
    common_mistakes: ['❌ Melléütésből adódó nyéltörés.'],
    technical_specs: { 'Súly': '4 kg', 'Nyélhossz': '90 cm' },
    video_url: null,
    recommended_products: [],
    seo_title: 'Bontó Pöröly 4kg – Ráverő Kalapács | ÉpítőTudás',
    seo_description: 'Kétkezes 4 kg-os ráverő bontó pöröly betonszerkezetek bontásához és cölöpözéshez.',
    keywords: ['pöröly', 'bontó kalapács', 'ráverő kalapács'],
    canonical_url: 'https://epitotudas.hu/eszkozok/ravero-kalapacs',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-3',
    name: 'SDS-Plus Fúrókalapács',
    slug: 'sds-plus-furokalapacs',
    type: 'Gépek és kisgépek',
    subtype: 'Fúrókalapácsok',
    brand: 'Bosch Professional / Makita / Hilti',
    description: 'Pneumatikus ütőművel rendelkező akkumulátoros vagy hálózati gép beton, tégla és kő fúrására, vésésére.',
    specs: { ütőenergia: '2.7 J', befogás: 'SDS-Plus', teljesítmény: '800 W' },
    price: null,
    currency: 'HUF',
    features: ['Pneumatikus ütőmű', 'SDS-Plus gyorstokmány', 'Vésési funkció forgatásleállítással'],
    rating: 4.95,
    rating_count: 45,
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Villanyszerelő', 'Épületgépész', 'Kőműves', 'Szerelő'],
    uses: ['Betonfúrás dübelekhez', 'Falhorony vésés', 'Csempebontás', 'Magfúrás téglafalba'],
    parts: [
      { name: 'SDS-Plus Toboz', description: 'Reteszelő golyós szerszámbefogó retesz hornyolt fúrószárakhoz.' },
      { name: 'Pneumatikus ütődugattyú', description: 'Nagy ütőenergiát előállító dugattyú hajtómű.' },
      { name: 'Üzemmód váltó', description: 'Fúrás, ütvefúrás és tisztán vésés funkció kapcsoló.' },
    ],
    buying_guide: [
      'Legalább 2.5 Joule ütőenergiájú gépet válassz rendszeres betonfúráshoz.',
      'Portalanító adapter csatlakoztatási lehetőség beltéri munkáknál elengedhetetlen.',
    ],
    common_mistakes: [
      '❌ SDS tokmánykenő zsír elhagyása (a tokmány korai kopásához vezet).',
      '❌ Túlzott rányomás fúrás közben (a pneumatikus ütőmű magától dolgozik).',
    ],
    technical_specs: {
      'Ütőenergia': '2.7 Joule',
      'Ütésszám': '0 - 4000 ütés/perc',
      'Befogás': 'SDS-Plus',
      'Max. fúrásátmérő betonban': '26 mm',
    },
    video_url: 'https://www.youtube.com/embed/5a2d6GqJd_w',
    recommended_products: [
      { name: 'Bosch GBH 2-26 DFR Fúrókalapács', brand: 'Bosch Professional', partner_url: 'https://example.com/bosch-gbh', image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80' },
      { name: 'Makita HR2470 SDS-Plus', brand: 'Makita', partner_url: 'https://example.com/makita-hr2470', image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80' },
    ],
    seo_title: 'SDS-Plus Fúrókalapács Betonfúráshoz & Véséshez | ÉpítőTudás',
    seo_description: 'SDS-Plus pneumatikus fúrókalapácsok működése, tokmánykezelés, fúrási és vésési útmutató.',
    keywords: ['fúrókalapács', 'sds-plus', 'bosch gbh', 'betonfúró gép'],
    canonical_url: 'https://epitotudas.hu/eszkozok/sds-plus-furokalapacs',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-4',
    name: 'Sarokcsiszoló (Flex)',
    slug: 'sarokcsiszolo',
    type: 'Gépek és kisgépek',
    subtype: 'Sarokcsiszolók',
    brand: 'Bosch Professional / DeWalt / Makita',
    description: 'Nagy fordulatszámú kézi vágó- és csiszológép fémek, betonacél, csempék és téglák méretre vágásához.',
    specs: { tárcsaátmérő: '125 mm', fordulatszám: '11000 ford/perc' },
    price: null,
    currency: 'HUF',
    features: ['Újraindulás elleni védelem', 'Gyorsállítású védőburkolat', 'Vibration Control pótfogantyú'],
    rating: 4.9,
    rating_count: 50,
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Lakatos', 'Burkoló', 'Kőműves', 'Villanyszerelő'],
    uses: ['Betonacél vágása', 'Csempe szélcsiszolása és vágása', 'Sorjátlanítás', 'Falhorony vágás'],
    parts: [
      { name: 'Vágótárcsa tengely', description: 'M14-es menetes tengely gyorsszorító anyával.' },
      { name: 'Védőburkolat', description: 'Forgácselterelő biztonsági védőelem.' },
    ],
    buying_guide: ['Válassz lágyindítással és lágy leállással rendelkező biztonsági típust.'],
    common_mistakes: ['❌ Védőburkolat vagy védőszemüveg nélküli munkavégzés.'],
    technical_specs: { 'Tárcsaátmérő': '125 mm', 'Menet': 'M14' },
    video_url: null,
    recommended_products: [],
    seo_title: 'Sarokcsiszoló 125mm (Flex) – Biztonságos Vágás | ÉpítőTudás',
    seo_description: 'Sarokcsiszolók (flex) biztonsági funkciói, tárcsaválasztás fémhez és csempéhez.',
    keywords: ['sarokcsiszoló', 'flex', 'vágótárcsa', '125mm flex'],
    canonical_url: 'https://epitotudas.hu/eszkozok/sarokcsiszolo',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-5',
    name: 'Lézeres Szintező & Vonalfény',
    slug: 'lezeres-szintezo',
    type: 'Mérőeszközök',
    subtype: 'Lézeres szintezők',
    brand: 'Bosch Professional / Leica / Dewalt',
    description: 'Önszintező 360 fokos zöld lézerfényes szintezőműszer burkolási, gipszkartonozási és falazási munkákhoz.',
    specs: { hatótáv: '30m', pontosság: '±0.2 mm/m', lézervonal: '3x360° Zöld' },
    price: null,
    currency: 'HUF',
    features: ['360 fokos zöld lézervonal', 'Önszintező ingamechanizmus', 'Állványra szerelhető magassági konzol'],
    rating: 5.0,
    rating_count: 28,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Burkoló', 'Gipszkartonozó', 'Kőműves', 'Épületgépész'],
    uses: ['Aljzatkiegyenlítés szintezés', 'Csempe sorok kitűzése', 'Mennyezetfüggesztés gipszkartonnál'],
    parts: [
      { name: 'Lézerdióda', description: 'Nagy láthatóságú zöld fényt kibocsátó kristály modul.' },
      { name: 'Ingás szintező', description: 'Gravitációs önszintező inga mágneses csillapítással.' },
    ],
    buying_guide: ['Beltéri és kültéri munkákhoz a zöld lézerfény 4x jobban látható, mint a piros.'],
    common_mistakes: ['❌ Szállítás kikapcsolt ingareteszelés nélkül (tönkreteszi a kalibrációt).'],
    technical_specs: { 'Pontosság': '±0.2 mm/m', 'Fény szín': 'Zöld (515 nm)', 'Önszintezés': '±4°' },
    video_url: null,
    recommended_products: [],
    seo_title: 'Zöld Lézeres Szintező 360° – Pontos Mérés | ÉpítőTudás',
    seo_description: '3D 360 fokos zöld lézeres szintezők gipszkartonozáshoz és burkoláshoz.',
    keywords: ['lézeres szintező', 'zöld lézer', 'bosch lézer'],
    canonical_url: 'https://epitotudas.hu/eszkozok/lezeres-szintezo',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-6',
    name: 'Homlokzati Állványrendszer (Keretes)',
    slug: 'homlokzati-allvanyrendszer',
    type: 'Állványok és segédeszközök',
    subtype: 'Állványrendszerek',
    brand: 'Layher / Peri / Hunnebeck',
    description: 'Moduláris keretes acél és alumínium homlokzati állványrendszer magasépítési munkák biztonságos elvégzéséhez.',
    specs: { terhelhetőség: '200 kg/m²', csatlakozás: 'Ékes / Keretes' },
    price: null,
    currency: 'HUF',
    features: ['Beépített korlát és lábdeszka', 'Csúszásmentes járólapok', 'Állítható menetes talpak'],
    rating: 4.85,
    rating_count: 18,
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Kőműves', 'Homlokzati szigetelő', 'Festő', 'Bádogos'],
    uses: ['Homlokzati hőszigetelés', 'Vakolás és festés', 'Tetőfedés biztonsági zárása'],
    parts: [
      { name: 'Vertikális keret', description: 'Acélcső keret tartó tüskékkel.' },
      { name: 'Járólap', description: 'Alumínium vagy perforált acél járófelület feljáró kibúvóval.' },
    ],
    buying_guide: ['Kizárólag érvényes ÉMI tanúsítvánnyal rendelkező állványrendszert szabad építeni.'],
    common_mistakes: ['❌ Kikötési pontok kihagyása a homlokzatból.'],
    technical_specs: { 'Terhelhetőség': '200 kg/m²', 'Rendszer': 'Homlokzati keretes' },
    video_url: null,
    recommended_products: [],
    seo_title: 'Homlokzati Állványrendszer Építése & Szabályai | ÉpítőTudás',
    seo_description: 'ÉMI tanúsított moduláris keretes homlokzati állványrendszerek biztonsági követelményei.',
    keywords: ['állványrendszer', 'homlokzati állvány', 'layher állvány'],
    canonical_url: 'https://epitotudas.hu/eszkozok/homlokzati-allvanyrendszer',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-7',
    name: 'Munkavédelmi Sisak & Védőszemüveg',
    slug: 'munkavedelmi-sisak',
    type: 'Munkavédelmi eszközök',
    subtype: 'Védősisakok',
    brand: 'Petzl / MSA / 3M',
    description: 'MSZ EN 397 szabványnak megfelelő ütésálló védősisak állszíjjal és látásvédő pazzsal.',
    specs: { szabvány: 'EN 397', héj: 'ABS műanyag' },
    price: null,
    currency: 'HUF',
    features: ['6 pontos szalagbelső', 'Ratch rögzítő tárcsa', 'Szellőzőnyílások'],
    rating: 4.95,
    rating_count: 40,
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Minden építőipari szakma', 'Ács', 'Munkavezető', 'Darus'],
    uses: ['Fejvédelem leeső tárgyak ellen', 'Magasban végzett munkák'],
    parts: [
      { name: 'ABS héj', description: 'Kétkomponensű ütésnyelő műanyag védőhéj.' },
      { name: 'Belső kosár', description: 'Energiaelnyelő szalagrendszer rögzítő tárcsával.' },
    ],
    buying_guide: ['Ellenőrizd a sisak szavatossági idejét (gyártástól számított max 5 év).'],
    common_mistakes: ['❌ Sérült, elöregedett sisak használata.'],
    technical_specs: { 'Szabvány': 'EN 397', 'Súly': '380 g' },
    video_url: null,
    recommended_products: [],
    seo_title: 'MSZ EN 397 Munkavédelmi Sisak | ÉpítőTudás',
    seo_description: 'Építőipari védősisakok szabványai, szavatossága és fejvédelmi útmutató.',
    keywords: ['munkavédelmi sisak', 'en 397', 'fejvédelem'],
    canonical_url: 'https://epitotudas.hu/eszkozok/munkavedelmi-sisak',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tool-8',
    name: 'Archicad / BIM Tervezőszoftver',
    slug: 'archicad-bim-szoftver',
    type: 'Digitális eszközök és szoftverek',
    subtype: 'BIM rendszerek',
    brand: 'Graphisoft',
    description: 'Építészeti 3D BIM (Building Information Modeling) tervező szoftver komplett kiviteli tervekhez és mennyiségszámításhoz.',
    specs: { platform: 'Windows / macOS', format: 'IFC, DWG, PLN' },
    price: null,
    currency: 'HUF',
    features: ['Parametrikus 3D BIM elemek', 'Automatikus konszignáció és költségvetés', 'BIMx mobil modellbemutató'],
    rating: 5.0,
    rating_count: 60,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    professions: ['Építész tervező', 'Tartószerkezeti mérnök', 'Kivitelező projektvezető'],
    uses: ['3D építészeti modell alkotás', 'Kiviteli tervek generálása', 'Anyagmennyiség kigyűjtés'],
    parts: [
      { name: 'BIM Engine', description: 'Intelligens fal, födém és nyílászáró parametrikus motor.' },
      { name: 'Consignation Tool', description: 'Automatikus lisztázó és kimutatás készítő modul.' },
    ],
    buying_guide: ['Válassz felhőalapú Teamwork licenszet a társtervezőkkel való közös munkához.'],
    common_mistakes: ['❌ Nem parametrikus 2D rajzolás BIM elemek helyett.'],
    technical_specs: { 'Platform': 'Win/Mac', 'Interoperabilitás': 'OPEN BIM / IFC 4' },
    video_url: null,
    recommended_products: [],
    seo_title: 'Archicad 3D BIM Tervezőszoftver | ÉpítőTudás',
    seo_description: 'Építészeti BIM 3D tervezés Archicad szoftverrel, IFC export és mennyiségszámítás.',
    keywords: ['archicad', 'bim tervezés', 'graphisoft'],
    canonical_url: 'https://epitotudas.hu/eszkozok/archicad-bim-szoftver',
    is_indexable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function listTools(options?: {
  status?: 'all' | Tool['status'];
  type?: string;
  brand?: string;
  limit?: number;
}): Promise<Tool[]> {
  const combined: Tool[] = [...DEFAULT_ENCYCLOPEDIA_TOOLS];
  try {
    const { data, error } = await supabase.from('tools').select('*');
    if (!error && data && data.length > 0) {
      const existingSlugs = new Set(combined.map((t) => t.slug));
      for (const item of data as Tool[]) {
        if (!existingSlugs.has(item.slug)) {
          combined.push(item);
        }
      }
    }
  } catch (err) {
    void err;
  }

  let filtered = combined;
  if (options?.status && options.status !== 'all') {
    filtered = filtered.filter((t) => t.status === options.status);
  }
  if (options?.type) {
    filtered = filtered.filter((t) => t.type === options.type);
  }
  if (options?.brand) {
    filtered = filtered.filter((t) => t.brand === options.brand);
  }
  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  return filtered;
}

export async function getActiveTools(options?: {
  type?: string;
  brand?: string;
  limit?: number;
}): Promise<Tool[]> {
  return listTools({ status: 'active', ...options });
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTool(payload: Record<string, unknown>): Promise<Tool> {
  const res = await supabase.from('tools').insert(payload).select('*').single();
  if (res.error) throw res.error;
  return res.data as Tool;
}

export async function updateTool(id: string, payload: Record<string, unknown>): Promise<Tool> {
  const res = await supabase.from('tools').update(payload).eq('id', id).select('*').single();
  if (res.error) throw res.error;
  return res.data as Tool;
}

export async function setToolStatus(id: string, status: Tool['status']): Promise<void> {
  const { error } = await supabase.from('tools').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function countTools(): Promise<number> {
  const { count, error } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function getToolBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from('tools')
    .select('brand')
    .neq('brand', null);
  if (error) throw error;
  const brands = [...new Set((data ?? []).map((t) => t.brand).filter((b): b is string => Boolean(b)))];
  return brands.sort();
}

export async function getToolTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('tools')
    .select('type')
    .neq('type', null);
  if (error) throw error;
  const types = [...new Set((data ?? []).map((t) => t.type).filter((t): t is string => Boolean(t)))];
  return types.sort();
}

