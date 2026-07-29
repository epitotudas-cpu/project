import { LogOut, Menu } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import type { AdminView } from './AdminSidebar';

interface AdminHeaderProps {
  userEmail: string | null;
  role: string;
  onSignOut: () => void;
  onNavigateView: (view: AdminView) => void;
  onOpenSidebar: () => void;
}

export default function AdminHeader({
  userEmail,
  role,
  onSignOut,
  onNavigateView,
  onOpenSidebar,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur border-b border-[#1E1E1E] flex-shrink-0">
      <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ml-2 text-gray-400 hover:bg-[#1E1E1E] rounded-lg transition-colors"
          aria-label="Menü megnyitása"
        >
          <Menu size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <GlobalSearch onNavigateView={onNavigateView} />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 truncate max-w-[180px]">{userEmail || '—'}</p>
            <p className="text-xs text-green-400 font-medium capitalize">{role}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-colors"
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
