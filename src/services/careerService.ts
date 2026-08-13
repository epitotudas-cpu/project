import { supabase, type JobPosting, type JobApplication } from '../lib/supabase';

export interface CreateJobPostingPayload {
  companyName: string;
  title: string;
  jobType: 'full_time' | 'part_time' | 'apprenticeship';
  location: string;
  salaryRange?: string;
  description: string;
}

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
    location: 'Győr',
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
    location: 'Székesfehérvár',
    salary_range: 'Bruttó 550.000 - 700.000 Ft/hó',
    description: 'Helyszíni minőségellenőrzés, műszaki dokumentáció vezetés és alvállalkozói koordináció.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const APPLICATIONS_STORE: JobApplication[] = [];

export async function listJobPostings(jobType?: string, locationQuery?: string): Promise<JobPosting[]> {
  try {
    const { data } = await supabase
      .from('job_postings' as 'articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      let filtered = data as unknown as JobPosting[];
      if (jobType && jobType !== 'all') filtered = filtered.filter((j) => j.job_type === jobType);
      if (locationQuery) filtered = filtered.filter((j) => j.location.toLowerCase().includes(locationQuery.toLowerCase()));
      return filtered;
    }
  } catch (err) {
    void err;
  }

  let filtered = [...DEFAULT_JOBS];
  if (jobType && jobType !== 'all') filtered = filtered.filter((j) => j.job_type === jobType);
  if (locationQuery) filtered = filtered.filter((j) => j.location.toLowerCase().includes(locationQuery.toLowerCase()));
  return filtered;
}

export async function createJobPosting(payload: CreateJobPostingPayload): Promise<JobPosting> {
  const newJob: JobPosting = {
    id: `job-${Date.now()}`,
    company_name: payload.companyName,
    title: payload.title,
    job_type: payload.jobType,
    location: payload.location,
    salary_range: payload.salaryRange || null,
    description: payload.description,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  DEFAULT_JOBS.unshift(newJob);
  return newJob;
}

export async function submitJobApplication(
  jobId: string,
  applicantName: string,
  applicantEmail: string,
  coverNote?: string,
  userId?: string
): Promise<JobApplication> {
  const application: JobApplication = {
    id: `app-${Date.now()}`,
    job_id: jobId,
    user_id: userId || null,
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    cover_note: coverNote || null,
    created_at: new Date().toISOString(),
  };

  APPLICATIONS_STORE.push(application);
  return application;
}

export async function updateJobPosting(id: string, payload: Partial<CreateJobPostingPayload> & { is_active?: boolean }): Promise<void> {
  const idx = DEFAULT_JOBS.findIndex((j) => j.id === id);
  if (idx !== -1) {
    DEFAULT_JOBS[idx] = {
      ...DEFAULT_JOBS[idx],
      company_name: payload.companyName ?? DEFAULT_JOBS[idx].company_name,
      title: payload.title ?? DEFAULT_JOBS[idx].title,
      job_type: payload.jobType ?? DEFAULT_JOBS[idx].job_type,
      location: payload.location ?? DEFAULT_JOBS[idx].location,
      salary_range: payload.salaryRange !== undefined ? payload.salaryRange : DEFAULT_JOBS[idx].salary_range,
      description: payload.description ?? DEFAULT_JOBS[idx].description,
      is_active: payload.is_active !== undefined ? payload.is_active : DEFAULT_JOBS[idx].is_active,
    };
  }
}

export async function toggleJobPostingActive(id: string): Promise<void> {
  const job = DEFAULT_JOBS.find((j) => j.id === id);
  if (job) {
    job.is_active = !job.is_active;
  }
}

export async function deleteJobPosting(id: string): Promise<void> {
  const idx = DEFAULT_JOBS.findIndex((j) => j.id === id);
  if (idx !== -1) {
    DEFAULT_JOBS.splice(idx, 1);
  }
}
