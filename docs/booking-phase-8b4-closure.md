# Booking Phase 8B4 — Final Production Cutover Smoke

**Date:** 2026-07-28  
**Frontend:** cutsaloon.com  
**Backend:** casher-five.vercel.app (compat — **enforce not activated**)  
**Contract:** booking-public-v1  

## Deployed commits

| Commit | Notes |
|---|---|
| `1828429` (`1828429875d70d01499a8d32c04588e1f9d3a703`) | 8B2–8B3A ship used for initial prod smoke |
| *(hotfix on main after smoke)* | create/lookup `code` normalize + available-days timeout 35s |

## Limits

| Limit | Value | Result |
|---|---|---|
| `BOOKING_CODE_MAX_LENGTH` | **32** | PASS |
| `UPCOMING_BOOKINGS_MAX_LIMIT` | **25** | PASS |

## Local verification

| Check | Result |
|---|---|
| `npm test -- src/lib/booking-api` | **PASS** (63) |
| ESLint (booking-api changed files) | **PASS** |
| `npm run build` | **PASS** |

## Production API smoke (fake customer only)

Customer: `Smoke 8B4 Cutover` / `01099887766` — no real customer data.

### Branch-first (nearest)

| Step | Result |
|---|---|
| Plan → create | **PASS** (e.g. `BK-JWCSFE`, HTTP 201) |
| Lookup by access token | **PASS** (`confirmed`) |
| Cancel + idempotent replay | **PASS** (200 / `idempotentReplay: true`) |
| Cancelled status | **PASS** |

### Barber-first (specific)

| Step | Result |
|---|---|
| Plan → create (محمد / empId 7 / GLEEM / حلاقة شعر) | **PASS** (`BK-WVB8PF`, HTTP 201) |
| Lookup by access token | **PASS** (`confirmed`) |
| Cancel + idempotent replay | **PASS** |
| Cancelled status + cleanup | **PASS** (`cancelled`) |

Earlier specific attempts were flaky (`409 SLOT_UNAVAILABLE` under contention). One controlled specific create succeeded and was cancelled.

### Residual

- Orphan smoke booking `BK-VWEA9Q` may remain if access token was not captured in an earlier probe (cancel without token → unauthorized). Not a customer booking.

## Production browser

| Check | Result |
|---|---|
| Barber CTAs with real empIds | **PASS** |
| Barber-first → branch locked + services | **PASS** |
| Barber-first → available days (pre-hotfix) | **FAIL** — request timeout (~20s); days API often 10–16s |
| Camp Caesar visible | **PASS** (not shown) |
| Full UI create click | **NOT RUN** (API path used for one approved create; avoid duplicate live bookings) |

Hotfix raises available-days timeout to **35s** and normalizes live create/lookup envelopes.

## Legacy API audit

| Surface | Uses `publicBookingApi`? |
|---|---|
| BookingModal / useBookingFlow create | **No** — `@/lib/booking-api` |
| Cancel / lookup / upcoming UI | **No** — `@/lib/booking-api` |
| BarbersSection / EnglishHome status | Yes (read-only status/catalog — not create/cancel) |
| ServicesSection catalog | Yes (read-only) |
| ClientProfileWidget | Yes (profile — not booking mutation) |

### Privacy / URL

| Check | Result |
|---|---|
| No `BookingID` / `BranchID` in booking UI | **PASS** |
| Success link uses `/booking?code=` only (no token in URL) | **PASS** |
| No automatic phone storage on create path | **PASS** (opt-in only where designed) |
| Camp Caesar filtered | **PASS** |

## Wire-shape findings (compat)

Live create/lookup use:

- `booking.code` (not always `bookingCode`)
- nested `booking.bookingAccessToken`
- envelope `{ ok, booking, meta }`

Client now normalizes these before UI/storage.

## Enforce readiness

| Gate | Status |
|---|---|
| Limits 32 / 25 | PASS |
| Create/cancel UI off legacy mutation API | PASS |
| Nearest create → lookup → cancel | PASS |
| Specific create → lookup → cancel | PASS (API; one controlled booking) |
| Prod UI calendar reliability | Conditional on hotfix deploy |
| Backend enforce activated | **NOT DONE** (by design) |

## Verdict

**CONDITIONAL GO for enforce** after hotfix commit is live on cutsaloon.com and production browser confirms available-days load without timeout.

**NO-GO to flip enforce in this phase** until:

1. Hotfix deploy confirmed on production UI  
2. Barber-first calendar reaches slots without timeout once in prod browser  

Backend remains **compat**. Do not set `PUBLIC_BOOKING_CONTRACT_MODE=enforce` yet.
