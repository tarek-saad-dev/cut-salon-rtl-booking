# CUT CLUB Sprint 03B — Member DTO validation before BFF integration

[Issue #45](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/45). Dependencies: data-free UI components [PR #43](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/43), restricted shell [PR #41](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/41), Casher security parent [#243](https://github.com/tarek-saad-dev/casher/issues/243).

## Delivered in this isolated PR

- `src/lib/club/memberProjectionContract.ts` uses Zod to parse a future Casher server-supplied member response, with strict ownership checks against an **already trusted server-only authenticated viewer subject**.
- Tenant must be authoritative UUID, customer ID a safe positive integer, money a nonnegative EGP minor-unit amount, Coins nonnegative integer points (or null when unavailable), vouchers separate from cash, progress bounded, bookings separate unavailable/empty/booked states.
- Every voucher and booked visit must match the same tenant and account. Conflicting non-null Coins values are rejected, not silently displayed.
- Account/tenant identifiers are stripped from the presentation DTO. No client-supplied identity, phone lookup, URL query, localStorage or API call is involved.
- `MEMBER_NO_STORE_HEADERS` is an advisory defense-in-depth response policy (private no-store, noindex), **not authorization**. No route imports this module.

## Explicit exclusions

- No login, OTP delivery, session cookie or member API. No change to live `/club`, `/`, `/cut-club`, `/client/loyalty` or Casher.
- No migration, no financial actions, no real user data, no customer lookup and no production request.
- Strict parsing **cannot protect** a public Casher API still accepting caller-supplied `clientId`. Owner checks must exist server-side at the data source.
- TypeScript `TrustedViewer` is only a shape. A future BFF must derive it solely from a revocable authenticated customer session and guard against a caller constructing it from untrusted data.
- Avoid shipping any personal member view until Casher #243 and independent two-account/tenant staging tests pass.

## Future secure BFF wiring (separate implementation issue)

1. Resolve verified customer identity through Casher session/OTP (tenant-authoritative and revocable).
2. Call a new Casher endpoint that itself authorizes all requested records against the same tenant/customer, with no insecure legacy clientId selectors.
3. Validate response with `projectAuthorizedMember(raw, trustedViewer)`; on any error, serve a generic unavailable state, never partial foreign information.
4. Apply private no-store headers on HTML, RSC and API paths, noindex and cookie/CSRF controls; ensure no public shared caching.
5. Map validated DTO to PR #43 member-view components inside authenticated /club only. Test two distinct users, revoked sessions, cross-tenant voucher/booking rejection and no balance/PII in public HTML.

## Tests

`src/lib/__tests__/memberProjectionContract.test.ts` verifies zero-vs-unavailable balances, duplicate units, foreign customer/tenant, foreign voucher/booking, strict payload validation, negatives/fractions/infinite values, no network and no unsafe embedded secret fields.

CI and independent review must verify exact PR head. Branch PR is unmerged/draft and does not authorize a deploy.
