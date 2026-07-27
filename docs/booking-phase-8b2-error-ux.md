# Booking Phase 8B2 — Error UX

| Result | UX |
|---|---|
| Success | Cancelled status on card; token kept |
| `BOOKING_ALREADY_CANCELLED` | تم إلغاء هذا الحجز مسبقاً |
| `BOOKING_CANCELLATION_WINDOW_CLOSED` / `CANCEL_TOO_LATE` | انتهت فترة الإلغاء الإلكتروني |
| `BOOKING_ALREADY_IN_SERVICE` | Cannot cancel online |
| `BOOKING_ALREADY_COMPLETED` | Completed; CTA disabled |
| `BOOKING_HAS_PAYMENT` / `BOOKING_CANCELLATION_REQUIRES_STAFF` | Staff required; **no refund claim** |
| `BOOKING_NOT_CANCELLABLE` | Safe Arabic explanation |
| Ownership failures | Single neutral message |
| `mutation_outcome_unknown` | تعذر التأكد… + verify + safe retry |
| `RATE_LIMIT_EXCEEDED` | Countdown; disable submit |

Support may show `رقم مرجع الخطأ` (requestId). Never show `technicalMessage`.
