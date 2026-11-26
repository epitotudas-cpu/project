import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import {
  DEFAULT_KNOWLEDGE_ITEMS,
  KnowledgeHubConflictError,
  loadKnowledgeItemsForAdmin,
  saveKnowledgeItemsToCloud,
  type EducationalContentItem,
} from './knowledgeHubService';

const STORAGE_KEY = 'epitotudas_knowledge_hub_items_v1';
const CLOUD_KEY = '__SYSTEM_CONFIG_KNOWLEDGE_HUB_ITEMS__';
const LEGACY_ROW_ID = '00000000-0000-0000-0000-000000000023';

function makeItem(id: string, title = `Cím ${id}`): EducationalContentItem {
  return {
    ...DEFAULT_KNOWLEDGE_ITEMS[0],
    id,
    title,
    slug: `slug-${id}`,
  };
}

describe('knowledgeHubService (admin load & CAS save)', () => {
  let store: Record<string, string>;
  let dispatchedEvents: string[];
  let dispatchEventMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = {};
    dispatchedEvents = [];
    dispatchEventMock = vi.fn((event: Event) => {
      dispatchedEvents.push(event.type);
      return true;
    });

    const localStorageMock = {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('window', {
      localStorage: localStorageMock,
      dispatchEvent: dispatchEventMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('loadKnowledgeItemsForAdmin', () => {
    it('returns cloud items, updatedAt token, isNewRecord=false and updates localStorage when app_configs row exists', async () => {
      const cloudItems = [makeItem('kh-cloud-1', 'Felhős Tartalom')];
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { value: cloudItems, updated_at: '2026-11-26T07:00:00.000Z' },
        error: null,
      });
      const eq = vi.fn().mockReturnValue({ maybeSingle });
      const select = vi.fn().mockReturnValue({ eq });
      fromMock.mockReturnValue({ select });

      const result = await loadKnowledgeItemsForAdmin();

      expect(fromMock).toHaveBeenCalledTimes(1);
      expect(fromMock).toHaveBeenCalledWith('app_configs');
      expect(select).toHaveBeenCalledWith('value, updated_at');
      expect(eq).toHaveBeenCalledWith('key', CLOUD_KEY);
      expect(result).toEqual({
        items: cloudItems,
        updatedAt: '2026-11-26T07:00:00.000Z',
        isNewRecord: false,
      });
      expect(JSON.parse(store[STORAGE_KEY])).toEqual(cloudItems);
    });

    it('falls back to valid legacy categories row when app_configs row is missing', async () => {
      const legacyItems = [makeItem('kh-legacy-1', 'Örökölt Tartalom')];
      const appConfigsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const legacyMaybeSingle = vi.fn().mockResolvedValue({
        data: { description: JSON.stringify(legacyItems) },
        error: null,
      });
      const legacyEq = vi.fn().mockReturnValue({ maybeSingle: legacyMaybeSingle });

      fromMock.mockImplementation((table: string) => {
        if (table === 'app_configs') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: appConfigsMaybeSingle }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({ eq: legacyEq }),
        };
      });

      const result = await loadKnowledgeItemsForAdmin();

      expect(fromMock).toHaveBeenCalledWith('app_configs');
      expect(fromMock).toHaveBeenCalledWith('categories');
      expect(legacyEq).toHaveBeenCalledWith('id', LEGACY_ROW_ID);
      expect(result).toEqual({
        items: legacyItems,
        updatedAt: null,
        isNewRecord: true,
      });
      expect(JSON.parse(store[STORAGE_KEY])).toEqual(legacyItems);
    });

    it('returns DEFAULT_KNOWLEDGE_ITEMS with updatedAt=null and isNewRecord=true only when both rows are missing', async () => {
      const appConfigsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const legacyMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

      fromMock.mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: table === 'app_configs' ? appConfigsMaybeSingle : legacyMaybeSingle,
          }),
        }),
      }));

      const result = await loadKnowledgeItemsForAdmin();

      expect(result.items).toEqual(DEFAULT_KNOWLEDGE_ITEMS);
      expect(result.updatedAt).toBeNull();
      expect(result.isNewRecord).toBe(true);
      expect(JSON.parse(store[STORAGE_KEY])).toEqual(DEFAULT_KNOWLEDGE_ITEMS);
    });

    it('throws on app_configs query error without falling back to legacy or overwriting localStorage', async () => {
      store[STORAGE_KEY] = JSON.stringify([makeItem('kh-cached', 'Meglévő Cache')]);

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'RLS permission denied' },
            }),
          }),
        }),
      });

      await expect(loadKnowledgeItemsForAdmin()).rejects.toThrow('RLS permission denied');
      expect(fromMock).toHaveBeenCalledTimes(1);
      expect(fromMock).not.toHaveBeenCalledWith('categories');
      expect(JSON.parse(store[STORAGE_KEY])[0].id).toBe('kh-cached');
    });

    it('throws when app_configs.value is not an array and does not overwrite localStorage', async () => {
      store[STORAGE_KEY] = JSON.stringify([makeItem('kh-cached', 'Meglévő Cache')]);

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { value: { broken: true }, updated_at: '2026-11-26T07:00:00.000Z' },
              error: null,
            }),
          }),
        }),
      });

      await expect(loadKnowledgeItemsForAdmin()).rejects.toThrow('formátuma érvénytelen');
      expect(JSON.parse(store[STORAGE_KEY])[0].id).toBe('kh-cached');
    });

    it('throws on legacy categories query error instead of treating it as missing', async () => {
      store[STORAGE_KEY] = JSON.stringify([makeItem('kh-cached', 'Meglévő Cache')]);

      const appConfigsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const legacyMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'categories network timeout' },
      });

      fromMock.mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: table === 'app_configs' ? appConfigsMaybeSingle : legacyMaybeSingle,
          }),
        }),
      }));

      await expect(loadKnowledgeItemsForAdmin()).rejects.toThrow('categories network timeout');
      expect(JSON.parse(store[STORAGE_KEY])[0].id).toBe('kh-cached');
    });

    it('throws on malformed legacy JSON instead of falling back to defaults', async () => {
      store[STORAGE_KEY] = JSON.stringify([makeItem('kh-cached', 'Meglévő Cache')]);

      const appConfigsMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const legacyMaybeSingle = vi.fn().mockResolvedValue({
        data: { description: '{not-valid-json' },
        error: null,
      });

      fromMock.mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: table === 'app_configs' ? appConfigsMaybeSingle : legacyMaybeSingle,
          }),
        }),
      }));

      await expect(loadKnowledgeItemsForAdmin()).rejects.toThrow('örökölt konfigurációja sérült');
      expect(JSON.parse(store[STORAGE_KEY])[0].id).toBe('kh-cached');
    });
  });

  describe('saveKnowledgeItemsToCloud', () => {
    it('performs conditional CAS update, updates localStorage, dispatches event, and returns new updatedAt', async () => {
      const nextItems = [makeItem('kh-1', 'Frissített Tartalom')];
      const expectedUpdatedAt = '2026-11-26T06:00:00.000Z';
      const newUpdatedAt = '2026-11-26T07:10:00.000Z';

      const select = vi.fn().mockResolvedValue({
        data: [{ updated_at: newUpdatedAt }],
        error: null,
      });
      const eqUpdatedAt = vi.fn().mockReturnValue({ select });
      const eqKey = vi.fn().mockReturnValue({ eq: eqUpdatedAt });
      const update = vi.fn().mockReturnValue({ eq: eqKey });
      const upsert = vi.fn();

      fromMock.mockReturnValue({ update, upsert });

      const result = await saveKnowledgeItemsToCloud(nextItems, expectedUpdatedAt);

      expect(fromMock).toHaveBeenCalledWith('app_configs');
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          value: nextItems,
          updated_at: expect.any(String),
        })
      );
      expect(eqKey).toHaveBeenCalledWith('key', CLOUD_KEY);
      expect(eqUpdatedAt).toHaveBeenCalledWith('updated_at', expectedUpdatedAt);
      expect(upsert).not.toHaveBeenCalled();
      expect(result).toEqual({ items: nextItems, updatedAt: newUpdatedAt });
      expect(JSON.parse(store[STORAGE_KEY])).toEqual(nextItems);
      expect(dispatchedEvents).toEqual(['knowledge-hub-updated']);
    });

    it('throws KnowledgeHubConflictError on CAS conflict without retrying, without writeAppConfig fallback, and without touching localStorage or events', async () => {
      const originalCached = [makeItem('kh-orig', 'Eredeti')];
      store[STORAGE_KEY] = JSON.stringify(originalCached);
      const attemptItems = [makeItem('kh-stale', 'Elavult Kliens')];

      const select = vi.fn().mockResolvedValue({ data: [], error: null });
      const eqUpdatedAt = vi.fn().mockReturnValue({ select });
      const eqKey = vi.fn().mockReturnValue({ eq: eqUpdatedAt });
      const update = vi.fn().mockReturnValue({ eq: eqKey });
      const upsert = vi.fn();
      const insert = vi.fn();

      fromMock.mockReturnValue({ update, upsert, insert });

      await expect(
        saveKnowledgeItemsToCloud(attemptItems, '2026-11-26T06:00:00.000Z')
      ).rejects.toBeInstanceOf(KnowledgeHubConflictError);

      expect(update).toHaveBeenCalledTimes(1);
      expect(upsert).not.toHaveBeenCalled();
      expect(insert).not.toHaveBeenCalled();
      expect(JSON.parse(store[STORAGE_KEY])).toEqual(originalCached);
      expect(dispatchedEvents).toEqual([]);
    });

    it('propagates network/Supabase write error without updating localStorage or dispatching event', async () => {
      const originalCached = [makeItem('kh-orig', 'Eredeti')];
      store[STORAGE_KEY] = JSON.stringify(originalCached);

      const select = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'network connection reset' },
      });
      const eqUpdatedAt = vi.fn().mockReturnValue({ select });
      const eqKey = vi.fn().mockReturnValue({ eq: eqUpdatedAt });
      const update = vi.fn().mockReturnValue({ eq: eqKey });
      const upsert = vi.fn();

      fromMock.mockReturnValue({ update, upsert });

      await expect(
        saveKnowledgeItemsToCloud([makeItem('kh-fail')], '2026-11-26T06:00:00.000Z')
      ).rejects.toEqual({ message: 'network connection reset' });

      expect(upsert).not.toHaveBeenCalled();
      expect(JSON.parse(store[STORAGE_KEY])).toEqual(originalCached);
      expect(dispatchedEvents).toEqual([]);
    });

    it('inserts a new record when expectedUpdatedAt is null and updates cache/event on success', async () => {
      const newItems = [makeItem('kh-new', 'Első Felhős Rekord')];
      const createdAt = '2026-11-26T07:15:00.000Z';

      const select = vi.fn().mockResolvedValue({
        data: [{ updated_at: createdAt }],
        error: null,
      });
      const insert = vi.fn().mockReturnValue({ select });
      const update = vi.fn();
      const upsert = vi.fn();

      fromMock.mockReturnValue({ insert, update, upsert });

      const result = await saveKnowledgeItemsToCloud(newItems, null);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          key: CLOUD_KEY,
          value: newItems,
          updated_at: expect.any(String),
        })
      );
      expect(update).not.toHaveBeenCalled();
      expect(upsert).not.toHaveBeenCalled();
      expect(result).toEqual({ items: newItems, updatedAt: createdAt });
      expect(JSON.parse(store[STORAGE_KEY])).toEqual(newItems);
      expect(dispatchedEvents).toEqual(['knowledge-hub-updated']);
    });

    it('treats concurrent 23505 insert conflict when expectedUpdatedAt is null as KnowledgeHubConflictError without touching cache or events', async () => {
      const originalCached = [makeItem('kh-orig', 'Eredeti')];
      store[STORAGE_KEY] = JSON.stringify(originalCached);

      const select = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });
      const insert = vi.fn().mockReturnValue({ select });
      const upsert = vi.fn();

      fromMock.mockReturnValue({ insert, upsert });

      await expect(saveKnowledgeItemsToCloud([makeItem('kh-race')], null)).rejects.toBeInstanceOf(
        KnowledgeHubConflictError
      );

      expect(insert).toHaveBeenCalledTimes(1);
      expect(upsert).not.toHaveBeenCalled();
      expect(JSON.parse(store[STORAGE_KEY])).toEqual(originalCached);
      expect(dispatchedEvents).toEqual([]);
    });
  });
});
