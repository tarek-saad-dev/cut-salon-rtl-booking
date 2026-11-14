# CUT CLUB 2.0 — routing, identity and member experience

Originating issue: #34. Status: proposed architecture for Tarek/product and Casher owner approval; this document does not record approval or authorize a launch. Follow-up issue bodies: [phase backlog](cut-club-2-follow-up-issues.md).

This PR is documentation only. It creates no routes, redirects, sessions, benefits or financial behavior and does not fix the existing identity weaknesses. New member capabilities remain blocked until the security gates below pass. All implementation phases require separate scoped issues/PRs, exact-head review and explicit human merge approval.

## Decisions and route contract

One customer origin: `https://cutsaloon.com`. `ops.cutsaloon.com` remains operations-only; no customer dashboard, login redirect, canonical or navigation link moves there. Casher owns loyalty and financial state; the website does not create another ledger.

| Route | Audience and content | Search/cache contract | Delivery priority |
| --- | --- | --- | --- |
| `/` | Public marketing landing for every session state; optional personalized navigation/CTA only | Indexable, canonical `/`, sitemap; primary content identical across auth states | Preserve now |
| `/cut-club` | Public benefits, memberships, FAQs, join CTA; only owner-confirmed live claims | Indexable, self-canonical, sitemap only when page exists | Public phase |
| `/book` | Public booking; no member sign-in requirement | Preserve existing public canonical and sitemap; booking steps retain noindex policy | Preserve now |
| `/club` | Verified member summary, active entitlements, links to enabled features | Private policy below | Read-only MVP |
| `/club/me` | Minimal verified profile and sign-out; editing deferred | Private policy | Read-only MVP |
| `/club/wallet` | Distinct points, promo credit and vouchers, with source and expiry | Private policy | Read-only MVP after authorized contracts |
| `/club/memberships` | Active plan, dates, remaining entitlement and terms | Private policy | Read-only MVP after authorized contracts |
| `/club/rewards` | Eligible catalog; redemption only in hardened mutation phase | Private policy | Later |
| `/club/challenges` | Casher-owned progress and rules | Private policy | Later |
| `/club/referrals` | Verified member referral information and terms | Private policy | Later |
| `/club/login` | OTP initiation/verification, no account data before proof | Noindex, excluded sitemap, private/no-store | Identity phase |
| `/client`, `/client/loyalty` | Existing legacy experience until secured cutover | Existing noindex/excluded sitemap; this is not an auth guarantee | Migration phase |

Private policy applies to every `/club` descendant, including login, redirects, errors and not-found responses: server metadata `noindex, nofollow`, `X-Robots-Tag: noindex, nofollow`, exclusion from sitemap, `Cache-Control: private, no-store`. Apply the same cache/header policy to member BFF responses and authentication endpoints. Session-aware SSR must verify each page request before reading member data. No static generation, shared response cache, ISR, persisted service-worker cache or cross-user query cache for member data. Use uncached server fetches; validate CDN/reverse proxy behavior as well as Next responses. Metadata alone does not implement cache or access control.

Robots.txt must permit crawlers to see noindex responses; robots exclusion is not privacy. Do not canonicalize private member content to the public explainer. Do not add reserved/unimplemented routes to the sitemap. Keep public marketing HTML independent of member data. Personalized UI must use an uncached session endpoint or an uncached request boundary; never place member identity inside a shared cached public response.

## Navigation and layout boundaries

| Session state | Public navigation / CTA | Private navigation |
| --- | --- | --- |
| Anonymous | CUT CLUB → `/cut-club`; book → `/book`; join/sign-in → `/club/login` once available | Login with validated return target; no data fetch |
| Verified | Same public links and primary homepage content; account CTA → `/club` | Dashboard, wallet, memberships, profile, book, sign-out; only enabled features |
| Expired/revoked/unavailable | Neutral account CTA; no cached name or balance | Expired/revoked → login; auth service outage → safe unavailable state, no legacy fallback |

Until auth launch, do not interpret `cut_client` localStorage as the verified navigation state. Join CTA on a pre-auth public page must accurately state availability, e.g. explain how to join through an owner-confirmed existing channel; no fake activation, reward promise or dead login link. No earn rates, tiers, free services, cashback, membership price, referral reward or challenge benefit may be copied from mocks as a live claim. Product/Casher owner must sign off each claim with live source, terms, effective date and availability before publication.

Proposed App Router structure (future PRs): keep root layout limited to fonts, language/RTL and safe shared providers; move public chrome into a public route-group layout without changing URLs. Put `club` inside a separate member route group with its own minimal shell. Root `SiteChrome` currently injects campaign and public navigation everywhere except offers; prevent those from leaking into the member shell. Login uses a minimal shell outside the authenticated layout guard to avoid redirect loops. Member layouts provide branding, accessible RTL navigation, active route state, loading/error/empty states and sign-out. A layout check alone is insufficient: authorize again in each server data function and BFF handler because layouts can persist through navigation.

Existing public booking and offers must retain their chrome behavior. Recheck desktop/mobile navigation, focus order and browser back/forward navigation after layout separation. Public and private providers must not share persisted member query state.

## Current evidence and security blockers

Repository inspection (not a production probe):

| Evidence | Risk / required resolution | Accountable owner |
| --- | --- | --- |
| `src/app/client/page.tsx`, `src/lib/clientWebsiteApi.ts` lookup by mobile and update profile using `clientId` | Phone lookup is discovery, not proof of ownership. Require verified identity for profile read/write; prevent account enumeration | Casher API + website identity owners |
| `src/lib/clientStorage.ts` persists `cut_client` | User-editable storage must never establish a session, authorize data or select an account | Website owner |
| `src/app/client/loyalty/page.tsx` prioritizes URL `clientId`, then stored id/phone | Cross-account selection must be removed from the member path; never exchange legacy storage for a session | Website + Casher owners |
| `src/components/loyalty/clientLoyaltyApi.ts` and `storeApi.ts` send `clientId` for reads/redemption/purchase | Backend must enforce subject authorization for all reads and writes, including direct calls to old public endpoints | Casher owner |
| `src/components/loyalty/loyaltyData.ts` includes mock data and local tier thresholds | UI values are not authoritative eligibility, prices or benefit rules | Product + Casher owners |
| `src/app/client/layout.tsx` is noindex; `src/app/sitemap.ts` allowlists public URLs | SEO controls exist but provide no authentication or private-response cache guarantee | Website owner |

The reported backend public store query contract is corroborated by client requests; backend implementation is outside this repository and has not been audited here. Obtain owner evidence of remediation on Casher. A BFF does not secure a still-public identifier-only upstream endpoint. Required release blockers:

1. Casher owner confirms identity mapping, endpoint authorization, removal/restriction of unsafe legacy paths and a non-production verification environment.
2. OTP proves control of the selected phone; account binding, duplicates, changed/recycled numbers and recovery require explicit owner policy. No matching by guessed customer id.
3. Server sessions, revocation, expiry, per-user authorization and cross-account denial verified end to end, including direct upstream requests.
4. Mutation hardening and eligibility authority verified before any purchase, redemption, profile edit or benefit application.
5. Cache isolation, logging redaction, rollout/rollback and exact-head review pass before exposure. Existing legacy risk remains an explicit finding until remediated; this blueprint is not evidence of remediation.

## Proposed authentication and BFF contract

The following endpoint names are design targets, not assertions that Casher supports them today. Approve the upstream contract before implementation. Browser calls same-origin `/api/club/*`; the website BFF calls authenticated Casher member APIs using a narrowly scoped delegated subject. Never expose operations credentials or a general-purpose proxy. Keep secrets server-only and out of this runner.

1. `POST /api/club/auth/start` accepts a normalized phone and returns a generic challenge response without disclosing account existence. OTP provider/server owns challenge issuance, destination binding, short expiry, attempt limit, resend cooldown and rate limits by challenge, destination and source. Never return/log OTP values.
2. `POST /api/club/auth/verify` validates challenge + one-use code server-side; binds a verified subject to the Casher customer according to approved policy. Reject expired, reused or brute-forced codes; rotate session id on success. No profile, wallet or account-selection response before proof.
3. Set opaque `__Host-cut-club-session` cookie: `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`. Store session state server-side with absolute and idle expiry, revocation and protected upstream credentials. Proposed initial limits: 7-day absolute / 24-hour idle, subject to security-owner approval before launch. Do not put tokens in URL/localStorage or use legacy `clientId` as a session.
4. SSR and each BFF request resolve the session and its Casher subject. Browser may send a resource id, never an authoritative customer id. Reject unexpected account selectors; authorize resource ownership upstream for every request. A service token plus an unchecked caller `clientId` is unacceptable. Missing/expired session → 401; forbidden resource → non-disclosing 403/404; upstream failure → safe unavailable response with no fixture or legacy fallback.
5. `POST /api/club/auth/logout` revokes server session, expires cookie, clears member client caches and navigates to public content. Session changes invalidate in-flight queries; account B cannot see account A after logout/back navigation. Revalidate on focus/back restoration; no member data persisted in browser storage.
6. Any state-changing operation requires strict method/content-type/schema validation, same-origin Origin checks plus session-bound CSRF token, rate limits and server authorization. SameSite alone is insufficient. Auth start/verify/logout also require origin/CSRF protections appropriate to their pre/post-session state. Casher owns atomic eligibility, balance checks, idempotency binding to subject/action, replay handling and audit events. Refresh the authoritative result after success; do not authorize optimistically.

Allow only explicitly enumerated local return paths (`/club` and enabled deep links). Drop query/fragment identity selectors; reject absolute/protocol-relative URLs, encoded bypasses and arbitrary return destinations. An unauthenticated deep link reaches login without fetching data, then returns only to its validated route. Auth handlers must not echo account identifiers in redirects, analytics or error bodies.

Public booking remains available without a club session. A verified session may supply a delegated member context to server eligibility/checkout; Casher recalculates benefits at final confirmation. Client balances, flags, submitted customer ids and displayed discounts cannot authorize a benefit. Never equate a booking phone with a verified member session. No new checkout benefit application is included in this issue.

## Data ownership and reusable presentation

| Data | Source of truth / boundary |
| --- | --- |
| Verified identity, OTP and recovery | Approved identity service; Casher owns customer binding; website owns opaque session lifecycle |
| Profile, tiers, memberships, entitlement usage | Casher; website presents authorized projections |
| Points and earn/redeem events | Casher loyalty core; integer points, no implied currency conversion |
| Promo credit | Casher credit ledger; monetary amount + currency, restrictions/expiry; never presented as withdrawable cash unless explicitly supported |
| Vouchers | Casher voucher inventory; entitlement/status/terms/expiry, separate from points and credit |
| Rewards, referrals, challenges | Casher rules/events; website never awards value locally |
| Public copy and enabled navigation | Website/product owner using verified live capability/terms inventory |

Build presentational `WalletSummary`, `PointsBalance`, `PromoCreditBalance`, `VoucherList`, `MembershipCard` and `MemberActivity` widgets from authorized server view models. Reuse them in `/club` and deep links. Every monetary model carries currency and source timestamp; expiry/eligibility/status come from Casher. Keep distinct activity types and units; never sum points, vouchers and credit into a single balance. Missing/unsupported data renders unavailable, not fabricated zero or a mock reward. Widgets accept data, not `clientId`, and cannot call identifier-only legacy APIs. Keep mutation controls absent until the relevant gate passes. Existing loyalty visuals may be adapted after separating API calls, mock defaults and local business rules.

## Migration and rollback

| Existing entry/state | Cutover target and handling |
| --- | --- |
| `/` | Remains marketing for all users; no auth redirect |
| Public nav `/client/loyalty` | `/cut-club` for discovery; verified account CTA `/club` |
| `/client` | After secured cutover, temporary same-origin redirect to `/club/me`; unauthenticated users continue to login |
| `/client/loyalty` with or without `clientId` | After secured cutover, temporary redirect to `/club`; strip all legacy query parameters, never fetch by supplied id |
| `cut_client` storage | Discard as identity; clear on migration/logout; require fresh OTP, no automatic session upgrade |
| Old direct API consumers | Casher must reject unauthenticated or cross-subject access; frontend redirects cannot mitigate API exposure |

Sequence: approve blueprint → secure identity/upstream and test old endpoints → public explainer and isolated shell → authorized read-only MVP → prove parity using synthetic accounts → enable legacy redirects/nav switch → separately enable hardened capabilities. Public page can ship independently after claim review. Enable only contracts that actually exist; unimplemented deep links remain unavailable with no personal data and no navigation promotion. Do not redirect legacy users before the secured replacement is accepted. Coordinate timing with Casher so endpoint hardening does not silently break supported clients; security takes priority over preserving unsafe behavior.

Read-only migration uses the same Casher customer/ledger, with no copying, recomputing or minting balances. Compare subject, units, amounts, dates and membership status using fixtures/staging. Start redirects as temporary until validated. Rollback disables member entry points and mutations, revokes affected sessions where necessary, and serves a safe unavailable state. Never restore identifier-only authorization or roll back to exposing the legacy wallet. Observe aggregate auth/error/latency metrics with no raw phones, codes, cookies or financial payloads in logs/analytics.

## Acceptance and verification matrix

These are required tests for follow-up implementation, not claims that proposed routes are implemented in this PR. Use mocks/fixtures and non-production accounts only; never submit production bookings, updates, redemptions or purchases.

| Gate | Required evidence |
| --- | --- |
| Blueprint approval | Tarek confirms route/nav/MVP decisions; Casher owner confirms auth, data contracts, recovery and legacy remediation; record approvals in PR/issues |
| Public SEO | Anonymous and verified `/` have same primary marketing content/canonical and no redirect; `/cut-club` is indexable and self-canonical only after implementation; sitemap contains existing public routes only |
| Private SEO/cache | Parameterized tests over `/club`, all six deep links and login: noindex metadata + response header, excluded sitemap, private/no-store on HTML/RSC/API, unauthenticated redirects, error/404 paths; proxy/CDN must not replay A to B |
| Authorization | No-session and forged/stored/URL `clientId` denied; account A cannot read/write B through BFF or direct Casher endpoints; expired/revoked sessions fail closed; no data in unauthenticated SSR/RSC |
| OTP/session | Enumeration resistance, expiry/reuse/rate limits, fixation rotation, cookie attributes, CSRF, logout revocation, safe return targets, back navigation and account-switch cache isolation |
| Data/UI | Fixture parity for all distinct balance units, expiry and membership status; unavailable/empty/error states; RTL/a11y; no mock benefits or unsupported navigation |
| Mutations | Cross-account denial, replay/idempotency, concurrent requests/insufficient balance, CSRF, stale eligibility rejection and upstream audit evidence; only mocks/staging |
| Cutover | Old bookmarks strip selectors, require verified session and resolve correctly; `/book` remains public; rollback never reopens unsafe API access |

Existing `src/lib/__tests__/seo.test.ts` covers current public sitemap/canonical/noindex policy. Extend it and add request-level integration tests during the respective phases; source-string tests alone cannot prove session/cache isolation. Each follow-up PR records exact-head tests/build, unresolved blockers, owner evidence and independent review. Human approval remains required; this document does not mark #34 or future implementation READY_FOR_TAREK.
