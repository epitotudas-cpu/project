import { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  PlayCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import {
  useEducationData,
  saveEducationData,
  DEFAULT_EDUCATION_DATA,
} from '../services/educationService';
import type { Course, Lesson, QuizQuestion } from '../lib/supabase';

export default function AdminCoursesPage() {
  const eduData = useEducationData();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active Selected Course for Editing Lessons/Quiz
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  // Course Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('Szerkezetépítés');
  const [courseDifficulty, setCourseDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [courseDuration, setCourseDuration] = useState(4);

  // Lesson Form State
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');

  // Quiz Form State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizQuestion | null>(null);
  const [quizQuestionText, setQuizQuestionText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctOptionIdx, setCorrectOptionIdx] = useState(0);

  const filteredCourses = eduData.courses.filter((c) => {
    return (
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleOpenAddCourse = () => {
    setEditingCourse(null);
    setCourseTitle('');
    setCourseDescription('');
    setCourseCategory('Szerkezetépítés');
    setCourseDifficulty('intermediate');
    setCourseDuration(5);
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseTitle(course.title);
    setCourseDescription(course.description);
    setCourseCategory(course.category);
    setCourseDifficulty(course.difficulty as 'beginner' | 'intermediate' | 'advanced');
    setCourseDuration(course.duration_hours);
    setShowCourseModal(true);
  };

  const handleDeleteCourse = (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a képzést és a hozzá tartozó leckéket?')) {
      const updatedCourses = eduData.courses.filter((c) => c.id !== id);
      const updatedLessons = { ...eduData.lessons };
      delete updatedLessons[id];
      const updatedQuestions = { ...eduData.questions };
      delete updatedQuestions[id];

      saveEducationData({
        courses: updatedCourses,
        lessons: updatedLessons,
        questions: updatedQuestions,
      });
      if (activeCourseId === id) setActiveCourseId(null);
      triggerSuccessNotify();
    }
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;

    if (editingCourse) {
      const updatedCourses = eduData.courses.map((c) =>
        c.id === editingCourse.id
          ? {
              ...c,
              title: courseTitle.trim(),
              slug: courseTitle.trim().toLowerCase().replace(/\s+/g, '-'),
              description: courseDescription.trim(),
              category: courseCategory.trim(),
              difficulty: courseDifficulty,
              duration_hours: courseDuration,
            }
          : c
      );
      saveEducationData({ ...eduData, courses: updatedCourses });
    } else {
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        title: courseTitle.trim(),
        slug: courseTitle.trim().toLowerCase().replace(/\s+/g, '-'),
        description: courseDescription.trim(),
        category: courseCategory.trim(),
        difficulty: courseDifficulty,
        duration_hours: courseDuration,
        is_published: true,
        created_at: new Date().toISOString(),
      };
      saveEducationData({ ...eduData, courses: [newCourse, ...eduData.courses] });
    }

    setShowCourseModal(false);
    triggerSuccessNotify();
  };

  // Lesson Handlers
  const handleOpenAddLesson = (courseId: string) => {
    setEditingLesson(null);
    setLessonTitle('');
    setLessonContent('');
    setLessonVideoUrl('');
    setActiveCourseId(courseId);
    setShowLessonModal(true);
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseId || !lessonTitle.trim()) return;

    const currentLessons = eduData.lessons[activeCourseId] || [];
    let updatedLessons: Lesson[] = [];

    if (editingLesson) {
      updatedLessons = currentLessons.map((l) =>
        l.id === editingLesson.id
          ? {
              ...l,
              title: lessonTitle.trim(),
              content: lessonContent.trim(),
              video_url: lessonVideoUrl.trim() || null,
            }
          : l
      );
    } else {
      const newLesson: Lesson = {
        id: `l-${Date.now()}`,
        course_id: activeCourseId,
        title: lessonTitle.trim(),
        sequence_order: currentLessons.length + 1,
        content: lessonContent.trim(),
        video_url: lessonVideoUrl.trim() || null,
        created_at: new Date().toISOString(),
      };
      updatedLessons = [...currentLessons, newLesson];
    }

    saveEducationData({
      ...eduData,
      lessons: {
        ...eduData.lessons,
        [activeCourseId]: updatedLessons,
      },
    });

    setShowLessonModal(false);
    triggerSuccessNotify();
  };

  const handleDeleteLesson = (courseId: string, lessonId: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a leckét?')) {
      const currentLessons = eduData.lessons[courseId] || [];
      const updatedLessons = currentLessons.filter((l) => l.id !== lessonId);
      saveEducationData({
        ...eduData,
        lessons: {
          ...eduData.lessons,
          [courseId]: updatedLessons,
        },
      });
      triggerSuccessNotify();
    }
  };

  // Quiz Handlers
  const handleOpenAddQuiz = (courseId: string) => {
    setEditingQuiz(null);
    setQuizQuestionText('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setCorrectOptionIdx(0);
    setActiveCourseId(courseId);
    setShowQuizModal(true);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseId || !quizQuestionText.trim()) return;

    const currentQuestions = eduData.questions[activeCourseId] || [];
    let updatedQuestions: QuizQuestion[] = [];
    const optionsArray = [opt0, opt1, opt2, opt3].map((s) => s.trim()).filter(Boolean);

    if (editingQuiz) {
      updatedQuestions = currentQuestions.map((q) =>
        q.id === editingQuiz.id
          ? {
              ...q,
              question: quizQuestionText.trim(),
              options_json: optionsArray,
              correct_option_index: correctOptionIdx,
            }
          : q
      );
    } else {
      const newQuestion: QuizQuestion = {
        id: `q-${Date.now()}`,
        quiz_id: `quiz-${activeCourseId}`,
        question: quizQuestionText.trim(),
        options_json: optionsArray,
        correct_option_index: correctOptionIdx,
        created_at: new Date().toISOString(),
      };
      updatedQuestions = [...currentQuestions, newQuestion];
    }

    saveEducationData({
      ...eduData,
      questions: {
        ...eduData.questions,
        [activeCourseId]: updatedQuestions,
      },
    });

    setShowQuizModal(false);
    triggerSuccessNotify();
  };

  const handleDeleteQuiz = (courseId: string, qId: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a tesztkérdést?')) {
      const currentQuestions = eduData.questions[courseId] || [];
      const updated = currentQuestions.filter((q) => q.id !== qId);
      saveEducationData({
        ...eduData,
        questions: {
          ...eduData.questions,
          [courseId]: updated,
        },
      });
      triggerSuccessNotify();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Biztosan visszaállítod a képzési katalógust az alapértelmezett adatokra?')) {
      saveEducationData(DEFAULT_EDUCATION_DATA);
      triggerSuccessNotify();
    }
  };

  const triggerSuccessNotify = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-[#111] min-h-screen text-gray-200 p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <GraduationCap className="text-accent" size={32} />
            Képzések &amp; Tanfolyamok Kezelő
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Építőipari mesterkurzusok, leckék, oktatóvideók és vizsgateszt kérdések kezelése.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={14} /> Alapértelmezett
          </button>
          <button
            type="button"
            onClick={handleOpenAddCourse}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Új Kurzus Létrehozása
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl flex items-center gap-3 animate-fade-in text-sm font-bold">
          <CheckCircle2 size={20} />
          A képzési adatok és tesztkérdések sikeresen elmentve és alkalmazva a platformon!
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111111] border border-[#1E1E1E] p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés kurzus cím vagy kategória szerint..."
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-6">
        {filteredCourses.map((course) => {
          const lessons = eduData.lessons[course.id] || [];
          const questions = eduData.questions[course.id] || [];
          const isExpanded = activeCourseId === course.id;

          return (
            <div
              key={course.id}
              className="bg-[#111111] border border-[#1E1E1E] rounded-3xl p-6 space-y-5 shadow-xl hover:border-accent/40 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222] pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-accent/10 border border-accent/30 text-accent font-bold text-[10px] rounded-full">
                      {course.category}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-[10px] rounded-full uppercase">
                      {course.difficulty}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                      <Clock size={13} /> {course.duration_hours} óra képzés
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-white">{course.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">{course.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveCourseId(isExpanded ? null : course.id)}
                    className="px-4 py-2 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-200 font-bold text-xs rounded-xl transition-all"
                  >
                    {isExpanded ? '▲ Leckék Részletei' : `▼ Leckék (${lessons.length}) & Kvíz (${questions.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditCourse(course)}
                    className="px-3.5 py-2 bg-[#222] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={13} /> Szerkesztés
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors cursor-pointer"
                    title="Kurzus törlése"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded Lessons & Quiz Panel */}
              {isExpanded && (
                <div className="space-y-6 pt-2 animate-fade-in">
                  {/* Lessons Sub-section */}
                  <div className="space-y-3 bg-[#161616] p-5 rounded-2xl border border-[#222]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-accent flex items-center gap-2 uppercase tracking-wider">
                        <PlayCircle size={16} /> Tanleckék ({lessons.length} db)
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenAddLesson(course.id)}
                        className="px-3 py-1 bg-accent/20 text-accent font-bold text-[11px] rounded-lg hover:bg-accent hover:text-black transition-all"
                      >
                        + Új Lecke Hozzáadása
                      </button>
                    </div>

                    <div className="space-y-2">
                      {lessons.map((lesson) => (
                        <div key={lesson.id} className="p-3 bg-[#1D1D1D] rounded-xl flex items-center justify-between gap-3 text-xs border border-[#2A2A2A]">
                          <div>
                            <div className="font-bold text-white">{lesson.title}</div>
                            <div className="text-gray-400 text-[11px] line-clamp-1">{lesson.content}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLesson(course.id, lesson.id)}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Lecke törlése"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quiz Sub-section */}
                  <div className="space-y-3 bg-[#161616] p-5 rounded-2xl border border-[#222]">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-accent flex items-center gap-2 uppercase tracking-wider">
                        <HelpCircle size={16} /> Teszt Kérdések ({questions.length} db)
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenAddQuiz(course.id)}
                        className="px-3 py-1 bg-accent/20 text-accent font-bold text-[11px] rounded-lg hover:bg-accent hover:text-black transition-all"
                      >
                        + Új Kérdés Hozzáadása
                      </button>
                    </div>

                    <div className="space-y-2">
                      {questions.map((q) => (
                        <div key={q.id} className="p-3 bg-[#1D1D1D] rounded-xl space-y-1.5 text-xs border border-[#2A2A2A]">
                          <div className="flex items-center justify-between font-bold text-white">
                            <span>❓ {q.question}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuiz(course.id, q.id)}
                              className="p-1 text-red-400 hover:text-red-300"
                              title="Kérdés törlése"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-400">
                            {q.options_json?.map((opt, oIdx) => (
                              <div key={oIdx} className={oIdx === q.correct_option_index ? 'text-emerald-400 font-bold' : ''}>
                                {oIdx + 1}. {opt} {oIdx === q.correct_option_index && '✓ (Helyes)'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#222] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <GraduationCap size={18} className="text-accent" />
                {editingCourse ? 'Kurzus Szerkesztése' : 'Új Kurzus Létrehozása'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 bg-[#1A1A1A] rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Kurzus Címe *</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Kategória</label>
                <input
                  type="text"
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Nehézségi Szint</label>
                  <select
                    value={courseDifficulty}
                    onChange={(e) => setCourseDifficulty(e.target.value as any)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent"
                  >
                    <option value="beginner">Kezdő</option>
                    <option value="intermediate">Középhaladó</option>
                    <option value="advanced">Haladó</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Képzés Időtartama (Óra)</label>
                  <input
                    type="number"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(Number(e.target.value))}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Kurzus Részletes Leírása</label>
                <textarea
                  rows={4}
                  required
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold rounded-xl transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-black font-extrabold rounded-xl transition-all shadow-lg"
                >
                  {editingCourse ? 'Módosítások Mentése' : 'Kurzus Létrehozása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#222] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <PlayCircle size={18} className="text-accent" /> Új Tanlecke Hozzáadása
              </h3>
              <button
                type="button"
                onClick={() => setShowLessonModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Lecke Címe *</label>
                <input
                  type="text"
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="pl. 1. Lecke: Zsaluzási Rendszerek"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Videó Embed URL (YouTube)</label>
                <input
                  type="text"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Lecke Tartalma &amp; Magyarázata</label>
                <textarea
                  rows={4}
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowLessonModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold rounded-xl"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-black font-extrabold rounded-xl shadow-lg"
                >
                  Lecke Mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Quiz Question Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#222] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-accent" /> Új Teszt Kérdés Hozzáadása
              </h3>
              <button
                type="button"
                onClick={() => setShowQuizModal(false)}
                className="text-gray-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Teszt Kérdés Szövege *</label>
                <input
                  type="text"
                  required
                  value={quizQuestionText}
                  onChange={(e) => setQuizQuestionText(e.target.value)}
                  placeholder="Mi a legfontosabb jellemzője..."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-300 block mb-1">Válaszlehetőségek (4 db)</label>
                <input
                  type="text"
                  required
                  value={opt0}
                  onChange={(e) => setOpt0(e.target.value)}
                  placeholder="1. Válaszlehetőség"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-1.5 text-white"
                />
                <input
                  type="text"
                  required
                  value={opt1}
                  onChange={(e) => setOpt1(e.target.value)}
                  placeholder="2. Válaszlehetőség"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-1.5 text-white"
                />
                <input
                  type="text"
                  value={opt2}
                  onChange={(e) => setOpt2(e.target.value)}
                  placeholder="3. Válaszlehetőség"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-1.5 text-white"
                />
                <input
                  type="text"
                  value={opt3}
                  onChange={(e) => setOpt3(e.target.value)}
                  placeholder="4. Válaszlehetőség"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Helyes Válasz Indexe</label>
                <select
                  value={correctOptionIdx}
                  onChange={(e) => setCorrectOptionIdx(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent font-bold text-emerald-400"
                >
                  <option value={0}>1. Válasz a helyes</option>
                  <option value={1}>2. Válasz a helyes</option>
                  <option value={2}>3. Válasz a helyes</option>
                  <option value={3}>4. Válasz a helyes</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold rounded-xl"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-black font-extrabold rounded-xl shadow-lg"
                >
                  Kérdés Mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
