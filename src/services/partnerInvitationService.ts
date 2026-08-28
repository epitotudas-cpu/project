import { supabase } from '../lib/supabase';

export interface PartnerInvitation {
  id: string;
  partner_id?: string | null;
  organization_name?: string | null;
  organization_category?: string | null;
  email: string;
  code: string;
  created_by?: string | null;
  expires_at: string;
  status: 'active' | 'used' | 'revoked' | 'expired';
  used_at?: string | null;
  used_by_user_id?: string | null;
  created_at: string;
  partner_name?: string;
}

export interface InvitationInfoResult {
  valid: boolean;
  code?: string;
  partner_name?: string;
  partner_category?: string;
  requires_organization_details?: boolean;
  expires_at?: string;
  error?: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  partner_id?: string;
  assigned_role?: string;
  message?: string;
}

export interface CreateInvitationPayload {
  partnerId?: string | null;
  organizationName?: string;
  organizationCategory?: string;
  email: string;
  expiresInDays?: number;
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ET-INV-${rand}`;
}

export async function createInvitation(payload: CreateInvitationPayload): Promise<PartnerInvitation> {
  const cleanEmail = payload.email.trim().toLowerCase();
  const code = generateRandomCode();
  const expiresInDays = payload.expiresInDays || 14;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  let partnerId = payload.partnerId || null;
  if (partnerId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerId);
    if (!isUuid) partnerId = null;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData.session?.user?.id ?? null;

  const { data, error } = await supabase
    .from('partner_invitations')
    .insert({
      partner_id: partnerId,
      organization_name: payload.organizationName?.trim() || null,
      organization_category: payload.organizationCategory || null,
      email: cleanEmail,
      code,
      expires_at: expiresAt,
      created_by: currentUserId,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Hiba történt a meghívó létrehozásakor.');
  }

  return data as PartnerInvitation;
}

export async function sendInvitationEmail(
  invitation: PartnerInvitation,
  contactName?: string
): Promise<{ success: boolean; requires_manual_fallback?: boolean; error?: string }> {
  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://epitotudas.hu';
    const inviteLink = `${baseUrl}/#register?code=${encodeURIComponent(invitation.code)}`;
    const orgName = invitation.partner_name || invitation.organization_name || 'Szervezet';

    const formattedDate = new Date(invitation.expires_at).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const greeting = contactName ? `Kedves ${contactName}!` : 'Tisztelt Partnerünk!';
    const subject = `Meghívás az ÉpítőTudás partneri rendszerébe (${orgName})`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
        <h2 style="color: #d97706; margin-top: 0;">ÉpítőTudás v2 – Meghívás Szervezeti Partnerré</h2>
        <p>${greeting}</p>
        <p>Örömmel értesítjük, hogy meghívást kapott az ÉpítőTudás platformra a(z) <strong>${orgName}</strong> szervezet nevében.</p>

        <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #475569;">Az Ön egyedi meghívókódja:</p>
          <p style="margin: 8px 0 0 0; font-size: 22px; font-weight: bold; font-family: monospace; color: #b45309; letter-spacing: 2px;">${invitation.code}</p>
        </div>

        <p>A regisztráció és a szervezet összekapcsolásához kérjük, kattintson az alábbi gombra:</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${inviteLink}" style="background-color: #f59e0b; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block;">Meghívás Elfogadása & Regisztráció</a>
        </p>

        <p style="font-size: 13px; color: #64748b;">
          A meghívókód kizárólag erről az e-mail címről (<strong>${invitation.email}</strong>) váltható be.<br>
          <strong>Érvényességi idő:</strong> ${formattedDate}
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">ÉpítőTudás v2 – Szakmai Tudásplatform</p>
      </div>
    `;

    const { data, error } = await supabase.functions.invoke('send-invitation-email', {
      body: {
        to: invitation.email,
        subject,
        html: htmlBody,
      },
    });

    if (error) {
      console.warn('Edge function invoke notice:', error);
      return { success: false, requires_manual_fallback: true, error: error.message };
    }

    if (data?.error) {
      return {
        success: false,
        requires_manual_fallback: true,
        error: typeof data.error === 'string' ? data.error : JSON.stringify(data.error),
      };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Email trigger warning:', err);
    return { success: false, requires_manual_fallback: true, error: err.message };
  }
}

export async function getInvitationInfo(inviteCode: string): Promise<InvitationInfoResult> {
  const cleanCode = inviteCode.trim().toUpperCase();

  const { data, error } = await supabase.rpc('get_partner_invitation_info', {
    invite_code: cleanCode,
  });

  if (error) {
    return {
      valid: false,
      error: error.message || 'A meghívókód ellenőrzése sikertelen.',
    };
  }

  return data as InvitationInfoResult;
}

export async function acceptInvitation(
  inviteCode: string,
  orgPayload?: { name?: string; category?: string; description?: string; website_url?: string }
): Promise<AcceptInvitationResult> {
  const cleanCode = inviteCode.trim().toUpperCase();

  const { data, error } = await supabase.rpc('accept_partner_invitation', {
    invite_code: cleanCode,
    org_payload: orgPayload ? (orgPayload as any) : null,
  });

  if (error) {
    throw new Error(error.message || 'A meghívó elfogadása nem sikerült.');
  }

  return data as AcceptInvitationResult;
}

export async function listInvitations(partnerId?: string): Promise<PartnerInvitation[]> {
  let query = supabase
    .from('partner_invitations')
    .select('*, partners(name)')
    .order('created_at', { ascending: false });

  if (partnerId) {
    query = query.eq('partner_id', partnerId);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('Invitations fetch notice:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    partner_name: row.partners?.name || row.organization_name || 'Új Szervezet',
  }));
}

export async function revokeInvitation(invitationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('partner_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) {
    throw new Error(error.message || 'A meghívó visszavonása sikertelen.');
  }

  return true;
}

export function generateEmailTemplate(
  partnerName: string,
  inviteCode: string,
  email: string,
  expiresAtIso?: string,
  contactName?: string
): { subject: string; body: string; inviteLink: string } {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://epitotudas.hu';
  const inviteLink = `${baseUrl}/#register?code=${encodeURIComponent(inviteCode)}`;

  let expiryFormatted = '14 nap';
  if (expiresAtIso) {
    try {
      const d = new Date(expiresAtIso);
      expiryFormatted = d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { }
  }

  const greeting = contactName ? `Kedves ${contactName}!` : 'Tisztelt Kapcsolattartó!';
  const subject = `Meghívás az ÉpítőTudás platformra (${partnerName})`;
  const body = `${greeting}

Szeretnénk meghívni a(z) ${partnerName} szervezetet az ÉpítőTudás platform partneri rendszerébe.

A regisztrációhoz szükséges egyedi meghívókód:
${inviteCode}

A regisztrációt közvetlenül az alábbi hivatkozásra kattintva indíthatja el:
${inviteLink}

Fontos tudnivalók:
- A meghívó kizárólag a(z) ${email} e-mail címre érvényes.
- Amennyiben már rendelkezik ÉpítőTudás fiókkal, kérjük, jelentkezzen be a meghívó elfogadásához.
- A meghívó érvényességi ideje: ${expiryFormatted}.

Üdvözlettel:
ÉpítőTudás Csapat`;

  return { subject, body, inviteLink };
}
