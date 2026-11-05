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
npx tsc -p tsconfig.app.json --noEmit --incremental false
npm run build
npm start
# In another terminal, with Chromium installed:
node scripts/smoke-home-performance.mjs
```

The smoke script blocks external origins, non-GET requests and local `/api/`
requests. It opens `/` in Arabic and English at 390×844, 768×1024 and 1440×900
(DPR 1, reduced motion), requires one successful
hero request, validates the decoded image, booking CTA and services section,
then loads the read-only `/book` shell without submitting anything. Expected
hero URLs: `/hero_vertical-480.webp`, `/hero-1280.webp` and `/hero-1672.webp`. High-DPR mobile may
choose `/hero_vertical-941.webp`. It logs hero height and computed body font.
It saves paired hero screenshots with WebP and then the original PNG in the
same DOM/crop to `SMOKE_EVIDENCE_DIR` (default `/tmp/issue25-browser-evidence`).
These are evidence for human visual comparison, not an automated quality verdict.
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

## FIX_FINDINGS verification — request pr-27-fix-findings-1

Status: **not ready for merge/deployment**. Only the typecheck evidence finding
is resolved. Incident #26 and successful browser verification remain open.
No production requests, business-data mutations, push, merge or deployment occurred.

### Application typecheck: fails, entirely pre-existing against this baseline

The earlier claims that `npx tsc --noEmit` established TypeScript correctness
are withdrawn. Root `tsconfig.json` has `files: []`; plain `tsc` does not check
the referenced application project. The workflow's `TYPECHECK=SKIP` likewise
provides no application typecheck evidence.

On 2026-11-05, using the same offline-installed lockfile dependencies and compiler:

- PR source head: `b5f9a7635c7ae2f405b18ca46c8faeb9c4d3be82`.
- Baseline `origin/main`: `b9f6874c28d5c7914e498ab4f2910b7098643a9c`.
- Explicit `tsc -p tsconfig.app.json --noEmit --incremental false`: **exit 2 on
  both**, 70 diagnostics each across 24 files.
- Complete diagnostic output is identical after removing only the temporary
  baseline checkout path prefix. No diagnostic was excluded from the comparison.
- Both named findings, `BarbersSection.tsx:424` (button event handler type) and
  `ServicesSection.tsx:57` (missing argument), occur identically on main.
- All 70 diagnostics are therefore classified as **pre-existing**, not regressions
  introduced by this PR. This does not make the application typecheck green.
  Fixing those unrelated source/test types is outside this finding-fix scope.

Full shared output is retained in [issue-25-typecheck-baseline.txt](issue-25-typecheck-baseline.txt).
The comparison used an archive of main without generated `.next` types and the
PR checkout before running the build. Reproduce without changing the checkout:

```sh
baseline_dir=$(mktemp -d /tmp/issue25-main.XXXXXX)
git archive b9f6874c28d5c7914e498ab4f2910b7098643a9c | tar -x -C "$baseline_dir"
ln -s "$PWD/node_modules" "$baseline_dir/node_modules"
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false > /tmp/issue25-pr-types.txt 2>&1
# Both checks are expected to exit 2; run independently, without shell errexit.
(cd "$baseline_dir" && node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false) > /tmp/issue25-main-types.txt 2>&1
diff -u /tmp/issue25-main-types.txt /tmp/issue25-pr-types.txt
```

### Local checks and remaining material blockers

- Dependency recovery: `npm ci --offline --ignore-scripts` succeeded, 555 packages.
  This skips lifecycle scripts; it is not equivalent to the normal CI install.
- Targeted `homePerformance.test.tsx`: **2/2 passed**, with the existing React 18
  static-render `fetchPriority` casing warning. `node --check` on the smoke script
  and `git diff --check` passed.
- `npm run build` remained at "Creating an optimized production build" and was
  interrupted (exit 130). It supplies no passing build evidence or VPS diagnosis.
- Browser launch still fails: Chromium executable absent. Installing into the
  writable `/tmp/pr27-browsers` failed with `ENOTFOUND cdn.playwright.dev`.
  No screenshots or successful responsive/font/dialog runtime evidence exist.
  The expanded smoke captures Arabic/English at the breakpoint as well as mobile
  and desktop, and pairs original PNG/current WebP crops, but remains **unexecuted**.
  Deferred booking-dialog open/close/focus behavior still needs a browser run with
  locally fulfilled booking fixtures; the current shell script does not test it.
- Incident #26 remains a **P1 release blocker**. This patch does not change the
  font implementation or assert a diagnosis of the VPS Turbopack failure.
  `fonts.googleapis.com` could not resolve here. Authentic replacement font assets
  could not be obtained, and no VPS-safe build path was established. Do not replace
  those faces with arbitrary fonts or count hosted CI success as VPS evidence.
  Before another readiness review, establish a reproducible build using the VPS
  Node/npm/build configuration on this revision without production secrets, or
  deliver licensed local copies of all required font faces and verify that build.
  Production access or deployment is not authorized by this request.

Historical supplied workflow evidence for the reviewed head was install/tests/build
exit 0, typecheck skipped; the prior builder reported 488 tests passing. Those are
historical results, not reruns of this patch. Exact finalized-head verification and
independent review remain required. No Lighthouse/CrUX improvement is certified.
