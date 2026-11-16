import { expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export const PROTECTED_PRODUCTION_PARTNERS = {
  ids: [] as string[],
  slugs: [] as string[],
  names: [] as string[],
  emails: [] as string[],
};

const DEFAULT_SUPABASE_URL = 'https://olmavxcmkvvcebgqxohe.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbWF2eGNta3Z2Y2ViZ3F4b2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjAzNzksImV4cCI6MjA5NTgzNjM3OX0.uwz9kRkODHafloihBfDauFTAGk4dTb2X9TJrnF_vwHw';

interface BrowserStoredSession {
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
}

export function isProtectedProductionEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return PROTECTED_PRODUCTION_PARTNERS.emails.includes(email.trim().toLowerCase());
}

function getSupabaseConfig(): { url: string; anonKey: string } {
  const url =
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL?.trim()) ||
    DEFAULT_SUPABASE_URL;
  const anonKey =
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY?.trim()) ||
    DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

async function readBrowserSupabaseSession(page: Page): Promise<BrowserStoredSession> {
  return page.evaluate(() => {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !/^sb-.*-auth-token$/.test(key)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as {
          access_token?: string;
          user?: { id?: string; email?: string };
          currentSession?: { access_token?: string; user?: { id?: string; email?: string } };
        };
        const sessionObj = parsed.currentSession ?? parsed;
        if (sessionObj?.access_token) {
          return {
            accessToken: sessionObj.access_token,
            userId: sessionObj.user?.id ?? null,
            userEmail: sessionObj.user?.email ?? null,
          };
        }
      } catch {
        // Hibás JSON esetén tovább keresünk vagy fail-closed módon elbukik a hívó.
      }
    }
    return { accessToken: null, userId: null, userEmail: null };
  });
}

function assertNoProtectedPartnerMatch(
  records: Array<{ partner_id?: string | null; id?: string | null; slug?: string | null; name?: string | null }>,
  sourceLabel: string
): void {
  for (const row of records) {
    const pid = row.partner_id ?? row.id ?? null;
    if (pid && PROTECTED_PRODUCTION_PARTNERS.ids.includes(pid.toLowerCase())) {
      throw new Error(
        `BIZTONSÁGI TILTÁS (${sourceLabel}): A hitelesített felhasználó a védett éles partnerazonosítóhoz (${pid}) kapcsolódik. A teszt nem folytatható.`
      );
    }
    if (row.slug && PROTECTED_PRODUCTION_PARTNERS.slugs.includes(row.slug.trim().toLowerCase())) {
      throw new Error(
        `BIZTONSÁGI TILTÁS (${sourceLabel}): A hitelesített felhasználó a védett éles partner slug-hoz (${row.slug}) kapcsolódik. A teszt nem folytatható.`
      );
    }
    if (row.name && PROTECTED_PRODUCTION_PARTNERS.names.includes(row.name.trim())) {
      throw new Error(
        `BIZTONSÁGI TILTÁS (${sourceLabel}): A hitelesített felhasználó a védett éles partnerhez ("${row.name}") kapcsolódik. A teszt nem folytatható.`
      );
    }
  }
}

/**
 * Fail-closed ellenőrzés: lekéri a hitelesített Supabase user sessiont,
 * megállapítja a user UUID-ját, és ellenőrzi a `partner_users` valamint a
 * `partners.contact_email` kapcsolatokat a védett partner UUID ellen.
 */
export async function assertAuthenticatedPartnerIsSafe(
  page: Page,
  contextEmail?: string | null
): Promise<void> {
  if (isProtectedProductionEmail(contextEmail)) {
    throw new Error(
      `BIZTONSÁGI TILTÁS (email ellenőrzés): A megadott tesztfiók (${contextEmail}) védett éles tulajdonosi e-mail. A teszt nem folytatható.`
    );
  }

  let stored: BrowserStoredSession;
  try {
    stored = await readBrowserSupabaseSession(page);
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : 'ismeretlen böngészőhiba';
    throw new Error(
      `BIZTONSÁGI TILTÁS (session olvasási hiba): Nem olvasható ki a böngésző Supabase munkamenete (${reason}), ezért a tesztfiók biztonságossága nem bizonyítható. A teszt nem folytatható.`
    );
  }

  if (!stored.accessToken) {
    throw new Error(
      'BIZTONSÁGI TILTÁS (hiányzó session): A bejelentkezés után nem található érvényes Supabase access token, ezért a partnerkapcsolat nem ellenőrizhető. A teszt nem folytatható.'
    );
  }

  const { url, anonKey } = getSupabaseConfig();
  const authedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${stored.accessToken}`,
      },
    },
  });

  const { data: userData, error: userError } = await authedClient.auth.getUser(stored.accessToken);
  if (userError || !userData?.user?.id) {
    throw new Error(
      `BIZTONSÁGI TILTÁS (auth.getUser hiba): Nem igazolható a hitelesített felhasználó UUID-ja (${userError?.message || 'hiányzó user adat'}). A teszt nem folytatható.`
    );
  }

  const verifiedUser = userData.user;
  if (isProtectedProductionEmail(verifiedUser.email) || isProtectedProductionEmail(stored.userEmail)) {
    throw new Error(
      'BIZTONSÁGI TILTÁS (hitelesített e-mail): A belépett felhasználó e-mail-címe védett éles tulajdonosi fiókhoz tartozik. A teszt nem folytatható.'
    );
  }

  const { data: partnerUsers, error: puError } = await authedClient
    .from('partner_users')
    .select('partner_id, member_role')
    .eq('user_id', verifiedUser.id);

  if (puError || !Array.isArray(partnerUsers)) {
    throw new Error(
      `BIZTONSÁGI TILTÁS (partner_users lekérdezési hiba): Nem ellenőrizhető a felhasználó partnerkapcsolata (${puError?.message || 'érvénytelen válasz'}). A teszt nem folytatható.`
    );
  }

  assertNoProtectedPartnerMatch(
    partnerUsers as Array<{ partner_id?: string | null }>,
    'partner_users'
  );

  if (verifiedUser.email) {
    const { data: partnersByEmail, error: partnerEmailError } = await authedClient
      .from('partners')
      .select('id, name, slug')
      .eq('contact_email', verifiedUser.email);

    if (partnerEmailError || !Array.isArray(partnersByEmail)) {
      throw new Error(
        `BIZTONSÁGI TILTÁS (partners.contact_email lekérdezési hiba): Nem ellenőrizhető a partneri e-mail kapcsolat (${partnerEmailError?.message || 'érvénytelen válasz'}). A teszt nem folytatható.`
      );
    }

    assertNoProtectedPartnerMatch(
      partnersByEmail as Array<{ id?: string | null; name?: string | null; slug?: string | null }>,
      'partners.contact_email'
    );
  }
}

export async function assertPageNotProtectedPartner(page: Page): Promise<void> {
  await assertAuthenticatedPartnerIsSafe(page);

  const bodyText = await page.locator('body').innerText().catch(() => '');
  for (const name of PROTECTED_PRODUCTION_PARTNERS.names) {
    if (bodyText.includes(name)) {
      throw new Error(
        `BIZTONSÁGI TILTÁS (DOM ellenőrzés): A felület a védett éles "${name}" partnerrekordot jeleníti meg. Író E2E teszt ezzel a fiókkal tilos.`
      );
    }
  }
}

export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  if (!email?.trim() || !password?.trim()) {
    throw new Error(
      'BIZTONSÁGI TILTÁS (hiányzó hitelesítő adatok): Üres vagy hiányzó e-mail/jelszó esetén a tesztfiók biztonságossága nem igazolható. A teszt nem folytatható.'
    );
  }
  if (isProtectedProductionEmail(email)) {
    throw new Error(
      `BIZTONSÁGI TILTÁS (tiltott e-mail): A(z) "${email}" fiókkal történő bejelentkezés E2E tesztben tiltott. A teszt nem folytatható.`
    );
  }

  await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  await expect(emailInput).toBeVisible({ timeout: 12_000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitBtn.click();

  await page.waitForFunction(
    () => !window.location.hash.includes('login'),
    null,
    { timeout: 15_000 }
  );
  await page.waitForTimeout(500);

  await assertAuthenticatedPartnerIsSafe(page, email);
}

export async function createAuthenticatedContext(
  browser: Browser,
  email: string,
  password: string
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await loginViaUI(page, email, password);
    return { context, page };
  } catch (err) {
    await context.close().catch(() => {});
    throw err;
  }
}

export function attachErrorCollectors(page: Page): string[] {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  return pageErrors;
}
