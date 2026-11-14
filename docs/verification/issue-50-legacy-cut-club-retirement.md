# CUT CLUB 2.0 — retire legacy anonymous customer panel (website #50)

## Owner business decision (2026-11-14, Africa/Cairo)
Owner approved retiring **all legacy CUT CLUB customer-facing flows** in favor of a new verified-customer member experience: buy/redeem reward, Mystery Box open and any legacy member page that derives private customer data from URL/localStorage `clientId`. **This approval does not authorize merging, deploying to Production, discarding loyalty history or wiping Coins.**

### Safeguards
- Keep POS, staff flows, customer booking and public marketing pages unaffected.
- Existing ledger/Coins/vouchers are not migrated, adjusted or cleared by this frontend patch.
- The legacy `/client/loyalty` route shows a static, accessible maintenance state. It makes **zero** personal-data fetches and does not inspect identifiers.
- The page is `noindex/nofollow` and provides a link back to public booking `/book`. It does NOT redirect to `/club`, whose verified customer auth/BFF is not ready.
- Financial writes in Casher remain a **separate** server gate: [#266](https://github.com/tarek-saad-dev/casher/pull/266), [#271](https://github.com/tarek-saad-dev/casher/pull/271). All private reads remain blocked by parent [#243](https://github.com/tarek-saad-dev/casher/issues/243) / [#269](https://github.com/tarek-saad-dev/casher/issues/269).
- Website [Draft PR #49](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/49) is catalog-only Store UX; retiring the parent legacy member page supersedes its **user-facing** Store presentation. Do not merge them blindly or assume #49 secures APIs. Confirm whether other Store entrypoints use that component.

## Tests / checks
- Focused source-gate test: `src/lib/__tests__/legacyCutClubRetirement.test.ts`.
- CI and production build must pass on the **exact PR head**, followed by independent review.
- Isolated browser evidence at 360/390/768/1440px, with external network blocked. Verify no GET to Casher personal APIs and no POST to financial endpoints, by both direct visit and `/client/loyalty?clientId=123` deep links; do not use real account identifiers.
- Confirm keyboard focus, RTL, status message, /book and / back links.
- Manually inventory other legacy store/reward URLs across website/mobile/POS; source-route retirement must not create unadvertised failures.
- Real client voucher/entitlement handling should be reviewed with staff using aggregate metrics and synthetic test records, not live balance modifications.
- Audit external links and SEO index handling before release. Do not redirect a `?clientId=` URL into `/club` as proof of customer identity.
- Website VPS font-build/rollback blocker [#26](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/26) must be independently resolved before any merge to main.

## Go/no-go before customer-facing release
- [ ] Verified no missing old entrypoint or incompatible active client
- [ ] Casher private GETs protected or quarantined via separately approved compatible release
- [ ] Casher financial write POSTs 403, no ledger mutation, synthetically tested
- [ ] Existing balances/vouchers preserved and staff support procedure agreed
- [ ] Latest-head CI, independent security and accessibility review
- [ ] VPS safe atomic build/switch/rollback evidence
- [ ] Separate explicit owner merge/deploy approval for each exact PR head
- [ ] Read-only production verification *after* authorized deploy

STATUS: DRAFT / REVIEW. No merge, deployment, real customer queries or OTP sent.
