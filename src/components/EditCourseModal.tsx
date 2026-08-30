import { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen, Layers, Sparkles } from 'lucide-react';
import type { LearningCourse, LearningChapter, KeyTermItem, CourseDifficulty, TargetAudience, LearningStatus } from '../lib/supabase';
import { saveCourse } from '../services/learningService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

interface EditCourseModalProps {
  course?: LearningCourse | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  partnerId?: string | null;
  partnerName?: string | null;
}

export default function EditCourseModal({
  course,
  isOpen,
  onClose,
  onSaved,
  partnerId,
  partnerName,
}: EditCourseModalProps) {
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
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('cat-1');
  const [categoryName, setCategoryName] = useState('Építési technológiák');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [topic, setTopic] = useState('Szerkezetépítés');
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('beginner');
  const [audience, setAudience] = useState<TargetAudience>('everyone');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [featuredImage, setFeaturedImage] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [status, setStatus] = useState<LearningStatus>('published');
  const [chapters, setChapters] = useState<LearningChapter[]>([]);
  const [keyTerms, setKeyTerms] = useState<KeyTermItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setTitle(course.title || '');
      setExcerpt(course.excerpt || '');
      setContent(course.content || '');
      setCategoryId(course.category_id || 'cat-1');
      setCategoryName(course.category_name || 'Építési technológiák');
      setSubcategoryName(course.subcategory_name || '');
      setTopic(course.topic || '');
      setDifficulty(course.difficulty || 'beginner');
      setAudience(course.audience || 'everyone');
      setEstimatedTime(course.estimated_time_minutes || 30);
      setFeaturedImage(course.featured_image || '');
      setTagsStr(course.tags?.join(', ') || '');
      setStatus(course.status || 'published');
      setChapters(course.chapters || []);
      setKeyTerms(course.key_terms || []);
    } else {
      setTitle('');
      setExcerpt('');
      setContent('');
      setCategoryId('cat-1');
      setCategoryName('Építési technológiák');
      setSubcategoryName('');
      setTopic('Általános');
      setDifficulty('beginner');
      setAudience('everyone');
      setEstimatedTime(30);
      setFeaturedImage('https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80');
      setTagsStr('oktatás, építőipar');
      setStatus(partnerId ? 'draft' : 'published');
      setChapters([
        {
          id: `chap-${Date.now()}-1`,
          title: '1. Fejezet: Bevezetés és Alapismeretek',
          summary: 'A fejezet összefoglalása.',
          content: 'A fejezet részletes szöveges és szakmai tartalma...',
          estimated_minutes: 15,
        },
      ]);
      setKeyTerms([]);
    }
  }, [course, partnerId, isOpen]);

  if (!isOpen) return null;

  const handleAddChapter = () => {
    const newChap: LearningChapter = {
      id: `chap-${Date.now()}`,
      title: `${chapters.length + 1}. Fejezet: Új fejezet címe`,
      summary: '',
      content: '',
      estimated_minutes: 10,
    };
    setChapters([...chapters, newChap]);
  };

  const handleRemoveChapter = (id: string) => {
    setChapters(chapters.filter((c) => c.id !== id));
  };

  const handleChapterChange = (id: string, field: keyof LearningChapter, val: any) => {
    setChapters(chapters.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  };

  const handleAddKeyTerm = () => {
    const newTerm: KeyTermItem = {
      id: `kt-${Date.now()}`,
      term: 'Új Fogalom',
      definition: 'Fogalom leírása...',
    };
    setKeyTerms([...keyTerms, newTerm]);
  };

  const handleRemoveKeyTerm = (id: string) => {
    setKeyTerms(keyTerms.filter((k) => k.id !== id));
  };

  const handleKeyTermChange = (id: string, field: keyof KeyTermItem, val: string) => {
    setKeyTerms(keyTerms.map((k) => (k.id === id ? { ...k, [field]: val } : k)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !excerpt.trim()) return;

    try {
      setSaving(true);
      const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9áéíóöőúüű]+/g, '-')
        .replace(/^-|-$/g, '');

      await saveCourse({
        id: course?.id,
        title: title.trim(),
        slug: course?.slug || slug,
        excerpt: excerpt.trim(),
        content: content.trim(),
        category_id: categoryId,
        category_name: categoryName,
        subcategory_name: subcategoryName.trim() || undefined,
        topic: topic.trim(),
        difficulty,
        audience,
        estimated_time_minutes: estimatedTime,
        featured_image: featuredImage.trim(),
        tags,
        chapters,
        key_terms: keyTerms,
        status,
        partner_id: partnerId || course?.partner_id || null,
        partner_name: partnerName || course?.partner_name || null,
      });

      onSaved();
      onClose();
    } catch (e) {
      console.warn('Hiba a tananyag mentésekor:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="rounded-3xl border max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 style={{ color: textColor }} className="text-xl font-black flex items-center gap-2">
            <BookOpen size={20} style={{ color: cardHighlight }} />
            {course ? 'Tananyag Szerkesztése' : 'Új Tananyag Létrehozása'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-bold p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-300 mb-1">Tananyag Címe *</label>
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
              <label className="block text-xs font-bold text-gray-300 mb-1">Rövid Összefoglaló (Excerpt) *</label>
              <textarea
                required
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                style={fieldStyle}
                className="w-full border rounded-xl p-3 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Nehézségi Szint</label>
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
              <label className="block text-xs font-bold text-gray-300 mb-1">Célközönség</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as TargetAudience)}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer"
              >
                <option value="everyone" style={{ backgroundColor: cardBg, color: textColor }}>Mindenkinek</option>
                <option value="students" style={{ backgroundColor: cardBg, color: textColor }}>Tanulóknak</option>
                <option value="beginners" style={{ backgroundColor: cardBg, color: textColor }}>Kezdőknek</option>
                <option value="specialists" style={{ backgroundColor: cardBg, color: textColor }}>Szakembereknek</option>
                <option value="instructors" style={{ backgroundColor: cardBg, color: textColor }}>Oktatóknak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Becsült Tanulási Idő (perc)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Kiemelt Kép URL</label>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-300 mb-1">Címkék (vesszővel elválasztva)</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                style={fieldStyle}
                className="w-full border rounded-xl px-4 py-2.5 text-xs font-medium"
              />
            </div>

          </div>

          {/* FEJEZETEK SECTION */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} style={{ color: cardHighlight }} /> Tananyag Fejezetek ({chapters.length})
              </h4>
              <button
                type="button"
                onClick={handleAddChapter}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-3.5 py-1.5 border font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer hover:border-accent"
              >
                <Plus size={14} /> Fejezet Hozzáadása
              </button>
            </div>

            <div className="space-y-4">
              {chapters.map((chap, idx) => (
                <div key={chap.id} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="border rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-amber-400">{idx + 1}. Fejezet</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChapter(chap.id)}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Fejezet címe..."
                    value={chap.title}
                    onChange={(e) => handleChapterChange(chap.id, 'title', e.target.value)}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-3 py-2 text-xs font-bold"
                  />
                  <textarea
                    rows={2}
                    placeholder="Fejezet rövid összefoglalása..."
                    value={chap.summary}
                    onChange={(e) => handleChapterChange(chap.id, 'summary', e.target.value)}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-3 py-2 text-xs font-medium"
                  />
                  <textarea
                    rows={5}
                    placeholder="Fejezet részletes szakmai tartalma..."
                    value={chap.content}
                    onChange={(e) => handleChapterChange(chap.id, 'content', e.target.value)}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FONTOS FOGALMAK SECTION */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 style={{ color: textColor }} className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} style={{ color: cardHighlight }} /> Fontos Fogalmak ({keyTerms.length})
              </h4>
              <button
                type="button"
                onClick={handleAddKeyTerm}
                style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                className="px-3.5 py-1.5 border font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer hover:border-accent"
              >
                <Plus size={14} /> Fogalom Hozzáadása
              </button>
            </div>

            <div className="space-y-3">
              {keyTerms.map((kt) => (
                <div key={kt.id} style={{ backgroundColor: inputBg, borderColor: cardBorder }} className="border rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Fogalom címe (pl. UW Profil)..."
                      value={kt.term}
                      onChange={(e) => handleKeyTermChange(kt.id, 'term', e.target.value)}
                      style={fieldStyle}
                      className="w-full border rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyTerm(kt.id)}
                      className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Definíció / Magyarázat..."
                    value={kt.definition}
                    onChange={(e) => handleKeyTermChange(kt.id, 'definition', e.target.value)}
                    style={fieldStyle}
                    className="w-full border rounded-xl px-3 py-1.5 text-xs font-medium"
                  />
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
              {saving ? 'Mentés...' : 'Tananyag Mentése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
