import { useState, useEffect, useMemo } from 'react';
import {
  User,
  GraduationCap,
  Building2,
  Bookmark,
  Clock,
  Sliders,
  HelpCircle,
  CheckCircle2,
  Edit,
  Save,
  Lock,
  Moon,
  Sun,
  Monitor,
  Download,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Sparkles,
  Search,
  Check,
  LayoutGrid,
  LayoutList,
  Trash2,
  ExternalLink,
  X,
  BookOpen,
  ShoppingBag,
  Eye,
  School,
  KeyRound,
  AlertCircle,
  Users,
  BarChart2,
  CheckSquare,
  Award,
  TrendingUp,
  FileText,
  Play,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getUserDetailedProfile, updateUserDetailedProfile, type UserDetailedProfile } from '../services/userProfileService';
import { getTradeItems } from '../services/tradeService';
import { deleteUser } from '../services/userService';
import { getSavedItems, removeSavedItem, type SavedItem } from '../services/bookmarkService';
import { glossaryJsonService, type GlossaryTermFromJson } from '../lib/glossaryJsonService';
import TermDetailModal from '../components/TermDetailModal';
import { useBooks, type BookItem } from '../services/bookService';
import BookCoverImage from '../components/BookCoverImage';
import { redeemStudentInvitationCode, getStudentCodeInfo } from '../services/partnerService';

function getMatchingBook(item: SavedItem, allBooks: BookItem[]): BookItem {
  const found = allBooks.find((b) => b.id === item.itemId || b.id === item.slug || b.title === item.title);
  if (found) return found;

  return {
    id: item.itemId,
    title: item.title,
    subtitle: item.subtitle || '',
    author: item.subtitle || 'Szakmai Szerző',
    publisher: 'Építőipari Kiadó',
    year: 2026,
    pages: 350,
    isbn: '978-963-16-0000-0',
    category: 'szerkezet',
    categoryLabel: item.subtitle || 'Szakkönyv',
    badge: 'Szakkönyv',
    badgeColor: 'amber',
    coverImage: item.imageUrl || '',
    coverImageUrl: item.imageUrl || '',
    downloadUrl: '#',
    format: 'Nyomtatott + PDF',
    description: item.description || '',
    tableOfContents: [],
    sampleExcerpt: '',
    rating: 5.0,
    reviewsCount: 1,
  };
}

interface ProfilePageProps {
  onNavigate?: (page: string, params?: { articleSlug?: string }) => void;
}

type MainSection = 'overview' | 'materials' | 'my-class' | 'progress' | 'tests' | 'school-link' | 'settings';
type SettingsSubTab = 'profile_data' | 'trade_profile' | 'notifications' | 'security' | 'appearance' | 'privacy';

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Kezdő', desc: 'Pályakezdő vagy alapszintű ismeretek' },
  { id: 'basic', label: 'Alapszintű', desc: 'Néhány év tapasztalat, alapvető feladatok' },
  { id: 'experienced', label: 'Gyakorlott', desc: 'Önálló munkavégzés, rutin feladatok' },
  { id: 'advanced', label: 'Haladó', desc: 'Összetett szerkezetek és technológiák' },
  { id: 'expert', label: 'Szakértő', desc: 'Mesterszintű tudás, művezetés / tanácsadás' },
];

const INTEREST_TOPICS = [
  'Anyagismeret',
  'Szerszámismeret',
  'Technológia',
  'Szerkezetek',
  'Szakmaalapok',
  'Számítások',
  'Munkavédelem',
  'Felületkezelés',
  'Hibakeresés',
  'Hibajavítás',
  'Új technológiák',
  'Szabványok és előírások',
];

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, profile: authProfile, signOut, updatePassword, updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserDetailedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isPartnerContact, setIsPartnerContact] = useState(false);

  useEffect(() => {
    async function checkPartnerContact() {
      if (!user) return;
      try {
        const isEdu = (category?: string | null, partnerType?: string | null) => {
          const cat = (category || '').toLowerCase();
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

        const { data: puData } = await supabase
          .from('partner_users')
          .select('partner_id, member_role')
          .eq('user_id', user.id);

        let isSchoolCat = false;
        if (puData && puData.length > 0) {
          for (const pu of puData) {
            if (pu.partner_id) {
              const { data: pRec } = await supabase
                .from('partners')
                .select('category, partner_type')
                .eq('id', pu.partner_id)
                .maybeSingle();

              if (pRec && isEdu(pRec.category, pRec.partner_type)) {
                isSchoolCat = true;
                break;
              }
            }
          }
        }

        const { data: partnerData } = await supabase
          .from('partners')
          .select('id, category, partner_type')
          .eq('contact_email', user.email);

        const { data: appData } = await supabase
          .from('partner_applications')
          .select('id, category')
          .eq('email', user.email);

        const userType = user.user_metadata?.user_type;
        const userRole = user.user_metadata?.role;

        const isInstructorRole =
          (isSchoolCat && puData?.some((p) => p.member_role === 'instructor' || p.member_role === 'member' || p.member_role === 'teacher')) ||
          userType === 'oktato';

        const isSchoolAdminRole =
          (isSchoolCat && puData?.some((p) => p.member_role === 'owner' || p.member_role === 'admin')) ||
          (partnerData && partnerData.some((p) => isEdu(p.category, p.partner_type))) ||
          userType === 'iskola';

        const isCommercialPartner =
          (puData && puData.some((p) => !isSchoolCat && (p.member_role === 'owner' || p.member_role === 'admin'))) ||
          (partnerData && partnerData.some((p) => !isEdu(p.category, p.partner_type))) ||
          (appData && appData.length > 0) ||
          userType === 'partner' ||
          userRole === 'partner' ||
          userRole === 'admin';

        if (isInstructorRole) setIsInstructor(true);
        if (isSchoolAdminRole || isCommercialPartner) setIsPartnerContact(true);
      } catch { }
    }
    checkPartnerContact();
  }, [user]);

  // Tab State Management
  const [activeMainSection, setActiveMainSection] = useState<MainSection>(() => {
    try {
      const hash = window.location.hash;
      if (hash.includes('tab=')) {
        const tab = hash.split('tab=')[1].split('&')[0];
        if (['overview', 'materials', 'my-class', 'progress', 'tests', 'school-link', 'settings'].includes(tab)) {
          return tab as MainSection;
        }
        if (tab === 'learning' || tab === 'saved') return 'materials';
        if (tab === 'history') return 'progress';
        if (tab === 'school_link' || tab === 'school-link') return 'school-link';
      }
    } catch { }
    return 'overview';
  });

  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsSubTab>('profile_data');

  // School Link & Class Code State
  const [classCodeInput, setClassCodeInput] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifiedCodeInfo, setVerifiedCodeInfo] = useState<any | null>(null);
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [classCodeMsg, setClassCodeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Classmates & Class Materials State
  const [classmates, setClassmates] = useState<any[]>([]);
  const [loadingClassmates, setLoadingClassmates] = useState(false);
  const [classMaterials, setClassMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Filters State
  const [materialsFilter, setMaterialsFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');
  const [materialsSearch, setMaterialsSearch] = useState('');
  const [testsFilter, setTestsFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  const loadStudentEnrollments = async () => {
    if (!user?.id) return;
    setLoadingEnrollments(true);
    try {
      const { data, error } = await supabase
        .from('school_students')
        .select('id, status, joined_at, trade_id, class_id, school:school_id(id, name), instructor:instructor_id(id, full_name), school_class:class_id(id, name, grade)')
        .eq('student_id', user.id)
        .order('joined_at', { ascending: false });

      if (!error && data) {
        setStudentEnrollments(data);
        if (data.length > 0 && data[0].class_id) {
          loadClassmates(data[0].class_id);
          loadClassMaterials(data[0].class_id);
        }
      }
    } catch (err) {
      console.warn('Error loading student enrollments:', err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const loadClassmates = async (classId: string) => {
    if (!classId) return;
    setLoadingClassmates(true);
    try {
      const { data } = await supabase
        .from('school_students')
        .select('id, joined_at, status, student_id, student:student_id(id, full_name)')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (data) setClassmates(data);
    } catch (err) {
      console.warn('Error loading classmates:', err);
    } finally {
      setLoadingClassmates(false);
    }
  };

  const loadClassMaterials = async (classId: string) => {
    if (!classId) return;
    setLoadingMaterials(true);
    try {
      const { data } = await supabase
        .from('class_materials')
        .select('id, created_at, material_id, material:material_id(id, title, description, category, type)')
        .eq('class_id', classId);

      if (data) setClassMaterials(data);
    } catch (err) {
      console.warn('Error loading class materials:', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadStudentEnrollments();
    }
  }, [user?.id]);

  const handleVerifyClassCode = async () => {
    if (!classCodeInput.trim()) return;
    setVerifyingCode(true);
    setClassCodeMsg(null);
    setVerifiedCodeInfo(null);
    try {
      const info = await getStudentCodeInfo(classCodeInput.trim());
      if (info.valid) {
        setVerifiedCodeInfo(info);
      } else {
        setClassCodeMsg({ type: 'error', text: info.error || 'A megadott osztálykód érvénytelen vagy lejárt.' });
      }
    } catch (err: any) {
      setClassCodeMsg({ type: 'error', text: err.message || 'Hiba történt a kód ellenőrzésekor.' });
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleRedeemClassCode = async () => {
    if (!classCodeInput.trim()) return;
    setRedeemingCode(true);
    setClassCodeMsg(null);
    try {
      const res = await redeemStudentInvitationCode(classCodeInput.trim());
      const msg = res.message || (res.already_enrolled
        ? `Ön már csatlakozott a(z) ${res.class_name || 'kiválasztott'} osztályhoz!`
        : `Sikeresen csatlakoztál a(z) ${res.class_name || 'kiválasztott'} osztályhoz!`);
      setClassCodeMsg({ type: 'success', text: msg });
      setClassCodeInput('');
      setVerifiedCodeInfo(null);
      await loadStudentEnrollments();
    } catch (err: any) {
      setClassCodeMsg({ type: 'error', text: err.message || 'A csatlakozás nem sikerült. Ellenőrizze az osztálykódot!' });
    } finally {
      setRedeemingCode(false);
    }
  };

  // Sync tab state dynamically on hashchange / popstate
  useEffect(() => {
    function handleTabSync() {
      try {
        const hash = window.location.hash;
        if (hash.includes('tab=')) {
          const tab = hash.split('tab=')[1].split('&')[0];
          if (['overview', 'materials', 'my-class', 'progress', 'tests', 'school-link', 'settings'].includes(tab)) {
            setActiveMainSection(tab as MainSection);
          } else if (tab === 'learning' || tab === 'saved') {
            setActiveMainSection('materials');
          } else if (tab === 'history') {
            setActiveMainSection('progress');
          } else if (tab === 'school_link' || tab === 'school-link') {
            setActiveMainSection('school-link');
          } else if (['profile_data', 'trade_profile', 'notifications', 'security', 'appearance', 'privacy'].includes(tab)) {
            setActiveMainSection('settings');
            setActiveSettingsTab(tab as SettingsSubTab);
          }
        }
      } catch { }
    }

    handleTabSync();
    window.addEventListener('hashchange', handleTabSync);
    window.addEventListener('popstate', handleTabSync);
    return () => {
      window.removeEventListener('hashchange', handleTabSync);
      window.removeEventListener('popstate', handleTabSync);
    };
  }, []);

  // Mentéseim (Saved Items) State
  const allBooks = useBooks();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedFilter, setSavedFilter] = useState<'all' | 'article' | 'glossary' | 'book'>('all');
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [selectedSavedTerm, setSelectedSavedTerm] = useState<GlossaryTermFromJson | null>(null);
  const [savedTermModalOpen, setSavedTermModalOpen] = useState(false);
  const [selectedSavedBook, setSelectedSavedBook] = useState<BookItem | null>(null);

  useEffect(() => {
    setSavedItems(getSavedItems(user?.id));
  }, [user, activeMainSection]);

  const filteredSavedItems = useMemo(() => {
    return savedItems.filter((item) => {
      const matchesFilter = savedFilter === 'all' || item.itemType === savedFilter;
      const matchesSearch =
        !savedSearchQuery.trim() ||
        item.title.toLowerCase().includes(savedSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(savedSearchQuery.toLowerCase())) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(savedSearchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [savedItems, savedFilter, savedSearchQuery]);

  const handleRemoveSaved = (item: SavedItem) => {
    const updated = removeSavedItem(user?.id, item.itemId, item.itemType);
    setSavedItems(updated);
  };

  const handleOpenSavedItem = async (item: SavedItem) => {
    if (item.itemType === 'article') {
      if (onNavigate) {
        onNavigate('article', { articleSlug: item.slug });
      } else {
        window.location.hash = `#article?slug=${item.slug}`;
      }
    } else if (item.itemType === 'glossary') {
      try {
        const terms = await glossaryJsonService.getAllTerms();
        const found = terms.find((t) => t.id === item.itemId || t.slug === item.slug || t.term === item.title);
        if (found) {
          setSelectedSavedTerm(found);
          setSavedTermModalOpen(true);
        } else {
          if (onNavigate) onNavigate('glossary');
          window.location.hash = `#glossary?q=${encodeURIComponent(item.title)}`;
        }
      } catch {
        if (onNavigate) onNavigate('glossary');
      }
    } else if (item.itemType === 'book') {
      const bookObj = getMatchingBook(item, allBooks);
      setSelectedSavedBook(bookObj);
    }
  };

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');

  // Password reset modal state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState({
    systemMessages: true,
    learningReminders: true,
    newArticles: true,
    newCourses: false,
    newsletters: true,
  });

  // Delete account state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handleDeleteAccount() {
    if (!user) return;
    try {
      setDeletingAccount(true);
      await deleteUser(user.id);
      try {
        localStorage.removeItem(`epitotudas_user_pref_${user.id}`);
      } catch { }
      await signOut();
      if (onNavigate) onNavigate('home');
    } catch (err) {
      console.error('Hiba a fiók törlésekor:', err);
      await signOut();
      if (onNavigate) onNavigate('home');
    } finally {
      setDeletingAccount(false);
      setDeleteModalOpen(false);
    }
  }

  // Available Trades List
  const availableTrades = useMemo(() => {
    try {
      const items = getTradeItems();
      return items.map((t) => t.name);
    } catch {
      return ['Ács', 'Asztalos', 'Burkoló', 'Festő-mázoló', 'Kőműves', 'Villanyszerelő', 'Víz- és fűtésszerelő', 'Épületgépész', 'Tetőfedő', 'Egyéb'];
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const userType = user.user_metadata?.user_type;
        const initialName = authProfile?.full_name || user.user_metadata?.full_name;
        const data = await getUserDetailedProfile(user.id, user.email, initialName, 'user', userType);
        setProfile(data);
        setFullName(data.fullName || initialName || '');

        const isPartnerOrOktato = isPartnerContact || userType === 'partner' || userType === 'oktato' || userType === 'iskola';
        const effectiveSpecialization = isPartnerOrOktato
          ? (data.specialization === 'Tanuló' ? '' : (data.specialization || ''))
          : (userType === 'tanulo' && (!data.specialization || data.specialization === 'Építőipari Szakember'))
            ? 'Tanuló'
            : (data.specialization || '');
        setSpecialization(effectiveSpecialization);
        setCompanyName(data.companyName || '');

        const effectiveBio = (userType === 'tanulo' && (!data.bio || data.bio === 'Elhivatott építőipari szakember és a hazai tudásmegosztás aktív támogatója.'))
          ? 'Tanulni és fejlődni vágyó diák.'
          : (data.bio || '');
        setBio(effectiveBio);

        try {
          const storedPref = localStorage.getItem(`epitotudas_user_pref_${user.id}`);
          if (storedPref) {
            const parsed = JSON.parse(storedPref);
            if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
            if (parsed.selectedInterests) setSelectedInterests(parsed.selectedInterests);
            if (parsed.notifications) setNotifications((prev) => ({ ...prev, ...parsed.notifications }));
          }
        } catch { }
      } catch (err) {
        setErrorMsg('Hiba történt a profil adatok betöltésekor.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, authProfile]);

  const missingCount = useMemo(() => {
    let missing = 0;
    if (!fullName.trim()) missing++;
    if (!user?.email) missing++;
    if (!specialization.trim()) missing++;
    if (!experienceLevel) missing++;
    if (selectedInterests.length === 0) missing++;
    return missing;
  }, [fullName, user, specialization, experienceLevel, selectedInterests]);

  async function handleSaveProfile() {
    if (!user || !profile) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const userType = user.user_metadata?.user_type;
      const targetSpecialization = (userType === 'tanulo' && (!specialization.trim() || specialization === 'Építőipari Szakember'))
        ? 'Tanuló'
        : specialization;

      const trimmedName = fullName.trim();

      if (trimmedName && trimmedName !== (authProfile?.full_name || '')) {
        const authRes = await updateProfile({ full_name: trimmedName });
        if (authRes.error) {
          console.warn('Hiba az auth profil frissítésekor:', authRes.error);
        }
      }

      const updated = await updateUserDetailedProfile(user.id, {
        fullName: trimmedName,
        specialization: targetSpecialization,
        companyName,
        bio,
        userType,
      });

      const prefData = {
        experienceLevel,
        selectedInterests,
        notifications,
      };
      localStorage.setItem(`epitotudas_user_pref_${user.id}`, JSON.stringify(prefData));

      setProfile(updated);
      setSpecialization(updated.specialization || targetSpecialization);
      if (updated.bio) setBio(updated.bio);
      setSuccessMsg('A beállítások sikeresen mentve lettek!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrorMsg('Nem sikerült a beállítások mentése.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'A jelszónak legalább 8 karakterből kell állnia.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'A két jelszó nem egyezik meg.' });
      return;
    }

    setPasswordSaving(true);
    const res = await updatePassword(newPassword);
    setPasswordSaving(false);

    if (res.error) {
      setPasswordMsg({ type: 'error', text: res.error });
    } else {
      setPasswordMsg({ type: 'success', text: 'A jelszavad sikeresen megváltozott!' });
      setNewPassword('');
      setConfirmPassword('');
    }
  }

  function toggleInterest(topic: string) {
    setSelectedInterests((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  function exportUserDataJSON() {
    if (!user || !profile) return;
    const exportData = {
      user_id: user.id,
      email: user.email,
      full_name: fullName,
      specialization,
      experience_level: experienceLevel,
      interests: selectedInterests,
      company: companyName,
      bio,
      created_at: profile.createdAt,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epitotudas_tanulo_adatok_${user.id.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeEnrollment = useMemo(() => {
    return studentEnrollments.length > 0 ? studentEnrollments[0] : null;
  }, [studentEnrollments]);

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-2" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* TANULÓ PANEL FEJLÉC */}
      <div className="bg-[#0C213E]/90 backdrop-blur-md border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-black text-2xl shadow-inner shrink-0">
              {(profile.fullName || user?.email || 'T').charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white truncate">Tanuló Panel</h1>
                <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-lg bg-[#4165b4]/20 text-[#60a5fa] border border-[#4165b4]/40 flex items-center gap-1.5">
                  <GraduationCap size={13} /> Tanuló
                </span>

                {missingCount === 0 ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Profil kész
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setActiveMainSection('settings');
                      setActiveSettingsTab('trade_profile');
                    }}
                    className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    <AlertTriangle size={13} /> Hiányzik {missingCount} adat
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-300 font-bold">{profile.fullName}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{profile.email}</p>

              {activeEnrollment && (
                <div className="pt-1 flex items-center gap-2 flex-wrap text-xs text-gray-300">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#162C4E] border border-[#234678] font-semibold text-blue-200 flex items-center gap-1.5">
                    <School size={12} className="text-accent" />
                    {activeEnrollment.school?.name || 'Iskola'} · {activeEnrollment.school_class?.name || 'Osztály'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            {isPartnerContact && (
              <button
                onClick={() => onNavigate?.('partner')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <Building2 size={16} /> Szervezeti Vezérlőpult
              </button>
            )}
            {isInstructor && (
              <button
                onClick={() => onNavigate?.('teacher')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <GraduationCap size={16} /> Tanári Vezérlőpult
              </button>
            )}
            <button
              onClick={() => {
                setActiveMainSection('settings');
                setActiveSettingsTab('profile_data');
              }}
              className="px-4 py-2.5 bg-[#162C4E] border border-[#234678] hover:border-accent/40 text-gray-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Sliders size={14} className="text-accent" /> Beállítások
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS / ERROR NOTICES */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-md">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-400 hover:text-white">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-950/60 border border-red-500/30 rounded-2xl text-red-300 text-xs font-bold flex items-center justify-between shadow-md">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-xs text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TANULÓ PANEL FŐ NAVIGÁCIÓ (7 DEDIKÁLT MENÜPONT) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0C213E] border border-[#1E3A64] rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveMainSection('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeMainSection === 'overview'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
        >
          <LayoutGrid size={15} /> Áttekintés
        </button>

        <button
          onClick={() => setActiveMainSection('materials')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeMainSection === 'materials'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
        >
          <BookOpen size={15} /> Tananyagaink
        </button>

        <button
          onClick={() => setActiveMainSection('my-class')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeMainSection === 'my-class'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
        >
          <Users size={15} /> Osztályom
        </button>

        <button
          onClick={() => setActiveMainSection('progress')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeMainSection === 'progress'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
        >
          <TrendingUp size={15} /> Haladásom
        </button>

        <button
          onClick={() => setActiveMainSection('tests')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeMainSection === 'tests'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
        >
          <CheckSquare size={15} /> Tesztek
        </button>

        <button
          onClick={() => setActiveMainSection('school-link')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeMainSection === 'school-link'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
        >
          <School size={15} /> Iskolai kapcsolat
        </button>

        <button
          onClick={() => setActiveMainSection('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeMainSection === 'settings'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
        >
          <Sliders size={15} /> Beállítások
        </button>
      </div>

      {/* 1. ÁTTEKINTÉS */}
      {activeMainSection === 'overview' && (
        <div className="space-y-6">
          {/* STATISZTIKAI CSEMPÉK */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#0C213E]/80 border border-[#1E3A64] p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Kiosztott Tananyag</span>
              <span className="text-2xl font-black text-white block">{classMaterials.length || 0}</span>
            </div>

            <div className="bg-[#0C213E]/80 border border-[#1E3A64] p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Folyamatban</span>
              <span className="text-2xl font-black text-amber-400 block">{classMaterials.length > 0 ? 1 : 0}</span>
            </div>

            <div className="bg-[#0C213E]/80 border border-[#1E3A64] p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Befejezett</span>
              <span className="text-2xl font-black text-emerald-400 block">0</span>
            </div>

            <div className="bg-[#0C213E]/80 border border-[#1E3A64] p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Előrehaladás</span>
              <span className="text-2xl font-black text-accent block">{classMaterials.length > 0 ? '15%' : '0%'}</span>
            </div>

            <div className="bg-[#0C213E]/80 border border-[#1E3A64] p-5 rounded-2xl col-span-2 md:col-span-1 space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Kitöltött Tesztek</span>
              <span className="text-2xl font-black text-blue-400 block">0</span>
            </div>
          </div>

          {/* AKTUÁLIS TANULÁSI ÁLLAPOT */}
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GraduationCap className="text-accent" size={20} /> Aktuális Tanulási Állapot
            </h3>

            {activeEnrollment ? (
              <div className="bg-[#081528] border border-[#1E3A64] p-6 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider">Aktív Osztály</span>
                    <h4 className="text-lg font-bold text-white">{activeEnrollment.school?.name || 'Iskola'}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Osztály: {activeEnrollment.school_class?.name || 'Nincs név'} ({activeEnrollment.school_class?.grade || '-'}. évfolyam) · Oktató: {activeEnrollment.instructor?.full_name || 'Nincs megadva'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveMainSection('materials')}
                    className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto"
                  >
                    <Play size={14} /> Tananyagok Megnyitása
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#1E3A64]/60">
                  <div className="flex justify-between text-xs text-gray-300">
                    <span>Általános előrehaladás:</span>
                    <span className="font-bold text-accent">15%</span>
                  </div>
                  <div className="w-full bg-[#162C4E] rounded-full h-2.5">
                    <div className="bg-accent h-2.5 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-[#081528] border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <School className="text-amber-400" size={16} /> Még nem csatlakoztál iskolai osztályhoz
                  </h4>
                  <p className="text-xs text-gray-400">
                    Adja meg az oktatójától kapott osztálykódot a tananyagokhoz és feladatokhoz való hozzáféréshez.
                  </p>
                </div>
                <button
                  onClick={() => setActiveMainSection('school-link')}
                  className="px-4 py-2.5 bg-accent hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Osztálykód Megadása
                </button>
              </div>
            )}
          </div>

          {/* LEGUTÓBBI AKTIVITÁS */}
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="text-blue-400" size={20} /> Legutóbbi Aktivitások
            </h3>

            <div className="space-y-3">
              {activeEnrollment ? (
                <div className="flex items-center gap-3 p-3.5 bg-[#081528] border border-[#1E3A64] rounded-xl text-xs">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div className="grow min-w-0">
                    <p className="text-white font-semibold">Sikeres iskolai csatlakozás</p>
                    <p className="text-gray-400 text-[11px]">{activeEnrollment.school?.name} · {activeEnrollment.school_class?.name}</p>
                  </div>
                  <span className="text-gray-500 text-[11px] shrink-0">
                    {new Date(activeEnrollment.joined_at || Date.now()).toLocaleDateString('hu-HU')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3.5 bg-[#081528] border border-[#1E3A64] rounded-xl text-xs text-gray-400">
                  <Clock size={16} className="text-gray-500 shrink-0" />
                  <span>Még nincs rögzített tanulási aktivitásod.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. TANANYAGAINK */}
      {activeMainSection === 'materials' && (
        <div className="space-y-6">
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <BookOpen className="text-accent" size={22} /> Tananyagaink Könyvtára
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Az osztályodhoz és képzésedhez kiosztott tananyagok, modulok és segédanyagok.
                </p>
              </div>

              {/* Szűrők */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setMaterialsFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${materialsFilter === 'all' ? 'bg-accent text-black' : 'bg-[#162C4E] text-gray-300 hover:text-white'}`}
                >
                  Összes
                </button>
                <button
                  onClick={() => setMaterialsFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${materialsFilter === 'in_progress' ? 'bg-accent text-black' : 'bg-[#162C4E] text-gray-300 hover:text-white'}`}
                >
                  Folyamatban
                </button>
                <button
                  onClick={() => setMaterialsFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${materialsFilter === 'completed' ? 'bg-accent text-black' : 'bg-[#162C4E] text-gray-300 hover:text-white'}`}
                >
                  Befejezett
                </button>
              </div>
            </div>

            {/* Kereső */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={materialsSearch}
                onChange={(e) => setMaterialsSearch(e.target.value)}
                placeholder="Tananyag keresése cím vagy témakör alapján..."
                className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>

            {/* Tananyag kártyák */}
            {classMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classMaterials.map((cm) => (
                  <div key={cm.id} className="bg-[#081528] border border-[#1E3A64] hover:border-accent/40 rounded-2xl p-5 space-y-4 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                          {cm.material?.category || 'Szakmai tananyag'}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{cm.material?.title || 'Cím nélkül'}</h4>
                      </div>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                        Folyamatban
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2">{cm.material?.description || 'Nincs leírás.'}</p>

                    <div className="pt-2 border-t border-[#1E3A64] flex items-center justify-between text-xs">
                      <span className="text-gray-500">Iskola: {activeEnrollment?.school?.name || 'Iskolámból'}</span>
                      <button
                        onClick={() => onNavigate?.('courses')}
                        className="px-3 py-1.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold rounded-lg transition-all flex items-center gap-1.5 text-xs cursor-pointer"
                      >
                        <Play size={12} /> Megnyitás
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-3 bg-[#081528] rounded-2xl border border-[#1E3A64]">
                <BookOpen size={40} className="mx-auto text-gray-500 opacity-60" />
                <h4 className="text-sm font-bold text-white">Még nincs kiosztott tananyagod</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Amint az oktatód tananyagot rendel az osztályodhoz, azok azonnal megjelennének itt.
                </p>
                <button
                  onClick={() => onNavigate?.('courses')}
                  className="px-4 py-2 bg-accent hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer mt-2"
                >
                  <Search size={14} /> Nyilvános Kurzusok Böngészése
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. OSZTÁLYOM */}
      {activeMainSection === 'my-class' && (
        <div className="space-y-6">
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="text-accent" size={22} /> Saját Osztályom
            </h3>

            {activeEnrollment ? (
              <div className="space-y-6">
                {/* Osztály info kártya */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#081528] border border-[#1E3A64] p-6 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Iskola & Osztály</span>
                    <h4 className="text-lg font-bold text-white">{activeEnrollment.school?.name}</h4>
                    <div className="space-y-1 text-xs text-gray-300">
                      <p><strong>Osztály:</strong> {activeEnrollment.school_class?.name}</p>
                      <p><strong>Évfolyam:</strong> {activeEnrollment.school_class?.grade || '-'}. évfolyam</p>
                    </div>
                  </div>

                  <div className="bg-[#081528] border border-[#1E3A64] p-6 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Oktató</span>
                    <h4 className="text-lg font-bold text-white">{activeEnrollment.instructor?.full_name || 'Nincs megadva'}</h4>
                    <p className="text-xs text-gray-400">Felelős szaktanár / oktató</p>
                  </div>
                </div>

                {/* Osztálytársak listája */}
                <div className="space-y-3 pt-4 border-t border-[#1E3A64]">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users size={16} className="text-blue-400" /> Osztálytársak ({classmates.length})
                  </h4>

                  {classmates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {classmates.map((c) => (
                        <div key={c.id} className="p-3 bg-[#081528] border border-[#1E3A64] rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0">
                            {(c.student?.full_name || 'D').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{c.student?.full_name || 'Tanuló'}</p>
                            <p className="text-[10px] text-gray-500">Csatlakozott: {new Date(c.joined_at).toLocaleDateString('hu-HU')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 bg-[#081528] p-4 rounded-xl border border-[#1E3A64]">
                      Még nem csatlakoztak más tanulók ehhez az osztályhoz.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4 bg-[#081528] rounded-2xl border border-[#1E3A64] p-6">
                <School size={48} className="mx-auto text-amber-400 opacity-80" />
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="text-base font-bold text-white">Még nem csatlakoztál osztályhoz</h4>
                  <p className="text-xs text-gray-400">
                    A tanárodtól kapott 6 jegyű osztálykóddal tudsz csatlakozni az osztályodhoz az Iskolai kapcsolat menüpontban.
                  </p>
                </div>
                <button
                  onClick={() => setActiveMainSection('school-link')}
                  className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <School size={15} /> Csatlakozás Osztálykóddal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. HALADÁSOM */}
      {activeMainSection === 'progress' && (
        <div className="space-y-6">
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <TrendingUp className="text-accent" size={22} /> Tanulási Haladásom
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#081528] border border-[#1E3A64] p-6 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Teljesítési Százalék</span>
                <div className="text-3xl font-black text-accent">{classMaterials.length > 0 ? '15%' : '0%'}</div>
                <div className="w-full bg-[#162C4E] rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: classMaterials.length > 0 ? '15%' : '0%' }} />
                </div>
              </div>

              <div className="bg-[#081528] border border-[#1E3A64] p-6 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Befejezett Modulok</span>
                <span className="text-2xl font-black text-white block">0 / {classMaterials.length || 0}</span>
                <p className="text-xs text-gray-400">Modulzárók teljesítve</p>
              </div>

              <div className="bg-[#081528] border border-[#1E3A64] p-6 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Teszt Átlageredmény</span>
                <span className="text-2xl font-black text-emerald-400 block">-</span>
                <p className="text-xs text-gray-400">Kitöltött tesztek átlaga</p>
              </div>
            </div>

            {/* Tananyagonkénti haladás */}
            <div className="space-y-3 pt-4 border-t border-[#1E3A64]">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 size={16} className="text-blue-400" /> Tananyagonkénti Részletek
              </h4>

              {classMaterials.length > 0 ? (
                <div className="space-y-3">
                  {classMaterials.map((cm) => (
                    <div key={cm.id} className="p-4 bg-[#081528] border border-[#1E3A64] rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white">{cm.material?.title || 'Tananyag'}</span>
                        <span className="text-accent font-bold">15%</span>
                      </div>
                      <div className="w-full bg-[#162C4E] rounded-full h-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-[#081528] rounded-xl border border-[#1E3A64] text-center text-xs text-gray-400">
                  Nincs megjeleníthető tananyag haladás.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. TESZTEK */}
      {activeMainSection === 'tests' && (
        <div className="space-y-6">
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <CheckSquare className="text-accent" size={22} /> Tesztek és Kvízek
            </h3>

            <div className="text-center py-12 space-y-4 bg-[#081528] rounded-2xl border border-[#1E3A64] p-6">
              <Award size={48} className="mx-auto text-blue-400 opacity-60" />
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-base font-bold text-white">Még nincs aktív teszted</h4>
                <p className="text-xs text-gray-400">
                  Az oktatód által kiosztott és a modulokhoz tartozó önellenőrző tesztek itt fognak megjelenni.
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('courses')}
                className="px-5 py-2.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Search size={14} /> Keresés a Tananyagok Között
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ISKOLAI KAPCSOLAT */}
      {activeMainSection === 'school-link' && (
        <div className="space-y-6">
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <School className="text-accent" size={22} /> Iskolai Kapcsolat és Osztálykód
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Kezeld az iskolai és tanulói kapcsolataidat, vagy csatlakozz új osztályhoz kód segítségével.
              </p>
            </div>

            {/* AKTUÁLIS KAPCSOLAT */}
            {activeEnrollment && (
              <div className="p-6 bg-[#081528] border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Aktív Iskolai Kapcsolat
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Csatlakozva: {new Date(activeEnrollment.joined_at).toLocaleDateString('hu-HU')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                  <div>
                    <span className="text-gray-400 block">Iskola:</span>
                    <strong className="text-white text-sm block mt-0.5">{activeEnrollment.school?.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Osztály:</span>
                    <strong className="text-white text-sm block mt-0.5">{activeEnrollment.school_class?.name} ({activeEnrollment.school_class?.grade}. évf.)</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Oktató:</span>
                    <strong className="text-white text-sm block mt-0.5">{activeEnrollment.instructor?.full_name || 'Nincs megadva'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* OSZTÁLYKÓDOS CSATLAKOZÁS FORM */}
            <div className="p-6 bg-[#081528] border border-[#1E3A64] rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound size={16} className="text-accent" /> Csatlakozás Új Osztályhoz
              </h4>
              <p className="text-xs text-gray-300">
                Írd be az oktatódtól kapott 6 karakteres csatlakozási kódot:
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="text"
                  value={classCodeInput}
                  onChange={(e) => {
                    setClassCodeInput(e.target.value.toUpperCase());
                    setVerifiedCodeInfo(null);
                    setClassCodeMsg(null);
                  }}
                  placeholder="Pl. ABC123"
                  maxLength={10}
                  className="bg-[#0C213E] border border-[#1E3A64] rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-gray-500 uppercase tracking-widest focus:outline-none focus:border-accent grow"
                />
                <button
                  type="button"
                  onClick={handleVerifyClassCode}
                  disabled={verifyingCode || !classCodeInput.trim()}
                  className="px-4 py-2.5 bg-[#162C4E] border border-[#234678] hover:border-accent text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
                >
                  {verifyingCode ? 'Ellenőrzés...' : 'Kód Ellenőrzése'}
                </button>
              </div>

              {/* VERIFIED CODE PREVIEW CARD */}
              {verifiedCodeInfo && (
                <div className="p-4 bg-[#0C213E] border border-accent/40 rounded-xl space-y-3 animate-fade-in">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider block">Kód ellenőrizve ✓</span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <p><strong>Iskola:</strong> {verifiedCodeInfo.school_name}</p>
                    <p><strong>Osztály:</strong> {verifiedCodeInfo.class_name}</p>
                    <p><strong>Évfolyam:</strong> {verifiedCodeInfo.grade || '-'}</p>
                    <p><strong>Oktató:</strong> {verifiedCodeInfo.instructor_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRedeemClassCode}
                    disabled={redeemingCode}
                    className="w-full py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    {redeemingCode ? 'Csatlakozás...' : 'Csatlakozás az Osztályhoz'}
                  </button>
                </div>
              )}

              {classCodeMsg && (
                <div className={`p-3 rounded-xl text-xs font-bold ${classCodeMsg.type === 'success' ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300' : 'bg-red-950/60 border border-red-500/30 text-red-300'}`}>
                  {classCodeMsg.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. BEÁLLÍTÁSOK */}
      {activeMainSection === 'settings' && (
        <div className="space-y-6">
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Sliders className="text-accent" size={22} /> Fiók Beállítások
            </h3>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 border-b border-[#1E3A64] pb-3 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveSettingsTab('profile_data')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeSettingsTab === 'profile_data' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Személyes Adatok
              </button>
              <button
                onClick={() => setActiveSettingsTab('trade_profile')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeSettingsTab === 'trade_profile' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Szakmai Profil
              </button>
              <button
                onClick={() => setActiveSettingsTab('notifications')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeSettingsTab === 'notifications' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Értesítések
              </button>
              <button
                onClick={() => setActiveSettingsTab('security')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeSettingsTab === 'security' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Biztonság
              </button>
            </div>

            {/* SUBTAB 1: SZEMÉLYES ADATOK */}
            {activeSettingsTab === 'profile_data' && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Teljes Név</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">E-mail Cím</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#081528]/60 border border-[#1E3A64] rounded-xl px-4 py-2.5 text-xs text-gray-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Bemutatkozás / Biográfia</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save size={14} /> {saving ? 'Mentés...' : 'Beállítások Mentése'}
                </button>
              </div>
            )}

            {/* SUBTAB 2: SZAKMAI PROFIL */}
            {activeSettingsTab === 'trade_profile' && (
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Szakma / Szakterület</label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">Válassz szakmát...</option>
                    {availableTrades.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Tapasztalati Szint</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">Válassz szintet...</option>
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>{lvl.label} - {lvl.desc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Érdeklődési Körök</label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_TOPICS.map((topic) => {
                      const active = selectedInterests.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleInterest(topic)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${active ? 'bg-accent text-black font-bold' : 'bg-[#081528] border border-[#1E3A64] text-gray-300 hover:text-white'}`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 mt-4"
                >
                  <Save size={14} /> {saving ? 'Mentés...' : 'Szakmai Profil Mentése'}
                </button>
              </div>
            )}

            {/* SUBTAB 3: ÉRTESÍTÉSEK */}
            {activeSettingsTab === 'notifications' && (
              <div className="space-y-4 max-w-lg">
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-[#081528] border border-[#1E3A64] rounded-xl cursor-pointer">
                    <span className="text-xs font-semibold text-white">Tanulási emlékeztetők</span>
                    <input
                      type="checkbox"
                      checked={notifications.learningReminders}
                      onChange={(e) => setNotifications({ ...notifications, learningReminders: e.target.checked })}
                      className="rounded accent-accent"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-[#081528] border border-[#1E3A64] rounded-xl cursor-pointer">
                    <span className="text-xs font-semibold text-white">Rendszerüzenetek és frissítések</span>
                    <input
                      type="checkbox"
                      checked={notifications.systemMessages}
                      disabled
                      className="rounded accent-accent cursor-not-allowed"
                    />
                  </label>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save size={14} /> Értesítések Mentése
                </button>
              </div>
            )}

            {/* SUBTAB 4: BIZTONSÁG */}
            {activeSettingsTab === 'security' && (
              <div className="space-y-6 max-w-lg">
                <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock size={16} className="text-accent" /> Jelszó Módosítása
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Új Jelszó</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 karakter"
                      className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">Új Jelszó Megerősítése</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Új jelszó újra"
                      className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  {passwordMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${passwordMsg.type === 'success' ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300' : 'bg-red-950/60 border border-red-500/30 text-red-300'}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-5 py-2.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <KeyRound size={14} /> {passwordSaving ? 'Módosítás...' : 'Jelszó Módosítása'}
                  </button>
                </form>

                <div className="pt-6 border-t border-[#1E3A64] space-y-3">
                  <h4 className="text-sm font-bold text-white">Fiók Adatok Exportálása & Kezelése</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={exportUserDataJSON}
                      className="px-4 py-2 bg-[#162C4E] border border-[#234678] hover:border-accent text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Download size={14} /> Adatok letöltése (JSON)
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-4 py-2 bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Fiók Törlése
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0C213E] border border-red-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={28} />
              <h3 className="text-lg font-black text-white">Biztosan törölni szeretnéd a fiókodat?</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Ez a művelet végleges és nem visszavonható. Minden mentett adatóid és iskolai kapcsolataid törlésre kerülnek.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 bg-[#162C4E] text-gray-300 font-bold text-xs rounded-xl hover:text-white"
              >
                Mégse
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/20"
              >
                {deletingAccount ? 'Törlés...' : 'Igen, törlöm a fiókom'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOSSARY TERM DETAIL MODAL */}
      {selectedSavedTerm && (
        <TermDetailModal
          term={selectedSavedTerm}
          isOpen={savedTermModalOpen}
          onClose={() => {
            setSavedTermModalOpen(false);
            setSelectedSavedTerm(null);
          }}
        />
      )}
    </div>
  );
}
