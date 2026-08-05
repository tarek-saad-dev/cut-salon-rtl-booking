# Performance Audit

No optimizations applied — identification only.

## Modal open → first interactive step

| Path | Requests (typical) | Notes |
|------|--------------------|-------|
| App already loaded | Branch list may be cached in context | |
| Barber-first | `GET barbers/{id}` (+ optional global fallback) | Blocks allowedBranches |
| Then catalog | config + services (+ barbers if branch-first) | Session catalog cache by branch |
| Auto single branch | may jump to service quickly (Mahmoud) | |
| Ahmed | profile OK but UI dead-end — wasted catalog warm to GLEEM possible | Hook may warm GLEEM catalog while branches empty |

## Per-step request patterns

| Step | Requests | Dup risk | Parallelism | Cache | Cancel |
|------|----------|----------|-------------|-------|--------|
| Branch | profile (barber-first); branches already loaded | — | — | — | abort on close |
| Service | config+services(+barbers) | Previously aborted on profile finish — mitigated by comment in hook | Parallel in effect | session catalog | abort |
| Date | available-days | dedup key | — | 90s memory | caller abort ignored for shared GET |
| Time | available-slots | dedup | — | 60s | similar |
| Location | getBarberLocation | sequential after date | could parallel with slots? | none | abort |
| Details | `/api/client/lookup` | debounce 450ms | — | none | cancelled flag; 2.5s kill |
| Plan | POST plan | — | — | sessionStorage plan | — |
| Create | POST create | idempotency key | — | — | — |

## Confirmed / likely bottlenecks

| Item | Confidence | Notes |
|------|------------|-------|
| Dual clients EN status + modal booking-api | Confirmed | Extra status call via legacy on EN/AR gates |
| Global barbers + per-profile | Confirmed | Profile may fall back to full roster |
| Catalog warm to GLEEM when barber-first has no public branch | Highly likely | Ahmed path |
| Days/slots sequential | Confirmed | By design after selection |
| No request waterfall metrics collected in browser HAR this session | Needs reproduction | Capture HAR in Phase 1 tooling |

## Stale data risks

- Catalog session cache
- Days/slots short TTL caches
- Cross-branch session cache
- BranchContext selectedBranch persists across barber-first opens → sidebar stale branch

## Modal open time

Not instrumented with timers in this audit. Qualitative: Mahmoud reached service step quickly after profile; Ahmed showed loading then empty error; EN Ziad showed Arabic loading string then service.
