# Phase 1A — Booking Modal Foundation

**Date:** 2026-08-05  
**Scope:** Language-aware, direction-aware, navigable, accessible booking modal foundation.  
**Non-goals:** Visual redesign of cards/calendar/time/homepage; Camp/Ahmed policy; API/payload/lookup/state architecture changes.

Source of truth: Phase 0 audits (`LOCALIZATION_AUDIT.md`, `COMPONENT_AND_FILE_MAP.md`, `UI_ACCESSIBILITY_AUDIT.md`, `CONFIRMED_ISSUES.md`, `PHASE_1_INPUTS.md`).

---

## Files changed

### New
| File | Role |
|------|------|
| `src/lib/i18n/booking.ts` | Typed AR/EN booking translation catalog + `translateBooking` |
| `src/lib/i18n/booking-format.ts` | Locale-aware date/time/price/duration/number formatters |
| `src/hooks/useBookingTranslations.ts` | `{ lang, dir, t, format }` from `LanguageContext` |
| `src/components/BookingNavFooter.tsx` | Shared Back / Continue footer (RTL-aware arrows) |
| `src/components/__tests__/BookingModalI18n.test.tsx` | EN chrome, overnight copy, language-switch-without-reset |
| `docs/booking-redesign/phase-1a/screenshots/*` | AR/EN service, time, review captures |
| `docs/booking-redesign/phase-1a/PHASE_1A_IMPLEMENTATION_REPORT.md` | This report |

### Updated
| File | Change |
|------|--------|
| `src/components/ui/dialog.tsx` | Optional `hideDefaultClose`; logical `end` placement |
| `src/components/BookingModal.tsx` | `lang`/`dir` from context; single close; fixed `onOpenChange`; localized steps/copy; shared nav footer; error-code resolution |
| `src/components/BookingStepHeader.tsx` | Localized close + stepper a11y; no hardcoded RTL |
| `src/components/BookingInfoPanel.tsx` | Catalog + formatters; readable sidebar tokens |
| `src/components/BookingServiceSelect.tsx` | Localized chrome/badges/categories; logical spacing |
| `src/components/BookingCalendar.tsx` | Localized labels; locale month/weekday |
| `src/components/BookingTimeSlots.tsx` | Localized periods/slots; overnight customer copy |
| `src/components/BranchPicker.tsx` | Localized branch UI; logical direction |
| `src/components/CrossBranchSlotsPanel.tsx` | Localized panel + overnight badge |
| `src/hooks/useBookingFlow.ts` | Language-neutral error **codes** (UI translates) |
| `src/lib/booking-api/errors.ts` | `getLocalizedBookingErrorMessage` |
| `src/lib/booking-api/index.ts` | Export localized error helper |
| `src/app/globals.css` | Temporary `--booking-*` accessible color tokens |
| Booking modal tests (BarberFirst / Flow / Contracts) | Expect codes + overnight keys |

---

## Translation catalog structure

```
src/lib/i18n/booking.ts → bookingCatalog
  steps | actions | header | branch | mode | service
  date | time | overnight | details | review | success
  infoPanel | loading | empty | a11y | validation | errors
```

Flattened dotted keys via `bookingMessages` / `translateBooking(lang, key, params?)`.  
Hook: `useBookingTranslations()` → `{ lang, dir, t, format }`.  
Locale source: existing `LanguageContext` (no external i18n framework).

### Key namespaces / examples
- `steps.*` — الفرع / Branch … المراجعة / Review  
- `actions.*` — رجوع / Back, متابعة / Continue, …  
- `header.closeAria` — إغلاق نافذة الحجز / Close booking dialog  
- `overnight.afterMidnight` + `overnight.explanation` — customer-safe overnight copy  
- `errors.*` — maps flow codes (`barberIdMissing`, `planPrepareFailed`, …)

---

## Hardcoded strings removed

Customer-facing AR/EN literals removed from:
`BookingModal`, `BookingStepHeader`, `BookingInfoPanel`, `BookingServiceSelect`, `BookingCalendar`, `BookingTimeSlots`, `BranchPicker`, `CrossBranchSlotsPanel`, and flow error surfaces in `useBookingFlow` (codes only).

**Still bilingual by design (catalog/API data, not chrome):**
- Service display names may show both AR primary + EN secondary (and reverse) from catalog fields.
- Branch names often remain Arabic from API (`جليم – سابا باشا`).

---

## Hardcoded RTL removed

- Booking modal shell uses `dir={dir}` / `lang={lang}` from context.
- Hardcoded `dir="rtl"` removed from booking modal child components listed above.
- Physical utilities replaced with logical where touched (`text-start`/`ms`/`ps`/`end`, etc.).
- Back arrows flip with `dir` (`BookingNavFooter`).

Note: `BookingLookupPanel` (management, out of 1A modal scope) still has `dir="rtl"`.

---

## Accessibility fixes

- One visible close control (`hideDefaultClose` + header close with localized `aria-label`, ≥44×44, focus ring, logical end).
- `DialogTitle` + `DialogDescription` localized.
- Escape still closes; Radix focus trap retained; focus return to opener preserved by Dialog.
- Stepper: localized completed/current labels; readable contrast (no `text-white/40` / `opacity-35` on essential step labels).
- Overnight UI has no `dayOffset` / operational jargon in customer copy.
- Loading/planning copy from catalog; disabled actions use real `disabled`.

---

## Navigation fixes

- `onOpenChange={(next) => { if (!next) handleClose(); }}` — open never triggers close/reset.
- Mode step and later steps use `BookingNavFooter` Back (mode Back was confirmed missing in Phase 0).
- Back preserves selections; does not redesign full footer chrome beyond consistent Back/Continue.

---

## Date / time / price formatting

Via `booking-format.ts` + `Intl`:

| | Arabic | English |
|--|--------|---------|
| Date | الخميس، ٦ أغسطس ٢٠٢٦ | Thursday, August 6, 2026 |
| Time | ١٢:٠٠ مساءً | 12:00 PM |
| Price | ٢٠٠ جنيه | EGP 200 |
| Duration | ٣٠ دقيقة | 30 minutes |

`dayOffset` remains on API payloads unchanged.

---

## Tests added / results

**Added:** `BookingModalI18n.test.tsx`
1. English chrome + `dir="ltr"` / `lang="en"`
2. Overnight copy without `dayOffset` jargon
3. Language switch AR↔EN while modal open (parent mounted) — text + dir update, no close

**Updated:** BarberFirst / Flow / Contracts for error codes + overnight keys.

**Result (2026-08-05):**
```
4 files / 40 tests passed
(BookingModalI18n 3, BarberFirst 6, Flow 19, Contracts 12)
```

---

## Screenshots

Under `docs/booking-redesign/phase-1a/screenshots/`:

| File | Content |
|------|---------|
| `ar-service-step.png` | Arabic service step, RTL |
| `en-service-step.png` | English service step, LTR |
| `ar-time-step.png` | Arabic time step (`١٢:٠٠ مساءً`) |
| `en-time-step.png` | English time step (`12:00 PM`) |
| `ar-review-step.png` | Arabic review |
| `en-review-step.png` | English review |

---

## Remaining issues deferred to Phase 1B

- Camp Caesar / Ahmed `allowedBranches` policy and sidebar branch SoT disagreement.
- Full visual redesign (service cards, calendar, time UI, sidebar removal/rethink).
- Homepage AR/EN parity (switching language remounts different home trees and can unmount an open modal — modal itself is language-safe when parent stays mounted; verified in unit test).
- Catalog content localization for long Arabic service blurbs when UI is English.
- Deeper contrast pass / final stepper redesign.
- Customer lookup UX polish (error vs new customer).
- Duplicate React key warning in `BookingServiceSelect` (`key=11`) during tests.
- Booking management surfaces (`BookingLookupPanel`) still hardcoded RTL.

---

## PHASE 1A BOOKING FOUNDATION COMPLETED

Arabic localization: **Done** (catalog + live modal chrome/steps/actions/errors)  
English localization: **Done** (same; EN no longer forced into Arabic modal)  
RTL/LTR: **Done** (`lang`/`dir` from `LanguageContext`; hardcoded booking `dir="rtl"` removed)  
Language switch while modal open: **Done in modal** (unit test); live homepage remount caveat deferred  
Duplicate close: **Fixed** (`hideDefaultClose` + single header close)  
Back navigation: **Fixed** (mode + later steps via `BookingNavFooter`)  
Date/time formatting: **Done** (locale-aware formatters)  
Overnight customer copy: **Done** (no dayOffset jargon; API dayOffset unchanged)  
Accessibility: **Foundation done** (title/description, single close, focus/escape, readable tokens)  
Tests: **40 passed** (focused booking suite)  
API behavior changed: **No**  
Deferred to Phase 1B: Camp/Ahmed policy, homepage remount/parity, visual redesign, catalog blurb EN, lookup UX, key warning
