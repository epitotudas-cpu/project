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
  Globe,
  ShoppingBag,
  Check,
  AlertTriangle,
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
  type PublicationType,
  type AccessType,
  type CopyrightStatus,
  type OfferFormat,
  type OfferAvailability,
  type BookDigitalAccess,
  type BookStoreOffer,
} from '../services/bookService';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';

export default function AdminBooksPage() {
  const books = useBooks();
  const categories = useBookCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('A könyvadatbázis módosításai sikeresen elmentve!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Book Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'digital' | 'offers'>('basic');

  // Category Editor Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editableCategories, setEditableCategories] = useState<BookCategory[]>([]);
  const [newCatLabel, setNewCatLabel] = useState('');

  // ════════════════ BOOK FORM STATE ════════════════
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

  // Digital Access State
  const [publicationType, setPublicationType] = useState<PublicationType>('pdf');
  const [accessType, setAccessType] = useState<AccessType>('free_download');
  const [digitalUrl, setDigitalUrl] = useState('');
  const [buttonLabel, setButtonLabel] = useState('PDF Letöltése');
  const [previewUrl, setPreviewUrl] = useState('');
  const [accessNote, setAccessNote] = useState('');
  const [copyrightStatus, setCopyrightStatus] = useState<CopyrightStatus>('publisher_permission');
  const [publisherUrl, setPublisherUrl] = useState('');

  // Store Offers State
  const [storeOffers, setStoreOffers] = useState<BookStoreOffer[]>([]);

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

  // Helper URL validator
  const isValidUrl = (url?: string): boolean => {
    if (!url || !url.trim()) return true;
    return /^https?:\/\//i.test(url.trim());
  };

  // ════════════════ CATEGORY EDITOR HANDLERS ════════════════
  const handleOpenCategoryModal = () => {
    setEditableCategories([...categories]);
    setNewCatLabel('');
    setShowCategoryModal(true);
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index <= 1) return;
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

  // ════════════════ STORE OFFERS DYNAMIC HANDLERS ════════════════
  const handleAddStoreOffer = () => {
    const newOffer: BookStoreOffer = {
      id: `offer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storeName: '',
      storeLogoUrl: '',
      productUrl: 'https://',
      format: 'nyomtatott',
      price: 4990,
      currency: 'HUF',
      availability: 'in_stock',
      shippingInfo: '1-2 munkanap',
      offerNote: '',
      isPartnerOffer: false,
      isFeaturedOffer: false,
      checkedAt: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    setStoreOffers([...storeOffers, newOffer]);
  };

  const handleUpdateStoreOffer = (id: string, field: keyof BookStoreOffer, value: any) => {
    setStoreOffers(
      storeOffers.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleDeleteStoreOffer = (id: string) => {
    setStoreOffers(storeOffers.filter((o) => o.id !== id));
  };

  const handleMoveStoreOffer = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index >= storeOffers.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...storeOffers];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setStoreOffers(next);
  };

  // ════════════════ BOOK MODAL OPEN & SAVE HANDLERS ════════════════
  const handleOpenAddModal = () => {
    setEditingBook(null);
    setActiveTab('basic');
    setErrorMessage(null);

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

    // Digital Access Defaults
    setPublicationType('pdf');
    setAccessType('free_download');
    setDigitalUrl('https://');
    setButtonLabel('PDF Letöltése');
    setPreviewUrl('');
    setAccessNote('Ingyenesen letölthető kiadvány.');
    setCopyrightStatus('publisher_permission');
    setPublisherUrl('');

    // Offers
    setStoreOffers([]);

    setShowModal(true);
  };

  const handleOpenEditModal = (book: BookItem) => {
    setEditingBook(book);
    setActiveTab('basic');
    setErrorMessage(null);

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

    // Digital Access
    const da = book.digitalAccess;
    setPublicationType(da?.publicationType || 'pdf');
    setAccessType(da?.accessType || 'free_download');
    setDigitalUrl(da?.digitalUrl || '');
    setButtonLabel(da?.buttonLabel || 'PDF Letöltése');
    setPreviewUrl(da?.previewUrl || '');
    setAccessNote(da?.accessNote || '');
    setCopyrightStatus(da?.copyrightStatus || 'publisher_permission');
    setPublisherUrl(da?.publisherUrl || '');

    // Offers
    setStoreOffers(Array.isArray(book.storeOffers) ? [...book.storeOffers] : []);

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
    setErrorMessage(null);

    if (!title.trim() || !author.trim()) {
      setErrorMessage('Kérjük, add meg a könyv címét és szerzőjét!');
      setActiveTab('basic');
      return;
    }

    // Digital Access Validation
    if (accessType !== 'none') {
      if (!digitalUrl || !digitalUrl.trim()) {
        setErrorMessage('Amennyiben a digitális elérhetőség nem "nincs", a digitális URL megadása kötelező!');
        setActiveTab('digital');
        return;
      }
      if (!isValidUrl(digitalUrl)) {
        setErrorMessage('A digitális kiadvány URL-je érvényes "http://" vagy "https://" link kell legyen!');
        setActiveTab('digital');
        return;
      }
    }
    if (previewUrl && !isValidUrl(previewUrl)) {
      setErrorMessage('Az előnézet / minta URL érvényes "http://" vagy "https://" link kell legyen!');
      setActiveTab('digital');
      return;
    }
    if (publisherUrl && !isValidUrl(publisherUrl)) {
      setErrorMessage('A kiadó oldalának URL-je érvényes "http://" vagy "https://" link kell legyen!');
      setActiveTab('digital');
      return;
    }

    // Offers Validation
    for (let i = 0; i < storeOffers.length; i++) {
      const offer = storeOffers[i];
      if (!offer.storeName || !offer.storeName.trim()) {
        setErrorMessage(`A(z) ${i + 1}. könyvesbolti ajánlatnál kötelező megadni a bolt nevét!`);
        setActiveTab('offers');
        return;
      }
      if (!offer.productUrl || !offer.productUrl.trim() || offer.productUrl === 'https://') {
        setErrorMessage(`A(z) ${i + 1}. könyvesbolti ajánlatnál kötelező megadni a termékoldal URL-jét!`);
        setActiveTab('offers');
        return;
      }
      if (!isValidUrl(offer.productUrl)) {
        setErrorMessage(`A(z) ${i + 1}. ajánlat termékoldal URL-je érvényes "http://" vagy "https://" link kell legyen!`);
        setActiveTab('offers');
        return;
      }
      if (offer.price < 0) {
        setErrorMessage(`A(z) ${i + 1}. ajánlat ára nem lehet negatív!`);
        setActiveTab('offers');
        return;
      }
    }

    const matchedCat = categories.find((c) => c.id === category);
    const categoryLabel = matchedCat ? matchedCat.label : 'Szerkezetépítés';

    const tocArray = tableOfContents
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const digitalAccessObj: BookDigitalAccess = {
      publicationType,
      accessType,
      digitalUrl: digitalUrl.trim(),
      buttonLabel: buttonLabel.trim() || 'Kiadvány Megnyitása',
      previewUrl: previewUrl.trim(),
      accessNote: accessNote.trim(),
      copyrightStatus,
      publisherUrl: publisherUrl.trim(),
    };

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
              downloadUrl: digitalUrl.trim() || b.downloadUrl || '#',
              description: description.trim(),
              tableOfContents: tocArray,
              sampleExcerpt: sampleExcerpt.trim(),
              rating,
              digitalAccess: digitalAccessObj,
              storeOffers,
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
        downloadUrl: digitalUrl.trim() || '#',
        format: 'Nyomtatott + PDF',
        fileSizeMb: 15.0,
        description: description.trim(),
        tableOfContents: tocArray,
        sampleExcerpt: sampleExcerpt.trim(),
        rating,
        reviewsCount: 1,
        digitalAccess: digitalAccessObj,
        storeOffers,
      };
      saveBooks([newBook, ...books]);
    }

    setShowModal(false);
    triggerSuccessNotify('Könyv és bolti ajánlatok sikeresen elmentve!');
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
            Építőipari szakkönyvek, digitális kiadványok és könyvesbolti ajánlatok központi szerkesztése.
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
        {filteredBooks.map((book) => {
          const offersCount = book.storeOffers?.filter((o) => o.isActive).length || 0;

          return (
            <div
              key={book.id}
              className="bg-[#111111] border border-[#1E1E1E] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-accent/40 transition-all"
            >
              <div>
                {/* Cover & Badges */}
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
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {book.digitalAccess && book.digitalAccess.accessType !== 'none' && (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                          <Globe size={11} /> Digitális elérés
                        </span>
                      )}
                      {offersCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                          <ShoppingBag size={11} /> {offersCount} bolti ajánlat
                        </span>
                      )}
                    </div>
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
          );
        })}
      </div>

      {/* ════════════════ CATEGORY EDITOR MODAL ════════════════ */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto admin-scroll">
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
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

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

                      {!isAll && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

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
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto admin-scroll">
            
            {/* Header */}
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-3">
              <h3 style={{ color: textColor }} className="text-base font-extrabold flex items-center gap-2">
                <BookOpen size={18} style={{ color: cardHighlight }} />
                {editingBook ? 'Szakkönyv &amp; Digitális Kiadvány Szerkesztése' : 'Új Építőipari Kiadvány Hozzáadása'}
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

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-2 text-xs font-bold animate-shake">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'basic'
                    ? 'bg-accent text-black shadow-md'
                    : 'text-gray-400 hover:text-white bg-black/20'
                }`}
              >
                <BookOpen size={14} /> 1. Alapadatok &amp; Tartalom
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('digital')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'digital'
                    ? 'bg-accent text-black shadow-md'
                    : 'text-gray-400 hover:text-white bg-black/20'
                }`}
              >
                <Globe size={14} /> 2. Digitális Elérhetőség
                {accessType !== 'none' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('offers')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'offers'
                    ? 'bg-accent text-black shadow-md'
                    : 'text-gray-400 hover:text-white bg-black/20'
                }`}
              >
                <ShoppingBag size={14} /> 3. Bolti Ajánlatok ({storeOffers.length})
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-5 text-xs">
              
              {/* TAB 1: BASIC INFO */}
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
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
              )}

              {/* TAB 2: DIGITAL ACCESS */}
              {activeTab === 'digital' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-[#18181b] border border-gray-800 rounded-2xl space-y-4">
                    <h4 className="font-extrabold text-sm text-accent flex items-center gap-2">
                      <Globe size={16} /> Digitális Kiadvány Beállításai
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-gray-300 block mb-1">Kiadvány típusa</label>
                        <select
                          value={publicationType}
                          onChange={(e) => setPublicationType(e.target.value as PublicationType)}
                          style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                          className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none"
                        >
                          <option value="nyomtatott">Nyomtatott könyv</option>
                          <option value="pdf">PDF kiadvány / dokumentum</option>
                          <option value="ekonyv">E-könyv (EPUB / Kindle)</option>
                          <option value="prospektus">Prospektus / Kiadvány</option>
                          <option value="katalogus">Termékkatalógus</option>
                          <option value="tananyag">Oktatási tananyag</option>
                          <option value="szabvany">Szabványismertető</option>
                          <option value="egyeb">Egyéb digitális állomány</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-gray-300 block mb-1">Elérhetőség típusa</label>
                        <select
                          value={accessType}
                          onChange={(e) => setAccessType(e.target.value as AccessType)}
                          style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                          className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none"
                        >
                          <option value="none">Nincs digitális változat</option>
                          <option value="free_download">Ingyenes letöltés (PDF / Fájl)</option>
                          <option value="free_online">Ingyenes online olvasás</option>
                          <option value="requires_login">Bejelentkezéssel elérhető</option>
                          <option value="paid_digital">Fizetős digitális kiadás</option>
                          <option value="external_link">Külső oldalra mutató hivatkozás</option>
                        </select>
                      </div>

                      {accessType !== 'none' && (
                        <>
                          <div className="sm:col-span-2">
                            <label className="font-bold text-gray-300 block mb-1">
                              Digitális Kiadvány URL-je * <span className="text-gray-500 font-normal">(http:// vagy https://)</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="https://kiado.hu/kiadvany.pdf"
                              value={digitalUrl}
                              onChange={(e) => setDigitalUrl(e.target.value)}
                              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                              className="w-full border rounded-xl px-4 py-2 font-mono text-xs focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-gray-300 block mb-1">Gomb felirata a nyilvános oldalon</label>
                            <input
                              type="text"
                              placeholder="Pl.: PDF letöltése, Online olvasás"
                              value={buttonLabel}
                              onChange={(e) => setButtonLabel(e.target.value)}
                              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                              className="w-full border rounded-xl px-4 py-2 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-gray-300 block mb-1">Előnézet / Minta URL (opcionális)</label>
                            <input
                              type="text"
                              placeholder="https://kiado.hu/minta.pdf"
                              value={previewUrl}
                              onChange={(e) => setPreviewUrl(e.target.value)}
                              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                              className="w-full border rounded-xl px-4 py-2 font-mono text-xs focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-gray-300 block mb-1">Szerzői jogi státusz</label>
                            <select
                              value={copyrightStatus}
                              onChange={(e) => setCopyrightStatus(e.target.value as CopyrightStatus)}
                              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                              className="w-full border rounded-xl px-4 py-2 focus:outline-none"
                            >
                              <option value="own_upload">Saját feltöltés / Eredeti kiadás</option>
                              <option value="publisher_permission">Kiadói engedéllyel közölve</option>
                              <option value="public_external">Nyilvános külső hivatkozás</option>
                              <option value="preview_only">Csak előnézet / Részlet</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-bold text-gray-300 block mb-1">Kiadó hivatalos weboldala (opcionális)</label>
                            <input
                              type="text"
                              placeholder="https://kiado-weboldal.hu"
                              value={publisherUrl}
                              onChange={(e) => setPublisherUrl(e.target.value)}
                              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                              className="w-full border rounded-xl px-4 py-2 font-mono text-xs focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="font-bold text-gray-300 block mb-1">Hozzáférési megjegyzés</label>
                            <input
                              type="text"
                              placeholder="Pl.: Ingyenesen letölthető a kiadó hivatalos oldaláról"
                              value={accessNote}
                              onChange={(e) => setAccessNote(e.target.value)}
                              style={{ backgroundColor: inputBg, borderColor: cardBorder, color: getContrastTextColor(inputBg) }}
                              className="w-full border rounded-xl px-4 py-2 focus:outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STORE OFFERS */}
              {activeTab === 'offers' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between bg-[#18181b] p-4 rounded-2xl border border-gray-800">
                    <div>
                      <h4 className="font-extrabold text-sm text-accent flex items-center gap-2">
                        <ShoppingBag size={16} /> Könyvesbolti Vásárlási Ajánlatok ({storeOffers.length})
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Vásárlási és beszerezhetőségi linkek, partneri (affiliate) ajánlatok és árak felvitele.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddStoreOffer}
                      style={{ backgroundColor: cardHighlight, color: '#000000' }}
                      className="px-4 py-2 font-extrabold text-xs rounded-xl shadow-md hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus size={15} /> Ajánlat Hozzáadása
                    </button>
                  </div>

                  {storeOffers.length === 0 ? (
                    <div className="p-8 text-center bg-[#141414] rounded-2xl border border-gray-800 space-y-3">
                      <ShoppingBag size={36} className="text-gray-600 mx-auto" />
                      <p className="text-xs text-gray-400 font-medium">Még nincsenek felvéve könyvesbolti ajánlatok ehhez a kiadványhoz.</p>
                      <button
                        type="button"
                        onClick={handleAddStoreOffer}
                        className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl shadow-md cursor-pointer"
                      >
                        ＋ Első Ajánlat Hozzáadása
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {storeOffers.map((offer, idx) => (
                        <div
                          key={offer.id}
                          style={{ backgroundColor: inputBg, borderColor: cardBorder }}
                          className="p-4 border rounded-2xl space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-mono text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span className="font-extrabold text-xs text-white">
                                {offer.storeName || 'Új bolti ajánlat'}
                              </span>
                              {offer.isPartnerOffer && (
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold rounded-full">
                                  Partneri ajánlat
                                </span>
                              )}
                              {offer.isFeaturedOffer && (
                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold rounded-full">
                                  Kiemelt
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveStoreOffer(idx, 'up')}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === storeOffers.length - 1}
                                onClick={() => handleMoveStoreOffer(idx, 'down')}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStoreOffer(offer.id)}
                                className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg ml-2"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div>
                              <label className="font-bold text-gray-400 block mb-1">Könyvesbolt neve *</label>
                              <input
                                type="text"
                                required
                                placeholder="Pl.: Libri, Bookline, Kiadó bolt"
                                value={offer.storeName}
                                onChange={(e) => handleUpdateStoreOffer(offer.id, 'storeName', e.target.value)}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="w-full border rounded-xl px-3 py-1.5 font-bold focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="font-bold text-gray-400 block mb-1">Termékoldal URL-je * (http:// vagy https://)</label>
                              <input
                                type="text"
                                required
                                placeholder="https://bolt.hu/konyv-termekoldal"
                                value={offer.productUrl}
                                onChange={(e) => handleUpdateStoreOffer(offer.id, 'productUrl', e.target.value)}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="w-full border rounded-xl px-3 py-1.5 font-mono text-[11px] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-gray-400 block mb-1">Formátum</label>
                              <select
                                value={offer.format}
                                onChange={(e) => handleUpdateStoreOffer(offer.id, 'format', e.target.value as OfferFormat)}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="w-full border rounded-xl px-3 py-1.5 font-bold focus:outline-none"
                              >
                                <option value="nyomtatott">Nyomtatott könyv</option>
                                <option value="pdf">PDF E-könyv</option>
                                <option value="epub">EPUB e-könyv</option>
                                <option value="kindle">Kindle kiadás</option>
                                <option value="audiobook">Hangoskönyv</option>
                                <option value="egyeb">Egyéb formátum</option>
                              </select>
                            </div>

                            <div>
                              <label className="font-bold text-gray-400 block mb-1">Ár (Ft)</label>
                              <input
                                type="number"
                                min="0"
                                value={offer.price}
                                onChange={(e) => handleUpdateStoreOffer(offer.id, 'price', Number(e.target.value))}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="w-full border rounded-xl px-3 py-1.5 font-bold focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-gray-400 block mb-1">Elérhetőség</label>
                              <select
                                value={offer.availability}
                                onChange={(e) => handleUpdateStoreOffer(offer.id, 'availability', e.target.value as OfferAvailability)}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="w-full border rounded-xl px-3 py-1.5 font-bold focus:outline-none"
                              >
                                <option value="in_stock">Raktáron</option>
                                <option value="instant_digital">Azonnali letöltés</option>
                                <option value="preorder">Előrendelhető</option>
                                <option value="limited_stock">Korlátozott készlet</option>
                                <option value="out_of_stock">Elfogyott</option>
                              </select>
                            </div>

                            <div>
                              <label className="font-bold text-gray-400 block mb-1">Szállítási infó (opcionális)</label>
                              <input
                                type="text"
                                placeholder="1-2 munkanap • 990 Ft"
                                value={offer.shippingInfo || ''}
                                onChange={(e) => handleUpdateStoreOffer(offer.id, 'shippingInfo', e.target.value)}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="w-full border rounded-xl px-3 py-1.5 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-gray-400 block mb-1">Bolt logó URL (opcionális)</label>
                              <input
                                type="text"
                                placeholder="https://logo.png"
                                value={offer.storeLogoUrl || ''}
                                onChange={(e) => handleUpdateStoreOffer(offer.id, 'storeLogoUrl', e.target.value)}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="w-full border rounded-xl px-3 py-1.5 text-[11px] font-mono focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-gray-400 block mb-1">Ellenőrzés dátuma</label>
                              <input
                                type="date"
                                value={offer.checkedAt || ''}
                                onChange={(e) => handleUpdateStoreOffer(offer.id, 'checkedAt', e.target.value)}
                                style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }}
                                className="w-full border rounded-xl px-3 py-1.5 focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-3 flex flex-wrap items-center gap-6 pt-2 border-t border-gray-800">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={offer.isPartnerOffer}
                                  onChange={(e) => handleUpdateStoreOffer(offer.id, 'isPartnerOffer', e.target.checked)}
                                  className="w-4 h-4 rounded text-accent"
                                />
                                <span>Partneri / Affiliate ajánlat</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={offer.isFeaturedOffer}
                                  onChange={(e) => handleUpdateStoreOffer(offer.id, 'isFeaturedOffer', e.target.checked)}
                                  className="w-4 h-4 rounded text-accent"
                                />
                                <span>Kiemelt ajánlat</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={offer.isActive}
                                  onChange={(e) => handleUpdateStoreOffer(offer.id, 'isActive', e.target.checked)}
                                  className="w-4 h-4 rounded text-emerald-500"
                                />
                                <span>Aktív státusz</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Modal Submit Footer */}
              <div style={{ borderColor: cardBorder }} className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-400 font-medium">
                  {activeTab === 'basic' && 'Alapadatok kitöltése'}
                  {activeTab === 'digital' && 'Digitális letöltések beállítása'}
                  {activeTab === 'offers' && `${storeOffers.length} bolti ajánlat rögzítve`}
                </div>

                <div className="flex items-center gap-3">
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
                    className="px-6 py-2.5 font-extrabold rounded-xl transition-all shadow-lg cursor-pointer hover:opacity-90 flex items-center gap-2"
                  >
                    <Check size={16} /> {editingBook ? 'Módosítások Mentése' : 'Könyv Létrehozása'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
