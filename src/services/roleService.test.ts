import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockOrder = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelectEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({
  order: mockOrder,
  eq: mockSelectEq,
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => mockFrom(),
  },
}));

import { listRoles, getRoleBySlug, assignRoleToUser } from './roleService';

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns database roles when supabase query succeeds', async () => {
    const dbRoles = [
      { id: '1', name: 'Admin', slug: 'admin', description: null, is_system: true, created_at: '2026-01-01T00:00:00Z' },
    ];
    mockOrder.mockResolvedValueOnce({ data: dbRoles, error: null });

    const roles = await listRoles();
    expect(roles).toEqual(dbRoles);
  });

  it('falls back to DEFAULT_SYSTEM_ROLES when database returns empty or error', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: { message: 'db error' } });

    const roles = await listRoles();
    expect(roles.length).toBeGreaterThanOrEqual(5);
    expect(roles.some((r) => r.slug === 'admin')).toBe(true);
  });

  it('falls back to matching default role in getRoleBySlug', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const role = await getRoleBySlug('editor');
    expect(role?.slug).toBe('editor');

    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const missing = await getRoleBySlug('nonexistent-role');
    expect(missing).toBeNull();
  });

  it('skips non-UUID roleId and updates profiles for valid UUID in assignRoleToUser', async () => {
    await assignRoleToUser('user-1', 'r-admin');
    expect(mockUpdate).not.toHaveBeenCalled();

    mockUpdateEq.mockResolvedValueOnce({ error: null });
    await assignRoleToUser('user-1', '550e8400-e29b-41d4-a716-446655440000');
    expect(mockUpdate).toHaveBeenCalledWith({ role_id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'user-1');
  });
});

