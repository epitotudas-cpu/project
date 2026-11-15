import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: vi.fn(),
  },
}));

import { updatePartner, getPartnerBySlug, listPartners } from './partnerService';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe('partnerService (0.A extended profile persistence)', () => {
  const partnerId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    const mem = createMemoryStorage();
    vi.stubGlobal('localStorage', mem);
  });

  it('updatePartner sends all 11 extended profile columns to Supabase', async () => {
    const capturedPayloads: Record<string, unknown>[] = [];
    const savedRow = {
      id: partnerId,
      name: 'Teszt Kft.',
      slug: 'teszt-kft',
      category: 'ceg',
      is_verified: true,
      logo_bg: 'light_gray',
      operating_area: 'national',
      social_facebook: 'https://facebook.com/teszt',
      social_linkedin: 'https://linkedin.com/company/teszt',
      social_instagram: 'https://instagram.com/teszt',
      social_youtube: 'https://youtube.com/@teszt',
      services: [{ id: 's1', name: 'Tervezés', display_order: 0, is_active: true }],
      related_content: [{ id: 'r1', title: 'Útmutató', type: 'cikk', url: '/cikk/1', display_order: 0 }],
      seo_title: 'Teszt SEO',
      seo_description: 'Teszt leírás',
      is_indexable: false,
    };

    const select = vi.fn().mockResolvedValue({ data: [savedRow], error: null });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      capturedPayloads.push(payload);
      return { eq };
    });
    fromMock.mockReturnValue({ update });

    const res = await updatePartner(partnerId, {
      name: 'Teszt Kft.',
      logo_bg: 'light_gray',
      operating_area: 'national',
      social_facebook: 'https://facebook.com/teszt',
      social_linkedin: 'https://linkedin.com/company/teszt',
      social_instagram: 'https://instagram.com/teszt',
      social_youtube: 'https://youtube.com/@teszt',
      services: [{ id: 's1', name: 'Tervezés', display_order: 0, is_active: true }],
      related_content: [{ id: 'r1', title: 'Útmutató', type: 'cikk', url: '/cikk/1', display_order: 0 }],
      seo_title: 'Teszt SEO',
      seo_description: 'Teszt leírás',
      is_indexable: false,
    });

    expect(capturedPayloads).toHaveLength(1);
    expect(capturedPayloads[0]).toMatchObject({
      logo_bg: 'light_gray',
      operating_area: 'national',
      social_facebook: 'https://facebook.com/teszt',
      social_linkedin: 'https://linkedin.com/company/teszt',
      social_instagram: 'https://instagram.com/teszt',
      social_youtube: 'https://youtube.com/@teszt',
      services: [{ id: 's1', name: 'Tervezés', display_order: 0, is_active: true }],
      related_content: [{ id: 'r1', title: 'Útmutató', type: 'cikk', url: '/cikk/1', display_order: 0 }],
      seo_title: 'Teszt SEO',
      seo_description: 'Teszt leírás',
      is_indexable: false,
    });
    expect(res.services).toEqual(savedRow.services);
    expect(res.related_content).toEqual(savedRow.related_content);
    expect(res.is_indexable).toBe(false);
  });

  it('updatePartner throws when Supabase updates 0 rows (e.g. RLS denied) and keeps localStorage untouched', async () => {
    const select = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await expect(updatePartner(partnerId, { name: 'Másik Partner' })).rejects.toThrow('0 módosított sor');
    expect(localStorage.getItem('epitotudas_partners_v2')).toBeNull();
  });

  it('getPartnerBySlug and listPartners prioritize Supabase values over stale localStorage', async () => {
    localStorage.setItem(
      'epitotudas_partners_v2',
      JSON.stringify([
        {
          id: partnerId,
          slug: 'teszt-kft',
          name: 'Régi név',
          category: 'ceg',
          logo_bg: 'transparent',
          social_facebook: 'https://facebook.com/stale',
          services: [{ id: 'stale', name: 'Elavult', display_order: 0, is_active: true }],
          related_content: [{ id: 'stale-rc', title: 'Elavult', type: 'cikk', url: '/old', display_order: 0 }],
        },
      ])
    );

    const dbRow = {
      id: partnerId,
      slug: 'teszt-kft',
      name: 'Friss DB név',
      category: 'ceg',
      is_verified: true,
      logo_bg: 'white',
      social_facebook: null,
      services: [],
      related_content: [{ id: 'db-rc', title: 'Friss DB', type: 'cikk', url: '/new', display_order: 0 }],
    };

    const maybeSingle = vi.fn().mockResolvedValue({ data: dbRow, error: null });
    const eqSlug = vi.fn().mockReturnValue({ maybeSingle });
    const selectSlug = vi.fn().mockReturnValue({ eq: eqSlug });
    fromMock.mockReturnValueOnce({ select: selectSlug });

    const singlePartner = await getPartnerBySlug('teszt-kft');
    expect(singlePartner?.name).toBe('Friss DB név');
    expect(singlePartner?.logo_bg).toBe('white');
    expect(singlePartner?.social_facebook).toBeNull();
    expect(singlePartner?.services).toEqual([]);
    expect(singlePartner?.related_content).toEqual(dbRow.related_content);

    const limit = vi.fn().mockResolvedValue({ data: [dbRow], error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const selectList = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValueOnce({ select: selectList });

    const list = await listPartners();
    expect(list[0].services).toEqual([]);
    expect(list[0].related_content).toEqual(dbRow.related_content);
    expect(list[0].social_facebook).toBeNull();
  });
});
