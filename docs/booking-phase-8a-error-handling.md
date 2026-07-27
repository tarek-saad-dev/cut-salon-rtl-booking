# Phase 8A — Error Handling

**Module:** `src/lib/booking-api/errors.ts`

---

## `BookingApiError`

| Field | Meaning |
|---|---|
| `code` | `PublicBookingErrorCode` |
| `message` | Arabic user-facing string (never raw technical text) |
| `technicalMessage` | Backend technical detail (dev / support only) |
| `errorMetadata` | Backend `error.metadata` |
| `httpStatus` | HTTP status (`0` for network/abort) |
| `requestId` | From `X-Request-Id` when present |
| `retryAfterSeconds` | From header or metadata |
| `isRateLimited` | `RATE_LIMIT_EXCEEDED` or HTTP 429 |
| `isRetryable` | Default: 5xx or 429 |
| `isBusinessConflict` | Default: HTTP 409 |
| `originalCause` | Underlying throw (network / parse) |

Do **not** show `technicalMessage` to customers.

---

## Backend error parsing

Expected nested shape:

```json
{
  "ok": false,
  "error": {
    "code": "SLOT_CONFLICT",
    "message": "...",
    "technicalMessage": "...",
    "metadata": { "retryAfterSeconds": 30 }
  }
}
```

Also accepts legacy `error_code` / top-level `message`. Code falls back to `UNKNOWN_ERROR`.

---

## Special cases

| Case | Handling |
|---|---|
| Malformed JSON / HTML body | `createMalformedResponseError` → `INTERNAL_ERROR`, retryable |
| Network failure | `createNetworkError` → Arabic connectivity message, retryable |
| Abort / timeout | Network error with abort message; **not** retryable |
| Browser CORS failure | Surfaces as network-class failure (opaque to JS) |
| HTTP 429 | Rate-limited `BookingApiError` with `retryAfterSeconds` |
| HTTP 5xx | Retryable `BookingApiError` |
| check-slot `available: false` on 200 | Business result, not thrown as API error |
| Already-cancelled on 200 | Business result when backend returns success shape |

---

## Arabic message map

| Code | Arabic message |
|---|---|
| `BRANCH_REQUIRED` | يرجى اختيار الفرع أولاً |
| `INVALID_BRANCH` | الفرع المختار غير صالح |
| `BOOKING_DISABLED` | الحجز معطل حالياً |
| `SERVICE_NOT_FOUND` | الخدمة المختارة غير متوفرة |
| `SERVICE_NOT_BOOKABLE` | الخدمة المختارة غير متاحة للحجز الإلكتروني |
| `BARBER_NOT_FOUND` | الحلاق المختار غير متوفر |
| `BARBER_NOT_AVAILABLE` | الحلاق المختار غير متاح في هذا الوقت |
| `SLOT_NOT_AVAILABLE` | الموعد لم يعد متاحاً، يرجى اختيار وقت آخر |
| `SLOT_CONFLICT` | الموعد محجوز بالفعل، يرجى اختيار وقت آخر |
| `PLAN_TOKEN_EXPIRED` | انتهت صلاحية خطة الحجز، يرجى المراجعة وإعادة التأكيد |
| `PLAN_TOKEN_REQUEST_MISMATCH` | تم تغيير بيانات الحجز، يرجى مراجعة الاختيارات وإعادة التأكيد |
| `PLAN_TOKEN_REQUIRED` | يرجى مراجعة تفاصيل الحجز قبل التأكيد |
| `BOOKING_NOT_FOUND` | لم يتم العثور على الحجز |
| `BOOKING_ALREADY_CANCELLED` | تم إلغاء هذا الحجز مسبقاً |
| `CANCEL_NOT_ALLOWED` | لا يمكن إلغاء هذا الحجز |
| `CANCEL_TOO_LATE` | لا يمكن إلغاء الحجز في هذا الوقت |
| `CUSTOMER_PHONE_REQUIRED` | يرجى إدخال رقم الهاتف |
| `CUSTOMER_NAME_REQUIRED` | يرجى إدخال الاسم |
| `RATE_LIMIT_EXCEEDED` | عدد الطلبات كثير جداً، يرجى الانتظار قليلاً |
| `VALIDATION_ERROR` | بيانات غير صالحة، يرجى المراجعة |
| `IDEMPOTENT_REQUEST_CONFLICT` | يتم معالجة طلبك، يرجى الانتظار |
| `INTERNAL_ERROR` | حدث خطأ، يرجى المحاولة لاحقاً |
| `UNKNOWN_ERROR` | حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى |

Mapper: `getArabicErrorMessage(code)`.
