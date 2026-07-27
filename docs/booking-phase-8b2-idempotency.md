# Booking Phase 8B2 — Cancel Idempotency

- Operation key: `cancel:{BOOKING_CODE}` via Phase 8A `buildCancelOperationKey`
- Double-click guarded by `inFlightRef`
- Unknown outcome preserves mutation ID (orchestration does not abandon on httpStatus 0)
- Safe retry reuses same ID; never mint a new key for the same cancel intent
- Verification lookup may run before retry
