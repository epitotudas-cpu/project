import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  Award,
  BookOpen,
  Zap,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Quiz, QuizAttempt } from '../lib/supabase';
import { getQuizBySlug, saveQuizAttempt } from '../services/learningService';

interface QuizPlayerPageProps {
  quizId: string;
  onNavigate: (page: string, params?: { slug?: string; quizId?: string }) => void;
}

export default function QuizPlayerPage({ quizId, onNavigate }: QuizPlayerPageProps) {
  const { user } = useAuth();
  const userId = user?.id || 'anon_guest';

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // ── QUIZ RUNTIME STATE ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number[]>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [resultAttempt, setResultAttempt] = useState<QuizAttempt | null>(null);

  const loadQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getQuizBySlug(quizId);
      setQuiz(data);
    } catch (e) {
      console.warn('Hiba a teszt betöltésekor:', e);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    loadQuiz();
  }, [loadQuiz]);

  const handleSelectOption = (questionId: string, optionIdx: number, isMultiple: boolean) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        const next = current.includes(optionIdx)
          ? current.filter((i) => i !== optionIdx)
          : [...current, optionIdx];
        return { ...prev, [questionId]: next };
      } else {
        return { ...prev, [questionId]: [optionIdx] };
      }
    });
  };

  const handleFinishQuiz = () => {
    if (!quiz) return;

    let score = 0;
    let maxScore = 0;

    quiz.questions.forEach((q) => {
      maxScore += q.points || 10;
      const userSelected = selectedAnswers[q.id] || [];
      const correct = q.correct_options || [];

      // Exact match for correct options
      const isCorrect =
        userSelected.length === correct.length &&
        userSelected.every((val) => correct.includes(val));

      if (isCorrect) {
        score += q.points || 10;
      }
    });

    const percentage = Math.round((score / Math.max(1, maxScore)) * 100);
    const passed = percentage >= quiz.passing_score_percent;

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      user_id: userId,
      quiz_id: quiz.id,
      score,
      max_score: maxScore,
      percentage,
      passed,
      user_answers: selectedAnswers,
      completed_at: new Date().toISOString(),
    };

    saveQuizAttempt(attempt);
    setResultAttempt(attempt);
    setIsFinished(true);
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
    setResultAttempt(null);
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-3" />
          <p className="text-gray-600 text-sm font-medium">Teszt betöltése...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h2 className="text-xl font-bold text-gray-900">A keresett teszt nem található</h2>
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

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      
      {/* Top Banner Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button onClick={() => onNavigate('learning')} className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={13} /> Tanulási Központ
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">{quiz.title}</span>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="bg-accent text-black font-extrabold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider">
                {quiz.category_name || 'Teszt'}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1">{quiz.title}</h1>
            </div>

            <div className="text-xs bg-white/10 border border-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
              Sikerességi küszöb: <strong className="text-accent">{quiz.passing_score_percent}%</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {!isFinished ? (
          /* ================================================================== */
          /* QUESTION PLAYER RUNTIME */
          /* ================================================================== */
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Progress Bar & Header Counter */}
            <div className="space-y-2 border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                <span>Kérdés {currentIndex + 1} / {questions.length}</span>
                <span>Pontérték: {currentQuestion?.points || 10} pont</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / Math.max(1, questions.length)) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            {currentQuestion && (
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                  {currentQuestion.question}
                </h2>

                {/* Options List */}
                <div className="space-y-3">
                  {(currentQuestion.options || currentQuestion.options_json || []).map((opt, optIdx) => {
                    const isSelected = (selectedAnswers[currentQuestion.id] || []).includes(optIdx);

                    return (
                      <button
                        key={optIdx}
                        onClick={() =>
                          handleSelectOption(
                            currentQuestion.id,
                            optIdx,
                            currentQuestion.question_type === 'multiple'
                          )
                        }
                        className={`w-full p-4 rounded-2xl border text-left text-sm font-extrabold transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${
                              isSelected
                                ? 'bg-accent text-black border-accent'
                                : 'bg-white text-gray-600 border-gray-300'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-accent shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation Action Footer */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl disabled:opacity-40 transition-all flex items-center gap-1"
              >
                <ArrowLeft size={15} /> Előző Kérdés
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Következő Kérdés <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleFinishQuiz}
                  className="px-6 py-3 bg-accent hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap size={16} /> Teszt Befejezése &amp; Értékelés
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ================================================================== */
          /* TEST RESULT & EDUCATIONAL EXPLANATIONS SCREEN */
          /* ================================================================== */
          resultAttempt && (
            <div className="space-y-6">
              
              {/* Result Summary Banner */}
              <div
                className={`rounded-3xl p-8 border shadow-xl text-center space-y-4 ${
                  resultAttempt.passed
                    ? 'bg-emerald-950 text-white border-emerald-700'
                    : 'bg-red-950 text-white border-red-700'
                }`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border border-white/20 mb-2">
                  {resultAttempt.passed ? (
                    <Award size={36} className="text-accent" />
                  ) : (
                    <XCircle size={36} className="text-red-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                    {resultAttempt.passed ? 'GRATULÁLUNK! SIKERES TESZT ✓' : 'SAJNOS NEM SIKERÜLT (PRÓBÁLD ÚJRA)'}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black">{resultAttempt.percentage}% ÉRTÉKELÉS</h2>
                  <p className="text-xs text-gray-300 font-semibold">
                    Elért pontszám: {resultAttempt.score} / {resultAttempt.max_score} pont (Küszöb: {quiz.passing_score_percent}%)
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={handleRetake}
                    className="px-5 py-2.5 bg-white text-gray-900 font-extrabold text-xs rounded-xl hover:bg-gray-100 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw size={15} /> Teszt Újrakészítése
                  </button>

                  <button
                    onClick={() => onNavigate('learning')}
                    className="px-5 py-2.5 bg-accent text-black font-extrabold text-xs rounded-xl hover:bg-amber-400 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Vissza a Tanulás menübe
                  </button>
                </div>
              </div>

              {/* DETAILED EDUCATIONAL ANSWERS & EXPLANATIONS */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <BookOpen size={20} className="text-accent" /> Részletes Kiértékelés &amp; Magyarázatok
                </h3>

                <div className="space-y-6">
                  {questions.map((q, qIdx) => {
                    const userSelected = resultAttempt.user_answers[q.id] || [];
                    const correct = q.correct_options || [];
                    const isCorrect =
                      userSelected.length === correct.length &&
                      userSelected.every((val) => correct.includes(val));

                    return (
                      <div
                        key={q.id}
                        className={`p-6 rounded-3xl border space-y-4 ${
                          isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                              {qIdx + 1}. Kérdés
                            </span>
                            <h4 className="text-base font-bold text-gray-900">{q.question}</h4>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-red-600 text-white'
                            }`}
                          >
                            {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                            {isCorrect ? 'Helyes' : 'Hibás'}
                          </span>
                        </div>

                        {/* Options breakdown */}
                        <div className="space-y-2">
                          {(q.options || q.options_json || []).map((opt, oIdx) => {
                            const wasChosen = userSelected.includes(oIdx);
                            const isRight = correct.includes(oIdx);

                            return (
                              <div
                                key={oIdx}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                                  isRight
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-black'
                                    : wasChosen
                                    ? 'bg-red-100 border-red-300 text-red-950'
                                    : 'bg-white border-gray-200 text-gray-600'
                                }`}
                              >
                                <span>
                                  {String.fromCharCode(65 + oIdx)}. {opt}
                                </span>
                                <span className="text-[10px] font-semibold">
                                  {isRight ? '✓ Helyes Válasz' : wasChosen ? '✗ A te válaszod' : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Educational Explanation Box */}
                        {q.explanation && (
                          <div className="bg-white p-4 rounded-2xl border border-amber-200 text-xs font-medium text-amber-950 space-y-1 shadow-2xs">
                            <span className="font-extrabold text-amber-800 flex items-center gap-1">
                              💡 Oktatási Magyarázat:
                            </span>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
}
