import { describe, it, expect, vi, beforeEach } from 'vitest';

const { rpcMock, invokeMock, getSessionMock, fromMock, logAuditActionMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  invokeMock: vi.fn(),
  getSessionMock: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'admin-1' } } } }),
  fromMock: vi.fn(),
  logAuditActionMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
    auth: {
      getSession: getSessionMock,
    },
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock('./auditLogService', () => ({
  logAuditAction: logAuditActionMock,
}));

import { createInvitation, sendInvitationEmail, getInvitationInfo } from './partnerInvitationService';

describe('partnerInvitationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid email addresses in createInvitation', async () => {
    await expect(createInvitation({ email: 'nem-email' })).rejects.toThrow(
      'érvényes e-mail-címet'
    );
  });

  it('creates invitation via create_partner_invitation RPC when email is not yet registered', async () => {
    rpcMock.mockImplementation((fnName: string) => {
      if (fnName === 'check_email_exists') {
        return Promise.resolve({ data: false, error: null });
      }
      if (fnName === 'create_partner_invitation') {
        return Promise.resolve({
          data: {
            id: 'inv-1',
            email: 'uj@partner.hu',
            code: 'ET-INV-12345',
            status: 'active',
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const inv = await createInvitation({
      email: 'UJ@PARTNER.HU',
      organizationName: 'Új Partner Kft.',
    });

    expect(inv.code).toBe('ET-INV-12345');
    expect(rpcMock).toHaveBeenCalledWith(
      'create_partner_invitation',
      expect.objectContaining({ p_email: 'uj@partner.hu' })
    );
  });

  it('validates invitation info via get_invitation_by_code RPC', async () => {
    rpcMock.mockResolvedValue({
      data: { valid: true, organization_name: 'Minta Kft.', email: 'a@b.hu' },
      error: null,
    });

    const info = await getInvitationInfo('et-inv-12345');
    expect(info.valid).toBe(true);
    expect(rpcMock).toHaveBeenCalledWith('get_partner_invitation_info', {
      invite_code: 'ET-INV-12345',
    });
  });

  it('returns error details when sendInvitationEmail Edge Function fails', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'RESEND_API_KEY missing' },
    });

    const res = await sendInvitationEmail(
      {
        id: 'inv-1',
        partner_id: null,
        email: 'a@b.hu',
        code: 'ET-INV-12345',
        status: 'active',
        expires_at: '2026-12-01T00:00:00Z',
        created_at: '2026-11-14T00:00:00Z',
      },
      'Teszt Név'
    );

    expect(res.success).toBe(false);
    expect(res.error).toContain('RESEND_API_KEY missing');
  });
});
