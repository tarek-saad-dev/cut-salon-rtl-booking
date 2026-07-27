# Booking Phase 8B3 — Closure

## Delivered

- Barber card / event entry opens `BookingModal` with `entryMode=barber_first`
- Profile load via `getPublicBarberProfile` (global barbers catalog)
- Branch picker limited to that barber’s public branches (Camp Caesar filtered)
- Mode locked to `specific`; barber preselected
- Services filtered to barber `serviceIds` ∩ branch catalog
- Branch change clears services/date/slot/plan; keeps locked barber
- Barber change clears services (branch-first)
- `BarbersSection` shows global barbers without requiring a prior branch
- Date → slot → plan → create path unchanged (typed client only)

## Entry points

| Surface | Barber select | Nearest |
|---|---|---|
| `BarbersSection` | `barber_first` | `branch_first` |
| `EnglishHome` | `barber_first` (specific) | `branch_first` |

## Verification

| Check | Result |
|---|---|
| Barber-first unit tests | **PASS** (8) |
| Related modal flow tests | **PASS** (19) |
| Browser UI smoke (barber_first modal) | **PASS** |
| Live planToken (API) | **SKIP** (`global_leave`) |
| ESLint | **PASS** |
| `npm run build` | **PASS** |

## Verdicts

| Criterion | Verdict |
|---|---|
| Barber-first entry wiring | **GO** |
| Public branch filter (no Camp Caesar) | **GO** |
| Service filter by barber/branch | **GO** |
| State reset on branch/barber change | **GO** |
| No BranchID / legacy create / client totals for create | **GO** |
| Controlled live create | **NOT RUN** |
| Live planToken proof | **SKIP** (leave) |
| Backend enforce activation | **NO-GO** |
| Phase 8B3 closure | **GO** |
