# Phase 8A — Plan Token Lifecycle

**Module:** `src/lib/booking-api/plan-session.ts`

Bridges successful `POST /api/public/booking/plan` to `POST /api/public/booking/create`.

---

## Storage

| Layer | Key / location | Allowed? |
|---|---|---|
| Memory | `_currentSession` | Yes (primary) |
| sessionStorage | `cut_booking_plan_session` | Yes (backing) |
| localStorage | — | **Never** |
| URL / query | — | **Never** |
| Logs / analytics | — | **Never** |

Private browsing / quota failure → memory-only is acceptable.

Default local expiry: **10 minutes** from save.

---

## Session fields

`planToken`, `planFingerprint`, `branchCode`, `mode`, `empId`, sorted `serviceIds`, `date`, `time`, `dayOffset`, `subtotal` (from plan `totalPrice`), `totalDurationMinutes`, `createdAt`, `evaluatedAt`, `expiresAt`

`planToken` is sent **unchanged** to create. Do not decode it for business authority.

---

## Lifecycle rules

| Event | Action |
|---|---|
| Successful `/plan` with token | `savePlanSession` |
| Branch / services / barber / date / time change | `clearPlanSession` |
| Expiry | `getPlanSession` clears and returns `null` |
| Successful `/create` | Clear session |
| `PLAN_TOKEN_EXPIRED` / mismatch | Clear session; require fresh plan |

---

## Match verification

Before create, `isPlanMatchingSelection` must confirm:

- `branchCode`, `mode`, `date`, `time`
- sorted `serviceIds`
- `empId` when mode is `specific`

Mismatch → clear session and return `PLAN_TOKEN_REQUEST_MISMATCH` (user returns to review).

Display price/duration from the **plan response**, not client recalculation.
