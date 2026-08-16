import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { type Course, type Lesson, type QuizQuestion, type UserCertificate } from '../lib/supabase';

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

export interface EducationData {
  courses: Course[];
  lessons: Record<string, Lesson[]>;
  questions: Record<string, QuizQuestion[]>;
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

export const DEFAULT_EDUCATION_DATA: EducationData = {
  courses: DEFAULT_COURSES,
  lessons: DEFAULT_LESSONS,
  questions: DEFAULT_QUESTIONS,
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
        const data = {
          courses: parsed.courses || DEFAULT_COURSES,
          lessons: { ...DEFAULT_LESSONS, ...(parsed.lessons || {}) },
          questions: { ...DEFAULT_QUESTIONS, ...(parsed.questions || {}) },
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
        const eduData = {
          courses: parsed.courses || DEFAULT_COURSES,
          lessons: { ...DEFAULT_LESSONS, ...(parsed.lessons || {}) },
          questions: { ...DEFAULT_QUESTIONS, ...(parsed.questions || {}) },
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
