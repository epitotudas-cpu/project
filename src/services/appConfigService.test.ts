import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { readAppConfig, writeAppConfig } from './appConfigService';

describe('appConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads configuration from app_configs when present', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { value: { accent: '#FFC400' } }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ select });

    const result = await readAppConfig<{ accent: string }>('__TEST_CFG__');
    expect(fromMock).toHaveBeenCalledWith('app_configs');
    expect(result).toEqual({ accent: '#FFC400' });
  });

  it('falls back to legacy categories row when app_configs has no entry', async () => {
    const appConfigsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const legacyMaybeSingle = vi.fn().mockResolvedValue({
      data: { description: JSON.stringify({ theme: 'dark' }) },
      error: null,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'app_configs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: appConfigsMaybeSingle }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle: legacyMaybeSingle }),
        }),
      };
    });

    const result = await readAppConfig<{ theme: string }>('__TEST_CFG__', '__SYSTEM_CONFIG_TEST__');
    expect(result).toEqual({ theme: 'dark' });
  });

  it('throws when writeAppConfig fails on both app_configs and legacy categories fallback', async () => {
    fromMock.mockImplementation((table: string) => ({
      upsert: vi.fn().mockResolvedValue({
        error: { message: `${table} write failed` },
      }),
    }));

    await expect(
      writeAppConfig('__TEST_CFG__', { a: 1 }, { id: '__SYSTEM_CONFIG_TEST__', slug: 'sys-test' })
    ).rejects.toThrow('categories write failed');
  });

  it('succeeds when writeAppConfig upserts into app_configs', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ upsert });

    await expect(writeAppConfig('__TEST_CFG__', { a: 1 })).resolves.toBeUndefined();
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});

