# API Dependency Map

Base URL: `NEXT_PUBLIC_CASHER_API_BASE_URL` → `https://casher-five.vercel.app` (via `booking-api/env.ts`).  
Legacy client still reads `NEXT_PUBLIC_BOOKING_API_BASE_URL` (`publicBookingApi.ts`).

## Per-step map (modal path)

| Step | Endpoint | Method | Params | Caller | Trigger | Loading | Error | Cache | Source of truth? |
|------|----------|--------|--------|--------|---------|---------|-------|-------|------------------|
| App boot | `/api/public/branches` | GET | — | BranchContext | mount | isLoadingBranches | Arabic string | none | Public list, then **frontend drops CAMP_CAESAR** |
| Barber-first open | `/api/public/booking/barbers/{empId}` | GET | empId | `getPublicBarberProfile` | open+barber_first | barberProfileLoading | profile errors | fallback to global list | Profile branches/serviceIds |
| Fallback roster | `/api/public/booking/barbers` | GET | — | `listGlobalBarbers` | profile miss | — | — | session cache | Roster |
| Catalog | `/api/public/booking/config?branchCode=` | GET | branch | useBookingFlow | open+branch | catalogLoading | catalogError | session catalog cache | Config flags |
| Catalog | `/api/public/booking/services?branchCode=` | GET | branch | useBookingFlow | same | same | same | same | Services |
| Catalog (branch-first specific) | `/api/public/booking/barbers?branchCode=` | GET | branch | listBranchBarbers | branch-first catalog | same | same | — | Branch roster |
| Date | `/api/public/booking/available-days` | GET | branchCode, serviceIds, mode, empId? | getAvailableDays | services selected | daysLoading | daysError | 90s in-memory + dedup | Days |
| Time | `/api/public/booking/available-slots` | GET | +date | getAvailableSlots | date selected | slotsLoading | slotsError | 60s + dedup | Slots |
| Day location | `/api/public/booking/barbers/{id}/location` | GET | date, serviceIds | getBarberLocation | date (specific) | dayLocationLoading | — | — | May set bookingBranch* |
| Cross-branch (legacy UI) | `.../cross-branch-availability` | POST | serviceIds, dateFrom, days | getCrossBranchAvailability | slots step path | crossSlotsLoading | — | session cache | Slots by branch |
| Details lookup | `/api/client/lookup?mobile=` | GET | digits | BookingModal | phone≥8 debounce 450ms | lookupStatus | treated as new | none | Name fill only |
| Review | `/api/public/booking/plan` | POST | branch, services, emp, date, time, dayOffset, customer | createBookingPlan | continue details | planning | mutationUi | plan sessionStorage | Plan token |
| Submit | `/api/public/booking/create` | POST | planToken + Idempotency-Key | submitBookingFromPlan | confirm | creating | mutationUi | access token store | Booking codes |
| Manage | `/api/public/booking/{code}` | GET | phone or Bearer | lookupBooking | /booking page | — | — | — | Booking |
| Manage | `/api/public/booking/upcoming` | POST | phone | getUpcomingBookings | manage | — | — | — | List |
| Manage | `/api/public/booking/{code}/cancel` | POST | reason | submitBookingCancellation | cancel dialog | — | — | — | Cancel |

Also: `POST /api/public/booking/check-slot` exists in client; confirm usage before Phase 1.

## Same question, different answers

| Question | Sources | Divergence |
|----------|---------|------------|
| Which branches are public? | API returns CAMP+GLEEM; BranchContext filters CAMP | Frontend policy ≠ raw API |
| Which barbers are bookable? | AR: `listGlobalBarbers`; EN: `getBookingBarbers(branch)` | Ahmed visible globally on AR, absent on EN GLEEM rail |
| Barber branches | Profile `branches[]` may include CAMP; picker excludes CAMP | Intersection empty for Camp-only barbers |
| Branch for display | `selectedBranch` vs `bookingBranch*` vs profile | Sidebar/main disagreement |

## Evidence files

- `evidence/api-branches.json`
- `evidence/api-global-barbers.json`
- `evidence/api-barber-profile-{18,1188,12,25,5,7}.json`
- `evidence/api-available-days-*.json`
- `evidence/api-available-slots-mahmoud-2026-08-05.json`
