export interface MaterialToolItem {
  category: 'Anyagok' | 'Kéziszerszámok' | 'Gépek' | 'Mérőeszközök';
  name: string;
  description: string;
}

export interface DictionaryTerm {
  hu: string;
  description: string;
  de: string;
  en: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface TradeDetail {
  id: string;
  name: string;
  iconName: string;
  tagline: string;
  categoryLabel: string;
  
  // 1. MI EZ A SZAKMA?
  overview: string;

  // 2. MIT CSINÁL EGY [SZAKMA]?
  whatDoesDo: {
    tasks: string[];
    buildings: string[];
    workflows: string[];
    soloWork: string;
    teamWork: string;
  };

  // 3. MIVEL DOLGOZIK?
  toolsAndMaterials: MaterialToolItem[];

  // 4. MIT KELL MEGTANULNI?
  knowledgeToLearn: {
    theory: string[];
    practice: string[];
    safety: string[];
  };

  // 5. MIT TANULSZ MEG A KÉPZÉS SORÁN?
  trainingOverview: string[];

  // 6. MENNYIRE NEHÉZ EZ A SZAKMA?
  difficulty: {
    physical: string;
    mental: string;
    precision: string;
  };

  // 7. MILYEN EMBERNEK VALÓ?
  suitableAttributes: string[];

  // 8. KINEK NEM AJÁNLOTT?
  unsuitableAttributes: string[];

  // 9. MILYENEK A MUNKAKÖRÜLMÉNYEK?
  workConditions: {
    location: string;
    weatherExposure: string;
    noiseAndDust: string;
    heightAndPhysical: string;
  };

  // 10. MIK A SZAKMA ELŐNYEI?
  pros: string[];

  // 11. MIK A SZAKMA HÁTRÁNYAI?
  cons: string[];

  // 12. HOL LEHET DOLGOZNI?
  workplaces: string[];

  // 13. HOGYAN LEHET TOVÁBB FEJLŐDNI?
  careerPath: string[];

  // 14. LEHET-E VÁLLALKOZÁST INDÍTANI?
  entrepreneurship: {
    possible: boolean;
    services: string[];
    clients: string[];
    prosAndCons: string;
  };

  // 15. KAPCSOLÓDÓ SZAKMÁK
  relatedTrades: {
    name: string;
    reason: string;
  }[];

  // 16. GYAKORI KÉRDÉSEK
  faqs: FAQItem[];

  // 17. SZAKMAI SZÓTÁR (HU / DE / EN)
  dictionary: DictionaryTerm[];

  // 18. RÖVID ÖSSZEFOGLALÓ – "NEKED VALÓ EZ A SZAKMA?"
  summaryChecklist: {
    goodFitIf: string[];
    considerOtherIf: string[];
  };
}

export const TRADE_DETAILS: Record<string, TradeDetail> = {
  komuves: {
    id: 'komuves',
    name: 'Kőműves',
    iconName: 'Hammer',
    tagline: 'Az építmények vázának, teherhordó és elválasztó falainak mestere',
    categoryLabel: 'Szerkezetépítés',
    overview:
      'A kőműves az az építőipari szakember, aki megépíti az épületek szilárd szerkezetét. Téglákból, blokkelemekből falakat emel, elvégzi az alapozási munkákat, felhúzza a teherhordó pilléreket, és kiszintezi a beton aljzatokat. Munkája nélkül egyetlen családi ház vagy társasház sem állhat meg a lábán.',
    whatDoesDo: {
      tasks: [
        'Teherhordó és válaszfalak falazása ékelt vagy csiszolt téglából és pórusbetonból',
        'Zsaluzási és betonozási alapmunkák előkészítése és kivitelezése',
        'Külső és belső falfelületek kézi és gépi vakolása, simítása',
        'Aljzatbetonozás, esztrich-készítés és szintbeállítás',
        'Áthidalók, koszorúk és kémények szakszerű beépítése',
      ],
      buildings: [
        'Családi házak és ikerházak',
        'Többszintes társasházak',
        'Ipari csarnokok és raktárak',
        'Műemléki épületek felújítása és átalakítása',
      ],
      workflows: [
        'Tervek értelmezése és zsinórozás (kitűzés)',
        'Habarcs- és betonkeverés a megfelelő konzisztenciáig',
        'Falazóelemek elhelyezése vízmértékkel és függőónnal',
        'Vakolási vezető sávok elhelyezése és felületképzés',
      ],
      soloWork: 'Egyes kisebb falazási szakaszok, vakolási sávok lehúzása és szintellenőrzések.',
      teamWork: 'Szoros együttműködés a segédmunkásokkal (habarcskeverés, anyagszállítás), az ácsokkal (zsaluzat, koszorúk) és a gépészekkel (hornyok hagyása).',
    },
    toolsAndMaterials: [
      { category: 'Anyagok', name: 'Égetett kerámia téglák, pórusbeton (Ytong), zsalukövek', description: 'A szerkezeti falak alapvető alkatrészei.' },
      { category: 'Anyagok', name: 'Gyári szárazhabarcs, cement, mész, homok', description: 'Falazó- és vakolóanyagok kötőanyaga.' },
      { category: 'Kéziszerszámok', name: 'Kőműveskanál, spakli, serpenyő, kőműveskalapács', description: 'Kézi habarcsterítés és téglakoppintás.' },
      { category: 'Kéziszerszámok', name: 'Alu ölesléc (2-3m), fa/műanyag simító, kaparó', description: 'Felületek síkba húzása és simítása.' },
      { category: 'Mérőeszközök', name: 'Vízmérték (60-200cm), függőón, zsinórozó, lézeres szintező', description: 'A függőleges és vízszintes pontosság biztosítására.' },
      { category: 'Gépek', name: 'Habarcskeverő gép, vakológép, téglavágó asztal (vizesvágó)', description: 'Gépesített anyagelőkészítés és vágás.' },
    ],
    knowledgeToLearn: {
      theory: [
        'Építészeti műszaki rajzok, alaprajzok és metszetek olvasása',
        'Építőanyagok fizikai és kémiai tulajdonságai (kötési idő, fagyállóság)',
        'Teherhordási alapelvek, kötésben falazás szabályai',
        'Hő- és páratechnikai alapok (hőhidak megelőzése)',
      ],
      practice: [
        'Pontos kitűzés zsinórállvánnyal',
        'Sarokrakás és falsorok egyenes vezetése',
        'Kézi és gépi vakolási technológiák',
        'Beton tömörítése és felületképzése',
      ],
      safety: [
        'Állványzatok biztonságos használata és ellenőrzése',
        'Szem- és légzésvédelem por és cement bekeverésekor',
        'Nehéz teher emelésének ergonómiai szabályai',
      ],
    },
    trainingOverview: [
      'Falazási kötésmódok (futókötés, kötőkötés, sarokkötések) elmélete és gyakorlata',
      'Vakolási vezetősávok elhelyezése és durva/finom vakolat készítése',
      'Ablak- és ajtónyílások áthidalási szabályai',
      'Kőműves szerszámok és gépek biztonságos kezelése',
    ],
    difficulty: {
      physical: 'Nagy fizikai megterhelést jelent. Gyakori a nehéz súlyok (25 kg-os zsákok, téglák) emelése, a hajlongás, térdelés és az egész napos állómunka.',
      mental: 'Közepes szellemi megterhelés. Szükséges a műszaki rajz olvasása, egyszerűbb felületszámítások és anyagmennyiség-becslések elvégzése.',
      precision: 'Magas pontosságot igényel. A ferde fal vagy nem vízszintes aljzat később a burkolónál és az ácsnál súlyos pluszköltségeket okoz.',
    },
    suitableAttributes: [
      'Jó fizikai állóképesség és teherbírás',
      'Fejlett térlátás és műszaki érzék',
      'Precízióra való törekvés (vízszint és függő tartása)',
      'Monotonitás-tűrés és megbízhatóság',
      'Képesség szabadtéri munkavégzésre',
    ],
    unsuitableAttributes: [
      'Ha kerülöd a kemény fizikai igénybevételt',
      'Ha nem bírod az évszakos időjárási ingadozásokat (meleg/hideg)',
      'Ha allergiás vagy a porra vagy cementre',
      'Ha pontatlanul, gyorsan összecsapva szeretsz dolgozni',
    ],
    workConditions: {
      location: 'Főként kültéri építési munkaterületek, szerkezetkész és felújítási épületek.',
      weatherExposure: 'Erősen kitett az időjárásnak (napsütés, szél, hideg). Télen a kötési időjárási korlátok miatt leállások lehetnek.',
      noiseAndDust: 'Magas porszint (cement, téglavágás) és közepes zorszint (vágógépek, keverők).',
      heightAndPhysical: 'Magasban végzett munka homlokzati állványokon (2-15m), folyamatos mozgással.',
    },
    pros: [
      'Alkotó, kézzelfogható munka: meglátszik az elvégzett falak és épületek eredménye',
      'Magas piaci kereslet a szakképzett kőművesek iránt',
      'Kiváló alap saját vállalkozás indításához vagy szerkezetépítő karrierhez',
      'Változatos munkaterületek és épülettípusok',
    ],
    cons: [
      'Jelentős fizikai terhelés az ízületekre és a gerincre hosszabb távon',
      'Időjárási kiszolgáltatottság az építkezéseken',
      'Poros és piszkos munkakörnyezet',
    ],
    workplaces: [
      'Magasépítési generálkivitelező vállalatok',
      'Szerkezetépítő szakvállalkozások',
      'Műemlékvédelmi és felújító cégek',
      'Egyéni vállalkozás (családi házak felújítása, falazás, vakolás)',
    ],
    careerPath: [
      'Kőműves tanuló → Kezdő kőműves szakmunkás → Önálló kőműves → Kőműves mester → Építésvezető / Művezető → Saját generálkivitelező vállalkozás',
    ],
    entrepreneurship: {
      possible: true,
      services: [
        'Családi házak szerkezetépítése és falazása',
        'Utólagos vakolási, hőszigetelési és kerítésépítési munkák',
        'Lakásfelújítási kőműves munkák (bontás, áthidalás, aljzatkészítés)',
      ],
      clients: ['Magánszemélyek (családi ház tulajdonosok)', 'Kisebb ingatlanfejlesztők'],
      prosAndCons: 'Nagy szabadságot és jó jövedelemszerzési lehetőséget biztosít, de felelősséggel jár az anyagszervezés és a határidők tartása terén.',
    },
    relatedTrades: [
      { name: 'Ács', reason: 'A kőműves falazza a koszorúk és a tetőszerkezet fogadófelületét.' },
      { name: 'Burkoló', reason: 'A burkoló a kőműves által elkészített vakolatra és aljzatbetonra dolgozik.' },
      { name: 'Épületgépész', reason: 'A gépész csövei és hornyai a kőműves falaiba kerülnek beépítésre.' },
    ],
    faqs: [
      { question: 'Nehéz megtanulni egyenesen falazni?', answer: 'A zsinór és a vízmérték használatát néhány hét gyakorlással el lehet sajátítani. A titok a türelem és a folyamatos ellenőrzés.' },
      { question: 'Kell hozzá jó matematikai tudás?', answer: 'Alapfokú geometria és aritmetika elegendő (terület- és térfogatszámítás, derékszög kitűzése Pitagorasz-tétellel).' },
      { question: 'Csak nyáron lehet dolgozni?', answer: 'Nem, a modern téli adalékszerekkel fagypont körül is lehet falazni, emellett télen sok a beltéri átalakítás és vakolás.' },
      { question: 'Lehet-e nőként kőművesnek tanulni?', answer: 'Igen, a gépesítés (gépi vakolás, emelők) terjedésével a fizikai teher csökken, a precíz látásmód pedig előny.' },
    ],
    dictionary: [
      { hu: 'Függőón', description: 'Függőleges irány beállítására szolgáló nehezék zsinóron.', de: 'Lot / Senkblei', en: 'Plumb bob' },
      { hu: 'Zsinórállvány', description: 'Épület sarkain felállított fa keret a tengelyek kitűzéséhez.', de: 'Schnurgerüst', en: 'Batter board' },
      { hu: 'Koszorú', description: 'Falak tetején futó vasbeton merevítő öv.', de: 'Ringanker', en: 'Ring beam' },
      { hu: 'Esztrich', description: 'Vékony, aljzatképző betonréteg burkolat alá.', de: 'Estrich', en: 'Screed' },
      { hu: 'Áthidaló', description: 'Ajtó- és ablaknyílások feletti teherhordó elem.', de: 'Sturz', en: 'Lintel' },
    ],
    summaryChecklist: {
      goodFitIf: [
        'Szereted a fizikai munkát és a szabadlevegőt',
        'Örömet okoz, ha látod a kezed nyomán felépülő falakat',
        'Precíz vagy és jó a térlátásod',
        'Szeretnél később saját építőipari vállalkozást indítani',
      ],
      considerOtherIf: [
        'Nem bírod a nehéz fizikai igénybevételt vagy a port',
        'Félsz a magasban végzett állványozási munkáktól',
        'Inkább steril, klimatizált irodai környezetre vágysz',
      ],
    },
  },

  acs: {
    id: 'acs',
    name: 'Ács és Zsaluzó ács',
    iconName: 'HomeIcon',
    tagline: 'Faszerkezetek, tetők és ipari zsalurendszerek formálója',
    categoryLabel: 'Szerkezetépítés',
    overview:
      'Az ács a faanyagok és zsaluzatok mestere. Ő készíti el a családi házak és épületek tetőszerkezetét (szarufák, szelemenek, torokgerendák), valamint a monolit vasbeton szerkezetek öntéséhez szükséges komplex zsaluzatokat és állványokat.',
    whatDoesDo: {
      tasks: [
        'Tetőszerkezetek fagerendáinak leszabása, cseplése és összeállítása',
        'Födémek, lépcsők és pillérek zsaluzatainak megépítése (zsaluzó ács)',
        'Faszerkezetű könnyűszerkezetes házak vázának felépítése',
        'Tetőlécezés, deszkázás és fóliázás előkészítése',
      ],
      buildings: [
        'Családi házak és hétvégi házak nyeregtetői, kontytetői',
        'Társasházak és középületek fafödémjei és magastetői',
        'Ipari vasbeton szerkezetek kút- és táblás zsaluzatai',
      ],
      workflows: [
        'Faanyagok és gerendák méretre vágása láncfűrésszel vagy gérvágóval',
        'Csapolások, lapolások és szeglemezes kötések elkészítése',
        'Zsalutáblák rögzítése átkötőorsókkal és gyámolítás támaszokkal',
        'Tetőszerkezet beállítása lézeres szintezővel és rögzítése',
      ],
      soloWork: 'Kisebb előkészítő vágások, gérvágások és egyedi fa elemek megmunkálása.',
      teamWork: 'Csapatmunka a daruzásnál, a nehéz gerendák beemelésénél és a tetőváz egyidejű rögzítésénél.',
    },
    toolsAndMaterials: [
      { category: 'Anyagok', name: 'Fenyő gerendák, pallók, deszkák, rétegelt lemezek', description: 'Hagyományos fa építőanyagok.' },
      { category: 'Anyagok', name: 'Zsalutáblák (Doka/Peri), Doka gerendák (H20), acél támaszok', description: 'Ipari zsaluzási elemek.' },
      { category: 'Kéziszerszámok', name: 'Ácskalapács (szegszedővel), balta, vésők, szzorítók', description: 'Formázó és illesztő szerszámok.' },
      { category: 'Gépek', name: 'Motoros láncfűrész, kézi körfűrész, akkus csavarozók', description: 'Erőgépek a gyors vágáshoz és rögzítéshez.' },
      { category: 'Mérőeszközök', name: 'Sáskaláb (szögmérő), ácscceruza, mérőszalag, lézer', description: 'Pontos szögvágások kimérése.' },
    ],
    knowledgeToLearn: {
      theory: ['Trigonometria és tetőszögek számítása', 'Fafajták tulajdonságai és teherbírása', 'Statikai alapismeretek és szélteher-számítások'],
      practice: ['Láncfűrész és körfűrész biztonságos kezelése', 'Csapolások és fakötések marása', 'Állványozás és zsaluzás beállítása'],
      safety: ['Kihúzható leesés elleni hám használata', 'Zuhanásgátló rendszerek kiépítése tetőn'],
    },
    trainingOverview: [
      'Tetőszerkezeti formák (nyereg, konty, sátortető) szerkesztése',
      'Zsaluzási rendszerek összeállítása rajz alapján',
      'Modern faipari kötőelemek (csavarok, szeglemezek) alkalmazása',
    ],
    difficulty: {
      physical: 'Nagy fizikai megterhelés. Súlyos gerendák emelése és magasban végzett egyensúlyozó munka jellemzi.',
      mental: 'Magas szellemi igény. Kiváló térlátást, szögméreteket és precíz matematikai vágásszámítást igényel.',
      precision: 'Nagy pontosság. Egy hibásan elvágott szarufa vagy szög elcsúsztatja az egész tetősíkot.',
    },
    suitableAttributes: ['Magabiztos mozgás magasban (tériszony hiánya)', 'Jó térlátás és matematikai szögérzék', 'Fizikai erő és ügyesség', 'Csapatjátékos hozzáállás'],
    unsuitableAttributes: ['Tériszony vagy szédülés magasban', 'Rossz egyensúlyérzék', 'Hideg vagy szeles időjárás elutasítása'],
    workConditions: {
      location: 'Magasban, épületek tetején vagy zsaluzott vasbeton födémeken.',
      weatherExposure: 'Erősen kitett a szélnek, napnak és hidegnek.',
      noiseAndDust: 'Fűrészpor és motoros láncfűrészek magas zorszintje.',
      heightAndPhysical: 'Folyamatos magasban végzett munka védőfelszerelésben.',
    },
    pros: ['Látványos, nagyívű szerkezetek megépítésének élménye', 'Kiemelkedő szakmai megbecsültség és jó kereseti lehetőség', 'Kreatív faipari megmunkálás'],
    cons: ['Kiemelt baleseti kockázat a magasban végzett munka miatt', 'Fizikai igénybevétel szeles, hideg időben'],
    workplaces: ['Tetőszerkezet-építő cégek', 'Generálkivitelezők zsaluzási részlegei', 'Saját ács vállalkozás'],
    careerPath: ['Ács tanuló → Önálló ács → Ács mester → Zsaluzási művezető → Saját vállalkozó'],
    entrepreneurship: {
      possible: true,
      services: ['Családi házak tetőépítése, tetőcseréje', 'Kerti kiülők, pergolák, kocsibeállítók építése'],
      clients: ['Magánszemélyek', 'Építész irodák'],
      prosAndCons: 'Nagy a kereslet a jó ácsokra, de komoly szerszám- és gépparkot igényel az indulás.',
    },
    relatedTrades: [
      { name: 'Tetőfedő', reason: 'Az ács szerkezetére rakja le a tetőfedő a cserepeket.' },
      { name: 'Kőműves', reason: 'A kőműves által öntött koszorúhoz rögzíti az ács a talpszelement.' },
    ],
    faqs: [
      { question: 'Kell-e félni a magasban?', answer: 'Az egészséges óvatosság alapfeltétel, de a leesés elleni hám és a tapasztalat biztonságot ad.' },
      { question: 'Nehéz megtanulni a tetőszerkesztést?', answer: 'A műszaki rajzok és a szögszámítások némi gyakorlással gyorsan elsajátíthatók.' },
    ],
    dictionary: [
      { hu: 'Szarufa', description: 'A tető lejtését adó, gerinctől ereszig futó gerenda.', de: 'Sparren', en: 'Rafter' },
      { hu: 'Szelemen', description: 'A szarufákat alátámasztó vízszintes gerenda.', de: 'Pfetten', en: 'Purlin' },
      { hu: 'Zsalutábla', description: 'Betonöntéshez használt vízálló lemez.', de: 'Schalungsplatte', en: 'Formwork panel' },
    ],
    summaryChecklist: {
      goodFitIf: ['Imádod a fával való munkát', 'Nem félsz a magasban dolgozni', 'Jó a térlátásod és szeretsz mérni'],
      considerOtherIf: ['Tériszonyod van', 'Nem szereted az évszakos kültéri munkát'],
    },
  },

  burkolo: {
    id: 'burkolo',
    name: 'Burkoló',
    iconName: 'Layers',
    tagline: 'Az esztétikus és vízálló padlók, falak és teraszok megteremtője',
    categoryLabel: 'Befejező Munkák',
    overview:
      'A burkoló az az építőipari szakember, aki felteszi a pontot az i-re az épületek belső és külső felületein. Csempékből, greslapokból, természetes kövekből vagy parkettából gyönyörű, vízálló és tartós padló- és falburkolatokat készít.',
    whatDoesDo: {
      tasks: [
        'Aljzatkiegyenlítés és kenhető vízszigetelések elkészítése',
        'Kerámia csempék, greslapok, mozaikok vágása és ragasztása',
        'Fugázás, szilikonozás és felületkezelés',
        'Lépcsők, teraszok és medencék szakszerű burkolása',
      ],
      buildings: ['Fürdőszobák, konyhák, nappalik', 'Teraszok, erkélyek, medencék', 'Plázák, irodák, szállodák'],
      workflows: [
        'Aljzat ellenőrzése és portalanítása, alapozás',
        'Kiosztási terv készítése (szimmetrikus tengelyfektetés)',
        'Csemperagasztó felhordása fogazott simítóval',
        'Lapok fektetése burkolatszintező rendszerrel',
        'Fugázás és szivacsos lemosás',
      ],
      soloWork: 'Gyakran dolgozik egyedül vagy egy segéddel egy-egy fürdőszobában vagy helyiségben.',
      teamWork: 'Együttműködik a vízvezeték-szerelővel (kiállások) és a kőművessel (egyenes aljzat).',
    },
    toolsAndMaterials: [
      { category: 'Anyagok', name: 'Csempék, greslapok, természetes kő, mozaik', description: 'Burkolóelemek.' },
      { category: 'Anyagok', name: 'Flexibilis csemperagasztó, fugázó por, szilikon, vízszigetelés', description: 'Segédanyagok.' },
      { category: 'Kéziszerszámok', name: 'Fogazott glettvas (6-12mm), gumi pöröly, fugázó gumi', description: 'Ragasztáshoz és fugázáshoz.' },
      { category: 'Gépek', name: 'Kézi csempevágó, vizes vágógép, gyémántfúrók, keverőgép', description: 'Precíz vágáshoz.' },
      { category: 'Mérőeszközök', name: 'Lézeres szintező, burkolatszintező ékek és klipszek', description: 'Sík felületekhez.' },
    ],
    knowledgeToLearn: {
      theory: ['Aljzatok nedvességtartalmának mérésea', 'Csemperagasztó osztályok (C1, C2TE, S1) ismerete', 'Hőtágulási hézagok és dilatációk szabályai'],
      practice: ['Kézi és vizes csempevágás, gyémántlyukfúrás', 'Burkolatszintező ékek használata nagy lapoknál', 'Kültéri vízszigetelési rétegrendek'],
      safety: ['Térdvédő és porvédő maszk kötelező használata'],
    },
    trainingOverview: ['Hidegburkolati vágási technológiák', 'Fugázási és szilikonozási technikák', 'Lejtésképzés zuhanyzókban és teraszokon'],
    difficulty: {
      physical: 'Közepes-nagy megterhelés. Sokat kell térdelni és hajolni, valamint nehéz greslap-dobozokat emelni.',
      mental: 'Közepes szellemi igény. Kiváló esztétikai érzéket és geometriai elrendezési tervezést igényel.',
      precision: 'Rendkívül magas pontosság! A milliméteres fogazási hibák vagy ferde fugák azonnal szembetűnőek.',
    },
    suitableAttributes: ['Esztétikai érzék és jó szemmérték', 'Precizitás és türelem', 'Jó fizikai állóképesség (térdelés bírása)', 'Tervezői gondolkodás'],
    unsuitableAttributes: ['Térd- vagy gerincproblémák', 'Türelmetlenség vagy kapkodó munkavégzés'],
    workConditions: {
      location: 'Túlnyomórészt zárt belső terekben (fürdőszobák, szobák), de teraszoknál kültéren is.',
      weatherExposure: 'Béltérben védett, kültéren időjárásfüggő.',
      noiseAndDust: 'Vágáskor szálló por és csempevágó zaja.',
      heightAndPhysical: 'Térdelő és hajlott testhelyzet a munkanap jelentős részében.',
    },
    pros: ['Nagyon látványos, tiszta végeredmény', 'Kiemelkedő kereseti lehetőség és óriási kereslet', 'Főként belső terekben végzett munka'],
    cons: ['Erős ízületi megterhelés (térd, gerinc)', 'Csempevágási por'],
    workplaces: ['Burkoló szakvállalkozások', 'Lakásfelújító cégek', 'Saját burkoló egyéni vállalkozás'],
    careerPath: ['Burkoló tanuló → Szakmunkás → Mesterburkoló → Egyéni vállalkozó'],
    entrepreneurship: {
      possible: true,
      services: ['Fürdőszobák teljes körű burkolása', 'Teraszok vízszigetelése és meleg/hidegburkolása'],
      clients: ['Magánszemélyek', 'Belsőépítészek'],
      prosAndCons: 'Nagyon jól jövedelmező önálló szakma, minimális kezdeti gépparkkal elindítható.',
    },
    relatedTrades: [
      { name: 'Vízvezeték-szerelő', reason: 'A vízvezeték-szerelő kiállásaira burkol rá a mester.' },
      { name: 'Kőműves', reason: 'A kőműves egyenes aljzata alapvető a burkolónak.' },
    ],
    faqs: [
      { question: 'Fájni fog a térdem?', answer: 'Profi géles térdvédő használatával az ízületi terhelés jelentősen csökkenthető.' },
      { question: 'Kell hozzá jó rajzkészség?', answer: 'Nem rajz, hanem jó geometriai szemlélet kell a lapok szimmetrikus elrendezéséhez.' },
    ],
    dictionary: [
      { hu: 'Dilatáció', description: 'Hőtágulás miatti mozgási hézag.', de: 'Dehnungsfuge', en: 'Expansion joint' },
      { hu: 'Greslap', description: 'Nagy keménységű, fagyálló kerámialap.', de: 'Feinsteinzeug', en: 'Porcelain tile' },
      { hu: 'Fogazott simító', description: 'Ragasztó bordázására szolgáló glettvas.', de: 'Zahnspachtel', en: 'Notched trowel' },
    ],
    summaryChecklist: {
      goodFitIf: ['Szereted a hajszálpontos, szép felületeket', 'Szeretsz zárt belső térben dolgozni', 'Jó a kézügyességed'],
      considerOtherIf: ['Nem tudsz tartósan térdelni', 'Nincs türelmed az aprólékos vágásokhoz'],
    },
  },

  villanyszerelo: {
    id: 'villanyszerelo',
    name: 'Villanyszerelő',
    iconName: 'Zap',
    tagline: 'Az épületek energiájának, világításának és biztonságának mestere',
    categoryLabel: 'Épületgépészet & Érintésvédelem',
    overview:
      'A villanyszerelő az az építőipari és technológiai szakember, aki kiépíti az épületek elektromos hálózatát. Védőcsöveket fúr, vezetékeket húz, elosztótáblákat szerel, kapcsolókat és lámpákat köt be, valamint gondoskodik a szigorú érintésvédelmi biztonságról.',
    whatDoesDo: {
      tasks: [
        'Elektromos nyomvonalak és kötődobozok horonymarása és vésése',
        'Védőcsövek elhelyezése és vezetékek (MCU, SYM) behúzása',
        'Főelosztók, kismegszakítók és Fi-relék (áramvédők) bekötése',
        'Kapcsolók, dugaljak, lámpák és okosotthon elemek felszerelése',
        'Érintésvédelmi és szigetelési ellenállás-mérések elvégzése',
      ],
      buildings: ['Lakóházak és társasházak', 'Irodaházak és ipari csarnokok', 'Napelemes és okosotthon rendszerek'],
      workflows: [
        'Villamos kapcsolási rajz értelmezése',
        'Horonymarás és dobozhelyek fúrása koronaátfúróval',
        'Kábelek behúzása és kötések elkészítése (WAGO)',
        'Biztosítéktábla szerelése és műszeres mérés',
      ],
      soloWork: 'Kapcsolók, aljzatok szerelése és elosztótáblák bekötése gyakran önálló munka.',
      teamWork: 'Együttműködik a kőművessel (hornyok visszajavítása) és a gépésszel (kazánok, hőszivattyúk bekötése).',
    },
    toolsAndMaterials: [
      { category: 'Anyagok', name: 'Rézvezetékek (NYM-J, MCU), védőcsövek (Symalen), WAGO kötőelemek', description: 'Elektromos szerelvények.' },
      { category: 'Anyagok', name: 'Kismegszakítók, Fi-relék, kapcsolók, dugaljak', description: 'Védelmi és kezelőelemek.' },
      { category: 'Kéziszerszámok', name: 'Szigetelt csavarhúzók (1000V), kabelezős fogók, csupaszítók', description: 'Feszültségalatti/mentes kéziszerszámok.' },
      { category: 'Gépek', name: 'Horonymaró gép, akkus fúró-csavarozók, akkus porszívó', description: 'Beépítő gépek.' },
      { category: 'Mérőeszközök', name: 'Multiméter, feszültségkémlelő (Fázisceruza), szigetelésvizsgáló műszer', description: 'Mérési és biztonsági eszközök.' },
    ],
    knowledgeToLearn: {
      theory: ['Villamosságtan (Ohm törvénye, teljesítmény, háromfázisú hálózatok)', 'MSZ HD 60364 szabványsorozat előírásai', 'Villamos rajzok és kapcsolási vázlatok olvasása'],
      practice: ['Kábelcsupaszítás, kötésfajták és elosztók szerelése', 'Műszeres feszültség- és hurokellenállás-mérés', 'Hibakeresés zárlat vagy szivárgás esetén'],
      safety: ['5 biztonsági szabály (Feszültségmentesítés, visszakapcsolás elleni védelem)', 'Szigetelt szerszámok és egyéni védőfelszerelések'],
    },
    trainingOverview: ['Épületvillamossági alapszerelés', 'Kismegszakítók és áramvédő kapcsolók méretezése', 'Gyengeáramú rendszerek (riztó, UTP hálózat) alapjai'],
    difficulty: {
      physical: 'Közepes fizikai megterhelés. Plafon- és horonyvésésnél megterhelő, de kevésbé nehéz emeléssel jár.',
      mental: 'Magas szellemi igény! Logikus gondolkodást, folyamatos kapcsolási rajzelemzést és szabályismeretet igényel.',
      precision: 'Szigorú pontosság és felelősség! A hibás kötés tűzveszélyt vagy áramütést okozhat.',
    },
    suitableAttributes: ['Műszaki és logikai érdeklődés', 'Precizitás és felelősségtudat', 'Jó problémafeltáró és hibakereső képesség', 'Színlátás (vezetékek színkódjai miatt)'],
    unsuitableAttributes: ['Színtévesztés (fázis/nulla/föld színgondok)', 'Felületesség vagy biztonsági szabályok figyelmen kívül hagyása'],
    workConditions: {
      location: 'Építkezéseken belső terekben, irodákban és ipari létesítményekben.',
      weatherExposure: 'Túlnyomórészt védett belső terekben.',
      noiseAndDust: 'Véséskor magas por és zaj, szereléskor csendes munkakörnyezet.',
      heightAndPhysical: 'Létrán vagy gurulóállványon végzett munka a lámpatestek szerelésekor.',
    },
    pros: ['Tiszta, Intellektuális és nagymértékben megbecsült szakma', 'Kiváló kereseti lehetőségek és folyamatos technológiai fejlődés (Okosotthonok, EV töltők, Napelemek)', 'Mindig óriási rá a kereslet'],
    cons: ['Magas felelősség (áramütés- és tűzveszély megelőzése)', 'Poros vésési fázisok'],
    workplaces: ['Villanyszerelő szakvállalkozások', 'Ipari karbantartó cégek', 'Saját villanyszerelő vállalkozás'],
    careerPath: ['Villanyszerelő tanuló → Szakmunkás → Regisztrált villanyszerelő → Érintésvédelmi felülvizsgáló → Mester / Vállalkozó'],
    entrepreneurship: {
      possible: true,
      services: ['Családi házak és lakások teljes villanyszerelése', 'Regisztrált mérőhelyi ügyintézés', 'Okosotthon és napelem bekötés'],
      clients: ['Magánszemélyek', 'Társasházkezelők'],
      prosAndCons: 'Kiváló vállalkozási lehetőség, de kötelező a folyamatos továbbképzés és a szabványok ismerete.',
    },
    relatedTrades: [
      { name: 'Épületgépész', reason: 'A villanyszerelő biztosítja a tápellátást a kazánoknak és hőszivattyúknak.' },
      { name: 'Gipszkartonozó', reason: 'A gipszkarton vázakban futtatja a villanyszerelő a csöveket.' },
    ],
    faqs: [
      { question: 'Kell-e jó matektudás?', answer: 'Alapfokú fizikára és matematikára szükség van a teljesítmények és áramerősségek kiszámításához.' },
      { question: 'Veszélyes ez a szakma?', answer: 'Szakszerű munkavégzéssel és a 5 biztonsági szabály betartásával a baleseti kockázat minimálisra csökkenthető.' },
    ],
    dictionary: [
      { hu: 'Fi-relé', description: 'Áramvédő kapcsoló a szivárgó áramok kivédésére.', de: 'FI-Schutzschalter', en: 'RCD / Residual current breaker' },
      { hu: 'Kismegszakító', description: 'Túlterhelés és zárlat ellen védő kapcsoló.', de: 'Leitungsschutzschalter', en: 'Circuit breaker' },
      { hu: 'Horonymaró', description: 'Két gyémánttárcsás gép vezetékhornyok vágására.', de: 'Mauernutfräse', en: 'Wall chaser' },
    ],
    summaryChecklist: {
      goodFitIf: ['Szereted a logikai feladványokat és a műszaki rajzokat', 'Felelősségteljes vagy és szeretsz precízen szerelni', 'Érdekelnek az okosgépek, napelemes rendszerek'],
      considerOtherIf: ['Színtévesztő vagy', 'Nem szeretsz gondolkodni a munkafolyamatokon'],
    },
  },

  epuletgepesz: {
    id: 'epuletgepesz',
    name: 'Épületgépész',
    iconName: 'Flame',
    tagline: 'A víz, gáz, fűtés, hűtés és szellőztetés éltető rendszereinek megépítője',
    categoryLabel: 'Épületgépészet',
    overview:
      'Az épületgépész az a szakember, aki gondoskodik az épületek komfortjáról: ivóvízellátásról, szennyvízelvezetésről, fűtésről, hűtésről és friss levegőről. Ő telepíti a korszerű levegő-víz hőszivattyúkat, padlófűtési köröket és klímaberendezéseket.',
    whatDoesDo: {
      tasks: [
        'Ivóvíz- és szennyvízhálózat csővezetékeinek kiépítése',
        'Padlófűtés, falfűtés és radiátoros fűtési körök fektetése',
        'Hőszivattyúk, gázkazánok és hőtároló tartályok gépészeti bekötése',
        'Hővisszanyerős szellőzőrendszerek és klímák telepítése',
        'Hidraulikai nyomáspróbák és hálózatmosások elvégzése',
      ],
      buildings: ['Lakóingatlanok', 'Ipari létesítmények', 'Kórházak és szállodák'],
      workflows: [
        'Gépészeti tervelemzés és csőméretezés',
        'Ötrétegű és rézcsövek préselése, sütése vagy forrasztása',
        'Gépészeti helyiség összeállítása (osztó-gyűjtők, szivattyúk)',
        'Rendszer feltöltése, légtelenítése és nyomáspróbája',
      ],
      soloWork: 'Csőszerelvények, csaptelepek és szaniterek szerelése.',
      teamWork: 'Együttműködés a villanyszerelővel (automatika bekötés) és a kőművessel/burkolóval.',
    },
    toolsAndMaterials: [
      { category: 'Anyagok', name: 'Ötrétegű műanyag csövek, rézcsövek, PVC lefolyócsövek', description: 'Csővezetékek.' },
      { category: 'Anyagok', name: 'Hőszivattyúk, osztó-gyűjtők, keringető szivattyúk', description: 'Gépészeti berendezések.' },
      { category: 'Kéziszerszámok', name: 'Csővágó olló, kalibráló, franciakulcsok, prés pofák', description: 'Szerelő szerszámok.' },
      { category: 'Gépek', name: 'Akkus csőprésgép, csőfagyasztó, keményforrasztó palack', description: 'Specializált gépészeti gépek.' },
      { category: 'Mérőeszközök', name: 'Digitális nyomásmérő (manométer), hőkamera, áramlásmérő', description: 'Mérőműszerek.' },
    ],
    knowledgeToLearn: {
      theory: ['Hidraulikai számítások, tömegáramok és nyomásesés', 'Hőtechnikai alapismeretek és megújuló energiák', 'Gépészeti rajzok és izometriák olvasása'],
      practice: ['Csőpréselés (Press-technológia), forrasztás és műanyaghegesztés', 'Nyomáspróbák és szivárgáskeresés', 'Kazánok és hőszivattyúk hidraulikai beszabályozása'],
      safety: ['Gáztechnikai és nyomástartó edények biztonsági előírásai'],
    },
    trainingOverview: ['Víz- és szennyvízszerelési alapok', 'Korszerű fűtési és hűtési rendszerek', 'Megújuló energiaforrások integrálása'],
    difficulty: {
      physical: 'Közepes-nagy megterhelés. Nehéz kazánok és tartályok mozgatása, hajolgatás csőfektetéskor.',
      mental: 'Magas szellemi igény! Hidraulikai megértést és bonyolult gépészeti rajz olvasást igényel.',
      precision: 'Szigorú pontosság! A legkisebb szivárgás is beázást vagy gázszivárgást okoz.',
    },
    suitableAttributes: ['Logikus és hidraulikai gondolkodás', 'Műszaki érdeklődés', 'Precizitás és megbízhatóság'],
    unsuitableAttributes: ['Felületesség, szivárgások elhanyagolása'],
    workConditions: {
      location: 'Építkezéseken belső terekben és gépészeti helyiségekben.',
      weatherExposure: 'Túlnyomórészt zárt épületekben.',
      noiseAndDust: 'Alacsony-közepes por és zajszint.',
      heightAndPhysical: 'Kevés magasban végzett munka, főként talajszinten vagy pincékben.',
    },
    pros: ['Nagyon magas szakmai presztízs és kiemelkedő kereset', 'Fenntartható zöld technológiák (hőszivattyú, szellőzés)', 'Mindig szükséges szakma'],
    cons: ['Nagy felelősség (beázások és gázbiztonság)', 'Súlyos berendezések emelése'],
    workplaces: ['Épületgépészeti kivitelezők', 'Hőszivattyús szakcégek', 'Saját gépész vállalkozás'],
    careerPath: ['Gépész tanuló → Szakmunkás → Mestervizsgázott gépész → Gépész építésvezető → Vállalkozó'],
    entrepreneurship: {
      possible: true,
      services: ['Hőszivattyús fűtésrendszerek kiépítése', 'Fürdőszobai gépészeti felújítás'],
      clients: ['Családi ház tulajdonosok', 'Társasházak'],
      prosAndCons: 'Magas profittartalmú vállalkozási forma, komoly szerszámozottsági igénnyel.',
    },
    relatedTrades: [
      { name: 'Villanyszerelő', reason: 'A villanyszerelő táplálja be a gépészeti szivattyúkat és szelepeket.' },
      { name: 'Burkoló', reason: 'A gépész csöveire szereli fel a burkoló a szanitereket.' },
    ],
    faqs: [
      { question: 'Büdös ez a szakma?', answer: 'Az ivóvíz-, fűtés- és hőszivattyús szerelés tiszta munka. A lefolyószerelésnél fordulhat elő kellemetlenség.' },
      { question: 'Kell-e hozzá fűtési számításokat tudni?', answer: 'Igen, a csőátmérőket és szivattyú-teljesítményeket hidraulikai méretezés alapján választjuk.' },
    ],
    dictionary: [
      { hu: 'Osztó-gyűjtő', description: 'Fűtési vagy ivóvízkörök elágaztató sárgaréz szerelvénye.', de: 'Heizkreisverteiler', en: 'Manifold' },
      { hu: 'Press-idom', description: 'Présgéppel rögzíthető csőkötő elem.', de: 'Pressfitting', en: 'Press fitting' },
      { hu: 'Hőszivattyú', description: 'Környezeti hőt hasznosító hűtő/fűtő berendezés.', de: 'Wärmepumpe', en: 'Heat pump' },
    ],
    summaryChecklist: {
      goodFitIf: ['Szereted a modern épületgépészetet és a zöld energiákat', 'Logikusan gondolkodsz hidraulikai körökben', 'Jó kereseti lehetőséget keresel'],
      considerOtherIf: ['Nem szeretsz felelősséget vállalni a vízzáróságért'],
    },
  },

  tetofedo: {
    id: 'tetofedo',
    name: 'Tetőfedő és Bádogos',
    iconName: 'Building',
    tagline: 'A vízhatlan védőernyő és a precíz fémlemez-szegélyek mestere',
    categoryLabel: 'Szerkezetépítés',
    overview:
      'A tetőfedő és bádogos szakember felelős az épületek csapadékvíz elleni védelméért. Kerámia és beton cserepeket, cserepeslemezeket fektet fel, elkészíti az ereszcsatornákat, a kémény- és ablakbádogozásokat, megelőzve az épületek beázását.',
    whatDoesDo: {
      tasks: [
        'Tetőlécezés ellenőrzése, páraáteresztő fóliázás felterítése',
        'Kerámia- és betoncserép fedések készítése, kúpcserepek rögzítése',
        'Ereszcsatorna rendszerek, lefolyócsövek szerelése',
        'Kémények, lemezszegélyek és falcsatlakozások bádogozása',
        'Lapostetők bitumenzsindelyes és vízszigetelő lemezes fedése',
      ],
      buildings: ['Családi házak és nyaralók', 'Templomok és műemlékek tornyai', 'Ipari csarnokok lemezfedései'],
      workflows: [
        'Tetőfelület kimérése és sorosztása',
        'Ereszalj és bádog szegélyek lemezhajlítása és rögzítése',
        'Cserepek feljuttatása cserepes emelővel és elrakása',
        'Kúpcserép rögzítése szárazon szellőző léc szalaggal',
      ],
      soloWork: 'Bádogos elemek előkészítése és hajlítása a műhelyben.',
      teamWork: 'Csapatmunka a cserepek feladásánál és a tetőfelület gyors befedésénél az eső előtt.',
    },
    toolsAndMaterials: [
      { category: 'Anyagok', name: 'Kerámia és beton cserepek, cserepeslemezek, bitumenes lemezek', description: 'Fedőanyagok.' },
      { category: 'Anyagok', name: 'Horganyzott és színes alumínium lemezek, ereszcsatornák', description: 'Bádogos termékek.' },
      { category: 'Kéziszerszámok', name: 'Bádogos ollók (jobbos/balos), bádogos kalapács, fűzőfogó', description: 'Lemezmegmunkálás.' },
      { category: 'Gépek', name: 'Cserép- és felvonó emelő, bádogos élhajlító gép, sarokcsiszoló', description: 'Erőgépek.' },
      { category: 'Mérőeszközök', name: 'Csapózsinór, lejtésmérő, mérőszalag', description: 'Pontos soros elrendezéshez.' },
    ],
    knowledgeToLearn: {
      theory: ['Tetőszerkezeti formák és szellőzési keresztmetszetek', 'Lemezalakítási technológiák (korcolás, forrasztás)', 'Csapadékelvezetési méretezések'],
      practice: ['Cserépsorolás és vágás sarokcsiszolóval', 'Ereszcsatorna lejtésbe állítása és forrasztása', 'Kéményszegély bádogozása'],
      safety: ['Tetőn való biztonságos mozgás és kötéltechnika'],
    },
    trainingOverview: ['Magastető és lapostető fedési rendszerek', 'Hagyományos és korcolt bádogos technológiák', 'Vízhatlan tetőátvezetések kialakítása'],
    difficulty: {
      physical: 'Nagy fizikai megterhelés. Nehéz cserepek emelése és folyamatos mozgás a lejtős tetőfelületen.',
      mental: 'Közepes-magas szellemi igény. Bonyolult bádogos szegélyrajzok és szabásminták készítése.',
      precision: 'Kiemelkedő pontosság! A rosszul korcolt lemez vagy elcsúszott cserép azonnali beázást okoz.',
    },
    suitableAttributes: ['Tériszony teljes hiánya és jó egyensúlyérzék', 'Kézügyesség a lemezalakításhoz', 'Fizikai teherbírás', 'Időjárástűrés'],
    unsuitableAttributes: ['Magasságfóbia, szédülés', 'Rossz állóképesség kánikulában vagy hidegben'],
    workConditions: {
      location: 'Kizárólag magasan, épületek tetőszerkezetén.',
      weatherExposure: 'Maximálisan kitett a napnak, szélnek és melegnek.',
      noiseAndDust: 'Cserépvágási por és lemezkalapálási zaj.',
      heightAndPhysical: 'Magasban végzett fizikai munka biztonsági hámban.',
    },
    pros: ['Különleges, magasban végzett szép szakma', 'Kiemelkedő fizetések és folyamatos megrendelések', 'Látványos végeredmény'],
    cons: ['Erős időjárási kiszolgáltatottság', 'Baleseti kockázat magasban'],
    workplaces: ['Tetőfedő és bádogos cégek', 'Saját tetőfedő vállalkozás'],
    careerPath: ['Tetőfedő tanuló → Szakmunkás → Mesterbádogos → Vállalkozó'],
    entrepreneurship: {
      possible: true,
      services: ['Új tetők fedése és bádogozása', 'Beázások megszüntetése, ereszcsatorna csere'],
      clients: ['Családi ház tulajdonosok', 'Társasházak'],
      prosAndCons: 'Nagyon keresett önálló szakma, emelőgépek és bádogos élhajlító megléte nagy előny.',
    },
    relatedTrades: [
      { name: 'Ács', reason: 'Az ács fafényére rakja fel a tetőfedő a cserepeket.' },
    ],
    faqs: [
      { question: 'Forró a tető nyáron?', answer: 'Igen, a cserép és lemez átforrósodik, ezért nyáron korai kezdtetű (06:00) munkarend a bevett.' },
      { question: 'Nehéz a bádogot hajtogatni?', answer: 'A kézi bádogos fogók és a műhelyi élhajlítók használatával könnyen alakítható a lemez.' },
    ],
    dictionary: [
      { hu: 'Kúpcserép', description: 'A tetőgerincet lezáró félhenger alakú cserép.', de: 'Firstziegel', en: 'Ridge tile' },
      { hu: 'Vápa', description: 'Két tetősík találkozásánál lévő csapadékgyűjtő vájat.', de: 'Kehle', en: 'Roof valley' },
      { hu: 'Korcolás', description: 'Fémlemezek vízhatlan összehajtási kötési módja.', de: 'Stehfalz', en: 'Standing seam' },
    ],
    summaryChecklist: {
      goodFitIf: ['Szeretsz magasan dolgozni és jó az egyensúlyod', 'Kedveled a finom fémlemez-megmunkálást', 'Bírod a napsütést és a kültéri munkát'],
      considerOtherIf: ['Tériszonyod van', 'Félsz a lejtős felületeken való mozgástól'],
    },
  },

  gipszkartonozo: {
    id: 'gipszkartonozo',
    name: 'Gipszkartonozó / Szárazépítő',
    iconName: 'Maximize2',
    tagline: 'A modern, gyors és precíz belső terek formálója',
    categoryLabel: 'Befejező Munkák',
    overview:
      'A gipszkartonozó és szárazépítő szakember az a belsőépítészeti kivitelező, aki könnyű fémvázas profilokból és gipszkarton táblákból válaszfalakat, előtétfalakat, álmennyezeteket és tetőtéri beépítéseket épít. Munkája gyors, tiszta és hajszálpontos.',
    whatDoesDo: {
      tasks: [
        'CW/UW és CD/UD fémprofilvázak kitűzése és rögzítése dűbelekkel',
        'Gipszkarton táblák szabása és felcsavarozása gyorsépítő csavarokkal',
        'Hanggátló és hőszigetelő szálas kőzetgyapot behelyezése a vázba',
        'Illesztések hézagolása, bandázsolása és Q1-Q4 glettelése',
        'Díszítő rejtett világításos álmennyezetek építése',
      ],
      buildings: ['Lakások és családi házak tetőterei', 'Irodaterek és üzlethelyiségek', 'Szállodák és mozik hanggátló falai'],
      workflows: [
        'Lézeres szint- és tengelykitűzés',
        'Profilok vágása lemezollóval és dűbelezése szigetelőszalaggal',
        'Kartonlapok vágása szikével és csavarozása',
        'Hézagolás üvegszövet hálóval és glettelő gipsszel',
      ],
      soloWork: 'Profilok vágása, kisebb falfelületek csavarozása és hézagolás.',
      teamWork: 'Páros munka a nagy gipszkarton táblák (120x200cm) mennyezeti emelésénél és csavarozásánál.',
    },
    toolsAndMaterials: [
      { category: 'Anyagok', name: 'Normál (RB), Impregnált (RBI) és Tűzgátló (RF) gipszkartonok', description: 'Kartonlapok.' },
      { category: 'Anyagok', name: 'CW, UW, CD, UD horganyzott fémprofilok, csavarok, gipsz', description: 'Szerkezeti elemek.' },
      { category: 'Kéziszerszámok', name: 'Gipszkarton vágó szike, lemezolló, glettvas, lepke spakli', description: 'Vágáshoz és hézagoláshoz.' },
      { category: 'Gépek', name: 'Akkus gipszkartoncsavarozó (tárral), kartonemelő lift, csiszoló zsiráf', description: 'Erőgépek.' },
      { category: 'Mérőeszközök', name: '3D lézeres szintező, alu vízmérték', description: 'Pontos sík beállításához.' },
    ],
    knowledgeToLearn: {
      theory: ['Hanggátlási dB értékek és áthallás-gátlás', 'Tűzvédelmi minősítések (EI30-EI120)', 'Q1-Q4 felületminőségi osztályok'],
      practice: ['Fémvázszerelés és szivacsszalagos akusztikai elválasztás', 'Táblák szabása szikével és élgyalulás', 'Hézagolás és csiszolás gipszkarton zsiróffal'],
      safety: ['Porvédő maszk és védőszemüveg csiszoláskor'],
    },
    trainingOverview: ['Szárazépítészeti vázszerkezetek építése', 'Akusztikai hanggátló rendszerek', 'Tetőtér beépítések párazáró fóliázása'],
    difficulty: {
      physical: 'Közepes fizikai megterhelés. A kartonlapok felemelése és a plafonra szerelés igénybe veszi a vállat és kart.',
      mental: 'Közepes szellemi igény. Pontos sík- és szögbeállításokat igényel.',
      precision: 'Nagy pontosság. A hézagolási hibák a festés után meglátszanak.',
    },
    suitableAttributes: ['Tiszta, belső téri munkakedv', 'Precíz kézügyesség', 'Csapatmunka készség'],
    unsuitableAttributes: ['Porallergia', 'Váll- vagy kartáji ízületi problémák'],
    workConditions: {
      location: 'Kizárólag belső zárt terekben.',
      weatherExposure: 'Időjárástól teljesen védett környezet.',
      noiseAndDust: 'Glettcsiszoláskor szálló gipszpor.',
      heightAndPhysical: 'Létrán és gurulóállványon végzett munka a mennyezetnél.',
    },
    pros: ['Tiszta, zárt térben végzett modern munka', 'Gyors haladás és látványos eredmény', 'Kiemelkedő piaci kereslet'],
    cons: ['Mennyezeti szerelésnél kartáji fáradtság', 'Csiszolási por'],
    workplaces: ['Szárazépítő szakcégek', 'Belsőépítészeti kivitelezők', 'Saját vállalkozás'],
    careerPath: ['Gipszkartonozó tanuló → Szakmunkás → Mester szárazépítő → Vállalkozó'],
    entrepreneurship: {
      possible: true,
      services: ['Lakások belső átalakítása gipszkarton válaszfalakkal', 'Tetőterek beépítése', 'Álmennyezet építés'],
      clients: ['Magánszemélyek', 'Irodavezetők'],
      prosAndCons: 'Gyorsan indítható vállalkozás, kis géppark igénnyel.',
    },
    relatedTrades: [
      { name: 'Villanyszerelő', reason: 'A kartonvázban futtatja a csöveket a villanyszerelő.' },
      { name: 'Festő', reason: 'A gipszkartonozó hézagolt felületét festi be a festő.' },
    ],
    faqs: [
      { question: 'Nehéz egy gipszkarton tábla?', answer: 'Egy normál tábla kb. 22-25 kg, de kartonemelő lifttel a plafonra emelés könnyen megoldható.' },
      { question: 'Poros ez a munka?', answer: 'A vázszerelés és csavarozás nem poros, egyedül a hézagolás csiszolásakor keletkezik finom gipszpor.' },
    ],
    dictionary: [
      { hu: 'CW profil', description: 'Válaszfalak függőleges fém bordaprofilja.', de: 'CW-Profil', en: 'CW stud profile' },
      { hu: 'Bandázsszalag', description: 'Gipszkarton illesztésekbe ágyazott erősítő háló/papír.', de: 'Bewehrungsstreifen', en: 'Joint tape' },
      { hu: 'Q4 felület', description: 'Legmagasabb minőségű, teljes felületen glettelt karton.', de: 'Q4-Oberfläche', en: 'Q4 finish' },
    ],
    summaryChecklist: {
      goodFitIf: ['Szeretsz zárt belső térben, tisztán dolgozni', 'Könnyen megtanulható, látványos szakmát keresel', 'Jó a kézügyességed'],
      considerOtherIf: ['Nem bírod a finom gipszport', 'Nem szeretsz mennyezet felé nyújtózni'],
    },
  },

  festo: {
    id: 'festo',
    name: 'Festő, Mázoló és Tapétázó',
    iconName: 'Sparkles',
    tagline: 'A felületek végső színeinek, védelmének és dekorációjának művésze',
    categoryLabel: 'Befejező Munkák',
    overview:
      'A festő, mázoló és tapétázó szakember adja meg az építmények végső arculatát. Gletteli és simítja a falfelületeket, belső és külső festéseket készít, nyílászárókat mázol, és luxus tapétákat vagy dekorációs vakolatokat visz fel.',
    whatDoesDo: {
      tasks: [
        'Falfelületek mélyalapozása, glettelése és csiszolása',
        'Belső diszperziós és mészfestések elvégzése hengerrel és géppel',
        'Fa és fém nyílászárók, kerítések mázolása és zománcozása',
        'Mintás és textil tapéták ragasztása',
        'Dekoratív stukkók és felületképző anyagok felvitele',
      ],
      buildings: ['Lakások és családi házak', 'Irodák, iskolák, kórházak', 'Műemléki épületek diszítéssel'],
      workflows: [
        'Bútorok és padló gondos takarása fóliával és maszkolószalaggal',
        'Glettanyag felhordása és kézi/gépi csiszolása',
        'Alapozás és kétszeri festékhengerelés vagy szórófejes fújás',
        'Maszkolók visszaszedése és tiszta átadás',
      ],
      soloWork: 'Gyakran egyedül festi vagy gletteli egy-egy szoba felületeit.',
      teamWork: 'Nagyobb csarnokok vagy irodák gépi szórásos festésénél páros munka.',
    },
    toolsAndMaterials: [
      { category: 'Anyagok', name: 'Diszperziós, mész és szilikát festékek, glettanyagok, zománcok', description: 'Festékanyagok.' },
      { category: 'Anyagok', name: 'Takarófóliák, maszkolószalagok, tapétaragasztók', description: 'Védelmi és segédanyagok.' },
      { category: 'Kéziszerszámok', name: 'Festőhengerek, ecsetek, lepke glettvasak, tapétázó olló', description: 'Felviteli eszközök.' },
      { category: 'Gépek', name: 'Airless airless festékszóró gép, glettcsiszoló zsiráf', description: 'Nagy teljesítményű gépek.' },
      { category: 'Mérőeszközök', name: 'Lézeres szintező tapétázáshoz', description: 'Függőleges tapétacsíkokhoz.' },
    ],
    knowledgeToLearn: {
      theory: ['Festékvegyészeti alapismeretek és kötőanyagok', 'Színtan és színkeverési szabályok', 'Felületi nedvesség- és szilárdságmérés'],
      practice: ['Glettelés tükörsima felületre', 'Hengerelési és gépiszórási technikák csíkmentesen', 'Tapétaillesztési minták beszabása'],
      safety: ['Szellőztetés és légzésvédelem oldószeres zománcfestésnél'],
    },
    trainingOverview: ['Belső és külső festési technológiák', 'Mázolás és fém/favédelem', 'Dekorációs és tapétázási szakismeretek'],
    difficulty: {
      physical: 'Közepes megterhelés. Felsőtestet és kart igénybe vevő mozgás, folyamatos karnyújtás.',
      mental: 'Közepes szellemi igény. Jó színérzéket és jó esztétikai rálátást igényel.',
      precision: 'Nagy pontosság! A csíkos festés vagy a foltos glettelés azonnal meglátszik a fényben.',
    },
    suitableAttributes: ['Színérzék és esztétikai igényesség', 'Precíz kézügyesség', 'Tisztaságra való törekvés', 'Türelem'],
    unsuitableAttributes: ['Festékallergia, szagérzékenység', 'Felületesség'],
    workConditions: {
      location: 'Főleg belterekben, de homlokzatfestésnél kültéren is.',
      weatherExposure: 'Béltérben védett.',
      noiseAndDust: 'Csiszolási por (ami porszívóval elszívható).',
      heightAndPhysical: 'Létrán vagy gurulóállványon végzett munka.',
    },
    pros: ['Kifejezetten tiszta, esztétikus és kreatív munka', 'Magas megrendelési szám és azonnali fizettség', 'Látványos átalakulási élmény'],
    cons: ['Mennyezeti glettelésnél karfáradtság', 'Portalanítási lépések'],
    workplaces: ['Festő vállalkozások', 'Belsőépítészeti cégek', 'Saját festő egyéni vállalkozás'],
    careerPath: ['Festő tanuló → Szakmunkás → Mesterfestő → Vállalkozó'],
    entrepreneurship: {
      possible: true,
      services: ['Lakásfestés, glettelés, tapétázás', 'Kerítések és ablakok mázolása'],
      clients: ['Magánszemélyek', 'Irodák'],
      prosAndCons: 'Nagyon alacsony kezdő tőkével elindítható sikeres vállalkozás.',
    },
    relatedTrades: [
      { name: 'Gipszkartonozó', reason: 'A festő a gipszkartonozó sima felületét festi be.' },
    ],
    faqs: [
      { question: 'Nehéz megtanulni glettelni?', answer: 'A glettvas tartását és a simító mozdulatokat néhány hét gyakorlással szépen el lehet sajátítani.' },
      { question: 'Büdösek a mai festékek?', answer: 'A modern diszperziós és akril festékek szagtalanok és vízbázisúak.' },
    ],
    dictionary: [
      { hu: 'Diszperziós festék', description: 'Vízbázisú, műgyanta kötőanyagú beltéri festék.', de: 'Dispersionsfarbe', en: 'Emulsion paint' },
      { hu: 'Airless szórás', description: 'Levegő nélküli, nagy nyomású festékszórás.', de: 'Airless-Spritzen', en: 'Airless spraying' },
      { hu: 'Mélyalapozó', description: 'A fal nedvszívását kiegyenlítő és porkötő folyadék.', de: 'Tiefgrund', en: 'Primer' },
    ],
    summaryChecklist: {
      goodFitIf: ['Szereted a tiszta, színes és esztétikus munkát', 'Szeretnél gyorsan indítható vállalkozást', 'Jó a szemmértéked és precíz vagy'],
      considerOtherIf: ['Nem bírja a karod a tartós felemelt tartást'],
    },
  },
};
