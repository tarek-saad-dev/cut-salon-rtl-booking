# CUT Salon Website Program — Decision Log

> Timestamped record of architectural, product, release and SEO decisions.
> Status meanings: ACTIVE / PROPOSED / SUPERSEDED / NEEDS_VERIFICATION.

| Decision | Date | Status | Resolution | Why / limitation |
|---|---|---|---|---|
| D-001 | 2026-11-13 | ACTIVE product direction | Single public domain cutsaloon.com; no second CUT CLUB website | Consolidated brand, links, marketing and member experience |
| D-002 | 2026-11-13 | ACTIVE product direction | Root **/** remains a marketing landing for guests and members; personalize CTA/navigation only | Stable indexable content and understandable public experience |
| D-003 | 2026-11-13 | PROPOSED route, approved direction | Public **/cut-club** explains the club; private **/club** runs the member dashboard | Separate acquisition copy from member data and wallet |
| D-004 | 2026-11-13 | ACTIVE direction | **/prices** and **/services** remain public, accurate and independently indexable | Pricing is public; member discount is a personal entitlement |
| D-005 | 2026-11-13 | ACTIVE direction | Two branch pages with real distinct content, no invented NAP | Local SEO credibility; branches Gleem & Camp Caesar |
| D-006 | 2026-11-13 | ACTIVE technical constraint | Casher remains source for invoices/bookings/catalog; avoid second ledger | Accounting correctness and cross-branch integrity |
| D-007 | 2026-11-13 | ACTIVE release gate | OTP/verified session + authorization BEFORE enabling real member balances, redemption, edits | Current phone/clientId access is not sufficient authorization proof |
| D-008 | 2026-11-13 | ACTIVE release gate | No auto merge/deploy; approval via existing control plane and verified release candidate | Production safety; main push deploys to VPS |
| D-009 | 2026-11-13 | PROPOSED | Member bottom navigation: Home / Explore / Book / Wallet / Me | Keeps club scalable as features grow |
| D-010 | 2026-11-13 | PROPOSED | Modular monolith with events/rules, not early microservices | Fits current Next.js/Casher footprint and operations capacity |
| D-011 | 2026-11-13 | NEEDS_VERIFICATION | Release candidate PR #32 integrates local pages and font mitigation; #27 is separate | Review/CI/deploy must be checked against exact versions and VPS |
| D-012 | 2026-11-13 | PROPOSED | No SEO/GEO content generation without real useful content, verified prices and schema matching page | No fabricated claims or search ranking guarantees |
| D-013 | 2026-11-14 | PROPOSED pending PR #38 merge | Public compact navigation below 1280px; desktop from 1280px; campaign/nav offset CSS matches breakpoint | Prevent 1024px menu crowding and fixed-header clipping; [browser CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43536011993) passed mobile/tablet/desktop including boundary AR/EN |
| D-014 | 2026-11-14 | PROPOSED pending PR #41 merge | Private /club shell defaults to restricted notice even when flag enabled; noindex/no-store and isolated providers | Prevent inferred auth, fake wallet balances and cross-account leaks; [browser CI](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/actions/runs/43536081160) passed headers/mobile/desktop |
| D-015 | 2026-11-14 | ACTIVE verification gate | Responsive browser CI and exact-head independent review required for new public/member navigation changes | Component tests alone did not cover mobile sheet scroll/desktop overlap; do not claim deployed without owner merge approval |
| D-016 | 2026-11-14 | ACTIVE business decision; release BLOCKED | Owner approves a **temporary suspension** of unauthenticated legacy reward purchases and Mystery Box openings, subject to documented customer-impact and security review. This is **not** permission to merge/deploy any PR. | Coordinate website #49 and Casher #266 only after website VPS #26, staging tests, support notice and separate head-specific go/no-go; sensitive GET auth remains blocked under Casher #243/#269. |

## Unresolved questions / approval gates

| Question | Owner / evidence needed | Blocks |
|---|---|---|
| Confirm verified Gleem full street address vs map listing | Operations owner, Google Business Profile | Exact LocalBusiness address |
| Confirm Camp Caesar detailed address, phone and public hours | Operations owner, first-party/GBP | Branch pages precise NAP |
| What is active price list by branch and safe public read API? | Casher backend/read API verification | SEO-04 |
| Which member login verification is supported (OTP provider, rate limits, session)? | Architecture/security decision | CLUB-03/04/05 |
| Reward exchange values, limits, stacking, refunds, expiry | Owner + accountant | Club economy/campaign launch |
| Exact production deployment state and rollback capability | VPS owner/read-only checks | Release #32 |
| How to reconcile conflicting hero/font optimizations PR #27 | Frontend review | SEO performance release |

## How to record a new decision

Copy the following format:

### D-XXX — Short title
- Date (Africa/Cairo):
- Status: PROPOSED / ACTIVE / SUPERSEDED / NEEDS_VERIFICATION
- Issue / PR:
- Problem:
- Options considered:
- Decision:
- Rationale:
- Impact (URLs, SEO, auth, ledger, cost, operations):
- Verification / approval:
- Supersedes:

Do not silently remove history. Mark old decisions SUPERSEDED with a link to the replacement decision.
