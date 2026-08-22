import { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  FileText,
  ChevronRight,
  Search,
  Filter,
  X,
  BookOpen,
  Compass,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SectionSubNav from '../components/SectionSubNav';
import {
  listCourses,
  getCourseDetails,
  submitQuizAnswers,
  getUserCertificates,
  DEFAULT_LEARNING_PATHS,
  type DetailedCourse,
  type QuizSubmissionResult,
  type LearningPath,
} from '../services/educationService';
import type { Course, UserCertificate } from '../lib/supabase';

interface CoursesPageProps {
  onNavigate?: (page: string) => void;
}

export default function CoursesPage({ onNavigate }: CoursesPageProps) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<DetailedCourse | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz' | 'certificates'>('lessons');
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);

  // Modals & Drawers
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [workspaceCourseId, setWorkspaceCourseId] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      const data = await listCourses();
      setCourses(data);
      if (user) {
        const certs = await getUserCertificates(user.id);
        setCertificates(certs);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenCourseModal(courseId: string) {
    setLoading(true);
    try {
      const details = await getCourseDetails(courseId);
      setSelectedCourse(details);
      setWorkspaceCourseId(courseId);
      setActiveLessonIndex(0);
      setQuizAnswers({});
      setQuizResult(null);
      setActiveTab('lessons');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuizSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCourse || !user) return;

    const result = await submitQuizAnswers(user.id, selectedCourse.course.id, quizAnswers);
    setQuizResult(result);
    if (result.passed) {
      const certs = await getUserCertificates(user.id);
      setCertificates(certs);
    }
  }

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Search
      const matchesSearch =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Category
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;

      // Difficulty
      const matchesDifficulty =
        selectedDifficulty === 'all' || (c.difficulty || 'beginner') === selectedDifficulty;

      // Duration
      let matchesDuration = true;
      if (selectedDuration === 'short') matchesDuration = c.duration_hours < 5;
      if (selectedDuration === 'long') matchesDuration = c.duration_hours >= 5;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesDuration;
    });
  }, [courses, searchQuery, selectedCategory, selectedDifficulty, selectedDuration]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [courses]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedDuration('all');
  };

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate?.('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => onNavigate?.('paths')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Pályák &amp; Képzések
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Képzések &amp; Kurzusok</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                <GraduationCap size={14} /> Építőipari E-Learning &amp; Szakmai Tanúsítványok
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Építőipari képzések, valódi gyakorlati tudással
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Gyakorlati e-learning kurzusok, leckék, vizsgatesztek és digitális tanúsítványok szakembereknek, tanulóknak és kivitelezőknek.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#katalogus"
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-primary text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <BookOpen size={16} /> Kurzusok felfedezése
              </a>
              <button
                onClick={() => setShowCertificatesModal(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2"
              >
                <Award size={16} className="text-accent" /> Okleveleim ({certificates.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
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
            label: 'Tanulási útvonalak',
            page: 'paths',
            icon: <Layers size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Képzések & kurzusok',
            page: 'courses',
            icon: <GraduationCap size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Karrier & állások',
            page: 'careers',
            icon: <Briefcase size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* SEARCH & FILTERS CONTAINER */}
        <section id="katalogus" className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Keress képzést, témát vagy szakmát..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Desktop Filter Pills */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-accent"
              >
                <option value="all">Minden kategória</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Difficulty selector */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-accent"
              >
                <option value="all">Minden nehézségi szint</option>
                <option value="beginner">Kezdő</option>
                <option value="intermediate">Középhaladó</option>
                <option value="master">Mester / Haladó</option>
              </select>

              {/* Duration selector */}
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-accent"
              >
                <option value="all">Minden időtartam</option>
                <option value="short">Rövid (&lt; 5 óra)</option>
                <option value="long">Hosszú (5+ óra)</option>
              </select>

              {(selectedCategory !== 'all' || selectedDifficulty !== 'all' || selectedDuration !== 'all' || searchQuery) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  Szűrők törlése
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center justify-between gap-2">
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="w-full py-2.5 px-4 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 flex items-center justify-center gap-2"
              >
                <Filter size={16} /> Szűrők beállítása
              </button>
            </div>
          </div>

          {/* Mobile Filter Drawer / Collapsible */}
          {mobileFilterOpen && (
            <div className="lg:hidden pt-4 border-t border-gray-100 space-y-3 animate-fadeIn">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Kategória</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-800"
                >
                  <option value="all">Minden kategória</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Nehézségi szint</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-800"
                >
                  <option value="all">Minden nehézségi szint</option>
                  <option value="beginner">Kezdő</option>
                  <option value="intermediate">Középhaladó</option>
                  <option value="master">Mester / Haladó</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Időtartam</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-800"
                >
                  <option value="all">Minden időtartam</option>
                  <option value="short">Rövid (&lt; 5 óra)</option>
                  <option value="long">Hosszú (5+ óra)</option>
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 rounded-lg"
                >
                  Alaphelyzet
                </button>
              </div>
            </div>
          )}
        </section>

        {/* COURSES CATALOG GRID */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <GraduationCap className="text-accent" size={22} />
              Elérhető Kurzusok ({filteredCourses.length})
            </h2>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Gyakorlati tananyagok &amp; digitális igazolások
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-2" />
              <p className="text-xs">Kurzusok betöltése...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-full w-fit mx-auto">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Nincs a szűrésnek megfelelő képzés</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Próbáld meg megváltoztatni a keresési kifejezést vagy töröld a kategória és nehézségi szűrőket.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition-colors inline-flex items-center gap-1.5"
              >
                Szűrők alaphelyzetbe állítása
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => {
                const diffLabel =
                  c.difficulty === 'master'
                    ? 'Mester'
                    : c.difficulty === 'intermediate'
                    ? 'Középhaladó'
                    : 'Kezdő';
                const diffBadgeClass =
                  c.difficulty === 'master'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : c.difficulty === 'intermediate'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                return (
                  <div
                    key={c.id}
                    className="bg-white border border-gray-200 hover:border-accent rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between space-y-5 group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                          {c.category}
                        </span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md ${diffBadgeClass}`}>
                          {diffLabel}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                        {c.title}
                      </h3>

                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock size={14} className="text-gray-400 shrink-0" />
                          <span>{c.duration_hours} óra képzés</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Award size={14} className="text-emerald-600 shrink-0" />
                          <span>Tanúsítvánnyal</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenCourseModal(c.id)}
                        className="w-full py-2.5 bg-primary hover:bg-accent hover:text-primary text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 group-hover:shadow-lg"
                      >
                        <span>Kurzus megnyitása</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* LEARNING PATHS SECTION */}
        <section id="utvonalak" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Strukturált fejlődés</span>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Compass className="text-primary" size={24} />
              Tanulási Útvonalak &amp; Szakmai Karrierlépcsők
            </h2>
            <p className="text-xs text-gray-500">
              Kapcsold össze a szakmákat, képzéseket és a következő karrierlépést a sikeres előrelépésért.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEFAULT_LEARNING_PATHS.map((path: LearningPath) => (
              <div
                key={path.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${path.badgeColor}`}>
                      {path.tradeName}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">{path.level}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900">{path.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{path.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Következő karrierlépés:</span>
                    <span className="font-extrabold text-primary flex items-center gap-1">
                      {path.nextCareerStep} <ArrowRight size={13} />
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (path.courseIds.length > 0) {
                        handleOpenCourseModal(path.courseIds[0]);
                      }
                    }}
                    className="w-full py-2 bg-white border border-gray-300 hover:border-primary text-gray-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Útvonal elkezdése</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECONDARY USER CERTIFICATES BANNER */}
        <section className="bg-primary text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-primary-700">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
              <Award size={13} /> Saját Eredményeid
            </span>
            <h3 className="text-xl md:text-2xl font-black text-white">
              Megszerzett Digitális Tanúsítványaid
            </h3>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Az ÉpítőTudás által kiállított digitális oklevelek igazolják a szakmai elméleti és gyakorlati ismereteid sikeres teljesítését.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => setShowCertificatesModal(true)}
              className="px-5 py-3 bg-accent hover:bg-accent-hover text-primary font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Award size={16} /> Okleveleim Megtekintése ({certificates.length})
            </button>
          </div>
        </section>

      </div>

      {/* COURSE WORKSPACE / QUIZ MODAL OVERLAY */}
      {workspaceCourseId && selectedCourse && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 space-y-6 p-6 md:p-8 relative">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                  {selectedCourse.course.category}
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mt-2">
                  {selectedCourse.course.title}
                </h2>
              </div>

              <button
                onClick={() => setWorkspaceCourseId(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'lessons'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <PlayCircle size={15} /> Leckék ({selectedCourse.lessons.length})
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'quiz'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ShieldCheck size={15} /> Vizsgateszt ({selectedCourse.questions.length} kérdés)
              </button>
            </div>

            {/* TAB 1: LESSONS */}
            {activeTab === 'lessons' && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.lessons.map((les, idx) => (
                    <button
                      key={les.id}
                      onClick={() => setActiveLessonIndex(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeLessonIndex === idx
                          ? 'bg-accent/20 border border-accent text-primary font-black'
                          : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <FileText size={14} /> Lecke #{idx + 1}
                    </button>
                  ))}
                </div>

                {selectedCourse.lessons[activeLessonIndex] ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                      <PlayCircle className="text-accent" size={22} />
                      {selectedCourse.lessons[activeLessonIndex].title}
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-medium">
                      {selectedCourse.lessons[activeLessonIndex].content}
                    </p>

                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-semibold">Gyakorlati e-learning tananyag</span>
                      {activeLessonIndex < selectedCourse.lessons.length - 1 ? (
                        <button
                          onClick={() => setActiveLessonIndex((prev) => prev + 1)}
                          className="px-4 py-2 bg-primary hover:bg-primary-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          Következő lecke <ChevronRight size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveTab('quiz')}
                          className="px-4 py-2 bg-accent hover:bg-accent-hover text-primary font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          Vizsgateszt Kitöltése <Zap size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-xs">Ehhez a kurzushoz még nem töltöttek fel leckét.</div>
                )}
              </div>
            )}

            {/* TAB 2: QUIZ */}
            {activeTab === 'quiz' && (
              <div className="space-y-6">
                {quizResult ? (
                  <div className="p-8 bg-gray-50 border border-gray-200 rounded-2xl text-center space-y-4">
                    <div className="inline-flex p-3 rounded-full bg-accent/20 text-accent">
                      {quizResult.passed ? <CheckCircle2 size={40} className="text-emerald-600" /> : <AlertCircle size={40} className="text-amber-600" />}
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">
                      {quizResult.passed ? 'Sikeres Vizsga!' : 'Sikertelen Próbálkozás'}
                    </h3>
                    <p className="text-sm text-gray-700">
                      Eredményed: <strong>{quizResult.scorePercentage}%</strong> ({quizResult.correctCount} / {quizResult.totalQuestions} helyes válasz).
                      {quizResult.passed ? ' Elérted a 75%-os ponthatárt!' : ' Próbáld újra a leckék átismétlése után!'}
                    </p>

                    {quizResult.passed && quizResult.certificate && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-1 max-w-md mx-auto">
                        <div className="text-xs text-emerald-800 font-bold uppercase">Digitális Tanúsítvány Kiállítva</div>
                        <div className="text-sm font-bold text-gray-900">Igazolás Kód: {quizResult.certificate.certificate_code}</div>
                        <div className="text-xs text-gray-500">Kiállítva: {new Date(quizResult.certificate.issued_at).toLocaleDateString('hu-HU')}</div>
                      </div>
                    )}

                    <button
                      onClick={() => setQuizResult(null)}
                      className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-700 transition-colors"
                    >
                      Újrázás
                    </button>
                  </div>
                ) : selectedCourse.questions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs">Ehhez a kurzushoz nem tartozik tesztkérdés.</div>
                ) : (
                  <form onSubmit={handleQuizSubmit} className="space-y-6">
                    {selectedCourse.questions.map((q, qIdx) => (
                      <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                        <h4 className="text-sm font-extrabold text-gray-900">
                          {qIdx + 1}. {q.question}
                        </h4>
                        <div className="space-y-2">
                          {q.options_json.map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                quizAnswers[q.id] === optIdx
                                  ? 'bg-accent/15 border-accent text-gray-900 font-bold'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={quizAnswers[q.id] === optIdx}
                                onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                                className="accent-accent"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      type="submit"
                      className="w-full py-3 bg-accent hover:bg-accent-hover text-primary font-black text-sm rounded-xl transition-all shadow-md"
                    >
                      Vizsgateszt Beküldése &amp; Kiértékelése
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* USER CERTIFICATES MODAL */}
      {showCertificatesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 space-y-6 border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Award className="text-accent" size={24} />
                Saját Digitális Tanúsítványaim ({certificates.length})
              </h2>
              <button onClick={() => setShowCertificatesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {certificates.length === 0 ? (
              <div className="p-8 text-center text-gray-500 border border-dashed border-gray-200 rounded-2xl space-y-2">
                <Award size={32} className="mx-auto text-gray-400" />
                <p className="text-xs font-semibold">Még nem szereztél digitális tanúsítványt.</p>
                <p className="text-[11px] text-gray-400">Válassz ki egy kurzust és töltsd ki a vizsgatesztet legalább 75%-os eredményel!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Hitelesített Oklevél
                      </span>
                      <span className="text-xs text-emerald-700 font-extrabold">{cert.score_achieved}%</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{cert.certificate_code}</div>
                    <div className="text-xs text-gray-500">
                      Kiállítva: {new Date(cert.issued_at).toLocaleDateString('hu-HU')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setShowCertificatesModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
