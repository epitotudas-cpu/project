import { useState, useEffect } from 'react';
import { X, Plus, Trash2, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { Quiz, QuizQuestion, CourseDifficulty, LearningStatus, QuestionType } from '../lib/supabase';
import { saveQuiz } from '../services/learningService';

interface EditQuizModalProps {
  quiz?: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  partnerId?: string | null;
  partnerName?: string | null;
}

export default function EditQuizModal({
  quiz,
  isOpen,
  onClose,
  onSaved,
  partnerId,
  partnerName,
}: EditQuizModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('cat-1');
  const [categoryName, setCategoryName] = useState('Építési technológiák');
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('beginner');
  const [passingScore, setPassingScore] = useState(75);
  const [timeLimit, setTimeLimit] = useState<number | null>(10);
  const [status, setStatus] = useState<LearningStatus>('published');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title || '');
      setDescription(quiz.description || '');
      setCategoryId(quiz.category_id || 'cat-1');
      setCategoryName(quiz.category_name || 'Építési technológiák');
      setDifficulty(quiz.difficulty || 'beginner');
      setPassingScore(quiz.passing_score_percent || 75);
      setTimeLimit(quiz.time_limit_minutes ?? 10);
      setStatus(quiz.status || 'published');
      setQuestions(quiz.questions || []);
    } else {
      setTitle('');
      setDescription('');
      setCategoryId('cat-1');
      setCategoryName('Építési technológiák');
      setDifficulty('beginner');
      setPassingScore(75);
      setTimeLimit(10);
      setStatus(partnerId ? 'draft' : 'published');
      setQuestions([
        {
          id: `q-${Date.now()}-1`,
          question: '1. Kérdés megfogalmazása...',
          question_type: 'single',
          options: ['Válaszlehetőség A', 'Válaszlehetőség B', 'Válaszlehetőség C', 'Válaszlehetőség D'],
          correct_options: [0],
          explanation: 'Részletes oktatási magyarázat a helyes válaszról...',
          points: 10,
        },
      ]);
    }
  }, [quiz, partnerId, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: 'Új tesztkérdés...',
      question_type: 'single',
      options: ['Válasz A', 'Válasz B'],
      correct_options: [0],
      explanation: 'Oktatási magyarázat...',
      points: 10,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: keyof QuizQuestion, val: any) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: val } : q)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSaving(true);
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9áéíóöőúüű]+/g, '-')
        .replace(/^-|-$/g, '');

      await saveQuiz({
        id: quiz?.id,
        title: title.trim(),
        slug: quiz?.slug || slug,
        description: description.trim(),
        category_id: categoryId,
        category_name: categoryName,
        difficulty,
        passing_score_percent: passingScore,
        time_limit_minutes: timeLimit,
        questions,
        status,
        partner_id: partnerId || quiz?.partner_id || null,
        partner_name: partnerName || quiz?.partner_name || null,
      });

      onSaved();
      onClose();
    } catch (e) {
      console.warn('Hiba a teszt mentésekor:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <HelpCircle size={20} className="text-accent" />
            {quiz ? 'Teszt Szerkesztése' : 'Új Teszt Létrehozása'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Teszt Neve *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-accent font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Leírás *</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-accent font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nehézségi Szint</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-accent"
              >
                <option value="beginner">Kezdő</option>
                <option value="intermediate">Középhaladó</option>
                <option value="advanced">Haladó</option>
                <option value="professional">Szakmai / Mester</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Sikerességi Küszöb (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold"
              />
            </div>
          </div>

          {/* QUESTIONS SECTION */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <HelpCircle size={16} className="text-accent" /> Tesztkérdések ({questions.length})
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Kérdés Hozzáadása
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-primary">{qIdx + 1}. Kérdés</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Kérdés megfogalmazása..."
                    value={q.question}
                    onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-bold"
                  />

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Oktatási Magyarázat (Hibás válasz esetén megjelenik a tanulónak):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Magyarázat a helyes válaszról..."
                      value={q.explanation}
                      onChange={(e) => handleQuestionChange(q.id, 'explanation', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl p-2 text-xs text-gray-900 font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white font-extrabold text-xs rounded-xl hover:bg-primary-700 shadow-md"
            >
              {saving ? 'Mentés...' : 'Teszt Mentése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
