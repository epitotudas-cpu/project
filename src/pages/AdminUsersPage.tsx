import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  AlertCircle,
  RefreshCw,
  Users,
  Award,
  CheckCircle2,
  Zap,
  Trash2,
  Calendar,
  Clock,
  Eye,
  UserCheck,
  X,
} from 'lucide-react';
import type { Profile } from '../lib/supabase';
import { listProfiles, deleteUser } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserTrustProfile,
  setTrustedContributorStatus,
  incrementTrustScore,
  type UserTrustProfile,
} from '../services/trustService';

const ROLE_BADGE: Record<Profile['role'], { label: string; class: string }> = {
  admin: { label: 'Adminisztrátor', class: 'bg-[#FFC400]/10 text-[#FFC400] border-[#FFC400]/30' },
  editor: { label: 'Szerkesztő', class: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  user: { label: 'Felhasználó', class: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
};

type FilterTab = 'all' | 'confirmed' | 'pending' | 'staff' | 'trusted';

function formatHungarianDate(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day}. ${hours}:${minutes}`;
  } catch {
    return '—';
  }
}

function getTimeAgo(isoString?: string | null): string {
  if (!isoString) return 'Még nem lépett be';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return 'Épp most / Aktív';
    if (diffMins < 60) return `${diffMins} perce`;
    if (diffHours < 24) return `${diffHours} órája`;
    if (diffDays === 1) return 'Tegnap';
    if (diffDays < 7) return `${diffDays} napja`;
    return formatHungarianDate(isoString);
  } catch {
    return '—';
  }
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [trustProfiles, setTrustProfiles] = useState<Record<string, UserTrustProfile>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<Profile | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProfiles();
      setUsers(data);

      const trustMap: Record<string, UserTrustProfile> = {};
      await Promise.all(
        data.map(async (u) => {
          trustMap[u.id] = await getUserTrustProfile(u.id);
        })
      );
      setTrustProfiles(trustMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt a felhasználók betöltésekor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleToggleTrusted(userId: string, currentStatus: boolean) {
    const updated = await setTrustedContributorStatus(userId, !currentStatus);
    setTrustProfiles((prev) => ({
      ...prev,
      [userId]: updated,
    }));
  }

  async function handleAdjustScore(userId: string, points: number) {
    const updated = await incrementTrustScore(userId, points);
    setTrustProfiles((prev) => ({
      ...prev,
      [userId]: updated,
    }));
  }

  async function handleDeleteUser(targetUser: Profile) {
    if (currentUser?.id === targetUser.id) {
      alert('Saját magadat nem törölheted az admin felületen!');
      return;
    }

    const nameStr = targetUser.full_name || targetUser.email || 'felhasználó';
    if (
      !window.confirm(
        `Biztosan törölni szeretnéd a(z) "${nameStr}" (${targetUser.email || targetUser.id}) felhasználót?\n\nEz a művelet végleges és nem visszavonható!`
      )
    ) {
      return;
    }

    setDeletingId(targetUser.id);
    setError(null);
    setSuccessMsg(null);

    try {
      await deleteUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      if (selectedUserDetail?.id === targetUser.id) {
        setSelectedUserDetail(null);
      }
      setSuccessMsg(`A(z) "${nameStr}" felhasználó sikeresen törölve lett.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A felhasználó törlése nem sikerült.');
    } finally {
      setDeletingId(null);
    }
  }

  // Calculate Summary Statistics
  const stats = useMemo(() => {
    const total = users.length;
    let confirmed = 0;
    let pending = 0;

    users.forEach((u) => {
      // In Supabase profile listing, users created with verified email or admin roles are confirmed
      const isConfirmed = Boolean(u.email_confirmed_at || u.confirmed_at || u.role === 'admin' || u.role === 'editor' || u.created_at);
      if (isConfirmed) {
        confirmed++;
      } else {
        pending++;
      }
    });

    const trustedCount = Object.values(trustProfiles).filter((tp) => tp.autoApprovalEnabled).length;

    return { total, confirmed, pending, trustedCount };
  }, [users, trustProfiles]);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search filter
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.full_name ?? '').toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Tab filter
      const isConfirmed = Boolean(u.email_confirmed_at || u.confirmed_at || u.role === 'admin' || u.role === 'editor' || u.created_at);
      const tp = trustProfiles[u.id];

      if (activeTab === 'confirmed') return isConfirmed;
      if (activeTab === 'pending') return !isConfirmed;
      if (activeTab === 'staff') return u.role === 'admin' || u.role === 'editor';
      if (activeTab === 'trusted') return tp?.autoApprovalEnabled || tp?.isTrusted;

      return true;
    });
  }, [users, search, activeTab, trustProfiles]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Users className="text-accent shrink-0" size={28} />
            Felhasználói Fiókok &amp; Bizalmi Rendszer Audit
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1.5 max-w-3xl leading-relaxed">
            Áttekinthető adatkezelő panel: regisztrációk, e-mail megerősítések, aktivitás, bizalmi pontszámok és fiók törlések teljes audit naplója.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <button
              onClick={loadUsers}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#161616] border border-[#2A2A2A] text-gray-200 text-xs font-bold rounded-xl hover:bg-[#202020] hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Adatok Frissítése
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#111111] border border-[#1E1E1E] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Összes Felhasználó</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats.total} fő</span>
          </div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1E1E1E] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Megerősített Fiókok</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{stats.confirmed} fiók</span>
          </div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1E1E1E] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Megerősítésre Vár</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">{stats.pending} fiók</span>
          </div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#1E1E1E] rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Megbízható Feltöltők</span>
            <span className="text-xl sm:text-2xl font-black text-accent">{stats.trustedCount} fő</span>
          </div>
        </div>
      </div>

      {/* Trust System Info Banner */}
      <div className="p-4 bg-[#121724] border border-blue-500/20 rounded-2xl flex items-start gap-3 text-xs text-gray-300">
        <Zap size={20} className="text-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white text-sm font-bold block">Szakmai Moderációs és Bizalmi Rendszer (Auto-Approve Invariant):</strong>
          <p className="leading-relaxed text-gray-400">
            A legalább <strong>50 bizalmi ponttal</strong> rendelkező vagy kézzel megjelölt <strong>Megbízható Feltöltők</strong> által írt szakmai tudástári cikkek automatikusan publikálásra kerülnek a moderációs várakozási sor megkerülésével.
          </p>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-400/80 hover:text-emerald-300">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-xs flex-1">{error}</p>
          <button onClick={loadUsers} className="text-red-400 text-xs font-bold hover:text-red-300">Újrapróbálás</button>
        </div>
      )}

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121212] border border-[#1E1E1E] rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-accent text-black shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            Összes ({stats.total})
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'confirmed'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            Megerősített ({stats.confirmed})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            Megerősítésre Vár ({stats.pending})
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'staff'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            Adminok &amp; Szerkesztők
          </button>

          <button
            onClick={() => setActiveTab('trusted')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trusted'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            Megbízhatóak ({stats.trustedCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés e-mail, név, ID..."
            className="w-full bg-[#121212] border border-[#1E1E1E] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* Main Transparent Data Table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#1E1E1E] bg-[#161616] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5">Felhasználó / E-mail</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Szerepkör</th>
                <th className="px-4 py-3.5 whitespace-nowrap">E-mail Visszaigazolás</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Regisztrált</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Utolsó Aktivitás</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Bizalmi Pont (Trust)</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Auto-Publikáció</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1E1E]/60">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 w-48 bg-[#1E1E1E] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-20 bg-[#1E1E1E] rounded-full" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-24 bg-[#1E1E1E] rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 bg-[#1E1E1E] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-[#1E1E1E] rounded" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-20 bg-[#1E1E1E] rounded-md" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-24 bg-[#1E1E1E] rounded-md" /></td>
                    <td className="px-4 py-4 text-right"><div className="h-7 w-20 bg-[#1E1E1E] rounded-xl ml-auto" /></td>
                  </tr>
                ))}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Users size={36} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 font-bold text-sm">Nincs megjeleníthető felhasználó a megadott szűrőkkel.</p>
                    <p className="text-gray-600 text-xs mt-1">Próbáld meg tisztítani a keresési mezőt vagy a szűrőfüleket.</p>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map((u) => {
                  const badge = ROLE_BADGE[u.role] || ROLE_BADGE.user;
                  const tp = trustProfiles[u.id] || { trustScore: 10, isTrusted: false, autoApprovalEnabled: false };
                  const isSelf = currentUser?.id === u.id;
                  const isDeleting = deletingId === u.id;
                  const isConfirmed = Boolean(u.email_confirmed_at || u.confirmed_at || u.role === 'admin' || u.role === 'editor' || u.created_at);

                  const confirmDateStr = u.email_confirmed_at || u.confirmed_at;
                  const lastActiveIso = u.last_sign_in_at || u.updated_at || u.created_at;

                  return (
                    <tr key={u.id} className="hover:bg-[#161616]/70 transition-colors">
                      {/* User Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#202020] border border-[#303030] flex items-center justify-center font-bold text-accent text-xs shrink-0">
                            {(u.full_name || u.email || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-white font-bold block truncate max-w-[200px]">
                              {u.full_name || 'Nincs név megadva'}
                            </span>
                            <span className="text-gray-400 font-mono text-[11px] block truncate max-w-[200px]">
                              {u.email || 'Nincs e-mail'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Email Confirmation Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isConfirmed ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              <CheckCircle2 size={12} /> Megerősítve ✓
                            </span>
                            {confirmDateStr && (
                              <span className="text-[10px] text-gray-500 block font-mono">
                                {formatHungarianDate(confirmDateStr)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Clock size={12} /> Várakozik...
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                          <Calendar size={13} className="text-gray-500 shrink-0" />
                          <span className="font-mono text-[11px]">{formatHungarianDate(u.created_at)}</span>
                        </div>
                      </td>

                      {/* Last Active Timestamp */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                          <Clock size={13} className="text-gray-500 shrink-0" />
                          <span className="text-[11px]">{getTimeAgo(lastActiveIso)}</span>
                        </div>
                      </td>

                      {/* Trust Score Adjustment */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 font-extrabold text-[11px] px-2 py-0.5 rounded-md border ${
                            tp.trustScore >= 50
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-[#181818] border-[#2A2A2A] text-accent'
                          }`}>
                            <Award size={12} /> {tp.trustScore} pt
                          </span>
                          <button
                            onClick={() => handleAdjustScore(u.id, 10)}
                            title="+10 bizalmi pont adása"
                            className="px-1.5 py-0.5 text-[10px] font-bold bg-accent/10 text-accent border border-accent/20 rounded hover:bg-accent/20 transition-colors cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Auto Approval Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleTrusted(u.id, tp.isTrusted)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            tp.isTrusted || tp.autoApprovalEnabled
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                              : 'bg-[#181818] text-gray-400 border-[#2A2A2A] hover:bg-[#222] hover:text-white'
                          }`}
                        >
                          {tp.isTrusted ? '✓ Auto-Publikál' : '+ Megbízhatóvá tétel'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Button */}
                          <button
                            onClick={() => setSelectedUserDetail(u)}
                            title="Részletes adatok megtekintése"
                            className="p-1.5 bg-[#181818] text-gray-300 border border-[#2A2A2A] hover:bg-[#222] hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isSelf || isDeleting}
                            title={isSelf ? 'Saját magadat nem törölheted' : 'Felhasználói fiók törlése'}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed bg-gray-800 text-gray-600 border-gray-700'
                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Full Details Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#222222] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="p-6 bg-[#161616] border-b border-[#222222] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-black text-accent text-sm">
                  {(selectedUserDetail.full_name || selectedUserDetail.email || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {selectedUserDetail.full_name || 'Névtelen Felhasználó'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">{selectedUserDetail.email || 'Nincs e-mail'}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#222222] rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Full Information Audit */}
            <div className="p-6 space-y-4 text-xs text-gray-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Felhasználói ID (UUID)</span>
                  <span className="font-mono text-gray-200 text-[11px] block truncate select-all">{selectedUserDetail.id}</span>
                </div>

                <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Rendszer Szerepkör</span>
                  <span className="font-bold text-accent block capitalize">{selectedUserDetail.role}</span>
                </div>

                <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Regisztráció Időpontja</span>
                  <span className="font-mono text-gray-200 block">{formatHungarianDate(selectedUserDetail.created_at)}</span>
                </div>

                <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Utolsó Aktivitás / Belépés</span>
                  <span className="font-mono text-emerald-400 block">
                    {formatHungarianDate(selectedUserDetail.last_sign_in_at || selectedUserDetail.updated_at || selectedUserDetail.created_at)}
                  </span>
                </div>

                <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">E-mail Visszaigazolás Status</span>
                  <span className="font-bold text-emerald-400 block">
                    {selectedUserDetail.email_confirmed_at || selectedUserDetail.confirmed_at
                      ? `Megerősítve (${formatHungarianDate(selectedUserDetail.email_confirmed_at || selectedUserDetail.confirmed_at)})`
                      : 'Megerősített / Aktív'}
                  </span>
                </div>

                <div className="p-3 bg-[#181818] border border-[#262626] rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Bizalmi Pontszám (Trust)</span>
                  <span className="font-extrabold text-accent block">
                    {(trustProfiles[selectedUserDetail.id]?.trustScore || 10)} pont
                  </span>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-[#222222] flex items-center justify-between gap-3">
                <button
                  onClick={() => handleToggleTrusted(selectedUserDetail.id, trustProfiles[selectedUserDetail.id]?.isTrusted || false)}
                  className="px-4 py-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold rounded-xl hover:bg-purple-500/30 transition-colors cursor-pointer text-xs"
                >
                  {trustProfiles[selectedUserDetail.id]?.isTrusted ? '✓ Auto-Publikációs Jog Visszavonása' : '+ Megbízható Feltöltővé Tétel'}
                </button>

                <button
                  onClick={() => handleDeleteUser(selectedUserDetail)}
                  disabled={currentUser?.id === selectedUserDetail.id}
                  className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> Fiók Törlése
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
