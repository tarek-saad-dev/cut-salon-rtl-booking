# CUT CLUB — customer Wallet and cashier voucher handoff (#66)

## Customer experience implemented (candidate, not live)
- Final mobile/desktop compositional component: verified membership card, Coins, owned voucher statuses, safe upcoming visit availability, and per-voucher reveal interaction.
- Voucher code is NEVER present in initial server markup. Clicking "عرض كود القسيمة" calls only a trusted, injected callback. A successful code must match the requested inventory ID and satisfy strict code+expiry validation. Hide/copy and error/retry states supported.
- Inactive, used, expired, cancelled vouchers cannot be revealed. If session is not ready, codes stay blocked and booking link works without customer login.
- No customer ID, phone, localStorage, anonymous Casher API, or network call is used inside these presentation components. No fake EGP credit.
- Component is NOT mounted to production /club; that page correctly remains closed until verified identity and trusted BFF.

## Shared cashier contract
- [Casher Draft #305](https://github.com/tarek-saad-dev/casher/pull/305) only returns a code if the server independently verifies a durable, revocable session, customer+tenant ownership and ACTIVE inventory status.
- [Casher Draft #303](https://github.com/tarek-saad-dev/casher/pull/303) gives authorized staff a voucher-code scan, belonging-to-branch/client check and limited invoice-verified FREE_SERVICE consumption. Every other financially sensitive voucher type remains disabled.
- Prior Website [Draft #65](https://github.com/tarek-saad-dev/cut-salon-rtl-booking/pull/65) provides exact Casher Coins view adapter, wallet widgets, public responsive UX and safe guest booking.

## Release blockers
- No WhatsApp OTP transport or real browser session issuance. Owner deferred provider integration but did not authorize phone-only private account access.
- No approved authenticated Website BFF code-reveal route or Casher customer HTTP API; this is only a typed callback contract.
- No direct Production DB connection in current tools; owner permission does not prove schema, tenant/customer/branch mapping or real voucher ownership.
- No production voucher/Coins mutations or staging SQL concurrency proof. Other rewards need their invoice-effect integration and refunds/reversals.
- No merge/deploy. Future rollout needs synthetic cross-tenant staff/client tests, real mobile/desktop UX verification, VPS rollback and exact-head owner approval.
