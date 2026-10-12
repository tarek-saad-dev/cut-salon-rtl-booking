# PR #14 verification finding

FIX_FINDINGS evidence captured on 2026-10-12. Application code and tests were
left unchanged: the only PR-head test failure also occurs on main.

| Revision | Command | Exit | Test files | Tests |
| --- | --- | --- | --- | --- |
| PR head `1dbea0363fadd887fe81a1763029a6566dfd485d` | `npm test` | 1 | 72 passed, 1 failed | 454 passed, 1 failed |
| `origin/main` `581b60e2d1c97bc2332b0a7ebfadfdad8b80b2cf` | `npm test` | 1 | 70 passed, 2 failed | 442 passed, 2 failed |

[Head output](pr14-head-tests.txt) and [main output](pr14-main-tests.txt) retain
every file result, the complete failed-test sections, and Vitest totals. Routine
stderr warnings and passing-test timing details are omitted. These are fresh
local executions, not recovered logs from the earlier workflow.

## Failure comparison

Both revisions fail `OctoberPackageClient.test.tsx:166`, test
`sends a Meta InitiateCheckout event from every booking button without changing the link`:
expected three booking anchors, received zero. The test mocks `packagesApi`
and branch context. The test, component, October configuration, URL builder,
package manifests, Vitest configuration, and test setup are identical between
these revisions. This proves the remaining head failure is pre-existing;
the assertion fails before its simulated booking-button clicks.

Main additionally fails `serviceStepsApi.test.ts:76`, test
`sends branch identity for public execution stages`, because no booking API base
is configured. The PR already supplies a mock base URL and resets environment
and URL-cache state in this test. The test passes on the PR head.

## Reproduction and limits

Node `v22.23.2`, npm `10.9.8`. Normal `npm ci` failed during esbuild's installation
validation with sandbox `spawnSync ... EPERM`. `npm ci --ignore-scripts --offline`
succeeded using the cached locked dependencies. Both full suites used that same
dependency installation. Main was extracted with `git archive origin/main` into
`/tmp/pr14-main-baseline`, with its `node_modules` symlinked to the head workspace
installation. No main source files were modified. No API base override was added
to either full-suite command.

```sh
npm ci --ignore-scripts --offline
npm test
mkdir -p /tmp/pr14-main-baseline
git archive origin/main | tar -x -C /tmp/pr14-main-baseline
ln -s "$PWD/node_modules" /tmp/pr14-main-baseline/node_modules
(cd /tmp/pr14-main-baseline && npm test)
git diff origin/main HEAD -- \
  src/components/offers/october-package/OctoberPackageClient.test.tsx \
  src/components/offers/october-package/OctoberPackageClient.tsx \
  src/config/octoberOffer.ts src/lib/book-o2/buildBookHref.ts \
  package.json package-lock.json vitest.config.ts src/test/setup.ts
```

The final diff command produces no output. The supplied exact-head workflow
reports build exit code 0; this fix run did not repeat the build. The workflow
must run its normal verification gate and the resulting head must receive
independent review. The historical workflow test log was not available in this
workspace, so it cannot be asserted to have had exactly these failures.

No production API requests, business-data mutations, secrets access, pushes,
merges, or deployments were performed. PR #12 reconciliation remains a release
step; its non-blocking note is outside this verification-only fix. This evidence
does not itself declare `READY_FOR_TAREK`.
