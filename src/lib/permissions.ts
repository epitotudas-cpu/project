import type { Profile } from './supabase';

export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin';
}

export function isEditor(profile: Profile | null | undefined): boolean {
  return profile?.role === 'editor';
}

export function isEditorOnly(profile: Profile | null | undefined): boolean {
  return profile?.role === 'editor';
}

export function isPartner(profile: Profile | null | undefined): boolean {
  return profile?.role === 'partner' || profile?.role === 'contact';
}

export function canEdit(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'editor';
}

export function canDelete(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin';
}

export function isUser(profile: Profile | null | undefined): boolean {
  return profile?.role === 'user' || !profile?.role;
}

export function isModerator(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'editor';
}

export function isIskola(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'school';
}

export function isTeacher(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'teacher';
}

export function isTanar(profile: Profile | null | undefined): boolean {
  return isTeacher(profile);
}

export function isSzakember(target?: any): boolean {
  if (!target) return false;
  if (typeof target === 'string') {
    return target === 'szakember';
  }
  const userType = target?.user_metadata?.user_type || target?.user_type || target?.userType;
  if (userType) {
    return userType === 'szakember';
  }
  return target?.role === 'admin' || target?.role === 'editor';
}

export function isTanulo(target?: any): boolean {
  if (!target) return false;
  if (typeof target === 'string') {
    return target === 'tanulo' || target === 'student';
  }
  const userType = target?.user_metadata?.user_type || target?.user_type || target?.userType;
  if (userType) {
    return userType === 'tanulo' || userType === 'student';
  }
  const role = target?.role || target?.user_metadata?.role;
  if (role) {
    return role === 'student' || role === 'tanulo';
  }
  return false;
}

export function canAccessAdminPanel(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin';
}

export function canAccessEditorPanel(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'editor';
}

export function isContact(profile: Profile | null | undefined): boolean {
  return profile?.role === 'contact';
}

export function canAccessPartnerPanel(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.role === 'admin' ||
    profile.role === 'partner' ||
    profile.role === 'school' ||
    profile.role === 'teacher' ||
    profile.role === 'contact'
  );
}



