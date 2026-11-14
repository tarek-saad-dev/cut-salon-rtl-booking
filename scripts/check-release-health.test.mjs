import test from 'node:test';
import assert from 'node:assert/strict';
import { checkReleaseHealth } from './check-release-health.mjs';

const origin = 'https://cutsaloon.com';
const fixtures = {
  '/': ['text/html', '<html lang="ar" dir="rtl"><head><title>CUT Salon</title></head><body>Salon</body></html>'],
  '/sitemap.xml': ['application/xml', `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/prices', '/book', '/offers/november-protein'].map(p => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`],
  '/robots.txt': ['text/plain', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`],
};
function fetchFixture(change = {}) {
  return async (url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    const path = new URL(url).pathname;
    const [type, body] = { ...fixtures, ...change }[path];
    return new Response(body, { status: 200, headers: { 'content-type': type } });
  };
}
test('checks only the three public release endpoints with GET', async () => {
  const results = await checkReleaseHealth('http://127.0.0.1:3000', { fetchImpl: fetchFixture() });
  assert.equal(results.length, 3);
});
// Both canonical sitemap shapes are intentional: Phase 1 (four URLs)
// and branch SEO Phase 3 (six URLs). Partial/extra/duplicate URLs fail closed.
const phase1Paths = ['/', '/prices', '/book', '/offers/november-protein'];
const branchPaths = ['/branches/gleem', '/branches/camp-caesar'];
const sitemapWithPaths = paths =>
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`;
const fixtureWithSitemap = paths => fetchFixture({ '/sitemap.xml': ['application/xml', sitemapWithPaths(paths)] });

test('accepts the approved six-URL branch SEO sitemap without live requests', async () => {
  const results = await checkReleaseHealth('http://127.0.0.1:3000', {
    fetchImpl: fixtureWithSitemap([...phase1Paths, ...branchPaths]),
  });
  assert.equal(results.length, 3);
});

for (const [name, paths] of [
  ['only one new branch (five URLs)', [...phase1Paths, branchPaths[0]]],
  ['unexpected sixth URL', [...phase1Paths, branchPaths[0], '/branches/unknown']],
  ['missing a Phase 1 URL despite six entries', [...phase1Paths.slice(1), ...branchPaths, '/unexpected']],
  ['duplicate canonical URL', [...phase1Paths, phase1Paths[0]]],
  ['extra canonical URL', [...phase1Paths, ...branchPaths, '/unexpected']],
]) test(`rejects noncanonical sitemap: ${name}`, async () => {
  await assert.rejects(checkReleaseHealth('http://127.0.0.1:3000', {
    fetchImpl: fixtureWithSitemap(paths),
  }));
});

for (const [name, change] of [
  ['HTML error disguised as sitemap', { '/sitemap.xml': ['text/html', '<html>Error</html>'] }],
  ['wrong sitemap origin', { '/sitemap.xml': ['application/xml', fixtures['/sitemap.xml'][1].replaceAll(origin, 'https://wrong.example')] }],
  ['missing sitemap page', { '/sitemap.xml': ['application/xml', '<urlset></urlset>'] }],
  ['robots blanket block', { '/robots.txt': ['text/plain', `User-agent: *\nDisallow: /\nSitemap: ${origin}/sitemap.xml`] }],
  ['crawler-specific page block', { '/robots.txt': ['text/plain', `User-agent: Googlebot\nDisallow: /prices\nUser-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`] }],
  ['wrong robots sitemap', { '/robots.txt': ['text/plain', 'User-agent: *\nAllow: /\nSitemap: https://wrong.example/sitemap.xml'] }],
  ['empty homepage', { '/': ['text/html', ''] }],
]) test(`rejects ${name}`, async () => {
  await assert.rejects(checkReleaseHealth('http://localhost:3000', { fetchImpl: fetchFixture(change) }));
});
test('rejects non-200 and network errors', async () => {
  for (const fetchImpl of [async () => new Response('', { status: 503 }), async () => { throw new Error('timeout'); }]) {
    await assert.rejects(checkReleaseHealth('http://localhost:3000', { fetchImpl }));
  }
});
test('rejects credentials, paths and unsupported protocols before requests', async () => {
  for (const url of ['ftp://example.com', 'https://user:password@example.com', 'https://example.com/path', 'https://example.com/?token=x']) {
    await assert.rejects(checkReleaseHealth(url, { fetchImpl: () => assert.fail('must not fetch') }));
  }
});
