import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  readAppConfigMock,
  writeAppConfigMock,
  readAppConfigWithVersionMock,
  writeAppConfigIfUnchangedMock,
  rpcMock,
  getSessionMock,
} = vi.hoisted(() => ({
  readAppConfigMock: vi.fn().mockResolvedValue(null),
  writeAppConfigMock: vi.fn().mockResolvedValue(undefined),
  readAppConfigWithVersionMock: vi.fn().mockResolvedValue({ value: null, updatedAt: null }),
  writeAppConfigIfUnchangedMock: vi.fn().mockResolvedValue({ conflict: false, updatedAt: '2026-11-15T12:00:00Z' }),
  rpcMock: vi.fn(),
  getSessionMock: vi.fn().mockResolvedValue({ data: { session: { access_token: 'jwt-token-123' } } }),
}));

vi.mock('./appConfigService', () => ({
  readAppConfig: readAppConfigMock,
  writeAppConfig: writeAppConfigMock,
  readAppConfigWithVersion: readAppConfigWithVersionMock,
  writeAppConfigIfUnchanged: writeAppConfigIfUnchangedMock,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    auth: {
      getSession: getSessionMock,
    },
  },
}));

import {
  fetchMaterialsFromCloud,
  saveMaterialsLocal,
  setMaterialStatusAsAdmin,
  upsertPartnerMaterialItem,
  deletePartnerMaterialItem,
  uploadPartnerMaterialImage,
  deletePartnerMaterialImages,
  getR2CleanupFailures,
  saveR2CleanupFailures,
  R2DeletePartialError,
  getMaterialsLocal,
  type MaterialItem,
} from './materialsService';

function makeItem(overrides: Partial<MaterialItem> = {}): MaterialItem {
  return {
    id: 'mat-1',
    name: 'Alap Termék',
    slug: 'alap-termek',
    category_id: 'mat-cat-1',
    category_name: 'Szigetelőanyagok',
    subcategory_name: null,
    brand: 'Teszt Márka',
    partner_id: 'partner-1',
    partner_name: 'Teszt Partner Kft.',
    sku: null,
    barcode: null,
    short_description: 'Rövid leírás',
    full_description: 'Részletes leírás',
    application_area: null,
    technical_specs: [],
    main_image_url: 'https://example.com/img.jpg',
    gallery_image_urls: [],
    documents: [],
    related_material_ids: [],
    status: 'draft',
    rejection_note: null,
    featured: false,
    sort_order: 1,
    views: 0,
    seo_title: null,
    seo_description: null,
    keywords: [],
    created_at: '2026-11-15T10:00:00Z',
    updated_at: '2026-11-15T10:00:00Z',
    ...overrides,
  };
}

describe('materialsService (0.C)', () => {
  let storageMap: Map<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    storageMap = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => {
        storageMap.set(k, v);
      },
      removeItem: (k: string) => {
        storageMap.delete(k);
      },
      clear: () => storageMap.clear(),
    });
    vi.stubGlobal('window', {
      dispatchEvent: vi.fn(),
    });
    vi.stubGlobal('Event', class MockEvent {
      type: string;
      constructor(type: string) {
        this.type = type;
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('upsertPartnerMaterialItem calls RPC with published status and updates localStorage only on success', async () => {
    const savedItem = makeItem({
      id: 'mat-partner-abc',
      status: 'published',
      gallery_image_urls: ['https://cdn.example.com/2.webp'],
    });
    rpcMock.mockResolvedValueOnce({ data: savedItem, error: null });

    const result = await upsertPartnerMaterialItem('partner-1', {
      name: 'Alap Termék',
      short_description: 'Rövid leírás',
      gallery_image_urls: ['https://cdn.example.com/2.webp'],
      status: 'published',
    });

    expect(rpcMock).toHaveBeenCalledWith('upsert_partner_material_item', {
      p_partner_id: 'partner-1',
      p_item: expect.objectContaining({
        status: 'published',
        gallery_image_urls: ['https://cdn.example.com/2.webp'],
      }),
    });
    expect(result.id).toBe('mat-partner-abc');
    expect(result.status).toBe('published');
    expect(getMaterialsLocal().some((i) => i.id === 'mat-partner-abc')).toBe(true);

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Csak a saját termékét módosíthatja.' },
    });
    await expect(
      upsertPartnerMaterialItem('partner-1', {
        id: 'mat-partner-abc',
        name: 'Módosított',
        short_description: 'Rövid',
        status: 'published',
      })
    ).rejects.toThrow('Csak a saját termékét módosíthatja.');
  });

  it('deletePartnerMaterialItem calls RPC and does not mutate localStorage on error', async () => {
    const existing = makeItem({ id: 'mat-partner-del' });
    localStorage.setItem('epitotudas_materials_items_v1', JSON.stringify([existing]));

    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'Csak a saját termékét törölheti.' } });
    await expect(deletePartnerMaterialItem('partner-1', 'mat-partner-del')).rejects.toThrow(
      'Csak a saját termékét törölheti.'
    );
    expect(getMaterialsLocal()).toHaveLength(1);

    rpcMock.mockResolvedValueOnce({ data: true, error: null });
    await deletePartnerMaterialItem('partner-1', 'mat-partner-del');
    expect(rpcMock).toHaveBeenCalledWith('delete_partner_material_item', {
      p_partner_id: 'partner-1',
      p_item_id: 'mat-partner-del',
    });
    expect(JSON.parse(storageMap.get('epitotudas_materials_items_v1') || '[]')).toHaveLength(0);
  });

  it('saveMaterialsLocal performs CAS delta-merge when a partner adds an item concurrently', async () => {
    const itemA = makeItem({ id: 'mat-a', name: 'A termék', status: 'pending_approval' });
    const itemB = makeItem({ id: 'mat-b', name: 'B új partnertermék', partner_id: 'partner-2' });

    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [itemA],
      updatedAt: '2026-11-15T11:00:00Z',
    });
    await fetchMaterialsFromCloud();

    const adminEditedA = { ...itemA, name: 'A módosítva admin által' };
    writeAppConfigIfUnchangedMock.mockResolvedValueOnce({ conflict: true, updatedAt: null });
    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [itemB, itemA],
      updatedAt: '2026-11-15T11:01:00Z',
    });
    writeAppConfigIfUnchangedMock.mockResolvedValueOnce({
      conflict: false,
      updatedAt: '2026-11-15T11:02:00Z',
    });

    const saved = await saveMaterialsLocal([adminEditedA]);
    expect(saved.map((i) => i.id)).toEqual(['mat-b', 'mat-a']);
    expect(saved.find((i) => i.id === 'mat-a')?.name).toBe('A módosítva admin által');
    expect(writeAppConfigMock).not.toHaveBeenCalled();
  });

  it('setMaterialStatusAsAdmin preserves concurrent partner content edits on CAS conflict', async () => {
    const itemT1 = makeItem({
      id: 'mat-concurrent',
      name: 'Régi név',
      short_description: 'Régi leírás',
      status: 'pending_approval',
    });
    const itemT2PartnerEdited = makeItem({
      id: 'mat-concurrent',
      name: 'Partner frissített neve',
      short_description: 'Partner frissített leírása',
      status: 'pending_approval',
    });

    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [itemT1],
      updatedAt: '2026-11-15T11:10:00Z',
    });
    writeAppConfigIfUnchangedMock.mockResolvedValueOnce({ conflict: true, updatedAt: null });
    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [itemT2PartnerEdited],
      updatedAt: '2026-11-15T11:10:05Z',
    });
    writeAppConfigIfUnchangedMock.mockResolvedValueOnce({
      conflict: false,
      updatedAt: '2026-11-15T11:10:06Z',
    });

    const saved = await setMaterialStatusAsAdmin('mat-concurrent', 'published', null);
    expect(saved[0].status).toBe('published');
    expect(saved[0].rejection_note).toBeNull();
    expect(saved[0].name).toBe('Partner frissített neve');
    expect(saved[0].short_description).toBe('Partner frissített leírása');
  });

  it('saveMaterialsLocal stops after 4 CAS conflicts without blind overwrite or localStorage update', async () => {
    const initial = makeItem({ id: 'mat-x', name: 'Eredeti' });
    localStorage.setItem('epitotudas_materials_items_v1', JSON.stringify([initial]));

    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [initial],
      updatedAt: '2026-11-15T11:20:00Z',
    });
    await fetchMaterialsFromCloud();

    readAppConfigWithVersionMock.mockResolvedValue({
      value: [initial],
      updatedAt: '2026-11-15T11:20:00Z',
    });
    writeAppConfigIfUnchangedMock.mockResolvedValue({ conflict: true, updatedAt: null });

    await expect(saveMaterialsLocal([{ ...initial, name: 'Sikertelen módosítás' }])).rejects.toThrow(
      /CAS konfliktus/i
    );
    expect(writeAppConfigIfUnchangedMock).toHaveBeenCalledTimes(4);
    expect(writeAppConfigMock).not.toHaveBeenCalled();
    expect(getMaterialsLocal()[0].name).toBe('Eredeti');
    readAppConfigWithVersionMock.mockResolvedValue({ value: null, updatedAt: null });
    writeAppConfigIfUnchangedMock.mockResolvedValue({ conflict: false, updatedAt: '2026-11-15T12:00:00Z' });
  });

  it('uploadPartnerMaterialImage and deletePartnerMaterialImages call Edge Function with JWT', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        url: 'https://cdn.epitotudas.hu/materials/p-1/mat-1/img.webp',
        key: 'materials/p-1/mat-1/img.webp',
        size: 12345,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File([new Uint8Array([1, 2, 3])], 'test.webp', { type: 'image/webp' });
    const uploaded = await uploadPartnerMaterialImage('p-1', file, 'mat-1');
    expect(uploaded.url).toBe('https://cdn.epitotudas.hu/materials/p-1/mat-1/img.webp');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        deleted: 1,
        already_missing: 0,
        skipped: 0,
        failed: 0,
        remaining_urls: [],
      }),
    });
    const deleted = await deletePartnerMaterialImages(
      'p-1',
      ['https://cdn.epitotudas.hu/materials/p-1/mat-1/img.webp'],
      'mat-1',
      'mat-1'
    );
    expect(deleted).toEqual({
      deleted: 1,
      already_missing: 0,
      skipped: 0,
      failed: 0,
      remainingUrls: [],
    });
  });

  it('saveMaterialsLocal persists deletion even when localStorage has baseline and cloud fetch has not run', async () => {
    vi.resetModules();
    const freshService = await import('./materialsService');
    const itemA = makeItem({ id: 'mat-del-1', name: 'Törlendő A' });
    const itemB = makeItem({ id: 'mat-keep-2', name: 'Megmaradó B' });
    const itemC = makeItem({ id: 'mat-partner-3', name: 'Partner új C', partner_id: 'partner-2' });

    localStorage.setItem('epitotudas_materials_items_v1', JSON.stringify([itemA, itemB]));
    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [itemC, itemA, itemB],
      updatedAt: '2026-11-22T10:00:00Z',
    });
    writeAppConfigIfUnchangedMock.mockResolvedValueOnce({
      conflict: false,
      updatedAt: '2026-11-22T10:01:00Z',
    });

    const saved = await freshService.saveMaterialsLocal([itemB]);
    expect(saved.map((i) => i.id)).toEqual(['mat-partner-3', 'mat-keep-2']);
    expect(saved.some((i) => i.id === 'mat-del-1')).toBe(false);
  });

  it('empty catalog ([]) is preserved across saveMaterialsLocal, fetchMaterialsFromCloud, and getMaterialsLocal without falling back to DEFAULT_MATERIALS', async () => {
    vi.resetModules();
    const freshService = await import('./materialsService');
    const lastItem = makeItem({ id: 'mat-last', name: 'Utolsó termék' });
    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [lastItem],
      updatedAt: '2026-11-22T11:00:00Z',
    });
    await freshService.fetchMaterialsFromCloud({ isAdmin: true });

    writeAppConfigIfUnchangedMock.mockResolvedValueOnce({
      conflict: false,
      updatedAt: '2026-11-22T11:01:00Z',
    });
    const saved = await freshService.saveMaterialsLocal([]);
    expect(saved).toEqual([]);
    expect(freshService.getMaterialsLocal()).toEqual([]);

    readAppConfigWithVersionMock.mockResolvedValueOnce({
      value: [],
      updatedAt: '2026-11-22T11:01:00Z',
    });
    const refetched = await freshService.fetchMaterialsFromCloud({ isAdmin: true });
    expect(refetched.items).toEqual([]);
    expect(freshService.getMaterialsLocal()).toEqual([]);
  });

  it('deletePartnerMaterialImages throws when Edge Function reports failed R2 deletions', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({
        success: false,
        deleted: 0,
        already_missing: 0,
        skipped: 0,
        failed: 1,
        remaining_urls: [
          'https://cdn.epitotudas.hu/materials/11111111-1111-1111-1111-111111111111/mat-1/img.webp',
        ],
        error: 'Néhány R2 képobjektum törlése sikertelen volt.',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      deletePartnerMaterialImages(
        '11111111-1111-1111-1111-111111111111',
        ['https://cdn.epitotudas.hu/materials/11111111-1111-1111-1111-111111111111/mat-1/img.webp'],
        undefined,
        'mat-1'
      )
    ).rejects.toThrow('Néhány R2 képobjektum törlése sikertelen volt.');
  });

  it('deletePartnerMaterialImages batches >20 URLs and keeps only failed remainingUrls on partial failure', async () => {
    const urls = Array.from(
      { length: 23 },
      (_, i) => `https://cdn.epitotudas.hu/materials/11111111-1111-1111-1111-111111111111/mat-1/img-${i}.webp`
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          deleted: 19,
          already_missing: 1,
          skipped: 0,
          failed: 0,
          remaining_urls: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({
          success: false,
          deleted: 1,
          already_missing: 0,
          skipped: 0,
          failed: 2,
          remaining_urls: urls.slice(21),
          error: 'Részleges R2 hiba',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    try {
      await deletePartnerMaterialImages(
        '11111111-1111-1111-1111-111111111111',
        urls,
        undefined,
        'mat-1'
      );
      expect.unreachable('Should have thrown R2DeletePartialError');
    } catch (err) {
      expect(err).toBeInstanceOf(R2DeletePartialError);
      const r2Err = err as R2DeletePartialError;
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(r2Err.result.deleted).toBe(20);
      expect(r2Err.result.already_missing).toBe(1);
      expect(r2Err.result.failed).toBe(2);
      expect(r2Err.result.remainingUrls).toEqual(urls.slice(21));
    }
  });

  it('deletePartnerMaterialImages reports already_missing as success and preserves skipped URLs in remainingUrls', async () => {
    const draftUrl =
      'https://cdn.epitotudas.hu/materials/11111111-1111-1111-1111-111111111111/draft/old.webp';
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        deleted: 0,
        already_missing: 1,
        skipped: 1,
        failed: 0,
        remaining_urls: [draftUrl],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await deletePartnerMaterialImages(
      '11111111-1111-1111-1111-111111111111',
      [
        'https://cdn.epitotudas.hu/materials/11111111-1111-1111-1111-111111111111/mat-1/missing.webp',
        draftUrl,
      ],
      undefined,
      'mat-1'
    );
    expect(res).toEqual({
      deleted: 0,
      already_missing: 1,
      skipped: 1,
      failed: 0,
      remainingUrls: [draftUrl],
    });
  });

  it('getR2CleanupFailures and saveR2CleanupFailures persist and clear failures via app_configs safely', async () => {
    readAppConfigWithVersionMock.mockResolvedValueOnce({ value: null, updatedAt: null });
    expect(await getR2CleanupFailures()).toEqual([]);

    const failure = {
      itemId: 'mat-r2-1',
      itemName: 'Teszt termék',
      partnerId: '11111111-1111-1111-1111-111111111111',
      imageUrls: ['https://cdn.epitotudas.hu/materials/11111111-1111-1111-1111-111111111111/mat-r2-1/a.webp'],
      error: 'R2 hiba',
      updatedAt: '2026-11-22T16:00:00Z',
    };
    readAppConfigWithVersionMock.mockResolvedValueOnce({ value: null, updatedAt: null });
    writeAppConfigIfUnchangedMock.mockResolvedValueOnce({
      conflict: false,
      updatedAt: '2026-11-22T16:00:01Z',
    });

    const saved = await saveR2CleanupFailures((curr) => [...curr, failure]);
    expect(saved).toEqual([failure]);
    expect(writeAppConfigIfUnchangedMock).toHaveBeenCalledWith(
      '__SYSTEM_CONFIG_R2_CLEANUP_FAILURES__',
      [failure],
      null
    );
  });
});
