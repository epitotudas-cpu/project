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
    const { error } = await authClient.signInWithPassword(email, password);
    if (!error) return {};
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Kérjük erősítse meg az email-címét a bejelentkezés előtt.' };
    }
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Hibás email-cím vagy jelszó.' };
    }
    return { error: error.message };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await authClient.signUp(email, password, {
      data: { full_name: fullName },
      emailRedirectTo: window.location.origin,
    });
    if (!error) return {};
    const msg = error.message.toLowerCase();
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
      return { error: 'Ez az email-cím már regisztrált.' };
    }
    return { error: error.message };
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

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, authEvent,
      signIn, signUp, signOut, requestPasswordReset, updatePassword, updateProfile,
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
