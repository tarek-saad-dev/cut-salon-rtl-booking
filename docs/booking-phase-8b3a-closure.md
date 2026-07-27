# Booking Phase 8B3A — Closure

## Root cause

1. **Fallback barbers without `empId`** were still bookable after CORS failures, so the modal opened with no profile/branches.
2. **Services wire shape** used `bookable` (not `isBookableOnline`) → catalog filtered to empty.
3. **Slots wire shape** omitted `available` → client treated all slots as unavailable.
4. **Plan response** nested `planToken` under `booking-plan-v1` object → client missed token on flat read.

## Delivered

- Booking CTA only when real `empId` present; no fallback identities on booking path
- Live `listGlobalBarbers` + profile branches/serviceIds
- Retry UI for branch list + barber profile failures
- Specific mode locked; services filtered by barber `serviceIds`
- Compat normalizers: services `bookable`, slots default available, nested planToken

## Verification

| Check | Result |
|---|---|
| Localhost real barbers/branches | **PASS** |
| Barber-first → services / date / slots | **PASS** |
| Live planToken | **PASS** (زياد / GLEEM / 13:00) |
| Create | **NOT RUN** |
| Unit tests | **PASS** |
| ESLint / build | **PASS** |

## Verdict

**GO**
