# Issue 28 — local branch landing pages

## Scope and sources

New canonical URLs: https://cutsaloon.com/branches/gleem and
https://cutsaloon.com/branches/camp-caesar. Both are server components with unique
Arabic-first content, metadata/social copy, map links, central contact, prices,
booking and reciprocal branch links. The sitemap retains the original four URLs
and adds only these two, without modification dates. Footer branch names are
localized AR/EN links; existing map and campaign booking behavior is retained.
No hub, booking-flow, layout, global CSS, fonts, hero assets, API or workflow changes.

Location sources are the existing first-party footer and issue #28 owner context:
- Gleem – Saba Pasha: يسرى قمحة، فلمنج، قسم أول الرمل، الإسكندرية;
  https://share.google/F4o7oOQVs3EJSgxaw.
- Camp Caesar: كامب شيزار، الإسكندرية;
  https://maps.app.goo.gl/217r3pLutcKFAW2x7.
- +20 101 212 6899 is explicitly presented as central contact for both branches.

The O2 hook reads `mode` and `branch`, but functional deep-link behavior was not
verified end to end. New CTAs therefore use the reliable `/book` entry and explain
that visitors must select the named branch. Existing booking implementation is
unchanged. No production API calls or business-data mutations were used.

Each page emits its own BarberShop ID and URL, locality/country, existing map and
parent organization. No streetAddress, phone, hours, coordinates, ratings, reviews
or promotions are asserted in schema. The disputed street remains visible only
at existing first-party precision; structured address is locality/country only.
JSON serialization escapes `<`. No rich-results eligibility is claimed.

## Owner verification gaps

Gleem's first-party street (يسرى قمحة) differs from the map listing street reported
in the issue (ممدوح عبد الرازق). Owner must verify NAP before reconciling website
and GBP. Camp Caesar's precise street address and both branches' verified hours
are missing. Do not invent these or treat central contact as a branch phone.
GBP query screenshot counts are not Search Console impressions or traffic.
No rankings, indexing, impressions or traffic improvements are claimed.

## Local verification

Baseline: b9f6874, detached control-plane workspace. GitHub-hosted finalizer owns
branch `codex/issue-28` and draft PR publication; runner does not push or merge.

Focused tests cover rendered server HTML, distinct copy/H1s, safe booking/map and
contact links, reciprocal links, route metadata, exact sitemap, JSON-LD keys and
script escaping, plus preservation of localized footer and campaign links.

Initial `npm ci` failed at esbuild's postinstall binary launch with `spawnSync ...
EPERM` in this sandbox. Subsequent `npm test` and `npm run build` exited 127
(`vitest` / `next` unavailable after incomplete install). `npx tsc --noEmit` could
not start from the incomplete install and was interrupted while waiting. A retry
with lifecycle scripts disabled and a fresh cache also waited without output and
was interrupted. These are environment verification blockers, not passing checks
or demonstrated application regressions. An offline retry with
`npm ci --ignore-scripts --offline` succeeded (555 packages, zero vulnerabilities).
`npx --no-install tsc --noEmit` then passed. `npm test` passed all 81 files / 490 tests, including the four new branch-page
tests and existing SEO suite. Existing React act/Browserslist warnings did not
fail the suite. `git diff --check` passed. The default `npm run build` remained at Turbopack compilation without further
output for over two minutes and was interrupted (exit 130). Diagnostic fallback
`npm run build -- --webpack` exited 1 with only “Build failed because of webpack
errors” and no actionable compiler diagnostic. A stale generated build lock was
removed between attempts. Typecheck was repeated afterward and passed. Build
verification remains unresolved; this is not classified as a pre-existing failure
or a confirmed regression. The workflow must run its ordinary install/test/build
gate on the published head and investigate any reproducible build failure.

## Read-only checks after an approved deployment

1. Fetch both branch URLs: require HTTP 200, rendered Arabic H1/body without
   JavaScript, self canonical, unique title/description, matching OpenGraph/Twitter
   and no noindex. Check mobile layout, keyboard focus, RTL and link destinations.
2. Inspect each JSON-LD script: distinct page-based IDs, matching map and locality;
   no invented NAP/hours/ratings. Validation does not establish rich-result eligibility.
3. Fetch `/sitemap.xml`: the original four and two new canonical URLs only; verify
   `/robots.txt` still declares the sitemap and permits crawling.
4. Check homepage HTML contains both localized footer links; preserve maps and
   campaign CTA. Check `/prices` and `/book` navigation without submitting bookings.
5. In Search Console, inspect each URL, confirm rendered content/canonical/indexing
   eligibility, submit sitemap/request indexing if appropriate. Later compare actual
   Search Console page/query impressions and clicks over a stated measurement
   period, keeping GBP search-query data separate.

Release remains pending independent exact-head review, green CI, resolution of
issue #26 deployment blocker, coordination with open performance PR #27, and
explicit owner approval. This work is not claimed live or READY_FOR_TAREK.
