import { describe, it, expect, vi, beforeEach } from 'vitest';

const { writeAppConfigMock, readAppConfigMock, logAuditActionMock } = vi.hoisted(() => ({
  writeAppConfigMock: vi.fn().mockResolvedValue(undefined),
  readAppConfigMock: vi.fn().mockResolvedValue(null),
  logAuditActionMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./appConfigService', () => ({
  writeAppConfig: writeAppConfigMock,
  readAppConfig: readAppConfigMock,
}));

vi.mock('./auditLogService', () => ({
  logAuditAction: logAuditActionMock,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import {
  adjustColorBrightness,
  getContrastTextColor,
  generateRobotsTxt,
  getSiteSettings,
  saveSiteSettings,
} from './siteSettingsService';

describe('siteSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes contrast text color accurately for light and dark backgrounds', () => {
    expect(getContrastTextColor('#FFFFFF')).toBe('#000000');
    expect(getContrastTextColor('#000000')).toBe('#FFFFFF');
    expect(getContrastTextColor('#FFC400')).toBe('#000000');
  });

  it('adjusts hex color brightness within bounds', () => {
    expect(adjustColorBrightness('#000000', 10)).toMatch(/^#[0-9a-f]{6}$/i);
    expect(adjustColorBrightness('#FFFFFF', 50)).toBe('#ffffff');
    expect(adjustColorBrightness('#000000', -50)).toBe('#000000');
  });

  it('generates robots.txt honoring Google-Extended opt-out', () => {
    const defaults = getSiteSettings();
    const txt = generateRobotsTxt({
      ...defaults,
      googleExtendedOptOut: true,
      blockAiCrawlers: false,
    });
    expect(txt).toContain('User-agent: Google-Extended');
    expect(txt).toContain('Disallow: /');
  });

  it('awaits writeAppConfig when saving site settings', async () => {
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
      localStorage: { setItem: vi.fn(), getItem: vi.fn() },
      sessionStorage: { setItem: vi.fn(), getItem: vi.fn() },
    });
    const defaults = getSiteSettings();
    await saveSiteSettings({ ...defaults, siteTitle: 'Teszt Portál' });

    expect(writeAppConfigMock).toHaveBeenCalledWith(
      '__SYSTEM_CONFIG_SITE_SETTINGS__',
      expect.objectContaining({ siteTitle: 'Teszt Portál' }),
      expect.objectContaining({ slug: 'system-site-settings-config' })
    );
    vi.unstubAllGlobals();
  });
});

