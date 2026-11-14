import { supabase } from '../lib/supabase';
import { logAuditAction } from './auditLogService';
import {
  createPartner,
  listPartners,
  type ExtendedPartner,
  type PartnerCategory,
} from './partnerService';
import {
  createInvitation,
  generateEmailTemplate,
  listInvitations,
  sendInvitationEmail,
  type PartnerInvitation,
} from './partnerInvitationService';

const VALID_PARTNER_CATEGORIES: ReadonlySet<PartnerCategory> = new Set([
  'gyarto',
  'kereskedo',
  'ceg',
  'iskola',
  'oktato',
  'tamogato',
]);

function normalizePartnerCategory(category: string): PartnerCategory {
  return VALID_PARTNER_CATEGORIES.has(category as PartnerCategory)
    ? (category as PartnerCategory)
    : 'ceg';
}

export interface PartnerApplication {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string | null;
  website_url?: string | null;
  description?: string | null;
  category: PartnerCategory | string;
  status: 'pending' | 'approved' | 'rejected';
  partner_id?: string | null;
  invitation_id?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface OnboardPartnerResult {
  partner: ExtendedPartner;
  partnerCreated: boolean;
  invitation: PartnerInvitation;
  invitationReused: boolean;
  emailSent: boolean;
  emailError?: string;
  emailTemplate: { subject: string; body: string; inviteLink: string };
}

export interface CreateApplicationPayload {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website_url?: string;
  description?: string;
  category: PartnerCategory;
}

export async function submitPartnerApplication(payload: CreateApplicationPayload): Promise<PartnerApplication> {
  const { data, error } = await supabase
    .from('partner_applications')
    .insert({
      company_name: payload.company_name.trim(),
      contact_name: payload.contact_name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || null,
      website_url: payload.website_url?.trim() || null,
      description: payload.description?.trim() || null,
      category: payload.category,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Hiba történt a partneri jelentkezés beküldésekor.');
  }

  return data as PartnerApplication;
}

export async function listPartnerApplications(
  statusFilter?: 'pending' | 'approved' | 'rejected',
  limit: number = 200
): Promise<PartnerApplication[]> {
  let query = supabase
    .from('partner_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Partner applications fetch notice:', error);
    return [];
  }

  return (data || []) as PartnerApplication[];
}

export async function updateApplicationStatus(
  id: string,
  status: 'approved' | 'rejected',
  metadata?: {
    partner_id?: string | null;
    invitation_id?: string | null;
    rejection_reason?: string | null;
  }
): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const reviewerId = userRes?.user?.id ?? null;

  const fullPayload: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewerId,
    ...(metadata?.partner_id !== undefined ? { partner_id: metadata.partner_id } : {}),
    ...(metadata?.invitation_id !== undefined ? { invitation_id: metadata.invitation_id } : {}),
    ...(metadata?.rejection_reason !== undefined ? { rejection_reason: metadata.rejection_reason } : {}),
  };

  const { error } = await supabase
    .from('partner_applications')
    .update(fullPayload)
    .eq('id', id);

  if (error) {
    // Graceful fallback if the tracking columns migration hasn't been applied yet
    if (error.message?.includes('column') || error.code === 'PGRST204') {
      const { error: fallbackError } = await supabase
        .from('partner_applications')
        .update({ status })
        .eq('id', id);
      if (fallbackError) {
        throw new Error(fallbackError.message || 'A jelentkezési státusz frissítése sikertelen.');
      }
      return;
    }
    throw new Error(error.message || 'A jelentkezési státusz frissítése sikertelen.');
  }
}

/**
 * Automates partner onboarding when an admin approves a partner application:
 * 1. Finds or provisions the partner organization record
 * 2. Reuses an active invitation for the same email or creates a new one
 * 3. Sends the automated invitation email (returning a copyable fallback template on failure)
 * 4. Marks the application approved with partner/invitation tracking links & audit log
 */
export async function approveAndOnboardPartnerApplication(
  app: PartnerApplication
): Promise<OnboardPartnerResult> {
  const normalizedName = app.company_name.trim().toLowerCase();
  const normalizedEmail = app.email.trim().toLowerCase();
  const category = normalizePartnerCategory(app.category);

  // 1. Find existing partner or provision a new verified organization
  const existingPartners = await listPartners(undefined, 200);
  let partner =
    (app.partner_id ? existingPartners.find((p) => p.id === app.partner_id) : undefined) ||
    existingPartners.find((p) => p.name.trim().toLowerCase() === normalizedName);

  let partnerCreated = false;
  if (!partner) {
    partner = await createPartner({
      name: app.company_name.trim(),
      category,
      description: app.description?.trim() || undefined,
      website_url: app.website_url?.trim() || undefined,
      is_verified: true,
    });
    partnerCreated = true;
  }

  // 2. Reuse active non-expired invitation for this email, or create a new one
  const nowMs = Date.now();
  const existingInvitations = await listInvitations(partner.id);
  let invitation = existingInvitations.find(
    (inv) =>
      inv.status === 'active' &&
      inv.email.trim().toLowerCase() === normalizedEmail &&
      new Date(inv.expires_at).getTime() > nowMs
  );

  let invitationReused = false;
  if (invitation) {
    invitationReused = true;
  } else {
    invitation = await createInvitation({
      partnerId: partner.id,
      email: normalizedEmail,
      expiresInDays: 14,
      allowExistingUser: true,
    });
  }

  // 3. Dispatch automated email & build fallback template
  const emailResult = await sendInvitationEmail(invitation, app.contact_name?.trim() || undefined);
  const emailTemplate = generateEmailTemplate(
    partner.name,
    invitation.code,
    invitation.email,
    invitation.expires_at,
    app.contact_name?.trim() || undefined
  );

  // 4. Persist approved status + onboarding links
  await updateApplicationStatus(app.id, 'approved', {
    partner_id: partner.id,
    invitation_id: invitation.id,
  });

  void logAuditAction(
    'PARTNER_ONBOARD_APPROVE',
    'partners',
    `Partner jelentkezés automatizált elfogadása: ${partner.name} (${normalizedEmail}), meghívókód: ${invitation.code}, e-mail: ${emailResult.success ? 'kiküldve' : 'manuális sablon szükséges'}`
  );

  return {
    partner,
    partnerCreated,
    invitation,
    invitationReused,
    emailSent: emailResult.success,
    emailError: emailResult.error,
    emailTemplate,
  };
}
