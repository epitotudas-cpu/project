import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PROTECTED_PRODUCTION_PARTNERS, attachErrorCollectors, loginViaUI } from './helpers/auth';

const TESZT_ISKOLA_PARTNER_ID = 'c45a9ebd-8afb-43ab-8761-b1e7bc69aee6';

const DEFAULT_SUPABASE_URL = 'https://olmavxcmkvvcebgqxohe.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbWF2eGNta3Z2Y2ViZ3F4b2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjAzNzksImV4cCI6MjA5NTgzNjM3OX0.uwz9kRkODHafloihBfDauFTAGk4dTb2X9TJrnF_vwHw';

/**
 * A PartnerSchoolProfilePage.tsx `handleSaveProfile` és a partnerService.ts `updatePartner` /
 * `buildPartnerDbPayload` által érintett összes partners oszlop.
 */
const RESTORABLE_PARTNER_FIELDS = [
  'name',
  'slug',
  'category',
  'official_name',
  'partner_type',
  'contact_person_name',
  'contact_person_title',
  'contact_email',
  'contact_phone',
  'address',
  'zip_code',
  'city',
  'county',
  'website_url',
  'business_hours',
  'description',
  'detailed_description',
  'logo_url',
  'cover_url',
  'logo_bg',
  'operating_area',
  'inquiry_email',
  'social_facebook',
  'social_linkedin',
  'social_instagram',
  'social_youtube',
  'services',
  'certificates',
  'related_content',
  'seo_title',
  'seo_description',
  'is_indexable',
  'is_verified',
  'status',
  'is_featured',
] as const;

function getSupabaseConfig(): { url: string; anonKey: string } {
  const url =
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL?.trim()) ||
    DEFAULT_SUPABASE_URL;
  const anonKey =
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY?.trim()) ||
    DEFAULT_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

async function getAuthedClientFromPage(page: import('@playwright/test').Page): Promise<{
  client: SupabaseClient;
  userId: string;
}> {
  const accessToken = await page.evaluate(() => {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !/^sb-.*-auth-token$/.test(key)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as {
          access_token?: string;
          currentSession?: { access_token?: string };
        };
        const token = parsed.currentSession?.access_token ?? parsed.access_token ?? null;
        if (token) return token;
      } catch {
        // Hibás JSON esetén tovább keresünk.
      }
    }
    return null;
  });

  if (!accessToken) {
    throw new Error('BIZTONSÁGI TILTÁS: Hiányzó Supabase access token a böngésző munkamenetéből.');
  }

  const { url, anonKey } = getSupabaseConfig();
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: userData, error } = await client.auth.getUser(accessToken);
  if (error || !userData?.user?.id) {
    throw new Error(
      `BIZTONSÁGI TILTÁS: Felhasználói session igazolása sikertelen (${error?.message || 'nincs user ID'}).`
    );
  }

  return { client, userId: userData.user.id };
}

async function assertTesztIskolaOwner(client: SupabaseClient, userId: string): Promise<void> {
  if (PROTECTED_PRODUCTION_PARTNERS.ids.includes(TESZT_ISKOLA_PARTNER_ID.toLowerCase())) {
    throw new Error(
      `BIZTONSÁGI TILTÁS: A cél partnerazonosító (${TESZT_ISKOLA_PARTNER_ID}) védett listán szerepel.`
    );
  }

  const { data: memberships, error } = await client
    .from('partner_users')
    .select('partner_id, member_role')
    .eq('user_id', userId)
    .eq('partner_id', TESZT_ISKOLA_PARTNER_ID);

  if (error || !Array.isArray(memberships) || memberships.length !== 1) {
    throw new Error(
      `BIZTONSÁGI TILTÁS: A bejelentkezett felhasználó (${userId}) nem igazolható egyértelműen a Teszt Iskola (${TESZT_ISKOLA_PARTNER_ID}) partnerkapcsolatában (${error?.message || `találatok száma: ${memberships?.length ?? 0}`}).`
    );
  }

  const membership = memberships[0] as { partner_id?: string | null; member_role?: string | null };
  if (membership.partner_id !== TESZT_ISKOLA_PARTNER_ID || membership.member_role !== 'owner') {
    throw new Error(
      `BIZTONSÁGI TILTÁS: A Teszt Iskola (${TESZT_ISKOLA_PARTNER_ID}) módosításához member_role='owner' jogosultság szükséges (kapott partner_id=${String(membership.partner_id)}, member_role=${String(membership.member_role)}).`
    );
  }
}

test.describe('1. fázis (P3) Oktatási partnerprofil mezők E2E (Teszt Iskola)', () => {
  test('Iskolai partnerprofil: működési terület, nyilvános e-mail, közösségi és SEO mezők elérhetők', async ({
    page,
  }) => {
    const schoolEmail = process.env.E2E_SCHOOL_OWNER_EMAIL;
    const schoolPassword = process.env.E2E_SCHOOL_OWNER_PASSWORD;
    test.skip(
      !schoolEmail || !schoolPassword,
      'E2E_SCHOOL_OWNER_EMAIL / E2E_SCHOOL_OWNER_PASSWORD nincs beállítva (.env.test.local).'
    );
    test.setTimeout(90_000);

    const pageErrors = attachErrorCollectors(page);
    await loginViaUI(page, schoolEmail!, schoolPassword!);

    const { client: authedClient, userId } = await getAuthedClientFromPage(page);
    await assertTesztIskolaOwner(authedClient, userId);

    const selectColumns = RESTORABLE_PARTNER_FIELDS.join(', ');
    const { data: originalRow, error: readError } = await authedClient
      .from('partners')
      .select(selectColumns)
      .eq('id', TESZT_ISKOLA_PARTNER_ID)
      .single();

    if (readError || !originalRow || typeof originalRow !== 'object') {
      throw new Error(
        `BIZTONSÁGI TILTÁS: A Teszt Iskola (${TESZT_ISKOLA_PARTNER_ID}) eredeti adatbázis-rekordja nem olvasható ki (${readError?.message || 'üres válasz'}).`
      );
    }

    const originalRecord = originalRow as unknown as Record<string, unknown>;
    const originalSnapshot: Record<string, unknown> = {};
    for (const field of RESTORABLE_PARTNER_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(originalRecord, field)) {
        const value = originalRecord[field];
        if (value !== undefined) {
          originalSnapshot[field] = structuredClone(value);
        }
      }
    }

    let saveRequestSucceeded = false;
    let savedRecord: Record<string, unknown> | null = null;
    let pendingPatchParse: Promise<void> | null = null;

    const handlePartnerPatchResponse = (response: import('@playwright/test').Response) => {
      if (
        response.request().method() === 'PATCH' &&
        response.url().includes('/rest/v1/partners') &&
        response.url().includes(TESZT_ISKOLA_PARTNER_ID) &&
        response.ok()
      ) {
        saveRequestSucceeded = true;
        pendingPatchParse = (async () => {
          try {
            const body = (await response.json()) as Array<Record<string, unknown>>;
            if (Array.isArray(body) && body.length === 1 && body[0] && typeof body[0] === 'object') {
              savedRecord = body[0];
            }
          } catch {
            // Ha a válasz nem JSON, a finally ág explicit hibát dob a hiányzó mentett rekord miatt.
          }
        })();
      }
    };

    page.on('response', handlePartnerPatchResponse);

    try {
      await page.goto('/#/partner', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);

      const profileNav = page.locator('aside button').filter({ hasText: /Iskola Adatai/i }).first();
      await expect(profileNav).toBeVisible({ timeout: 12_000 });
      await profileNav.click();
      await page.waitForTimeout(500);

      await expect(page.locator('main')).toContainText(/Működési terület, Közösségi oldalak & SEO/i);
      await expect(page.locator('input[placeholder="info@iskola.hu"]')).toBeVisible();
      await expect(page.locator('input[placeholder="SEO Cím (opcionális)"]')).toBeVisible();

      const saveBtn = page.getByRole('button', { name: /Módosítások Mentése/i });
      await expect(saveBtn).toBeVisible();

      const patchResponsePromise = page.waitForResponse(
        (res) =>
          res.request().method() === 'PATCH' &&
          res.url().includes('/rest/v1/partners') &&
          res.url().includes(TESZT_ISKOLA_PARTNER_ID),
        { timeout: 15_000 }
      );

      await saveBtn.click();
      const patchResponse = await patchResponsePromise;
      expect(patchResponse.ok()).toBe(true);
      if (pendingPatchParse) {
        await pendingPatchParse;
      }

      await expect(page.locator('main')).toContainText(/sikeresen frissültek/i, { timeout: 10_000 });
      expect(pageErrors).toEqual([]);
    } finally {
      page.off('response', handlePartnerPatchResponse);
      if (pendingPatchParse) {
        await pendingPatchParse;
      }

      if (saveRequestSucceeded) {
        if (!savedRecord) {
          throw new Error(
            `VISSZAÁLLÍTÁSI HIBA: A teszt mentése után nem rögzíthető a módosított rekord állapota a Teszt Iskola (${TESZT_ISKOLA_PARTNER_ID}) rekordján, ezért a CAS-védett visszaállítás nem hajtható végre.`
          );
        }

        const casFields = [
          'name',
          'slug',
          'category',
          'official_name',
          'partner_type',
          'contact_person_name',
          'contact_person_title',
          'contact_email',
          'contact_phone',
          'address',
          'zip_code',
          'city',
          'county',
          'website_url',
          'business_hours',
          'description',
          'detailed_description',
          'logo_url',
          'cover_url',
          'logo_bg',
          'operating_area',
          'inquiry_email',
          'social_facebook',
          'social_linkedin',
          'social_instagram',
          'social_youtube',
          'seo_title',
          'seo_description',
          'is_indexable',
          'is_verified',
          'status',
          'is_featured',
        ] as const;

        let restoreQuery = authedClient
          .from('partners')
          .update(originalSnapshot)
          .eq('id', TESZT_ISKOLA_PARTNER_ID);

        for (const field of casFields) {
          const expectedVal = savedRecord[field];
          if (expectedVal === null) {
            restoreQuery = restoreQuery.is(field, null);
          } else if (typeof expectedVal === 'string' || typeof expectedVal === 'boolean') {
            restoreQuery = restoreQuery.eq(field, expectedVal);
          }
        }

        const { data: restoredRows, error: restoreError } = await restoreQuery.select('id');

        if (restoreError) {
          throw new Error(
            `VISSZAÁLLÍTÁSI HIBA: A Teszt Iskola (${TESZT_ISKOLA_PARTNER_ID}) eredeti adatainak visszaállítása sikertelen: ${restoreError.message}`
          );
        }

        if (!Array.isArray(restoredRows) || restoredRows.length !== 1) {
          throw new Error(
            `VISSZAÁLLÍTÁSI HIBA (CAS konfliktus): A feltételes visszaállító UPDATE (id=${TESZT_ISKOLA_PARTNER_ID}) nem pontosan 1 rekordot módosított (módosított sorok: ${restoredRows?.length ?? 0}).`
          );
        }

        const { data: verifiedRow, error: verifyError } = await authedClient
          .from('partners')
          .select(selectColumns)
          .eq('id', TESZT_ISKOLA_PARTNER_ID)
          .single();

        if (verifyError || !verifiedRow) {
          throw new Error(
            `VISSZAÁLLÍTÁSI HIBA: A visszaállított Teszt Iskola (${TESZT_ISKOLA_PARTNER_ID}) rekord utólagos ellenőrzése sikertelen: ${verifyError?.message || 'üres válasz'}`
          );
        }

        expect(verifiedRow).toEqual(originalSnapshot);
      }
    }
  });
});
