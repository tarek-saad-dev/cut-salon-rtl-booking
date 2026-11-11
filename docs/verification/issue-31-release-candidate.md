# Issue #31 release candidate

Status: draft integration for REVIEW, not READY_FOR_TAREK. Production unchanged.
Request: issue-31-execute-1. The GitHub-hosted finalizer must publish the patch
on codex/issue-31 against main; this workspace does not commit, push or move HEAD.

## Scope and decisions

Base: b9f6874c28d5c7914e498ab4f2910b7098643a9c.
Complete source diffs integrated from:
- PR #29 / issue #28: e67b1ed94ee36dedbb3f1fd71e84098632a1b403.
- PR #30 / issue #26: db079081094a62669833517a54df0947b2f8efd3.

Both pinned refs were available locally. Fetch encountered read-only .git/FETCH_HEAD;
no ref update was necessary. Binary diffs from origin/main applied without conflicts.
Integration changes only: require six canonical sitemap URLs, update offline fixtures
(including four-only, wrong-sixth and duplicate negatives), run Node fixtures in npm test,
and add this checklist. Existing six-URL SEO and branch tests are retained.
Booking links remain /book. Booking/API caching and mutation code are untouched.

PR #27 / issue #25 at 17e4a8630e8de7757162bf1da31d8a7157d1063b is deferred.
It overlaps layout.tsx/globals.css and introduces next/font/google loaders. Do not
merge it alongside this candidate or silently restore Google build-time loaders.
A later performance issue must reconcile its diff against this release, choose a
compatible font strategy, test with the actual VPS toolchain, compare Arabic/RTL
font rendering against baseline, and obtain exact-head CI and independent review.
Issues #26, #28, #25 and their PRs remain separate, open and unmerged.

## Endpoint contract

Canonical origin: https://cutsaloon.com. Exactly these six sitemap entries:
- /
- /prices
- /book
- /offers/november-protein
- /branches/gleem
- /branches/camp-caesar

The release checker performs only GET /, /sitemap.xml and /robots.txt at an
explicit HTTP(S) root origin, rejecting credentials, paths, query and fragments.
It rejects redirects and non-200 responses; checks homepage HTML, XML sitemap
canonical membership/count, and robots crawl access/canonical sitemap. It does
not GET all six pages or establish that Google indexes them. Fixtures use no
public network. No bookings or customer/business data were mutated.

## Evidence boundaries

Owner-provided base-PR evidence (not combined-head evidence):
- PR #29 exact-head CI [43110984212](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43110984212): SUCCESS; independent review PASS.
- PR #30 exact-head CI [43115918098](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43115918098): SUCCESS; independent review PASS.

The combined SHA is assigned by the finalizer. Record its SHA, hosted CI run,
and independent exact-head review in the draft PR. Neither base CI nor local
tests certify that new head. Request independent REVIEW through the control
plane after publication. Do not mark READY_FOR_TAREK.

Confirmed historical failure per issue evidence:
[41973818496](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/41973818496)
failed in sudo /usr/local/sbin/deploy-cutclient with
"next/font/google queries have exactly one entry" and
"Can't resolve '@vercel/turbopack-next/internal/font/google/font'" for Alexandria.
Root cause of VPS divergence is unproven (cache, network, Next/toolchain etc.).
This source mitigation removes the build-time Alexandria Google loader while
retaining CSS runtime Alexandria and local LAXR. It does not prove production fixed.

NAP remains unresolved: the existing homepage footer's exact Gleem street is
disputed. The new Gleem page intentionally states locality only; schema omits
streetAddress. Owner verification of the real address and consistent NAP is a
release stop condition, not permission to invent or silently alter an address.

## Operator-only read-only VPS audit (not executed)

Only an authorized operator with read-only access should perform this audit.
Do not execute SSH from this runner. Do not run the deployment script, install
packages, build in the live directory, remove caches, restart services, or
change symlinks. Do not print environment variables, credentials or process
environments; redact secrets from any configuration/script evidence before sharing.

In the verified checkout/build directory, record sanitized output of:

```sh
node --version
npm --version
git rev-parse HEAD
sha256sum package-lock.json
npm ls next react react-dom --depth=0
```

Record shell/runtime paths and the service account's effective Node/npm versions
without dumping its environment. Compare the exact candidate SHA and lockfile
checksum with hosted CI. Inspect /usr/local/sbin/deploy-cutclient locally through
authorized read-only access; share only a sanitized description of its actual
steps. This external script is absent from the repository. Inspect the actual
service manager's unit/configuration and rollback path, avoiding secret-bearing
fields. Establish service working directory, live build directory, executable,
release symlink target (readlink only), asset location and health-check routing.
Do not assume a service name, manager, or filesystem path.

The repository workflow pushes main -> SSH -> sudo script. It demonstrates no
pre-deployment build or rollback guarantee. Before release approval, prove:
- Builds occur in an isolated release directory without overwriting live assets.
- Build/type/test failures leave the running release intact.
- Cutover is atomic, assets remain compatible, and health checks gate acceptance.
- A known previous artifact and safe rollback procedure exist, including what
  happens on failed health checks and who is authorized to restore it.
- Actual VPS toolchain can build this exact lockfile/head in an authorized safe
  staging context in a later approved stage; this read-only audit does not build.
- Fonts render correctly vs baseline on representative Arabic/RTL pages.
- Read-only public checks confirm expected pages, headers, canonical/robots,
  sitemap and fonts after an explicitly approved future deployment.

Stop if rollback or atomic cutover is unknown, live build/service path is unknown,
font rendering is unverified, exact footer NAP is unresolved, or production
success is unverified. No claim of server safety, successful deployment or URL
indexability follows from source checks or a successful homepage response.

Without authorized VPS access we cannot verify the script, effective runtime,
live SHA/lockfile/dependencies, filesystem permissions/cache/network, service
paths, atomicity, retained artifacts, rollback, or production font rendering.
No such access or production secrets were used.

## Handoff gate

- [ ] Finalizer opens integrated draft PR against main on codex/issue-31.
- [ ] Record combined exact SHA and green standard hosted CI (including Node fixtures).
- [ ] Request independent exact-head review; resolve material findings.
- [ ] Authorized operator supplies sanitized VPS deploy-path and rollback evidence.
- [ ] Owner resolves NAP and accepts font baseline evidence.
- [ ] Explicit owner approval only after safe immediate deployment is demonstrated.

Do not merge or deploy as part of this issue execution.

## Local execution record

Implementation sequence: apply both exact source diffs; reproduce six/four
compatibility failures in fixtures; update the checker and standard test command;
verify offline and document the operator handoff. No commits or HEAD changes.

- Ordinary npm ci failed at esbuild install.js with spawnSync EPERM in this
  isolated runner. This is an environment limitation, not a hosted CI result.
- npm ci --ignore-scripts succeeded (555 packages); it is a diagnostic workaround,
  not equivalent to the ordinary install gate.
- Direct Vitest execution after that install: 81 files, 491 tests passed,
  including the unchanged six-URL SEO assertion and branch tests.
- npx tsc --noEmit --incremental false: exit 0.
- node --test scripts/check-release-health.test.mjs: exit 0, offline fixtures.
- git diff --check: exit 0.
- Full standard test/build outcomes are reported in the execution handoff;
  hosted CI remains mandatory. Existing React act/Browserslist warnings appeared.

Final standard npm test: exit 0, 81 Vitest files / 491 tests plus the Node
health fixture file passed. All imported files were byte-compared with their
pinned source commits; only the documented checker/fixture changes differ.
The direct Next build remained at "Creating an optimized production build"
and was interrupted (exit 130). Subsequent npm run build attempts exited 1
with "Another next build process is already running." This lock contention
followed the local interrupted attempt; it is not evidence of a source
regression or the original VPS font failure. No local production build pass
is claimed. Do not waive hosted CI or actual VPS deploy-path verification.
