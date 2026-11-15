# CUT CLUB 2.0 — end-to-end experience & scalability blueprint

> Sprint: 2026-11-15 · Implementation issue #56
> This document describes the product and the **internal dev-only synthetic** experience. It does not claim a launched, authenticated, financially operational product.
> Deployment and merge **not authorized**. Product decision: retire unsafe legacy CUT CLUB client flows after coordinated impact review, preserve customer ledger/Coins/vouchers, and keep booking/POS running.

## Experience principles

CUT CLUB is a full growth and loyalty ecosystem, not a Coins counter. It should make repeat visits meaningful, help acquire new customers through approved partnerships and referrals, and help the business understand frequency/retention without offering unearned or unaudited rewards.

- Website: `/` remains public and searchable; `/cut-club` is public editorial introduction; `/club` is **private verified** member dashboard. Guest booking `/book` remains always available.
- Desktop member experience: premium persistent side navigation and wide content panels. Mobile: bottom 5-tab primary navigation plus horizontal access to challenges and referrals.
- CUT Salon branding: burgundy/oxblood, ivory, bronze, editorial hierarchy, purposeful photography (official image assets only), accessible RTL, strong focus rings, touch targets >= 40px, no arbitrary red accents.
- Legitimate user states: guest/new member, returning active member, VIP member; first-visit zero balance, empty vouchers, no booking, locked/offline, error and loading. Do not show bogus Coins/coupons as actual customer state.
- Privacy: no clientId/phone in URL, account selection, localStorage identity or anonymous private GET. Phone/OTP only after real server-issued identity is implemented.
- Financial UX: browse reward catalog publicly without personal balance; purchase/open box/redeem only from verified, server-owned balance, atomic stock+ledger settlement; explicit idempotent confirmations and staff recovery.

## Complete screen map

| Section | Business purpose | Main member UI | Required live data | Launch dependency |
|---|---|---|---|---|
| Home/Pulse | Show value/next visit | Digital member card, tier, next visit, wallet snapshot, next action, personalized journey | authorized member, booking & ledger | OTP/session, verified Casher BFF |
| Wallet | Trust and visibility | Coins distinct from EGP promo credit, owned vouchers, movement ledger, expiry | Casher journal, inventory, credit | verified owner and resource checks |
| Rewards | Earn/redeem responsibly | Safe catalog, reward details, tier rules, inventory, spend confirmation, Mystery Box disclosure | published catalog, owned eligibility, atomic transaction | idempotent secure financial APIs |
| Memberships | Retention / segmentation | Guest/Silver/Gold, campus, doctors, partner-company membership | verified affiliation, tenant policy, time bound entitlement | policy engine & proof workflow |
| Challenges | Visit habit loops | milestone progress, eligible visits, rules, achievements | completed-visit events, rule evaluations | event- and budget-safe reward engine |
| Referrals | Responsible acquisition | generated referral ID, friend invitation, eligible first visit, status | trusted referral attribution, unique visit event | anti-abuse/idempotency |
| Profile | Account and privacy | verified phone, consents, memberships, logout/revoke, help | member identity and consent | secure OTP/login + session store |
| In-salon experiences | Delight + local engagement | glass ball/mystery gift with clear staff rules | redeemed/event ledger & inventory | physical handling / fair odds / policy |

**Google ratings/social feedback:** never condition a prize on submitting a Google review or a positive rating. Voluntary feedback should be distinct from any gift eligibility. Comply with platform review-integrity rules.

## Synthetic review implementation

- Code: `src/lib/club/experience/previewModel.ts` declares 7 screen IDs, 3 fake personas, sample rewards/levels, 4 membership tracks, challenge models and growth module registry.
- Responsive experience: `src/components/club/experience/CutClubExperiencePreview.tsx` is a navigable **non-transactional demo**. No fetch, localStorage, browser identity, OTP, session or financial handler. All Coins, rewards, voucher movements and partner entitlements are invented *samples* and clearly labeled. The regular/VIP values are not approved prices or benefits.
- Local-only route: `/dev/cut-club-preview` renders **only** with `NODE_ENV=development` AND `CUT_CLUB_PREVIEW_ENABLED=true`. Production returns 404 even if the flag is accidentally enabled. Robots noindex, force dynamic/no-store. This route does not replace current /club or customer login.
- Browser: start local dev with `CUT_CLUB_PREVIEW_ENABLED=true npm run dev`, open `http://localhost:3000/dev/cut-club-preview`. Do NOT use a real member/account identifier. Preview route is intentionally unavailable through the production deployment.
- State selector is a business review tool (new/regular/VIP) only. This never creates a customer or changes a balance.

## Scalable backend architecture (separate real implementation)

### One ledger, many features
Casher remains authoritative for member ownership, visits, Coins, vouchers, promotional credit and reward stock. Use a tenant-scoped modular monolith with explicit boundaries and an outbox/event contract, not separate duplicate loyalty databases per feature. Needed bounded contexts:
1. Identity & Consent: OTP challenges (5-min TTL, max attempts, rate limits), unique authoritative tenant→customer binding, revocable opaque 2-hour sessions, user recovery and consent preferences.
2. Loyalty Ledger: append-only money-like Coins journal with available/pending/expired adjustments, per-owner balance reconciled to journal; never browser-authoritative balances.
3. Reward Catalog & Inventory: publish policy, versions, stock, eligibility, inactive/archived items and future redemption channels.
4. Reward Settlement: idempotency keys, serializable transaction or optimistic CAS on balance, stock and inventory; no double spend or negative Coins; outbox event only after committed state change.
5. Membership & Affiliation: tenant+organization+member category (school/university/doctor/company), verification source, start/end, branch applicability and explicit rule priority.
6. Campaigns, Challenges & Referrals: rule versions, budget caps, eligibility windows, first-qualifying-visit constraints, event-level idempotency, abuse detection.
7. Experiential Rewards: physical inventory and staff fulfillment, optional review messaging independent of rewards, audit of distributions.
8. Analytics: visit frequency, redemption, retention cohort, voucher liability and campaign ROI from event projections; tenant and branch isolation.

### Non-negotiable APIs
- Browser only calls site-origin BFF with secure HttpOnly, SameSite cookie, Origin/CSRF controls and no-store. BFF derives verified owner and tenant server-side.
- BFF to Casher authenticated server channel and **Casher repeats tenant/customer resource ownership checks**, not trusting a user-selected `clientId`.
- Versioned `/api/cut-club/v2/member`, `/wallet`, `/vouchers`, `/rewards`, `/membership`, `/challenges`, `/referrals`; write actions use POST + idempotency key, CSRF, transactional verification and generic failure responses.
- Public `/api/public/cut-club/catalog` ONLY after tenant↔SalonID catalog source mapping has been proven, with explicit non-private projection and no customer data.
- Data contracts should use strict owner/tenant DTO projection (website Draft #47), fail-closed BFF (Draft #55) and Casher verified OTP/session (draft #256, preflight #259). **Current drafts are not production authorization.**

### Rollout sequence
1. Resolve branch-specific mapping, actual tenant/customer ownership source and existing balances/vouchers; inspect staging only, synthetic accounts.
2. Secure real OTP provider and cost, durable transactional challenge/session store (Casher #257), cookie/logout/CSRF BFF, and safe support recovery.
3. Implement new Casher private member APIs and event/ledger reconciler; 2-account/2-tenant negative tests and idempotent transaction proof. No direct reuse of old personal GET routes.
4. Integrate public club explainer + member shell + validated widget contracts into one staged branch and use a release bundle (not blind merges). Confirm every old website and external deep link.
5. Customer maintenance/rollout: deploy UI + backend guards in approved sequence, preserve bookings and reward entitlements, review VPS build/rollback, owner approves each exact SHA.
6. Controlled cohort launch, monitoring, availability and anti-abuse, then tier/partner/growth modules by feature flag with operational rule approval.

## Acceptance matrix / current status

- [x] Local responsive screen composition for **all 7 member areas** and all 3 sample personas
- [x] Design for membership/partnership categories, reward shop, box and in-branch gift
- [x] Disabled real financial controls, explicit sample badges and immutable synthetic fixtures
- [x] Strict production-off preview guard
- [ ] Latest-head CI/test/build and isolated 360/390/768/1024/1440 browser proof
- [ ] Independent accessibility/design/security review and feedback
- [ ] Real OTP/channel/provider + durable session + authoritative tenant-owned customer lookup
- [ ] Private member data APIs and full transactional rewards, inventory, challenge, referral service
- [ ] Cross-account integration/staging and realistic branch/customer impact
- [ ] VPS #26 deploy/rollback proof and separate explicit merge/deploy approval

**Do not declare CUT CLUB complete or live because the preview looks complete.**
