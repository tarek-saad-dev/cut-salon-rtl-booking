# CUT Salon Digital Experience — Master Roadmap

> Version 1.0 | Created 2026-11-13 | This is a sequence with acceptance gates, **not promised deadlines**.
> Links are to tracked scope; absence of a PR is not evidence of implementation.

## Target architecture

**Public Website** (SEO/Discovery/Conversion) → **Booking Journey** → **Casher invoices & operations** → **CUT CLUB retention and rewards**.

Keep public website and member experience on cutsaloon.com. Operations stay on ops.cutsaloon.com.

## Milestones

| Phase | Name | Key deliverable | Dependencies | Exit gate / proof |
|---|---|---|---|---|
| P0 | Baseline & release recovery | Know real production SHA, sitemap, page performance, deploy/rollback | Issues #26/#31 | documented read-only prod checks; approval process |
| P1 | Local SEO branches | Distinct Gleem / Camp Caesar pages, verified NAP, schema, links | Issue #28; combined PR #32 | clean PR, reviewed deploy, URLs live and indexable |
| P2 | Public services & pricing | Server-readable price/service HTML, accurate branch pricing, service pages | Issue #33; Casher read API | tests prove content + correct canonicals; no fabricated prices |
| P3 | Security foundation | Verified customer auth, secure sessions/BFF, private route authorization | Issue #34 and Casher back end | negative authorization tests, no clientId impersonation |
| P4 | CUT CLUB public acquisition | /cut-club explainer, Join/Sign-in CTA, real eligible program descriptions | P2, P3 for signup flow | indexable public page; private data absent |
| P5 | CUT CLUB member MVP | /club Home, digital pass, booking, wallet read, rewards, Me | P3; Casher loyalty audit | noindex, authenticated, ledger parity, usable on mobile |
| P6 | Growth ecosystem | CUT MED, Campus, Corporate, Referrals, partner reporting, campaigns | P5 and business rules | pilot controls, cost caps, idempotency, abuse tests |
| P7 | Engagement & journeys | Challenges, mystery rewards, comeback, birthday, care journeys | P6 | feature flags, eligible reward policies, measurable effects |
| P8 | Content, GEO, optimization | CUT Guides, service evidence, GBP, technical performance, CRO | starts alongside P1/P2 | measurable search and conversion baseline vs actual |

## Workstream A — Website public pages

**A1. Home** — Preserve / marketing landing, improve hero and sections without personalized full-page replacement; performance and accessibility.

**A2. /prices** — Verified server-readable service/price catalog with active-branch context. If API unavailable, show accurate unavailable state, never pretend hardcoded values are current.

**A3. /services + /services/[slug]** — Begin with real and distinct haircut, beard, hair treatment, skincare content when verified and supported. FAQs should answer real customer questions.

**A4. /branches** — Gleem and Camp Caesar distinctive landing pages, NAP audit, branch-specific booking. Avoid false exact address/hours/ratings.

**A5. /groom-packages** — Trustworthy distinct landing for groom packages and detailed inclusions, sourced from Casher.

**A6. /offers/[slug]** — Active promotion pages indexable when substantive; expired campaign lifecycle (noindex, redirects when appropriate); no fake urgency.

**A7. /guides** — Helpful topical guides based on barber/team expertise and real photos; content-review workflow.

## Workstream B — Member product

**B1. Identity & Auth** — CUT ID, OTP/session/authorization, profile merge safeguards and consent.

**B2. Core Club** — Home, digital pass/QR, tier/progress, upcoming bookings, service history, Wallet/Rewards read flows.

**B3. Economics** — Distinguish coins/credit/voucher/paid gifts; transactional ledger, refunds, branch-scoped redemption.

**B4. Partner programs** — Affiliations & Organizations, Campus, MED, Corporate with verified eligibility.

**B5. Campaigns & Gamification** — event-driven triggers, rules, budgets, approvals, referrals, challenges and rollbacks.

**B6. Analytics** — repeat rate, visits, acquisition by partner, reward cost, attributable contribution margin.

## Workstream C — Quality and releases

- **C1:** Release baseline; avoid merging incompatible branch/font changes. PR #32 is current integration candidate, PR #27 separate.
- **C2:** Unit/functional tests; mobile/desktop; SSR content and sitemap; SEO noindex; Booking smoke (read-only where relevant).
- **C3:** Auth threat-model & cross-account negative tests before opening real member wallets.
- **C4:** Verify production read-only after explicit deploy; no fictional 'live' statuses.
- **C5:** Weekly Search Console/GBP + performance + booking/conversion review, decisions documented.

## Sequencing rules

1. Never release P5 wallet before P3 authentication is verified in both site and Casher API.
2. Do not include P1 branch pages in sitemap until actual routes are in main and deploy verified.
3. Do not merge PR #27 alongside #32 until font/build conflict is resolved and VPS build validated.
4. PR #33 pricing can proceed in isolated branch, but merge/rebase must account for current #32 release.
5. Track the website vs Casher ownership; back-end migrations require a separate Casher PR and coordinated compatibility release.
6. Growth offers with material costs require operator-approved rules, effective dates and limits.

## Next actionable order (based on 2026-11-13 GitHub snapshot)

1. Review release candidate [PR #32](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/32) and VPS deploy mitigation; approve only after actual readiness check.
2. Verify branch address/phone details; publish branch pages only after correct NAP.
3. Complete [Issue #33](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/33) service/pricing SSR and schema with valid source-of-truth.
4. Implement [Issue #34](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/34) secure identity/club routing blueprint and auth foundation before member wallet.
5. Measure and ship performance safely after resolving [PR #27](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/27) conflicts.
6. Ship public CUT CLUB explainer, then member MVP, then partnership pilots.

## Acceptance checklist for every phase

- [ ] All relevant Issues have scoped acceptance criteria and documented dependencies
- [ ] Implementation PR is linked and reviewed at exact head
- [ ] Tests/build evidence, known risks and security/SEO effects recorded
- [ ] TASK_TRACKER + WORK_LOG updated, and DECISION_LOG if direction changed
- [ ] No merged / deployed claim without GitHub deployment or read-only production evidence
- [ ] Owner explicitly approves merge; controlled rollout and rollback considered
