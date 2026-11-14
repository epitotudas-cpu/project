import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { createCategory, deleteCategory, getCategoryBySlug } from './categoryService';

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when deleteCategory Supabase delete returns an error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'foreign key violation' } });
    const del = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ delete: del });

    await expect(deleteCategory('szerkezetepites')).rejects.toThrow('foreign key violation');
  });

  it('throws when createCategory Supabase insert returns an error', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'unique slug error' } });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    await expect(createCategory({ name: 'Teszt', slug: 'teszt' })).rejects.toThrow('unique slug error');
  });

  it('returns null from getCategoryBySlug when slug is not found', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select });

    const found = await getCategoryBySlug('nem-letezo-kategoria-xyz');
    expect(found).toBeNull();
  });
});

