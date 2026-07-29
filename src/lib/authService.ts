import * as authClient from './authClient';
import { getProfileRole } from '../services/userService';

export interface AuthDebugInfo {
  isAuthenticated: boolean;
  userId: string | null;
  userEmail: string | null;
  hasAdminRole: boolean;
  role: string | null;
  error?: string;
}

export async function getAuthDebugInfo(): Promise<AuthDebugInfo> {
  try {
    const { data: sessionData, error: sessionError } = await authClient.getSession();

    if (sessionError) {
      return {
        isAuthenticated: false,
        userId: null,
        userEmail: null,
        hasAdminRole: false,
        role: null,
        error: `Session hiba: ${sessionError.message}`,
      };
    }

    if (!sessionData.session) {
      return {
        isAuthenticated: false,
        userId: null,
        userEmail: null,
        hasAdminRole: false,
        role: null,
        error: 'Nincs bejelentkezési session',
      };
    }

    const { data: userData, error: userError } = await authClient.getUser();

    if (userError || !userData.user) {
      return {
        isAuthenticated: false,
        userId: null,
        userEmail: null,
        hasAdminRole: false,
        role: null,
        error: `User fetch hiba: ${userError?.message || 'ismeretlen'}`,
      };
    }

    const metadataRole = (userData.user.user_metadata?.role as string | undefined) ?? null;
    if (metadataRole === 'admin') {
      return {
        isAuthenticated: true,
        userId: userData.user.id,
        userEmail: userData.user.email || null,
        hasAdminRole: true,
        role: 'admin',
      };
    }

    let profileRole: string | null = null;
    try {
      profileRole = await getProfileRole(userData.user.id);
    } catch (err) {
      console.error('Profile fetch hiba:', err);
    }

    const hasAdmin = profileRole === 'admin' || profileRole === 'editor';

    return {
      isAuthenticated: true,
      userId: userData.user.id,
      userEmail: userData.user.email || null,
      hasAdminRole: hasAdmin,
      role: profileRole ?? metadataRole,
      error: hasAdmin ? undefined : `Nem admin szerepkör. Jelenlegi role: ${profileRole || 'nincs profil'}`,
    };
  } catch (err) {
    return {
      isAuthenticated: false,
      userId: null,
      userEmail: null,
      hasAdminRole: false,
      role: null,
      error: `Kivétel: ${err instanceof Error ? err.message : 'ismeretlen'}`,
    };
  }
}

export async function signInAdmin(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await authClient.signInWithPassword(email, password);

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Nincs user adat a bejelentkezés után' };
    }

    let profileRole: string | null = null;
    try {
      profileRole = await getProfileRole(data.user.id);
    } catch (err) {
      return { success: false, error: `Profile lekérdezési hiba: ${err instanceof Error ? err.message : 'ismeretlen'}` };
    }

    if (!profileRole || (profileRole !== 'admin' && profileRole !== 'editor')) {
      await authClient.signOut();
      return { success: false, error: `Nincs admin jogosultság. Role: ${profileRole || 'nincs profil'}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Ismeretlen hiba a bejelentkezéskor' };
  }
}

export async function signOutAdmin(): Promise<void> {
  await authClient.signOut();
}

export function onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
  return authClient.onAuthStateChange((_event, session) => {
    callback(!!session);
  });
}
