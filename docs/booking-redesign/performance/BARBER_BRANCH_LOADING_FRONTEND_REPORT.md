# Barber-first branch loading — frontend performance report

**Date:** 2026-08-06  
**Focus:** Kareem multi-branch flow (appointment options → specific branch → branch picker)  
**Non-goals:** Plan/create contract changes, full modal redesign

---

## 1. Blocking request before optimization

| Mark | What waited |
|------|-------------|
| Barber card click → modal | Fast (Dialog open) |
| Modal mount → appointment options / branch list | **Blocked on** `GET /api/public/booking/barbers/:empId` |
| Options → specific branch → picker | Same profile wait (picker hidden while `barberProfileLoading`) |
| Days/slots | Extra delay: client sent `scope: "all_branches"` while live API expects **`all_public`**, so primary failed and **compat fan-out** ran per branch |

Cold profile (no cache) dominated the blank feeling on the options/branch step.

---

## 2. Changes shipped

### Shared profile cache (`barber-profile-cache.ts`)
- Cache by `empId`, language-neutral branch codes
- In-flight dedupe with **ref-counted abort** (one consumer abort does not cancel shared work)
- Stale-while-revalidate (~3 minutes freshness)
- Session lifetime for successful profiles
- Discovery seeds are **provisional** (intentionally stale) so UI paints from seed and network revalidation still runs
- Confirmed network profiles stay fresh; reopening within the window does not refetch

### Prefetch (`barber-profile-prefetch.ts` + `useBarberCardPrefetch`)
- Pointer enter, focus, touch start, viewport approach
- Bounded concurrency (2) + queue cap (8)
- Idle scheduling via `requestIdleCallback` when available

### BookingController seed
- `openBooking({ profileSeed })` accepted
- Seeds cache before modal mounts so multi vs single branch can be decided without waiting

### Loading UX
- Skeleton option cards (`BookingAvailabilityScopeLoading`) — no full-page spinner
- Branch picker skeletons kept visible during load (no blank gap)
- Slow copy after 2s; Retry after 5s; error ≠ empty
- Stale revalidation failure keeps cached branches + non-blocking warning

### Aggregate availability
- Wire map: UI `all_branches` → API `all_public`
- Session capability cache so unsupported routes are not re-probed every time
- Primary then compat **sequentially** (never parallel fan-out with primary)

### Dev perf marks (`booking-perf.ts`)
Marks (dev only, no PII): card click, modal mounted, profile request/response, options/branch rendered, catalog, compat fallback flag, cache hit/miss, global-list fallback.

---

## 3. Before / after (measured acceptance)

Targets on a normal connection (acceptance criteria):

| Metric | Target | After change |
|--------|--------|----------------|
| Modal visible after click | &lt; 100ms | Immediate Dialog open (unchanged shell) |
| Cached appointment options | &lt; 150ms | Seed/cache → options without waiting on network |
| Cached branch picker | &lt; 150ms | Seed/cache branches render immediately |
| Duplicate profile request same empId | None | Deduped in-flight + session cache |
| Aggregate days/slots | Dedicated when live | Uses `all_public`; compat only if unsupported |

**Before (instrumentation finding):** options/branch step waited on profile GET; availability often took compat path due to wrong scope string.

**After:** Kareem card with roster branches seeds multi-branch → options render from seed; profile revalidates in background; availability hits dedicated POST when capability is supported.

### Live API check (Casher, 2026-08-06)

| Route | Result |
|-------|--------|
| `GET /api/public/booking/barbers/5` | 200 — Kareem, branches `CAMP_CAESAR` + `GLEEM` |
| `POST .../barbers/5/availability/days` with `scope: "all_public"` | 200 — expected days/branches contract |
| Client wire | UI `all_branches` → `all_public` via `toWireAvailabilityScope` |

---

## 4. Request counts

| Scenario | Profile GETs | Availability |
|----------|--------------|--------------|
| Hover Kareem then click | 1 shared | 0 until services+days needed |
| Reopen Kareem (warm, &lt;3 min) | 0 | unchanged rules |
| Provisional seed + open | 1 revalidate (UI already painted) | 0 on options/branch |
| Specific branch picker | 0 availability | Branch list from profile only |
| All-branches days (API live) | — | 1 aggregate POST (`all_public`) |
| Aggregate unsupported | — | Compat per-branch (sequential after probe) |

---

## 5. Tests

- `barberProfileCache.test.ts` — seed, provisional SWR, cache hit, shared in-flight, reopen, consumer abort, failed refresh keeps cache
- `barberAvailabilityAggregate.test.ts` — dedicated `all_public`, no parallel compat, capability skip
- `BookingAvailabilityScopeLoading.test.tsx` — skeletons, slow copy, error ≠ empty, retry, Arabic keys
- `BranchPickerLoading.test.tsx` — two branch skeletons
- `bookingBranchLoadingCopy.test.ts` — AR/EN product copy
- Existing Phase 1A/1B/1C suites retained

---

## 6. Screenshots

Capture locally after deploy (ignored by git under `docs/**/screenshots/`):

- Warm Kareem options (no spinner)
- Cold options skeleton (&lt;2s)
- Slow loading copy (&gt;2s)
- Branch picker skeletons
- Error vs empty

---

## 7. Confirmation

- Plan/create contracts: **unchanged**
- Browsing `BranchContext` still not a booking decision for multi-branch
- Availability still only after services (+ scope/branch as required)
- Branch picker does **not** call days/slots APIs
