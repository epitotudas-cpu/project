import { describe, expect, it } from 'vitest';
import type { Profile } from './supabase';
import {
  canAccessAdminPanel,
  canAccessEditorPanel,
  canAccessPartnerPanel,
  canDelete,
  canEdit,
  isAdmin,
  isContact,
  isEditor,
  isEditorOnly,
  isIskola,
  isModerator,
  isPartner,
  isStudent,
  isSzakember,
  isTanar,
  isTanulo,
  isTeacher,
  isUser,
} from './permissions';

function makeProfile(role: Profile['role']): Profile {
  return {
    id: 'user-1',
    email: 'teszt@example.com',
    full_name: 'Teszt Elek',
    role,
    avatar_url: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('permissions', () => {
  it('identifies admin, editor, partner, contact, school, teacher, and user roles', () => {
    const admin = makeProfile('admin');
    const editor = makeProfile('editor');
    const partner = makeProfile('partner');
    const contact = makeProfile('contact');
    const school = makeProfile('school');
    const teacher = makeProfile('teacher');
    const student = makeProfile('student');
    const user = makeProfile('user');

    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(editor)).toBe(false);
    expect(isAdmin(null)).toBe(false);

    expect(isEditor(editor)).toBe(true);
    expect(isEditorOnly(editor)).toBe(true);
    expect(isEditor(admin)).toBe(false);

    expect(isPartner(partner)).toBe(true);
    expect(isPartner(contact)).toBe(true);
    expect(isPartner(user)).toBe(false);
    expect(isContact(contact)).toBe(true);

    expect(canEdit(admin)).toBe(true);
    expect(canEdit(editor)).toBe(true);
    expect(canEdit(partner)).toBe(false);

    expect(canDelete(admin)).toBe(true);
    expect(canDelete(editor)).toBe(false);

    expect(isModerator(admin)).toBe(true);
    expect(isModerator(editor)).toBe(true);
    expect(isModerator(user)).toBe(false);

    expect(isIskola(admin)).toBe(true);
    expect(isIskola(school)).toBe(true);
    expect(isIskola(teacher)).toBe(false);

    expect(isTeacher(admin)).toBe(true);
    expect(isTeacher(teacher)).toBe(true);
    expect(isTanar(teacher)).toBe(true);
    expect(isTeacher(student)).toBe(false);

    expect(isUser(user)).toBe(true);
    expect(isUser(student)).toBe(true);
    expect(isUser(null)).toBe(true);
    expect(isUser(admin)).toBe(false);
  });

  it('evaluates szakember and student role targets', () => {
    expect(isSzakember('szakember')).toBe(true);
    expect(isSzakember('tanulo')).toBe(false);
    expect(isSzakember({ user_metadata: { user_type: 'szakember' } })).toBe(true);
    expect(isSzakember({ role: 'editor' })).toBe(true);
    expect(isSzakember(null)).toBe(false);

    expect(isStudent('tanulo')).toBe(true);
    expect(isStudent('student')).toBe(true);
    expect(isStudent('user')).toBe(true);
    expect(isStudent({ role: 'student' })).toBe(true);
    expect(isStudent({ user_metadata: { user_type: 'tanulo' } })).toBe(true);
    expect(isTanulo('tanulo')).toBe(true);
    expect(isStudent('szakember')).toBe(false);
  });

  it('evaluates panel access helpers', () => {
    expect(canAccessAdminPanel(makeProfile('admin'))).toBe(true);
    expect(canAccessAdminPanel(makeProfile('editor'))).toBe(false);

    expect(canAccessEditorPanel(makeProfile('admin'))).toBe(true);
    expect(canAccessEditorPanel(makeProfile('editor'))).toBe(true);
    expect(canAccessEditorPanel(makeProfile('partner'))).toBe(false);

    expect(canAccessPartnerPanel(null, 'owner')).toBe(true);
    expect(canAccessPartnerPanel(null, 'instructor')).toBe(true);
    expect(canAccessPartnerPanel(null, 'pending')).toBe(false);
    expect(canAccessPartnerPanel(makeProfile('partner'))).toBe(true);
    expect(canAccessPartnerPanel(makeProfile('school'))).toBe(true);
    expect(canAccessPartnerPanel(makeProfile('teacher'))).toBe(true);
    expect(canAccessPartnerPanel(makeProfile('contact'))).toBe(true);
    expect(canAccessPartnerPanel(makeProfile('user'))).toBe(false);
  });
});
