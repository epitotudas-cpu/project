import { test, expect, type Page } from '@playwright/test';

async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitBtn.click();

  await page.waitForFunction(
    () => !window.location.hash.includes('login'),
    null,
    { timeout: 15_000 }
  );
  await page.waitForTimeout(600);
}

function attachErrorCollectors(page: Page) {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  return pageErrors;
}

test.describe('Hitelesített szerepkörös mély E2E tesztek (Admin / Partner / Oktató)', () => {
  test('Admin munkamenet: teljes admin menü, Partnerek fülek, Szerződések modal és Profil hiba nélkül', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!email || !password, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD nincs beállítva (.env.test).');

    const pageErrors = attachErrorCollectors(page);
    await loginViaUI(page, email!, password!);

    await page.goto('/#/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const initialText = await page.locator('body').innerText();
    expect(initialText).not.toContain('Hozzáférés megtagadva');
    expect(initialText).toMatch(/Admin|Vezérlőpult|Partnerek|Hirdetések/i);

    // Click through all visible sidebar navigation buttons in AdminLayout
    const sidebarButtons = page.locator('aside button');
    const btnCount = await sidebarButtons.count();
    expect(btnCount).toBeGreaterThan(3);

    for (let i = 0; i < btnCount; i++) {
      const btn = sidebarButtons.nth(i);
      const label = (await btn.innerText()).trim();
      if (!label || /Kijelentkezés|Főoldal|Vissza/i.test(label)) continue;
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(250);
        const text = await page.locator('body').innerText();
        expect(text, `Admin nézet hibára futott: ${label}`).not.toContain('Váratlan alkalmazáshiba történt');
      }
    }

    // Deep-check Partnerek tabs (Partnerek / Meghívók / Jelentkezések)
    const partnersNav = page.locator('aside button').filter({ hasText: /Partnerek/i }).first();
    if (await partnersNav.isVisible()) {
      await partnersNav.click();
      await page.waitForTimeout(450);
      for (const tabText of ['Meghívók', 'Jelentkezések', 'Partnerek']) {
        const tabBtn = page.locator('main button').filter({ hasText: new RegExp(tabText, 'i') }).first();
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(250);
        }
      }
    }

    // Deep-check Hirdetések & Szerződések tab + modal
    const adsNav = page.locator('aside button').filter({ hasText: /Hirdetések/i }).first();
    if (await adsNav.isVisible()) {
      await adsNav.click();
      await page.waitForTimeout(450);
      const contractsTab = page.locator('main button').filter({ hasText: /Szerződések/i }).first();
      if (await contractsTab.isVisible()) {
        await contractsTab.click();
        await page.waitForTimeout(300);
        const newContractBtn = page.locator('main button').filter({ hasText: /Új szerződés/i }).first();
        if (await newContractBtn.isVisible()) {
          await newContractBtn.click();
          await page.waitForTimeout(200);
          await page.keyboard.press('Escape');
        }
      }
    }

    // Check Profile route for Admin
    await page.goto('/#/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const profileText = await page.locator('body').innerText();
    expect(profileText.length).toBeGreaterThan(80);
    expect(profileText).not.toContain('Váratlan alkalmazáshiba történt');

    expect(pageErrors).toEqual([]);
  });

  test('Szerkesztő munkamenet: kihagyva (nincs aktív editor szerepkörű tesztfiók)', async () => {
    test.skip(process.env.E2E_RUN_EDITOR !== 'true', 'Editor tesztfiók kihagyva a felhasználó kérésére.');
  });

  test('Partner munkamenet: teljes partneri menü, Szerződések, Profil és RBAC védelem', async ({ page }) => {
    const email = process.env.E2E_PARTNER_EMAIL;
    const password = process.env.E2E_PARTNER_PASSWORD;
    test.skip(!email || !password, 'E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD nincs beállítva (.env.test).');

    const pageErrors = attachErrorCollectors(page);
    await loginViaUI(page, email!, password!);

    await page.goto('/#/partner', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const partnerText = await page.locator('body').innerText();
    expect(partnerText).not.toContain('Partneri Bejelentkezés Szükséges');
    expect(partnerText).toMatch(/Szerződések|Partner|Kampány|Vezérlőpult/i);

    // Click through all visible sidebar navigation buttons in PartnerLayout
    const sidebarButtons = page.locator('aside button');
    const btnCount = await sidebarButtons.count();
    for (let i = 0; i < btnCount; i++) {
      const btn = sidebarButtons.nth(i);
      const label = (await btn.innerText()).trim();
      if (!label || /Kijelentkezés|Főoldal|Vissza/i.test(label)) continue;
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(300);
        const text = await page.locator('body').innerText();
        expect(text, `Partner nézet hibára futott: ${label}`).not.toContain('Váratlan alkalmazáshiba történt');
      }
    }

    // Check Profile route
    await page.goto('/#/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    expect((await page.locator('body').innerText()).length).toBeGreaterThan(80);

    // RBAC isolation: Partner must NOT access Admin or Editor
    for (const restricted of ['#/admin', '#/szerkeszto']) {
      await page.goto(`/${restricted}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(550);
      const restrictedText = await page.locator('body').innerText();
      expect(restrictedText, `Partner hozzáfért: ${restricted}`).toMatch(
        /Hozzáférés megtagadva|Bejelentkezés|Nincs jogosultság/i
      );
    }

    expect(pageErrors).toEqual([]);
  });

  test('Oktató munkamenet: oktatói vezérlőpult fülek, Profil és RBAC védelem', async ({ page }) => {
    const email = process.env.E2E_TEACHER_EMAIL;
    const password = process.env.E2E_TEACHER_PASSWORD;
    test.skip(!email || !password, 'E2E_TEACHER_EMAIL / E2E_TEACHER_PASSWORD nincs beállítva (.env.test).');

    const pageErrors = attachErrorCollectors(page);
    await loginViaUI(page, email!, password!);

    await page.goto('/#/teacher', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const teacherText = await page.locator('body').innerText();
    expect(teacherText).not.toContain('Hozzáférés megtagadva');
    expect(teacherText).toMatch(/Oktató|Osztály|Tananyag|Diák/i);

    // Click through visible tab/section buttons in TeacherDashboardPage
    const tabButtons = page.locator('main button').filter({
      hasText: /Osztály|Diák|Tananyag|Meghívó|Áttekintés/i,
    });
    const tabCount = await tabButtons.count();
    for (let i = 0; i < Math.min(tabCount, 6); i++) {
      // Close any open modal before clicking next button
      const openModal = page.locator('div.fixed.inset-0').first();
      if (await openModal.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
        if (await openModal.isVisible().catch(() => false)) {
          const closeBtn = openModal.locator('button:has-text("Mégse"), button:has-text("Bezárás"), button[aria-label*="Bezár"]').first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
            await page.waitForTimeout(150);
          } else {
            break;
          }
        }
      }

      const btn = tabButtons.nth(i);
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(250);
        const text = await page.locator('body').innerText();
        expect(text).not.toContain('Váratlan alkalmazáshiba történt');
      }
    }

    // Ensure no modal remains open before navigating away
    const remainingModal = page.locator('div.fixed.inset-0').first();
    if (await remainingModal.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }

    // Check Profile route
    await page.goto('/#/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    expect((await page.locator('body').innerText()).length).toBeGreaterThan(80);

    // RBAC isolation: Teacher must NOT access Admin or Editor
    for (const restricted of ['#/admin', '#/szerkeszto']) {
      await page.goto(`/${restricted}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(550);
      const restrictedText = await page.locator('body').innerText();
      expect(restrictedText, `Oktató hozzáfért: ${restricted}`).toMatch(
        /Hozzáférés megtagadva|Bejelentkezés|Nincs jogosultság/i
      );
    }

    // Navigating to #/partner as a teacher routes to Tanár panel or access-denied, never Partner Admin/Contracts
    await page.goto('/#/partner', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(550);
    const partnerAttemptText = await page.locator('body').innerText();
    expect(partnerAttemptText).toMatch(/Tanár panel|Hozzáférés megtagadva/i);

    expect(pageErrors).toEqual([]);
  });
});
