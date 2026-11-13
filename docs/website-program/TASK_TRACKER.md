# CUT Salon Website Program — Task Tracker

> Status snapshot: 2026-11-13 23:40 Africa/Cairo (approximate planning snapshot).
> IMPORTANT: This file is a **human-maintained snapshot**, not a live GitHub status widget.
> Refresh the linked Issues/PRs before acting. State transition needs evidence, not assumptions.
> Source repo: https://github.com/tarek-saad-dev/cut-salon-rtl-booking
> Confirmed default-branch baseline: b9f6874c28d5c7914e498ab4f2910b7098643a9c

## Working now: tracked GitHub Issues and PRs

| ID | Task | Snapshot status | Issue | PR / evidence | Next action |
|---|---|---|---|---|---|
| SEO-01 | SEO fundamentals (robots, sitemap, canonical, noindex) | **MERGED CODE**; production verification not established by this tracker | [#23](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/23) closed | Main source contains seo.ts, sitemap.ts, robots.txt | Verify live deployment and crawl metadata read-only |
| SEO-02 | Mobile performance, hero images & CWV | **PR_OPEN / ON_HOLD** due to font compatibility | [#25](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/25) open | [#27](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/27) draft, unmerged | Reconcile with release font strategy after #32 |
| REL-01 | Investigate VPS font/build failure | **PR_OPEN / NOT RELEASED**; root cause unproven | [#26](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/26) open | [#30](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/30) draft, unmerged | Operator verifies VPS + release mitigation |
| SEO-03 | Local Gleem & Camp Caesar pages | **PR_OPEN / NOT RELEASED** | [#28](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/28) open | [#29](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/29) draft; included in #32 | Resolve branch NAP, avoid duplicate merge |
| REL-02 | Combined local SEO + VPS mitigation release | **PR_OPEN / WAITING REVIEW & APPROVAL** | [#31](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/31) open | [#32](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/32) draft, unmerged | Review exact head / CI / safe deploy checklist |
| SEO-04 | Indexable services & prices, GEO content structure | **ISSUE OPEN; EXECUTE requested, run result not verified** | [#33](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/33) open | No verified PR at snapshot | Check automation run / new PR, then tests & review |
| CLUB-01 | Website public/private routing and auth contract | **PLANNED; ISSUE OPEN** | [#34](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/34) open | No verified PR at snapshot | Scope secure auth & /club layout before implementation |
| DOC-01 | Contract, roadmap, tracker and work log | **IN_PROGRESS — docs branch; PR pending snapshot** | [#35](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/35) open | codex/issue-35 | Verify docs, open draft PR, await approval |

## Future backlog (not started / not on production)

| ID | Proposed deliverable | State | Depends on |
|---|---|---|---|
| CLUB-02 | Public /cut-club SEO explainer + Join flow | PLANNED | CLUB-01 |
| CLUB-03 | Secure OTP/session authorization to Casher APIs | PLANNED | CLUB-01, backend security audit |
| CLUB-04 | Private /club Home + tier + CUT ID | PLANNED | CLUB-03 |
| CLUB-05 | Wallet, inventory, rewards, redeemed voucher parity | PLANNED | CLUB-03, Casher ledger audit |
| CLUB-06 | Campus, MED and Corporate affiliations | PLANNED | CLUB-04, organization model |
| CLUB-07 | Referrals, challenges, campaign rules, budget controls | PLANNED | CLUB-05/06 |
| SEO-05 | Groom services, content guides, internal linking | PLANNED | SEO-04 |
| GEO-01 | NAP cleanup, truthful local schema, Search Console review | PLANNED | SEO-03 + owner address verification |
| OPS-01 | Measurement dashboard by search/partner/referral source | PLANNED | Public analytics + member events |

## Status policy

- PLANNED: agreed direction, no implementation proof.
- READY: prerequisites met, issue scoped.
- IN_PROGRESS: implementation actually started, branch/workflow evidence linked.
- PR_OPEN: PR exists; does NOT imply tests passed or production.
- IN_REVIEW: exact-head review underway and evidenced.
- READY_FOR_APPROVAL: review/CI passed and merge safety confirmed for exact head.
- MERGED: merged to main with merge commit link; no live claim.
- DEPLOYED: deployment job completed, requires run link.
- VERIFIED_LIVE: read-only production validation recorded with time and URLs.
- BLOCKED: owner/technical dependency described under next action.

## Task update template

**Task ID:**
**Last checked (time zone):**
**Issue:**
**PR / branch / commit SHA:**
**Stage (one of statuses above):**
**Completed (verified evidence):**
**In progress:**
**Blockers & dependencies:**
**Tests / review / deployment evidence:**
**Next action and owner:**
**Related contract/roadmap change:**

## Do not misreport

- Open draft PR ≠ merged.
- CI pass ≠ VPS deploy pass.
- Tests on main ≠ current production SHA.
- Planned route ≠ published page.
- Data from marketing copy ≠ verified POS prices.
- Last snapshot ≠ today's live status.
