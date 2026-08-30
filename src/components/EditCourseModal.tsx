import { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen, Layers, Sparkles } from 'lucide-react';
import type { LearningCourse, LearningChapter, KeyTermItem, CourseDifficulty, TargetAudience, LearningStatus } from '../lib/supabase';
import { saveCourse } from '../services/learningService';

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen size={20} className="text-accent" />
            {course ? 'Tananyag Szerkesztése' : 'Új Tananyag Létrehozása'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Tananyag Címe *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-accent font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Rövid Összefoglaló (Excerpt) *</label>
              <textarea
                required
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
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
              <label className="block text-xs font-bold text-gray-700 mb-1">Célközönség</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as TargetAudience)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-accent"
              >
                <option value="everyone">Mindenkinek</option>
                <option value="students">Tanulóknak</option>
                <option value="beginners">Kezdőknek</option>
                <option value="specialists">Szakembereknek</option>
                <option value="instructors">Oktatóknak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Becsült Tanulási Idő (perc)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Kiemelt Kép URL</label>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Címkék (vesszővel elválasztva)</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-medium"
              />
            </div>

          </div>

          {/* FEJEZETEK SECTION */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-accent" /> Tananyag Fejezetek ({chapters.length})
              </h4>
              <button
                type="button"
                onClick={handleAddChapter}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Fejezet Hozzáadása
              </button>
            </div>

            <div className="space-y-4">
              {chapters.map((chap, idx) => (
                <div key={chap.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-primary">{idx + 1}. Fejezet</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChapter(chap.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Fejezet címe..."
                    value={chap.title}
                    onChange={(e) => handleChapterChange(chap.id, 'title', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-bold"
                  />

                  <textarea
                    rows={4}
                    placeholder="Fejezet részletes szöveges tartalma (Markdown támogatott)..."
                    value={chap.content}
                    onChange={(e) => handleChapterChange(chap.id, 'content', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs text-gray-900 font-medium"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FONTOS FOGALMAK SECTION */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-accent" /> Fontos Fogalmak ({keyTerms.length})
              </h4>
              <button
                type="button"
                onClick={handleAddKeyTerm}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Fogalom Hozzáadása
              </button>
            </div>

            <div className="space-y-3">
              {keyTerms.map((kt) => (
                <div key={kt.id} className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Fogalom címe (pl. UW Profil)..."
                      value={kt.term}
                      onChange={(e) => handleKeyTermChange(kt.id, 'term', e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyTerm(kt.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Definíció / Magyarázat..."
                    value={kt.definition}
                    onChange={(e) => handleKeyTermChange(kt.id, 'definition', e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-medium"
                  />
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
              {saving ? 'Mentés...' : 'Tananyag Mentése'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
