# Current Booking Flow Map

## Entry modes

| Entry | Source | `entryMode` | `initialMode` | Starts at |
|-------|--------|-------------|---------------|-----------|
| Barber card (AR) | `BarbersSection.openBarberFirst` | `barber_first` | `specific` | branch (or auto service) |
| Barber chip (Hero) | `cut:book-barber` → name match | `barber_first` | `specific` | branch |
| EN View Times | `EnglishHome.openBooking(..., "specific")` | `barber_first` | `specific` | branch |
| Nearest CTA | `cut:book-nearest` / EN Find Nearest | `branch_first` | `nearest` | branch |
| Branch Book at This Branch | EN branches | `branch_first` | `nearest` | branch (branch preselected) |
| Groom | `cut:book-groom` + service preselect | `branch_first` | `nearest` | may jump to date after services |
| BookingCTA / Nav Book | scroll `#barbers` / `#english-barbers` | — | — | no modal |

## UI step machine

```
branch → [mode?] → service → date → time → details → review → success
                      ↘ slots (legacy cross-branch panel; goToSlotsStep currently lands on "date")
```

`mode` is skipped when `initialMode` is set or `entryMode === "barber_first"`.

## Mermaid — nearest-slot (branch_first)

```mermaid
flowchart TD
  A[CTA: nearest / Find nearest] --> B[BookingModal open]
  B --> C[entryMode=branch_first mode=nearest]
  C --> D{hasConfirmedBranch?}
  D -->|no| E[Step: branch]
  E --> F[selectBranch via BranchContext]
  F --> G[Step: service]
  D -->|yes| G
  G --> H[select services]
  H --> I[Step: date available-days]
  I --> J[Step: time available-slots]
  J --> K[Step: details phone lookup]
  K --> L[plan]
  L --> M[review]
  M --> N[create]
  N --> O[success]
```

## Mermaid — barber-first

```mermaid
flowchart TD
  A[Barber card / View Times] --> B[BookingModal open]
  B --> C[entryMode=barber_first mode=specific]
  C --> D[GET barber profile branches+serviceIds]
  D --> E[allowedBranches = publicBranches ∩ profile.branches]
  E --> F{allowedBranches.length}
  F -->|0| G[Error: لا توجد فروع عامة متاحة لهذا الحلاق]
  F -->|1| H[Auto selectBranch + step service]
  F -->|gt 1| I[Step: branch picker]
  I --> H
  H --> J[Services filtered by profile serviceIds]
  J --> K[date → time → details → plan → review → create → success]
  G -.->|sidebar still may show| L[selectedBranch from BranchContext e.g. GLEEM]
```

## Mermaid — branch-first without initialMode

```mermaid
flowchart TD
  A[General open without initialMode] --> B[Step: branch]
  B --> C[Step: mode]
  C --> D{nearest or specific}
  D -->|nearest| E[placeholder barber]
  D -->|specific| F[pick barber from branch roster]
  E --> G[service → date → time → details → review → success]
  F --> G
```

## Observed live results (2026-08-05)

| Flow | Result |
|------|--------|
| Ahmed barber-first | Stuck on branch with empty public branches; sidebar shows جليم – سابا باشا |
| Mahmoud barber-first | Auto-resolves GLEEM → service step |
| EN View Times (Ziad) | English page + Arabic modal (`احجز مع Ziad`) + dual Close |

## Screenshots

- `screenshots/ar-booking-ahmed-no-public-branches.png`
- `screenshots/ar-booking-mahmoud-service-auto-gleem.png`
- `screenshots/en-home-opens-arabic-modal-ziad.png`
- Prior step captures: `ar-booking-step-*.png`, `mahmoud-step-*.png`
