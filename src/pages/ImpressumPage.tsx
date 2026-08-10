import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Building, Mail, Phone, MapPin, Globe, ChevronRight, Target, BookOpen, FileText, Building2 } from 'lucide-react';
import { getImpressumData, type ImpressumData } from '../services/impressumService';
import SectionSubNav from '../components/SectionSubNav';

interface ImpressumPageProps {
  onNavigate: (page: string) => void;
}

export default function ImpressumPage({ onNavigate }: ImpressumPageProps) {
  const [data, setData] = useState<ImpressumData>(() => getImpressumData());

  useEffect(() => {
    function handleDataChange() {
      setData(getImpressumData());
    }
    window.addEventListener('impressum-data-changed', handleDataChange);
    return () => window.removeEventListener('impressum-data-changed', handleDataChange);
  }, []);

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
            <span className="text-gray-200 font-medium">Impresszum &amp; Kapcsolat</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-semibold text-xs rounded-full">
                Hivatalos Adatok
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Building className="text-accent" size={32} />
                Impresszum
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Az ÉpítőTudás platform üzemeltetőjének hivatalos cégadatai, tárhelyszolgáltatója és elérhetőségei.
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-gray-300 bg-primary-800/80 border border-primary-700 p-3.5 rounded-xl shrink-0">
              <div>Hatályos: <span className="text-white font-bold">{data.effectiveDate}</span></div>
              <div>Verzió: <span className="text-accent font-extrabold">{data.version}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Rólunk navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Célunk',
            page: 'about',
            icon: <Target size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'ÉpítőTudás',
            page: 'about',
            icon: <Globe size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Partnerek',
            page: 'partners',
            icon: <Building2 size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Ajánlott források',
            page: 'about',
            icon: <BookOpen size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Kapcsolat & Impresszum',
            page: 'impressum',
            icon: <FileText size={14} className="text-accent" />,
            active: true,
          },
        ]}
      />

      {/* Main Content Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft size={14} />
          Vissza a főoldalra
        </button>

        {/* Section 1: Szolgáltató adatai */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <ShieldCheck className="text-accent" size={22} />
            1. Szolgáltató adatai
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Hivatalos név</span>
              <span className="text-gray-900 font-bold text-sm">{data.companyName}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Cégjegyzékszám</span>
              <span className="text-gray-900 font-bold text-sm">{data.regNumber}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Adószám</span>
              <span className="text-gray-900 font-bold text-sm">{data.taxNumber}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Székhely</span>
              <span className="text-gray-900 font-bold text-sm">{data.address}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Központi email</span>
              <span className="text-gray-900 font-bold text-sm">{data.email}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Telefonszám</span>
              <span className="text-gray-900 font-bold text-sm">{data.phone}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Tárhelyszolgáltató */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <Globe className="text-accent" size={22} />
            2. Tárhelyszolgáltató adatai
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Név</span>
              <span className="text-gray-900 font-bold text-sm">{data.hostingName}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Cím</span>
              <span className="text-gray-900 font-bold text-sm">{data.hostingAddress}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-1">Weboldal</span>
              <a href={data.hostingWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold text-sm truncate block">
                {data.hostingWebsite}
              </a>
            </div>
          </div>
        </div>

        {/* Section 3: Szerzői jogok */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h2 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-4">
            {data.copyrightHeading}
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {data.copyrightContent}
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl">
              <Mail size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold">Email Elérhetőség</div>
              <div className="text-sm font-extrabold text-gray-900">{data.email}</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl">
              <Phone size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold">Telefonos Ügyfélszolgálat</div>
              <div className="text-sm font-extrabold text-gray-900">{data.phone}</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
              <MapPin size={20} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold">Székhely</div>
              <div className="text-xs font-extrabold text-gray-900 truncate">{data.address}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
