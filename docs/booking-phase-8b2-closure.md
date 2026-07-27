# Booking Phase 8B2 — Closure

## Delivered

- Migrated upcoming + cancel UI to `@/lib/booking-api`
- `/booking` lookup + upcoming tabs
- Access-token preferred lookup; phone fallback
- Cancel dialog with idempotency, unknown outcome, rate-limit, policy errors
- Overnight display; no auto `cut_customer_phone`
- BookingModal success → `/booking?code=`

## Legacy usage report

| Consumer | Status |
|---|---|
| `CustomerUpcomingBookings` | **migrated** |
| Cancel/lookup cards + `/booking` | **new typed** |
| `ClientProfileWidget` profile count | still `getClientProfile` (CRM) |
| `ServicesSection` / `BarbersSection` / EnglishHome | still legacy catalog |
| `publicBookingApi` upcoming/cancel | **unused by UI** |

## Verdicts

| Criterion | Verdict |
|---|---|
| Lookup typed-client migration | **GO** |
| Access-token ownership | **GO** |
| Phone fallback | **GO** |
| Upcoming bookings migration | **GO** |
| BookingCode migration | **GO** |
| Cancel idempotency | **GO** |
| Unknown cancellation outcome UX | **GO** |
| Rate-limit UX | **GO** |
| Cancellation policy errors | **GO** |
| Phone privacy | **GO** |
| Security | **GO** |
| Accessibility/mobile (implementation) | **GO** |
| Controlled live cancel proof | **NOT RUN** |
| Phase 8B2 closure | **GO** |
| Full booking E2E readiness | **NO-GO** (barber-first + live smoke pending) |
| Backend enforce activation | **NO-GO** |

## Client contract limits (8B2A)

Aligned with backend `booking-public-v1` via `src/lib/booking-api/limits.ts`:

- `UPCOMING_BOOKINGS_MAX_LIMIT = 25`
- `BOOKING_CODE_MAX_LENGTH = 32`
