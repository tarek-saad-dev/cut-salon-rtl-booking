# Phase 1B — Booking State, Branch Resolution, and Flow Consistency

**Date:** 2026-08-05  
**Scope:** Single booking draft source of truth, Camp Caesar public policy, barber-first branch resolution, dynamic steps, shared modal host across language switch, AR/EN barber eligibility parity.  
**Non-goals:** Final visual redesign, sidebar removal, phone-first lookup, API client consolidation, adopting unused `lib/booking-api/state.ts` as the live machine, DB assignment changes.

Source of truth: Phase 0 audits (`BOOKING_STATE_MAP.md`, `BARBER_AVAILABILITY_AUDIT.md`, `CURRENT_BOOKING_FLOW_MAP.md`, `API_DEPENDENCY_MAP.md`, `CONFIRMED_ISSUES.md`) and `phase-1a/PHASE_1A_IMPLEMENTATION_REPORT.md`.

---

## 1. Files changed

### New
| File | Role |
|------|------|
| `src/lib/booking-api/branch-code.ts` | `normalizeBranchCode` / `branchCodesEqual` |
| `src/lib/booking-api/resolve-bookable-branches.ts` | `resolveBookableBranchesForBarber` |
| `src/lib/booking-api/booking-steps.ts` | `getBookingSteps` + `recoverStepInSequence` |
| `src/lib/booking-api/booking-branch.ts` | `getEffectiveBookingBranch` / `getBookingBranchDisplay` |
| `src/lib/booking-api/barber-eligibility.ts` | Global discovery + branch roster filters |
| `src/context/BookingController.tsx` | Shared booking open/close + single `BookingModal` host |
| `src/lib/booking-api/__tests__/resolveBookableBranches.test.ts` | Resolver, steps, eligibility, display SoT |
| `src/context/__tests__/BranchContext.test.tsx` | Camp preserved; invalid persistence cleared |
| `src/components/__tests__/BookingServiceSelectKeys.test.tsx` | No duplicate React keys |
| `docs/booking-redesign/phase-1b/screenshots/*` | Required E2E captures |
| `docs/booking-redesign/phase-1b/PHASE_1B_IMPLEMENTATION_REPORT.md` | This report |

### Updated
| File | Change |
|------|--------|
| `src/context/BranchContext.tsx` | Removed hardcoded `CAMP_CAESAR` exclusion; API-driven public list; clear invalid persisted branch |
| `src/components/HomePageClient.tsx` | Wraps homes with `BookingControllerProvider` |
| `src/components/BarbersSection.tsx` | Dispatches to shared controller; discovery eligibility |
| `src/components/english-home/EnglishHome.tsx` | Same global discovery semantics; shared controller |
| `src/components/BookingModal.tsx` | Resolver + draft branch SoT; dynamic steps; nearest title stability; success `/booking?code=` link restored |
| `src/hooks/useBookingFlow.ts` | `commitDraftBranch`; draft-oriented branch writes |
| `src/components/BookingServiceSelect.tsx` | Namespaced keys; dedupe in grouping helpers |
| `src/lib/i18n/booking.ts` | Error codes + nearest title + `success.viewDetails` |
| `src/lib/booking-api/index.ts` | Export new helpers |
| Booking contracts / related tests | Phase 1B assertions |

---

## 2. Camp Caesar policy implementation

- `GET /api/public/branches` remains the authority for public bookable branches.
- `BranchContext.normalizePublicBranches` keeps every returned branch with a valid code (GLEEM + CAMP_CAESAR).
- Removed the frontend exclusion that dropped `CAMP_CAESAR` from the list and from `selectBranch`.
- No hardcoded allow-list of branch codes; no inference from display names.
- Persisted `cut_branch`: kept when still in the public list; cleared when no longer valid.
- Backend employee assignments unchanged. Ahmed stays Camp-only (no fake GLEEM assignment).

---

## 3. Branch resolver contract

```ts
resolveBookableBranchesForBarber({
  barberProfileBranches,
  publicBranches,
  preferredBranchCode,
}): {
  allowedBranches: PublicBranch[];
  resolvedBranch: PublicBranch | null;
  resolution: "none" | "single" | "preferred" | "multiple";
}
```

Rules enforced:
1. Normalize codes via `normalizeBranchCode`.
2. Intersect profile ∩ public.
3. `none` → no resolved branch; UI shows not-set / unavailable (no stale preferred).
4. Exactly one → `single` + auto-select.
5. Multiple → reuse preferred only if in `allowedBranches` (`preferred`); else `multiple` picker.
6. Never resolve by display name; language-neutral.

`BookingModal` calls this once for barber-first; presentational steps do not re-implement intersection.

---

## 4. Booking branch source-of-truth rules

| Concept | Role |
|---------|------|
| **Preferred / global** | `BranchContext.selectedBranch` for browsing; may seed booking only when still valid |
| **Booking draft** | `useBookingFlow.bookingBranchCode` (+ derived name) — live SoT inside the modal |
| **Slot-resolved** | Slot / cross-branch `branchCode` committed into the draft through explicit transitions |

Selectors:
- `getEffectiveBookingBranch(flowState)` — code identity only from draft / slot / (non-stale) preferred.
- `getBookingBranchDisplay(flowState, lang, notSetLabel)` — display from code + public branch data.

Guarantees:
- No `bookingBranchName ?? selectedBranch?.branchName` uncontrolled fallback.
- Barber-first `resolution === "none"` never shows a stale preferred branch in sidebar/review.
- Sidebar, step content, review, and create path read the same effective branch.

---

## 5. Booking state transitions

Live SoT remains **`useBookingFlow`** (not `state.ts`).

Draft explicitly covers: entryMode (via modal), mode, currentStep, branchCode, barber, services, date, slot, customer fields, plan, created, loading/mutation, recoverable errors.

Transition helpers / paths:
- `commitDraftBranch` — draft branch write
- `clearDownstreamFromBranch` — branch-dependent clears
- Service / date / slot selectors clear only downstream dependents
- Back navigation does not clear selections
- Modal close → `resetAll` (after animation); each `openBooking` remounts modal via `sessionKey`

Invalidation:
- Branch → services (when invalid), date, slot, plan, created; barber cleared unless barber-first lock
- Barber → incompatible services, date, slot, plan
- Service → date, slot, plan
- Date → slot, plan
- Slot → plan

---

## 6. Dynamic step calculation

`getBookingSteps({ entryMode, initialMode, branchResolved, barberResolved, servicePreselected })` drives both desktop and mobile steppers.

- Skip branch step when branch already validly resolved.
- Skip mode when locked by entry / initial mode.
- `recoverStepInSequence` moves `currentStep` to the nearest valid previous step when the sequence shrinks.
- Phase 1A translation / a11y labels preserved on the shared sequence.

---

## 7. Modal host architecture

```
HomePageClient
├── BookingControllerProvider
│   ├── ArabicHome | EnglishHome  (openBooking intents only)
│   └── BookingModal (single instance, keyed by session)
```

- Language switch re-renders homepage trees but keeps the controller + open modal mounted.
- `sessionKey` increments on each `openBooking` so a new intent does not inherit leftover `mode` from a prior barber-first session (fixes nearest title / method bleed).

---

## 8. Arabic / English barber list behavior

| List | Behavior |
|------|----------|
| **Global discovery** | `listGlobalBarbers` ∩ `filterBarbersForPublicDiscovery` — Camp-only barbers (Ahmed) eligible |
| **Branch roster** | `filterBarbersForBranchRoster` — Ahmed absent from GLEEM, present for CAMP_CAESAR |

English home no longer uses a branch-only roster as the discovery source; both languages share the same eligibility helpers. Full visual parity of sections remains Phase 1C.

---

## 9. Duplicate-key root cause and fix

**Cause:** `resolveCoreServices` / addon grouping could place the same service ID twice; categories and services could also collide numerically → React warning `key=11`.

**Fix:** Deduplicate primary/addon placement; namespace React keys (`primary-`, `other-`, `addon-`, …). Test: `BookingServiceSelectKeys.test.tsx`.

---

## 10. Tests added

- `resolveBookableBranches.test.ts` — Ahmed/Mahmoud/multi/none; steps; eligibility; display SoT; invalidation-oriented selectors
- `BranchContext.test.tsx` — GLEEM+Camp retained; invalid persistence cleared; valid Camp persists
- `BookingServiceSelectKeys.test.tsx` — no duplicate-key warning
- Contracts updated for resolver / effective branch usage
- Existing BarberFirst / Flow / I18n / overnight / dayOffset contracts retained

---

## 11. Full test results

```
npx vitest run
```

**Full suite:** 32 files / **173 passed** (`npx vitest run`).

Payload / overnight regressions:
- Plan/create shapes unchanged (contracts still assert `createBookingPlan` / `submitBookingFromPlan` / `dayOffset`).
- Phase 1A I18n tests still pass (EN chrome, RTL, language switch without closing).

---

## 12. Manual E2E results

| Flow | AR | EN |
|------|----|----|
| Ahmed barber-first → Camp → services | Pass (sidebar كامب شيزار) | Pass |
| Mahmoud barber-first → Gleem → services | Pass (جليم – سابا باشا) | Pass |
| Ziad multi-branch picker (no preferred) | Pass (Camp + Gleem; sidebar not-set) | Pass |
| Nearest → review; title stays nearest | Pass (أقرب موعد متاح) | Pass (Find the nearest available slot) |
| Language switch mid-flow | Pass — modal stays open, RTL/LTR updates, draft preserved | — |

Desktop modal + stepper verified in captures; mobile chrome not redesigned (existing responsive shell).

---

## 13. Screenshots

Saved under `docs/booking-redesign/phase-1b/screenshots/`:

- `ar-ahmed-camp-service.png`
- `en-ahmed-camp-service.png`
- `ar-mahmoud-gleem-service.png`
- `en-mahmoud-gleem-service.png`
- `ar-multi-branch-picker.png`
- `en-multi-branch-picker.png`
- `ar-nearest-review.png`
- `en-nearest-review.png`
- `language-switch-state-preserved.png`

---

## 14. Issues deferred to Phase 1C

- Final booking modal visual redesign (cards, calendar, time chips).
- Sidebar removal / rethink.
- Homepage AR/EN visual parity rebuild (rail still renders duplicate mobile/desktop lists in EN).
- Phone-first lookup + privacy policy changes.
- Full API client consolidation.
- Promote `lib/booking-api/state.ts` to live machine (replace `useBookingFlow`).
- Localized branch display names from API (many branch labels remain Arabic in EN UI).
- Hydration warning in `toast.tsx` (pre-existing Next overlay noise during E2E).

---

## 15. Plan / create payload confirmation

**Unchanged.** No edits to plan or create request builders beyond existing draft branch feeding the same `branchCode` field. Contracts continue to require `dayOffset` preservation and `submitBookingFromPlan` / `createBookingPlan` usage.

---

PHASE 1B BOOKING STATE AND BRANCH RESOLUTION COMPLETED

Camp Caesar public booking: Restored — API public list retained in BranchContext (no frontend exclusion)  
Ahmed barber-first: Auto-resolves to CAMP_CAESAR → service step  
Mahmoud barber-first: Auto-resolves to GLEEM → service step  
Multi-branch barbers: Preferred reused when valid; otherwise branch picker (Ziad verified)  
Branch source of truth: Booking draft via selectors; preferred is browse-only seed  
Stale sidebar branch: Fixed — unresolved barber-first shows localized not-set  
Entry mode stability: Nearest title/method preserved; session remount prevents mode bleed  
Dynamic steps: Shared `getBookingSteps` for desktop + mobile steppers  
Back state preservation: Back does not clear; upstream change clears dependents  
Language switch without modal unmount: Shared BookingController host — verified  
Arabic/English barber eligibility: Shared discovery/roster helpers; Ahmed Camp-eligible globally  
Duplicate React key: Fixed (dedupe + namespaced keys) + test  
Tests: 173 passed (full suite)  
Plan/create payload changed: No  
Remaining issues: EN duplicate rail DOM; API branch names often Arabic in EN  
Deferred to Phase 1C: Visual redesign, sidebar removal, phone-first, state.ts migration, homepage rebuild  
