# Booking Phase 8B1 — Security

## Proven in modal path

| Control | Status |
|---|---|
| No `publicBookingApi` in BookingModal / useBookingFlow | PASS |
| No `cut_customer_phone` writes | PASS |
| No `planToken` in URL / localStorage | PASS (session module only) |
| No tokens in logs | PASS (safe logs: endpoint family, code, requestId) |
| Camp Caesar filtered in BranchContext | PASS |
| Branch must exist in public list (saved branch mismatch cleared) | PASS |
| Final totals from `/plan` only on review | PASS |
| Create requires planToken + idempotency orchestration | PASS |
| No BookingID / BranchID in modal flow | PASS |

## Remaining (out of 8B1)

- `CustomerUpcomingBookings` / cancel still on legacy API + may read `cut_customer_phone`
- ServicesSection / BarbersSection still use legacy catalog helpers for marketing sections

## Privacy

Customer name/phone/notes sent only on plan/create. Not on discovery/availability.
