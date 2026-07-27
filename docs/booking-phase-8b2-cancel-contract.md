# Booking Phase 8B2 — Cancel Contract

## Entry

From owned booking card → confirmation dialog.

## Call

`submitBookingCancellation({ code, bookingAccessToken?, phone?, reasonCode?, reasonText? })`

- Prefer stored access token
- Idempotency-Key + matching `clientRequestId`
- Never numeric BookingID
- No optimistic cancelled UI before confirmation
- Access token retained after cancel for later view

## Dialog CTAs

رجوع | تأكيد إلغاء الحجز

Progress: جاري إلغاء الحجز...
