import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type Course, type Lesson, type QuizQuestion, type UserCertificate } from '../lib/supabase';

export interface DetailedCourse {
  course: Course;
  lessons: Lesson[];
  questions: QuizQuestion[];
  flashcards?: Flashcard[];
}

export type InteractiveStepType =
  | 'info'
  | 'single_choice'
  | 'multiple_choice'
  | 'image_choice'
  | 'error_identification'
  | 'reorder';

export interface InteractiveStep {
  id: string;
  lesson_id: string;
  sequence_order: number;
  type: InteractiveStepType;
  title: string;
  description?: string;
  image_url?: string;
  diagram_url?: string;
  options?: string[];
  correct_option_index?: number;
  correct_option_indices?: number[];
  image_options?: { id: string; image_url: string; label: string; is_correct: boolean }[];
  error_options?: { id: string; label: string; is_error: boolean; explanation: string }[];
  reorder_items?: { id: string; text: string; correct_position: number }[];
  explanation?: string;
}

export type FlashcardState = 'new' | 'learning' | 'mastered' | 'review';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string;
  course_id: string;
  knowledge_id?: string;
  sequence_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface UserFlashcardProgressItem {
  card_id: string;
  state: FlashcardState;
  last_reviewed: string;
  review_count: number;
  correct_count: number;
  incorrect_count: number;
}

export type UserFlashcardProgressMap = Record<string, UserFlashcardProgressItem>;

export interface QuizSubmissionResult {
  passed: boolean;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  certificate?: UserCertificate;
}

export interface EducationData {
  courses: Course[];
  lessons: Record<string, Lesson[]>;
  questions: Record<string, QuizQuestion[]>;
  flashcards?: Flashcard[];
  interactive_steps?: Record<string, InteractiveStep[]>;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  tradeId: string;
  tradeName: string;
  stepsCount: number;
  level: string;
  badgeColor: string;
  courseIds: string[];
  nextCareerStep: string;
}

export const DEFAULT_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Monolitikus Beton- és Szerkezetépítés Mesterfogásai',
    slug: 'monolitikus-beton-mesterfogasai',
    description: 'Átfogó képzés a zsaluzási rendszerektől az öntömörödő beton technológiáig és utókezelésig.',
    category: 'Szerkezetépítés',
    difficulty: 'intermediate',
    duration_hours: 6,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-2',
    title: 'Energiahatékony Falazási & Szigetelési Rendszerek',
    slug: 'energiahatekony-falazas-szigeteles',
    description: 'Korszerű hő- és hangszigetelési megoldások, szárazépítészet és homlokzati rendszerek.',
    category: 'Szigetelés & Falazás',
    difficulty: 'beginner',
    duration_hours: 4,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-3',
    title: 'Építőipari Biztonságtechnika és Munkavédelmi Szabványok 2026',
    slug: 'biztonsagtechnika-munkavedelem-2026',
    description: 'Kötelező munkavédelmi és biztonságtechnikai szabályok magasépítési helyszíneken.',
    category: 'Munkavédelem',
    difficulty: 'beginner',
    duration_hours: 8,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-4',
    title: 'Szerkezetépítési és Zsaluzási Alapok',
    slug: 'szerkezetepitesi-es-zsaluzasi-alapok',
    description: 'A vázszerkezetek, pillérek és monolit födémek alapvető zsaluzási és dúcolási technikái.',
    category: 'Szerkezetépítés',
    difficulty: 'beginner',
    duration_hours: 5,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-5',
    title: 'Okosotthon & Villanyszerelési Szabványok 2026',
    slug: 'okosotthon-villanyszereles-2026',
    description: 'Gyengeáramú és erősáramú hálózatépítés, KNX rendszerek és érintésvédelmi előírások.',
    category: 'Épületgépészet',
    difficulty: 'master',
    duration_hours: 10,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-6',
    title: 'Modern Hideg- és Melegburkolási Technológia',
    slug: 'modern-burkolasi-technologia',
    description: 'Nagyformátumú kerámia lapok, kenhető vízszigetelések és szintkiegyenlítési módszerek.',
    category: 'Szigetelés & Falazás',
    difficulty: 'intermediate',
    duration_hours: 5,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_LEARNING_PATHS: LearningPath[] = [
  {
    id: 'path-1',
    title: 'Kezdő kőművesből szerkezetépítő mester',
    description: 'Végighaladás a falazási alapoktól a zsaluzáson át a monolit vasbeton szerkezetekig.',
    tradeId: 'komuves',
    tradeName: 'Kőműves',
    stepsCount: 3,
    level: 'Alaptól Mesterig',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    courseIds: ['course-2', 'course-4', 'course-1'],
    nextCareerStep: 'Művezető / Brigádvezető',
  },
  {
    id: 'path-2',
    title: 'Munkavédelmi és biztonsági alapismeretek',
    description: 'Egyéni védőeszközök, állványozási szabályzat és balesetmegelőzés magasépítésen.',
    tradeId: 'munkavedelem',
    tradeName: 'Kötelező Munkavédelem',
    stepsCount: 2,
    level: 'Alapszint',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    courseIds: ['course-3'],
    nextCareerStep: 'Munkavédelmi Megbízott / Technikus',
  },
  {
    id: 'path-3',
    title: 'Energiahatékony és fenntartható építés',
    description: 'Korszerű homlokzati hőszigetelés, hőhídmentes csomópontok és szárazépítészet.',
    tradeId: 'epuletgepesz',
    tradeName: 'Szigetelő & Energetikus',
    stepsCount: 2,
    level: 'Középhaladó',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    courseIds: ['course-2', 'course-6'],
    nextCareerStep: 'Energetikai Szakértő Asszisztens',
  },
  {
    id: 'path-4',
    title: 'Szerkezetépítési alapok & zsaluzási technológia',
    description: 'Zsaluzat felállítása, betonozás, vasalási rajzok olvasása és teherbírási számítások.',
    tradeId: 'acs',
    tradeName: 'Zsaluzó Ács & Szerkezetépítő',
    stepsCount: 2,
    level: 'Középhaladó',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    courseIds: ['course-4', 'course-1'],
    nextCareerStep: 'Szerkezetépítő Építésvezető',
  },
];

export const DEFAULT_LESSONS: Record<string, Lesson[]> = {
  'course-1': [
    {
      id: 'l-1',
      course_id: 'course-1',
      title: '1. Lecke: Zsaluzatok és Dúcolási Szabályok',
      sequence_order: 1,
      content: 'A zsalurendszerek teherbírása, biztonsági tényezői és zsaluolajozási technológiák.',
      video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      created_at: new Date().toISOString(),
    },
    {
      id: 'l-2',
      course_id: 'course-1',
      title: '2. Lecke: Öntömörödő Beton (SCC) Betonalapok',
      sequence_order: 2,
      content: 'Mi az az Öntömörödő Beton, hogyan viselkedik vibrálás nélkül?',
      video_url: null,
      created_at: new Date().toISOString(),
    },
  ],
};

export const DEFAULT_QUESTIONS: Record<string, QuizQuestion[]> = {
  'course-1': [
    {
      id: 'q-1',
      quiz_id: 'quiz-1',
      question: 'Mi a legfontosabb jellemzője az Öntömörödő Betonnak (SCC)?',
      options_json: [
        'Vibrálást igényel 15 percen át',
        'Saját súlya alatt tömörödik vibrálás nélkül',
        'Nem tartalmaz cementet',
        'Kizárólag fagypont alatt köthet',
      ],
      correct_option_index: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'q-2',
      quiz_id: 'quiz-1',
      question: 'Melyik lépés elengedhetetlen a beton friss szilárdulási szakaszában?',
      options_json: ['Azonnali terhelés', 'Párásítás és utókezelő fedés', 'Hordozható csiszolás', 'Tűzihorganyzás'],
      correct_option_index: 1,
      created_at: new Date().toISOString(),
    },
  ],
};

export const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    question: 'Milyen mélyre kell behajtani a gipszkarton csavart?',
    answer: 'A csavar fejének a gipszkarton papírfelületét 0,5–1,0 mm-re kell besüllyesztenie anélkül, hogy a papírt átszakítaná.',
    topic: 'Szárazépítészet & Gipszkarton',
    course_id: 'course-2',
    sequence_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc-2',
    question: 'Mekkora a gipszkarton válaszfalak CW profiljainak tipikus tengelytávolsága?',
    answer: 'Tipikusan 600 mm (csempézett felületeknél vagy dupla kartonozásnál 400 mm is lehet).',
    topic: 'Szárazépítészet & Gipszkarton',
    course_id: 'course-2',
    sequence_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc-3',
    question: 'Mi a legfontosabb jellemzője az Öntömörödő Betonnak (SCC)?',
    answer: 'A saját súlya alatt tömörödik, és nem igényel mechanikai vibrálást a zsaluzat teljes kitöltéséhez.',
    topic: 'Szerkezetépítés & Beton',
    course_id: 'course-1',
    sequence_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc-4',
    question: 'Milyen hőmérséklet felett kötelező a friss beton párazáró utókezelése?',
    answer: '+25°C feletti hőmérsékleten, közvetlen napsugárzás és szél esetén azonnali párazáró fedés vagy locsolás szükséges.',
    topic: 'Szerkezetépítés & Beton',
    course_id: 'course-1',
    sequence_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc-5',
    question: 'Milyen magas építésnél kötelező a védősisak és leesés elleni egyéni védőeszköz?',
    answer: '2 méter feletti munkamagasság esetén, vagy ha a kicsúszás / kiesés veszélye fennáll.',
    topic: 'Munkavédelem',
    course_id: 'course-3',
    sequence_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fc-6',
    question: 'Milyen rétegvastagságban kell felhordani a kenhető vízszigetelést vizesblokkokban?',
    answer: 'Két rétegben legalább 1,0–1,5 mm száraz rétegvastagságig, a sarkokban hajlaterősítő szalaggal.',
    topic: 'Szigetelés & Burkolás',
    course_id: 'course-6',
    sequence_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_INTERACTIVE_STEPS: Record<string, InteractiveStep[]> = {
  'l-1': [
    {
      id: 'step-1-1',
      lesson_id: 'l-1',
      sequence_order: 1,
      type: 'info',
      title: '1. Lépés: Zsaluzati Rendszerek & Teherbírás',
      description: 'A zsaluzat a friss beton ideiglenes formája és támasztószerkezete. Elsődleges feladata a biztonságos teherbírás és a méretpontosság szilárdulásig.',
      image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'step-1-2',
      lesson_id: 'l-1',
      sequence_order: 2,
      type: 'single_choice',
      title: '2. Lépés: Zsaluzati Hidrosztatikai Nyomás',
      description: 'Melyik tényező határozza meg leginkább a friss beton zsalura gyakorolt oldalnyomását?',
      options: [
        'A betonozási emelkedési sebesség és a frissbeton hőmérséklete',
        'A zsaluolaj színe és márkája',
        'A cementzsákok tárolási helye',
      ],
      correct_option_index: 0,
      explanation: 'A betonozási emelkedési sebesség és a hőmérséklet határozza meg, hogy a beton mikor kezd el kötni és csökken a zsaluzatra ható hidrosztatikai nyomás.',
    },
    {
      id: 'step-1-3',
      lesson_id: 'l-1',
      sequence_order: 3,
      type: 'reorder',
      title: '3. Lépés: Szerkezetépítési Folyamat Sorrendje',
      description: 'Rendezd helyes kivitelezési sorrendbe a zsaluzási és betonozási műveleteket!',
      reorder_items: [
        { id: 'item-1', text: 'Tengelyek és alapvonalak geometriai kitűzése', correct_position: 1 },
        { id: 'item-2', text: 'Zsaluhéj portalanítása és formaleválasztó olajozása', correct_position: 2 },
        { id: 'item-3', text: 'Vasalás elhelyezése és műanyag távtartók beállítása', correct_position: 3 },
        { id: 'item-4', text: 'Zsaluzat zárása, dúcok rögzítése és betonozás', correct_position: 4 },
      ],
      explanation: 'Helyes sorrend: 1. Kitűzés → 2. Zsaluolajozás → 3. Vasalás és távtartók → 4. Zárás és dúcolás.',
    },
    {
      id: 'step-1-4',
      lesson_id: 'l-1',
      sequence_order: 4,
      type: 'error_identification',
      title: '4. Lépés: Szerkezetépítési Hiba Azonosítása',
      description: 'Vizsgáld meg az alábbi szerkezetépítési helyzetet és válaszd ki a hibás kivitelezést!',
      error_options: [
        {
          id: 'err-1',
          label: 'A vasalás távtartó nélkül közvetlenül a zsaluhéjra fekszik',
          is_error: true,
          explanation: 'Hiba! Távtartók nélkül nem alakul ki a kötelező betonfedés (min. 25-35 mm), ami a betonacél gyors korróziójához és a szerkezet tönkremeneteléhez vezet.',
        },
        {
          id: 'err-2',
          label: 'Minősített műanyag vagy beton távtartó kerekek elhelyezése 50 cm-enként',
          is_error: false,
          explanation: 'Ez a szabályos kivitelezési eljárás.',
        },
      ],
      explanation: 'A távtartók elhagyása miatti betonfedési hiány a leggyakoribb szerkezeti hiba a magasépítésben.',
    },
  ],
};

export const DEFAULT_EDUCATION_DATA: EducationData = {
  courses: DEFAULT_COURSES,
  lessons: DEFAULT_LESSONS,
  questions: DEFAULT_QUESTIONS,
  flashcards: DEFAULT_FLASHCARDS,
  interactive_steps: DEFAULT_INTERACTIVE_STEPS,
};

const STORAGE_KEY = 'epitotudas_education_data_v1';
const SUPABASE_COURSES_ID = '00000000-0000-0000-0000-000000000007';

declare global {
  interface Window {
    __GLOBAL_EDUCATION_DATA__?: EducationData;
  }
}

export function getEducationData(): EducationData {
  try {
    if (typeof window !== 'undefined' && window.__GLOBAL_EDUCATION_DATA__) {
      return window.__GLOBAL_EDUCATION_DATA__;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.courses)) {
        const data: EducationData = {
          courses: parsed.courses || DEFAULT_COURSES,
          lessons: { ...DEFAULT_LESSONS, ...(parsed.lessons || {}) },
          questions: { ...DEFAULT_QUESTIONS, ...(parsed.questions || {}) },
          flashcards: parsed.flashcards && Array.isArray(parsed.flashcards) ? parsed.flashcards : DEFAULT_FLASHCARDS,
          interactive_steps: { ...DEFAULT_INTERACTIVE_STEPS, ...(parsed.interactive_steps || {}) },
        };
        if (typeof window !== 'undefined') window.__GLOBAL_EDUCATION_DATA__ = data;
        return data;
      }
    }
  } catch (err) {
    console.error('Hiba a képzési adatok betöltésekor:', err);
  }

  if (typeof window !== 'undefined') window.__GLOBAL_EDUCATION_DATA__ = DEFAULT_EDUCATION_DATA;
  return DEFAULT_EDUCATION_DATA;
}

export function saveEducationData(data: EducationData): void {
  try {
    if (typeof window !== 'undefined') {
      window.__GLOBAL_EDUCATION_DATA__ = data;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('education-data-changed'));

    void (async () => {
      try {
        await supabase.from('categories').upsert({
          id: SUPABASE_COURSES_ID,
          name: '__SYSTEM_CONFIG_COURSES__',
          slug: 'system-courses-config',
          description: JSON.stringify(data),
          article_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
      } catch (err) {
        console.warn('Supabase courses cloud sync info:', err);
      }
    })();
  } catch (err) {
    console.error('Hiba a képzési adatok mentésekor:', err);
  }
}

export async function fetchEducationDataFromCloud(): Promise<EducationData | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('description')
      .eq('id', SUPABASE_COURSES_ID)
      .maybeSingle();

    if (!error && data?.description && data.description.startsWith('{')) {
      const parsed = JSON.parse(data.description);
      if (parsed && Array.isArray(parsed.courses)) {
        const eduData: EducationData = {
          courses: parsed.courses || DEFAULT_COURSES,
          lessons: { ...DEFAULT_LESSONS, ...(parsed.lessons || {}) },
          questions: { ...DEFAULT_QUESTIONS, ...(parsed.questions || {}) },
          flashcards: parsed.flashcards && Array.isArray(parsed.flashcards) ? parsed.flashcards : DEFAULT_FLASHCARDS,
          interactive_steps: { ...DEFAULT_INTERACTIVE_STEPS, ...(parsed.interactive_steps || {}) },
        };
        if (typeof window !== 'undefined') {
          window.__GLOBAL_EDUCATION_DATA__ = eduData;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(eduData));
          window.dispatchEvent(new Event('education-data-changed'));
        }
        return eduData;
      }
    }
  } catch (err) {
    console.warn('Cloud education data fetch info:', err);
  }
  return null;
}

export function useEducationData(): EducationData {
  const [eduData, setEduData] = useState<EducationData>(() => getEducationData());

  useEffect(() => {
    function handleChange() {
      setEduData(getEducationData());
    }
    handleChange();

    void fetchEducationDataFromCloud().then((cloudData) => {
      if (cloudData) setEduData(cloudData);
    });

    window.addEventListener('education-data-changed', handleChange);
    return () => window.removeEventListener('education-data-changed', handleChange);
  }, []);

  return eduData;
}

const USER_CERTIFICATES_STORE: Map<string, UserCertificate[]> = new Map();

export async function listCourses(category?: string): Promise<Course[]> {
  const eduData = getEducationData();
  let list = eduData.courses;
  if (category && category !== 'all') list = list.filter((c) => c.category === category);
  return list;
}

export async function getCourseDetails(courseId: string): Promise<DetailedCourse> {
  const eduData = getEducationData();
  const course = eduData.courses.find((c) => c.id === courseId) || eduData.courses[0] || DEFAULT_COURSES[0];
  const lessons = eduData.lessons[course.id] || DEFAULT_LESSONS[course.id] || [];
  const questions = eduData.questions[course.id] || DEFAULT_QUESTIONS[course.id] || [];
  const allCards = eduData.flashcards || DEFAULT_FLASHCARDS;
  const flashcards = allCards.filter((fc) => fc.course_id === course.id && fc.is_active);

  return {
    course,
    lessons,
    questions,
    flashcards,
  };
}

export async function submitQuizAnswers(
  userId: string,
  courseId: string,
  selectedAnswers: Record<string, number>
): Promise<QuizSubmissionResult> {
  const details = await getCourseDetails(courseId);
  const questions = details.questions;

  let correctCount = 0;
  questions.forEach((q) => {
    if (selectedAnswers[q.id] === q.correct_option_index) {
      correctCount += 1;
    }
  });

  const totalQuestions = questions.length || 1;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercentage >= 75;

  let certificate: UserCertificate | undefined = undefined;

  if (passed) {
    const certItem: UserCertificate = {
      id: `cert-${Date.now()}`,
      user_id: userId,
      course_id: courseId,
      score_achieved: scorePercentage,
      certificate_code: `EPITO-CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      issued_at: new Date().toISOString(),
    };
    certificate = certItem;

    const userCerts = USER_CERTIFICATES_STORE.get(userId) || [];
    userCerts.push(certItem);
    USER_CERTIFICATES_STORE.set(userId, userCerts);
  }

  return {
    passed,
    scorePercentage,
    correctCount,
    totalQuestions,
    certificate,
  };
}

export async function getUserCertificates(userId: string): Promise<UserCertificate[]> {
  return USER_CERTIFICATES_STORE.get(userId) || [];
}

// -----------------------------------------------------------------------------
// FLASHCARDS & INTERACTIVE STEPS SERVICES
// -----------------------------------------------------------------------------

const FLASHCARD_PROGRESS_STORAGE_PREFIX = 'epitotudas_flashcard_prog_';

export function getUserFlashcardProgress(userId: string): UserFlashcardProgressMap {
  try {
    const key = `${FLASHCARD_PROGRESS_STORAGE_PREFIX}${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveUserFlashcardProgress(userId: string, progress: UserFlashcardProgressMap): void {
  try {
    const key = `${FLASHCARD_PROGRESS_STORAGE_PREFIX}${userId}`;
    localStorage.setItem(key, JSON.stringify(progress));
    window.dispatchEvent(new Event('flashcard-progress-changed'));
  } catch (err) {
    console.error('Hiba a tanulókártya haladás mentésekor:', err);
  }
}

export function recordFlashcardReview(
  userId: string,
  cardId: string,
  knewIt: boolean
): UserFlashcardProgressMap {
  const current = getUserFlashcardProgress(userId);
  const existing = current[cardId] || {
    card_id: cardId,
    state: 'new' as FlashcardState,
    last_reviewed: new Date().toISOString(),
    review_count: 0,
    correct_count: 0,
    incorrect_count: 0,
  };

  const reviewCount = existing.review_count + 1;
  const correctCount = existing.correct_count + (knewIt ? 1 : 0);
  const incorrectCount = existing.incorrect_count + (knewIt ? 0 : 1);

  let newState: FlashcardState = existing.state;

  if (knewIt) {
    if (existing.state === 'new' || existing.state === 'learning' || existing.state === 'review') {
      newState = correctCount >= 2 ? 'mastered' : 'learning';
    } else {
      newState = 'mastered';
    }
  } else {
    newState = 'review';
  }

  current[cardId] = {
    card_id: cardId,
    state: newState,
    last_reviewed: new Date().toISOString(),
    review_count: reviewCount,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
  };

  saveUserFlashcardProgress(userId, current);
  return current;
}

export function getAllFlashcards(courseId?: string): Flashcard[] {
  const data = getEducationData();
  const list = data.flashcards || DEFAULT_FLASHCARDS;
  if (courseId && courseId !== 'all') {
    return list.filter((fc) => fc.course_id === courseId);
  }
  return list;
}

export function saveFlashcard(card: Flashcard): void {
  const data = getEducationData();
  const currentCards = data.flashcards || DEFAULT_FLASHCARDS;

  const existingIdx = currentCards.findIndex((c) => c.id === card.id);
  let updated: Flashcard[] = [];
  if (existingIdx >= 0) {
    updated = currentCards.map((c) => (c.id === card.id ? card : c));
  } else {
    updated = [card, ...currentCards];
  }

  saveEducationData({ ...data, flashcards: updated });
}

export function deleteFlashcard(cardId: string): void {
  const data = getEducationData();
  const currentCards = data.flashcards || DEFAULT_FLASHCARDS;
  const updated = currentCards.filter((c) => c.id !== cardId);
  saveEducationData({ ...data, flashcards: updated });
}

export function getInteractiveStepsForLesson(lessonId: string): InteractiveStep[] {
  const data = getEducationData();
  const stepsMap = data.interactive_steps || DEFAULT_INTERACTIVE_STEPS;
  return stepsMap[lessonId] || DEFAULT_INTERACTIVE_STEPS[lessonId] || [];
}

export function saveInteractiveStepsForLesson(lessonId: string, steps: InteractiveStep[]): void {
  const data = getEducationData();
  const stepsMap = data.interactive_steps || DEFAULT_INTERACTIVE_STEPS;
  const updatedMap = {
    ...stepsMap,
    [lessonId]: steps,
  };
  saveEducationData({ ...data, interactive_steps: updatedMap });
}
