import { useEffect, useState } from 'react';
import {
  Compass,
  ChevronRight,
  Layers,
  HardHat,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Sparkles,
  Award,
  CheckCircle2,
  RotateCcw,
  Hammer,
  Maximize2,
  Zap,
  Building,
  HelpCircle,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { LEARNING_PATHS_DATA, type LearningPathItem } from '../data/learningPathsData';

interface LearningPathsPageProps {
  onNavigate: (page: string, params?: { slug?: string; quizId?: string }) => void;
}

type TradeOption = 'acs' | 'komuves' | 'burkolo' | 'villanyszerelo' | 'gipszkartonozo';

interface QuestionOption {
  text: string;
  subtext: string;
  trade: TradeOption;
}

interface CareerQuestion {
  id: number;
  question: string;
  description: string;
  options: QuestionOption[];
}

const CAREER_QUESTIONS: CareerQuestion[] = [
  {
    id: 1,
    question: 'Milyen típusú munkakörnyezetben érzed a leginkább elemedben magad?',
    description: 'Válaszd ki azt a közeget, ahol a legnagyobb lendülettel és örömmel tudnál dolgozni nap mint nap.',
    options: [
      {
        text: 'Szabad ég alatt, magasban és lenyűgöző faszerkezetek között',
        subtext: 'Szeretem a friss levegőt, a természetes faanyagot és a magaslati kihívásokat.',
        trade: 'acs',
      },
      {
        text: 'Építkezési helyszínen, robusztus tégla, beton és tartószerkezetek építésével',
        subtext: 'A masszív fizikai teremtés, az alapok és a szilárd falak emelése vonz.',
        trade: 'komuves',
      },
      {
        text: 'Beltérben, a látványos és milliméteres precizitást igénylő felületeken',
        subtext: 'A prémium kerámialapok, minták, geometriai pontosság és esztétika az én világom.',
        trade: 'burkolo',
      },
      {
        text: 'High-tech technológiai környezetben, intelligens áramkörök és hálózatok között',
        subtext: 'A láthatatlan rendszerek logikája, a villamosság és az okosotthonok érdekelnek.',
        trade: 'villanyszerelo',
      },
      {
        text: 'Modern belső terekben, tiszta és gyors könnyűszerkezetes téralakítással',
        subtext: 'Szeretem a dinamikus belsőépítészetet, válaszfalakat és látványos álmennyezeteket.',
        trade: 'gipszkartonozo',
      },
    ],
  },
  {
    id: 2,
    question: 'Melyik szerszám- és eszközcsoport kézbevétele töltene el a legnagyobb büszkeséggel?',
    description: 'A jó szakembert a szerszámairól és az eszköztudásáról is felismerik.',
    options: [
      {
        text: 'Körfűrész, ácsbárd, gerendák, ácsceruza és szarufa-jelölők',
        subtext: 'A fa megmunkálása kézi és gépi fűrészekkel a legszebb kézműves folyamat.',
        trade: 'acs',
      },
      {
        text: 'Kőműveskanál, vízmérték, habarcskeverő és zsaluzati szerelvények',
        subtext: 'A habarcs és a szintezés kézi ritmusa hozza létre az igazi épületfalakat.',
        trade: 'komuves',
      },
      {
        text: 'Precíziós csempevágó gép, lézeres szintező, fugázók és ékes szintezőrendszerek',
        subtext: 'A milliméteres illesztésekhez a legpontosabb vágó és szintező berendezések kellenek.',
        trade: 'burkolo',
      },
      {
        text: 'Digitális multiméter, szigetelt szerszámkészlet, kábelcsupaszító és elosztószekrények',
        subtext: 'Mérések, feszültségmentesítés és modern elosztói vezérlőelemek telepítése.',
        trade: 'villanyszerelo',
      },
      {
        text: 'Fémprofil-lemezolló, akkus gipszkartoncsavarozó, lézeres vetítő és hézagoló simítók',
        subtext: 'A profilvázak gyors összeépítése és a gipszkarton lapok rögzítése igazi flow élmény.',
        trade: 'gipszkartonozo',
      },
    ],
  },
  {
    id: 3,
    question: 'Melyik erősségedre támaszkodsz a legbiztosabban a feladataid során?',
    description: 'Minden építőipari szakma eltérő gondolkodást és készségkészletet kíván meg.',
    options: [
      {
        text: 'Kiváló egyensúlyérzék, térlátás és magabiztosság nagy magasságokban',
        subtext: 'Nem szédülök a magasban, és fejben látom a bonyolult tetőszerkezeti metszeteket.',
        trade: 'acs',
      },
      {
        text: 'Fizikai állóképesség, szívós kitartás és alapos szint- és függőzés',
        subtext: 'Képes vagyok egész nap egyenletes ritmusban, hibátlan minőségben falazni.',
        trade: 'komuves',
      },
      {
        text: 'Maximalizmus, esztétikai arányérzék és türelem a finom részletekhez',
        subtext: 'Minden lapnak és fugavonalnak hajszálpontosan a helyén kell lennie.',
        trade: 'burkolo',
      },
      {
        text: 'Logikus, analitikus gondolkodásmód és szigorú biztonsági fegyelem',
        subtext: 'Rendszerszinten gondolkodom, és a villamos szabványokat maximálisan betartom.',
        trade: 'villanyszerelo',
      },
      {
        text: 'Gyorsaság, tiszta munkavégzés és kreatív belsőépítészeti formázás',
        subtext: 'Hatékonyan térelválasztok, dobozolok és sima, festésre kész felületeket adok át.',
        trade: 'gipszkartonozo',
      },
    ],
  },
  {
    id: 4,
    question: 'Milyen végeredményre lennél a legbüszkébb egy építési munka lezárásakor?',
    description: 'Képzeld el, hogy kész az épület, és megállsz előtte vagy benne:',
    options: [
      {
        text: 'Egy komplett családi ház vagy műemlék épület impozáns, látszó faszerkezetű fedélszékére',
        subtext: 'Az ácsolt tetőszerkezet évtizedekig koronázza meg az egész épületet.',
        trade: 'acs',
      },
      {
        text: 'Egy szilárd, egyenes, stabil teherhordó épületvázra és időtálló kőműves szerkezetre',
        subtext: 'Tudom, hogy az én munkám adja az egész ház stabilitását és biztonságát.',
        trade: 'komuves',
      },
      {
        text: 'Egy luxuskategóriás, nagyméretű kerámialapokkal és hibátlan fugákkal burkolt modern térre',
        subtext: 'A belépők azonnal a szemüket gyönyörködtetik a csodás felületképzésben.',
        trade: 'burkolo',
      },
      {
        text: 'Egy automatizált okosotthon hibátlan villamos hálózatára és intelligens világításaira',
        subtext: 'Minden kapcsoló, szenzor, elosztó és védelmi relé zökkenőmentesen és biztonságosan működik.',
        trade: 'villanyszerelo',
      },
      {
        text: 'Egy többszintes álmennyezetes, rejtett világításos, modern akusztikai belső térre',
        subtext: 'A tágas terek tagolása és a letisztult gipszkarton formák modern eleganciát sugároznak.',
        trade: 'gipszkartonozo',
      },
    ],
  },
];

import type { LucideIcon } from 'lucide-react';

interface TradeRecommendationInfo {
  tradeId: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  strengths: string[];
  courseSlug: string;
  courseTitle: string;
  icon: LucideIcon;
}

const TRADE_RECOMMENDATIONS: Record<TradeOption, TradeRecommendationInfo> = {
  acs: {
    tradeId: 'acs',
    name: 'Ács és Tetőszerkezet-építő',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    tagline: 'A magasban végzett, látványos faszerkezetek mestere',
    description:
      'Természetes faanyagokkal dolgozol, tetőszerkezeteket, zsaluzatokat és teraszokat építesz stabil mérnöki szemlélettel. Kiváló egyensúlyérzéked és térlátásod az épületek fedélszékének kulcsembere tesz.',
    strengths: ['Magaslati magabiztosság', 'Kiváló térlátás és szögvágási pontosság', 'Faipari statikai és zsaluzási érzék'],
    courseSlug: 'szerkezetepitesi-alapok-es-zsaluzas',
    courseTitle: 'Szerkezetépítési alapok & zsaluzási technológia',
    icon: Hammer,
  },
  komuves: {
    tradeId: 'komuves',
    name: 'Kőműves és Szerkezetépítő',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
    tagline: 'Az épületek szilárd fundamentumának megalkotója',
    description:
      'Alapozástól a teherhordó falazatokon és monolit födémeken át minden építmény gerincét a te két kezed teremti meg. A hagyományos kőműves tudás és a modern zsaluzat-technológia biztosítja a házak évszázados stabilitását.',
    strengths: ['Erős fizikai kitartás', 'Tökéletes vízszint- és függőzés', 'Hosszú távú teherhordó tartósságra törekvés'],
    courseSlug: 'szerkezetepitesi-alapok-es-zsaluzas',
    courseTitle: 'Kezdő kőművesből szerkezetépítő mester',
    icon: Building,
  },
  burkolo: {
    tradeId: 'burkolo',
    name: 'Hideg- és Melegburkoló',
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    tagline: 'Az épületek látható esztétikájának művésze',
    description:
      'Milliméteres pontossággal alakítod a modern nagyméretű lapokat, prémium mozaikokat és melegburkolatokat. Te adod meg az épületek leglátványosabb, leginkább kézzelfogható felületi harmóniáját és vízszigetelését.',
    strengths: ['Precíziós szemmérték', 'Fejlett esztétikai arányérzék', 'Részletgazdag, türelmes kivitelezés'],
    courseSlug: 'energiahatekony-es-fenntarthato-epites',
    courseTitle: 'Korszerű felületképzés és fenntartható építés',
    icon: Maximize2,
  },
  villanyszerelo: {
    tradeId: 'villanyszerelo',
    name: 'Villanyszerelő & Épületautomatizáló',
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    tagline: 'Az intelligens otthonok és villamos hálózatok éltetője',
    description:
      'Áramkörök, elosztószekrények, energiatakarékos világítások és okosotthon vezérlések kiépítése a te szakterületed. A technológia iránti nyitottságod és a szabványok fegyelme elengedhetetlen a modern kor építményeiben.',
    strengths: ['Logikus, szisztematikus gondolkodás', 'Szigorú életvédelmi és biztonsági fegyelem', 'Intelligens okosotthonok és automatizálás iránti fogékonyság'],
    courseSlug: 'epitoipari-munkavedelem-es-allvanyozasi-biztonsag',
    courseTitle: 'Munkavédelmi és biztonsági alapismeretek',
    icon: Zap,
  },
  gipszkartonozo: {
    tradeId: 'gipszkartonozo',
    name: 'Gipszkartonozó & Szárazépítő',
    badge: 'bg-teal-100 text-teal-900 border-teal-300',
    tagline: 'A modern, gyors és kreatív belső téralakítás mestere',
    description:
      'Fém vázszerkezeteken alapuló könnyűszerkezetes válaszfalak, akusztikus és többszintes álmennyezetek, valamint rejtett világításos dobozolások kivitelezője. Tiszta, modern technológiával alkotsz belső tereket.',
    strengths: ['Gyors és tiszta szárazépítési folyamatok', 'Kreatív belsőépítészeti formaalkotás', 'Akusztikai és szigetelési rétegrendek magas szintű ismerete'],
    courseSlug: 'gipszkartonozas-es-szarazepitesi-alapismeretek',
    courseTitle: 'Gipszkartonozás és szárazépítési alapismeretek',
    icon: HardHat,
  },
};

export default function LearningPathsPage({ onNavigate }: LearningPathsPageProps) {
  useEffect(() => {
    document.title = 'Tanulási Útvonalak & Karrierlépcsők | ÉpítőTudás';
  }, []);

  // Career Quiz State
  const [quizState, setQuizState] = useState<'idle' | 'in_progress' | 'completed'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [tradeScores, setTradeScores] = useState<Record<TradeOption, number>>({
    acs: 0,
    komuves: 0,
    burkolo: 0,
    villanyszerelo: 0,
    gipszkartonozo: 0,
  });
  const [recommendedTradeKey, setRecommendedTradeKey] = useState<TradeOption>('komuves');

  const handleStartPath = (path: LearningPathItem) => {
    if (path.courseIds.length > 0) {
      onNavigate('course-detail', { slug: path.courseIds[0] });
    } else {
      onNavigate('courses');
    }
  };

  const handleSelectOption = (trade: TradeOption) => {
    const nextScores = {
      ...tradeScores,
      [trade]: tradeScores[trade] + 1,
    };
    setTradeScores(nextScores);

    if (currentQuestionIndex + 1 < CAREER_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Find highest scoring trade
      let bestTrade: TradeOption = 'komuves';
      let highestScore = -1;
      (Object.keys(nextScores) as TradeOption[]).forEach((key) => {
        if (nextScores[key] > highestScore) {
          highestScore = nextScores[key];
          bestTrade = key;
        }
      });
      setRecommendedTradeKey(bestTrade);
      setQuizState('completed');
    }
  };

  const handleResetQuiz = () => {
    setTradeScores({
      acs: 0,
      komuves: 0,
      burkolo: 0,
      villanyszerelo: 0,
      gipszkartonozo: 0,
    });
    setCurrentQuestionIndex(0);
    setQuizState('idle');
  };

  const handleViewTrade = (tradeId: string) => {
    try {
      sessionStorage.setItem('epitotudas_selected_trade', tradeId);
    } catch {
      // fallback
    }
    onNavigate('paths');
  };

  const currentQ = CAREER_QUESTIONS[currentQuestionIndex];
  const recommendation = TRADE_RECOMMENDATIONS[recommendedTradeKey];
  const RecommendedIcon = recommendation.icon;

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => onNavigate('paths')}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              Pályák &amp; Képzések
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Tanulási Útvonalak &amp; Karrierlépcsők</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full uppercase tracking-wider">
                <Compass size={14} /> STRUKTURÁLT FEJLŐDÉS
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Tanulási Útvonalak &amp; Karrierlépcsők
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Kapcsold össze a szakmákat, képzéseket és a következő karrierlépést a sikeres előrelépésért.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('courses')}
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-primary text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <GraduationCap size={16} /> Képzések &amp; Kurzusok
              </button>
              <button
                onClick={() => onNavigate('careers')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
              >
                <Briefcase size={16} /> Állásajánlatok
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Ribbon Bar */}
      <SectionSubNav
        ariaLabel="Pályák navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Építőipari szakmák',
            page: 'paths',
            icon: <HardHat size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Tanulási Útvonalak & Karrierlépcsők',
            page: 'learning-paths',
            icon: <Layers size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Képzések & Kurzusok',
            page: 'courses',
            icon: <GraduationCap size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Karrier & Állások',
            page: 'careers',
            icon: <Briefcase size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* CAREER CHOICE QUIZ SECTION (TSK-P3-04) */}
        <section aria-labelledby="career-quiz-heading" className="w-full">
          {quizState === 'idle' && (
            <div className="bg-gradient-to-br from-primary via-primary-800 to-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl border border-primary-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent/40 rounded-full text-accent text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={14} /> PÁLYAORIENTÁCIÓS SZAKMAVÁLASZTÓ
                  </div>
                  <h2 id="career-quiz-heading" className="text-2xl md:text-3xl font-extrabold leading-tight">
                    Nem tudod, melyik építőipari szakma illik leginkább a te egyéniségedhez?
                  </h2>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                    Töltsd ki 4 kérdéses interaktív szakmaválasztó kvízünket! Rendszerünk a kedvenc munkakörnyezeted, szerszámaid és erősségeid alapján személyre szabott szakmát és képzési útvonalat ajánl.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-2">
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <HelpCircle size={14} className="text-accent" /> 4 életszerű kérdés
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <Award size={14} className="text-accent" /> Személyre szabott ajánlás
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <ChevronRight size={14} className="text-accent" /> 2 perces kitöltési idő
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-3">
                  <button
                    onClick={() => setQuizState('in_progress')}
                    className="px-8 py-4 bg-accent hover:bg-accent-hover text-primary font-black text-sm rounded-2xl shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                  >
                    <span>Kvíz indítása</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-center text-[11px] text-gray-400">Teljesen ingyenes &amp; azonnali eredmény</span>
                </div>
              </div>
            </div>
          )}

          {quizState === 'in_progress' && (
            <div className="bg-white border-2 border-primary/20 rounded-3xl p-6 md:p-10 shadow-xl space-y-8 animate-fadeIn">
              {/* Quiz Header & Progress */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-dark uppercase tracking-wider mb-1">
                    <Sparkles size={14} className="text-accent-dark" /> Kérdés {currentQuestionIndex + 1} / {CAREER_QUESTIONS.length}
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900">
                    {currentQ.question}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    {currentQ.description}
                  </p>
                </div>
                <button
                  onClick={handleResetQuiz}
                  className="self-start sm:self-center px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Mégse / Bezárás
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentQuestionIndex + 1) / CAREER_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-3.5">
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt.trade)}
                    className="w-full p-4 md:p-5 text-left bg-gray-50 hover:bg-primary/5 hover:border-primary/40 border border-gray-200 rounded-2xl transition-all flex items-start gap-4 cursor-pointer group hover:shadow-md"
                  >
                    <span className="shrink-0 w-8 h-8 rounded-xl bg-white border border-gray-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white text-gray-700 font-bold flex items-center justify-center text-xs transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div className="space-y-1">
                      <div className="font-bold text-sm md:text-base text-gray-900 group-hover:text-primary transition-colors">
                        {opt.text}
                      </div>
                      <div className="text-xs text-gray-500 leading-relaxed">
                        {opt.subtext}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {quizState === 'completed' && (
            <div className="bg-white border-2 border-primary rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-fadeIn">
              {/* Header with Badge */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 size={15} /> SZEMÉLYRE SZABOTT ÉRTÉKELÉS ELKÉSZÜLT
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900">
                    A hozzád legjobban passzoló szakma:
                  </h3>
                </div>

                <button
                  onClick={handleResetQuiz}
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-primary bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start md:self-center"
                >
                  <RotateCcw size={14} /> Teszt újrakezdése
                </button>
              </div>

              {/* Recommendation Hero Box */}
              <div className="bg-gradient-to-br from-slate-900 via-primary to-slate-900 text-white rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-xl">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent text-primary flex items-center justify-center shrink-0 shadow-lg">
                      <RecommendedIcon size={28} />
                    </div>
                    <div className="space-y-1.5">
                      <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border ${recommendation.badge}`}>
                        {recommendation.name}
                      </span>
                      <h4 className="text-2xl md:text-3xl font-extrabold text-white">
                        {recommendation.name}
                      </h4>
                      <p className="text-accent text-xs md:text-sm font-semibold">
                        {recommendation.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl self-start md:self-auto text-right">
                    <span className="text-[10px] text-gray-300 uppercase block font-semibold">Egyezés mértéke</span>
                    <span className="text-xl font-black text-accent">96%</span>
                  </div>
                </div>

                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  {recommendation.description}
                </p>

                {/* Strengths */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <span className="text-xs uppercase font-bold text-gray-300 tracking-wider">
                    Fő erősségeid ebben a szakmában:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {recommendation.strengths.map((str, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold text-gray-200">
                        <CheckCircle2 size={15} className="text-accent shrink-0" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Next Step Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Action 1: Explore Trade Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">1. LÉPÉS: SZAKMAI KÖVETELMÉNYEK</span>
                    <h5 className="font-extrabold text-base text-gray-900">
                      Ismerd meg a {recommendation.name} szakma szerszámait és jövőjét
                    </h5>
                    <p className="text-xs text-gray-600">
                      Részletes feladatleírások, szükséges kéziszerszámok, modern gépek és digitális jövőkép a Szakmák portálon.
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewTrade(recommendation.tradeId)}
                    className="w-full py-3 bg-primary hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Szakma adatlapjának megnyitása</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Action 2: Start Recommended Course */}
                <div className="bg-accent/5 border border-accent/30 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-accent-dark tracking-wider">2. LÉPÉS: AJÁNLOTT KÉPZÉS</span>
                    <h5 className="font-extrabold text-base text-gray-900">
                      {recommendation.courseTitle}
                    </h5>
                    <p className="text-xs text-gray-600">
                      Kezdd el most az ajánlott képzést, sajátítsd el a szakmai fogásokat interaktív fejezeteken és ellenőrző kvízeken keresztül.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('course-detail', { slug: recommendation.courseSlug })}
                    className="w-full py-3 bg-accent hover:bg-accent-hover text-primary font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <GraduationCap size={15} />
                    <span>Ajánlott képzés elindítása</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Existing Learning Paths Section */}
        <section aria-labelledby="paths-grid-heading" className="space-y-6">
          <div className="space-y-1">
            <h2 id="paths-grid-heading" className="text-2xl font-extrabold text-gray-900">
              Minden Elérhető Tanulási Útvonal
            </h2>
            <p className="text-sm text-gray-600">
              Válassz a szakmai karrierlépcsők közül és szerezz digitális tanúsítványt!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LEARNING_PATHS_DATA.map((path) => (
              <div
                key={path.id}
                className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 space-y-5 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-xl border ${path.badgeColor}`}>
                      {path.tradeName}
                    </span>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-xl">
                      {path.level}
                    </span>
                  </div>

                  <h3 className="text-lg md:text-xl font-extrabold text-gray-900 leading-snug">
                    {path.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                    {path.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="bg-primary/5 border border-primary/10 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-semibold">Következő karrierlépés:</span>
                    <span className="font-extrabold text-primary flex items-center gap-1.5">
                      {path.nextCareerStep} <ArrowRight size={14} />
                    </span>
                  </div>

                  <button
                    onClick={() => handleStartPath(path)}
                    className="w-full py-3 bg-primary hover:bg-primary-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <span>Útvonal elkezdése</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
