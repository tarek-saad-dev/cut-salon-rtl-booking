# Issue 23 — technical SEO verification

Implemented an explicit four-route sitemap, robots sitemap declaration, per-page
canonical/social metadata, and server-side noindex layouts for account,
booking-management, booking steps, and dev routes. Booking components and expired
offer behavior are unchanged. Preview dimensions are omitted because the logo's
claimed 1200×630 size was not verified.

## Local evidence

- `npm ci`: blocked by runner permission error (`spawnSync .../esbuild/bin/esbuild EPERM`).
- `npm test`: unavailable (`vitest: not found`) following incomplete installation.
- `npm run build`: unavailable (`next: not found`) following incomplete installation.
- `git diff --check`: passed.
- Added `src/lib/__tests__/seo.test.ts` for sitemap allowlist, robots declaration,
  canonical/social metadata conventions, and server-side noindex coverage.

The workflow must run the test/build gate with a successful dependency install.
No production requests or business-data mutations were performed.

## Read-only verification plan

After a successful build, use local HTTP GET requests first. Repeat public GET
checks on production only after owner-approved deployment:

- `https://cutsaloon.com/sitemap.xml`: valid XML containing exactly
  `https://cutsaloon.com/`, `/prices`, `/book`, `/offers/november-protein` under
  the same origin; no lastmod, private, expired, funnel, or query URLs.
- `https://cutsaloon.com/robots.txt`: exact
  `Sitemap: https://cutsaloon.com/sitemap.xml`; no crawl blocks hiding noindex.
- `/`, `/prices`, `/book`, `/offers/november-protein`: unique title/description,
  correct absolute canonical, matching og:url/title/description and Twitter card.
  `/book?branch=GLEEM` must still canonicalize to `/book`.
- `/client`, `/client/loyalty`, `/booking`, `/book/cart`, `/book/confirm`,
  `/book/confirmed`, `/book/phone`, `/book/professionals`, `/book/services`,
  `/book/time`, `/book/visit-type`, `/book/with/1`, `/dev/booking-api-proof`:
  server HTML contains `noindex, follow`, including streamed metadata when present.
  Use a crawler user agent if necessary. Do not submit forms or follow mutation flows.
- `/offers/october-333`, `/offers/october-package`: retain noindex and expired notice;
  `/offers/october-333/success` retains its existing noindex policy.

## Release notes and follow-up

The November campaign is intentionally included for this issue's active campaign.
Revisit sitemap membership/indexation when the campaign expires. No localized URL
alternates, structured data, performance work, or analytics changes are included.

The GitHub-hosted finalizer owns publication to `codex/issue-23` and the draft PR
against `main`. Independent review and successful verification are still required;
this workspace result does not assert READY_FOR_TAREK. Never merge or deploy here.
