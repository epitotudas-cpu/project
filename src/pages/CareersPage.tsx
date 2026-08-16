import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  ChevronRight,
  X,
  GraduationCap,
  Building,
  Compass,
  HardHat,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SectionSubNav from '../components/SectionSubNav';
import {
  listJobPostings,
  createJobPosting,
  submitJobApplication,
  DEFAULT_CAREER_TRAJECTORIES,
  type CareerTrajectory,
} from '../services/careerService';
import { DEFAULT_COURSES } from '../services/educationService';
import type { JobPosting } from '../lib/supabase';

interface CareersPageProps {
  onNavigate?: (page: string) => void;
}

export default function CareersPage({ onNavigate }: CareersPageProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter Controls
  const [titleSearch, setTitleSearch] = useState<string>('');
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('all');

  // Modals
  const [applyModalJob, setApplyModalJob] = useState<JobPosting | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Application Form state
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

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      // Title / Trade search
      const matchesTitle =
        !titleSearch.trim() ||
        j.title.toLowerCase().includes(titleSearch.toLowerCase()) ||
        j.description.toLowerCase().includes(titleSearch.toLowerCase()) ||
        j.company_name.toLowerCase().includes(titleSearch.toLowerCase());

      // Location search
      const matchesLocation =
        !locationSearch.trim() ||
        j.location.toLowerCase().includes(locationSearch.toLowerCase());

      // Job type filter
      const matchesType = selectedType === 'all' || j.job_type === selectedType;

      // Role category quick filter
      let matchesRole = true;
      if (selectedRoleCategory !== 'all') {
        const titleLower = j.title.toLowerCase();
        if (selectedRoleCategory === 'szakmunkas') matchesRole = titleLower.includes('mester') || titleLower.includes('kőműves') || titleLower.includes('burkoló') || titleLower.includes('villanyszerelő');
        else if (selectedRoleCategory === 'betanitott') matchesRole = titleLower.includes('betanított') || titleLower.includes('segéd');
        else if (selectedRoleCategory === 'technikus') matchesRole = titleLower.includes('technikus') || titleLower.includes('előkészítő');
        else if (selectedRoleCategory === 'gyakornok') matchesRole = j.job_type === 'apprenticeship' || titleLower.includes('gyakorlat') || titleLower.includes('asszisztens');
        else if (selectedRoleCategory === 'epitesvezeto') matchesRole = titleLower.includes('építésvezető') || titleLower.includes('művezető') || titleLower.includes('mérnök');
      }

      return matchesTitle && matchesLocation && matchesType && matchesRole;
    });
  }, [jobs, titleSearch, locationSearch, selectedType, selectedRoleCategory]);

  const resetFilters = () => {
    setTitleSearch('');
    setLocationSearch('');
    setSelectedType('all');
    setSelectedRoleCategory('all');
  };

  return (
    <div className="bg-[#f8fafc] text-[#1e293b] min-h-screen pb-20">
      {/* Hero Header Banner */}
      <div className="bg-primary text-white border-b border-primary-700 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <button
              onClick={() => onNavigate?.('home')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Főoldal
            </button>
            <ChevronRight size={13} />
            <button
              onClick={() => onNavigate?.('paths')}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Pályák &amp; Képzések
            </button>
            <ChevronRight size={13} />
            <span className="text-gray-200 font-medium">Karrier &amp; Állások</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
                <Briefcase size={14} /> ÉpítőIpari KarrierPortál &amp; Szakmai Állásbörze
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Találd meg a helyed az építőiparban
              </h1>
              <p className="text-gray-300 text-sm md:text-base max-w-3xl leading-relaxed">
                Fedezd fel a szakmákat, fejleszd a tudásodat, és találd meg a következő karrierlehetőségedet.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#allasok"
                className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-primary text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Search size={16} /> Állások böngészése
              </a>
              <button
                onClick={() => onNavigate?.('paths')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2"
              >
                <HardHat size={16} className="text-accent" /> Szakmák felfedezése
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized Secondary Sub-navigation Bar */}
      <SectionSubNav
        ariaLabel="Karrier navigáció"
        onNavigate={onNavigate}
        items={[
          {
            label: 'Állásajánlatok',
            href: '#allasok',
            icon: <Briefcase size={14} className="text-accent" />,
            active: true,
          },
          {
            label: 'Karrierutak',
            href: '#karrierutak',
            icon: <Compass size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Ajánlott Képzések',
            href: '#kepzesek',
            icon: <GraduationCap size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Munkaadóknak',
            href: '#munkaadok',
            icon: <Building size={14} className="text-accent" />,
            active: false,
          },
          {
            label: 'Pályák & Szakmák',
            page: 'paths',
            icon: <HardHat size={14} className="text-accent" />,
            active: false,
          },
        ]}
      />

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* SEARCH & FILTERS SECTION */}
        <section id="allasok" className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Title / Profession Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={titleSearch}
                onChange={(e) => setTitleSearch(e.target.value)}
                placeholder="Pozíció, cég vagy szakma..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent transition-colors"
              />
              {titleSearch && (
                <button onClick={() => setTitleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Location / County Search */}
            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Település vagy vármegye..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent transition-colors"
              />
              {locationSearch && (
                <button onClick={() => setLocationSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Job Type Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-accent"
              >
                <option value="all">Minden munkatípus</option>
                <option value="full_time">Teljes munkaidő</option>
                <option value="apprenticeship">Szakmai gyakorlat</option>
                <option value="part_time">Részmunkaidő</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-gray-500 font-semibold mr-1">Gyors szűrők:</span>
              {[
                { id: 'all', label: 'Összes' },
                { id: 'szakmunkas', label: 'Szakmunkás' },
                { id: 'betanitott', label: 'Betanított munka' },
                { id: 'technikus', label: 'Technikus / Előkészítő' },
                { id: 'gyakornok', label: 'Gyakornok / Gyakorlat' },
                { id: 'epitesvezeto', label: 'Építésvezető / Mérnök' },
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleCategory(role.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                    selectedRoleCategory === role.id
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {(titleSearch || locationSearch || selectedType !== 'all' || selectedRoleCategory !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors shrink-0"
              >
                Szűrők törlése
              </button>
            )}
          </div>
        </section>

        {/* JOB POSTINGS GRID */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Briefcase className="text-accent" size={22} />
              Aktuális Állásajánlatok ({filteredJobs.length})
            </h2>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Ellenőrzött építőipari munkaadók
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent mb-2" />
              <p className="text-xs">Állások betöltése...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 shadow-sm">
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-full w-fit mx-auto">
                <Search size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Nincs a szűrésnek megfelelő állásajánlat</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                Próbálj meg más keresőszót megadni, vagy töröld a helyszín- és típus-szűrőket.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-700 transition-colors inline-flex items-center gap-1.5"
              >
                Szűrők alaphelyzetbe állítása
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => {
                const typeLabel =
                  job.job_type === 'full_time'
                    ? 'Teljes munkaidő'
                    : job.job_type === 'apprenticeship'
                    ? 'Szakmai gyakorlat'
                    : 'Részmunkaidő';
                const typeBadgeClass =
                  job.job_type === 'full_time'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : job.job_type === 'apprenticeship'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <div
                    key={job.id}
                    className="bg-white border border-gray-200 hover:border-accent rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between space-y-5 group relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-1 rounded-lg ${typeBadgeClass}`}>
                          {typeLabel}
                        </span>
                        <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                          <MapPin size={12} className="text-gray-400" /> {job.location}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                          {job.title}
                        </h3>
                        <div className="text-xs text-gray-500 font-bold mt-1 flex items-center gap-1">
                          <Building size={13} className="text-gray-400" /> {job.company_name}
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      {job.salary_range ? (
                        <div className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-fit">
                          <DollarSign size={14} /> {job.salary_range}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-gray-400">
                          Bérsáv: Megállapodás szerint
                        </div>
                      )}

                      <button
                        onClick={() => setApplyModalJob(job)}
                        className="w-full py-2.5 bg-primary hover:bg-accent hover:text-primary text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 group-hover:shadow-lg"
                      >
                        <span>Állás megtekintése &amp; Jelentkezés</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* CAREER TRAJECTORIES SECTION */}
        <section id="karrierutak" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Tervezhető karrier</span>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Compass className="text-primary" size={24} />
              Karrierutak Szakmánként
            </h2>
            <p className="text-xs text-gray-500">
              Ismerd meg a fejlődési lehetőségeket a segédmunkától a szakmunkán és művezetésen át egészen a vállalkozásindításig.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEFAULT_CAREER_TRAJECTORIES.map((traj: CareerTrajectory) => (
              <div
                key={traj.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                      {traj.experienceYears} tapasztalat
                    </span>
                    <button
                      onClick={() => onNavigate?.('paths')}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      Szakma orientáció <ArrowRight size={12} />
                    </button>
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900">{traj.title}</h3>
                  
                  {/* Visual Process Steps */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                    <div className="text-[11px] font-bold text-gray-500 uppercase">Fejlődési állomások:</div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-gray-800">
                      {traj.steps.map((step, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">{step}</span>
                          {idx < traj.steps.length - 1 && <span className="text-gray-400">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-gray-500 uppercase">Szükséges tudás:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {traj.requiredSkills.map((sk, i) => (
                        <span key={i} className="text-[11px] font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold">Ajánlott kurzusok elvégzése</span>
                  <button
                    onClick={() => onNavigate?.('courses')}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                  >
                    <span>Képzések megnyitása</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RELATED COURSES RECOMMENDATION BLOCK */}
        <section id="kepzesek" className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider">Készségfejlesztés</span>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                <GraduationCap className="text-primary" size={24} />
                Még hiányzik valamelyik készség? Ezekkel a képzésekkel felkészülhetsz
              </h2>
              <p className="text-xs text-gray-500">
                Szerezz hivatalos digitális tanúsítványt és növeld az elhelyezkedési esélyeidet.
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('courses')}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-primary font-extrabold text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
            >
              <span>Összes képzés megtekintése</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEFAULT_COURSES.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-primary bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    {course.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-gray-900 leading-snug">{course.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2">{course.description}</p>
                </div>

                <button
                  onClick={() => onNavigate?.('courses')}
                  className="w-full py-2 bg-white border border-gray-300 hover:border-primary text-gray-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <span>Képzés megnyitása</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* EMPLOYER SECTION */}
        <section id="munkaadok" className="bg-primary text-white rounded-3xl p-6 md:p-8 shadow-xl border border-primary-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 border border-accent/40 text-accent font-bold text-xs rounded-full">
              <Building size={13} /> Építőipari Kivitelezőknek &amp; Cégeknek
            </span>
            <h3 className="text-xl md:text-2xl font-black text-white">
              Cégként hirdetnél vagy szakembert keresel?
            </h3>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Tedd közzé nyitott pozícióidat és duális szakképzési gyakorlati helyeidet az ÉpítőTudás célzott szakmai közösségében.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 bg-accent hover:bg-accent-hover text-primary font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Új Álláshirdetés Feladása
            </button>
          </div>
        </section>

      </div>

      {/* JOB APPLICATION MODAL */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Jelentkezés: {applyModalJob.title}</h2>
                <p className="text-xs text-gray-500 font-semibold">{applyModalJob.company_name}</p>
              </div>
              <button onClick={() => setApplyModalJob(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {appliedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="text-emerald-600 mx-auto" size={44} />
                <div className="text-base font-bold text-gray-900">Sikeres Jelentkezés!</div>
                <p className="text-xs text-gray-500">A céges hirdető hamarosan felveszi veled a kapcsolatot.</p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 font-bold block mb-1">Teljes Név</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-bold block mb-1">Email Cím</label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 font-bold block mb-1">Kísérő üzenet / Bemutatkozás</label>
                  <textarea
                    rows={3}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Rövid bemutatkozás a szakmai tapasztalatodról..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalJob(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Jelentkezés Beküldése
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE JOB MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-extrabold text-gray-900">Új Álláshirdetés Feladása</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateJobSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-bold block mb-1">Cég / Kivitelező Neve</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="pl. Strabag Építő Kft."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-bold block mb-1">Pozíció Címe</label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="pl. Szerkezetépítő Kőműves Mester"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-bold block mb-1">Munkatípus</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as 'full_time' | 'part_time' | 'apprenticeship')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-accent"
                >
                  <option value="full_time">Teljes Munkaidő</option>
                  <option value="apprenticeship">Szakmai Gyakorlat</option>
                  <option value="part_time">Részmunkaidő</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-bold block mb-1">Helyszín</label>
                <input
                  type="text"
                  required
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  placeholder="pl. Budapest & Pest megye"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-bold block mb-1">Fizetési Sáv / Megállapodás</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="pl. Bruttó 650.000 Ft/hó"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 font-bold block mb-1">Részletes Leírás &amp; Elvárások</label>
                <textarea
                  rows={3}
                  required
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-700 shadow-xs"
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
