# Phase 8A — Compatibility Mode

Backend production mode: `PUBLIC_BOOKING_CONTRACT_MODE=compat`.

Frontend expects header:

```http
X-Booking-Contract-Version: booking-public-v1
```

Constant: `EXPECTED_CONTRACT_VERSION` in `src/lib/booking-api/client.ts`.

---

## Validation behavior

| Response header | Client behavior |
|---|---|
| Present and `booking-public-v1` | `contractUnverified: false` |
| Missing | `contractUnverified: true`; **dev** `console.warn`; journey continues |
| Present but mismatched | `contractUnverified: true`; **dev** `console.warn`; journey continues |

During compat mode: **do not break** the user journey on missing/mismatched version. After full cutover, a later phase may harden missing versions to hard failure.

---

## Other signals

Also parsed into `ResponseMetadata`:

- `Deprecation` → `deprecated: true`
- `Warning` → `warning` string
- `X-Request-Id` → `requestId`

Canonical create always sends `planToken`, `Idempotency-Key`, and `clientRequestId`. A canonical request should not receive legacy-compat metadata; if it does in development, log a safe warning (no tokens / PII) and treat as an integration bug.

---

## Enforce mode

Backend enforce mode must stay **disabled** until the frontend consistently sends:

1. `planToken` on every create  
2. Idempotency on every create  
3. Idempotency on every cancel  

Phase 8A builds that foundation; UI cutover is Phase 8B.
