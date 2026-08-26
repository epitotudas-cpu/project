import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Layers,
  Award,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  ArrowRight,
  Flame,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import type { Course, UserCertificate } from '../lib/supabase';
import {
  type UserFlashcardProgressMap,
  getUserFlashcardProgress,
  getAllFlashcards,
} from '../services/educationService';

interface MyLearningDashboardProps {
  courses: Course[];
  certificates: UserCertificate[];
  userId?: string;
  onContinueCourse?: (courseId: string) => void;
  onOpenFlashcards?: () => void;
}

export default function MyLearningDashboard({
  courses,
  certificates,
  userId,
  onContinueCourse,
  onOpenFlashcards,
}: MyLearningDashboardProps) {
  const [flashcardProgress, setFlashcardProgress] = useState<UserFlashcardProgressMap>(() =>
    userId ? getUserFlashcardProgress(userId) : {}
  );

  useEffect(() => {
    function handleProgressChange() {
      if (userId) {
        setFlashcardProgress(getUserFlashcardProgress(userId));
      }
    }
    handleProgressChange();
    window.addEventListener('flashcard-progress-changed', handleProgressChange);
    return () => window.removeEventListener('flashcard-progress-changed', handleProgressChange);
  }, [userId]);

  const allCards = getAllFlashcards();

  // Flashcard stats calculation
  let masteredCount = 0;
  let learningCount = 0;
  let reviewCount = 0;

  Object.values(flashcardProgress).forEach((prog) => {
    if (prog.state === 'mastered') masteredCount += 1;
    else if (prog.state === 'learning') learningCount += 1;
    else if (prog.state === 'review') reviewCount += 1;
  });

  const totalCardsCount = allCards.length;
  const newCardsCount = Math.max(0, totalCardsCount - (masteredCount + learningCount + reviewCount));

  // Determine last accessed course (demo default course-1 or user completed certs)
  const completedCourseIds = new Set(certificates.map((c) => c.course_id));
  const activeCourse = courses.find((c) => !completedCourseIds.has(c.id)) || courses[0];
  const activeProgressPercent = activeCourse ? 62 : 100;

  return (
    <div className="space-y-8 my-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-full">
            <GraduationCap className="w-4 h-4" /> Tanulásom Irányítópult
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Személyes Tanulási Haladásod
          </h2>
          <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
            Kövesd nyomon az interaktív tananyagok előrehaladását, a tanulókártyás ismétléseket és az átvett okleveleket.
          </p>
        </div>
      </div>

      {/* 1. FOLYTATÁS SZEKCIÓ */}
      {activeCourse && (
        <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <PlayCircle className="w-4 h-4" /> Legutóbb megkezdett tananyag
              </span>
              <h3 className="text-xl font-black text-slate-900">{activeCourse.title}</h3>
              <p className="text-slate-600 text-xs md:text-sm line-clamp-2 max-w-2xl">
                {activeCourse.description}
              </p>

              {/* Progress Bar */}
              <div className="pt-2 max-w-md">
                <div className="flex justify-between text-xs text-slate-500 font-bold mb-1">
                  <span>Előrehaladás</span>
                  <span>{activeProgressPercent}% kész</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => onContinueCourse && onContinueCourse(activeCourse.id)}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-md flex items-center gap-2"
              >
                Tanulás Folytatása <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STATISZTIKÁK NÉGYZETES RÁCS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TANULÓKÁRTYÁK KÁRTYA */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 text-base">Tanulókártyák</h4>
            </div>
            {onOpenFlashcards && (
              <button
                onClick={onOpenFlashcards}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 underline"
              >
                Gyakorlás →
              </button>
            )}
          </div>

          <div className="space-y-2.5 text-xs font-semibold">
            <div className="flex justify-between p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Megtanult kártyák (Stabil)
              </span>
              <span className="font-bold">{masteredCount} kártya</span>
            </div>
            <div className="flex justify-between p-2.5 bg-amber-50 text-amber-900 rounded-xl border border-amber-200">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" /> Gyakorlás alatt
              </span>
              <span className="font-bold">{learningCount} kártya</span>
            </div>
            <div className="flex justify-between p-2.5 bg-rose-50 text-rose-900 rounded-xl border border-rose-200">
              <span className="flex items-center gap-1.5">
                <RefreshCcw className="w-4 h-4 text-rose-600" /> Ismétlendő kártyák
              </span>
              <span className="font-bold">{reviewCount} kártya</span>
            </div>
            <div className="flex justify-between p-2.5 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" /> Új kártyák
              </span>
              <span className="font-bold">{newCardsCount} kártya</span>
            </div>
          </div>
        </div>

        {/* TESZTEK & OKLEVELEK KÁRTYA */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 text-base">Tesztek & Oklevelek</h4>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="block text-3xl font-black text-slate-900">{certificates.length}</span>
              <span className="text-xs text-slate-500 font-bold">Megszerzett Tanúsítvány</span>
            </div>

            {certificates.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs flex items-center justify-between"
                  >
                    <span className="font-bold text-emerald-950 truncate max-w-[180px]">
                      {cert.certificate_code}
                    </span>
                    <span className="text-emerald-700 font-black">{cert.score_achieved}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                Tölts ki sikeresen egy tesztet legalább 75%-ra az oklevél megszerzéséhez!
              </p>
            )}
          </div>
        </div>

        {/* TANANYAGOK SZEKCIÓ */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 text-base">Tananyagok</h4>
          </div>

          <div className="space-y-2 text-xs font-semibold">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Összes elérhető kurzus:</span>
              <span className="font-black text-slate-900 text-sm">{courses.length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Folyamatban lévő:</span>
              <span className="font-black text-amber-600 text-sm">
                {Math.max(1, courses.length - completedCourseIds.size)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Teljesített tananyagok:</span>
              <span className="font-black text-emerald-600 text-sm">{completedCourseIds.size}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
