import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { getAdPackages, saveAdPackage, deleteAdPackage, INITIAL_MANAGED_PACKAGES } from './adPackageService';

describe('adPackageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store: Record<string, string> = {};
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
      },
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
    });
  });

  it('falls back to INITIAL_MANAGED_PACKAGES when Supabase returns empty or error', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select });

    const pkgs = await getAdPackages();
    expect(pkgs.length).toBe(INITIAL_MANAGED_PACKAGES.length);
    expect(pkgs[0].name).toContain('Bronze');
  });

  it('saves and deletes an ad package locally when cloud table is unavailable', async () => {
    fromMock.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: { message: 'table missing' } }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'table missing' } }),
      }),
    }));

    const created = await saveAdPackage({
      name: 'Platinum – Kiemelt',
      price_huf: 199000,
    });
    expect(created.name).toBe('Platinum – Kiemelt');
    expect(created.price_huf).toBe(199000);

    await deleteAdPackage(created.id);
    const listAfter = await getAdPackages();
    expect(listAfter.some((p) => p.id === created.id)).toBe(false);
  });
});

