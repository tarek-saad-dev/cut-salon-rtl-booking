# CUT CLUB 2.0 — future member BFF authorization gate (#54)

## What this Draft adds
`src/lib/club/memberBffGate.ts` is a **pure, non-routable**, server-side orchestration contract for future authenticated member reads. It is NOT a browser auth API and makes no network/database calls in this PR.

- Disabled by default unless a future trusted caller explicitly enables the gate.
- A FUTURE authoritative server-only resolver must load a **revocable opaque session** from durable storage. A browser-provided token or phone number never becomes the customer ID.
- Session must have OTP verification evidence, same authoritative tenant UUID, positive customer ID, valid session ID, 2-hour maximum lifetime, non-revoked state and valid timestamps.
- Only tenant+customer key derived from that session is passed to a future scoped data loader.
- The loaded record's owner must match tenant/customer **before** strict projection.
- Exceptions, missing sessions, wrong tenant/customer or invalid projected response yield identical generic unavailable results; never return foreign account data or data-store errors.

## This is NOT full security yet
The synthetic test resolver can return a fake session: TypeScript types and orchestration checks do **not** prove real OTP, cookie authenticity, revocation or per-row SQL ownership. An actual route MUST:
1. Authoritatively determine tenant from server-controlled routing/branch mappings.
2. Use OTP B1/B2 Casher contracts, durable rate limits and a trusted OTP provider; issue opaque, host-only HttpOnly/Secure cookies only after verified unique account binding.
3. Resolve and verify session from server cookie digest via dedicated session repository and block all revoked/expired sessions.
4. Delegate to NEW Casher member endpoints that independently enforce tenant/customer ownership. Never use legacy `?clientId=` routes.
5. Integrate reviewed [memberProjectionContract Draft #47](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/47) into `project`; current Draft #54 does not import unmerged #47.
6. Add same-origin/CSRF protection, request and response no-store/noindex policy, network isolation, logs without PII, and synthetic 2-user/2-tenant staging tests.
7. Pass independent security review before enabling /club or returning real balances/vouchers.

## Tests
`src/lib/__tests__/memberBffGate.test.ts` covers feature-disabled no-service-call behavior, missing/revoked/expired/foreign sessions, forged client ID in caller object, wrong resource owner, and fail-closed errors using synthetic fixtures only. No route, cookies, OTP sends, DB, private endpoint or real customer data added.

## Release gate
- [ ] Exact-head CI/build and independent review
- [ ] Verified customer OTP/session authority and tenant binding (Casher #243/#257)
- [ ] Approved secure DTO projection, strict owner-scoped Casher API, cookie/CSRF configuration
- [ ] Staging and real VPS rollback evidence
- [ ] Separate explicit owner approval of merge/deploy

**DRAFT only. No production merge/deploy or real customer data touched.**
