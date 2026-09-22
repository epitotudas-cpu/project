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

export async function updateUser(payload: { password?: string; data?: Record<string, unknown> }) {
  return supabase.auth.updateUser(payload);
}

export async function sendVerificationEmailViaResend(email: string, fullName?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://epitotudas.hu';
  const confirmUrl = `${origin}/#confirmed=true&email=${encodeURIComponent(email)}`;
  const subject = 'ÉpítőTudás – E-mail cím megerősítése';

  const html = `
    <div style="background-color: #081B35; padding: 40px 20px; font-family: Arial, sans-serif; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0C213E; border: 1px solid #1E3A64; border-radius: 16px; padding: 32px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin-bottom: 8px;">Építő<span style="color: #4165b4;">Tudás</span></h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 0;">Szakmai Tudásplatform</p>
        <hr style="border: none; border-top: 1px solid #1E3A64; margin: 20px 0;">
        
        <h2 style="color: #ffffff; font-size: 20px; font-weight: bold; margin-bottom: 12px;">Kedves ${fullName || 'Regisztráló'}!</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Köszönjük, hogy regisztráltál az ÉpítőTudás platformon! A fiókod aktiválásához és az osztályodhoz való csatlakozáshoz kérjük, erősítsd meg az e-mail címedet az alábbi gombra kattintva:
        </p>
        
        <div style="margin: 28px 0;">
          <a href="${confirmUrl}" style="background-color: #f59e0b; color: #000000; font-weight: bold; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block;">
            E-mail cím megerősítése
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          Ha nem tudsz a gombra kattintani, másold be az alábbi hivatkozást a böngésződbe:<br>
          <a href="${confirmUrl}" style="color: #4165b4; word-break: break-all;">${confirmUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #1E3A64; margin: 24px 0;">
        <p style="color: #64748b; font-size: 11px;">ÉpítőTudás © ${new Date().getFullYear()} – Minden jog fenntartva.</p>
      </div>
    </div>
  `;

  try {
    let invokeRes = await supabase.functions.invoke('resend-email', {
      body: { to: email, subject, html },
    });
    if (invokeRes.error || (invokeRes.data && (invokeRes.data.error || invokeRes.data.name === 'validation_error'))) {
      invokeRes = await supabase.functions.invoke('send-invitation-email', {
        body: { to: email, subject, html },
      });
    }
    return invokeRes;
  } catch (e) {
    console.warn('Resend verification email notice:', e);
    return { error: e };
  }
}

export async function resendVerificationEmail(email: string, fullName?: string) {
  const res = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#confirmed=true&email=${encodeURIComponent(email)}` : undefined,
    },
  });

  // Also trigger Resend Edge Function delivery to ensure inbox placement
  await sendVerificationEmailViaResend(email, fullName);

  return res;
}

