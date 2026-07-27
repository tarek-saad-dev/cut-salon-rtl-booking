# Booking Phase 8B4 — Final Production Cutover Smoke

**Date:** 2026-07-28  
**Frontend:** cutsaloon.com  
**Backend:** casher-five.vercel.app (compat — **enforce not activated**)  
**Contract:** booking-public-v1  

## Deployed commits

| Commit | Notes |
|---|---|
| `1828429` (`1828429875d70d01499a8d32c04588e1f9d3a703`) | Live on cutsaloon.com during smoke (8B2–8B3A) |
| `85af015` (`85af015047e8182402c9172d404384a9e6fa7728`) | Pushed hotfix: `code`→`bookingCode` normalize + available-days 35s — **not confirmed in prod JS bundle yet** (`35000` absent) |

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

Customer: `Smoke 8B4 Cutover` / `01099887766` — no real customer data. Enforce **not** activated.

### Branch-first (nearest)

| Step | Result |
|---|---|
| Plan → create | **PASS** (`BK-JWCSFE`, HTTP 201) |
| Lookup by access token | **PASS** (`confirmed`) |
| Cancel + idempotent replay | **PASS** (200 / `idempotentReplay: true`) |
| Cancelled status | **PASS** |

### Barber-first (specific)

| Step | Result |
|---|---|
| Plan → create (محمد / empId 7 / GLEEM / حلاقة شعر) | **PASS** (`BK-WVB8PF`, HTTP 201) |
| Lookup by access token | **PASS** (`confirmed`) |
| Cancel + idempotent replay | **PASS** |
| Cancelled status | **PASS** (`cancelled`) |

## Production browser

| Check | Result |
|---|---|
| Barber CTAs with real empIds | **PASS** |
| Barber-first → branch → service → date → slots | **PASS** (calendar ~11s; slots e.g. 12:30 م+) |
| Branch-first (أقرب ميعاد) → service → calendar | **PASS** (days 28–31 enabled) |
| Full UI create click | **NOT RUN** (one approved create done via API; avoid duplicate live bookings) |
| Camp Caesar visible | **PASS** (not shown) |
| available-days timeout under load | Intermittent — earlier run hit 20s timeout; later run succeeded |

## Legacy API audit

| Surface | Uses `publicBookingApi` for create/cancel? |
|---|---|
| BookingModal / useBookingFlow | **No** — `@/lib/booking-api` |
| Cancel / lookup / upcoming UI | **No** — `@/lib/booking-api` |
| BarbersSection / EnglishHome / ServicesSection / ClientProfile | Yes — **read-only** only (status/catalog/profile) |

### Privacy / URL

| Check | Result |
|---|---|
| No `BookingID` / `BranchID` in booking UI | **PASS** |
| Success link `/booking?code=` only (no token in URL) | **PASS** |
| No automatic phone storage on create path | **PASS** |
| Camp Caesar filtered | **PASS** |

## Wire-shape findings (compat)

Live create/lookup use `booking.code` + nested `booking.bookingAccessToken` + envelope `{ ok, booking, meta }`.  
Hotfix `85af015` normalizes these; **required** before UI create can reliably show code / store access token.

## Enforce readiness

| Gate | Status |
|---|---|
| Limits 32 / 25 | PASS |
| Create/cancel UI off legacy mutation API | PASS |
| Nearest create → lookup → cancel (API) | PASS |
| Specific create → lookup → cancel (API) | PASS |
| Prod UI barber-first to slots | PASS |
| Prod UI branch-first to calendar | PASS |
| Hotfix `85af015` live on cutsaloon.com | **NOT CONFIRMED** |
| Backend enforce activated | **NOT DONE** (by design) |

## Verdict

**NO-GO for enforce** until hotfix `85af015` is confirmed live on cutsaloon.com.

Reasons:
1. Without create/lookup normalize, UI success may omit `bookingCode` and fail to persist access token (live wire uses `code`).
2. available-days can exceed 20s under cold load; 35s timeout is in the hotfix only.

After `85af015` is live: re-check one controlled UI success code display → then **GO** for enforce is appropriate. Backend stays **compat** until then.
