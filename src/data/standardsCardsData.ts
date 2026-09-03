export interface StandardCardItem {
  id: string;
  category_code: string;
  type: string;
  title: string;
  summary: string;
  requirement: string;
  prohibited_action: string;
  why_it_matters: string;
  when_applicable?: string;
  practical_example?: string;
  target_audience: ('munkavállaló' | 'szakember')[];
  legal_sources: {
    name: string;
    section: string;
    url: string;
    status: 'hatályos';
  }[];
  confidence: 'magas';
  source_checked_at: string;
}

export const OFFICIAL_STANDARDS_CARDS: StandardCardItem[] = [
  {
    id: "STD-001",
    category_code: "A",
    type: "1. Építészeti Törvény & Alapelvek",
    title: "Építmények alapvető műszaki követelményei és állékonysága",
    summary: "Az építményeket úgy kell megtervezni és megvalósítani, hogy az állékonyság, a mechanikai szilárdság és a biztonság a teljes élettartamuk során biztosított legyen.",
    requirement: "Az építési tevékenység során be kell tartani az alapvető műszaki követelményeket: mechanikai szilárdság és állékonyság, tűzbiztonság, higiénia és egészségvédelem, használati biztonság, zajvédelem, energiatakarékosság, valamint az erőforrások fenntartható használata.",
    prohibited_action: "Szigorúan tilos a tartószerkezeti elemek kiváltása, átvágása vagy statikai méretezés nélküli módosítása a felelős tervező és statikus jóváhagyása nélkül.",
    why_it_matters: "A tartószerkezeti hibák és engedély nélküli átalakítások épületösszeomláshoz, életveszélyhez és teljes jogi felelősségre vonáshoz vezetnek.",
    when_applicable: "Minden építési, átalakítási, felújítási és bontási munkálat során.",
    practical_example: "Teherhordó téglafalban ajtónyílás utólagos kiváltásánál kötelező áthidaló beépítése statikai méretezés és dúcocás mellett.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "2023. évi C. törvény a magyar építészetről",
        section: "45. § - 50. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2023-100-00-00",
        status: "hatályos"
      },
      {
        name: "1997. évi LXXVIII. törvény az épített környezet alakításáról és védelméről",
        section: "31. § (1)",
        url: "https://njt.jog.gov.hu/jogszabaly/1997-78-00-00",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-002",
    category_code: "B",
    type: "2. OTÉK & Településrendezés",
    title: "OTÉK szerinti védőtávolságok és telekhatárok szabályai",
    summary: "Épületet a telekhatároktól és más építményektől az előírt védőtávolságok, benapozási és tűztávolsági szabályok szigorú betartásával szabad elhelyezni.",
    requirement: "Az építmények elhelyezésekor biztosítani kell az OTÉK szerinti minimális előkert, oldalkert és hátsó kert méreteket, valamint a szomszédos épületek közötti tűztávolságot.",
    prohibited_action: "Tilos az épület megadott építési helyen kívüli kiterjesztése vagy a szomszéd telekre való átnyúlása a jogszabályban rögzített eltérési engedélyek nélkül.",
    why_it_matters: "A telekhatár-sértés és szabálytalan elhelyezés fennmaradási engedély megtagadásához és bontási kötelezettség kiszabásához vezet.",
    when_applicable: "Épület kitűzésekor és alapozási munkák megkezdése előtt.",
    practical_example: "Oldalhatáron álló beépítés esetén az épület főfalának a telekhatáron kell állnia, a tető túlnyúlása és csapadékelvezetése saját telekre történhet.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "253/1997. (XII. 20.) Korm. rendelet (OTÉK)",
        section: "35. § - 37. §",
        url: "https://njt.jog.gov.hu/jogszabaly/1997-253-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-003",
    category_code: "C",
    type: "3. Kivitelezési Kódex & E-napló",
    title: "Elektronikus építési napló (e-napló) vezetésének kötelezettsége",
    summary: "Az építőipari kivitelezési tevékenység végzését az építési munkaterület átadásától az építmény átadás-átvételéig e-naplóban kell dokumentálni.",
    requirement: "A felelős műszaki vezetőnek és a kivitelezőnek naponta kötelező rögzíteni az időjárást, a létszámot, az elvégzett munkákat, a beépített anyagok teljesítménynyilatkozatait és a bejegyzéseket.",
    prohibited_action: "Tilos az építési tevékenység folytatása nyitott és érvényes e-napló nélkül, vagy a naplóbejegyzések utólagos meghamisítása.",
    why_it_matters: "Az e-napló hiánya vagy hiányos vezetése az építésfelügyelet részéről azonnali építésleállítást és milliós bírságot von maga után.",
    when_applicable: "Minden építési engedélyhez vagy egyszerű bejelentéshez kötött építési munkánál.",
    practical_example: "Rejtett szerkezetek (pl. vasalás, vízszigetelés) eltakarása előtt kötelező az e-naplóban fotóval dokumentált eltakarási jegyzőkönyvet vezetni.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "191/2009. (IX. 15.) Korm. rendelet",
        section: "24. § - 27. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2009-191-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-004",
    category_code: "C",
    type: "3. Kivitelezési Kódex & E-napló",
    title: "Felelős Műszaki Vezető (FMV) feladatai és felelőssége",
    summary: "Az építési-szerelési munkát szakmagyakorlási jogosultsággal rendelkező Felelős Műszaki Vezető irányításával szabad végezni.",
    requirement: "Az FMV felel a jogszabályok, a tervek, a szabványok és a szakmai szabályok betartásáért, az alkalmazott technológiák szakszerűségéért és a minőség-ellenőrzésért.",
    prohibited_action: "Tilos a kivitelezési tevékenységet megfelelő kamarai névjegyzékben szereplő FMV nélkül folytatni.",
    why_it_matters: "Az FMV szakmai irányítása garancia arra, hogy az épület szerkezetileg stabil és jogilag megfelel az építési hatósági előírásoknak.",
    when_applicable: "A teljes kivitelezési folyamat során a munkaterület átvételétől a használatbavételig.",
    practical_example: "Betonozás előtt az FMV ellenőrzi a zsaluzat stabilitását és a betonacél vasalási terv szerinti elhelyezését, majd bejegyzi a jóváhagyást az e-naplóba.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "191/2009. (IX. 15.) Korm. rendelet",
        section: "13. § - 14. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2009-191-20-22",
        status: "hatályos"
      },
      {
        name: "266/2013. (VII. 11.) Korm. rendelet",
        section: "16. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2013-266-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-005",
    category_code: "D",
    type: "4. OTSZ & Tűzvédelem",
    title: "Tűzgátló szerkezetek és gépészeti átvezetések szabályai (OTSZ)",
    summary: "A tűzszakasz-határokon átmenő vezetékeket és csöveket megfelelő tűzgátló lezárással kell ellátni az előírt EI tűzállósági teljesítmény biztosításához.",
    requirement: "Gépészeti, villamos és szellőzővezetékek tűzszakasz-határon történő átvezetésénél bevizsgált, minősített tűzgátló mandzsettát, tömítést vagy csapót kell beépíteni.",
    prohibited_action: "Tilos a tűzgátló falakban lévő áttöréseket kezeletlenül hagyni, vagy poliuretán purhabbal kitölteni minősített tűzgátló tömítés helyett.",
    why_it_matters: "A kezeletlen csőáttöréseken keresztül a tűz és a mérgező füst másodpercek alatt átterjed a szomszédos tűzszakaszra, emberéleteket veszélyeztetve.",
    when_applicable: "Kábel- és csőátvezetések kivitelezésekor, szakipari áttörések lezárásánál.",
    practical_example: "Műanyag lefolyócső tűzgátló falon való átvezetésénél tűzre duzzadó (intumescens) tűzgátló mandzsettát kell felszerelni mindkét oldalra.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "54/2014. (XII. 5.) BM rendelet (OTSZ)",
        section: "23. § - 28. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2014-54-20-1A",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-006",
    category_code: "D",
    type: "4. OTSZ & Tűzvédelem",
    title: "Kiürítési útvonalak és hosszak szabadon tartása",
    summary: "Az épületben tartózkodók biztonságos menekülése érdekében a kiürítési útvonalak szélességét és akadálymentességét folyamatosan biztosítani kell.",
    requirement: "A menekülési utakon a minimális szabad szélességet (legalább 1,10 m) fenn kell tartani, a menekülési ajtóknak kulcs nélkül belsejéből nyithatónak kell lenniük.",
    prohibited_action: "Tilos a kiürítési folyosókon, lépcsőházakban éghető anyagot, raklapot, építési törmeléket tárolni vagy a menekülési ajtókat kulccsal bezárni.",
    why_it_matters: "A eltorlaszolt kiürítési utak füstben és pánikhelyzetben tömegszerencsétlenséghez vezetnek.",
    when_applicable: "Épületek kivitelezése, felújítása és üzemeltetése során.",
    practical_example: "A lépcsőházi pihenőben az építkezés alatt sem szabad építőanyag-tartalékot felhalmozni a menekülési útvonal szűkítésével.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "54/2014. (XII. 5.) BM rendelet (OTSZ)",
        section: "51. § - 56. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2014-54-20-1A",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-007",
    category_code: "E",
    type: "5. CPR & Építési Termékek",
    title: "Építési termékek Teljesítménynyilatkozata (DoP / CE jelölés)",
    summary: "Építménybe kizárólag olyan építési termék építhető be, amely rendelkezik érvényes Teljesítménynyilatkozattal (Declaration of Performance).",
    requirement: "A gyártónak vagy forgalmazónak magyar nyelvű teljesítménynyilatkozatot kell átadnia, amelyet a beépítés előtt az FMV-nek ellenőriznie és az e-naplóhoz csatolnia kell.",
    prohibited_action: "Tilos bizonytalan eredetű, Teljesítménynyilatkozat vagy CE/CEE minősítés nélküli építőanyagok (tégla, beton, szigetelés, vas) beépítése.",
    why_it_matters: "A nem minősített anyagok beépítése az épület műszaki megbízhatatlanságát okozza, és a hatóság a termék kibontását rendelheti el.",
    when_applicable: "Minden építőanyag beszállításakor és beépítése előtt.",
    practical_example: "A homlokzati hőszigetelő rendszer (EPS/kőzetgyapot) megrendelésekor a beszállítótól el kell kérni a rendszerre vonatkozó komplett Teljesítménynyilatkozatot.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "275/2013. (VII. 16.) Korm. rendelet",
        section: "3. § - 7. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2013-275-20-22",
        status: "hatályos"
      },
      {
        name: "305/2011/EU európai parlamenti és tanácsi rendelet (CPR)",
        section: "4. cikk",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-008",
    category_code: "F",
    type: "6. Épületenergetika & KNE",
    title: "Közel nulla energiaigényű (KNE) épületek energetikai követelményei",
    summary: "Új épületek építésekor be kell tartani a határoló szerkezetek maximális U-értékeit és az elvárt megújuló energia részarányt.",
    requirement: "A külső falak, födémek és nyílászárók hőátbocsátási tényezője (U) nem haladhatja meg a jogszabályi határértéket (pl. külső fal U ≤ 0,20 W/m²K, ablak U ≤ 1,0 W/m²K).",
    prohibited_action: "Tilos a kiviteli tervben szereplő szigetelési vastagságnál vékonyabb vagy rosszabb hővezetési tényezőjű (λ) anyag beépítése a tervező jóváhagyása nélkül.",
    why_it_matters: "A hőtechnikai méretezés megsértése hőhidakhoz, penészesedéshez és az energetikai tanúsítvány megbukásához vezet.",
    when_applicable: "Új épületek tervezésekor és hőszigetelési munkálatainál.",
    practical_example: "15 cm λ=0,039 W/mK EPS szigetelés nem helyettesíthető 10 cm szigeteléssel, mert az épület nem éri el a KNE energetikai szintet.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "9/2023. (V. 25.) ÉKM rendelet",
        section: "1. melléklet",
        url: "https://njt.jog.gov.hu/jogszabaly/2023-9-20-7H",
        status: "hatályos"
      },
      {
        name: "176/2008. (VI. 30.) Korm. rendelet",
        section: "3. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2008-176-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-009",
    category_code: "G",
    type: "7. Eurocode & Tartószerkezet",
    title: "Eurocode MSZ EN 1990 - Teher kombinációk és biztonsági tényezők",
    summary: "A tartószerkezeteket az Eurocode szabványsorozat szerint a teherbírási és használhatósági határállapotokra kell méretezni.",
    requirement: "A statikai számítások során figyelembe kell venni az állandó terheket (önsúly), a változó terheket (hasznos teher, hóteher, szélteher) és a rendkívüli terheket (földrengés, tűz).",
    prohibited_action: "Tilos a kiviteli statikai tervektől eltérően csökkenteni az acélbeton vasalási keresztmetszetet vagy megváltoztatni a beton minőségét.",
    why_it_matters: "Az alulméretezett szerkezet elhajlást, repedéseket vagy tartószerkezeti törést szenved a hóteher vagy szélteher hatására.",
    when_applicable: "Monolit és előregyártott szerkezetek tervezésekor és kivitelezésekor.",
    practical_example: "Magyarországon az MSZ EN 1991-1-3 szerint a hóteher alapértéke s_k = 1,25 kN/m², amit a tetőszerkezet méretezésénél kötelező alkalmazni.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "MSZ EN 1990:2011 (Eurocode: A tartószerkezetek tervezésének alapjai)",
        section: "6. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      },
      {
        name: "MSZ EN 1991-1-3:2006 (Eurocode 1: Hóteher)",
        section: "4. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-010",
    category_code: "H",
    type: "8. Beton & Alapozási Szabványok",
    title: "Beton környezeti kitéti osztályok (MSZ EN 206) és betonfedés",
    summary: "A beton keverékösszetételét és a betonacél kötelező betonfedését a környezeti hatások (fagy, korrózió, vegyi anyagok) alapján kell megválasztani.",
    requirement: "Kültéri, fagyveszélyes szerkezeteknél legalább XF1-XF4 kitéti osztályú betont kell használni, a betonacél kötelező betonfedése (c_nom) kültérben 35-50 mm műanyag távtartókkal.",
    prohibited_action: "Tilos az acélbeton vasalást közvetlenül a zsaluzatra vagy a földre fektetni távtartó kerekek/bakok nélkül.",
    why_it_matters: "Elégtelen betonfedés esetén a nedvesség eléri a betonacélt, ami korrózióhoz, a beton lepattogzásához és a szerkezet tönkremeneteléhez vezet.",
    when_applicable: "Alapozási, pillér-, gerenda- és födémbetonozási munkáknál.",
    practical_example: "Sávalap esetén a zsaluzat és a betonacél háló közé 50 mm-es beton távtartó kockákat kell elhelyezni m²-enként legalább 4 darabot.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ EN 206:2014+A2:2021 (Beton. Műszaki feltételek és megfelelőség)",
        section: "4. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      },
      {
        name: "MSZ 4798:2016 (Műszaki feltételek Magyarországon alkalmazott betonokhoz)",
        section: "5. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-011",
    category_code: "I",
    type: "9. Villamos & Biztonságtechnika",
    title: "Kisfeszültségű villamos berendezések és FI-relé védelme (MSZ HD 60364)",
    summary: "Az építőipari felvonulási szekrényeket és a végfelhasználói áramköröket 30 mA-es áram-védőkapcsolóval (FI-relé) kell ellátni.",
    requirement: "Minden szabadtéri és vizes helyiségben lévő dugaszolóaljzat áramkörét legfeljebb I_Δn = 30 mA érzékenységű FI-relével kell védeni, és a védővezető (EPH) folytonosságát méréssel kell igazolni.",
    prohibited_action: "Tilos a FI-relé kiiktatása, áthidalása vagy megszakadt védőföldelésű gép működtetése.",
    why_it_matters: "A 30 mA-es FI-relé emberi testrész közvetlen érintésekor milliszekundumok alatt lekapcsol, megelőzve a halálos áramütést.",
    when_applicable: "Építési felvonulási villamos hálózatok és végleges épületvillamosság létesítésekor.",
    practical_example: "Az építési területi ideiglenes elosztószekrényben havonta kötelező megnyomni a FI-relé TEST gombját és elvégezni a villamos felülvizsgálatot.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ HD 60364-4-41:2018 (Villamos berendezések. Áramütés elleni védelem)",
        section: "411.3.3. szakasz",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      },
      {
        name: "MSZ HD 60364-7-704:2018 (Építési és bontási területek berendezései)",
        section: "704.411. szakasz",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-012",
    category_code: "J",
    type: "10. Kamarai Jogosultság & Felelősség",
    title: "Építésügyi szakmagyakorlási jogosultságok (MMK / MÉK)",
    summary: "Építészeti-műszaki tervezést, felelős műszaki vezetést és műszaki ellenőrzést csak a szakmai kamara érvényes névjegyzékében szereplő személy végezhet.",
    requirement: "A tervezőnek és az FMV-nek érvényes kamarai tagsággal (MMK/MÉK), kötelező továbbképzéssel és megfelelő felelősségbiztosítással kell rendelkeznie.",
    prohibited_action: "Tilos jogosultság nélkül tervezői, felelős műszaki vezetői vagy műszaki ellenőri nyilatkozatot aláírni.",
    why_it_matters: "A jogosultság nélküli munkavégzés érvényteleníti az építési hatósági eljárást és bűncselekménynek minősülhet.",
    when_applicable: "Minden mérnöki és műszaki irányítási tevékenységnél.",
    practical_example: "A megrendelő a munkaterület átadás előtt a kamarai online nyilvántartásban ellenőrzi a tervező és az FMV jogosultsági kódját (pl. MV-É).",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "266/2013. (VII. 11.) Korm. rendelet",
        section: "1. § - 6. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2013-266-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-013",
    category_code: "K",
    type: "11. Akadálymentesítés & Ergonómia",
    title: "Akadálymentes közlekedés és lejtők szabványos méretezése",
    summary: "Középületek és több lakásos épületek akadálymentes megközelítésénél be kell tartani a rámpák maximális lejtését és a minimális ajtószélességeket.",
    requirement: "Az akadálymentes rámpa lejtése legfeljebb 5% (1:20) lehet, 1,80 m-nél nagyobb szintkülönbség esetén pihenőt kell közbeiktatni, a szabad ajtónyílás szélessége legalább 0,90 m.",
    prohibited_action: "Tilos az akadálymentes útvonalon szűkületet, kerekesszékkel nem járható burkolatot vagy küszöböt (1,5 cm-nél magasabbat) létesíteni.",
    why_it_matters: "A meredek vagy szűk rámpa balesetveszélyes és meggátolja a mozgáskorlátozott személyek önálló közlekedését.",
    when_applicable: "Középületek és lakóépületek akadálymentes megközelítésének tervezésekor és építésekor.",
    practical_example: "50 cm szintkülönbség áthidalásához legalább 10 méter hosszú rámpát kell építeni mindkét oldalán 0,95 m magasságú kapaszkodóval.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "253/1997. (XII. 20.) Korm. rendelet (OTÉK)",
        section: "94. §",
        url: "https://njt.jog.gov.hu/jogszabaly/1997-253-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-014",
    category_code: "L",
    type: "12. Állványzat & Szerkezetek",
    title: "Homlokzati állványok rögzítési és teherbírási szabványa (MSZ EN 12811)",
    summary: "A rendszerezett homlokzati állványokat gyártói utasítás és szabvány szerint kell horgonyozni, pallózni és védőkorláttal ellátni.",
    requirement: "Az állványokat a falhoz szakszerűen kell kikötni, a munka-szinteket hézagmentesen pallózni kell, és 1,00 m magas védőkorlátot, közvbenső lécedet és 15 cm-es láblécet kell alkalmazni.",
    prohibited_action: "Tilos a kikötések önkényes eltávolítása a homlokzat szigetelésekor, vagy az állvány túlterhelése nehéz építőanyagokkal.",
    why_it_matters: "A hiányzó kikötések miatt a homlokzati állvány a szélteher hatására kidőlhet, tömeges sérülést okozva.",
    when_applicable: "Minden homlokzati állvány szerelésekor, átvételekor és használatakor.",
    practical_example: "Az állványátvételi jegyzőkönyvet a felelős állványszerelő és az FMV aláírja, majd a kijelölt állványon kihelyezik a zöld kártyát.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ EN 12811-1:2004 (Ideiglenes szerkezetek. Állványok)",
        section: "6. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      },
      {
        name: "4/2002. (II. 20.) SZCSM-EüM együttes rendelet",
        section: "2. számú melléklet",
        url: "https://njt.jog.gov.hu/jogszabaly/2002-4-20-13",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-015",
    category_code: "B",
    type: "2. OTÉK & Településrendezés",
    title: "Benapozási előírások és lakóhelyiségek természetes világítása",
    summary: "A lakások legalább egy lakószobájának biztosítania kell a jogszabályban előírt minimális benapozási időt.",
    requirement: "A lakás legalább egy szobájában február 15-én legalább 60 perc benapozást kell biztosítani, és a szoba bevilágító felületének az alapterület legalább 1/8-át el kell érnie.",
    prohibited_action: "Tilos olyan szomszédos építményt tervezni vagy építeni, amely a szomszédos meglévő lakás benapozását az OTÉK határérték alá csökkenti.",
    why_it_matters: "A megfelelő természetes fény elengedhetetlen az emberi egészséghez, a D-vitamin képződéshez és a pszichés jólléthez.",
    when_applicable: "Épületek tömegalakításakor, alaprajzi tervezésekor és ablakméretezéskor.",
    practical_example: "20 m²-es nappali szoba esetén a nyílászáró üvegfelületének legalább 2,5 m²-nek kell lennie a szakszerű bevilágításhoz.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "253/1997. (XII. 20.) Korm. rendelet (OTÉK)",
        section: "88. § - 90. §",
        url: "https://njt.jog.gov.hu/jogszabaly/1997-253-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-016",
    category_code: "C",
    type: "3. Kivitelezési Kódex & E-napló",
    title: "Műszaki Ellenőr (ME) feladatai és függetlensége",
    summary: "Az építtető által megbízott Műszaki Ellenőr feladata az építtető érdekeinek képviselete a kivitelezési minőség és a költségek tekintetében.",
    requirement: "A műszaki ellenőr ellenőrzi a terveknek és a jogszabályoknak való megfelelést, a pót- és pótmunka igényeket, jelen van a rejtett szerkezetek ellenőrzésénél és igazolja a teljesítéseket.",
    prohibited_action: "Tilos a műszaki ellenőrnek összeférhetetlenség esetén (pl. ha ő maga vagy hozzátartozója a kivitelező) eljárnia.",
    why_it_matters: "A független ellenőrzés megakadályozza a szakszerűtlen építkezést, a tervtől való eltérést és a túlárazott számlázást.",
    when_applicable: "Minden olyan építkezésen, ahol az építtető műszaki ellenőrt alkalmaz (jogszabályi kötelezettség vagy önkéntes döntés alapján).",
    practical_example: "A műszaki ellenőr az e-naplóban leállíthatja a munkavégzést, ha a kivitelező nem a terv szerinti betonacél átmérőt kívánja beépíteni.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "191/2009. (IX. 15.) Korm. rendelet",
        section: "16. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2009-191-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-017",
    category_code: "H",
    type: "8. Beton & Alapozási Szabványok",
    title: "Sávalapok fagyhatár alatti alapozási mélysége (MSZ 15000)",
    summary: "Az épület alapjait a helyi talaj fagyhatára alatt kell elhelyezni a fagyási talajmozgások és repedések megelőzésére.",
    requirement: "Magyarországon a sávalapok és pontalapok minimális alapozási mélysége a rendezett terepszinttől mérve kötött talajnál legalább 0,80 - 1,00 m.",
    prohibited_action: "Tilos a teherhordó alapozást a fagyhatár felett elhelyezni, kivéve ha speciális fagyálló szigeteléssel és méretezéssel készült mélyalapozás.",
    why_it_matters: "A fagyhatár feletti alap alatt a talajban lévő víz megfagy, felemeli az alapot, majd kiolvadáskor az épület megsüllyed és megreped.",
    when_applicable: "Épületek alapozási terveinek készítésekor és földmunkáinál.",
    practical_example: "Családi ház sávalapjának kiásásakor a gépi földmunkát 0,90 m mélységben kell megállítani és kézi tisztítással eléri a teherhordó talajt.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ 15000-1 (Építmények tartószerkezeti tervezése. Alapozás)",
        section: "3. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      },
      {
        name: "MSZ EN 1997-1 (Eurocode 7: Geotechnikai tervezés)",
        section: "6.4. szakasz",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-018",
    category_code: "E",
    type: "5. CPR & Építési Termékek",
    title: "Vízszigetelő anyagok szabványai és üzemi ellenőrzése",
    summary: "Talajnedvesség és talajvíz elleni bitumenes vagy műanyag lemezeknek meg kell felelniük az MSZ EN 13969 / MSZ EN 13707 szabványnak.",
    requirement: "Az épület alaplemezén és lábazatán beépített vízszigetelő lemezeknek rendelkezniük kell vízzárósági minősítéssel, a toldásoknál az előírt átfedést (8-10 cm) forrólevegős vagy lángolvasztásos hegesztéssel kell zárni.",
    prohibited_action: "Tilos nem vízszigetelési célú kátránypapír vagy minősítetlen műanyag fólia beépítése talajnedvesség elleni szigetelésként.",
    why_it_matters: "A hibás vízszigetelés utólagos javítása a falak átvágását, injektálást vagy a téglalábazat kibontását igényli többmilliós költséggel.",
    when_applicable: "Alaplemezek, lábazatok és zöldtetők vízszigetelésénél.",
    practical_example: "Talajvíznyomás esetén 2 réteg modifikált bitumenes vastaglemezt kell beépíteni teljes felületű lángolvasztásos ragasztással.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ EN 13969:2005 (Vízszigetelő lemezek. Bitumenes talajnedvesség-szigetelő lemezek)",
        section: "5. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-019",
    category_code: "I",
    type: "9. Villamos & Biztonságtechnika",
    title: "Villámvédelmi berendezések létesítése és felülvizsgálata (MSZ EN 62305)",
    summary: "Az épületek villámvédelmi rendszerét (LPS) kockázatelemzés alapján kell tervezni, megvalósítani és időszakosan felülvizsgálni.",
    requirement: "A villámvédelmi felfogókat, levezetőket és földelőket a vonatkozó villámvédelmi fokozatnak (LPS I-IV) megfelelően kell méretezni, az EPH hálózatba be kell kötni a fémcsöveket és kábeltálcákat.",
    prohibited_action: "Tilos a villámvédelmi levezető vezetékek megbontása vagy a földelési ellenállás mérése nélküli átadása.",
    why_it_matters: "A hiányos villámvédelem miatt a villámcsapás tüzet, robbanást és az épületben lévő elektronikai eszközök azonnali tönkremenetelét okozza.",
    when_applicable: "Középületek, ipari csarnokok és lakóépületek villámvédelmének építésekor.",
    practical_example: "Az építkezés befejeztével a villámvédelmi felülvizsgáló ellenőrzi a földelési ellenállást (max 10 Ohm) és kiállítja a felülvizsgálati jegyzőkönyvet.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "MSZ EN 62305-3:2011 (Villámvédelem. Építmények fizikai károsodása és életveszély)",
        section: "5. és 6. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      },
      {
        name: "54/2014. (XII. 5.) BM rendelet (OTSZ)",
        section: "135. § - 138. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2014-54-20-1A",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-020",
    category_code: "F",
    type: "6. Épületenergetika & KNE",
    title: "Energetikai tanúsítvány kiállítása és kötelező tartalma",
    summary: "Az épületek értékesítéséhez, bérbeadásához vagy használatbavételéhez jogszabály által előírt Energetikai Tanúsítvány szükséges.",
    requirement: "A tanúsítónak helyszíni felmérés és hőtani számítás alapján kell besorolnia az épületet az új energetikai skála szerint (A+++ - I), feltüntetve a felújítási javaslatokat.",
    prohibited_action: "Tilos energetikai tanúsítványt kiállítani helyszíni szemle és valós mérnöki számítás elvégzése nélkül.",
    why_it_matters: "A tanúsítvány megbízható tájékoztatást ad a vevőnek/bérlőnek az épület várható energiaköltségeiről és korszerűsítési igényéről.",
    when_applicable: "Új épület használatbavételekor, meglévő épület eladásakor vagy bérbeadásakor.",
    practical_example: "Új lakás adásvételi szerződésében rögzíteni kell az Energetikai Tanúsítvány azonosító kódját (HET kód).",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "176/2008. (VI. 30.) Korm. rendelet",
        section: "1. § - 5. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2008-176-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-021",
    category_code: "M",
    type: "13. Akusztika & Zajvédelem",
    title: "Épületakusztikai és hangszigetelési előírások (MSZ 15601 / OTÉK)",
    summary: "A lakások közötti elválasztó falaknak és födémeknek meg kell felelniük az előírt léghang-gátlási és lépéshang-gátlási értékeknek.",
    requirement: "A lakáselválasztó falak minimális léghang-gátlási értéke R'w + C ≥ 51 dB, a lakáselválasztó födémek maximális szabványos lépéshangszintje L'n,w ≤ 52 dB.",
    prohibited_action: "Tilos a lakáselválasztó falak gépészeti vésése vagy úsztatott aljzatbeton szegélyszalag nélküli betonozása, ami hanghidat képez.",
    why_it_matters: "A hibás akusztika áthallást és testhang-terjedést okoz a lakók között, ami utólagosan szinte javíthatatlan és pereskedéshez vezet.",
    when_applicable: "Társasházak, ikerházak és szállodák válaszfalainak és aljzatbetonjának kivitelezésekor.",
    practical_example: "Az aljzatbeton öntése előtt a peremszigetelő polifoam csíkot a falak mentén végig fel kell hajtani az áthallási hanghíd elkerülésére.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ 15601-1:2007 (Épületakusztika. Épületen belüli hangszigetelési követelmények)",
        section: "4. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      },
      {
        name: "253/1997. (XII. 20.) Korm. rendelet (OTÉK)",
        section: "91. §",
        url: "https://njt.jog.gov.hu/jogszabaly/1997-253-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-022",
    category_code: "C",
    type: "3. Kivitelezési Kódex & E-napló",
    title: "Építésügyi hatósági eljárások és egyszerű bejelentés szabályai",
    summary: "Családi házak építése és bővítése 300 m² összes hasznos alapterületig egyszerű bejelentéshez, míg a többi építmény építési engedélyhez kötött.",
    requirement: "Egyszerű bejelentés esetén a kiviteli terveket fel kell tölteni az ÉTDR rendszerbe a munkakezdés előtt legalább 15 nappal, és meg kell kötni a kötelező tervezői/kivitelezői felelősségbiztosítást.",
    prohibited_action: "Tilos a kivitelezési munkát megkezdeni az ÉTDR visszaigazoló dokumentum megszerzése vagy az e-napló készenlétbe helyezése előtt.",
    why_it_matters: "A szabálytalanul megkezdett építkezést az építésfelügyelet azonnal leállítja, és az építtetőre építésügyi bírságot szab ki.",
    when_applicable: "Új épület építése, bővítése vagy bontása előtt.",
    practical_example: "Családi ház építésénél a tervező feltölti az ÉTDR-be a kiviteli tervdokumentációt (építészet, statika, gépészet, villamosság).",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "312/2012. (XI. 8.) Korm. rendelet",
        section: "1. § - 12. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2012-312-20-22",
        status: "hatályos"
      },
      {
        name: "155/2016. (VI. 13.) Korm. rendelet",
        section: "1. § - 3. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2016-155-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-023",
    category_code: "N",
    type: "14. Épületgépészet & Vízellátás",
    title: "Ivóvízhálózatok és pangóvíz elkerülésének szabványa (MSZ EN 806)",
    summary: "Az épületen belüli ivóvízvezeték-hálózatot úgy kell méretezni és kivitelezni, hogy a víz minősége a csapolókig tiszta és csíramentes maradjon.",
    requirement: "A hálózatot fertőtleníteni és nyomáspróbázni kell az átadás előtt, a hálózatban el kell kerülni a pangó szakaszokat, és a melegvíz hőmérsékletét legalább 50 °C-on kell tartani (Legionella védelem).",
    prohibited_action: "Tilos az ivóvízvezeték és a használtvíz/esővíz hálózat közvetlen fémes vagy csővezeték-összekötése (visszaáramlás-gátló hiánya).",
    why_it_matters: "A pangóvízben elszaporodó Legionella baktérium súlyos tüdőgyulladást és fertőzést okoz a fogyasztóknak.",
    when_applicable: "Víz- és csatornahálózatok szerelésekor, nyomáspróbájakor és átadásakor.",
    practical_example: "A vízvezeték szerelése után a hálózatot 1,5-szeres üzemi nyomással nyomáspróbázni kell, és átmosási jegyzőkönyvet kell kiállítani.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ EN 806-1..5 (Ivóvíz-szállító berendezések épületeken belül)",
        section: "2. és 4. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      },
      {
        name: "5/2023. (I. 12.) Korm. rendelet (Ivóvíz minőségi követelményei)",
        section: "8. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2023-5-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-024",
    category_code: "B",
    type: "2. OTÉK & Településrendezés",
    title: "Csapadékvíz-elvezetés és szikkasztás telekhatáron belül",
    summary: "Az építményről és a burkolt felületekről lefolyó csapadékvizet a saját telken belül kell összegyűjteni és elszikkasztani vagy hasznosítani.",
    requirement: "A tetőcsatornákból érkező csapadékvizet zúzottkővel töltött szikkasztó árokba vagy zárt szikkasztó blokkokba kell vezetni, a szomszéd telektől legalább 1,50 m távolságra.",
    prohibited_action: "Tilos a csapadékvizet a szomszédos telekre, közterületre vagy a szennyvízcsatorna hálózatba átvezetni a hatóság engedélye nélkül.",
    why_it_matters: "A szomszéd telekre vezetett esővíz eláztatja a szomszédos épület alapját és talajsüllyedést okoz.",
    when_applicable: "Tetőfedési, csatornázási és tereprendezési munkáknál.",
    practical_example: "A tetőfelületről lefolyó vizet a csatornán keresztül a kertben kiépített geotextíliával bélelt műanyag szikkasztó blokkrendszerbe vezetjük.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "253/1997. (XII. 20.) Korm. rendelet (OTÉK)",
        section: "84. §",
        url: "https://njt.jog.gov.hu/jogszabaly/1997-253-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-025",
    category_code: "N",
    type: "14. Épületgépészet & Vízellátás",
    title: "Gázfogyasztó berendezések és égéstermék-elvezetők biztonsága",
    summary: "Gázfogyasztó berendezést csak jóváhagyott gázszerelési terv alapján, minősített gázszerelő szerelhet fel és helyezhet üzembe.",
    requirement: "Zárt égésterű (C típusú) gázkazánoknál a levegő-bevezetést és az égéstermék-elvezetést gyári tanúsított rendszerrel kell kiépíteni és kéményseprői nyilatkozattal igazolni.",
    prohibited_action: "Tilos nyílt égésterű gázkészüléket (A vagy B típus) fokozott légzárású nyílászárókkal ellátott helyiségbe beépíteni légbevezető nélkül.",
    why_it_matters: "A nem megfelelő légellátás szén-monoxid (CO) mérgezéshez és elhalálozáshoz vezet a helyiségben tartózkodók számára.",
    when_applicable: "Gázkészülékek cseréjekor, gépészeti átalakításkor és kéménybéleléskor.",
    practical_example: "Zárt égésterű kondenzációs gázkazán szerelésekor a koncentrikus 60/100 mm-es csővezetéket a gyártó által előírt 3%-os lejtéssel építjük be a kazán felé.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "3/2020. (I. 13.) ITM rendelet (Műszaki Biztonsági Szabályzat)",
        section: "2. és 3. fejezet",
        url: "https://njt.jog.gov.hu/jogszabaly/2020-3-20-7H",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-026",
    category_code: "O",
    type: "15. Nyílászáró & Homlokzat",
    title: "Nyílászárók beépítésének lég- és párazárási szabványa (RAL beépítés)",
    summary: "A külső nyílászárókat rétegrendi beépítéssel kell rögzíteni a hőhíd mentes és páratechnikailag helyes kapcsolat biztosításához.",
    requirement: "Az ablak és a falazat közötti hézag belsején párazáró szalagot, középen rugalmas PUR hab hőszigetelést, kívül pedig páraáteresztő, esőálló szalagot kell alkalmazni (RAL beépítés).",
    prohibited_action: "Tilos az ablakcsatlakozási hézagot pusztán meztelen PUR habbal kitölteni takarószalagok nélkül.",
    why_it_matters: "A csupasz PUR hab a belső párától átnedvesedik, tönkremegy, a penész megjelenik az ablak körül és a csatlakozás átfújhatóvá válik.",
    when_applicable: "Külső ablakok, erkélyajtók beépítésekor és felújításakor.",
    practical_example: "A nyílászáró tokjára beépítés előtt felragasztjuk a belső párazáró szalagot, majd a rögzítés és habosítás után átlapolással a falkávára simítjuk.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ 9384-1:100 (Ablakok és erkélyajtók műszaki követelményei)",
        section: "4. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-027",
    category_code: "P",
    type: "16. Környezetvédelem & Hulladék",
    title: "Építési és bontási hulladékok szelektív gyűjtése és nyilvántartása",
    summary: "Az építkezésen keletkező hulladékokat fajtánként szelektíven kell gyűjteni, és a szállításukat hulladéknyilvántartó lappal (ÜKT) kell igazolni.",
    requirement: "A veszélyes hulladékot (pl. azbeszt, kátrány, festék, vegyi anyag) külön zárt konténerben kell tárolni és engedéllyel rendelkező szakvállalkozónak kell átadni.",
    prohibited_action: "Tilos az építési-bontási hulladék illegális elásása, elégetése vagy nem kijelölt lerakóhelyen történő elhelyezése.",
    why_it_matters: "Az illegális hulladékelhelyezés súlyos talaj- és talajvízszennyezést okoz, és a Környezetvédelmi Hatóság milliós bírsággal bünteti.",
    when_applicable: "Minden építési, átalakítási és bontási munkaterületen.",
    practical_example: "Bontás során a fa-, fém-, tégla- és betontörmeléket külön konténerbe gyűjtjük, és a hulladékkezelő igazolását az e-naplóhoz csatoljuk.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "45/2004. (VII. 26.) BM-KvVM együttes rendelet",
        section: "3. § - 9. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2004-45-20-13",
        status: "hatályos"
      },
      {
        name: "2012. évi CLXXXV. törvény a hulladékról",
        section: "31. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2012-185-00-00",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-028",
    category_code: "Q",
    type: "17. Munkaterületi Világítás & Műszaki Ergonómia",
    title: "Munkaterületi világítás és látási viszonyok szabványa (MSZ EN 12464)",
    summary: "Az építési munkaterületen és a közlekedőfolyosókon a biztonságos munkavégzéshez előírt megvilágítási szintet (Lux) kell biztosítani.",
    requirement: "Általános építési munkaterületen legalább 50-100 Lux, finomabb szakipari munkáknál (gépészet, villamosság, burkolás) legalább 200-300 Lux megvilágítás szükséges.",
    prohibited_action: "Tilos sötét, nem megvilágított munkaterületen vagy vakító, közvetlen szembe világító reflektor mellett precíziós munkát végezni.",
    why_it_matters: "A nem megfelelő világítás botlást, esést, vágási sérülést és minőségi hibákat okoz a kivitelezésben.",
    when_applicable: "Zárt téri építkezéseken, pince- és alagútmunkáknál, valamint éjszakai műszakban.",
    practical_example: "Gipszkartonozásnál és glettelésnél hordozható, állványos LED fényszórókat kell beállítani a felületminőség ellenőrzéséhez.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "MSZ EN 12464-2:2014 (Fény és világítás. Kültéri munkahelyek világítása)",
        section: "5. fejezet",
        url: "https://njt.jog.gov.hu/",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-029",
    category_code: "C",
    type: "3. Kivitelezési Kódex & E-napló",
    title: "Használatbavételi engedély és tudomásulvételi eljárás szabályai",
    summary: "Az elkészült építményt csak a jogerős használatbavételi engedély megszerzése vagy tudomásulvétel után szabad rendeltetésszerűen használni.",
    requirement: "A használatbavételhez be kell nyújtani az FMV nyilatkozatát, a szakhatósági állásfoglalásokat (tűzvédelem, kéményseprő, hálózatkezelők) és az energetikai tanúsítványt.",
    prohibited_action: "Tilos az épületbe beköltözni vagy azt üzemeltetni a használatbavételi eljárás sikeres lezárása előtt.",
    why_it_matters: "Az engedély nélküli használat élet- és vagyonbiztonsági kockázatot jelent, és építésügyi bírságot von maga után.",
    when_applicable: "Az építési munkálatok befejezésekor, a használatbavétel előtt.",
    practical_example: "Az építtető az ÉTDR rendszeren keresztül benyújtja a használatbavételi kérelmet az FMV és a műszaki ellenőr igazolásaival együtt.",
    target_audience: ["szakember"],
    legal_sources: [
      {
        name: "312/2012. (XI. 8.) Korm. rendelet",
        section: "39. § - 44. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2012-312-20-22",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  },
  {
    id: "STD-030",
    category_code: "R",
    type: "18. Munkavédelmi Ellenőrzés & Szankciók",
    title: "Építésfelügyeleti ellenőrzés és hatósági szankciók",
    summary: "Az építésfelügyeleti hatóság helyszíni ellenőrzést tarthat az építkezésen, és eltérés vagy szabálytalanság esetén leállíthatja a munkát.",
    requirement: "Az építési területről biztosítani kell a hatósági ellenőr bejutását, be kell mutatni a jóváhagyott kiviteli terveket, a naplót és a szakképesítési igazolásokat.",
    prohibited_action: "Tilos az építésfelügyeleti ellenőr akadályozása, az észlelt hiányosságok elfedése vagy a leállítási határozat megszegése.",
    why_it_matters: "A hatósági előírások betartása garancia arra, hogy az építészetileg szabályos és biztonságos építmények jöjjenek létre.",
    when_applicable: "Minden építési és bontási tevékenység során.",
    practical_example: "Az ellenőrzés során a hatóság ellenőrzi a helyszínen tartózkodók munkaszerződését, az e-napló bejegyzéseit és a védőeszközök használatát.",
    target_audience: ["munkavállaló", "szakember"],
    legal_sources: [
      {
        name: "312/2012. (XI. 8.) Korm. rendelet",
        section: "57. § - 68. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2012-312-20-22",
        status: "hatályos"
      },
      {
        name: "2023. évi C. törvény a magyar építészetről",
        section: "165. §",
        url: "https://njt.jog.gov.hu/jogszabaly/2023-100-00-00",
        status: "hatályos"
      }
    ],
    confidence: "magas",
    source_checked_at: "2026-09-01"
  }
];

