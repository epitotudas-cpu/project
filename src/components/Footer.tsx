import { useState } from 'react';
import { useSiteSettings, getDynamicImageUrl } from '../services/siteSettingsService';
import { FooterAdBanner } from './ModernAdBanner';
import {
  ShieldCheck,
  Mail,
  ChevronRight,
  ChevronDown,
  Target,
  BookOpen,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const siteSettings = useSiteSettings();
  const logoUrl = getDynamicImageUrl(siteSettings.logoUrl, '/logo.png', siteSettings.iconsUpdatedAt);
  
  // Accordion state: null means all 3 blocks are closed by default (max 1 open at a time)
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSectionId((prev) => (prev === id ? null : id));
  };

  const handleNavigate = (pageWithHash: string) => {
    if (pageWithHash.includes('#')) {
      const [targetPage, hash] = pageWithHash.split('#');
      onNavigate(targetPage);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      onNavigate(pageWithHash);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Structured Link Categories with unique IDs
  const footerColumns = [
    {
      id: 'tudasbazis',
      title: 'Tudásbázis & Modulok',
      icon: BookOpen,
      links: [
        { label: 'Főoldal & Áttekintés', page: 'home' },
        { label: 'Munkavédelem Tudásbázis', page: 'safety' },
        { label: 'Szabályok, Szabványok', page: 'standards' },
        { label: 'Szakmai Cikkek & Kategóriák', page: 'category' },
        { label: 'Építőipari Fogalomtár', page: 'glossary' },
        { label: 'Eszköz Enciklopédia', page: 'tool' },
        { label: 'Építőipari Anyagkatalógus', page: 'materials' },
        { label: 'Szoftverkatalógus', page: 'software' },
        { label: 'Kalkulátorok & Számítások', page: 'calculations' },
        { label: 'Szakmai Könyvek', page: 'books' },
      ],
    },
    {
      id: 'rolunk',
      title: 'Rólunk & Küldetésünk',
      icon: Target,
      links: [
        { label: 'Rólunk', page: 'about' },
        { label: 'Partnerek & Támogatók', page: 'partners' },
        { label: 'Oktatás & Kurzusok', page: 'courses' },
        { label: 'Pályák & Karrier', page: 'careers' },
        { label: 'Partneri Jelentkezés', page: 'partner-application' },
      ],
    },
    {
      id: 'jogi',
      title: 'Jogi Nyilatkozatok & Info',
      icon: ShieldCheck,
      links: [
        { label: 'Kapcsolat & Impresszum', page: 'impressum' },
        { label: 'Jogi Központ', page: 'jogi' },
        { label: 'Adatvédelmi Tájékoztató', page: 'privacy' },
        { label: 'Általános Szerződési Feltételek', page: 'terms' },
        { label: 'Cookie-kezelési Tájékoztató', page: 'cookies' },
      ],
    },
  ];

  return (
    <footer className="bg-[#0B1528] text-white border-t border-white/10 relative z-20 py-6 selection:bg-accent selection:text-black">
      {/* Optional Ad Banner in Footer Placement */}
      <FooterAdBanner />

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-6">
        
        {/* Brand Info & Contact Header Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 min-w-0">
            <button
              onClick={() => handleNavigate('home')}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
            >
              <img
                src={logoUrl}
                alt={`${siteSettings.siteTitle || 'ÉpítőTudás'} logó`}
                width={150}
                height={32}
                decoding="async"
                className="h-7 max-h-8 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </button>

            <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
              {siteSettings.footerDescription || 'Magyarország legátfogóbb online építőipari tudásbázisa. Szakembereknek, diákoknak és vállalkozóknak.'}
            </p>
          </div>

          <a
            href="mailto:info@epitotudas.hu"
            className="font-mono text-accent hover:text-white inline-flex items-center gap-2 font-semibold shrink-0 text-xs bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/50"
          >
            <Mail size={14} className="text-accent" />
            <span>info@epitotudas.hu</span>
          </a>
        </div>

        {/* 3 Clickable Accordion Header Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {footerColumns.map((col) => {
            const IconComponent = col.icon;
            const isOpen = openSectionId === col.id;
            const buttonId = `footer-btn-${col.id}`;
            const panelId = `footer-panel-${col.id}`;

            return (
              <div key={col.id} className="w-full">
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => toggleSection(col.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className={`w-full flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl border transition-all cursor-pointer select-none group focus:outline-none focus:ring-1 focus:ring-accent/50 text-xs font-bold text-white ${
                    isOpen
                      ? 'bg-white/10 border-accent/60 ring-1 ring-accent/40'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconComponent size={15} className="text-accent shrink-0" />
                    <span className="truncate group-hover:text-accent transition-colors">{col.title}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-accent' : 'rotate-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Collapsible Link Panels: Hidden when closed */}
        {footerColumns.map((col) => {
          const isOpen = openSectionId === col.id;
          const buttonId = `footer-btn-${col.id}`;
          const panelId = `footer-panel-${col.id}`;

          if (!isOpen) return null;

          return (
            <div
              key={col.id}
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-fade-in transition-all duration-200"
            >
              <div className="flex items-center gap-2 text-xs font-extrabold text-accent border-b border-white/10 pb-2 mb-3">
                <col.icon size={15} />
                <span>{col.title}</span>
              </div>
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(link.page)}
                      className="text-gray-300 hover:text-accent transition-colors flex items-center gap-1.5 group text-left cursor-pointer w-full py-1 text-[11px] sm:text-xs"
                    >
                      <ChevronRight
                        size={12}
                        className="text-accent/60 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0"
                      />
                      <span className="group-hover:underline font-medium truncate">{link.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Bottom Bar / Copyright */}
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-gray-400">
          <div>
            © 2026 ÉpítőTudás ·{' '}
            <button
              onClick={() => handleNavigate('impressum')}
              className="hover:text-accent hover:underline cursor-pointer font-medium"
            >
              Impresszum
            </button>{' '}
            ·{' '}
            <button
              onClick={() => handleNavigate('privacy')}
              className="hover:text-accent hover:underline cursor-pointer font-medium"
            >
              Adatvédelem
            </button>
          </div>

          <div className="text-[10px] text-gray-500 font-mono">
            v2.0 • Minden jog fenntartva.
          </div>
        </div>

      </div>
    </footer>
  );
}
