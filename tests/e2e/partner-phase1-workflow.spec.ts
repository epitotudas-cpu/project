import { test, expect, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  assertAuthenticatedPartnerIsSafe,
  assertPageNotProtectedPartner,
  attachErrorCollectors,
  createAuthenticatedContext,
  isProtectedProductionEmail,
  PROTECTED_PRODUCTION_PARTNERS,
} from './helpers/auth';

const DEFAULT_SUPABASE_URL = 'https://olmavxcmkvvcebgqxohe.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sbWF2eGNta3Z2Y2ViZ3F4b2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjAzNzksImV4cCI6MjA5NTgzNjM3OX0.uwz9kRkODHafloihBfDauFTAGk4dTb2X9TJrnF_vwHw';

function createUniqueRunTag(): string {
  return `[E2E-${Date.now()}-${Math.random().toString(36).slice(2, 8)}]`;
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

async function getAuthedClientFromPage(page: Page): Promise<{
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
        // Ignore malformed entry
      }
    }
    return null;
  });

  if (!accessToken) {
    throw new Error('Hiányzó Supabase access token a böngésző munkamenetéből.');
  }

  const { url, anonKey } = getSupabaseConfig();
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: userData, error } = await client.auth.getUser(accessToken);
  if (error || !userData?.user?.id) {
    throw new Error(`Felhasználói session igazolása sikertelen: ${error?.message || 'nincs user ID'}`);
  }

  return { client, userId: userData.user.id };
}

async function resolveOwnPartnerId(client: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await client
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error || !data?.partner_id) {
    throw new Error(`Partnerkapcsolat (partner_users) nem állapítható meg: ${error?.message || 'nincs rekord'}`);
  }

  if (PROTECTED_PRODUCTION_PARTNERS.ids.includes(String(data.partner_id).toLowerCase())) {
    throw new Error(
      `BIZTONSÁGI TILTÁS: A feloldott partner_id (${data.partner_id}) a védett éles partnerhez tartozik.`
    );
  }

  return String(data.partner_id);
}

async function cleanupOfferById(client: SupabaseClient, offerId: string): Promise<void> {
  const { error } = await client.from('partner_offers').delete().eq('id', offerId);
  if (error) {
    throw new Error(`Ajánlat takarítása sikertelen (id=${offerId}): ${error.message}`);
  }
}

async function cleanupMaterialByIdAsAdmin(adminClient: SupabaseClient, materialId: string): Promise<void> {
  const { data: row, error: readErr } = await adminClient
    .from('app_configs')
    .select('value, updated_at')
    .eq('key', '__SYSTEM_CONFIG_MATERIALS_ITEMS__')
    .maybeSingle();

  if (readErr) {
    throw new Error(`Termék takarítás előtti olvasás sikertelen (id=${materialId}): ${readErr.message}`);
  }
  if (!row || !Array.isArray(row.value)) {
    throw new Error(`Termék takarítás sikertelen: érvénytelen app_configs állapot (id=${materialId}).`);
  }

  const nextList = (row.value as Array<{ id?: string }>).filter((item) => item?.id !== materialId);
  if (nextList.length === row.value.length) {
    return;
  }

  const { data: updated, error: updateErr } = await adminClient
    .from('app_configs')
    .update({
      value: nextList,
      updated_at: new Date().toISOString(),
    })
    .eq('key', '__SYSTEM_CONFIG_MATERIALS_ITEMS__')
    .eq('updated_at', row.updated_at)
    .select('key')
    .maybeSingle();

  if (updateErr || !updated) {
    throw new Error(
      `Termék CAS takarítása sikertelen (id=${materialId}): ${updateErr?.message || 'konkurens módosítás'}`
    );
  }
}

async function openPartnerSidebarView(page: Page, labelRegex: RegExp) {
  const btn = page.locator('aside button').filter({ hasText: labelRegex }).first();
  await expect(btn).toBeVisible({ timeout: 12_000 });
  await btn.click();
  await page.waitForTimeout(450);
}

test.describe('1. fázis (P0–P2) & 0.C hitelesített partner + admin munkafolyamat E2E', () => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  const partner1Email = process.env.E2E_PARTNER_EMAIL;
  const partner1Password = process.env.E2E_PARTNER_PASSWORD;
  const partner2Email = process.env.E2E_PARTNER2_EMAIL;
  const partner2Password = process.env.E2E_PARTNER2_PASSWORD;

  test.beforeAll(() => {
    if (isProtectedProductionEmail(partner1Email) || isProtectedProductionEmail(partner2Email)) {
      throw new Error(
        'BIZTONSÁGI TILTÁS: E2E_PARTNER_EMAIL vagy E2E_PARTNER2_EMAIL a 78-as Építők Kft. éles fiókjára (muck@hotmail.hu) mutat!'
      );
    }
  });

  test('Ajánlat létrehozás, lejárat, admin felügyelet és UUID-alapú takarítás', async ({ browser }) => {
    test.skip(
      !adminEmail || !adminPassword || !partner1Email || !partner1Password || isProtectedProductionEmail(partner1Email),
      'Dedikált nem-78-as E2E_PARTNER_EMAIL és E2E_ADMIN_EMAIL szükséges.'
    );
    test.setTimeout(120_000);

    const { context: partnerCtx, page: partnerPage } = await createAuthenticatedContext(
      browser,
      partner1Email!,
      partner1Password!
    );
    const { context: adminCtx, page: adminPage } = await createAuthenticatedContext(
      browser,
      adminEmail!,
      adminPassword!
    );

    const offerTitle = `${createUniqueRunTag()} Tavaszi Szigetelési Akció`;
    let createdOfferId: string | null = null;
    let adminClientForCleanup: SupabaseClient | null = null;

    try {
      const partnerErrors = attachErrorCollectors(partnerPage);
      const adminErrors = attachErrorCollectors(adminPage);

      await assertAuthenticatedPartnerIsSafe(partnerPage, partner1Email);
      await assertAuthenticatedPartnerIsSafe(adminPage, adminEmail);

      await partnerPage.goto('/#/partner', { waitUntil: 'domcontentloaded' });
      await partnerPage.waitForTimeout(700);
      await assertPageNotProtectedPartner(partnerPage);

      const { client: adminClient } = await getAuthedClientFromPage(adminPage);
      adminClientForCleanup = adminClient;

      await openPartnerSidebarView(partnerPage, /Saját Ajánlatok/i);
      await partnerPage.getByRole('button', { name: /Új ajánlat feladása/i }).click();

      await partnerPage.locator('input[placeholder*="Ajánlat címe"]').fill(offerTitle);
      await partnerPage.locator('input[placeholder*="Kedvezmény mértéke"]').fill('15%');
      await partnerPage.locator('input[type="date"]').fill('2099-12-31');
      await partnerPage.locator('textarea[placeholder*="Részletes leírás"]').fill('E2E automatikus ajánlat.');

      const offerResponsePromise = partnerPage.waitForResponse(
        (res) => res.url().includes('/rest/v1/partner_offers') && res.request().method() === 'POST',
        { timeout: 15_000 }
      );
      await partnerPage.getByRole('button', { name: /Ajánlat mentése/i }).click();

      const offerResponse = await offerResponsePromise;
      expect(offerResponse.ok()).toBe(true);
      const createdJson = (await offerResponse.json()) as { id?: string } | Array<{ id?: string }>;
      const resolvedId = Array.isArray(createdJson) ? createdJson[0]?.id : createdJson?.id;
      expect(resolvedId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      createdOfferId = resolvedId!;

      await expect(partnerPage.locator('main')).toContainText(offerTitle, { timeout: 12_000 });

      await adminPage.goto('/#/admin', { waitUntil: 'domcontentloaded' });
      await adminPage.waitForTimeout(700);
      await adminPage.locator('aside button').filter({ hasText: /Partnerek/i }).first().click();
      await adminPage.waitForTimeout(600);

      await adminPage.getByRole('button', { name: /Ajánlatok \(/i }).click();
      await expect(adminPage.locator('main')).toContainText(offerTitle, { timeout: 12_000 });

      expect(partnerErrors).toEqual([]);
      expect(adminErrors).toEqual([]);
    } finally {
      try {
        if (createdOfferId && adminClientForCleanup) {
          await cleanupOfferById(adminClientForCleanup, createdOfferId);
        }
      } finally {
        await partnerCtx.close();
        await adminCtx.close();
      }
    }
  });

  test('0.C Partneri termék: beküldés -> admin elutasítás -> újraküldés -> publikálás és azonosító-alapú takarítás', async ({
    browser,
  }) => {
    test.skip(
      !adminEmail ||
        !adminPassword ||
        !partner1Email ||
        !partner1Password ||
        isProtectedProductionEmail(partner1Email),
      'Dedikált nem-78-as E2E_PARTNER_EMAIL és E2E_ADMIN_EMAIL szükséges.'
    );
    test.setTimeout(150_000);

    const { context: partnerCtx, page: partnerPage } = await createAuthenticatedContext(
      browser,
      partner1Email!,
      partner1Password!
    );
    const { context: adminCtx, page: adminPage } = await createAuthenticatedContext(
      browser,
      adminEmail!,
      adminPassword!
    );

    const productName = `${createUniqueRunTag()} E2E Homlokzati Lemez`;
    let createdMaterialId: string | null = null;
    let adminClientForCleanup: SupabaseClient | null = null;

    try {
      await assertAuthenticatedPartnerIsSafe(partnerPage, partner1Email);
      await assertAuthenticatedPartnerIsSafe(adminPage, adminEmail);

      await partnerPage.goto('/#/partner', { waitUntil: 'domcontentloaded' });
      await partnerPage.waitForTimeout(700);
      await assertPageNotProtectedPartner(partnerPage);

      const { client: adminClient } = await getAuthedClientFromPage(adminPage);
      adminClientForCleanup = adminClient;

      await openPartnerSidebarView(partnerPage, /Termékek & Anyagok/i);
      await partnerPage.getByRole('button', { name: /Új Építőanyag Hozzáadása/i }).click();

      await partnerPage.locator('input[placeholder*="Masterplast"]').fill(productName);
      await partnerPage.getByRole('button', { name: /2\. Leírás/i }).click();
      await partnerPage.locator('textarea[placeholder*="Néhány mondatos"]').fill('E2E teszt termék.');

      const createMatPromise = partnerPage.waitForResponse(
        (res) => res.url().includes('/rest/v1/rpc/upsert_partner_material_item') && res.request().method() === 'POST',
        { timeout: 15_000 }
      );
      await partnerPage.getByRole('button', { name: /Beküldés Ellenőrzésre/i }).click();

      const createMatRes = await createMatPromise;
      expect(createMatRes.ok()).toBe(true);
      const createdMatJson = (await createMatRes.json()) as { id?: string };
      expect(createdMatJson?.id).toBeTruthy();
      createdMaterialId = createdMatJson.id!;

      await expect(partnerPage.locator('main')).toContainText(productName, { timeout: 12_000 });

      await adminPage.goto('/#/admin', { waitUntil: 'domcontentloaded' });
      await adminPage.waitForTimeout(700);
      await adminPage.locator('aside button').filter({ hasText: /Építőanyagok|Anyagok/i }).first().click();
      await adminPage.waitForTimeout(600);

      await adminPage.getByRole('button', { name: /Jóváhagyásra vár/i }).click();
      await expect(adminPage.locator('main')).toContainText(productName, { timeout: 12_000 });

      const pendingRow = adminPage.locator('tr, div').filter({ hasText: productName }).first();
      await pendingRow.locator('button[title="Elutasítás indoklással"]').click();
      await adminPage.locator('textarea').last().fill('E2E hiánypótlás szükséges.');
      await adminPage.getByRole('button', { name: /Elutasítás Beküldése/i }).click();
      await adminPage.waitForTimeout(500);

      await partnerPage.reload({ waitUntil: 'domcontentloaded' });
      await openPartnerSidebarView(partnerPage, /Termékek & Anyagok/i);
      await expect(partnerPage.locator('main')).toContainText(productName, { timeout: 12_000 });

      const rejectedRow = partnerPage.locator('tr, div').filter({ hasText: productName }).first();
      await rejectedRow.locator('button[title*="Szerkeszt"]').first().click();
      await partnerPage.getByRole('button', { name: /Beküldés Ellenőrzésre/i }).click();
      await partnerPage.waitForTimeout(500);

      await adminPage.reload({ waitUntil: 'domcontentloaded' });
      await adminPage.locator('aside button').filter({ hasText: /Építőanyagok|Anyagok/i }).first().click();
      await adminPage.getByRole('button', { name: /Jóváhagyásra vár/i }).click();
      const resubmitRow = adminPage.locator('tr, div').filter({ hasText: productName }).first();
      await resubmitRow.locator('button[title="Jóváhagyás és Publikálás"]').click();
      await adminPage.waitForTimeout(500);
    } finally {
      try {
        if (createdMaterialId && adminClientForCleanup) {
          await cleanupMaterialByIdAsAdmin(adminClientForCleanup, createdMaterialId);
        }
      } finally {
        await partnerCtx.close();
        await adminCtx.close();
      }
    }
  });

  test('Partner 2 jogosultsági izoláció: Partner 1 termékének módosítása és törlése elutasítva', async ({
    browser,
  }) => {
    test.skip(
      !partner1Email ||
        !partner1Password ||
        !partner2Email ||
        !partner2Password ||
        isProtectedProductionEmail(partner1Email) ||
        isProtectedProductionEmail(partner2Email),
      'Mindkét dedikált nem-78-as partnerfiók (E2E_PARTNER_EMAIL és E2E_PARTNER2_EMAIL) szükséges az izolációs teszthez.'
    );
    test.setTimeout(120_000);

    const { context: p1Ctx, page: p1Page } = await createAuthenticatedContext(
      browser,
      partner1Email!,
      partner1Password!
    );
    const { context: p2Ctx, page: p2Page } = await createAuthenticatedContext(
      browser,
      partner2Email!,
      partner2Password!
    );

    const productName = `${createUniqueRunTag()} E2E Izolációs Termék`;
    let createdMaterialId: string | null = null;
    let partner1Id: string | null = null;
    let p1ClientForCleanup: SupabaseClient | null = null;

    try {
      await assertAuthenticatedPartnerIsSafe(p1Page, partner1Email);
      await assertAuthenticatedPartnerIsSafe(p2Page, partner2Email);

      await p1Page.goto('/#/partner', { waitUntil: 'domcontentloaded' });
      await p1Page.waitForTimeout(700);
      await assertPageNotProtectedPartner(p1Page);

      await p2Page.goto('/#/partner', { waitUntil: 'domcontentloaded' });
      await p2Page.waitForTimeout(700);
      await assertPageNotProtectedPartner(p2Page);

      const { client: p1Client, userId: p1UserId } = await getAuthedClientFromPage(p1Page);
      const { client: p2Client, userId: p2UserId } = await getAuthedClientFromPage(p2Page);
      p1ClientForCleanup = p1Client;

      partner1Id = await resolveOwnPartnerId(p1Client, p1UserId);
      const partner2Id = await resolveOwnPartnerId(p2Client, p2UserId);
      expect(partner2Id).not.toBe(partner1Id);

      // 1. Partner 1 létrehoz egy saját piszkozat terméket és rögzíti a valódi rekordazonosítót
      const { data: createdItem, error: createErr } = await p1Client.rpc('upsert_partner_material_item', {
        p_partner_id: partner1Id,
        p_item: {
          name: productName,
          category: 'Szigetelés',
          short_description: 'Eredeti Partner 1 rövid leírás',
          description: 'Eredeti Partner 1 leírás',
          status: 'draft',
        },
      });
      expect(createErr).toBeNull();
      const createdId = (createdItem as { id?: string } | null)?.id;
      expect(createdId).toBeTruthy();
      createdMaterialId = createdId!;

      // 2. Partner 2 megkísérli Partner 1 termékének módosítását Partner 1 partner_id-jával -> elutasítva
      const { error: hijackPartnerErr } = await p2Client.rpc('upsert_partner_material_item', {
        p_partner_id: partner1Id,
        p_item: {
          id: createdMaterialId,
          name: 'Módosított név Partner 2 által',
          status: 'draft',
        },
      });
      expect(hijackPartnerErr).toBeTruthy();

      // 3. Partner 2 megkísérli Partner 1 termékének felülírását saját partner_id-jával -> elutasítva
      const { error: overwriteItemErr } = await p2Client.rpc('upsert_partner_material_item', {
        p_partner_id: partner2Id,
        p_item: {
          id: createdMaterialId,
          name: 'Átvett név Partner 2 által',
          status: 'draft',
        },
      });
      expect(overwriteItemErr).toBeTruthy();

      // 4. Partner 2 megkísérli Partner 1 termékének törlését -> elutasítva
      const { error: deleteErr } = await p2Client.rpc('delete_partner_material_item', {
        p_partner_id: partner1Id,
        p_item_id: createdMaterialId,
      });
      expect(deleteErr).toBeTruthy();

      // 5. Partner 1 rekordjának változatlanságát ellenőrizzük az app_configs-ból
      const { data: cfgRow, error: readErr } = await p1Client
        .from('app_configs')
        .select('value')
        .eq('key', '__SYSTEM_CONFIG_MATERIALS_ITEMS__')
        .maybeSingle();
      expect(readErr).toBeNull();
      const persistedItem = ((cfgRow?.value as Array<{ id?: string; name?: string; partner_id?: string }>) || []).find(
        (item) => item.id === createdMaterialId
      );
      expect(persistedItem).toBeTruthy();
      expect(persistedItem?.name).toBe(productName);
      expect(persistedItem?.partner_id).toBe(partner1Id);
    } finally {
      try {
        if (createdMaterialId && partner1Id && p1ClientForCleanup) {
          const { error: cleanupErr } = await p1ClientForCleanup.rpc('delete_partner_material_item', {
            p_partner_id: partner1Id,
            p_item_id: createdMaterialId,
          });
          if (cleanupErr) {
            throw new Error(`Partner 1 termék takarítása sikertelen (id=${createdMaterialId}): ${cleanupErr.message}`);
          }
        }
      } finally {
        await p1Ctx.close();
        await p2Ctx.close();
      }
    }
  });
});
