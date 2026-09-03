import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CookieBanner from './components/CookieBanner';
import { GlossaryProvider } from './contexts/GlossaryContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  getSiteSettings,
  applySiteSettings,
  fetchSiteSettingsFromCloud,
  type SiteSettings,
} from './services/siteSettingsService';
import { fetchHeroStateFromCloud } from './services/heroImageService';
import { fetchImpressumDataFromCloud } from './services/impressumService';

// Dynamic Code Splitting (Lazy Load Subpages to Drastically Reduce Initial Bundle Size)
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const ToolPage = lazy(() => import('./pages/ToolPage'));
const PathsHubPage = lazy(() => import('./pages/PathsHubPage'));
const AboutHubPage = lazy(() => import('./pages/AboutHubPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminArticlesPage = lazy(() => import('./pages/AdminArticlesPage'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'));
const AdminGlossaryPage = lazy(() => import('./pages/AdminGlossaryPage'));
const AdminBooksPage = lazy(() => import('./pages/AdminBooksPage'));
const AdminToolsPage = lazy(() => import('./pages/AdminToolsPage'));
const AdminTradesPage = lazy(() => import('./pages/AdminTradesPage'));
const AdminJobsPage = lazy(() => import('./pages/AdminJobsPage'));
const AdminCoursesPage = lazy(() => import('./pages/AdminCoursesPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminModerationPage = lazy(() => import('./pages/AdminModerationPage'));
const AdminRolesPage = lazy(() => import('./pages/AdminRolesPage'));
const AdminPartnersPage = lazy(() => import('./pages/AdminPartnersPage'));
const AdminAdsPage = lazy(() => import('./pages/AdminAdsPage'));
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const AdminKnowledgeHubPage = lazy(() => import('./pages/AdminKnowledgeHubPage'));
const AdminMaterialsPage = lazy(() => import('./pages/AdminMaterialsPage'));
const SafetyPage = lazy(() => import('./pages/SafetyPage'));
const StandardsPage = lazy(() => import('./pages/StandardsPage'));
const MaterialsPage = lazy(() => import('./pages/MaterialsPage'));
const LearningPage = lazy(() => import('./pages/LearningPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const QuizPlayerPage = lazy(() => import('./pages/QuizPlayerPage'));
const LearningPathsPage = lazy(() => import('./pages/LearningPathsPage'));
const AdminLearningPage = lazy(() => import('./pages/AdminLearningPage'));
const PartnerLearningPage = lazy(() => import('./pages/PartnerLearningPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const ImpressumPage = lazy(() => import('./pages/ImpressumPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const PartnerApplicationPage = lazy(() => import('./pages/PartnerApplicationPage'));
const KnowledgeHubPage = lazy(() => import('./pages/KnowledgeHubPage'));
const CalculationsPage = lazy(() => import('./pages/CalculationsPage'));
const BooksPage = lazy(() => import('./pages/BooksPage'));
const SoftwarePage = lazy(() => import('./pages/SoftwarePage'));
const ToolSelectorPage = lazy(() => import('./pages/ToolSelectorPage'));
const LegalHubPage = lazy(() => import('./pages/LegalHubPage'));

type PageKey =
  | 'home'
  | 'tudastar'
  | 'category'
  | 'article'
  | 'learning'
  | 'course-detail'
  | 'quiz-player'
  | 'learning-paths'
  | 'glossary'
  | 'calculations'
  | 'books'
  | 'safety'
  | 'standards'
  | 'tool'
  | 'materials'
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
  | 'jogi'
  | 'partner-application';

const ALL_VALID_PAGES: PageKey[] = [
  'home',
  'tudastar',
  'category',
  'article',
  'learning',
  'course-detail',
  'quiz-player',
  'learning-paths',
  'glossary',
  'calculations',
  'books',
  'safety',
  'standards',
  'tool',
  'materials',
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
  'partner-application',
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

function PageFallback() {
  return (
    <div className="min-h-[50vh] bg-background flex flex-col items-center justify-center p-8">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-3" />
      <p className="text-xs text-gray-400 font-medium">Betöltés...</p>
    </div>
  );
}

function AppContent() {
  const { user, loading, authEvent } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageKey>(getInitialPage);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(getInitialArticleSlug);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>('gipszkartonozas-es-szarazepitesi-alapismeretek');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('quiz-1');
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

  const navigate = (page: string, params?: { articleSlug?: string; slug?: string; quizId?: string }) => {
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

    if (params?.slug) {
      setSelectedCourseSlug(params.slug);
    }

    if (params?.quizId) {
      setSelectedQuizId(params.quizId);
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
        <Suspense fallback={<PageFallback />}>
          <AdminLayout onNavigate={navigate}>
            {(view, userEmail, onNavigateView, searchQuery) => {
              if (view === 'dashboard') return <AdminDashboard userEmail={userEmail} onNavigateView={onNavigateView} />;
              if (view === 'moderation') return <AdminModerationPage />;
              if (view === 'articles') return <AdminArticlesPage initialSearchQuery={searchQuery} />;
              if (view === 'learning') return <AdminLearningPage />;
              if (view === 'partner-learning') return <PartnerLearningPage />;
              if (view === 'categories') return <AdminCategoriesPage initialSearchQuery={searchQuery} />;
              if (view === 'glossary') return <AdminGlossaryPage initialSearchQuery={searchQuery} />;
              if (view === 'trades') return <AdminTradesPage initialSearchQuery={searchQuery} />;
              if (view === 'books') return <AdminBooksPage initialSearchQuery={searchQuery} />;
              if (view === 'tools') return <AdminToolsPage initialSearchQuery={searchQuery} />;
              if (view === 'jobs') return <AdminJobsPage initialSearchQuery={searchQuery} />;
              if (view === 'courses') return <AdminCoursesPage initialSearchQuery={searchQuery} />;
              if (view === 'users') return <AdminUsersPage initialSearchQuery={searchQuery} />;
              if (view === 'roles') return <AdminRolesPage />;
              if (view === 'partners') return <AdminPartnersPage initialSearchQuery={searchQuery} />;
              if (view === 'ads') return <AdminAdsPage onNavigate={navigate} />;
              if (view === 'knowledge-hub') return <AdminKnowledgeHubPage initialSearchQuery={searchQuery} />;
              if (view === 'materials') return <AdminMaterialsPage initialSearchQuery={searchQuery} />;
              if (view === 'audit') return <AdminAuditPage />;
              if (view === 'settings') return <AdminSettingsPage onNavigate={navigate} />;
              return <div className="p-8 text-gray-500 text-sm">A(z) "{view}" nézet hamarosan elérhető.</div>;
            }}
          </AdminLayout>
        </Suspense>
      );
    case 'login':
      return <Suspense fallback={<PageFallback />}><LoginPage onNavigate={navigate} /></Suspense>;
    case 'register':
      return <Suspense fallback={<PageFallback />}><RegisterPage onNavigate={navigate} /></Suspense>;
    case 'verify-email':
      return <Suspense fallback={<PageFallback />}><EmailVerificationPage onNavigate={navigate} /></Suspense>;
    case 'forgot-password':
      return <Suspense fallback={<PageFallback />}><ForgotPasswordPage onNavigate={navigate} /></Suspense>;
    case 'reset-password':
      return <Suspense fallback={<PageFallback />}><ResetPasswordPage onNavigate={navigate} /></Suspense>;
    case 'partner-application':
      return <Suspense fallback={<PageFallback />}><PartnerApplicationPage /></Suspense>;
  }

  // Public routes with shared Header/Footer
  const renderPage = () => {
    switch (currentPage) {
      case 'learning': return <LearningPage onNavigate={navigate} />;
      case 'course-detail': return <CourseDetailPage slug={selectedCourseSlug} onNavigate={navigate} />;
      case 'quiz-player': return <QuizPlayerPage quizId={selectedQuizId} onNavigate={navigate} />;
      case 'learning-paths': return <LearningPathsPage onNavigate={navigate} />;
      case 'tudastar': return <KnowledgeHubPage onNavigate={navigate} />;
      case 'calculations': return <CalculationsPage onNavigate={navigate} />;
      case 'books': return <BooksPage onNavigate={navigate} />;
      case 'safety': return <SafetyPage onNavigate={navigate} />;
      case 'standards': return <StandardsPage onNavigate={navigate} />;
      case 'materials': return <MaterialsPage onNavigate={navigate} />;
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
      <main>
        <Suspense fallback={<PageFallback />}>
          {renderPage()}
        </Suspense>
      </main>
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
