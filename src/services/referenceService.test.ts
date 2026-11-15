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
  getPartnerReferences,
  publishPartnerReference,
  uploadReferenceImageThroughIntent,
} from './referenceService';

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

describe('referenceService (Phase 1 P1 fixes)', () => {
  const partnerId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    const mem = createMemoryStorage();
    vi.stubGlobal('localStorage', mem);
  });

  it('does not resurrect stale localStorage references when DB returns 0 rows', async () => {
    localStorage.setItem(
      'epitotudas_partners_v2',
      JSON.stringify([{ id: partnerId, references: [{ id: 'stale-ref', title: 'Stale', is_published: true }] }])
    );

    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValueOnce({ select });

    const refs = await getPartnerReferences(partnerId, false);
    expect(refs).toEqual([]);
  });

  it('publishPartnerReference throws explicit error when RPC fails', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'A referencia nem publikálható borítókép nélkül.' },
    });

    await expect(publishPartnerReference('ref-123')).rejects.toThrow(/borítókép nélkül/);
  });

  it('uploadReferenceImageThroughIntent throws explicit error instead of uploading dummy bytes on CORS/fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')));

    await expect(
      uploadReferenceImageThroughIntent(partnerId, 'ref-123', 'https://blocked.example.com/photo.jpg')
    ).rejects.toThrow(/CORS|hálózati hiba/);

    expect(rpcMock).not.toHaveBeenCalled();
  });
});
