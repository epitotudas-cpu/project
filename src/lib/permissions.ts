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
  return profile?.role === 'partner';
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
  return profile?.role === 'admin';
}

export function isSzakember(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'editor';
}

export function isTanulo(profile: Profile | null | undefined): boolean {
  void profile;
  return true;
}

export function canAccessAdminPanel(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin';
}

export function canAccessEditorPanel(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'editor';
}

export function canAccessPartnerPanel(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'partner';
}


