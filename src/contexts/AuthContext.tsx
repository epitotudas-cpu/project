import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import * as authClient from '../lib/authClient';
import * as userService from '../services/userService';
import type { Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  authEvent: AuthChangeEvent | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
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
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    const { data: { subscription } } = authClient.onAuthStateChange((event, session) => {
      setAuthEvent(event);
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
            await loadProfile(session.user.id);
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

  async function loadProfile(userId: string) {
    try {
      const data = await userService.getProfile(userId);
      setProfile(data);
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

    return {};
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
    const { data, error } = await authClient.signUp(email, password, {
      data: { full_name: fullName },
      emailRedirectTo: redirectUrl,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
        return { error: 'Ez az email-cím már regisztrált.' };
      }
      return { error: error.message };
    }

    // Always sign out immediately if session or user was returned, so the user CANNOT log in automatically without confirming email!
    if (data?.session || (data?.user && !data.user.email_confirmed_at)) {
      await authClient.signOut();
    }
    return {};
  };

  const signOut = async () => {
    await authClient.signOut();
    setProfile(null);
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
