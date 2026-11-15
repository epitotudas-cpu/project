import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  readAppConfigMock,
  writeAppConfigMock,
  readAppConfigWithVersionMock,
  writeAppConfigIfUnchangedMock,
  rpcMock,
} = vi.hoisted(() => ({
  readAppConfigMock: vi.fn().mockResolvedValue(null),
  writeAppConfigMock: vi.fn().mockResolvedValue(undefined),
  readAppConfigWithVersionMock: vi.fn().mockResolvedValue({ value: null, updatedAt: null }),
  writeAppConfigIfUnchangedMock: vi.fn().mockResolvedValue({ conflict: false, updatedAt: '2026-11-15T12:00:00Z' }),
  rpcMock: vi.fn(),
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
  },
}));

import {
  fetchMaterialsFromCloud,
  saveMaterialsLocal,
  setMaterialStatusAsAdmin,
  upsertPartnerMaterialItem,
  deletePartnerMaterialItem,
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

  it('upsertPartnerMaterialItem calls RPC and updates localStorage only on success', async () => {
    const savedItem = makeItem({ id: 'mat-partner-abc', status: 'pending_approval' });
    rpcMock.mockResolvedValueOnce({ data: savedItem, error: null });

    const result = await upsertPartnerMaterialItem('partner-1', {
      name: 'Alap Termék',
      short_description: 'Rövid leírás',
      status: 'pending_approval',
    });

    expect(rpcMock).toHaveBeenCalledWith('upsert_partner_material_item', {
      p_partner_id: 'partner-1',
      p_item: expect.objectContaining({ status: 'pending_approval' }),
    });
    expect(result.id).toBe('mat-partner-abc');
    expect(getMaterialsLocal().some((i) => i.id === 'mat-partner-abc')).toBe(true);

    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Jóváhagyott vagy közzétett termék partner által nem módosítható.' },
    });
    await expect(
      upsertPartnerMaterialItem('partner-1', {
        id: 'mat-partner-abc',
        name: 'Módosított',
        short_description: 'Rövid',
        status: 'draft',
      })
    ).rejects.toThrow('Jóváhagyott vagy közzétett termék partner által nem módosítható.');
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

    readAppConfigWithVersionMock.mockResolvedValue({
      value: [initial],
      updatedAt: '2026-11-15T11:20:00Z',
    });
    await fetchMaterialsFromCloud();

    writeAppConfigIfUnchangedMock.mockResolvedValue({ conflict: true, updatedAt: null });

    await expect(saveMaterialsLocal([{ ...initial, name: 'Sikertelen módosítás' }])).rejects.toThrow(
      /CAS konfliktus/i
    );
    expect(writeAppConfigIfUnchangedMock).toHaveBeenCalledTimes(4);
    expect(writeAppConfigMock).not.toHaveBeenCalled();
    expect(getMaterialsLocal()[0].name).toBe('Eredeti');
  });
});
