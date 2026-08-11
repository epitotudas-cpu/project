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

const DEFAULT_BOOKS: BookItem[] = [
  {
    id: 'book-1',
    title: 'Monolitikus Vasbeton Szerkezetek Tervezése és Kivitelezése',
    subtitle: 'Átfogó mérnöki útmutató a zsalurendszerektől a betonozásig és utókezelésig',
    author: 'Prof. Dr. Balázs György',
    publisher: 'Műszaki Könyvkiadó',
    year: 2026,
    pages: 420,
    isbn: '978-963-16-4521-0',
    category: 'szerkezet',
    categoryLabel: 'Szerkezetépítés & Alapozás',
    badge: 'Kiemelt Szakkönyv',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 18.5,
    description:
      'A monolitikus vasbeton építészet alapműve, amely bemutatja a korszerű zsaluzási technológiákat, a betonacél vasalási tervek értelmezését, az Öntömörödő Beton (SCC) viselkedését, valamint a kötési szakasz párásítási és utókezelési szabályait az MSZ EN 206 szabványnak megfelelően.',
    tableOfContents: [
      '1. Fejezet: Zsalurendszerek és dúcolási teherbírási számítások',
      '2. Fejezet: Betonacél szerelés, toldások és lehorgonyzási hosszak',
      '3. Fejezet: Frissbeton feldolgozása, tömörítés és Öntömörödő Beton (SCC)',
      '4. Fejezet: Beton utókezelés, párazárás és fagy elleni védelem',
      '5. Fejezet: Szerkezeti hibák diagnosztikája és utólagos megerősítések',
    ],
    sampleExcerpt:
      'A vasbeton szerkezetek tartósságát alapvetően meghatározza a megfelelő betontakarás és a frissbeton utókezelésének minősége. A korai kiszáradás megelőzésére a betonozást követő első 7 napban folyamatos párásítás vagy felületi párazáró filmréteg felvitele kötelező.',
    rating: 4.9,
    reviewsCount: 142,
  },
  {
    id: 'book-2',
    title: 'Korszerű Épületgépészeti Rendszerek & KNE Energetika',
    subtitle: 'Hőszivattyúk, felületfűtések és a 7/2006. TNM energetikai rendelet gyakorlata',
    author: 'Szabó István okleveles gépészmérnök',
    publisher: 'Építésügyi Tudományos Kiadó',
    year: 2025,
    pages: 310,
    isbn: '978-963-16-8901-2',
    category: 'gepeszet',
    categoryLabel: 'Épületgépészet & Villanyszerelés',
    badge: 'KNE Energetika 2026',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'PDF E-könyv',
    fileSizeMb: 12.2,
    description:
      'Gyakorlati kézikönyv épületgépészeknek és kivitelezőknek. Tárgyalja a levegő-víz hőszivattyús rendszereket, a padló- és mennyezetfűtési rétegrendeket, a hővisszanyerős szellőztetést és a Közel Nullás (KNE) energetikai követelmények teljesítését.',
    tableOfContents: [
      '1. Fejezet: A KNE energetikai rendelet és az U-érték határértékek',
      '2. Fejezet: Levegő-víz és geotermikus hőszivattyúk méretezése',
      '3. Fejezet: Felületfűtési és felülethűtési rétegrendek',
      '4. Fejezet: Hővisszanyerős központi és helyiségenkénti szellőztetés',
      '5. Fejezet: Okosotthon integráció és hidraulikai beszabályozás',
    ],
    sampleExcerpt:
      'A hőszivattyús rendszerek hatékonyságának (COP/SCOP) előfeltétele az alacsony előremenő vízhőmérséklet (max. 35°C). Emiatt a felületfűtések méretezésénél a csőtávolságok és a megfelelő aljzatbeton hővezetés kulcsfontosságú.',
    rating: 4.8,
    reviewsCount: 98,
  },
  {
    id: 'book-3',
    title: 'Magasépítési Kivitelezői Kézikönyv & Munkavédelmi Szabályzat',
    subtitle: 'Munkaterületi biztonságtechnika, állványozás és helyszíni irányítás',
    author: 'ÉPMI Építésügyi Szakmai Intézet',
    publisher: 'ÉPMI Kiadványok',
    year: 2026,
    pages: 280,
    isbn: '978-963-88-0012-4',
    category: 'munkavedelem',
    categoryLabel: 'Munkavédelem & Szabványok',
    badge: 'Ingyenes PDF Segédlet',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'Ingyenes PDF',
    fileSizeMb: 8.4,
    description:
      'Hivatalos útmutató az építésvezetők, műszaki ellenőrök és munkavédelmi felelősök számára. Tartalmazza a legújabb 2026-os munkavédelmi szabványokat, leesés elleni védelmet, állványzatok átvételi jegyzőkönyveit és az e-építési napló vezetésének szabályait.',
    tableOfContents: [
      '1. Fejezet: Munkaterület átadás-átvétel és felelős műszaki vezetés',
      '2. Fejezet: Magasban végzett munkák és leesés elleni egyéni/kollektív védelem',
      '3. Fejezet: Homlokzati állványok szerelése, horgonyzása és átvétele',
      '4. Fejezet: Munkagödrök és munkagödrök dúcolási szabályai',
      '5. Fejezet: E-építési napló és hatósági ellenőrzések felkészülési csekklistája',
    ],
    sampleExcerpt:
      'Minden 2 métert meghaladó szintkülönbség esetén kötelező a kollektív védelem (korlátrendszer lábléccel) vagy az egyéni leesés elleni védőfelszerelés használata kikötési pontok biztosításával.',
    rating: 4.7,
    reviewsCount: 86,
  },
  {
    id: 'book-4',
    title: 'Eurocode 2: Beton- és Vasbetonszerkezetek Méretezése',
    subtitle: 'MSZ EN 1992-1-1 szabványsorozat szakmai magyarázata és mintapéldák',
    author: 'Dr. Kovács Tamás Statikus Tervező',
    publisher: 'Akadémiai & Mérnöki Kiadó',
    year: 2025,
    pages: 510,
    isbn: '978-963-456-789-0',
    category: 'statika',
    categoryLabel: 'Építész Tervezés & Statika',
    badge: 'Eurocode Szabvány',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 24.1,
    description:
      'A magyar és európai statikai tervezési szabvány (Eurocode 2) legrészletesebb hazai elemzése. Tartalmazza a hajlítási, nyírási, csavarási teherbírási számításokat, a repedéstágasság és behajlás ellenőrzését lépésről lépésre kidolgozott számpéldákkal.',
    tableOfContents: [
      '1. Fejezet: Anyagjellemzők: Beton és betonacél szilárdsági osztályok',
      '2. Fejezet: Hajlított és nyomott keresztmetszetek teherbírása (ULS)',
      '3. Fejezet: Nyírási teherbírás és nyírási vasalás méretezése',
      '4. Fejezet: Használhatósági határállapotok (SLS): Repedéstágasság és behajlás',
      '5. Fejezet: Kétrányban teherviselő lemezek és áttörések méretezése',
    ],
    sampleExcerpt:
      'Az Eurocode 2 szerint a repedéstágasság korlátozása (wmax <= 0.3 mm) nemcsak esztétikai, hanem tartóssági feltétel is, mivel megelőzi a betonacél korrózióját agresszív környezeti osztályokban.',
    rating: 5.0,
    reviewsCount: 112,
  },
  {
    id: 'book-5',
    title: 'Szárazépítészeti Mesterfogások & Gipszkarton Rendszerek',
    subtitle: 'Válaszfalak, álmennyezetek, hanggátlás és tűzgátló burkolatok szerelése',
    author: 'Tóth László Szárazépítő Mester',
    publisher: 'ÉpítőTudás Digitális Presztízs',
    year: 2026,
    pages: 190,
    isbn: '978-963-77-9911-0',
    category: 'befejezo',
    categoryLabel: 'Szárazépítészet & Befejező Munkák',
    badge: 'Új Kiadás 2026',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
    coverImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'PDF E-könyv',
    fileSizeMb: 9.8,
    description:
      'Gyakorlati útmutató a gipszkartonozás szakszerű kivitelezéséhez. Tárgyalja a CW/UW és CD/UD fémváz profilok rögzítését, a vízszintes és függőleges csatlakozások rugalmas tömítését, a Q1-Q4 felületi minőségi osztályokat és a hanggátló szerkezeteket.',
    tableOfContents: [
      '1. Fejezet: Gipszkarton tábla típusok (RB, RBI, RF, RFI) és alkalmazási területeik',
      '2. Fejezet: Fémvázas válaszfalak és előtétfalak szerelése szigeteléssel',
      '3. Fejezet: Álmennyezetek felfüggesztése és hőtágulási hézagok',
      '4. Fejezet: Hanggátlási megoldások és akusztikai hanggátló gipszkartonok',
      '5. Fejezet: Hézagolás, bandázsolás és Q1-Q4 glettelési felületminőségek',
    ],
    sampleExcerpt:
      'A gipszkarton válaszfalak hanggátlásának kulcsa a fémvázas profilok alatti szivacscsík (szigetelő szalag) alkalmazása, amely megakadályozza a kopogóhangok testhangszigeteléssel történő átterjedését.',
    rating: 4.9,
    reviewsCount: 74,
  },
  {
    id: 'book-6',
    title: 'Családi Házak Homlokzati Hőszigetelése & Vízszigetelési Útmutató',
    subtitle: 'EPS, Grafitos és Kőzetgyapot homlokzatok, XPS lábazati szigetelés',
    author: 'Varga Ferenc Építészmérnök',
    publisher: 'Épületfizikai Szakmai Kiadó',
    year: 2025,
    pages: 255,
    isbn: '978-963-990-112-4',
    category: 'befejezo',
    categoryLabel: 'Szárazépítészet & Befejező Munkák',
    badge: 'E-könyv',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    coverImage: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=800&auto=format&fit=crop',
    downloadUrl: '#',
    format: 'Nyomtatott + PDF',
    fileSizeMb: 14.6,
    description:
      'Részletes szakkönyv a homlokzati hőszigetelő rendszerek (THR/ETICS) hibátlan kivitelezéséről. Külön fejezet foglalkozik a dübelezési mintákkal, az ablak körüli befordulások beázásmentes kialakításával és a lábazati XPS csatlakozásokkal.',
    tableOfContents: [
      '1. Fejezet: Homlokzati szigetelőanyagok összehasonlítása: EPS, Grafitos, Kőzetgyapot',
      '2. Fejezet: Ragasztás és dübelezés szabályai: perem-pont módszer és dübelhossz',
      '3. Fejezet: Ablakkávák és nyílászáró befordulások beázásmentes részletrajzai',
      '4. Fejezet: Lábazati XPS szigetelés és talajvíz elleni vízszigetelő csatlakozás',
      '5. Fejezet: Üvegszövet háló beágyazása és homlokzati vakolási hibák megelőzése',
    ],
    sampleExcerpt:
      'A homlokzati szigetelőlapokat kivétel nélkül perem-pont módszerrel kell ragasztani, hogy megelőzzük a lapok mögötti levegőcirkulációt és kéményhatást tűz esetén.',
    rating: 4.8,
    reviewsCount: 65,
  },
];

export default function BooksPage({ onNavigate }: BooksPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return DEFAULT_BOOKS.filter((b) => {
      const matchCat = selectedCategory === 'all' || b.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleDownload = (book: BookItem) => {
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
                    onClick={() => setSelectedBook(book)}
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

    </div>
  );
}
