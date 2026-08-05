# Phase 1 Inputs

Exact technical inputs required before redesign.

## 1. Product decisions (blockers)

1. **Camp Caesar public policy**
   - Allow Camp in public booking pickers, **or**
   - Exclude Camp-only barbers from public global list, **or**
   - Assign Camp-only barbers to a public branch (data change — out of Phase 0).
2. **Visual system of record:** English editorial vs Arabic card system vs hybrid shared sections.
3. **Modal language:** Must follow `LanguageContext` (confirmed requirement from ISSUE-001).

## 2. Localization wiring contract

- Add booking message catalog (AR/EN) covering all modal strings + errors + a11y.
- Pass `lang`/`dir` into `BookingModal` (or read `useLanguage` inside).
- Remove hardcoded `dir="rtl"` from DialogContent; derive from locale.
- Localize dates/times/numbers with locale-aware formatters.
- Replace overnight jargon with customer-safe copy (no `dayOffset` in UI).

## 3. Branch resolution contract (barber-first)

Single function, e.g. `resolvePublicBranchesForBarber(profileBranches, publicBranches, policy)`:
- Document Camp handling.
- `allowedBranches` is the **only** branch source for sidebar when in barber-first branch step.
- Clear or hide `selectedBranch` when not in `allowedBranches` (fixes Ahmed sidebar disagreement).

## 4. Close / navigation contract

- `DialogContent` must support `hideClose` (or BookingModal uses primitive without default Close).
- One close control only.
- Every step except first has Back; mode step must render Back.
- Fix `onOpenChange` to respect `open === false` only.

## 5. State ownership

- Choose: extend `useBookingFlow` **or** adopt `state.ts` transitions — not both.
- Explicit fields: entryMode, branch, barber, services, date, slot, dayOffset, customer, step, mutation.
- Derive price/duration; do not duplicate sidebar state.

## 6. API client consolidation

- Point EN status/barbers gate at `booking-api` (drop legacy for booking UI path).
- Keep endpoint map from `API_DEPENDENCY_MAP.md` as regression checklist.

## 7. Customer lookup

- Distinguish API error vs new customer.
- Abort in-flight lookup on phone change.
- Document supported phone formats (+20, 0020, spaces).
- Decide whether name remains editable after found.

## 8. Accessibility baseline

- Contrast tokens meeting WCAG AA 4.5:1 for body/labels.
- Min 13px body text; touch targets ≥44px where primary.
- Focus rings; single dialog title language-aware.
- Keyboard pass checklist from `UI_ACCESSIBILITY_AUDIT.md`.

## 9. Overnight verification kit

When overnight slots exist:
- Fixture or live branch with dayOffset=1 inventory.
- Assert plan/create payload dayOffset.
- Assert review/confirmation labels without technical terms.

## 10. Test matrix for Phase 1 exit

| Case | AR | EN | Mobile |
|----------|----|--------|
| Nearest | ✓ | ✓ | ✓ |
| Barber-first Mahmoud | ✓ | ✓ | ✓ |
| Barber-first Ahmed (per policy) | ✓ | ✓ | ✓ |
| Branch-first mode+back | ✓ | ✓ | ✓ |
| Details lookup found/new/error | ✓ | ✓ | ✓ |
| Overnight (if available) | ✓ | ✓ | ✓ |

## 11. Out of scope for Phase 1

- Full visual redesign of homepage sections (Phase 2).
- Backend booking rule changes unless required by Camp policy.
- Loyalty / prices redesign.

## 12. Artifact dependencies

Consume Phase 0 docs as-is:
- Flow/state/API maps
- Issue register ISSUE-001…013
- Evidence JSON + screenshots as visual baseline
