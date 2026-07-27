# Booking Phase 8B3 — Verification

## Unit tests

```bash
npm test -- src/components/__tests__/BookingModalBarberFirst.test.tsx src/lib/booking-api/__tests__/bookingBarbersNormalize.test.ts
```

Result: **8/8 PASS** (profile lock, service filter, branch-change reset, barber-change clears services, plan with empId; Camp Caesar filter + profile + location).

Also re-ran `BookingModalFlow.test.tsx`: **19/19 PASS**.

## ESLint

```bash
npx eslint src/hooks/useBookingFlow.ts src/components/BookingModal.tsx src/components/BarbersSection.tsx src/components/english-home/EnglishHome.tsx src/lib/booking-api/barbers.ts src/components/__tests__/BookingModalBarberFirst.test.tsx src/lib/booking-api/__tests__/bookingBarbersNormalize.test.ts --max-warnings 0
```

Result: **PASS**

## Build

```bash
npm run build
```

Result: **PASS** (Next.js 16.2.4)

## Browser plan smoke

### UI (localhost:3001)

- Barber grid visible without prior branch gate
- Click `احجز مع محمد` opens `BookingModal`
- Barber-first copy observed: **فرع محمد** / **اختار فرعاً يعمل به هذا الحلاق**
- Sidebar shows specific mode (**اختيار حلاق**)
- Live catalog/profile from Casher **blocked by CORS** on `localhost` (fallback cards without `empId`)
- **Create not attempted**

### API plan path (Node, Origin cutsaloon.com)

```bash
node scripts/phase8b3-barber-first-plan-smoke.mjs
```

Result:

| Field | Value |
|---|---|
| empId | 18 |
| branchCode | GLEEM |
| serviceId | 9 |
| Camp Caesar filtered | true |
| available-days | 200, all `global_leave` |
| planToken | **SKIP** (no open day) |
| create | **NOT RUN** |

## Notes

- Localhost browser cannot complete live plan against Casher (CORS). Production origin used for API smoke.
- Backend leave calendar prevented a live `planToken` this run; barber-first query shape (specific + empId + public branch) verified.
