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
  ExternalLink,
} from 'lucide-react';
import type { GlossaryTermFromJson } from '../lib/glossaryJsonService';
import { getVideoUrls } from '../lib/glossaryJsonService';

export function getEmbedVideoUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const cleanUrl = url.trim();

  // YouTube URL-ek átalakítása beágyazható https://www.youtube.com/embed/VIDEO_ID formátumra
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo URL-ek átalakítása https://player.vimeo.com/video/VIDEO_ID formátumra
  const vimeoMatch = cleanUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return cleanUrl;
}

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
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  if (!isOpen || !term) return null;

  const slides = term.slides || [];
  const imageGallery = term.image_urls || [];
  const videoUrls = getVideoUrls(term);
  const translations = term.translations || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-gray-900 relative">
        {/* Modal Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold bg-primary/10 border border-primary/20 text-primary-900 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles size={13} className="text-primary" /> Szakmai Adatlap
              </span>
              {term.category && (
                <span className="text-xs font-semibold bg-gray-200/80 text-gray-800 px-3 py-1 rounded-full">
                  {term.category}
                </span>
              )}
              {term.szint && (
                <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                  {term.szint}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-gray-900">{term.term}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-200/60 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-gray-100/80 border-b border-gray-200 px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'details'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
            }`}
          >
            <BookOpen size={15} /> Részletes Leírás
          </button>

          {slides.length > 0 && (
            <button
              onClick={() => setActiveTab('slides')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'slides'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
              }`}
            >
              <Presentation size={15} /> Prezentáció ({slides.length})
            </button>
          )}

          {videoUrls.length > 0 && (
            <button
              onClick={() => setActiveTab('video')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'video'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
              }`}
            >
              <Video size={15} /> Oktatóvideók ({videoUrls.length})
            </button>
          )}

          {imageGallery.length > 0 && (
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'gallery'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
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
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
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
              {/* Definition Summary Box */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Rövid Meghatározás:
                </h4>
                <p className="text-gray-900 text-sm leading-relaxed">{term.definition}</p>
              </div>

              {/* Detailed Description */}
              {term.detailed_description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" /> Részletes Műszaki Magyarázat
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {term.detailed_description}
                  </div>
                </div>
              )}

              {/* Practical Applications */}
              {term.practical_applications && (
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Gyakorlati Alkalmazás & Technológia
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-gray-700 text-sm leading-relaxed">
                    {term.practical_applications}
                  </div>
                </div>
              )}

              {/* Common Mistakes */}
              {term.common_mistakes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-600" /> Gyakori Kivitelezési Hibák & Megelőzés
                  </h4>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-950 text-sm leading-relaxed">
                    {term.common_mistakes}
                  </div>
                </div>
              )}

              {/* Jargon / Usage Example */}
              {term.usage_example && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-1">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Építkezési Példamondat / Használat:
                  </h4>
                  <p className="text-gray-900 text-sm italic font-medium">"{term.usage_example}"</p>
                  {term.origin_note && (
                    <p className="text-xs text-amber-900 pt-1 border-t border-amber-200/80 mt-2">
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
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6 relative shadow-xs">
                <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-200 pb-3">
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <Layers size={15} /> Slide {currentSlideIndex + 1} / {slides.length}
                  </span>
                  <span>{slides[currentSlideIndex].title}</span>
                </div>

                <div className="space-y-4 min-h-[160px]">
                  <h3 className="text-xl font-bold text-gray-900">
                    {slides[currentSlideIndex].title}
                  </h3>
                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {slides[currentSlideIndex].content}
                  </p>
                </div>

                {/* Slide Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <ChevronLeft size={16} /> Előző dia
                  </button>

                  <div className="flex items-center gap-1.5">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          currentSlideIndex === idx ? 'bg-primary w-6' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === slides.length - 1}
                    className="px-4 py-2 bg-primary hover:bg-primary-800 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    Következő dia <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Oktatóvideók */}
          {activeTab === 'video' && videoUrls.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Video size={16} className="text-red-600" /> Szakmai Oktatóvideó{videoUrls.length > 1 ? `k (${videoUrls.length})` : ''}
                </h4>
                <a
                  href={videoUrls[activeVideoIndex] || videoUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
                >
                  Aktív videó megnyitása új lapon <ExternalLink size={13} />
                </a>
              </div>

              {videoUrls.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {videoUrls.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveVideoIndex(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        activeVideoIndex === idx
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      <Video size={13} /> Videó #{idx + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 shadow-md">
                <iframe
                  key={activeVideoIndex}
                  src={getEmbedVideoUrl(videoUrls[activeVideoIndex] || videoUrls[0]) || (videoUrls[activeVideoIndex] || videoUrls[0])}
                  title={`${term.term} - Videó ${activeVideoIndex + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Képgaléria */}
          {activeTab === 'gallery' && imageGallery.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <ImageIcon size={16} className="text-primary" /> Képek & Ábrák ({imageGallery.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imageGallery.map((url, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-xs">
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
              <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Globe size={16} className="text-primary" /> Nemzetközi Szakszótár Megfeleltetések
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {translations.en && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-bold text-blue-700">🇬🇧 Angol (EN)</span>
                    <p className="text-sm font-bold text-gray-900">{translations.en}</p>
                  </div>
                )}
                {translations.de && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-bold text-amber-800">🇩🇪 Német (DE)</span>
                    <p className="text-sm font-bold text-gray-900">{translations.de}</p>
                  </div>
                )}
                {translations.ro && (
                  <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 space-y-1">
                    <span className="text-xs font-bold text-red-700">🇷🇴 Román (RO)</span>
                    <p className="text-sm font-bold text-gray-900">{translations.ro}</p>
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
