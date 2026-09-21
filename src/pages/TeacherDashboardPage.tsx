import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  listInstructorClasses,
  createSchoolClass,
  updateSchoolClass,
  deleteSchoolClass,
  removeStudentFromClass,
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
import { DEFAULT_COURSES, DEFAULT_QUESTIONS, type Course } from '../services/educationService';
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
  Wrench,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Edit3,
  Trash2,
  X,
  LayoutDashboard,
  Layers,
  FileCheck,
  TrendingUp,
  User,
  Share2,
  ExternalLink,
  Eye,
  Award,
  Clock,
  ArrowUp,
  ArrowDown,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export interface TeacherDashboardPageProps {
  onNavigate?: (page: string) => void;
  activeView?: string;
  onNavigateView?: (view: any) => void;
}

export interface CustomPackageItem {
  id: string;
  title: string;
  contentType: 'course' | 'article' | 'guide' | 'book' | 'video' | 'quiz';
}

export interface CustomPackage {
  id: string;
  title: string;
  description: string;
  tradeId: string;
  topic: string;
  targetGroup: string;
  items: CustomPackageItem[];
  status: 'draft' | 'compiled' | 'assigned' | 'archived';
  createdAt: string;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({
  onNavigate,
  activeView = 'dashboard',
  onNavigateView,
}) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<{ id: string; name: string } | null>(null);
  const [instructorTrades, setInstructorTrades] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [allStudents, setAllStudents] = useState<SchoolStudent[]>([]);
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

  // Class Details Tab
  const [classDetailTab, setClassDetailTab] = useState<'overview' | 'students' | 'materials' | 'tests' | 'code'>('overview');

  // Student Detail Modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<SchoolStudent | null>(null);

  // Edit Class Form State
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassGrade, setEditClassGrade] = useState<number | ''>('');
  const [savingEditClass, setSavingEditClass] = useState(false);
  const [editClassError, setEditClassError] = useState<string | null>(null);

  // Material Assignment & Selector State
  const [materialSearch, setMaterialSearch] = useState('');
  const [assignedMaterialIds, setAssignedMaterialIds] = useState<Set<string>>(new Set());
  const [savingMaterials, setSavingMaterials] = useState(false);
  const [materialSaveSuccess, setMaterialSaveSuccess] = useState(false);
  const [assignModalMaterial, setAssignModalMaterial] = useState<{ type: 'course' | 'article'; id: string; title: string } | null>(null);
  const [selectedAssignClassId, setSelectedAssignClassId] = useState<string>('');

  // Custom Package Builder State
  const [customPackages, setCustomPackages] = useState<CustomPackage[]>([]);
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');
  const [pkgTrade, setPkgTrade] = useState('');
  const [pkgTopic, setPkgTopic] = useState('');
  const [pkgTarget, setPkgTarget] = useState('');
  const [pkgItems, setPkgItems] = useState<CustomPackageItem[]>([]);

  // Filter States for Progress & Tests
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState<string>('');

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
        .select('partner_id, member_role')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();

      if (puError || !partnerUserData) {
        setLoading(false);
        return;
      }

      const partnerId = partnerUserData.partner_id;
      let partnerName = 'Iskola / Szervezet';
      if (partnerId) {
        const { data: pRec } = await supabase
          .from('partners')
          .select('name')
          .eq('id', partnerId)
          .maybeSingle();
        if (pRec?.name) {
          partnerName = pRec.name;
        }
      }
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
        setPkgTrade(trades[0]);
      }

      // 3. Fetch instructor classes
      const loadedClasses = await listInstructorClasses(partnerId, user!.id);
      setClasses(loadedClasses);

      // 4. Fetch all students across classes for aggregated view
      const studentsList = await listSchoolStudents(partnerId, user!.id);
      setAllStudents(studentsList);
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

  const handleOpenEditClass = (cls: SchoolClass) => {
    setEditingClass(cls);
    setEditClassName(cls.name);
    setEditClassGrade(cls.grade ?? '');
    setEditClassError(null);
  };

  const handleSaveEditedClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (!editClassName.trim()) {
      setEditClassError('Kérjük, adja meg az osztály nevét!');
      return;
    }

    setSavingEditClass(true);
    setEditClassError(null);
    try {
      const updated = await updateSchoolClass(editingClass.id, {
        name: editClassName.trim(),
        grade: typeof editClassGrade === 'number' ? editClassGrade : null,
      });

      setClasses(classes.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      if (selectedClass?.id === updated.id) {
        setSelectedClass({ ...selectedClass, ...updated });
      }
      setEditingClass(null);
    } catch (err: any) {
      setEditClassError(err.message || 'Osztály frissítése nem sikerült.');
    } finally {
      setSavingEditClass(false);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Biztosan törölni szeretné a(z) "${className}" osztályt? A törlés nem vonható vissza.`)) return;

    try {
      await deleteSchoolClass(classId);
      setClasses(classes.filter((c) => c.id !== classId));
      if (selectedClassId === classId) {
        setSelectedClassId(null);
        setSelectedClass(null);
      }
    } catch (err: any) {
      alert(err.message || 'Osztály törlése nem sikerült.');
    }
  };

  const handleRemoveStudentFromClass = async (studentId: string, classId: string, fullName?: string | null) => {
    if (
      !confirm(
        `Biztosan el szeretné távolítani ${
          fullName || 'a tanulót'
        } az osztályból?\n\nEz a művelet NEM törli a diák saját ÉpítőTudás fiókját, kizárólag az erről az osztályról való beiratkozást szünteti meg.`
      )
    )
      return;

    try {
      await removeStudentFromClass(studentId, classId);
      setClassStudents(classStudents.filter((st) => st.student_id !== studentId));
      setAllStudents(allStudents.filter((st) => !(st.student_id === studentId && st.class_id === classId)));
      setClasses(
        classes.map((c) =>
          c.id === classId ? { ...c, students_count: Math.max(0, (c.students_count || 1) - 1) } : c
        )
      );
      if (selectedStudentDetail?.student_id === studentId) {
        setSelectedStudentDetail(null);
      }
    } catch (err: any) {
      alert(err.message || 'Tanuló eltávolítása nem sikerült.');
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
      setClasses(classes.map((c) => (c.id === selectedClass.id ? { ...c, active_code: code } : c)));
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

      const toAdd: Array<{ content_type: 'course' | 'article'; content_id: string }> = [];
      assignedMaterialIds.forEach((key) => {
        if (!currentAssigned.has(key)) {
          const [type, id] = key.split(':');
          toAdd.push({ content_type: type as 'course' | 'article', content_id: id });
        }
      });

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

  // Quick Assign Modal submit
  const handleConfirmQuickAssign = async () => {
    if (!assignModalMaterial || !selectedAssignClassId) return;
    try {
      await assignMaterialsToClass(selectedAssignClassId, [
        { content_type: assignModalMaterial.type, content_id: assignModalMaterial.id },
      ]);
      alert(`Sikeresen kiosztva a megadott osztálynak!`);
      setAssignModalMaterial(null);
    } catch (err: any) {
      alert(err.message || 'Hiba a kiosztás során.');
    }
  };

  // Custom package item add
  const handleAddPackageItem = (course: Course) => {
    if (pkgItems.some((i) => i.id === course.id)) return;
    setPkgItems([...pkgItems, { id: course.id, title: course.title, contentType: 'course' }]);
  };

  const handleSavePackage = (status: 'draft' | 'compiled') => {
    if (!pkgTitle.trim()) {
      alert('Kérjük, adja meg a tananyagcsomag címét!');
      return;
    }
    const newPkg: CustomPackage = {
      id: `pkg-${Date.now()}`,
      title: pkgTitle.trim(),
      description: pkgDesc.trim(),
      tradeId: pkgTrade || 'Általános',
      topic: pkgTopic.trim() || 'Alapozás',
      targetGroup: pkgTarget.trim() || '10. évfolyam',
      items: pkgItems,
      status,
      createdAt: new Date().toISOString(),
    };
    setCustomPackages([newPkg, ...customPackages]);
    setPkgTitle('');
    setPkgDesc('');
    setPkgItems([]);
    alert(status === 'compiled' ? 'Tananyagcsomag sikeresen összeállítva!' : 'Piszkozat elmentve!');
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

  // Calculate aggregated dashboard stats
  const totalStudentsCount = allStudents.length;
  const totalAssignedMaterials = classes.reduce((sum, c) => sum + 1, 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-20">
      {/* Top Banner Header */}
      <div className="bg-[#141414] border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-500 font-medium text-sm mb-1">
                <School className="w-4 h-4" />
                <span>{schoolInfo.name}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400">Tanár panel</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-amber-500" />
                {activeView === 'dashboard' && 'Tanári Vezérlőpult'}
                {activeView === 'classes' && 'Osztályaim Kezelése'}
                {activeView === 'students' && 'Tanulóim Összesített Listája'}
                {activeView === 'materials' && 'Tananyag Böngésző & Katalógus'}
                {activeView === 'package_builder' && 'Tananyag Összeállítása Modul'}
                {activeView === 'assigned_materials' && 'Kiosztott Tananyagok Áttekintése'}
                {activeView === 'tests' && 'Tesztek & Kvíz Eredmények'}
                {activeView === 'progress' && 'Osztály és Tanulói Előrehaladás'}
                {activeView === 'settings' && 'Saját Beállítások'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate?.('profile')}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-[#1F1F1F] hover:bg-[#262626] rounded-xl transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Saját Profil
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/10"
              >
                <Plus className="w-5 h-5" />
                Új Osztály Indítása
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {activeView === 'dashboard' && (
          <div className="space-y-8">
            {/* 6 STATISTICAL SUMMARY TILES */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-amber-500" />
                Áttekintő Statisztikák
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Tile 1: Osztályaim */}
                <div
                  onClick={() => onNavigateView?.('classes')}
                  className="bg-[#141414] border border-[#262626] hover:border-amber-500/50 p-6 rounded-2xl transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Osztályaim</span>
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:text-amber-400 transition-colors">
                    {classes.length}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Aktívan kezelt osztályok száma</p>
                </div>

                {/* Tile 2: Tanulóim */}
                <div
                  onClick={() => onNavigateView?.('students')}
                  className="bg-[#141414] border border-[#262626] hover:border-blue-500/50 p-6 rounded-2xl transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tanulóim</span>
                    <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
                    {totalStudentsCount}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Összesen beiratkozott diák</p>
                </div>

                {/* Tile 3: Aktív Tananyagok */}
                <div
                  onClick={() => onNavigateView?.('materials')}
                  className="bg-[#141414] border border-[#262626] hover:border-emerald-500/50 p-6 rounded-2xl transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aktív Tananyagok</span>
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors">
                    {DEFAULT_COURSES.length}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Rendelkezésre álló kurzusok</p>
                </div>

                {/* Tile 4: Kiosztott Tananyagok */}
                <div
                  onClick={() => onNavigateView?.('assigned_materials')}
                  className="bg-[#141414] border border-[#262626] hover:border-purple-500/50 p-6 rounded-2xl transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kiosztott Tananyagok</span>
                    <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:text-purple-400 transition-colors">
                    {totalAssignedMaterials}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Osztályokhoz hozzárendelt tananyag</p>
                </div>

                {/* Tile 5: Befejezetlen Tananyagok */}
                <div
                  onClick={() => onNavigateView?.('progress')}
                  className="bg-[#141414] border border-[#262626] hover:border-amber-500/50 p-6 rounded-2xl transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Folyamatban Lévő</span>
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:text-amber-400 transition-colors">
                    {Math.max(0, totalStudentsCount * 2 - 1)}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Teljesítésre váró feladatok</p>
                </div>

                {/* Tile 6: Teszt Eredmények */}
                <div
                  onClick={() => onNavigateView?.('tests')}
                  className="bg-[#141414] border border-[#262626] hover:border-rose-500/50 p-6 rounded-2xl transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Teszt Eredmények</span>
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white group-hover:text-rose-400 transition-colors">
                    84%
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Átlagos teszt pontszám</p>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS SECTION */}
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                Gyors Műveletek
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-4 bg-[#1F1F1F] hover:bg-amber-500 hover:text-black rounded-xl border border-[#262626] transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <Plus className="w-6 h-6 text-amber-500 group-hover:text-black" />
                  <span className="text-xs font-bold">Új Osztály Létrehozása</span>
                </button>

                <button
                  onClick={() => onNavigateView?.('package_builder')}
                  className="p-4 bg-[#1F1F1F] hover:bg-blue-500 hover:text-white rounded-xl border border-[#262626] transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <Layers className="w-6 h-6 text-blue-400 group-hover:text-white" />
                  <span className="text-xs font-bold">Tananyag Összeállítása</span>
                </button>

                <button
                  onClick={() => onNavigateView?.('students')}
                  className="p-4 bg-[#1F1F1F] hover:bg-emerald-500 hover:text-black rounded-xl border border-[#262626] transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <Users className="w-6 h-6 text-emerald-400 group-hover:text-black" />
                  <span className="text-xs font-bold">Tanulóim Megtekintése</span>
                </button>

                <button
                  onClick={() => onNavigateView?.('materials')}
                  className="p-4 bg-[#1F1F1F] hover:bg-purple-500 hover:text-white rounded-xl border border-[#262626] transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <BookOpen className="w-6 h-6 text-purple-400 group-hover:text-white" />
                  <span className="text-xs font-bold">Tananyagok Böngészése</span>
                </button>

                <button
                  onClick={() => onNavigateView?.('assigned_materials')}
                  className="p-4 bg-[#1F1F1F] hover:bg-amber-500 hover:text-black rounded-xl border border-[#262626] transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <CheckSquare className="w-6 h-6 text-amber-400 group-hover:text-black" />
                  <span className="text-xs font-bold">Kiosztott Tananyagok</span>
                </button>

                <button
                  onClick={() => onNavigateView?.('progress')}
                  className="p-4 bg-[#1F1F1F] hover:bg-rose-500 hover:text-white rounded-xl border border-[#262626] transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <TrendingUp className="w-6 h-6 text-rose-400 group-hover:text-white" />
                  <span className="text-xs font-bold">Előrehaladás Analitika</span>
                </button>
              </div>
            </div>

            {/* CLASS OVERVIEW GRID */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Saját Osztályok ({classes.length})
                </h2>
                <button
                  onClick={() => onNavigateView?.('classes')}
                  className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
                >
                  Összes osztály kezelése ➔
                </button>
              </div>

              {classes.length === 0 ? (
                <div className="bg-[#141414] border border-[#262626] rounded-2xl p-12 text-center max-w-xl mx-auto">
                  <GraduationCap className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Még nincs rögzített osztály</h3>
                  <p className="text-xs text-gray-400 mb-6">
                    Hozza létre első osztályát (pl. "10.A"), hogy automatikusan egyedi csatlakozási kódot generálhasson és tananyagokat rendelhessen a tanulókhoz.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all inline-flex items-center gap-2 text-xs"
                  >
                    <Plus className="w-4 h-4" />
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
                            <span className="text-xs font-semibold text-gray-300 bg-[#1F1F1F] px-3 py-1 rounded-full border border-[#262626]">
                              {cls.students_count || 0} tanuló
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 mb-4 space-y-1.5">
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

                      <div className="pt-4 border-t border-[#1F1F1F] flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedClassId(cls.id);
                            onNavigateView?.('classes');
                          }}
                          className="flex-1 py-2.5 bg-[#1F1F1F] hover:bg-amber-500 hover:text-black text-gray-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                        >
                          <BookOpen className="w-4 h-4" />
                          Osztály Megnyitása
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: OSZTÁLYAIM (CLASSES MANAGEMENT & DETAILED VIEW) */}
        {activeView === 'classes' && (
          <div>
            {!selectedClassId ? (
              /* MULTI-CLASS LIST VIEW */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    Saját Osztályok Kezelése ({classes.length})
                  </h2>
                </div>

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
                            <span className="text-xs font-semibold text-gray-300 bg-[#1F1F1F] px-3 py-1 rounded-full border border-[#262626]">
                              {cls.students_count || 0} tanuló
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-400 mb-4 space-y-1.5">
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

                      <div className="pt-4 border-t border-[#1F1F1F] flex items-center gap-2">
                        <button
                          onClick={() => setSelectedClassId(cls.id)}
                          className="flex-1 py-2.5 bg-[#1F1F1F] hover:bg-amber-500 hover:text-black text-gray-200 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                        >
                          <BookOpen className="w-4 h-4" />
                          Osztály Megnyitása
                        </button>
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          className="p-2.5 bg-[#1F1F1F] hover:bg-[#262626] text-amber-400 rounded-xl transition-colors"
                          title="Osztály szerkesztése"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                          className="p-2.5 bg-[#1F1F1F] hover:bg-rose-950/60 text-rose-400 rounded-xl transition-colors"
                          title="Osztály törlése"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* SINGLE CLASS DETAILED VIEW WITH 5 TABS */
              <div>
                <button
                  onClick={() => setSelectedClassId(null)}
                  className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
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
                        <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-extrabold text-white">{selectedClass.name} Osztály</h2>
                          <button
                            onClick={() => handleOpenEditClass(selectedClass)}
                            className="p-2 bg-[#1F1F1F] hover:bg-[#262626] text-amber-400 rounded-lg transition-colors"
                            title="Osztály szerkesztése"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
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

                    {/* 5 Tabs Navigation */}
                    <div className="flex items-center gap-4 mt-8 border-b border-[#262626] overflow-x-auto">
                      <button
                        onClick={() => setClassDetailTab('overview')}
                        className={`pb-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                          classDetailTab === 'overview' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Áttekintés
                      </button>
                      <button
                        onClick={() => setClassDetailTab('students')}
                        className={`pb-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                          classDetailTab === 'students' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        Tanulók ({classStudents.length})
                      </button>
                      <button
                        onClick={() => setClassDetailTab('materials')}
                        className={`pb-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                          classDetailTab === 'materials' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        Tananyagok ({classMaterials.length})
                      </button>
                      <button
                        onClick={() => setClassDetailTab('tests')}
                        className={`pb-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                          classDetailTab === 'tests' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        <FileCheck className="w-4 h-4" />
                        Tesztek
                      </button>
                      <button
                        onClick={() => setClassDetailTab('code')}
                        className={`pb-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                          classDetailTab === 'code' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        <Key className="w-4 h-4" />
                        Osztálykód
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB CONTENTS */}
                {classDetailTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-[#141414] border border-[#262626] p-5 rounded-xl">
                      <span className="text-xs text-gray-400 block font-semibold">Tanulók Száma</span>
                      <span className="text-2xl font-bold text-white">{classStudents.length}</span>
                    </div>
                    <div className="bg-[#141414] border border-[#262626] p-5 rounded-xl">
                      <span className="text-xs text-gray-400 block font-semibold">Kiosztott Tananyagok</span>
                      <span className="text-2xl font-bold text-amber-400">{classMaterials.length}</span>
                    </div>
                    <div className="bg-[#141414] border border-[#262626] p-5 rounded-xl">
                      <span className="text-xs text-gray-400 block font-semibold">Teljesítési Arány</span>
                      <span className="text-2xl font-bold text-emerald-400">78%</span>
                    </div>
                    <div className="bg-[#141414] border border-[#262626] p-5 rounded-xl">
                      <span className="text-xs text-gray-400 block font-semibold">Teszt Átlag</span>
                      <span className="text-2xl font-bold text-blue-400">82%</span>
                    </div>
                  </div>
                )}

                {classDetailTab === 'students' && (
                  <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                    <h3 className="text-base font-bold text-white mb-4">A(z) {selectedClass?.name} Osztály Tanulói</h3>
                    {classStudents.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-base font-semibold text-gray-300">Még egyetlen tanuló sem csatlakozott ehhez az osztályhoz.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-300">
                          <thead className="bg-[#1F1F1F] text-gray-400 uppercase text-[10px]">
                            <tr>
                              <th className="py-3 px-4 rounded-l-lg">Tanuló Neve</th>
                              <th className="py-3 px-4">E-mail Cím</th>
                              <th className="py-3 px-4">Csatlakozott</th>
                              <th className="py-3 px-4">Státusz</th>
                              <th className="py-3 px-4 text-right rounded-r-lg">Műveletek</th>
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
                                  <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                                    Aktív
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedStudentDetail(st)}
                                    className="p-1.5 bg-[#1F1F1F] hover:bg-blue-500 hover:text-white text-blue-400 rounded-lg border border-[#262626] transition-colors"
                                    title="Tanulói adatlap megnyitása"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveStudentFromClass(st.student_id, selectedClass!.id, st.profiles?.full_name)}
                                    className="p-1.5 bg-[#1F1F1F] hover:bg-rose-950/60 text-rose-400 rounded-lg border border-[#262626] transition-colors"
                                    title="Tanuló eltávolítása az osztályból"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {classDetailTab === 'materials' && (
                  <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-bold text-white">Osztályhoz Kiosztott Tananyagok</h3>
                        <p className="text-xs text-gray-400">
                          Jelölje ki a tananyagokat, amelyeket a(z) <strong className="text-white">{selectedClass?.name}</strong> osztály tanulói számára szeretne elérhetővé tenni.
                        </p>
                      </div>

                      <button
                        onClick={handleSaveMaterials}
                        disabled={savingMaterials}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                      >
                        {savingMaterials ? (
                          <div className="w-4 h-4 border-2 border-black border-r-transparent animate-spin rounded-full" />
                        ) : materialSaveSuccess ? (
                          <>
                            <Check className="w-4 h-4" /> Mentve!
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Hozzárendelések Mentése
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {DEFAULT_COURSES.map((course) => {
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
                                {isChecked ? <CheckSquare className="w-5 h-5 text-amber-500" /> : <Square className="w-5 h-5 text-gray-600" />}
                              </div>
                              <div>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#262626] text-amber-400 rounded mr-2">
                                  Kurzus
                                </span>
                                <span className="text-xs text-gray-400">{course.category}</span>
                                <h4 className="text-sm font-bold text-white mt-0.5">{course.title}</h4>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {classDetailTab === 'tests' && (
                  <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center py-12">
                    <FileCheck className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Osztálytermi Tesztek</h3>
                    <p className="text-xs text-gray-400">Az ehhez az osztályhoz rendelt tesztek és eredmények a diákok próbálkozásai után itt jelennek meg.</p>
                  </div>
                )}

                {classDetailTab === 'code' && (
                  <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 max-w-md mx-auto space-y-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Key className="w-5 h-5 text-amber-500" /> Osztálytermi Kód Részletei
                    </h3>
                    <div className="p-4 bg-[#1F1F1F] rounded-xl text-center space-y-2">
                      <span className="text-xs text-gray-400 block">Aktív csatlakozási kód:</span>
                      <span className="text-3xl font-black text-amber-400 font-mono tracking-widest block">
                        {activeCode?.code || 'Nincs kód'}
                      </span>
                      <span className="text-[10px] text-gray-500 block">
                        Érvényes: {activeCode?.expires_at ? new Date(activeCode.expires_at).toLocaleDateString('hu-HU') : '90 napig'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: TANULÓIM (AGGREGATED STUDENT LIST & DETAIL MODAL) */}
        {activeView === 'students' && (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    Összes Tanuló Listája ({allStudents.length})
                  </h2>
                  <p className="text-xs text-gray-400">A saját osztályaihoz tartozó tanulók áttekintése és kezelése.</p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Keresés név vagy e-mail alapján..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-[#1F1F1F] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {allStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-base font-semibold text-gray-300">Még nincs beiratkozott tanuló az osztályaiban.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#1F1F1F] text-gray-400 uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4 rounded-l-lg">Tanuló Neve</th>
                        <th className="py-3 px-4">E-mail Cím</th>
                        <th className="py-3 px-4">Osztály / Évfolyam</th>
                        <th className="py-3 px-4">Szakma</th>
                        <th className="py-3 px-4">Csatlakozott</th>
                        <th className="py-3 px-4">Státusz</th>
                        <th className="py-3 px-4">Teljesítés %</th>
                        <th className="py-3 px-4 text-right rounded-r-lg">Műveletek</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F1F]">
                      {allStudents
                        .filter(
                          (st) =>
                            !filterSearch ||
                            (st.profiles?.full_name || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
                            (st.profiles?.email || '').toLowerCase().includes(filterSearch.toLowerCase())
                        )
                        .map((st) => (
                          <tr key={`${st.id}-${st.class_id}`} className="hover:bg-[#1A1A1A]">
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {st.profiles?.full_name || 'Névtelen tanuló'}
                            </td>
                            <td className="py-3.5 px-4 text-gray-400">{st.profiles?.email || '-'}</td>
                            <td className="py-3.5 px-4 text-amber-400 font-medium">
                              {st.school_class?.name || 'Osztály'} ({st.school_class?.grade ? `${st.school_class.grade}. Évfolyam` : 'Képzés'})
                            </td>
                            <td className="py-3.5 px-4 text-gray-300">{st.trade_id}</td>
                            <td className="py-3.5 px-4 text-gray-400">
                              {new Date(st.joined_at).toLocaleDateString('hu-HU')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                                Aktív
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-400">85%</td>
                            <td className="py-3.5 px-4 text-right flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedStudentDetail(st)}
                                className="p-1.5 bg-[#1F1F1F] hover:bg-blue-500 hover:text-white text-blue-400 rounded-lg border border-[#262626] transition-colors"
                                title="Részletes adatlap megnyitása"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveStudentFromClass(st.student_id, st.class_id || '', st.profiles?.full_name)}
                                className="p-1.5 bg-[#1F1F1F] hover:bg-rose-950/60 text-rose-400 rounded-lg border border-[#262626] transition-colors"
                                title="Tanuló eltávolítása az osztályból"
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* VIEW 4: TANANYAGOK (EXPLORER & CONTENT SELECTOR) */}
        {activeView === 'materials' && (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    Tananyag Böngésző & Oktatási Tartalmak
                  </h2>
                  <p className="text-xs text-gray-400">Válasszon oktatási anyagokat és rendelje hozzá az osztályaihoz.</p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tananyag keresése..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-[#1F1F1F] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_COURSES.filter((c) => !materialSearch || c.title.toLowerCase().includes(materialSearch.toLowerCase())).map((course) => (
                  <div key={course.id} className="bg-[#1F1F1F] border border-[#262626] rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                          {course.category}
                        </span>
                        <span className="text-xs text-gray-400">{course.duration_hours} óra</span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2">{course.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#262626] flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setAssignModalMaterial({ type: 'course', id: course.id, title: course.title });
                          if (classes.length > 0) setSelectedAssignClassId(classes[0].id);
                        }}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Kiosztás Osztálynak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: TANANYAG ÖSSZEÁLLÍTÁSA (PACKAGE BUILDER) */}
        {activeView === 'package_builder' && (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" /> Saját Tananyag Összeállítása
              </h2>
              <p className="text-xs text-gray-400 mb-6">Állítson össze egyedi moduláris tananyagcsomagot meglévő ÉpítőTudás tartalmakból.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-4 bg-[#1F1F1F] p-5 rounded-xl border border-[#262626]">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">1. Tananyagcsomag Adatai</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Csomag Címe *</label>
                    <input
                      type="text"
                      placeholder="pl. Tetőszerkezetek 10. Évfolyam"
                      value={pkgTitle}
                      onChange={(e) => setPkgTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#141414] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Rövid Leírás</label>
                    <textarea
                      placeholder="A moduláris tananyag célja és témakörei..."
                      value={pkgDesc}
                      onChange={(e) => setPkgDesc(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2 bg-[#141414] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Szakma</label>
                      <select
                        value={pkgTrade}
                        onChange={(e) => setPkgTrade(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#141414] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {instructorTrades.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Célcsoport</label>
                      <input
                        type="text"
                        placeholder="pl. 10.A Osztály"
                        value={pkgTarget}
                        onChange={(e) => setPkgTarget(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#141414] border border-[#262626] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Selection */}
                <div className="space-y-4 bg-[#1F1F1F] p-5 rounded-xl border border-[#262626]">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">2. Tartalmak Hozzáadása ({pkgItems.length})</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {DEFAULT_COURSES.map((c) => (
                      <div key={c.id} className="p-3 bg-[#141414] rounded-lg flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">{c.title}</span>
                        <button
                          onClick={() => handleAddPackageItem(c)}
                          className="px-2.5 py-1 bg-amber-500 text-black font-bold rounded hover:bg-amber-600 transition-colors"
                        >
                          + Hozzáadás
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleSavePackage('draft')}
                      className="px-4 py-2 bg-[#262626] hover:bg-[#333] text-gray-300 font-semibold text-xs rounded-xl transition-colors"
                    >
                      Mentés Piszkozatként
                    </button>
                    <button
                      onClick={() => handleSavePackage('compiled')}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition-colors"
                    >
                      Csomag Összeállítása
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: KIOSZTOTT TANANYAGOK (ASSIGNED MATERIALS OVERVIEW) */}
        {activeView === 'assigned_materials' && (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-500" /> Kiosztott Tananyagok Áttekintése
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#1F1F1F] text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Tananyag</th>
                      <th className="py-3 px-4">Osztály</th>
                      <th className="py-3 px-4">Kiosztva</th>
                      <th className="py-3 px-4">Tanulók</th>
                      <th className="py-3 px-4">Megkezdte</th>
                      <th className="py-3 px-4">Befejezte</th>
                      <th className="py-3 px-4">Teljesítés %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]">
                    {DEFAULT_COURSES.slice(0, 4).map((c, idx) => (
                      <tr key={c.id} className="hover:bg-[#1A1A1A]">
                        <td className="py-3.5 px-4 font-semibold text-white">{c.title}</td>
                        <td className="py-3.5 px-4 text-amber-400 font-bold">{classes[idx % classes.length]?.name || '10.A'}</td>
                        <td className="py-3.5 px-4 text-gray-400">2026. 09. 15.</td>
                        <td className="py-3.5 px-4 font-bold text-white">24</td>
                        <td className="py-3.5 px-4 text-blue-400 font-semibold">19</td>
                        <td className="py-3.5 px-4 text-emerald-400 font-semibold">15</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">78%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: TESZTEK (QUIZZES & RESULTS) */}
        {activeView === 'tests' && (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" /> Tesztanyagok & Teszteredmények
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#1F1F1F] text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Tanuló Neve</th>
                      <th className="py-3 px-4">Teszt / Kurzus</th>
                      <th className="py-3 px-4">Osztály</th>
                      <th className="py-3 px-4">Próbálkozások</th>
                      <th className="py-3 px-4">Eredmény %</th>
                      <th className="py-3 px-4">Státusz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F1F]">
                    {allStudents.slice(0, 5).map((st, idx) => (
                      <tr key={st.id} className="hover:bg-[#1A1A1A]">
                        <td className="py-3.5 px-4 font-semibold text-white">{st.profiles?.full_name || 'Névtelen tanuló'}</td>
                        <td className="py-3.5 px-4 text-gray-300">Monolitikus Beton- és Szerkezetépítés Mesterfogásai Teszt</td>
                        <td className="py-3.5 px-4 text-amber-400 font-bold">{st.school_class?.name || '10.A'}</td>
                        <td className="py-3.5 px-4 text-gray-400">1</td>
                        <td className="py-3.5 px-4 font-black text-emerald-400">{80 + idx * 4}%</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                            SIKERES
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 8: ELŐREHALADÁS (PROGRESS ANALYTICS) */}
        {activeView === 'progress' && (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" /> Osztály és Tanulói Előrehaladás Analitika
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-[#1F1F1F] p-5 rounded-xl border border-[#262626]">
                  <span className="text-xs text-gray-400 block font-semibold">Átlagos Osztályateljesítés</span>
                  <span className="text-3xl font-black text-emerald-400">82%</span>
                </div>
                <div className="bg-[#1F1F1F] p-5 rounded-xl border border-[#262626]">
                  <span className="text-xs text-gray-400 block font-semibold">Aktív Tanulók Aránya</span>
                  <span className="text-3xl font-black text-blue-400">94%</span>
                </div>
                <div className="bg-[#1F1F1F] p-5 rounded-xl border border-[#262626]">
                  <span className="text-xs text-gray-400 block font-semibold">Elmaradó Tanulók</span>
                  <span className="text-3xl font-black text-amber-400">2 fő</span>
                </div>
              </div>
            </div>
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
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
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
                  className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Évfolyam
                </label>
                <input
                  type="number"
                  placeholder="pl. 10"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-xs"
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
                    className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 text-xs"
                    required
                  />
                ) : (
                  <select
                    value={newClassTrade}
                    onChange={(e) => setNewClassTrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
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
                  className="px-4 py-2.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={submittingClass}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
                >
                  {submittingClass ? (
                    <div className="w-4 h-4 border-2 border-black border-r-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Létrehozás & Kód Generálása
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLASS MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                Osztály Adatainak Módosítása
              </h3>
              <button
                onClick={() => setEditingClass(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editClassError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {editClassError}
              </div>
            )}

            <form onSubmit={handleSaveEditedClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Osztály Neve *
                </label>
                <input
                  type="text"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Évfolyam
                </label>
                <input
                  type="number"
                  value={editClassGrade}
                  onChange={(e) => setEditClassGrade(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={savingEditClass}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
                >
                  {savingEditClass ? (
                    <div className="w-4 h-4 border-2 border-black border-r-transparent animate-spin rounded-full" />
                  ) : (
                    'Mentés'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN CONTENT TO CLASS MODAL */}
      {assignModalMaterial && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Tananyag Kiosztása Osztálynak</h3>
            <p className="text-xs text-gray-400 mb-4">
              Kijelölt tananyag: <strong className="text-white">{assignModalMaterial.title}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 mb-2">Válasszon Osztályt:</label>
              <select
                value={selectedAssignClassId}
                onChange={(e) => setSelectedAssignClassId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1F1F1F] border border-[#262626] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.trade_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setAssignModalMaterial(null)}
                className="px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Mégse
              </button>
              <button
                onClick={handleConfirmQuickAssign}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl transition-colors"
              >
                Kiosztás Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DETAIL MODAL */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
                  {(selectedStudentDetail.profiles?.full_name || 'T').charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedStudentDetail.profiles?.full_name || 'Névtelen tanuló'}
                  </h3>
                  <p className="text-xs text-gray-400">{selectedStudentDetail.profiles?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#1F1F1F] rounded-xl">
                <span className="text-gray-400 block font-semibold mb-1">Osztály</span>
                <span className="text-white font-bold">{selectedStudentDetail.school_class?.name || '10.A'}</span>
              </div>
              <div className="p-3 bg-[#1F1F1F] rounded-xl">
                <span className="text-gray-400 block font-semibold mb-1">Szakma</span>
                <span className="text-amber-400 font-bold">{selectedStudentDetail.trade_id}</span>
              </div>
              <div className="p-3 bg-[#1F1F1F] rounded-xl">
                <span className="text-gray-400 block font-semibold mb-1">Csatlakozott</span>
                <span className="text-white">{new Date(selectedStudentDetail.joined_at).toLocaleDateString('hu-HU')}</span>
              </div>
              <div className="p-3 bg-[#1F1F1F] rounded-xl">
                <span className="text-gray-400 block font-semibold mb-1">Teljesítési Arány</span>
                <span className="text-emerald-400 font-bold">85%</span>
              </div>
            </div>

            <div className="p-4 bg-[#1F1F1F] rounded-xl space-y-2 text-xs">
              <span className="font-bold text-gray-300 block">Kiosztott Tananyagok & Tesztek:</span>
              <div className="flex items-center justify-between text-gray-400">
                <span>Monolitikus Beton- és Szerkezetépítés</span>
                <span className="text-emerald-400 font-semibold">Befejezve (100%)</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Energiahatékony Falazási Rendszer</span>
                <span className="text-amber-400 font-semibold">Folyamatban (70%)</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() =>
                  handleRemoveStudentFromClass(
                    selectedStudentDetail.student_id,
                    selectedStudentDetail.class_id || '',
                    selectedStudentDetail.profiles?.full_name
                  )
                }
                className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Eltávolítás az Osztályból
              </button>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2 bg-[#262626] hover:bg-[#333] text-white font-semibold text-xs rounded-xl transition-colors"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardPage;
