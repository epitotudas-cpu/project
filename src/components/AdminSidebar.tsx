import { LayoutDashboard, FileText, FolderTree, BookOpen, Library, Wrench, Settings, Home, Users, CheckSquare, Shield, Building2, Megaphone, Activity, X, Briefcase, GraduationCap, Compass, ShieldAlert, Layers } from 'lucide-react';
import { useSiteSettings, adjustColorBrightness, getDynamicImageUrl } from '../services/siteSettingsService';

export type AdminView =
  | 'dashboard'
  | 'articles'
  | 'categories'
  | 'learning'
  | 'glossary'
  | 'knowledge-hub'
  | 'materials'
  | 'trades'
  | 'books'
  | 'tools'
  | 'jobs'
  | 'courses'
  | 'users'
  | 'moderation'
  | 'roles'
  | 'partners'
  | 'ads'
  | 'audit'
  | 'settings';

interface AdminSidebarProps {
  activeView: AdminView;
  onNavigateView: (view: AdminView) => void;
  onNavigateHome: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: AdminView;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'ADMIN',
    items: [
      { id: 'dashboard', label: 'Áttekintés', icon: LayoutDashboard },
      { id: 'moderation', label: 'Moderáció', icon: CheckSquare },
    ],
  },
  {
    title: 'TARTALOM',
    items: [
      { id: 'articles', label: 'Cikkek', icon: FileText },
      { id: 'learning', label: 'Tanulási Rendszer', icon: GraduationCap },
      { id: 'categories', label: 'Kategóriák', icon: FolderTree },
      { id: 'glossary', label: 'Fogalmak', icon: BookOpen },
      { id: 'knowledge-hub', label: 'Oktatási Tudásbázis', icon: ShieldAlert },
      { id: 'materials', label: 'Építőipari Anyagok', icon: Layers },
      { id: 'trades', label: 'Szakmák & Karrierutak', icon: Compass },
      { id: 'books', label: 'Szakmai Könyvek', icon: Library },
      { id: 'tools', label: 'Eszközök & Gépek', icon: Wrench },
      { id: 'jobs', label: 'Állásajánlatok', icon: Briefcase },
      { id: 'courses', label: 'Képzések', icon: GraduationCap },
    ],
  },
  {
    title: 'PARTNEREK',
    items: [{ id: 'partners', label: 'Partnerek', icon: Building2 }],
  },
  {
    title: 'MARKETING',
    items: [{ id: 'ads', label: 'Reklámok', icon: Megaphone }],
  },
  {
    title: 'FELHASZNÁLÓK',
    items: [
      { id: 'users', label: 'Felhasználók', icon: Users },
      { id: 'roles', label: 'Jogosultságok', icon: Shield },
    ],
  },
  {
    title: 'AUDIT',
    items: [{ id: 'audit', label: 'Audit Napló', icon: Activity }],
  },
  {
    title: 'BEÁLLÍTÁSOK',
    items: [{ id: 'settings', label: 'Beállítások', icon: Settings }],
  },
];

export default function AdminSidebar({
  activeView,
  onNavigateView,
  onNavigateHome,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const siteSettings = useSiteSettings();
  const logoUrl = getDynamicImageUrl(siteSettings.logoUrl, '/logo.png', siteSettings.iconsUpdatedAt);
  const adminAccent = siteSettings.adminAccentColor || '#FFC400';
  const adminBg = siteSettings.adminBgColor || '#0A0A0A';

  const sidebarBg = adjustColorBrightness(adminBg, 2);
  const borderColor = adjustColorBrightness(adminBg, 12);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        style={{ backgroundColor: sidebarBg, borderColor }}
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen lg:h-screen w-64 border-r flex flex-col flex-shrink-0 transition-all duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor }}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={logoUrl}
              alt={`${siteSettings.siteTitle || 'ÉpítőTudás'} logó`}
              className="h-8 max-h-8 max-w-[140px] w-auto object-contain shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="min-w-0">
              <h2 className="text-xs font-black uppercase tracking-wider truncate" style={{ color: adminAccent }}>
                Admin
              </h2>
              <p className="text-[10px] text-gray-400 truncate">Panel</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-400 hover:bg-white/10 rounded-md transition-colors shrink-0"
            aria-label="Menü bezárása"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto admin-scroll">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-black tracking-widest text-gray-400 uppercase opacity-75">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => {
                  const active = activeView === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        onNavigateView(id);
                        onCloseMobile?.();
                      }}
                      style={
                        active
                          ? {
                              backgroundColor: `${adminAccent}1C`,
                              color: adminAccent,
                              borderLeftColor: adminAccent,
                            }
                          : {}
                      }
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'font-bold border-l-2'
                          : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
                      }`}
                    >
                      <Icon size={15} style={active ? { color: adminAccent } : {}} className={active ? '' : 'text-gray-400'} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor }}>
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
          >
            <Home size={16} className="text-gray-400" />
            Vissza a főoldalra
          </button>
        </div>
      </aside>
    </>
  );
}
