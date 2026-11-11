import test from 'node:test';
import assert from 'node:assert/strict';
import { checkReleaseHealth } from './check-release-health.mjs';

const origin = 'https://cutsaloon.com';
const fixtures = {
  '/': ['text/html', '<html lang="ar" dir="rtl"><head><title>CUT Salon</title></head><body>Salon</body></html>'],
  '/sitemap.xml': ['application/xml', `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/prices', '/book', '/offers/november-protein', '/branches/gleem', '/branches/camp-caesar'].map(p => `<url><loc>${origin}${p}</loc></url>`).join('')}</urlset>`],
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
for (const [name, change] of [
  ['HTML error disguised as sitemap', { '/sitemap.xml': ['text/html', '<html>Error</html>'] }],
  ['wrong sitemap origin', { '/sitemap.xml': ['application/xml', fixtures['/sitemap.xml'][1].replaceAll(origin, 'https://wrong.example')] }],
  ['four-only sitemap', { '/sitemap.xml': ['application/xml', fixtures['/sitemap.xml'][1].replace(/<url><loc>https:\/\/cutsaloon.com\/branches\/[^<]+<\/loc><\/url>/g, '')] }],
  ['extra sitemap URL', { '/sitemap.xml': ['application/xml', fixtures['/sitemap.xml'][1].replace('</urlset>', '<url><loc>https://cutsaloon.com/unknown</loc></url></urlset>')] }],
  ['wrong sixth sitemap URL', { '/sitemap.xml': ['application/xml', fixtures['/sitemap.xml'][1].replace('/branches/camp-caesar', '/unknown')] }],
  ['duplicate sitemap URL', { '/sitemap.xml': ['application/xml', fixtures['/sitemap.xml'][1].replace('/branches/camp-caesar', '/branches/gleem')] }],
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
