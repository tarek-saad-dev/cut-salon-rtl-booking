# Phase 0 — Executive Summary

**Date:** 2026-08-05  
**Scope:** Public website (AR/EN) + booking modal end-to-end  
**Constraint:** Audit and documentation only — no redesign, no refactor, no production behavior change

## Verdict

The public site and booking product currently behave as **two visual languages and one Arabic-only booking shell**. Barber-first booking is blocked for Camp-Caesar-only barbers (notably Ahmed) because the frontend intersects profile branches with a public branch list that permanently excludes `CAMP_CAESAR`, while the sidebar can still show a stale/saved GLEEM branch.

## Top confirmed findings

| ID | Finding | Priority | Confidence |
|----|---------|----------|------------|
| P0-01 | English site opens Arabic RTL booking modal | P0 Localization | Confirmed |
| P0-02 | Ahmed barber-first → empty public branches; sidebar still shows GLEEM | P0 Frontend + Data | Confirmed |
| P0-03 | Duplicate close buttons (StepHeader X + Dialog default Close) | P1 UI/a11y | Confirmed |
| P0-04 | Mode step has no Back button | P1 UX | Confirmed |
| P0-05 | Overnight UI exposes `dayOffset=1` / “operational day” to customers | P1 Localization/UX | Confirmed (code); live overnight slots not present in sample window |
| P0-06 | Arabic homepage and English homepage are separate component trees | P1 Visual parity | Confirmed |
| P0-07 | Dual booking API clients (`booking-api` vs legacy `publicBookingApi`) | P2 Architecture | Confirmed |
| P0-08 | Live hook state ≠ unused pure `state.ts` model | P2 State | Confirmed |

## Ahmed vs Mahmoud (one-line)

Ahmed’s public profile returns **only `CAMP_CAESAR`**; Mahmoud returns **only `GLEEM`**. Frontend public pickers filter out Camp → Ahmed’s `allowedBranches` is empty; Mahmoud auto-confirms GLEEM and continues.

## Localization (one-line)

`BookingModal` never reads `LanguageContext`; it hardcodes `dir="rtl"` and Arabic copy, so language switch / English homepage cannot localize an open or newly opened modal.

## What was tested live

- Live Casher API: branches, global barbers, per-barber profiles, GLEEM vs CAMP barber lists, available-days/slots samples
- Local app `http://localhost:3001`: AR home, EN home, Ahmed barber-first, Mahmoud barber-first, EN View Times → Arabic modal
- Screenshots under `screenshots/`; API payloads under `evidence/`

## What was intentionally not done

- No UI redesign
- No component refactor
- No API / DB / booking-rule changes
- No employee or branch data modifications
- No silent bug fixes
- No diagnostic logging added (not required to complete evidence)

## Document index

1. `PHASE_0_EXECUTIVE_SUMMARY.md` (this file)
2. `CURRENT_BOOKING_FLOW_MAP.md`
3. `COMPONENT_AND_FILE_MAP.md`
4. `BOOKING_STATE_MAP.md`
5. `API_DEPENDENCY_MAP.md`
6. `LOCALIZATION_AUDIT.md`
7. `BARBER_AVAILABILITY_AUDIT.md`
8. `OVERNIGHT_BOOKING_AUDIT.md`
9. `CUSTOMER_LOOKUP_AUDIT.md`
10. `UI_ACCESSIBILITY_AUDIT.md`
11. `AR_EN_VISUAL_COMPARISON.md`
12. `PERFORMANCE_AUDIT.md`
13. `CONFIRMED_ISSUES.md`
14. `PHASE_1_INPUTS.md`
