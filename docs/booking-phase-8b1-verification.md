# Booking Phase 8B1 — Verification

## Commands run

```bash
npm test -- src/lib/booking-api src/components/__tests__/BookingModal
npx eslint src/components/BookingModal.tsx src/hooks/useBookingFlow.ts src/lib/booking-api/availability.ts src/lib/booking-api/booking.ts
npm run build
node scripts/phase8b1-live-plan-proof.mjs
```

## Results

| Check | Result |
|---|---|
| Phase 8A + 8B1 modal tests | **81 passed** |
| ESLint (touched files) | **PASS** (exit 0) |
| `npm run build` | **PASS** |
| Live CORS Expose-Headers | **PASS** (`X-Booking-Contract-Version`, `X-Request-Id`, rate-limit, Deprecation, Warning) |
| Live ACAO cutsaloon.com / www | **PASS** |
| Live branches/services (first probe) | **PASS** — GLEEM returned; Camp Caesar absent; 30 services |
| Live available-days shape | Observed `isAvailable` (normalized to `available` in typed client) |
| Live planToken | **Pending** — first probe had no open days (`global_leave`); later probes returned empty catalogs (likely temporary backend/rate-limit) |
| Controlled create | **NOT RUN** |

## Notes

- Do not claim live create success.
- Browser metadata contract headers are production-readable.
- Stop at plan when no safe smoke slot exists.
