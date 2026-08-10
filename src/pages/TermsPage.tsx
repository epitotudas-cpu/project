import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { TERMS_DATA } from '../data/legalDocs';

interface TermsPageProps {
  onNavigate: (page: string) => void;
}

export default function TermsPage({ onNavigate }: TermsPageProps) {
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
              onClick={() => onNavigate('jogi')}
              className="hover:text-white transition-colors"
            >
              Jogi Információk
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Általános Szerződési Feltételek</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
                ÁSZF &amp; Szabályzat
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <FileText className="text-accent" size={32} />
                {TERMS_DATA.title}
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Az ÉpítőTudás platform használati feltételei, felhasználói jogok és felelősségvállalás.
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-gray-300 bg-primary-800/80 border border-primary-700 p-3.5 rounded-xl shrink-0">
              <div>Hatályos: <span className="text-white font-bold">{TERMS_DATA.lastUpdated}</span></div>
              <div>Verzió: <span className="text-accent font-extrabold">{TERMS_DATA.version}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft size={14} />
          Vissza a főoldalra
        </button>

        <div className="space-y-6">
          {TERMS_DATA.sections.map((sec, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
              <h2 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                {sec.title}
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">
                {sec.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
