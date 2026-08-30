import { LogOut, Menu } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import type { AdminView } from './AdminSidebar';
import { useSiteSettings, adjustColorBrightness, getDynamicImageUrl } from '../services/siteSettingsService';

interface AdminHeaderProps {
  userEmail: string | null;
  role: string;
  onSignOut: () => void;
  onNavigateView: (view: AdminView, searchQuery?: string) => void;
  onOpenSidebar: () => void;
}

export default function AdminHeader({
  userEmail,
  role,
  onSignOut,
  onNavigateView,
  onOpenSidebar,
}: AdminHeaderProps) {
  const siteSettings = useSiteSettings();
  const logoUrl = getDynamicImageUrl(siteSettings.logoUrl, '/logo.png', siteSettings.iconsUpdatedAt);
  const adminBg = siteSettings.adminBgColor || '#0A0A0A';

  const headerBg = `${adjustColorBrightness(adminBg, 2)}F0`;
  const borderColor = adjustColorBrightness(adminBg, 12);

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Adminisztrátor',
    editor: 'Szerkesztő',
    moderator: 'Moderátor',
    user: 'Felhasználó',
  };
  const displayRole = ROLE_LABELS[role.toLowerCase()] || role;

  return (
    <header
      style={{ backgroundColor: headerBg, borderColor }}
      className="sticky top-0 z-[1000] backdrop-blur border-b w-full flex-shrink-0 transition-all duration-200"
    >
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-nowrap whitespace-nowrap min-w-0 w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1 flex-nowrap">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 -ml-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            aria-label="Menü megnyitása"
          >
            <Menu size={18} />
          </button>
          <img
            src={logoUrl}
            alt={`${siteSettings.siteTitle || 'ÉpítőTudás'} logó`}
            className="lg:hidden h-7 max-h-7 w-auto object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <div className="flex-1 min-w-0">
            <GlobalSearch onNavigateView={onNavigateView} />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 whitespace-nowrap">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 truncate max-w-[180px]">{userEmail || '—'}</p>
            <p className="text-xs text-emerald-400 font-medium">{displayRole}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            title="Kijelentkezés"
            aria-label="Kijelentkezés"
          >
            <LogOut size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
