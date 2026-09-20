import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  updatePartner,
  assignInstructorTrade,
  listSchoolInstructors,
  listStudentInvitationCodes,
  listSchoolStudents,
  type ExtendedPartner,
  type StudentInvitationCode,
  type SchoolStudent,
} from '../services/partnerService';
import {
  createInvitation,
  sendInvitationEmail,
  listInvitations,
  revokeInvitation,
  updateInvitation,
  deleteInvitation,
  type PartnerInvitation,
} from '../services/partnerInvitationService';
import { getTradeItems } from '../services/tradeService';
import {
  Building2,
  Users,
  UserPlus,
  Mail,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Send,
  Check,
  Clock,
  RefreshCw,
  X,
} from 'lucide-react';

interface PartnerSchoolProfilePageProps {
  onNavigateView?: (view: any) => void;
  onNavigate?: (page: string) => void;
}

export function PartnerSchoolProfilePage({ onNavigateView, onNavigate }: PartnerSchoolProfilePageProps) {
  void onNavigateView;
  const { user, profile: userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Partner / School State
  const [partner, setPartner] = useState<ExtendedPartner | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'instructors' | 'overview'>('profile');

  // School Profile Form Fields
  const [name, setName] = useState('');
  const [officialName, setOfficialName] = useState('');
  const [partnerType, setPartnerType] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonTitle, setContactPersonTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [description, setDescription] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // Registered Instructor Management State
  const [instructors, setInstructors] = useState<
    Array<{ user_id: string; full_name?: string | null; email?: string | null; trades: string[] }>
  >([]);
  const [invitingInstructor, setInvitingInstructor] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTrade, setInviteTrade] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

  // Invitations State
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([]);
  const [editingInvitation, setEditingInvitation] = useState<PartnerInvitation | null>(null);
  const [editInviteEmail, setEditInviteEmail] = useState('');
  const [editInviteExpiresAt, setEditInviteExpiresAt] = useState('');
  const [editInviteStatus, setEditInviteStatus] = useState<'active' | 'used' | 'revoked' | 'expired'>('active');
  const [savingEditInvite, setSavingEditInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Additional Instructor Trade Modal State
  const [selectedInstructorForTrade, setSelectedInstructorForTrade] = useState<{
    user_id: string;
    full_name?: string | null;
  } | null>(null);
  const [addTradeId, setAddTradeId] = useState('');
  const [addingTrade, setAddingTrade] = useState(false);

  // School Overview Metrics
  const [invitationCodes, setInvitationCodes] = useState<StudentInvitationCode[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<SchoolStudent[]>([]);

  // Trades catalog
  const availableTrades = getTradeItems();

  useEffect(() => {
    if (!user) return;
    loadSchoolData();
  }, [user]);

  const loadSchoolData = async () => {
    setLoading(true);
    try {
      // 1. Fetch partner user linkage
      const { data: puData } = await supabase
        .from('partner_users')
        .select('partner_id, member_role, partner:partner_id(*)')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();

      let currentPartner: ExtendedPartner | null = null;
      if (puData && puData.partner) {
        currentPartner = (Array.isArray(puData.partner) ? puData.partner[0] : puData.partner) as unknown as ExtendedPartner;
      }

      if (!currentPartner && user?.email) {
        // Fallback 1: Query partners table by contact_email
        const { data: partnerByEmail } = await supabase
          .from('partners')
          .select('*')
          .eq('contact_email', user.email)
          .limit(1)
          .maybeSingle();

        if (partnerByEmail) {
          currentPartner = partnerByEmail as ExtendedPartner;
        }
      }

      if (!currentPartner && userProfile?.full_name) {
        // Fallback 2: Query partners table by contact_person_name matching user full_name
        const { data: partnerByName } = await supabase
          .from('partners')
          .select('*')
          .ilike('contact_person_name', `%${userProfile.full_name}%`)
          .limit(1)
          .maybeSingle();

        if (partnerByName) {
          currentPartner = partnerByName as ExtendedPartner;
        }
      }

      if (!currentPartner) {
        // Fallback 3: Query partners table for category = 'iskola'
        const { data: latestSchool } = await supabase
          .from('partners')
          .select('*')
          .eq('category', 'iskola')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestSchool) {
          currentPartner = latestSchool as ExtendedPartner;
        } else {
          // Fallback 4: Any active partner
          const { data: anyPartner } = await supabase
            .from('partners')
            .select('*')
            .limit(1)
            .maybeSingle();

          if (anyPartner) {
            currentPartner = anyPartner as ExtendedPartner;
          }
        }
      }

      if (currentPartner) {
        setPartner(currentPartner);
        setName(currentPartner.name || '');
        setOfficialName(currentPartner.official_name || '');
        setPartnerType(currentPartner.partner_type || 'Oktatási Intézmény');
        setContactPersonName(currentPartner.contact_person_name || userProfile?.full_name || '');
        setContactPersonTitle(currentPartner.contact_person_title || 'Iskolai Kapcsolattartó');
        setContactEmail(currentPartner.contact_email || user!.email || '');
        setContactPhone(currentPartner.contact_phone || '');
        setAddress(currentPartner.address || '');
        setZipCode(currentPartner.zip_code || '');
        setCity(currentPartner.city || '');
        setCounty(currentPartner.county || '');
        setWebsiteUrl(currentPartner.website_url || '');
        setBusinessHours(currentPartner.business_hours || '');
        setDescription(currentPartner.description || '');
        setDetailedDescription(currentPartner.detailed_description || '');
        setLogoUrl(currentPartner.logo_url || '');
        setCoverUrl(currentPartner.cover_url || '');

        // Load instructors
        const instructorList = await listSchoolInstructors(currentPartner.id);
        setInstructors(instructorList);

        // Load invitations
        const invList = await listInvitations(currentPartner.id);
        setInvitations(invList);

        // Load codes & students
        const codes = await listStudentInvitationCodes(currentPartner.id);
        setInvitationCodes(codes);

        const students = await listSchoolStudents(currentPartner.id);
        setEnrolledStudents(students);
      }
    } catch (err) {
      console.error('Error loading school data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await updatePartner(partner.id, {
        name,
        official_name: officialName,
        partner_type: partnerType,
        contact_person_name: contactPersonName,
        contact_person_title: contactPersonTitle,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address,
        zip_code: zipCode,
        city,
        county,
        website_url: websiteUrl,
        business_hours: businessHours,
        description,
        detailed_description: detailedDescription,
        logo_url: logoUrl,
        cover_url: coverUrl,
      });

      setPartner(updated);
      setSuccessMsg('Az iskola és kapcsolattartói adatai sikeresen frissültek!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Hiba történt az adatok mentésekor.');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    if (!inviteEmail.trim()) {
      setInviteErrorMsg('Kérjük, adja meg az oktató e-mail-címét!');
      return;
    }

    setInvitingInstructor(true);
    setInviteErrorMsg(null);
    setInviteSuccessMsg(null);

    try {
      // 1. Create invitation row in DB
      const inv = await createInvitation({
        partnerId: partner.id,
        email: inviteEmail.trim(),
        organizationName: partner.name,
        organizationCategory: 'iskola',
      });

      // 2. Trigger invitation email sending
      const emailRes = await sendInvitationEmail(inv, inviteEmail.trim());

      if (emailRes.success) {
        setInviteSuccessMsg(`Sikeresen létrejött a meghívó, és kiküldtük az e-mailt a(z) ${inviteEmail.trim()} címre! (Kód: ${inv.code})`);
      } else {
        setInviteSuccessMsg(`A meghívó létrejött a rendszerben! Meghívókód: ${inv.code}. Az e-mail értesítő kódja a lenti listában is megtekinthető és másolható.`);
      }

      setInviteEmail('');
      setInviteTrade('');

      // 3. Reload invitations & instructors
      const updatedInvs = await listInvitations(partner.id);
      setInvitations(updatedInvs);

      const updatedInstructors = await listSchoolInstructors(partner.id);
      setInstructors(updatedInstructors);
    } catch (err: any) {
      setInviteErrorMsg(err.message || 'Meghívó küldése nem sikerült.');
    } finally {
      setInvitingInstructor(false);
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleResendInvitation = async (inv: PartnerInvitation) => {
    try {
      const res = await sendInvitationEmail(inv);
      if (res.success) {
        alert(`Meghívó e-mail sikeresen újraküldve a(z) ${inv.email} címre!`);
      } else {
        alert(`Meghívó azonosító kód: ${inv.code}. Használhatja a közvetlen kódmásolást is.`);
      }
    } catch (err: any) {
      alert(`Újraküldés hiba: ${err.message || err}`);
    }
  };

  const handleRevokeInvitation = async (invId: string) => {
    if (!confirm('Biztosan vissza szeretné vonni ezt a meghívót?')) return;
    try {
      await revokeInvitation(invId);
      if (partner) {
        const updated = await listInvitations(partner.id);
        setInvitations(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Visszavonás nem sikerült.');
    }
  };

  const handleDeleteInvitation = async (invId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a meghívót a listából?')) return;
    try {
      await deleteInvitation(invId);
      if (partner) {
        const updated = await listInvitations(partner.id);
        setInvitations(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Törlés nem sikerült.');
    }
  };

  const handleOpenEditInvitation = (inv: PartnerInvitation) => {
    setEditingInvitation(inv);
    setEditInviteEmail(inv.email);
    setEditInviteExpiresAt(inv.expires_at ? inv.expires_at.split('T')[0] : '');
    setEditInviteStatus(inv.status);
  };

  const handleSaveEditedInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvitation || !partner) return;
    setSavingEditInvite(true);
    try {
      const formattedExpires = editInviteExpiresAt ? new Date(editInviteExpiresAt).toISOString() : editingInvitation.expires_at;
      await updateInvitation(editingInvitation.id, {
        email: editInviteEmail.trim(),
        status: editInviteStatus,
        expires_at: formattedExpires,
      });

      const updated = await listInvitations(partner.id);
      setInvitations(updated);
      setEditingInvitation(null);
    } catch (err: any) {
      alert(err.message || 'Meghívó frissítése nem sikerült.');
    } finally {
      setSavingEditInvite(false);
    }
  };

  const handleAddTradeToInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !selectedInstructorForTrade || !addTradeId) return;

    setAddingTrade(true);
    try {
      await assignInstructorTrade(partner.id, selectedInstructorForTrade.user_id, addTradeId);
      const updatedInstructors = await listSchoolInstructors(partner.id);
      setInstructors(updatedInstructors);
      setSelectedInstructorForTrade(null);
      setAddTradeId('');
    } catch (err: any) {
      alert(err.message || 'Szakma hozzárendelése nem sikerült.');
    } finally {
      setAddingTrade(false);
    }
  };

  function renderInvitationStatusBadge(status: 'active' | 'used' | 'revoked' | 'expired') {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
            <Clock className="w-3.5 h-3.5" /> Aktív (Még nem aktiválta)
          </span>
        );
      case 'used':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aktiválva / Regisztrált
          </span>
        );
      case 'revoked':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3.5 h-3.5" /> Visszavonva
          </span>
        );
      case 'expired':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30 flex items-center gap-1 w-fit">
            <Clock className="w-3.5 h-3.5" /> Lejárt
          </span>
        );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              Szervezeti &amp; Iskolai Kezelőfelület
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {name || 'Oktatási Intézmény Kezelése'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Hivatalos kapcsolattartó: <strong className="text-white">{contactPersonName || userProfile?.full_name || 'Kapcsolattartó'}</strong> ({contactEmail || user?.email})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (onNavigate) onNavigate('teacher');
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10"
            >
              <GraduationCap className="w-4 h-4" />
              Tanári Vezérlőpult Megnyitása
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-400 hover:text-white">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-950/80 border border-red-500/30 rounded-2xl text-red-300 text-xs font-bold flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-xs text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-blue-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Iskolai Alapadatok &amp; Szerkesztés
        </button>

        <button
          onClick={() => setActiveTab('instructors')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'instructors'
              ? 'bg-blue-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Oktatók &amp; Meghívók Kezelése ({instructors.length + invitations.length})
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-blue-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          Szervezeti Áttekintés &amp; Statisztikák
        </button>
      </div>

      {/* TAB 1: SCHOOL PROFILE FORM */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Intézményi Alapadatok
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Iskola Megnevezése *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Hivatalos Megnevezés (pl. Kft. / OM Azonosító)
                </label>
                <input
                  type="text"
                  value={officialName}
                  onChange={(e) => setOfficialName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Szervezet Típusa
                </label>
                <input
                  type="text"
                  value={partnerType}
                  onChange={(e) => setPartnerType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Weboldal URL
                </label>
                <input
                  type="url"
                  placeholder="https://iskola.hu"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Kapcsolattartó Elérhetőségek
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kapcsolattartó Neve *
                </label>
                <input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kapcsolattartó Titulusa / Beosztása
                </label>
                <input
                  type="text"
                  placeholder="pl. Igazgatóhelyettes / Szakmai Vezető"
                  value={contactPersonTitle}
                  onChange={(e) => setContactPersonTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Kapcsolattartó E-mail Címe *
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Telefonszám
                </label>
                <input
                  type="tel"
                  placeholder="+36 1 234 5678"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              Cím &amp; Székhely
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Irányítószám</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Város</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Vármegye</label>
                <input
                  type="text"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Utca, házszám</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 text-sm"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-black border-r-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Módosítások Mentése
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: INSTRUCTORS & INVITATIONS MANAGEMENT */}
      {activeTab === 'instructors' && (
        <div className="space-y-8">
          {/* Invite New Instructor Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Új Oktató / Tanár Meghívása
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Küldjön szervezeti meghívót az oktató e-mail-címére. Az oktató a regisztráció elfogadása után automatikusan megkapja az oktatói jogosultságot.
            </p>

            {inviteSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {inviteSuccessMsg}
              </div>
            )}
            {inviteErrorMsg && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                {inviteErrorMsg}
              </div>
            )}

            <form onSubmit={handleInviteInstructor} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Oktató E-mail Címe *
                </label>
                <input
                  type="email"
                  placeholder="oktato@iskola.hu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Oktatott Szakma *
                </label>
                <select
                  value={inviteTrade}
                  onChange={(e) => setInviteTrade(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  required
                >
                  <option value="">Válasszon szakmát...</option>
                  {availableTrades.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={invitingInstructor}
                  className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {invitingInstructor ? (
                    <div className="w-5 h-5 border-2 border-black border-r-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Meghívó Küldése
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Kiküldött Meghívók Listája */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  Kiküldött Oktatói Meghívók ({invitations.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  A kiküldött meghívók státusza, egyedi kódja, másolása és szerkesztése.
                </p>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                Még nincs kiküldött meghívó a szervezetben.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Címzett E-mail</th>
                      <th className="py-3 px-4">Meghívókód</th>
                      <th className="py-3 px-4">Státusz</th>
                      <th className="py-3 px-4">Kiküldve / Lejár</th>
                      <th className="py-3 px-4 text-right rounded-r-lg">Műveletek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {inv.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className="bg-slate-800 px-2 py-1 rounded text-amber-300 border border-slate-700 font-bold">
                              {inv.code}
                            </span>
                            <button
                              onClick={() => handleCopyInviteCode(inv.code)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Kód másolása"
                            >
                              {copiedCode === inv.code ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {renderInvitationStatusBadge(inv.status)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          <div>{new Date(inv.created_at).toLocaleDateString('hu-HU')}</div>
                          <div className="text-[11px] text-slate-500">
                            Lejár: {new Date(inv.expires_at).toLocaleDateString('hu-HU')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleResendInvitation(inv)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-700 transition-colors"
                              title="Meghívó e-mail újraküldése"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditInvitation(inv)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 transition-colors"
                              title="Meghívó szerkesztése"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {inv.status === 'active' && (
                              <button
                                onClick={() => handleRevokeInvitation(inv.id)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-lg border border-slate-700 transition-colors"
                                title="Visszavonás"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvitation(inv.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-rose-400 rounded-lg border border-slate-700 hover:border-rose-800/40 transition-colors"
                              title="Törlés"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Registered Instructors List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Regisztrált Oktatók az Iskolában ({instructors.length})</h3>

            {instructors.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Még nincs regisztrált oktató a szervezethez csatolva. Küldjön meghívót a fenti űrlapon!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Oktató Neve</th>
                      <th className="py-3 px-4">E-mail Cím</th>
                      <th className="py-3 px-4">Hozzárendelt Szakmák</th>
                      <th className="py-3 px-4 text-right rounded-r-lg">Műveletek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {instructors.map((ins) => (
                      <tr key={ins.user_id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {ins.full_name || 'Oktató'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{ins.email || '-'}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {ins.trades.map((tr) => (
                              <span
                                key={tr}
                                className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md"
                              >
                                {tr}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedInstructorForTrade(ins)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Új Szakma Hozzáadása
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">{enrolledStudents.length}</span>
                <p className="text-xs text-slate-400">Beiratkozott Tanuló</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">{invitationCodes.length}</span>
                <p className="text-xs text-slate-400">Generált Osztálytermi Kód</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <span className="text-3xl font-extrabold text-white">{instructors.length + invitations.length}</span>
                <p className="text-xs text-slate-400">Összes Oktató / Meghívó</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT INVITATION MODAL */}
      {editingInvitation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                Meghívó Szerkesztése
              </h3>
              <button
                onClick={() => setEditingInvitation(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedInvitation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Címzett E-mail Cím *
                </label>
                <input
                  type="email"
                  value={editInviteEmail}
                  onChange={(e) => setEditInviteEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Meghívó Státusza
                </label>
                <select
                  value={editInviteStatus}
                  onChange={(e) => setEditInviteStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  <option value="active">Aktív (Még nem aktiválta)</option>
                  <option value="used">Aktiválva / Regisztrált</option>
                  <option value="revoked">Visszavonva</option>
                  <option value="expired">Lejárt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Lejárati Dátum
                </label>
                <input
                  type="date"
                  value={editInviteExpiresAt}
                  onChange={(e) => setEditInviteExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingInvitation(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={savingEditInvite}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  {savingEditInvite ? 'Mentés...' : 'Mentés'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TRADE TO INSTRUCTOR MODAL */}
      {selectedInstructorForTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Új Szakma Hozzárendelése ({selectedInstructorForTrade.full_name})
            </h3>
            <form onSubmit={handleAddTradeToInstructor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Választott Szakma *
                </label>
                <select
                  value={addTradeId}
                  onChange={(e) => setAddTradeId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  required
                >
                  <option value="">Válasszon szakmát...</option>
                  {availableTrades.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInstructorForTrade(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={addingTrade}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  {addingTrade ? 'Hozzáadás...' : 'Szakma Hozzáadása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerSchoolProfilePage;
