# Booking Phase 8B1 — State Reset Matrix

Source of truth: `useBookingFlow` selection state (+ plan session module).

| Trigger | Clears |
|---|---|
| Branch change | barber, services, date, time/slot, days, slots, plan, plan session, mutation UI |
| Services change | date, time/slot, days, slots, plan, plan session |
| Mode change | barber (if nearest), date, time/slot, days, slots, plan, plan session |
| Barber change | date, time/slot, days, slots, plan, plan session |
| Date change | time/slot, slots, plan, plan session |
| Time/slot change | plan, plan session |
| Modal close (before create) | abort in-flight reads/plan; delayed `resetAll` clears draft |
| Successful create | plan cleared by orchestration; UI keeps `created` confirmation; access token in booking-access-store |
| Conflict / plan-token errors | plan + slot cleared; return to time/availability |

## Not duplicated

- Plan token: Phase 8A `plan-session` (memory + sessionStorage), not localStorage
- Mutation ID: Phase 8A idempotency map — not regenerated on re-render
- Access token: booking-access-store only after confirmed create
