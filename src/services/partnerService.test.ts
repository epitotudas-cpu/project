import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

import {
  createPartner,
  updatePartner,
  getPartnerBySlug,
  listPartners,
  getPartnerOffers,
  incrementPartnerViews,
  incrementOfferViews,
  getPartnerAnalytics,
} from './partnerService';

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

describe('partnerService (Phase 1 P0-P2)', () => {
  const partnerId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', createMemoryStorage());
    vi.stubGlobal('sessionStorage', createMemoryStorage());
  });

  it('createPartner persists all extended fields including certificates, status, and is_featured', async () => {
    let insertedPayload: Record<string, unknown> | null = null;
    const single = vi.fn().mockImplementation(async () => ({
      data: { id: partnerId, ...insertedPayload },
      error: null,
    }));
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockImplementation((payload: Record<string, unknown>) => {
      insertedPayload = payload;
      return { select };
    });
    fromMock.mockReturnValueOnce({ insert });

    const created = await createPartner({
      name: 'Új Partner Kft.',
      category: 'gyarto',
      status: 'draft',
      is_featured: true,
      operating_area: 'national',
      certificates: [{ id: 'c1', title: 'ISO 9001', is_published: true }],
    });

    expect(insertedPayload).toBeTruthy();
    expect(insertedPayload?.status).toBe('draft');
    expect(insertedPayload?.is_featured).toBe(true);
    expect(insertedPayload?.operating_area).toBe('national');
    expect(insertedPayload?.certificates).toEqual([{ id: 'c1', title: 'ISO 9001', is_published: true }]);
    expect(created.id).toBe(partnerId);
  });

  it('listPartners and getPartnerBySlug hide inactive/draft partners unless includeInactive is true', async () => {
    const rows = [
      { id: partnerId, slug: 'aktiv', name: 'Aktív Kft.', category: 'ceg', is_verified: true, status: 'published' },
      { id: '22222222-2222-4222-8222-222222222222', slug: 'archiv', name: 'Archív Kft.', category: 'ceg', is_verified: true, status: 'inactive' },
    ];
    const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const selectList = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValueOnce({ select: selectList });

    const publicList = await listPartners();
    expect(publicList.map((p) => p.slug)).toEqual(['aktiv']);

    const limitAdmin = vi.fn().mockResolvedValue({ data: rows, error: null });
    const orderAdmin = vi.fn().mockReturnValue({ limit: limitAdmin });
    const selectAdmin = vi.fn().mockReturnValue({ order: orderAdmin });
    fromMock.mockReturnValueOnce({ select: selectAdmin });

    const adminList = await listPartners(undefined, 100, { includeInactive: true });
    expect(adminList.map((p) => p.slug)).toEqual(['aktiv', 'archiv']);

    const maybeSingle = vi.fn().mockResolvedValue({ data: rows[1], error: null });
    const eqSlug = vi.fn().mockReturnValue({ maybeSingle });
    const selectSlug = vi.fn().mockReturnValue({ eq: eqSlug });
    fromMock.mockReturnValueOnce({ select: selectSlug });

    expect(await getPartnerBySlug('archiv')).toBeNull();
  });

  it('getPartnerOffers throws on DB error and filters expired offers when activeOnly is true', async () => {
    const orderErr = vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } });
    const eqErr = vi.fn().mockReturnValue({ order: orderErr });
    const selectErr = vi.fn().mockReturnValue({ eq: eqErr });
    fromMock.mockReturnValueOnce({ select: selectErr });

    await expect(getPartnerOffers(partnerId)).rejects.toThrow(/RLS denied/);

    const offers = [
      { id: 'o1', partner_id: partnerId, title: 'Lejárt', discount: '10%', description: '', valid_until: '2020-01-01', expires_at: '2020-01-01', status: 'Aktív' },
      { id: 'o2', partner_id: partnerId, title: 'Aktív', discount: '15%', description: '', valid_until: '2099-12-31', expires_at: '2099-12-31', status: 'Aktív' },
    ];
    const eqStatus = vi.fn().mockResolvedValue({ data: offers, error: null });
    const orderOk = vi.fn().mockReturnValue({ eq: eqStatus });
    const eqOk = vi.fn().mockReturnValue({ order: orderOk });
    const selectOk = vi.fn().mockReturnValue({ eq: eqOk });
    fromMock.mockReturnValueOnce({ select: selectOk });

    const active = await getPartnerOffers(partnerId, true);
    expect(active.map((o) => o.id)).toEqual(['o2']);
  });

  it('deduplicates incrementPartnerViews and incrementOfferViews per session and aggregates offer analytics', async () => {
    rpcMock.mockResolvedValue({ data: 5, error: null });

    expect(await incrementPartnerViews(partnerId)).toBe(5);
    expect(await incrementPartnerViews(partnerId)).toBe(0);
    expect(rpcMock).toHaveBeenCalledTimes(1);

    expect(await incrementOfferViews('offer-1')).toBe(5);
    expect(await incrementOfferViews('offer-1')).toBe(0);
    expect(rpcMock).toHaveBeenCalledTimes(2);

    const maybeSingle = vi.fn().mockResolvedValue({ data: { profile_views: 12 }, error: null });
    const eqPartner = vi.fn().mockReturnValue({ maybeSingle });
    const selectPartner = vi.fn().mockReturnValue({ eq: eqPartner });

    const eqArt = vi.fn().mockResolvedValue({ data: [{ id: 'a1', views: 20 }], error: null });
    const selectArt = vi.fn().mockReturnValue({ eq: eqArt });

    const eqRef = vi.fn().mockResolvedValue({ count: 3, error: null });
    const selectRef = vi.fn().mockReturnValue({ eq: eqRef });

    const eqOff = vi.fn().mockResolvedValue({ data: [{ id: 'o1', views: 7 }, { id: 'o2', views: 3 }], error: null });
    const selectOff = vi.fn().mockReturnValue({ eq: eqOff });

    fromMock
      .mockReturnValueOnce({ select: selectPartner })
      .mockReturnValueOnce({ select: selectArt })
      .mockReturnValueOnce({ select: selectRef })
      .mockReturnValueOnce({ select: selectOff });

    const stats = await getPartnerAnalytics(partnerId);
    expect(stats).toEqual({
      profileViews: 12,
      articlesCount: 1,
      articleViewsSum: 20,
      referencesCount: 3,
      offersCount: 2,
      offerViewsSum: 10,
    });
  });
});
