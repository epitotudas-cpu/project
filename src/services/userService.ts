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

export async function deleteUser(userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
  if (!error) return true;

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (profileError) throw profileError;
  return true;
}

export async function getUserType(user: any): Promise<'tanulo' | 'szakember'> {
  if (!user) return 'tanulo';
  const metaType = user.user_metadata?.user_type;
  if (metaType === 'szakember') return 'szakember';
  return 'tanulo';
}

export async function updateProfileRole(userId: string, newRole: string): Promise<boolean> {
  const { error } = await supabase.rpc('update_user_platform_role', {
    target_user_id: userId,
    new_role: newRole,
  });

  if (error) {
    // Fallback direct update if RPC fails
    const { error: directErr } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (directErr) throw directErr;
  }
  return true;
}