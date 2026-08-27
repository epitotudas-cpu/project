import { supabase } from '../lib/supabase';

export interface PartnerInvitation {
  id: string;
  partner_id: string;
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
  expires_at?: string;
  error?: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  partner_id?: string;
  assigned_role?: string;
  message?: string;
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ET-INV-${rand}`;
}

export async function createInvitation(
  partnerId: string,
  email: string,
  expiresInDays: number = 14
): Promise<PartnerInvitation> {
  const cleanEmail = email.trim().toLowerCase();
  const code = generateRandomCode();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  // Safeguard: Ensure partnerId is a valid PostgreSQL UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerId);
  let targetPartnerId = partnerId;

  if (!isUuid) {
    const { data: dbPartners } = await supabase.from('partners').select('id').limit(1);
    if (dbPartners && dbPartners.length > 0) {
      targetPartnerId = dbPartners[0].id;
    } else {
      throw new Error('Érvénytelen partner azonosító (UUID). Kérjük, válasszon létező partner szervezetet.');
    }
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const currentUserId = sessionData.session?.user?.id ?? null;

  const { data, error } = await supabase
    .from('partner_invitations')
    .insert({
      partner_id: targetPartnerId,
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

export async function acceptInvitation(inviteCode: string): Promise<AcceptInvitationResult> {
  const cleanCode = inviteCode.trim().toUpperCase();

  const { data, error } = await supabase.rpc('accept_partner_invitation', {
    invite_code: cleanCode,
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
    partner_name: row.partners?.name || 'Ismeretlen szervezet',
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
  expiresAtIso?: string
): { subject: string; body: string; inviteLink: string } {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://epitotudas.hu';
  const inviteLink = `${baseUrl}/#register?code=${encodeURIComponent(inviteCode)}`;

  let expiryFormatted = '14 nap';
  if (expiresAtIso) {
    try {
      const d = new Date(expiresAtIso);
      expiryFormatted = d.toLocaleDateString('hu-HU');
    } catch {}
  }

  const subject = `Meghívó az ÉpítőTudás platformra (${partnerName})`;
  const body = `Tisztelt Kapcsolattartó!

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
