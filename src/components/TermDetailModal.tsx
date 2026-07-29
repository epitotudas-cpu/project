import { useState } from 'react';
import {
  X,
  BookOpen,
  Presentation,
  Video,
  Image as ImageIcon,
  Globe,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { GlossaryTermFromJson } from '../lib/glossaryJsonService';

interface TermDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  term: GlossaryTermFromJson | null;
}

export default function TermDetailModal({
  isOpen,
  onClose,
  term,
}: TermDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'slides' | 'video' | 'gallery' | 'dictionary'>('details');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  if (!isOpen || !term) return null;

  const slides = term.slides || [];
  const imageGallery = term.image_urls || [];
  const videoUrl = term.video_url;
  const translations = term.translations || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F1420] border border-[#232F47] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white relative">
        {/* Modal Header */}
        <div className="bg-[#141B2D] border-b border-[#232F47] p-6 flex items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold bg-accent/20 border border-accent/30 text-accent px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles size={13} /> Prémium Szakmai Adatlap
              </span>
              {term.category && (
                <span className="text-xs font-semibold bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                  {term.category}
                </span>
              )}
              {term.szint && (
                <span className="text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full">
                  {term.szint}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white">{term.term}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-[#111726] border-b border-[#232F47] px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-accent text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen size={15} /> Részletes Leírás
          </button>

          {slides.length > 0 && (
            <button
              onClick={() => setActiveTab('slides')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'slides'
                  ? 'bg-accent text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Presentation size={15} /> Prezentáció ({slides.length})
            </button>
          )}

          {videoUrl && (
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'video'
                  ? 'bg-accent text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Video size={15} /> Oktatóvideó
            </button>
          )}

          {imageGallery.length > 0 && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'bg-accent text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ImageIcon size={15} /> Képgaléria ({imageGallery.length})
            </button>
          )}

          {Object.keys(translations).length > 0 && (
            <button
              onClick={() => setActiveTab('dictionary')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'dictionary'
                  ? 'bg-accent text-black shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe size={15} /> Szakszótár
            </button>
          )}
        </div>

        {/* Modal Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Részletes Leírás */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Definiton Summary Box */}
              <div className="bg-[#182238] border border-[#2B3B5C] rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider">
                  Rövid Meghatározás:
                </h4>
                <p className="text-gray-200 text-sm leading-relaxed">{term.definition}</p>
              </div>

              {/* Detailed Description */}
              {term.detailed_description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-accent" /> Részletes Műszaki Magyarázat
                  </h4>
                  <div className="bg-[#141B2D] border border-[#232F47] rounded-2xl p-5 text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {term.detailed_description}
                  </div>
                </div>
              )}

              {/* Practical Applications */}
              {term.practical_applications && (
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-400" /> Gyakorlati Alkalmazás & Technológia
                  </h4>
                  <div className="bg-[#141B2D] border border-[#232F47] rounded-2xl p-5 text-gray-300 text-sm leading-relaxed">
                    {term.practical_applications}
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {term.common_mistakes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" /> Gyakori Kivitelezési Hibák & Megelőzés
                  </h4>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-amber-200 text-sm leading-relaxed">
                    {term.common_mistakes}
                  </div>
                </div>
              )}

              {/* Jargon / Usage Example */}
              {term.usage_example && (
                <div className="bg-[#161F33] border border-[#232F47] rounded-2xl p-5 space-y-1">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Építkezési Példamondat / Használat:
                  </h4>
                  <p className="text-gray-200 text-sm italic font-medium">"{term.usage_example}"</p>
                  {term.origin_note && (
                    <p className="text-xs text-gray-400 pt-1 border-t border-[#232F47] mt-2">
                      💡 {term.origin_note}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Prezentációs Slide-ok */}
          {activeTab === 'slides' && slides.length > 0 && (
            <div className="space-y-6">
              <div className="bg-[#141B2D] border border-[#232F47] rounded-3xl p-6 sm:p-8 space-y-6 relative">
                <div className="flex items-center justify-between text-xs text-gray-400 border-b border-[#232F47] pb-3">
                  <span className="font-bold text-accent flex items-center gap-1.5">
                    <Layers size={15} /> Slide {currentSlideIndex + 1} / {slides.length}
                  </span>
                  <span>{slides[currentSlideIndex].title}</span>
                </div>

                <div className="space-y-4 min-h-[160px]">
                  <h3 className="text-xl font-bold text-white">
                    {slides[currentSlideIndex].title}
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {slides[currentSlideIndex].content}
                  </p>
                </div>

                {/* Slide Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-[#232F47]">
                  <button
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    className="px-4 py-2 bg-[#1C263B] hover:bg-[#283754] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} /> Előző dia
                  </button>

                  <div className="flex items-center gap-1.5">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          currentSlideIndex === idx ? 'bg-accent w-6' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === slides.length - 1}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-black disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    Következő dia <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Oktatóvideó */}
          {activeTab === 'video' && videoUrl && (
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Video size={16} className="text-red-400" /> Beágyazott Szakmai Oktatóvideó
              </h4>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#232F47] bg-black">
                <iframe
                  src={videoUrl}
                  title={term.term}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Képgaléria */}
          {activeTab === 'gallery' && imageGallery.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <ImageIcon size={16} className="text-accent" /> Képek & Ábrák ({imageGallery.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imageGallery.map((url, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-[#232F47] bg-[#141B2D]">
                    <img
                      src={url}
                      alt={`${term.term} illusztráció ${idx + 1}`}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Többnyelvű Szakszótár */}
          {activeTab === 'dictionary' && (
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Globe size={16} className="text-accent" /> Nemzetközi Szakszótár Megfeleltetések
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {translations.en && (
                  <div className="bg-[#141B2D] border border-[#232F47] rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-bold text-blue-400">🇬🇧 Angol (EN)</span>
                    <p className="text-sm font-bold text-white">{translations.en}</p>
                  </div>
                )}
                {translations.de && (
                  <div className="bg-[#141B2D] border border-[#232F47] rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-bold text-amber-400">🇩🇪 Német (DE)</span>
                    <p className="text-sm font-bold text-white">{translations.de}</p>
                  </div>
                )}
                {translations.ro && (
                  <div className="bg-[#141B2D] border border-[#232F47] rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-bold text-red-400">🇷🇴 Román (RO)</span>
                    <p className="text-sm font-bold text-white">{translations.ro}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
