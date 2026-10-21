import { test, expect } from '@playwright/test';
import pages from '../worker/pages.json' with { type: 'json' };

// Isolate browser checks from the external CAPTCHA; never submit a real enquiry.
test.beforeEach(async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({ contentType: 'application/javascript', body: 'window.turnstile={render:()=>1,remove:()=>{},reset:()=>{}}; window.trecaliciTurnstileReady?.();' }));
});

for (const width of [390, 1440]) {
  test(`all templates render and expose correct metadata at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [path, meta] of Object.entries(pages)) {
      const response = await page.goto(path);
      expect(response.status()).toBe(200);
      await expect(page).toHaveTitle(meta.title);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://trecalici.no' + path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('img').evaluateAll(images => images.every(img => img.loading === 'lazy' || (img.complete && img.naturalWidth > 0)))).toBe(true);
      if (path.startsWith('/vinglass/')) {
        await expect(page.getByRole('complementary', { name: 'Kontakt om vinglass' })).toHaveCount(1);
        await expect(page.getByRole('region', { name: 'Bestilling av vinglass' })).toContainText('Minstebestilling er 6 glass.');
        await expect(page.getByRole('link', { name: 'didrik.grovlen@trecalici.com', exact: true })).toHaveAttribute('href', 'mailto:didrik.grovlen@trecalici.com');
      }
      if (['/', '/vinglass/', '/vinglass/phoenix-blanc/', '/kaviar/'].includes(path)) await page.screenshot({ path: `artifacts/screenshots/${path.replaceAll('/', '-') || 'home'}-${width}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test('enhanced navigation updates all head metadata, layout classes, hash and history', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { window.navigationMarker = true; });
  await page.getByRole('navigation', { name: 'Hovedmeny' }).getByRole('link', { name: /Sophienwald vinglass/ }).click();
  await expect(page).toHaveURL(/\/vinglass\/$/);
  await expect(page.locator('body')).toHaveClass('inner');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://trecalici.no/vinglass/');
  await page.locator('table a[href="/vinglass/phoenix-blanc/"]').click();
  await expect(page).toHaveURL(/\/vinglass\/phoenix-blanc\/$/);
  const schema = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(schema)['@graph'].some(n => n['@type'] === 'Product' && n.name === 'Sophienwald Phoenix Blanc')).toBe(true);
  await page.getByRole('link', { name: 'Spør oss om Phoenix Blanc' }).click();
  await expect(page).toHaveURL(/\/vinglass\/#contact-title$/);
  expect(await page.locator('#contact-title').evaluate(el => Math.abs(el.getBoundingClientRect().top) < 500)).toBe(true);
  await page.goBack();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://trecalici.no/vinglass/phoenix-blanc/');
  await page.locator('.brand').click();
  await expect(page.locator('body')).toHaveClass('home');
  await expect(page.locator('header.header')).toHaveCount(0);
  await expect(page.locator('.glass-contact-bar')).toHaveCount(0);
  expect(await page.evaluate(() => window.navigationMarker)).toBe(true);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

for (const width of [320, 1440]) {
  test(`landing menu and persistent glass contact work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const menu = page.getByRole('navigation', { name: 'Hovedmeny' });
    await expect(menu.getByRole('link')).toHaveCount(4);
    const tiles = await menu.getByRole('link').evaluateAll(links => links.map(link => {
      const { x, y } = link.getBoundingClientRect();
      return { x, y };
    }));
    if (width === 1440) {
      expect(tiles[0].y).toBe(tiles[1].y);
      expect(tiles[2].y).toBe(tiles[3].y);
      expect(tiles[0].x).toBe(tiles[2].x);
      expect(tiles[2].y).toBeGreaterThan(tiles[0].y);
    }
    await menu.getByRole('link', { name: /Sophienwald vinglass/ }).click();
    for (const path of ['/vinglass/', '/vinglass/phoenix-blanc/']) {
      if (path !== '/vinglass/') await page.locator('table a[href="/vinglass/phoenix-blanc/"]').click();
      await expect(page).toHaveURL(new RegExp(path + '$'));
      const bar = page.getByRole('complementary', { name: 'Kontakt om vinglass' });
      await expect(bar).toContainText('Minstebestilling: 6 glass');
      await expect(page.getByRole('link', { name: 'didrik.grovlen@trecalici.com', exact: true })).toHaveAttribute('href', 'mailto:didrik.grovlen@trecalici.com');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
      const bounds = await bar.boundingBox();
      expect(bounds.y).toBe(0);
      expect(bounds.height).toBeLessThan(100);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await bar.getByRole('link', { name: 'Kontakt oss', exact: true }).click();
      await expect(page).toHaveURL(/\/vinglass\/#contact-title$/);
      await expect(page.locator('#contact-title')).toBeInViewport();
      await expect(page.locator('#contact-title')).toBeFocused();
      const contact = await page.locator('#contact-title').boundingBox();
      expect(contact.y).toBeGreaterThanOrEqual(bounds.height);
      expect(contact.y).toBeLessThan(800);
    }
    await page.getByRole('link', { name: 'Kaviar', exact: true }).click();
    await expect(page.locator('.glass-contact-bar')).toHaveCount(0);
  });
}

test('producer content and product links work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4187/produsenter/');
  await expect(page.locator('.producer-entry')).toHaveCount(19);
  await page.locator('summary').first().click();
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  await page.getByRole('link', { name: 'Vinglass', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('table a').first().click();
  await expect(page.locator('h1')).toHaveText('Phoenix Champagne');
  await page.getByRole('complementary', { name: 'Kontakt om vinglass' }).getByRole('link', { name: 'Kontakt oss' }).click();
  await expect(page).toHaveURL(/\/vinglass\/#contact-title$/);
  await expect(page.locator('#epost')).toBeInViewport();
  await context.close();
});

test('producer bios toggle instantly under reduced motion and animate otherwise', async ({ page }) => {
  await page.goto('/produsenter/');
  const details = page.locator('details').first();
  const bio = details.locator('.producer-bio');
  await page.locator('summary').first().click();
  await expect(details).toHaveAttribute('open', '');
  expect(await bio.evaluate(el => el.style.cssText)).toBe('');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('summary').first().click();
  expect(await bio.evaluate(el => el.style.transition)).toContain('height');
  await expect.poll(() => bio.evaluate(el => el.style.cssText)).toBe('');
  await expect(details).not.toHaveAttribute('open', '');
  await page.locator('summary').first().click();
  expect(await bio.evaluate(el => el.style.transition)).toContain('height');
  await expect.poll(() => bio.evaluate(el => el.style.cssText)).toBe('');
  await expect(details).toHaveAttribute('open', '');
  await page.locator('summary').first().click();
  await expect.poll(() => details.evaluate(el => el.hasAttribute('open'))).toBe(false);
  expect(await bio.evaluate(el => el.style.cssText)).toBe('');
});

test('real Worker serves Markdown and real 404s', async ({ request }) => {
  for (const accept of ['text/html', 'text/markdown', 'text/html']) {
    const response = await request.get('/vinglass/', { headers: { Accept: accept } });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain(accept);
    expect(response.headers().vary.toLowerCase()).toContain('accept');
    const body = await response.text();
    expect(body).toContain('Sw1001');
    if (accept === 'text/markdown') expect(body).not.toContain('<html');
  }
  expect((await request.get('/nonexistent-check/')).status()).toBe(404);
});
