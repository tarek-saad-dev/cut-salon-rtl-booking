# CUT CLUB 2.0 — follow-up issue bodies

Parent: #34. Architecture: [blueprint](cut-club-2-blueprint.md).

These are ready-to-publish issue specifications, not created GitHub issues. The self-hosted runner cannot write GitHub; the authorized operator/hosted finalizer must create them and record their numbers and dependencies in #34. No phase is authorized merely by appearing here. Each issue gets its own `codex/issue-<number>` branch, scoped PR, verification and independent review; no automatic merge/deploy. Casher work must be assigned to its owning repository/team, with evidence linked from the website issue.

## Phase 1 — Secure member identity and close legacy authorization gaps

**Title:** CUT CLUB: verified OTP sessions, authorized BFF and legacy API security gates

**Dependencies:** #34 blueprint approval; Casher/identity owner contract and staging access approved. Blocks every member-data phase.

**Scope:** Agree verified subject/customer binding and recovery; implement OTP/session lifecycle and same-origin BFF; remediate direct legacy lookup/profile/loyalty/store/inventory authorization with Casher owner. No wallet UI, reward behavior or booking benefits. Agree cookie lifetimes and rate limits before launch. Introduce minimal login/sign-out flows without exposing legacy data.

**Acceptance:**
- Challenge expiry/reuse, enumeration resistance, rate limits and account binding tested with synthetic identities.
- Secure HttpOnly host-only opaque cookies, rotation, expiry/revocation, CSRF and safe return targets verified.
- Every BFF/server operation resolves authenticated subject; forged `clientId` and cross-account tests fail closed, including direct upstream calls.
- Casher owner supplies evidence old identifier-only reads/writes are secured; unresolved upstream gaps block member launch.
- No credentials in browser, logs or runner; no production customer mutations.

**Verification:** Mock identity/Casher contract tests and session HTTP integration tests; exact-head repository gate and independent security review. Record external owner evidence and blockers in PR.

## Phase 2 — Public explainer and isolated public/member layouts

**Title:** CUT CLUB: public explainer, stable homepage and isolated navigation shells

**Dependencies:** #34 route approval; product approval of live claims. Public explainer can precede phase 1, but sign-in/member CTA must match available functionality.

**Scope:** Implement `/cut-club`, metadata/sitemap entry, FAQs and honest join CTA; preserve `/` and `/book`; isolate public campaign/nav from member/login shells. Do not create customer-data placeholders or promote unavailable features.

**Acceptance:**
- `/` primary marketing content and canonical unchanged across auth states; no homepage redirect.
- `/cut-club` self-canonical/indexable and included in sitemap only when implemented; every advertised benefit has owner-confirmed live terms.
- Navigation follows blueprint state table; localStorage never means authenticated.
- RTL/mobile/a11y and existing booking/offer chrome preserved; no operations-domain customer links.

**Verification:** Public SEO tests, navigation/component tests and mocked session-state rendering; no production mutations.

## Phase 3 — Authorized read-only member MVP

**Title:** CUT CLUB: private dashboard, profile, wallet and memberships

**Dependencies:** Phase 1 security evidence and phase 2 layout isolation. Casher read contracts approved for each enabled widget.

**Scope:** `/club`, `/club/me`, `/club/wallet`, `/club/memberships`; reusable authorized presentation widgets. No profile edits, redemption, purchases, rewards/challenges/referrals activation or new booking benefit application.

**Acceptance:**
- Session-aware SSR and per-operation authorization; no customer selector accepted as authority.
- Private HTML/RSC/API, redirects/errors and all deep links noindex/excluded sitemap/private-no-store; no cross-account cache leakage.
- Separate points, promo credit and vouchers with units/terms/expiry; membership parity with Casher fixtures; no mock financial fallback.
- Expiry, outage, empty and unsupported states; sign-out/back/account-switch clear member state.
- Disabled later routes expose no data and are absent from navigation.

**Verification:** Parameterized SEO/header tests; two-account authorization/cache isolation tests, fixture parity, RTL/a11y; repository gate and independent exact-head review.

## Phase 4 — Secure legacy cutover

**Title:** CUT CLUB: migrate legacy account links after verified member cutover

**Dependencies:** Accepted phase 3 MVP, phase 1 legacy endpoint remediation and Tarek/Casher cutover approval.

**Scope:** Temporary secure redirects `/client` → `/club/me`, `/client/loyalty` → `/club`; strip identity queries, remove legacy fetch/navigation paths, discard `cut_client` identity and require OTP. No ledger migration or new financial behavior.

**Acceptance:**
- Old bookmarks work only through verified sessions; altered selectors never select another account.
- New public discovery and verified member navigation resolve per blueprint; `/` and public booking unchanged.
- Fixture-based parity, endpoint-hardening evidence, cache tests and safe rollback documented.
- Rollback disables access rather than restoring identifier-only endpoints or legacy wallet exposure.

**Verification:** Mocked redirect/login/back-navigation integration tests, direct endpoint denial evidence and exact-head review before switch.

## Phase 5A — Hardened rewards and booking eligibility

**Title:** CUT CLUB: authorized rewards redemption and server-owned booking benefits

**Dependencies:** Phases 1, 3 and 4 complete; explicit Casher mutation/eligibility contracts and product terms approved.

**Scope:** `/club/rewards`, server-authorized redemption/purchase if supported, and server-side member eligibility at booking checkout. Separate profile-edit or membership-purchase issues if needed; do not expand this issue implicitly.

**Acceptance:**
- Casher remains the only ledger and final eligibility authority; anonymous booking stays available.
- CSRF, subject/resource authorization, idempotency, replay and concurrent balance checks pass; stale client benefit values cannot authorize checkout.
- Promo credit/points/voucher restrictions remain distinct; audit events and authoritative refresh verified.
- No advertised reward before live terms and capability approval; safe feature disable/rollback available.

**Verification:** Mocks/staging only for mutation tests, including duplicates, insufficient balance and cross-account attempts. No real production booking or loyalty mutation.

## Phase 5B — Challenges and referrals

**Title:** CUT CLUB: Casher-owned challenges and referrals member views

**Dependencies:** Secure member platform and approved Casher capability/anti-abuse contracts; independent from phase 5A unless those contracts require it.

**Scope:** `/club/challenges` and `/club/referrals`, enabled individually only when supported. Casher owns rules, progress, event attribution and awards; no website-calculated ledger or local awards.

**Acceptance:**
- Verified per-user reads and hardened writes; referral abuse/replay/self-referral controls owned and tested upstream.
- No client-supplied identity or event can grant value; approved rules/terms and all private SEO/cache policies apply.
- Unsupported features remain unavailable and unadvertised; no personal referral recipient data leaked.

**Verification:** Synthetic event/identity fixtures, cross-account/anti-abuse contract tests, private-route matrix and independent review. Create narrower implementation issues if upstream capabilities differ.
