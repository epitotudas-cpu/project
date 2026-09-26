import { supabase, type Profile } from '../lib/supabase';

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.role ?? null;
}

export async function countUsers(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return false;

  try {
    const { count: profileCount, error: profileErr } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .ilike('email', cleanEmail);

    if (!profileErr && typeof profileCount === 'number' && profileCount > 0) {
      return true;
    }

    const { count: appCount, error: appErr } = await supabase
      .from('partner_applications')
      .select('id', { count: 'exact', head: true })
      .ilike('email', cleanEmail);

    if (!appErr && typeof appCount === 'number' && appCount > 0) {
      return true;
    }

    const { count: partnerCount, error: partnerErr } = await supabase
      .from('partners')
      .select('id', { count: 'exact', head: true })
      .ilike('contact_email', cleanEmail);

    if (!partnerErr && typeof partnerCount === 'number' && partnerCount > 0) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function updateProfile(userId: string, payload: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data;
}

import { logAuditAction } from './auditLogService';

export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
  let success = false;
  if (!error) {
    success = true;
  } else {
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;
    success = true;
  }
  if (success) {
    await logAuditAction(
      'USER_DELETE',
      'users',
      `Felhasználó fiókja törölve (ID: ${userId})`
    );
  }
  return true;
}

export async function getUserType(user: any): Promise<'tanulo' | 'szakember'> {
  if (!user) return 'tanulo';
  const metaType = user.user_metadata?.user_type;
  if (metaType === 'szakember') return 'szakember';
  return 'tanulo';
}

export async function updateProfileRole(userId: string, newRole: string): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    throw new Error('A bejelentkezési munkamenet lejárt. Kérjük, jelentkezz be újra az Admin felület használatához!');
  }

  const { error } = await supabase.rpc('update_user_platform_role', {
    target_user_id: userId,
    new_role: newRole,
  });

  if (error) {
    console.warn('update_user_platform_role RPC error, attempting direct update fallback:', error);
    if (error.message?.includes('Refresh Token') || error.message?.includes('JWT') || error.status === 400) {
      console.warn('Potential stale auth session detected:', error.message);
    }

    const { data: updatedRows, error: directErr } = await supabase
      .from('profiles')
      .update({ role: newRole as any })
      .eq('id', userId)
      .select('id, role');

    if (directErr || !updatedRows || updatedRows.length === 0) {
      if (error?.message?.includes('Refresh Token') || directErr?.message?.includes('Refresh Token')) {
        throw new Error('A bejelentkezési munkamenet lejárt (Invalid Refresh Token). Kérjük, jelentkezz be újra!');
      }

      throw new Error(
        error?.message ||
        directErr?.message ||
        'A szerepkör módosítása nem sikerült (hiányzó RPC vagy RLS jogosultság az adatbázisban).'
      );
    }
  }

  await logAuditAction(
    'USER_ROLE_UPDATE',
    'users',
    `Felhasználó (ID: ${userId}) szerepköre módosítva: "${newRole}"`
  );

  return true;
}