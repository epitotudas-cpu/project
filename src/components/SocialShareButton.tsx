import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, X, Mail, Image, Sparkles } from 'lucide-react';

interface SocialShareButtonProps {
  title: string;
  excerpt: string;
  imageUrl?: string;
  url?: string;
}

export function updateArticleMetaTags(title: string, description: string, image?: string, url?: string) {
  const currentUrl = url || window.location.href;
  const pageTitle = `${title} | ÉpítőTudás`;

  document.title = pageTitle;

  const setMeta = (property: string, content: string, isName = false) => {
    const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
    let element = document.querySelector(selector) as HTMLMetaElement;
    if (!element) {
      element = document.createElement('meta');
      if (isName) {
        element.setAttribute('name', property);
      } else {
        element.setAttribute('property', property);
      }
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Standard Meta
  setMeta('description', description, true);

  // Open Graph Meta
  setMeta('og:title', pageTitle);
  setMeta('og:description', description);
  setMeta('og:url', currentUrl);
  setMeta('og:type', 'article');
  setMeta('og:site_name', 'ÉpítőTudás');
  if (image) setMeta('og:image', image);

  // Twitter Meta
  setMeta('twitter:card', 'summary_large_image', true);
  setMeta('twitter:title', pageTitle, true);
  setMeta('twitter:description', description, true);
  if (image) setMeta('twitter:image', image, true);
}

export default function SocialShareButton({ title, excerpt, imageUrl, url }: SocialShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInstaModal, setShowInstaModal] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleShareClick = async () => {
    // On mobile devices, try native Web Share API first
    if (typeof navigator !== 'undefined' && navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to dropdown
      }
    }
    setIsOpen(!isOpen);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const sharePlatforms = [
    {
      name: 'Facebook',
      color: 'bg-[#1877F2] text-white hover:brightness-110',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      color: 'bg-[#0A66C2] text-white hover:brightness-110',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'X (Twitter)',
      color: 'bg-black text-white hover:bg-neutral-800',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366] text-white hover:brightness-110',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n\n' + shareUrl)}`,
    },
    {
      name: 'E-mail',
      color: 'bg-[#EA4335] text-white hover:brightness-110',
      icon: <Mail size={18} />,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
        'Olvasd el ezt a szakmai cikket az ÉpítőTudás oldalon:\n\n' + title + '\n\n' + excerpt + '\n\n' + shareUrl
      )}`,
    },
  ];

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Primary Share Button */}
      <button
        onClick={handleShareClick}
        className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-all flex items-center gap-2 text-xs font-extrabold shadow-2xs cursor-pointer"
        title="Cikk megosztása közösségi médián"
      >
        <Share2 size={16} className="text-primary" />
        <span>Megosztás</span>
      </button>

      {/* Floating Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <Share2 size={16} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-gray-900">Cikk Megosztása</h4>
                <p className="text-[11px] text-gray-500">Válassz platformot a megosztáshoz</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Social Platforms Grid */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            {sharePlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-110 ${platform.color}`}
                >
                  {platform.icon}
                </div>
                <span className="text-[10px] font-semibold text-gray-600 group-hover:text-gray-900 text-center leading-tight">
                  {platform.name}
                </span>
              </a>
            ))}
          </div>

          {/* Instagram Story Option */}
          <div className="mb-4">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowInstaModal(true);
              }}
              className="w-full p-2.5 rounded-xl border border-pink-200 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-amber-500/20 text-gray-900 font-bold text-xs flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Image size={14} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                    Instagram Story Kártya
                  </div>
                  <div className="text-[10px] text-gray-500">Márkázott kép & Story matrica link</div>
                </div>
              </div>
              <Sparkles size={14} className="text-pink-500 animate-pulse" />
            </button>
          </div>

          {/* Copy Link Section */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-gray-600 px-2 py-1 w-full focus:outline-none font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-primary text-white hover:bg-primary-hover shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Másolva ✓</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Link másolása</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-600 font-bold mt-1 text-center animate-in fade-in">
                Link sikeresen a vágólapra másolva!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instagram Story Preview & Download Modal */}
      {showInstaModal && (
        <InstagramStoryModal
          title={title}
          excerpt={excerpt}
          imageUrl={imageUrl}
          url={shareUrl}
          onClose={() => setShowInstaModal(false)}
        />
      )}
    </div>
  );
}

function InstagramStoryModal({
  title,
  excerpt,
  imageUrl,
  url,
  onClose,
}: {
  title: string;
  excerpt: string;
  imageUrl?: string;
  url: string;
  onClose: () => void;
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyStoryLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-gray-100 text-gray-900 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 text-pink-600 text-xs font-extrabold rounded-full border border-pink-200">
            <Sparkles size={13} /> Instagram Story Sablon
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">Story Kártya Előnézet</h3>
          <p className="text-xs text-gray-500">Mentsd el a képet és illeszd be a Story matricát!</p>
        </div>

        {/* 9:16 Story Card Mockup */}
        <div className="aspect-[9/16] max-h-80 w-full mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-slate-950 relative flex flex-col justify-between p-4 text-white">
          {/* Background image overlay */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Story Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xs"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary/30 to-slate-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />

          {/* Story Card Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              <div className="w-5 h-5 rounded-full bg-accent text-black font-extrabold text-[10px] flex items-center justify-center">
                É
              </div>
              <span className="text-[11px] font-bold text-white tracking-wide">ÉpítőTudás.hu</span>
            </div>
            <span className="text-[9px] bg-accent/20 border border-accent/40 text-accent font-extrabold px-2 py-0.5 rounded-full uppercase">
              Szakmai Cikk
            </span>
          </div>

          {/* Story Card Content */}
          <div className="relative z-10 space-y-2 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <h4 className="font-extrabold text-sm text-white line-clamp-3 leading-snug">{title}</h4>
            <p className="text-[11px] text-gray-300 line-clamp-2">{excerpt}</p>
          </div>

          {/* Story Card Footer / Sticker Callout */}
          <div className="relative z-10 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-full shadow-lg border border-blue-400">
              🔗 Olvasd el: epitotudas.hu
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleCopyStoryLink}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white shadow-md'
            }`}
          >
            {copiedLink ? (
              <>
                <Check size={16} /> Link másolva Story matricához! ✓
              </>
            ) : (
              <>
                <Copy size={16} /> Link másolása Story matricához
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
