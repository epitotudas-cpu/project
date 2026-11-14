import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => mockFrom(),
  },
}));

vi.mock('./appConfigService', () => ({
  readAppConfig: vi.fn().mockResolvedValue(null),
  writeAppConfig: vi.fn().mockResolvedValue(undefined),
}));

import {
  hasModuleActionPermission,
  canRoleAccessModule,
  getUserPermissions,
  hasPermission,
} from './permissionService';

describe('permissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('grants all permissions to admin and restricts admin-only modules for non-admins', () => {
    expect(hasModuleActionPermission('admin', 'users', 'delete')).toBe(true);
    expect(hasModuleActionPermission('admin', 'access_control', 'publish')).toBe(true);

    expect(hasModuleActionPermission('editor', 'users', 'view')).toBe(false);
    expect(hasModuleActionPermission('partner', 'settings', 'view')).toBe(false);
    expect(hasModuleActionPermission('school', 'access_control', 'view')).toBe(false);
    expect(hasModuleActionPermission('teacher', 'users', 'view')).toBe(false);
  });

  it('handles null, undefined, and non-configurable roles safely', () => {
    expect(hasModuleActionPermission(null, 'articles', 'view')).toBe(false);
    expect(hasModuleActionPermission(undefined, 'articles', 'view')).toBe(false);
    expect(hasModuleActionPermission('user', 'articles', 'view')).toBe(false);
    expect(hasModuleActionPermission('student', 'learning', 'view')).toBe(false);
  });

  it('checks default module view/edit permissions for editor and partner', () => {
    expect(canRoleAccessModule('editor', 'articles')).toBe(true);
    expect(hasModuleActionPermission('editor', 'articles', 'delete')).toBe(false);
    expect(canRoleAccessModule('partner', 'partner_offers')).toBe(true);
    expect(canRoleAccessModule('partner', 'moderation')).toBe(false);
  });

  it('returns wildcard permission for admin from getUserPermissions', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: 'admin', role_id: null },
      error: null,
    });

    const perms = await getUserPermissions('user-admin');
    expect(perms).toHaveLength(1);
    expect(perms[0].module).toBe('*');
    expect(perms[0].action).toBe('*');
  });

  it('returns default editor write permissions when role_id is missing', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: 'editor', role_id: null },
      error: null,
    });

    const allowed = await hasPermission('user-editor', 'articles', 'write');
    expect(allowed).toBe(true);
  });
});

