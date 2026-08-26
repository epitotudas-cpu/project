import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import type { InteractiveStep } from '../services/educationService';

interface InteractiveLessonViewerProps {
  lessonTitle: string;
  steps: InteractiveStep[];
  onComplete?: () => void;
}

export default function InteractiveLessonViewer({
  lessonTitle,
  steps,
  onComplete,
}: InteractiveLessonViewerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [feedbackState, setFeedbackState] = useState<Record<string, { isCorrect: boolean; show: boolean }>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h4 className="text-lg font-bold text-gray-800">Ehhez a leckéhez még nincsenek interaktív lépések.</h4>
        <p className="text-sm text-gray-500 mt-1">Ovasd el a fenti lecke leírást vagy folytasd a tesztekkel!</p>
      </div>
    );
  }

  const step = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progressPercentage = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const handleSingleChoiceSelect = (optionIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [step.id]: optionIdx }));
    const isCorrect = optionIdx === step.correct_option_index;
    setFeedbackState((prev) => ({ ...prev, [step.id]: { isCorrect, show: true } }));
  };

  const handleMultipleChoiceToggle = (optionIdx: number) => {
    const currentList: number[] = userAnswers[step.id] || [];
    const updated = currentList.includes(optionIdx)
      ? currentList.filter((i) => i !== optionIdx)
      : [...currentList, optionIdx];
    setUserAnswers((prev) => ({ ...prev, [step.id]: updated }));
  };

  const handleMultipleChoiceCheck = () => {
    const selected: number[] = userAnswers[step.id] || [];
    const correct = step.correct_option_indices || [];
    const isCorrect =
      selected.length === correct.length && selected.every((val) => correct.includes(val));
    setFeedbackState((prev) => ({ ...prev, [step.id]: { isCorrect, show: true } }));
  };

  const handleImageChoiceSelect = (imageId: string, isCorrect: boolean) => {
    setUserAnswers((prev) => ({ ...prev, [step.id]: imageId }));
    setFeedbackState((prev) => ({ ...prev, [step.id]: { isCorrect, show: true } }));
  };

  const handleErrorOptionSelect = (optionId: string, isError: boolean) => {
    setUserAnswers((prev) => ({ ...prev, [step.id]: optionId }));
    setFeedbackState((prev) => ({ ...prev, [step.id]: { isCorrect: isError, show: true } }));
  };

  // Reorder logic
  const getReorderItems = () => {
    if (userAnswers[step.id]) return userAnswers[step.id];
    return step.reorder_items || [];
  };

  const handleMoveReorderItem = (index: number, direction: 'up' | 'down') => {
    const items = [...getReorderItems()];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    setUserAnswers((prev) => ({ ...prev, [step.id]: items }));
  };

  const handleReorderCheck = () => {
    const currentItems = getReorderItems();
    const isCorrect = currentItems.every((item: any, idx: number) => item.correct_position === idx + 1);
    setFeedbackState((prev) => ({ ...prev, [step.id]: { isCorrect, show: true } }));
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      if (onComplete) onComplete();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const currentFeedback = feedbackState[step.id];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden my-6">
      {/* Top Header & Progress */}
      <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-lg flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Interaktív Tananyag
            </span>
            <span className="text-xs text-gray-400 font-medium">{lessonTitle}</span>
          </div>
          <span className="text-xs font-bold text-gray-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {currentStepIndex + 1} / {totalSteps} lépés
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Step Content */}
      {!isCompleted ? (
        <div className="p-6 md:p-8 space-y-6">
          {/* Step Title & Description */}
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">{step.title}</h3>
            {step.description && (
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">{step.description}</p>
            )}
          </div>

          {/* Optional Image */}
          {step.image_url && (
            <div className="rounded-xl overflow-hidden border border-gray-200 max-h-80 bg-slate-50">
              <img
                src={step.image_url}
                alt={step.title}
                className="w-full h-full object-cover max-h-80"
              />
            </div>
          )}

          {/* Render Step Type Content */}
          {/* 1. INFO BLOCK */}
          {step.type === 'info' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm leading-relaxed">
              💡 <strong>Megjegyzés:</strong> Haladj tovább a következő lépésre az interaktív kérdésekért!
            </div>
          )}

          {/* 2. SINGLE CHOICE */}
          {step.type === 'single_choice' && step.options && (
            <div className="space-y-3">
              {step.options.map((option, idx) => {
                const isSelected = userAnswers[step.id] === idx;
                let btnStyle = 'border-gray-200 hover:border-amber-400 bg-white text-slate-800';
                if (currentFeedback?.show) {
                  if (idx === step.correct_option_index) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSingleChoiceSelect(idx)}
                    disabled={currentFeedback?.show}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {currentFeedback?.show && idx === step.correct_option_index && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {currentFeedback?.show && isSelected && idx !== step.correct_option_index && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. MULTIPLE CHOICE */}
          {step.type === 'multiple_choice' && step.options && (
            <div className="space-y-3">
              {step.options.map((option, idx) => {
                const selectedList: number[] = userAnswers[step.id] || [];
                const isChecked = selectedList.includes(idx);
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-sm cursor-pointer transition-all ${
                      isChecked ? 'border-amber-500 bg-amber-50/50 font-bold' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMultipleChoiceToggle(idx)}
                      disabled={currentFeedback?.show}
                      className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
              {!currentFeedback?.show && (
                <button
                  onClick={handleMultipleChoiceCheck}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
                >
                  Válaszok ellenőrzése
                </button>
              )}
            </div>
          )}

          {/* 4. IMAGE CHOICE */}
          {step.type === 'image_choice' && step.image_options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {step.image_options.map((imgOpt) => {
                const isSelected = userAnswers[step.id] === imgOpt.id;
                let style = 'border-gray-200 hover:border-amber-400';
                if (currentFeedback?.show) {
                  if (imgOpt.is_correct) style = 'border-emerald-500 ring-2 ring-emerald-400 bg-emerald-50';
                  else if (isSelected) style = 'border-rose-500 ring-2 ring-rose-400 bg-rose-50';
                } else if (isSelected) {
                  style = 'border-amber-500 ring-2 ring-amber-400';
                }

                return (
                  <button
                    key={imgOpt.id}
                    onClick={() => handleImageChoiceSelect(imgOpt.id, imgOpt.is_correct)}
                    disabled={currentFeedback?.show}
                    className={`text-left p-3 rounded-2xl border bg-white transition-all overflow-hidden ${style}`}
                  >
                    <img
                      src={imgOpt.image_url}
                      alt={imgOpt.label}
                      className="w-full h-40 object-cover rounded-xl mb-3"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-800">{imgOpt.label}</span>
                      {currentFeedback?.show && imgOpt.is_correct && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 5. ERROR IDENTIFICATION */}
          {step.type === 'error_identification' && step.error_options && (
            <div className="space-y-3">
              {step.error_options.map((errOpt) => {
                const isSelected = userAnswers[step.id] === errOpt.id;
                let style = 'border-gray-200 hover:border-rose-300 bg-white';
                if (currentFeedback?.show) {
                  if (errOpt.is_error) style = 'border-rose-500 bg-rose-50 text-rose-900 font-bold';
                  else if (isSelected) style = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                } else if (isSelected) {
                  style = 'border-amber-500 bg-amber-50/50';
                }

                return (
                  <button
                    key={errOpt.id}
                    onClick={() => handleErrorOptionSelect(errOpt.id, errOpt.is_error)}
                    disabled={currentFeedback?.show}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3 ${style}`}
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-medium">{errOpt.label}</span>
                      {currentFeedback?.show && (
                        <span className="block text-xs mt-1 opacity-90">{errOpt.explanation}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 6. REORDER */}
          {step.type === 'reorder' && (
            <div className="space-y-3">
              <div className="space-y-2">
                {getReorderItems().map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}.
                      </span>
                      <span>{item.text}</span>
                    </div>
                    {!currentFeedback?.show && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveReorderItem(idx, 'up')}
                          disabled={idx === 0}
                          className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-30 text-xs"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveReorderItem(idx, 'down')}
                          disabled={idx === getReorderItems().length - 1}
                          className="px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-30 text-xs"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!currentFeedback?.show && (
                <button
                  onClick={handleReorderCheck}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all"
                >
                  Sorrend ellenőrzése
                </button>
              )}
            </div>
          )}

          {/* Instant Feedback & Explanation */}
          {currentFeedback?.show && (
            <div
              className={`p-4 rounded-xl border text-sm ${
                currentFeedback.isCorrect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {currentFeedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Helyes válasz! Szép munka!
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-600" /> Nem teljesen pontos. Nincs gond, tanulunk belőle!
                  </>
                )}
              </div>
              {step.explanation && <p className="text-xs md:text-sm mt-1 leading-relaxed">{step.explanation}</p>}
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Előző lépés
            </button>

            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-md"
            >
              {currentStepIndex === totalSteps - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Lecke Befejezése
                </>
              ) : (
                <>
                  Következő lépés <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Completion Screen */
        <div className="p-8 text-center space-y-4 bg-emerald-50/50">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Gratulálunk! Elvégezted ezt az interaktív leckét!</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Sikeresen teljesítetted a(z) <strong>{lessonTitle}</strong> összes interaktív feladatát.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setIsCompleted(false);
                setCurrentStepIndex(0);
              }}
              className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Újraolvasás
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
