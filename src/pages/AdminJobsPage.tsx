import { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  MapPin,
  DollarSign,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';
import {
  listJobPostings,
  createJobPosting,
  updateJobPosting,
  toggleJobPostingActive,
  deleteJobPosting,
  approveJobPosting,
  rejectJobPosting,
} from '../services/careerService';
import type { JobPosting } from '../lib/supabase';
import { useSiteSettings, adjustColorBrightness, getContrastTextColor } from '../services/siteSettingsService';
import ConfirmDialog from '../components/ConfirmDialog';

interface AdminJobsPageProps {
  initialSearchQuery?: string;
}

export default function AdminJobsPage({ initialSearchQuery }: AdminJobsPageProps = {}) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [title, setTitle] = useState('');
  const [jobType, setJobType] = useState<'full_time' | 'part_time' | 'apprenticeship'>('full_time');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await listJobPostings(undefined, undefined, true);
      setJobs([...data]);
    } finally {
      setLoading(false);
    }
  }

  const handleApproveJob = async (id: string) => {
    await approveJobPosting(id);
    await loadJobs();
    triggerSuccessNotify();
  };

  const handleRejectJob = async (id: string) => {
    await rejectJobPosting(id);
    await loadJobs();
    triggerSuccessNotify();
  };

  const filteredJobs = jobs.filter((j) => {
    const matchType = selectedType === 'all' || j.job_type === selectedType;
    const matchQuery =
      !searchQuery.trim() ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchQuery;
  });

  useEffect(() => {
    if (searchQuery && filteredJobs.length > 0) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`admin-job-${filteredJobs[0].id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-amber-400', 'transition-all');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-amber-400');
          }, 2500);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, filteredJobs]);

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setCompanyName('ÉpítőTudás Partner Kft.');
    setTitle('');
    setJobType('full_time');
    setLocation('Budapest');
    setSalaryRange('Bruttó 600.000 - 800.000 Ft/hó');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEditModal = (job: JobPosting) => {
    setEditingJob(job);
    setCompanyName(job.company_name);
    setTitle(job.title);
    setJobType(job.job_type as JobPosting['job_type']);
    setLocation(job.location);
    setSalaryRange(job.salary_range || '');
    setDescription(job.description);
    setShowModal(true);
  };

  const handleToggleActive = async (id: string) => {
    await toggleJobPostingActive(id);
    await loadJobs();
    triggerSuccessNotify();
  };

  const handleDeleteJob = (id: string) => {
    setDeleteJobId(id);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim()) return;

    if (editingJob) {
      await updateJobPosting(editingJob.id, {
        companyName: companyName.trim(),
        title: title.trim(),
        jobType,
        location: location.trim(),
        salaryRange: salaryRange.trim(),
        description: description.trim(),
      });
    } else {
      await createJobPosting({
        companyName: companyName.trim(),
        title: title.trim(),
        jobType,
        location: location.trim(),
        salaryRange: salaryRange.trim(),
        description: description.trim(),
      });
    }

    setShowModal(false);
    await loadJobs();
    triggerSuccessNotify();
  };

  const triggerSuccessNotify = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const siteSettings = useSiteSettings();
  const cardBg = siteSettings.adminCardBgColor || '#111111';
  const cardHighlight = siteSettings.adminCardHighlightColor || '#FFC400';
  const cardBorder = adjustColorBrightness(cardBg, 12);
  const inputBg = adjustColorBrightness(cardBg, -4);
  const textColor = getContrastTextColor(cardBg);
  const inputTextColor = getContrastTextColor(inputBg);

  return (
    <div className="p-4 md:p-8 space-y-8 min-h-screen" style={{ color: textColor }}>
      {/* Header */}
      <div style={{ borderColor: cardBorder }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 style={{ color: textColor }} className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <Briefcase style={{ color: cardHighlight }} size={32} />
            Állásajánlatok &amp; Pozíciók Kezelő
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Építőipari állásajánlatok, duális képzési helyek és szakmai pozíciók moderációja és kezelése.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          style={{ backgroundColor: cardHighlight, color: '#000000' }}
          className="px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:opacity-90"
        >
          <Plus size={16} /> Új Álláshirdetés Feladása
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl flex items-center gap-3 animate-fade-in text-sm font-bold">
          <CheckCircle2 size={20} />
          Az állásajánlatok sikeresen elmentve és frissítve a platformon!
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ backgroundColor: cardBg, borderColor: cardBorder }} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés pozíció, cég vagy város alapján..."
            style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
            className="w-full border rounded-xl pl-10 pr-4 py-2 text-xs placeholder-gray-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'Összes Típus' },
            { id: 'full_time', label: 'Teljes Idős' },
            { id: 'part_time', label: 'Részidős' },
            { id: 'apprenticeship', label: 'Gyakorlati Hely' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              style={
                selectedType === cat.id
                  ? { backgroundColor: cardHighlight, color: '#000000' }
                  : { backgroundColor: inputBg, borderColor: cardBorder, color: textColor }
              }
              className={`px-3 py-1.5 border rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === cat.id ? 'font-extrabold' : 'hover:opacity-90'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm font-bold">Állások betöltése...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              id={`admin-job-${job.id}`}
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              className={`border rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all ${
                job.is_active ? '' : 'opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-[10px] rounded-full">
                    {job.job_type === 'full_time'
                      ? 'Teljes Munkaidő'
                      : job.job_type === 'part_time'
                      ? 'Részmunkaidő'
                      : 'Duális Gyakorlat'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {job.moderation_status === 'pending' && (
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] rounded-full">
                        Jóváhagyásra vár
                      </span>
                    )}
                    {job.moderation_status === 'rejected' && (
                      <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px] rounded-full">
                        Elutasítva
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(job.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        job.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                      title={job.is_active ? 'Aktív' : 'Inaktív'}
                    >
                      {job.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                  </div>
                </div>

                {job.moderation_status === 'pending' && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-400">Moderáció:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveJob(job.id)}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-lg cursor-pointer"
                      >
                        Jóváhagyás
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectJob(job.id)}
                        className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white font-bold text-[10px] rounded-lg cursor-pointer"
                      >
                        Elutasítás
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1">
                    <Building2 size={13} style={{ color: cardHighlight }} /> {job.company_name}
                  </div>
                  <h3 style={{ color: textColor }} className="text-base font-extrabold leading-snug">{job.title}</h3>
                </div>

                <div className="space-y-1 text-xs text-gray-400 font-mono pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-gray-500" /> {job.location}
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-1.5 font-bold" style={{ color: cardHighlight }}>
                      <DollarSign size={13} /> {job.salary_range}
                    </div>
                  )}
                </div>

                {job.description && (
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed border-t pt-2" style={{ borderColor: cardBorder }}>
                    {job.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: cardBorder }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(job)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="p-2 border rounded-xl transition-colors cursor-pointer hover:opacity-90"
                  title="Szerkesztés"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteJob(job.id)}
                  className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer"
                  title="Törlés"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div style={{ backgroundColor: cardBg, borderColor: cardBorder, color: textColor }} className="border rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div style={{ borderColor: cardBorder }} className="flex items-center justify-between border-b pb-3">
              <h3 style={{ color: textColor }} className="text-base font-extrabold flex items-center gap-2">
                <Briefcase size={18} style={{ color: cardHighlight }} />
                {editingJob ? 'Álláshirdetés Szerkesztése' : 'Új Álláshirdetés Feladása'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ backgroundColor: inputBg, color: textColor }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer hover:opacity-90"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="space-y-4 text-xs">
              <div>
                <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Munkáltató Cég Neve *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Pozíció Megnevezése *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl px-4 py-2 font-bold focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Foglalkoztatás Típusa</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as JobPosting['job_type'])}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  >
                    <option value="full_time">Teljes Munkaidő</option>
                    <option value="part_time">Részmunkaidő</option>
                    <option value="apprenticeship">Duális Gyakorlati Hely</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Munkavégzés Helye</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                    className="w-full border rounded-xl px-4 py-2 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Fizetési Sáv / Bérigény</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="pl. Bruttó 600.000 - 800.000 Ft/hó"
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl px-4 py-2 font-mono focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label style={{ color: textColor === '#FFFFFF' ? '#9CA3AF' : '#4B5563' }} className="font-bold block mb-1">Pozíció Részletes Leírása</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: inputTextColor }}
                  className="w-full border rounded-xl p-3 leading-relaxed focus:outline-none transition-colors"
                />
              </div>

              <div style={{ borderColor: cardBorder }} className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ backgroundColor: inputBg, borderColor: cardBorder, color: textColor }}
                  className="px-4 py-2 border font-bold rounded-xl transition-colors cursor-pointer hover:opacity-90"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: cardHighlight, color: '#000000' }}
                  className="px-5 py-2 font-extrabold rounded-xl transition-all shadow-lg cursor-pointer hover:opacity-90"
                >
                  {editingJob ? 'Módosítások Mentése' : 'Állás Feladása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteJobId)}
        title="Álláshirdetés törlése"
        message="Biztosan törölni szeretnéd ezt az álláshirdetést?"
        confirmLabel="Törlés"
        destructive
        onConfirm={async () => {
          if (deleteJobId) {
            await deleteJobPosting(deleteJobId);
            await loadJobs();
            triggerSuccessNotify();
          }
          setDeleteJobId(null);
        }}
        onCancel={() => setDeleteJobId(null)}
      />
    </div>
  );
}
