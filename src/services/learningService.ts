import type {
  LearningCourse,
  Quiz,
  QuizAttempt,
  Flashcard,
  CourseProgress,
  KeyTermItem,
} from '../lib/supabase';

// ── STORAGE KEYS ──
const COURSES_STORAGE_KEY = 'epitotudas_learning_courses_v1';
const QUIZZES_STORAGE_KEY = 'epitotudas_learning_quizzes_v1';
const FLASHCARDS_STORAGE_KEY = 'epitotudas_learning_flashcards_v1';
const PROGRESS_STORAGE_KEY = 'epitotudas_learning_progress_v1';
const ATTEMPTS_STORAGE_KEY = 'epitotudas_learning_attempts_v1';

// ── DEFAULT SEED COURSES ──
export const DEFAULT_COURSES: LearningCourse[] = [
  {
    id: 'course-1',
    title: 'Gipszkartonozás és Szárazépítési Alapismeretek',
    slug: 'gipszkartonozas-es-szarazepitesi-alapismeretek',
    excerpt: 'Átfogó oktatási tananyag a szárazépítészet alapjairól: UW/CW profilozás, lapválasztás, akusztika és glettelési szabványok.',
    content: 'Ez a tananyag lépésről lépésre vezeti be a tanulót a modern gipszkartonozási technológiákba és munkavédelmi előírásokba.',
    category_id: 'cat-1',
    category_name: 'Építési technológiák',
    subcategory_name: 'Szárazépítés',
    topic: 'Válaszfalak & Szerkezetépítés',
    difficulty: 'beginner',
    audience: 'everyone',
    estimated_time_minutes: 45,
    featured_image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    documents: [
      { id: 'cdoc-1', title: 'Szarazepitesi_Normagyujtemeny.pdf', file_url: '/docs/szarazepites_norma.pdf', doc_type: 'szabvany', file_size: '1.8 MB' },
    ],
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags: ['szárazépítés', 'gipszkarton', 'profilok', 'akusztika', 'glettelés'],
    author: 'ÉpítőTudás Oktatási Csapat',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    status: 'published',
    rejection_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    key_terms: [
      {
        id: 'kt-1',
        term: 'UW Profil',
        definition: 'Vízszintes vezetőprofil padlóra és mennyezetre a válaszfal nyomvonalának kijelöléséhez.',
        explanation: 'Mindig rezgéscsillapító PE akusztikai szalaggal kell rögzíteni az aljzatra.',
        example: 'UW 75/40/0.6 profil padlórögzítése 60 cm-es dübeltávolsággal.',
      },
      {
        id: 'kt-2',
        term: 'CW Profil',
        definition: 'Függőleges tartóprofil, amelyet az UW profilokba csúsztatva állítunk be 600 mm kiosztással.',
        explanation: 'A CW profilokat nem szabad mereven hozzácsavarozni az UW profilhoz a hőtágulás és szerkezeti dilatáció miatt.',
        example: 'CW 75 függőleges profil rögzítése 15 mm dilatációs hézaggal a födémnél.',
      },
      {
        id: 'kt-3',
        term: 'Impregnált Gipszkarton (RBI)',
        definition: 'Zöld színű, pára- és vízálló adalékolással készült gipszkarton lap nedves helyiségekbe.',
        explanation: 'Fürdőszobákban és konyhákban használandó, de közvetlen vízterhelésnél kenhető vízszigetelést is igényel.',
        example: '12.5 mm vastag RBI zöld kartonlap fürdőszobai válaszfalhoz.',
      },
    ],
    chapters: [
      {
        id: 'chap-1',
        title: '1. Fejezet: Profilozás és vázszerkezet kitűzése',
        summary: 'A pontos lézeres nyomvonal kijelölése és a keretprofilok rögzítése.',
        content: `A szárazépítészeti munkák első és legfontosabb lépése a pontos lézeres kitűzés. A padlóra, oldalfalakra és mennyezetre felrajzolt vonal adja meg a leendő válaszfal síkját.\n\n### UW és CW profilok feladata:\n- **UW profil**: Padló és mennyezeti vízszintes tartó.\n- **CW profil**: Függőleges vázprofil 600 mm tengelytávolsággal.\n\n> **🛑 BIZTONSÁG**: Profilvágáznál lemezvágó ollót használjunk, és mindig viseljünk munkavédelmi kesztyűt!`,
        estimated_minutes: 15,
        key_terms: [
          {
            id: 'kt-1',
            term: 'UW Profil',
            definition: 'Vízszintes vezetőprofil padlóra és mennyezetre a válaszfal nyomvonalának kijelöléséhez.',
            explanation: 'Mindig rezgéscsillapító PE akusztikai szalaggal kell rögzíteni az aljzatra.',
          },
        ],
      },
      {
        id: 'chap-2',
        title: '2. Fejezet: Szigetelés és lapozás szabályai',
        summary: 'Hang- és hőszigetelő gyapot elhelyezése, valamint az eltolt kartonozási szabály.',
        content: `A vázszerkezet felállítása után helyezzük be a 75 mm vastag ásványgyapot szigetelést.\n\n### Eltolt kartonozás szabálya:\nA kétoldali kartonlapok függőleges és vízszintes illesztései ne essenek egy vonalba! A másik oldalon 60 cm eltolással indítsuk a lapokat.\n\n> **[Szakmai tipp] CSAVAROZÁSI TÁVOLSÁG**: A gipszkarton csavarokat (TN 25) max. 25 cm-enként kell behajtani.`,
        estimated_minutes: 15,
        key_terms: [
          {
            id: 'kt-3',
            term: 'Impregnált Gipszkarton (RBI)',
            definition: 'Zöld színű, pára- és vízálló adalékolással készült gipszkarton lap nedves helyiségekbe.',
          },
        ],
      },
      {
        id: 'chap-3',
        title: '3. Fejezet: Hézagolás és Q1-Q4 glettelési felületi minőségek',
        summary: 'A hézagerősítő papírszalag beágyazása és a felületi minőségi szintek elérése.',
        content: `A lapozást követően a hézagokat üvegszálas vagy papír hézagerősítő szalaggal kell megerősíteni a repedések elkerülése érdekében.\n\n| Minőségi Szint | Megnevezés | Felhasználási Terület |\n| --- | --- | --- |\n| Q1 | Alap hézagolás | Burkolólapok vagy csempe alá |\n| Q2 | Standard glettelés | Strukturált tapéta vagy közepes festés alá |\n| Q3 | Speciális glettelés | Finom festés és sima felületű tapéták alá |\n| Q4 | Prémium teljes glettelés | Selyemfényű festékek és fényes súrolófényes felületek alá |`,
        estimated_minutes: 15,
      },
    ],
  },
  {
    id: 'course-2',
    title: 'Építőipari Munkavédelem és Állványozási Biztonság',
    slug: 'epitoipari-munkavedelem-es-allvanyozasi-biztonsag',
    excerpt: 'Kötelező munkavédelmi ismeretek magasban végzett munkához, egyéni védőeszközök használatához és a leesés elleni védelemhez.',
    content: 'A munkabiztonsági előírások betartása az építkezésen az életvédelem és a balesetmentes kivitelezés alapja.',
    category_id: 'cat-2',
    category_name: 'Munkavédelem',
    subcategory_name: 'Magasban végzett munka',
    topic: 'Munkabiztonság & Életvédelem',
    difficulty: 'beginner',
    audience: 'everyone',
    estimated_time_minutes: 30,
    featured_image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
    documents: [],
    video_url: null,
    tags: ['munkavédelem', 'állványozás', 'sisak', 'biztonság', 'magasban végzett munka'],
    author: 'Munkavédelmi Szakhatósági Csapat',
    partner_id: 'p-3',
    partner_name: 'BME Építőmérnöki Kar',
    status: 'published',
    rejection_note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    key_terms: [
      {
        id: 'kt-mv-1',
        term: 'Leesés Elleni Védőeszköz (MEV)',
        definition: 'Teljes testheveder és energiaelnyelő kantár, amely 2 méter feletti munkavégzésnél kötelező.',
        explanation: 'Az állványozás és tetőfedés során a kikötési pont teherbírásának legalább 12 kN-nak kell lennie.',
      },
    ],
    chapters: [
      {
        id: 'chap-mv-1',
        title: '1. Fejezet: Magasban végzett munka és egyéni védőeszközök',
        summary: 'Védősisak, védőlábbeli és biztonsági heveder alkalmazása.',
        content: `A 2 métert meghaladó szintkülönbség esetén kötelező a leesés elleni védelem kiépítése vagy egyéni védőeszköz (teljes testheveder) használata.`,
        estimated_minutes: 15,
      },
      {
        id: 'chap-mv-2',
        title: '2. Fejezet: Építési állványok átvétele és ellenőrzése',
        summary: 'Állványtáblák ellenőrzése, védőkorlátok és bokalécek rögzítése.',
        content: `Minden homlokzati állványt az első használat előtt munkavédelmi szakembernek ellenőriznie kell és zöld jelzőtáblával ki kell helyeznie az átvételt.`,
        estimated_minutes: 15,
      },
    ],
  },
];

// ── DEFAULT SEED QUIZZES ──
export const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Gipszkartonozási és Szárazépítési Teszt',
    slug: 'gipszkartonozasi-es-szarazepitesi-teszt',
    description: 'Teszteld tudásodat az UW/CW profilokról, gipszkarton lapok típusairól és a glettelési felületi minőségekről!',
    category_id: 'cat-1',
    category_name: 'Építési technológiák',
    course_id: 'course-1',
    course_title: 'Gipszkartonozás és Szárazépítési Alapismeretek',
    difficulty: 'beginner',
    passing_score_percent: 75,
    time_limit_minutes: 10,
    status: 'published',
    partner_id: 'p-1',
    partner_name: 'Leier Hungária Kft.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: [
      {
        id: 'q-1',
        question: 'Milyen profil képezi a gipszkarton válaszfalak vízszintes vezetőkeretét a padlón és a mennyezeten?',
        question_type: 'single',
        options: ['CW profil', 'UW profil', 'UA profil', 'CD profil'],
        correct_options: [1],
        explanation: 'Az UW (U-Profil Wand) a padlóra és mennyezetre rögzített vízszintes vezetőprofil. A CW profilokat ebbe csúsztatjuk be függőlegesen.',
        points: 10,
      },
      {
        id: 'q-2',
        question: 'Szabad-e a függőleges CW profilokat mereven hozzácsavarozni az UW padlóprofilhoz?',
        question_type: 'boolean',
        options: ['Igen, kötelező mereven csavarozni.', 'Nem, a CW profilnak hőtágulási dilatáció miatt mozognia kell az UW profilban.'],
        correct_options: [1],
        explanation: 'Helyes! A CW profilokat nem szabad mereven hozzácsavarozni az UW kerethez, mert az épületmozgások miatt feszültség és falrepedés keletkezne.',
        points: 10,
      },
      {
        id: 'q-3',
        question: 'Melyik gipszkarton lap alkalmas fürdőszobai, párás helyiségek burkolására?',
        question_type: 'single',
        options: ['Fehér színű normál (RB) lap', 'Zöld színű impregnált (RBI) lap', 'Rózsaszín tűzgátló (RF) lap', 'Kék akusztikai lap'],
        correct_options: [1],
        explanation: 'A zöld színű impregnált (RBI) gipszkarton lap pára- és vízálló adalékolással készül, így fürdőszobákban és vizes helyiségekben ez az előírt burkolat.',
        points: 10,
      },
      {
        id: 'q-4',
        question: 'Melyik felületi minőségi szint (Q1-Q4) képviseli a prémium, súrolófényben is tökéletesen sima teljes glettelést?',
        question_type: 'single',
        options: ['Q1', 'Q2', 'Q3', 'Q4'],
        correct_options: [3],
        explanation: 'A Q4 a legmagasabb prémium glettelési fokozat, ahol a teljes gipszkarton felületet finom glettanyággal simítják el a selyemfényű festékekhez.',
        points: 10,
      },
    ],
  },
];

// ── COURSES SERVICE HELPERS ──
export function getCoursesLocal(): LearningCourse[] {
  try {
    if (typeof window === 'undefined') return DEFAULT_COURSES;
    const raw = localStorage.getItem(COURSES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Hiba a tananyagok betöltésekor:', e);
  }
  return DEFAULT_COURSES;
}

export function saveCoursesLocal(courses: LearningCourse[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
      window.dispatchEvent(new Event('learning-updated'));
    }
  } catch (e) {
    console.warn('Hiba a tananyagok mentésekor:', e);
  }
}

export async function listCourses(options?: {
  search?: string;
  category?: string;
  difficulty?: string;
  audience?: string;
  status?: string;
  partnerId?: string;
}): Promise<LearningCourse[]> {
  const all = getCoursesLocal();
  return all.filter((c) => {
    if (options?.status && options.status !== 'all' && c.status !== options.status) return false;
    if (options?.partnerId && c.partner_id !== options.partnerId) return false;
    if (options?.category && options.category !== 'all' && c.category_id !== options.category) return false;
    if (options?.difficulty && options.difficulty !== 'all' && c.difficulty !== options.difficulty) return false;
    if (options?.audience && options.audience !== 'all' && c.audience !== options.audience) return false;
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchExcerpt = c.excerpt?.toLowerCase().includes(q);
      const matchTag = c.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchExcerpt && !matchTag) return false;
    }
    return true;
  });
}

export async function getCourseBySlug(slug: string): Promise<LearningCourse | null> {
  const all = getCoursesLocal();
  return all.find((c) => c.slug === slug || c.id === slug) || all[0] || DEFAULT_COURSES[0];
}

export async function saveCourse(payload: Partial<LearningCourse>): Promise<LearningCourse> {
  const all = getCoursesLocal();
  const now = new Date().toISOString();
  let updatedCourse: LearningCourse;

  if (payload.id && all.some((c) => c.id === payload.id)) {
    updatedCourse = {
      ...all.find((c) => c.id === payload.id)!,
      ...payload,
      updated_at: now,
    } as LearningCourse;
    saveCoursesLocal(all.map((c) => (c.id === payload.id ? updatedCourse : c)));
  } else {
    updatedCourse = {
      id: `course-${Date.now()}`,
      title: payload.title || 'Új Tananyag',
      slug: payload.slug || `tananyag-${Date.now()}`,
      excerpt: payload.excerpt || '',
      content: payload.content || '',
      category_id: payload.category_id || 'cat-1',
      category_name: payload.category_name || 'Építési technológiák',
      subcategory_name: payload.subcategory_name || undefined,
      topic: payload.topic || 'Általános',
      difficulty: payload.difficulty || 'beginner',
      audience: payload.audience || 'everyone',
      estimated_time_minutes: payload.estimated_time_minutes || 30,
      featured_image: payload.featured_image || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
      documents: payload.documents || [],
      video_url: payload.video_url || null,
      keywords: payload.keywords || [],
      tags: payload.tags || ['oktatás'],
      chapters: payload.chapters || [],
      key_terms: payload.key_terms || [],
      status: payload.status || 'published',
      partner_id: payload.partner_id || null,
      partner_name: payload.partner_name || null,
      author: payload.author || 'ÉpítőTudás Oktatási Csapat',
      created_at: now,
      updated_at: now,
    };
    saveCoursesLocal([updatedCourse, ...all]);
  }

  return updatedCourse;
}

export async function setCourseStatus(id: string, status: LearningCourse['status'], rejectionNote?: string | null): Promise<void> {
  const all = getCoursesLocal();
  const updated = all.map((c) =>
    c.id === id ? { ...c, status, rejection_note: rejectionNote ?? null, updated_at: new Date().toISOString() } : c
  );
  saveCoursesLocal(updated);
}

export async function deleteCourse(id: string): Promise<void> {
  const all = getCoursesLocal();
  saveCoursesLocal(all.filter((c) => c.id !== id));
}

// ── QUIZZES SERVICE HELPERS ──
export function getQuizzesLocal(): Quiz[] {
  try {
    if (typeof window === 'undefined') return DEFAULT_QUIZZES;
    const raw = localStorage.getItem(QUIZZES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Hiba a tesztek betöltésekor:', e);
  }
  return DEFAULT_QUIZZES;
}

export function saveQuizzesLocal(quizzes: Quiz[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(QUIZZES_STORAGE_KEY, JSON.stringify(quizzes));
      window.dispatchEvent(new Event('learning-updated'));
    }
  } catch (e) {
    console.warn('Hiba a tesztek mentésekor:', e);
  }
}

export async function listQuizzes(options?: {
  search?: string;
  category?: string;
  status?: string;
  partnerId?: string;
}): Promise<Quiz[]> {
  const all = getQuizzesLocal();
  return all.filter((q) => {
    if (options?.status && options.status !== 'all' && q.status !== options.status) return false;
    if (options?.partnerId && q.partner_id !== options.partnerId) return false;
    if (options?.category && options.category !== 'all' && q.category_id !== options.category) return false;
    if (options?.search) {
      const query = options.search.toLowerCase().trim();
      const matchTitle = q.title.toLowerCase().includes(query);
      const matchDesc = q.description.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });
}

export async function getQuizBySlug(slug: string): Promise<Quiz | null> {
  const all = getQuizzesLocal();
  return all.find((q) => q.slug === slug || q.id === slug) || all[0] || DEFAULT_QUIZZES[0];
}

export async function saveQuiz(payload: Partial<Quiz>): Promise<Quiz> {
  const all = getQuizzesLocal();
  const now = new Date().toISOString();
  let updatedQuiz: Quiz;

  if (payload.id && all.some((q) => q.id === payload.id)) {
    updatedQuiz = {
      ...all.find((q) => q.id === payload.id)!,
      ...payload,
      updated_at: now,
    } as Quiz;
    saveQuizzesLocal(all.map((q) => (q.id === payload.id ? updatedQuiz : q)));
  } else {
    updatedQuiz = {
      id: `quiz-${Date.now()}`,
      title: payload.title || 'Új Teszt',
      slug: payload.slug || `teszt-${Date.now()}`,
      description: payload.description || '',
      category_id: payload.category_id || 'cat-1',
      difficulty: payload.difficulty || 'beginner',
      passing_score_percent: payload.passing_score_percent || 75,
      time_limit_minutes: payload.time_limit_minutes || 10,
      questions: payload.questions || [],
      status: payload.status || 'published',
      partner_id: payload.partner_id || null,
      partner_name: payload.partner_name || null,
      created_at: now,
      updated_at: now,
    };
    saveQuizzesLocal([updatedQuiz, ...all]);
  }

  return updatedQuiz;
}

export async function setQuizStatus(id: string, status: Quiz['status'], rejectionNote?: string | null): Promise<void> {
  const all = getQuizzesLocal();
  saveQuizzesLocal(
    all.map((q) => (q.id === id ? { ...q, status, rejection_note: rejectionNote ?? null, updated_at: new Date().toISOString() } : q))
  );
}

export async function deleteQuiz(id: string): Promise<void> {
  const all = getQuizzesLocal();
  saveQuizzesLocal(all.filter((q) => q.id !== id));
}

// ── QUIZ EVALUATION & ATTEMPTS ──
export function saveQuizAttempt(attempt: QuizAttempt): void {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    const list: QuizAttempt[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify([attempt, ...list]));
  } catch (e) {
    console.warn('Hiba a teszt eredményének mentésekor:', e);
  }
}

export function getQuizAttempts(userId?: string): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    const list: QuizAttempt[] = raw ? JSON.parse(raw) : [];
    if (!userId) return list;
    return list.filter((a) => a.user_id === userId);
  } catch {
    return [];
  }
}

// ── PERSONAL FLASHCARDS SERVICE HELPERS (🔒 PRIVATE PER USER) ──
export function getFlashcardsLocal(userId: string = 'anon_guest'): Flashcard[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(`${FLASHCARDS_STORAGE_KEY}_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Hiba a tanulókártyák betöltésekor:', e);
  }

  // Seed initial flashcard for new learner
  const seed: Flashcard[] = [
    {
      id: 'fc-seed-1',
      user_id: userId,
      term: 'UW Profil',
      definition: 'Vízszintes vezetőprofil padlóra és mennyezetre a válaszfal nyomvonalának kijelöléséhez.',
      explanation: 'Akusztikai rezgéscsillapító szalaggal kell rögzíteni berögzítő dübellel.',
      example: 'UW 75/40/0.6 profil padlórögzítése 80 cm dübeltávval.',
      category: 'Szárazépítés',
      tags: ['gipszkarton', 'profilok'],
      master_level: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'fc-seed-2',
      user_id: userId,
      term: 'Impregnált Gipszkarton (RBI)',
      definition: 'Zöld színű, pára- és vízálló adalékolású szárazépítési lap.',
      explanation: 'Fürdőszobákban és konyhákban használandó, zuhanyzónál kenhető vízszigeteléssel.',
      example: '12.5 mm vastag zöld kartonlap.',
      category: 'Anyagismeret',
      tags: ['vízálló', 'gipszkarton'],
      master_level: 2,
      created_at: new Date().toISOString(),
    },
  ];
  return seed;
}

export function saveFlashcardsLocal(userId: string = 'anon_guest', cards: Flashcard[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${FLASHCARDS_STORAGE_KEY}_${userId}`, JSON.stringify(cards));
      window.dispatchEvent(new Event('learning-updated'));
    }
  } catch (e) {
    console.warn('Hiba a tanulókártyák mentésekor:', e);
  }
}

export function addTermToFlashcards(userId: string = 'anon_guest', termItem: KeyTermItem, categoryName?: string): Flashcard {
  const currentCards = getFlashcardsLocal(userId);

  // Check if already exists
  const existing = currentCards.find((c) => c.term.toLowerCase() === termItem.term.toLowerCase());
  if (existing) return existing;

  const newCard: Flashcard = {
    id: `fc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId, // 🔒 Strictly bound to learner
    term: termItem.term,
    definition: termItem.definition,
    explanation: termItem.explanation,
    example: termItem.example,
    category: categoryName || 'Általános',
    tags: ['mentett fogalom'],
    master_level: 0,
    created_at: new Date().toISOString(),
  };

  saveFlashcardsLocal(userId, [newCard, ...currentCards]);
  return newCard;
}

export function updateFlashcardMastery(userId: string = 'anon_guest', cardId: string, knewIt: boolean): void {
  const cards = getFlashcardsLocal(userId);
  const updated = cards.map((c) => {
    if (c.id === cardId) {
      const nextLevel = knewIt ? Math.min(5, c.master_level + 1) : Math.max(0, c.master_level - 1);
      return {
        ...c,
        master_level: nextLevel,
        last_reviewed_at: new Date().toISOString(),
      };
    }
    return c;
  });
  saveFlashcardsLocal(userId, updated);
}

export function deleteFlashcard(userId: string = 'anon_guest', cardId: string): void {
  const cards = getFlashcardsLocal(userId);
  saveFlashcardsLocal(userId, cards.filter((c) => c.id !== cardId));
}

// ── LEARNER COURSE PROGRESS HELPERS ──
export function getCourseProgress(userId: string = 'anon_guest', courseId: string): CourseProgress {
  try {
    const raw = localStorage.getItem(`${PROGRESS_STORAGE_KEY}_${userId}_${courseId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }

  return {
    id: `prog-${courseId}`,
    user_id: userId,
    course_id: courseId,
    completed_chapter_ids: [],
    progress_percent: 0,
    status: 'not_started',
    last_accessed_at: new Date().toISOString(),
  };
}

export function toggleChapterCompletion(
  userId: string = 'anon_guest',
  courseId: string,
  chapterId: string,
  totalChaptersCount: number
): CourseProgress {
  const current = getCourseProgress(userId, courseId);
  const isCompleted = current.completed_chapter_ids.includes(chapterId);

  const updatedChapterIds = isCompleted
    ? current.completed_chapter_ids.filter((id) => id !== chapterId)
    : [...current.completed_chapter_ids, chapterId];

  const total = Math.max(1, totalChaptersCount);
  const percent = Math.min(100, Math.round((updatedChapterIds.length / total) * 100));
  const status = percent === 100 ? 'completed' : percent > 0 ? 'in_progress' : 'not_started';

  const updatedProgress: CourseProgress = {
    ...current,
    completed_chapter_ids: updatedChapterIds,
    progress_percent: percent,
    status,
    last_accessed_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${PROGRESS_STORAGE_KEY}_${userId}_${courseId}`, JSON.stringify(updatedProgress));
    window.dispatchEvent(new Event('learning-updated'));
  } catch (e) {
    console.warn('Hiba a haladás mentésekor:', e);
  }

  return updatedProgress;
}
