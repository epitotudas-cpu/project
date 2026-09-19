import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import * as authClient from '../lib/authClient';
import * as userService from '../services/userService';
import { acceptInvitation } from '../services/partnerInvitationService';
import type { Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  authEvent: AuthChangeEvent | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string, userType?: 'tanulo' | 'szakember') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (data: { full_name?: string }) => Promise<{ error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null);

  useEffect(() => {
    // Check if returning from email confirmation
    const isEmailConfirm = typeof window !== 'undefined' && (
      window.location.hash.includes('confirmed=true') ||
      window.location.hash.includes('type=signup') ||
      sessionStorage.getItem('email_confirmed_success') === 'true'
    );

    if (isEmailConfirm) {
      void authClient.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    } else {
      authClient.getSession().then(({ data: { session } }) => {
        if (session?.user && !session.user.email_confirmed_at) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id, session.user).finally(() => setLoading(false));
          checkPendingInvitation();
        } else {
          setLoading(false);
        }
      }).catch(() => setLoading(false));
    }

    const { data: { subscription } } = authClient.onAuthStateChange((event, session) => {
      setAuthEvent(event);

      // If returning from signup email confirmation link, force sign out and signal login page
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const isConfirming = hash.includes('confirmed=true') || hash.includes('type=signup') || sessionStorage.getItem('email_confirmed_success') === 'true';
        if (isConfirming && session?.user) {
          void authClient.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
      }

      if (session?.user && !session.user.email_confirmed_at) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);

      (async () => {
        try {
          if (session?.user) {
            await loadProfile(session.user.id, session.user);
            await checkPendingInvitation();
          } else {
            setProfile(null);
          }
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkPendingInvitation() {
    try {
      const pendingCode = sessionStorage.getItem('pending_invite_code');
      if (pendingCode) {
        sessionStorage.removeItem('pending_invite_code');
        await acceptInvitation(pendingCode);
      }
    } catch (err) {
      console.warn('Pending invitation accept info:', err);
    }
  }

  async function loadProfile(userId: string, authUser?: User | null) {
    try {
      const data = await userService.getProfile(userId);
      if (data) {
        let metaUserType = authUser?.user_metadata?.user_type;
        if (!metaUserType) {
          try {
            const currentSession = await authClient.getSession();
            metaUserType = currentSession?.data?.session?.user?.user_metadata?.user_type;
          } catch { }
        }
        setProfile({
          ...data,
          ...(metaUserType ? { user_type: metaUserType, userType: metaUserType } : {}),
        } as any);
      } else {
        setProfile(data);
      }
    } catch {
      setProfile(null);
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authClient.signInWithPassword(email, password);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        return { error: 'Kérjük, erősítse meg email-címét a bejelentkezés előtt! Ellenőrizze a fiókjához tartozó bejövő üzeneteket és a Spam mappát.' };
      }
      if (msg.includes('invalid login credentials')) {
        return { error: 'Hibás email-cím vagy jelszó.' };
      }
      return { error: error.message };
    }

    if (data?.user && !data.user.email_confirmed_at) {
      await authClient.signOut();
      return { error: 'Kérjük, erősítse meg email-címét a bejelentkezés előtt! Ellenőrizze a fiókjához tartozó bejövő üzeneteket és a Spam mappát.' };
    }

    await checkPendingInvitation();
    return {};
  };

  const signUp = async (email: string, password: string, fullName: string, userType: 'tanulo' | 'szakember' = 'tanulo') => {
    const trimmedEmail = email ? email.trim() : '';
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return { error: 'Kérjük, adj meg érvényes e-mail-címet.' };
    }
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/#confirmed=true` : undefined;
    const { data, error } = await authClient.signUp(trimmedEmail, password, {
      data: {
        full_name: fullName,
        user_type: userType,
      },
      emailRedirectTo: redirectUrl,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('user already exists') ||
        msg.includes('already exists') ||
        msg.includes('duplicate')
      ) {
        return { error: 'Ez az e-mail-cím már regisztrálva van.' };
      }
      if (
        msg.includes('invalid email') ||
        msg.includes('email address is invalid') ||
        msg.includes('format') ||
        msg.includes('unable to validate email')
      ) {
        return { error: 'Kérjük, adj meg érvényes e-mail-címet.' };
      }
      return { error: error.message };
    }

    if (data?.session || (data?.user && !data.user.email_confirmed_at)) {
      await authClient.signOut();
    }
    return {};
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('Kijelentkezési hiba:', err);
    } finally {
      // Purge all auth tokens & cached state from localStorage & sessionStorage
      try {
        sessionStorage.removeItem('epitotudas_active_page');
        const localKeysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth') || key.includes('token') || key.includes('session'))) {
            localKeysToRemove.push(key);
          }
        }
        localKeysToRemove.forEach((k) => localStorage.removeItem(k));

        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('auth') || key.includes('token') || key.includes('session'))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch (e) {
        // ignore storage errors
      }

      setUser(null);
      setProfile(null);
      setSession(null);

      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    }
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await authClient.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) return { error: error.message };
    return {};
  };

  const updatePassword = async (password: string) => {
    const { error } = await authClient.updateUser({ password });
    if (error) return { error: error.message };
    return {};
  };

  const updateProfile = async (data: { full_name?: string }) => {
    if (!user) return { error: 'Nincs bejelentkezett felhasználó.' };
    try {
      await userService.updateProfile(user.id, { full_name: data.full_name });
      await loadProfile(user.id);
      return {};
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profil frissítése sikertelen.';
      return { error: message };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await authClient.resendVerificationEmail(email);
    if (error) return { error: error.message };
    return {};
  };

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, authEvent,
      signIn, signUp, signOut, requestPasswordReset, updatePassword, updateProfile, resendVerificationEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
