# CUT CLUB 2.0 — host-only session cookies and BFF CSRF boundary (#60)

This Draft is built ON TOP OF Website integrated [Draft #59](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/59), and pairs with Casher [Draft #296](https://github.com/tarek-saad-dev/casher/pull/296). **No real login, server route, cookie issuance, customer API, app deployment or OTP sending is activated here.**

## Security rules implemented
- Customer browser session spec: `__Host-cut-club` with `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain`, max age = 2 hours. Never expose token via JS, URL parameters or localStorage.
- A future logout must revoke the digest-only persistent session in Casher **and** set this same cookie with `maxAge=0`; clearing the cookie alone does not revoke server access.
- Mutating club BFF endpoints must validate exact configured HTTPS Origin and `Sec-Fetch-Site: same-origin`. `Host` or `X-Forwarded-Host` must NOT become the expected origin. Explicit localhost HTTP allowed only in dev tests, not production.
- Private response headers: `Cache-Control: private, no-store`, `Vary: Cookie, Origin`, noindex/nofollow, no-referrer, nosniff.
- Must not log OTP, raw cookie, customer phone or Wallet data.

## Operational gates
1. OTP sender approved, durable rate limiting and challenge CAS applied and independently verified on authorized staging.
2. Tenant-to-customer authority resolves verified phone to exactly one active account; duplicates/ambiguous phones fail closed.
3. Casher session created only after OTP CAS + binding; Website BFF privately receives the opaque token from trusted backend, never from a browser query.
4. Validate cookie using Casher's **server-side revocable session**, expiration and tenant scope on EVERY private read/write. The cookie spec itself is NOT authentication.
5. CSRF/same-origin and authorization tests for actual routes and controlled logout; production origin configured from trusted deploy environment.
6. Stage two tenants/two customers, separate branches, old URL/clientId spoofing, cache headers, voucher ownership and financial idempotency.
7. VPS #26 rollback, safe customer support for legacy voucher balances, exact-head CI/security review and **explicit owner release go/no-go**.

## Evidence and limitation
`src/lib/club/sessionCookiePolicy.ts` pure functions + Vitest `clubSessionCookiePolicy.test.ts` protect the cookie/header policy without any HTTP route or external service. This is an integration guard candidate and is deliberately inert until the full auth chain passes independent review.

**NOT MERGED / NOT DEPLOYED.**
