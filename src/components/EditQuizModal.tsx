import { useState, useEffect } from 'react';
import { X, Plus, Trash2, HelpCircle } from 'lucide-react';
import type { Quiz, QuizQuestion, CourseDifficulty, LearningStatus } from '../lib/supabase';
import { saveQuiz } from '../services/learningService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

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
  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || siteSettings.adminAccentColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  const fieldStyle: React.CSSProperties = {
    backgroundColor: inputBg,
    borderColor: cardBorder,
    color: inputTextColor,
  };

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

  const handleOptionChange = (qId: string, optIdx: number, val: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qId) return q;
        const updatedOpts = [...(q.options || [])];
        updatedOpts[optIdx] = val;
        return { ...q, options: updatedOpts };
      })
    );
  };

  const handleCorrectOptionSelect = (qId: string, optIdx: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qId) return q;
        return { ...q, correct_options: [optIdx] };
      })
    );
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="rounded-3xl border max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 style={{ color: textColor }} className="text-xl font-black flex items-center gap-2">
            <HelpCircle size={20} style={{ color: cardHighlight }} />
            {quiz ? 'Teszt Szerkesztése' : 'Új Teszt Létrehozása'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label style={{ color: textColor }} className="block text-xs font-bold mb-1">Teszt Neve *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-sm font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label style={{ color: textColor }} className="block text-xs font-bold mb-1">Leírás *</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={fieldStyle}
                className="w-full border rounded-xl p-3 text-xs font-medium"
              />
            </div>

            <div>
              <label style={{ color: textColor }} className="block text-xs font-bold mb-1">Nehézségi Szint</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer"
              >
                <option value="beginner" style={{ backgroundColor: cardBg, color: textColor }}>Kezdő</option>
                <option value="intermediate" style={{ backgroundColor: cardBg, color: textColor }}>Középhaladó</option>
                <option value="advanced" style={{ backgroundColor: cardBg, color: textColor }}>Haladó</option>
                <option value="professional" style={{ backgroundColor: cardBg, color: textColor }}>Szakmai / Mester</option>
              </select>
            </div>

            <div>
              <label style={{ color: textColor }} className="block text-xs font-bold mb-1">Sikerességi Küszöb (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold"
              />
            </div>
          </div>

          {/* QUESTIONS SECTION */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 style={{ color: textColor }} className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <HelpCircle size={16} style={{ color: cardHighlight }} /> Tesztkérdések ({questions.length})
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-3.5 py-1.5 border font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer hover:border-accent"
              >
                <Plus size={14} /> Kérdés Hozzáadása
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div key={q.id} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="border rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ color: cardHighlight }} className="text-xs font-extrabold">{qIdx + 1}. Kérdés</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Kérdés megfogalmazása..."
                    value={q.question}
                    onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-3 py-2 text-xs font-bold"
                  />

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label style={{ color: textColor }} className="block text-[11px] font-bold mb-1">
                      Válaszlehetőségek (Jelöld be a helyes választ!):
                    </label>
                    {(q.options || ['Válasz A', 'Válasz B', 'Válasz C', 'Válasz D']).map((opt, optIdx) => {
                      const isCorrect = (q.correct_options || []).includes(optIdx);
                      return (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectOptionSelect(q.id, optIdx)}
                            className="cursor-pointer accent-amber-400"
                          />
                          <input
                            type="text"
                            placeholder={`Válasz ${optIdx + 1}...`}
                            value={opt}
                            onChange={(e) => handleOptionChange(q.id, optIdx, e.target.value)}
                            style={fieldStyle}
                            className="w-full border rounded-xl px-3 py-1.5 text-xs font-medium"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label style={{ color: textColor }} className="block text-[11px] font-bold mb-1">
                      Oktatási Magyarázat (Hibás válasz esetén megjelenik a tanulónak):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Magyarázat a helyes válaszról..."
                      value={q.explanation}
                      onChange={(e) => handleQuestionChange(q.id, 'explanation', e.target.value)}
                      style={fieldStyle}
                      className="w-full border rounded-xl p-2 text-xs font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
              className="px-5 py-2.5 border font-bold text-xs rounded-xl cursor-pointer hover:opacity-90"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: cardHighlight, color: '#000000' }}
              className="px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-lg cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Mentés...' : 'Teszt Mentése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
