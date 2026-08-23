import { useState } from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import type { BookItem } from '../services/bookService';

interface BookCoverImageProps {
  book: BookItem;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function BookCoverImage({ book, className = '', size = 'md', onClick }: BookCoverImageProps) {
  const [imageError, setImageError] = useState(false);

  // Priority Rule:
  // 1. Generated from preview PDF
  // 2. Manual upload (base64)
  // 3. External coverImageUrl / coverImage
  // 4. Fallback generated cover
  let coverSrc = '';
  const da = book.digitalAccess;

  const generatedUrl = book.generatedCoverImageUrl || da?.generatedCoverImageUrl;
  const uploadUrl = book.coverImageUpload;
  const externalUrl = book.coverImageUrl || book.coverImage;

  if (generatedUrl && generatedUrl.trim()) {
    coverSrc = generatedUrl.trim();
  } else if (uploadUrl && uploadUrl.trim()) {
    coverSrc = uploadUrl.trim();
  } else if (externalUrl && externalUrl.trim()) {
    coverSrc = externalUrl.trim();
  }

  const altText = book.coverImageAlt || `${book.title} borítója`;
  const hasValidImageSrc = coverSrc && coverSrc.trim() && coverSrc !== '#' && !imageError;

  // Sizes
  const sizeClasses = {
    sm: 'w-28 sm:w-32',
    md: 'w-36 sm:w-44 md:w-48',
    lg: 'w-48 sm:w-60 md:w-64',
  };

  return (
    <div
      onClick={onClick}
      className={`relative aspect-[2/3] ${sizeClasses[size]} rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200/80 bg-[#0f172a] group shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {hasValidImageSrc ? (
        <img
          src={coverSrc}
          alt={altText}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        /* GENERATED FALLBACK COVER */
        <div className="w-full h-full p-3 flex flex-col justify-between bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white relative select-none overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 border-2 border-amber-500/20 rounded-xl pointer-events-none" />

          {/* Top Brand & Category Badge */}
          <div className="space-y-1 relative z-10">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-amber-400 border-b border-amber-500/30 pb-1">
              <span className="truncate pr-1">{book.categoryLabel || 'ÉpítőTudás'}</span>
              <BookOpen size={11} className="shrink-0" />
            </div>
          </div>

          {/* Center Book Title & Subtitle */}
          <div className="my-auto space-y-1.5 relative z-10 text-center px-1">
            <h4 className="text-xs sm:text-sm font-black text-white leading-tight line-clamp-3 tracking-tight">
              {book.title}
            </h4>
            {book.subtitle && (
              <p className="text-[10px] text-gray-300 font-medium line-clamp-2 italic">
                {book.subtitle}
              </p>
            )}
          </div>

          {/* Bottom Author & Branding Footer */}
          <div className="pt-2 border-t border-white/10 space-y-1 relative z-10 text-center">
            <p className="text-[10px] font-bold text-amber-300 truncate">
              {book.author}
            </p>
            <div className="flex items-center justify-center gap-1 text-[8px] font-mono text-gray-400 uppercase tracking-widest">
              <ShieldCheck size={9} className="text-amber-400" />
              <span>ÉpítőTudás Kiadvány</span>
            </div>
          </div>
        </div>
      )}

      {/* Book Spine Overlay */}
      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 border border-black/10 rounded-xl pointer-events-none" />
    </div>
  );
}
