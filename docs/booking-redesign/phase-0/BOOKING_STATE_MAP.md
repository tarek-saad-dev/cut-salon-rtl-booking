# Booking State Map

## Source of truth status

| Layer | Role | Used by live UI? |
|-------|------|------------------|
| `useBookingFlow` React state | **Actual source of truth** for modal flow | Yes |
| `BranchContext` | Public branches (−CAMP), selectedBranch, hasConfirmedBranch | Yes |
| `BookingModal` local | lookupStatus, lookedUpName, confetti, copied | Yes |
| `lib/booking-api/state.ts` | Pure `BookingFlowState` + transitions | **No** (exported only) |
| `LanguageContext` | Site lang/dir | Page chrome; **not modal** |

## Live state values (`useBookingFlow`)

| Concern | State | Notes |
|---------|-------|-------|
| entryMode | prop → `isBarberFirst` | Not stored as mutable field |
| UI step | `step` | branch/mode/service/date/time/details/review/success (+slots) |
| mode | `specific` \| `nearest` | Forced specific in barber-first |
| branch (context) | `branchCode` from `selectedBranch` | Camp forbidden in context |
| booking branch override | `bookingBranchCode` / `bookingBranchName` | From day location / cross-branch |
| effective branch | `bookingBranchCode ?? branchCode` | Used for catalog/days/slots |
| barber | `barber` `{id,name}` | |
| barber profile | `barberBranches`, `barberServiceIds` | Barber-first only |
| services | `serviceIds`, catalog `services` | Filtered by profile in barber-first |
| date | `selectedDate` | |
| slot | `selectedSlot` (time, dayOffset, date, barber…) | |
| duration/price | derived from services + plan totals | Also `catalogPrice`/`catalogDuration` |
| phone/name/notes | `customerPhone`, `customerName`, `notes` | |
| plan/created | `plan`, `created` | |
| loading/errors | catalog/days/slots/profile/cross/mutation UI | |
| selection version | bump on resets | Stale response guard |

## Modal-computed display (can disagree with step content)

```ts
displayBranchName = flow.bookingBranchName ?? selectedBranch?.branchName
displayBranchCode = flow.bookingBranchCode ?? selectedBranch?.branchCode
```

**Conflict:** For Ahmed, `allowedBranches=[]` so main picker errors, but if `selectedBranch` is still GLEEM from context, sidebar shows GLEEM. Confirmed in live UI.

## Duplicate / derived / reset risks

| Risk | Evidence |
|------|----------|
| Dual models | Pure `state.ts` unused; hook owns transitions differently |
| Sidebar vs main branch | `displayBranch*` from context vs `allowedBranches` filter |
| Title changes with nearest slot barber name | `displayBarberName` prefers slot barberName in nearest mode |
| Downstream clear on branch change | `clearDownstreamFromBranch` in hook |
| Create conflict clears slot → back to time | hook create error path |
| Plan invalidation on Back | `handleBack` → `invalidatePlan` |
| Lookup name may stick | Changing phone <8 digits clears; ≥8 re-lookup; failed/new clears lookedUpName but typed name may remain until overwritten |

## State flow by entry mode

### nearest-slot
1. Open with placeholder barber name “Nearest…” / “أقرب حلاق متاح”
2. Require confirmed public branch
3. Mode locked nearest; skip mode step
4. Catalog for branch; days/slots with `mode=nearest`
5. Selected slot may carry assigned empId/name from API
6. Plan/create use effective branch + slot time + dayOffset

### barber-first
1. Require empId; load profile
2. Intersect profile.branches ∩ publicBranches
3. Auto-confirm if exactly one allowed branch
4. Lock specific mode; filter services by profile.serviceIds
5. Days/slots with `mode=specific&empId=`
6. If intersection empty → blocked (Ahmed)

### branch-first (no initialMode)
1. Branch → mode chooser → service…
2. Specific without empId: pick from `listBranchBarbers`

## Do not refactor yet

Document conflicts only. Phase 1 should decide a single state owner and branch policy for Camp.
