import { useState, useEffect, useCallback } from 'react';
import { Search, Pencil, Eye, CheckCircle2, XCircle, Plus, BookOpen, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import type { LearningCourse, Quiz, LearningStatus } from '../lib/supabase';
import {
  listCourses,
  listQuizzes,
  setCourseStatus,
  setQuizStatus,
  deleteCourse,
  deleteQuiz,
} from '../services/learningService';
import EditCourseModal from '../components/EditCourseModal';
import EditQuizModal from '../components/EditQuizModal';

const STATUS_BADGE: Record<LearningStatus, { label: string; class: string }> = {
  draft: { label: 'Piszkozat', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  pending: { label: 'Jóváhagyásra vár', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  review: { label: 'Felülvizsgálat', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  approved: { label: 'Jóváhagyva', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  published: { label: 'Közzétéve', class: 'bg-green-500/10 text-green-400 border-green-500/20' },
  rejected: { label: 'Elutasítva', class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  archived: { label: 'Archivált', class: 'bg-gray-700/10 text-gray-500 border-gray-700/20' },
};

export default function AdminLearningPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes'>('courses');
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<LearningCourse | null>(null);

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // Rejection modal
  const [rejectModalItem, setRejectModalItem] = useState<{ id: string; type: 'course' | 'quiz'; title: string } | null>(null);
  const [rejectionNoteInput, setRejectionNoteInput] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cData, qData] = await Promise.all([
        listCourses({ status: statusFilter, search }),
        listQuizzes({ status: statusFilter, search }),
      ]);
      setCourses(cData);
      setQuizzes(qData);
    } catch (e) {
      console.warn('Hiba az admin oktatási adatok betöltésekor:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadData();
    window.addEventListener('learning-updated', loadData);
    return () => window.removeEventListener('learning-updated', loadData);
  }, [loadData]);

  const handleApproveCourse = async (id: string) => {
    await setCourseStatus(id, 'published');
    loadData();
  };

  const handleApproveQuiz = async (id: string) => {
    await setQuizStatus(id, 'published');
    loadData();
  };

  const handleConfirmReject = async () => {
    if (!rejectModalItem || !rejectionNoteInput.trim()) return;
    if (rejectModalItem.type === 'course') {
      await setCourseStatus(rejectModalItem.id, 'rejected', rejectionNoteInput.trim());
    } else {
      await setQuizStatus(rejectModalItem.id, 'rejected', rejectionNoteInput.trim());
    }
    setRejectModalItem(null);
    setRejectionNoteInput('');
    loadData();
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a tananyagot?')) {
      await deleteCourse(id);
      loadData();
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (confirm('Biztosan törölni szeretnéd ezt a tesztet?')) {
      await deleteQuiz(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6 p-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="text-accent" size={24} /> Tanulási &amp; Oktatási Rendszer Kezelése
          </h1>
          <p className="text-gray-400 text-xs font-medium mt-1">
            Központi tananyagok, tesztek és partneri beküldések jóváhagyási munkafolyamata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingCourse(null);
              setCourseModalOpen(true);
            }}
            className="px-4 py-2.5 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus size={15} /> Új Tananyag
          </button>
          <button
            onClick={() => {
              setEditingQuiz(null);
              setQuizModalOpen(true);
            }}
            className="px-4 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-700 border border-primary-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus size={15} /> Új Teszt
          </button>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="bg-[#1e293b] rounded-2xl p-4 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-accent text-black shadow-md'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <BookOpen size={14} /> Tananyagok ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'quizzes'
                ? 'bg-accent text-black shadow-md'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <HelpCircle size={14} /> Tesztek ({quizzes.length})
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Keresés..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-accent font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-200 focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="all">Minden státusz</option>
            <option value="published">Közzétéve</option>
            <option value="pending">Jóváhagyásra vár</option>
            <option value="draft">Piszkozat</option>
            <option value="rejected">Elutasítva</option>
          </select>
        </div>
      </div>

      {/* COURSES TABLE */}
      {activeTab === 'courses' && (
        <div className="bg-[#1e293b] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/60 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Tananyag Címe</th>
                  <th className="py-3 px-4">Kategória</th>
                  <th className="py-3 px-4">Szerző / Partner</th>
                  <th className="py-3 px-4">Nehézség</th>
                  <th className="py-3 px-4">Státusz</th>
                  <th className="py-3 px-4 text-right">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 font-medium">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 font-bold">
                      Nincs megjeleníthető tananyag.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => {
                    const badge = STATUS_BADGE[course.status] || STATUS_BADGE.published;

                    return (
                      <tr key={course.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                          {course.title}
                        </td>
                        <td className="py-3 px-4 text-gray-400">{course.category_name}</td>
                        <td className="py-3 px-4 text-gray-400">
                          {course.partner_name ? (
                            <span className="text-accent font-bold">Partner: {course.partner_name}</span>
                          ) : (
                            course.author
                          )}
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] font-extrabold">{course.difficulty}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {course.status === 'pending' && (
                              <button
                                onClick={() => handleApproveCourse(course.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <CheckCircle2 size={13} /> Jóváhagyás
                              </button>
                            )}
                            {course.status === 'pending' && (
                              <button
                                onClick={() =>
                                  setRejectModalItem({ id: course.id, type: 'course', title: course.title })
                                }
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <XCircle size={13} /> Elutasítás
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingCourse(course);
                                setCourseModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                              title="Szerkesztés"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"
                              title="Törlés"
                            >
                              <XCircle size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUIZZES TABLE */}
      {activeTab === 'quizzes' && (
        <div className="bg-[#1e293b] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/60 text-gray-400 uppercase tracking-wider font-extrabold border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Teszt Neve</th>
                  <th className="py-3 px-4">Kategória</th>
                  <th className="py-3 px-4">Küszöb</th>
                  <th className="py-3 px-4">Kérdések</th>
                  <th className="py-3 px-4">Státusz</th>
                  <th className="py-3 px-4 text-right">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 font-medium">
                {quizzes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 font-bold">
                      Nincs megjeleníthető teszt.
                    </td>
                  </tr>
                ) : (
                  quizzes.map((quiz) => {
                    const badge = STATUS_BADGE[quiz.status] || STATUS_BADGE.published;

                    return (
                      <tr key={quiz.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                          {quiz.title}
                        </td>
                        <td className="py-3 px-4 text-gray-400">{quiz.category_name}</td>
                        <td className="py-3 px-4 text-emerald-400 font-extrabold">{quiz.passing_score_percent}%</td>
                        <td className="py-3 px-4 text-gray-400">{quiz.questions?.length || 0} db</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {quiz.status === 'pending' && (
                              <button
                                onClick={() => handleApproveQuiz(quiz.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                              >
                                <CheckCircle2 size={13} /> Jóváhagyás
                              </button>
                            )}
                            {quiz.status === 'pending' && (
                              <button
                                onClick={() =>
                                  setRejectModalItem({ id: quiz.id, type: 'quiz', title: quiz.title })
                                }
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                              >
                                <XCircle size={13} /> Elutasítás
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingQuiz(quiz);
                                setQuizModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                              title="Szerkesztés"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"
                              title="Törlés"
                            >
                              <XCircle size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODALS */}
      <EditCourseModal
        course={editingCourse}
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        onSaved={loadData}
      />

      <EditQuizModal
        quiz={editingQuiz}
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        onSaved={loadData}
      />

      {/* REJECTION REASON MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-red-500" /> Tartalom Elutasítása Indoklással
            </h3>
            <p className="text-xs text-gray-400">
              Indokold meg, miért kell a kért javításokat elvégeznie a partnernek a(z) <strong>„{rejectModalItem.title}”</strong> tartalmon!
            </p>
            <textarea
              rows={3}
              required
              placeholder="pl. Kérjük bővítsd a munkavédelmi fejezetet és pontosítsd az ábrák forrását..."
              value={rejectionNoteInput}
              onChange={(e) => setRejectionNoteInput(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
              >
                Mégse
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                Elutasítás Beküldése
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
