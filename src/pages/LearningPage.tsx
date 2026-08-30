import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Bookmark,
  Search,
  Filter,
  Clock,
  Award,
  ChevronRight,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  RotateCw,
  CheckCircle2,
  XCircle,
  Eye,
  Zap,
  Tag,
  Share2,
  Check,
  Flame,
  Volume2,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { useAuth } from '../contexts/AuthContext';
import { getCategories } from '../lib/api';
import type { Category, LearningCourse, Quiz, Flashcard } from '../lib/supabase';
import {
  listCourses,
  listQuizzes,
  getFlashcardsLocal,
  saveFlashcardsLocal,
  deleteFlashcard,
  updateFlashcardMastery,
  getCourseProgress,
} from '../services/learningService';

interface LearningPageProps {
  onNavigate: (page: string, params?: { slug?: string; quizId?: string }) => void;
}

export default function LearningPage({ onNavigate }: LearningPageProps) {
  const { user } = useAuth();
  const userId = user?.id || 'anon_guest';

  // ── TAB STATE ──
  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes' | 'flashcards'>('courses');

  // ── DATA STATES ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  // ── FILTER STATES ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all');

  // ── FLASHCARD PRACTICE MODE STATE ──
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newCardModalOpen, setNewCardModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDef, setNewDef] = useState('');
  const [newCategory, setNewCategory] = useState('Általános');

  // ── URL HASH SYNC ──
  const syncFromHash = useCallback(() => {
    try {
      const hash = window.location.hash || '';
      const queryPart = hash.includes('?') ? hash.split('?')[1] : '';

      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        const tabParam = params.get('tab');
        if (tabParam === 'quizzes') setActiveTab('quizzes');
        else if (tabParam === 'flashcards') setActiveTab('flashcards');
        else setActiveTab('courses');
      } else if (hash === '#quizzes' || hash === '#tesztek') {
        setActiveTab('quizzes');
      } else if (hash === '#flashcards' || hash === '#tanulokartyak') {
        setActiveTab('flashcards');
      } else {
        setActiveTab('courses');
      }
    } catch {
      setActiveTab('courses');
    }
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [catsData, coursesData, quizzesData] = await Promise.all([
        getCategories(),
        listCourses({ status: 'published' }),
        listQuizzes({ status: 'published' }),
      ]);
      setCategories(catsData);
      setCourses(coursesData);
      setQuizzes(quizzesData);
      setFlashcards(getFlashcardsLocal(userId));
    } catch (e) {
      console.warn('Hiba az oktatási adatok betöltésekor:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    const handleLearningUpdate = () => {
      loadAllData();
    };
    window.addEventListener('learning-updated', handleLearningUpdate);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('learning-updated', handleLearningUpdate);
    };
  }, [syncFromHash, loadAllData]);

  // ── FILTERED COURSES ──
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (selectedCategory !== 'all' && c.category_id !== selectedCategory) return false;
      if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false;
      if (selectedAudience !== 'all' && c.audience !== selectedAudience) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchExcerpt = c.excerpt.toLowerCase().includes(q);
        const matchTags = c.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchExcerpt && !matchTags) return false;
      }
      return true;
    });
  }, [courses, selectedCategory, selectedDifficulty, selectedAudience, searchQuery]);

  // ── FILTERED QUIZZES ──
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      if (selectedCategory !== 'all' && q.category_id !== selectedCategory) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = q.title.toLowerCase().includes(query);
        const matchDesc = q.description.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [quizzes, selectedCategory, selectedDifficulty, searchQuery]);

  // ── FILTERED FLASHCARDS ──
  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((card) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTerm = card.term.toLowerCase().includes(q);
        const matchDef = card.definition.toLowerCase().includes(q);
        if (!matchTerm && !matchDef) return false;
      }
      return true;
    });
  }, [flashcards, searchQuery]);

  // ── HANDLERS FOR FLASHCARDS ──
  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newDef.trim()) return;

    const newCard: Flashcard = {
      id: `fc-custom-${Date.now()}`,
      user_id: userId,
      term: newTerm.trim(),
      definition: newDef.trim(),
      category: newCategory.trim() || 'Saját Kártya',
      tags: ['saját'],
      master_level: 0,
      created_at: new Date().toISOString(),
    };

    const nextList = [newCard, ...flashcards];
    setFlashcards(nextList);
    saveFlashcardsLocal(userId, nextList);
    setNewTerm('');
    setNewDef('');
    setNewCardModalOpen(false);
  };

  const handleDeleteCard = (id: string) => {
    deleteFlashcard(userId, id);
    setFlashcards(getFlashcardsLocal(userId));
  };

  const handleMasteryVote = (knewIt: boolean) => {
    if (filteredFlashcards.length === 0) return;
    const currentCard = filteredFlashcards[practiceIndex];
    if (currentCard) {
      updateFlashcardMastery(userId, currentCard.id, knewIt);
      setFlashcards(getFlashcardsLocal(userId));
    }

    setIsFlipped(false);
    if (practiceIndex < filteredFlashcards.length - 1) {
      setPracticeIndex((prev) => prev + 1);
    } else {
      setPracticeMode(false);
      setPracticeIndex(0);
    }
  };

  const difficultyLabels: Record<string, { label: string; color: string }> = {
    beginner: { label: 'Kezdő', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    intermediate: { label: 'Középhaladó', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    advanced: { label: 'Haladó', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    professional: { label: 'Szakmai / Mester', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  };

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      
      {/* Hero Header */}
      <div className="relative bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
              Főoldal
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Tanulás &amp; Oktatási Rendszer</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                <GraduationCap size={15} /> ÉpítőTudás Akadémia &amp; Tanulókártyák
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Tanulási Központ &amp; Vizsgafelkészítő
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Dolgozz fel szakmai tananyagokat, tölts ki interaktív teszteket, és ments el fontos fogalmakat saját tanulókártyáid közé az ismétléshez.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/10 border border-white/20 px-4 py-3 rounded-2xl text-center backdrop-blur-sm">
                <div className="text-xs text-gray-300 font-semibold">Saját Tanulókártyák</div>
                <div className="text-2xl font-black text-accent">{flashcards.length} db</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ribbon Bar */}
      <SectionSubNav
        ariaLabel="Tanulási almenü navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Tananyagok',
            page: 'learning?tab=courses',
            icon: <BookOpen size={14} className="text-accent" />,
            active: activeTab === 'courses',
          },
          {
            label: 'Tesztek',
            page: 'learning?tab=quizzes',
            icon: <HelpCircle size={14} className="text-accent" />,
            active: activeTab === 'quizzes',
          },
          {
            label: 'Tanulókártyák',
            page: 'learning?tab=flashcards',
            icon: <Bookmark size={14} className="text-accent" />,
            active: activeTab === 'flashcards',
          },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* FILTERS BAR */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'courses'
                    ? 'Keresés tananyagok között (pl. gipszkarton, munkavédelem)...'
                    : activeTab === 'quizzes'
                    ? 'Keresés tesztek között...'
                    : 'Keresés saját tanulókártyák között...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-accent font-medium"
              />
            </div>

            {/* Category Select */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-extrabold text-gray-800 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="all">Minden kategória</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Select */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-extrabold text-gray-800 focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="all">Minden nehézségi szint</option>
                <option value="beginner">Kezdő</option>
                <option value="intermediate">Középhaladó</option>
                <option value="advanced">Haladó</option>
                <option value="professional">Szakmai / Mester</option>
              </select>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: TANANYAGOK */}
        {/* ==================================================================== */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <BookOpen size={20} className="text-accent" /> Elérhető Tananyagok ({filteredCourses.length})
              </h2>
            </div>

            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
                <BookOpen size={48} className="mx-auto text-gray-300" />
                <h3 className="text-lg font-bold text-gray-800">Nincs elérhető tananyag ebben a kategóriában</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Próbáld meg módosítani a keresési feltételeket vagy válassz másik kategóriát.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const progress = getCourseProgress(userId, course.id);
                  const diff = difficultyLabels[course.difficulty] || difficultyLabels.beginner;

                  return (
                    <div
                      key={course.id}
                      onClick={() => onNavigate('course-detail', { slug: course.slug })}
                      className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                    >
                      {/* Course Image */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden shrink-0">
                        <img
                          src={course.featured_image}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider border shadow-xs ${diff.color}`}>
                            {diff.label}
                          </span>
                          <span className="bg-primary/90 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs">
                            {course.category_name}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
                            <Clock size={13} className="text-accent" />
                            <span>{course.estimated_time_minutes} perc tanulási idő</span>
                            <span>•</span>
                            <span>{course.chapters?.length || 0} fejezet</span>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                            {course.title}
                          </h3>

                          <p className="text-gray-600 text-xs leading-relaxed line-clamp-3 font-medium">
                            {course.excerpt}
                          </p>
                        </div>

                        {/* Progress Bar & Author Footer */}
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                          {progress.progress_percent > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="text-primary-950">Haladás: {progress.progress_percent}%</span>
                                <span className="text-gray-500">{progress.completed_chapter_ids.length} / {course.chapters?.length || 1} fejezet</span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-accent h-full rounded-full transition-all duration-500"
                                  style={{ width: `${progress.progress_percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                            <span className="font-semibold">{course.author}</span>
                            <span className="text-primary font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                              Megnyitás <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: TESZTEK */}
        {/* ==================================================================== */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <HelpCircle size={20} className="text-accent" /> Oktatási Tesztek &amp; Vizsgák ({filteredQuizzes.length})
              </h2>
            </div>

            {filteredQuizzes.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
                <HelpCircle size={48} className="mx-auto text-gray-300" />
                <h3 className="text-lg font-bold text-gray-800">Nincs elérhető teszt ebben a kategóriában</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Próbáld meg módosítani a keresőt vagy válassz másik szűrési feltételt.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredQuizzes.map((quiz) => {
                  const diff = difficultyLabels[quiz.difficulty] || difficultyLabels.beginner;

                  return (
                    <div
                      key={quiz.id}
                      className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:shadow-lg transition-all duration-300 space-y-5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider border shadow-xs ${diff.color}`}>
                            {diff.label}
                          </span>
                          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            <Clock size={13} /> {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} perc` : 'Nincs időkorlát'}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
                        <p className="text-gray-600 text-xs leading-relaxed font-medium">{quiz.description}</p>

                        {quiz.course_title && (
                          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs font-semibold text-gray-700 flex items-center gap-2">
                            <BookOpen size={14} className="text-accent shrink-0" />
                            <span className="line-clamp-1">Kapcsolódó tananyag: <strong>{quiz.course_title}</strong></span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                        <div className="text-xs">
                          <span className="text-gray-500 font-medium">Sikerességi küszöb: </span>
                          <strong className="text-emerald-700 font-extrabold">{quiz.passing_score_percent}%</strong>
                          <span className="text-gray-400 ml-2">({quiz.questions?.length || 0} kérdés)</span>
                        </div>

                        <button
                          onClick={() => onNavigate('quiz-player', { quizId: quiz.id })}
                          className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Zap size={14} /> Teszt Indítása
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: TANULÓKÁRTYÁK */}
        {/* ==================================================================== */}
        {activeTab === 'flashcards' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Bookmark size={20} className="text-accent" /> Saját Tanulókártyák ({filteredFlashcards.length})
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  🔒 Személyes mentett kártyáid a tananyagokból és saját fogalmaidból.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (filteredFlashcards.length > 0) {
                      setPracticeMode(true);
                      setPracticeIndex(0);
                      setIsFlipped(false);
                    }
                  }}
                  disabled={filteredFlashcards.length === 0}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Flame size={15} className="text-accent" /> Gyakorló Mód Indítása
                </button>

                <button
                  onClick={() => setNewCardModalOpen(true)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-xl border border-gray-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} /> Új Saját Kártya
                </button>
              </div>
            </div>

            {/* PRACTICE MODE MODAL PLAYER */}
            {practiceMode && filteredFlashcards.length > 0 && (
              <div className="bg-primary text-white rounded-3xl p-8 border border-primary-700 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-primary-700 pb-4">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                    <Flame size={16} /> Interaktív Gyakorlás ({practiceIndex + 1} / {filteredFlashcards.length})
                  </span>
                  <button
                    onClick={() => setPracticeMode(false)}
                    className="text-xs font-bold text-gray-300 hover:text-white bg-white/10 px-3 py-1 rounded-full"
                  >
                    Kilépés a gyakorlásból
                  </button>
                </div>

                {/* 3D FLIP CARD CONTAINER */}
                <div className="perspective-1000 my-6">
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`relative min-h-[260px] bg-white text-gray-900 rounded-3xl p-8 shadow-xl cursor-pointer transition-transform duration-500 flex flex-col justify-between border-2 ${
                      isFlipped ? 'border-accent bg-amber-50/20' : 'border-gray-200'
                    }`}
                  >
                    {!isFlipped ? (
                      <div className="space-y-4 my-auto text-center">
                        <span className="text-[11px] font-extrabold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full inline-block">
                          ELŐLAP • FOGALOM / KÉRDÉS
                        </span>
                        <h3 className="text-2xl md:text-3xl font-black text-gray-900">{filteredFlashcards[practiceIndex].term}</h3>
                        <p className="text-xs text-gray-400 font-medium">Kattints a kártyára a definíció felfedéséhez 🔄</p>
                      </div>
                    ) : (
                      <div className="space-y-4 my-auto">
                        <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full inline-block">
                          HÁTLAP • DEFINÍCIÓ &amp; MAGYARÁZAT
                        </span>
                        <p className="text-base md:text-lg font-bold text-gray-900 leading-relaxed">
                          {filteredFlashcards[practiceIndex].definition}
                        </p>
                        {filteredFlashcards[practiceIndex].explanation && (
                          <p className="text-xs text-gray-600 font-medium italic border-l-2 border-accent pl-3">
                            {filteredFlashcards[practiceIndex].explanation}
                          </p>
                        )}
                        {filteredFlashcards[practiceIndex].example && (
                          <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                            💡 Példa: {filteredFlashcards[practiceIndex].example}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* FEEDBACK BUTTONS */}
                {isFlipped && (
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      onClick={() => handleMasteryVote(false)}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle size={16} /> Nem tudtam (Újra kell ismételnem)
                    </button>
                    <button
                      onClick={() => handleMasteryVote(true)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 size={16} /> Tudtam (Helyes válasz!)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* FLASHCARDS GRID */}
            {filteredFlashcards.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
                <Bookmark size={48} className="mx-auto text-gray-300" />
                <h3 className="text-lg font-bold text-gray-800">Még nincs mentett Tanulókártyád</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Ments el egy fontos fogalmat a tananyagok olvasása során, vagy hozz létre saját kártyákat a fenti gombra kattintva!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFlashcards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs hover:shadow-lg transition-all duration-300 space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                          {card.category || 'Általános'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Szint: {card.master_level || 0} / 5
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{card.term}</h3>
                      <p className="text-gray-600 text-xs font-medium leading-relaxed">{card.definition}</p>

                      {card.example && (
                        <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                          💡 {card.example}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-semibold">
                        Mentve: {new Date(card.created_at).toLocaleDateString('hu-HU')}
                      </span>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Törlés"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* NEW CUSTOM FLASHCARD MODAL */}
      {newCardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus size={18} className="text-accent" /> Új Saját Tanulókártya Létrehozása
              </h3>
              <button
                onClick={() => setNewCardModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Fogalom / Kérdés (Előlap) *</label>
                <input
                  type="text"
                  required
                  placeholder="pl. Hővezetési tényező (λ)"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-accent font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Definíció / Válasz (Hátlap) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="pl. Megadja, hogy mekkora hőáram halad át az adott anyagon egységnyi felületen..."
                  value={newDef}
                  onChange={(e) => setNewDef(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-accent font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Kategória</label>
                <input
                  type="text"
                  placeholder="pl. Fizika &amp; Hőszigetelés"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-accent font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNewCardModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-700 shadow-md"
                >
                  Kártya Mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
