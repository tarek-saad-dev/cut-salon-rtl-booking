# Phase 8A — Client Booking Audit

Audit of the existing cutsaloon.com booking frontend before migration to `src/lib/booking-api/`.

**Stack:** Next.js App Router, React 18, @tanstack/react-query, Tailwind, shadcn  
**Legacy API:** `src/lib/publicBookingApi.ts`  
**Backend:** `casher-five.vercel.app` (`booking-public-v1`)  
**Env (legacy):** `NEXT_PUBLIC_BOOKING_API_BASE_URL` (empty-string fallback)  
**Env (Phase 8A):** `NEXT_PUBLIC_CASHER_API_BASE_URL`

---

## Component / file audit

| File/Component | Current Endpoint | Request Shape | Response Assumptions | Token Handling | Idempotency Handling | Error Handling | Storage | Duplicate Request Risk | Required Migration |
|---|---|---|---|---|---|---|---|---|---|
| `BookingModal.tsx` | Multi-step: config, services, available-days, available-slots, **POST `/plan`** (via `createBookingPlan`) | Plan body: `branchCode`, `customer`, `serviceIds`, `date`, `time`, `dayOffset?`, `mode`, `empId?`, `notes?` | Treats `/plan` success as booking confirmation; uses `BookingPlanResponse` with `bookingId` on items; displays client-computed `totalPrice` / `totalDuration` | No `planToken`; no `bookingAccessToken` | None | Conflict / plan / branch errors mapped to Arabic strings; generic submit error | Writes `cut_customer_phone` to localStorage; uses `cut_client` via `clientStorage` | Double-submit / re-render can fire multiple `/plan` calls; no AbortSignal on submit | Call `/plan` then `/create` with `planToken`; store plan session; send idempotency; stop client price/duration authority; store access token |
| `CustomerUpcomingBookings.tsx` | POST `/api/public/booking/upcoming`, POST `/api/public/booking/cancel` | Upcoming: `{ phone }`; Cancel: `{ bookingId, phone }` | `UpcomingBooking.id` treated as cancel key; empty list on soft failure | None | None on cancel | Soft-fail upcoming to `[]`; cancel shows generic Arabic error | Reads `cut_customer_phone` then `cut_client` | Cancel can be double-clicked; no in-flight guard | Cancel by `bookingCode` (+ access token / phone); add idempotency; prefer access token |
| `publicBookingApi.ts` | All public booking routes via `apiFetch` / ad-hoc `fetch` | Query `branchCode` on GETs; JSON bodies on POSTs | `ok: true` wrappers; `PublicBranch.branchId`; `BookingPlanItem.bookingId` | None | None | `BranchRequiredError` / `InvalidBranchError` / `BookingConflictError` / `BookingPlanError`; many paths swallow to empty / generic `HTTP n` | N/A (caller-owned) | No dedup; most GETs lack AbortSignal | Replace with `booking-api` client; drop internal IDs; add metadata / Retry-After / contract version |
| `BarbersSection.tsx` | GET barbers, GET status | `branchCode` query | Barber list + `bookingEnabled` | None | N/A | Local loading / fallback barbers | None for API | Parallel loads without abort/dedup | Use `listBranchBarbers` / `getBookingStatus`; abort on branch change |
| `NearestAvailability.tsx` | (UI copy / local presentation) | N/A | Hardcoded location text **"جليم"** | N/A | N/A | N/A | N/A | N/A | Remove hardcoded GLEEM; use selected branch name from API |
| `clientStorage.ts` | N/A | N/A | `{ name, phone }` under `cut_client` | N/A | N/A | try/catch on read | **localStorage** `cut_client` | N/A | Do not persist phone by default for upcoming; keep opt-in UX only if product requires |
| `branchStorage.ts` | N/A | N/A | Stores `branchId` + codes under `cut_branch` | N/A | N/A | try/catch on read | **localStorage** `cut_branch` (includes numeric `branchId`) | N/A | Stop storing `branchId`; persist `branchCode` (+ display fields) only |
| Loyalty / catalog helpers (`clientLoyaltyApi`, `storeApi`, `serviceCatalogApi`, loyalty page) | Same legacy base URL | Mixed | Mixed | None | None | Varies | N/A | N/A | Point to `NEXT_PUBLIC_CASHER_API_BASE_URL` (separate from booking UI cutover) |

---

## Spec issues (explicit)

| Issue | Where | Severity |
|---|---|---|
| Create flow only calls `/plan`, never `/create` with `planToken` | `BookingModal` + `createBookingPlan` | Critical |
| No `planToken` lifecycle (memory/sessionStorage) | Entire booking flow | Critical |
| No idempotency on create or cancel | `createBookingPlan`, `cancelBooking` | Critical |
| Cancel uses numeric `bookingId` instead of `bookingCode` | `CustomerUpcomingBookings`, `cancelBooking` | Critical |
| No `bookingAccessToken` storage after “success” | Booking success path | Critical |
| Frontend computes `totalPrice` / `totalDuration` from service catalog | `BookingModal` | High |
| `PublicBranch.branchId` and `BookingPlanItem.bookingId` exposed | `publicBookingApi` types + `branchStorage` | High |
| Base URL hard-fallback to `""`; legacy env name | `publicBookingApi` | High |
| No contract version (`X-Booking-Contract-Version`) handling | `apiFetch` | High |
| No Retry-After / rate-limit handling | All fetch paths | High |
| No duplicate-request / stale-response protection | Availability + mutations | High |
| Most functions lack AbortSignal | `apiFetch` and most POSTs | Medium |
| Phone persisted in localStorage (`cut_customer_phone`, `cut_client`) | Modal + upcoming | Medium |
| Hardcoded GLEEM copy | `NearestAvailability.tsx` | Medium |
| Soft-swallowed API errors (upcoming/profile return empty) | `publicBookingApi` | Medium |
| Scattered direct `fetch` wrappers (not one client) | Components + lib + loyalty | Medium |
| No CORS failures observed today | Cross-origin to Casher | Info — still must prove for `https://cutsaloon.com` |

---

## CORS

No CORS failures currently observed from local usage. Production origin **https://cutsaloon.com** must still be proven against Casher (see `booking-phase-8a-cors-proof.md`).

---

## Migration target

All booking screens should consume `src/lib/booking-api/` (central `bookingApiRequest`, typed contracts, plan session, access store, idempotency, rate-limit metadata). Legacy `publicBookingApi.ts` remains only until UI cutover (Phase 8B).
