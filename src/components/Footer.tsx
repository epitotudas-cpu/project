import { useSiteSettings, getDynamicImageUrl } from '../services/siteSettingsService';
import { useNavigationItems, getStructuredNav } from '../services/navigationService';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const siteSettings = useSiteSettings();
  const rawNavItems = useNavigationItems();
  const structuredNav = getStructuredNav(rawNavItems, false);
  const logoUrl = getDynamicImageUrl(siteSettings.logoUrl, '/logo.png', siteSettings.iconsUpdatedAt);

  const mainNavLinks = structuredNav.map((item) => ({ l: item.label, p: item.page }));
  const subNavLinks = structuredNav
    .flatMap((item) => item.subItems)
    .slice(0, 6)
    .map((sub) => ({ l: sub.label, p: sub.page }));

  return (
    <footer className="bg-primary border-t border-primary-700">

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
              <img
                src={logoUrl}
                alt={`${siteSettings.siteTitle || 'ÉpítőTudás'} logó`}
                width={200}
                height={40}
                decoding="async"
                className="h-10 max-h-11 max-w-[200px] w-auto object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </button>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed max-w-xs">
              {siteSettings.footerDescription || 'Magyarország legátfogóbb online építőipari tudásbázisa. Szakembereknek és tanulóknak egyaránt.'}
            </p>
          </div>
          {[
            { title: 'Navigáció', links: mainNavLinks },
            { title: 'Kiemelt Modulok', links: subNavLinks },
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
