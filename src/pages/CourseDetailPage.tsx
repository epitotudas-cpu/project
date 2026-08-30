import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  ChevronRight,
  Clock,
  CheckCircle2,
  Bookmark,
  FileText,
  Video,
  Zap,
  ArrowLeft,
  Share2,
  BookmarkCheck,
  Building,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { LearningCourse, CourseProgress, KeyTermItem } from '../lib/supabase';
import {
  getCourseBySlug,
  getCourseProgress,
  toggleChapterCompletion,
  addTermToFlashcards,
} from '../services/learningService';

interface CourseDetailPageProps {
  slug: string;
  onNavigate: (page: string, params?: { slug?: string; quizId?: string }) => void;
}

export default function CourseDetailPage({ slug, onNavigate }: CourseDetailPageProps) {
  const { user } = useAuth();
  const userId = user?.id || 'anon_guest';

  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [savedTerms, setSavedTerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCourseBySlug(slug);
      setCourse(data);
      if (data) {
        const prog = getCourseProgress(userId, data.id);
        setProgress(prog);
        if (data.chapters && data.chapters.length > 0) {
          setActiveChapterId(data.chapters[0].id);
        }
      }
    } catch (e) {
      console.warn('Hiba a tananyag betöltésekor:', e);
    } fontally {
      setLoading(false);
    }
  }, [slug, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChapterToggle = (chapId: string) => {
    if (!course) return;
    const updated = toggleChapterCompletion(userId, course.id, chapId, course.chapters.length);
    setProgress(updated);
  };

  const handleSaveKeyTerm = (termItem: KeyTermItem) => {
    addTermToFlashcards(userId, termItem, course?.category_name || 'Tananyag');
    setSavedTerms((prev) => new Set(prev).add(termItem.id));
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-3" />
          <p className="text-gray-600 text-sm font-medium">Tananyag betöltése...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h2 className="text-xl font-bold text-gray-900">A keresett tananyag nem található</h2>
          <button
            onClick={() => onNavigate('learning')}
            className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-700"
          >
            Vissza a Tanulási Központba
          </button>
        </div>
      </div>
    );
  }

  const activeChapter = course.chapters?.find((c) => c.id === activeChapterId) || course.chapters?.[0];

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      
      {/* Top Banner Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button onClick={() => onNavigate('learning')} className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={13} /> Tanulási Központ
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">{course.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-4xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-accent text-black font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                  {course.category_name || 'Tananyag'}
                </span>
                <span className="bg-white/10 text-white font-semibold text-xs px-3 py-1 rounded-full border border-white/20">
                  {course.topic}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-gray-300 text-sm md:text-base leading-relaxed">{course.excerpt}</p>

              <div className="flex items-center gap-6 text-xs text-gray-300 pt-2 flex-wrap font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-accent" /> {course.estimated_time_minutes} perc tanulási idő
                </span>
                <span>•</span>
                <span>Szerző: {course.author}</span>
                {course.partner_name && (
                  <>
                    <span>•</span>
                    <span className="text-accent font-bold">Partner: {course.partner_name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Overall Course Progress Badge */}
            {progress && (
              <div className="bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-sm shrink-0 w-full lg:w-72 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-200">Saját haladásod</span>
                  <span className="text-accent font-black text-lg">{progress.progress_percent}%</span>
                </div>
                <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.progress_percent}%` }}
                  />
                </div>
                <div className="text-[11px] text-gray-300 text-center font-medium">
                  {progress.completed_chapter_ids.length} / {course.chapters?.length || 1} fejezet teljesítve
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT SIDEBAR: CHAPTER TABLE OF CONTENTS */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4 sticky top-24">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <BookOpen size={16} className="text-accent" /> Tartalomjegyzék
              </h3>

              <div className="space-y-2">
                {course.chapters?.map((chap, idx) => {
                  const isCompleted = progress?.completed_chapter_ids.includes(chap.id);
                  const isActive = chap.id === activeChapterId;

                  return (
                    <button
                      key={chap.id}
                      onClick={() => setActiveChapterId(chap.id)}
                      className={`w-full text-left p-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between gap-2 border ${
                        isActive
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isActive
                              ? 'bg-accent text-black'
                              : isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {isCompleted ? <Check size={12} /> : idx + 1}
                        </span>
                        <span className="truncate">{chap.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Linked Quiz Callout */}
              {course.related_quiz_ids && course.related_quiz_ids.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onNavigate('quiz-player', { quizId: course.related_quiz_ids![0] })}
                    className="w-full py-3 bg-accent hover:bg-amber-400 text-black font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap size={16} /> Kapcsolódó Teszt Kitöltése
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MAIN COLUMN: CHAPTER READING CONTENT */}
          <div className="lg:col-span-3 space-y-8">
            {activeChapter ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm space-y-8">
                
                {/* Chapter Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                  <div>
                    <span className="text-xs font-bold text-accent bg-primary px-3 py-1 rounded-full uppercase tracking-wider">
                      {activeChapter.title}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-2">
                      {activeChapter.title}
                    </h2>
                  </div>

                  {/* Mark Chapter Completed Button */}
                  <button
                    onClick={() => handleChapterToggle(activeChapter.id)}
                    className={`px-5 py-3 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm shrink-0 cursor-pointer ${
                      progress?.completed_chapter_ids.includes(activeChapter.id)
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {progress?.completed_chapter_ids.includes(activeChapter.id)
                        ? 'Fejezet Teljesítve! ✓'
                        : 'Megjelölés Teljesítettként'}
                    </span>
                  </button>
                </div>

                {/* Chapter Markdown Content */}
                <div className="prose prose-slate max-w-none text-gray-800 font-medium leading-relaxed whitespace-pre-line">
                  {activeChapter.content}
                </div>

                {/* KEY TERMS IN CHAPTER */}
                {((course.key_terms && course.key_terms.length > 0) || (activeChapter.key_terms && activeChapter.key_terms.length > 0)) && (
                  <div className="bg-amber-50/60 border-2 border-amber-200 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                        <Bookmark size={18} className="text-amber-600" /> Fontos Fogalmak Ebben A Fejezetben
                      </h4>
                      <span className="text-[11px] text-amber-800 font-semibold">1-Kattintásos Mentés Tanulókártyákhoz</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(activeChapter.key_terms || course.key_terms || []).map((term) => {
                        const isSaved = savedTerms.has(term.id);

                        return (
                          <div
                            key={term.id}
                            className="bg-white rounded-2xl p-4 border border-amber-200 space-y-3 shadow-2xs flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <h5 className="text-sm font-bold text-gray-900">{term.term}</h5>
                              <p className="text-xs text-gray-600 font-medium leading-relaxed">{term.definition}</p>
                              {term.example && (
                                <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg font-medium mt-1">
                                  💡 {term.example}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleSaveKeyTerm(term)}
                              className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isSaved
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-primary text-white hover:bg-primary-700 shadow-xs'
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <BookmarkCheck size={14} /> Mentve Tanulókártyaként! ✓
                                </>
                              ) : (
                                <>
                                  <Bookmark size={14} /> Mentés Tanulókártyákhoz
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DOWNLOADABLE DOCUMENTS */}
                {course.documents && course.documents.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-4">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={18} className="text-accent" /> Letölthető Oktatási Dokumentumok &amp; Szabványok
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {course.documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-accent transition-all flex items-center justify-between group shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-primary group-hover:text-accent transition-colors" />
                            <div>
                              <div className="text-xs font-bold text-gray-900">{doc.title}</div>
                              <div className="text-[10px] text-gray-400 font-semibold">{doc.file_size || 'PDF Dokumentum'}</div>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-primary group-hover:underline">Letöltés</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}
