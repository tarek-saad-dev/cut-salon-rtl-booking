# CUT CLUB Sprint 03A — Safe member presentation contracts

Source: [Website Issue #42](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/42)

## What this PR creates

- `src/components/club/member/memberViewModels.ts` defines presentation-only data objects for verified server-supplied member summary, CUT Coins, EGP promotional credit, voucher entitlements, upcoming booking and optional tier progress.
- `MemberOverview.tsx` exports four composable accessible RTL presentation panels and a layout. They perform **no fetches**, do not read browser storage, and do not issue mutations.
- `MemberOverview.test.tsx` checks separate currencies, absence of fabricated values, zero vs unavailable, logged-out empty presentation, HTML escaping and no network calls.

These components intentionally are **NOT imported** by the current `/club` route, public `/` or any legacy `/client` screen. They are preparatory UI code only. Never call it a live dashboard.

## Hard security requirements

1. Only a server handler that has verified the customer through an authenticated, revocable customer session may create the input projection. Do **not** create it from legacy `clientId`, editable phone lookup or `cut_client` localStorage.
2. Every member-specific query must be authorized by Casher against signed tenant + subject, including direct API access; a BFF alone does NOT secure a still-public identifier-only endpoint. Casher security parent [#243](https://github.com/tarek-saad-dev/casher/issues/243) remains OPEN.
3. The projections are not a proof of authorization: TypeScript types are insufficient to restrict who can supply props. Real server authorization, runtime payload validation, no-store responses and two-account negative tests must be delivered in separate PRs before connecting.
4. CUT Coins are integer points, **not money**. Promotional EGP credit carries explicit minor units (piasters), currency, and expiry from the source. Vouchers are discrete entitlements, never a summed cash balance.
5. null values mean *unavailable*, not zero. `[]` means verified empty voucher inventory. An empty booking is different from an upstream outage. No discount, referral bonus, or challenge reward is calculated by UI components.
6. Rendering of personal data must remain private with `noindex, nofollow`, `private, no-store` on HTML/RSC/API and no shared CDN/service worker cache. No sample customer names or balances may be shown as real data.

## Next integration task (blocked)

Once Casher verified OTP/session, account binding, BFF delegation and all legacy sensitive API safeguards have passed staging/independent review:
- Build the server-side, runtime-validated member DTO adapter.
- Verify tenant and customer ownership on every query; no browser-supplied account selectors.
- Render the new components from real authorized DTOs, only inside private `/club` and read-only wallet/profile pages.
- Add two-account, revoked-session, no-cache and direct-upstream access tests.
- Only then consider enabling wallet and reward redemption in separately approved PRs.

## Release and verification

This PR changes no existing route, API, auth, booking, finance, employee or public SEO behavior; no DB schema or production access. CI with `npm test` and `npm run build` is required. No browser runtime smoke is meaningful until a future authenticated route consumes these components.

**No merge or deployment before owner approval.**
