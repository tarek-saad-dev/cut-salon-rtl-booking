# Booking Phase 8B1 — Availability Lifecycle

## Prerequisites for available-days

1. Branch selected (`branchCode`)
2. ≥1 service
3. Valid mode
4. Barber selected when `mode=specific`

## Guards

| Guard | Mechanism |
|---|---|
| Dedup | `deduplicatedRequest` inside `getAvailableDays` / `getAvailableSlots` |
| Abort | Hook `AbortController` linked to dedup abort |
| Stale | `incrementSelectionVersion` + `isStaleResponse` |
| No silent empty | `BookingApiError` → Arabic `daysError` / `slotsError` |

## UI copy

- Loading: جاري البحث عن الأيام المتاحة...
- Empty: لا توجد أيام متاحة حاليًا لهذه الاختيارات
- Rate limit: countdown via `retryAfterSeconds`

## Overnight

- Preserve `slot.dayOffset` (including `1`)
- Do not convert overnight into the next board date
- Label: `تابع لليوم التشغيلي المختار`
- Plan/create send the same `dayOffset`
