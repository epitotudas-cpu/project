import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Plus, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  listJobPostings,
  createJobPosting,
  submitJobApplication,
} from '../services/careerService';
import type { JobPosting } from '../lib/supabase';

export default function CareersPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [locationSearch, setLocationSearch] = useState<string>('');

  // Modals
  const [applyModalJob, setApplyModalJob] = useState<JobPosting | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form states
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // New Job Form State
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobType, setJobType] = useState<'full_time' | 'part_time' | 'apprenticeship'>('full_time');
  const [jobLocation, setJobLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, locationSearch]);

  useEffect(() => {
    if (user) {
      setApplicantName(user.user_metadata?.full_name || '');
      setApplicantEmail(user.email || '');
    }
  }, [user]);

  async function loadJobs() {
    try {
      setLoading(true);
      const data = await listJobPostings(selectedType, locationSearch);
      setJobs(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!applyModalJob || !applicantName.trim() || !applicantEmail.trim()) return;

    await submitJobApplication(applyModalJob.id, applicantName, applicantEmail, coverNote, user?.id);
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      setApplyModalJob(null);
      setCoverNote('');
    }, 2000);
  }

  async function handleCreateJobSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim() || !jobLocation.trim()) return;

    await createJobPosting({
      companyName,
      title: jobTitle,
      jobType,
      location: jobLocation,
      salaryRange,
      description: jobDescription,
    });

    setShowCreateModal(false);
    setCompanyName('');
    setJobTitle('');
    setJobLocation('');
    setSalaryRange('');
    setJobDescription('');
    await loadJobs();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="border-b border-[#1E1E1E] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Briefcase className="text-accent" size={32} />
            ÉpítőIpari KarrierPortál & Állásbörze
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Álláslehetőségek, duális szakképzési gyakorlati helyek és szakember-kereső
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-colors self-start"
        >
          <Plus size={16} /> Új Álláshirdetés Feladása
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white w-full md:w-80">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            placeholder="Keresés helyszín szerint..."
            className="bg-transparent focus:outline-none w-full text-xs text-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedType === 'all' ? 'bg-accent text-black font-bold' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            Összes Munkatípus
          </button>
          <button
            onClick={() => setSelectedType('full_time')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedType === 'full_time' ? 'bg-accent text-black font-bold' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            Teljes Munkaidő
          </button>
          <button
            onClick={() => setSelectedType('apprenticeship')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedType === 'apprenticeship' ? 'bg-accent text-black font-bold' : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
            }`}
          >
            Szakmai Gyakorlat
          </button>
        </div>
      </div>

      {/* Job Postings Grid */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">Betöltés...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-[#111] border border-[#1E1E1E] rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-[#333] transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded border border-accent/20">
                    {job.job_type === 'full_time' ? 'Teljes Munkaidő' : job.job_type === 'apprenticeship' ? 'Szakmai Gyakorlat' : 'Részmunkaidő'}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={12} /> {job.location}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white">{job.title}</h2>
                <div className="text-xs text-gray-400 font-semibold">{job.company_name}</div>
                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">{job.description}</p>
              </div>

              <div className="pt-3 border-t border-[#1E1E1E] space-y-3">
                {job.salary_range && (
                  <div className="text-xs font-bold text-green-400 flex items-center gap-1">
                    <DollarSign size={12} /> {job.salary_range}
                  </div>
                )}
                <button
                  onClick={() => setApplyModalJob(job)}
                  className="w-full py-2.5 bg-accent hover:bg-accent-hover text-black font-bold text-xs rounded-xl transition-colors"
                >
                  Jelentkezés az Állásra
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Jelentkezés: {applyModalJob.title}</h2>
                <p className="text-xs text-gray-400">{applyModalJob.company_name}</p>
              </div>
              <button onClick={() => setApplyModalJob(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {appliedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="text-green-400 mx-auto" size={40} />
                <div className="text-base font-bold text-white">Sikeres Jelentkezés!</div>
                <p className="text-xs text-gray-400">A céges hirdető hamarosan felveszi veled a kapcsolatot.</p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Teljes Név</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Email Cím</label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-semibold block mb-1">Kísérő üzenet / Bemutatkozás</label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Rövid bemutatkozás a szakmai tapasztalatodról..."
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalJob(null)}
                    className="px-4 py-2 bg-[#1A1A1A] text-gray-300 text-xs font-semibold rounded-xl"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl hover:bg-accent-hover"
                  >
                    Jelentkezés Beküldése
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h2 className="text-base font-bold text-white">Új Álláshirdetés Feladása</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateJobSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Cég / Kivitelező Neve</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="pl. Strabag Építő Kft."
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Pozíció Címe</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="pl. Szerkezetépítő Kőműves Mester"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Munkatípus</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as 'full_time' | 'part_time' | 'apprenticeship')}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                >
                  <option value="full_time">Teljes Munkaidő</option>
                  <option value="apprenticeship">Szakmai Gyakorlat</option>
                  <option value="part_time">Részmunkaidő</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Helyszín</label>
                <input
                  type="text"
                  required
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  placeholder="pl. Budapest & Pest megye"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Fizetési Sáv / Megállapodás</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="pl. Bruttó 650.000 Ft/hó"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold block mb-1">Részletes Leírás & Elvárások</label>
                <textarea
                  rows={3}
                  required
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#1A1A1A] text-gray-300 text-xs font-semibold rounded-xl"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-black font-bold text-xs rounded-xl hover:bg-accent-hover"
                >
                  Hirdetés Közzététele
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
