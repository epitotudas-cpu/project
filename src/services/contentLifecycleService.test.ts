import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { transitionContentStatus, getStatusLabel } from './contentLifecycleService';

describe('contentLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps Hungarian lifecycle status labels correctly', () => {
    expect(getStatusLabel('draft')).toBe('Piszkozat');
    expect(getStatusLabel('submitted')).toBe('Beküldve');
    expect(getStatusLabel('review')).toBe('Ellenőrzés alatt');
    expect(getStatusLabel('approved')).toBe('Jóváhagyva');
    expect(getStatusLabel('published')).toBe('Publikálva');
  });

  it('transitions content status in Supabase and returns updated metadata', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'art-1',
        title: 'Teszt Útmutató',
        author: 'Kovács Péter',
        partner_name: null,
        status: 'published',
        excerpt: 'Rövid leírás',
        created_at: '2026-11-14T08:00:00Z',
        updated_at: '2026-11-14T09:00:00Z',
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    const meta = await transitionContentStatus('art-1', 'published', 'admin-123');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));
    expect(meta.status).toBe('published');
    expect(meta.approvedBy).toBe('admin-123');
  });

  it('throws when transitionContentStatus cannot find or update target article', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await expect(transitionContentStatus('missing-id', 'published')).rejects.toThrow(
      'nem található'
    );
  });
});

