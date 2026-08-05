# Arabic vs English Visual Comparison

## Architecture difference (confirmed)

`HomePageClient` swaps entire trees:

| Language | Component | Design language |
|----------|-----------|-----------------|
| Arabic | `ArabicHome` composed of HeroSection, NearestAvailability, BarbersSection, … | Dark gold/burgundy cards, Arabic UI fonts, carousels |
| English | `EnglishHome` monolithic editorial layout | Serif display (`font-editorial`), cream sections, magazine-style |

They do **not** share the same section components for hero/barbers/services/groom/standard/steps/branches/footer.

## Section-by-section

| Section | AR component | EN component | Same component? | Layout | Background | Typography | Cards | CTA | Notes |
|---------|--------------|--------------|-----------------|--------|------------|------------|-------|-----|-------|
| Navbar | MainNav | MainNav | Yes | RTL vs LTR | dark | shared | — | Book | Language toggle in menu |
| Hero | HeroSection | EnglishHome hero | **No** | Full-bleed photo AR; geometric EN | dark | AR heading vs editorial EN | Feature chips AR | Book + nearest | Feel like different products |
| Nearest-slot CTA | NearestAvailability + hero | Hero buttons + barbers CTA | **No** | Card vs text buttons | — | — | AR card-heavy | Yes | |
| Barbers | BarbersSection global list | EnglishBarbersRail branch list | **No** | Embla cards | dark gold cards | smaller AR titles | Yes heavy cards | احجز مع / View Times | Ahmed on AR only (global) |
| Services | HomePricesLink teaser | Service edit grid | **No** | — | EN cream | editorial | EN bordered panels | Explore | |
| Groom | via prices / limited home | Dedicated groom section | **No** | — | burgundy gradient EN | editorial | — | Explore packages | |
| Why CUT / Benefits | BenefitsSection | The CUT Standard list | **No** | grid cards vs divide-y rows | dark | — | AR cards | — | |
| Booking steps | HowItWorksSection | How booking works | **No** | 3 cards | dark | — | — | — | |
| Branches | Footer-ish AR | Dedicated ivory branches | **No** | — | EN ivory | — | bordered | Book at branch | EN only shows filtered public branches (GLEEM) |
| Final CTA | BookingCTA | burgundy band | **No** | — | — | — | — | Book | |
| Footer | FooterSection | inline EN footer | **No** | — | black | — | — | — | |

## Arabic-specific observations

- Separate layout + heavier black/gold card treatment
- Smaller meta typography (`cut-ar-meta`, `text-xs`)
- Different section order (nearest block before barbers; EN editorial sequence)
- Functionality differs: global barbers vs branch-gated barbers; AR custom events for groom/nearest

## Screenshots

- `screenshots/ar-home-desktop-hero.png`
- EN captures from session (hero/services) + `en-home-opens-arabic-modal-ziad.png` for modal mismatch

## Do not redesign yet

Document only — Phase 1/2 should decide whether EN becomes the visual system of record for both languages with shared sections + i18n.
