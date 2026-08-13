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
} from '../services/careerService';
import type { JobPosting } from '../lib/supabase';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);

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
      const data = await listJobPostings();
      setJobs([...data]);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter((j) => {
    const matchType = selectedType === 'all' || j.job_type === selectedType;
    const matchQuery =
      !searchQuery.trim() ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchQuery;
  });

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
    setJobType(job.job_type as any);
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

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt az álláshirdetést?')) {
      await deleteJobPosting(id);
      await loadJobs();
      triggerSuccessNotify();
    }
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

  return (
    <div className="space-[#111] min-h-screen text-gray-200 p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Briefcase className="text-accent" size={32} />
            Állásajánlatok &amp; Pozíciók Kezelő
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Építőipari állásajánlatok, duális képzési helyek és szakmai pozíciók moderációja és kezelése.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111111] border border-[#1E1E1E] p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés pozíció, cég vagy város alapján..."
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === cat.id
                  ? 'bg-accent text-black font-extrabold'
                  : 'bg-[#181818] border border-[#262626] text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm font-bold">Állások betöltése...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`bg-[#111111] border rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl transition-all ${
                job.is_active ? 'border-[#1E1E1E] hover:border-accent/40' : 'border-red-900/40 opacity-60'
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

                <div>
                  <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1">
                    <Building2 size={13} className="text-accent" /> {job.company_name}
                  </div>
                  <h3 className="text-base font-extrabold text-white leading-snug">{job.title}</h3>
                </div>

                <div className="space-y-1 text-xs text-gray-400 font-mono pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-gray-500" /> {job.location}
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-1.5 text-accent font-bold">
                      <DollarSign size={13} /> {job.salary_range}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 line-clamp-3 pt-2 border-t border-[#222]">
                  {job.description}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#222] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(job)}
                  className="px-3 py-1.5 bg-[#222] hover:bg-[#333] text-gray-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} /> Szerkesztés
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteJob(job.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors cursor-pointer"
                  title="Törlés"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-[#222] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Briefcase size={18} className="text-accent" />
                {editingJob ? 'Álláshirdetés Szerkesztése' : 'Új Álláshirdetés Feladása'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold px-2 py-1 bg-[#1A1A1A] rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="space-y-4">
              <div>
                <label className="font-bold text-gray-300 block mb-1">Munkáltató Cég Neve *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Pozíció Megnevezése *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Foglalkoztatás Típusa</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent"
                  >
                    <option value="full_time">Teljes Munkaidő</option>
                    <option value="part_time">Részmunkaidő</option>
                    <option value="apprenticeship">Duális Gyakorlati Hely</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-300 block mb-1">Munkavégzés Helye</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Fizetési Sáv / Bérigény</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="pl. Bruttó 600.000 - 800.000 Ft/hó"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-300 block mb-1">Pozíció Részletes Leírása</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 text-white focus:outline-none focus:border-accent leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-gray-300 font-bold rounded-xl transition-colors"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-black font-extrabold rounded-xl transition-all shadow-lg"
                >
                  {editingJob ? 'Módosítások Mentése' : 'Állás Feladása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
