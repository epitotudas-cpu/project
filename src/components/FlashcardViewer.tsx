import { useState, useEffect } from 'react';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCcw,
  Award,
  Flame,
} from 'lucide-react';
import {
  type Flashcard,
  type FlashcardState,
  type UserFlashcardProgressMap,
  getUserFlashcardProgress,
  recordFlashcardReview,
} from '../services/educationService';

interface FlashcardViewerProps {
  cards: Flashcard[];
  userId: string;
  courseTitle?: string;
  onFinish?: () => void;
}

type StudyMode = 'learn' | 'practice' | 'review';

export default function FlashcardViewer({
  cards,
  userId,
  courseTitle,
  onFinish,
}: FlashcardViewerProps) {
  const [studyMode, setStudyMode] = useState<StudyMode>('learn');
  const [progressMap, setProgressMap] = useState<UserFlashcardProgressMap>(() =>
    getUserFlashcardProgress(userId)
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ knewCount: 0, didntKnowCount: 0 });

  // Filter cards based on study mode
  const getFilteredCards = () => {
    if (!cards || cards.length === 0) return [];
    if (studyMode === 'learn') return cards;
    if (studyMode === 'practice') {
      // Prioritize cards that are learning or review
      const filtered = cards.filter((c) => {
        const state = progressMap[c.id]?.state || 'new';
        return state === 'learning' || state === 'review' || state === 'new';
      });
      return filtered.length > 0 ? filtered : cards;
    }
    if (studyMode === 'review') {
      // Prioritize cards marked for review
      const filtered = cards.filter((c) => {
        const state = progressMap[c.id]?.state;
        return state === 'review' || state === 'learning';
      });
      return filtered.length > 0 ? filtered : cards;
    }
    return cards;
  };

  const activeDeck = getFilteredCards();
  const currentCard = activeDeck[currentCardIndex];

  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setSessionStats({ knewCount: 0, didntKnowCount: 0 });
  }, [studyMode, cards]);

  const handleAssessment = (knewIt: boolean) => {
    if (!currentCard) return;

    const updatedMap = recordFlashcardReview(userId, currentCard.id, knewIt);
    setProgressMap(updatedMap);

    setSessionStats((prev) => ({
      knewCount: prev.knewCount + (knewIt ? 1 : 0),
      didntKnowCount: prev.didntKnowCount + (knewIt ? 0 : 1),
    }));

    setIsFlipped(false);

    if (currentCardIndex < activeDeck.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      if (onFinish) onFinish();
    }
  };

  const getStateBadge = (cardId: string) => {
    const state: FlashcardState = progressMap[cardId]?.state || 'new';
    switch (state) {
      case 'mastered':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Stabil / Megtanult
          </span>
        );
      case 'learning':
        return (
          <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-600" /> Gyakorlás alatt
          </span>
        );
      case 'review':
        return (
          <span className="px-2.5 py-1 bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-1">
            <RefreshCcw className="w-3.5 h-3.5 text-rose-600" /> Ismétlendő
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold rounded-lg flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Új kártya
          </span>
        );
    }
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
        <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h4 className="text-lg font-bold text-gray-800">Ehhez a kurzushoz még nincsenek tanulókártyák.</h4>
        <p className="text-sm text-gray-500 mt-1">Az adminisztráció folyamatosan bővíti a szakmai kártyapaklikat!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* Mode Selector Header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-slate-900 text-sm md:text-base">
            Tanulókártyák {courseTitle ? `– ${courseTitle}` : ''}
          </span>
        </div>

        {/* 3 Study Modes */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setStudyMode('learn')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              studyMode === 'learn'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📚 Tanulás ({cards.length})
          </button>
          <button
            onClick={() => setStudyMode('practice')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              studyMode === 'practice'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔥 Gyakorlás
          </button>
          <button
            onClick={() => setStudyMode('review')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              studyMode === 'review'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔄 Ismétlés
          </button>
        </div>
      </div>

      {!sessionCompleted && currentCard ? (
        <div className="space-y-4">
          {/* Progress Stats Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              Kártya: <strong className="text-slate-900">{currentCardIndex + 1}</strong> / {activeDeck.length}
            </span>
            <span>{getStateBadge(currentCard.id)}</span>
          </div>

          {/* Flashcard Component */}
          <div className="perspective-1000 min-h-[320px]">
            <div
              className={`w-full min-h-[320px] rounded-3xl border transition-all duration-500 p-6 md:p-8 flex flex-col justify-between shadow-lg relative bg-white border-gray-200 ${
                isFlipped ? 'bg-amber-50/40 border-amber-300' : 'hover:border-amber-400'
              }`}
            >
              {/* Card Top Info */}
              <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-4 border-b border-gray-100 pb-3">
                <span className="font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  {currentCard.topic}
                </span>
                <span className="font-mono font-medium text-slate-400">
                  #{currentCardIndex + 1} / {activeDeck.length}
                </span>
              </div>

              {/* Card Main Body */}
              <div className="my-auto py-4 text-center">
                {!isFlipped ? (
                  /* FRONT SIDE (QUESTION) */
                  <div className="space-y-4">
                    <span className="inline-block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Kérdés / Feladat (Előlap)
                    </span>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                      "{currentCard.question}"
                    </h3>
                  </div>
                ) : (
                  /* BACK SIDE (ANSWER) */
                  <div className="space-y-4 animate-fade-in">
                    <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Szakmailag Helyes Válasz (Hátlap)
                    </span>
                    <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed max-w-2xl mx-auto">
                      {currentCard.answer}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Bottom Controls */}
              <div className="pt-4 border-t border-gray-100">
                {!isFlipped ? (
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" /> Válasz Megmutatása
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-center font-bold text-slate-500">Tudtad a választ?</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleAssessment(false)}
                        className="py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <XCircle className="w-5 h-5 text-rose-600" /> [NEM TUDTAM]
                      </button>
                      <button
                        onClick={() => handleAssessment(true)}
                        className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-200" /> [TUDTAM]
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Session Finish Screen */
        <div className="p-8 text-center space-y-5 bg-white rounded-3xl border border-gray-200 shadow-md">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Tanulókártya pakli lezárva!</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Sikeresen átnézted a kiválasztott kártyákat ebben a tanulási menetben.
          </p>

          {/* Session Result Summary */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
              <span className="block text-2xl font-black">{sessionStats.knewCount}</span>
              <span className="text-xs font-bold">Helyesen tudott</span>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900">
              <span className="block text-2xl font-black">{sessionStats.didntKnowCount}</span>
              <span className="text-xs font-bold">Ismétlendő</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setSessionCompleted(false);
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Ugyanezen kártyák újramenetele
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
