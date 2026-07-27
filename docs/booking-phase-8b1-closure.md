# Booking Phase 8B1 — Closure

## Delivered

- BookingModal migrated to Phase 8A typed client via `useBookingFlow`
- Canonical plan → review → create flow
- Availability abort/dedup/stale guards + `isAvailable` compat normalize
- Overnight `dayOffset` preserved
- Unknown mutation + rate-limit UX
- Customer phone default persistence removed from modal path
- Docs + modal integration/contract tests
- Phase 8A CORS/Expose-Headers docs marked PASS

## Explicitly not done (Phase 8B2+)

- `CustomerUpcomingBookings` migration
- Cancel UI + cancel idempotency in UI
- Full barber-first journey
- Backend `PUBLIC_BOOKING_CONTRACT_MODE=enforce`
- Controlled live create proof

## Legacy usage audit (BookingModal)

| Module | BookingModal | useBookingFlow | Child booking UI |
|---|---|---|---|
| `publicBookingApi.ts` | none | none | BranchPicker/Calendar/TimeSlots/ServiceSelect use `@/lib/booking-api` types |
| `CustomerUpcomingBookings` | still mounted (legacy ops — 8B2) | n/a | still legacy |

## Verdicts

| Criterion | Verdict |
|---|---|
| BookingModal typed-client migration | **GO** |
| Branch-first flow | **GO** |
| Service selection | **GO** |
| Barber mode | **GO** |
| Availability lifecycle | **GO** |
| Plan review | **GO** |
| Create planToken integration | **GO** (unit) |
| Create idempotency | **GO** (unit) |
| Unknown mutation outcome UX | **GO** |
| Rate-limit UX | **GO** |
| Overnight handling | **GO** |
| Customer privacy (modal) | **GO** |
| Accessibility/mobile (implementation) | **GO** |
| Live read/CORS/Expose-Headers | **GO** |
| Live planToken proof | **NO-GO** (no open slot / later 409 empty catalogs during probe) |
| Controlled live create proof | **NOT RUN** |
| Phase 8B2 upcoming/cancel | **NO-GO** |
| Backend enforce activation | **NO-GO** |
