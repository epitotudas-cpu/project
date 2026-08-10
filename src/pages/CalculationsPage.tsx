import { Calculator, ChevronRight, Clock, CheckCircle2, ArrowRight, FileText, BookOpen, Library } from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';

interface CalculationsPageProps {
  onNavigate: (page: string) => void;
}

export default function CalculationsPage({ onNavigate }: CalculationsPageProps) {
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
            <button
              onClick={() => onNavigate('tudastar')}
              className="hover:text-white transition-colors"
            >
              Tudástár
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Számítások</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
              Tudástár Module
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Építőipari Számítások &amp; Kalkulátorok
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
              Interaktív anyagszükséglet-számítások, hőszigetelési rétegrend kalkulátorok és épületszerkezeti méretezési segédletek.
            </p>
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
            active: true,
          },
          {
            label: 'Szakmai könyvek',
            page: 'books',
            icon: <Library size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Calculator size={32} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              <Clock size={13} /> Hamarosan Elérhető / Fejlesztés Alatt
            </span>
            <h2 className="text-2xl font-black text-gray-900">
              Az ÉpítőTudás Számítási Modulja Fejlesztés Alatt Áll
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Mérnöki csapatunk gőzerővel dolgozik a precíz, szabványos magyar építőipari kalkulátorok tesztelésén.
            </p>
          </div>

          {/* Upcoming Calculators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 max-w-2xl mx-auto">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                Falazat &amp; Habarcs Anyagszükséglet
              </div>
              <p className="text-xs text-gray-500">Tégla és habarcsigény pontos kiszámítása m² alapján.</p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                Hőszigetelés Vastagság Becslés
              </div>
              <p className="text-xs text-gray-500">EPS, kőzetgyapot és XPS rétegrend méretező.</p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                Betonacél Súly- &amp; Hosszszámítás
              </div>
              <p className="text-xs text-gray-500">Armatúra és vasalás tömegkalkulátor átmérő alapján.</p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                Vakolat &amp; Aljzatkiegyenlítő Igény
              </div>
              <p className="text-xs text-gray-500">Zsákos anyagok számszerűsítése felületre mérve.</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onNavigate('glossary')}
              className="px-5 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              Böngészés a Fogalomtárban <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
