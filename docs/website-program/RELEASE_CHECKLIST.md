# CUT Salon — Controlled CUT CLUB Release Checklist

> Written 2026-11-14 (Africa/Cairo). This document defines **how** to release. It does not itself approve a merge, change Production, or attest that any given URL is live.
> Website repository: https://github.com/tarek-saad-dev/cut-salon-rtl-booking
> Casher repository: https://github.com/tarek-saad-dev/casher

## Approval scope

**Human owner approves and merges each PR. Agents do not merge.**
In this system, a human merge to `main` may automatically trigger VPS production deployment. Therefore no merge is "just staging". Immediately before each merge, check the EXACT head SHA and all required checks.

## Preferred order — independent approvals

| Order | PR | Scope | Gate before owner merges | After merge |
|---|---|---|---|---|
| 1 | [Website #36](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/36) | Project contract / roadmap / tracker | Doc review, links and whitespace, exact-head CI | Confirm docs in main; update work log with merge SHA and deployment state if any |
| 2 | [Website #39](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/39) | Member routing/security blueprint | Docs-only review, no fake claim of implemented auth | Verify actual decision version; do not enable /club data |
| 3 | [Website #38](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/38) | Public /cut-club + nav + SEO | Full CI, Playwright AR/EN 360/390/768/1024/1279/1280/1440, correct sitemap based on CURRENT main, no nav conflicts | Read-only check HTML, canonical, links, navigation and sitemap on real deployment |
| 4 | [Website #41](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/41) | Restricted /club UI shell ONLY | Exact-head CI + browser headers/route behavior and security review | Read-only check /club shows **unavailable** only, noindex/no-store, no personal requests |
| Separate | [Casher #251](https://github.com/tarek-saad-dev/casher/pull/251) | Signed customer assertion verifier + source audit | Independent security review, targeted tests, no claim of securing legacy endpoints | Verify no new unauthenticated data surface or changed POS behaviors |
| Separate | [Casher #256](https://github.com/tarek-saad-dev/casher/pull/256) | Offline OTP state machine/session domain | Independent security review, targeted tests, CI/build, no provider/HTTP endpoint | No login or OTP send enabled; parent [security #243](https://github.com/tarek-saad-dev/casher/issues/243) still open |

**Do not** batch merge PRs without checking downstream base and refreshed tests. Separate unrelated PR #32 (font + branch pages), #33 (services/prices) must be handled by their own owner-approved release process; rebase and reconcile sitemap/routes if those merge first.

## Before *every* approved website PR merge

- [ ] Confirm current main SHA and head SHA match review and latest successful checks
- [ ] Confirm no merge conflict or stale-code assumptions after prior PRs
- [ ] Confirm Change Control does not alter locked Contract without a Decision Log entry
- [ ] Confirm website `/`, `/book`, `/prices` remain available/linked
- [ ] Confirm public content is accurate and private routes do not enter public sitemap
- [ ] Confirm no hidden DB migration or external notification/PII behavior
- [ ] Get explicit owner approval for THAT PR; record who approved and when

## Read-only smoke after approved production deployment

**Public /cut-club**:
1. GET public HTML with one clear H1, canonical `https://cutsaloon.com/cut-club`, publicly readable membership explanation and sensible mobile behavior.
2. Confirm /book and /prices navigation and no false live features or prices.
3. Confirm robots/sitemap includes public route exactly once; no private URLs.

**Private /club restricted shell**:
1. GET route without login: only restricted notice, no sample CUT Coins, customer name, voucher or real membership info.
2. Confirm `X-Robots-Tag: noindex` and `Cache-Control: private, no-store` on /club and child paths.
3. No user profile/store/ledger API requests made in browser; feature flag does not bypass unavailable notice.
4. Confirm no booking, customer or financial mutations occur in smoke.

**Do not** submit real booking forms, send OTP messages, redeem vouchers or modify customers as release checks.

## Failure / rollback plan

- If deployment fails, record exact GitHub Actions run ID, main and deployed SHA, reason, severity and owner.
- Roll back through existing documented release process. A PR revert may trigger another production deployment: always require owner approval.
- If public page fails only due to media/layout, restore stable layout or revert scoped PR; do not clear customer cache/data indiscriminately.
- If private headers/data isolation fail, keep member data feature **OFF** and stop the release. Customer API access remains blocked until security #243 closure.
- Document post-incident learning in DECISION_LOG and WORK_LOG.

## Membership/Wallet **launch blockers**

Even after all 4 website PRs are merged, member login and wallet are NOT live. These remain mandatory:

- [ ] Approved delivery provider and verified OTP issuance
- [ ] Durable rate-limited/atomic challenge store [Casher #257](https://github.com/tarek-saad-dev/casher/issues/257)
- [ ] Revocable customer sessions and tenant-account binding
- [ ] BFF CSRF/Origin/credential policy and confidential session transport
- [ ] Secure every personal GET, buy/open-box POST and voucher endpoint against clientId impersonation
- [ ] Cross-tenant and cross-customer negative staging tests, refunds/idempotency test, rollout flag and rollback
- [ ] Explicit owner authorization to activate actual member features after review

## Evidence entry template

- Date/time (Africa/Cairo):
- PR and issue:
- Current main SHA:
- Reviewed head SHA:
- CI + real-browser/staging links:
- Owner approval:
- Merge SHA:
- Deploy workflow / deployed SHA:
- Read-only production smoke URLs and result:
- Rollback ref:
- TASK_TRACKER + WORK_LOG updated:

**Status vocabulary:** PR_OPEN / IN_REVIEW / READY_FOR_APPROVAL / MERGED / DEPLOYED / VERIFIED_LIVE. Do not treat these states as synonyms.
