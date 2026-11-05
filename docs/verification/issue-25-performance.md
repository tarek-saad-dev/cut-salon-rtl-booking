# Issue 25 — homepage performance

## Scope and baseline

The 2026-10-31 audit is historical, not a post-Phase-1 measurement. Its mobile
56 / desktop 66 scores, field LCP 3.3s / INP 1175ms / CLS .25 and lab LCP 16.4s
are different samples. No new Lighthouse or CrUX numbers were obtained here.
The targets (LCP <=2.5s, INP <=200ms, CLS <=.1, mobile >=90) are not certified.

Local source inspection before changes:

- `hero.png`: 1,735,740 bytes, 1672×941.
- `hero_vertical.png`: 1,575,977 bytes, 941×1672.
- Two eager native images, hidden with CSS, exposed both sources to image fetching;
  neither had explicit fetch priority. Combined source bytes: 3,311,717.
- Blocking Google CSS imported Alexandria, Oswald and Playfair Display; Alexandria
  was also delivered by next/font. LAXR had both public @font-face and next/font.
- Hero strip is filled after a read-only barber request. First-visit trust copy
  appeared after hydration. Neither had a full space reservation.
- Upcoming popup eagerly imported BookingManagementCard and its management
  dependencies for every homepage visitor. No trace is available to rank CPU
  hotspots; this is a concrete dependency-graph opportunity, not measured INP.
- Audit total transfer ~3.86MB and images ~3.37MB are historical. A fresh complete
  network breakdown, font request counts, layout-shift trace and input-latency
  profile could not be captured without a working browser.

## Delivery changes and measured asset bytes

| Source | Static WebP | Bytes | Reduction vs matching original |
| --- | --- | ---: | ---: |
| Mobile PNG | `/hero_vertical-480.webp` | 24,182 | 98.5% |
| Mobile PNG | `/hero_vertical-941.webp` | 62,100 | 96.1% |
| Desktop PNG | `/hero-1280.webp` | 52,314 | 97.0% |
| Desktop PNG | `/hero-1672.webp` | 75,450 | 95.7% |

These are actual file lengths, not observed total network savings. Width selection
depends on viewport/DPR and browser. One server-rendered picture selects the
original mobile/desktop art direction at 768px, with WebP width candidates and
original PNG fallbacks. The original crop positions, opacity, blend, scale,
overlays and viewport-height container remain. Only the selected hero is eager
and high priority; no offscreen image preload was added. Below-fold BarberPhoto
already defaults to lazy loading in fixed-size parents; it now decodes async.

Static WebP avoids reliance on the unverified Next/Nginx optimizer. Global
`images.unoptimized` and remote image policy remain unchanged. Next's public
static route must serve the four URLs above with `image/webp`. The control-plane
script includes untracked files via `git add -N`, emits `git diff --binary HEAD`,
and applies with `git apply --index --binary`, so the assets can be published.
Regenerate with `python3 scripts/generate-hero-images.py` (Pillow 10.2).
Originals are retained. Asset validation with Pillow passed for all four files.
Quality 82 is lossy; final visual comparison of hair detail/crops remains needed.

All four font families now use next/font. Oswald and Playfair keep their existing
weights/styles and are not globally preloaded. Alexandria/LAXR retain their
existing next/font settings and local/system fallback stacks. Browser computed
font and Arabic/English visual comparisons remain unverified. Font downloads
now happen at build time and must be reachable in CI.

Booking detail code is dynamically loaded only when its existing dialog renders
its selected card. Dialog focus management, reminder timing, cancellation props,
promos, indexable sections and primary booking interactions are retained.
No arbitrary idle timer delays marketing or booking. Hero strip and trust line
reserve space before async updates. Reduced-motion users skip hero entrance
transforms. No booking/cache/API/SEO route or default language changes.

## Verification and reproduction

Run on the final PR head in the normal verification environment:

```sh
npm ci
npm test
npx tsc --noEmit
npm run build
npm start
# In another terminal, with Chromium installed:
node scripts/smoke-home-performance.mjs
```

The smoke script blocks external origins, non-GET requests and local `/api/`
requests. It opens `/` at 390×844 and 1440×900 (DPR 1), requires one successful
hero request, validates the decoded image, booking CTA and services section,
then loads the read-only `/book` shell without submitting anything. Expected
hero URLs: `/hero_vertical-480.webp` and `/hero-1672.webp`. High-DPR mobile may
choose `/hero_vertical-941.webp`. It logs hero height and computed body font.
It is standalone because the existing Playwright config imports a harness-only
package. It tests the offline shell, not live booking availability.

For comparable lab measurements, run the same Chrome/Lighthouse version against
production builds of base and PR, same mobile throttling, cold cache, campaign
state, language and viewport. Use at least three runs and retain JSON/HTML reports:

```sh
npx lighthouse http://localhost:3000/ --only-categories=performance --output=json --output=html --output-path=/tmp/issue25-lighthouse
curl -I http://localhost:3000/hero_vertical-480.webp
curl -I http://localhost:3000/hero-1672.webp
curl -I http://localhost:3000/book
```

Inspect DevTools Network for only one initial hero resource, no browser requests
to fonts.googleapis.com/fonts.gstatic.com or `/fonts/LAXR.otf`, and successful
self-hosted font responses. Compare Arabic/English at 390, 768 and 1440px,
first/repeat visits, active campaign, reduced motion, scroll to barber cards,
and open reminders with mocked booking data. Record performance traces for
layout-shift sources, long tasks and real interactions with safe mocked data.
Do not submit real bookings, cancellation, account or loyalty changes.
CrUX field numbers require a later production measurement/window; lab results
must remain labeled lab and cannot establish real-user improvements.

## Runner results

Initial `npm ci` failed executing esbuild with EPERM. An ignore-scripts recovery
using a new cache failed with npm "Exit handler never called". Offline recovery
using the existing cache succeeded (`npm ci --ignore-scripts --offline`).
`node node_modules/typescript/bin/tsc --noEmit` passed after recovery.
Browser smoke could not launch: Playwright Chromium is not installed.
No production requests or mutations were made. Full test/build results are
recorded below after their attempts; runtime/Lighthouse verification and exact
PR-head CI remain requirements before READY_FOR_TAREK. Static independent review
reported no material findings; a small strip-height reservation gap was corrected.
The GitHub-hosted finalizer owns branch publication and draft PR creation; this
runner does not push, merge or deploy.

After offline recovery, `npm test` passed: **81 files, 488 tests**. The targeted
performance suite separately passed **2 tests**. `npx tsc --noEmit` passed and
`git diff --check` passed. React 18's static-render test emits its known casing
warning for `fetchPriority`; the attribute is present in server markup and HTML
attribute names are case-insensitive. The application's Next renderer supports
this prop.

Local `npm run dev` also failed with `listen EPERM 0.0.0.0:3000`, preventing even
HTTP-only local route smoke. Build was attempted with the standard command;
see final result below. These runner limits are not evidence of green CI.

`npm run build` remained at "Creating an optimized production build" without
further output and was interrupted (exit 130); it did not establish a passing
build. A bounded webpack diagnostic attempt then reported another build process
still running. Do not interpret the test/type successes as production-build
verification. The finalizer's normal verification gate and independent review of
its exact PR head remain outstanding.

After confirming no active build process, the generated stale `.next/lock` was
removed and the webpack diagnostic was retried. It exited 1 with only
"Build failed because of webpack errors" and no actionable error detail. Its
cause cannot be attributed to either a code regression or the runner from that
output. The standard production build is therefore still unverified.
TypeScript passed again after the final code changes. The smoke additionally
checks `/book` returns HTTP 200 with a no-store cache policy.
