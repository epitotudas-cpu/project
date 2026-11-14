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

async function dismissAnyOpenModal(page: Page) {
  const openModal = page.locator('div.fixed.inset-0').first();
  if (await openModal.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    if (await openModal.isVisible().catch(() => false)) {
      const closeBtn = openModal
        .locator('button:has-text("Mégse"), button:has-text("Bezárás"), button[aria-label*="Bezár"], button:has(svg.lucide-x)')
        .first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(150);
      }
    }
  }
}

async function exerciseSearchInMain(page: Page) {
  const searchInput = page
    .locator('main input[type="search"], main input[placeholder*="Keres"], main input[placeholder*="keres"]')
    .first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill('teszt');
    await page.waitForTimeout(150);
    await searchInput.fill('');
    await page.waitForTimeout(100);
  }
}

test.describe('Hitelesített szerepkörös teljes funkcionális E2E tesztek (Admin / Partner / Oktató)', () => {
  test('Admin fiók: összes admin modul, belső fülek, keresők, modalok és profil működik', async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!email || !password, 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD nincs beállítva (.env.test).');
    test.setTimeout(120_000);

    const pageErrors = attachErrorCollectors(page);
    await loginViaUI(page, email!, password!);

    await page.goto('/#/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const initialText = await page.locator('body').innerText();
    expect(initialText).not.toContain('Hozzáférés megtagadva');
    expect(initialText).toMatch(/Admin|Vezérlőpult|Partnerek|Hirdetések/i);

    const visitedModules: string[] = [];
    const sidebarButtons = page.locator('aside button');
    const btnCount = await sidebarButtons.count();
    expect(btnCount).toBeGreaterThan(5);

    for (let i = 0; i < btnCount; i++) {
      await dismissAnyOpenModal(page);
      const btn = sidebarButtons.nth(i);
      const label = (await btn.innerText()).trim();
      if (!label || /Kijelentkezés|Főoldal|Vissza/i.test(label)) continue;
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(300);
        visitedModules.push(label);

        const text = await page.locator('body').innerText();
        expect(text, `Admin modul hibára futott: ${label}`).not.toContain('Váratlan alkalmazáshiba történt');
        expect(text.trim().length, `Admin modul üres maradt: ${label}`).toBeGreaterThan(40);

        await exerciseSearchInMain(page);
      }
    }
    expect(visitedModules.length).toBeGreaterThan(5);

    // Deep-check Partnerek tabs & invite modal
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
      const newInviteBtn = page.locator('main button').filter({ hasText: /Új meghívó|Meghívó küldése/i }).first();
      if (await newInviteBtn.isVisible().catch(() => false)) {
        await newInviteBtn.click();
        await page.waitForTimeout(200);
        await dismissAnyOpenModal(page);
      }
    }

    // Deep-check Hirdetések tabs & contracts modal
    const adsNav = page.locator('aside button').filter({ hasText: /Hirdetések/i }).first();
    if (await adsNav.isVisible()) {
      await adsNav.click();
      await page.waitForTimeout(450);
      for (const adTab of ['Kampányok', 'Hirdetők', 'Helyek', 'Csomagok', 'Fizetések', 'Szerződések', 'Értesítések']) {
        const tabBtn = page.locator('main button').filter({ hasText: new RegExp(adTab, 'i') }).first();
        if (await tabBtn.isVisible().catch(() => false)) {
          await tabBtn.click();
          await page.waitForTimeout(200);
        }
      }
      const newContractBtn = page.locator('main button').filter({ hasText: /Új szerződés/i }).first();
      if (await newContractBtn.isVisible().catch(() => false)) {
        await newContractBtn.click();
        await page.waitForTimeout(200);
        await dismissAnyOpenModal(page);
      }
    }

    // Check Profile route & tabs
    await page.goto('/#/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(450);
    const profileText = await page.locator('body').innerText();
    expect(profileText.length).toBeGreaterThan(80);
    expect(profileText).not.toContain('Váratlan alkalmazáshiba történt');

    expect(pageErrors).toEqual([]);
  });

  test('Szerkesztő fiók: kihagyva (nincs aktív editor szerepkörű tesztfiók)', async () => {
    test.skip(process.env.E2E_RUN_EDITOR !== 'true', 'Editor tesztfiók kihagyva a felhasználó kérésére.');
  });

  test('Partner fiók: összes partneri menü, szerződések, keresők, modalok, profil és RBAC védelem', async ({ page }) => {
    const email = process.env.E2E_PARTNER_EMAIL;
    const password = process.env.E2E_PARTNER_PASSWORD;
    test.skip(!email || !password, 'E2E_PARTNER_EMAIL / E2E_PARTNER_PASSWORD nincs beállítva (.env.test).');
    test.setTimeout(90_000);

    const pageErrors = attachErrorCollectors(page);
    await loginViaUI(page, email!, password!);

    await page.goto('/#/partner', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Szerződések|Partner|Kampány|Vezérlőpult/i, {
      timeout: 15_000,
    });

    const partnerText = await page.locator('body').innerText();
    expect(partnerText).not.toContain('Partneri Bejelentkezés Szükséges');

    // Check contract review modal on Partner Dashboard if a contract button exists
    const reviewContractBtn = page
      .locator('main button')
      .filter({ hasText: /Megtekintés|Elfogadás|Szerződés/i })
      .first();
    if (await reviewContractBtn.isVisible().catch(() => false)) {
      await reviewContractBtn.click();
      await page.waitForTimeout(250);
      await dismissAnyOpenModal(page);
    }

    // Click through all Partner sidebar views & exercise search
    const sidebarButtons = page.locator('aside button');
    const btnCount = await sidebarButtons.count();
    for (let i = 0; i < btnCount; i++) {
      await dismissAnyOpenModal(page);
      const btn = sidebarButtons.nth(i);
      const label = (await btn.innerText()).trim();
      if (!label || /Kijelentkezés|Főoldal|Vissza/i.test(label)) continue;
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(350);
        const text = await page.locator('body').innerText();
        expect(text, `Partner nézet hibára futott: ${label}`).not.toContain('Váratlan alkalmazáshiba történt');
        await exerciseSearchInMain(page);
      }
    }

    // Check Profile route
    await page.goto('/#/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(450);
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

  test('Oktató fiók: összes tanári menüpont, keresők, modalok, publikus tanulás, profil és RBAC védelem', async ({ page }) => {
    const email = process.env.E2E_TEACHER_EMAIL;
    const password = process.env.E2E_TEACHER_PASSWORD;
    test.skip(!email || !password, 'E2E_TEACHER_EMAIL / E2E_TEACHER_PASSWORD nincs beállítva (.env.test).');
    test.setTimeout(90_000);

    const pageErrors = attachErrorCollectors(page);
    await loginViaUI(page, email!, password!);

    await page.goto('/#/teacher', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    const teacherText = await page.locator('body').innerText();
    expect(teacherText).not.toContain('Hozzáférés megtagadva');
    expect(teacherText).toMatch(/Tanár panel|Oktató|Osztály|Tananyag/i);

    // Click through all Teacher sidebar / navigation buttons
    const teacherNavLabels = [
      'Áttekintés',
      'Osztályaim',
      'Tanulóim',
      'Tananyagok',
      'Tananyag összeállítása',
      'Kiosztott tananyagok',
      'Tesztek',
      'Előrehaladás',
      'Saját beállítások',
    ];

    for (const label of teacherNavLabels) {
      await dismissAnyOpenModal(page);
      const navBtn = page.locator('button').filter({ hasText: new RegExp(`^${label}$|${label}`, 'i') }).first();
      if (await navBtn.isVisible().catch(() => false)) {
        await navBtn.click();
        await page.waitForTimeout(300);
        const text = await page.locator('body').innerText();
        expect(text, `Tanári nézet hibára futott: ${label}`).not.toContain('Váratlan alkalmazáshiba történt');
        await exerciseSearchInMain(page);
      }
    }
    await dismissAnyOpenModal(page);

    // Check public learning/courses/calculations while logged in as Teacher
    for (const hash of ['#/learning', '#/courses', '#/calculations']) {
      await page.goto(`/${hash}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      const text = await page.locator('body').innerText();
      expect(text.length).toBeGreaterThan(100);
      expect(text).not.toContain('Váratlan alkalmazáshiba történt');
    }

    // Check Profile route
    await page.goto('/#/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(450);
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
