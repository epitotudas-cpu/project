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
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="rounded-3xl border shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ backgroundColor: cardHighlight, color: '#000000' }} className="p-2.5 rounded-xl font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ color: textColor }} className="text-xl font-black">Tanulókártyák Kezelése (Admin)</h3>
              <p className="text-xs text-gray-400">
                Szakmai kétoldalas tanulókártyák felvitele, módosítása és publikálása
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Course Filter */}
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={fieldStyle}
              className="px-3 py-2 border text-xs font-bold rounded-xl cursor-pointer"
            >
              <option value="all" style={{ backgroundColor: cardBg, color: textColor }}>Minden tananyag kártyái</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} style={{ backgroundColor: cardBg, color: textColor }}>
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
                style={fieldStyle}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleGenerateAiDraft}
              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
              className="px-3.5 py-2 border font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer hover:border-accent"
            >
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Kártyajavaslat
            </button>
            <button
              onClick={handleOpenAdd}
              style={{ backgroundColor: cardHighlight, color: '#000000' }}
              className="px-4 py-2 font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-90"
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
                style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                className="p-4 border rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ backgroundColor: cardHighlight, color: '#000000' }} className="px-2 py-0.5 font-bold text-[10px] rounded-md uppercase">
                      {card.topic}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      Sorrend: {card.sequence_order}
                    </span>
                    {!card.is_active && (
                      <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 border border-gray-600 text-[10px] font-bold rounded">
                        Inaktív
                      </span>
                    )}
                  </div>
                  <h4 style={{ color: textColor }} className="font-bold text-sm md:text-base">
                    ❓ {card.question}
                  </h4>
                  <p className="text-gray-400 text-xs md:text-sm line-clamp-2">
                    💡 {card.answer}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(card)}
                    style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                    className="p-2 hover:border-accent rounded-xl transition-all border cursor-pointer"
                    title="Szerkesztés"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition-all border border-red-900/40 cursor-pointer"
                    title="Törlés"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="p-8 text-center rounded-2xl border">
              <Layers className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p style={{ color: textColor }} className="text-sm font-bold">Nincsenek tanulókártyák ebben a nézetben.</p>
              <p className="text-xs text-gray-400">Kattints az "Új Kártya Hozzáadása" gombra a létrehozáshoz!</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Add Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="rounded-3xl border shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 style={{ color: textColor }} className="font-black text-lg">
                {editingCard ? 'Tanulókártya Szerkesztése' : 'Új Tanulókártya Létrehozása'}
              </h4>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiDraftNotice && (
              <div className="p-3 bg-purple-900/30 border border-purple-500/40 rounded-xl text-purple-200 text-xs font-semibold">
                {aiDraftNotice}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
              <div>
                <label style={{ color: textColor }} className="block mb-1">Kérdés (Előlap) *</label>
                <textarea
                  required
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Pl.: Milyen mélyre kell behajtani a gipszkarton csavart?"
                  style={fieldStyle}
                  className="w-full p-3 border rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label style={{ color: textColor }} className="block mb-1">Szakmailag Helyes Válasz (Hátlap) *</label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Pl.: A csavar fejének a kartonpapír felületét 0.5-1.0 mm-re kell besüllyesztenie..."
                  style={fieldStyle}
                  className="w-full p-3 border rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ color: textColor }} className="block mb-1">Témakör</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={fieldStyle}
                    className="w-full p-2.5 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label style={{ color: textColor }} className="block mb-1">Sorrend</label>
                  <input
                    type="number"
                    value={sequenceOrder}
                    onChange={(e) => setSequenceOrder(Number(e.target.value))}
                    style={fieldStyle}
                    className="w-full p-2.5 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label style={{ color: textColor }} className="block mb-1">Kapcsolódó Tananyag</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  style={fieldStyle}
                  className="w-full p-2.5 border rounded-xl text-xs font-medium cursor-pointer"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: cardBg, color: textColor }}>
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
                  className="w-4 h-4 accent-amber-400 cursor-pointer rounded"
                />
                <label htmlFor="isActiveCheck" style={{ color: textColor }} className="cursor-pointer">
                  Aktív állapot (látható a tanulóknak)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border text-xs font-bold rounded-xl transition-all cursor-pointer hover:opacity-90"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer hover:opacity-90"
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
