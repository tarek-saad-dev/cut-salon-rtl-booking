# CUT CLUB legacy store — catalog-only maintenance rollout

Issue [#48](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/issues/48) is the website companion to Casher security [#264](https://github.com/tarek-saad-dev/casher/issues/264) / [draft PR #266](https://github.com/tarek-saad-dev/casher/pull/266).

## What changes

The legacy `/client/loyalty` store lists item names/prices, but all purchase buttons are disabled and an accessible maintenance message explains that safe sign-in is being prepared. The purchase drawer/success toast is not mounted. `purchaseStoreItem` client function fails before calling `fetch` and no longer logs `clientId`/purchase payloads. Existing catalog and inventory GETs remain unchanged.

This is **only customer experience safety**, not server authorization or a live authenticated CUT CLUB. The legacy page still reads a caller-selected `clientId` from URL/localStorage for personal GETs, so Casher [#243](https://github.com/tarek-saad-dev/casher/issues/243) remains an urgent privacy and tenant-auth blocker. No claim that personal balances are protected by this UI.

## Coordinated release plan

- Audit use of old purchase flows and ensure support teams can explain temporary maintenance. The customer-facing page must not promise currently unavailable buying/redemption.
- **Roll out a verified safe replacement first when possible.** If emergency quarantine is approved, deploy the website's honest disabled state **before or in a coordinated release with** Casher #266. Never merge Casher #266 alone and leave an active purchase CTA in the customer UI.
- Both repos deploy automatically on merge to main. Every PR needs its own explicit owner approval, exact-head CI/review and observed production deployment success.
- CUT Salon website main has a known VPS font build issue #26; do not merge this UI in an attempt to fix production unless the VPS deploy/rollback path is independently verified.
- Verify manually after rollout that the buttons are disabled and the direct Casher POSTs fail before any Coins/voucher mutation. Do **not** use real customer Coins or open real mystery boxes for verification.
- Do not roll back to a known-insecure public mutation path without an approved security response.

## Tests and limits

`src/components/loyalty/legacyStoreMaintenance.test.tsx` verifies disabled buttons at sufficient balance, truthful message, callback not invoked, no drawer, purchase helper never sends a request and empty-catalog state. CI/build needed on exact PR head.

No production/staging requests, customer lookups, auth provider, data mutation or merge in this PR.
