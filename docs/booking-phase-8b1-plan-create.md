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

## Success → details (Phase 8B2)

After create success, **عرض تفاصيل الحجز** navigates to `/booking?code={bookingCode}` only.
The destination reads `bookingAccessToken` from the access store — never from the URL.

