# Overnight Booking Audit

## Intended model (from code)

- Calendar date = operational board day.
- Slots after midnight for that board day carry `dayOffset: 1`.
- Plan/create send `dayOffset` from selected slot (`useBookingFlow` ~859–873, ~947–959).
- UI splits `dayOffset===0` vs `===1` in `BookingTimeSlots.tsx`.

## Customer-facing technical terminology (confirmed in UI code)

| Text | Location | Issue |
|------|----------|-------|
| `(dayOffset=1)` | `BookingTimeSlots.tsx` ~329 | Internal field leaked |
| `تابع لليوم التشغيلي المختار` | overnight pills ~346 | Operational jargon |
| `formatOvernightHint` “تابع ليوم التشغيل…” | `display.ts` ~84–86 | Manage UI |

## End-to-end field map

| Concern | Behavior |
|---------|----------|
| Displayed calendar date | Selected day from available-days |
| Operational day | Same board date; overnight still that date |
| Calendar day after midnight | Clock time 00:xx–… with dayOffset=1 |
| Slot start/end | API `time`; end may be empty until plan |
| Review time | Formatted via Arabic helpers; overnight note if dayOffset=1 (BookingModal details ~1037–1039) |
| Time sent to create | Slot time + dayOffset |
| Stored / confirmation | Prefer calendarDate over workDate in normalize (`booking.ts`) |

## Live sample window (2026-08-05)

Queried Mahmoud @ GLEEM serviceId=10 for dates 2026-08-05 … 2026-08-10:

| Date | Slots | Overnight (dayOffset=1) |
|------|-------|-------------------------|
| 2026-08-05 | 4 | 0 |
| 2026-08-06..10 | 36 each | **0** |

**Status:** Overnight UI path is implemented and unit-tested (`BookingModalOvernight` referenced in codebase), but **live overnight slots were not present** in this sample window. Full visual overnight reproduction **needs reproduction** when overnight hours are scheduled.

## Tests still required when overnight inventory exists

- Normal evening slot
- 12:00 AM / 12:30 AM / 1:00 AM
- Last overnight slot
- Back navigation after selecting overnight
- Review + confirmation date/time consistency
- DB stored values (needs backend/data access)

## Mismatches documented without fix

1. Technical `dayOffset` string exposed to customers (confirmed).
2. Potential confusion between operational day vs calendar midnight (design risk; confirm with live overnight).
3. Back after overnight: `handleBack` invalidates plan and returns to date/time — verify slot retention empirically when slots exist.
