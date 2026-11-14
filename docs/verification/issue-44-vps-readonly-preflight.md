# CUT Salon VPS — Read-only readiness diagnostic

Issue [#44](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/44) · Related font incident [#26](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/26), unmerged mitigation [#30](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/30) and [#32](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/32).

This is a **nonproduction source/toolchain fingerprint**, NOT a VPS access tool, release authorization or repair. It never opens SSH, connects to the website, reads environment variables, sends customer data, builds, or edits files.

## Usage by an authorized operator

From an **isolated, nonproduction checkout** with the branch under review:

```sh
node scripts/cut-vps-readonly-preflight.mjs --json
node --test scripts/cut-vps-readonly-preflight.test.mjs
```

The JSON output intentionally omits full source, absolute paths, user names, host names, secrets and environment. It only reports runtime Node version, lockfile hash, locked Next version and whether the source still contains a build-time Alexandria `next/font/google` import. A source-level font removal is useful mitigation evidence but never proves the real VPS can deploy.

For test/build in isolated storage use only an authorized nonproduction runner; do not run a production build against the current live assets.

## Interpretation

- `buildTimeAlexandriaGoogleLoader=true`: current main still uses the build-time Alexandria font loader associated with the 2026-11-05 failure; do not claim it can be deployed.
- `false`: this candidate removed the known source dependency; **cannot prove VPS is fixed**.
- `unknown`: input file missing; fail closed.
- `prodDeploySafe` is **always false**; this tool cannot certify rollback, live paths, server resources or real deployed SHA.
- No version string, checksum or CI passing can replace the actual VPS runtime build check.

## Required evidence, not collected by this PR

1. Authorized operator inspects effective production Node/npm/toolchain and running release hash **read-only**; redact logs and any secrets.
2. Identify external `/usr/local/sbin/deploy-cutclient` script's behavior in a sanitized operator report. Does it build in an isolated release directory, preserve old assets, and only cut over after a successful build?
3. Demonstrate that failed build leaves live site unchanged and that prior artifact/rollback exists, without modifying production during this preflight.
4. Build approved font-mitigation candidate on the same toolchain in a **safe isolated environment**, with Arabic/English visual comparison; verify no Google font loader regression, asset paths or caching issues.
5. After a separately approved merge/deploy, inspect GitHub production workflow result and perform read-only `/`, `/robots.txt`, `/sitemap.xml` checks; no real booking or loyalty actions.

The known VPS main deploy [#41973818496](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/41973818496) failed on Turbopack Alexandria `next/font/google` resolution. **Do not merge** PR #36 (docs only) or the public CUT CLUB PRs solely on their successful GitHub/Vercel CI because every push to main triggers the VPS deployment.

## Verification of this tool

`scripts/cut-vps-readonly-preflight.test.mjs` covers baseline loader, source mitigation, unknowns and secret redaction. `src/lib/__tests__/cutVpsReadiness.test.ts` runs the Node fixtures from the ordinary site Vitest suite.

No production access, external scripts, migrations, OTP, booking or customer data. No changes to deployment workflows. Merge/deployment requires explicit owner approval **after** VPS rollback/build gates.
