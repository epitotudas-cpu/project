import { Library, ChevronRight, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

interface BooksPageProps {
  onNavigate: (page: string) => void;
}

export default function BooksPage({ onNavigate }: BooksPageProps) {
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
            <span className="text-gray-200 font-medium">Szakmai Könyvek</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
              Tudástár Könyvtár
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Szakmai Könyvek &amp; Digitális Kiadványok
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
              Szakkönyvek, digitalizált tankönyvek, szabványgyűjtemények és letölthető kivitelezési segédletek.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 md:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-purple-50 border border-purple-200 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Library size={32} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              <Clock size={13} /> Hamarosan Elérhető / Digitális Katalógus
            </span>
            <h2 className="text-2xl font-black text-gray-900">
              A Szakmai Könyvtár Előkészítése Folyamatban Van
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Folyamatosan dolgozunk az építőipari szakkönyvek, tankönyvek és szabványismertető digitális kiadványok jogtisztázott elérésének biztosításán.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4 max-w-2xl mx-auto">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <CheckCircle2 size={15} className="text-purple-600 shrink-0" />
                Műszaki Tankönyvek &amp; Jegyzetek
              </div>
              <p className="text-xs text-gray-500">Szakiskolai és egyetemi digitális tananyagok.</p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                <CheckCircle2 size={15} className="text-purple-600 shrink-0" />
                Építési Szabványismertetők
              </div>
              <p className="text-xs text-gray-500">Eurocode és MSZ előírások érthető összefoglalói.</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onNavigate('category')}
              className="px-5 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              Ugrás a Szakmai Cikkekhez <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
