import { useState, useEffect, useCallback } from 'react';
import { Pencil, XCircle, Plus, BookOpen, HelpCircle, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../lib/permissions';
import { supabase, type LearningCourse, type Quiz, type LearningStatus } from '../lib/supabase';
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
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';

const STATUS_BADGE: Record<LearningStatus, { label: string; class: string }> = {
  draft: { label: 'Piszkozat', class: 'bg-slate-800 text-slate-300 border-slate-700' },
  pending: { label: 'Jóváhagyásra vár', class: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  review: { label: 'Felülvizsgálat', class: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  approved: { label: 'Jóváhagyva', class: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  published: { label: 'Közzétéve', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  rejected: { label: 'Elutasítva', class: 'bg-red-500/10 text-red-300 border-red-500/30' },
  archived: { label: 'Archivált', class: 'bg-slate-800 text-slate-400 border-slate-700' },
};

interface PartnerLearningPageProps {
  partnerId?: string;
  partnerName?: string;
}

export default function PartnerLearningPage({ partnerId: propPartnerId, partnerName }: PartnerLearningPageProps = {}) {
  const toast = useToast();
  const { profile } = useAuth();
  const profilePartnerId = (profile as (typeof profile & { partner_id?: string }) | null)?.partner_id;
  const [resolvedPartnerId, setResolvedPartnerId] = useState<string | undefined>(propPartnerId || profilePartnerId);
  const currentPartnerId = propPartnerId || resolvedPartnerId || profilePartnerId;
  const hasPartnerAccess = Boolean(currentPartnerId) || isAdmin(profile);
  const currentPartnerName = partnerName || profile?.full_name || 'Partner Kft.';

  useEffect(() => {
    if (propPartnerId || profilePartnerId || !profile?.id) {
      setResolvedPartnerId(propPartnerId || profilePartnerId);
      return;
    }
    let active = true;
    void supabase
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', profile.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.partner_id) {
          setResolvedPartnerId(data.partner_id);
        }
      });
    return () => {
      active = false;
    };
  }, [propPartnerId, profilePartnerId, profile?.id]);

  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes'>('courses');
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Modals
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<LearningCourse | null>(null);

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const loadData = useCallback(async () => {
    const adminUser = isAdmin(profile);
    if (!currentPartnerId && !adminUser) {
      setCourses([]);
      setQuizzes([]);
      return;
    }
    try {
      const filter = currentPartnerId
        ? { partnerId: currentPartnerId, scope: adminUser ? ('admin' as const) : ('partner' as const) }
        : { scope: 'admin' as const };
      const [cData, qData] = await Promise.all([
        listCourses(filter),
        listQuizzes(filter),
      ]);
      setCourses(cData);
      setQuizzes(qData);
    } catch (e) {
      console.warn('Hiba a partner oktatási adatok betöltésekor:', e);
      toast.error('Nem sikerült betölteni a partner oktatási anyagokat.');
    }
  }, [currentPartnerId, profile, toast]);

  useEffect(() => {
    loadData();
    window.addEventListener('learning-updated', loadData);
    return () => window.removeEventListener('learning-updated', loadData);
  }, [loadData]);

  const handleSubmitForReviewCourse = async (id: string) => {
    try {
      await setCourseStatus(id, 'pending');
      toast.success('Tananyag beküldve ellenőrzésre.');
      await loadData();
    } catch (e) {
      console.warn('Hiba a tananyag beküldésekor:', e);
      toast.error(e instanceof Error ? e.message : 'Hiba a tananyag beküldésekor.');
    }
  };

  const handleSubmitForReviewQuiz = async (id: string) => {
    try {
      await setQuizStatus(id, 'pending');
      toast.success('Teszt beküldve ellenőrzésre.');
      await loadData();
    } catch (e) {
      console.warn('Hiba a teszt beküldésekor:', e);
      toast.error(e instanceof Error ? e.message : 'Hiba a teszt beküldésekor.');
    }
  };

  const handleDeleteCourse = (id: string) => {
    setConfirmState({
      title: 'Tananyag törlése',
      message: 'Biztosan törölni szeretnéd ezt a saját tananyagot?',
      onConfirm: async () => {
        try {
          await deleteCourse(id);
          toast.success('Tananyag törölve.');
          await loadData();
        } catch (e) {
          console.warn('Hiba a tananyag törlésekor:', e);
          toast.error(e instanceof Error ? e.message : 'Hiba a tananyag törlésekor.');
        }
      },
    });
  };

  const handleDeleteQuiz = (id: string) => {
    setConfirmState({
      title: 'Teszt törlése',
      message: 'Biztosan törölni szeretnéd ezt a saját tesztet?',
      onConfirm: async () => {
        try {
          await deleteQuiz(id);
          toast.success('Teszt törölve.');
          await loadData();
        } catch (e) {
          console.warn('Hiba a teszt törlésekor:', e);
          toast.error(e instanceof Error ? e.message : 'Hiba a teszt törlésekor.');
        }
      },
    });
  };

  if (!hasPartnerAccess) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center space-y-2 shadow-sm">
          <AlertCircle className="mx-auto text-amber-400" size={28} />
          <h2 className="text-lg font-bold text-slate-100">Nincs jogosult partnerfiók</h2>
          <p className="text-sm text-slate-400">
            A partner oktatási anyagok eléréséhez érvényes partner-hozzárendelés vagy adminisztrátori jogosultság szükséges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <BookOpen size={13} /> {currentPartnerName ? `${currentPartnerName} • ` : ''}Oktatás &amp; Tesztek
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Saját Oktatási Tananyagok &amp; Tesztek
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Hozz létre oktatási anyagokat és teszteket, majd küldd be őket ellenőrzésre az adminisztrátornak.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingCourse(null);
              setCourseModalOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} /> Új Saját Tananyag
          </button>
          <button
            onClick={() => {
              setEditingQuiz(null);
              setQuizModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            <Plus size={15} /> Új Saját Teszt
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-slate-900/80 rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-lg flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-blue-500 text-slate-950 shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <BookOpen size={14} /> Saját Tananyagok ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'quizzes'
              ? 'bg-blue-500 text-slate-950 shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
          }`}
        >
          <HelpCircle size={14} /> Saját Tesztek ({quizzes.length})
        </button>
      </div>

      {/* COURSES CARDS */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {courses.length === 0 ? (
            <div className="md:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-10 sm:p-12 text-center space-y-3 shadow-lg">
              <BookOpen size={48} className="mx-auto text-slate-600" />
              <h3 className="text-lg font-bold text-slate-200">Még nincs saját tananyagod</h3>
              <p className="text-slate-400 text-xs">Hozz létre egy új tananyagot a fenti gombra kattintva!</p>
            </div>
          ) : (
            courses.map((course) => {
              const badge = STATUS_BADGE[course.status] || {
                label: 'Elbírálás alatt',
                class: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
              };

              return (
                <div
                  key={course.id}
                  className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-lg space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {course.chapters?.length || 0} fejezet
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white">{course.title}</h3>
                    <p className="text-xs text-slate-400 font-medium line-clamp-2">{course.excerpt}</p>

                    {/* REJECTION NOTE CALLOUT IF REJECTED BY ADMIN */}
                    {course.status === 'rejected' && course.rejection_note && (
                      <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-extrabold text-red-300 flex items-center gap-1">
                          <AlertCircle size={14} /> Adminisztrátori Indoklás Az Elutasításról:
                        </span>
                        <p className="text-red-200 font-medium">{course.rejection_note}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {course.status === 'draft' || course.status === 'rejected' ? (
                      <button
                        onClick={() => handleSubmitForReviewCourse(course.id)}
                        className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send size={13} /> Beküldés Ellenőrzésre
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold italic">Beküldve ellenőrzésre</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseModalOpen(true);
                        }}
                        className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer"
                        title="Szerkesztés"
                        aria-label="Tananyag szerkesztése"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-slate-300 hover:text-red-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer"
                        title="Törlés"
                        aria-label="Tananyag törlése"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* QUIZZES CARDS */}
      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {quizzes.length === 0 ? (
            <div className="md:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-10 sm:p-12 text-center space-y-3 shadow-lg">
              <HelpCircle size={48} className="mx-auto text-slate-600" />
              <h3 className="text-lg font-bold text-slate-200">Még nincs saját teszted</h3>
              <p className="text-slate-400 text-xs">Hozz létre egy új tesztet a fenti gombra kattintva!</p>
            </div>
          ) : (
            quizzes.map((quiz) => {
              const badge = STATUS_BADGE[quiz.status] || {
                label: 'Elbírálás alatt',
                class: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
              };

              return (
                <div
                  key={quiz.id}
                  className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-lg space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {quiz.questions?.length || 0} kérdés
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white">{quiz.title}</h3>
                    <p className="text-xs text-slate-400 font-medium line-clamp-2">{quiz.description}</p>

                    {quiz.status === 'rejected' && quiz.rejection_note && (
                      <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-xs space-y-1">
                        <span className="font-extrabold text-red-300 flex items-center gap-1">
                          <AlertCircle size={14} /> Adminisztrátori Indoklás Az Elutasításról:
                        </span>
                        <p className="text-red-200 font-medium">{quiz.rejection_note}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    {quiz.status === 'draft' || quiz.status === 'rejected' ? (
                      <button
                        onClick={() => handleSubmitForReviewQuiz(quiz.id)}
                        className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send size={13} /> Beküldés Ellenőrzésre
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold italic">Beküldve ellenőrzésre</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingQuiz(quiz);
                          setQuizModalOpen(true);
                        }}
                        className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer"
                        title="Szerkesztés"
                        aria-label="Teszt szerkesztése"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-2 text-slate-300 hover:text-red-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl cursor-pointer"
                        title="Törlés"
                        aria-label="Teszt törlése"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* EDIT MODALS */}
      <EditCourseModal
        course={editingCourse}
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        onSaved={loadData}
        partnerId={currentPartnerId}
        partnerName={currentPartnerName}
      />

      <EditQuizModal
        quiz={editingQuiz}
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        onSaved={loadData}
        partnerId={currentPartnerId}
        partnerName={currentPartnerName}
      />

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel="Törlés"
        destructive
        onConfirm={async () => {
          if (!confirmState) return;
          try {
            await confirmState.onConfirm();
          } finally {
            setConfirmState(null);
          }
        }}
        onCancel={() => setConfirmState(null)}
      />

    </div>
  );
}
