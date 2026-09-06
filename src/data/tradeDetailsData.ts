export interface MaterialToolItem {
  category: 'Anyagok' | 'Kéziszerszámok' | 'Gépek' | 'Mérőeszközök';
  name: string;
  description: string;
}

export interface TimelineStation {
  id: string;
  badge: string; // e.g. "RÉGEN", "MA", "JÖVŐ", "TE"
  title: string;
  period: string; // e.g. "19-20. század", "Napjainkban", "Közeli jövő", "Holnap"
  description: string;
  highlights?: string[];
}

export interface FutureTechCard {
  id: string;
  title: string;
  category: 'MÁR LÉTEZŐ' | 'FEJLŐDŐ' | 'KÍSÉRLETI';
  description: string;
  iconName?: string;
  imageUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceDate?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface TradeDetail {
  id: string;
  name: string;
  iconName: string;
  tagline: string;
  categoryLabel: string;
  
  // MÚLT -> JELEN -> JÖVŐ Timeline
  timelineTitle?: string;
  timelineSubtitle?: string;
  timelineImage?: string;
  timelineImageAlt?: string;
  timelineStations?: TimelineStation[];

  // MERRE TART A SZAKMA? Future Tech
  futureTechTitle?: string;
  futureTechSubtitle?: string;
  futureTechCards?: FutureTechCard[];
  futureTechClosure?: string; // TE MILYEN SZAKEMBER LESZEL?

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

  // 15. RÖVID ÖSSZEFOGLALÓ – "NEKED VALÓ EZ A SZAKMA?"
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
    
    // MÚLT -> JELEN -> JÖVŐ Timeline
    timelineTitle: 'Honnan indult és merre tart a kőműves mesterség?',
    timelineSubtitle: 'A kézi téglaöntéstől és mészhabarcstól a 3D betonnyomtatásig és robotizált falazásig',
    timelineImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80',
    timelineImageAlt: 'Kőműves munkálatok és falazási technológiák',
    timelineStations: [
      {
        id: 'station-1',
        badge: 'RÉGEN',
        title: 'Kézi téglaöntés és mészhabarcsos falazás',
        period: '19-20. század',
        description: 'Nehéz kézi fizikai munka, tömör kisméretű téglák, helyszíni mészoltás és lassú építési ütem.',
      },
      {
        id: 'station-2',
        badge: 'MA',
        title: 'Precíziós vékonyrétegű ragasztott falazóblokkok és gépi vakolás',
        period: 'Napjainkban',
        description: 'Csiszolt kerámia és pórusbeton elemek, lézeres szintezés, gépi habarcskeverés és gépi vakolóberendezések.',
      },
      {
        id: 'station-3',
        badge: 'JÖVŐ',
        title: 'Robotizált falazási technológiák és 3D betonnyomtatás',
        period: 'Közeli jövő',
        description: 'Automatizált 3D nyomtatófejek, fali robotkarok és digitális BIM modellek közvetlen helyszíni alkalmazása.',
      },
      {
        id: 'station-4',
        badge: 'TE',
        title: 'Digitális szakember és robottechnológiai irányító',
        period: 'Holnap',
        description: 'A fizikai terhelés helyett a gépi rendszerek felügyelete, precíziós szintezés és automatizált szerkezetépítés.',
      },
    ],

    // MERRE TART A SZAKMA? Future Tech
    futureTechTitle: 'Merre tart a kőműves szakma?',
    futureTechSubtitle: 'Innovációk, automatizáció és új generációs anyagok a szerkezetépítésben',
    futureTechCards: [
      {
        id: 'tech-1',
        title: '3D Épületnyomtatás (Betonnyomtatás)',
        category: 'MÁR LÉTEZŐ',
        description: 'Nagy méretű ipari 3D nyomtatók, amelyek órák alatt képesek teherhordó szerkezeti falakat kiönteni speciális habarcsrétegekből.',
        sourceName: 'Construction Europe',
        sourceUrl: 'https://www.constructioneurope.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-2',
        title: 'Kiterjesztett Valóság (AR) Munkaszemüvegek',
        category: 'FEJLŐDŐ',
        description: 'A kőműves AR szemüvegén látja a virtuális tervrajzot közvetlenül a falra vetítve, megszüntetve a mérési és kitűzési hibákat.',
        sourceName: 'BIM Today',
        sourceUrl: 'https://www.bimtoday.co.uk',
        sourceDate: '2025',
      },
      {
        id: 'tech-3',
        title: 'Exoskeleton (Külső vázas ergonómiai támogatás)',
        category: 'FEJLŐDŐ',
        description: 'Hordható váztámasz, amely 40-60%-kal csökkenti a derékra és vállra nehezedő terhelést nehéz téglák és blokkok emelésekor.',
        sourceName: 'Building Design & Construction',
        sourceUrl: 'https://www.bdcnetwork.com',
        sourceDate: '2024',
      },
      {
        id: 'tech-4',
        title: 'Öngyógyító Öko-beton és Szénmegkötő Blokkok',
        category: 'KÍSÉRLETI',
        description: 'Baktériumos mikrokapszulákat tartalmazó betonok, amelyek víz hatására automatikusan eltömítik a mikrorepedéseket.',
        sourceName: 'Nature Materials',
        sourceUrl: 'https://www.nature.com/nmat/',
        sourceDate: '2025',
      },
    ],
    futureTechClosure: 'A kőműves szakma a fizikai erőkifejtésből gyorsan átalakul a digitális precizitás és az automatizált szerkezetépítés mesterségévé.',
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

    // MÚLT -> JELEN -> JÖVŐ Timeline
    timelineTitle: 'Honnan indult és merre tart az ács mesterség?',
    timelineSubtitle: 'A kézi bárdolástól és fa csapolástól a CNC robotkarokig és CLT tömörfa felhőkarcolókig',
    timelineImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    timelineImageAlt: 'Ács és tetőszerkezet építési munkák',
    timelineStations: [
      {
        id: 'station-1',
        badge: 'RÉGEN',
        title: 'Kézi favágás, kézi faragás és fa csapolás',
        period: '19. század',
        description: 'Bárdolt gerendák, hagyományos faszerkezetek kézi illesztése és kézzel vert ácsszegek.',
      },
      {
        id: 'station-2',
        badge: 'MA',
        title: 'CNC fa megmunkálás és modultetők',
        period: 'Napjainkban',
        description: 'Előre gyártott szeglemezes rácsostartók, lézeres bemérés, elektromos szerszámok és szisztémás zsalurendszerek.',
      },
      {
        id: 'station-3',
        badge: 'JÖVŐ',
        title: 'CLT masszív faépítészet és paraméteres CNC szerelés',
        period: 'Közeli jövő',
        description: 'Nagy fesztávú többemeletes faházak előregyártása CNC robotkamrákban és gyors helyszíni moduláris szerelés.',
      },
      {
        id: 'station-4',
        badge: 'TE',
        title: 'Faépítészeti mérnök-szakember',
        period: 'Holnap',
        description: 'A fenntartható zöld építészet megvalósítója, digitális 3D modell alapján szerelő prémium ácsmester.',
      },
    ],

    // MERRE TART A SZAKMA? Future Tech
    futureTechTitle: 'Merre tart az ács szakma?',
    futureTechSubtitle: 'Csúcstechnológiás faépítészet, prémium előregyártás és intelligens faszerkezetek',
    futureTechCards: [
      {
        id: 'tech-1',
        title: 'CLT (Cross-Laminated Timber) Masszív Faépítés',
        category: 'MÁR LÉTEZŐ',
        description: 'Több rétegben ragasztott tömör fapanelek, amelyek felhőkarcolók beton- és acélelemeit is képesek környezetbarát módon kiváltani.',
        sourceName: 'Timber Design Mag',
        sourceUrl: 'https://www.timberdesignmag.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-2',
        title: 'Automatizált CNC Ácsmodulok és Robotiká Illesztés',
        category: 'FEJLŐDŐ',
        description: 'A milliméter pontos gerendakivágásokat ipari CNC robotkarok végzik a csarnokban, a helyszínen csak a gyors szerelés történik.',
        sourceName: 'Woodworking International',
        sourceUrl: 'https://www.woodworking.com',
        sourceDate: '2024',
      },
      {
        id: 'tech-3',
        title: 'Hordható Exoskeleton a Gerendák Mozgatásához',
        category: 'FEJLŐDŐ',
        description: 'Tehermentesítő váztámasz a vállizomzat védelmére magasban végzett nehéz gerendamunkáknál.',
        sourceName: 'Safety & Health Practitioner',
        sourceUrl: 'https://www.shponline.co.uk',
        sourceDate: '2025',
      },
      {
        id: 'tech-4',
        title: 'Intelligens Szenzoros Faanyagok',
        category: 'KÍSÉRLETI',
        description: 'Faanyagba épített nedvesség- és feszültségmérő mikroszenzorok, amelyek valós időben jelzik a tetőszerkezet állapotát.',
        sourceName: 'Smart Materials Journal',
        sourceUrl: 'https://www.smartmaterials.com',
        sourceDate: '2025',
      },
    ],
    futureTechClosure: 'A jövő ácsmestere a környezetbarát faépítészet és a csúcstechnológiás előregyártás digitális specialistája.',
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

    // MÚLT -> JELEN -> JÖVŐ Timeline
    timelineTitle: 'Honnan indult és merre tart a burkoló mesterség?',
    timelineSubtitle: 'A kis méretű kerámiáktól és habarcságytól a giga greslapokig és okos fugákig',
    timelineImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    timelineImageAlt: 'Burkolási munkálatok és modern hidegburkolás',
    timelineStations: [
      {
        id: 'station-1',
        badge: 'RÉGEN',
        title: 'Kishálózatú kerámiák és cementhabarcsos fektetés',
        period: '20. század közepe',
        description: 'Vastag habarcságyas fektetés, kézi karcoló csempevágás és korlátozott 15x15 cm-es lapméretek.',
      },
      {
        id: 'station-2',
        badge: 'MA',
        title: 'Giga lapméretek, flexibilis ragasztók és lézeres szintezők',
        period: 'Napjainkban',
        description: 'Akár 300x100 cm-es óriásgres lapok, vákuumos emelőkeretek, szintező klipszek és vizes vágógépek.',
      },
      {
        id: 'station-3',
        badge: 'JÖVŐ',
        title: 'Vákuumos félautomatizált burkolás és digitális mintailletés',
        period: 'Közeli jövő',
        description: 'AR szemüveges mintakiterjesztés és precíziós lapfektető szívófejes rendszerek a tökéletes sík felületekért.',
      },
      {
        id: 'station-4',
        badge: 'TE',
        title: 'Enteriőr-burkoló felülettechnológus',
        period: 'Holnap',
        description: 'Prémium minőségű belsőépítészeti felületek és intelligens fűtött/okos burkolatrendszerek szakértője.',
      },
    ],

    // MERRE TART A SZAKMA? Future Tech
    futureTechTitle: 'Merre tart a burkoló szakma?',
    futureTechSubtitle: 'Óriásformátumú lapok, integrált felületfűtés és nanotechnológiás felületkezelés',
    futureTechCards: [
      {
        id: 'tech-1',
        title: 'Giga-méretű Kerámialapok és Vákuumos Kezelőrendszerek',
        category: 'MÁR LÉTEZŐ',
        description: 'Több négyzetméteres egybefüggő lapok mozgatása és szakszerű fektetése vákuumos emelőkeretekkel.',
        sourceName: 'Tile & Stone Journal',
        sourceUrl: 'https://www.tilestonejournal.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-2',
        title: 'Ultravékony Elektromos Fűtőfóliák Burkolat Alá',
        category: 'FEJLŐDŐ',
        description: 'Csemperagasztó rétegbe integrált mikronvastag fűtőszálak és digitális zónánkénti hőmérséklet-szabályozás.',
        sourceName: 'Interior Tech Guide',
        sourceUrl: 'https://www.interiortech.com',
        sourceDate: '2024',
      },
      {
        id: 'tech-3',
        title: 'Kiterjesztett Valóságú (AR) Mintatervező Szemüveg',
        category: 'FEJLŐDŐ',
        description: 'A burkoló AR szemüvegén látja a legoptimálisabb vágási vonalakat, mintaforgatást és fugaszélességet.',
        sourceName: 'BIM Forum',
        sourceUrl: 'https://www.bimforum.org',
        sourceDate: '2025',
      },
      {
        id: 'tech-4',
        title: 'Öntisztuló és Antibakteriális Nano-Fugázók',
        category: 'KÍSÉRLETI',
        description: 'Ezüstionos és titán-dioxidos nanobevonatok, amelyek fény hatására lebontják a szennyeződést és a penészt.',
        sourceName: 'Nano Building Materials',
        sourceUrl: 'https://www.nanobuilding.com',
        sourceDate: '2025',
      },
    ],
    futureTechClosure: 'A burkoló szakma a fizikai igazításból a csúcskategóriás belsőépítészeti felülettechnológiává alakul.',
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

    // MÚLT -> JELEN -> JÖVŐ Timeline
    timelineTitle: 'Honnan indult és merre tart a villanyszerelő mesterség?',
    timelineSubtitle: 'Az alumínium drótoktól és olvadóbiztosítóktól a smart home buszokig és V2G energiatárolókig',
    timelineImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    timelineImageAlt: 'Villanyszerelési munkálatok és biztosító tábla',
    timelineStations: [
      {
        id: 'station-1',
        badge: 'RÉGEN',
        title: 'Sodort alumíniumvezetékek és olvadóbiztosítók',
        period: '20. század közepe',
        description: 'Egyszerű világítási és dugaljhálózatok, falon kívüli kábelezés és manuális hibakeresés.',
      },
      {
        id: 'station-2',
        badge: 'MA',
        title: 'Rézkábeles hálózatok, automatizált kismegszakítók és okosotthon alapok',
        period: 'Napjainkban',
        description: 'KNX és vezeték nélküli smart home rendszerek, túlfeszültség-védelem, napelem inverterek bekötése.',
      },
      {
        id: 'station-3',
        badge: 'JÖVŐ',
        title: 'IoT okoshálózatok, lakossági energiatárolás és EV villamosság',
        period: 'Közeli jövő',
        description: 'Napelem-akkumulátor rendszerek, V2G kétirányú autótöltők és mesterséges intelligencia által vezérelt hálózatok.',
      },
      {
        id: 'station-4',
        badge: 'TE',
        title: 'Smart Energy & Energetikai Rendszerintegrátor',
        period: 'Holnap',
        description: 'Az épületek energetikai függetlenségének és intelligens vezérlésének kulcsszakembere.',
      },
    ],

    // MERRE TART A SZAKMA? Future Tech
    futureTechTitle: 'Merre tart a villanyszerelő szakma?',
    futureTechSubtitle: 'Intelligens hálózatok, mikro-erőművek és vezeték nélküli energiatechnológia',
    futureTechCards: [
      {
        id: 'tech-1',
        title: 'Okosotthon Rendszerek & KNX/LoRaWAN Integráció',
        category: 'MÁR LÉTEZŐ',
        description: 'Épületautomatizálási rendszerek, ahol a világítás, hűtés-fűtés és árnyékolás egyetlen központi buszhálózaton kommunikál.',
        sourceName: 'Smart Home World',
        sourceUrl: 'https://www.smarthomeworld.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-2',
        title: 'Bifaciális Napelem & Akkumulátoros Energiatárolók',
        category: 'MÁR LÉTEZŐ',
        description: 'Házilagos energiatárolás és dinamikus tarifájú intelligens energiagazdálkodás.',
        sourceName: 'PV Magazine',
        sourceUrl: 'https://www.pv-magazine.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-3',
        title: 'V2G (Vehicle-to-Grid) Kétirányú Autótöltők',
        category: 'FEJLŐDŐ',
        description: 'Az elektromos autó akkumulátora áramkimaradás esetén visszatáplál a ház vagy az elektromos hálózat felé.',
        sourceName: 'EV Infrastructure',
        sourceUrl: 'https://www.evinfrastructure.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-4',
        title: 'Vezeték Nélküli Nagyfrekvenciás Energiaátvitel',
        category: 'KÍSÉRLETI',
        description: 'Fali mágneses rezonanciás mezők, amelyek kábelek nélkül táplálják a beépített fogyasztókat.',
        sourceName: 'IEEE Spectrum',
        sourceUrl: 'https://spectrum.ieee.org',
        sourceDate: '2025',
      },
    ],
    futureTechClosure: 'A villanyszerelő a kábelhúzóból az intelligens energiagazdálkodás és az okosotthonok első számú mérnök-technológusává válik.',
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

    // MÚLT -> JELEN -> JÖVŐ Timeline
    timelineTitle: 'Honnan indult és merre tart az épületgépész mesterség?',
    timelineSubtitle: 'A szénkazánoktól és acélcsövektől az hőszivattyúkig és zöld hidrogén gépészetig',
    timelineImage: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=1200&q=80',
    timelineImageAlt: 'Épületgépészeti csőrendszerek és hőszivattyús fűtés',
    timelineStations: [
      {
        id: 'station-1',
        badge: 'RÉGEN',
        title: 'Gravitációs szénkazánok és horganyzott acélcsövek',
        period: '20. század közepe',
        description: 'Kézi menetvágás acélcsövekre, öntöttvas radiátorok és nyitott tágulási tartályok.',
      },
      {
        id: 'station-2',
        badge: 'MA',
        title: 'Hőszivattyúk, kondenzációs kazánok és ötrétegű csövek',
        period: 'Napjainkban',
        description: 'Inverteres levegő-víz hőszivattyúk, pressemberes gyorscsatlakozók, felülethűtés és felületfűtés.',
      },
      {
        id: 'station-3',
        badge: 'JÖVŐ',
        title: 'Geotermikus hibrid rendszerek és AI klímavezérlés',
        period: 'Közeli jövő',
        description: 'Nulla emissziós gépészet, gépi tanuló termosztátok és hidrogénkompatibilis fűtési hálózatok.',
      },
      {
        id: 'station-4',
        badge: 'TE',
        title: 'Zöld Gépészeti & Klímatechnológiai Szakértő',
        period: 'Holnap',
        description: 'A fenntartható épületklimatizálás és megújuló energiaforrások mestere.',
      },
    ],

    // MERRE TART A SZAKMA? Future Tech
    futureTechTitle: 'Merre tart az épületgépész szakma?',
    futureTechSubtitle: 'Megújuló hőtárolás, prediktív AI fűtésvezérlés és zöld hidrogén technológia',
    futureTechCards: [
      {
        id: 'tech-1',
        title: 'Inverteres Levegő-Víz és Geotermikus Hőszivattyúk',
        category: 'MÁR LÉTEZŐ',
        description: 'A környezeti hőt hasznosító, 400-500%-os hatékonyságú fűtési és melegvíz előállító rendszerek.',
        sourceName: 'HVAC Journal',
        sourceUrl: 'https://www.hvacjournal.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-2',
        title: 'Hővisszanyerős Központi és Decentralizált Szellőztetés',
        category: 'MÁR LÉTEZŐ',
        description: 'A friss levegőt biztosító, akár 95%-os hőtartalmú levegő-levegő hőcserélő gépészet.',
        sourceName: 'Clean Air Building',
        sourceUrl: 'https://www.cleanairbuilding.com',
        sourceDate: '2024',
      },
      {
        id: 'tech-3',
        title: 'AI Vezérelt Prediktív Energetikai Menedzsment',
        category: 'FEJLŐDŐ',
        description: 'Mesterséges intelligencia, ami az időjárás-előrejelzés alapján optimalizálja a hőszivattyú működését.',
        sourceName: 'Energy Systems Europe',
        sourceUrl: 'https://www.energysystems.eu',
        sourceDate: '2025',
      },
      {
        id: 'tech-4',
        title: 'Zöld Hidrogén Üzemanyagcellás Fűtési Rendszerek',
        category: 'KÍSÉRLETI',
        description: 'Tiszta hidrogént égető vagy üzemanyagcellás minierőművek lakóépületekhez.',
        sourceName: 'Hydrogen Tech Review',
        sourceUrl: 'https://www.hydrogentech.com',
        sourceDate: '2025',
      },
    ],
    futureTechClosure: 'Az épületgépész a csőfektetőből az emissziómentes zöld otthonok és klímatechnológiák kulcsfigurájává lép elő.',
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

    // MÚLT -> JELEN -> JÖVŐ Timeline
    timelineTitle: 'Honnan indult és merre tart a tetőfedő mesterség?',
    timelineSubtitle: 'A nehéz agyagcserepektől a beépített napelemes szolárcserepekig és drónos diagnosztikáig',
    timelineImage: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=1200&q=80',
    timelineImageAlt: 'Tetőfedési munkálatok és héjazat építés',
    timelineStations: [
      {
        id: 'station-1',
        badge: 'RÉGEN',
        title: 'Hagyományos agyagcserép és vashuzalos rögzítés',
        period: '20. század közepe',
        description: 'Kézi bádogszabás, nehéz feljutás állványok nélkül, minimális hőszigetelési technológia.',
      },
      {
        id: 'station-2',
        badge: 'MA',
        title: 'Szellőztetett tetőszerkezetek, fóliák és gépi élhajlítás',
        period: 'Napjainkban',
        description: 'Rendszertetők, beton- és kerámiacserepek, beépített napelem modulok és vízszigetelő membránok.',
      },
      {
        id: 'station-3',
        badge: 'JÖVŐ',
        title: 'BIPV Solartető-cserepek és drónos tetőfelmérés',
        period: 'Közeli jövő',
        description: 'Napelemmel egybeöntött szintetikus cserepek, hőkamerás drónos diagnosztika és gyors szerelhetőség.',
      },
      {
        id: 'station-4',
        badge: 'TE',
        title: 'Szolár-Tetőtechnológus és Karbantartási Specialist',
        period: 'Holnap',
        description: 'Energiatermelő tetőrendszerek és modern vízszigetelések profi szakembere.',
      },
    ],

    // MERRE TART A SZAKMA? Future Tech
    futureTechTitle: 'Merre tart a tetőfedő szakma?',
    futureTechSubtitle: 'Beépített napelemek, drónos mérések és ön-hűtő tetőbevonatok',
    futureTechCards: [
      {
        id: 'tech-1',
        title: 'BIPV (Building Integrated Photovoltaics) Szolárcserepek',
        category: 'MÁR LÉTEZŐ',
        description: 'A tetőfedő anyagba teljes mértékben integrált napelemek, amelyek észrevétlenül termelnek áramot.',
        sourceName: 'Solar Architecture',
        sourceUrl: 'https://www.solararchitecture.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-2',
        title: 'Drónos Hőkamerás Tetődiagnosztika és CAD Modell',
        category: 'MÁR LÉTEZŐ',
        description: 'Automatikus drónos repülés a tető felett, ami perceken belül 3D modellt készít a hibák és szivárgások feltárására.',
        sourceName: 'Roofing Contractor',
        sourceUrl: 'https://www.roofingcontractor.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-3',
        title: 'Ultra-könnyű Újrahasznosított Szintetikus Cserepek',
        category: 'FEJLŐDŐ',
        description: 'Újrahasznosított műanyagból és kőporból készült 50 év garanciás, extrém időjárásálló kompozitok.',
        sourceName: 'Green Materials',
        sourceUrl: 'https://www.greenmaterials.com',
        sourceDate: '2024',
      },
      {
        id: 'tech-4',
        title: 'Self-Cooling Cool-Roof Titán-Dioxid Bevonatok',
        category: 'KÍSÉRLETI',
        description: 'Napsugárzást 90%-ban visszaverő nano-bevonatok, amelyek nyáron jelentősen hűtik a tetőteret.',
        sourceName: 'Climate Building Tech',
        sourceUrl: 'https://www.climatebuilding.com',
        sourceDate: '2025',
      },
    ],
    futureTechClosure: 'A tetőfedő a cserepezőből a ház elsődleges védelmének és energiatermelő héjazatának specialistája.',
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

    // MÚLT -> JELEN -> JÖVŐ Timeline
    timelineTitle: 'Honnan indult és merre tart a gipszkartonozó mesterség?',
    timelineSubtitle: 'A nádszövetes vakolástól a fémvázas profilokig és glettelő robotokig',
    timelineImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    timelineImageAlt: 'Gipszkartonozási és szárazépítő munkák',
    timelineStations: [
      {
        id: 'station-1',
        badge: 'RÉGEN',
        title: 'Nádszövetes vakolás és fa lécezés',
        period: '20. század közepe',
        description: 'Időigényes nedves vakolás, lassú száradás, fa válaszfal-vázak és nagy szerkezeti tömeg.',
      },
      {
        id: 'station-2',
        badge: 'MA',
        title: 'Csomagolt profilrendszerek és gépi csavarozás',
        period: 'Napjainkban',
        description: 'CD/UD profilok, szigetelt válaszfalak, gipszkarton emelő állványok és gépi glettelés.',
      },
      {
        id: 'station-3',
        badge: 'JÖVŐ',
        title: 'Előre gyártott válaszfal-modulok és felületkezelő automaták',
        period: 'Közeli jövő',
        description: 'Laser-guided profilállítás, csavartalan gyorscsatlakozók és pormentes csiszolórobotok.',
      },
      {
        id: 'station-4',
        badge: 'TE',
        title: 'Belső Térformáló & Akusztikai Specialist',
        period: 'Holnap',
        description: 'Környezetbarát, gyors és professzionális belsőépítészeti válaszfal-rendszerek építője.',
      },
    ],

    // MERRE TART A SZAKMA? Future Tech
    futureTechTitle: 'Merre tart a gipszkartonozó szakma?',
    futureTechSubtitle: 'Ergonomikus szerelési segédeszközök, robottal végzett glettelés és okoslapok',
    futureTechCards: [
      {
        id: 'tech-1',
        title: 'Exoskeleton és Magaslati Emelőeszközök',
        category: 'MÁR LÉTEZŐ',
        description: 'A mennyezeti kartonozást segítő ergonomikus tartószerkezet és pneumatikus emelő állványok.',
        sourceName: 'Drywall Pro',
        sourceUrl: 'https://www.drywallpro.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-2',
        title: 'Mobil Glettelő és Csiszoló Robotok',
        category: 'FEJLŐDŐ',
        description: 'Automatizált csiszolókarok pormentes elszívással, amelyek tükörsima falfelületet képeznek.',
        sourceName: 'Robotics in Construction',
        sourceUrl: 'https://www.roboticinconstruction.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-3',
        title: 'Magas Akusztikai Szigetelésű Grafénos Gipszkartonok',
        category: 'FEJLŐDŐ',
        description: 'Rendkívül vékony, mégis kiemelkedő hanggátló és tűzálló tulajdonságú kompozit lapok.',
        sourceName: 'Acoustics World',
        sourceUrl: 'https://www.acousticsworld.com',
        sourceDate: '2024',
      },
      {
        id: 'tech-4',
        title: 'Nedvességre Színváltó Intelligens Gipszkarton',
        category: 'KÍSÉRLETI',
        description: 'Belső bevonat, amely vizuálisan jelzi a fal mögötti csőtörést vagy rejtett páralecsapódást.',
        sourceName: 'Smart Interiors',
        sourceUrl: 'https://www.smartinteriors.com',
        sourceDate: '2025',
      },
    ],
    futureTechClosure: 'A gipszkartonozó a glettelőből a gyors, flexibilis és akusztikailag optimalizált beltérformálás mesterévé válik.',
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

    // MÚLT -> JELEN -> JÖVŐ Timeline
    timelineTitle: 'Honnan indult és merre tart a festő mesterség?',
    timelineSubtitle: 'A mészolástól és keféktől az airless gépi szóráson át a fotokatalitikus légtisztító festékekig',
    timelineImage: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
    timelineImageAlt: 'Szobafestés és gépi festékszórás',
    timelineStations: [
      {
        id: 'station-1',
        badge: 'RÉGEN',
        title: 'Készült mészfestés, kefe és kézi enyves glettelés',
        period: '20. század közepe',
        description: 'Mészégetés, nehéz szagmentesítés, kézi felhordás kefével és többszöri lassú glettelési rétegezés.',
      },
      {
        id: 'station-2',
        badge: 'MA',
        title: 'Airless gépi szórás, diszperziós festékek és prémium tapéták',
        period: 'Napjainkban',
        description: 'Nagy nyomású festékszóró gépek, mosható és dörzsálló felületek, lézeres maszkolástechnika.',
      },
      {
        id: 'station-3',
        badge: 'JÖVŐ',
        title: 'Öntisztuló fotokatalitikus festékek és robotizált szórófejek',
        period: 'Közeli jövő',
        description: 'Légtisztító belső bevonatok, robottal végzett nagyfelületű festés és intelligens színillesztés.',
      },
      {
        id: 'station-4',
        badge: 'TE',
        title: 'Öko-Felületkezelő és Belsőépítészeti Szín-Szakértő',
        period: 'Holnap',
        description: 'Egészséges beltéri klímát és esztétikai élményt biztosító felülettechnológus.',
      },
    ],

    // MERRE TART A SZAKMA? Future Tech
    futureTechTitle: 'Merre tart a festő szakma?',
    futureTechSubtitle: 'Airless szórástechnika, légtisztító bevonatok és színváltó okosfestékek',
    futureTechCards: [
      {
        id: 'tech-1',
        title: 'Airless (Levegő Nélküli) Gépi Festékszórás',
        category: 'MÁR LÉTEZŐ',
        description: 'Nagy nyomással dolgozó szóróberendezések, amelyek percek alatt egyenletes, csíkmentes felületet biztosítanak.',
        sourceName: 'Painter & Decorator',
        sourceUrl: 'https://www.painterdecorator.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-2',
        title: 'Fotokatalitikus Légtisztító Festékek',
        category: 'FEJLŐDŐ',
        description: 'Titán-dioxidot tartalmazó bevonatok, amelyek a szobai fény hatására lebontják a szagokat és baktériumokat.',
        sourceName: 'Coatings World',
        sourceUrl: 'https://www.coatingsworld.com',
        sourceDate: '2025',
      },
      {
        id: 'tech-3',
        title: 'Önjavító (Self-Healing) Karcmentes Bevonatok',
        category: 'FEJLŐDŐ',
        description: 'A mikrokarcokat testhőmérséklet vagy napsütés hatására automatikusan kisimító intelligens lakkok.',
        sourceName: 'Materials Today',
        sourceUrl: 'https://www.materialstoday.com',
        sourceDate: '2024',
      },
      {
        id: 'tech-4',
        title: 'Elektrokromatikus Színváltó Okosfestékek',
        category: 'KÍSÉRLETI',
        description: 'Gyenge elektromos feszültség hatására árnyalatot vagy mintát változtató pigmentes felületek.',
        sourceName: 'Advanced Decorative Tech',
        sourceUrl: 'https://www.decorativetech.com',
        sourceDate: '2025',
      },
    ],
    futureTechClosure: 'A festő szakma a felületmázolásból az egészséges beltéri környezetet teremtő felületfejlesztés művészetévé alakul.',
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
    summaryChecklist: {
      goodFitIf: ['Szereted a tiszta, színes és esztétikus munkát', 'Szeretnél gyorsan indítható vállalkozást', 'Jó a szemmértéked és precíz vagy'],
      considerOtherIf: ['Nem bírja a karod a tartós felemelt tartást'],
    },
  },
};
