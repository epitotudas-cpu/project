import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { PRIVACY_POLICY_DATA } from '../data/legalDocs';

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void;
}

export default function PrivacyPolicyPage({ onNavigate }: PrivacyPolicyPageProps) {
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
                <Shield className="text-accent" size={30} />
                {PRIVACY_POLICY_DATA.title}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                A személyes adatok kezelésének és védelmének szabályzata (EU GDPR)
              </p>
            </div>
            <div className="text-right text-xs text-gray-500 bg-[#111] border border-[#1E1E1E] p-3 rounded-lg">
              <div>Hatályos: <span className="text-gray-300 font-medium">{PRIVACY_POLICY_DATA.lastUpdated}</span></div>
              <div>Verzió: <span className="text-accent font-semibold">{PRIVACY_POLICY_DATA.version}</span></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {PRIVACY_POLICY_DATA.sections.map((sec, idx) => (
            <div key={idx} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-6 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-[#1E1E1E] pb-3">
                {sec.title}
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                {sec.text}
              </p>
              {sec.list && (
                <ul className="space-y-2 mt-3 pl-2">
                  {sec.list.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
