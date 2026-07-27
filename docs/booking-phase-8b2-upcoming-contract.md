# Booking Phase 8B2 — Upcoming Contract

## Request

`getUpcomingBookings(phone, { limit })` → `POST /api/public/booking/upcoming` with `{ phone, limit }` (cap **25**, from `UPCOMING_BOOKINGS_MAX_LIMIT`).

## Rules

- Phone deliberately entered (form) or passed from deliberate `/client` login (`cut_client`)
- Never auto-read `cut_customer_phone`
- Empty array = success (“لا توجد حجوزات قادمة”)
- API failure shows Arabic error + optional `requestId` — never silent empty
- Cards keyed by `bookingCode`
