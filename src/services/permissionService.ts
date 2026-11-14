import { supabase, type Permission } from '../lib/supabase';

export interface UserPermissionCheck {
  module: string;
  action: string;
}

import { readAppConfig, writeAppConfig } from './appConfigService';

export interface ModuleActionPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  submit: boolean;
  publish: boolean;
  delete: boolean;
}

export interface ModuleCategoryDef {
  id: string;
  name: string;
  category: 'Tartalom és Szerkesztés' | 'Katalógus és Tananyag' | 'Partneri Funkciók' | 'Admin Rendszer';
  isAdminOnly?: boolean;
}

export const SYSTEM_MODULES: ModuleCategoryDef[] = [
  { id: 'articles', name: 'Cikkek és tudásanyagok', category: 'Tartalom és Szerkesztés' },
  { id: 'categories', name: 'Kategóriák és címkék', category: 'Tartalom és Szerkesztés' },
  { id: 'news', name: 'Hírek és újdonságok', category: 'Tartalom és Szerkesztés' },
  { id: 'guides', name: 'Kivitelezési útmutatók', category: 'Tartalom és Szerkesztés' },
  { id: 'glossary', name: 'Fogalomtár', category: 'Tartalom és Szerkesztés' },
  { id: 'media', name: 'Médiafájlok', category: 'Tartalom és Szerkesztés' },
  { id: 'moderation', name: 'Moderációs várólista', category: 'Tartalom és Szerkesztés' },

  { id: 'calculators', name: 'Kalkulátorok', category: 'Katalógus és Tananyag' },
  { id: 'safety', name: 'Munkavédelem', category: 'Katalógus és Tananyag' },
  { id: 'regulations', name: 'Szabályok és szabványok', category: 'Katalógus és Tananyag' },
  { id: 'learning', name: 'Tananyagok és tesztek', category: 'Katalógus és Tananyag' },
  { id: 'catalog', name: 'Szerszám- és anyagkatalógus', category: 'Katalógus és Tananyag' },

  { id: 'partner_profile', name: 'Saját partnerprofil', category: 'Partneri Funkciók' },
  { id: 'partner_offers', name: 'Saját ajánlatok', category: 'Partneri Funkciók' },
  { id: 'partner_products', name: 'Saját termékek/szolgáltatások', category: 'Partneri Funkciók' },
  { id: 'partner_stats', name: 'Saját statisztikák', category: 'Partneri Funkciók' },

  { id: 'users', name: 'Felhasználók kezelése', category: 'Admin Rendszer', isAdminOnly: true },
  { id: 'settings', name: 'Rendszerbeállítások', category: 'Admin Rendszer', isAdminOnly: true },
  { id: 'access_control', name: 'Jogosultságkezelés', category: 'Admin Rendszer', isAdminOnly: true },
];

export type ConfigurableRole = 'editor' | 'partner' | 'school' | 'teacher';

const DEFAULT_EDITOR_PERMISSIONS: Record<string, ModuleActionPermissions> = {
  articles: { view: true, create: true, edit: true, submit: true, publish: true, delete: false },
  categories: { view: true, create: true, edit: true, submit: false, publish: false, delete: false },
  news: { view: true, create: true, edit: true, submit: true, publish: true, delete: false },
  guides: { view: true, create: true, edit: true, submit: true, publish: true, delete: false },
  glossary: { view: true, create: true, edit: true, submit: true, publish: true, delete: false },
  media: { view: true, create: true, edit: true, submit: false, publish: false, delete: true },
  moderation: { view: true, create: false, edit: true, submit: false, publish: true, delete: false },

  calculators: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  safety: { view: true, create: true, edit: true, submit: true, publish: false, delete: false },
  regulations: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  learning: { view: true, create: true, edit: true, submit: true, publish: true, delete: false },
  catalog: { view: true, create: true, edit: true, submit: true, publish: false, delete: false },

  partner_profile: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  partner_offers: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  partner_products: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  partner_stats: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },

  users: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  settings: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  access_control: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
};

const DEFAULT_PARTNER_PERMISSIONS: Record<string, ModuleActionPermissions> = {
  articles: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  categories: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  news: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  guides: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  glossary: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  media: { view: true, create: true, edit: true, submit: false, publish: false, delete: false },
  moderation: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },

  calculators: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  safety: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  regulations: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  learning: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  catalog: { view: true, create: true, edit: true, submit: true, publish: false, delete: false },

  partner_profile: { view: true, create: true, edit: true, submit: true, publish: false, delete: false },
  partner_offers: { view: true, create: true, edit: true, submit: true, publish: false, delete: true },
  partner_products: { view: true, create: true, edit: true, submit: true, publish: false, delete: true },
  partner_stats: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },

  users: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  settings: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  access_control: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
};

const DEFAULT_SCHOOL_PERMISSIONS: Record<string, ModuleActionPermissions> = {
  articles: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  categories: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  news: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  guides: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  glossary: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  media: { view: true, create: true, edit: true, submit: false, publish: false, delete: false },
  moderation: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },

  calculators: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  safety: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  regulations: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  learning: { view: true, create: true, edit: true, submit: true, publish: true, delete: false },
  catalog: { view: true, create: true, edit: true, submit: true, publish: false, delete: false },

  partner_profile: { view: true, create: true, edit: true, submit: true, publish: false, delete: false },
  partner_offers: { view: true, create: true, edit: true, submit: true, publish: false, delete: false },
  partner_products: { view: true, create: true, edit: true, submit: true, publish: false, delete: false },
  partner_stats: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },

  users: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  settings: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  access_control: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
};

const DEFAULT_TEACHER_PERMISSIONS: Record<string, ModuleActionPermissions> = {
  articles: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  categories: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  news: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  guides: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  glossary: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  media: { view: true, create: true, edit: true, submit: false, publish: false, delete: false },
  moderation: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },

  calculators: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  safety: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  regulations: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },
  learning: { view: true, create: true, edit: true, submit: true, publish: true, delete: false },
  catalog: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },

  partner_profile: { view: true, create: false, edit: true, submit: false, publish: false, delete: false },
  partner_offers: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  partner_products: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  partner_stats: { view: true, create: false, edit: false, submit: false, publish: false, delete: false },

  users: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  settings: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
  access_control: { view: false, create: false, edit: false, submit: false, publish: false, delete: false },
};

const STORAGE_KEY_PREFIX = 'epitotudas_role_permissions_';
const ROLE_PERMISSIONS_CONFIG_KEY = '__SYSTEM_CONFIG_ROLE_PERMISSIONS__';

function getDefaultPermissionsForRole(role: ConfigurableRole): Record<string, ModuleActionPermissions> {
  return role === 'editor'
    ? DEFAULT_EDITOR_PERMISSIONS
    : role === 'partner'
    ? DEFAULT_PARTNER_PERMISSIONS
    : role === 'school'
    ? DEFAULT_SCHOOL_PERMISSIONS
    : DEFAULT_TEACHER_PERMISSIONS;
}

export function getRoleModulePermissions(role: ConfigurableRole): Record<string, ModuleActionPermissions> {
  const defaultPerms = getDefaultPermissionsForRole(role);
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${role}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultPerms, ...parsed };
    }
  } catch (e) {
    console.warn(`Hiba a role perms betöltésekor (${role}):`, e);
  }
  return defaultPerms;
}

function collectAllRolePermissions(): Partial<Record<ConfigurableRole, Record<string, ModuleActionPermissions>>> {
  const roles: ConfigurableRole[] = ['editor', 'partner', 'school', 'teacher'];
  const result: Partial<Record<ConfigurableRole, Record<string, ModuleActionPermissions>>> = {};
  for (const r of roles) {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${r}`);
      if (saved) {
        result[r] = JSON.parse(saved);
      }
    } catch {
      // ignore malformed localStorage
    }
  }
  return result;
}

export async function fetchRolePermissionsFromCloud(): Promise<void> {
  try {
    const cloudMap = await readAppConfig<Partial<Record<ConfigurableRole, Record<string, ModuleActionPermissions>>>>(
      ROLE_PERMISSIONS_CONFIG_KEY
    );
    if (cloudMap && typeof cloudMap === 'object') {
      const roles: ConfigurableRole[] = ['editor', 'partner', 'school', 'teacher'];
      for (const r of roles) {
        if (cloudMap[r]) {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${r}`, JSON.stringify(cloudMap[r]));
        }
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('role-permissions-changed'));
      }
    }
  } catch (e) {
    console.warn('Hiba a felhő alapú jogosultságok betöltésekor:', e);
  }
}

export async function saveRoleModulePermissions(
  role: ConfigurableRole,
  permissions: Record<string, ModuleActionPermissions>
): Promise<void> {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${role}`, JSON.stringify(permissions));
    const allPerms = collectAllRolePermissions();
    allPerms[role] = permissions;
    await writeAppConfig(ROLE_PERMISSIONS_CONFIG_KEY, allPerms);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('role-permissions-changed'));
    }
  } catch (e) {
    console.error(`Hiba a role perms mentésekor (${role}):`, e);
  }
}

export async function resetRoleModulePermissions(role: ConfigurableRole): Promise<Record<string, ModuleActionPermissions>> {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${role}`);
    const allPerms = collectAllRolePermissions();
    delete allPerms[role];
    await writeAppConfig(ROLE_PERMISSIONS_CONFIG_KEY, allPerms);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('role-permissions-changed'));
    }
  } catch (e) {
    console.error(`Hiba a role perms visszaállításakor (${role}):`, e);
  }
  return getDefaultPermissionsForRole(role);
}

export function hasModuleActionPermission(
  role: string | null | undefined,
  moduleId: string,
  action: keyof ModuleActionPermissions = 'view'
): boolean {
  if (!role) return false;
  if (role === 'admin') return true;

  const targetModule = SYSTEM_MODULES.find((m) => m.id === moduleId);
  if (targetModule?.isAdminOnly && role !== 'admin') {
    return false;
  }

  if (role !== 'editor' && role !== 'partner' && role !== 'school' && role !== 'teacher') {
    return false;
  }

  const rolePerms = getRoleModulePermissions(role as ConfigurableRole);
  const modPerms = rolePerms[moduleId];
  if (!modPerms) return false;

  return Boolean(modPerms[action]);
}

export function canRoleAccessModule(role: string | null | undefined, moduleId: string): boolean {
  return hasModuleActionPermission(role, moduleId, 'view');
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

