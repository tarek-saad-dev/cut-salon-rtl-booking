# Phase 8A — Closure

## What was built

| Area | Deliverable |
|---|---|
| Env | `NEXT_PUBLIC_CASHER_API_BASE_URL` + `env.ts` validation |
| Client | `bookingApiRequest` with metadata, abort, timeout, `credentials: omit` |
| Types | `booking-public-v1` wire contracts (no BookingID/BranchID/CustomerID) |
| Errors | `BookingApiError` + Arabic mapper |
| Idempotency | Stable create/cancel keys; dual header + body |
| Plan session | Memory + sessionStorage; match before create |
| Access store | localStorage by booking code; 30-day TTL |
| Route modules | branches, services, barbers, availability, booking orchestration |
| Dedup / timeout / state | request-dedup, timeout policies, pure flow state |
| Docs | This Phase 8A documentation set |
| Probe | `/dev/booking-api-proof` (dev-only) |

Legacy `publicBookingApi.ts` remains for non-modal surfaces until 8B2+.

---

## Phase 8B1 (completed in follow-on)

BookingModal rewired to plan → review → create with `planToken` + idempotency. Upcoming/cancel still Phase 8B2.

---

## GO / NO-GO verdicts

| Criterion | Verdict |
|---|---|
| API client foundation | **GO** |
| Contract version handling | **GO** |
| Plan-token integration | **GO** |
| Create idempotency | **GO** |
| Cancel idempotency | **GO** (client module; UI not wired) |
| Booking access-token storage | **GO** |
| Rate-limit handling | **GO** |
| Request deduplication/abort | **GO** |
| Local CORS integration | **GO** |
| Deployed cutsaloon.com integration | **GO** |
| Production Expose-Headers / browser metadata | **GO** |
| Booking Phase 8B UI journey | **Partial GO** — modal 8B1 done; upcoming/cancel 8B2 |

---

## Security checklist

| Check | Status |
|---|---|
| API base URL not overridable via query params | PASS |
| `planToken` never in URL / localStorage / logs | PASS |
| `bookingAccessToken` never in URL / analytics / logs | PASS |
| Customer phone not persisted by default (modal path) | PASS (8B1) |
| Idempotency keys contain no customer PII | PASS |
| Technical backend errors not shown to customers | PASS |
| No numeric BookingID on new cancel/create contracts | PASS |
| No client price/duration authority on create | PASS |
| No internal branch IDs on new branch type | PASS |
| Camp Caesar not forceable via UI state | PASS |
| Preview/internal flags never sent | PASS |
| CORS Origin not treated as authorization | PASS |

---

## Boundary reminder

Phase 8A does **not**: modify Casher backend for UI work, redesign full booking UI, enable Camp Caesar, activate enforce mode, or create real customer bookings without a controlled smoke policy.
