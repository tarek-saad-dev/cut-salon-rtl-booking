# Booking Phase 10D — Cross-Branch Barber Slots UI

**Date:** 2026-07-28  
**Frontend:** cutsaloon.com  
**API:** `POST /api/public/booking/barbers/[empId]/cross-branch-availability`

## UI flow (barber-first)

`service → slots (tabs) → details → review → success`

- Removed branch step from barber-first.
- Branch-first nearest flow unchanged: `branch → mode → service → date → time → …`

## Tabs

| Condition | Tabs |
|---|---|
| 1 branch (e.g. Ahmed / Camp) | No tabs — slots list only |
| 2+ branches (e.g. Ziad) | `جميع المواعيد` + one tab per branch |

Default tab = `جميع المواعيد`. Tab change filters locally (no new request).

## Selection → plan

Selecting a slot stores `branchCode`, `branchName`, `date`, `time`, `dayOffset`, `empId` (locked barber).  
Plan/create use the **selected slot’s** `branchCode` (supports Camp even when BranchContext hides it).

## Request count

**One** cross-branch availability POST per barber + service selection. Changing services/barber aborts and reloads once. No request on tab change. No client-invented slots.

## Verify

| Check | Result |
|---|---|
| Unit tests (booking-api + barber-first 10D) | PASS |
| ESLint (changed files) | PASS |
| `npm run build` | PASS |
| Branch-first days/slots still used | PASS |
| Overnight `dayOffset` preserved into plan | PASS (unit) |
| Same-time multi-branch keys distinct | PASS |

## Browser plan smoke (localhost:3001 → live Casher)

| Check | Result |
|---|---|
| Ahmed: no tabs; all slots Camp (`كامب شيزار`) | PASS |
| Ahmed plan body `branchCode` | `CAMP_CAESAR` |
| Ziad tabs | `جميع المواعيد` / `كامب شيزار` / `جليم – سابا باشا` |
| Cross-branch POST count | Ahmed 1 + Ziad 1 = **2**; tab clicks **0** extra |
| Same clock time in Gleem + Camp as separate slots | PASS |
| Create called | **No** (`create: 0`) |

Note: `next start` on :3010 failed barber list load (env not inlined in that build). Smoke used `next dev` :3001 against production API.

## Verdict

**GO** — Phase 10D cross-branch slots UI ready; plan uses selected slot branch; no create in smoke.

## Changed files

- `src/lib/booking-api/barbers.ts` — `getCrossBranchAvailability`, keep Camp on profile branches
- `src/lib/booking-api/types.ts`, `timeout.ts`, `index.ts`
- `src/hooks/useBookingFlow.ts`
- `src/components/CrossBranchSlotsPanel.tsx` (new)
- `src/components/BookingModal.tsx`
- tests under `src/lib/booking-api/__tests__`, `BookingModalBarberFirst.test.tsx`
- `docs/booking-phase-10d-closure.md`
