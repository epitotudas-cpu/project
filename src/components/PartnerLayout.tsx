import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AccessDeniedPage from '../pages/AccessDeniedPage';
import { canAccessPartnerPanel } from '../lib/permissions';
import { canRoleAccessModule } from '../services/permissionService';
import {
  LayoutDashboard,
  Building2,
  Tag,
  Package,
  Wrench,
  BarChart3,
  Home,
  LogOut,
  Briefcase,
  X,
  Menu,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

export type PartnerView =
  | 'dashboard'
  | 'partner_profile'
  | 'partner_offers'
  | 'partner_products'
  | 'catalog'
  | 'partner_stats';

interface PartnerLayoutProps {
  onNavigate: (page: string) => void;
  activeView: PartnerView;
  onNavigateView: (view: PartnerView) => void;
  children: React.ReactNode;
}

const PARTNER_NAV_ITEMS: Array<{ id: PartnerView; moduleId: string; label: string; icon: any }> = [
  { id: 'dashboard', moduleId: 'partner_profile', label: 'Partner Áttekintés', icon: LayoutDashboard },
  { id: 'partner_profile', moduleId: 'partner_profile', label: 'Saját Partnerprofil', icon: Building2 },
  { id: 'partner_offers', moduleId: 'partner_offers', label: 'Saját Ajánlatok & Akciók', icon: Tag },
  { id: 'partner_products', moduleId: 'partner_products', label: 'Termékek & Szolgáltatások', icon: Package },
  { id: 'catalog', moduleId: 'catalog', label: 'Gép & Szerszám Katalógus', icon: Wrench },
  { id: 'partner_stats', moduleId: 'partner_stats', label: 'Statisztikák & Teljesítmény', icon: BarChart3 },
];

export default function PartnerLayout({ onNavigate, activeView, onNavigateView, children }: PartnerLayoutProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Security guard check
  if (!user && !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto text-blue-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Partneri Bejelentkezés Szükséges</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            A partneri panel megtekintéséhez kérjük, jelentkezzen be partneri fiókjával.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="flex-1 py-2.5 px-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs transition-colors"
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

  if (!canAccessPartnerPanel(profile)) {
    return (
      <AccessDeniedPage
        userEmail={profile?.email || user?.email || null}
        role={profile?.role || null}
        onNavigateHome={() => onNavigate('home')}
        onSignOut={signOut}
      />
    );
  }

  const role = profile?.role || 'partner';
  const fullNameLower = (profile?.full_name || '').toLowerCase();
  const userType = user?.user_metadata?.user_type;
  const isTeacherOrSchool =
    (profile?.role as string) === 'school' ||
    userType === 'oktato' ||
    userType === 'iskola' ||
    fullNameLower.includes('tanár') ||
    fullNameLower.includes('oktató') ||
    fullNameLower.includes('kapcsolattartó') ||
    fullNameLower.includes('teszt') ||
    Boolean(user?.email?.includes('partner'));

  // Filter nav items based on admin permissions assigned to Partner
  const availableNavItems = PARTNER_NAV_ITEMS.map((item) => {
    if (item.id === 'dashboard') {
      return {
        ...item,
        label: isTeacherOrSchool ? 'Osztályok & Tananyagok' : 'Partner Áttekintés',
        icon: isTeacherOrSchool ? GraduationCap : LayoutDashboard,
      };
    }
    if (item.id === 'partner_profile' && isTeacherOrSchool) {
      return {
        ...item,
        label: 'Iskolai / Szervezeti Profil',
      };
    }
    return item;
  }).filter((item) => {
    if (item.id === 'dashboard') return true;
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
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 max-w-[85vw] bg-slate-900 border-r border-blue-500/20 flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight">Tanár panel</h1>
              <p className="text-xs text-blue-400 font-medium">ÉpítőTudás Iskolai Rendszer</p>
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
            Tanári Funkciók
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
                    ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400 shadow-md'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 space-y-3 bg-slate-900/60">
          <div className="px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-400 block truncate">{profile?.email}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-400 font-bold uppercase text-[10px] tracking-wider">
                {profile?.role === 'admin' ? 'Adminisztrátor' : 'Oktató / Tanár'}
              </span>
            </div>
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
              <span className="font-extrabold text-white text-xs sm:text-sm block truncate">Tanár panel</span>
              <span className="text-[10px] text-blue-400 font-bold block truncate">
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
            <Briefcase className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Tanári Vezérlőpult</h2>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Aktív fiók: <strong className="text-blue-400">{profile?.role}</strong></span>
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
