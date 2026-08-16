import { useState, useMemo } from 'react';
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
  Book,
  Building,
  Zap,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { useBooks } from '../services/bookService';
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from '../components/AuthPromptModal';

interface BooksPageProps {
  onNavigate: (page: string) => void;
}

export interface BookItem {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  year: number;
  pages: number;
  isbn: string;
  category: 'all' | 'szerkezet' | 'gepeszet' | 'munkavedelem' | 'statika' | 'befejezo';
  categoryLabel: string;
  badge: string;
  badgeColor: string;
  coverImage: string;
  downloadUrl: string;
  format: string;
  fileSizeMb?: number;
  description: string;
  tableOfContents: string[];
  sampleExcerpt: string;
  rating: number;
  reviewsCount: number;
}

export default function BooksPage({ onNavigate }: BooksPageProps) {
  const { user } = useAuth();
  const allBooks = useBooks();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingBookTitle, setPendingBookTitle] = useState<string | undefined>(undefined);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return allBooks.filter((b) => {
      const matchCat = selectedCategory === 'all' || b.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [allBooks, selectedCategory, searchQuery]);

  const handleBookSelect = (book: BookItem) => {
    if (!user) {
      setPendingBookTitle(book.title);
      setAuthModalOpen(true);
      return;
    }
    setSelectedBook(book);
  };

  const handleDownload = (book: BookItem) => {
    if (!user) {
      setPendingBookTitle(book.title);
      setAuthModalOpen(true);
      return;
    }
    setDownloadSuccess(`📥 "${book.title}" letöltése elindult!`);
    setTimeout(() => setDownloadSuccess(null), 4000);
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
            label: 'Cikkek',
            page: 'category',
            icon: <FileText size={14} className="text-accent" />,
            active: false,
          },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Toast Notification */}
        {downloadSuccess && (
          <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>{downloadSuccess}</span>
            </div>
            <button onClick={() => setDownloadSuccess(null)} className="hover:opacity-80">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Search & Category Filter Header */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Keresés cím, szerző, ISBN vagy téma alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-accent font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 font-semibold">
              Összesen <span className="text-primary font-bold">{filteredBooks.length}</span> kiadvány található
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Összes Kiadvány', icon: <Library size={14} /> },
              { id: 'szerkezet', label: 'Szerkezetépítés & Alapozás', icon: <Building size={14} /> },
              { id: 'gepeszet', label: 'Épületgépészet & Villanyszerelés', icon: <Zap size={14} /> },
              { id: 'munkavedelem', label: 'Munkavédelem & Szabványok', icon: <ShieldCheck size={14} /> },
              { id: 'statika', label: 'Tervezés & Statika', icon: <Book size={14} /> },
              { id: 'befejezo', label: 'Szárazépítészet & Befejező Munkák', icon: <Layers size={14} /> },
            ].map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Cover Image Header */}
              <div className="relative h-48 overflow-hidden bg-primary">
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${book.badgeColor}`}>
                    <Sparkles size={11} /> {book.badge}
                  </span>
                </div>

                {/* Rating */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>{book.rating}</span>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] text-accent uppercase font-bold tracking-wider">
                    {book.categoryLabel}
                  </span>
                  <h3 className="text-base font-extrabold line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                    {book.title}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold flex items-center gap-2">
                    <span>Szerző: <strong className="text-gray-900">{book.author}</strong></span>
                    <span>•</span>
                    <span>{book.year}</span>
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {book.description}
                  </p>
                </div>

                {/* Specs metadata */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                  <div>
                    <span className="text-gray-400">Terjedelem:</span> <strong className="text-gray-800">{book.pages} oldal</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Formátum:</span> <strong className="text-gray-800">{book.format}</strong>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleBookSelect(book)}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} /> Tartalom &amp; Minta
                  </button>
                  <button
                    onClick={() => handleDownload(book)}
                    className="py-2.5 px-4 bg-primary hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    title="Könyv Letöltése"
                  >
                    <Download size={14} /> Letöltés
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty Search Fallback */}
        {filteredBooks.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
            <Library size={48} className="text-gray-400 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">Nem található könyv a megadott feltételekkel</h3>
            <p className="text-xs text-gray-500">Próbáld meg megváltoztatni a keresőszót vagy válassz másik kategóriát!</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Keresés Visszaállítása
            </button>
          </div>
        )}

      </div>

      {/* DETAIL MODAL / PREVIEW MODAL */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="relative bg-primary text-white p-6 md:p-8 space-y-3">
              <button
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${selectedBook.badgeColor}`}>
                <Sparkles size={12} /> {selectedBook.badge}
              </span>

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
              {/* Overview */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">A Kiadvány Ismertetője</h3>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {selectedBook.description}
                </p>
              </div>

              {/* Table of Contents */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Részletes Tartalomjegyzék</h3>
                <div className="space-y-2">
                  {selectedBook.tableOfContents.map((chap, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-800 font-medium">
                      <CheckCircle2 size={15} className="text-accent shrink-0 mt-0.5" />
                      <span>{chap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Excerpt */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Minta Részlet a Könyvből</h3>
                <blockquote className="p-4 bg-amber-500/5 border-l-4 border-accent text-xs italic text-gray-700 rounded-r-2xl leading-relaxed">
                  "{selectedBook.sampleExcerpt}"
                </blockquote>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
              <div className="text-xs text-gray-500 font-semibold">
                Formátum: <strong className="text-gray-900">{selectedBook.format}</strong> ({selectedBook.fileSizeMb} MB)
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Bezárás
                </button>
                <button
                  onClick={() => { handleDownload(selectedBook); setSelectedBook(null); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-primary font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  <Download size={16} /> Könyv / PDF Letöltése
                </button>
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
