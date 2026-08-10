import { Mail } from 'lucide-react';
import { useSiteSettings } from '../services/siteSettingsService';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const siteSettings = useSiteSettings();
  const logoUrl = siteSettings.logoUrl || '/logo.png';
  return (
    <footer className="bg-primary border-t border-primary-700">
      {/* Newsletter */}
      <div className="bg-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={18} className="text-accent" />
                <span className="text-white font-bold text-lg">Szakmai hírlevél</span>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                Heti frissítések, új cikkek, szakmai tippek és iparági újdonságok közvetlenül az e-mail fiókodba.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  placeholder="email@cimed.hu"
                  className="w-full bg-primary-700 border border-primary-600 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <button className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-bold rounded-lg transition-all whitespace-nowrap">
                Feliratkozás
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
              <img
                src={logoUrl}
                alt={`${siteSettings.siteTitle || 'ÉpítőTudás'} logó`}
                className="h-10 max-h-11 max-w-[200px] w-auto object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </button>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-xs">
              Magyarország legátfogóbb online építőipari tudásbázisa. Szakembereknek és tanulóknak egyaránt.
            </p>
          </div>
          {[
            { title: 'Navigáció', links: [{ l: 'Főoldal', p: 'home' }, { l: 'Tudástár', p: 'tudastar' }, { l: 'Eszközök', p: 'tool' }, { l: 'Pályák', p: 'paths' }, { l: 'Rólunk', p: 'about' }] },
            { title: 'Modulok', links: [{ l: 'Cikkek', p: 'category' }, { l: 'Fogalomtár', p: 'glossary' }, { l: 'Számítások', p: 'calculations' }, { l: 'Eszközválasztó', p: 'valaszto' }, { l: 'Képzések', p: 'courses' }] },
            { title: 'Jogi & Info', links: [{ l: 'Jogi Nyilatkozatok', p: 'jogi' }, { l: 'Impresszum', p: 'impressum' }, { l: 'Adatvédelem', p: 'privacy' }, { l: 'ÁSZF', p: 'terms' }, { l: 'Cookie-kezelés', p: 'cookies' }] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.l}>
                    <button
                      onClick={() => onNavigate(link.p)}
                      className="text-gray-400 hover:text-accent text-sm transition-colors"
                    >
                      {link.l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-700 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            © 2026 ÉpítőTudás. Minden jog fenntartva.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {[
              { label: 'Jogi Központ', page: 'jogi' },
              { label: 'Impresszum', page: 'impressum' },
              { label: 'Adatvédelem', page: 'privacy' },
              { label: 'ÁSZF', page: 'terms' },
              { label: 'Cookie-kezelés', page: 'cookies' },
            ].map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
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
