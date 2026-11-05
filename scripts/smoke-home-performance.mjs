// Start a production build locally first. No production mutations or external requests.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const evidenceDir = resolve(process.env.SMOKE_EVIDENCE_DIR || '/tmp/issue25-browser-evidence');
await mkdir(evidenceDir, { recursive: true });
const viewports = [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }];
const cases = ['ar', 'en'].flatMap(lang => viewports.map(viewport => ({ lang, viewport })));
const browser = await chromium.launch();
try {
  for (const { lang, viewport } of cases) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' });
    await context.addInitScript(language => localStorage.setItem('cut-salon-lang', language), lang);
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
    assert.match(await image.evaluate(img => img.currentSrc), viewport.width < 768 ? /hero_vertical-480.webp/ : viewport.width < 1280 ? /hero-1280.webp/ : /hero-1672.webp/);
    assert.equal(heroes.length, 1, 'one hero fetch per initial viewport');
    assert.equal(heroes[0].status(), 200);
    await page.locator('[data-book-now="true"]').first().waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-book-now="true"]').first().getAttribute('href'), '/book');
    assert.ok(await page.locator('#services').count());
    await page.waitForFunction(language => document.documentElement.lang === language, lang);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('html').getAttribute('dir'), lang === 'ar' ? 'rtl' : 'ltr');
    console.log(lang, viewport, await image.evaluate(img => ({ resource: img.currentSrc, height: img.closest('section').getBoundingClientRect().height, font: getComputedStyle(document.body).fontFamily })));
    const section = image.locator('xpath=ancestor::section');
    await section.screenshot({ path: resolve(evidenceDir, `${lang}-${viewport.width}-webp.png`) });
    // Compare identical DOM, typography and crop using the retained lossless source.
    // This second load is intentional and occurs only after the one-fetch assertion.
    await image.evaluate(img => {
      img.closest('picture').querySelectorAll('source').forEach(source => source.remove());
      img.src = innerWidth < 768 ? '/hero_vertical.png' : '/hero.png';
      return img.decode();
    });
    await section.screenshot({ path: resolve(evidenceDir, `${lang}-${viewport.width}-png.png`) });
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
