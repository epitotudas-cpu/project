import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ArticlePage from './pages/ArticlePage';
import GlossaryPage from './pages/GlossaryPage';
import ToolPage from './pages/ToolPage';
import PathsHubPage from './pages/PathsHubPage';
import AboutHubPage from './pages/AboutHubPage';
import CoursesPage from './pages/CoursesPage';
import CareersPage from './pages/CareersPage';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminArticlesPage from './pages/AdminArticlesPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminGlossaryPage from './pages/AdminGlossaryPage';
import AdminBooksPage from './pages/AdminBooksPage';
import AdminToolsPage from './pages/AdminToolsPage';
import AdminTradesPage from './pages/AdminTradesPage';
import AdminJobsPage from './pages/AdminJobsPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminModerationPage from './pages/AdminModerationPage';
import AdminRolesPage from './pages/AdminRolesPage';
import AdminPartnersPage from './pages/AdminPartnersPage';
import AdminAdsPage from './pages/AdminAdsPage';
import AdminAuditPage from './pages/AdminAuditPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import PartnersPage from './pages/PartnersPage';
import ImpressumPage from './pages/ImpressumPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import CookieBanner from './components/CookieBanner';
import { GlossaryProvider } from './contexts/GlossaryContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import KnowledgeHubPage from './pages/KnowledgeHubPage';
import CalculationsPage from './pages/CalculationsPage';
import BooksPage from './pages/BooksPage';
import SoftwarePage from './pages/SoftwarePage';
import ToolSelectorPage from './pages/ToolSelectorPage';
import LegalHubPage from './pages/LegalHubPage';
import {
  getSiteSettings,
  applySiteSettings,
  fetchSiteSettingsFromCloud,
  type SiteSettings,
} from './services/siteSettingsService';
import { fetchHeroStateFromCloud } from './services/heroImageService';
import { fetchImpressumDataFromCloud } from './services/impressumService';

type PageKey =
  | 'home'
  | 'tudastar'
  | 'category'
  | 'article'
  | 'glossary'
  | 'calculations'
  | 'books'
  | 'tool'
  | 'software'
  | 'valaszto'
  | 'paths'
  | 'about'
  | 'partners'
  | 'admin'
  | 'login'
  | 'register'
  | 'verify-email'
  | 'forgot-password'
  | 'reset-password'
  | 'profile'
  | 'courses'
  | 'careers'
  | 'impressum'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'jogi';

const ALL_VALID_PAGES: PageKey[] = [
  'home',
  'tudastar',
  'category',
  'article',
  'glossary',
  'calculations',
  'books',
  'tool',
  'software',
  'valaszto',
  'paths',
  'about',
  'partners',
  'admin',
  'login',
  'register',
  'verify-email',
  'forgot-password',
  'reset-password',
  'profile',
  'courses',
  'careers',
  'impressum',
  'privacy',
  'terms',
  'cookies',
  'jogi',
];

function getInitialPage(): PageKey {
  try {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('type') === 'recovery') return 'reset-password';
    if (window.location.hash.includes('confirmed=true') || params.get('type') === 'signup') {
      try { sessionStorage.setItem('email_confirmed_success', 'true'); } catch {}
      return 'login';
    }

    const rawHash = window.location.hash.replace(/^#\/?/, '');
    const mainHash = rawHash.split('?')[0].split('#')[0];
    if (mainHash && ALL_VALID_PAGES.includes(mainHash as PageKey)) {
      return mainHash as PageKey;
    }

    const savedSessionPage = sessionStorage.getItem('epitotudas_active_page');
    if (savedSessionPage && ALL_VALID_PAGES.includes(savedSessionPage as PageKey)) {
      return savedSessionPage as PageKey;
    }
  } catch (err) {
    void err;
  }
  return 'home';
}

function getInitialArticleSlug(): string | null {
  try {
    const hash = window.location.hash;
    if (hash.includes('slug=')) {
      const queryPart = hash.includes('?') ? hash.split('?')[1] : hash;
      const params = new URLSearchParams(queryPart);
      const slug = params.get('slug');
      if (slug) return decodeURIComponent(slug);
    }
    return sessionStorage.getItem('epitotudas_article_slug');
  } catch {
    return null;
  }
}

function AppContent() {
  const { user, loading, authEvent } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageKey>(getInitialPage);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(getInitialArticleSlug);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => getSiteSettings());

  useEffect(() => {
    function handleSettingsChange() {
      const current = getSiteSettings();
      setSiteSettings(current);
      applySiteSettings(current);
    }
    handleSettingsChange();

    // Trigger cloud synchronization across devices
    void fetchSiteSettingsFromCloud();
    void fetchHeroStateFromCloud();
    void fetchImpressumDataFromCloud();

    window.addEventListener('site-settings-changed', handleSettingsChange);
    window.addEventListener('hero-config-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('site-settings-changed', handleSettingsChange);
      window.removeEventListener('hero-config-changed', handleSettingsChange);
    };
  }, [authEvent]);

  useEffect(() => {
    function handleHashChange() {
      const page = getInitialPage();
      setCurrentPage(page);
      const slug = getInitialArticleSlug();
      if (slug) {
        setSelectedArticleSlug(slug);
      }
    }
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigate = (page: string, params?: { articleSlug?: string }) => {
    const rawTarget = page.replace(/^#\/?/, '');
    const mainPage = rawTarget.split('?')[0].split('#')[0];
    const targetAnchor = rawTarget.includes('#') ? '#' + rawTarget.split('#')[1].split('?')[0] : '';
    const validPage = (ALL_VALID_PAGES.includes(mainPage as PageKey) ? mainPage : 'home') as PageKey;

    if (params?.articleSlug) {
      setSelectedArticleSlug(params.articleSlug);
      try {
        sessionStorage.setItem('epitotudas_article_slug', params.articleSlug);
      } catch (err) {
        void err;
      }
    }

    setCurrentPage(validPage);

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('epitotudas_active_page', validPage);
        const targetHash = validPage === 'home' ? '' : params?.articleSlug ? `#article?slug=${params.articleSlug}` : page.includes('?') || page.includes('#') ? `#${page}` : `#${validPage}`;
        if (window.location.hash !== targetHash) {
          window.history.pushState(null, '', targetHash || window.location.pathname);
        }
        window.dispatchEvent(new Event('popstate'));
        window.dispatchEvent(new Event('hashchange'));

        if (targetAnchor) {
          setTimeout(() => {
            const el = document.querySelector(targetAnchor);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollTo(0, 0);
            }
          }, 150);
        } else {
          window.scrollTo(0, 0);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (authEvent === 'PASSWORD_RECOVERY') {
      setCurrentPage('reset-password');
    } else if (authEvent === 'SIGNED_IN') {
      if (currentPage === 'verify-email') {
        setCurrentPage('home');
      }
    } else if (authEvent === 'SIGNED_OUT') {
      if (currentPage === 'profile') {
        setCurrentPage('home');
      }
    }
  }, [authEvent, currentPage]);

  // Redirect authenticated users away from auth-only pages
  useEffect(() => {
    if (!loading && user && (currentPage === 'login' || currentPage === 'register')) {
      setCurrentPage('home');
    }
  }, [user, loading, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent" />
      </div>
    );
  }

  // Full-screen routes (no shared Header/Footer)
  switch (currentPage) {
    case 'admin':
      return (
        <AdminLayout onNavigate={navigate}>
          {(view, userEmail, onNavigateView) => {
            if (view === 'dashboard') return <AdminDashboard userEmail={userEmail} onNavigateView={onNavigateView} />;
            if (view === 'moderation') return <AdminModerationPage />;
            if (view === 'articles') return <AdminArticlesPage />;
            if (view === 'categories') return <AdminCategoriesPage />;
            if (view === 'glossary') return <AdminGlossaryPage />;
            if (view === 'trades') return <AdminTradesPage />;
            if (view === 'books') return <AdminBooksPage />;
            if (view === 'tools') return <AdminToolsPage />;
            if (view === 'jobs') return <AdminJobsPage />;
            if (view === 'courses') return <AdminCoursesPage />;
            if (view === 'users') return <AdminUsersPage />;
            if (view === 'roles') return <AdminRolesPage />;
            if (view === 'partners') return <AdminPartnersPage />;
            if (view === 'ads') return <AdminAdsPage onNavigate={navigate} />;
            if (view === 'audit') return <AdminAuditPage />;
            if (view === 'settings') return <AdminSettingsPage onNavigate={navigate} />;
            return <div className="p-8 text-gray-500 text-sm">A(z) "{view}" nézet hamarosan elérhető.</div>;
          }}
        </AdminLayout>
      );
    case 'login':
      return <LoginPage onNavigate={navigate} />;
    case 'register':
      return <RegisterPage onNavigate={navigate} />;
    case 'verify-email':
      return <EmailVerificationPage onNavigate={navigate} />;
    case 'forgot-password':
      return <ForgotPasswordPage onNavigate={navigate} />;
    case 'reset-password':
      return <ResetPasswordPage onNavigate={navigate} />;
  }

  // Public routes with shared Header/Footer
  const renderPage = () => {
    switch (currentPage) {
      case 'tudastar': return <KnowledgeHubPage onNavigate={navigate} />;
      case 'calculations': return <CalculationsPage onNavigate={navigate} />;
      case 'books': return <BooksPage onNavigate={navigate} />;
      case 'category': return <CategoryPage onNavigate={navigate} />;
      case 'article': return <ArticlePage articleSlug={selectedArticleSlug} onNavigate={navigate} />;
      case 'glossary': return <GlossaryPage onNavigate={navigate} />;
      case 'tool': return <ToolPage onNavigate={navigate} />;
      case 'software': return <SoftwarePage onNavigate={navigate} />;
      case 'valaszto': return <ToolSelectorPage onNavigate={navigate} />;
      case 'paths': return <PathsHubPage onNavigate={navigate} />;
      case 'about': return <AboutHubPage onNavigate={navigate} />;
      case 'partners': return <PartnersPage onNavigate={navigate} />;
      case 'courses': return <CoursesPage onNavigate={navigate} />;
      case 'careers': return <CareersPage onNavigate={navigate} />;
      case 'jogi': return <LegalHubPage onNavigate={navigate} />;
      case 'impressum': return <ImpressumPage onNavigate={navigate} />;
      case 'privacy': return <PrivacyPolicyPage onNavigate={navigate} />;
      case 'terms': return <TermsPage onNavigate={navigate} />;
      case 'cookies': return <CookiePolicyPage onNavigate={navigate} />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {siteSettings.maintenanceMode && (currentPage as string) !== 'admin' && (
        <div className="bg-amber-500 text-black px-4 py-2.5 font-bold text-xs text-center flex items-center justify-center gap-2 shadow-lg">
          <span>⚠️ {siteSettings.maintenanceMessage}</span>
          <button
            onClick={() => navigate('admin')}
            className="underline hover:text-[#111] font-extrabold text-[11px] ml-2"
          >
            [Adminisztrációs Belépés]
          </button>
        </div>
      )}
      <Header currentPage={currentPage} onNavigate={navigate} />
      <main>{renderPage()}</main>
      <Footer onNavigate={navigate} />
      <CookieBanner onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GlossaryProvider>
        <AppContent />
      </GlossaryProvider>
    </AuthProvider>
  );
}
