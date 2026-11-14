import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  writeAppConfigMock,
  readAppConfigMock,
  invokeMock,
  rpcMock,
  getUserMock,
  fromMock,
} = vi.hoisted(() => ({
  writeAppConfigMock: vi.fn().mockResolvedValue(undefined),
  readAppConfigMock: vi.fn().mockResolvedValue(null),
  invokeMock: vi.fn(),
  rpcMock: vi.fn(),
  getUserMock: vi.fn(),
  fromMock: vi.fn(() => ({
    upsert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
    select: vi.fn(() => ({
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  })),
}));

vi.mock('./appConfigService', () => ({
  writeAppConfig: writeAppConfigMock,
  readAppConfig: readAppConfigMock,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    functions: { invoke: invokeMock },
    rpc: rpcMock,
    auth: { getUser: getUserMock },
  },
}));

import {
  interpolateTemplate,
  getContracts,
  saveContracts,
  acceptContractByPartner,
  updateContractStatus,
} from './contractService';

describe('contractService', () => {
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
    vi.stubGlobal('navigator', { userAgent: 'VitestBrowser/1.0' });
  });

  it('interpolates contract template placeholders', () => {
    const out = interpolateTemplate('Partner: {{partner_nev}}, Díj: {{osszeg}} Ft', {
      szerzodes_szam: 'ET-2026-001',
      partner_nev: 'Minta Kft.',
      kampany_cim: 'Teszt Kampány',
      reklamhely: 'Oldalsáv',
      kezdes: '2026-11-15',
      vege: '2026-12-15',
      osszeg: 99000,
    });
    expect(out).toMatch(/^Partner: Minta Kft\., Díj: 99[\s\u00A0]000 Ft$/);
  });

  it('rejects invalid signer name or email before calling server', async () => {
    await expect(acceptContractByPartner('ctr-1', 'A', 'janos@minta.hu')).rejects.toThrow();
    await expect(acceptContractByPartner('ctr-1', 'Kovács János', 'hibas-email')).rejects.toThrow();
    expect(invokeMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('accepts a contract via accept-contract Edge Function with server-verified audit log', async () => {
    await saveContracts([
      {
        id: 'ctr-1',
        contractNumber: 'ET-2026-001',
        partnerId: 'p-1',
        partnerName: 'Minta Kft.',
        amount: 99000,
        status: 'sent',
        content: 'Szerződés szöveg',
        versions: [],
        createdAt: '2026-11-14T08:00:00Z',
        updatedAt: '2026-11-14T08:00:00Z',
      } as never,
    ]);

    invokeMock.mockResolvedValueOnce({
      data: {
        contract: {
          id: 'ctr-1',
          status: 'accepted',
          acceptanceLog: {
            acceptedBy: 'Kovács János',
            email: 'janos@minta.hu',
            acceptedAt: '2026-11-14T10:00:00Z',
            ipAddress: '203.0.113.42',
            userId: 'user-uuid-123',
            contentSha256: 'abc123sha256',
            serverVerified: true,
          },
          versions: [
            {
              versionNumber: 1,
              createdAt: '2026-11-14T10:00:00Z',
              amount: 99000,
              content: 'Szerződés szöveg',
              changeNote: 'Szerződés elfogadva',
            },
          ],
        },
      },
      error: null,
    });

    const accepted = await acceptContractByPartner('ctr-1', 'Kovács János', 'janos@minta.hu');
    expect(invokeMock).toHaveBeenCalledWith('accept-contract', expect.objectContaining({
      body: expect.objectContaining({
        contractId: 'ctr-1',
        personName: 'Kovács János',
        personEmail: 'janos@minta.hu',
      }),
    }));
    expect(accepted.status).toBe('accepted');
    expect(accepted.acceptanceLog?.acceptedBy).toBe('Kovács János');
    expect(accepted.acceptanceLog?.email).toBe('janos@minta.hu');
    expect(accepted.acceptanceLog?.ipAddress).toBe('203.0.113.42');
    expect(accepted.acceptanceLog?.serverVerified).toBe(true);
    expect(accepted.acceptanceLog?.contentSha256).toBe('abc123sha256');
    expect(accepted.versions).toHaveLength(1);
  });

  it('falls back to accept_partner_contract RPC when Edge Function is unavailable', async () => {
    await saveContracts([
      {
        id: 'ctr-rpc',
        contractNumber: 'ET-2026-002',
        partnerId: 'p-1',
        partnerName: 'Minta Kft.',
        amount: 55000,
        status: 'sent',
        content: 'RPC Szerződés',
        versions: [],
        createdAt: '2026-11-14T08:00:00Z',
        updatedAt: '2026-11-14T08:00:00Z',
      } as never,
    ]);

    invokeMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Failed to send a request to the Edge Function' },
    });
    rpcMock.mockResolvedValueOnce({
      data: {
        id: 'ctr-rpc',
        status: 'accepted',
        acceptanceLog: {
          acceptedBy: 'Nagy Éva',
          email: 'eva@minta.hu',
          acceptedAt: '2026-11-14T10:05:00Z',
          ipAddress: 'rpc-verified',
          userId: 'user-uuid-456',
          serverVerified: true,
        },
        versions: [],
      },
      error: null,
    });

    const accepted = await acceptContractByPartner('ctr-rpc', 'Nagy Éva', 'eva@minta.hu');
    expect(rpcMock).toHaveBeenCalledWith('accept_partner_contract', expect.objectContaining({
      p_contract_id: 'ctr-rpc',
      p_accepted_by: 'Nagy Éva',
      p_accepted_email: 'eva@minta.hu',
    }));
    expect(accepted.status).toBe('accepted');
    expect(accepted.acceptanceLog?.serverVerified).toBe(true);
  });

  it('updates contract status in storage', async () => {
    await saveContracts([
      {
        id: 'ctr-2',
        status: 'draft',
        amount: 49000,
        content: 'Teszt',
        versions: [],
      } as never,
    ]);

    updateContractStatus('ctr-2', 'declined');
    const updated = getContracts().find((c) => c.id === 'ctr-2');
    expect(updated?.status).toBe('declined');
  });
});
