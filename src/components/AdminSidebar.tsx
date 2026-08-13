import { LayoutDashboard, FileText, FolderTree, BookOpen, Library, Wrench, Settings, Home, Users, CheckSquare, Shield, Building2, Megaphone, Activity, X, Briefcase, GraduationCap, Compass } from 'lucide-react';

export type AdminView =
  | 'dashboard'
  | 'articles'
  | 'categories'
  | 'glossary'
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
  mobileOpen: boolean;
  onCloseMobile: () => void;
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
      { id: 'categories', label: 'Kategóriák', icon: FolderTree },
      { id: 'glossary', label: 'Fogalmak', icon: BookOpen },
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
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen lg:h-screen w-64 bg-[#0D0D0D] border-r border-[#1E1E1E] flex flex-col flex-shrink-0 transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-[#1E1E1E] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#FFC400]">Admin</h2>
            <p className="text-xs text-gray-500 mt-1">ÉpítőTudás panel</p>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-500 hover:bg-[#1E1E1E] rounded-md transition-colors"
            aria-label="Menü bezárása"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto admin-scroll">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-black tracking-widest text-gray-500 uppercase">
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
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#FFC400]/10 text-[#FFC400] font-bold border-l-2 border-[#FFC400]'
                          : 'text-gray-400 hover:bg-[#1E1E1E] hover:text-gray-200'
                      }`}
                    >
                      <Icon size={15} className={active ? 'text-[#FFC400]' : 'text-gray-500'} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#1E1E1E]">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-[#1E1E1E] hover:text-gray-200 transition-colors"
          >
            <Home size={16} className="text-gray-500" />
            Vissza a főoldalra
          </button>
        </div>
      </aside>
    </>
  );
}
