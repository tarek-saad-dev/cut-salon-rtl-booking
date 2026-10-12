# Issue #15: loyalty identity safety and release dependency

The frontend previously trusted `?clientId=`, a localStorage ID, or (as a fallback) a phone as ClientID. All loyalty/store/inventory reads and both redemption/purchase mutations omitted tenant identity. A SQL INT check alone cannot establish customer ownership or tenant membership.

This patch is containment: `/client/loyalty` shows temporary unavailability and performs no customer requests. Every exported loyalty/store action independently rejects before fetch, including valid numeric IDs. ClientID validation accepts only positive SQL INT integers (1–2147483647), rejects phone-shaped leading-zero strings, fractions and overflow. No legacy phone lookup, fabricated tenant, anonymous default tenant, or URL identity is used.

## Backend coordination required before restoring access

Backend issue: tarek-saad-dev/casher#92. No verified loyalty identity contract is present in this repository; the legacy `/api/client/lookup?mobile=` route provides neither verified authentication nor tenant membership. Its response must not be used to unlock loyalty.

Release of a working loyalty flow remains blocked until backend owners confirm:

- The supported authenticated session or verified lookup/OTP endpoint, request/response schema, credentials transport, expiry and revocation. Phone verification must be server enforced; browser storage is not authentication.
- Explicit branch context and its server-side tenant resolution, exact field/header names, and fail-closed behavior for missing/unknown/mismatched context. No fallback to the default tenant.
- Ownership enforcement for dashboard, activity, rewards, redemption, referral, store, purchase and inventory. The server must reject foreign-tenant/customer IDs even if they are valid SQL INTs. Branch changes must invalidate identity and clear displayed data.
- Response identity binding and safe mutation authorization, including replay/CSRF protections applicable to the selected authentication transport.

After confirmation, replace the unconditional identity guard with the confirmed session adapter, propagate the confirmed branch/tenant context on **every** endpoint, verify response binding, and add mocked happy-path, expiry and cross-tenant rejection tests before independent review. Do not merely remove the guard or restore the saved-ID/phone fallback. This patch does not claim the backend contract has been coordinated or that authenticated loyalty is complete.

## Verification

Regression tests cover SQL INT boundaries and assert zero network calls across all eight API actions for phone IDs and unverified valid IDs. Page tests cover phone-only storage, stored IDs and URL IDs, including retry. All checks use mocks; no production customer/business data is mutated.

Local results: targeted loyalty tests passed (2 files, 28 tests); `npx tsc --noEmit` passed. The control workflow remains responsible for the full repository verification gate. No live API checks were performed.

`npm run build` did not finish during the local check: it remained at “Creating an optimized production build” without further output and was interrupted (exit 130). Build success is unverified; the workflow must complete that gate before release.
