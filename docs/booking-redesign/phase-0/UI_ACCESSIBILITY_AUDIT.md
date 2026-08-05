# UI and Accessibility Audit

## Duplicate close buttons (confirmed)

| Control | Source | Label |
|---------|--------|-------|
| Header X | `BookingStepHeader.tsx` ~41–47 | `aria-label="إغلاق"` |
| Dialog default X | `ui/dialog.tsx` ~45–48 | sr-only `Close`; absolute `right-4 top-4` |

Live a11y tree shows both `إغلاق` and `Close` whenever modal is open.  
Screenshot: `ar-booking-ahmed-no-public-branches.png`, `en-home-opens-arabic-modal-ziad.png`.

## Back navigation

| Step | Back control |
|------|--------------|
| branch | None (first step) |
| mode | **Missing** — no Back button in mode case (~618–688) |
| service | `رجوع` present |
| date/time/details/review | Present (various labels) |
| Mobile summary chip | `تعديل` → handleBack when summary visible |

## Layout / scroll

| Issue | Evidence |
|-------|----------|
| Nested scroll | Modal max-h 92vh; content `overflow-y-auto`; service step nested overflow; screenshots show scrollbars on cream pane |
| Persistent sidebar | Desktop `BookingInfoPanel`; mobile bottom bar + optional summary strip — duplication by design |
| Theme split | Black header/sidebar + cream content — inconsistent with EN editorial home |
| Gold on cream | Service EN names `text-[#D4AF37]` on ivory — likely <4.5:1 |
| text-[10px]/[11px] | SelectedServicesBilingual compact; overnight hints; period meta |
| RTL icon placement | ArrowLeft used for “back” in RTL (may feel mirrored) |
| Dialog close physical-right | Conflicts with RTL header close on opposite side → two X |

## Contrast flags (estimated; flag for measurement in Phase 1)

| Element | Estimate | Flag |
|---------|----------|------|
| Main cream text on ivory | OK-ish dark | |
| Secondary `text-cut-black/50` | Likely fails AA | P1 |
| Stepper inactive `text-white/40` on black | Likely fails | P1 |
| Sidebar labels `text-cut-ivory/40` | Likely fails | P1 |
| Gold `#D4AF37` on cream | Likely fails AA for normal text | P1 |
| Gold on black | Often OK for large/bold; verify | |
| Placeholders / disabled متابعة | Low contrast | P2 |

## Keyboard / dialog a11y

| Check | Status |
|-------|--------|
| DialogTitle / Description | Present (VisuallyHidden Arabic) — not EN-aware |
| Escape to close | Radix default; `onOpenChange={handleClose}` ignores open boolean (always close path) |
| Focus trap | Radix Dialog — expected |
| Focus return | Needs runtime verification |
| Tab / Shift+Tab | Needs full pass |
| Visible focus | Mixed; custom buttons may lack strong ring |
| Disabled Continue | `disabled` on متابعة when no service — OK semantics |
| Dual close confusion | Confirmed |

## Mobile

- Bottom bar duplicates barber summary
- Keyboard overlap on details: needs device verification
- Touch targets: some pills/icons ~ compact; overnight pills OK-ish

## Screenshots for steps

AR: `ar-booking-step-{date,time,details,details-filled,review}.png`  
Mahmoud: `mahmoud-step-*.png`  
EN modal AR chrome: `en-home-opens-arabic-modal-ziad.png`
