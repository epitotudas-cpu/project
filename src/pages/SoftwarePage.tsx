import { ChevronRight, Clock, Laptop, ArrowRight, CheckCircle2, Wrench, Sparkles, Layers } from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';

interface SoftwarePageProps {
  onNavigate: (page: string) => void;
}

export default function SoftwarePage({ onNavigate }: SoftwarePageProps) {
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
              onClick={() => onNavigate('tool')}
              className="hover:text-white transition-colors"
            >
              Eszközök
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Szoftverek</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
              Digitális Eszközök
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Építőipari Szoftverek &amp; Digitális Alkalmazások
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
              BIM tervezőszoftverek, CAD modellezők, költségvetés-készítő alkalmazások és projektmenedzsment eszközök.
            </p>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Eszközök navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Katalógus',
            page: 'tool',
            icon: <Wrench size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Anyagok',
            page: 'materials',
            icon: <Layers size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Szoftverek',
            page: 'software',
            icon: <Laptop size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Eszközválasztó',
            page: 'valaszto',
            icon: <Sparkles size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Laptop size={32} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              <Clock size={13} /> Hamarosan Elérhető / Szoftver Katalógus
            </span>
            <h2 className="text-2xl font-black text-gray-900">
              Az Építőipari Szoftver Katalógus Előkészítése Folyamatban Van
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Katalógusunk bővítése során teszteljük és értékeljük a legnépszerűbb hazai és nemzetközi építész, statikus, költségvetési és felmérési szoftvereket.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 max-w-2xl mx-auto">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
                BIM &amp; CAD Tervezőszoftverek
              </div>
              <p className="text-xs text-gray-500">ArchiCAD, AutoCAD, Revit és Allplan útmutatók.</p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <CheckCircle2 size={15} className="text-blue-600 shrink-0" />
                Költségvetés-készítő Szoftverek
              </div>
              <p className="text-xs text-gray-500">Tervezői és kivitelezői költségvető programok.</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onNavigate('tool')}
              className="px-5 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              Vissza a Gép &amp; Szerszám Katalógushoz <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
