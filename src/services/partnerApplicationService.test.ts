import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import {
  submitPartnerApplication,
  listPartnerApplications,
  updateApplicationStatus,
} from './partnerApplicationService';

describe('partnerApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits partner application with trimmed/lowercased email and pending status', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'app-1',
        company_name: 'Minta Kft.',
        contact_name: 'Nagy Béla',
        email: 'bela@minta.hu',
        category: 'gyarto',
        status: 'pending',
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    const res = await submitPartnerApplication({
      company_name: '  Minta Kft. ',
      contact_name: ' Nagy Béla ',
      email: ' BELA@MINTA.HU ',
      category: 'gyarto',
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_name: 'Minta Kft.',
        contact_name: 'Nagy Béla',
        email: 'bela@minta.hu',
        status: 'pending',
      })
    );
    expect(res.status).toBe('pending');
  });

  it('lists applications with status filter and limit', async () => {
    const eq = vi.fn().mockResolvedValue({ data: [{ id: 'app-1', status: 'pending' }], error: null });
    const limit = vi.fn().mockReturnValue({ eq });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select });

    const res = await listPartnerApplications('pending', 50);
    expect(limit).toHaveBeenCalledWith(50);
    expect(eq).toHaveBeenCalledWith('status', 'pending');
    expect(res).toHaveLength(1);
  });

  it('throws when updateApplicationStatus fails', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'forbidden' } });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await expect(updateApplicationStatus('app-1', 'approved')).rejects.toThrow('forbidden');
  });
});

