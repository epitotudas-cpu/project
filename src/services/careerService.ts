import { supabase, type JobPosting, type JobApplication } from '../lib/supabase';

export interface CreateJobPostingPayload {
  companyName: string;
  title: string;
  jobType: 'full_time' | 'part_time' | 'apprenticeship';
  location: string;
  salaryRange?: string;
  description: string;
  partnerId?: string;
}

export interface CareerTrajectory {
  id: string;
  title: string;
  fromRole: string;
  toRole: string;
  steps: string[];
  requiredSkills: string[];
  recommendedCourseIds: string[];
  experienceYears: string;
  relatedTradeId: string;
}

export const DEFAULT_CAREER_TRAJECTORIES: CareerTrajectory[] = [
  {
    id: 'traj-1',
    title: 'Kőművesből Művezető / Építésvezető',
    fromRole: 'Szerkezetépítő Kőműves',
    toRole: 'Kivitelezési Művezető',
    steps: ['Szakmunkás alapok', 'Tervrajz olvasás & Műszaki irányítás', 'Zsaluzat & Monolit technológia', 'Brigádvezető / Művezető'],
    requiredSkills: ['Tervrajz olvasás', 'Zsaluzat méretezés', 'Csapatirányítás', 'Munkavédelem'],
    recommendedCourseIds: ['course-1', 'course-3', 'course-4'],
    experienceYears: '3-5 év',
    relatedTradeId: 'komuves',
  },
  {
    id: 'traj-2',
    title: 'Villanyszerelőből Önálló Vállalkozó',
    fromRole: 'Villanyszerelő Technikus',
    toRole: 'Egyéni Vállalkozó / Cégtulajdonos',
    steps: ['Erősáramú alapok', 'Érintésvédelmi felülvizsgáló', 'KNX & Okosotthon képzés', 'Vállalkozásindítás'],
    requiredSkills: ['Műszeres mérés', 'Érintésvédelem', 'Ügyfélkommunikáció', 'Árajánlatadás'],
    recommendedCourseIds: ['course-5', 'course-3'],
    experienceYears: '2-4 év',
    relatedTradeId: 'villanyszerelo',
  },
  {
    id: 'traj-3',
    title: 'Segédmunkásból Szakmunkás',
    fromRole: 'Építőipari Segédmunkás',
    toRole: 'Minősített Falazó Kőműves',
    steps: ['Helyszíni tapasztalat', 'Alap képzés elvégzése', 'Gyakorlati vizsga', 'Önálló szakmunkás status'],
    requiredSkills: ['Betonozás', 'Habarcskeverés', 'Alapvető falazás', 'Munkavédelem'],
    recommendedCourseIds: ['course-2', 'course-3'],
    experienceYears: '1-2 év',
    relatedTradeId: 'komuves',
  },
  {
    id: 'traj-4',
    title: 'Burkolóból Generálkivitelező',
    fromRole: 'Hidegburkoló',
    toRole: 'Belsőépítészeti Kivitelező',
    steps: ['Gyakorlati burkolás', 'Vízszigetelés & Kőzetgyapot', 'Költségvetés-készítés', 'Generálkivitelezés'],
    requiredSkills: ['Szintkiegyenlítés', 'Kenhető vízszigetelés', 'Anyagszükséglet számítás', 'Generálkoordináció'],
    recommendedCourseIds: ['course-6', 'course-2'],
    experienceYears: '4-6 év',
    relatedTradeId: 'burkolo',
  },
];

const DEFAULT_JOBS: JobPosting[] = [
  {
    id: 'job-1',
    company_name: 'Strabag Építő Kft.',
    title: 'Senior Monolit Beton Kőműves Mester',
    job_type: 'full_time',
    location: 'Budapest & Pest megye',
    salary_range: 'Bruttó 650.000 - 850.000 Ft/hó',
    description: 'Nagy léptékű szerkezetépítési projektek kivitelezése, zsaluzatok szerelése és kőműves brigádok vezetése.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-2',
    company_name: 'Wienerberger Zrt.',
    title: 'Szerkezetépítő Szakmai Gyakorlati Hely',
    job_type: 'apprenticeship',
    location: 'Győr-Moson-Sopron',
    salary_range: 'Versenyképes ösztöndíj',
    description: 'Duális szakképzés keretében történő oktatás és gyakorlat falazási, valamint kerámia tetőfedési szakterületen.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-3',
    company_name: 'Market Építő Zrt.',
    title: 'Építésvezető Mérnök Asszisztens',
    job_type: 'full_time',
    location: 'Székesfehérvár (Fejér)',
    salary_range: 'Bruttó 550.000 - 700.000 Ft/hó',
    description: 'Helyszíni minőségellenőrzés, műszaki dokumentáció vezetés és alvállalkozói koordináció.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-4',
    company_name: 'KÉSZ Csoport',
    title: 'Gépész Műszaki Előkészítő Technikus',
    job_type: 'full_time',
    location: 'Kecskemét (Bács-Kiskun)',
    salary_range: 'Bruttó 600.000 - 750.000 Ft/hó',
    description: 'HVAC és csőhálózati felmérések, anyagszükséglet számítás és alvállalkozói ajánlatkérések.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-5',
    company_name: 'Bayer Konstrukt Zrt.',
    title: 'Betanított Szerkezetépítő & Zsaluzó',
    job_type: 'full_time',
    location: 'Debrecen (Hajdú-Bihar)',
    salary_range: 'Bruttó 480.000 - 600.000 Ft/hó',
    description: 'Előregyártott elemek beemelése, zsaluelemek összeszerelése betanítással és mentori kíséréssel.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'job-6',
    company_name: 'Electro-Pro Kft.',
    title: 'Villanyszerelő Technikus & Okosotthon Telepítő',
    job_type: 'full_time',
    location: 'Budapest',
    salary_range: 'Bruttó 620.000 - 800.000 Ft/hó',
    description: 'Erősáramú elosztók beépítése, okosotthon vezérlések programozása és mérések elvégzése.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const CAREER_JOBS_KEY = 'epitotudas_career_jobs';
const CAREER_APPLICATIONS_KEY = 'epitotudas_career_applications';

function getStoredJobs(): JobPosting[] {
  try {
    const raw = localStorage.getItem(CAREER_JOBS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_JOBS.map((j) => ({ ...j, moderation_status: 'approved' as const }));
}

function saveStoredJobs(jobs: JobPosting[]) {
  try {
    localStorage.setItem(CAREER_JOBS_KEY, JSON.stringify(jobs));
  } catch {
    // ignore
  }
}

export function getStoredApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(CAREER_APPLICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

function saveStoredApplications(apps: JobApplication[]) {
  try {
    localStorage.setItem(CAREER_APPLICATIONS_KEY, JSON.stringify(apps));
  } catch {
    // ignore
  }
}

export async function listJobPostings(
  jobType?: string,
  locationQuery?: string,
  includePending = false,
  limit: number = 100
): Promise<JobPosting[]> {
  try {
    const { data } = await supabase
      .from('job_postings' as 'articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (data && data.length > 0) {
      let filtered = data as unknown as JobPosting[];
      if (!includePending) {
        filtered = filtered.filter(
          (j) => j.is_active !== false && j.moderation_status !== 'pending' && j.moderation_status !== 'rejected'
        );
      }
      if (jobType && jobType !== 'all') filtered = filtered.filter((j) => j.job_type === jobType);
      if (locationQuery) filtered = filtered.filter((j) => j.location.toLowerCase().includes(locationQuery.toLowerCase()));
      return filtered;
    }
  } catch (err) {
    void err;
  }

  const all = getStoredJobs();
  let filtered = [...all];
  if (!includePending) {
    filtered = filtered.filter(
      (j) => j.is_active !== false && j.moderation_status !== 'pending' && j.moderation_status !== 'rejected'
    );
  }
  if (jobType && jobType !== 'all') filtered = filtered.filter((j) => j.job_type === jobType);
  if (locationQuery) filtered = filtered.filter((j) => j.location.toLowerCase().includes(locationQuery.toLowerCase()));
  return filtered;
}

export async function createJobPosting(
  payload: CreateJobPostingPayload,
  isDirectApproved = false
): Promise<JobPosting> {
  let newJob: JobPosting = {
    id: `job-${Date.now()}`,
    company_name: payload.companyName,
    title: payload.title,
    job_type: payload.jobType,
    location: payload.location,
    salary_range: payload.salaryRange || null,
    description: payload.description,
    is_active: isDirectApproved,
    moderation_status: isDirectApproved ? 'approved' : 'pending',
    created_at: new Date().toISOString(),
  };

  try {
    const insertPayload: Record<string, unknown> = {
      company_name: payload.companyName,
      title: payload.title,
      job_type: payload.jobType,
      location: payload.location,
      salary_range: payload.salaryRange || null,
      description: payload.description,
      is_active: isDirectApproved,
    };
    if (payload.partnerId) {
      insertPayload.partner_id = payload.partnerId;
    }

    const { data, error } = await supabase
      .from('job_postings' as never)
      .insert(insertPayload as never)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(`Álláshirdetés mentése sikertelen az adatbázisba: ${error.message}`);
    }

    if (data) {
      const rowData = data as Partial<JobPosting>;
      newJob = {
        ...newJob,
        ...rowData,
        moderation_status: rowData.moderation_status || newJob.moderation_status,
      };
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Álláshirdetés mentése sikertelen')) {
      throw err;
    }
    throw new Error(err instanceof Error ? err.message : 'Álláshirdetés mentése sikertelen az adatbázisba.');
  }

  const all = getStoredJobs();
  all.unshift(newJob);
  saveStoredJobs(all);
  return newJob;
}

export async function approveJobPosting(id: string): Promise<void> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    const { error } = await supabase
      .from('job_postings' as never)
      .update({ is_active: true, moderation_status: 'approved' } as never)
      .eq('id', id);
    if (error) {
      throw new Error(`Álláshirdetés jóváhagyása sikertelen: ${error.message}`);
    }
  }

  const all = getStoredJobs();
  const idx = all.findIndex((j) => j.id === id);
  if (idx !== -1) {
    all[idx].moderation_status = 'approved';
    all[idx].is_active = true;
    saveStoredJobs(all);
  }
}

export async function rejectJobPosting(id: string): Promise<void> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) {
    const { error } = await supabase
      .from('job_postings' as never)
      .update({ is_active: false, moderation_status: 'rejected' } as never)
      .eq('id', id);
    if (error) {
      throw new Error(`Álláshirdetés elutasítása sikertelen: ${error.message}`);
    }
  }

  const all = getStoredJobs();
  const idx = all.findIndex((j) => j.id === id);
  if (idx !== -1) {
    all[idx].moderation_status = 'rejected';
    all[idx].is_active = false;
    saveStoredJobs(all);
  }
}

export async function submitJobApplication(
  jobId: string,
  applicantName: string,
  applicantEmail: string,
  coverNote?: string,
  userId?: string
): Promise<JobApplication> {
  const cleanName = applicantName.trim();
  const cleanEmail = applicantEmail.trim();
  const cleanNote = coverNote?.trim() || null;

  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error('A névnek 2 és 100 karakter között kell lennie.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('Kérjük, adjon meg egy érvényes e-mail címet.');
  }
  if (cleanNote && cleanNote.length > 2000) {
    throw new Error('A bemutatkozó levél legfeljebb 2000 karakter lehet.');
  }

  let application: JobApplication = {
    id: `app-${Date.now()}`,
    job_id: jobId,
    user_id: userId || null,
    applicant_name: cleanName,
    applicant_email: cleanEmail,
    cover_note: cleanNote,
    created_at: new Date().toISOString(),
  };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);
  if (isUuid) {
    const { data, error } = await supabase
      .from('job_applications' as never)
      .insert({
        job_id: jobId,
        user_id: userId || null,
        applicant_name: cleanName,
        applicant_email: cleanEmail,
        cover_note: cleanNote,
      })
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'A jelentkezés beküldése sikertelen.');
    }
    if (data) {
      application = data as JobApplication;
    }
  }

  const allApps = getStoredApplications();
  allApps.push(application);
  saveStoredApplications(allApps);
  return application;
}

export async function updateJobPosting(
  id: string,
  payload: Partial<CreateJobPostingPayload> & { is_active?: boolean; moderation_status?: 'pending' | 'approved' | 'rejected' }
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (payload.companyName !== undefined) dbUpdates.company_name = payload.companyName;
  if (payload.title !== undefined) dbUpdates.title = payload.title;
  if (payload.jobType !== undefined) dbUpdates.job_type = payload.jobType;
  if (payload.location !== undefined) dbUpdates.location = payload.location;
  if (payload.salaryRange !== undefined) dbUpdates.salary_range = payload.salaryRange;
  if (payload.description !== undefined) dbUpdates.description = payload.description;
  if (payload.is_active !== undefined) dbUpdates.is_active = payload.is_active;
  if (payload.moderation_status !== undefined) dbUpdates.moderation_status = payload.moderation_status;

  if (Object.keys(dbUpdates).length > 0) {
    const { error } = await supabase
      .from('job_postings' as never)
      .update(dbUpdates as never)
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Az álláshirdetés frissítése sikertelen.');
    }
  }

  const all = getStoredJobs();
  const idx = all.findIndex((j) => j.id === id);
  if (idx !== -1) {
    all[idx] = {
      ...all[idx],
      company_name: payload.companyName ?? all[idx].company_name,
      title: payload.title ?? all[idx].title,
      job_type: payload.jobType ?? all[idx].job_type,
      location: payload.location ?? all[idx].location,
      salary_range: payload.salaryRange !== undefined ? payload.salaryRange : all[idx].salary_range,
      description: payload.description ?? all[idx].description,
      is_active: payload.is_active !== undefined ? payload.is_active : all[idx].is_active,
      moderation_status: payload.moderation_status !== undefined ? payload.moderation_status : all[idx].moderation_status,
    };
    saveStoredJobs(all);
  }
}

export async function toggleJobPostingActive(id: string): Promise<void> {
  const all = getStoredJobs();
  const job = all.find((j) => j.id === id);
  let nextActive = job ? !job.is_active : true;

  if (!job) {
    const { data, error: fetchError } = await supabase
      .from('job_postings' as never)
      .select('is_active')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) {
      throw new Error(fetchError.message || 'Az álláshirdetés lekérdezése sikertelen.');
    }
    if (data) {
      nextActive = !(data as { is_active?: boolean }).is_active;
    }
  }

  const { error } = await supabase
    .from('job_postings' as never)
    .update({ is_active: nextActive } as never)
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Az álláshirdetés állapotának módosítása sikertelen.');
  }

  if (job) {
    job.is_active = nextActive;
    saveStoredJobs(all);
  }
}

export async function deleteJobPosting(id: string): Promise<void> {
  const { error } = await supabase
    .from('job_postings' as never)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Az álláshirdetés törlése sikertelen.');
  }

  const all = getStoredJobs();
  const idx = all.findIndex((j) => j.id === id);
  if (idx !== -1) {
    all.splice(idx, 1);
    saveStoredJobs(all);
  }
}
