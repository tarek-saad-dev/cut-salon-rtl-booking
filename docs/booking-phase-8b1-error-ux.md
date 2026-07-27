# Booking Phase 8B1 — Error UX

| Outcome | UX |
|---|---|
| Success | Success step with backend `bookingCode` |
| `SLOT_*` / barber busy / `NO_ELIGIBLE_BARBER` / `PLAN_CREATE_MISMATCH` | Clear plan; return to time; refresh availability |
| `PLAN_TOKEN_*` | Clear plan; return to availability/planning; never reuse token |
| `RATE_LIMIT_EXCEEDED` | Arabic message + countdown; disable retry until `until` |
| `mutation_outcome_unknown` | “تعذر التأكد من نتيجة الطلب” + “قد يكون الحجز تم بالفعل” + **إعادة المحاولة الآمنة** (same mutation ID) |
| Catalog / availability errors | Show normalized Arabic message — never silent empty replace |

Do not label unknown outcomes as “فشل الحجز”.
