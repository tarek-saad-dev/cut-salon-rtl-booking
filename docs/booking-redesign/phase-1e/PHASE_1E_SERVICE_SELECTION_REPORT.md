# Phase 1E — Premium Service Selection

**Date:** 2026-08-06  
**Scope:** Service discovery/selection UI only  
**Non-goals:** Plan/create payloads, pricing rules, barber-service compatibility logic, full modal redesign

---

## Files changed

| Area | Path |
|------|------|
| Types | `src/lib/booking-api/types.ts` — optional image/description/metadata fields |
| API normalize | `src/lib/booking-api/services.ts` — pass through `imageUrl` / `photoUrl` / descriptions |
| Presentation | `src/lib/booking/service-presentation.ts` |
| Visuals | `src/lib/booking/service-visuals.ts` |
| Step UI | `src/components/booking-services/*` |
| Compat export | `src/components/BookingServiceSelect.tsx` → re-exports `BookingServiceStep` |
| i18n | `src/lib/i18n/booking.ts` — filters, selected label, empty/error, badges |
| Modal wire | `src/components/BookingModal.tsx` — `isError` when catalog fails with empty list |

---

## New service components

- `BookingServiceStep` — orchestrator (filters, featured, compact, add-ons, summary)
- `BookingFeaturedServiceCard` — image + benefit copy + radio selection
- `BookingCompactServiceCard` — icon row cards
- `BookingServiceImage` — next/image + icon fallback
- `BookingServiceFilters` — category chips
- `BookingSelectedServicesSummary` — sticky count · duration · price

---

## Featured-service resolver

`resolveFeaturedServices()` scores by:

- explicit `isFeatured` / `isMostRequested` / `displayPriority`
- curated name matches (Hair Cut, Beard, Haircut & Beard)
- package detection

Featured render first in a 1→2 column grid. Not every service is featured.

---

## Image resolver

`getServiceVisual()` priority:

1. Valid API `imageUrl` / `photoUrl` (Casher CDN)
2. Optional local `visualKey` / category asset path
3. Premium icon fallback container (no layout shift)

Does not block the list while images load. `onError` swaps to icon fallback.

---

## Category / filter behavior

Chips: Most popular · All · Hair · Beard · Care · Packages  

- Only filters with matching services render  
- Default: Most popular when ≥3 featured, else All  
- Changing filter **does not** clear selection  
- Popular shows featured set; All shows full catalog + add-ons when a main is selected  

---

## Selection behavior

Unchanged authority in `BookingModal` / `useBookingFlow`:

- Core → `onCoreSelect` (exclusive core, keeps add-ons)
- Non-core / add-ons → `onToggleService` (multi, max 12)

Cards: outline + check + “Selected” label; `aria-pressed` / radio|checkbox roles; keyboard Space/Enter.

---

## Main / add-ons

- Main section: featured + compact under filters  
- Add-ons (“Complete your visit”) after a selection exists, on **All** filter  
- Uses existing `getRecommendedAddons`  

---

## Active-language content

`getServicePresentation(lang)`:

- AR/EN display name with safe fallbacks  
- Benefit-led one-line descriptions (not bilingual dual lines)  
- EN cards never show Arabic body copy  

---

## Loading / error

- Featured + compact skeletons (`aria-busy`)  
- Error ≠ empty: distinct copy + Retry when provided  
- Empty: barber/branch-specific message  

---

## Performance

- `next/image` with sizes for modal width  
- First featured image may use `priority`  
- Lazy default for the rest  
- API images preferred (already on Casher)

---

## Accessibility

- Meaningful image alt from localized name  
- Focus rings, 44px targets, ≥13px body / ≥16px titles  
- Selection not color-only  
- Filter `aria-pressed`  
- Summary `aria-live="polite"`  

---

## Tests

- `servicePresentation.test.ts`  
- `Phase1EServiceSelection.test.tsx`  
- Existing keys / i18n / booking suites retained  

---

## Screenshots

`docs/booking-redesign/phase-1e/screenshots/` (gitignored) — capture checklist in README.

---

## Recommended future API/admin fields

Already tolerated when present:

`imageUrl`, `shortDescriptionAr/En`, `isFeatured`, `isMostRequested`, `isPackage`, `badgeKey`, `displayPriority`, `visualKey`, `imageAltAr/En`

Admin can later edit benefit copy without shipping frontend map updates.

---

## Remaining booking-modal redesign work

- Persist service filter/scroll across Back (optional state lift)  
- Local fallback webp assets if CDN missing  
- Unify branch visual systems (Phase 1D leftover)  
- QA screenshot pack  

---

## PHASE 1E PREMIUM SERVICE SELECTION COMPLETED

Featured services: Scored resolver; image cards first  
Compact services: Secondary/add-on outlined cards  
Images: API `imageUrl`/`photoUrl` via centralized resolver + next/image  
Image fallback: Category icon container on miss/error  
Category filters: Popular/All/Hair/Beard/Care/Packages (non-empty only)  
Active-language content: Single-locale name + benefit description  
Selection states: Outline + check + Selected label; core radio / addon checkbox  
Main services and add-ons: Existing exclusive-core rules; add-ons after selection  
Selected summary: Sticky count · duration · price  
Desktop: 2-col featured/compact grids  
Mobile: Single column; horizontal filter chips  
Accessibility: Keyboard, ARIA, contrast, alt text  
Tests: Phase 1E suite + full booking suite  
API changes: None (read-only field pass-through)  
Plan/create changes: No  
Remaining UX work: Filter/scroll persistence; QA screenshots; optional local assets  
