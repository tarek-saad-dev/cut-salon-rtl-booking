# Phase 8A — Verification Checklist

---

## Unit tests

Location: `src/lib/booking-api/__tests__/`

Command:

```bash
npx vitest run src/lib/booking-api
```

**Status (2026-07-27):** PASS with Phase 8B1 suite (81 tests including modal).

---

## Build / types / lint

| Check | Command | Status |
|---|---|---|
| TypeScript | Next build typecheck | **PASS** (`npm run build`) |
| ESLint | touched booking files | **PASS** |
| Production build | `npm run build` | **PASS** |
| Booking frontend tests | vitest booking-api + BookingModal | **PASS** |

---

## Connectivity

| Check | Status |
|---|---|
| Local CORS / API probe (`/dev/booking-api-proof`) | PASS (dev page available) |
| Deployed cutsaloon.com CORS probe | **PASS** |
| Production Expose-Headers / browser-readable metadata | **PASS** |

Do not create real customer bookings during ordinary development. Stop live mutation proof at `/plan` if smoke create is unsafe; document mutation proof for a later phase if needed.
