import { ArrowLeft, ShieldCheck, Building, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { IMPRESSUM_DATA, LEGAL_METADATA } from '../data/legalDocs';

interface ImpressumPageProps {
  onNavigate: (page: string) => void;
}

export default function ImpressumPage({ onNavigate }: ImpressumPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1E1E1E] bg-[#111] hover:bg-[#1A1A1A] text-gray-400 hover:text-white text-xs font-medium transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Vissza a főoldalra
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1E1E1E] pb-6 gap-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Building className="text-accent" size={30} />
                {IMPRESSUM_DATA.title}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                A szolgáltató hivatalos adatai és elérhetőségei
              </p>
            </div>
            <div className="text-right text-xs text-gray-500 bg-[#111] border border-[#1E1E1E] p-3 rounded-lg">
              <div>Hatályos: <span className="text-gray-300 font-medium">{IMPRESSUM_DATA.lastUpdated}</span></div>
              <div>Verzió: <span className="text-accent font-semibold">{IMPRESSUM_DATA.version}</span></div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1: Szolgáltató adatai */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#1E1E1E] pb-3">
              <ShieldCheck className="text-accent" size={20} />
              {IMPRESSUM_DATA.sections[0].heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {IMPRESSUM_DATA.sections[0].details?.map((item, idx) => (
                <div key={idx} className="bg-[#161616] p-3.5 rounded-lg border border-[#222]">
                  <span className="text-gray-500 text-xs block mb-1">{item.label}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Tárhelyszolgáltató */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#1E1E1E] pb-3">
              <Globe className="text-accent" size={20} />
              {IMPRESSUM_DATA.sections[1].heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {IMPRESSUM_DATA.sections[1].details?.map((item, idx) => (
                <div key={idx} className="bg-[#161616] p-3.5 rounded-lg border border-[#222]">
                  <span className="text-gray-500 text-xs block mb-1">{item.label}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Szerzői jogok */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-white border-b border-[#1E1E1E] pb-3">
              {IMPRESSUM_DATA.sections[2].heading}
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {IMPRESSUM_DATA.sections[2].content}
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#161616] border border-[#222] p-4 rounded-xl flex items-center gap-3">
              <Mail className="text-accent flex-shrink-0" size={20} />
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm font-medium text-white">{LEGAL_METADATA.company.email}</div>
              </div>
            </div>
            <div className="bg-[#161616] border border-[#222] p-4 rounded-xl flex items-center gap-3">
              <Phone className="text-accent flex-shrink-0" size={20} />
              <div>
                <div className="text-xs text-gray-500">Telefon</div>
                <div className="text-sm font-medium text-white">{LEGAL_METADATA.company.phone}</div>
              </div>
            </div>
            <div className="bg-[#161616] border border-[#222] p-4 rounded-xl flex items-center gap-3">
              <MapPin className="text-accent flex-shrink-0" size={20} />
              <div>
                <div className="text-xs text-gray-500">Székhely</div>
                <div className="text-xs font-medium text-white truncate">{LEGAL_METADATA.company.address}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
