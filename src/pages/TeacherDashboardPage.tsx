import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  listInstructorClasses,
  createSchoolClass,
  generateStudentInvitationCode,
  listSchoolStudents,
  listClassMaterials,
  assignMaterialsToClass,
  removeClassMaterial,
  type SchoolClass,
  type SchoolStudent,
  type ClassMaterial,
  type StudentInvitationCode,
} from '../services/partnerService';
import { DEFAULT_COURSES } from '../services/educationService';
import {
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  Key,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  School,
  Sparkles,
  ShieldCheck,
  FileText,
  Wrench,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
} from 'lucide-react';

interface TradeInfo {
  trade_id: string;
  trade_name?: string;
}

export const TeacherDashboardPage: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<{ id: string; name: string } | null>(null);
  const [instructorTrades, setInstructorTrades] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // New Class Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<number | ''>(10);
  const [newClassTrade, setNewClassTrade] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [submittingClass, setSubmittingClass] = useState(false);

  // Selected Class Detailed Data
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [classStudents, setClassStudents] = useState<SchoolStudent[]>([]);
  const [classMaterials, setClassMaterials] = useState<ClassMaterial[]>([]);
  const [activeCode, setActiveCode] = useState<StudentInvitationCode | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Material Management State
  const [activeTab, setActiveTab] = useState<'students' | 'materials'>('students');
  const [materialSearch, setMaterialSearch] = useState('');
  const [assignedMaterialIds, setAssignedMaterialIds] = useState<Set<string>>(new Set());
  const [savingMaterials, setSavingMaterials] = useState(false);
  const [materialSaveSuccess, setMaterialSaveSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadTeacherData();
  }, [user]);

  useEffect(() => {
    if (selectedClassId && schoolInfo) {
      loadClassDetails(selectedClassId);
    }
  }, [selectedClassId, schoolInfo]);

  const loadTeacherData = async () => {
    setLoading(true);
    try {
      // 1. Find school partner_id where user is instructor or staff
      const { data: partnerUserData, error: puError } = await supabase
        .from('partner_users')
        .select('partner_id, role, member_role, partner:partner_id(id, name)')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();

      if (puError || !partnerUserData) {
        setLoading(false);
        return;
      }

      const partnerId = partnerUserData.partner_id;
      const partnerName = (partnerUserData.partner as any)?.name || 'Iskola / Szervezet';
      setSchoolInfo({ id: partnerId, name: partnerName });

      // 2. Fetch instructor trades
      const { data: tradesData } = await supabase
        .from('partner_user_trades')
        .select('trade_id')
        .eq('partner_id', partnerId)
        .eq('user_id', user!.id);

      const trades = (tradesData || []).map((t) => t.trade_id);
      setInstructorTrades(trades);
      if (trades.length > 0) {
        setNewClassTrade(trades[0]);
      }

      // 3. Fetch instructor classes
      const loadedClasses = await listInstructorClasses(partnerId, user!.id);
      setClasses(loadedClasses);
    } catch (err) {
      console.error('Error loading teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassDetails = async (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls || !schoolInfo) return;

    setSelectedClass(cls);
    setActiveCode(cls.active_code || null);

    // Fetch students
    const students = await listSchoolStudents(schoolInfo.id, user!.id, undefined, classId);
    setClassStudents(students);

    // Fetch materials
    const materials = await listClassMaterials(classId);
    setClassMaterials(materials);
    const assignedIds = new Set(materials.map((m) => `${m.content_type}:${m.content_id}`));
    setAssignedMaterialIds(assignedIds);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolInfo || !user) return;
    if (!newClassName.trim()) {
      setCreateError('Kérjük, adja meg az osztály nevét (pl. 10.A)!');
      return;
    }
    if (!newClassTrade) {
      setCreateError('Kérjük, válasszon szakmát!');
      return;
    }

    setSubmittingClass(true);
    setCreateError(null);
    try {
      // 1. Create Class
      const newClass = await createSchoolClass({
        schoolId: schoolInfo.id,
        instructorId: user.id,
        tradeId: newClassTrade,
        name: newClassName.trim(),
        grade: typeof newClassGrade === 'number' ? newClassGrade : null,
      });

      // 2. Automatically generate invitation code valid for 90 days
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const code = await generateStudentInvitationCode({
        schoolId: schoolInfo.id,
        instructorId: user.id,
        tradeId: newClassTrade,
        classId: newClass.id,
        expiresAt,
        maxUses: 100,
      });

      newClass.active_code = code;

      setClasses([newClass, ...classes]);
      setShowCreateModal(false);
      setNewClassName('');
      setSelectedClassId(newClass.id);
    } catch (err: any) {
      setCreateError(err.message || 'Hiba történt az osztály létrehozásakor.');
    } finally {
      setSubmittingClass(false);
    }
  };

  const handleGenerateNewCode = async () => {
    if (!selectedClass || !schoolInfo || !user) return;
    setGeneratingCode(true);
    try {
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const code = await generateStudentInvitationCode({
        schoolId: schoolInfo.id,
        instructorId: user.id,
        tradeId: selectedClass.trade_id,
        classId: selectedClass.id,
        expiresAt,
        maxUses: 100,
      });

      setActiveCode(code);
      // Update local class state
      setClasses(
        classes.map((c) => (c.id === selectedClass.id ? { ...c, active_code: code } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Kód generálása nem sikerült.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const toggleMaterialAssignment = (contentType: 'course' | 'article', contentId: string) => {
    const key = `${contentType}:${contentId}`;
    const next = new Set(assignedMaterialIds);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setAssignedMaterialIds(next);
  };

  const handleSaveMaterials = async () => {
    if (!selectedClass) return;
    setSavingMaterials(true);
    setMaterialSaveSuccess(false);

    try {
      const currentAssigned = new Set(classMaterials.map((m) => `${m.content_type}:${m.content_id}`));

      // Materials to add
      const toAdd: Array<{ content_type: 'course' | 'article'; content_id: string }> = [];
      assignedMaterialIds.forEach((key) => {
        if (!currentAssigned.has(key)) {
          const [type, id] = key.split(':');
          toAdd.push({ content_type: type as 'course' | 'article', content_id: id });
        }
      });

      // Materials to remove
      const toRemove: Array<{ content_type: string; content_id: string }> = [];
      currentAssigned.forEach((key) => {
        if (!assignedMaterialIds.has(key)) {
          const [type, id] = key.split(':');
          toRemove.push({ content_type: type, content_id: id });
        }
      });

      if (toAdd.length > 0) {
        await assignMaterialsToClass(selectedClass.id, toAdd);
      }

      for (const item of toRemove) {
        await removeClassMaterial(selectedClass.id, item.content_type, item.content_id);
      }

      const updatedMaterials = await listClassMaterials(selectedClass.id);
      setClassMaterials(updatedMaterials);
      setMaterialSaveSuccess(true);
      setTimeout(() => setMaterialSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Tananyagok mentése nem sikerült.');
    } finally {
      setSavingMaterials(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent" />
      </div>
    );
  }

  if (!schoolInfo) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white p-8 flex items-center justify-center">
        <div className="max-w-md text-center bg-[#141414] p-8 rounded-2xl border border-[#262626]">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nincs Iskolai Tagság</h2>
          <p className="text-gray-400 mb-6">
            Ön jelenleg nem áll kapcsolatban regisztrált oktatási intézménnyel, vagy a fiókja még nem kapott oktatói megbízást.
          </p>
          <button
            onClick={() => onNavigate?.('profile')}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
          >
            Vissza a Profilhoz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
      {/* Top Navigation Banner */}
      <div className="bg-[#141414] border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-500 font-medium text-sm mb-1">
                <School className="w-4 h-4" />
                <span>{schoolInfo.name}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400">Oktatói Vezérlőpult</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-amber-500" />
                Osztályok és Tananyagok Kezelése
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('profile')}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-[#1F1F1F] hover:bg-[#262626] rounded-xl transition-colors"
              >
                Saját Profil
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/10"
              >
                <Plus className="w-5 h-5" />
                Új Osztály Létrehozása
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {!selectedClassId ? (
          /* MULTI-CLASS LIST VIEW */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Saját Osztályok ({classes.length})
              </h2>
            </div>

            {classes.length === 0 ? (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-12 text-center max-w-xl mx-auto">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Még nincs rögzített osztály</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Hozza létre első osztályát (pl. "10.A"), hogy automatikusan egyedi csatlakozási kódot generálhasson és tananyagokat rendelhessen a tanulókhoz.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Új Osztály Indítása
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-[#141414] border border-[#262626] hover:border-amber-500/40 rounded-2xl p-6 flex flex-col justify-between transition-all group shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                            {cls.grade ? `${cls.grade}. Évfolyam` : 'Képzés'}
                          </span>
                          <h3 className="text-2xl font-bold text-white mt-2 group-hover:text-amber-400 transition-colors">
                            {cls.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-300 bg-[#1F1F1F] px-3 py-1 rounded-full border border-[#262626]">
                            {cls.students_count || 0} tanuló
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-400 mb-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-gray-500" />
                          <span>Szakma: <strong className="text-gray-200">{cls.trade_id}</strong></span>
                        </div>
                        {cls.active_code ? (
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-amber-500" />
                            <span>Kód: <code className="text-amber-400 font-mono font-bold">{cls.active_code.code}</code></span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Key className="w-4 h-4" />
                            <span>Nincs aktív kód</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1F1F1F] flex items-center justify-between">
                      <button
                        onClick={() => setSelectedClassId(cls.id)}
                        className="w-full py-2.5 bg-[#1F1F1F] hover:bg-amber-500 hover:text-black text-gray-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        Osztály Megnyitása & Kezelése
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* SINGLE CLASS DETAILED VIEW */
          <div>
            {/* Header & Back Button */}
            <button
              onClick={() => setSelectedClassId(null)}
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Vissza az összes osztályhoz
            </button>

            {selectedClass && (
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                        {selectedClass.grade ? `${selectedClass.grade}. Évfolyam` : 'Képzés'}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Szakma: {selectedClass.trade_id}
                      </span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white">{selectedClass.name} Osztály</h2>
                  </div>

                  {/* Active Code Box */}
                  <div className="bg-[#1A1A1A] border border-[#2B2B2B] rounded-xl p-4 flex items-center gap-4">
                    <div>
                      <div className="text-xs text-gray-400 font-medium">Osztálytermi Csatlakozási Kód:</div>
                      {activeCode ? (
                        <div className="text-2xl font-black text-amber-400 font-mono tracking-wider mt-0.5">
                          {activeCode.code}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">Még nem jött létre kód</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {activeCode && (
                        <button
                          onClick={() => handleCopyCode(activeCode.code)}
                          className="p-2.5 bg-[#262626] hover:bg-[#333333] text-gray-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                          title="Másolás vágólapra"
                        >
                          {codeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          {codeCopied ? 'Másolva' : 'Másolás'}
                        </button>
                      )}
                      <button
                        onClick={handleGenerateNewCode}
                        disabled={generatingCode}
                        className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                        title="Új kód generálása"
                      >
                        <RefreshCw className={`w-4 h-4 ${generatingCode ? 'animate-spin' : ''}`} />
                        Új Kód
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 mt-8 border-b border-[#262626]">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                      activeTab === 'students'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Tanulók Listája ({classStudents.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
                      activeTab === 'materials'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Tananyagok Hozzárendelése ({classMaterials.length})
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENTS */}
            {activeTab === 'students' ? (
              /* STUDENTS TAB */
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">A(z) {selectedClass?.name} Osztály Tanulói</h3>
                {classStudents.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-base font-semibold text-gray-300">Még egyetlen tanuló sem csatlakozott ehhez az osztályhoz.</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Adja meg a diákoknak az osztálytermi kódot (<strong className="text-amber-400">{activeCode?.code}</strong>), akik a profiljukban beváltva azonnal megjelennek itt!
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead className="bg-[#1F1F1F] text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="py-3 px-4 rounded-l-lg">Tanuló Neve</th>
                          <th className="py-3 px-4">E-mail Cím</th>
                          <th className="py-3 px-4">Csatlakozott</th>
                          <th className="py-3 px-4 rounded-r-lg">Státusz</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F1F1F]">
                        {classStudents.map((st) => (
                          <tr key={st.id} className="hover:bg-[#1A1A1A]">
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {st.profiles?.full_name || 'Névtelen tanuló'}
                            </td>
                            <td className="py-3.5 px-4 text-gray-400">{st.profiles?.email || '-'}</td>
                            <td className="py-3.5 px-4 text-gray-400">
                              {new Date(st.joined_at).toLocaleDateString('hu-HU')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                                Aktív
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* MATERIALS TAB */
              <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Osztályhoz Kiosztott Tananyagok</h3>
                    <p className="text-sm text-gray-400">
                      Jelölje ki a tananyagokat, amelyeket a(z) <strong className="text-white">{selectedClass?.name}</strong> osztály tanulói számára szeretne elérhetővé tenni.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveMaterials}
                    disabled={savingMaterials}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                  >
                    {savingMaterials ? (
                      <div className="w-5 h-5 border-2 border-black border-r-transparent animate-spin rounded-full" />
                    ) : materialSaveSuccess ? (
                      <>
                        <Check className="w-5 h-5" />
                        Mentve!
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Hozzárendelések Mentése
                      </>
                    )}
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                  <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Tananyag keresése cím vagy kategória alapján..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>

                {/* Courses Selection List */}
                <div className="space-y-3">
                  {DEFAULT_COURSES.filter(
                    (c) =>
                      c.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
                      c.category.toLowerCase().includes(materialSearch.toLowerCase())
                  ).map((course) => {
                    const key = `course:${course.id}`;
                    const isChecked = assignedMaterialIds.has(key);
                    return (
                      <div
                        key={course.id}
                        onClick={() => toggleMaterialAssignment('course', course.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-[#1A1A1A] border-[#262626] hover:border-gray-700 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-amber-500">
                            {isChecked ? <CheckSquare className="w-6 h-6 text-amber-500" /> : <Square className="w-6 h-6 text-gray-600" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-[#262626] text-amber-400 rounded mr-2">
                              Kurzus
                            </span>
                            <span className="text-xs text-gray-400">{course.category}</span>
                            <h4 className="text-base font-bold text-white mt-0.5">{course.title}</h4>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{course.description}</p>
                          </div>
                        </div>

                        <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                          {course.duration_hours} óra
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE CLASS MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-amber-500" />
                Új Osztály Indítása
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Osztály Neve *
                </label>
                <input
                  type="text"
                  placeholder="pl. 10.A vagy Kőműves I. Csoport"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Évfolyam (Opcionális)
                </label>
                <input
                  type="number"
                  placeholder="pl. 10"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Oktatott Szakma *
                </label>
                {instructorTrades.length === 0 ? (
                  <input
                    type="text"
                    placeholder="Szakma megadása (pl. Kőműves)"
                    value={newClassTrade}
                    onChange={(e) => setNewClassTrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-sm"
                    required
                  />
                ) : (
                  <select
                    value={newClassTrade}
                    onChange={(e) => setNewClassTrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white focus:outline-none focus:border-amber-500 text-sm"
                  >
                    {instructorTrades.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={submittingClass}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  {submittingClass ? (
                    <div className="w-5 h-5 border-2 border-black border-r-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Létrehozás & Kód Generálása
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardPage;
