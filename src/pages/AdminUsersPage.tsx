import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, AlertCircle, RefreshCw, Users, Award, CheckCircle2, Zap } from 'lucide-react';
import type { Profile } from '../lib/supabase';
import { listProfiles } from '../services/userService';
import {
  getUserTrustProfile,
  setTrustedContributorStatus,
  setTrustScore,
  incrementTrustScore,
  type UserTrustProfile,
} from '../services/trustService';

const ROLE_BADGE: Record<Profile['role'], { label: string; class: string }> = {
  admin: { label: 'Admin', class: 'bg-[#FFC400]/10 text-[#FFC400] border-[#FFC400]/20' },
  editor: { label: 'Szerkesztő', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  user: { label: 'Felhasználó', class: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [trustProfiles, setTrustProfiles] = useState<Record<string, UserTrustProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  async function handleSetScore(userId: string, newScore: number) {
    const updated = await setTrustScore(userId, newScore);
    setTrustProfiles((prev) => ({
      ...prev,
      [userId]: updated,
    }));
  }

  const trustedCount = useMemo(() => {
    return Object.values(trustProfiles).filter((tp) => tp.autoApprovalEnabled).length;
  }, [trustProfiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.full_name ?? '').toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="text-accent" size={26} />
            Felhasználók &amp; Bizalmi Pontrendszer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} regisztrált felhasználó ({trustedCount} megbízható feltöltő auto-publikációs joggal)
          </p>
        </div>
        {!loading && (
          <button onClick={loadUsers} className="inline-flex items-center gap-2 px-3 py-2 border border-[#1E1E1E] text-gray-300 text-sm font-bold rounded-lg hover:bg-[#1E1E1E] transition-colors">
            <RefreshCw size={14} /> Frissítés
          </button>
        )}
      </div>

      {/* Trust Score Information Banner */}
      <div className="mt-6 p-4 bg-[#141824] border border-blue-500/20 rounded-xl flex items-start gap-3">
        <Zap size={20} className="text-accent flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-gray-300">
          <strong className="text-white text-sm block">Megbízható Feltöltő (Trust Score 50+ / Auto-Approve):</strong>
          <p className="leading-relaxed">
            A legalább <strong>50 bizalmi ponttal</strong> rendelkező vagy kijelölt <strong>Megbízható Feltöltők</strong> által beküldött szakmai cikkek és fogalmak automatikusan jóváhagyásra/publikálásra kerülnek, megkerülve a manuális moderációs várakozási sort.
          </p>
        </div>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés email, név vagy szerepkör..."
          className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#FFC400]/50 transition-colors"
        />
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm flex-1">{error}</p>
          <button onClick={loadUsers} className="text-red-400 text-sm font-bold hover:text-red-300">Újrapróbálás</button>
        </div>
      )}

      <div className="mt-6 bg-[#111] border border-[#1E1E1E] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E1E1E] text-left">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Név</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Szerepkör</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Bizalmi Pont (Trust Score)</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Auto-Publikáció Status</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">Megbízhatóság Művelet</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1E1E1E]/50">
                    <td className="px-4 py-3.5"><div className="h-4 w-48 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-32 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-5 w-20 bg-[#1E1E1E] rounded-full animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-16 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 bg-[#1E1E1E] rounded animate-pulse" /></td>
                    <td className="px-4 py-3.5"><div className="h-6 w-24 bg-[#1E1E1E] rounded animate-pulse" /></td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <Users size={32} className="mx-auto text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">{search ? 'Nincs a keresésnek megfelelő felhasználó.' : 'Még nincs felhasználó.'}</p>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((u) => {
                  const badge = ROLE_BADGE[u.role];
                  const tp = trustProfiles[u.id] || { trustScore: 10, isTrusted: false, autoApprovalEnabled: false };
                  return (
                    <tr key={u.id} className="border-b border-[#1E1E1E]/50 hover:bg-[#1E1E1E]/30 transition-colors">
                      <td className="px-4 py-3.5 text-gray-200 font-medium">{u.email ?? '—'}</td>
                      <td className="px-4 py-3.5 text-gray-300 font-bold">{u.full_name ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 font-extrabold text-xs px-2.5 py-1 rounded-md border ${
                            tp.trustScore >= 50
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-[#1A1A1A] border-[#2A2A2A] text-accent'
                          }`}>
                            <Award size={13} /> {tp.trustScore} pont
                          </span>
                          <button
                            onClick={() => handleAdjustScore(u.id, 10)}
                            title="+10 bizalmi pont hozzáadása"
                            className="px-1.5 py-0.5 text-[11px] font-bold bg-accent/20 text-accent border border-accent/30 rounded hover:bg-accent/30 transition-colors cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleSetScore(u.id, 50)}
                            title="Megbízható szintre állítás (50 pont)"
                            className="px-1.5 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors cursor-pointer"
                          >
                            50+
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {tp.autoApprovalEnabled ? (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 size={14} /> Auto-Publikáció Aktív
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 font-semibold bg-[#141414] border border-[#222] px-2.5 py-1 rounded-lg">
                            Moderációhoz kötve
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleTrusted(u.id, tp.isTrusted)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            tp.isTrusted
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-[#1A1A1A] text-gray-300 border-[#2A2A2A] hover:bg-[#222] hover:text-white'
                          }`}
                        >
                          {tp.isTrusted ? 'Megbízható Feltöltő ✓' : '+ Megbízhatóvá tétel'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

