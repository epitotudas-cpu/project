import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  fromMock,
  getUserMock,
  logAuditActionMock,
  listPartnersMock,
  createPartnerMock,
  listInvitationsMock,
  createInvitationMock,
  sendInvitationEmailMock,
  generateEmailTemplateMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } }),
  logAuditActionMock: vi.fn().mockResolvedValue(undefined),
  listPartnersMock: vi.fn(),
  createPartnerMock: vi.fn(),
  listInvitationsMock: vi.fn(),
  createInvitationMock: vi.fn(),
  sendInvitationEmailMock: vi.fn(),
  generateEmailTemplateMock: vi.fn(() => ({
    subject: 'Meghívó',
    body: 'Meghívó szöveg',
    inviteLink: 'https://epitotudas.hu/#register?code=ET-INV-123456',
  })),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: { getUser: getUserMock },
  },
}));

vi.mock('./auditLogService', () => ({
  logAuditAction: logAuditActionMock,
}));

vi.mock('./partnerService', () => ({
  listPartners: listPartnersMock,
  createPartner: createPartnerMock,
}));

vi.mock('./partnerInvitationService', () => ({
  listInvitations: listInvitationsMock,
  createInvitation: createInvitationMock,
  sendInvitationEmail: sendInvitationEmailMock,
  generateEmailTemplate: generateEmailTemplateMock,
}));

import {
  submitPartnerApplication,
  listPartnerApplications,
  updateApplicationStatus,
  approveAndOnboardPartnerApplication,
} from './partnerApplicationService';

describe('partnerApplicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
  });

  it('submits partner application with trimmed/lowercased email and pending status', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'app-1',
        company_name: 'Minta Kft.',
        contact_name: 'Nagy Béla',
        email: 'bela@minta.hu',
        category: 'gyarto',
        status: 'pending',
      },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    const res = await submitPartnerApplication({
      company_name: '  Minta Kft. ',
      contact_name: ' Nagy Béla ',
      email: ' BELA@MINTA.HU ',
      category: 'gyarto',
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        company_name: 'Minta Kft.',
        contact_name: 'Nagy Béla',
        email: 'bela@minta.hu',
        status: 'pending',
      })
    );
    expect(res.status).toBe('pending');
  });

  it('lists applications with status filter and limit', async () => {
    const eq = vi.fn().mockResolvedValue({ data: [{ id: 'app-1', status: 'pending' }], error: null });
    const limit = vi.fn().mockReturnValue({ eq });
    const order = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select });

    const res = await listPartnerApplications('pending', 50);
    expect(limit).toHaveBeenCalledWith(50);
    expect(eq).toHaveBeenCalledWith('status', 'pending');
    expect(res).toHaveLength(1);
  });

  it('throws when updateApplicationStatus fails', async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: 'forbidden' } });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await expect(updateApplicationStatus('app-1', 'approved')).rejects.toThrow('forbidden');
  });

  it('provisions partner, creates invitation, sends email, and marks application approved', async () => {
    listPartnersMock.mockResolvedValueOnce([]);
    createPartnerMock.mockResolvedValueOnce({
      id: 'partner-new',
      name: 'Új Építő Kft.',
      category: 'gyarto',
    });
    listInvitationsMock.mockResolvedValueOnce([]);
    createInvitationMock.mockResolvedValueOnce({
      id: 'inv-1',
      partner_id: 'partner-new',
      email: 'iroda@ujepito.hu',
      code: 'ET-INV-ABC123',
      expires_at: '2026-12-01T00:00:00Z',
      status: 'active',
    });
    sendInvitationEmailMock.mockResolvedValueOnce({ success: true });

    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    const result = await approveAndOnboardPartnerApplication({
      id: 'app-new',
      company_name: 'Új Építő Kft.',
      contact_name: 'Kiss Péter',
      email: 'iroda@ujepito.hu',
      category: 'gyarto',
      status: 'pending',
      created_at: '2026-11-14T08:00:00Z',
    });

    expect(result.partnerCreated).toBe(true);
    expect(result.invitationReused).toBe(false);
    expect(result.emailSent).toBe(true);
    expect(createInvitationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        partnerId: 'partner-new',
        email: 'iroda@ujepito.hu',
        allowExistingUser: true,
      })
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        partner_id: 'partner-new',
        invitation_id: 'inv-1',
      })
    );
    expect(logAuditActionMock).toHaveBeenCalledWith(
      'PARTNER_ONBOARD_APPROVE',
      'partners',
      expect.stringContaining('ET-INV-ABC123')
    );
  });

  it('reuses existing partner and active invitation and returns fallback template when email fails', async () => {
    listPartnersMock.mockResolvedValueOnce([
      { id: 'partner-existing', name: 'Már Létező Kft.', category: 'ceg' },
    ]);
    listInvitationsMock.mockResolvedValueOnce([
      {
        id: 'inv-existing',
        partner_id: 'partner-existing',
        email: 'kapcsolat@letezo.hu',
        code: 'ET-INV-REUSE1',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      },
    ]);
    sendInvitationEmailMock.mockResolvedValueOnce({
      success: false,
      requires_manual_fallback: true,
      error: 'RESEND_API_KEY missing',
    });

    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    const result = await approveAndOnboardPartnerApplication({
      id: 'app-2',
      company_name: 'már létező kft.',
      contact_name: 'Tóth Anna',
      email: 'kapcsolat@letezo.hu',
      category: 'ceg',
      status: 'pending',
      created_at: '2026-11-14T08:00:00Z',
    });

    expect(result.partnerCreated).toBe(false);
    expect(result.invitationReused).toBe(true);
    expect(result.emailSent).toBe(false);
    expect(result.emailError).toBe('RESEND_API_KEY missing');
    expect(result.emailTemplate.inviteLink).toContain('ET-INV-');
    expect(createPartnerMock).not.toHaveBeenCalled();
    expect(createInvitationMock).not.toHaveBeenCalled();
  });
});
