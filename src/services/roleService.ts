import { supabase, type Role } from '../lib/supabase';

const DEFAULT_SYSTEM_ROLES: Role[] = [
  { id: 'r-admin', name: 'Adminisztrátor', slug: 'admin', description: 'Teljes platformkezelési jogosultság', is_system: true, created_at: new Date().toISOString() },
  { id: 'r-editor', name: 'Szerkesztő', slug: 'editor', description: 'Tartalomkezelő és módosító jogosultság', is_system: true, created_at: new Date().toISOString() },
  { id: 'r-moderator', name: 'Moderátor', slug: 'moderator', description: 'Tartalom-ellenőrzési és jóváhagyási jogosultság', is_system: true, created_at: new Date().toISOString() },
  { id: 'r-partner', name: 'Partner', slug: 'partner', description: 'Céges / intézményi partner jogosultság', is_system: false, created_at: new Date().toISOString() },
  { id: 'r-iskola', name: 'Iskola', slug: 'iskola', description: 'Oktatási intézményi partner jogosultság', is_system: false, created_at: new Date().toISOString() },
  { id: 'r-szakember', name: 'Szakember', slug: 'szakember', description: 'Minősített építőipari szakember', is_system: false, created_at: new Date().toISOString() },
  { id: 'r-tanulo', name: 'Tanuló', slug: 'tanulo', description: 'Diák / pályakezdő regisztrált felhasználó', is_system: false, created_at: new Date().toISOString() },
];

export async function listRoles(): Promise<Role[]> {
  try {
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error || !data || data.length === 0) {
      return DEFAULT_SYSTEM_ROLES;
    }
    return data;
  } catch (err) {
    void err;
    return DEFAULT_SYSTEM_ROLES;
  }
}

export async function getRoleBySlug(slug: string): Promise<Role | null> {
  try {
    const { data, error } = await supabase.from('roles').select('*').eq('slug', slug).maybeSingle();
    if (error || !data) {
      return DEFAULT_SYSTEM_ROLES.find((r) => r.slug === slug) || null;
    }
    return data;
  } catch (err) {
    void err;
    return DEFAULT_SYSTEM_ROLES.find((r) => r.slug === slug) || null;
  }
}

export async function assignRoleToUser(userId: string, roleId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', userId);
  if (error) throw error;
}
