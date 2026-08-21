import { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  Star,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  useBooks,
  saveBooks,
  DEFAULT_BOOKS,
  type BookItem,
} from '../services/bookService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

export default function AdminBooksPage() {
  const books = useBooks();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(2026);
  const [pages, setPages] = useState(300);
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<BookItem['category']>('szerkezet');
  const [badge, setBadge] = useState('Új Szakkönyv');
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [tableOfContents, setTableOfContents] = useState('');
  const [sampleExcerpt, setSampleExcerpt] = useState('');
  const [rating, setRating] = useState(5.0);

  const filteredBooks = books.filter((b) => {
    const matchCat = selectedCategory === 'all' || b.category === selectedCategory;
    const matchQuery =
      !searchQuery.trim() ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setSubtitle('');
    setAuthor('');
    setPublisher('Építésügyi Tudományos Kiadó');
    setYear(new Date().getFullYear());
    setPages(250);
    setIsbn('978-963-12-0000-0');
    setCategory('szerkezet');
    setBadge('Új Kiadvány');
    setCoverImage('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop');
    setDescription('');
    setTableOfContents('1. Fejezet: Bevezetés\n2. Fejezet: Méretezési alapok\n3. Fejezet: Kivitelezési szabályok');
    setSampleExcerpt('');
    setRating(5.0);
    setShowModal(true);
  };

  const handleOpenEditModal = (book: BookItem) => {
    setEditingBook(book);
    setTitle(book.title);
    setSubtitle(book.subtitle);
    setAuthor(book.author);
    setPublisher(book.publisher);
    setYear(book.year);
    setPages(book.pages);
    setIsbn(book.isbn);
    setCategory(book.category);
    setBadge(book.badge);
    setCoverImage(book.coverImage);
    setDescription(book.description);
    setTableOfContents(Array.isArray(book.tableOfContents) ? book.tableOfContents.join('\n') : '');
    setSampleExcerpt(book.sampleExcerpt);
    setRating(book.rating);
    setShowModal(true);
  };

  const handleDeleteBook = (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a szakkönyvet?')) {
      const updated = books.filter((b) => b.id !== id);
      saveBooks(updated);
      triggerSuccessNotify();
    }
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const catLabels: Record<BookItem['category'], string> = {
      all: 'Összes témakör',
      szerkezet: 'Szerkezetépítés & Alapozás',
      gepeszet: 'Épületgépészet & Villanyszerelés',
      munkavedelem: 'Munkavédelem & Szabályzatok',
      statika: 'Építész Tervezés & Statika',
      befejezo: 'Szárazépítészet & Befejező Munkák',
    };

    const tocArray = tableOfContents
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (editingBook) {
      const updated = books.map((b) =>
        b.id === editingBook.id
          ? {
              ...b,
              title: title.trim(),
              subtitle: subtitle.trim(),
              author: author.trim(),
              publisher: publisher.trim(),
              year,
              pages,
              isbn: isbn.trim(),
              category,
              categoryLabel: catLabels[category],
              badge: badge.trim() || 'Szakkönyv',
              coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop',
              description: description.trim(),
              tableOfContents: tocArray,
              sampleExcerpt: sampleExcerpt.trim(),
              rating,
            }
          : b
      );
      saveBooks(updated);
    } else {
      const newBook: BookItem = {
        id: `book-${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        year,
        pages,
        isbn: isbn.trim(),
        category,
        categoryLabel: catLabels[category],
        badge: badge.trim() || 'Új Kiadvány',
        badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop',
        downloadUrl: '#',
        format: 'Nyomtatott + PDF',
        fileSizeMb: 15.0,
        description: description.trim(),
        tableOfContents: tocArray,
        sampleExcerpt: sampleExcerpt.trim(),
        rating,
        reviewsCount: 1,
      };
      saveBooks([newBook, ...books]);
    }

    setShowModal(false);
    triggerSuccessNotify();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Biztosan visszaállítod az alapszintű könyvkiadványokat a gyári adatokra?')) {
      saveBooks(DEFAULT_BOOKS);
      triggerSuccessNotify();
    }
  };

  const triggerSuccessNotify = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ color: textColor }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: cardBorder }}>
        <div>
          <h1 style={{ color: textColor }} className="text-2xl font-black flex items-center gap-2.5">
            <BookOpen style={{ color: cardHighlight }} size={28} /> Szakmai Könyvek &amp; Szakirodalom Kezelő
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Építőipari szakkönyvek, mérnöki útmutatók, tananyagok és kézikönyvek központi bevitele és szerkesztése.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{ backgroundColor: inputBg, borderColor: cardBorder }}
            className="px-4 py-2.5 border text-gray-300 font-bold text-xs rounded-xl hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw size={14} /> Alapértelmezett
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{ backgroundColor: cardHighlight, color: '#000000' }}
            className="px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Új Szakkönyv Hozzáadása
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl flex items-center gap-3 animate-fade-in text-sm font-bold">
          <CheckCircle2 size={20} />
          A könyvadatbázis módosításai sikeresen elmentve és szinkronizálva a felhőbe!
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés cím, szerző vagy ISBN szerint..."
            style={{ backgroundColor: inputBg, borderColor: cardBorder }}
            className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Összes Témakör' },
            { id: 'szerkezet', label: 'Szerkezetépítés' },
            { id: 'gepeszet', label: 'Épületgépészet' },
            { id: 'munkavedelem', label: 'Munkavédelem' },
            { id: 'statika', label: 'Statika' },
            { id: 'befejezo', label: 'Befejező Munkák' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={
                selectedCategory === cat.id
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : {}
              }
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'shadow-md font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="bg-[#111111] border border-[#1E1E1E] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-accent/40 transition-all"
          >
            <div>
              {/* Cover & Badge */}
              <div className="relative h-48 overflow-hidden bg-[#0A0A0A]">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-accent/40 text-accent font-bold text-[10px] rounded-full">
                  {book.badge}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/80 text-amber-400 text-xs font-bold rounded flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> {book.rating.toFixed(1)}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="text-[11px] font-bold text-accent uppercase tracking-wider">
                  {book.categoryLabel}
                </div>
                <h3 className="text-base font-extrabold text-white leading-snug line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {book.subtitle || book.description}
                </p>

                <div className="pt-2 border-t border-[#222] text-xs text-gray-400 space-y-1 font-mono">
                  <div>Szerző: <span className="text-gray-200">{book.author}</span></div>
                  <div>ISBN: <span className="text-gray-300">{book.isbn}</span></div>
                  <div>Kiadó / Év: <span className="text-gray-300">{book.publisher} ({book.year})</span></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-[#141414] border-t border-[#222] flex items-center justify-between">
              <span className="text-[11px] font-mono text-gray-500">{book.pages} oldal • {book.format}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(book)}
                  className="px-3 py-1.5 bg-[#222] hover:bg-[#333] text-gray-200 hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} /> Szerkesztés
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBook(book.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="Törlés"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Book Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto admin-scroll">
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-3">
              <h3 style={{ color: textColor }} className="text-base font-extrabold flex items-center gap-2">
                <BookOpen size={18} style={{ color: cardHighlight }} />
                {editingBook ? 'Szakkönyv Szerkesztése' : 'Új Építőipari Szakkönyv Hozzáadása'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: inputBg, color: textColor }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer hover:opacity-90"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Könyv Címe *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Alcím / Rövid témafókusz</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Szerző(k) *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Kiadó Neve</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Témakör / Kategória</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BookItem['category'])}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  >
                    <option value="szerkezet">Szerkezetépítés &amp; Alapozás</option>
                    <option value="gepeszet">Épületgépészet &amp; Villanyszerelés</option>
                    <option value="munkavedelem">Munkavédelem &amp; Szabályzatok</option>
                    <option value="statika">Építész Tervezés &amp; Statika</option>
                    <option value="befejezo">Szárazépítészet &amp; Befejező Munkák</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">ISBN Szám</label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 font-mono focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Kiadás Éve</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Oldalszám</label>
                  <input
                    type="number"
                    value={pages}
                    onChange={(e) => setPages(Number(e.target.value))}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Kiemelt Jelvény Text</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Értékelés (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Borítókép URL</label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Részletes Leírás</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl p-3 focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Tartalomjegyzék (Soronként 1 fejezet)</label>
                  <textarea
                    rows={4}
                    value={tableOfContents}
                    onChange={(e) => setTableOfContents(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl p-3 font-mono text-[11px] focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Minta / Részlet a könyvből</label>
                  <textarea
                    rows={3}
                    value={sampleExcerpt}
                    onChange={(e) => setSampleExcerpt(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl p-3 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div style={{ borderColor: cardBorder }} className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border font-bold rounded-xl transition-colors cursor-pointer hover:opacity-90"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2 font-extrabold rounded-xl transition-all shadow-lg cursor-pointer hover:opacity-90"
                >
                  {editingBook ? 'Módosítások Mentése' : 'Könyv Létrehozása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
