# Booking Phase 8B2 — Lookup Contract

## Ownership sequence

1. Customer provides `bookingCode` (trim + uppercase, max **32**, from `BOOKING_CODE_MAX_LENGTH`).
2. Silently read `getBookingAccess(code)`.
3. If token exists → `lookupBooking(code)` with Bearer token.
4. If no token / token rejected → request phone; `lookupBooking(code, { phone })`.
5. Never put `bookingAccessToken` in URL/query/hash/logs/React Query keys.

## UI

Route: `/booking` (tab: البحث بالكود)

States: empty form, loading, result card, neutral not-found, rate-limit countdown, phone fallback.

Minimal/code-only responses (`ownershipLevel=minimal`) are not treated as fully owned bookings (cancel disabled; may require phone).
