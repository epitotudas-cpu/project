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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function listRoles(): Promise<Role[]> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data && data.length > 0) {
      return data as Role[];
    }
  } catch (err) {
    console.warn('listRoles fallback:', err);
  }
  return DEFAULT_SYSTEM_ROLES;
}

export async function getRoleBySlug(slug: string): Promise<Role | null> {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (!error && data) {
      return data as Role;
    }
  } catch (err) {
    console.warn('getRoleBySlug fallback:', err);
  }
  return DEFAULT_SYSTEM_ROLES.find((r) => r.slug === slug) || null;
}

export async function assignRoleToUser(userId: string, roleId: string): Promise<void> {
  if (!UUID_REGEX.test(roleId)) {
    console.warn('assignRoleToUser skipped: roleId is not a valid UUID:', roleId);
    return;
  }
  try {
    const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', userId);
    if (error) console.warn('Role assign info:', error);
  } catch (err) {
    void err;
  }
}
