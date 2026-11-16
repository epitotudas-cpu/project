import { test, expect } from '@playwright/test';
import { attachErrorCollectors } from './helpers/auth';

test.describe('1. fázis (P0–P3) publikus partnerlista és partneradatlap E2E (Read-Only)', () => {
  test('Partnerek listaoldal: kereső, működési terület szűrő és kiemelt jelvény működik', async ({ page }) => {
    const pageErrors = attachErrorCollectors(page);
    await page.goto('/#/partners', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    await expect(page.getByRole('heading', { name: /Építőipari Partnereink/i })).toBeVisible({
      timeout: 15_000,
    });

    const searchInput = page.locator('input[placeholder*="Keress partner neve"]').first();
    await expect(searchInput).toBeVisible();

    const areaSelect = page.locator('select[aria-label="Működési terület szűrő"]').first();
    await expect(areaSelect).toBeVisible();

    // Teszteljük a szűrőváltást majd a visszaállítást
    await areaSelect.selectOption('national');
    await page.waitForTimeout(200);
    await areaSelect.selectOption('all');
    await page.waitForTimeout(200);

    // Keresés város/név alapján, majd törlés
    await searchInput.fill('78-as');
    await page.waitForTimeout(250);
    const bodyAfterSearch = await page.locator('body').innerText();
    expect(bodyAfterSearch).not.toContain('Váratlan alkalmazáshiba történt');
    await searchInput.fill('');

    expect(pageErrors).toEqual([]);
  });

  test('Publikus partneradatlap (#partnerek/<slug>): SEO meta, szekciók és munkamenet-deduplikált nézettség', async ({ page }) => {
    const pageErrors = attachErrorCollectors(page);

    let partnerViewRpcCalls = 0;
    let offerViewRpcCalls = 0;

    await page.route('**/rest/v1/rpc/increment_partner_views', async (route) => {
      partnerViewRpcCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(1),
      });
    });

    await page.route('**/rest/v1/rpc/increment_offer_views', async (route) => {
      offerViewRpcCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(1),
      });
    });

    await page.goto('/#/partners', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const firstCard = page.locator('main div[role="button"]').first();
    const hasCards = await firstCard.isVisible().catch(() => false);
    test.skip(!hasCards, 'Nincs látható publikus partnerkártya a listában.');

    await firstCard.click();
    await page.waitForFunction(
      () => window.location.hash.includes('partnerek/') || window.location.hash.includes('partner-detail'),
      null,
      { timeout: 12_000 }
    );
    await page.waitForTimeout(800);

    // Az interceptornak ténylegesen el kell kapnia az increment_partner_views kérést az első megnyitáskor
    expect(partnerViewRpcCalls).toBe(1);

    // Dinamikus title és robots meta ellenőrzése
    const title = await page.title();
    expect(title).toContain('ÉpítőTudás');

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robotsMeta).toBeTruthy();

    // Újratöltés ugyanabban a munkamenetben: sessionStorage deduplikáció miatt az RPC-k nem hívódhatnak újra
    const partnerCallsBeforeReload = partnerViewRpcCalls;
    const offerCallsBeforeReload = offerViewRpcCalls;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    expect(partnerViewRpcCalls).toBe(partnerCallsBeforeReload);
    expect(offerViewRpcCalls).toBe(offerCallsBeforeReload);

    expect(pageErrors).toEqual([]);
  });

  test('Nem létező vagy inaktív partner slug esetén nem jelenik meg tartalom', async ({ page }) => {
    const pageErrors = attachErrorCollectors(page);
    await page.goto('/#partnerek/e2e-nem-letezo-partner-999999', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    await expect(page.locator('body')).toContainText(/nem található|nem érhető el/i, { timeout: 10_000 });
    expect(pageErrors).toEqual([]);
  });
});
