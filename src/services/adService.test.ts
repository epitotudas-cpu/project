import { describe, it, expect, vi, beforeEach } from 'vitest';

const { writeAppConfigMock, readAppConfigMock } = vi.hoisted(() => ({
  writeAppConfigMock: vi.fn().mockResolvedValue(undefined),
  readAppConfigMock: vi.fn().mockResolvedValue(null),
}));

vi.mock('./appConfigService', () => ({
  writeAppConfig: writeAppConfigMock,
  readAppConfig: readAppConfigMock,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { calculateAdKpiStats, saveAdvertisers, savePayments, getAdvertisers } from './adService';

describe('adService', () => {
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

  it('calculates KPI stats (impressions, clicks, CTR, expiring campaigns) accurately', () => {
    const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const stats = calculateAdKpiStats([
      {
        id: 'c1',
        title: 'Kampány 1',
        advertiser_id: 'adv-1',
        status: 'active',
        impressions_count: 1000,
        clicks_count: 50,
        end_date: soon,
      } as never,
      {
        id: 'c2',
        title: 'Kampány 2',
        advertiser_id: 'adv-2',
        status: 'paused',
        impressions_count: 1000,
        clicks_count: 10,
      } as never,
    ]);

    expect(stats.activeCampaigns).toBe(1);
    expect(stats.expiringCampaigns).toBe(1);
    expect(stats.totalImpressions).toBe(2000);
    expect(stats.totalClicks).toBe(60);
    expect(stats.averageCtr).toBe('3.00');
  });

  it('awaits writeAppConfig when saving advertisers and payments', async () => {
    await saveAdvertisers([
      { id: 'adv-test', name: 'Teszt Hirdető', isActive: true } as never,
    ]);
    expect(getAdvertisers()).toHaveLength(1);
    expect(writeAppConfigMock).toHaveBeenCalledWith(
      '__SYSTEM_CONFIG_ADVERTISERS__',
      expect.any(Array),
      expect.objectContaining({ slug: 'system-advertisers-config' })
    );

    await savePayments([{ id: 'pay-1', amount: 49000, status: 'paid' } as never]);
    expect(writeAppConfigMock).toHaveBeenCalledWith(
      '__SYSTEM_CONFIG_AD_PAYMENTS__',
      expect.any(Array)
    );
  });
});
