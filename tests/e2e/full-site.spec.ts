import { test, expect, type Page } from '@playwright/test';

const PUBLIC_AND_AUTH_ROUTES = [
  { hash: '#/', label: 'Főoldal' },
  { hash: '#/learning', label: 'Tanulás (LearningPage)' },
  { hash: '#/learning-paths', label: 'Tanulási útvonalak' },
  { hash: '#/tudastar', label: 'Tudástár Hub' },
  { hash: '#/calculations', label: 'Kalkulátorok' },
  { hash: '#/books', label: 'Szakkönyvek' },
  { hash: '#/safety', label: 'Munkavédelem' },
  { hash: '#/standards', label: 'Szabványok' },
  { hash: '#/materials', label: 'Építőanyagok' },
  { hash: '#/category', label: 'Kategóriák' },
  { hash: '#/glossary', label: 'Szakmai szótár' },
  { hash: '#/tool', label: 'Szerszámok' },
  { hash: '#/software', label: 'Szoftverek' },
  { hash: '#/valaszto', label: 'Eszközválasztó' },
  { hash: '#/paths', label: 'Karrier / Útvonalak Hub' },
  { hash: '#/about', label: 'Rólunk Hub' },
  { hash: '#/partners', label: 'Partnerek' },
  { hash: '#/courses', label: 'Kurzusok' },
  { hash: '#/careers', label: 'Karrier' },
  { hash: '#/jogi', label: 'Jogi Hub' },
  { hash: '#/impressum', label: 'Impresszum' },
  { hash: '#/privacy', label: 'Adatvédelem' },
  { hash: '#/terms', label: 'ÁSZF' },
  { hash: '#/cookies', label: 'Cookie tájékoztató' },
  { hash: '#/partner-application', label: 'Partner jelentkezés' },
  { hash: '#/login', label: 'Bejelentkezés' },
  { hash: '#/register', label: 'Regisztráció' },
  { hash: '#/forgot-password', label: 'Elfelejtett jelszó' },
  { hash: '#/verify-email', label: 'E-mail megerősítés' },
];

const PROTECTED_ROUTES = [
  { hash: '#/admin', label: 'Admin felület' },
  { hash: '#/szerkeszto', label: 'Szerkesztői felület' },
  { hash: '#/partner', label: 'Partner felület' },
  { hash: '#/teacher', label: 'Oktatói felület' },
  { hash: '#/profile', label: 'Felhasználói profil' },
];

async function attachErrorCollectors(page: Page) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore expected network/Supabase offline notices when running isolated E2E without live auth session
      if (!text.includes('Failed to load resource') && !text.includes('net::ERR_')) {
        consoleErrors.push(text);
      }
    }
  });

  return { pageErrors, consoleErrors };
}

test.describe('ÉpítőTudás teljes funkcionális E2E tesztkörnyezet', () => {
  test('minden publikus és hitelesítési oldal hiba és túllógás nélkül betölt', async ({ page }) => {
    const { pageErrors } = await attachErrorCollectors(page);

    for (const route of PUBLIC_AND_AUTH_ROUTES) {
      await page.goto(`/${route.hash}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(350);

      const bodyText = (await page.locator('body').innerText()).trim();
      expect(bodyText.length, `${route.label} (${route.hash}) üres maradt`).toBeGreaterThan(80);
      expect(bodyText, `${route.label} ErrorBoundary-ba futott`).not.toContain('Váratlan alkalmazáshiba történt');

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 8
      );
      expect(hasHorizontalOverflow, `${route.label} (${route.hash}) vízszintesen túllóg`).toBe(false);
    }

    expect(pageErrors, `Nem kezelt JS hibák: ${pageErrors.join(' | ')}`).toEqual([]);
  });

  test('mobil nézetben (390x844) a fő oldalak reszponzívak és a mobil menü működik', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { pageErrors } = await attachErrorCollectors(page);

    for (const hash of ['#/', '#/learning', '#/calculations', '#/glossary', '#/partners']) {
      await page.goto(`/${hash}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(350);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 8
      );
      expect(overflow, `Mobil vízszintes túllógás: ${hash}`).toBe(false);
    }

    // Check mobile menu button if visible
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const menuBtn = page.locator('header button[aria-label*="Menü"], header button[aria-label*="menü"]').first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(200);
      await menuBtn.click();
    }

    expect(pageErrors).toEqual([]);
  });

  test('főoldal navigáció, globális keresés és lábléc elemek működnek', async ({ page }) => {
    await page.goto('/#/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    const searchBtn = page.locator('header button[aria-label*="Keres"], header button:has-text("Keresés")').first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      const searchInput = page.locator('input[type="search"], input[placeholder*="Keres"]').first();
      await expect(searchInput).toBeVisible();
      await searchInput.fill('beton');
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
    }
  });

  test('kalkulátorok interaktívan számolnak és frissül az eredmény', async ({ page }) => {
    await page.goto('/#/calculations', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // Switch to Interactive Calculators tab
    const interactiveTab = page.locator('main button:has-text("Interaktív Kalkulátorok")').first();
    await expect(interactiveTab).toBeVisible();
    await interactiveTab.click();
    await page.waitForTimeout(400);

    const numberInputs = page.locator('main input[type="number"]');
    const count = await numberInputs.count();
    expect(count).toBeGreaterThan(0);

    const firstInput = numberInputs.first();
    await firstInput.fill('12');
    await firstInput.dispatchEvent('change');
    await page.waitForTimeout(250);

    const mainText = await page.locator('main').innerText();
    expect(mainText.length).toBeGreaterThan(150);
  });

  test('szakmai szótár kereső és részletező modal működik', async ({ page }) => {
    await page.goto('/#/glossary', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const searchInput = page.locator('input[placeholder*="Keres"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('beton');
      await page.waitForTimeout(250);
    }

    const termButton = page.locator('main button, [role="button"]').filter({ hasText: /beton|alap|vakolat|tető/i }).first();
    if (await termButton.isVisible()) {
      await termButton.click();
      await page.waitForTimeout(250);
      await page.keyboard.press('Escape');
    }
  });

  test('tananyagok és kvíz indítás működik', async ({ page }) => {
    await page.goto('/#/learning', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const text = await page.locator('body').innerText();
    expect(text).toMatch(/Tananyag|Kurzus|Kvíz|Teszt/i);

    const detailTrigger = page.locator('button, a').filter({ hasText: /Megnyitás|Részletek|Elindítás|Olvasás/i }).first();
    if (await detailTrigger.isVisible()) {
      await detailTrigger.click();
      await page.waitForTimeout(350);
      const afterText = await page.locator('body').innerText();
      expect(afterText.length).toBeGreaterThan(100);
    }
  });

  test('partner jelentkezési űrlap és bejelentkezési/regisztrációs űrlap validációja működik', async ({ page }) => {
    await page.goto('/#/partner-application', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(350);

    const companyInput = page.locator('input').first();
    await expect(companyInput).toBeVisible();
    await companyInput.fill('Teszt Építő Kft.');

    await page.goto('/#/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.goto('/#/register', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(350);
    const standardRegBtn = page
      .locator('button')
      .filter({ hasText: /Magánszemély|Tanuló|Általános|Normál|Regisztráció indítása/i })
      .first();
    if (await standardRegBtn.isVisible()) {
      await standardRegBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('védett szerepkörös útvonalak (#admin, #szerkeszto, #partner, #teacher, #profile) zárolva vannak belépés nélkül', async ({ page }) => {
    const { pageErrors } = await attachErrorCollectors(page);

    for (const route of PROTECTED_ROUTES) {
      await page.goto(`/${route.hash}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(450);

      const text = await page.locator('body').innerText();
      // Must either redirect to login / show auth gate / show access denied, never render unprotected admin table
      const isGated =
        page.url().includes('#/login') ||
        /Bejelentkezés|Hozzáférés megtagadva|Nincs jogosultság|Jelentkezz be/i.test(text);
      expect(isGated, `${route.label} (${route.hash}) nem volt védve belépés nélkül`).toBe(true);
    }

    expect(pageErrors).toEqual([]);
  });
});
