// Start a production build locally first. No production mutations or external requests.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'http://localhost:3000' || route.request().method() !== 'GET' || url.pathname.startsWith('/api/')) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const heroes = [];
    page.on('response', response => { if (/\/hero[^/]*\.(webp|png)/.test(response.url())) heroes.push(response); });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    const image = page.locator('picture img');
    assert.equal(await image.count(), 1);
    assert.ok(await image.evaluate(img => img.complete && img.naturalWidth > 0));
    assert.match(await image.evaluate(img => img.currentSrc), viewport.width < 768 ? /hero_vertical-480.webp/ : /hero-1672.webp/);
    assert.equal(heroes.length, 1, 'one hero fetch per initial viewport');
    assert.equal(heroes[0].status(), 200);
    await page.locator('[data-book-now="true"]').first().waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-book-now="true"]').first().getAttribute('href'), '/book');
    assert.ok(await page.locator('#services').count());
    console.log(viewport, await image.evaluate(img => ({ resource: img.currentSrc, height: img.closest('section').getBoundingClientRect().height, font: getComputedStyle(document.body).fontFamily })));
    const bookResponse = await page.goto('http://localhost:3000/book', { waitUntil: 'networkidle' });
    assert.equal(bookResponse.status(), 200);
    assert.match(bookResponse.headers()['cache-control'] ?? '', /no-store/);
    assert.ok(await page.locator('body').innerText());
    assert.ok(!(await page.locator('body').innerText()).includes('Application error'));
    await context.close();
  }
} finally {
  await browser.close();
}
