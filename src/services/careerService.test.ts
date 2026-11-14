import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { createJobPosting, submitJobApplication } from './careerService';

describe('careerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when createJobPosting Supabase insert fails', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'RLS violation' },
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    await expect(
      createJobPosting({
        companyName: 'Test Építő Kft.',
        title: 'Kőműves',
        jobType: 'full_time',
        location: 'Budapest',
        description: 'Falazás és vakolás',
      })
    ).rejects.toThrow('RLS violation');
  });

  it('returns created job posting when Supabase insert succeeds', async () => {
    const dbRow = {
      id: '11111111-1111-1111-1111-111111111111',
      company_name: 'Test Építő Kft.',
      title: 'Kőműves',
      job_type: 'full_time',
      location: 'Budapest',
      salary_range: null,
      description: 'Falazás és vakolás',
      is_active: false,
      moderation_status: 'pending',
      created_at: '2026-11-14T09:00:00Z',
    };
    const maybeSingle = vi.fn().mockResolvedValue({ data: dbRow, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    const created = await createJobPosting({
      companyName: 'Test Építő Kft.',
      title: 'Kőműves',
      jobType: 'full_time',
      location: 'Budapest',
      description: 'Falazás és vakolás',
    });

    expect(created.id).toBe(dbRow.id);
    expect(created.moderation_status).toBe('pending');
  });

  it('validates applicant name and email in submitJobApplication', async () => {
    await expect(submitJobApplication('job-1', 'A', 'user@example.com')).rejects.toThrow(
      '2 és 100 karakter'
    );
    await expect(submitJobApplication('job-1', 'Kiss Péter', 'invalid-email')).rejects.toThrow(
      'érvényes e-mail'
    );
  });

  it('throws when submitJobApplication Supabase insert fails for UUID job', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Insert denied' },
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    await expect(
      submitJobApplication(
        '11111111-1111-1111-1111-111111111111',
        'Kiss Péter',
        'peter@example.com',
        'Szakmai tapasztalat'
      )
    ).rejects.toThrow('Insert denied');
  });
});

