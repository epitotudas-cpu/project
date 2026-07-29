import { supabase } from './supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getUser() {
  return supabase.auth.getUser();
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, options: { data?: Record<string, unknown>; emailRedirectTo?: string }) {
  return supabase.auth.signUp({ email, password, options });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPasswordForEmail(email: string, options: { redirectTo: string }) {
  return supabase.auth.resetPasswordForEmail(email, options);
}

export async function updateUser(payload: { password?: string }) {
  return supabase.auth.updateUser(payload);
}
