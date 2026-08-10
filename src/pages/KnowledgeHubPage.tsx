import { BookOpen, Calculator, Library, ArrowRight, ChevronRight, FileText } from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';

interface KnowledgeHubPageProps {
  onNavigate: (page: string) => void;
  activeSubTab?: string;
}

export default function KnowledgeHubPage({ onNavigate, activeSubTab }: KnowledgeHubPageProps) {
  return (
    <div className="bg-[#f5f5f5] text-[#202628] min-h-screen pb-16">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Tudástár Központ</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
                Tudástár
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Építőipari Tudástár Központ
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                A szakmai cikkektől és bemutatóktól kezdve a szakszótáron át a méretezési kalkulátorokig és szakmai könyvekig – minden tudás egy helyen.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('glossary')}
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-black text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <BookOpen size={15} />
                Fogalomtár Megnyitása
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Tudástár navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Cikkek',
            page: 'category',
            icon: <FileText size={14} className="text-accent" />,
            active: activeSubTab === 'category',
          },
          {
            label: 'Fogalomtár',
            page: 'glossary',
            icon: <BookOpen size={14} className="text-accent" />,
            active: activeSubTab === 'glossary',
          },
          {
            label: 'Számítások',
            page: 'calculations',
            icon: <Calculator size={14} className="text-accent" />,
            active: activeSubTab === 'calculations',
          },
          {
            label: 'Szakmai könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: activeSubTab === 'books',
          },
        ]}
      />

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Cikkek & Útmutatók */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl w-fit">
                <FileText size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Szakmai Cikkek &amp; Útmutatók</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Részletes műszaki elemzések, lépésről lépésre kivitelezési útmutatók, anyagválasztási és technológiai cikkek az építőipar minden területéről.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('category')}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-primary hover:underline"
              >
                Böngészés a Cikkek között <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 2: Fogalomtár & Zsargon Szótár */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl w-fit">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Fogalomtár &amp; Zsargon Szótár</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Építőipari kifejezések, műszaki szakszavak és építkezési zsargon magyarázata beágyazott oktatóvideókkal, ábrákkal és többnyelvű szótárral.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('glossary')}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-primary hover:underline"
              >
                Fogalomtár Böngészése <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 3: Számítások & Kalkulátorok */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl w-fit">
                <Calculator size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Számítások &amp; Kalkulátorok</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Anyagszükséglet számítások, rétegrendi hőszigetelés becslések, betonacél súlyméretezés és vakolási mennyiség kalkulátorok.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('calculations')}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-primary hover:underline"
              >
                Számítási Modul Megnyitása <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 4: Szakmai Könyvek */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl w-fit">
                <Library size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Szakmai Könyvek &amp; Kiadványok</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Digitalizált építőipari tankönyvek, szabványismertetők, szakkönyvek és letölthető oktatási segédletek gyűjteménye.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('books')}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-primary hover:underline"
              >
                Szakmai Könyvtár Megtekintése <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
