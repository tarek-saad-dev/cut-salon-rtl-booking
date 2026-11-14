# Issue 26 — VPS font build incident

Status: **release blocked; root cause unconfirmed**. Phase 1 is not verified live.
This patch is a build-dependency mitigation, not proof of a repaired VPS.
No production commands, SSH, credentials, deployment or business-data mutations
were used. The external `/usr/local/sbin/deploy-cutclient` was not inspected or
changed: it is not in this workspace and production access is not authorized.

## Evidence and limits

- Baseline: `b9f6874c28d5c7914e498ab4f2910b7098643a9c` (Phase 1 PR #24).
- Supplied hosted CI evidence: 486 tests and build passed before merge.
- Supplied deployment run: [41973818496](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/41973818496).
  SSH setup passed; VPS build failed; production verification was skipped.
  Reported errors: `next/font/google queries have exactly one entry` and
  `Can't resolve '@vercel/turbopack-next/internal/font/google/font'` for Alexandria
  in `src/app/layout.tsx`. This locates the failure in font resolution, but does
  not prove network, cache corruption, dependency mismatch or a Phase 1 regression.
- The publication of the first attempt was rejected for workflow permissions
  ([41975725002](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/41975725002)).
  The initial reconstruction changed no `.github/workflows/**` file; later
  follow-up work added `.github/workflows/cut-font-preview.yml` exclusively for
  nonproduction CI/browser evidence. The workflow has NO deploy or VPS secrets.
- Local runner: Node `v22.23.2`, npm `10.9.8`, locked Next `16.2.4`;
  package-lock SHA256 `a29f6183912e175ddc7309d7316d5e18040a5a9e11dd394c922b82bf86652c0e`.
  VPS Node/npm, actual checkout, dependency tree and cache history remain unknown.
- Normal `npm ci` failed in esbuild's lifecycle binary validation with `EPERM`.
  Recovery `npm ci --offline --ignore-scripts` installed 555 packages; it is not
  equivalent to a successful standard install. A separate empty-cache offline
  attempt failed `ENOTCACHED`; neither installation failure diagnoses the VPS.
- Baseline Next/Turbopack build reached optimized compilation without reporting
  the incident's font errors, then was interrupted (exit 130). No baseline
  reproduction or successful baseline build is claimed. No prior `.next` existed
  at initial inspection. The build reports `.env.local`; its contents were not
  inspected or copied. Do not assume this runner matches the VPS environment.

## Source mitigation and alternatives

The layout no longer imports `next/font/google` for Alexandria. Existing CSS
Google delivery remains and now includes weight 900, preserving the layout's
requested weights. The body uses the named Alexandria/system stack and retains
local next/font LAXR. This removes the Google build-time resolver from this source
without changing Next, the lockfile, Turbopack or deployment commands.

This deliberately retains runtime Google requests and their latency, privacy,
network and fallback implications. It is not an offline-font or performance fix.
Arabic/English visual comparison, especially loaded/fallback text metrics, is
still required. Bundling authentic licensed local font files is a possible later
resolution; no substitute font assets were invented here. Switching to Webpack
or deleting caches would mask variables without proving this incident's cause.

## Phase 2 coordination

[PR #27](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/27), issue #25,
was observed open, draft and unmerged at head
`17e4a8630e8de7757162bf1da31d8a7157d1063b`. It removes the CSS import and adds
Google build-time Oswald/Playfair loaders. Its layout/CSS changes conflict with
this mitigation in intent even if Git can merge text. Do not blindly combine:
retain this mitigation until licensed local fonts or an evidenced VPS-compatible
build path covers **all** font families. Reconcile on one candidate head, run
clean installs/builds and browser typography checks, then independently review
that exact head. Neither PR is declared merged or production safe here.

## Operator-only diagnostic procedure (not executed)

Before authorizing another deployment, have the operator record sanitized output
from the VPS build account and a safe non-production replica. Do not copy env
files, print environment variables, tokens, SSH configuration or process secrets.
Read-only commands to run from the actual checkout:

```sh
node --version
npm --version
git rev-parse HEAD
sha256sum package-lock.json
npm ls next react react-dom --depth=0
stat .next node_modules package-lock.json
sudo sed -n '1,240p' /usr/local/sbin/deploy-cutclient
```

Review script output privately and redact credentials before attaching evidence.
Trace checkout/ref, working directory, Node/npm path, install exit handling,
`npm ci` vs reused dependencies, `.next` reuse, build flags, environment loading,
service restart order and rollback behavior. Do not run the deploy script merely
to inspect it. Obtain the full original font error context rather than infer a
cause from the terminal module-not-found message.

On a disposable replica with the **recorded VPS toolchain**, exact candidate SHA
and non-secret configuration, compare fresh `npm ci && npm run build` with a
second warm build. Then compare a disposable copy of the old cache if needed;
never remove caches from the running release. Record exit codes and sanitized
logs. Check Google DNS/TLS accessibility from that replica if testing the old
Google-loader baseline. Vary cache, dependencies and network one at a time.
A hosted CI pass alone cannot certify this VPS path.

## Proposed atomic deployment contract — operator review required

Do not apply this as an unreviewed shell snippet. The external script's service
manager, release paths, ports and Nginx routing are unknown, so exact activation
commands cannot safely be specified yet. The operator should prepare and review
an adapter with these explicit steps before owner approval:

1. Serialize releases. Resolve and record an immutable approved SHA. Create a new
   sibling release directory; keep the current release directory/process intact.
2. Install from its lockfile with the recorded Node/npm; build in that directory
   with controlled configuration. Fail immediately on install/build failure.
   Never build over the running `.next` or share writable build caches.
3. Start the candidate on a separate loopback port with the production runtime
   configuration under operator control. Run the checker below against that
   origin, and inspect logs without submitting bookings or account changes.
4. Record the previous release target. Switch routing atomically only after build
   and candidate checks succeed; preserve the old process until external checks
   pass. A symlink switch alone does not move an already-running Node process.
5. After explicitly authorized activation, check all three public endpoints.
   On failure, restore routing to the recorded old process/release and repeat
   read-only checks. Keep old assets/releases through rollback and cache lifetimes;
   do not discard the rollback target during this incident.

Only Tarek can approve deployment. Merging main triggers deployment, so the
operator must establish this path **before** merge approval. No workflow changes
are included. Operator proposal: extend hosted CI to run the checker's fixture
suite and use the three-endpoint checker in post-deploy verification, via a
separately authorized workflow change with appropriate workflow permissions.

## Verification commands and release acceptance

Local/CI, no production calls:

```sh
node --test scripts/check-release-health.test.mjs
npm ci
npm test
npm run build
# Start built candidate locally in another terminal before this read-only check:
node scripts/check-release-health.mjs http://127.0.0.1:3000
```

After explicit owner-approved deployment only (not run by this execution):

```sh
node scripts/check-release-health.mjs https://cutsaloon.com
```

The script requires an explicit origin, performs only GET on `/`, `/sitemap.xml`
and `/robots.txt`, refuses redirects and non-200 responses, and has a 15-second
per-request timeout. It checks basic HTML, the four Phase 1 canonical sitemap
locations and the current permissive robots policy/canonical sitemap. It conservatively
rejects every nonempty Disallow directive, including crawler-specific groups;
a future intentional robots restriction requires revising this contract. Local candidates still must
advertise production canonical URLs. Tests use in-memory Response fixtures and
never fetch production. It is a smoke check, not full XML validation, visual
verification, release-SHA attestation or mutation-flow validation. Retain deploy
SHA/logs separately; an old release can also pass endpoint checks.

Acceptance remains open until VPS root cause is evidenced, exact-head review and
CI pass, owner approval is recorded, deployment succeeds and the three public
endpoints pass read-only verification. No READY_FOR_TAREK claim is made here.

### This reconstruction's local verification

- `npm test`: **80 files / 486 tests passed**, exit 0. Existing Browserslist
  stale-data warning was emitted. These are repository tests, not production calls.
- `node --test scripts/check-release-health.test.mjs`: passed, exit 0, covering
  healthy fixtures, wrong content/canonical URLs, missing sitemap entries,
  blanket robots denial, empty HTML, HTTP/network failures and invalid targets.
- One-off source check failed before and passed after removal of the Google
  layout import. This proves dependency removal only, not VPS root cause.
- The initial `git diff --check` passed; package-lock remained unchanged.
  A separate later commit added an isolated, PR-only workflow, so the original
  statement about workflow files no longer applies to the current branch.
- First post-change build refused an existing lock after the interrupted baseline.
  The generated local `.next` directory was moved to `/tmp/issue26-baseline-next`
  and a fresh build started. This is local runner housekeeping, not evidence
  that the VPS has a stale cache. Build result is recorded below.
- Fresh post-change build also remained at optimized compilation without a
  result and was interrupted (exit 130). **Build is unverified locally**, not
  green; no reported VPS font error was reproduced. The control workflow must
  run the standard repository verification gate after publication preparation.
- Focused independent workspace review found a crawler-specific robots-rule gap.
  A regression fixture failed before the correction and passed after it. The
  checker now rejects every nonempty Disallow directive; re-review reported no
  remaining material findings. This does not replace exact finalized-head
  control-plane REVIEW or establish release readiness.


## 2026-11-14 — Source-level font regression CI gate

Added `src/lib/__tests__/vpsFontBuildGate.test.ts` to CI so the candidate must not reintroduce `next/font/google` Alexandria at build time, while preserving the local display font and UI font fallback. This test exercises **repository source only**, not the actual VPS Node toolchain, protected deploy script, SSH credentials, atomic cutover, recovery or browser font parity. The real production deploy remains **BLOCKED** until independent authorized VPS evidence establishes safe build/rollback and confirms issue #26 is resolved. Do not merge based solely on this source test.


## 2026-11-14 — Isolated Linux Chrome rehearsal added (current head)

Current branch includes `.github/workflows/cut-font-preview.yml`,
`e2e/cut-font-isolated-smoke.spec.ts`, and
`playwright.font-preview.config.ts`. This is a **new CI workflow** in addition
to the original source-level mitigation, so historical statements that no
workflow file changed apply only to the first patch, NOT to this head.

The [isolated Chrome run #43551173607](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43551173607)
and [normal CI #43551173705](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43551173705)
both passed on head `a3197835c116422e5f70952295c9789716e070bc`. Chrome ran
six read-only checks at 360/768/1440px for home and pricing while blocking
all non-local browser requests and preserving screenshots/traces.

This proves **local Linux production-build and browser fallback rendering**,
not VPS toolchain parity, production rollback safety, loaded Alexandria font
metrics, or English font equality. Reviewer must visually inspect artifacts
and compare Arabic/English typography before recommending release. Do not
merge or deploy until issue #26 is independently resolved with actual VPS
read-only evidence and owner approval.
