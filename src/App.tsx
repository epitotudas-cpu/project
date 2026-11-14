import type { EditorView } from './components/EditorLayout';
import type { PartnerView } from './components/PartnerLayout';
import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CookieBanner from './components/CookieBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import { fetchRolePermissionsFromCloud, canRoleAccessModule } from './services/permissionService';
import { supabase, type Partner } from './lib/supabase';
import { acceptInvitation } from './services/partnerInvitationService';
import {
  updatePartner,
  getPartnerOffers,
  createPartnerOffer,
  updatePartnerOffer,
  deletePartnerOffer,
  getPartnerAnalytics,
  type ExtendedPartner,
  type PartnerOfferItem,
  type PartnerAnalyticsSummary,
} from './services/partnerService';
import { useToast } from './components/ToastProvider';
import ConfirmDialog from './components/ConfirmDialog';
import { resetDefaultMetaTags } from './lib/seoMeta';
import {
  Building2,
  Tag,
  Package,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  Edit2,
  Mail,
  AlertCircle,
  Trash2,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';

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
const AdminGuidesPage = lazy(() => import('./pages/AdminGuidesPage'));
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
const PartnerDetailPage = lazy(() => import('./pages/PartnerDetailPage'));
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
const EditorLayout = lazy(() => import('./components/EditorLayout'));
const EditorDashboardPage = lazy(() => import('./pages/EditorDashboardPage').then(m => ({ default: m.EditorDashboardPage })));
const EditorSettingsPage = lazy(() => import('./pages/EditorSettingsPage').then(m => ({ default: m.EditorSettingsPage })));
const PartnerLayout = lazy(() => import('./components/PartnerLayout'));
const PartnerDashboardPage = lazy(() => import('./pages/PartnerDashboardPage').then(m => ({ default: m.PartnerDashboardPage })));
const PartnerSchoolProfilePage = lazy(() => import('./pages/PartnerSchoolProfilePage'));
const PartnerMaterialsPage = lazy(() => import('./pages/PartnerMaterialsPage'));
const PartnerArticlesPage = lazy(() => import('./pages/PartnerArticlesPage'));
const PartnerEditorModal = lazy(() => import('./components/PartnerEditorModal'));
const TeacherDashboardPage = lazy(() => import('./pages/TeacherDashboardPage'));

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
  | 'partner-detail'
  | 'admin'
  | 'szerkeszto'
  | 'partner'
  | 'teacher'
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
  'partner-detail',
  'admin',
  'szerkeszto',
  'partner',
  'teacher',
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

function normalizeHashRoute(raw: string): string {
  const cleaned = raw.replace(/^#\/?/, '');
  const [pathPart, ...restParts] = cleaned.split('?');
  const suffix = restParts.length > 0 ? `?${restParts.join('?')}` : '';
  const lower = pathPart.toLowerCase();

  if (lower.startsWith('cikkek')) {
    return `${pathPart.replace(/^cikkek/i, 'category')}${suffix}`;
  }
  if (lower === 'tanulas') return `learning${suffix}`;
  if (lower === 'ujdonsagok') return suffix ? `category${suffix}` : 'category?type=ujdonsagok';
  if (lower === 'utmutatok') return suffix ? `category${suffix}` : 'category?type=utmutatok';
  if (lower === 'quizzes' || lower === 'tesztek') return suffix ? `learning${suffix}` : 'learning?tab=quizzes';
  if (lower === 'flashcards' || lower === 'tanulokartyak') return suffix ? `learning${suffix}` : 'learning?tab=flashcards';
  if (lower === 'partnerek') return `partners${suffix}`;
  return cleaned;
}

function getInitialPage(useSessionFallback = true): PageKey {
  try {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get('type') === 'recovery') return 'reset-password';
    if (window.location.hash.includes('confirmed=true') || params.get('type') === 'signup') {
      try {
        sessionStorage.setItem('email_confirmed_success', 'true');
      } catch {
        // Ignore sessionStorage errors in restricted browser modes
      }
      return 'login';
    }

    const rawHash = normalizeHashRoute(window.location.hash);
    if (rawHash.startsWith('partnerek/')) {
      return 'partner-detail';
    }
    if (rawHash.startsWith('course-detail/')) {
      return 'course-detail';
    }
    if (rawHash.startsWith('quiz-player/')) {
      return 'quiz-player';
    }
    const mainHash = rawHash.split('?')[0].split('#')[0];
    if (mainHash && ALL_VALID_PAGES.includes(mainHash as PageKey)) {
      return mainHash as PageKey;
    }

    const hasExplicitRootHash = window.location.hash === '#/' || window.location.hash === '#';
    const savedSessionPage = sessionStorage.getItem('epitotudas_active_page');
    if (useSessionFallback && !hasExplicitRootHash && !mainHash && savedSessionPage && ALL_VALID_PAGES.includes(savedSessionPage as PageKey)) {
      return savedSessionPage as PageKey;
    }
  } catch (err) {
    void err;
  }
  return 'home';
}

function isUnknownHashRoute(): boolean {
  try {
    const raw = window.location.hash.replace(/^#\/?/, '');
    if (!raw) return false;
    if (
      raw.includes('type=recovery') ||
      raw.includes('type=signup') ||
      raw.includes('confirmed=true') ||
      raw.includes('access_token=')
    ) {
      return false;
    }
    const normalized = normalizeHashRoute(raw);
    if (
      normalized.startsWith('partnerek/') ||
      normalized.startsWith('course-detail/') ||
      normalized.startsWith('quiz-player/')
    ) {
      return false;
    }
    const mainHash = normalized.split('?')[0].split('#')[0];
    return Boolean(mainHash) && !ALL_VALID_PAGES.includes(mainHash as PageKey);
  } catch {
    return false;
  }
}

function getInitialCourseSlug(): string {
  try {
    const hash = window.location.hash;
    if (hash.includes('course-detail')) {
      const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryPart);
      const slug = params.get('slug');
      if (slug) return decodeURIComponent(slug);

      const match = hash.match(/^#\/?course-detail\/([^/?#]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
    const saved = sessionStorage.getItem('epitotudas_course_slug');
    if (saved) return saved;
  } catch {
    // ignore
  }
  return 'gipszkartonozas-es-szarazepitesi-alapismeretek';
}

function getInitialQuizId(): string {
  try {
    const hash = window.location.hash;
    if (hash.includes('quiz-player')) {
      const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryPart);
      const quizId = params.get('quizId') || params.get('id');
      if (quizId) return decodeURIComponent(quizId);

      const match = hash.match(/^#\/?quiz-player\/([^/?#]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
    const saved = sessionStorage.getItem('epitotudas_quiz_id');
    if (saved) return saved;
  } catch {
    // ignore
  }
  return 'quiz-1';
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

function getInitialPartnerSlug(): string | null {
  try {
    const hash = window.location.hash;
    if (hash.includes('partner-detail') || hash.includes('partnerek/')) {
      const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
      const params = new URLSearchParams(queryPart);
      const slug = params.get('slug') || params.get('partnerSlug') || params.get('id');
      if (slug) return decodeURIComponent(slug);

      const match = hash.match(/^#\/?partnerek\/([^/?#]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
    return sessionStorage.getItem('epitotudas_partner_slug');
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

function EditorPanelContent({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { profile } = useAuth();
  const [editorView, setEditorView] = useState<EditorView>('dashboard');
  const role = profile?.role;
  const canView = (moduleId: string) => canRoleAccessModule(role, moduleId);

  return (
    <EditorLayout onNavigate={onNavigate} activeView={editorView} onNavigateView={setEditorView}>
      {editorView === 'dashboard' && <EditorDashboardPage onNavigateView={setEditorView} />}
      {editorView === 'articles' && (canView('articles') ? <AdminArticlesPage onNavigateView={(view) => setEditorView(view as EditorView)} /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'utmutatok' && (canView('guides') ? <AdminGuidesPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'learning' && (canView('learning') ? <AdminLearningPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'categories' && (canView('categories') ? <AdminCategoriesPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'glossary' && (canView('glossary') ? <AdminGlossaryPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'safety' && (canView('safety') ? <AdminKnowledgeHubPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'materials' && (canView('catalog') ? <AdminMaterialsPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'tools' && (canView('catalog') ? <AdminToolsPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'books' && (canView('catalog') ? <AdminBooksPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'moderation' && (canView('moderation') ? <AdminModerationPage /> : <EditorDashboardPage onNavigateView={setEditorView} />)}
      {editorView === 'settings' && <EditorSettingsPage />}
    </EditorLayout>
  );
}

function PartnerPanelContent({ onNavigate }: { onNavigate: (page: string, params?: { partnerSlug?: string; slug?: string; articleSlug?: string }) => void }) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [partnerView, setPartnerView] = useState<PartnerView>('dashboard');
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [isSchoolCategory, setIsSchoolCategory] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);

  // Offers & analytics state (persisted in Supabase)
  const [offersList, setOffersList] = useState<PartnerOfferItem[]>([]);
  const [analytics, setAnalytics] = useState<PartnerAnalyticsSummary>({
    profileViews: 0,
    articlesCount: 0,
    articleViewsSum: 0,
    referencesCount: 0,
  });
  const [offersLoading, setOffersLoading] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [showNewOfferForm, setShowNewOfferForm] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDiscount, setNewOfferDiscount] = useState('');
  const [newOfferValidUntil, setNewOfferValidUntil] = useState('');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [offerToDelete, setOfferToDelete] = useState<PartnerOfferItem | null>(null);

  useEffect(() => {
    if (!loadingRole && !user) {
      onNavigate('login');
    }
  }, [loadingRole, user, onNavigate]);

  useEffect(() => {
    if (!currentPartner?.id) {
      setOffersList([]);
      setAnalytics({ profileViews: 0, articlesCount: 0, articleViewsSum: 0, referencesCount: 0 });
      return;
    }
    let cancelled = false;
    setOffersLoading(true);
    Promise.all([
      getPartnerOffers(currentPartner.id),
      getPartnerAnalytics(currentPartner.id),
    ])
      .then(([rows, stats]) => {
        if (!cancelled) {
          setOffersList(rows);
          setAnalytics(stats);
        }
      })
      .catch((err) => {
        console.warn('Partner adatok betöltése sikertelen:', err);
      })
      .finally(() => {
        if (!cancelled) setOffersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentPartner?.id]);

  useEffect(() => {
    if (!user) {
      setLoadingRole(false);
      return;
    }
    async function fetchMemberRole() {
      try {
        const isEdu = (category?: string | null, partnerType?: string | null) => {
          const cat = (category || '').toLowerCase();
          // P0-D15: explicit company categories take precedence over a stale/legacy educational partner_type
          if (cat === 'ceg' || cat === 'gyarto' || cat === 'kereskedo') {
            return false;
          }
          const type = (partnerType || '').toLowerCase();
          return (
            cat === 'iskola' ||
            cat === 'oktato' ||
            cat === 'oktatasi_intezmeny' ||
            type.includes('iskola') ||
            type.includes('oktatá') ||
            type.includes('intezmen') ||
            type.includes('intézmén')
          );
        };

        // 1. Query partner_users table first
        const { data: puData } = await supabase
          .from('partner_users')
          .select('partner_id, member_role')
          .eq('user_id', user!.id)
          .limit(1)
          .maybeSingle();

        if (puData) {
          setMemberRole(puData.member_role);
          if (puData.partner_id) {
            const { data: pRec } = await supabase
              .from('partners')
              .select('*')
              .eq('id', puData.partner_id)
              .maybeSingle();

            if (pRec) {
              setCurrentPartner(pRec as Partner);
              if (isEdu(pRec.category, (pRec as ExtendedPartner).partner_type)) {
                setIsSchoolCategory(true);
              }
            }
          }
          return;
        }

        // 2. Fallback check: query active partner_invitations by user email
        if (user?.email) {
          const { data: invByEmail } = await supabase
            .from('partner_invitations')
            .select('code, partner_id, organization_category')
            .ilike('email', user.email.trim())
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .limit(1)
            .maybeSingle();

          if (invByEmail?.code) {
            try {
              const res = await acceptInvitation(invByEmail.code);
              if (res?.partner_id) {
                const { data: pRec } = await supabase
                  .from('partners')
                  .select('*')
                  .eq('id', res.partner_id)
                  .maybeSingle();

                setMemberRole(res.assigned_role || 'instructor');
                if (pRec) {
                  setCurrentPartner(pRec as Partner);
                  if (isEdu(pRec.category, (pRec as ExtendedPartner).partner_type)) {
                    setIsSchoolCategory(true);
                  } else if (isEdu(invByEmail.organization_category, null)) {
                    setIsSchoolCategory(true);
                  }
                }
                return;
              }
            } catch (err) {
              console.warn('Auto accept invitation notice:', err);
            }
          }

          // 3. Fallback check: query partners table by contact_email matching user.email
          const { data: partnerByEmail } = await supabase
            .from('partners')
            .select('*')
            .eq('contact_email', user.email)
            .limit(1)
            .maybeSingle();

          if (partnerByEmail) {
            setCurrentPartner(partnerByEmail as Partner);
            setMemberRole('owner');
            if (isEdu(partnerByEmail.category, (partnerByEmail as ExtendedPartner).partner_type)) {
              setIsSchoolCategory(true);
            }
            return;
          }

          // 4. Fallback check: query partner_applications by email
          const { data: appByEmail } = await supabase
            .from('partner_applications')
            .select('category')
            .eq('email', user.email)
            .limit(1)
            .maybeSingle();

          if (appByEmail && isEdu(appByEmail.category, null)) {
            setMemberRole('owner');
            setIsSchoolCategory(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Error fetching member role in App.tsx:', err);
      } finally {
        setLoadingRole(false);
      }
    }
    fetchMemberRole();
  }, [user]);

  const isTeacher =
    memberRole === 'instructor' ||
    profile?.role === 'teacher';
  const isSchoolAdmin = isSchoolCategory && (memberRole === 'owner' || memberRole === 'admin');

  if (loadingRole) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent" />
      </div>
    );
  }

  if (!loadingRole && !user) {
    return null;
  }

  if (isTeacher) {
    return (
      <PartnerLayout
        onNavigate={onNavigate}
        activeView={partnerView}
        onNavigateView={setPartnerView}
        memberRole={memberRole}
        isSchoolCategory={isSchoolCategory}
      >
        <TeacherDashboardPage
          activeView={partnerView}
          onNavigateView={setPartnerView}
          onNavigate={onNavigate}
        />
      </PartnerLayout>
    );
  }

  if (!currentPartner) {
    return (
      <PartnerLayout
        onNavigate={onNavigate}
        activeView={partnerView}
        onNavigateView={setPartnerView}
        memberRole={memberRole}
        isSchoolCategory={isSchoolCategory}
      >
        <div className="max-w-2xl mx-auto my-12 bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Nincs hozzárendelt partneri profil</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            A bejelentkezett felhasználói fiókhoz (<span className="text-white font-mono">{user?.email || 'azonosítatlan'}</span>) jelenleg nem található érvényes partnerkapcsolat az adatbázisban (<code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">partner_users</code>).
          </p>
          <p className="text-slate-400 text-xs">
            Amennyiben Ön szerződött partnercég képviselője, kérjük, vegye fel a kapcsolatot az ÉpítőTudás adminisztrációval a fiók összerendeléséhez.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Vissza a főoldalra
            </button>
          </div>
        </div>
      </PartnerLayout>
    );
  }

  const effectivePartner: Partner = currentPartner;

  return (
    <PartnerLayout
      onNavigate={onNavigate}
      activeView={partnerView}
      onNavigateView={setPartnerView}
      memberRole={memberRole}
      isSchoolCategory={isSchoolCategory}
    >
      {partnerView === 'dashboard' && (
        isSchoolAdmin ? (
          <PartnerSchoolProfilePage initialTab="overview" onNavigateView={setPartnerView} onNavigate={onNavigate} />
        ) : (
          <PartnerDashboardPage
            onNavigateView={setPartnerView}
            offersCount={offersList.filter((o) => o.status === 'Aktív').length}
            servicesCount={(effectivePartner as ExtendedPartner).services?.length || 0}
            profileViews={analytics.profileViews}
            articlesCount={analytics.articlesCount}
            isActive={(effectivePartner as ExtendedPartner & { is_active?: boolean }).is_active !== false && (effectivePartner as ExtendedPartner).status !== 'inactive' && (effectivePartner as ExtendedPartner).status !== 'draft'}
            isVerified={Boolean(effectivePartner.is_verified)}
          />
        )
      )}

      {partnerView === 'partner_profile' && (
        isSchoolAdmin ? (
          <PartnerSchoolProfilePage initialTab="profile" onNavigateView={setPartnerView} onNavigate={onNavigate} />
        ) : (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl border border-blue-500/30 p-1 flex items-center justify-center shrink-0 overflow-hidden ${(effectivePartner as ExtendedPartner).logo_bg === 'white'
                      ? 'bg-white'
                      : (effectivePartner as ExtendedPartner).logo_bg === 'light_gray'
                        ? 'bg-gray-200'
                        : 'bg-blue-500/10'
                      }`}
                  >
                    {effectivePartner.logo_url ? (
                      <img
                        src={effectivePartner.logo_url}
                        alt={effectivePartner.name}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <Building2 className="w-7 h-7 text-blue-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                        {effectivePartner.category || 'Partner Vállalkozás'}
                      </span>
                      {effectivePartner.is_verified && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Hitelesített partner
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                      {effectivePartner.name}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      {effectivePartner.description || 'Minősített partnerprofil az ÉpítőTudás platformon.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigate('partner-detail', { slug: effectivePartner.slug })}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Nyilvános profil megnyitása
                  </button>
                  <button
                    onClick={() => setIsEditorOpen(true)}
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    Profil adatlap szerkesztése
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Overview Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" /> Kapcsolattartási Információk
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Kapcsolati e-mail:</span>
                    <span className="font-semibold text-white">{user?.email || 'Nincs megadva'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Weboldal:</span>
                    <span className="font-semibold text-blue-400 truncate max-w-[160px]">{effectivePartner.website_url || 'Nincs megadva'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Státusz:</span>
                    <span className={`font-bold ${(effectivePartner as ExtendedPartner & { is_active?: boolean }).is_active === false ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {(effectivePartner as ExtendedPartner & { is_active?: boolean }).is_active === false ? 'Inaktív / Függőben' : effectivePartner.is_verified ? 'Aktív & Hitelesített' : 'Aktív'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" /> Tartalom &amp; Termékek
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Feltöltött termékek:</span>
                    <span className="font-semibold text-white">Anyag- és gépkatalógusban</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Szakmai cikkek:</span>
                    <span className="font-semibold text-white">Beépítési útmutatók</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Akciók &amp; kedvezmények:</span>
                    <span className="font-bold text-accent">Kezelhető a menüből</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Minőségbiztosítás &amp; Jogok
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Partner típus:</span>
                    <span className="font-semibold text-white">{effectivePartner.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Hozzáférési szint:</span>
                    <span className="font-semibold text-white">Vállalati Partner</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Adatvédelem:</span>
                    <span className="font-semibold text-slate-400">GDPR &amp; MSZ konform</span>
                  </div>
                </div>
              </div>
            </div>

            {isEditorOpen && (
              <Suspense fallback={<PageFallback />}>
                <PartnerEditorModal
                  partner={effectivePartner as ExtendedPartner}
                  isOpen={isEditorOpen}
                  onClose={() => setIsEditorOpen(false)}
                  onSave={async (data) => {
                    if (!effectivePartner?.id) {
                      throw new Error('Nincs érvényes partnerazonosító a mentéshez.');
                    }
                    try {
                      const updated = await updatePartner(effectivePartner.id, {
                        ...effectivePartner,
                        ...data,
                      } as Parameters<typeof updatePartner>[1]);
                      setCurrentPartner(updated);
                      setTimeout(() => {
                        setIsEditorOpen(false);
                      }, 1500);
                    } catch (err) {
                      console.error('Save partner error:', err);
                      throw err;
                    }
                  }}
                />
              </Suspense>
            )}
          </div>
        )
      )}

      {partnerView === 'partner_offers' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" /> Saját Ajánlatok
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                Saját Ajánlatok &amp; Kedvezményes Akciók
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
                Kezeld és hirdesd meg céged exkluzív építőipari ajánlatait, szakember kedvezményeit és promócióit a platform látogatói számára.
              </p>
            </div>
            <button
              onClick={() => {
                if (showNewOfferForm) {
                  setShowNewOfferForm(false);
                  setEditingOfferId(null);
                  setNewOfferTitle('');
                  setNewOfferDiscount('');
                  setNewOfferValidUntil('');
                  setNewOfferDesc('');
                } else {
                  setEditingOfferId(null);
                  setShowNewOfferForm(true);
                }
              }}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer self-start md:self-center"
            >
              <PlusCircle className="w-4 h-4" />
              {showNewOfferForm ? 'Mégse' : 'Új ajánlat feladása'}
            </button>
          </div>

          {showNewOfferForm && (
            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white">
                {editingOfferId ? 'Promóciós ajánlat szerkesztése' : 'Új promóciós ajánlat létrehozása'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Ajánlat címe (pl. 10% Tavaszi Homlokzatszigetelés Akció)"
                  value={newOfferTitle}
                  onChange={(e) => setNewOfferTitle(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Kedvezmény mértéke (pl. 10% vagy Ajándék szállítás)"
                  value={newOfferDiscount}
                  onChange={(e) => setNewOfferDiscount(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Érvényesség (pl. 2026.12.31 vagy Visszavonásig)"
                  value={newOfferValidUntil}
                  onChange={(e) => setNewOfferValidUntil(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500"
                />
              </div>
              <textarea
                placeholder="Részletes leírás, feltételek, érvényesség..."
                value={newOfferDesc}
                onChange={(e) => setNewOfferDesc(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 min-h-[80px]"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowNewOfferForm(false);
                    setEditingOfferId(null);
                    setNewOfferTitle('');
                    setNewOfferDiscount('');
                    setNewOfferValidUntil('');
                    setNewOfferDesc('');
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  disabled={savingOffer || !newOfferTitle.trim()}
                  onClick={async () => {
                    if (!newOfferTitle.trim() || !effectivePartner?.id) return;
                    setSavingOffer(true);
                    try {
                      if (editingOfferId) {
                        const updated = await updatePartnerOffer(editingOfferId, {
                          title: newOfferTitle.trim(),
                          discount: newOfferDiscount.trim() || 'Kiemelt ajánlat',
                          valid_until: newOfferValidUntil.trim() || 'Visszavonásig',
                          description: newOfferDesc.trim() || 'Partneri ajánlat.',
                        });
                        setOffersList((prev) => prev.map((item) => (item.id === editingOfferId ? updated : item)));
                        toast.success('Ajánlat sikeresen frissítve!');
                      } else {
                        const created = await createPartnerOffer({
                          partner_id: effectivePartner.id,
                          title: newOfferTitle.trim(),
                          discount: newOfferDiscount.trim() || 'Kiemelt ajánlat',
                          valid_until: newOfferValidUntil.trim() || 'Visszavonásig',
                          description: newOfferDesc.trim() || 'Partneri ajánlat.',
                          status: 'Aktív',
                          created_by: user?.id ?? null,
                        });
                        setOffersList((prev) => [created, ...prev]);
                        toast.success('Ajánlat sikeresen mentve és közzétéve!');
                      }
                      setNewOfferTitle('');
                      setNewOfferDiscount('');
                      setNewOfferValidUntil('');
                      setNewOfferDesc('');
                      setEditingOfferId(null);
                      setShowNewOfferForm(false);
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : 'Hiba történt az ajánlat mentése során.');
                    } finally {
                      setSavingOffer(false);
                    }
                  }}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {savingOffer
                    ? 'Mentés...'
                    : editingOfferId
                      ? 'Módosítások mentése'
                      : 'Ajánlat mentése & közzététele'}
                </button>
              </div>
            </div>
          )}

          {offersLoading ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
              Ajánlatok betöltése...
            </div>
          ) : offersList.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-300">Még nincs rögzített partneri ajánlat.</p>
              <p className="text-xs text-slate-500">
                Kattints az „Új ajánlat feladása” gombra első kedvezményed vagy promóciód közzétételéhez.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offersList.map((off) => (
                <div key={off.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-0.5 rounded-full">
                        {off.discount}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold flex items-center gap-1 ${off.status === 'Aktív' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {off.status}
                        </span>
                        <button
                          type="button"
                          title={off.status === 'Aktív' ? 'Szüneteltetés' : 'Aktiválás'}
                          onClick={async () => {
                            const nextStatus = off.status === 'Aktív' ? 'Szüneteltetve' : 'Aktív';
                            try {
                              const updated = await updatePartnerOffer(off.id, { status: nextStatus });
                              setOffersList((prev) => prev.map((item) => (item.id === off.id ? updated : item)));
                              toast.success(`Ajánlat állapota frissítve: ${nextStatus}`);
                            } catch (err: unknown) {
                              toast.error(err instanceof Error ? err.message : 'Hiba történt az állapot módosításakor.');
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          {off.status === 'Aktív' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          title="Ajánlat szerkesztése"
                          onClick={() => {
                            setEditingOfferId(off.id);
                            setNewOfferTitle(off.title);
                            setNewOfferDiscount(off.discount);
                            setNewOfferValidUntil(off.valid_until);
                            setNewOfferDesc(off.description);
                            setShowNewOfferForm(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Ajánlat törlése"
                          onClick={() => setOfferToDelete(off)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-white">{off.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{off.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Érvényes: {off.valid_until}</span>
                    <button
                      onClick={() => onNavigate('partner-detail', { slug: effectivePartner.slug })}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Megtekintés az adatlapon <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ConfirmDialog
            open={!!offerToDelete}
            title="Ajánlat törlése"
            message={`Biztosan törölni szeretnéd a(z) „${offerToDelete?.title || ''}” ajánlatot?`}
            confirmLabel="Törlés"
            destructive
            onCancel={() => setOfferToDelete(null)}
            onConfirm={async () => {
              if (!offerToDelete) return;
              try {
                await deletePartnerOffer(offerToDelete.id);
                setOffersList((prev) => prev.filter((item) => item.id !== offerToDelete.id));
                toast.success('Ajánlat törölve.');
              } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Hiba történt az ajánlat törlése során.');
              } finally {
                setOfferToDelete(null);
              }
            }}
          />
        </div>
      )}

      {partnerView === 'partner_products' && (
        <Suspense fallback={<PageFallback />}>
          <PartnerMaterialsPage
            currentPartner={effectivePartner}
            onNavigateHome={() => setPartnerView('dashboard')}
          />
        </Suspense>
      )}

      {partnerView === 'catalog' && (
        <Suspense fallback={<PageFallback />}>
          <AdminToolsPage initialSearchQuery={effectivePartner.name} readOnly />
        </Suspense>
      )}

      {partnerView === 'partner_articles' && (
        <Suspense fallback={<PageFallback />}>
          <PartnerArticlesPage
            currentPartner={effectivePartner}
            onNavigate={onNavigate}
          />
        </Suspense>
      )}

      {partnerView === 'partner_learning' && (
        <Suspense fallback={<PageFallback />}>
          <PartnerLearningPage partnerId={effectivePartner.id} partnerName={effectivePartner.name} />
        </Suspense>
      )}

      {partnerView === 'partner_stats' && (
        <div className="space-y-6 sm:space-y-8 animate-fadeIn">
          <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                <BarChart3 className="w-3.5 h-3.5" /> Elemzések &amp; Teljesítmény
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                Partneri Forgalom és Érdeklődés
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
                Kövesd nyomon valós időben, hány látogató, kivitelező és szakképző intézmény tekinti meg a profilodat, termékeidet és szakmai cikkeidet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Profil Megtekintések</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">{analytics.profileViews}</span>
                <span className="text-[11px] font-semibold text-emerald-400">
                  Élő számláló
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Közvetlen látogatók a partner adatlapon</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Aktív Ajánlatok</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">
                  {offersList.filter((o) => o.status === 'Aktív').length}
                </span>
                <span className="text-[11px] font-semibold text-blue-400">
                  Összesen: {offersList.length} db
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Publikált kedvezményes promóciók</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Szakmai Cikk Olvasottság</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">{analytics.articleViewsSum}</span>
                <span className="text-[11px] font-semibold text-amber-400">
                  {analytics.articlesCount} cikk
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Útmutatók és technológiai bejegyzések</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Publikált Referenciák</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-white">{analytics.referencesCount} db</span>
                <span className="text-[11px] font-semibold text-emerald-400">
                  Adatbázisból
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Feltöltött projekt referenciák</p>
            </div>
          </div>
        </div>
      )}
    </PartnerLayout>
  );
}

function AppContent() {
  const { user, loading, authEvent } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageKey>(getInitialPage);
  const [notFoundRoute, setNotFoundRoute] = useState<boolean>(isUnknownHashRoute);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(getInitialArticleSlug);
  const [selectedPartnerSlug, setSelectedPartnerSlug] = useState<string | null>(getInitialPartnerSlug);
  const [selectedCourseSlug, setSelectedCourseSlug] = useState<string>(getInitialCourseSlug);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(getInitialQuizId);
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
    void fetchRolePermissionsFromCloud();

    window.addEventListener('site-settings-changed', handleSettingsChange);
    window.addEventListener('hero-config-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('site-settings-changed', handleSettingsChange);
      window.removeEventListener('hero-config-changed', handleSettingsChange);
    };
  }, [authEvent]);

  useEffect(() => {
    const baseTitle = siteSettings.siteTitle || 'ÉpítőTudás';
    const pageTitleMap: Partial<Record<PageKey, string>> = {
      home: baseTitle,
      tudastar: `Tudástár — ${baseTitle}`,
      category: `Tudástár — ${baseTitle}`,
      article: `Szakmai Cikk — ${baseTitle}`,
      glossary: `Építőipari Fogalomtár — ${baseTitle}`,
      tool: `Gép & Szerszám Katalógus — ${baseTitle}`,
      valaszto: `Eszközválasztó — ${baseTitle}`,
      materials: `Építőanyagok — ${baseTitle}`,
      software: `Szoftver Katalógus — ${baseTitle}`,
      books: `Szakmai Könyvek — ${baseTitle}`,
      calculations: `Műszaki Kalkulátorok — ${baseTitle}`,
      safety: `Munkavédelem — ${baseTitle}`,
      standards: `Szabványok & Előírások — ${baseTitle}`,
      courses: `Tanfolyamok & Képzések — ${baseTitle}`,
      'course-detail': `Tanfolyam Részletek — ${baseTitle}`,
      'quiz-player': `Tudáspróba — ${baseTitle}`,
      learning: `Tanulási Központ — ${baseTitle}`,
      'learning-paths': `Tanulási Útvonalak — ${baseTitle}`,
      paths: `Szakmai Útvonalak — ${baseTitle}`,
      careers: `Építőipari Karrier — ${baseTitle}`,
      partners: `Partnerek — ${baseTitle}`,
      'partner-detail': `Partner Adatlap — ${baseTitle}`,
      'partner-application': `Partner Jelentkezés — ${baseTitle}`,
      about: `Rólunk — ${baseTitle}`,
      jogi: `Jogi Információk — ${baseTitle}`,
      impressum: `Impresszum — ${baseTitle}`,
      privacy: `Adatvédelmi Tájékoztató — ${baseTitle}`,
      terms: `Felhasználási Feltételek — ${baseTitle}`,
      cookies: `Süti Tájékoztató — ${baseTitle}`,
      profile: `Profilom — ${baseTitle}`,
      login: `Bejelentkezés — ${baseTitle}`,
      register: `Regisztráció — ${baseTitle}`,
      'verify-email': `Email Megerősítés — ${baseTitle}`,
      'forgot-password': `Elfelejtett Jelszó — ${baseTitle}`,
      'reset-password': `Új Jelszó Beállítása — ${baseTitle}`,
      admin: `Adminisztráció — ${baseTitle}`,
      szerkeszto: `Szerkesztői Panel — ${baseTitle}`,
      partner: `Partner Panel — ${baseTitle}`,
      teacher: `Oktatói Panel — ${baseTitle}`,
    };
    const pageDescMap: Partial<Record<PageKey, string>> = {
      glossary: 'Építőipari szakmai fogalomtár és szakszótár gyakorlati magyarázatokkal.',
      calculations: 'Építőipari kalkulátorok: hőszigetelés, falazat, tetőfedés, festés, térkő, padlófűtés és kábelméretezés.',
      tool: 'Építőipari gépek, szerszámok és berendezések szakmai katalógusa és összehasonlítása.',
      materials: 'Építőipari alapanyagok, hőszigetelők, habarcsok és szerkezeti anyagok adatbázisa.',
      courses: 'Építőipari online képzések, tananyagok és szakmai vizsgafelkészítők.',
      careers: 'Építőipari állásajánlatok, szakmai gyakorlatok és karrierlehetőségek.',
      partners: 'Minősített építőipari gyártók, kivitelezők és szakmai partnerek.',
      safety: 'Munkavédelmi előírások, egyéni védőeszközök és biztonságos építkezési útmutatók.',
      standards: 'Építőipari szabványok, műszaki irányelvek és jogszabályi követelmények.',
    };
    const resolvedTitle = pageTitleMap[currentPage] || baseTitle;
    if (currentPage !== 'article') {
      resetDefaultMetaTags(resolvedTitle, pageDescMap[currentPage]);
    } else {
      document.title = resolvedTitle;
    }
  }, [currentPage, siteSettings.siteTitle]);

  useEffect(() => {
    function handleHashChange() {
      const unknown = isUnknownHashRoute();
      setNotFoundRoute(unknown);
      const page = getInitialPage(false);
      setCurrentPage(page);
      const slug = getInitialArticleSlug();
      if (slug) {
        setSelectedArticleSlug(slug);
      }
      const partnerSlug = getInitialPartnerSlug();
      if (partnerSlug) {
        setSelectedPartnerSlug(partnerSlug);
      }
      const courseSlug = getInitialCourseSlug();
      if (courseSlug) {
        setSelectedCourseSlug(courseSlug);
      }
      const quizId = getInitialQuizId();
      if (quizId) {
        setSelectedQuizId(quizId);
      }
    }
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigate = (
    page: string,
    params?: { articleSlug?: string; partnerSlug?: string; slug?: string; quizId?: string }
  ) => {
    const rawTarget = normalizeHashRoute(page);
    const mainPage = rawTarget.split('?')[0].split('#')[0];
    const targetAnchor = rawTarget.includes('#') ? '#' + rawTarget.split('#')[1].split('?')[0] : '';
    const validPage = (ALL_VALID_PAGES.includes(mainPage as PageKey) ? mainPage : 'home') as PageKey;
    setNotFoundRoute(false);

    if (params?.articleSlug) {
      setSelectedArticleSlug(params.articleSlug);
      try {
        sessionStorage.setItem('epitotudas_article_slug', params.articleSlug);
      } catch (err) {
        void err;
      }
    }

    if (params?.partnerSlug || (params?.slug && validPage === 'partner-detail')) {
      const pSlug = params.partnerSlug || params.slug || null;
      setSelectedPartnerSlug(pSlug);
      try {
        if (pSlug) sessionStorage.setItem('epitotudas_partner_slug', pSlug);
      } catch (err) {
        void err;
      }
    }

    if (params?.slug && validPage !== 'partner-detail') {
      setSelectedCourseSlug(params.slug);
      try {
        sessionStorage.setItem('epitotudas_course_slug', params.slug);
      } catch (err) {
        void err;
      }
    }

    if (params?.quizId) {
      setSelectedQuizId(params.quizId);
      try {
        sessionStorage.setItem('epitotudas_quiz_id', params.quizId);
      } catch (err) {
        void err;
      }
    }

    setCurrentPage(validPage);

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('epitotudas_active_page', validPage);
        const targetHash =
          validPage === 'home'
            ? ''
            : validPage === 'partner-detail' && (params?.partnerSlug || params?.slug || selectedPartnerSlug)
              ? `#partnerek/${params?.partnerSlug || params?.slug || selectedPartnerSlug}`
              : validPage === 'course-detail' && (params?.slug || selectedCourseSlug)
                ? `#course-detail/${params?.slug || selectedCourseSlug}`
                : validPage === 'quiz-player' && (params?.quizId || selectedQuizId)
                  ? `#quiz-player/${params?.quizId || selectedQuizId}`
                  : params?.articleSlug
                    ? `#article?slug=${params.articleSlug}`
                    : rawTarget.includes('?') || rawTarget.includes('#')
                      ? `#${rawTarget}`
                      : `#${validPage}`;
        if (window.location.hash !== targetHash) {
          window.history.pushState(null, '', targetHash || window.location.pathname);
          window.dispatchEvent(new Event('hashchange'));
        }

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
      try {
        sessionStorage.removeItem('epitotudas_active_page');
      } catch {
        // ignore
      }
      const protectedPages: PageKey[] = ['profile', 'admin', 'szerkeszto', 'partner', 'teacher'];
      if (protectedPages.includes(currentPage)) {
        setCurrentPage('home');
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(null, '', '#/');
        }
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
    case 'teacher':
      return (
        <Suspense fallback={<PageFallback />}>
          <PartnerPanelContent onNavigate={navigate} />
        </Suspense>
      );
    case 'admin':
      return (
        <Suspense fallback={<PageFallback />}>
          <AdminLayout onNavigate={navigate}>
            {(view, userEmail, onNavigateView, searchQuery) => {
              if (view === 'dashboard') return <AdminDashboard userEmail={userEmail} onNavigateView={onNavigateView} />;
              if (view === 'moderation') return <AdminModerationPage />;
              if (view === 'articles') return <AdminArticlesPage initialSearchQuery={searchQuery} onNavigateView={onNavigateView} />;
              if (view === 'utmutatok') return <AdminGuidesPage initialSearchQuery={searchQuery} />;
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
              if (view === 'ads') return <AdminAdsPage onNavigate={navigate} onNavigateView={onNavigateView} />;
              if (view === 'knowledge-hub') return <AdminKnowledgeHubPage initialSearchQuery={searchQuery} />;
              if (view === 'materials') return <AdminMaterialsPage initialSearchQuery={searchQuery} />;
              if (view === 'audit') return <AdminAuditPage />;
              if (view === 'settings') return <AdminSettingsPage onNavigate={navigate} />;
              return <div className="p-8 text-gray-500 text-sm">A(z) "{view}" nézet hamarosan elérhető.</div>;
            }}
          </AdminLayout>
        </Suspense>
      );
    case 'szerkeszto':
      return (
        <Suspense fallback={<PageFallback />}>
          <EditorPanelContent onNavigate={navigate} />
        </Suspense>
      );
    case 'partner':
      return (
        <Suspense fallback={<PageFallback />}>
          <PartnerPanelContent onNavigate={navigate} />
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
      return <Suspense fallback={<PageFallback />}><PartnerApplicationPage onNavigate={navigate} /></Suspense>;
  }

  // Public routes with shared Header/Footer
  const renderPage = () => {
    if (notFoundRoute) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-background">
          <div className="max-w-md w-full bg-[#141414] border border-[#262626] rounded-2xl p-8 text-center space-y-5 shadow-xl">
            <div className="text-4xl font-black text-accent">404</div>
            <h1 className="text-xl font-bold text-white">Az oldal nem található</h1>
            <p className="text-sm text-gray-400">
              A keresett hivatkozás nem létezik vagy megváltozott.
            </p>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-primary font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Vissza a főoldalra
            </button>
          </div>
        </div>
      );
    }
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
      case 'partner-detail': return <PartnerDetailPage partnerSlug={selectedPartnerSlug} onNavigate={navigate} />;
      case 'courses': return <CoursesPage onNavigate={navigate} />;
      case 'careers': return <CareersPage onNavigate={navigate} />;
      case 'jogi': return <LegalHubPage onNavigate={navigate} />;
      case 'impressum': return <ImpressumPage onNavigate={navigate} />;
      case 'privacy': return <PrivacyPolicyPage onNavigate={navigate} />;
      case 'terms': return <TermsPage onNavigate={navigate} />;
      case 'cookies': return <CookiePolicyPage onNavigate={navigate} />;
      case 'profile': return <ProfilePage onNavigate={navigate} />;
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
        <ErrorBoundary onNavigateHome={() => navigate('home')}>
          <Suspense fallback={<PageFallback />}>
            {renderPage()}
          </Suspense>
        </ErrorBoundary>
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
