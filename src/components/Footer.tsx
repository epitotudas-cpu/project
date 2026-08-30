import { useSiteSettings, getDynamicImageUrl } from '../services/siteSettingsService';
import { FooterAdBanner } from './ModernAdBanner';
import {
  ShieldCheck,
  Mail,
  ChevronRight,
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
        { label: 'Szakmai Cikkek & Kategóriák', page: 'category' },
        { label: 'Építőipari Fogalomtár', page: 'glossary' },
        { label: 'Eszköz Enciklopédia', page: 'tool' },
        { label: 'Szoftverkatalógus', page: 'software' },
        { label: 'Kalkulátorok & Számítások', page: 'calculations' },
        { label: 'Szakmai Könyvek', page: 'books' },
      ],
    },
    {
      title: 'Rólunk & Küldetésünk',
      icon: Target,
      links: [
        { label: 'Bemutatkozás (Rólunk)', page: 'about' },
        { label: 'Célunk & Küldetésünk', page: 'about#celunk' },
        { label: 'ÉpítőTudás Modulok', page: 'about#platform' },
        { label: 'Partnerek & Támogatók', page: 'partners' },
        { label: 'Ajánlott Források', page: 'about#forrasok' },
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          
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

          {/* Columns 2, 3, 4: Categorized Navigation Links */}
          {footerColumns.map((col) => {
            const IconComponent = col.icon;
            return (
              <div key={col.title} className="space-y-4">
                <h3 className="text-white font-extrabold text-sm tracking-wide flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <IconComponent size={16} className="text-accent shrink-0" />
                  <span>{col.title}</span>
                </h3>
                <ul className="space-y-2.5">
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
            );
          })}
        </div>

        {/* Bottom Bar / Copyright & Legal Quick Links */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs text-center md:text-left">
            <span>© 2026 ÉpítőTudás v2. Minden jog fenntartva.</span>
          </div>

          {/* Quick Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            {[
              { label: 'Jogi Nyilatkozatok', page: 'jogi' },
              { label: 'Impresszum', page: 'impressum' },
              { label: 'Adatvédelem', page: 'privacy' },
              { label: 'ÁSZF', page: 'terms' },
              { label: 'Cookie-kezelés', page: 'cookies' },
            ].map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavigate(item.page)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
