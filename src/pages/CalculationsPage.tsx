import { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  ChevronRight,
  FileText,
  BookOpen,
  Library,
  Layers,
  Home,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  Sparkles,
  Info,
  Check,
  Building,
  Maximize2,
  Search,
  ArrowLeft,
  Ruler,
  Compass,
  TrendingUp,
  HardHat,
  Thermometer,
  HelpCircle,
  CheckSquare,
  FileSpreadsheet,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { CalculatorInput, safeNum, parseNumberValue } from '../components/CalculatorInput';

interface CalculationsPageProps {
  onNavigate: (page: string) => void;
}

type CalculatorTab = 'concrete' | 'masonry' | 'insulation' | 'tiling' | 'drywall' | 'roofing' | 'rafter';

interface MainCategory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  badgeColor: string;
  bgColor: string;
  borderColor: string;
}

const MAIN_CATEGORIES: MainCategory[] = [
  {
    id: 'alapok',
    title: '1. ALAPOK & MÉRTÉKEGYSÉGEK',
    subtitle: 'ALAPOK',
    description: 'Mértékegységek, átváltások, százalékok, arányok, sűrűség.',
    icon: Ruler,
    badgeColor: 'text-amber-700 bg-amber-100 border-amber-300',
    bgColor: 'bg-amber-50/60 hover:bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-400',
  },
  {
    id: 'geometria',
    title: '2. GEOMETRIA & TRIGONOMETRIA',
    subtitle: 'GEOMETRIA',
    description: 'Terület, kerület, térfogat, Pitagorasz, lejtés, szögek.',
    icon: Compass,
    badgeColor: 'text-blue-700 bg-blue-100 border-blue-300',
    bgColor: 'bg-blue-50/60 hover:bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
  },
  {
    id: 'mennyiseg',
    title: '3. MENNYISÉGSZÁMÍTÁS',
    subtitle: 'MENNYISÉG',
    description: 'Ráruházás, veszteség, kerekítés, rendelési mennyiség, szállítás.',
    icon: TrendingUp,
    badgeColor: 'text-emerald-700 bg-emerald-100 border-emerald-300',
    bgColor: 'bg-emerald-50/60 hover:bg-emerald-50',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
  },
  {
    id: 'anyag',
    title: '4. ANYAGSZÜKSÉGLET',
    subtitle: 'ANYAGOK',
    description: 'Beton, falazás, habarcs, vakolat, burkolás, festés, szigetelés, gipszkarton, tető, faanyag, acél.',
    icon: Building,
    badgeColor: 'text-orange-700 bg-orange-100 border-orange-300',
    bgColor: 'bg-orange-50/60 hover:bg-orange-50',
    borderColor: 'border-orange-200 hover:border-orange-400',
  },
  {
    id: 'szerkezet',
    title: '5. SZERKEZETI & KIVITELEZÉSI SZÁMÍTÁSOK',
    subtitle: 'SZERKEZET',
    description: 'Zsaluzás, betonacél, lépcsők, földmunka és egyéb kivitelezési számítások.',
    icon: HardHat,
    badgeColor: 'text-purple-700 bg-purple-100 border-purple-300',
    bgColor: 'bg-purple-50/60 hover:bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
  },
  {
    id: 'halado',
    title: '6. HALADÓ MŰSZAKI SZÁMÍTÁSOK',
    subtitle: 'MŰSZAKI',
    description: 'Hőtechnika, U-érték, páradiffúzió és statikai alapok.',
    icon: Thermometer,
    badgeColor: 'text-red-700 bg-red-100 border-red-300',
    bgColor: 'bg-red-50/60 hover:bg-red-50',
    borderColor: 'border-red-200 hover:border-red-400',
  },
];

interface CalculationItem {
  id: string;
  categoryId: string;
  title: string;
  shortDesc: string;
  level: 'Alap' | 'Középhaladó' | 'Haladó';
  miEz: string;
  mireHasznaljuk: string;
  szuksegesAdatok: string[];
  keplet: string;
  jelolesek: Array<{ symbol: string; name: string }>;
  lepesek: string[];
  gyakorlatiPelda: { title: string; steps: string[]; result: string };
  ellenorzes: string;
  gyakoriHibak: string[];
  gyakorlatiMegjegyzes: string;
  kapcsolodoSzamitasok: string[];
  calculatorTab?: CalculatorTab;
}

const CALCULATION_ITEMS: CalculationItem[] = [
  {
    id: 'savalap-beton',
    categoryId: 'anyag',
    title: 'Sávalap betonszükségletének számítása',
    shortDesc: 'Sávalapok bruttó és nettó betonmennyiségének, zsákos cement és sóderigényének pontos kiszámítása.',
    level: 'Középhaladó',
    miEz: 'A sávalap az épület falai alatt húzódó folyamatos alaptest. Betonszükséglete a sáv hosszának, szélességének és mélységének szorzata, kiegészítve a kivitelezési tömörödési és vágási veszteséggel.',
    mireHasznaljuk: 'Új családi házak, kerítések, melléképületek alapozási anyagszükségletének és szállítási kapacitásának (mixerkocsi vagy kézi keverés) megrendeléséhez.',
    szuksegesAdatok: ['Sávalap hossza (L, méterben)', 'Sávalap szélessége (b, méterben)', 'Sávalap mélysége / magassága (h, méterben)', 'Kivitelezési veszteség és tömörödés (v%, jellemzően 5-10%)'],
    keplet: 'V_bruttó = (L × b × h) × (1 + v / 100)',
    jelolesek: [
      { symbol: 'V_bruttó', name: 'Beton rendelési térfogat (m³)' },
      { symbol: 'L', name: 'Sávalap hossza (m)' },
      { symbol: 'b', name: 'Alap szélessége (m)' },
      { symbol: 'h', name: 'Alap mélysége (m)' },
      { symbol: 'v', name: 'Veszteségi ráhagyás (%)' },
    ],
    lepesek: [
      'Számítsd ki a nettó térfogatot a hossz, szélesség és mélység megszorzásával.',
      'Add hozzá a kivitelezési veszteséget (5-10%).',
      'Határozd meg a szükséges cement (zsák) és sóder (tonna) mennyiségét.',
    ],
    gyakorlatiPelda: {
      title: '36 méter hosszú, 50 cm széles és 80 cm mély sávalap kiöntése (8% ráhagyással)',
      steps: [
        'Nettó térfogat: V = 36m × 0.5m × 0.8m = 14.4 m³',
        'Bruttó betonigény (8% ráhagyással): 14.4 m³ × 1.08 = 15.55 m³',
        'Helyszíni keverésnél: kb. 200 zsák 25kg cement és 28.7 tonna sóder.',
      ],
      result: 'Rendelendő betonmennyiség: 15.6 m³ (kb. 2 mixerszerelvény)',
    },
    ellenorzes: 'Hasonlítsd össze az alapterülettel: egy átlagos sávalap térfogata m³-ben általában az épület alapterületének 15-25%-a körül mozog.',
    gyakoriHibak: [
      'Az egyenetlen kiásás miatti plusz betonszükséglet figyelmen kívül hagyása.',
      'A földtömörödési veszteség kihagyása a rendelésnél.',
      'A sarkok kétszeres beleszámítása a sávhosszba.',
    ],
    gyakorlatiMegjegyzes: 'Gödörásás után célszerű azonnal kiönteni a betont, megelőzve a szél beomlását és a meder átázását.',
    kapcsolodoSzamitasok: ['Lemezalap betonszükségletének számítása', 'Geometriai testek térfogatának kiszámítása', 'Anyagok sűrűsége és halmazsűrűsége'],
    calculatorTab: 'concrete',
  },
  {
    id: 'pitagorasz',
    categoryId: 'geometria',
    title: 'Pitagorasz-tétel és derékszög kitűzése (3-4-5)',
    shortDesc: 'Derékszögű háromszögek oldalainak számítása és építési derékszögek ellenőrzése.',
    level: 'Alap',
    miEz: 'A Pitagorasz-tétel kimondja, hogy derékszögű háromszögben a két befogó négyzeteinek összege egyenlő az átfogó négyzetével (a² + b² = c²).',
    mireHasznaljuk: 'Alaprajzok kitűzésénél, falak csatlakozási derékszögének ellenőrzésénél és tetőszarufák átlójának kiszámításánál.',
    szuksegesAdatok: ['a befogó hossza (m)', 'b befogó hossza (m)'],
    keplet: 'c = √(a² + b²)',
    jelolesek: [
      { symbol: 'a', name: 'Első befogó' },
      { symbol: 'b', name: 'Második befogó' },
      { symbol: 'c', name: 'Átfogó (átló)' },
    ],
    lepesek: [
      'Mérj ki az egyik fal mentén 3 métert (vagy 30 cm-t).',
      'Mérj ki a rá merőleges fal mentén 4 métert (vagy 40 cm-t).',
      'Ha a két végpont közötti átló pontosan 5 méter (vagy 50 cm), a sarok tökéletesen derékszögű.',
    ],
    gyakorlatiPelda: {
      title: '4m x 3m helyiség derékszögű átlójának ellenőrzése',
      steps: ['a² + b² = 3² + 4² = 9 + 16 = 25', 'c = √25 = 5 méter'],
      result: 'Az átlónak pontosan 5.00 méternek kell lennie.',
    },
    ellenorzes: 'Kisebb helyiségekben 3-4-5 helyett a 60cm-80cm-100cm arány is használható.',
    gyakoriHibak: ['Nem feszes mérőszalag használata.', 'Ferde kitűzés pontatlan sarokpontról.'],
    gyakorlatiMegjegyzes: 'Minden alapszedésnél kétszer ellenőrizd az átlókat: téglalap alaprajznál a két átlónak milliméterre egyenlőnek kell lennie!',
    kapcsolodoSzamitasok: ['Síkidomok területe és kerülete', 'Szarufahossz számítása dőlésszögből és fesztávból', 'Lépcsőfok méretezése (2m + sz = 60..64 cm)'],
  },
  {
    id: 'u-ertek',
    categoryId: 'halado',
    title: 'Rétegrendi U-érték és Hőellenállás számítása',
    shortDesc: 'Szerkezetek hőátbocsátási tényezőjének (U) kiszámítása és energetikai jogszabályi megfelelősége.',
    level: 'Haladó',
    miEz: 'Az U-érték (W/m²K) megmutatja, hogy mekkora hőteljesítmény áramlik át 1 m² felületű szerkezeten 1 Kelvin hőmérséklet-különbség hatására. Minél alacsonyabb az U-érték, annál jobb a szerkezet hőszigetelése.',
    mireHasznaljuk: 'Homlokzati falak, födémek és tetők energetikai méretezésénél a TNM 7/2006 (V. 24.) (U <= 0.24 W/m²K) jogszabályi előírások teljesítéséhez.',
    szuksegesAdatok: ['Egyes rétegek vastagsága (d, méterben)', 'Egyes rétegek hővezetési tényezője (λ, W/mK)'],
    keplet: 'R = d / λ,   U = 1 / (R_si + ΣR + R_se)',
    jelolesek: [
      { symbol: 'R', name: 'Hőellenállás (m²K/W)' },
      { symbol: 'd', name: 'Rétegvastagság (m)' },
      { symbol: 'λ', name: 'Hővezetési tényező (W/mK)' },
      { symbol: 'U', name: 'Hőátbocsátási tényező (W/m²K)' },
    ],
    lepesek: [
      'Számítsd ki minden réteg R értékét (R = d / λ).',
      'Add össze a rétegek R értékeit a felületi hőátadási ellenállásokkal (Rsi + ΣR + Rse).',
      'Az U-érték az eredő R érték reciproka (1 / R).',
    ],
    gyakorlatiPelda: {
      title: '30 cm B30 téglafal + 15 cm Grafitos polisztirol hőszigetelés',
      steps: [
        'Tégla R: 0.30m / 0.50 W/mK = 0.60 m²K/W',
        'Grafitos EPS R: 0.15m / 0.031 W/mK = 4.84 m²K/W',
        'Eredő R: 0.13 + 0.60 + 4.84 + 0.04 = 5.61 m²K/W',
        'U-érték: U = 1 / 5.61 = 0.178 W/m²K',
      ],
      result: 'U = 0.18 W/m²K (MEGFELELT a TNM 7/2006 (V. 24.) 0.24 előírásnak!)',
    },
    ellenorzes: 'Ha a hőszigetelés vastagságát duplázod, az R érték nő, az U-érték pedig csökken.',
    gyakoriHibak: ['Rétegvastagság centiméterben hagyása méter helyett a képletben.', 'A vakolati rétegek kihagyása.'],
    gyakorlatiMegjegyzes: 'A hőszigetelésnél a dübelezésnél és a hőhidaknál mindig 10-15%-os U-érték romlással érdemes számolni a valóságban.',
    kapcsolodoSzamitasok: ['Homlokzati hőszigetelő táblák és dübelek száma', 'Falazóanyag és tégla darabszám számítása'],
    calculatorTab: 'insulation',
  },
  {
    id: 'szazalek',
    categoryId: 'alapok',
    title: 'Százalékszámítás és vágási ráhagyás',
    shortDesc: 'Alapvető százalékszámítási műveletek az építőipari vágási és tömörödési veszteségek kezelésére.',
    level: 'Alap',
    miEz: 'A százalékszámítás az építőiparban a nettó szükséglet bruttó rendelési mennyiséggé alakításának legfontosabb eszköze.',
    mireHasznaljuk: 'Burkolólapok, téglák, gipszkarton táblák és beton vágási veszteségének kísérésére.',
    szuksegesAdatok: ['Nettó mennyiség (A)', 'Százalékos ráhagyás (p%)'],
    keplet: 'B = A × (1 + p / 100)',
    jelolesek: [
      { symbol: 'A', name: 'Nettó mennyiség' },
      { symbol: 'p', name: 'Ráhagyási százalék (%)' },
      { symbol: 'B', name: 'Bruttó rendelési mennyiség' },
    ],
    lepesek: [
      'Határozd meg a nettó burkolandó vagy beépítendő felületet.',
      'Válaszd ki a szakmailag indokolt ráhagyási százalékot (átlós burkolásnál pl. 10-15%).',
      'Szorozd meg a nettó értéket az (1 + p/100) tényezővel.',
    ],
    gyakorlatiPelda: {
      title: '40 m² nettó felületű csempézés 10% vágási veszteséggel',
      steps: ['B = 40 × (1 + 10/100) = 40 × 1.10 = 44 m²'],
      result: 'Rendelendő csempe: 44 m²',
    },
    ellenorzes: 'A bruttó értéknek mindig nagyobbnak kell lennie a nettó értéknél.',
    gyakoriHibak: ['Bruttó értékből való hibás visszaszámolás.', 'Átlós rakási minta esetén a túl kicsi ráhagyás.'],
    gyakorlatiMegjegyzes: 'Tartalékolj mindig 1-2 doboz csempét a későbbi javításokhoz a gyártási sorozat egyezősége miatt!',
    kapcsolodoSzamitasok: ['Hidegburkolat és csemperagasztó igénye', 'Rendelési mennyiség és kerekítési szabályok'],
  },
  {
    id: 'terulet',
    categoryId: 'geometria',
    title: 'Síkidomok területe és kerülete',
    shortDesc: 'Téglalap, háromszög, trapéz és kör alaprajzok területszámítása.',
    level: 'Alap',
    miEz: 'A felületszámítás az építészet alapja, amely megadja az alapterületet, falkéreg felületét vagy burkolandó zónákat.',
    mireHasznaljuk: 'Festék, vakolat, burkolat, szigetelés és aljzatbeton mennyiségi kiírásához.',
    szuksegesAdatok: ['Hosszúsági méretek (m)'],
    keplet: 'A_téglalap = a × b,   A_kör = π × r²',
    jelolesek: [
      { symbol: 'a', name: 'Hosszúság' },
      { symbol: 'b', name: 'Szélesség' },
      { symbol: 'r', name: 'Sugár' },
    ],
    lepesek: [
      'Bontsd fel az összetett alaprajzot egyszerű téglalapokra és háromszögekre.',
      'Számítsd ki az egyes idomok területeit.',
      'Add össze a területeket a teljes felülethez.',
    ],
    gyakorlatiPelda: {
      title: 'L-alakú szoba területe (5m x 4m szekció + 3m x 2m beugró)',
      steps: ['A1 = 5 × 4 = 20 m²', 'A2 = 3 × 2 = 6 m²', 'A_összes = 20 + 6 = 26 m²'],
      result: 'Alapterület: 26 m²',
    },
    ellenorzes: 'Ellenőrizd a befoglaló téglalap területével: a kapott eredmény nem lehet nagyobb annál.',
    gyakoriHibak: ['Méretek keverése (mm és cm m-re való átváltása nélkül).'],
    gyakorlatiMegjegyzes: 'Méréskor használj lézeres távolságmérőt a falak párhuzamossági hibáinak azonnali feltárására.',
    kapcsolodoSzamitasok: ['Pitagorasz-tétel', 'Testek térfogatának kiszámítása'],
  },
  {
    id: 'falazat-tegla',
    categoryId: 'anyag',
    title: 'Falazóanyag és tégla darabszám számítása',
    shortDesc: 'Falfelületek nettó téglaszükségletének és raklapszámának meghatározása nyíláslevonással.',
    level: 'Középhaladó',
    miEz: 'A falazás anyagszükséglet-számítása a bruttó falfelületből levonja az ajtók és ablakok területét, majd a m²-enkénti téglaszámmal megadja a rendelendő darabszámot.',
    mireHasznaljuk: 'Porotherm, Ytong vagy B30 téglafalak anyagkiírásához és raklaprendeléshez.',
    szuksegesAdatok: ['Fal hossza (L, m)', 'Fal magassága (H, m)', 'Nyílászárók felülete (A_nyílás, m²)', 'Tégla igény (db/m²)'],
    keplet: 'N_tégla = (L × H - A_nyílás) × n_db/m2 × 1.05',
    jelolesek: [
      { symbol: 'L', name: 'Fal hossza' },
      { symbol: 'H', name: 'Fal magassága' },
      { symbol: 'n', name: 'Téglaigény (db/m²)' },
    ],
    lepesek: [
      'Kiszámítjuk a bruttó falfelületet.',
      'Levonjuk az ablakok és ajtók felületét.',
      'Megszorozzuk az 1 m²-re jutó téglaszámmal (pl. Porotherm 30 N+F esetén 16 db/m²).',
      'Hozzáadunk 5% törési és vágási veszteséget.',
    ],
    gyakorlatiPelda: {
      title: '12m x 2.8m Porotherm 30 N+F fal (két 1.5m x 1.5m ablakkal)',
      steps: [
        'Bruttó felület: 12 × 2.8 = 33.6 m²',
        'Nyílás levonás: 2 × (1.5 × 1.5) = 4.5 m²',
        'Nettó felület: 33.6 - 4.5 = 29.1 m²',
        'Téglaszám (16 db/m² + 5%): 29.1 × 16 × 1.05 = 489 db',
        'Raklapszám (80 db/raklap): 489 / 80 = 6.11 -> 7 raklap',
      ],
      result: 'Rendelendő: 7 raklap (560 db tégla)',
    },
    ellenorzes: 'Csekkold a raklap kerekítést: fél raklapot ritkán szállítanak ki a gyárak.',
    gyakoriHibak: ['A nyílások feletti áthidalók helyének kétszeres levonása.', 'A törési veszteség elhagyása.'],
    gyakorlatiMegjegyzes: 'A szárazon fektetett vékonyrétegű ragasztóhabarcsos tégláknál lényegesen kisebb a habarcsigény!',
    kapcsolodoSzamitasok: ['Falazóhabarcs és vakolat zsákigényének számítása', 'Sávalap betonszükségletének számítása'],
    calculatorTab: 'masonry',
  },
  {
    id: 'burkolat-lap',
    categoryId: 'anyag',
    title: 'Hidegburkolat és csemperagasztó igénye',
    shortDesc: 'Padló- és fali csempék, csemperagasztó és fugázóanyag pontos kiszámítása.',
    level: 'Középhaladó',
    miEz: 'A burkolási anyagszükséglet megadja a felület nettó mérete alapján szükséges burkolólap dobozszámot és ragasztómennyiséget.',
    mireHasznaljuk: 'Fürdőszobák, konyhák és teraszok burkolási anyagrendeléséhez.',
    szuksegesAdatok: ['Burkolandó felület (A, m²)', 'Lapméret (cm)', 'Vágási mintázat (hálós vagy átlós)'],
    keplet: 'A_bruttó = A_nettó × (1 + v%),   m_ragasztó = A_nettó × k_kg/m2',
    jelolesek: [
      { symbol: 'A', name: 'Felület (m²)' },
      { symbol: 'v', name: 'Vágási veszteség (10-15%)' },
      { symbol: 'k', name: 'Ragasztó anyagszükséglet (kg/m²)' },
    ],
    lepesek: [
      'Számítsd ki a nettó burkolandó aljzat- és falfelületet.',
      'Számolj hálós rakásnál 10%, átlós vagy kötésben rakásnál 15% veszteséggel.',
      'Határozd meg a ragasztóigényt (60x60 cm lapoknál kb. 4.8 kg/m², azaz 25kg zsák / 5m²).',
    ],
    gyakorlatiPelda: {
      title: '25 m² alapterület 60x60 cm-es greslapokkal',
      steps: [
        'Bruttó lapigény (10% veszteséggel): 25 × 1.10 = 27.5 m²',
        'Csemperagasztó (4.8 kg/m²): 25 × 4.8 = 120 kg',
        '25 kg-os zsákok száma: 120 / 25 = 4.8 -> 5 zsák',
        'Fugázó (0.4 kg/m²): 25 × 0.4 = 10 kg (2 vödör)',
      ],
      result: 'Rendelendő: 28 m² lap, 5 zsák C2TE ragasztó, 10 kg fugázó',
    },
    ellenorzes: 'Nagy lapoknál (60x60 felett) kétoldali ragasztást kell alkalmazni, ami 20-30%-kal növeli a ragasztóigényt!',
    gyakoriHibak: ['Az aljzatkiegyenlítés elhagyása miatti túlzott ragasztófelhasználás.', 'Kevés tartalék lap vásárlása.'],
    gyakorlatiMegjegyzes: 'Mindig ellenőrizd a dobozokon a gyártási kód azonosítót (Tone / Caliber)!',
    kapcsolodoSzamitasok: ['Százalékszámítás és vágási ráhagyás', 'Síkidomok területe és kerülete'],
    calculatorTab: 'tiling',
  },
  {
    id: 'gipszkarton-tabla',
    categoryId: 'anyag',
    title: 'Gipszkarton tábla és profil szükséglet',
    shortDesc: 'Gipszkarton válaszfalak és álmennyezetek táblaszámának, CW/UW profiljainak és csavarjainak kiszámítása.',
    level: 'Középhaladó',
    miEz: 'A gipszkartonozási anyagszámítás megadja a borítási felületből a táblák, a vázprofilok, a függesztők és a rögzítőelemek mennyiségét.',
    mireHasznaljuk: 'Szárazépítészeti válaszfalak, tetőtér-beépítések és álmennyezetek kiírásához.',
    szuksegesAdatok: ['Szerkezet felülete (A, m²)', 'Borítási rétegszám (1 vagy 2 réteg)', 'Karton típus (RB normál, RBI vízálló, RF tűzgátló)'],
    keplet: 'N_tábla = ⌈(A × n_réteg × 1.05) / 2.4⌉',
    jelolesek: [
      { symbol: 'A', name: 'Felület (m²)' },
      { symbol: 'n', name: 'Rétegszám' },
    ],
    lepesek: [
      'Kiszámítjuk a szerkezet nettó felületét.',
      'Kétrétegű borításnál megszorozzuk 2-vel.',
      'Kiszámítjuk a keretprofilokat (UW/UD = kerület × 1.2) és vázprofilokat (CW/CD = felület × 2.8 fm/m²).',
      'Kiszámítjuk a csavarigényt (18 db/m²).',
    ],
    gyakorlatiPelda: {
      title: '15 m² kétrétegű RB gipszkarton válaszfal (L=5m, H=3m)',
      steps: [
        'Karton felület (2 réteg): 15m² × 2 × 1.05 = 31.5 m²',
        'Táblaszám (120x200cm = 2.4m²): 31.5 / 2.4 = 13.1 -> 14 tábla',
        'UW keretprofil: 2 × (5 + 3) × 1.2 = 19.2 fm (7 szál 3m-es)',
        'CW vázprofil: 15 × 2.8 = 42 fm (14 szál 3m-es)',
        'TN 25 csavar: 15 × 18 = 270 db',
      ],
      result: 'Rendelendő: 14 tábla RB12.5 gipszkarton, 7 szál UW75, 14 szál CW75, 1 doboz csavar',
    },
    ellenorzes: 'Fürdőszobába és vizes helyiségbe kizárólag zöld impregnált (RBI) gipszkarton táblát építs be!',
    gyakoriHibak: ['A profilok 60 cm-es tengelytávolságának megszegése.', 'Hézagolószalag elhagyása a illesztéseknél.'],
    gyakorlatiMegjegyzes: 'Válaszfalaknál a hangszigetelés érdekében a profilok alá mindig ragassz szivacscsíkot!',
    kapcsolodoSzamitasok: ['Síkidomok területe és kerülete', 'Homlokzati hőszigetelő táblák és dübelek száma'],
    calculatorTab: 'drywall',
  },
  {
    id: 'teto-felulet',
    categoryId: 'anyag',
    title: 'Tetőszerkezet felülete és cserépigény',
    shortDesc: 'Tető felületének kiszámítása a hajlásszögből, cserép-, léc- és fóliaigény meghatározásával.',
    level: 'Középhaladó',
    miEz: 'A tetőszámítás a vízszintes alapterületből a dőlésszög korrekciós tényezőjével határozza meg a valós tetősík felületét és az anyagszükségletet.',
    mireHasznaljuk: 'Magastetők cserépezésének, lécezésének és páraáteresztő fóliázásának méretezéséhez.',
    szuksegesAdatok: ['Alapterület vetülete (A_vetület, m²)', 'Tető hajlásszöge (α, fok)', 'Cserépigény (db/m²)'],
    keplet: 'A_tető = (A_vetület / cos(α)) × 1.1',
    jelolesek: [
      { symbol: 'α', name: 'Tető dőlésszöge' },
      { symbol: 'cos(α)', name: 'Dőlésszög korrekciós tényező' },
    ],
    lepesek: [
      'Határozd meg a tető vízszintes vetületi alapterületét.',
      'Oszd el a dőlésszög koszinuszával (pl. 35°-nál cos(35°) = 0.819).',
      'Számítsd ki a cserepek számát (átlagos cserépnél kb. 10.5 db/m²).',
      'Számítsd ki a tetőlécet (3.2 fm/m²) és a fóliát (1.15-szörös szorzó).',
    ],
    gyakorlatiPelda: {
      title: '100 m² vetületű nyeregtető 35°-os dőlésszöggel',
      steps: [
        'Valós tetőfelület: 100 / 0.819 × 1.10 = 134.3 m²',
        'Cserépigény (10.5 db/m² + 6%): 134.3 × 10.5 × 1.06 = 1495 db',
        'Tetőléc (3.2 fm/m²): 134.3 × 3.2 = 430 fm',
        'Páraáteresztő fólia (1.15): 134.3 × 1.15 = 154.4 m² (2 tekercs 75m²)',
      ],
      result: 'Rendelendő: 1495 db cserép, 430 fm 3x5-ös léc, 2 tekercs fólia',
    },
    ellenorzes: 'Minél meredekebb a tető, annál nagyobb a korrekciós szorzó és a szükséges cserépszámozás.',
    gyakoriHibak: ['A vápák és élgerincek miatti plusz cserépvágási veszteség kihagyása.', 'Ellenléc kihagyása a átszellőztetett légrésből.'],
    gyakorlatiMegjegyzes: 'Alacsony hajlásszögnél (20° alatt) különösen figyelj a vízhatlan alátéthéjazat és a csatorna lejtésére!',
    kapcsolodoSzamitasok: ['Pitagorasz-tétel', 'Lejtés és szintkülönbség'],
    calculatorTab: 'roofing',
  },
  {
    id: 'lepco-geometria',
    categoryId: 'szerkezet',
    title: 'Lépcsőfok méretezése (2m + sz = 60..64 cm)',
    shortDesc: 'Kényelmes és biztonságos lépcsőfok-magasság és fellépési szélesség kiszámítása.',
    level: 'Haladó',
    miEz: 'A lépcsőméretezés a megmászandó szintkülönbség alapján határozza meg a lépcsőfokok számát, magasságát (m) és belépési szélességét (sz) az ergonómiai alapképlet (2m + sz = 62 cm) segítségével.',
    mireHasznaljuk: 'Belső és külső lépcsők, monolit beton és szerkezeti lépcsők tervezéséhez.',
    szuksegesAdatok: ['Szintkülönbség (H, cm)', 'Lépcsőkar rendelkezésre álló hossza (L, cm)'],
    keplet: '2m + sz = 60..64 cm,   N_fok = H / m',
    jelolesek: [
      { symbol: 'm', name: 'Lépcsőfok magassága (cm)' },
      { symbol: 'sz', name: 'Lépcsőfok szélessége / belépője (cm)' },
      { symbol: 'H', name: 'Szintkülönbség (cm)' },
    ],
    lepesek: [
      'Oszd el a teljes H szintkülönbséget a kívánt lépcsőfok-magassággal (pl. ideálisan m = 17 cm).',
      'Kerekítsd az eredményt a legközelebbi egész fokszámra (N).',
      'Számítsd ki a pontos magasságot: m = H / N.',
      'Alkalmazd a 2m + sz = 62 cm képletet a belépőszélesség kiszámításához: sz = 62 - 2m.',
    ],
    gyakorlatiPelda: {
      title: '280 cm szintkülönbségű emeleti lépcső méretezése',
      steps: [
        'Fokszám: 280 / 17 = 16.47 -> 16 fok',
        'Pontos fokmagasság: m = 280 / 16 = 17.5 cm',
        'Belépőszélesség: sz = 62 - (2 × 17.5) = 62 - 35 = 27 cm',
        'Lépcsőkar hossza: 15 belépő × 27 cm = 405 cm',
      ],
      result: 'Lépcső paraméterei: 16 fok, 17.5 cm magasság, 27 cm belépő',
    },
    ellenorzes: 'Csekkold az ergonómiát: 2m + sz értékének szigorúan 60 és 64 cm közé kell esnie!',
    gyakoriHibak: ['Az utolsó fellépőnél a kész padlóburkolat vastagságának elfelejtése.', 'Különböző magasságú lépcsőfokok kivitelezése.'],
    gyakorlatiMegjegyzes: 'Családi házban a legkényelmesebb lépcsőfok magasság 16.5-17.5 cm között van. 18 cm felett a lépcső meredekké és fárasztóvá válik!',
    kapcsolodoSzamitasok: ['Sávalap betonszükséglete', 'Pitagorasz-tétel'],
  },
  {
    id: 'mertkegysegek',
    categoryId: 'alapok',
    title: 'Építőipari mértékegységek és átváltások',
    shortDesc: 'Hosszúság, felület, térfogat és tömeg mértékegységeinek pontos átváltása (m³, liter, tonna, kg, fm).',
    level: 'Alap',
    miEz: 'Az építőipari mértékegységek a tervezési és kivitelezési anyagkiírások közös nyelve.',
    mireHasznaljuk: 'Sóder, beton, vízigény és folyóméteres anyagok pontos megrendeléséhez és helyszíni átvételéhez.',
    szuksegesAdatok: ['Mérési érték (A)', 'Kiindulási mértékegység', 'Cél mértékegység'],
    keplet: '1 m³ = 1000 liter,   1 tonna = 1000 kg,   1 m² = 100 dm² = 10000 cm²',
    jelolesek: [
      { symbol: 'm³', name: 'Köbméter (térfogat)' },
      { symbol: 'l', name: 'Liter (folyadék/térfogat)' },
      { symbol: 't', name: 'Tonna (tömeg)' },
      { symbol: 'kg', name: 'Kilogramm (tömeg)' },
      { symbol: 'fm', name: 'Folyóméter (hosszúság)' },
    ],
    lepesek: [
      'Azonosítsd a mértékegység szorzóit (1 m = 10 dm = 100 cm = 1000 mm).',
      'Térfogat esetén köbre emeld a szorzót (1 m³ = 10³ dm³ = 1000 liter).',
      'Átváltáskor oszd vagy szorozd meg az értéket a megfelelő nagyságrendi szorzóval.',
    ],
    gyakorlatiPelda: {
      title: '2.5 m³ beton helyszíni keverése - hány liter víz és hány tonna sóder szükséges?',
      steps: [
        'Térfogat literben: 2.5 m³ × 1000 = 2500 liter',
        'Sóder tömege (1.85 t/m³): 2.5 × 1.85 = 4.625 tonna (4625 kg)',
      ],
      result: 'Szükséges: 4.63 tonna sóder és 2500 liter vízi kapacitás',
    },
    ellenorzes: 'Ne keverd össze a folyómétert (fm) a négyzetméterrel (m²) a profilok és a szegőlécek megrendelésénél!',
    gyakoriHibak: ['Centiméterben mért adatok köbre emelésének elfelejtése.', 'Liter és m³ keverése a folyékony adalékszereknél.'],
    gyakorlatiMegjegyzes: 'A sóder és a homok nedves állapotban nehezebb, mint szárazon: 1 m³ nedves sóder akár 1.95 tonna is lehet!',
    kapcsolodoSzamitasok: ['Anyagok sűrűsége és halmazsűrűsége', 'Százalékszámítás és vágási ráhagyás'],
  },
  {
    id: 'suruseg',
    categoryId: 'alapok',
    title: 'Anyagok sűrűsége és halmazsűrűsége',
    shortDesc: 'A legfontosabb építőanyagok (beton, sóder, acél, tégla, fa) fajsúlya és szállítási tömegének számítása.',
    level: 'Alap',
    miEz: 'A sűrűség (ρ) az anyag egységnyi térfogatára jutó tömege (kg/m³ vagy t/m³).',
    mireHasznaljuk: 'Födémterhelés, tehergépkocsi szállítási teherbírás és daruzási kapacitás méretezésénél.',
    szuksegesAdatok: ['Térfogat (V, m³)', 'Anyagsűrűség (ρ, kg/m³)'],
    keplet: 'm = V × ρ',
    jelolesek: [
      { symbol: 'm', name: 'Tömeg (kg vagy tonna)' },
      { symbol: 'V', name: 'Térfogat (m³)' },
      { symbol: 'ρ', name: 'Sűrűség (kg/m³)' },
    ],
    lepesek: [
      'Keresd ki az építőanyag sűrűségét (Vasbeton: 2500 kg/m³, Kavics: 1850 kg/m³, Acél: 7850 kg/m³).',
      'Szorozd meg a térfogatot a sűrűséggel.',
      'Konvertáld át tonnára (osztás 1000-rel).',
    ],
    gyakorlatiPelda: {
      title: '6 m³ friss frissbeton szállítása egy mixer autóval',
      steps: [
        'C20/25 frissbeton sűrűsége: 2400 kg/m³',
        'Tömeg: 6 m³ × 2400 kg/m³ = 14400 kg = 14.4 tonna',
      ],
      result: 'A beton rakomány tömege 14.4 tonna (az autó önsúlyával együtt kb. 26 tonna összsúly).',
    },
    ellenorzes: 'A laza halmazsűrűség (pl. ömlesztett sóder) mindig kisebb, mint a tömörített sűrűség.',
    gyakoriHibak: ['Teherautók túlterhelése a nedves sóder és föld súlyának alulbecslése miatt.'],
    gyakorlatiMegjegyzes: 'Tengelyterheléskor mindig számolj a gépjármű önsúlyával is a behajtási engedélyek megszerzésekor!',
    kapcsolodoSzamitasok: ['Építőipari mértékegységek és átváltások', 'Földmunka és munkagödör kiemelési térfogat'],
  },
  {
    id: 'terfogat',
    categoryId: 'geometria',
    title: 'Geometriai testek térfogatának kiszámítása',
    shortDesc: 'Hasáb, henger, gúla és csonkagúla térfogatának kiszámítása építési szerkezeteknél.',
    level: 'Alap',
    miEz: 'A térfogatszámítás megadja a háromdimenziós szerkezetek belső kapacitását vagy az anyagkitöltés mértékét.',
    mireHasznaljuk: 'Pillérek, henger alakú kútalapok, földtöltések és tartályok méretezéséhez.',
    szuksegesAdatok: ['Alapterület (A, m²)', 'Magasság (h, m)'],
    keplet: 'V_hasáb = A × h,   V_henger = π × r² × h',
    jelolesek: [
      { symbol: 'V', name: 'Térfogat (m³)' },
      { symbol: 'A', name: 'Alapterület (m²)' },
      { symbol: 'h', name: 'Magasság (m)' },
      { symbol: 'r', name: 'Henger sugara (m)' },
    ],
    lepesek: [
      'Számítsd ki a test keresztmetszeti alapterületét (A).',
      'Szorozd meg a test magasságával (h).',
      'Kúp vagy gúla esetén oszd el 3-mal.',
    ],
    gyakorlatiPelda: {
      title: '40 cm átmérőjű, 3 méter mély fúrt betonpillér térfogata',
      steps: [
        'Sugár r = 0.20 m',
        'Alapterület A = π × (0.20)² = 3.1416 × 0.04 = 0.1257 m²',
        'Térfogat V = 0.1257 m² × 3 m = 0.377 m³',
      ],
      result: 'Egy pillér betonszükséglete: 0.38 m³ (10 pillérnél 3.8 m³)',
    },
    ellenorzes: 'Henger alakú szerkezetnél az átmérő felével (sugár) kell számolni, nem az átmérővel!',
    gyakoriHibak: ['Sugár és átmérő összekeverése a képletben.'],
    gyakorlatiMegjegyzes: 'Fúrt cölöpöknél a furat falának beomlása miatt 15-20% plusz betonfogyasztásra kell felkészülni.',
    kapcsolodoSzamitasok: ['Síkidomok területe és kerülete', 'Sávalap betonszükséglete'],
  },
  {
    id: 'lejtes',
    categoryId: 'geometria',
    title: 'Lejtés és szintkülönbség számítása (% és fok)',
    shortDesc: 'Csatornák, teraszok, kocsibeállók és tetők lejtésének kiszámítása (% és fok átszámítással).',
    level: 'Középhaladó',
    miEz: 'A lejtés a függőleges szintkülönbség (H) és a vízszintes hossz (L) hányadosa százalékban kifejezve (i% = H / L × 100).',
    mireHasznaljuk: 'Vízelvezetéshez (terasz lejtés 2%, csatornázás 1-2%), gépkocsi behajtókhoz (max 15%) és tetőhajlásszögekhez.',
    szuksegesAdatok: ['Szintkülönbség (H, cm)', 'Vízszintes hossz (L, m)'],
    keplet: 'i% = (H / (L × 100)) × 100,   H_cm = L_m × i%',
    jelolesek: [
      { symbol: 'i%', name: 'Lejtés százalékban (%)' },
      { symbol: 'H', name: 'Szintkülönbség (cm)' },
      { symbol: 'L', name: 'Vízszintes távolság (m)' },
    ],
    lepesek: [
      'Mérd ki a vízszintes távolságot méterben.',
      'Szorozd meg a kívánt lejtési százalékkal.',
      'Megkapod a szükséges szintkülönbséget centiméterben.',
    ],
    gyakorlatiPelda: {
      title: '6 méter hosszú terasz lejtésének kialakítása 2%-os vízelvezetéssel',
      steps: [
        'Vízszintes hossz: 6 méter',
        'Szükséges lejtés: 2%',
        'Szintkülönbség: 6 m × 2 cm/m = 12 cm',
      ],
      result: 'A terasz külső szélének 12 cm-rel alacsonyabban kell lennie a fal tövénél.',
    },
    ellenorzes: 'A túl kis lejtés (1% alatt terasznál) megállítja a vizet, a túl nagy lejtés (3% felett) kényelmetlen bútorozást okoz.',
    gyakoriHibak: ['Százalék és fok összekeverése (a 100%-os lejtés 45°-os dőlésszögnek felel meg!).'],
    gyakorlatiMegjegyzes: 'Csatornacsöveknél a túlzott lejtés (3% felett) lerontja a tisztítóhatást, mert a víz gyorsabban lefolyik, mint a szilárd anyag!',
    kapcsolodoSzamitasok: ['Tetőszerkezet felülete és cserépigény', 'Pitagorasz-tétel'],
  },
  {
    id: 'foldmunka-godor',
    categoryId: 'szerkezet',
    title: 'Földmunka és munkagödör kiemelési térfogat',
    shortDesc: 'Tereprendezési földtömeg, munkagödör rézsűs kiemelésének és laza föld duzzadásának számítása.',
    level: 'Középhaladó',
    miEz: 'A földmunkaszámítás a tömör termett talaj kiemelési térfogatát és annak lazulási szorzóját (1.2-1.3) határozza meg elszállításhoz.',
    mireHasznaljuk: 'Pincegödrök, alapszedés, medencék kiásási földtömegének és konténerigényének kiszámításához.',
    szuksegesAdatok: ['Gödör hossza (L, m)', 'Gödör szélessége (b, m)', 'Mélység (h, m)', 'Talaj lazulási tényező (k, pl. 1.25)'],
    keplet: 'V_termett = L × b × h,   V_laza = V_termett × k_lazulás',
    jelolesek: [
      { symbol: 'V_termett', name: 'Termett földtömeg (m³)' },
      { symbol: 'V_laza', name: 'Elszállítandó laza földtömeg (m³)' },
      { symbol: 'k', name: 'Lazulási tényező (1.25)' },
    ],
    lepesek: [
      'Kiszámítjuk a kiásandó gödör geometriai térfogatát.',
      'Megszorozzuk a talaj lazulási tényezőjével (közepes kötött talajnál 1.25).',
      'Meghatározzuk a szükséges 5 m³-es vagy 8 m³-es konténerek számát.',
    ],
    gyakorlatiPelda: {
      title: '10m x 8m alapterületű, 1.5m mély pincegödör kiásása',
      steps: [
        'Termett földtérfogat: 10m × 8m × 1.5m = 120 m³',
        'Laza földtömeg (25% lazulás): 120 m³ × 1.25 = 150 m³',
        'Konténerek száma (8 m³ konténer): 150 / 8 = 18.75 -> 19 konténer',
      ],
      result: 'Elszállítandó föld: 150 m³ laza föld (19 db 8m³-es konténer)',
    },
    ellenorzes: 'Rézsűs kiemelésnél a gödör felső szélessége nagyobb, mint az alja, ezért trapéz keresztmetszettel kell számolni.',
    gyakoriHibak: ['A talaj lazulási szorzójának elfelejtése, ami miatt kevés konténert rendelnek.'],
    gyakorlatiMegjegyzes: 'A humuszréteget (felső 20-30 cm) mindig külön depóniába gyűjtsd a későbbi kertépítéshez!',
    kapcsolodoSzamitasok: ['Sávalap betonszükségletének számítása', 'Anyagok sűrűsége és halmazsűrűsége'],
  },
  {
    id: 'rendelesi-mennyiseg',
    categoryId: 'mennyiseg',
    title: 'Rendelési mennyiség és kerekítési szabályok',
    shortDesc: 'Nettó anyagszükséglet átváltása rendelési egységekre (raklap, doboz, zsák, köbméter, szál) kerekítési és biztonsági szabályokkal.',
    level: 'Alap',
    miEz: 'A rendelési mennyiség kiszámítása a teoretikus nettó anyagszükséglet átváltása a kereskedelemben kapható legkisebb csomagolási vagy szállítási egységekre (pl. egész raklap, doboz, zsák, tábla, szál), felfelé kerekítéssel és biztonsági ráhagyással.',
    mireHasznaljuk: 'Építőanyagok megrendelésénél, logisztikai kiírásoknál és költségvetés-készítésnél, hogy elkerüljük az anyaghiány miatti leállást vagy a bontott csomagolási egységek miatti túlárazást.',
    szuksegesAdatok: ['Nettó anyagszükséglet (N, mértékegységben)', 'Csomagolási egység mérete (C, mértékegység/csomag)', 'Vágási és biztonsági ráhagyás (v%, pl. 5-15%)'],
    keplet: 'Bruttó csomagszám = ⌈ (N × (1 + v / 100)) / C ⌉',
    jelolesek: [
      { symbol: 'N', name: 'Nettó anyagszükséglet' },
      { symbol: 'v', name: 'Biztonsági és vágási ráhagyás (%)' },
      { symbol: 'C', name: 'Csomagolási egység kiszerelése (db/m²/m³/zsák/raklap)' },
      { symbol: '⌈ ⌉', name: 'Felfelé kerekítés a legközelebbi egész számra' },
    ],
    lepesek: [
      'Kiszámítjuk a nettó anyagszükségletet a műszaki méretek alapján.',
      'Hozzáadjuk a technológiai és vágási ráhagyási százalékot.',
      'Elosztjuk a kereskedelmi kiszerelés egységméretével.',
      'Az eredményt mindig felfelé kerekítjük a legközelebbi egész csomagolási egységre.',
    ],
    gyakorlatiPelda: {
      title: '42.5 m² csempézés rendelési dobozszámának meghatározása (1.44 m²/doboz, 10% vágási ráhagyás)',
      steps: [
        'Bruttó felület: 42.5 m² × 1.10 = 46.75 m²',
        'Csomagok száma: 46.75 / 1.44 = 32.46 doboz',
        'Felfelé kerekítés: ⌈32.46⌉ = 33 doboz',
        'Valós rendelendő felület: 33 × 1.44 = 47.52 m²',
      ],
      result: 'Rendelendő: 33 doboz csempe (47.52 m²)',
    },
    ellenorzes: 'A megrendelt mennyiség soha nem lehet kisebb a kiszámított bruttó szükségletnél; tört csomagolási egységet a tüzépek ritkán bontanak meg.',
    gyakoriHibak: [
      'Lefelé kerekítés vagy matematikai kerekítés (pl. 32.2 doboznál 32-t rendelnek, ami anyaghiányhoz vezet).',
      'A gyári csomagolási bontatlansági szabályok figyelmen kívül hagyása.',
    ],
    gyakorlatiMegjegyzes: 'Raklapos árunál (tégla, zsalukő, térkő) a gyárak raklap-betétdíjat és használati díjat is felszámítanak, amit a költségvetésbe be kell építeni.',
    kapcsolodoSzamitasok: ['Százalékszámítás és vágási ráhagyás', 'Hidegburkolat és csemperagasztó igénye', 'Falazóanyag és tégla darabszám számítása'],
  },
  {
    id: 'lemezalap-beton',
    categoryId: 'anyag',
    title: 'Lemezalap betonszükségletének számítása',
    shortDesc: 'Teljes felületű lemezalapok (vasbeton lemez) beton- és betonacél-szükségletének kiszámítása peremszegélyekkel és veszteséggel.',
    level: 'Középhaladó',
    miEz: 'A lemezalap az épület teljes alapterülete alatt húzódó, egyenletes teherelosztást biztosító monolit vasbeton szerkezet. Betonszükséglete a lemez alapterületének, vastagságának, a peremvastagításoknak és a tömörödési veszteségnek az összege.',
    mireHasznaljuk: 'Talajvíz- vagy gyenge teherbírású talaj esetén épülő családi házak, csarnokok és társasházak aljzat-alapozási betonigényének kiszámításához.',
    szuksegesAdatok: ['Lemez alapterülete (A, m²)', 'Lemezvastagság (h, méterben)', 'Perem- és belső sávvastagítások plusz térfogata (V_perem, m³)', 'Tömörödési és szállítási veszteség (v%, pl. 5-8%)'],
    keplet: 'V_bruttó = (A × h + V_perem) × (1 + v / 100)',
    jelolesek: [
      { symbol: 'V_bruttó', name: 'Beton rendelési térfogat (m³)' },
      { symbol: 'A', name: 'Lemez alapterülete (m²)' },
      { symbol: 'h', name: 'Lemez vastagsága (m)' },
      { symbol: 'V_perem', name: 'Perem- és gerendavastagítások térfogata (m³)' },
      { symbol: 'v', name: 'Veszteségi ráhagyás (%)' },
    ],
    lepesek: [
      'Kiszámítjuk a fő lemeztest nettó térfogatát (Alapterület × Vastagság).',
      'Hozzáadjuk a lemezperemeknél és teherhordó falak alatt futó vastagítások (sávok) plusz térfogatát.',
      'Alkalmazzuk az 5-8%-os tömörödési és pumpában maradó veszteségi tényezőt.',
      'Kiszámítjuk a szükséges mixerautók számát (7-8 m³/autó).',
    ],
    gyakorlatiPelda: {
      title: '120 m² alapterületű, 25 cm vastag lemezalap kiöntése 40m lemezperem vastagítással (0.3m x 0.3m) 6% ráhagyással',
      steps: [
        'Lemez alaptérfogat: 120 m² × 0.25 m = 30.0 m³',
        'Peremvastagítás: 40 m × (0.3 m × 0.3 m) = 3.6 m³',
        'Nettó térfogat összesen: 30.0 + 3.6 = 33.6 m³',
        'Bruttó betonigény (6% ráhagyással): 33.6 m³ × 1.06 = 35.62 m³',
      ],
      result: 'Rendelendő betonmennyiség: 36.0 m³ (kb. 5 mixerautó rakomány)',
    },
    ellenorzes: 'A lemezalap térfogata m³-ben 0.25-0.35-szöröse az alapterületnek; 100 m²-re átlagosan 25-35 m³ beton kell.',
    gyakoriHibak: [
      'A peremvastagítások és teherhordó falalapozási sávok kihagyása a területszorzatból.',
      'A szivattyúzás során a betonpumpa csővezetékében maradó 0.3-0.5 m³ beton figyelmen kívül hagyása.',
    ],
    gyakorlatiMegjegyzes: 'Lemezalapnál a betonozást egyenletes rétegben, vibrátoros tömörítéssel kell végezni, és meleg időben 7 napig nedvesen kell tartani a zsugorodási repedések elkerülésére.',
    kapcsolodoSzamitasok: ['Sávalap betonszükségletének számítása', 'Geometriai testek térfogatának kiszámítása', 'Anyagok sűrűsége és halmazsűrűsége'],
    calculatorTab: 'concrete',
  },
  {
    id: 'falazohabarcs-vakolat',
    categoryId: 'anyag',
    title: 'Falazóhabarcs és vakolat zsákigényének számítása',
    shortDesc: 'Falazási téglakötő habarcsok és beltéri/kültéri vakolatok szárazhabarcs zsákigényének kiszámítása rétegvastagság alapján.',
    level: 'Középhaladó',
    miEz: 'A falazóhabarcs és vakolatszükséglet a falazási felület és téglatípus habarcsigényének, vagy a vakolandó felület és rétegvastagság szárazhabarcs-fogyasztásának (kg/m²/mm) kiszámítása 25kg/40kg-os zsákokra vetítve.',
    mireHasznaljuk: 'Téglafalak építésénél, beltéri gépi vagy kézi mész-cement vakolásnál és kültéri homlokzati alapvakolatok megrendelésénél.',
    szuksegesAdatok: ['Falfelület (A, m²)', 'Vakolat vastagsága (d, mm) vagy falazóhabarcs normatíva (kg/m²)', 'Veszteség (v%, 5-10%)', 'Zsák kiszerelés (25 kg vagy 40 kg)'],
    keplet: 'M_összes = A × d × k_száraz × (1 + v / 100),   N_zsák = ⌈ M_összes / m_zsák ⌉',
    jelolesek: [
      { symbol: 'A', name: 'Felület (m²)' },
      { symbol: 'd', name: 'Vakolat vastagsága (mm)' },
      { symbol: 'k_száraz', name: 'Fajlagos szárazhabarcs igény (kb. 1.4 kg/m²/mm)' },
      { symbol: 'm_zsák', name: 'Zsák tömege (25 kg vagy 40 kg)' },
    ],
    lepesek: [
      'Kiszámítjuk a nettó vakolandó vagy falazandó felületet.',
      'Vakolásnál a rétegvastagság (mm) és a fajlagos anyagszükséglet (kb. 1.4-1.5 kg/m²/mm) szorzatát vesszük.',
      'Hozzáadjuk az 5-10%-os szóródási és keverési veszteséget.',
      'Elosztjuk a zsák tömegével és felfelé kerekítünk.',
    ],
    gyakorlatiPelda: {
      title: '85 m² beltéri téglafalfelület 15 mm vastag mész-cement vakolása 25kg-os zsákos vakolattal (8% veszteséggel)',
      steps: [
        'Nettó szárazvakolat igény (1.4 kg/m²/mm): 85 m² × 15 mm × 1.4 kg/m²/mm = 1785 kg',
        'Bruttó tömeg (8% ráhagyással): 1785 kg × 1.08 = 1927.8 kg',
        '25 kg-os zsákok száma: 1927.8 / 25 = 77.11 -> 78 zsák',
        'Raklapszám (40 zsák/raklap): 78 / 40 = 1.95 -> 2 raklap (80 zsák)',
      ],
      result: 'Rendelendő: 2 raklap (80 zsák 25kg-os vakolat)',
    },
    ellenorzes: 'Egy átlagos 15 mm vastag beltéri vakolat m²-enként kb. 21 kg szárazhabarcsot (közel 1 zsák 25kg-os anyagszükséglet) igényel.',
    gyakoriHibak: [
      'Az egyenetlen téglafelület és a mély fuga-beugrások miatti többlet-vakolatvastagság figyelmen kívül hagyása.',
      'Hagyományos mész-cement falazóhabarcs és a vékonyrétegű ragasztóhabarcs normáinak összekeverése.',
    ],
    gyakorlatiMegjegyzes: 'Nagyobb (200 m² feletti) vakolási munkáknál gazdaságosabb a gépi vakológéphez való silós vakolóanyag megrendelése a zsákolási hulladék elkerülésére.',
    kapcsolodoSzamitasok: ['Falazóanyag és tégla darabszám számítása', 'Hidegburkolat és csemperagasztó igénye', 'Rendelési mennyiség és kerekítési szabályok'],
    calculatorTab: 'masonry',
  },
  {
    id: 'homlokzati-hoszigetelo-tabla',
    categoryId: 'anyag',
    title: 'Homlokzati hőszigetelő táblák és dübelek száma',
    shortDesc: 'EPS/XPS/Kőzetgyapot hőszigetelő lapok, indítósínek, dübelek és ragasztóhabarcs szükségletének kiszámítása.',
    level: 'Középhaladó',
    miEz: 'A homlokzati hőszigetelő rendszer kiszámítása a homlokzat nettó felülete alapján határozza meg a hőszigetelő táblák (0.5 m²/tábla), a rendszerragasztó, az üvegszövet háló, az indítóprofilok és a rögzítő dübelek darabszámát.',
    mireHasznaljuk: 'Családi házak és társasházak utólagos vagy új építésű homlokzati hőszigetelési (ETICS/THR) anyagrendeléséhez.',
    szuksegesAdatok: ['Homlokzat felülete nyíláslevonással (A, m²)', 'Tábla mérete (0.5m x 1.0m = 0.5 m²)', 'Szigetelés vastagsága (cm)', 'Dübel sűrűség (db/m², pl. 6-8 db/m²)'],
    keplet: 'N_tábla = ⌈ (A × 1.08) / 0.5 ⌉,   N_dübel = ⌈ A × n_dübel × 1.05 ⌉',
    jelolesek: [
      { symbol: 'A', name: 'Nettó homlokzati felület (m²)' },
      { symbol: 'N_tábla', name: 'Hőszigetelő lapok száma (db)' },
      { symbol: 'N_dübel', name: 'Tányéros dübelek száma (db)' },
      { symbol: 'n_dübel', name: 'Dübelezési normatíva (6-8 db/m²)' },
    ],
    lepesek: [
      'Kiszámítjuk a homlokzat felületét és levonjuk a nyílászárókat.',
      'Hozzáadunk 8-10% vágási veszteséget (a sarkoknál lévő L-alakú beszabások miatt).',
      'Kiszámítjuk a 0.5 m²-es EPS táblák számát (vagy csomagok számát).',
      'Kiszámítjuk a ragasztóigényt (ragasztás + ágyazás: kb. 8-10 kg/m²), az üvegszövet hálót (1.15x szorzó) és a dübeleket.',
    ],
    gyakorlatiPelda: {
      title: '140 m² homlokzat szigetelése 15 cm-es Grafitos EPS lapokkal és 6 db/m² dübelezéssel',
      steps: [
        'Bruttó felület (8% vágási ráhagyás): 140 m² × 1.08 = 151.2 m²',
        'EPS táblaszám (0.5 m²/tábla): 151.2 / 0.5 = 302.4 -> 303 tábla',
        'EPS csomagszám (15 cm vastag lapból 2 tábla/csomag = 1 m²): 151.2 m² / 1 m² = 152 csomag',
        'Dübeligény (6 db/m² + 5%): 140 × 6 × 1.05 = 882 db (9 doboz 100 db-os)',
        'Ragasztóhabarcs (9 kg/m²): 140 × 9 = 1260 kg (51 zsák 25kg)',
      ],
      result: 'Rendelendő: 152 csomag EPS lap, 9 doboz dübel, 51 zsák ragasztó, 161 m² üvegszövet háló',
    },
    ellenorzes: 'Az ablakok és ajtók sarkainál szigorúan pisztoly alakú (L-szabású) táblákat kell beépíteni, egyenes illesztés a saroknál tilos, mert elreped a szigetelés!',
    gyakoriHibak: [
      'A nyílászárók kávaburkoló (pl. 2-3 cm-es) szigetelőcsíkjainak elfelejtése a rendelésnél.',
      'Rövid dübel választása (a dübel szárának legalább 5-6 cm-re kell rögzülnie a teherhordó falazatba).',
    ],
    gyakorlatiMegjegyzes: 'A lábazati zónában az alsó 30-50 cm-es sávban zártcellás XPS lapokat kell használni a csapóvíz és a fagyállóság biztosítására.',
    kapcsolodoSzamitasok: ['Rétegrendi U-érték és Hőellenállás számítása', 'Gipszkarton tábla és profil szükséglet', 'Falazóhabarcs és vakolat zsákigényének számítása'],
    calculatorTab: 'insulation',
  },
  {
    id: 'szarufahossz-szamitas',
    categoryId: 'geometria',
    title: 'Szarufahossz számítása dőlésszögből és fesztávból',
    shortDesc: 'Nyeregtetők és félnyeregtetők szarufahosszának, eresznyúlásának és fűrészáru igényének kiszámítása trigonometriával.',
    level: 'Középhaladó',
    miEz: 'A szarufahossz kiszámítása a épület fesztávjának feléből (vízszintes vetület) és a tető dőlésszögéből (α) a derékszögű háromszög trigonometriájával (L_szarufa = L_vetület / cos(α)) határozza meg a szarufák ferde hosszát, beleértve az eresznyúlást is.',
    mireHasznaljuk: 'Ács munkáknál a tetőszerkezet fűrészárujának (szarufák mérete, hossza, szál száma) pontos kiírásához és megrendeléséhez.',
    szuksegesAdatok: ['Épület fesztávolsága / vízszintes vetület (L_v, m)', 'Tető dőlésszöge (α, fok)', 'Eresztúlnyúlás vízszintesen (L_eresz, m)'],
    keplet: 'L_szarufa = (L_v + L_eresz) / cos(α)',
    jelolesek: [
      { symbol: 'L_szarufa', name: 'Szarufa teljes ferde hossza (m)' },
      { symbol: 'L_v', name: 'Épület fél-fesztávolsága a szelemenig (m)' },
      { symbol: 'L_eresz', name: 'Eresz túlnyúlás vízszintesen (m)' },
      { symbol: 'α', name: 'Tető dőlésszöge (fok)' },
    ],
    lepesek: [
      'Kiszámítjuk a szarufa vízszintes vetületét (fél-fesztáv + eresznyúlás).',
      'Keresd ki vagy számítsd ki a dőlésszög koszinuszát (pl. 30°-nál cos(30°) = 0.866).',
      'Elosztjuk a vízszintes távolságot cos(α)-val.',
      'Kiszámítjuk a rendelendő szabványos gerendahosszat (pl. 4m, 5m, 6m kerekítéssel).',
    ],
    gyakorlatiPelda: {
      title: '8 méter széles épület nyeregtetőjének szarufahossza 35°-os dőlésszöggel és 60 cm eresznyúlással',
      steps: [
        'Fél-fesztáv: 8m / 2 = 4.0 m',
        'Teljes vízszintes vetület: 4.0m + 0.6m = 4.6 m',
        'dőlésszög tényező: cos(35°) = 0.8192',
        'Ferde szarufahossz: 4.6 m / 0.8192 = 5.615 m',
        'Szabvány fűrészáru kerekítés: 6.0 méteres gerendák rendelése',
      ],
      result: 'Szükséges szarufa hosszúság: 5.62 m (Rendelendő: 6.0 m-es szálfák)',
    },
    ellenorzes: 'Pitagorasz-tétellel is ellenőrizhető: L_szarufa² = L_vetület² + H_taréj².',
    gyakoriHibak: [
      'Az eresz túlnyúlásának elfelejtése a szarufahossz megállapításakor.',
      'Nem szabványos gerendahosszal való kalkulálás (a tüzépeken a gerendák általában 1 méteres lépcsőkben, pl. 4m, 5m, 6m kaphatók).',
    ],
    gyakorlatiMegjegyzes: 'A szarufák szokásos tengelytávolsága 80-90 cm. Számold ki a darabszámot: (Tetőhossz / Tengelytáv) + 1, mindkét tetősíkra!',
    kapcsolodoSzamitasok: ['Pitagorasz-tétel és derékszög kitűzése', 'Tetőszerkezet felülete és cserépigény', 'Síkidomok területe és kerülete'],
    calculatorTab: 'rafter',
  },
];

export default function CalculationsPage({ onNavigate }: CalculationsPageProps) {
  const [viewMode, setViewMode] = useState<'categories' | 'category-list' | 'detail' | 'interactive-calculators'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCalcId, setSelectedCalcId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<CalculatorTab>('concrete');
  const [copied, setCopied] = useState(false);

  const activeCategoryObj = useMemo(() => {
    return MAIN_CATEGORIES.find((c) => c.id === selectedCategory) || null;
  }, [selectedCategory]);

  const activeCalculationObj = useMemo(() => {
    return CALCULATION_ITEMS.find((c) => c.id === selectedCalcId) || null;
  }, [selectedCalcId]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return CALCULATION_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.shortDesc.toLowerCase().includes(q) ||
          item.miEz.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      return CALCULATION_ITEMS.filter((item) => item.categoryId === selectedCategory);
    }
    return CALCULATION_ITEMS;
  }, [searchQuery, selectedCategory]);

  // --------------------------------------------------------------------------
  // SPA ROUTER HASH & HISTORY STACK SYNCHRONIZATION
  // --------------------------------------------------------------------------
  const syncFromHash = () => {
    try {
      const hashString = window.location.hash || '';
      const queryPart = hashString.includes('?') ? hashString.split('?')[1] : '';
      const params = new URLSearchParams(queryPart);

      const calcParam = params.get('calc');
      const modeParam = params.get('mode');
      const tabParam = params.get('tab');
      const catParam = params.get('cat');

      if (calcParam) {
        const item = CALCULATION_ITEMS.find((c) => c.id === calcParam);
        if (item) {
          setSelectedCalcId(item.id);
          setSelectedCategory(item.categoryId);
          setViewMode('detail');
          return;
        }
      }

      if (modeParam === 'interactive') {
        setViewMode('interactive-calculators');
        if (
          tabParam &&
          ['concrete', 'masonry', 'insulation', 'tiling', 'drywall', 'roofing', 'rafter'].includes(tabParam)
        ) {
          setActiveTab(tabParam as CalculatorTab);
        }
        return;
      }

      if (catParam) {
        const cat = MAIN_CATEGORIES.find((c) => c.id === catParam);
        if (cat) {
          setSelectedCategory(cat.id);
          setSelectedCalcId(null);
          setViewMode('category-list');
          return;
        }
      }

      // Root calculations view
      setViewMode('categories');
      setSelectedCategory(null);
      setSelectedCalcId(null);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    syncFromHash();

    const handlePopState = () => {
      syncFromHash();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Safety fallback if detail mode is active with no valid item
  useEffect(() => {
    if (viewMode === 'detail' && !activeCalculationObj) {
      setViewMode('categories');
      setSelectedCalcId(null);
    }
  }, [viewMode, activeCalculationObj]);

  const navigateToCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedCalcId(null);
    setViewMode('category-list');
    const newHash = `#calculations?cat=${catId}`;
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
    window.dispatchEvent(new Event('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToDetail = (calcId: string) => {
    const item = CALCULATION_ITEMS.find((c) => c.id === calcId);
    if (item) {
      setSelectedCalcId(item.id);
      setSelectedCategory(item.categoryId);
      setViewMode('detail');
      const newHash = `#calculations?calc=${calcId}`;
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', newHash);
      }
      window.dispatchEvent(new Event('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToInteractive = (tab: CalculatorTab) => {
    setActiveTab(tab);
    setViewMode('interactive-calculators');
    const newHash = `#calculations?mode=interactive&tab=${tab}`;
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
    window.dispatchEvent(new Event('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategoriesRoot = () => {
    setSelectedCategory(null);
    setSelectedCalcId(null);
    setSearchQuery('');
    setViewMode('categories');
    const newHash = '#calculations';
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
    window.dispatchEvent(new Event('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --------------------------------------------------------------------------
  // 1. BETON & ZSALUZAT STATE
  // --------------------------------------------------------------------------
  const [concreteShape, setConcreteShape] = useState<'slab' | 'strip' | 'column'>('slab');
  const [cLength, setCLength] = useState<number | ''>('');
  const [cWidth, setCWidth] = useState<number | ''>('');
  const [cHeight, setCHeight] = useState<number | ''>(''); // meters
  const [cCount, setCCount] = useState<number | ''>(''); // for columns
  const [cGrade, setCGrade] = useState<'C12' | 'C16' | 'C20' | 'C25' | 'C30'>('C20');
  const [cWaste, setCWaste] = useState<number | ''>(''); // %

  const concreteCalc = useMemo(() => {
    const numL = parseNumberValue(cLength);
    const numW = parseNumberValue(cWidth);
    const numH = parseNumberValue(cHeight);
    const numCnt = parseNumberValue(cCount) ?? 1;
    const numWaste = parseNumberValue(cWaste) ?? 0;

    const isReady = numL !== null && numW !== null && numH !== null;
    if (!isReady || numL <= 0 || numW <= 0 || numH <= 0) {
      return { isReady: false, netVol: 0, grossVol: 0, formArea: 0, cementBags25kg: 0, totalCementKg: 0, soderTons: 0, soderM3: 0, waterLiters: 0, rebarKg: 0 };
    }

    let netVol = 0;
    let formArea = 0;

    if (concreteShape === 'slab') {
      netVol = numL * numW * numH;
      formArea = 2 * (numL + numW) * numH;
    } else if (concreteShape === 'strip') {
      netVol = numL * numW * numH;
      formArea = 2 * numL * numH;
    } else {
      netVol = numL * numW * numH * (numCnt || 1);
      formArea = 2 * (numL + numW) * numH * (numCnt || 1);
    }

    const grossVol = netVol * (1 + numWaste / 100);

    const cementRatioMap = { C12: 230, C16: 270, C20: 320, C25: 360, C30: 400 };
    const cementKgPerM3 = cementRatioMap[cGrade];
    const totalCementKg = grossVol > 0 ? Math.ceil(grossVol * cementKgPerM3) : 0;
    const cementBags25kg = Math.ceil(totalCementKg / 25);

    const soderTons = grossVol > 0 ? Number((grossVol * 1.85).toFixed(2)) : 0;
    const soderM3 = grossVol > 0 ? Number((grossVol * 1.15).toFixed(2)) : 0;
    const waterLiters = totalCementKg > 0 ? Math.ceil(totalCementKg * 0.55) : 0;

    const rebarRatio = concreteShape === 'column' ? 110 : concreteShape === 'strip' ? 80 : 65;
    const rebarKg = grossVol > 0 ? Math.ceil(grossVol * rebarRatio) : 0;

    return {
      isReady: true,
      netVol: Number(netVol.toFixed(2)),
      grossVol: Number(grossVol.toFixed(2)),
      formArea: Number(formArea.toFixed(2)),
      cementBags25kg,
      totalCementKg,
      soderTons,
      soderM3,
      waterLiters,
      rebarKg,
    };
  }, [concreteShape, cLength, cWidth, cHeight, cCount, cGrade, cWaste]);

  // --------------------------------------------------------------------------
  // 2. FALAZÓANYAG & HABARCS STATE
  // --------------------------------------------------------------------------
  const [brickType, setBrickType] = useState<'pth30' | 'pth44' | 'ytong30' | 'b30' | 'zsaluko30'>('pth30');
  const [wLength, setWLength] = useState<number | ''>('');
  const [wHeight, setWHeight] = useState<number | ''>('');
  const [wDeduction, setWDeduction] = useState<number | ''>(''); // m2 windows/doors
  const [wWaste, setWWaste] = useState<number | ''>('');

  const masonryCalc = useMemo(() => {
    const numL = parseNumberValue(wLength);
    const numH = parseNumberValue(wHeight);
    const numDed = parseNumberValue(wDeduction) ?? 0;
    const numWaste = parseNumberValue(wWaste) ?? 0;

    const isReady = numL !== null && numH !== null;
    const specs = {
      pth30: { name: 'Porotherm 30 N+F', pcsM2: 16, palletPcs: 80, mortarL: 24, isZsaluko: false },
      pth44: { name: 'Porotherm 44 Thermo Profi', pcsM2: 16, palletPcs: 60, mortarL: 35, isZsaluko: false },
      ytong30: { name: 'Ytong A+ 30 cm', pcsM2: 6.67, palletPcs: 40, mortarL: 5, isZsaluko: false },
      b30: { name: 'Hagyományos B30 tégla', pcsM2: 36, palletPcs: 240, mortarL: 45, isZsaluko: false },
      zsaluko30: { name: 'Zsalukő 30 cm (50x30x23 cm)', pcsM2: 8.7, palletPcs: 40, mortarL: 0, isZsaluko: true },
    }[brickType];

    if (!isReady || numL <= 0 || numH <= 0) {
      return { isReady: false, netArea: 0, grossPcs: 0, pallets: 0, mortarBags: 0, zsalukoConcreteM3: 0, brickName: specs.name, isZsaluko: specs.isZsaluko };
    }

    const grossArea = numL * numH;
    const netArea = Math.max(0, grossArea - numDed);

    const netPcs = netArea * specs.pcsM2;
    const grossPcs = netPcs > 0 ? Math.ceil(netPcs * (1 + numWaste / 100)) : 0;
    const pallets = grossPcs > 0 ? Math.ceil(grossPcs / specs.palletPcs) : 0;

    let mortarBags = 0;
    let zsalukoConcreteM3 = 0;

    if (netArea > 0) {
      if (specs.isZsaluko) {
        zsalukoConcreteM3 = Number((netArea * 0.19).toFixed(2));
      } else {
        const totalMortarLiters = netArea * specs.mortarL;
        mortarBags = Math.ceil(totalMortarLiters / 16);
      }
    }

    return {
      isReady: true,
      netArea: Number(netArea.toFixed(2)),
      grossPcs,
      pallets,
      mortarBags,
      zsalukoConcreteM3,
      brickName: specs.name,
      isZsaluko: specs.isZsaluko,
    };
  }, [brickType, wLength, wHeight, wDeduction, wWaste]);

  // --------------------------------------------------------------------------
  // 3. HŐSZIGETELÉS & U-ÉRTÉK STATE
  // --------------------------------------------------------------------------
  const [wallBase, setWallBase] = useState<'b30' | 'pth30' | 'concrete'>('pth30');
  const [insulationMat, setInsulationMat] = useState<'eps' | 'grafit' | 'kozetgyapot' | 'xps' | 'pir'>('grafit');
  const [insulationCm, setInsulationCm] = useState<number | ''>('');
  const [insArea, setInsArea] = useState<number | ''>(''); // m2

  const insulationCalc = useMemo(() => {
    const numCm = parseNumberValue(insulationCm);
    const numArea = parseNumberValue(insArea);

    const baseWallSpecs = {
      b30: { name: 'B30 Téglafal (30 cm)', R: 0.60 },
      pth30: { name: 'Porotherm 30 N+F (30 cm)', R: 1.12 },
      concrete: { name: 'Vasbeton fal (20 cm)', R: 0.12 },
    }[wallBase];

    const matSpecs = {
      eps: { name: 'EPS 80 Fehér polisztirol', lambda: 0.039 },
      grafit: { name: 'Grafitos EPS 80 polisztirol', lambda: 0.031 },
      kozetgyapot: { name: 'Kőzetgyapot homlokzati tábla', lambda: 0.035 },
      xps: { name: 'XPS lábazati zártcellás hab', lambda: 0.034 },
      pir: { name: 'PIR keményhab tábla', lambda: 0.022 },
    }[insulationMat];

    const isReady = numCm !== null && numArea !== null;
    if (!isReady) {
      return { isReady: false, baseName: baseWallSpecs.name, matName: matSpecs.name, uValue: 0, passesKNE: false, adhesiveBags: 0, meshM2: 0, boardPcs: 0 };
    }

    const R_insulation = numCm > 0 ? (numCm / 100) / matSpecs.lambda : 0;
    const R_total = baseWallSpecs.R + R_insulation + 0.17;
    const uValue = Number((1 / R_total).toFixed(3));

    const passesKNE = uValue <= 0.24;

    const adhesiveBags = numArea > 0 ? Math.ceil((numArea * 9) / 25) : 0;
    const meshM2 = numArea > 0 ? Math.ceil(numArea * 1.1) : 0;
    const boardPcs = numArea > 0 ? Math.ceil(numArea * 2) : 0;

    return {
      isReady: true,
      baseName: baseWallSpecs.name,
      matName: matSpecs.name,
      uValue,
      passesKNE,
      adhesiveBags,
      meshM2,
      boardPcs,
    };
  }, [wallBase, insulationMat, insulationCm, insArea]);

  // --------------------------------------------------------------------------
  // 4. VAKOLAT, ESZTRICH & BURKOLAT STATE
  // --------------------------------------------------------------------------
  const [tilingType, setTilingType] = useState<'tile' | 'screed' | 'plaster'>('tile');
  const [tArea, setTArea] = useState<number | ''>(''); // m2
  const [tTileSize, setTTileSize] = useState<'30x30' | '60x60' | '30x60'>('60x60');
  const [tThicknessMm, setTThicknessMm] = useState<number | ''>(''); // for screed/plaster mm
  const [tWaste, setTWaste] = useState<number | ''>('');

  const tilingCalc = useMemo(() => {
    const numArea = parseNumberValue(tArea);
    const numWaste = parseNumberValue(tWaste) ?? 0;
    const numThick = parseNumberValue(tThicknessMm) ?? 0;

    const isReady = numArea !== null && (tilingType === 'tile' || numThick > 0);
    if (!isReady || numArea <= 0) {
      return { isReady: false, tilesM2: 0, adhesiveBags: 0, groutKg: 0, screedBags: 0, primerLiters: 0 };
    }

    let tilesM2 = 0;
    let adhesiveBags = 0;
    let groutKg = 0;
    let screedBags = 0;
    let primerLiters = 0;

    if (tilingType === 'tile') {
      tilesM2 = Math.ceil(numArea * (1 + numWaste / 100));
      const kgPerM2 = tTileSize === '60x60' ? 4.8 : 3.8;
      adhesiveBags = Math.ceil((numArea * kgPerM2) / 25);
      groutKg = Math.ceil(numArea * 0.4);
    } else {
      const totalDryKg = numArea * (numThick / 10) * 19;
      screedBags = Math.ceil(totalDryKg / 25);
    }

    primerLiters = Math.ceil(numArea * 0.15);

    return {
      isReady: true,
      tilesM2,
      adhesiveBags,
      groutKg,
      screedBags,
      primerLiters,
    };
  }, [tilingType, tArea, tTileSize, tThicknessMm, tWaste]);

  // --------------------------------------------------------------------------
  // 5. GIPSZKARTON & SZÁRAZÉPÍTÉSZET STATE
  // --------------------------------------------------------------------------
  const [dwType, setDwType] = useState<'wall1' | 'wall2' | 'ceiling'>('wall1');
  const [dwArea, setDwArea] = useState<number | ''>(''); // m2
  const [dwBoardType, setDwBoardType] = useState<'rb' | 'rbi' | 'rf'>('rb');

  const drywallCalc = useMemo(() => {
    const numArea = parseNumberValue(dwArea);
    const isReady = numArea !== null;

    const boardNames = {
      rb: 'Normál RB Gipszkarton (12.5mm)',
      rbi: 'Impregnált RBI Vízálló (12.5mm)',
      rf: 'Tűzgátló RF Rózsaszín (12.5mm)',
    }[dwBoardType];

    if (!isReady || numArea <= 0) {
      return { isReady: false, boardCount: 0, boardNames, mainProfileFm: 0, perimeterProfileFm: 0, jointFillerKg: 0, screwsPcs: 0, tapeM: 0 };
    }

    const boardSizeM2 = 2.4;
    const layers = dwType === 'wall2' ? 2 : 1;
    const boardCount = Math.ceil((numArea * layers * 1.05) / boardSizeM2);

    const mainProfileFm = Math.ceil(numArea * 2.8);
    const perimeterProfileFm = Math.ceil(Math.sqrt(numArea) * 4 * 1.2);

    const jointFillerKg = Math.ceil(numArea * layers * 0.5);
    const screwsPcs = Math.ceil(numArea * layers * 18);
    const tapeM = Math.ceil(numArea * 1.5);

    return {
      isReady: true,
      boardCount,
      boardNames,
      mainProfileFm,
      perimeterProfileFm,
      jointFillerKg,
      screwsPcs,
      tapeM,
    };
  }, [dwType, dwArea, dwBoardType]);

  // --------------------------------------------------------------------------
  // 6. TETŐFEDÉS & CSERÉP STATE
  // --------------------------------------------------------------------------
  const [roofFootprint, setRoofFootprint] = useState<number | ''>(''); // m2 ground footprint
  const [roofAngle, setRoofAngle] = useState<number | ''>(''); // degrees
  const [tileType, setTileType] = useState<'ceramic' | 'concrete' | 'sheet'>('ceramic');

  const roofingCalc = useMemo(() => {
    const numFootprint = parseNumberValue(roofFootprint);
    const numAngle = parseNumberValue(roofAngle);

    const isReady = numFootprint !== null && numAngle !== null;
    if (!isReady || numFootprint <= 0) {
      return { isReady: false, actualRoofArea: 0, totalTiles: 0, battenFm: 0, membraneM2: 0, ridgeTiles: 0 };
    }

    const rad = (numAngle * Math.PI) / 180;
    const pitchMultiplier = 1 / Math.cos(rad);
    const actualRoofArea = Number((numFootprint * pitchMultiplier * 1.1).toFixed(1));

    const tilePcsPerM2 = tileType === 'ceramic' ? 10.5 : tileType === 'concrete' ? 9.8 : 1;
    const totalTiles = Math.ceil(actualRoofArea * tilePcsPerM2 * 1.06);

    const battenFm = Math.ceil(actualRoofArea * 3.2);
    const membraneM2 = Math.ceil(actualRoofArea * 1.15);
    const ridgeTiles = Math.ceil(Math.sqrt(numFootprint) * 1.4 * 3);

    return {
      isReady: true,
      actualRoofArea,
      totalTiles,
      battenFm,
      membraneM2,
      ridgeTiles,
    };
  }, [roofFootprint, roofAngle, tileType]);

  // --------------------------------------------------------------------------
  // 7. SZARUFAHOSSZ KALKULÁTOR STATE
  // --------------------------------------------------------------------------
  const [rSpan, setRSpan] = useState<number | ''>(''); // fél-fesztávolság L_v (m)
  const [rAngle, setRAngle] = useState<number | ''>(''); // tető dőlésszög α (fok)
  const [rOverhang, setROverhang] = useState<number | ''>(''); // eresz túlnyúlás L_eresz (m)
  const [rSpacing, setRSpacing] = useState<number | ''>(85); // szarufa tengelytáv (cm)
  const [rRoofLength, setRRoofLength] = useState<number | ''>(''); // tető hossza L_tető (m)

  const rafterCalc = useMemo(() => {
    const numSpan = parseNumberValue(rSpan);
    const numAngle = parseNumberValue(rAngle);
    const numOverhang = parseNumberValue(rOverhang) ?? 0;
    const numSpacing = parseNumberValue(rSpacing) ?? 85;
    const numRoofLength = parseNumberValue(rRoofLength);

    const isReady = numSpan !== null && numAngle !== null;
    if (!isReady || numSpan <= 0 || numAngle <= 0) {
      return { isReady: false, totalHoriz: 0, cosAlpha: 0, rafterLength: 0, stdStockLength: 0, raftersPerSide: 0, totalRaftersBothSides: 0 };
    }

    const totalHoriz = numSpan + numOverhang;
    const rad = (numAngle * Math.PI) / 180;
    const cosAlpha = Math.cos(rad);
    const rafterLength = cosAlpha > 0 ? totalHoriz / cosAlpha : 0;

    let stdStockLength = 0;
    if (rafterLength > 0) {
      if (rafterLength <= 4) stdStockLength = 4;
      else if (rafterLength <= 5) stdStockLength = 5;
      else if (rafterLength <= 6) stdStockLength = 6;
      else if (rafterLength <= 7) stdStockLength = 7;
      else if (rafterLength <= 8) stdStockLength = 8;
      else if (rafterLength <= 9) stdStockLength = 9;
      else stdStockLength = Math.ceil(rafterLength);
    }

    let raftersPerSide = 0;
    let totalRaftersBothSides = 0;
    if (numRoofLength !== null && numRoofLength > 0) {
      const spacingM = numSpacing / 100;
      raftersPerSide = Math.ceil(numRoofLength / spacingM) + 1;
      totalRaftersBothSides = raftersPerSide * 2;
    }

    return {
      isReady: true,
      totalHoriz: Number(totalHoriz.toFixed(2)),
      cosAlpha: Number(cosAlpha.toFixed(4)),
      rafterLength: Number(rafterLength.toFixed(2)),
      stdStockLength,
      raftersPerSide,
    };
  }, [rSpan, rAngle, rOverhang, rSpacing, rRoofLength]);

  const isCurrentCalcReady = useMemo(() => {
    switch (activeTab) {
      case 'concrete': return concreteCalc.isReady;
      case 'masonry': return masonryCalc.isReady;
      case 'insulation': return insulationCalc.isReady;
      case 'tiling': return tilingCalc.isReady;
      case 'drywall': return drywallCalc.isReady;
      case 'roofing': return roofingCalc.isReady;
      case 'rafter': return rafterCalc.isReady;
      default: return false;
    }
  }, [activeTab, concreteCalc.isReady, masonryCalc.isReady, insulationCalc.isReady, tilingCalc.isReady, drywallCalc.isReady, roofingCalc.isReady, rafterCalc.isReady]);


  // --------------------------------------------------------------------------
  // SUMMARY TEXT GENERATOR & COPY ACTION
  // --------------------------------------------------------------------------
  const getActiveSummaryText = () => {
    let text = `=== ÉPÍTŐTUDÁS SZÁMÍTÁSI ÖSSZEGZŐ ===\nModul: `;
    if (activeTab === 'concrete') {
      text += `Beton & Zsaluzat Kalkulátor\n`;
      text += `- Típus / Alak: ${concreteShape}\n`;
      text += `- Nettó térfogat: ${concreteCalc.netVol} m³\n`;
      text += `- Bruttó betonigény (${cWaste}% ráhagyással): ${concreteCalc.grossVol} m³\n`;
      text += `- Beton minőség: ${cGrade}\n`;
      text += `- Cement szükséglet: ${concreteCalc.cementBags25kg} zsák (25 kg/zsák - össz: ${concreteCalc.totalCementKg} kg)\n`;
      text += `- Sóder szükséglet: ${concreteCalc.soderTons} tonna (~${concreteCalc.soderM3} m³)\n`;
      text += `- Becsült betonacél: ${concreteCalc.rebarKg} kg\n`;
      text += `- Zsaluzási felület: ${concreteCalc.formArea} m²\n`;
    } else if (activeTab === 'masonry') {
      text += `Falazóanyag & Habarcs Kalkulátor\n`;
      text += `- Téglatípus: ${masonryCalc.brickName}\n`;
      text += `- Nettó falfelület: ${masonryCalc.netArea} m²\n`;
      text += `- Szükséges téglaszám (${wWaste}% vágási veszteséggel): ${masonryCalc.grossPcs} db\n`;
      text += `- Kerekített raklapszám: ${masonryCalc.pallets} raklap\n`;
      if (masonryCalc.isZsaluko) {
        text += `- Kiöntőbeton szükséglet: ${masonryCalc.zsalukoConcreteM3} m³\n`;
      } else {
        text += `- Falazóhabarcs (25kg zsák): ${masonryCalc.mortarBags} zsák\n`;
      }
    } else if (activeTab === 'insulation') {
      text += `Hőszigetelés & U-érték Energetikai Kalkulátor\n`;
      text += `- Meglévő szerkezet: ${insulationCalc.baseName}\n`;
      text += `- Hőszigetelés: ${insulationCalc.matName} (${insulationCm} cm)\n`;
      text += `- Eredő hőátbocsátási tényező (U-érték): ${insulationCalc.uValue} W/m²K\n`;
      text += `- KNE 7/2006 Energetikai Minősítés: ${insulationCalc.passesKNE ? 'MEGFELELT (U <= 0.24 W/m²K)' : 'NEM FELELT MEG (Vastagabb szigetelés javasolt!)'}\n`;
      text += `- Hőszigetelő táblák száma: ${insulationCalc.boardPcs} db\n`;
      text += `- Ragasztó- és beágyazó habarcs: ${insulationCalc.adhesiveBags} zsák (25 kg/zsák)\n`;
      text += `- Üvegszövet háló: ${insulationCalc.meshM2} m²\n`;
    } else if (activeTab === 'tiling') {
      text += `Vakolat, Esztrich & Burkolat Kalkulátor\n`;
      if (tilingType === 'tile') {
        text += `- Burkolólap igény (${tWaste}% vágási veszteséggel): ${tilingCalc.tilesM2} m²\n`;
        text += `- Csemperagasztó: ${tilingCalc.adhesiveBags} zsák (25 kg/zsák)\n`;
        text += `- Fugázó anyag: ${tilingCalc.groutKg} kg\n`;
      } else {
        text += `- Szárazesztrich / Vakolat habarcs: ${tilingCalc.screedBags} zsák (25 kg/zsák)\n`;
      }
      text += `- Mélyalapozó: ${tilingCalc.primerLiters} liter\n`;
    } else if (activeTab === 'drywall') {
      text += `Gipszkarton Kalkulátor\n`;
      text += `- Karton típus: ${drywallCalc.boardNames}\n`;
      text += `- Táblaszám (120x200cm): ${drywallCalc.boardCount} db\n`;
      text += `- Főprofilok (CW/CD): ${drywallCalc.mainProfileFm} fm\n`;
      text += `- Keretprofilok (UW/UD): ${drywallCalc.perimeterProfileFm} fm\n`;
      text += `- Hézagoló gipsz: ${drywallCalc.jointFillerKg} kg\n`;
      text += `- Rögzítőcsavarok: ${drywallCalc.screwsPcs} db\n`;
    } else if (activeTab === 'roofing') {
      text += `Tetőfedés & Cserép Kalkulátor\n`;
      text += `- Valós tetőfelület (${roofAngle}° dőlésszöggel): ${roofingCalc.actualRoofArea} m²\n`;
      text += `- Szükséges cserepek / lemez: ${roofingCalc.totalTiles} db\n`;
      text += `- Kúpcserép: ${roofingCalc.ridgeTiles} db\n`;
      text += `- Tetőléc szükséglet: ${roofingCalc.battenFm} fm\n`;
      text += `- Páraáteresztő tetőfólia: ${roofingCalc.membraneM2} m²\n`;
    } else if (activeTab === 'rafter') {
      text += `Szarufahossz Kalkulátor\n`;
      text += `- Épület fél-fesztávolsága (L_v): ${rSpan} m\n`;
      text += `- Tető dőlésszöge (α): ${rAngle}° (cos(α) = ${rafterCalc.cosAlpha})\n`;
      text += `- Eresz túlnyúlás (L_eresz): ${rOverhang} m\n`;
      text += `- Teljes vízszintes vetület: ${rafterCalc.totalHoriz} m\n`;
      text += `- Szarufa ferde hossza (L_szarufa): ${rafterCalc.rafterLength} m\n`;
      text += `- Ajánlott szabványos fűrészáru hossz: ${rafterCalc.stdStockLength}.0 m-es szálak\n`;
      if (rafterCalc.totalRaftersBothSides > 0) {
        text += `- Szarufák száma (${rRoofLength}m tetőhossznál): ${rafterCalc.totalRaftersBothSides} db (mindkét oldal)\n`;
      }
    }

    text += `\nGenerálva az ÉpítőTudás Építőipari Számítási Moduljával (${new Date().toLocaleDateString('hu-HU')})`;
    return text;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(getActiveSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => onNavigate('tudastar')}
              className="hover:text-white transition-colors"
            >
              Tudástár
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => navigateToCategoriesRoot()}
              className="hover:text-white transition-colors"
            >
              Számítások
            </button>
            {activeCategoryObj && (
              <>
                <ChevronRight size={13} />
                <button
                  onClick={() => navigateToCategory(activeCategoryObj.id)}
                  className="hover:text-white transition-colors"
                >
                  {activeCategoryObj.subtitle}
                </button>
              </>
            )}
            {activeCalculationObj && (
              <>
                <ChevronRight size={13} />
                <span className="text-gray-200 font-medium truncate max-w-[200px]">
                  {activeCalculationObj.title}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                <Sparkles size={13} /> Építőipari Számítási Tudásbázis
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase">
                SZÁMÍTÁSOK
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Építőipari számítások, képletek és gyakorlati példák egy helyen.
              </p>
            </div>

            {/* Quick Action Navigation */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => navigateToCategoriesRoot()}
                className={`inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all ${
                  viewMode !== 'interactive-calculators'
                    ? 'bg-accent text-black'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <BookOpen size={15} /> Számítási Tudásbázis
              </button>
              <button
                onClick={() => navigateToInteractive(activeTab)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all ${
                  viewMode === 'interactive-calculators'
                    ? 'bg-accent text-black'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <Calculator size={15} /> Interaktív Kalkulátorok
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center justify-center p-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl border border-white/20 transition-all"
                title="Nyomtatás vagy PDF mentése"
              >
                <Printer size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <SectionSubNav
        ariaLabel="Tudástár navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Cikkek',
            page: 'category',
            icon: <FileText size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Fogalomtár',
            page: 'glossary',
            icon: <BookOpen size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Számítások',
            page: 'calculations',
            icon: <Calculator size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Szakmai könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* VIEWMODE 1 & 2: CATEGORIES / CATEGORY LIST / SEARCH */}
      {viewMode !== 'interactive-calculators' && viewMode !== 'detail' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Search bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Keress számításra, képletre vagy kifejezésre (pl. beton, terület, pitagorasz, U-érték)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() && viewMode !== 'category-list') {
                    setViewMode('category-list');
                  }
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 1. CATEGORIES TILES VIEW */}
          {!searchQuery && !selectedCategory && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Számítási Kategóriák</h2>
                  <p className="text-xs text-gray-500 mt-1">Válassz szakterületet a kapcsolódó képletek és számítások megtekintéséhez</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MAIN_CATEGORIES.map((cat) => {
                  const IconComp = cat.icon;
                  const itemCount = CALCULATION_ITEMS.filter((item) => item.categoryId === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => navigateToCategory(cat.id)}
                      className={`group text-left p-6 rounded-2xl border ${cat.borderColor} ${cat.bgColor} shadow-sm transition-all hover:shadow-xl flex flex-col justify-between space-y-4`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <IconComp size={24} className="text-primary" />
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${cat.badgeColor}`}>
                          {itemCount} számítás
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                          {cat.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                        <span>Böngészés témakör szerint</span>
                        <ChevronRight size={16} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. CATEGORY ITEM TILES GRID (Search results or Category List) */}
          {(selectedCategory || searchQuery) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigateToCategoriesRoot()}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
                    title="Vissza a kategóriákhoz"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">
                      {searchQuery
                        ? `Keresési eredmények: "${searchQuery}"`
                        : activeCategoryObj?.title || 'Számítások Listája'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {filteredItems.length} számítási modul található ebben a nézetben
                    </p>
                  </div>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <HelpCircle size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-bold text-sm">Nem található számítás a megadott keresési feltételekkel.</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl"
                  >
                    Keresés törlése
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigateToDetail(item.id)}
                      className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary text-left shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                            {item.level}
                          </span>
                          {item.calculatorTab && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                              <Calculator size={11} /> Kalkulátor elérhető
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {item.shortDesc}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-accent group-hover:translate-x-1 transition-transform">
                        <span>Adatlap megnyitása</span>
                        <ChevronRight size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEWMODE 3: DETAILED CALCULATION SHEET VIEW */}
      {viewMode === 'detail' && activeCalculationObj && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Back button */}
          <button
            onClick={() => {
              if (selectedCategory) {
                navigateToCategory(selectedCategory);
              } else {
                navigateToCategoriesRoot();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} /> Vissza a számításokhoz
          </button>

          {/* Main Calculation Document Sheet */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            
            {/* Document Header */}
            <div className="bg-primary text-white p-6 md:p-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded bg-accent text-black">
                  {activeCalculationObj.level} SZINT
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                {activeCalculationObj.title}
              </h1>
              <p className="text-gray-300 text-sm leading-relaxed">
                {activeCalculationObj.shortDesc}
              </p>
            </div>

            {/* Document Body Sections */}
            <div className="p-6 md:p-8 space-y-8 text-gray-800 text-sm">

              {/* 1. Mi ez? */}
              <div className="space-y-2 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Info size={18} className="text-primary" /> Mi ez?
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm">{activeCalculationObj.miEz}</p>
              </div>

              {/* 2. Mire használjuk? */}
              <div className="space-y-2 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HardHat size={18} className="text-primary" /> Mire használjuk?
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm">{activeCalculationObj.mireHasznaljuk}</p>
              </div>

              {/* 3. Szükséges adatok */}
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckSquare size={18} className="text-primary" /> Szükséges adatok
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeCalculationObj.szuksegesAdatok.map((ad, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">
                      <CheckCircle2 size={15} className="text-accent shrink-0" />
                      <span>{ad}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. Képlet */}
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Calculator size={18} className="text-primary" /> Képlet
                </h2>
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                  <div className="font-mono text-base md:text-xl font-bold text-primary tracking-wide">
                    {activeCalculationObj.keplet}
                  </div>
                </div>
              </div>

              {/* 5. Jelölések */}
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-primary" /> Jelölések
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeCalculationObj.jelolesek.map((j, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{j.symbol}</span>
                      <span className="text-gray-700 font-medium">{j.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Számítás lépésről lépésre */}
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" /> Számítás lépésről lépésre
                </h2>
                <ol className="space-y-2">
                  {activeCalculationObj.lepesek.map((l, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{l}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 7. Gyakorlati példa */}
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" /> Gyakorlati példa
                </h2>
                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
                  <h3 className="font-bold text-amber-900 text-sm">{activeCalculationObj.gyakorlatiPelda.title}</h3>
                  <div className="space-y-1.5 font-mono text-xs text-amber-950">
                    {activeCalculationObj.gyakorlatiPelda.steps.map((st, idx) => (
                      <div key={idx}>• {st}</div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-amber-200/60 font-bold text-xs text-amber-900 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-amber-700 shrink-0" />
                    <span>{activeCalculationObj.gyakorlatiPelda.result}</span>
                  </div>
                </div>
              </div>

              {/* 8. Ellenőrzés */}
              <div className="space-y-2 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" /> Ellenőrzés
                </h2>
                <p className="text-gray-700 text-xs leading-relaxed bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-xl">
                  {activeCalculationObj.ellenorzes}
                </p>
              </div>

              {/* 9. Gyakori hibák */}
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-500" /> Gyakori hibák
                </h2>
                <div className="space-y-2">
                  {activeCalculationObj.gyakoriHibak.map((h, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-red-50/60 border border-red-200/60 p-3 rounded-xl text-xs text-red-900">
                      <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 10. Gyakorlati megjegyzés */}
              <div className="space-y-2 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Info size={18} className="text-primary" /> Gyakorlati megjegyzés
                </h2>
                <p className="text-gray-700 text-xs leading-relaxed bg-gray-50 border border-gray-200 p-3.5 rounded-xl">
                  {activeCalculationObj.gyakorlatiMegjegyzes}
                </p>
              </div>

              {/* 11. Kapcsolódó számítások */}
              <div className="space-y-3 border-b border-gray-100 pb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Layers size={18} className="text-primary" /> Kapcsolódó számítások
                </h2>
                <div className="flex flex-wrap gap-2">
                  {activeCalculationObj.kapcsolodoSzamitasok.map((ksz, idx) => {
                    const matchedItem = CALCULATION_ITEMS.find(
                      (item) =>
                        item.title.toLowerCase() === ksz.toLowerCase() ||
                        item.title.toLowerCase().includes(ksz.toLowerCase()) ||
                        ksz.toLowerCase().includes(item.title.toLowerCase())
                    );

                    if (matchedItem) {
                      return (
                        <button
                          key={idx}
                          onClick={() => navigateToDetail(matchedItem.id)}
                          className="text-xs font-bold bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary-700 px-3.5 py-1.5 rounded-xl border border-primary/20 hover:border-primary/40 transition-all flex items-center gap-1.5 group cursor-pointer shadow-xs"
                        >
                          <span>{ksz}</span>
                          <ChevronRight size={13} className="text-accent group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      );
                    }

                    return (
                      <span key={idx} className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200">
                        {ksz}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 12. Kalkulátor megnyitása gomb */}
              {activeCalculationObj.calculatorTab && (
                <div className="pt-4 bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-3">
                  <h3 className="font-extrabold text-gray-900 text-base">Szeretnéd azonnal kiszámolni a saját adataiddal?</h3>
                  <p className="text-xs text-gray-600">Nyisd meg a kapcsolódó interaktív kalkulátort és írd be a pontos méreteket!</p>
                  <button
                    onClick={() => navigateToInteractive(activeCalculationObj.calculatorTab!)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-sm rounded-xl shadow-lg transition-all transform active:scale-95"
                  >
                    <Calculator size={18} /> KALKULÁTOR MEGNYITÁSA
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* VIEWMODE 4: INTERACTIVE CALCULATORS TAB VIEW */}
      {viewMode === 'interactive-calculators' && (
        <div className="space-y-8">
          {/* Calculator Tab Selector */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <button
                onClick={() => navigateToCategoriesRoot()}
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft size={16} /> Vissza a Számítási Tudásbázishoz
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
              {[
                { id: 'concrete', label: 'Beton & Zsaluzat', icon: <Building size={16} /> },
                { id: 'masonry', label: 'Falazás & Tégla', icon: <Home size={16} /> },
                { id: 'insulation', label: 'Hőszigetelés (U)', icon: <Zap size={16} /> },
                { id: 'tiling', label: 'Burkolat & Vakolat', icon: <Layers size={16} /> },
                { id: 'drywall', label: 'Gipszkarton', icon: <Maximize2 size={16} /> },
                { id: 'roofing', label: 'Tető & Cserép', icon: <Home size={16} /> },
                { id: 'rafter', label: 'Szarufahossz', icon: <Compass size={16} /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigateToInteractive(tab.id as CalculatorTab)}
                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Interactive Calculation Panel */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: INPUT CONTROLS (7 Cols) */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
                
                {/* ---------------------------------------------------------------- */}
                {/* 1. BETON & ZSALUZAT TAB */}
                {/* ---------------------------------------------------------------- */}
                {activeTab === 'concrete' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          <Building size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Beton &amp; Zsaluzat Számítás</h2>
                          <p className="text-xs text-gray-500">Sávalap, lemezalap és pillérek betonszükséglete</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Szerkezet Típusa</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'slab', label: 'Lemezalap / Födém' },
                          { id: 'strip', label: 'Sávalap / Koszorú' },
                          { id: 'column', label: 'Pillér / Oszlop' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setConcreteShape(s.id as any)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                              concreteShape === s.id
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <CalculatorInput
                        label="Hosszúság (m)"
                        step="0.1"
                        value={cLength}
                        onChange={setCLength}
                        placeholder="pl. 5.0"
                      />
                      <CalculatorInput
                        label="Szélesség (m)"
                        step="0.1"
                        value={cWidth}
                        onChange={setCWidth}
                        placeholder="pl. 4.0"
                      />
                      <CalculatorInput
                        label="Magasság / Mélység (m)"
                        step="0.05"
                        value={cHeight}
                        onChange={setCHeight}
                        placeholder="pl. 0.15"
                      />
                    </div>

                    {concreteShape === 'column' && (
                      <CalculatorInput
                        label="Pillérek Száma (db)"
                        step="1"
                        value={cCount}
                        onChange={setCCount}
                        placeholder="pl. 4"
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Beton Minőség (C-osztály)</label>
                        <select
                          value={cGrade}
                          onChange={(e) => setCGrade(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="C12">C12/15 - Szerelőbeton</option>
                          <option value="C16">C16/20 - Sávalapok</option>
                          <option value="C20">C20/25 - Standard lakossági</option>
                          <option value="C25">C25/30 - Szilárd födém/pillér</option>
                          <option value="C30">C30/37 - Kiemelt vasbeton</option>
                        </select>
                      </div>

                      <CalculatorInput
                        label="Kivitelezési Veszteség (%)"
                        step="1"
                        value={cWaste}
                        onChange={setCWaste}
                        placeholder="pl. 5"
                      />
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------------------- */}
                {/* 2. FALAZÓANYAG TAB */}
                {/* ---------------------------------------------------------------- */}
                {activeTab === 'masonry' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                          <Home size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Falazóanyag &amp; Habarcs Számítás</h2>
                          <p className="text-xs text-gray-500">Téglaszám, habarcsigény és zsalukő betoningény</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Falazóelem Típusa</label>
                      <select
                        value={brickType}
                        onChange={(e) => setBrickType(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="pth30">Porotherm 30 N+F (16 db/m²)</option>
                        <option value="pth44">Porotherm 44 Thermo Profi (16 db/m²)</option>
                        <option value="ytong30">Ytong A+ 30 cm (6.67 db/m²)</option>
                        <option value="b30">Hagyományos B30 tégla (36 db/m²)</option>
                        <option value="zsaluko30">Zsalukő 30 cm (8.7 db/m²)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CalculatorInput
                        label="Fal Hosszúsága (m)"
                        step="0.1"
                        value={wLength}
                        onChange={setWLength}
                        placeholder="pl. 10.0"
                      />
                      <CalculatorInput
                        label="Fal Magassága (m)"
                        step="0.1"
                        value={wHeight}
                        onChange={setWHeight}
                        placeholder="pl. 2.8"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CalculatorInput
                        label="Nyílászáró Levonások (m²)"
                        step="0.1"
                        value={wDeduction}
                        onChange={setWDeduction}
                        placeholder="pl. 4.5"
                      />
                      <CalculatorInput
                        label="Vágási Veszteség (%)"
                        step="1"
                        value={wWaste}
                        onChange={setWWaste}
                        placeholder="pl. 5"
                      />
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------------------- */}
                {/* 3. HŐSZIGETELÉS TAB */}
                {/* ---------------------------------------------------------------- */}
                {activeTab === 'insulation' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          <Zap size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Hőszigetelés &amp; U-érték Energetikai Kalkulátor</h2>
                          <p className="text-xs text-gray-500">Hőátbocsátási tényező (U) és KNE jogszabályi megfelelőség</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Meglévő Falazat Típusa</label>
                        <select
                          value={wallBase}
                          onChange={(e) => setWallBase(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="b30">B30 Téglafal (30 cm)</option>
                          <option value="pth30">Porotherm 30 N+F (30 cm)</option>
                          <option value="concrete">Vasbeton fal (20 cm)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Hőszigetelő Anyag</label>
                        <select
                          value={insulationMat}
                          onChange={(e) => setInsulationMat(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="eps">EPS 80 Fehér polisztirol (λ = 0.039)</option>
                          <option value="grafit">Grafitos EPS 80 polisztirol (λ = 0.031)</option>
                          <option value="kozetgyapot">Kőzetgyapot homlokzati tábla (λ = 0.035)</option>
                          <option value="xps">XPS lábazati zártcellás hab (λ = 0.034)</option>
                          <option value="pir">PIR keményhab tábla (λ = 0.022)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CalculatorInput
                        label="Szigetelés Vastagsága (cm)"
                        step="1"
                        value={insulationCm}
                        onChange={setInsulationCm}
                        placeholder="pl. 15"
                      />
                      <CalculatorInput
                        label="Homlokzati Felület (m²)"
                        step="1"
                        value={insArea}
                        onChange={setInsArea}
                        placeholder="pl. 120"
                      />
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------------------- */}
                {/* 4. BURKOLAT & VAKOLAT TAB */}
                {/* ---------------------------------------------------------------- */}
                {activeTab === 'tiling' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                          <Layers size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Vakolat, Esztrich &amp; Burkolat Kalkulátor</h2>
                          <p className="text-xs text-gray-500">Csempézés, ragasztó, aljzatbeton és vakolat habarcsigény</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Munkálat Típusa</label>
                        <select
                          value={tilingType}
                          onChange={(e) => setTilingType(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="tile">Hidegburkolás (Csempézés / Járólap)</option>
                          <option value="screed">Aljzatbeton / Esztrich terítés</option>
                          <option value="plaster">Belső / Külső Vakolás</option>
                        </select>
                      </div>

                      <CalculatorInput
                        label="Nettó Felület (m²)"
                        step="1"
                        value={tArea}
                        onChange={setTArea}
                        placeholder="pl. 35"
                      />
                    </div>

                    {tilingType === 'tile' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Lapméret (cm)</label>
                          <select
                            value={tTileSize}
                            onChange={(e) => setTTileSize(e.target.value as any)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                          >
                            <option value="30x30">30x30 cm</option>
                            <option value="60x60">60x60 cm (Nagy méret)</option>
                            <option value="30x60">30x60 cm</option>
                          </select>
                        </div>
                        <CalculatorInput
                          label="Vágási Veszteség (%)"
                          step="1"
                          value={tWaste}
                          onChange={setTWaste}
                          placeholder="pl. 10"
                        />
                      </div>
                    ) : (
                      <CalculatorInput
                        label="Rétegvastagság (mm)"
                        step="1"
                        value={tThicknessMm}
                        onChange={setTThicknessMm}
                        placeholder="pl. 50"
                      />
                    )}
                  </div>
                )}

                {/* ---------------------------------------------------------------- */}
                {/* 5. GIPSZKARTON TAB */}
                {/* ---------------------------------------------------------------- */}
                {activeTab === 'drywall' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                          <Maximize2 size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Gipszkarton Kalkulátor</h2>
                          <p className="text-xs text-gray-500">Táblaszám, profilok, csavarok és hézagoló gipsz</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Szerkezet Típusa</label>
                        <select
                          value={dwType}
                          onChange={(e) => setDwType(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="wall1">Válaszfal (1 réteg karton / oldal)</option>
                          <option value="wall2">Válaszfal (2 réteg karton / oldal)</option>
                          <option value="ceiling">Álmennyezet / Tetőtér beépítés</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Gipszkarton Típusa</label>
                        <select
                          value={dwBoardType}
                          onChange={(e) => setDwBoardType(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="rb">RB Normál Fehér (12.5 mm)</option>
                          <option value="rbi">RBI Vízálló Zöld (12.5 mm)</option>
                          <option value="rf">RF Tűzgátló Rózsaszín (12.5 mm)</option>
                        </select>
                      </div>
                    </div>

                    <CalculatorInput
                      label="Szerkezet Felülete (m²)"
                      step="1"
                      value={dwArea}
                      onChange={setDwArea}
                      placeholder="pl. 45"
                    />
                  </div>
                )}

                {/* ---------------------------------------------------------------- */}
                {/* 6. TETŐFEDÉS TAB */}
                {/* ---------------------------------------------------------------- */}
                {activeTab === 'roofing' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                          <Home size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Tetőfedés &amp; Cserép Kalkulátor</h2>
                          <p className="text-xs text-gray-500">Valós tetőfelület, cserépszám és lécezés dőlésszögből</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CalculatorInput
                        label="Vízszintes Vetületi Alapterület (m²)"
                        step="1"
                        value={roofFootprint}
                        onChange={setRoofFootprint}
                        placeholder="pl. 100"
                      />
                      <CalculatorInput
                        label="Tető Dőlésszöge (fok °)"
                        step="1"
                        value={roofAngle}
                        onChange={setRoofAngle}
                        placeholder="pl. 35"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Héjazat Típusa</label>
                      <select
                        value={tileType}
                        onChange={(e) => setTileType(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="ceramic">Kerámia cserép (~10.5 db/m²)</option>
                        <option value="concrete">Betoncserép (~9.8 db/m²)</option>
                        <option value="sheet">Trapézlemez / Cserepeslemez (m²)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------------------- */}
                {/* 7. SZARUFAHOSSZ TAB */}
                {/* ---------------------------------------------------------------- */}
                {activeTab === 'rafter' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                          <Compass size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Szarufahossz &amp; Tetőszerkezet Kalkulátor</h2>
                          <p className="text-xs text-gray-500">Szarufák ferde hossza, eresznyúlás és szabványos gerendahossz kiszámítása</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CalculatorInput
                        label="Épület Fél-fesztávolsága (L_v, m)"
                        step="0.1"
                        value={rSpan}
                        onChange={setRSpan}
                        placeholder="pl. 4.0"
                        helpText="A gerinc és az oldalfal (szelemen) közötti vízszintes távolság"
                      />
                      <CalculatorInput
                        label="Tető Dőlésszöge (α, fok °)"
                        step="1"
                        value={rAngle}
                        onChange={setRAngle}
                        placeholder="pl. 35"
                        helpText="Jellemző magastető dőlésszög: 25° - 45°"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <CalculatorInput
                        label="Eresz Vízszintes Túlnyúlása (L_eresz, m)"
                        step="0.05"
                        value={rOverhang}
                        onChange={setROverhang}
                        placeholder="pl. 0.6"
                        helpText="A homlokzati fal síkján kívül eső eresznyúlás"
                      />

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Szarufa Tengelytáv (cm)</label>
                        <select
                          value={rSpacing}
                          onChange={(e) => setRSpacing(parseFloat(e.target.value) || 85)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value={75}>75 cm</option>
                          <option value={80}>80 cm</option>
                          <option value={85}>85 cm (Szabványos)</option>
                          <option value={90}>90 cm</option>
                          <option value={100}>100 cm</option>
                        </select>
                        <span className="text-[11px] text-gray-500 mt-1 block">Ácsszerkezeti tengelytáv</span>
                      </div>

                      <CalculatorInput
                        label="Tető Hossza (L_tető, m) [Opcionális]"
                        step="0.5"
                        value={rRoofLength}
                        onChange={setRRoofLength}
                        placeholder="pl. 10.0"
                        helpText="A szarufák összdarabszámának kiszámításához"
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN: REAL-TIME CALCULATION RESULTS (5 Cols) */}
              <div className="lg:col-span-5 bg-primary text-white rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-accent" size={18} />
                    <h3 className="text-base font-bold text-white">Eredmények &amp; Anyagkiírás</h3>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-gray-300">
                    MSZ Szabvány
                  </span>
                </div>

                {/* 1. BETON RESULTS */}
                {activeTab === 'concrete' && (!concreteCalc.isReady ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Info size={32} className="text-accent opacity-80" />
                    <h4 className="text-sm font-bold text-white">Add meg az adatokat a számításhoz</h4>
                    <p className="text-xs text-gray-300 max-w-xs">
                      Töltsd ki a hosszúság, szélesség és magasság mezőket a pontos beton- és zsaluzatigény kiszámításához.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                      <span className="text-gray-400 font-medium">Bruttó Betonigény (Veszteséggel):</span>
                      <div className="text-2xl font-black text-accent">{concreteCalc.grossVol} m³</div>
                      <p className="text-[11px] text-gray-400">Nettó térfogat: {concreteCalc.netVol} m³</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Cement (25kg zsák)</span>
                        <div className="text-base font-bold text-white">{concreteCalc.cementBags25kg} zsák</div>
                        <span className="text-[10px] text-gray-400">({concreteCalc.totalCementKg} kg)</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Sóder / Kavics</span>
                        <div className="text-base font-bold text-white">{concreteCalc.soderTons} tonna</div>
                        <span className="text-[10px] text-gray-400">(~{concreteCalc.soderM3} m³)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Zsaluzási Felület</span>
                        <div className="text-base font-bold text-accent">{concreteCalc.formArea} m²</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Becsült Betonacél</span>
                        <div className="text-base font-bold text-accent">{concreteCalc.rebarKg} kg</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 2. MASONRY RESULTS */}
                {activeTab === 'masonry' && (!masonryCalc.isReady ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Info size={32} className="text-accent opacity-80" />
                    <h4 className="text-sm font-bold text-white">Add meg az adatokat a számításhoz</h4>
                    <p className="text-xs text-gray-300 max-w-xs">
                      Töltsd ki a fal hosszúságát és magasságát a téglaszám és habarcsigény kiszámításához.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Tégla / Blokkelem Igény</span>
                      <div className="text-3xl font-black text-accent">{masonryCalc.grossPcs} db</div>
                      <p className="text-[11px] text-gray-300">Nettó falfelület: {masonryCalc.netArea} m²</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Raklapszám</span>
                        <div className="text-base font-bold text-white">{masonryCalc.pallets} raklap</div>
                      </div>
                      {masonryCalc.isZsaluko ? (
                        <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                          <span className="text-gray-400">Kiöntőbeton</span>
                          <div className="text-base font-bold text-accent">{masonryCalc.zsalukoConcreteM3} m³</div>
                        </div>
                      ) : (
                        <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                          <span className="text-gray-400">Falazóhabarcs (25kg)</span>
                          <div className="text-base font-bold text-accent">{masonryCalc.mortarBags} zsák</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* 3. INSULATION RESULTS */}
                {activeTab === 'insulation' && (!insulationCalc.isReady ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Info size={32} className="text-accent opacity-80" />
                    <h4 className="text-sm font-bold text-white">Add meg az adatokat a számításhoz</h4>
                    <p className="text-xs text-gray-300 max-w-xs">
                      Adja meg a szigetelés vastagságát és a homlokzati felületet az eredő U-érték kiszámításához.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Eredő U-érték</span>
                        {insulationCalc.passesKNE ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            <CheckCircle2 size={12} /> MEGFELELT (KNE TNM)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40">
                            <AlertCircle size={12} /> NEM FELEL MEG
                          </span>
                        )}
                      </div>
                      <div className="text-3xl font-black text-accent">{insulationCalc.uValue} W/m²K</div>
                      <p className="text-[11px] text-gray-300">Magyar KNE energetikai küszöbérték: ≤ 0.24 W/m²K</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Hőszigetelő Táblák</span>
                        <div className="text-base font-bold text-white">{insulationCalc.boardPcs} db</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Ragasztó (25kg)</span>
                        <div className="text-base font-bold text-accent">{insulationCalc.adhesiveBags} zsák</div>
                      </div>
                      <div className="bg-white/5 col-span-2 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Üvegszövet Háló</span>
                        <div className="text-base font-bold text-white">{insulationCalc.meshM2} m² (10% átlapolással)</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 4. TILING RESULTS */}
                {activeTab === 'tiling' && (!tilingCalc.isReady ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Info size={32} className="text-accent opacity-80" />
                    <h4 className="text-sm font-bold text-white">Add meg az adatokat a számításhoz</h4>
                    <p className="text-xs text-gray-300 max-w-xs">
                      Adja meg a nettó felületet a burkolat, csemperagasztó és vakolatigény kiszámításához.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Burkoló / Habarcs Anyagmennyiség</span>
                      {tilingType === 'tile' ? (
                        <div className="text-3xl font-black text-accent">{tilingCalc.tilesM2} m²</div>
                      ) : (
                        <div className="text-3xl font-black text-accent">{tilingCalc.screedBags} zsák</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {tilingType === 'tile' ? (
                        <>
                          <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                            <span className="text-gray-400">Csemperagasztó (25kg)</span>
                            <div className="text-base font-bold text-white">{tilingCalc.adhesiveBags} zsák</div>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                            <span className="text-gray-400">Fugázó Por</span>
                            <div className="text-base font-bold text-accent">{tilingCalc.groutKg} kg</div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                          <span className="text-gray-400">Szárazesztrich (25kg)</span>
                          <div className="text-base font-bold text-white">{tilingCalc.screedBags} zsák</div>
                        </div>
                      )}
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Mélyalapozó</span>
                        <div className="text-base font-bold text-white">{tilingCalc.primerLiters} liter</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 5. DRYWALL RESULTS */}
                {activeTab === 'drywall' && (!drywallCalc.isReady ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Info size={32} className="text-accent opacity-80" />
                    <h4 className="text-sm font-bold text-white">Add meg az adatokat a számításhoz</h4>
                    <p className="text-xs text-gray-300 max-w-xs">
                      Adja meg a gipszkarton szerkezet felületét a táblaszám és profilmennyiség kiszámításához.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Gipszkarton Táblák (120x200 cm)</span>
                      <div className="text-3xl font-black text-accent">{drywallCalc.boardCount} db</div>
                      <p className="text-[11px] text-gray-300">{drywallCalc.boardNames}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">CW / CD Főprofilok</span>
                        <div className="text-base font-bold text-white">{drywallCalc.mainProfileFm} fm</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">UW / UD Profilok</span>
                        <div className="text-base font-bold text-white">{drywallCalc.perimeterProfileFm} fm</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Hézagoló Gipsz</span>
                        <div className="text-base font-bold text-accent">{drywallCalc.jointFillerKg} kg</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Gipszkarton Csavar</span>
                        <div className="text-base font-bold text-white">{drywallCalc.screwsPcs} db</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 6. ROOFING RESULTS */}
                {activeTab === 'roofing' && (!roofingCalc.isReady ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Info size={32} className="text-accent opacity-80" />
                    <h4 className="text-sm font-bold text-white">Add meg az adatokat a számításhoz</h4>
                    <p className="text-xs text-gray-300 max-w-xs">
                      Adja meg az alapterületet és a dőlésszöget a valós tetőfelület és cserépszükséglet kiszámításához.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Valós Ferde Tetőfelület</span>
                      <div className="text-3xl font-black text-accent">{roofingCalc.actualRoofArea} m²</div>
                      <p className="text-[11px] text-gray-300">Dőlésszög: {roofAngle}° | Alapterület: {roofFootprint} m²</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Cserép Szükséglet</span>
                        <div className="text-base font-bold text-white">{roofingCalc.totalTiles} db</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Kúpcserép</span>
                        <div className="text-base font-bold text-white">{roofingCalc.ridgeTiles} db</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Tetőléc</span>
                        <div className="text-base font-bold text-accent">{roofingCalc.battenFm} fm</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Páraáteresztő Fólia</span>
                        <div className="text-base font-bold text-white">{roofingCalc.membraneM2} m²</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 7. RAFTER RESULTS */}
                {activeTab === 'rafter' && (!rafterCalc.isReady ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3 bg-white/5 border border-white/10 rounded-2xl">
                    <Info size={32} className="text-accent opacity-80" />
                    <h4 className="text-sm font-bold text-white">Add meg az adatokat a számításhoz</h4>
                    <p className="text-xs text-gray-300 max-w-xs">
                      Adja meg a fél-fesztávolságot és a dőlésszöget a szarufahossz kiszámításához.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-xs text-gray-400 font-medium">Szarufa Szükséges Ferde Hossza (L_szarufa)</span>
                      <div className="text-3xl font-black text-accent">
                        {rafterCalc.rafterLength > 0 ? `${rafterCalc.rafterLength} m` : '0 m'}
                      </div>
                      <p className="text-[11px] text-gray-300">
                        {safeNum(rSpan) > 0 && safeNum(rAngle) > 0
                          ? `Teljes vízszintes vetület: ${rafterCalc.totalHoriz} m | cos(${rAngle}°) = ${rafterCalc.cosAlpha}`
                          : 'Adja meg a fesztávolságot és a dőlésszöget'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Szabvány Gerendahossz</span>
                        <div className="text-base font-bold text-white">
                          {rafterCalc.stdStockLength > 0 ? `${rafterCalc.stdStockLength}.0 m` : '-'}
                        </div>
                        <span className="text-[10px] text-gray-400">(Tüzépi rendelési szálhossz)</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                        <span className="text-gray-400">Ferde Hossz Eresz Nélkül</span>
                        <div className="text-base font-bold text-white">
                          {safeNum(rSpan) > 0 && safeNum(rAngle) > 0 && rafterCalc.cosAlpha > 0
                            ? `${(safeNum(rSpan) / rafterCalc.cosAlpha).toFixed(2)} m`
                            : '-'}
                        </div>
                        <span className="text-[10px] text-gray-400">(Szelemenek közötti táv)</span>
                      </div>
                    </div>

                    {rafterCalc.totalRaftersBothSides > 0 && (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                          <span className="text-gray-400">Szarufák (1 tetősík)</span>
                          <div className="text-base font-bold text-accent">{rafterCalc.raftersPerSide} db</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl space-y-0.5 border border-white/5">
                          <span className="text-gray-400">Összes Szarufa (Nyeregtető)</span>
                          <div className="text-base font-bold text-accent">{rafterCalc.totalRaftersBothSides} db</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="pt-2">
                  <button
                    disabled={!isCurrentCalcReady}
                    onClick={handleCopySummary}
                    className={`w-full py-3 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                      isCurrentCalcReady
                        ? 'bg-accent hover:bg-accent-hover text-primary active:scale-95 cursor-pointer'
                        : 'bg-white/10 text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied
                      ? 'Teljes Számítás Másolva!'
                      : isCurrentCalcReady
                      ? 'Anyaglista Kimásolása Hozzávalókkal'
                      : 'Add meg az adatokat a másoláshoz'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
