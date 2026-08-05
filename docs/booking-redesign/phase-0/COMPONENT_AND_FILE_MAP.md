# Component and File Map

## Public homepage trees

```
HomePageClient
├─ lang === "en" → EnglishHome (separate tree)
└─ else → ArabicHome
     ├─ HeroSection
     ├─ NearestAvailability
     ├─ BarbersSection  ← hosts BookingModal (AR)
     ├─ HomePricesLink
     ├─ BookingCTA
     ├─ BenefitsSection
     ├─ HowItWorksSection
     └─ FooterSection
```

English home hosts its own `BookingModal` instance (`EnglishHome.tsx` ~105).

## Booking modal dependency map

| Parent | Child | Key props | Local state | Context / global | API |
|--------|-------|-----------|-------------|------------------|-----|
| `BarbersSection` / `EnglishHome` | `BookingModal` | `open`, `barber`, `initialMode`, `entryMode`, service preselect | selectedBarber, mode, entryMode | BranchContext, LanguageContext (page only) | status/barbers via legacy or booking-api |
| `BookingModal` | `BookingStepHeader` | steps, currentStep, barberName, onClose | — | — | — |
| `BookingModal` | `BookingInfoPanel` | barber, date, time, service, price, duration, mode, branch | — | — | — |
| `BookingModal` | `BranchPicker` | allowedBranches, selected, onSelect | — | **uses LanguageContext** | — |
| `BookingModal` | `BookingServiceSelect` | services, selectedIds, handlers | — | — | — |
| `BookingModal` | `BookingCalendar` | days, selectedDate | — | — | — |
| `BookingModal` | `BookingTimeSlots` | slots, selected, overnight split | — | — | — |
| `BookingModal` | `CrossBranchSlotsPanel` | cross slots (legacy path) | — | — | — |
| `BookingModal` | `useBookingFlow` | open, branchCode, entryMode, initial* | **all flow state** | — | booking-api/* |
| `BookingModal` | fetch `/api/client/lookup` | phone digits | lookupStatus, lookedUpName | clientStorage | Next route → MSSQL |

## Hardcoded language / direction

| File | Hardcoded |
|------|-----------|
| `BookingModal.tsx` | `dir="rtl"` on DialogContent (~1381) and nearly every step panel; Arabic step labels (~116–124); Arabic copy throughout |
| `BookingStepHeader.tsx` | Arabic title `احجز مع {name}`; aria `إغلاق` |
| `BookingInfoPanel.tsx` | `dir="rtl"`; Arabic labels |
| `BookingTimeSlots.tsx` | `dir="rtl"`; Arabic periods; English debug `(dayOffset=1)` |
| `BookingServiceSelect.tsx` | Arabic-heavy (verify in Phase 1 i18n wiring) |
| `BarbersSection.tsx` | Embla `direction: "rtl"`; Arabic strings |
| `EnglishHome.tsx` | `lang="en" dir="ltr"` on `<main>`; English copy; opens same Arabic modal |
| `dialog.tsx` | Default Close sr-only `"Close"`; absolute `right-4 top-4` |

## File inventory (booking-critical)

### Modal / flow
- `src/components/BookingModal.tsx`
- `src/hooks/useBookingFlow.ts`
- `src/lib/booking-api/state.ts` (**unused by UI**)
- `src/components/BookingStepHeader.tsx`
- `src/components/BookingInfoPanel.tsx`
- `src/components/BookingServiceSelect.tsx`
- `src/components/BookingCalendar.tsx`
- `src/components/BookingTimeSlots.tsx`
- `src/components/BranchPicker.tsx`
- `src/components/CrossBranchSlotsPanel.tsx`
- `src/components/ui/dialog.tsx`

### API
- `src/lib/booking-api/{client,branches,barbers,services,availability,booking,types,errors,...}.ts`
- `src/lib/publicBookingApi.ts` (legacy; EN home + AR status gate)
- `src/app/api/client/lookup/route.ts`

### i18n / language
- `src/context/LanguageContext.tsx`
- `src/lib/i18n/types.ts`
- `src/lib/i18n/navigation.ts` (nav labels only — **no booking namespace**)

### Home
- `src/components/HomePageClient.tsx`
- `src/components/english-home/EnglishHome.tsx`
- `src/components/english-home/EnglishBarbersRail.tsx`
- `src/components/BarbersSection.tsx`
- `src/components/HeroSection.tsx`
- `src/components/NearestAvailability.tsx`
- `src/components/MainNav.tsx`
- `src/context/BranchContext.tsx`

## Translation system status

- **No i18n framework** (no next-intl / react-i18next / JSON locale files for booking).
- Language is a boolean-ish `ar | en` in `LanguageContext` + `localStorage` key `cut-salon-lang`.
- Booking modal is **not connected** to locale.
- Changing page language while modal is open would not re-localize modal strings (modal ignores lang).
