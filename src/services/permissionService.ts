import { supabase, type Permission } from '../lib/supabase';

export interface UserPermissionCheck {
  module: string;
  action: string;
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, role_id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return [];

    if (profile.role === 'admin') {
      return [
        { id: 'p-all', module: '*', action: '*', description: 'Minden modul', created_at: new Date().toISOString() },
      ];
    }

    if (!profile.role_id) {
      if (profile.role === 'editor') {
        return [
          { id: 'p-articles-write', module: 'articles', action: 'write', description: 'Cikkek szerkesztése', created_at: new Date().toISOString() },
          { id: 'p-glossary-write', module: 'glossary', action: 'write', description: 'Fogalomtár szerkesztése', created_at: new Date().toISOString() },
          { id: 'p-tools-write', module: 'tools', action: 'write', description: 'Szerszámok szerkesztése', created_at: new Date().toISOString() },
        ];
      }
      return [];
    }

    const { data: rpData, error } = await supabase
      .from('role_permissions')
      .select('permissions(*)')
      .eq('role_id', profile.role_id);

    if (error || !rpData) return [];

    const permissions = rpData
      .map((item) => item.permissions as unknown as Permission)
      .filter((p): p is Permission => Boolean(p));

    return permissions;
  } catch (err) {
    void err;
    return [];
  }
}

export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.some(
    (p) =>
      (p.module === '*' || p.module === module) &&
      (p.action === '*' || p.action === action)
  );
}
