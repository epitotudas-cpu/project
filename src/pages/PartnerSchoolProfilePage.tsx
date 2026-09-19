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
import { createInvitation } from '../services/partnerInvitationService';
import { getTradeItems } from '../services/tradeService';
import {
  Building2,
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Wrench,
  Key,
  GraduationCap,
  ShieldCheck,
  Plus,
  ChevronRight,
  FileText,
} from 'lucide-react';

interface PartnerSchoolProfilePageProps {
  onNavigateView?: (view: any) => void;
  onNavigate?: (page: string) => void;
}

export function PartnerSchoolProfilePage({ onNavigateView, onNavigate }: PartnerSchoolProfilePageProps) {
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

  // Instructor Management State
  const [instructors, setInstructors] = useState<
    Array<{ user_id: string; full_name?: string | null; email?: string | null; trades: string[] }>
  >([]);
  const [invitingInstructor, setInvitingInstructor] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTrade, setInviteTrade] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

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
        .select('partner_id, role, member_role, partner:partner_id(*)')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();

      let currentPartner: ExtendedPartner | null = null;
      if (puData && puData.partner) {
        currentPartner = puData.partner as ExtendedPartner;
      } else {
        // Fallback: Query partners table for category = 'iskola' or contact email match
        const { data: partnerByEmail } = await supabase
          .from('partners')
          .select('*')
          .or(`contact_email.eq.${user!.email},inquiry_email.eq.${user!.email}`)
          .limit(1)
          .maybeSingle();

        if (partnerByEmail) {
          currentPartner = partnerByEmail as ExtendedPartner;
        }
      }

      if (currentPartner) {
        setPartner(currentPartner);
        setName(currentPartner.name || '');
        setOfficialName(currentPartner.official_name || '');
        setPartnerType(currentPartner.partner_type || 'Oktatási Intézmény');
        setContactPersonName(currentPartner.contact_person_name || userProfile?.fullName || '');
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
    if (!inviteTrade) {
      setInviteErrorMsg('Kérjük, válassza ki az oktató szakmáját!');
      return;
    }

    setInvitingInstructor(true);
    setInviteErrorMsg(null);
    setInviteSuccessMsg(null);

    try {
      // 1. Create invitation
      await createInvitation({
        partnerId: partner.id,
        email: inviteEmail.trim(),
        organizationName: partner.name,
        organizationCategory: 'iskola',
      });

      setInviteSuccessMsg(`Sikeres meghívó elküldve a(z) ${inviteEmail} e-mail-címre!`);
      setInviteEmail('');
      setTimeout(() => setInviteSuccessMsg(null), 4000);
    } catch (err: any) {
      setInviteErrorMsg(err.message || 'Meghívó küldése nem sikerült.');
    } finally {
      setInvitingInstructor(false);
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
              Hivatalos kapcsolattartó: <strong className="text-white">{contactPersonName || userProfile?.fullName || 'Kapcsolattartó'}</strong> ({contactEmail || user?.email})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (onNavigate) onNavigate('teacher');
                else window.location.hash = '#teacher';
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              Tanári Vezérlőpult Megnyitása
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 mt-8 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Iskola &amp; Kapcsolattartói Adatok
          </button>
          <button
            onClick={() => setActiveTab('instructors')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'instructors'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Oktatók &amp; Tanárok Kezelése ({instructors.length})
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Iskolai Áttekintés &amp; Statisztika
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR NOTIFICATIONS */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white text-sm">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-950/80 border border-red-500/30 rounded-2xl text-red-300 text-sm font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white text-sm">✕</button>
        </div>
      )}

      {/* TAB 1: SCHOOL PROFILE FORM */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Oktatási Intézmény &amp; Kapcsolattartói Adatlap
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Szerkessze az iskola hivatalos adatait, elérhetőségeit és a kapcsolattartó információit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Intézmény Neve *
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
                Hivatalos Megnevezés / Hivatalos Cégnév
              </label>
              <input
                type="text"
                placeholder="pl. Budapesti Szakképzési Centrum..."
                value={officialName}
                onChange={(e) => setOfficialName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Intézmény Típusa
              </label>
              <input
                type="text"
                placeholder="pl. Szakképző Iskola, Gimnázium..."
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
                placeholder="https://..."
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Kapcsolattartói Adatok
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Kapcsolattartó Beosztása
                </label>
                <input
                  type="text"
                  placeholder="pl. Igazgatóhelyettes, Képzési vezető..."
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

      {/* TAB 2: INSTRUCTORS MANAGEMENT */}
      {activeTab === 'instructors' && (
        <div className="space-y-8">
          {/* Invite New Instructor Box */}
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
                <span className="text-3xl font-extrabold text-white">{instructors.length}</span>
                <p className="text-xs text-slate-400">Regisztrált Oktató</p>
              </div>
            </div>
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
