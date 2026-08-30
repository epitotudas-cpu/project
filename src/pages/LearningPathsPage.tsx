import { useEffect } from 'react';
import {
  Compass,
  ChevronRight,
  Layers,
  HardHat,
  GraduationCap,
  Briefcase,
  ArrowRight,
} from 'lucide-react';
import SectionSubNav from '../components/SectionSubNav';
import { LEARNING_PATHS_DATA, type LearningPathItem } from '../data/learningPathsData';

interface LearningPathsPageProps {
  onNavigate: (page: string, params?: { slug?: string; quizId?: string }) => void;
}

export default function LearningPathsPage({ onNavigate }: LearningPathsPageProps) {
  useEffect(() => {
    document.title = 'Tanulási Útvonalak & Karrierlépcsők | ÉpítőTudás';
  }, []);

  const handleStartPath = (path: LearningPathItem) => {
    if (path.courseIds.length > 0) {
      onNavigate('course-detail', { slug: path.courseIds[0] });
    } else {
      onNavigate('courses');
    }
  };

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => onNavigate('paths')}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              Pályák &amp; Képzések
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Tanulási Útvonalak &amp; Karrierlépcsők</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full uppercase tracking-wider">
                <Compass size={14} /> STRUKTURÁLT FEJLŐDÉS
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Tanulási Útvonalak &amp; Karrierlépcsők
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Kapcsold össze a szakmákat, képzéseket és a következő karrierlépést a sikeres előrelépésért.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('courses')}
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-primary text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <GraduationCap size={16} /> Képzések &amp; Kurzusok
              </button>
              <button
                onClick={() => onNavigate('careers')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
              >
                <Briefcase size={16} /> Állásajánlatok
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Ribbon Bar */}
      <SectionSubNav
        ariaLabel="Pályák navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Építőipari szakmák',
            page: 'paths',
            icon: <HardHat size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Tanulási Útvonalak & Karrierlépcsők',
            page: 'learning-paths',
            icon: <Layers size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Képzések & Kurzusok',
            page: 'courses',
            icon: <GraduationCap size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Karrier & Állások',
            page: 'careers',
            icon: <Briefcase size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {LEARNING_PATHS_DATA.map((path) => (
            <div
              key={path.id}
              className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 space-y-5 flex flex-col justify-between hover:shadow-lg hover:border-gray-300 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-xl border ${path.badgeColor}`}>
                    {path.tradeName}
                  </span>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-xl">
                    {path.level}
                  </span>
                </div>

                <h2 className="text-lg md:text-xl font-extrabold text-gray-900 leading-snug">
                  {path.title}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {path.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <div className="bg-primary/5 border border-primary/10 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-gray-600 font-semibold">Következő karrierlépés:</span>
                  <span className="font-extrabold text-primary flex items-center gap-1.5">
                    {path.nextCareerStep} <ArrowRight size={14} />
                  </span>
                </div>

                <button
                  onClick={() => handleStartPath(path)}
                  className="w-full py-3 bg-primary hover:bg-primary-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Útvonal elkezdése</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
