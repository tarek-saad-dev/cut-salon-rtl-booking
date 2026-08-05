# Phase 1C Client — Multi-Branch Barber Booking Experience

**Date:** 2026-08-06  
**Scope:** Appointment options for multi-branch barbers, all-branches / specific-branch calendars and slots, frontend branch visual identity, barber availability API client (with compat fallback), review/plan branch consistency.  
**Non-goals:** Full modal visual redesign, sidebar removal, customer-lookup redesign, plan/create contract changes, migrating live state to unused `lib/booking-api/state.ts`, backend scheduling rule changes.

Builds on Phase 1A (`LanguageContext` / booking catalog) and Phase 1B (`BookingController`, `resolveBookableBranchesForBarber`, draft branch SoT).

---

## 1. Files changed

### New
| File | Role |
|------|------|
| `src/lib/booking/branch-visuals.ts` | Frontend-only Gleem / Camp visual tokens + CSS variable helpers |
| `src/lib/booking-api/barber-availability.ts` | Typed `getBarberAvailableDays` / `getBarberAvailableSlots`, cache/dedup, compat merge |
| `src/components/BookingAvailabilityScope.tsx` | Appointment options step (two selectable cards) |
| `src/components/BookingMultiBranchTimeSlots.tsx` | Chronological merged slots + branch filters + earliest badge |
| `src/lib/booking-api/__tests__/barberAvailabilityScope.test.ts` | Steps, effective branch, slot keys, day shape |
| `docs/booking-redesign/phase-1c-client/screenshots/*` | Required E2E captures |
| `docs/booking-redesign/phase-1c-client/PHASE_1C_CLIENT_IMPLEMENTATION_REPORT.md` | This report |

### Updated
| File | Change |
|------|--------|
| `src/hooks/useBookingFlow.ts` | Scope state, multi-branch days/slots, scope transitions, slot→draft branch commit |
| `src/lib/booking-api/booking-steps.ts` | `appointment_scope` + dynamic branch step for `specific_branch` |
| `src/lib/booking-api/booking-branch.ts` | Suppress preferred for multi-branch / `all_branches`; `determinedByTime`; `localizeBranchName` |
| `src/lib/booking-api/index.ts` | Exports |
| `src/lib/i18n/booking.ts` | Scope, legend, filters, partial warning, determined-by-time, empty copy |
| `src/components/BookingModal.tsx` | Scope step wiring; single-branch auto-resolve only; calendar indicators; secondary “view all branches” |
| `src/components/BookingCalendar.tsx` | Soft branch fills, dual indicators, legend, selection ring separate from identity |
| `src/context/BookingController.tsx` | Optional `explicitEntryBranchCode` / `initialAvailabilityScope` |

---

## 2. State additions (`useBookingFlow`)

```ts
type BarberAvailabilityScope = "all_branches" | "specific_branch";

availabilityScope: BarberAvailabilityScope | null
allowedBarberBranches: PublicBranch[]   // profile ∩ public
selectedSpecificBranchCode: string | null
explicitEntryBranchCode: string | null
multiBranchDays / multiBranchSlots (+ metas for partial/warnings)
selectedBranchFilter: "all" | branchCode
```

Rules enforced:
- Browsing `BranchContext.selectedBranch` / localStorage is **not** a booking decision for multi-branch barbers.
- Global multi-branch card starts with **no** scope selected.
- `all_branches` does not commit a draft branch until a slot is chosen.
- `specific_branch` requires explicit branch selection before Continue.
- Slot selection stores the full slot and `commitDraftBranch(slot.branchCode)`.
- Scope transitions clear date / slot / plan only; barber and compatible services are preserved.

---

## 3. Dynamic steps

**Multi-branch:**  
`appointment_scope` → `branch` (only if `specific_branch` and unresolved) → `service` → `date` → `time` → `details` → `review`

**Single-branch (Ahmed Camp / Mahmoud Gleem):**  
`service` → `date` → `time` → `details` → `review` (auto-resolve branch; skip options)

Step label: AR `طريقة عرض المواعيد` / EN `Appointment options`.

Explicit branch CTA may preselect `specific_branch` + branch, and must still offer **View appointments across all branches**.

---

## 4. API client contract

Expected (when deployed):

- `POST /api/public/booking/barbers/:empId/availability/days`
- `POST /api/public/booking/barbers/:empId/availability/slots`

Body includes `serviceIds`, `scope`, optional `branchCode`, `dateFrom`/`days` or `date`.

Client behavior:
- AbortController + request deduplication + short cache
- Cache keys include empId, sorted serviceIds, scope, branchCode, date/dateFrom
- Separate loading / empty / error (errors ≠ empty)
- Primary miss → **compat fallback**: merge existing per-branch `available-days` / `available-slots` (`meta.compatFallback: true`)
- Partial results surface `meta.partial` + localized non-blocking warning

---

## 5. Branch visual tokens

`src/lib/booking/branch-visuals.ts` (frontend only — not in API payloads):

| Code | Accent | Soft background |
|------|--------|-----------------|
| GLEEM | `#741D32` | `#F8E9ED` |
| CAMP_CAESAR | `#A97812` | `#FFF3D5` |
| unknown | neutral zinc | |

Color communicates **identity**; selection uses dark outline / check. Labels always accompany color (legend + badges).

---

## 6. Calendar & slots behavior

### All-branches calendar
- Day soft fill + dot(s) from branch summary
- Both branches → two labeled indicators (no blended fill)
- Selected day → neutral/dark outer ring + check (separate from identity)
- Localized legend: Gleem / Camp Caesar / Available at both

### Specific-branch calendar
- Only that branch’s days + soft identity
- Branch context badge + Change branch / View all branches

### All-branches slots
- One chronological list (not Gleem-then-Camp grouping)
- Filters: All branches / Gleem / Camp Caesar (default all)
- Slot shows time, branch badge, overnight label when needed
- Earliest-available highlight across the merged list
- Stable key: `empId + branchCode + date + time + dayOffset`
- Same clock time at both branches → two slots

### Specific-branch slots
- No cross-branch filters; selected branch badge only

---

## 7. Summary / review / plan

Before slot (`all_branches`): sidebar branch = **يُحدد مع الموعد** / **Determined by selected time**.  
After slot: sidebar, review, and plan payload use `selectedSlot.branchCode` — never `BranchContext` fallback.  
Plan/create request shapes unchanged; only the branch value source is the committed slot/draft.

---

## 8. Localization

All new copy lives in typed Phase 1A catalog (`src/lib/i18n/booking.ts`): scope cards, legend, filters, determined-by-time, change/view-all actions, partial warning, empty across-branches, earliest available. No hardcoded AR/EN in new components.

---

## 9. Tests and results

Unit coverage (representative):
1–4. Multi vs single steps / Ziad options / Ahmed Camp / Mahmoud Gleem (resolve + steps suites)
5–8. Preferred Gleem does not commit scope; `all_branches` no initial branch; specific requires selection; explicit CTA supported via controller props
9. Scope transitions clear date/slot/plan (hook)
10–14. Day branch shape + calendar indicators (shape test + E2E screenshots)
15–20. Slot keys unique per branch; review/plan use slot branch (hook + E2E)
21–22. AR/EN + RTL/LTR (screenshots + i18n)
23. Back preserves scope (modal step recovery)
24. Partial warning displayed (E2E time step)
25. Full suite green

```
Test Files  33 passed (33)
Tests       185 passed (185)
```

---

## 10. Screenshots

Under `docs/booking-redesign/phase-1c-client/screenshots/`:

| File | Capture |
|------|---------|
| `ar-ziad-appointment-options.png` | AR options for Ziad |
| `en-ziad-appointment-options.png` | EN options for Ziad |
| `ar-all-branches-calendar.png` | AR all-branches calendar + legend |
| `en-all-branches-calendar.png` | EN all-branches calendar + legend |
| `ar-specific-gleem-calendar.png` | Specific Gleem calendar |
| `ar-specific-camp-calendar.png` | Specific Camp calendar |
| `ar-all-branches-time-slots.png` | AR merged slots + filters + partial warning |
| `en-all-branches-time-slots.png` | EN merged slots + filters + partial warning |
| `ar-review-camp-slot.png` | Review with Camp committed |
| `ar-review-gleem-slot.png` | Review with Gleem committed |
| `mobile-appointment-options.png` | Mobile options |
| `mobile-all-branches-calendar.png` | Mobile all-branches calendar |

---

## 11. Backend dependencies / blockers

| Item | Status |
|------|--------|
| Dedicated `.../barbers/:empId/availability/days\|slots` | **Not deployed** on Casher (HTML SPA / miss) → client uses **compat merge** of existing branch-scoped public APIs |
| Partial branch failures during merge | Surfaced as non-blocking warning (observed in live E2E when one branch fetch fails) |
| Plan/create contracts | **Unchanged** |

---

## 12. Confirmation checklist

PHASE 1C CLIENT MULTI-BRANCH EXPERIENCE COMPLETED

Appointment options: **Yes** — two cards; Continue disabled until choice  
Single-branch barber: **Skips options**; auto-resolves Camp (Ahmed) / Gleem (Mahmoud)  
Multi-branch barber: **Shows options** (Ziad, Kareem); persisted browsing branch does not select scope  
All-branches calendar: **Yes** — per-day branch indicators + text legend  
Specific-branch calendar: **Yes** — single-branch soft identity + change / view-all actions  
Merged slots: **Yes** — chronological; filters; earliest badge; unique keys per branch  
Branch visual identity: **Frontend tokens only** (`branch-visuals.ts`)  
Selected slot branch: **Committed to draft**; sidebar/review match  
Review/payload consistency: **Verified** Gleem + Camp reviews; plan uses draft/slot branch  
Localization: **Catalog-backed** AR/EN + RTL/LTR  
Tests: **185 passed / 33 files**  
Plan/create contracts changed: **No**  
Backend blockers: **Dedicated multi-branch availability routes not live** — compat fallback in use  
Remaining visual redesign: **Full modal/sidebar redesign deferred** (Phase 1C stays within current shell)
