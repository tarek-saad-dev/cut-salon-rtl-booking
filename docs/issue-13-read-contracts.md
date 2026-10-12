# Issue #13: public read routing after SaaS cutover

Contracts inspected in `tarek-saad-dev/casher` main on 2026-10-12:

- `src/app/api/services/catalog/route.ts` and `src/lib/catalog/publicCatalogTenant.ts`: GET `/api/services/catalog?type=serv&branchCode=...`. Branch resolves the catalog tenant. Missing/unknown context can return 404; a 404 alone does not prove which host answered.
- `src/app/api/public/client/profile/route.ts`: POST `{ phone }`. Success is `{ ok: true, client }`, with no upcoming count. This is still a legacy phone lookup; adding a branch body field would not change its tenant behavior. Backend tenant isolation of this legacy route is outside this frontend issue.
- `src/app/api/public/booking/upcoming/route.ts` and `src/lib/booking/publicBookingTenancy.ts`: POST `{ phone, limit, branchCode? }`. Branch identifies the tenant, not a booking-list filter. Reads remain cross-branch within that tenant. Omission retains the backend's CUT compatibility seam, which requires its allowlisted browser Origin and active bootstrap booking tenant. The client must never invent a branch or retry against another tenant on failure.

The existing BranchContext list is server-scoped. As on the prices page, its selected branch or first discovered public branch supplies anonymous tenant identity for catalog/upcoming reads, without selecting a booking location on the user's behalf. Catalog does not send requests before context exists. Upcoming retains the server-controlled compatibility path when discovery completes without a branch.

## Origin and PR #12

PR #12 (`fix/prices-public-api-origin`, head `1b6ec2d322329517b521ff927a5dd5017afe6c09`) changes only `src/lib/casherPublicApiUrl.ts`. This issue includes the same behavior: delegate to the validated booking API base, including production. Packages therefore receive the same correction. Reconcile/supersede that overlapping PR rather than applying two divergent origin implementations.

Catalog, profile and booking-api already used the booking base on main. The reported cutsaloon.com URLs can therefore also reflect a stale bundle or an incorrect build-time base. This change cannot repair external proxy/deployment configuration. Before release, verify `NEXT_PUBLIC_BOOKING_API_BASE_URL` identifies the Casher host at build time and rebuild; do not assume the CUT website proxies these routes. No hardcoded host or tenant fallback is introduced.

## Verification safety

Regression tests use mocked fetch responses and component fixtures. No production requests or mutations are needed. Failed/malformed reads must remain errors, with no empty-success substitution. Rate-limit expiry must not refetch automatically; retry is an explicit user action. The profile drawer offers booking lookup independently of the absent profile count.

Independent workspace review is separate from the control plane's required exact PR-head REVIEW. The GitHub-hosted finalizer publishes the patch; this runner does not push, merge or deploy.

## Workspace verification result

PR #14's verification-only follow-up is recorded in
[exact-head and main test evidence](verification/issue-13/README.md), including
captured failure output for both revisions. The results below describe the
original implementation run; the follow-up also records the supplied workflow's
successful build and the remaining verification limits.

- Targeted origin/tenant/component fixtures: 7 files, 40 tests passed; the subsequent missing-profile-origin regression also passes (issue #13 API file: 10 tests).
- The six original regression cases fail against the untouched main implementation, confirming they detect the reported behavior.
- Final full suite: 454 passed, 1 failed (73 files). It has one unrelated failure in `OctoberPackageClient.test.tsx`: `sends a Meta InitiateCheckout event from every booking button without changing the link`. The same failure was reproduced against main (expected three booking anchors, found zero).
- Explicit application TypeScript check (`tsc -p tsconfig.app.json --noEmit`) has baseline errors: 72 diagnostics on main versus 69 with this change, with no new diagnostics after normalizing line numbers. The root tsconfig check alone does not validate the application.
- `npm run build` stalled during Turbopack compilation and was interrupted; `npm run build -- --webpack` failed during compilation without detailed compiler diagnostics in this sandbox. Build success remains unverified and must be established by the workflow gate.
- Independent workspace review: PASS, no unresolved material findings. Exact published PR-head review remains required; this is not `READY_FOR_TAREK`.
- Initial `npm ci` failed at esbuild install validation with sandbox EPERM. Dependencies were installed from the existing npm cache with `npm ci --ignore-scripts --offline`; tests then ran successfully. No production APIs, data, or secrets were used.
