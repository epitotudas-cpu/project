import { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldCheck, Briefcase, GraduationCap, Building2, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDetailedProfile, updateUserDetailedProfile, type UserDetailedProfile } from '../services/userProfileService';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDetailedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await getUserDetailedProfile(user.id, user.email, user.user_metadata?.full_name, 'admin');
        setProfile(data);
        setFullName(data.fullName);
        setSpecialization(data.specialization || '');
        setExperienceYears(data.experienceYears || 0);
        setCompanyName(data.companyName || '');
        setBio(data.bio || '');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;

    const updated = await updateUserDetailedProfile(user.id, {
      fullName,
      specialization,
      experienceYears,
      companyName,
      bio,
    });

    setProfile(updated);
    setEditing(false);
  }

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-2" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Profile Card */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-black text-2xl">
              {profile.fullName.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{profile.fullName}</h1>
                <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                  {profile.role}
                </span>
              </div>
              <p className="text-sm text-gray-400">{profile.email}</p>
            </div>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-accent/40 text-gray-200 font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors self-start"
          >
            <Edit size={14} /> {editing ? 'Mégse' : 'Profil Szerkesztése'}
          </button>
        </div>

        {/* Trust Status Banner */}
        <div className="bg-[#161616] border border-[#222] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Award className="text-accent flex-shrink-0" size={24} />
            <div>
              <div className="text-sm font-bold text-white">Bizalmi Pontszám: {profile.trustProfile.trustScore} pont</div>
              <div className="text-xs text-gray-400">
                {profile.trustProfile.autoApprovalEnabled
                  ? 'Megbízható Feltöltő — tartalmai automatikusan publikálásra kerülnek.'
                  : 'Szakmai tartalmai ellenőrzésre kerülnek beküldéskor.'}
              </div>
            </div>
          </div>
          {profile.trustProfile.autoApprovalEnabled && (
            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 self-start">
              <CheckCircle2 size={14} /> Auto-Publikáció Aktív
            </span>
          )}
        </div>

        {/* Edit Form or View Details */}
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-[#1E1E1E]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Teljes Név</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Szakterület</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Tapasztalat (Év)</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Cégnév / Intézmény</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 font-semibold block mb-1">Szakmai Bemutatkozás</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent h-24"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-[#1A1A1A] text-gray-300 text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <X size={14} /> Mégse
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-black text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Save size={14} /> Módosítások Mentése
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#1E1E1E]">
            <div className="bg-[#161616] p-4 rounded-xl space-y-1">
              <div className="text-xs text-gray-500 flex items-center gap-1.5"><Briefcase size={14} /> Szakterület</div>
              <div className="text-sm font-bold text-white">{profile.specialization || 'Nincs megadva'}</div>
            </div>

            <div className="bg-[#161616] p-4 rounded-xl space-y-1">
              <div className="text-xs text-gray-500 flex items-center gap-1.5"><Award size={14} /> Tapasztalat</div>
              <div className="text-sm font-bold text-white">{profile.experienceYears} év szakmai gyakorlat</div>
            </div>

            <div className="bg-[#161616] p-4 rounded-xl space-y-1">
              <div className="text-xs text-gray-500 flex items-center gap-1.5"><Building2 size={14} /> Szervezet / Cég</div>
              <div className="text-sm font-bold text-white">{profile.companyName || 'Nincs megadva'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Role-Specific Saved & Authored Content Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-accent" size={20} />
            Mentett Kedvenc Tartalmak
          </h2>
          <div className="space-y-3">
            <div className="bg-[#161616] p-3.5 rounded-xl border border-[#222]">
              <div className="text-sm font-bold text-white">Monolitikus vasbeton szerkezetek zsaluzási technológiái</div>
              <div className="text-xs text-gray-500 mt-1">Cikk • Mentve: 2026.07.28</div>
            </div>
            <div className="bg-[#161616] p-3.5 rounded-xl border border-[#222]">
              <div className="text-sm font-bold text-white">Öntömörödő beton (SCC)</div>
              <div className="text-xs text-gray-500 mt-1">Fogalomtár • Mentve: 2026.07.28</div>
            </div>
          </div>
        </div>

        <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-accent" size={20} />
            Saját Beküldött Tartalmak
          </h2>
          <div className="space-y-3">
            <div className="bg-[#161616] p-3.5 rounded-xl border border-[#222] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Ipari fúrókalapácsok biztonságtechnikai előírásai</div>
                <div className="text-xs text-gray-500 mt-1">Szakmai Útmutató</div>
              </div>
              <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded">Publikálva</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
