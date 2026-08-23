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
  FolderEdit,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import {
  useBooks,
  saveBooks,
  DEFAULT_BOOKS,
  useBookCategories,
  saveBookCategories,
  DEFAULT_BOOK_CATEGORIES,
  type BookItem,
  type BookCategory,
} from '../services/bookService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

export default function AdminBooksPage() {
  const books = useBooks();
  const categories = useBookCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('A könyvadatbázis módosításai sikeresen elmentve!');

  // Book Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);

  // Category Editor Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editableCategories, setEditableCategories] = useState<BookCategory[]>([]);
  const [newCatLabel, setNewCatLabel] = useState('');

  // Book Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(2026);
  const [pages, setPages] = useState(300);
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<string>('szerkezet');
  const [badge, setBadge] = useState('Új Szakkönyv');
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [tableOfContents, setTableOfContents] = useState('');
  const [sampleExcerpt, setSampleExcerpt] = useState('');
  const [rating, setRating] = useState(5.0);

  const filteredBooks = books.filter((b) => {
    if (!b) return false;
    const matchCat = selectedCategory === 'all' || b.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchCat;

    const titleMatch = (b.title || '').toLowerCase().includes(q);
    const authorMatch = (b.author || '').toLowerCase().includes(q);
    const isbnMatch = (b.isbn || '').toLowerCase().includes(q);
    return matchCat && (titleMatch || authorMatch || isbnMatch);
  });

  // ════════════════ CATEGORY EDITOR HANDLERS ════════════════
  const handleOpenCategoryModal = () => {
    setEditableCategories([...categories]);
    setNewCatLabel('');
    setShowCategoryModal(true);
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index <= 1) return; // index 0 is 'all'
    if (direction === 'down' && index >= editableCategories.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...editableCategories];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setEditableCategories(next);
  };

  const handleCategoryLabelChange = (id: string, newLabel: string) => {
    setEditableCategories(
      editableCategories.map((c) => (c.id === id ? { ...c, label: newLabel } : c))
    );
  };

  const handleDeleteCategory = (catId: string) => {
    if (catId === 'all') return;
    const catObj = editableCategories.find((c) => c.id === catId);
    const bookCount = books.filter((b) => b.category === catId).length;

    if (bookCount > 0) {
      if (
        !window.confirm(
          `A(z) "${catObj?.label}" kategóriában jelenleg ${bookCount} szakkönyv található. Biztosan törölni szeretnéd ezt a kategóriát?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${catObj?.label}" kategóriát?`)) {
        return;
      }
    }
    setEditableCategories(editableCategories.filter((c) => c.id !== catId));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newCatLabel.trim();
    if (!label) return;

    const slug =
      label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

    if (editableCategories.some((c) => c.id === slug || c.label.toLowerCase() === label.toLowerCase())) {
      alert('Ilyen néven vagy azonosítóval már létezik kategória!');
      return;
    }

    setEditableCategories([...editableCategories, { id: slug, label }]);
    setNewCatLabel('');
  };

  const handleSaveCategories = () => {
    saveBookCategories(editableCategories);
    setShowCategoryModal(false);
    triggerSuccessNotify('A könyvkategóriák és a sorrend sikeresen elmentve!');
  };

  const handleResetDefaultCategories = () => {
    if (window.confirm('Biztosan visszaállítod az alapértelmezett kategóriákat és azok sorrendjét?')) {
      setEditableCategories([...DEFAULT_BOOK_CATEGORIES]);
    }
  };

  // ════════════════ BOOK HANDLERS ════════════════
  const handleOpenAddModal = () => {
    setEditingBook(null);
    setTitle('');
    setSubtitle('');
    setAuthor('');
    setPublisher('Építésügyi Tudományos Kiadó');
    setYear(new Date().getFullYear());
    setPages(250);
    setIsbn('978-963-12-0000-0');
    setCategory(categories.find((c) => c.id !== 'all')?.id || 'szerkezet');
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
      triggerSuccessNotify('A szakkönyv törölve a könyvtárból!');
    }
  };

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const matchedCat = categories.find((c) => c.id === category);
    const categoryLabel = matchedCat ? matchedCat.label : 'Szerkezetépítés';

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
              categoryLabel,
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
        categoryLabel,
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
    triggerSuccessNotify('Könyv sikeresen elmentve!');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Biztosan visszaállítod az alapszintű könyvkiadványokat a gyári adatokra?')) {
      saveBooks(DEFAULT_BOOKS);
      triggerSuccessNotify('Alapértelmezett szakkönyvek visszaállítva!');
    }
  };

  const triggerSuccessNotify = (msg?: string) => {
    if (msg) setSuccessMessage(msg);
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
            Építőipari szakkönyvek, mérnöki útmutatók, tananyagok és kategóriák központi szerkesztése.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Category Editor Button */}
          <button
            type="button"
            onClick={handleOpenCategoryModal}
            style={{ backgroundColor: inputBg, borderColor: cardBorder }}
            className="px-4 py-2.5 border text-gray-300 font-bold text-xs rounded-xl hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <FolderEdit size={16} className="text-accent" /> Kategóriák Szerkesztése
          </button>

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
          {successMessage}
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

        {/* Dynamic Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
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

      {/* ════════════════ CATEGORY EDITOR MODAL ════════════════ */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto admin-scroll">
            
            {/* Modal Header */}
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 style={{ color: textColor }} className="text-lg font-extrabold flex items-center gap-2.5">
                  <FolderEdit size={20} style={{ color: cardHighlight }} />
                  Szakmai Könyv Kategóriák Kezelője
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Hozz létre új kategóriákat, változtasd meg a nevüket, törölj vagy rendezd át a megjelenési sorrendet!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ backgroundColor: inputBg, color: textColor }}
                className="p-1.5 rounded-xl cursor-pointer hover:opacity-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Reordering & Editing List */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between px-1">
                <span>Kategória Neve &amp; Sorrend</span>
                <span>Műveletek</span>
              </div>

              <div className="space-y-2">
                {editableCategories.map((cat, idx) => {
                  const isAll = cat.id === 'all';
                  const catLabelLower = (cat.label || '').toLowerCase();
                  const bookCount = books.filter((b) => {
                    if (!b) return false;
                    if (b.category === cat.id) return true;
                    const bLabel = (b.categoryLabel || '').toLowerCase();
                    return Boolean(catLabelLower && bLabel.includes(catLabelLower));
                  }).length;

                  return (
                    <div
                      key={cat.id}
                      style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                      className="flex items-center justify-between p-3 border rounded-2xl gap-3 transition-all"
                    >
                      {/* Reorder Arrow Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isAll || idx <= 1}
                          onClick={() => handleMoveCategory(idx, 'up')}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isAll || idx <= 1
                              ? 'opacity-20 cursor-not-allowed border-transparent'
                              : 'hover:bg-accent/20 border-gray-700 text-gray-300 hover:text-white cursor-pointer'
                          }`}
                          title="Mozgatás felfelé"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={isAll || idx >= editableCategories.length - 1}
                          onClick={() => handleMoveCategory(idx, 'down')}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isAll || idx >= editableCategories.length - 1
                              ? 'opacity-20 cursor-not-allowed border-transparent'
                              : 'hover:bg-accent/20 border-gray-700 text-gray-300 hover:text-white cursor-pointer'
                          }`}
                          title="Mozgatás lefelé"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Label Input & Info */}
                      <div className="flex-1 flex items-center gap-3">
                        {isAll ? (
                          <span className="font-extrabold text-xs text-white px-2 py-1 bg-primary/40 rounded-lg">
                            {cat.label} (Rendszer Kategória)
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={cat.label}
                            onChange={(e) => handleCategoryLabelChange(cat.id, e.target.value)}
                            style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                            className="w-full border rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-accent"
                          />
                        )}

                        <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap bg-black/40 px-2 py-0.5 rounded-md shrink-0">
                          {cat.id === 'all' ? `${books.length} könyv` : `${bookCount} könyv`}
                        </span>
                      </div>

                      {/* Delete Action */}
                      {!isAll && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Kategória Törlése"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} style={{ borderColor: cardBorder }} className="pt-4 border-t space-y-3">
              <label className="text-xs font-bold text-gray-300 block">Új Kategória Hozzáadása</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Pl.: Műemlékvédelem &amp; Felújítás"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="flex-1 border rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-4 py-2 font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus size={15} /> Hozzáadás
                </button>
              </div>
            </form>

            {/* Modal Actions */}
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={handleResetDefaultCategories}
                className="text-xs font-bold text-gray-400 hover:text-white underline cursor-pointer"
              >
                Gyári Kategóriák Visszaállítása
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border font-bold text-xs rounded-xl cursor-pointer hover:opacity-90"
                >
                  Mégse
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategories}
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2 font-extrabold text-xs rounded-xl shadow-lg cursor-pointer hover:opacity-90"
                >
                  Kategóriák &amp; Sorrend Mentése
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════ ADD / EDIT BOOK MODAL ════════════════ */}
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
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors font-bold"
                  >
                    {categories
                      .filter((c) => c.id !== 'all')
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
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
