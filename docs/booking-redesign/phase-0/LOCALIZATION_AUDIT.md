# Localization Audit

## Translation system

| Item | Status |
|------|--------|
| Framework | None for booking |
| Site language | `LanguageContext` (`ar`/`en`), `localStorage` `cut-salon-lang`, sets `documentElement.lang/dir` |
| Nav labels | `src/lib/i18n/navigation.ts` |
| Booking namespaces | **Missing** |
| Modal connected to locale? | **No** — does not import `useLanguage` |
| Open modal updates on language change? | **No** (ignores lang entirely) |

## Confirmed bug: English site → Arabic RTL modal

**Repro**
1. Set language to English (`localStorage cut-salon-lang=en`).
2. Open homepage; confirm English hero (“Define the CUT”).
3. Click **View Times** on a barber (e.g. Ziad).

**Expected:** English LTR modal matching site language.  
**Actual:** Modal title `احجز مع Ziad`, Arabic stepper, `dir="rtl"`, dual Close (`إغلاق` + `Close`).

**Evidence:** `screenshots/en-home-opens-arabic-modal-ziad.png`, a11y snapshot 2026-08-05.

**Root cause (confirmed)**
1. `BookingModal.tsx` DialogContent forces `dir="rtl"` (~line 1381).
2. Step labels hardcoded Arabic (~116–124).
3. Hook/error strings Arabic.
4. `EnglishHome` mounts the same `BookingModal` without locale props.

## Hardcoded strings / direction inventory (booking + public)

### Hardcoded Arabic (examples)
- BookingModal steps, banners, details/review/success copy
- BookingStepHeader `احجز مع…`
- BookingInfoPanel labels
- BookingTimeSlots periods / overnight help
- useBookingFlow error messages
- BranchContext error `تعذر تحميل قائمة الفروع`
- BarbersSection card CTAs

### Hardcoded English
- `dialog.tsx` sr-only `Close`
- EnglishHome entire tree
- Phone placeholder `01xxxxxxxxx`
- Service `nameEn` secondary lines
- Overnight help fragment `(dayOffset=1)`

### Hardcoded dir / alignment
- Many `dir="rtl"` in BookingModal panels
- SelectedServicesBilingual: Arabic line `dir="rtl"`, English line `dir="ltr"`
- `text-right` / `text-left` in BookingTimeSlots featured card
- Dialog close absolute `right-4` (physical right — conflicts with RTL header close placement)
- Embla carousel `direction: "rtl"` in BarbersSection always

### Locale-insensitive formatting
- Dates in modal via `ar-EG` (`formatDateAr`) even on EN site
- Times via Arabic helpers (`formatBookingTimeAr`)
- Prices often Arabic `جنيه` in service cards inside modal

## Components partially locale-aware

| Component | Behavior |
|-----------|----------|
| `BranchPicker` | Uses `useLanguage` for empty-state copy + `dir` |
| `MainNav` | Localized |
| `PricesClient` | Localized |
| BookingModal error for empty allowedBranches | **Overrides** with hardcoded Arabic even when page is EN |

## Missing booking translation keys (conceptual namespaces for Phase 1)

`booking.steps.*`, `booking.branch.*`, `booking.mode.*`, `booking.service.*`, `booking.date.*`, `booking.time.*`, `booking.details.*`, `booking.review.*`, `booking.success.*`, `booking.errors.*`, `booking.a11y.*`, overnight customer-safe labels.

## Stale / split language state

- Page `lang` and modal language are independent.
- Barber display name may be EN (`Ziad`) while chrome is AR.
- EN home barber role uses English; modal sidebar Arabic labels remain.
