# Booking Phase 8B1 — Plan → Create

## Plan (`createBookingPlan`)

Triggered from details (“متابعة للمراجعة”).

Request includes: `branchCode`, `date`, `time`, `dayOffset`, `serviceIds`, `mode`, `empId` (specific only), `customer`, optional `notes`.

Rules:

- Disable while `planning` / `creating` / rate-limited
- Abort on intentional selection change / close
- Require `planToken` (missing ⇒ integration failure UX)
- `planFingerprint` preferred; missing logged in development under compat
- Store via `savePlanSession`
- Navigate to **راجع حجزك** — not success

Review displays backend `totalPrice`, `totalDurationMinutes`, plan line items, branch, customer summary.

CTAs: **تعديل الاختيارات** | **تأكيد الحجز**

## Create (`submitBookingFromPlan`)

- Double-click guarded (`createInFlightRef`)
- Progress: جاري تأكيد حجزك...
- No automatic retry
- Close while creating/unknown → confirm dialog warning
- Success: store access token, clear plan session, show `bookingCode`, prevent another create from success screen

## Conflict / token / unknown / rate-limit

See `booking-phase-8b1-error-ux.md`.
