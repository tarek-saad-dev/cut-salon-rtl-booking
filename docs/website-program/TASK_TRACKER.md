# CUT Salon Website Program — Task Tracker

> Status snapshot: 2026-11-14 (Africa/Cairo); GitHub PR/workflow snapshot, not an automatic live feed.
> IMPORTANT: This file is a **human-maintained snapshot**, not a live GitHub status widget.
> Refresh the linked Issues/PRs before acting. State transition needs evidence, not assumptions.
> Source repo: https://github.com/tarek-saad-dev/cut-salon-rtl-booking
> Confirmed default-branch baseline: b9f6874c28d5c7914e498ab4f2910b7098643a9c

## Working now: tracked GitHub Issues and PRs

| ID | Task | Snapshot status | Issue | PR / evidence | Next action |
|---|---|---|---|---|---|
| SEO-01 | SEO fundamentals (robots, sitemap, canonical, noindex) | **MERGED CODE**; production verification not established by this tracker | [#23](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/23) closed | Main source contains seo.ts, sitemap.ts, robots.txt | Verify live deployment and crawl metadata read-only |
| SEO-02 | Mobile performance, hero images & CWV | **PR_OPEN / ON_HOLD** due to font compatibility | [#25](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/25) open | [#27](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/27) draft, unmerged | Reconcile with release font strategy after #32 |
| REL-01B | Read-only release-risk fingerprint (NOT VPS proof) | **PR_OPEN; CI SUCCESS, independent review PASS; VPS proof absent, production BLOCKED** | [#44](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/44), [PR #46](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/46), [CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43548378596) | Authorized operator must independently verify effective VPS toolchain, rollback and build safety before any merge |
| REL-01C | Isolated Linux/Chrome font-build rehearsal, 360/768/1440 + screenshots | **CI+BROWSER PASS; real VPS/rollback still BLOCKED** | [PR #30](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/30), [run #43551173607](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43551173607) | Authorized VPS proof + owner-approved release only |
| REL-01 | Investigate VPS font/build failure | **PR_OPEN / VPS gate blocked; font regression test added**; root cause unproven | [#26](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/26) open | [#30](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/30) draft, new source test; VPS verification outstanding | Operator verifies VPS + release mitigation |
| SEO-03 | Local Gleem & Camp Caesar pages | **PR_OPEN / NOT RELEASED** | [#28](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/28) open | [#29](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/29) draft; included in #32 | Resolve branch NAP, avoid duplicate merge |
| REL-02 | Combined local SEO + VPS mitigation release | **PR_OPEN / WAITING REVIEW & APPROVAL** | [#31](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/31) open | [#32](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/32) draft, unmerged | Review exact head / CI / safe deploy checklist |
| SEO-04 | Indexable services & prices, GEO content structure | **ISSUE OPEN; EXECUTE requested, run result not verified** | [#33](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/33) open | No verified PR at snapshot | Check automation run / new PR, then tests & review |
| CLUB-00 | CUT CLUB Sprint 01 public `/cut-club` + nav + SEO tests | **READY_FOR_OWNER_APPROVAL: exact-head review PASS, Chrome & CI green; not merged** | [#37](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/37) open | [PR #38](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/38); [Browser CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43536011993); [standard CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43536012255), both passed head d0c25f8 | Get explicit owner merge approval and revalidate code head after preceding merges |
| CLUB-01 | Website public/private routing and auth contract | **READY_FOR_APPROVAL (DOCS ONLY); REVIEW PASS** | [#34](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/34) open | [PR #39](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/39), exact-head review PASS, no merge | Wait for explicit approval of docs PR #39; no member data until upstream security |
| DOC-01 | Contract, roadmap, tracker and work log | **IN_REVIEW: earlier head PASS; new tracker updates require exact-head re-review** | [#35](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/35) open | [PR #36](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/36), branch codex/issue-35 | Review final doc changes; exact-head check + owner merge approval required |

## Future backlog (not started / not on production)

| ID | Proposed deliverable | State | Depends on |
|---|---|---|---|
| CLUB-02 | Verified Join/Sign-in activation from public /cut-club (not the public explainer itself) | PLANNED / BLOCKED | Casher #243 verified identity/session and member BFF; avoid dead login links |
| CLUB-03 | Verified customer authentication + authorized Casher member APIs | **SECURITY PR_OPEN; session revocation/tenant+resource negative tests and CI PASS; sensitive routes UNFIXED** | [Casher #243](https://github.com/tarek-saad-dev/casher/issues/243), [Sprint A #249](https://github.com/tarek-saad-dev/casher/issues/249), [PR #251](https://github.com/tarek-saad-dev/casher/pull/251); CLUB-01 |
| CLUB-03B | Provider-neutral OTP attempt state machine and revocable session contract | **OFFLINE atomic-CAS fake-concurrency CI + build SUCCESS at latest head; security review pending; NO login/API deployment** | [Casher #255](https://github.com/tarek-saad-dev/casher/issues/255), [PR #256](https://github.com/tarek-saad-dev/casher/pull/256), [CI #43548901458](https://github.com/tarek-saad-dev/casher/actions/runs/43548901458) | Choose OTP provider, implement durable rate limiting/atomic consume then identity-bound session (separate future PRs) |
| CLUB-03C | Durable rate-limited OTP challenge/session storage | **DESIGN PR_OPEN; docs-only CI PASS, implementation still BLOCKED** | [Casher #257](https://github.com/tarek-saad-dev/casher/issues/257), [draft PR #259](https://github.com/tarek-saad-dev/casher/pull/259), [CI #43542127364](https://github.com/tarek-saad-dev/casher/actions/runs/43542127364); [parent #243](https://github.com/tarek-saad-dev/casher/issues/243) | Verify staging tenant/customer mapping, B1 review, OTP provider and lifetime before executable migration |
| CLUB-03D | Quarantine unauthenticated legacy Coins/mystery-box mutations | **DRAFT PR #266; CI PASS; business rollout approval REQUIRED** | [Casher #264](https://github.com/tarek-saad-dev/casher/issues/264), [PR #266](https://github.com/tarek-saad-dev/casher/pull/266), [CI](https://github.com/tarek-saad-dev/casher/actions/runs/43551038571) | Disables old buy/open-box; assess customer impact, coordinate UI #49, secure GETs/auth parent #243 |
| CLUB-04 | Safe /club shell, layout and noindex gates (NO member data yet) | **READY_FOR_OWNER_APPROVAL: exact-head review PASS and browser/CI green; no member login** | [Website #40](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/40), [PR #41](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/41), [Browser CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43536081160), [standard CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43536081100), [Casher #249](https://github.com/tarek-saad-dev/casher/issues/249) |
| CLUB-04C | Verified member DTO runtime validation for future secure BFF | **PR_OPEN; CI SUCCESS on updated HTML-escape tests; independent latest-head re-review pending; not wired to /club** | [#45](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/45), [PR #47](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/47), [CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43549503646) | Wait for Casher #243 secured resource APIs, OTP sessions, two-account tests and independent review before integration |
| CLUB-04B | Verified-data member card, wallet/credit/voucher and next-visit presentation | **REVIEW PASS + CI PASS; PR #43 non-draft, no member API/route connection** | [Website #42](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/42), [PR #43](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/43), [CI #43541693997](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43541693997) | No route/API connection until Casher #243 and BFF authorization complete |
| CLUB-04D | Legacy store catalog-only UX, disabled buy CTA + helper | **DRAFT PR #49; CI PASS; coordinate Casher #266; not deployed** | [Website #48](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/48), [PR #49](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/49), [CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43551606521) | No production merge until VPS gate #26 and owner-approved coordinated customer-maintenance release |
| CLUB-04E | Retire legacy anonymous `/client/loyalty` full member page | **DRAFT PR #51; exact-head CI PASS; Vercel Preview status PASS; not merged/deployed; independent review and browser proof pending** | [Website #50](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/50), [PR #51](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/51), [CI #43564113558](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43564113558) | Coordinate Casher private GET quarantine, old deep links and VPS #26; do not merge alone |
| CLUB-04F | Retire legacy unverified phone-only `/client` login/profile | **DRAFT PR #53; CI and Vercel status need refreshed evidence; not merged/deployed** | [Website #52](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/52), [PR #53](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/53) | Audit guest booking and phone/profile dependencies, browser checks, independent security review |
| CLUB-03E | Full source audit of 14 legacy public-client API paths | **ISSUE #269 inventory documented; runtime authorization NOT implemented** | [Casher #269](https://github.com/tarek-saad-dev/casher/issues/269), [Parent #243](https://github.com/tarek-saad-dev/casher/issues/243) | Secure/quarantine private GETs and phone-profile lookup without breaking legitimate booking |
| CLUB-03F | Fail closed legacy reward redeem POST | **DRAFT PR #271, CI PASS; no staging review/deploy** | [Casher #270](https://github.com/tarek-saad-dev/casher/issues/270), [PR #271](https://github.com/tarek-saad-dev/casher/pull/271), [CI #43563405843](https://github.com/tarek-saad-dev/casher/actions/runs/43563405843) | Owner approved legacy retirement in principle D-017; release approval still needed |
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
