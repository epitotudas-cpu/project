import { supabase, type Course, type Lesson, type QuizQuestion, type UserCertificate } from '../lib/supabase';

export interface DetailedCourse {
  course: Course;
  lessons: Lesson[];
  questions: QuizQuestion[];
}

export interface QuizSubmissionResult {
  passed: boolean;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  certificate?: UserCertificate;
}

const DEFAULT_COURSES: Course[] = [
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
    difficulty: 'advanced',
    duration_hours: 8,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_LESSONS: Record<string, Lesson[]> = {
  'course-1': [
    {
      id: 'les-1',
      course_id: 'course-1',
      title: '1. Lecke: A zsaluzati rendszerek kiválasztása és szerelése',
      sequence_order: 1,
      content: 'A zsaluzatok szerkezetépítésben betöltött szerepe kulcsfontosságú. A megfelelő keretes és pillérzsaluk csökkentik az üzemidőt.',
      video_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'les-2',
      course_id: 'course-1',
      title: '2. Lecke: Öntömörödő beton (SCC) tömörítése és utókezelése',
      sequence_order: 2,
      content: 'Az öntömörödő beton tömörítést nem igényel, de a párásítás és fedés elengedhetetlen a repedésmentes szilárduláshoz.',
      video_url: null,
      created_at: new Date().toISOString(),
    },
  ],
};

const DEFAULT_QUESTIONS: Record<string, QuizQuestion[]> = {
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

const USER_CERTIFICATES_STORE: Map<string, UserCertificate[]> = new Map();

export async function listCourses(category?: string, difficulty?: string): Promise<Course[]> {
  try {
    let query = supabase.from('courses').select('*').eq('is_published', true);
    if (category && category !== 'all') query = query.eq('category', category);
    if (difficulty && difficulty !== 'all') query = query.eq('difficulty', difficulty);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return DEFAULT_COURSES;
    }
    return data;
  } catch (err) {
    void err;
    return DEFAULT_COURSES;
  }
}

export async function getCourseDetails(courseId: string): Promise<DetailedCourse> {
  const course = DEFAULT_COURSES.find((c) => c.id === courseId) || DEFAULT_COURSES[0];
  const lessons = DEFAULT_LESSONS[course.id] || DEFAULT_LESSONS['course-1'];
  const questions = DEFAULT_QUESTIONS[course.id] || DEFAULT_QUESTIONS['course-1'];

  return {
    course,
    lessons,
    questions,
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

  const totalQuestions = questions.length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercentage >= 75;

  let certificate: UserCertificate | undefined;

  if (passed) {
    certificate = {
      id: `cert-${Date.now()}`,
      user_id: userId,
      course_id: courseId,
      score_achieved: scorePercentage,
      certificate_code: `ET-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      issued_at: new Date().toISOString(),
    };

    const existing = USER_CERTIFICATES_STORE.get(userId) || [];
    USER_CERTIFICATES_STORE.set(userId, [certificate, ...existing]);
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
  return USER_CERTIFICATES_STORE.get(userId) || [
    {
      id: 'cert-sample',
      user_id: userId,
      course_id: 'course-1',
      score_achieved: 100,
      certificate_code: 'ET-CERT-982415',
      issued_at: new Date().toISOString(),
    },
  ];
}
