import { useState, useEffect, ReactNode } from 'react';
import { onAuthStateChange } from '../lib/authClient';
import { getAuthDebugInfo, signOutAdmin, type AuthDebugInfo } from '../lib/authService';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminLogin from './AdminLogin';
import AccessDeniedPage from '../pages/AccessDeniedPage';
import type { AdminView } from './AdminSidebar';

interface AdminLayoutProps {
  onNavigate: (page: string) => void;
  children: (view: AdminView, userEmail: string | null, onNavigateView: (view: AdminView) => void) => ReactNode;
}

export default function AdminLayout({ onNavigate, children }: AdminLayoutProps) {
  const [authInfo, setAuthInfo] = useState<AuthDebugInfo | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<AdminView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    const { data: { subscription } } = onAuthStateChange(() => {
      checkAuth();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function checkAuth() {
    const info = await getAuthDebugInfo();
    setAuthInfo(info);
    setAuthChecked(true);
  }

  async function handleSignOut() {
    await signOutAdmin();
    setAuthInfo(null);
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#FFC400] border-r-transparent"></div>
          <p className="mt-4 text-gray-500 text-sm">Hitelesítés ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (!authInfo?.isAuthenticated) {
    return (
      <div>
        <AdminLogin onLoginSuccess={checkAuth} />
        <div className="text-center mt-4 px-4">
          <button
            onClick={() => onNavigate('home')}
            className="text-sm text-gray-500 hover:text-gray-400"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  if (!authInfo?.hasAdminRole) {
    return (
      <AccessDeniedPage
        userEmail={authInfo.userEmail}
        role={authInfo.role}
        onNavigateHome={() => onNavigate('home')}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] lg:flex">
      <AdminSidebar
        activeView={view}
        onNavigateView={setView}
        onNavigateHome={() => onNavigate('home')}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminHeader
          userEmail={authInfo.userEmail}
          role={authInfo.hasAdminRole ? 'admin' : 'user'}
          onSignOut={handleSignOut}
          onNavigateView={setView}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto admin-scroll">{children(view, authInfo.userEmail, setView)}</main>
      </div>
    </div>
  );
}
