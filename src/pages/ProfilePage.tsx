import { useState, useEffect, useMemo } from 'react';
import {
  User,
  GraduationCap,
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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDetailedProfile, updateUserDetailedProfile, type UserDetailedProfile } from '../services/userProfileService';
import { getTradeItems } from '../services/tradeService';
import { deleteUser } from '../services/userService';
import { getSavedItems, removeSavedItem, type SavedItem } from '../services/bookmarkService';
import { glossaryJsonService, type GlossaryTermFromJson } from '../lib/glossaryJsonService';
import TermDetailModal from '../components/TermDetailModal';

interface ProfilePageProps {
  onNavigate?: (page: string, params?: { articleSlug?: string }) => void;
}

type MainSection = 'overview' | 'learning' | 'saved' | 'history' | 'settings' | 'help';
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
  const { user, signOut, updatePassword } = useAuth();
  const [profile, setProfile] = useState<UserDetailedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab State
  const [activeMainSection, setActiveMainSection] = useState<MainSection>(() => {
    try {
      const hash = window.location.hash;
      if (hash.includes('tab=')) {
        const tab = hash.split('tab=')[1].split('&')[0];
        if (['overview', 'learning', 'saved', 'history', 'settings', 'help'].includes(tab)) {
          return tab as MainSection;
        }
      }
    } catch {}
    return 'overview';
  });

  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsSubTab>('profile_data');

  // Sync tab state dynamically on hashchange / popstate navigation
  useEffect(() => {
    function handleTabSync() {
      try {
        const hash = window.location.hash;
        if (hash.includes('tab=')) {
          const tab = hash.split('tab=')[1].split('&')[0];
          if (['overview', 'learning', 'saved', 'history', 'settings', 'help'].includes(tab)) {
            setActiveMainSection(tab as MainSection);
          } else if (['profile_data', 'trade_profile', 'notifications', 'security', 'appearance', 'privacy'].includes(tab)) {
            setActiveMainSection('settings');
            setActiveSettingsTab(tab as SettingsSubTab);
          }
        }
      } catch {}
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
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedFilter, setSavedFilter] = useState<'all' | 'article' | 'glossary'>('all');
  const [savedViewMode, setSavedViewMode] = useState<'grid' | 'list'>('grid');
  const [savedSearchQuery, setSavedSearchQuery] = useState('');
  const [selectedSavedTerm, setSelectedSavedTerm] = useState<GlossaryTermFromJson | null>(null);
  const [savedTermModalOpen, setSavedTermModalOpen] = useState(false);

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
          if (onNavigate) {
            onNavigate('glossary');
            window.location.hash = `#glossary?q=${encodeURIComponent(item.title)}`;
          } else {
            window.location.hash = `#glossary?q=${encodeURIComponent(item.title)}`;
          }
        }
      } catch {
        if (onNavigate) {
          onNavigate('glossary');
        }
      }
    }
  };

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');

  // Password reset modal inside Security
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications toggles state
  const [notifications, setNotifications] = useState({
    systemMessages: true, // Non-toggleable
    learningReminders: true,
    newArticles: true,
    newCourses: false,
    newsletters: true,
  });

  // Appearance state
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>('dark');

  // Delete account confirmation modal & process state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handleDeleteAccount() {
    if (!user) return;
    try {
      setDeletingAccount(true);
      await deleteUser(user.id);
      try {
        localStorage.removeItem(`epitotudas_user_pref_${user.id}`);
      } catch {}
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

  // Available Trades List from existing system
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
        const data = await getUserDetailedProfile(user.id, user.email, user.user_metadata?.full_name, 'user');
        setProfile(data);
        setFullName(data.fullName || '');
        setSpecialization(data.specialization || '');
        setCompanyName(data.companyName || '');
        setBio(data.bio || '');

        // Load stored local preferences if available
        try {
          const storedPref = localStorage.getItem(`epitotudas_user_pref_${user.id}`);
          if (storedPref) {
            const parsed = JSON.parse(storedPref);
            if (parsed.experienceLevel) setExperienceLevel(parsed.experienceLevel);
            if (parsed.selectedInterests) setSelectedInterests(parsed.selectedInterests);
            if (parsed.notifications) setNotifications((prev) => ({ ...prev, ...parsed.notifications }));
          }
        } catch {}
      } catch (err) {
        setErrorMsg('Hiba történt a profil adatok betöltésekor.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Profile Completion Percentage Calculation (Section 22)
  // Profile Completion Calculation (Subtle status badge)
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
      const updated = await updateUserDetailedProfile(user.id, {
        fullName,
        specialization,
        companyName,
        bio,
      });

      // Save additional preferences to localStorage safely
      const prefData = {
        experienceLevel,
        selectedInterests,
        notifications,
      };
      localStorage.setItem(`epitotudas_user_pref_${user.id}`, JSON.stringify(prefData));

      setProfile(updated);
      setSuccessMsg('A profil beállítások sikeresen mentve lettek!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      setErrorMsg('Nem sikerült a profil mentése.');
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
      trust_score: profile.trustProfile?.trustScore,
      created_at: profile.createdAt,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epitotudas_profil_adatok_${user.id.substring(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-2" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 4. FIÓKOM – PROFIL FEJLÉC & KÁRTYA */}
      <div className="bg-[#0C213E]/90 backdrop-blur-md border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-black text-2xl shadow-inner shrink-0">
              {(profile.fullName || user?.email || 'F').charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white truncate">{profile.fullName}</h1>
                <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-lg bg-accent/10 text-accent border border-accent/20">
                  {profile.role === 'admin' ? 'Adminisztrátor' : profile.role === 'editor' ? 'Szerkesztő' : 'Felhasználó'}
                </span>

                {/* Visszafogott 1-soros profil státusz */}
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

              <p className="text-sm text-gray-400 font-mono truncate">{profile.email}</p>

              {/* Szakma + Tapasztalat tag */}
              <div className="pt-1 flex items-center gap-2 flex-wrap text-xs text-gray-300">
                {specialization ? (
                  <span className="px-2.5 py-0.5 rounded-md bg-[#162C4E] border border-[#234678] font-semibold text-blue-200">
                    {specialization} {experienceLevel ? `· ${EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel)?.label || experienceLevel}` : ''}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setActiveMainSection('settings');
                      setActiveSettingsTab('trade_profile');
                    }}
                    className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1"
                  >
                    ⚠️ Állítsd be a szakmádat a személyre szabott tartalomhoz!
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <button
              onClick={() => {
                setActiveMainSection('settings');
                setActiveSettingsTab('profile_data');
              }}
              className="px-4 py-2.5 bg-[#162C4E] border border-[#234678] hover:border-accent/40 text-gray-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Edit size={14} className="text-accent" /> Profil szerkesztése
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
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

      {/* 20. PROFIL MENÜ FŐ KATEGÓRIÁK / STRUKTÚRA */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0C213E] border border-[#1E3A64] rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveMainSection('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeMainSection === 'overview'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <User size={15} /> Áttekintés
        </button>

        <button
          onClick={() => setActiveMainSection('learning')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeMainSection === 'learning'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <GraduationCap size={15} /> Tanulásom
        </button>

        <button
          onClick={() => setActiveMainSection('saved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeMainSection === 'saved'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark size={15} /> Mentéseim
        </button>

        <button
          onClick={() => setActiveMainSection('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeMainSection === 'history'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock size={15} /> Előzményeim
        </button>

        <button
          onClick={() => setActiveMainSection('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeMainSection === 'settings'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders size={15} /> Beállítások
        </button>

        <button
          onClick={() => setActiveMainSection('help')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeMainSection === 'help'
              ? 'bg-accent text-black shadow-md'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <HelpCircle size={15} /> Segítség
        </button>
      </div>

      {/* SECTION CONTENT SWITCHER */}
      {activeMainSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0C213E]/80 border border-[#1E3A64] p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Szakma</span>
              <span className="text-lg font-black text-white block">
                {specialization || 'Nincs beállítva'}
              </span>
            </div>

            <div className="bg-[#0C213E]/80 border border-[#1E3A64] p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Tapasztalati Szint</span>
              <span className="text-lg font-black text-accent block">
                {EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel)?.label || 'Nincs kiválasztva'}
              </span>
            </div>

            <div className="bg-[#0C213E]/80 border border-[#1E3A64] p-5 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Fiók Státusz</span>
              <span className="text-lg font-black text-emerald-400 block flex items-center gap-1.5">
                <CheckCircle2 size={18} /> Aktív Tag
              </span>
            </div>
          </div>

          {!specialization && (
            <div className="p-6 bg-[#0E2443] border border-amber-500/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-amber-400" /> Állítsd be a szakmádat!
                </h3>
                <p className="text-xs text-gray-300">
                  Segíts az ÉpítőTudásnak, hogy a te szakterületednek megfelelő releváns szakmai tartalmakat tudjon mutatni.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveMainSection('settings');
                  setActiveSettingsTab('trade_profile');
                }}
                className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                Szakma Beállítása
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. FIÓKOM – TANULÁSOM */}
      {activeMainSection === 'learning' && (
        <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-8 text-center space-y-4">
          <GraduationCap size={48} className="mx-auto text-blue-400 opacity-60" />
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Még nincs megkezdett tananyagod</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Böngéssz az ÉpítőTudás szakmai kurzusai és oktatási segédanyagai között a tudásod elmélyítéséhez.
            </p>
          </div>
          <button
            onClick={() => onNavigate?.('courses')}
            className="px-5 py-2.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Search size={14} /> Keress tananyagot
          </button>
        </div>
      )}

      {/* 6. MENTÉSEIM (FULL MANAGEMENT DASHBOARD) */}
      {activeMainSection === 'saved' && (
        <div className="space-y-6">
          {/* Header & Controls Bar */}
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <Bookmark className="text-accent" size={22} />
                  <span>Mentett Tartalmaim</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-accent font-bold">
                    {filteredSavedItems.length} elem
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Itt éred el az elmentett szakmai cikkeket és fogalomtári kifejezéseket.
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#142C4E] p-1 rounded-xl border border-[#234775] self-start md:self-auto">
                <button
                  onClick={() => setSavedViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    savedViewMode === 'grid'
                      ? 'bg-accent text-black font-extrabold shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Csempe nézet"
                >
                  <LayoutGrid size={15} />
                  <span>Csempék</span>
                </button>

                <button
                  onClick={() => setSavedViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    savedViewMode === 'list'
                      ? 'bg-accent text-black font-extrabold shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Lista nézet"
                >
                  <LayoutList size={15} />
                  <span>Lista</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row items-center gap-3 pt-2 border-t border-[#1E3A64]">
              {/* Tabs */}
              <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto">
                <button
                  onClick={() => setSavedFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    savedFilter === 'all'
                      ? 'bg-[#4165b4] text-white'
                      : 'bg-[#142C4E] text-gray-300 hover:bg-[#1E3A64]'
                  }`}
                >
                  Összes mentés ({savedItems.length})
                </button>
                <button
                  onClick={() => setSavedFilter('article')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    savedFilter === 'article'
                      ? 'bg-[#4165b4] text-white'
                      : 'bg-[#142C4E] text-gray-300 hover:bg-[#1E3A64]'
                  }`}
                >
                  📄 Cikkek ({savedItems.filter((i) => i.itemType === 'article').length})
                </button>
                <button
                  onClick={() => setSavedFilter('glossary')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    savedFilter === 'glossary'
                      ? 'bg-[#4165b4] text-white'
                      : 'bg-[#142C4E] text-gray-300 hover:bg-[#1E3A64]'
                  }`}
                >
                  📘 Fogalmak ({savedItems.filter((i) => i.itemType === 'glossary').length})
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Keresés a mentett elemek között..."
                  value={savedSearchQuery}
                  onChange={(e) => setSavedSearchQuery(e.target.value)}
                  className="w-full bg-[#142C4E] border border-[#234775] text-white rounded-xl pl-9 pr-8 py-1.5 text-xs placeholder-gray-400 focus:outline-none focus:border-accent"
                />
                {savedSearchQuery && (
                  <button
                    onClick={() => setSavedSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Saved Items Content */}
          {filteredSavedItems.length === 0 ? (
            <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-12 text-center space-y-4">
              <Bookmark size={48} className="mx-auto text-purple-400 opacity-60" />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white">
                  {savedItems.length === 0
                    ? 'Még nem mentettél el tartalmat'
                    : 'Nincs a szűrésnek megfelelő mentett elem'}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {savedItems.length === 0
                    ? 'Cikkek és fogalmak böngészése közben a mentés ikonra kattintva eltárolhatod a kedvenceidet a gyors eléréshez.'
                    : 'Próbáld meg törölni a keresőt vagy válts másik szűrő fülre.'}
                </p>
              </div>
              <button
                onClick={() => onNavigate?.('category')}
                className="px-5 py-2.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Search size={14} /> Tudástár böngészése
              </button>
            </div>
          ) : savedViewMode === 'grid' ? (
            /* CSEMPE (GRID) NÉZET */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSavedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#0C213E]/90 border border-[#1E3A64] hover:border-accent/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all group"
                >
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          item.itemType === 'article'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {item.itemType === 'article' ? '📄 Cikk' : '📘 Fogalom'}
                      </span>
                      {item.subtitle && (
                        <span className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">
                          {item.subtitle}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-bold text-white group-hover:text-accent transition-colors line-clamp-2">
                      {item.title}
                    </h4>

                    {/* Description Excerpt */}
                    {item.description && (
                      <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Action buttons */}
                  <div className="pt-3 border-t border-[#1E3A64] flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => handleOpenSavedItem(item)}
                      className="px-3 py-1.5 bg-[#4165b4] hover:bg-[#325296] text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Megtekintés</span>
                      <ExternalLink size={13} />
                    </button>

                    <button
                      onClick={() => handleRemoveSaved(item)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Törlés a mentések közül"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* LISTA (LIST) NÉZET */
            <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl divide-y divide-[#1E3A64] overflow-hidden">
              {filteredSavedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          item.itemType === 'article'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {item.itemType === 'article' ? '📄 Cikk' : '📘 Fogalom'}
                      </span>
                      {item.subtitle && (
                        <span className="text-xs text-gray-400 font-medium">
                          • {item.subtitle}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white hover:text-accent transition-colors">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenSavedItem(item)}
                      className="px-3.5 py-1.5 bg-[#4165b4] hover:bg-[#325296] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Megnyitás</span>
                      <ExternalLink size={13} />
                    </button>

                    <button
                      onClick={() => handleRemoveSaved(item)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Törlés a mentések közül"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. ELŐZMÉNYEIM */}
      {activeMainSection === 'history' && (
        <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-8 text-center space-y-4">
          <Clock size={48} className="mx-auto text-amber-400 opacity-60" />
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Még nincsenek megtekintési előzményeid</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Az általad legutóbb megnyitott szakmai cikkek és tananyagok itt fognak megjelenni a gyors folytatáshoz.
            </p>
          </div>
        </div>
      )}

      {/* 19. BEÁLLÍTÁSOK (DESKTOP 2-COLUMN LIST-DETAIL LAYOUT) */}
      {activeMainSection === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT SIDEBAR NAVIGATION */}
          <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-3 space-y-1 h-fit">
            <button
              onClick={() => setActiveSettingsTab('profile_data')}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                activeSettingsTab === 'profile_data'
                  ? 'bg-accent text-black font-extrabold shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Profiladatok</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setActiveSettingsTab('trade_profile')}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                activeSettingsTab === 'trade_profile'
                  ? 'bg-accent text-black font-extrabold shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Szakmai profil</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setActiveSettingsTab('notifications')}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                activeSettingsTab === 'notifications'
                  ? 'bg-accent text-black font-extrabold shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Értesítések</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setActiveSettingsTab('security')}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                activeSettingsTab === 'security'
                  ? 'bg-accent text-black font-extrabold shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Biztonság</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setActiveSettingsTab('appearance')}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                activeSettingsTab === 'appearance'
                  ? 'bg-accent text-black font-extrabold shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Megjelenés</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => setActiveSettingsTab('privacy')}
              className={`w-full px-4 py-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                activeSettingsTab === 'privacy'
                  ? 'bg-accent text-black font-extrabold shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Adatvédelem</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* RIGHT DETAILS PANEL */}
          <div className="lg:col-span-3 bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-6 md:p-8 space-y-6">
            {/* 12. PROFILADATOK */}
            {activeSettingsTab === 'profile_data' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white">Profiladatok</h2>
                  <p className="text-xs text-gray-400 mt-1">Személyes azonosító adatok és megjelenítés.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">Megjelenítési Név</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">E-mail Cím (Hitelesített)</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-[#081528]/60 border border-[#1E3A64] rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">Szakma</label>
                    <input
                      type="text"
                      disabled
                      value={specialization || 'Nincs beállítva'}
                      className="w-full bg-[#081528]/60 border border-[#1E3A64] rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">Tapasztalati Szint</label>
                    <input
                      type="text"
                      disabled
                      value={EXPERIENCE_LEVELS.find((l) => l.id === experienceLevel)?.label || 'Nincs beállítva'}
                      className="w-full bg-[#081528]/60 border border-[#1E3A64] rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">Szakmai Bemutatkozás</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Rövid bemutatkozás a szakmai tapasztalatokról..."
                    className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="pt-4 border-t border-[#1E3A64] flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save size={14} /> {saving ? 'Mentés...' : 'Változtatások Mentése'}
                  </button>
                </div>
              </div>
            )}

            {/* 8. SZAKMAI PROFIL (8.1, 9, 10) */}
            {activeSettingsTab === 'trade_profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white">Szakmai Profil</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Állítsd be szakmai profilodat, hogy az ÉpítőTudás relevánsabb szakmai tartalmakat tudjon ajánlani.
                  </p>
                </div>

                {/* 8.1 SZAKMA SELECTION */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Fő Szakma Kiválasztása
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-[#081528] border border-[#1E3A64] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent"
                  >
                    <option value="">-- Válassz szakmát a listából --</option>
                    {availableTrades.map((trade) => (
                      <option key={trade} value={trade}>
                        {trade}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 9. TAPASZTALATI SZINT */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Tapasztalati Szint (Opcionális)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EXPERIENCE_LEVELS.map((level) => {
                      const selected = experienceLevel === level.id;
                      return (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() => setExperienceLevel(level.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                            selected
                              ? 'bg-[#162C4E] border-accent text-white shadow-md'
                              : 'bg-[#081528] border-[#1E3A64] text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-xs">
                            <span className={selected ? 'text-accent' : 'text-white'}>{level.label}</span>
                            {selected && <CheckCircle2 size={14} className="text-accent" />}
                          </div>
                          <p className="text-[11px] text-gray-400 leading-snug">{level.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 10. ÉRDEKLŐDÉSI TERÜLETEK */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Érdeklődési Területek
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {INTEREST_TOPICS.map((topic) => {
                      const checked = selectedInterests.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleInterest(topic)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            checked
                              ? 'bg-purple-950/50 border-purple-500/50 text-purple-200'
                              : 'bg-[#081528] border-[#1E3A64] text-gray-400 hover:text-white'
                          }`}
                        >
                          <span>{topic}</span>
                          {checked && <Check size={14} className="text-purple-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1E3A64] flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save size={14} /> {saving ? 'Mentés...' : 'Szakmai Profil Mentése'}
                  </button>
                </div>
              </div>
            )}

            {/* 13. ÉRTESÍTÉSEK */}
            {activeSettingsTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white">Értesítések</h2>
                  <p className="text-xs text-gray-400 mt-1">E-mail értesítési preferenciák kezelése.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-[#081528] border border-[#1E3A64] rounded-2xl flex items-center justify-between opacity-80">
                    <div>
                      <span className="text-xs font-bold text-white block">Fontos rendszerüzenetek</span>
                      <span className="text-[11px] text-gray-400 block">A fiók működéséhez és biztonságához szükséges kötelező értesítések.</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">Kötelező</span>
                  </div>

                  <div className="p-4 bg-[#081528] border border-[#1E3A64] rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Tanulási emlékeztetők</span>
                      <span className="text-[11px] text-gray-400 block">Emlékeztetők a megkezdett tananyagok és tesztek folytatására.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.learningReminders}
                      onChange={(e) => setNotifications({ ...notifications, learningReminders: e.target.checked })}
                      className="w-4 h-4 accent-accent cursor-pointer"
                    />
                  </div>

                  <div className="p-4 bg-[#081528] border border-[#1E3A64] rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Új szakmai tartalmak & cikkek</span>
                      <span className="text-[11px] text-gray-400 block">Értesítések a szakterületedhez kapcsolódó új szakcikkekről.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.newArticles}
                      onChange={(e) => setNotifications({ ...notifications, newArticles: e.target.checked })}
                      className="w-4 h-4 accent-accent cursor-pointer"
                    />
                  </div>

                  <div className="p-4 bg-[#081528] border border-[#1E3A64] rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">ÉpítőTudás hírek és ajánlások</span>
                      <span className="text-[11px] text-gray-400 block">Heti összefoglalók és újdonságok az építőipari platformról.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.newsletters}
                      onChange={(e) => setNotifications({ ...notifications, newsletters: e.target.checked })}
                      className="w-4 h-4 accent-accent cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1E3A64] flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-5 py-2.5 bg-accent hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save size={14} /> {saving ? 'Mentés...' : 'Beállítások Mentése'}
                  </button>
                </div>
              </div>
            )}

            {/* 14. BIZTONSÁG */}
            {activeSettingsTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white">Biztonság</h2>
                  <p className="text-xs text-gray-400 mt-1">Jelszó és fiókbiztonsági beállítások.</p>
                </div>

                {/* Password reset form */}
                <form onSubmit={handlePasswordResetSubmit} className="p-5 bg-[#081528] border border-[#1E3A64] rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Lock size={14} className="text-accent" /> Jelszó Módosítása
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Új Jelszó</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Legalább 8 karakter"
                        className="w-full bg-[#0C213E] border border-[#1E3A64] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Új Jelszó Megerősítése</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Jelszó újra"
                        className="w-full bg-[#0C213E] border border-[#1E3A64] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {passwordMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${passwordMsg.type === 'success' ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-4 py-2 bg-[#4165b4] hover:bg-[#325296] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {passwordSaving ? 'Mentés...' : 'Jelszó Frissítése'}
                  </button>
                </form>

                {/* Account Actions */}
                <div className="pt-4 border-t border-[#1E3A64] space-y-3">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Fiókműveletek</h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => signOut()}
                      className="px-4 py-2.5 bg-[#162C4E] text-gray-200 border border-[#234678] hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <LogOut size={14} /> Kijelentkezés a fiókból
                    </button>

                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-4 py-2.5 bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-950/80 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <AlertTriangle size={14} /> Fiók Törlése
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 15. MEGJELENÉS */}
            {activeSettingsTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white">Megjelenés</h2>
                  <p className="text-xs text-gray-400 mt-1">Megjelenítési téma és vizuális beállítások.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setThemeMode('dark')}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer space-y-2 ${
                      themeMode === 'dark' ? 'bg-[#162C4E] border-accent text-white' : 'bg-[#081528] border-[#1E3A64] text-gray-400'
                    }`}
                  >
                    <Moon size={24} className="mx-auto text-accent" />
                    <span className="text-xs font-bold block">Sötét Téma (Ajánlott)</span>
                  </button>

                  <button
                    onClick={() => setThemeMode('light')}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer space-y-2 ${
                      themeMode === 'light' ? 'bg-[#162C4E] border-accent text-white' : 'bg-[#081528] border-[#1E3A64] text-gray-400'
                    }`}
                  >
                    <Sun size={24} className="mx-auto text-amber-400" />
                    <span className="text-xs font-bold block">Világos Téma</span>
                  </button>

                  <button
                    onClick={() => setThemeMode('system')}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer space-y-2 ${
                      themeMode === 'system' ? 'bg-[#162C4E] border-accent text-white' : 'bg-[#081528] border-[#1E3A64] text-gray-400'
                    }`}
                  >
                    <Monitor size={24} className="mx-auto text-blue-400" />
                    <span className="text-xs font-bold block">Rendszerbeállítás</span>
                  </button>
                </div>
              </div>
            )}

            {/* 16. ADATVÉDELEM */}
            {activeSettingsTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white">Adatvédelem & GDPR</h2>
                  <p className="text-xs text-gray-400 mt-1">Saját adatok kezelése és letöltése.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-[#081528] border border-[#1E3A64] rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Adatvédelmi Tájékoztató</span>
                      <span className="text-[11px] text-gray-400 block">Olvasd el részletes adatkezelési szabályzatunkat.</span>
                    </div>
                    <button
                      onClick={() => onNavigate?.('privacy')}
                      className="px-3 py-1.5 bg-[#162C4E] border border-[#234678] text-xs font-bold text-gray-200 rounded-lg hover:text-white"
                    >
                      Megtekintés
                    </button>
                  </div>

                  <div className="p-4 bg-[#081528] border border-[#1E3A64] rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Cookie Beállítások</span>
                      <span className="text-[11px] text-gray-400 block">Sütik és nyomonkövetési preferenciák.</span>
                    </div>
                    <button
                      onClick={() => onNavigate?.('cookies')}
                      className="px-3 py-1.5 bg-[#162C4E] border border-[#234678] text-xs font-bold text-gray-200 rounded-lg hover:text-white"
                    >
                      Megtekintés
                    </button>
                  </div>

                  <div className="p-4 bg-[#081528] border border-[#1E3A64] rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Saját Adatok Exportálása</span>
                      <span className="text-[11px] text-gray-400 block">Töltsd le a fiókodhoz tartozó összes személyes adatot JSON formátumban.</span>
                    </div>
                    <button
                      onClick={exportUserDataJSON}
                      className="px-3 py-1.5 bg-accent text-black font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} /> Adatok Letöltése
                    </button>
                  </div>

                  <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-red-400 block">Fiók & Profil Végleges Törlése</span>
                      <span className="text-[11px] text-gray-400 block">A profil és a személyes adatok végleges eltávolítása a rendszerből.</span>
                    </div>
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle size={14} /> Fiók Törlése
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 17. SEGÍTSÉG */}
      {activeMainSection === 'help' && (
        <div className="bg-[#0C213E]/90 border border-[#1E3A64] rounded-3xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <HelpCircle className="text-accent" size={24} /> Segítség & Támogatás
            </h2>
            <p className="text-xs text-gray-400">Gyakori kérdések és kapcsolatfelvétel az ÉpítőTudás csapatával.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => onNavigate?.('about')}
              className="p-5 bg-[#081528] border border-[#1E3A64] rounded-2xl text-left hover:border-accent/40 transition-colors space-y-1"
            >
              <span className="text-sm font-bold text-white block">Gyakran Ismételt Kérdések (GYIK)</span>
              <span className="text-xs text-gray-400 block">Válaszok a leggyakoribb fiók- és tartalomkezelési kérdésekre.</span>
            </button>

            <button
              onClick={() => onNavigate?.('impressum')}
              className="p-5 bg-[#081528] border border-[#1E3A64] rounded-2xl text-left hover:border-accent/40 transition-colors space-y-1"
            >
              <span className="text-sm font-bold text-white block">Kapcsolat & Impresszum</span>
              <span className="text-xs text-gray-400 block">Lépj kapcsolatba szerkesztőségünkkel és ügyfélszolgálatunkkal.</span>
            </button>
          </div>
        </div>
      )}

      {/* FIÓK TÖRLÉSE WARNING MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0C213E] border border-red-500/30 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Biztosan törölni szeretnéd a fiókodat?</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Ez a művelet végleges és nem visszavonható! Minden fiókadatod és elmentett preferenciád törlésre kerül az ÉpítőTudás rendszeréből.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E3A64]">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 bg-[#162C4E] text-gray-300 text-xs font-bold rounded-xl hover:text-white transition-colors cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                {deletingAccount ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                    <span>Törlés folyamatban...</span>
                  </>
                ) : (
                  <span>Fiók Végleges Törlése</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Term Detail Modal for Saved Glossary Terms */}
      <TermDetailModal
        isOpen={savedTermModalOpen}
        onClose={() => {
          setSavedTermModalOpen(false);
          setSelectedSavedTerm(null);
        }}
        term={selectedSavedTerm}
      />
    </div>
  );
}
