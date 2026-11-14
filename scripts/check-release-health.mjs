import { pathToFileURL } from 'node:url';

const canonicalOrigin = 'https://cutsaloon.com';
const phase1PublicPaths = ['/', '/prices', '/book', '/offers/november-protein'];
const branchPaths = ['/branches/gleem', '/branches/camp-caesar'];
function isExactCanonicalSitemap(urls, paths) {
  const expected = paths.map(path => `${canonicalOrigin}${path}`);
  return urls.length === expected.length &&
    new Set(urls).size === urls.length &&
    expected.every(url => urls.includes(url));
}
function requireHealthy(condition, message) {
  if (!condition) throw new Error(message);
}

// Explicit target required; importing this module never performs network I/O.
export async function checkReleaseHealth(base, { fetchImpl = fetch } = {}) {
  const target = new URL(base);
  requireHealthy(['http:', 'https:'].includes(target.protocol) && !target.username && !target.password && target.pathname === '/' && !target.search && !target.hash, 'Expected an HTTP(S) origin without credentials, path or query');
  const results = [];
  for (const path of ['/', '/sitemap.xml', '/robots.txt']) {
    const response = await fetchImpl(new URL(path, target), {
      method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Cache-Control': 'no-cache' },
    });
    requireHealthy(response.status === 200, `${path}: expected HTTP 200, received ${response.status}`);
    const type = response.headers.get('content-type') || '';
    const body = await response.text();
    if (path === '/') {
      requireHealthy(/text\/html/i.test(type) && /<html\b/i.test(body) && /<title\b[^>]*>[^<]+<\/title>/i.test(body) && /<body\b/i.test(body), '/: expected a nonempty HTML page with title and body');
    } else if (path === '/sitemap.xml') {
      requireHealthy(/(?:application|text)\/xml/i.test(type) && /<urlset\b[^>]*xmlns=["']http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9["']/i.test(body) && /<\/urlset>/.test(body), 'sitemap: expected XML sitemap urlset');
      const urls = [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(match => match[1].trim());
      requireHealthy(isExactCanonicalSitemap(urls, phase1PublicPaths) || isExactCanonicalSitemap(urls, [...phase1PublicPaths, ...branchPaths]), 'sitemap: expected exactly the Phase 1 four or approved branch-SEO six canonical public URLs');
    } else {
      requireHealthy(/text\/plain/i.test(type) && /^User-agent:\s*\*\s*$/im.test(body) && /^Allow:\s*\/\s*$/im.test(body) && !/^Disallow:[ \t]*[^\s#]/im.test(body) && body.split(/\r?\n/).some(line => line.trim() === `Sitemap: ${canonicalOrigin}/sitemap.xml`), 'robots: expected crawl access and canonical sitemap');
    }
    results.push({ path, status: response.status });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/check-release-health.mjs <origin>');
    console.log(await checkReleaseHealth(process.argv[2]));
  } catch (error) {
    console.error(`Release health failed: ${error.message}`);
    process.exitCode = 1;
  }
}
