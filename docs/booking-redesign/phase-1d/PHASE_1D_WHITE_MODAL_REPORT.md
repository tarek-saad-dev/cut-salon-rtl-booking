# Phase 1D — White Booking Modal Visual System

**Date:** 2026-08-06  
**Scope:** Booking modal chrome, time/review/success surfaces, sidebar, scroll  
**Non-goals:** Plan/create contracts, availability logic, branch resolution, caching, customer data

---

## Dark surfaces removed

| Before | After |
|--------|--------|
| `BookingStepHeader` `bg-[#0a0a0a]` | White `--booking-bg` |
| `BookingInfoPanel` black sidebar tokens | White sidebar tokens |
| Mobile barber strip `bg-cut-black` / ivory text | White strip + dark text |
| Time step wrapper / banner `bg-[#0a0a0a]` / `bg-black` | White surfaces + branch badges |
| `BookingTimeSlots` `#111` / `#171717` pills | White outlined chips + selected outline/check |
| Success black banner + black summary card | Soft success icon + white cards |
| Multi-branch earliest / filter black fills | Soft gold tint + dark outline selection |

Page overlay behind the dialog remains dark (`Dialog` overlay).

---

## New booking surface tokens

Defined in `src/app/globals.css` (Phase 1D):

| Token | Value | Role |
|-------|-------|------|
| `--booking-bg` | `#ffffff` | Modal surfaces |
| `--booking-surface` | `#f8f6f1` | Soft fill / hover base |
| `--booking-surface-hover` | `#f3f0ea` | Hover |
| `--booking-text` | `#111111` | Primary text |
| `--booking-text-secondary` | `#5f5a53` | Labels |
| `--booking-text-muted` | `#746f67` | Muted |
| `--booking-border` | `#d8d3ca` | Strong border |
| `--booking-border-subtle` | `#e5e1d9` | Dividers |
| `--booking-accent` | `#9a7414` | Accessible dark gold |
| `--booking-accent-soft` | `#f7f1e0` | Soft gold tint |
| `--booking-success` / `-soft` | green family | Success icon |
| `--booking-sidebar-*` | white / dark text | Sidebar (no longer inverted) |
| `--booking-slot-selected-outline` | `#111111` | Selection outline |

Utility classes: `.booking-slot-default`, `.booking-slot-selected`, `.booking-slot-disabled`.

---

## Time step

- White page + white cards
- Default chips: white + neutral border + black time
- Selected: dark outline + check + soft gold tint (no black/gold fill)
- Earliest card: white + gold outline + lightning icon
- All-branches: branch soft tint + label; selection is separate outline
- After-midnight: white + neutral divider + customer-safe copy

---

## Review

- New `BookingReviewStep` — one white outlined card
- Rows: Branch / Barber / Service / Appointment / Customer + totals
- Per-row Edit actions preserve selections via `setStep`
- Sidebar density `identity` on review (no duplicated details)
- Primary: Confirm booking · Secondary: Edit selections

---

## Success

- New `BookingSuccessStep` — white layout
- Soft success icon, black headline, secondary subtitle
- Outlined selectable booking code + Copy with live “Copied” toast
- Concise appointment summary (date, time, branch badge, with barber)
- View booking details + Done
- Stepper `allCompleted` so Review is not left as active
- Sidebar identity-only; no second dark summary

---

## Sidebar

- White surface, thin logical border
- Compact live summary during booking steps
- Identity-only on review/success
- Mobile: desktop sidebar hidden (`hidden md:block`); expandable chip strip + white identity bar

---

## Scroll

- Header fixed in shell
- Single main content scroll (`overflow-y-auto` on content column)
- Sticky `BookingNavFooter` within steps
- Sidebar does not independently scroll on review/success
- Removed nested max-height dual-scroll shell

---

## Branch identity

Unchanged frontend tokens (`branch-visuals` + `branchTheme` badges):

- GLEEM burgundy soft tint + label
- CAMP_CAESAR bronze/gold soft tint + label
- Selection outline separate from branch color
- Never full-modal branch background

---

## Accessibility

- Body text uses `#111` / `#5F5A53` on white (≥ AA)
- Gold reserved for accents/CTAs (`#9a7414`), not small body text on white
- Selected slots: outline + check (not color alone)
- Branch: label + color
- Success: `role="status"` + `aria-live="polite"`
- Copy: accessible label + live toast

---

## Tests

- `Phase1DWhiteModal.test.tsx` — shell/header/time/review/success/sidebar/copy
- `phase1dCopy.test.ts` — AR/EN strings
- Contract suites updated for extracted Review/Success components
- Full suite: **220 tests** (see local `vitest run`)

---

## Screenshots

Capture under `docs/booking-redesign/phase-1d/screenshots/` (gitignored):

- `ar-time-white.png` / `en-time-white.png`
- `ar-all-branches-time-white.png`
- `ar-review-white.png` / `en-review-white.png`
- `ar-success-white.png` / `en-success-white.png`
- `ar-success-mobile.png` / `en-time-mobile.png`

---

## Remaining redesign work

- Unify `branchTheme` vs `branch-visuals` accent families
- Optional denser calendar polish under same tokens
- Marketing pages outside booking modal remain dark by design
- Screenshot capture checklist for QA sign-off

---

## PHASE 1D WHITE BOOKING MODAL COMPLETED

Modal shell: White backgrounds, neutral borders, dark text, gold accent only  
Header and stepper: White; gold outline/active; checks on completed; success all-completed  
Sidebar: White; compact during steps; identity-only on review/success; hidden on mobile  
Time step: White slots; outline/check selection; soft branch identity  
Review: One white summary card; Edit per section; no sidebar duplication  
Success: White confirmation; code copy feedback; concise summary; no black cards  
Nested scrolling: Single content scroll; sticky footer; no dual scrollbars  
Branch identity: Labels + soft tints preserved  
Arabic/English: Shared components + i18n keys  
Mobile: No desktop sidebar; white identity bar + compact summary strip  
Tests: Phase 1D suite + updated contracts; existing booking coverage retained  
API behavior changed: No  
Plan/create changed: No  
Remaining UX work: Branch token unification; QA screenshots; optional calendar polish  
