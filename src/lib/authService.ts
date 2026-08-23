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

let roleCache: { userId: string; role: string | null; timestamp: number } | null = null;
const CACHE_TTL_MS = 60000; // 1 minute cache

export function clearRoleCache() {
  roleCache = null;
}

async function getCachedProfileRole(userId: string): Promise<string | null> {
  const now = Date.now();
  if (roleCache && roleCache.userId === userId && now - roleCache.timestamp < CACHE_TTL_MS) {
    return roleCache.role;
  }
  try {
    const role = await getProfileRole(userId);
    roleCache = { userId, role, timestamp: now };
    return role;
  } catch (err) {
    console.error('Profile fetch hiba:', err);
    return roleCache?.userId === userId ? roleCache.role : null;
  }
}

export async function getAuthDebugInfo(): Promise<AuthDebugInfo> {
  try {
    const { data: sessionData, error: sessionError } = await authClient.getSession();

    if (sessionError || !sessionData.session) {
      return {
        isAuthenticated: false,
        userId: null,
        userEmail: null,
        hasAdminRole: false,
        role: null,
        error: sessionError ? `Session hiba: ${sessionError.message}` : 'Nincs bejelentkezési session',
      };
    }

    const user = sessionData.session.user;
    if (!user) {
      return {
        isAuthenticated: false,
        userId: null,
        userEmail: null,
        hasAdminRole: false,
        role: null,
        error: 'Nincs felhasználói adat a session-ben',
      };
    }

    const profileRole = await getCachedProfileRole(user.id);
    const hasAdmin = profileRole === 'admin' || profileRole === 'editor';

    return {
      isAuthenticated: true,
      userId: user.id,
      userEmail: user.email || null,
      hasAdminRole: hasAdmin,
      role: profileRole,
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
    clearRoleCache();
    const { data, error } = await authClient.signInWithPassword(email, password);

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Nincs user adat a bejelentkezés után' };
    }

    const profileRole = await getCachedProfileRole(data.user.id);

    if (!profileRole || (profileRole !== 'admin' && profileRole !== 'editor')) {
      await authClient.signOut();
      clearRoleCache();
      return { success: false, error: `Nincs admin jogosultság. Role: ${profileRole || 'nincs profil'}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Ismeretlen hiba a bejelentkezéskor' };
  }
}

export async function signOutAdmin(): Promise<void> {
  clearRoleCache();
  await authClient.signOut();
}

export function onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
  return authClient.onAuthStateChange((_event, session) => {
    if (!session) clearRoleCache();
    callback(!!session);
  });
}
