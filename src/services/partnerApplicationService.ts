import { supabase } from '../lib/supabase';
import type { PartnerCategory } from './partnerService';

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
  created_at: string;
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

export async function listPartnerApplications(statusFilter?: 'pending' | 'approved' | 'rejected'): Promise<PartnerApplication[]> {
  let query = supabase.from('partner_applications').select('*').order('created_at', { ascending: false });

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

export async function updateApplicationStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase
    .from('partner_applications')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'A jelentkezési státusz frissítése sikertelen.');
  }
}
