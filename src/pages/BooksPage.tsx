import { useState, useMemo, useEffect } from 'react';
import {
  Library,
  ChevronRight,
  Search,
  FileText,
  BookOpen,
  Calculator,
  Download,
  Eye,
  Star,
  CheckCircle2,
  X,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  Globe,
  ShoppingBag,
  Tag,
  ExternalLink,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { useBooks, useBookCategories, type BookItem } from '../services/bookService';
import { useAuth } from '../contexts/AuthContext';
import { toggleSaveItem, getSavedItems } from '../services/bookmarkService';
import AuthPromptModal from '../components/AuthPromptModal';
import BookCoverImage from '../components/BookCoverImage';

interface BooksPageProps {
  onNavigate: (page: string) => void;
}

export default function BooksPage({ onNavigate }: BooksPageProps) {
  const { user } = useAuth();
  const allBooks = useBooks();
  const categories = useBookCategories();

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recommended' | 'newest' | 'title_asc'>('recommended');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingBookTitle, setPendingBookTitle] = useState<string | undefined>(undefined);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [savedBookIds, setSavedBookIds] = useState<Set<string>>(new Set());

  // Load saved bookmarks
  useEffect(() => {
    const items = getSavedItems(user?.id);
    const bookIds = new Set<string>();
    items.filter((i) => i.itemType === 'book').forEach((i) => {
      bookIds.add(i.itemId);
      if (i.slug) bookIds.add(i.slug);
      if (i.title) bookIds.add(i.title);
    });
    setSavedBookIds(bookIds);
  }, [user]);

  const handleToggleBookmark = (e: React.MouseEvent, book: BookItem) => {
    e.stopPropagation();
    const res = toggleSaveItem(user?.id, {
      itemId: book.id,
      itemType: 'book',
      title: book.title,
      subtitle: book.categoryLabel || book.author,
      description: book.description,
      slug: book.id,
      imageUrl: book.coverImage,
    });

    setSavedBookIds((prev) => {
      const next = new Set(prev);
      if (res.isSaved) {
        next.add(book.id);
        if (book.title) next.add(book.title);
      } else {
        next.delete(book.id);
        if (book.title) next.delete(book.title);
      }
      return next;
    });
  };

  // Calculate book count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allBooks.length };
    categories.forEach((cat) => {
      if (cat.id !== 'all') {
        const catLabelLower = (cat.label || '').toLowerCase();
        counts[cat.id] = allBooks.filter((b) => {
          if (!b) return false;
          if (b.category === cat.id) return true;
          const bLabel = (b.categoryLabel || '').toLowerCase();
          return Boolean(bLabel && bLabel.includes(catLabelLower));
        }).length;
      }
    });
    return counts;
  }, [allBooks, categories]);

  // Filtered & Sorted books
  const filteredBooks = useMemo(() => {
    let result = allBooks.filter((b) => {
      if (!b) return false;

      const targetCatObj = categories.find((c) => c.id === selectedCategory);
      const targetCatLabel = (targetCatObj?.label || '').toLowerCase();
      const bCatLabel = (b.categoryLabel || '').toLowerCase();

      const matchCat =
        selectedCategory === 'all' ||
        b.category === selectedCategory ||
        (targetCatLabel && bCatLabel.includes(targetCatLabel));

      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchCat;

      const titleMatch = (b.title || '').toLowerCase().includes(q);
      const authorMatch = (b.author || '').toLowerCase().includes(q);
      const categoryMatch = bCatLabel.includes(q);
      const descMatch = (b.description || '').toLowerCase().includes(q);
      const isbnMatch = (b.isbn || '').toLowerCase().includes(q);

      const matchQuery = titleMatch || authorMatch || categoryMatch || descMatch || isbnMatch;

      return matchCat && matchQuery;
    });

    // Sorting
    if (sortBy === 'newest') {
      result = [...result].sort((a, b) => (b.year || 0) - (a.year || 0));
    } else if (sortBy === 'title_asc') {
      result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'hu'));
    } else {
      // recommended / highest rated
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [allBooks, selectedCategory, searchQuery, sortBy]);

  const [digitalError, setDigitalError] = useState<string | null>(null);

  const handleBookSelect = (book: BookItem) => {
    setSelectedBook(book);
  };

  const triggerDigitalAction = (e: React.MouseEvent, book: BookItem, actionType?: 'preview' | 'digital') => {
    e.stopPropagation();

    const da = book.digitalAccess;
    const url = book.digitalFileUrl || da?.digitalFileUrl || da?.digitalUrl || book.downloadUrl;
    const previewUrl = book.digitalPreviewUrl || da?.previewUrl;
    const accessType = book.digitalAccessType || da?.digitalAccessType || da?.accessType || 'none';

    // Preview action
    if (actionType === 'preview') {
      if (previewUrl && /^https?:\/\//i.test(previewUrl.trim())) {
        window.open(previewUrl.trim(), '_blank', 'noopener,noreferrer');
        return;
      }
      setDigitalError('A kiadvány előnézete jelenleg nem érhető el. Kérjük, próbálja meg később!');
      setTimeout(() => setDigitalError(null), 5000);
      return;
    }

    // Direct digital action
    if (accessType === 'none' || !url || !url.trim() || url === '#' || url.includes('invalid-broken-link')) {
      setDigitalError('A digitális kiadvány jelenleg nem érhető el. Kérjük, próbálja meg később, vagy tekintse meg a kiadói oldalt.');
      setTimeout(() => setDigitalError(null), 5000);
      return;
    }

    if (!user && (da?.requiresLogin || book.requiresLogin)) {
      setPendingBookTitle(book.title);
      setAuthModalOpen(true);
      return;
    }

    if (!/^https?:\/\//i.test(url.trim())) {
      setDigitalError('A digitális kiadvány jelenleg nem érhető el. Kérjük, próbálja meg később, vagy tekintse meg a kiadói oldalt.');
      setTimeout(() => setDigitalError(null), 5000);
      return;
    }

    // Direct file download or open external link
    if (accessType === 'direct_download' || da?.accessType === 'free_download') {
      setDownloadSuccess(`📥 "${book.title}" letöltése elindult!`);
      setTimeout(() => setDownloadSuccess(null), 4000);

      const link = document.createElement('a');
      link.href = url.trim();
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (book.fileName) link.download = book.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url.trim(), '_blank', 'noopener,noreferrer');
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty) {
      case 'kezdő':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">Kezdő</span>;
      case 'haladó':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-300">Haladó</span>;
      case 'mester':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">Mester</span>;
      case 'szakértő':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300">Szakértő</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => onNavigate('tudastar')}
              className="hover:text-white transition-colors"
            >
              Tudástár
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Szakmai Könyvek</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                <Library size={13} /> Digitális Építőipari Könyvtár &amp; Szakkönyvek
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Szakmai Könyvek &amp; Digitális Kiadványok
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Akkreditált szakkönyvek, mérnöki kézikönyvek, Eurocode szabványismertetők és letölthető kivitelezési segédletek szakembereknek és tanulóknak.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation */}
      <SectionSubNav
        ariaLabel="Tudástár navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Fogalomtár',
            page: 'glossary',
            icon: <BookOpen size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Számítások',
            page: 'calculations',
            icon: <Calculator size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Szakmai könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: true,
          },
        ]}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Toast Notifications */}
        {downloadSuccess && (
          <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>{downloadSuccess}</span>
            </div>
            <button onClick={() => setDownloadSuccess(null)} className="hover:opacity-80">
              <X size={18} />
            </button>
          </div>
        )}

        {digitalError && (
          <div className="mb-6 p-4 bg-red-600 text-white rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <X size={20} className="shrink-0" />
              <span>{digitalError}</span>
            </div>
            <button onClick={() => setDigitalError(null)} className="hover:opacity-80">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Search & Sorting Top Control Panel */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            
            {/* Search input matching Glossary style */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Keress könyvcím, szerző vagy téma alapján…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-accent font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden w-full sm:w-auto px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs rounded-2xl border border-gray-200 flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={15} />
              <span>Szűrés és kategóriák</span>
              {selectedCategory !== 'all' && (
                <span className="w-2 h-2 rounded-full bg-accent" />
              )}
            </button>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap hidden sm:inline">
                Rendezés:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-accent cursor-pointer w-full sm:w-auto"
              >
                <option value="recommended">Ajánlott</option>
                <option value="newest">Legújabb</option>
                <option value="title_asc">Cím szerint A–Z</option>
              </select>
            </div>

          </div>

          {/* Active Filter Chips */}
          {(selectedCategory !== 'all' || searchQuery.trim()) && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100 text-xs">
              <span className="font-bold text-gray-500">Aktív szűrők:</span>
              
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-primary-950 font-bold rounded-full">
                  <span>{categories.find((c) => c.id === selectedCategory)?.label}</span>
                  <button onClick={() => setSelectedCategory('all')} className="hover:bg-primary/20 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 font-bold rounded-full">
                  <span>Keresés: „{searchQuery}”</span>
                  <button onClick={() => setSearchQuery('')} className="hover:bg-amber-200 rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </span>
              )}

              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="font-bold text-accent hover:underline ml-2 cursor-pointer"
              >
                Szűrők törlése
              </button>
            </div>
          )}
        </div>

        {/* Sidebar + Book Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ═══════════ DESKTOP CATEGORY SIDEBAR (~260px Sticky) ═══════════ */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Library size={16} className="text-accent" />
                  Kategóriák
                </h3>
                <span className="text-[11px] font-bold text-gray-400">
                  {allBooks.length} könyv
                </span>
              </div>

              <nav className="space-y-1.5">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const count = categoryCounts[cat.id] || 0;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all font-bold cursor-pointer text-left ${
                        isActive
                          ? 'bg-primary text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="truncate pr-2">{cat.label}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* ═══════════ MAIN CONTENT AREA ═══════════ */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Results Header */}
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold border-b border-gray-200 pb-3">
              <div>
                Megjelenítve: <strong className="text-gray-900">{filteredBooks.length}</strong> szakkönyv
              </div>
            </div>

            {/* Book List / Cards */}
            {filteredBooks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
                <Library size={48} className="text-gray-300 mx-auto" />
                <h3 className="text-lg font-bold text-gray-900">Nem található könyv a megadott szűrőkkel</h3>
                <p className="text-xs text-gray-500">Próbáld meg megváltoztatni a keresést vagy válassz másik kategóriát!</p>
                <button
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-700 transition-colors shadow-md cursor-pointer"
                >
                  Szűrők Alaphelyzetbe Állítása
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBooks.map((book) => {
                  const isSaved = savedBookIds.has(book.id) || savedBookIds.has(book.title);

                  return (
                    <article
                      key={book.id}
                      onClick={() => handleBookSelect(book)}
                      className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col sm:flex-row p-5 sm:p-6 gap-6 group cursor-pointer"
                    >
                      {/* Book Cover with Fallback Support */}
                      <div className="w-full sm:w-40 md:w-48 shrink-0 flex flex-col items-center">
                        <BookCoverImage
                          book={book}
                          size="md"
                          onClick={() => handleBookSelect(book)}
                        />
                      </div>

                      {/* Book Information Section */}
                      <div className="flex-1 flex flex-col justify-between space-y-4">
                        
                        <div className="space-y-2">
                          {/* Category Badge & Difficulty */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 bg-primary/10 text-primary-950 border border-primary/20 font-extrabold text-[11px] rounded-full">
                                {book.categoryLabel}
                              </span>
                              {getDifficultyBadge(book.difficulty)}
                              <span className="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                {book.badge}
                              </span>
                            </div>

                            {/* Bookmark Action */}
                            <button
                              onClick={(e) => handleToggleBookmark(e, book)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isSaved
                                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-700'
                              }`}
                              title={isSaved ? 'Mentés eltávolítása' : 'Könyv mentése'}
                            >
                              {isSaved ? (
                                <BookmarkCheck size={16} className="text-amber-700 fill-amber-500" />
                              ) : (
                                <Bookmark size={16} />
                              )}
                            </button>
                          </div>

                          {/* Book Title */}
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 group-hover:text-primary transition-colors leading-tight">
                            {book.title}
                          </h3>

                          {/* Author & Meta */}
                          <p className="text-xs text-gray-500 font-semibold flex items-center gap-2 flex-wrap">
                            <span>Szerző: <strong className="text-gray-900">{book.author}</strong></span>
                            <span>•</span>
                            <span>{book.publisher} ({book.year})</span>
                          </p>

                          {/* Excerpt / Description */}
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 font-normal">
                            {book.description}
                          </p>
                        </div>

                        {/* Specs & Actions Footer */}
                        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                            <span className="flex items-center gap-1">
                              <BookOpen size={13} className="text-accent" />
                              <strong className="text-gray-800">{book.pages} oldal</strong>
                            </span>
                            <span>•</span>
                            <span>Formátum: <strong className="text-gray-800">{book.format}</strong></span>
                          </div>

                          {/* Contextual Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {/* Always: Részletek */}
                            <button
                              onClick={() => handleBookSelect(book)}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye size={14} /> Részletek
                            </button>

                            {/* Optional Preview Button */}
                            {(book.digitalPreviewUrl || book.digitalAccess?.previewUrl) && (
                              <button
                                onClick={(e) => triggerDigitalAction(e, book, 'preview')}
                                className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Eye size={13} className="text-blue-600" /> Előnézet
                              </button>
                            )}

                            {/* Dynamic Action Button (Only if digital access exists & is not 'none') */}
                            {((book.digitalAccessType && book.digitalAccessType !== 'none') || (book.digitalAccess && book.digitalAccess.accessType !== 'none')) && (
                              <button
                                onClick={(e) => triggerDigitalAction(e, book, 'digital')}
                                className="px-4 py-2 bg-primary hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                {book.digitalAccessType === 'online_reading' || book.digitalAccess?.accessType === 'free_online' ? (
                                  <>
                                    <BookOpen size={14} className="text-accent" />
                                    <span>Online olvasás</span>
                                  </>
                                ) : book.digitalAccessType === 'external_publisher' || book.digitalAccess?.accessType === 'external_link' ? (
                                  <>
                                    <Globe size={14} className="text-accent" />
                                    <span>Kiadói oldal</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={14} />
                                    <span>{book.digitalLinkLabel || book.digitalAccess?.buttonLabel || 'PDF letöltése'}</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MOBILE CATEGORY FILTER MODAL / PANEL */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-accent" />
                Szűrés &amp; Kategóriák
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Válassz kategóriát</div>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  const count = categoryCounts[cat.id] || 0;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setIsMobileFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
                        isActive
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {count} könyv
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl"
              >
                Szűrők Törlése
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-primary text-white font-bold text-xs rounded-xl shadow-md"
              >
                Kész
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOK DETAIL MODAL */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 overflow-hidden flex flex-col relative">
            
            {/* Modal Header */}
            <div className="relative bg-primary text-white p-6 md:p-8 space-y-3">
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 bg-accent/20 text-accent font-extrabold text-xs rounded-full border border-accent/30">
                  {selectedBook.categoryLabel}
                </span>
                {getDifficultyBadge(selectedBook.difficulty)}
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  {selectedBook.badge}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {selectedBook.title}
              </h2>
              <p className="text-sm text-gray-300">{selectedBook.subtitle}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-2 border-t border-white/10">
                <span>Szerző: <strong className="text-white">{selectedBook.author}</strong></span>
                <span>Kiadó: <strong className="text-white">{selectedBook.publisher} ({selectedBook.year})</strong></span>
                <span>ISBN: <strong className="text-white">{selectedBook.isbn}</strong></span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
              
              {/* Cover & Excerpt layout */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <BookCoverImage book={selectedBook} size="lg" className="mx-auto sm:mx-0 shadow-xl" />

                <div className="space-y-3 flex-1">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">A Kiadvány Ismertetője</h3>
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {selectedBook.description}
                  </p>
                </div>
              </div>

              {/* Table of Contents */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Részletes Tartalomjegyzék</h3>
                <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {selectedBook.tableOfContents.map((chap, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-800 font-semibold">
                      <CheckCircle2 size={15} className="text-accent shrink-0 mt-0.5" />
                      <span>{chap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Excerpt */}
              {selectedBook.sampleExcerpt && (
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Minta Részlet a Könyvből</h3>
                  <blockquote className="p-4 bg-amber-500/5 border-l-4 border-accent text-xs italic text-gray-700 rounded-r-2xl leading-relaxed">
                    "{selectedBook.sampleExcerpt}"
                  </blockquote>
                </div>
              )}

              {/* ════════════════ DIGITÁLIS ELÉRÉS BLOKK ════════════════ */}
              {selectedBook.digitalAccess && selectedBook.digitalAccess.accessType !== 'none' && (
                <div className="bg-gradient-to-br from-primary/5 via-blue-50/50 to-primary/10 border border-primary/20 rounded-3xl p-5 md:p-6 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-primary text-white rounded-2xl shadow-sm">
                        <Globe size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                          Digitális Elérés
                        </h3>
                        <p className="text-xs text-gray-600">
                          Töltsd le vagy olvasd online a kiadvány hivatalos digitális változatát.
                        </p>
                      </div>
                    </div>

                    {selectedBook.digitalAccess.copyrightStatus && (
                      <span className="self-start sm:self-center px-3 py-1 bg-white border border-gray-200 text-gray-700 font-extrabold text-[11px] rounded-full shadow-2xs">
                        {selectedBook.digitalAccess.copyrightStatus === 'own_upload' && 'Saját / Eredeti kiadás'}
                        {selectedBook.digitalAccess.copyrightStatus === 'publisher_permission' && 'Kiadói engedéllyel'}
                        {selectedBook.digitalAccess.copyrightStatus === 'public_external' && 'Nyilvános külső forrás'}
                        {selectedBook.digitalAccess.copyrightStatus === 'preview_only' && 'Minta / Előnézet'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                    <div className="space-y-1 text-xs text-gray-700">
                      {selectedBook.digitalAccess.accessNote && (
                        <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <span>{selectedBook.digitalAccess.accessNote}</span>
                        </p>
                      )}
                      <p className="text-gray-500 text-[11px]">
                        Kiadvány típusa: <strong className="text-gray-800 uppercase">{selectedBook.digitalAccess.publicationType}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
                      {selectedBook.digitalAccess.previewUrl && (
                        <a
                          href={selectedBook.digitalAccess.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye size={14} /> Minta Megtekintése
                        </a>
                      )}

                      {selectedBook.digitalAccess.digitalUrl && (
                        <a
                          href={selectedBook.digitalAccess.digitalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 bg-primary hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                          <Download size={15} />
                          <span>{selectedBook.digitalAccess.buttonLabel || 'Kiadvány Megnyitása'}</span>
                          <ExternalLink size={13} className="opacity-80" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ════════════════ BESZERZÉSI LEHETŐSÉGEK BLOKK ════════════════ */}
              {selectedBook.storeOffers && selectedBook.storeOffers.some((o) => o.isActive) && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag size={16} className="text-accent" />
                      Beszerzési Lehetőségek &amp; Bolti Ajánlatok
                    </h3>
                    <span className="text-[11px] font-bold text-gray-500">
                      {selectedBook.storeOffers.filter((o) => o.isActive).length} ajánlat
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedBook.storeOffers
                      .filter((o) => o.isActive)
                      .sort((a, b) => (b.isFeaturedOffer ? 1 : 0) - (a.isFeaturedOffer ? 1 : 0))
                      .map((offer) => (
                        <div
                          key={offer.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            offer.isFeaturedOffer
                              ? 'bg-amber-500/5 border-amber-300 shadow-2xs'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Store details */}
                          <div className="flex items-start gap-3.5 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center text-primary font-black text-sm">
                              {offer.storeLogoUrl ? (
                                <img src={offer.storeLogoUrl} alt={offer.storeName} className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag size={18} className="text-gray-500" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-extrabold text-gray-900">{offer.storeName}</h4>
                                
                                {offer.isPartnerOffer && (
                                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] rounded-full inline-flex items-center gap-1">
                                    <Tag size={10} /> Partneri ajánlat
                                  </span>
                                )}

                                {offer.isFeaturedOffer && (
                                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-extrabold text-[10px] rounded-full inline-flex items-center gap-1">
                                    <Star size={10} className="fill-purple-700" /> Kiemelt
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium flex-wrap">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-800 font-bold rounded-md text-[11px] uppercase">
                                  {offer.format}
                                </span>
                                <span>•</span>
                                <span className="text-emerald-700 font-bold">
                                  {offer.availability === 'in_stock' && 'Raktáron'}
                                  {offer.availability === 'instant_digital' && 'Azonnali letöltés'}
                                  {offer.availability === 'preorder' && 'Előrendelhető'}
                                  {offer.availability === 'limited_stock' && 'Korlátozott készlet'}
                                  {offer.availability === 'out_of_stock' && 'Elfogyott'}
                                </span>
                                {offer.shippingInfo && (
                                  <>
                                    <span>•</span>
                                    <span className="text-gray-500">{offer.shippingInfo}</span>
                                  </>
                                )}
                              </div>

                              {offer.offerNote && (
                                <p className="text-[11px] text-gray-500 italic">{offer.offerNote}</p>
                              )}
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                            <div className="text-left md:text-right">
                              <div className="text-base font-black text-gray-900">
                                {offer.price.toLocaleString('hu-HU')} {offer.currency || 'Ft'}
                              </div>
                              {offer.checkedAt && (
                                <div className="text-[10px] text-gray-400 font-medium">
                                  Ellenőrizve: {offer.checkedAt}
                                </div>
                              )}
                            </div>

                            <a
                              href={offer.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-primary font-extrabold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Megnézem a boltban</span>
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500 font-semibold">
                Formátum: <strong className="text-gray-900">{selectedBook.format}</strong> ({selectedBook.fileSizeMb} MB)
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Bezárás
                </button>
                {((selectedBook.digitalAccessType && selectedBook.digitalAccessType !== 'none') || (selectedBook.digitalAccess && selectedBook.digitalAccess.accessType !== 'none')) && (
                  <button
                    onClick={(e) => triggerDigitalAction(e, selectedBook, 'digital')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-primary font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {selectedBook.digitalAccessType === 'online_reading' || selectedBook.digitalAccess?.accessType === 'free_online' ? (
                      <>
                        <BookOpen size={16} /> Online Olvasás
                      </>
                    ) : selectedBook.digitalAccessType === 'external_publisher' || selectedBook.digitalAccess?.accessType === 'external_link' ? (
                      <>
                        <Globe size={16} /> Kiadói Oldal
                      </>
                    ) : (
                      <>
                        <Download size={16} /> {selectedBook.digitalLinkLabel || selectedBook.digitalAccess?.buttonLabel || 'PDF Letöltése'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigate={onNavigate}
        contentType="book"
        contentTitle={pendingBookTitle}
        returnPage="books"
      />

    </div>
  );
}
