# CUT CLUB 2.0 — integrated completion / launch decision gate

> 2026-11-15. This is the **source-controlled operational truth**, not a claim of live deployment.
> Owner has approved replacing the unsafe legacy CUT CLUB customer experience **as a product direction only**. No merge to main or production deployment, staging database mutation, Coins adjustment or OTP send is approved.

## What is materially implemented and combined

| Workstream | Integrated candidate | Proof / limitation |
|---|---|---|
| Public experience, marketing SEO and /cut-club | Website [Draft #59](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/59) includes source PR #38 | Combined website CI/browser jobs must pass on exact current SHA |
| Members desktop/mobile UX, 7 connected screens | [Draft #57](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/57), included in #59 | Synthetic fixture personas only, dev-only route; financial controls disabled |
| Private /club shell + member summary widgets + verified owner DTO contract | #59 includes source #41/#43/#47/#55 | Server auth/BFF guard is **not** wired to a live session or Casher member API |
| Retire legacy /client and /client/loyalty | #59 includes #51/#53 | No real client data; backend must be released safely with maintenance plan |
| OTP verifier/domain & preflight schema guard | Casher [Draft #294](https://github.com/tarek-saad-dev/casher/pull/294) includes #251/#256/#259 | Offline OTP logic and metadata-only schema inspection; **NO real OTP delivery, persistent session or schema migration** |
| Quarantine unsafe Coins mutations and private GET/profile lookups | Casher #294 includes #266/#271/#273/#275/#279 | Would disable old live endpoints if deployed; no safe replacement yet |
| Public catalog presentation data separation | Casher #294 includes source #277 | No active tenant-safe catalog endpoint; it is only a pure DTO projector |

## Business acceptance / MUST be green before any pilot

- [ ] **Identity:** verified phone OTP vendor, cost and rate limits, durable challenge/session store, recovery and duplicate-phone policy.
- [ ] **Ownership:** authoritative tenant-to-legacy customer mapping in guarded staging; separate GLEEM/CAMP SHIZAR branch mapping and cross-account deny tests.
- [ ] **Data:** member-facing private GET API for actual balances, visit summary, ledger, pending/used vouchers, privacy and no-cache, linked to Casher source of truth.
- [ ] **Commerce:** new server-side atomic, idempotent balance+voucher+stock settlement; reward terms, thresholds, expiry and finance/accounting sign-off, Mystery Box odds/stock controls.
- [ ] **Growth:** dynamic school/university/doctor/company memberships and agreement eligibility; verified enrollment, tier policy and expiry; event-driven challenges/referrals/physical gifts with anti-abuse/budget controls.
- [ ] **Design:** final user acceptance for mobile 360/390/430 and desktop 1024/1280/1440, Arabic/English if desired, keyboard and no overflow. Screens above are **review preview**, not all production-connected.
- [ ] **Operations:** staff playbook for existing vouchers, preservation/reconciliation of historical Coins ledger, old deep-link support, booking and POS smoke test.
- [ ] **Release:** website VPS #26 real build/atomic rollback proven, API + UI staged version coordination, two-account/two-tenant synthetic staging E2E, independent security review, explicit owner exact-head merge/deploy approval and post-release read-only monitoring.

## Feature flags and rollout shape

- Public `/` and `/book` operate normally. Public `/cut-club` may ship only with honest claims matching features already launched.
- Private `/club` stays fail-closed until real verified identity and scoped APIs. No URL clientId/phone lookup as auth.
- Local dev preview `/dev/cut-club-preview` requires `NODE_ENV=development` and explicit flag and always returns 404 in production. Do not publish its synthetic numbers as live pricing/rewards.
- Old unsecured writes/reads may be quarantined only within a coordinated approved customer-maintenance release, not by an isolated accidental backend merge.
- Never delete existing Coins, journal rows or vouchers to accelerate a deadline. Do not revive vulnerable endpoints as rollback.

## Decision

**CURRENT RELEASE GATE = NO GO**, regardless of individual CI success, until actual OTP, secure member APIs, financial transaction controls, staging tests and real VPS checks pass. Safe mock experience and source integration can be demonstrated, but are not complete commercial implementation.

### Evidence links
- Website integrated [Draft #59](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/59)
- Casher integrated [Draft #294](https://github.com/tarek-saad-dev/casher/pull/294)
- UX interactive [Draft #57](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/57)
- Casher auth parent [#243](https://github.com/tarek-saad-dev/casher/issues/243)
- Website VPS build/rollback [#26](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/26)
