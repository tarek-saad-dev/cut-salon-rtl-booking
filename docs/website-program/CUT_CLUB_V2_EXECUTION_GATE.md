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

## Latest exact-head validation — 2026-11-15
- [Casher Draft #299, CI #43672649860](https://github.com/tarek-saad-dev/casher/actions/runs/43672649860) SUCCESS: session-gated Wallet source, member projection, tenant/branch growth rules and production metadata-only SQL template.
- [Casher Draft #301, CI #43673423035](https://github.com/tarek-saad-dev/casher/actions/runs/43673423035) SUCCESS: SQL SERIALIZABLE reward purchase candidate, synthetic double-submit/rollback tests, reviewed growth persistence schema proposal, full production build. **NO real SQL concurrent test, no schema applied.**
- [Website Draft #65, CI #43672805842](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43672805842) SUCCESS: exact-decimal Wallet view adapter, previous responsive/mobile/desktop Chrome suites and Next build.

**Actual production database data access: NOT PERFORMED (no connected SQL Server execution tool).** WhatsApp OTP transport deferred by owner; customer private pages remain inaccessible without a verified session, and old financial operations remain quarantined in unmerged Draft code. All three PRs remain unmerged and not deployed.

## Client + cashier synchronized voucher workflow (2026-11-17)

The owner requested CUT CLUB be ready for **customers and cashiers**. Development progressed on both channels in coordinated, **unmerged Draft PRs**:

| Journey | New candidate | Status / scope |
|---|---|---|
| Customer dashboard responsive layout, Coins and member information | [Website #65](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/65) | CI + browser passed, data adapter isolated; real account auth still OFF |
| Customer-owned voucher proof presentation | [Website #67](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/67) | UI and CI/browser tests passed; explicit show/hide/copy only after verified callback, no code in initial HTML; real BFF/WhatsApp login still OFF |
| Customer voucher-code owner proof in Casher | [Casher #305](https://github.com/tarek-saad-dev/casher/pull/305) | Strict revocable session+TenantId+ClientID+inventory match, reject USED/expired/foreign; no HTTP route and no live login |
| Cashier voucher scan and free-service confirmation | [Casher #303](https://github.com/tarek-saad-dev/casher/pull/303) | Authenticated staff+operable branch, invoice/client/branch matching, 1-transaction conditional ACTIVE->USED, replay-safe usage log; feature flags default OFF |
| Cashier old one-click modal | Casher #303 | Existing workflow formerly marked voucher used before invoice save. Draft removes optimistic consumption and links cashier to the verified process; old unsafe POST returns 410. Requires coordinated rollout to avoid interrupting current staff |
| Rewards finance | [Casher #301](https://github.com/tarek-saad-dev/casher/pull/301) | Stock/Coins/ledger/voucher atomic settlement candidate + growth tables, synthetic tests, NOT live |
| School/medical/corporate and visit/referral rules | [Casher #299](https://github.com/tarek-saad-dev/casher/pull/299), #301 | Versioned rule evaluators and schema draft; actual settlement/partner enrollment not live |

### Real end-to-end acceptance steps still mandatory

- [ ] **Verified client sign-in via WhatsApp one-time code**, durable revocable sessions and cookie/BFF; owner asked to defer transport temporarily but NOT to expose financial private accounts by phone alone.
- [ ] Direct SQL Server Production **metadata-only read** with operator connection, schema/key/tenant/branch mapping and owner-approved migration. GitHub access so far DID NOT connect or query Production DB, despite owner's permission.
- [ ] Authoritative **legacy SalonID versus BranchID mapping** and route-family tenant scoping, particularly GLEEM vs CAMP SHIZAR.
- [ ] Real SQL Server concurrency / refund / reversal / voucher reuse tests and preservation/reconciliation of existing Coins+vouchers. Current test suites are simulated and static; production financial effect is OFF.
- [ ] **Customer personal wallet BFF and code reveal endpoint** connected to Casher session+ownership; member /club page currently safely inaccessible.
- [ ] All cashier reward types, discount/service/product/bonus/Mystery Box, must have proven invoice effects and not charge customers twice. New cashier V2 currently only proves FREE_SERVICE after a zero-priced saved invoice service line.
- [ ] Cross-device staff cashier UX test with actual barcode/typed voucher code, verified invoice and branch, failed network retry, old current users support.
- [ ] Public booking, booking changes and POS unaffected by legacy quarantine; coordinated website+Casher release plan, rollback, security review, explicit exact-head owner merge/deploy approval.

**Latest release verdict: NO GO.** Green source tests and UI tests are not a substitute for verified identity, live SQL schema authority, accounting reconciliation and end-to-end on a controlled environment. **No PRs merged/deployed in this work**.

### Additional cashier tenant mapping gate (2026-11-17)

Review of Casher checkout revealed that a legacy reward item's `SalonID` is NOT proven to equal a session `BranchID`. Using the same integer would create a potential privacy/eligibility error across branches. [Casher integrated Draft #305](https://github.com/tarek-saad-dev/casher/pull/305) now resolves legacy SalonID from an explicitly configured trusted TenantId + BranchID mapping (no arbitrary browser override) and **fails closed** when mapping is unverified. All V2 cashier GET/POST plus legacy voucher GET require this guard. The real mapping must be read and confirmed from actual production schema by an authorized operator before flags are enabled. All checkout/voucher flags remain off, and no production DB access/deployment was made.

## Production DB metadata and cashier voucher compatibility implementation — Nov 17, 2026

New integrated [Casher Draft #307](https://github.com/tarek-saad-dev/casher/pull/307), stacked after #305 (which stacks after #303/#301/#299):

- Manager-only `/admin/cut-club-readiness` displays non-misleading launch blockers. Operator-controlled `GET /api/admin/cut-club/readiness` reads SQL Server **sys metadata only** if explicitly enabled; it checks expected DB name in the query itself and lists missing columns, without customer rows/PII or writes. This route was **not run on Production** in this execution.
- Existing cashier POS voucher listing by customer ID or phone now requires operable staff branch, client tenant ownership and operator-reviewed **BranchID→legacy SalonID** mapping, applied in the SQL SELECT before returning vouchers. No wildcard private CORS.
- V2 cashier voucher confirmation now checks `Quantity=1` before marking used, because multi-quantity bundles could otherwise be consumed as one unit. Legacy `TblInventoryUsageLog` matches exact usage log columns, including `BookingID` NULL. Changing the voucher code clears a stale invoice ID.
- New synthetic metadata/schema checks and POS branch-scope tests are gated in CI, along with existing cashier/client security suites and build.

### Still required for *actual* client/cashier readiness
- [ ] A real Production DB read-only metadata pass via approved operator connection, expected DB name and complete legacy SalonID/BranchID mapping
- [ ] Verified WhatsApp customer identity and revocable session, authorized Wallet BFF API, real private member experience wired to UI; current /club remains locked
- [ ] Real SQL two-connection concurrency + invoice benefit/sale/cancellation/reversal tests, per-customer voucher ownership and correct financial ledger, production-independent staging fixtures
- [ ] Full customer reward types and Mystery Box safe transactions, affiliate/medical/school programs persistence and operations
- [ ] Production browser/real cashier-device E2E rehearsal for Gleem and Camp Shizar, rollbacks and explicit exact-head owner launch authorization

**Current status: DRAFT / NO-GO. No merge, deployment, or customer financial write was carried out.** Owner Production DB permission acknowledged but this tool execution has GitHub access only. Metadata code is a deployment candidate, NOT production inspection evidence.
