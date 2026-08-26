import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  Search,
  Layers,
} from 'lucide-react';
import type { Course } from '../lib/supabase';
import {
  type Flashcard,
  getAllFlashcards,
  saveFlashcard,
  deleteFlashcard,
} from '../services/educationService';

interface AdminFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  initialCourseId?: string;
}

export default function AdminFlashcardsModal({
  isOpen,
  onClose,
  courses,
  initialCourseId,
}: AdminFlashcardsModalProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [topic, setTopic] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sequenceOrder, setSequenceOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // AI draft state
  const [aiDraftNotice, setAiDraftNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const cards = getAllFlashcards(selectedCourseId);

  const filteredCards = cards.filter(
    (c) =>
      !searchQuery.trim() ||
      c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCard(null);
    setQuestion('');
    setAnswer('');
    setTopic('Szárazépítészet & Szerkezetépítés');
    setCourseId(selectedCourseId !== 'all' ? selectedCourseId : courses[0]?.id || 'course-1');
    setSequenceOrder(cards.length + 1);
    setIsActive(true);
    setShowEditModal(true);
  };

  const handleOpenEdit = (card: Flashcard) => {
    setEditingCard(card);
    setQuestion(card.question);
    setAnswer(card.answer);
    setTopic(card.topic);
    setCourseId(card.course_id);
    setSequenceOrder(card.sequence_order);
    setIsActive(card.is_active);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a tanulókártyát?')) {
      deleteFlashcard(id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    const newOrUpdated: Flashcard = {
      id: editingCard ? editingCard.id : `fc-${Date.now()}`,
      question: question.trim(),
      answer: answer.trim(),
      topic: topic.trim() || 'Szakmai Ismeretek',
      course_id: courseId || courses[0]?.id || 'course-1',
      sequence_order: Number(sequenceOrder) || 1,
      is_active: isActive,
      created_at: editingCard?.created_at || new Date().toISOString(),
    };

    saveFlashcard(newOrUpdated);
    setShowEditModal(false);
  };

  const handleGenerateAiDraft = () => {
    setAiDraftNotice(
      '✨ AI Szakmai Kártyajavaslat generálva! Előnézetként betöltve az űrlapra. Kérjük, vizsgáld felül és hagyd jóvá a publikálás előtt.'
    );
    setEditingCard(null);
    setQuestion('Mekkora a minimálisan elvárt betonfedés kültéri vasbeton szerkezeteknél?');
    setAnswer('Kültéren, időjárási hatásoknak kitett vasbeton elemeknél a betonfedés legalább 35 mm.');
    setTopic('Szerkezetépítés & Beton');
    setCourseId(selectedCourseId !== 'all' ? selectedCourseId : courses[0]?.id || 'course-1');
    setSequenceOrder(cards.length + 1);
    setIsActive(true);
    setShowEditModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">Tanulókártyák Kezelése (Admin)</h3>
              <p className="text-xs text-gray-400">
                Szakmai kétoldalas tanulókártyák felvitele, módosítása és publikálása
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Course Filter */}
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 text-xs font-bold rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Minden tananyag kártyái</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Keresés kártyák között..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleGenerateAiDraft}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-purple-600" /> AI Kártyajavaslat
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Új Kártya Hozzáadása
            </button>
          </div>
        </div>

        {/* Cards Table / List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredCards.length > 0 ? (
            filteredCards.map((card) => (
              <div
                key={card.id}
                className="p-4 bg-white border border-gray-200 rounded-2xl hover:border-amber-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] rounded-md uppercase">
                      {card.topic}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Sorrend: {card.sequence_order}
                    </span>
                    {!card.is_active && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded">
                        Inaktív
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm md:text-base">
                    ❓ {card.question}
                  </h4>
                  <p className="text-slate-600 text-xs md:text-sm line-clamp-2">
                    💡 {card.answer}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(card)}
                    className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-gray-200"
                    title="Szerkesztés"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-200"
                    title="Törlés"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-gray-200">
              <Layers className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Nincsenek tanulókártyák ebben a nézetben.</p>
              <p className="text-xs text-gray-500">Kattints az "Új Kártya Hozzáadása" gombra a létrehozáshoz!</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Add Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="font-black text-slate-900 text-lg">
                {editingCard ? 'Tanulókártya Szerkesztése' : 'Új Tanulókártya Létrehozása'}
              </h4>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiDraftNotice && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-semibold">
                {aiDraftNotice}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1">Kérdés (Előlap) *</label>
                <textarea
                  required
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Pl.: Milyen mélyre kell behajtani a gipszkarton csavart?"
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Szakmailag Helyes Válasz (Hátlap) *</label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Pl.: A csavar fejének a kartonpapír felületét 0.5-1.0 mm-re kell besüllyesztenie..."
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">Témakör</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1">Sorrend</label>
                  <input
                    type="number"
                    value={sequenceOrder}
                    onChange={(e) => setSequenceOrder(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">Kapcsolódó Tananyag</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="isActiveCheck" className="text-slate-800 cursor-pointer">
                  Aktív állapot (látható a tanulóknak)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Mentés &amp; Publikálás
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
