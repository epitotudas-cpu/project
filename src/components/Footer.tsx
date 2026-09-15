import { useState } from 'react';
import { useSiteSettings, getDynamicImageUrl } from '../services/siteSettingsService';
import { FooterAdBanner } from './ModernAdBanner';
import AndroidInstallCta from './AndroidInstallCta';
import {
  ShieldCheck,
  Mail,
  ChevronRight,
  ChevronDown,
  Target,
  BookOpen,
  Lock,
} from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const siteSettings = useSiteSettings();
  const logoUrl = getDynamicImageUrl(siteSettings.logoUrl, '/logo.png', siteSettings.iconsUpdatedAt);
  
  // Accordion state: null means all collapsed by default on mobile (max 1 open at a time)
  const [openSectionTitle, setOpenSectionTitle] = useState<string | null>(null);

  const toggleSection = (title: string) => {
    setOpenSectionTitle((prev) => (prev === title ? null : title));
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

  // Structured Link Categories for the Footer
  const footerColumns = [
    {
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
    <footer className="bg-[#0B1528] text-white border-t border-white/10 relative z-10 selection:bg-accent selection:text-black">
      {/* Optional Ad Banner in Footer Placement */}
      <FooterAdBanner />

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">
          
          {/* Column 1: Brand & Bio & Direct Contact */}
          <div className="lg:col-span-2 space-y-6">
            <button
              onClick={() => handleNavigate('home')}
              className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            >
              <img
                src={logoUrl}
                alt={`${siteSettings.siteTitle || 'ÉpítőTudás'} logó`}
                width={200}
                height={42}
                decoding="async"
                className="h-10 max-h-12 max-w-[220px] w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </button>

            <p className="text-gray-300 text-xs md:text-sm leading-relaxed max-w-md">
              {siteSettings.footerDescription ||
                'Magyarország legátfogóbb online építőipari tudásbázisa. Szakmai enciklopédia, megbízható útmutatók, kalkulátorok és szerszámkatalógus szakembereknek és tanulóknak egyaránt.'}
            </p>

            {/* Direct Contact Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 max-w-md backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-accent">
                <Mail size={15} /> <span>Hivatalos Elérhetőség</span>
              </div>
              <div className="text-xs text-gray-200 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-gray-300">info@epitotudas.hu</span>
                <button
                  onClick={() => handleNavigate('impressum')}
                  className="text-accent hover:underline text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Impresszum &amp; Cégadatok</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Android App Installation Responsive CTA */}
            <AndroidInstallCta />

            {/* Quality & Trust Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck size={13} /> Hiteles Szakmai Tudásanyag
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-semibold">
                <Lock size={13} /> SSL Védett Platform
              </span>
            </div>
          </div>

          {/* Columns 2, 3, 4: Categorized Navigation Links (Mobile Accordion / Desktop Clean Grid) */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {footerColumns.map((col) => {
              const IconComponent = col.icon;
              const isOpen = openSectionTitle === col.title;
              return (
                <div
                  key={col.title}
                  className="border-b border-white/10 md:border-b-0 pb-3 md:pb-0 transition-all duration-300"
                >
                  {/* Header: Clickable accordion button on mobile and desktop */}
                  <button
                    type="button"
                    onClick={() => toggleSection(col.title)}
                    className="w-full text-left flex items-center justify-between gap-2 py-1 md:py-0 border-b border-white/10 pb-2.5 cursor-pointer group hover:border-accent/40 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComponent size={16} className="text-accent shrink-0" />
                      <h3 className="text-white font-extrabold text-xs md:text-sm tracking-wide group-hover:text-accent transition-colors truncate">
                        {col.title}
                      </h3>
                    </div>
                    {/* Chevron Indicator */}
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? 'rotate-180 text-accent' : 'rotate-0 md:rotate-0'
                      }`}
                    />
                  </button>

                  {/* Collapsible List with smooth CSS Grid height animation */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
                      isOpen
                        ? 'grid-rows-[1fr] opacity-100 mt-3 md:grid-rows-[1fr] md:opacity-100 md:mt-3'
                        : 'grid-rows-[0fr] opacity-0 mt-0 md:grid-rows-[1fr] md:opacity-100 md:mt-3'
                    }`}
                  >
                    <div className="overflow-hidden md:overflow-visible">
                      <ul className="space-y-2.5 pt-1 md:pt-0 pb-1">
                        {col.links.map((link) => (
                          <li key={link.label}>
                            <button
                              onClick={() => handleNavigate(link.page)}
                              className="text-gray-300 hover:text-accent text-xs md:text-sm transition-colors flex items-center gap-1.5 group text-left cursor-pointer"
                            >
                              <ChevronRight
                                size={12}
                                className="text-gray-500 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0"
                              />
                              <span className="group-hover:underline">{link.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar / Copyright */}
        <div className="border-t border-white/10 mt-10 md:mt-12 pt-6 md:pt-8 flex items-center justify-center md:justify-between text-gray-400 text-xs">
          <span>© 2026 ÉpítőTudás v2. Minden jog fenntartva.</span>
        </div>
      </div>
    </footer>
  );
}
