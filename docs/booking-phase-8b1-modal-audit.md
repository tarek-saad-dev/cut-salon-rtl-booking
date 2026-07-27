# Booking Phase 8B1 — BookingModal Audit

**Date:** 2026-07-27  
**File:** `src/components/BookingModal.tsx`

## Previous step sequence

`branch → mode → service → date → time → confirm → success`

- Mode skipped when `initialMode` is set (barber card / nearest CTA).
- Success was shown after **`createBookingPlan` (`POST /plan`)** — not after `/create`.

## State fields

| Area | Fields |
|---|---|
| Branch | `useBranch()` → `branchCode`, `selectedBranch` |
| Catalog | `config`, `services`, loading/error |
| Availability | `availableDays`, `availableSlots` |
| Selection | `selectedServiceIds`, `selectedDate`, `selectedTime`, `selectedSlot`, `selectedMode` |
| Customer | `customerName`, `customerPhone`, lookup status, `savedClient` |
| Submit | `isSubmitting`, `submitError`, `confirmedPlan` |

## Legacy API imports (pre-migration)

From `src/lib/publicBookingApi.ts`:

- `getBookingConfig`, `getBookingServices`, `getAvailableDays`, `getAvailableSlots`, `createBookingPlan`
- `BookingConflictError`, `BookingPlanError`
- Types: `BookingService`, `AvailableDay`, `AvailableSlot`, `BookingPlanResponse`, `PublicBranch`, …

## Local price / duration

Confirm step summed catalog `price` / `durationMinutes` client-side for display. Success used plan totals only.

## Phone persistence

- Wrote `localStorage.cut_customer_phone` on “success”
- Wrote/read `cut_client` via `clientStorage` on lookup and submit
- Debounced `GET /api/client/lookup` (Next route, not Casher)

## Branch / barber assumptions

- Branch from `BranchContext` (legacy `fetchPublicBranches`)
- Specific mode used `barber.id`; nearest used `selectedSlot.empId`
- Hardcoded “جليم” lives in `NearestAvailability` (outside modal)

## Availability effects

- Days fetch on `currentStep === "date"` with `cancelled` flag only (no AbortController to API, no dedup)
- Slots fetch on time step similarly
- Errors often became empty lists (silent)

## Plan submission / success

- Confirm button → `createBookingPlan` → treat as booking confirmed
- No `planToken`, no `/create`, no idempotency, no `bookingAccessToken` store

## Close / reset

- 300ms delayed full reset to `branch`
- Branch mid-flow change cleared services/date/slot/plan-ish state

## Duplicate requests / mobile / a11y

- Double-submit guarded by `isSubmitting` only
- Dialog has title/description; mobile mini-bar + bottom barber bar exist
- CustomerUpcomingBookings still mounts on mode/service (legacy upcoming/cancel — out of 8B1 scope)

## Migration mandate

Replace plan-as-success with:

`… → details → plan → review → create → success`

using `src/lib/booking-api/*` only for booking operations inside the modal.

## Post-migration usage audit (BookingModal)

| Import surface | Status |
|---|---|
| `BookingModal.tsx` → `publicBookingApi` | **none** |
| `useBookingFlow.ts` → `publicBookingApi` | **none** |
| BookingCalendar / TimeSlots / ServiceSelect / BranchPicker | types from `@/lib/booking-api` |
| `CustomerUpcomingBookings` (still mounted) | legacy — Phase 8B2 |

Proof: `BookingModalContracts.test.tsx` + `BookingModalFlow.test.tsx`.

