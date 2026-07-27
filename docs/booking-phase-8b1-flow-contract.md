# Booking Phase 8B1 — Flow Contract

**Date:** 2026-07-27  
**Scope:** `BookingModal` + `useBookingFlow` only (branch-first)

## Canonical step sequence

```
branch → mode → service → date → time → details → review → success
```

| Step | Authority |
|---|---|
| branch | `listPublicBranches()` via `BranchContext` |
| mode | Backend `BookingConfig.settings` (`allowSpecificBarber` / `allowNearestBarber`) |
| service | `getServices(branchCode)` — bookable only, max 12 unique IDs |
| date | `getAvailableDays` after branch + services + mode (+ empId if specific) |
| time | `getAvailableSlots` — selection = `time` + `dayOffset` |
| details | name + phone (Egyptian normalize); notes optional |
| review | After `createBookingPlan` — totals from plan response only |
| success | After `submitBookingFromPlan` — `bookingCode` from backend |

## Entry modes

| Mode | 8B1 status |
|---|---|
| `branch_first` | Fully supported |
| `barber_first` | Controlled fallback: `initialMode` / initial barber may skip mode step; full barber-first journey deferred to 8B2/8B3 |

## Authorities removed from modal

- Treating `/plan` as confirmed booking
- Client final price/duration on review/success
- `BookingID` / `BranchID`
- Client-generated booking codes
- Hardcoded GLEEM as API authority
- Writes to `cut_customer_phone`

## Create contract

Review CTA → `submitBookingFromPlan`:

- unchanged `planToken`
- `Idempotency-Key` + matching `clientRequestId`
- selection fields must match plan session fingerprint inputs

Plan is never success. Create is the only confirmation step.
