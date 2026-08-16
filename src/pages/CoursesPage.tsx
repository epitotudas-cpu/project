import { useState, useEffect } from 'react';
import { GraduationCap, Clock, Award, CheckCircle2, AlertCircle, PlayCircle, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  listCourses,
  getCourseDetails,
  submitQuizAnswers,
  getUserCertificates,
  type DetailedCourse,
  type QuizSubmissionResult,
} from '../services/educationService';
import type { Course, UserCertificate } from '../lib/supabase';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<DetailedCourse | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz' | 'certificates'>('lessons');
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      const data = await listCourses();
      setCourses(data);
      if (data.length > 0) {
        const details = await getCourseDetails(data[0].id);
        setSelectedCourse(details);
      }
      if (user) {
        const certs = await getUserCertificates(user.id);
        setCertificates(certs);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectCourse(courseId: string) {
    setLoading(true);
    try {
      const details = await getCourseDetails(courseId);
      setSelectedCourse(details);
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

  if (loading && !selectedCourse) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-2" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Page Title Header */}
      <div className="border-b border-[#1E1E1E] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <GraduationCap className="text-accent" size={32} />
            ÉpítőTudás Oktatási Központ & Tananyagok
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gyakorlati e-learning kurzusok, leckék, vizsgatesztek és digitális tanúsítványok
          </p>
        </div>
        <button
          onClick={() => setActiveTab('certificates')}
          className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent font-bold text-xs rounded-xl flex items-center gap-2 self-start transition-colors hover:bg-accent/20"
        >
          <Award size={16} /> Okleveleim ({certificates.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Course Catalog List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Elérhető Kurzusok</h2>
          <div className="space-y-3">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectCourse(c.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  selectedCourse?.course.id === c.id
                    ? 'bg-accent/10 border-accent text-white'
                    : 'bg-[#111] border-[#1E1E1E] text-gray-300 hover:border-[#333]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded">
                    {c.category}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} /> {c.duration_hours} óra
                  </span>
                </div>
                <h3 className="text-base font-bold leading-snug">{c.title}</h3>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected Course Workspace */}
        {selectedCourse && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 space-y-6">
              <div className="border-b border-[#1E1E1E] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase text-accent bg-accent/10 px-2.5 py-0.5 rounded">
                    {selectedCourse.course.category}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-2">{selectedCourse.course.title}</h2>
                </div>

                {/* Workspace Tab Bar */}
                <div className="flex items-center gap-1 bg-[#1A1A1A] p-1 rounded-xl border border-[#2A2A2A] self-start">
                  <button
                    onClick={() => setActiveTab('lessons')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeTab === 'lessons' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Leckék
                  </button>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeTab === 'quiz' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Vizsgateszt
                  </button>
                </div>
              </div>

              {/* Tab Content 1: Lessons */}
              {activeTab === 'lessons' && (
                <div className="space-y-6">
                  {/* Lesson Navigation Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.lessons.map((les, idx) => (
                      <button
                        key={les.id}
                        onClick={() => setActiveLessonIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          activeLessonIndex === idx
                            ? 'bg-accent/20 border border-accent text-accent font-bold'
                            : 'bg-[#1A1A1A] border border-[#2A2A2A] text-gray-400'
                        }`}
                      >
                        <FileText size={14} /> Lecke #{idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Active Lesson Display */}
                  {selectedCourse.lessons[activeLessonIndex] && (
                    <div className="bg-[#161616] border border-[#222] rounded-xl p-6 space-y-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <PlayCircle className="text-accent" size={20} />
                        {selectedCourse.lessons[activeLessonIndex].title}
                      </h3>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                        {selectedCourse.lessons[activeLessonIndex].content}
                      </p>

                      <div className="pt-4 border-t border-[#222] flex justify-between items-center">
                        <span className="text-xs text-gray-500">Gyakorlati tananyag</span>
                        {activeLessonIndex < selectedCourse.lessons.length - 1 && (
                          <button
                            onClick={() => setActiveLessonIndex((prev) => prev + 1)}
                            className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl flex items-center gap-1.5"
                          >
                            Következő lecke <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content 2: Quiz */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  {quizResult ? (
                    <div className="p-6 bg-[#161616] border border-[#222] rounded-xl text-center space-y-4">
                      <div className="inline-flex p-3 rounded-full bg-accent/10 border border-accent/20 text-accent">
                        {quizResult.passed ? <CheckCircle2 size={36} /> : <AlertCircle size={36} />}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {quizResult.passed ? 'Sikeres Vizsga!' : 'Sikertelen Próbálkozás'}
                      </h3>
                      <p className="text-sm text-gray-300">
                        Eredményed: <strong>{quizResult.scorePercentage}%</strong> ({quizResult.correctCount} / {quizResult.totalQuestions} helyes válasz).
                        {quizResult.passed ? ' Elérted a 75%-os ponthatárt!' : ' Próbáld újra a leckék átismétlése után!'}
                      </p>

                      {quizResult.passed && quizResult.certificate && (
                        <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl text-left space-y-2 max-w-md mx-auto">
                          <div className="text-xs text-accent font-bold uppercase">Digital Certificate Issued</div>
                          <div className="text-sm font-bold text-white">Igazolás Kód: {quizResult.certificate.certificate_code}</div>
                          <div className="text-xs text-gray-400">Kiállítva: {new Date(quizResult.certificate.issued_at).toLocaleDateString('hu-HU')}</div>
                        </div>
                      )}

                      <button
                        onClick={() => setQuizResult(null)}
                        className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl"
                      >
                        Újrázás
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleQuizSubmit} className="space-y-6">
                      {selectedCourse.questions.map((q, qIdx) => (
                        <div key={q.id} className="bg-[#161616] border border-[#222] rounded-xl p-5 space-y-3">
                          <h4 className="text-sm font-bold text-white">
                            {qIdx + 1}. {q.question}
                          </h4>
                          <div className="space-y-2">
                            {q.options_json.map((opt, optIdx) => (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                                  quizAnswers[q.id] === optIdx
                                    ? 'bg-accent/10 border-accent text-white'
                                    : 'bg-[#1E1E1E] border-[#2E2E2E] text-gray-300 hover:border-gray-500'
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
                        className="w-full py-3 bg-accent hover:bg-accent-hover text-black font-bold text-sm rounded-xl transition-colors"
                      >
                        Vizsgateszt Beküldése & Kiértékelése
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Tab Content 3: Certificates */}
              {activeTab === 'certificates' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="text-accent" size={20} />
                    Saját Digitális Tanúsítványok
                  </h3>
                  {certificates.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 border border-[#1E1E1E] rounded-xl">
                      Még nem szereztél tanúsítványt. Töltsd ki a vizsgateszteket sikeresen!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certificates.map((cert) => (
                        <div key={cert.id} className="bg-[#161616] border border-[#222] rounded-xl p-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase text-accent bg-accent/10 px-2 py-0.5 rounded">
                              Digitális Oklevél
                            </span>
                            <span className="text-xs text-green-400 font-bold">{cert.score_achieved}%</span>
                          </div>
                          <div className="text-sm font-bold text-white">{cert.certificate_code}</div>
                          <div className="text-xs text-gray-500">
                            Kiállítva: {new Date(cert.issued_at).toLocaleDateString('hu-HU')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
