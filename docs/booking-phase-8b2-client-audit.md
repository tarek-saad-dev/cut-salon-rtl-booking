# Booking Phase 8B2 — Client Audit

**Date:** 2026-07-27

## Summary (pre-migration)

| File | Endpoint | Ownership | Identifier | Storage | Cancel | Errors | Migration |
|---|---|---|---|---|---|---|---|
| `CustomerUpcomingBookings.tsx` | legacy upcoming + cancel | phone | **numeric `booking.id`** | `cut_customer_phone` → `cut_client` | no Idempotency-Key | soft-fail → `[]` | typed upcoming/cancel by `bookingCode` |
| `ClientProfileWidget.tsx` | `getClientProfile` + embeds upcoming | `cut_customer_phone` | count only | orphaned phone key | via child | soft-fail | phone from deliberate `cut_client` only |
| `BookingModal` success | none | token saved by create | `bookingCode` display | access store | n/a | n/a | link `/booking?code=` only |
| Lookup page | **missing** | — | — | — | — | — | add `/booking` |
| Hero / Modal mount | auto upcoming | storage phone | id | same | same | silent empty | compact CTA → `/booking` |

## Explicit findings

- Numeric BookingID used as cancel key
- Phone auto-loaded from localStorage
- Cancel without Idempotency-Key
- Upcoming API failures → empty list
- Client-side cancel gating only via `canCancel` (kept as hint; backend remains authority)
- No bookingAccessToken UI path
- No overnight dayOffset display
- Tokens never were in URLs (good)

## Post-migration targets

See closure doc for migrated files and remaining legitimate `publicBookingApi` consumers (profile CRM, marketing sections).
