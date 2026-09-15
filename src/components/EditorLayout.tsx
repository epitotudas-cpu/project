import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AccessDeniedPage from '../pages/AccessDeniedPage';
import { canAccessEditorPanel } from '../lib/permissions';
import { canRoleAccessModule } from '../services/permissionService';
import { useEditorTheme } from '../services/editorThemeService';
import {
  LayoutDashboard,
  FileText,
  BookMarked,
  GraduationCap,
  FolderTree,
  BookOpen,
  ShieldAlert,
  Layers,
  Wrench,
  Library,
  Home,
  LogOut,
  UserCheck,
  X,
  Menu,
  CheckSquare,
  Settings,
} from 'lucide-react';

export type EditorView =
  | 'dashboard'
  | 'articles'
  | 'utmutatok'
  | 'learning'
  | 'categories'
  | 'glossary'
  | 'safety'
  | 'materials'
  | 'tools'
  | 'books'
  | 'moderation'
  | 'settings';

interface EditorLayoutProps {
  onNavigate: (page: string) => void;
  activeView: EditorView;
  onNavigateView: (view: EditorView) => void;
  children: React.ReactNode;
}

const EDITOR_NAV_ITEMS: Array<{ id: EditorView; moduleId: string; label: string; icon: any }> = [
  { id: 'dashboard', moduleId: 'articles', label: 'Szerkesztői Áttekintés', icon: LayoutDashboard },
  { id: 'articles', moduleId: 'articles', label: 'Cikkek & Tudásanyagok', icon: FileText },
  { id: 'utmutatok', moduleId: 'guides', label: 'Kivitelezési Útmutatók', icon: BookMarked },
  { id: 'learning', moduleId: 'learning', label: 'Tananyagok & Kvízek', icon: GraduationCap },
  { id: 'categories', moduleId: 'categories', label: 'Kategóriák & Címkék', icon: FolderTree },
  { id: 'glossary', moduleId: 'glossary', label: 'Fogalomtár', icon: BookOpen },
  { id: 'safety', moduleId: 'safety', label: 'Munkavédelem', icon: ShieldAlert },
  { id: 'materials', moduleId: 'materials', label: 'Építőipari Anyagok', icon: Layers },
  { id: 'tools', moduleId: 'tools', label: 'Eszközök & Szerszámok', icon: Wrench },
  { id: 'books', moduleId: 'books', label: 'Szakmai Könyvek', icon: Library },
  { id: 'moderation', moduleId: 'moderation', label: 'Moderáció & Felülvizsgálat', icon: CheckSquare },
  { id: 'settings', moduleId: 'settings', label: 'Téma & Beállítások', icon: Settings },
];

export default function EditorLayout({ onNavigate, activeView, onNavigateView, children }: EditorLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useEditorTheme();

  // Security guard check
  if (!user && !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Szerkesztői Bejelentkezés Szükséges</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            A szerkesztői panel megtekintéséhez kérjük, jelentkezzen be szerkesztői fiókjával.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Bejelentkezés
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors border border-slate-700"
            >
              Főoldal
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessEditorPanel(profile)) {
    return (
      <AccessDeniedPage
        userEmail={profile?.email || user?.email || null}
        role={profile?.role || null}
        onNavigateHome={() => onNavigate('home')}
        onSignOut={signOut}
      />
    );
  }

  const role = profile?.role || 'editor';

  // Filter nav items based on admin permissions assigned to Editor
  const availableNavItems = EDITOR_NAV_ITEMS.filter((item) => {
    if (item.id === 'dashboard' || item.id === 'settings') return true;
    return canRoleAccessModule(role, item.moduleId);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 max-w-[85vw] bg-slate-900 border-r ${theme.borderSubtle} flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.bgSubtle} border ${theme.borderStrong} ${theme.textAccent}`}>
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight">Szerkesztői Panel</h1>
              <p className={`text-xs ${theme.textAccent} font-medium`}>ÉpítőTudás Editorial</p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Szerkesztőségi Modulok
          </div>

          {availableNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigateView(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? `${theme.bgSubtle} border ${theme.borderStrong} ${theme.textAccent} shadow-md`
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? theme.textAccent : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 space-y-3 bg-slate-900/60">
          <div className="px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-400 block truncate">{profile?.email}</span>
            <span className={`${theme.textAccent} font-bold uppercase text-[10px] tracking-wider`}>
              {profile?.role === 'admin' ? 'Adminisztrátor' : 'Szerkesztő'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Főoldal
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs rounded-xl transition-colors shrink-0"
              title="Kijelentkezés"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800 p-3 sm:p-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition-colors shrink-0"
              aria-label="Menü megnyitása"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="font-extrabold text-white text-xs sm:text-sm block truncate">Szerkesztői Panel</span>
              <span className={`text-[10px] ${theme.textAccent} font-bold block truncate`}>
                {availableNavItems.find((i) => i.id === activeView)?.label || 'Vezérlőpult'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 rounded-xl border border-slate-700/80 transition-colors text-xs font-medium flex items-center gap-1"
              title="Főoldal"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl text-xs transition-colors"
              title="Kijelentkezés"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Top Navbar */}
        <header className="hidden md:flex bg-slate-900/80 border-b border-slate-800 px-8 py-4 items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <UserCheck className={`w-5 h-5 ${theme.textAccent}`} />
            <h2 className="text-sm font-bold text-white tracking-tight">Szerkesztői Vezérlőpult</h2>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Aktív szerepkör: <strong className={theme.textAccent}>{profile?.role}</strong></span>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
