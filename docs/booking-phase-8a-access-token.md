# Phase 8A — Booking Access Token Storage

**Module:** `src/lib/booking-api/booking-access-store.ts`

Persists ownership proof after successful create so the customer can revisit / cancel without relying on phone alone.

---

## Storage model

| Item | Detail |
|---|---|
| Mechanism | **localStorage** |
| Key | `cut_bk_access:{NORMALIZED_BOOKING_CODE}` |
| Index | `cut_bk_access_index` |
| Fields | `bookingCode`, `bookingAccessToken`, `savedAt`, `expiresAt` |
| Default TTL | **30 days** from save (backend TTL ≈ 30 days) |
| Phone in same record | **No** |
| planToken in this store | **Never** |

Codes are normalized (`trim` + uppercase).

---

## API

| Function | Behavior |
|---|---|
| `saveBookingAccess` | Persist token; no-op if storage unavailable |
| `getBookingAccess(code)` | Return entry or `null`; purge if expired |
| `removeBookingAccess(code)` | Delete entry + index |
| `clearExpiredBookingAccess` | Sweep index for expired/malformed entries |

---

## Security rules

- Never put `bookingAccessToken` in URLs or history.
- Never log the token (or dump storage contents to console/analytics).
- Guard JSON parse against malformed data.
- Storage failure (private mode / quota) must **not** crash booking — fail closed (return / no-op).

---

## XSS trade-off (acknowledged)

Tokens in `localStorage` are readable by any JavaScript on the origin. There is no `httpOnly` cookie option for a browser SPA talking to a **separate** Casher domain with `credentials: omit`. This is an accepted Phase 8A trade-off; mitigate with CSP, dependency hygiene, and never reflecting tokens into the DOM or URLs.

Do not treat CORS Origin as authorization — access token (or phone ownership) proves cancel/lookup rights.
