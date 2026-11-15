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

## Sprint B2 latest execution evidence — 2026-11-15

| Deliverable | Source candidate | Latest status |
|---|---|---|
| SQL-backed OTP challenges, atomic per-tenant rate limits, one-time CAS and revocable 2h session store | [Casher Draft #296](https://github.com/tarek-saad-dev/casher/pull/296) | **CI SUCCESS** ([run #43670493982](https://github.com/tarek-saad-dev/casher/actions/runs/43670493982)); STAGING-ONLY SQL proposal, NOT applied |
| OTP sender → verified phone → exactly one active tenant customer → durable session orchestration | Included in Casher #296 | Synthetic tests passed; NO approved provider or real customer lookup wired |
| Host-only secure CUT CLUB cookie, strict same-origin/CSRF BFF policy | [Website Draft #61](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/61) | **CI + 3 browser suites SUCCESS** ([run #43670969310](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43670969310)); no live auth route |
| Guest booking privacy/compatibility with legacy phone lookup retirement | [Website Draft #63](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/63) | Removed anonymous phone-to-name lookup and client ID browser persistence; booking remains phone + editable name; exact-head CI/browser and staging booking smoke REQUIRED |

### Newly confirmed deployment blocker

The original public BookingModal (even if /client page is retired) used `GET /api/client/lookup?mobile=` to auto-fill a returning customer's name and stored its unverified client ID in browser storage. Casher Draft #279/#294 would block that endpoint. **Release the browser-side guest-booking fallback (#63) in a coordinated reviewed website/backend bundle before quarantining the lookup on live systems.** Source audit was performed; production traffic and synthetic booking end-to-end have NOT been verified.

### Important distinction

PR #296 implements testable SQL code but **does not prove** the live tenant↔customer mapping, run a staging migration, deliver an OTP, or create a real user session. PR #61 contains cookie/security policy, not a connected authentication HTTP endpoint. Claims of “complete CUT CLUB” remain blocked by the full member Wallet API, financially atomic reward settlement, partner/rule engines, synthetic 2-tenant staging, VPS release/rollback and explicit owner release decision.

No merges or live user operations were authorized.

## Owner decision update — 2026-11-15 (Production DB + WhatsApp OTP later)

Owner explicitly approved using Production DB as the authoritative schema/data source to accelerate product development, and explicitly postponed the one-time-code transport to a future **WhatsApp message**. Neither decision approves unverified phone-only account login, cross-customer Wallet access, or skipping secure settlement tests. Previous **NO MERGE / NO DEPLOY until readiness and impact review** remains in force.

**Actual access constraint:** Only GitHub repo code tools were available to this execution — no SQL Server/SSH Production DB connection. No production DB query, staging migration, OTP send, business data read, Coins or voucher mutation has happened. [Casher #299](https://github.com/tarek-saad-dev/casher/pull/299) includes operator-verified DB metadata-only inspection template; it is NOT execution evidence. Real DB name must come from verified operator config, not a repo fallback.

### Current highest integrated development candidates

| Deliverable | PR | Exact state |
|---|---|---|
| Safe Casher member Wallet read model bound to a verified revocable session + tenant/customer ownership; real existing table shapes, no PII copy | [Casher Draft #299](https://github.com/tarek-saad-dev/casher/pull/299) | Source+synthetic tests passed CI; DB access remains disabled/not verified |
| Versioned school, university, medical and company eligibility + deduped visit challenges and referrals | Casher #299, supplemented by scalable staging-only DDL in [#301](https://github.com/tarek-saad-dev/casher/pull/301) | Rule engine/tested, no partner/growth DB tables applied, no financial awards issued |
| Transactional, idempotent Coins purchase: single atomic stock, loyalty, ledger, voucher and command record | [Casher Draft #301](https://github.com/tarek-saad-dev/casher/pull/301) | SQL code and synthetic concurrency/rollback tests; real SQL staging/Production tests pending; no live checkout |
| Real account view-model adapter into existing full mobile/desktop member overview, precise two-decimal Coins with no fake voucher/booking/EGP credit | [Website Draft #65](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/65) | Website CI + Chrome suites success; adapter not connected to live /club |
| Customer session host-only cookie and public guest booking without unauthenticated profile lookup | Website #65 includes #61 and #63 | Not deployed; safe staged browser contract |

### Product completeness / release blockers

- [ ] Actual read-only Production schema inspection and trustworthy tenant UUID ↔ SalonID ↔ legacy customer ownership mapping
- [ ] WhatsApp OTP provider, durable session installation, phone recovery/consent, cookie/BFF and new member v2 HTTP APIs; private member data stays closed until this identity chain exists
- [ ] Financial SQL staging migration, real two-session concurrency, voucher and balance reconciliation, safe Mystery Box and old redeem replacement, refunds/reversals
- [ ] Campus/medical/corporate partnership verification & dynamic benefit policy persistence and rule-management UI; challenges/referrals award settlement + fraud/budget controls
- [ ] Connect authenticated data to approved mobile/desktop CUT CLUB experience and run customer-journey tests, all branches and POS/booking unaffected
- [ ] Independent security/design review, VPS build/atomic rollback, staged coordinated release, explicit exact-head owner merge/deploy approval

### Business takeaway

The project has grown from screen mockups to a concrete, testable Casher data projection, scalable policy engine, and first idempotent checkout transaction candidate. **It is still NOT a complete live customer-ready CUT CLUB 2.0**, and neither Production DB nor secure login were used for data access in this execution. All source changes are in open Draft PRs; no release has been performed.
